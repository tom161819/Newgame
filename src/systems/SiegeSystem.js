import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { buildingHP,damageBuilding } from '../game/buildingHealth.js';
import { detachLostBuilding,removeBuildingShell } from '../game/buildingRemoval.js';
import { gridToWorld } from '../game/isometric.js';
import { isWalkable } from '../game/map.js';
import { isRanged } from './CombatSystem.js';

// Owner 18 Nov 2026 ("melee units can attack walls"; Test map: "switch to the enemy and build enemy walls and
// buildings"): a building can belong to the enemy (`building.enemy`, steel-blue tint, a closed Gate). Our melee soldiers
// sent at one (right click with soldiers selected) stand around it and hit it; its hit points go down by their attack,
// (at half strength: stone takes blows badly) and at zero it falls – the way opens. Archers do not shoot at stone.
export const ENEMY_TINT=0x9fb4ea;
// autoRadius: a melee soldier with no enemy soldier near him attacks an enemy building this close by himself.
export const SIEGE_RULES=Object.freeze({damageShare:.5,retarget:1200,giveUpAfter:4,autoRadius:4});
export const isEnemyBuilding=b=>!!b?.enemy;
export const siegeable=b=>isEnemyBuilding(b)&&buildingIsComplete(b)&&!!buildingHP(b);
export const canSiege=w=>!!w?.isAlive&&w.profession==='soldier'&&!w.crew&&!isRanged(w)&&(w.attackDPS??0)>0;
// Ground tiles touching the building (sides and corners) from which a melee soldier reaches it.
export function siegeTiles(map,building){
  const {x,y}=building,{width,height}=buildingDefinition(building),out=[];
  for(let gy=y-1;gy<=y+height;gy++)for(let gx=x-1;gx<=x+width;gx++){const inside=gx>=x&&gx<x+width&&gy>=y&&gy<y+height;if(!inside&&isWalkable(map,gx,gy))out.push({x:gx,y:gy});}
  return out;
}
export const touchesBuilding=(tile,building)=>{const {x,y}=building,{width,height}=buildingDefinition(building);const dx=Math.max(x-tile.x,0,tile.x-(x+width-1)),dy=Math.max(y-tile.y,0,tile.y-(y+height-1));return Math.max(dx,dy)===1;};
// A closed enemy Gate: nobody walks through it until it is broken.
export function closeEnemyGate(scene,building){if(!isEnemyBuilding(building)||!['gate','wall_gate'].includes(building.type))return;for(const tile of building.tiles??[])if(scene.map[tile.y]?.[tile.x]!=null)scene.map[tile.y][tile.x]=1;}
export function markEnemyBuilding(scene,building){building.enemy=true;closeEnemyGate(scene,building);scene.towerViews?.get(building.id)?.paint?.(building,ENEMY_TINT);}

