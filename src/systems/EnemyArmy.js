import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete,towerNeighbors,towerTop,buildingDepth } from '../game/buildings.js';
import { buildingHP,damageBuilding } from '../game/buildingHealth.js';
import { gridToWorld,tileCenter } from '../game/isometric.js';
import { isWalkable } from '../game/map.js';
import { inAttackRange } from './CombatSystem.js';
import { siegeTiles,touchesBuilding } from './SiegeSystem.js';

// Battle test 18 Nov 2026, point 2 ("the enemies are passive"): an enemy army with an order. On the Test map the
// button "Enemy attacks" sends every enemy soldier on the ground against the kingdom (`animal.marching`): they march on
// the Castle, fight everyone of ours they meet (no chase leash while marching), and where our walls or buildings stand
// in the way they break through them (the battering-ram stand-in: melee soldiers hit the building). At the Castle they
// attack the buildings around it. The Castle itself holds at `castleFloor` of its hit points (no defeat by a siege yet).
// Enemy archers placed on an enemy wall, Tower or Gate stand up on it and shoot from there (`animal.onWall`); melee
// cannot reach them, the wall has to be broken. Runtime only: nothing of it is saved.
export const ENEMY_ARMY=Object.freeze({repath:1500,buildingShare:.5,castleShare:.15,breachRadius:14,castleFloor:.25,attackRadius:9,gateRadius:7});
const FORT=['wall','tower','gate','wall_gate'];
export const ours=b=>!!b&&!b.enemy&&buildingIsComplete(b)&&!!buildingHP(b);
export class EnemyArmy{
  constructor(scene){this.scene=scene;}
  animals(){return [...(this.scene.animalSystem?.animals?.values?.()??[])].filter(a=>a.isAlive&&a.active!==false&&a.definition?.gameplay?.hostile);}
  // The place the army marches on: the Castle, else the middle of our buildings, else of our soldiers.
  goal(){
    const s=this.scene,castle=s.buildings.find(b=>b.type==='castle'&&ours(b));if(castle)return {building:castle,tiles:towerNeighbors(castle)};
    const mid=list=>list.length?{x:Math.round(list.reduce((n,p)=>n+p.x,0)/list.length),y:Math.round(list.reduce((n,p)=>n+p.y,0)/list.length)}:null;
    const p=mid(s.buildings.filter(ours).map(b=>({x:b.x,y:b.y})))??mid(s.workerSystem.liveWorkers().filter(w=>w.profession==='soldier').map(w=>w.tile));
    return p?{building:null,tiles:[p]}:null;
  }
  // Sends the enemies (on the ground) against the kingdom; returns how many march.
  march(list=this.animals()){
    const goal=this.goal();if(!goal)return 0;let n=0;
    for(const a of list){if(a.onWall)continue;a.marching={tiles:goal.tiles.map(p=>({...p})),castle:goal.building?.id??null};a.returning=false;a.post=null;a.armyRepath=0;a.armyBuilding=null;n++;}
    if(n){const at=goal.tiles[0];this.scene.eventFeed?.push?.(`army:${this.scene.gameTime?.totalElapsed??0}`,t('army.attacking',{count:n}),{important:true,target:at});this.scene.dangerMarks?.mark?.(at);}
    return n;
  }
  // Called by AnimalSystem for a marching enemy; true when it led him this frame.
  lead(animal,delta){
    const sys=this.scene.animalSystem;animal.returning=false;
    if(animal.retaliationTarget?.isAlive)return false;
    const foe=sys.guardTarget(animal);if(foe){sys.onAttacked(animal,foe);return false;}
    const melee=(animal.attackRange??1)<=2,s=this.scene;
    // A building in the way (or at the Castle): melee soldiers break it.
    let b=animal.armyBuilding!=null?s.buildings.find(x=>x.id===animal.armyBuilding):null;if(b&&!ours(b)){animal.armyBuilding=null;b=null;}
    if(b&&melee){
      if(!animal.nextTile&&touchesBuilding(animal.tile,b)){animal.path=[];this.hit(animal,b,delta);return true;}
      animal.armyRepath-=delta;if(!animal.nextTile&&!animal.path.length&&animal.armyRepath<=0){animal.armyRepath=ENEMY_ARMY.repath;const spots=siegeTiles(s.map,b),taken=new Set(this.animals().filter(a=>a!==animal&&a.armyBuilding===b.id).map(a=>`${(a.nextTile??a.tile).x},${(a.nextTile??a.tile).y}`)),free=spots.filter(p=>!taken.has(`${p.x},${p.y}`));if(!animal.moveTo(free.length?free:spots))animal.armyBuilding=null;}
      return true;
    }
    const g=animal.marching,near=g.tiles.some(p=>Math.hypot(p.x-animal.tile.x,p.y-animal.tile.y)<=3);
    if(near){if(melee){const next=this.nearOurs(animal,ENEMY_ARMY.attackRadius);if(next){animal.armyBuilding=next.id;return true;}}animal.path=[];return true;}
    animal.armyRepath-=delta;
    if(!animal.nextTile&&!animal.path.length&&animal.armyRepath<=0){animal.armyRepath=ENEMY_ARMY.repath*(.8+Math.random()*.4);
      if(!animal.moveTo(g.tiles)&&melee){const block=this.inTheWay(animal,g.tiles[0]);if(block)animal.armyBuilding=block.id;}}
    return true;
  }
  nearOurs(animal,r){let best=null,d=Infinity;for(const b of this.scene.buildings){if(!ours(b)||!this.breakable(b))continue;const {width,height}=buildingDefinition(b),e=Math.hypot(b.x+width/2-animal.position.x,b.y+height/2-animal.position.y);if(e<=r&&e<d){d=e;best=b;}}return best;}
  breakable(b){const hp=buildingHP(b);return !(b.type==='castle'&&hp&&hp.hp<=hp.max*ENEMY_ARMY.castleFloor);}
  // Our building most on his way to the goal (walls and Gates first).
  inTheWay(animal,goal){
    let best=null,cost=Infinity;for(const b of this.scene.buildings){if(!ours(b)||!this.breakable(b))continue;const {width,height}=buildingDefinition(b),cx=b.x+width/2-.5,cy=b.y+height/2-.5,a=Math.hypot(cx-animal.position.x,cy-animal.position.y);if(a>ENEMY_ARMY.breachRadius)continue;
      const c=a+Math.hypot(cx-goal.x,cy-goal.y)*1.5-(FORT.includes(b.type)?3:0);if(c<cost){cost=c;best=b;}}
    return best;
  }
  hit(animal,b,delta){
    const s=this.scene,{width,height}=buildingDefinition(b),dx=b.x+width/2-animal.position.x,dy=b.y+height/2-animal.position.y,n=Math.hypot(dx,dy);if(n)animal.direction={x:dx/n,y:dy/n};
    let amount=Math.max(0,animal.attackDPS)*(b.type==='castle'?ENEMY_ARMY.castleShare:ENEMY_ARMY.buildingShare)*Math.max(0,delta)/1000;
    if(b.type==='castle'){const hp=buildingHP(b),floor=hp.max*ENEMY_ARMY.castleFloor;amount=Math.min(amount,Math.max(0,hp.hp-floor));if(amount<=0){animal.armyBuilding=null;return;}}
    const result=damageBuilding(b,amount);s.repairs?.cancel?.(b.id);s.military?.siege?.drawBar?.(b);
    if(!b.underAttackTold){b.underAttackTold=true;s.eventFeed?.push?.(`army-hit:${b.id}`,t('army.buildingAttacked',{name:buildingDefinition(b).name}),{important:true,target:{x:b.x+1,y:b.y+1}});}
    if(result?.destroyed){animal.armyBuilding=null;s.military?.siege?.destroy?.(b,{ours:true});}
  }
  // --- archers on their own walls ----------------------------------------------------------------------------------
  // Puts an enemy archer up on an enemy wall, Tower or Gate at this tile; true when he went up.
  mount(animal,building,tile){
    if(!building?.enemy||!FORT.includes(building.type)||(animal.attackRange??1)<=2)return false;
    animal.onWall=building;animal.tile={...tile};animal.position={x:tile.x+.5,y:tile.y+.5};animal.path=[];animal.nextTile=null;animal.marching=null;this.place(animal);return true;
  }
  place(animal){
    const b=animal.onWall,view=animal.view;if(!b||!view)return;const p=gridToWorld(animal.position.x,animal.position.y),c=tileCenter(b),top=towerTop(b);
    view.setPosition(p.x+top.x-c.x,p.y+top.y-c.y).setDepth?.(buildingDepth(b)+p.y-c.y+.2);
  }
  // He shoots whoever of ours is in reach (from the height: 2 tiles further, over walls) and never moves.
  shoot(animal){
    const s=this.scene,combat=s.combat,current=combat.attacks.get(animal);
    if(current?.isAlive&&inAttackRange(animal,current,s.map))return;
    const units=[...s.workerSystem.liveWorkers().filter(w=>!w.away&&w.sleepingIn==null),...(s.character?.isAlive&&!s.character.away?[s.character]:[])];
    let best=null,d=Infinity;for(const u of units){if(!combat.canFight(u)||!inAttackRange(animal,u,s.map))continue;const e=Math.hypot(u.position.x-animal.position.x,u.position.y-animal.position.y);if(e<d){d=e;best=u;}}
    if(best){combat.startAttack(animal,best);const dx=best.position.x-animal.position.x,dy=best.position.y-animal.position.y,n=Math.hypot(dx,dy);if(n)animal.direction={x:dx/n,y:dy/n};}else combat.stopAttack(animal);
  }
  // The wall under him fell: he comes down hurt, onto the rubble.
  fall(building){
    for(const a of this.animals())if(a.onWall===building){a.onWall=null;this.scene.combat?.applyEffectiveDamage?.(a,a.maxHP*.3);const tl=a.tile;if(!isWalkable(this.scene.map,tl.x,tl.y)){a.isAlive&&this.scene.combat?.handleDeath?.(a);}}
  }
}