export class SiegeSystem {
  constructor(scene){this.scene=scene;this.bars=new Map();}
  target(worker){const id=worker?.siegeTargetId;if(id==null)return null;const b=this.scene.buildings.find(x=>x.id===id);return siegeable(b)?b:null;}
  // The enemy building under the pointer (its picture or one of its tiles).
  at(x,y,tile){
    const s=this.scene,list=s.buildings.filter(siegeable);if(!list.length)return null;
    return list.find(b=>s.towerViews?.get(b.id)?.contains?.(x,y))??(tile?list.find(b=>b.tiles?.some(p=>p.x===tile.x&&p.y===tile.y)):null)??null;
  }
  // Each melee soldier gets his own place around the building where there is one; returns how many go.
  // The nearest enemy building within `radius` tiles of the soldier (measured to its footprint).
  near(worker,radius=SIEGE_RULES.autoRadius){
    let best=null,d=Infinity;for(const b of this.scene.buildings){if(!siegeable(b))continue;const {width,height}=buildingDefinition(b),dx=Math.max(b.x-worker.tile.x,0,worker.tile.x-(b.x+width-1)),dy=Math.max(b.y-worker.tile.y,0,worker.tile.y-(b.y+height-1)),e=Math.max(dx,dy);if(e<=radius&&e<d){d=e;best=b;}}
    return best;
  }
  order(soldiers,building){
    // Catapult crews take the building as their target too (SiegeEngines shoots it from range).
    const engines=soldiers.filter(w=>w?.crew&&this.scene.military?.unit?.(w)?.type==='catapult'&&w.isAlive);
    for(const w of engines){this.scene.workerSystem.commands?.resume?.(w);w.siegeTargetId=building.id;}
    const s=this.scene,melee=soldiers.filter(canSiege);if(!siegeable(building)||!melee.length)return engines.length;
    const spots=siegeTiles(s.map,building),used=new Set();
    for(const w of melee){
      s.workerSystem.commands?.resume?.(w);s.military?.wallPatrol?.set?.(w,false);s.combat?.stopAttack?.(w);delete w.huntWolfId;delete w.attackArea;delete w.attackRadius;
      const sorted=[...spots].sort((a,b)=>Math.hypot(a.x-w.tile.x,a.y-w.tile.y)-Math.hypot(b.x-w.tile.x,b.y-w.tile.y)),free=sorted.find(p=>!used.has(`${p.x},${p.y}`));if(free)used.add(`${free.x},${free.y}`);
      w.siegeTargetId=building.id;w.siegeSpot=free??null;w.siegeRetarget=0;w.siegeMisses=0;
    }
    return melee.length+engines.length;
  }
  stop(worker){delete worker.siegeTargetId;delete worker.siegeSpot;delete worker.siegeMisses;worker.siegeHit=null;}
  // Called by the soldier's behaviour when no enemy unit needs him; true when the siege took over this frame.
  update(worker,delta){
    // Owner 18 Nov 2026: with no enemy soldier around (the caller found none), a melee soldier near an enemy building
    // attacks it by himself; a soldier told to hold his ground does not.
    if(worker.siegeTargetId==null){if(worker.stance==='hold'||!canSiege(worker))return false;const b=this.near(worker);if(!b)return false;this.order([worker],b);}
    const state=worker.commandState?.state;if(state==='MovingToHold'||state==='Holding'||!canSiege(worker)){this.stop(worker);return false;}
    const b=this.target(worker);if(!b){this.stop(worker);return false;}
    const s=this.scene,{width,height}=buildingDefinition(b),center={x:b.x+width/2,y:b.y+height/2};
    worker.workState='Working';worker.workMessage='Attacking the wall';
    if(!worker.nextTile&&touchesBuilding(worker.tile,b)){
      worker.path=[];const dx=center.x-worker.position.x,dy=center.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};
      worker.siegeHit={x:dx,y:dy};
      const amount=Math.max(0,worker.attackDPS)*(worker.damageFactor??1)*(s.combat?.damageScale?.(worker)??1)*SIEGE_RULES.damageShare*Math.max(0,delta)/1000;
      const result=damageBuilding(b,amount);this.drawBar(b);if(result?.destroyed)this.destroy(b);
      return true;
    }
    worker.siegeHit=null;
    worker.siegeRetarget=(worker.siegeRetarget??0)-delta;
    if(!worker.nextTile&&!worker.path?.length&&worker.siegeRetarget<=0){
      worker.siegeRetarget=SIEGE_RULES.retarget;const spots=siegeTiles(s.map,b),goals=worker.siegeSpot&&spots.some(p=>p.x===worker.siegeSpot.x&&p.y===worker.siegeSpot.y)?[worker.siegeSpot,...spots]:spots;
      if(!goals.length||!worker.moveTo(goals)){worker.siegeMisses=(worker.siegeMisses??0)+1;if(worker.siegeMisses>=SIEGE_RULES.giveUpAfter){this.stop(worker);s.setStatus?.(t('siege.noWay',{name:buildingDefinition(b).name}));return false;}}
      else worker.siegeMisses=0;
    }
    return true;
  }
  // The building falls: its functions go like a burnt one's, the ground under it is free again.
  destroy(b){
    const s=this.scene,name=buildingDefinition(b).name,at={x:b.x,y:b.y};
    for(const w of s.workerSystem?.liveWorkers?.()??[])if(w.siegeTargetId===b.id)this.stop(w);
    this.bars.get(b.id)?.destroy?.();this.bars.delete(b.id);
    detachLostBuilding(s,b);removeBuildingShell(s,b);s.refreshWallConnections?.();s.events?.emit?.('buildings:changed');s.updateInventory?.();
    s.setStatus?.(t('siege.destroyed',{name}));s.eventFeed?.push?.(`siege:${b.id}`,t('siege.destroyed',{name}),{target:{x:at.x+1,y:at.y+1}});
  }
  // A hit-point bar over a damaged enemy building.
  drawBar(b){
    const s=this.scene;if(!s.add?.graphics)return;const hp=buildingHP(b);if(!hp)return;
    let g=this.bars.get(b.id);if(hp.hp>=hp.max){g?.destroy?.();this.bars.delete(b.id);return;}
    if(!g){g=s.add.graphics();this.bars.set(b.id,g);}
    const d=buildingDefinition(b),p=gridToWorld(b.x+d.width/2,b.y+d.height/2),top=p.y-(d.visualHeight??d.visual?.wallHeight??60)-14,w=Math.max(34,Math.min(90,(d.width+d.height)*16)),share=Math.max(0,hp.hp/hp.max);
    g.clear().setDepth(20000);g.fillStyle(0x15120c,.85).fillRect(p.x-w/2-1,top-1,w+2,7);g.fillStyle(share>.5?0x6fbf5a:share>.25?0xe0b84a:0xd9534a,1).fillRect(p.x-w/2,top,w*share,5);
  }
}
