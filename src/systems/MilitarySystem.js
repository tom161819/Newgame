import { t } from '../i18n/index.js';
import { towerNeighbors } from '../game/buildings.js';
import { WallPatrol,WALL_PATROL } from './WallPatrol.js';
import { UNIT_TYPES,unitKit,KNIGHT_SPEED,START_GARRISON,RECRUIT,CATAPULT } from '../data/military.js';
import { MILITARY_ITEMS } from '../data/militaryEquipment.js';
import { buildingIsComplete } from '../game/buildings.js';
import { recalculateStats } from './UnitStats.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { findPathToAny } from '../game/pathfinding.js';
import { inAttackRange,isRanged,WALL_ARCHER_RANGE } from './CombatSystem.js';
import { MILITARY_RULES,PATROL,STANCES } from '../data/military.js';
import { freeAround,awayFrom } from '../game/combatSpacing.js';
import { SiegeSystem,siegeable,canSiege } from './SiegeSystem.js';
import { SiegeEngines } from './SiegeEngines.js';

// C08: Soldiers employed in a Barracks are trained into units. Training is paid in Gold, needs the unit's real items
// (Haulers carry them from an Armory to the Barracks kit store) and game time at the Barracks. A trained unit wears
// its items; discharge or death drops them where the unit stands and Haulers return them to an Armory.
export class MilitarySystem {
  constructor(scene){this.scene=scene;this.units=new Map();this.orders=new Map();this.nextOrder=1;this.wallPatrol=new WallPatrol(scene);this.siege=new SiegeSystem(scene);this.engines=new SiegeEngines(scene);}
  get storage(){return this.scene.foodStorage;}
  barracks(id){return this.scene.buildings.find(b=>b.id===id&&b.type==='barracks'&&buildingIsComplete(b))??null;}
  // m-zalozka-vojsko: the patrol round of the settlement – walkable waypoints on a ring around all finished buildings,
  // in walking order; worked out again when a building is added, finished or removed. Empty for a tiny settlement.
  patrolRoute(){
    const s=this.scene,key=`${s.buildings.length}:${s.constructionSystem?.revision??0}`;if(this.routeKey===key)return this.route;this.routeKey=key;this.route=[];
    const done=s.buildings.filter(b=>buildingIsComplete(b));if(done.length<PATROL.minBuildings)return this.route;
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const b of done)for(const t of b.tiles??[{x:b.x,y:b.y}]){x0=Math.min(x0,t.x);y0=Math.min(y0,t.y);x1=Math.max(x1,t.x);y1=Math.max(y1,t.y);}
    const H=s.map.length,W=s.map[0].length,m=PATROL.margin;x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(W-1,x1+m);y1=Math.min(H-1,y1+m);
    const ring=[];for(let x=x0;x<x1;x+=PATROL.step)ring.push({x,y:y0});for(let y=y0;y<y1;y+=PATROL.step)ring.push({x:x1,y});for(let x=x1;x>x0;x-=PATROL.step)ring.push({x,y:y1});for(let y=y1;y>y0;y-=PATROL.step)ring.push({x:x0,y});
    const free=t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy?.has(`${t.x},${t.y}`),seen=new Set();
    for(const p of ring){let pick=null;for(let r=0;r<=PATROL.reach&&!pick;r++)for(let dy=-r;dy<=r&&!pick;dy++)for(let dx=-r;dx<=r&&!pick;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const t={x:p.x+dx,y:p.y+dy};if(free(t))pick=t;}
      if(pick&&!seen.has(`${pick.x},${pick.y}`)){seen.add(`${pick.x},${pick.y}`);this.route.push(pick);}}
    if(this.route.length<4)this.route=[];return this.route;
  }
  // The next waypoint of a soldier's round: everyone starts at a point of their own (spread by their place among the
  // soldiers) and walks the ring in order.
  nextPatrolPoint(worker){
    const route=this.patrolRoute();if(!route.length)return null;
    if(!Number.isInteger(worker.patrolIndex)||worker.patrolIndex>=route.length){const soldiers=this.scene.workerSystem.liveSubjects().filter(w=>w.profession==='soldier').map(w=>w.id).sort(),at=Math.max(0,soldiers.indexOf(worker.id));worker.patrolIndex=Math.floor(at*route.length/Math.max(1,soldiers.length))%route.length;}
    else worker.patrolIndex=(worker.patrolIndex+1)%route.length;
    return route[worker.patrolIndex];
  }
  unit(worker){return worker?this.units.get(worker.id)??null:null;}
  // kasarna-branci: a Recruit is a living resident with the `soldier` profession who is not a trained unit.
  isRecruit(worker){return !!worker?.isAlive&&worker.profession==='soldier'&&!this.units.has(worker.id);}
  order(worker){return [...this.orders.values()].find(o=>o.workerId===worker?.id)??null;}
  ordersAt(barracksId){return [...this.orders.values()].filter(o=>o.barracksId===barracksId).sort((a,b)=>a.id-b.id);}
  // Why a unit type cannot be trained for this Soldier right now, or null.
  blocker(worker,type){
    const spec=UNIT_TYPES[type];if(!spec)return 'unknown';
    if(spec.mount==='horse'&&!this.scene.stables?.freeHorse())return 'horse';
    if(spec.vehicle&&!this.engines.free(spec.vehicle))return `vehicle_${spec.vehicle}`;
    if(this.unit(worker))return 'trained';
    if(!this.isRecruit(worker)||!this.barracks(worker.assignedWorkplaceId))return 'notSoldier';if(this.order(worker))return 'training';
    if((worker.skills.combat?.level??1)<spec.requiredCombatLevel)return 'skill';
    return this.supplyBlocker(type);
  }
  // m-vojaci-chyba (owner point 87): what the kingdom lacks for this unit type, whoever trains: an Armory, the unit's
  // items in it (not yet promised to an earlier order) or the Gold. Before, Train was enabled without any of that and
  // the order waited for a Sword that nothing could make, with no word why.
  supplyBlocker(type){
    const spec=UNIT_TYPES[type];if(!spec)return 'unknown';
    if(spec.mount==='horse'&&!this.scene.stables?.freeHorse())return 'horse';
    if(spec.vehicle&&!this.engines.free(spec.vehicle))return `vehicle_${spec.vehicle}`;
    if(Object.keys(unitKit(type)).length&&!this.scene.buildings.some(b=>b.type==='armory'&&buildingIsComplete(b)))return 'armory';
    if(Object.keys(this.kitShortage(type)).length)return 'kit';
    if(this.scene.inventory.count('gold')<spec.goldCost)return 'gold';
    return null;
  }
  // Items of one kit that the Armories cannot give now: their free stock minus what waiting orders still need.
  kitShortage(type){
    const out={};for(const[id,n]of Object.entries(unitKit(type))){const promised=this.scene.buildings.filter(b=>b.type==='barracks').reduce((sum,b)=>sum+this.missing(b.id,id),0);const free=this.available(id)-promised;if(free<n)out[id]=n-Math.max(0,free);}
    return out;
  }
  // Items still missing for every waiting order at a Barracks, after what lies in its kit store or is on the way.
  kitNeeds(barracksId){const need={};for(const o of this.ordersAt(barracksId))if(o.state==='supplying')for(const[id,n]of Object.entries(unitKit(o.type)))need[id]=(need[id]??0)+n;return need;}
  missing(barracksId,resource){const kit=this.storage?.locations.get(`kit-${barracksId}`);if(!kit)return 0;return Math.max(0,(this.kitNeeds(barracksId)[resource]??0)-(kit.stock[resource]??0)-this.storage.incoming(kit.id,resource));}
  // Armory stock that could still go to this order (shown as available kits in the panel).
  available(resource){return this.storage?.available(resource)??0;}
  // New game only: the starting garrison (START_GARRISON) joins the first residents, within the population capacity.
  enlistStartingGarrison(random=Math.random){const ws=this.scene.workerSystem,out=[];for(const {type,count} of START_GARRISON)for(let i=0;i<count;i++){if(ws.liveSubjects().length>=ws.capacity())return out;const w=ws.spawnNearStart(random);if(w&&this.enlist(w,type))out.push(w);}ws.updateUI();return out;}
  // New game only: a resident becomes a trained unit with the unit's own equipment (no Armory stock is used).
  // Garrison units (garrison:true) serve the Castle: they need no Barracks and stay soldiers until dismissed.
  // options.withoutHorse: the Test map's Light Cavalry stands without a horse, no Stables needed.
  enlist(worker,type,{withoutHorse=false}={}){
    if(!worker?.isAlive||!UNIT_TYPES[type]||UNIT_TYPES[type].mount&&!withoutHorse)return false;
    if(!this.scene.workerSystem.jobs.assign(worker,'soldier'))return false;
    this.units.set(worker.id,{type,equipment:{...UNIT_TYPES[type].equipment},garrison:true});this.apply(worker);worker.currentHP=worker.maxHP;return true;
  }
  train(worker,type){
    const reason=this.blocker(worker,type);if(reason)return reason;const spec=UNIT_TYPES[type],id=this.nextOrder++;
    if(!this.scene.inventory.spend('gold',spec.goldCost,{source:'Military Training',id:`military-training:${id}`,entityId:worker.id}))return 'gold';
    this.orders.set(id,{id,workerId:worker.id,barracksId:worker.assignedWorkplaceId,type,state:'supplying',workDone:0,required:spec.trainingTime,items:{}});
    if(spec.mount==='horse')this.scene.stables.reserveHorse(worker.id);
    if(spec.vehicle&&!this.engines.reserve(worker,spec.vehicle)){this.cancel(id);return `vehicle_${spec.vehicle}`;}
    this.scene.updateInventory?.();return null;
  }
  cancel(orderId){
    const order=this.orders.get(orderId);if(!order)return false;this.orders.delete(orderId);if(UNIT_TYPES[order.type].mount)this.scene.stables?.returnHorse(order.workerId);if(UNIT_TYPES[order.type].vehicle){const w=this.scene.workerSystem.workers.get(order.workerId);if(w)this.engines.release(w);}
    const kit=`kit-${order.barracksId}`;for(const[id,n]of Object.entries(order.items))if(!this.storage.deposit(kit,id,n))this.storage.spill(id,n,this.tileOf(order.barracksId));
    this.scene.inventory.add('gold',UNIT_TYPES[order.type].goldCost,{source:'Military Training Refund',type:'refund',id:`military-refund:${order.id}`,entityId:order.workerId});
    this.scene.updateInventory?.();return true;
  }
  tileOf(barracksId){const b=this.barracks(barracksId)??this.scene.buildings.find(b=>b.id===barracksId);return b?{x:b.x-1,y:b.y}:this.scene.character.tile;}
  // A trained unit wears its type's modifiers and items; a Recruit the RECRUIT modifiers; anyone else neither.
  apply(worker){
    const unit=this.unit(worker);if(!unit){delete worker.crew;delete worker.statModifiers.militaryEquipment;if(this.isRecruit(worker))worker.statModifiers.military={...RECRUIT.modifiers};else delete worker.statModifiers.military;recalculateStats(worker);if(worker.definition?.gameplay?.movementSpeed)worker.speed=worker.definition.gameplay.movementSpeed;return;}
    const items={};for(const id of Object.values(unit.equipment)){const item=MILITARY_ITEMS[id],mods=item.modifiers??this.scene.objectRegistry.require(item.modifiersFrom).equipment.modifiers;for(const[k,v]of Object.entries(mods))items[k]=(items[k]??0)+v;}
    worker.statModifiers.militaryEquipment=items;worker.statModifiers.military={...UNIT_TYPES[unit.type].modifiers};recalculateStats(worker);
    worker.speed=(worker.definition?.gameplay?.movementSpeed??worker.speed)*(UNIT_TYPES[unit.type].mount?KNIGHT_SPEED:1)*(UNIT_TYPES[unit.type].speedFactor??1);worker.crew=!!UNIT_TYPES[unit.type].vehicle;
  }
  // Discharge or death: the unit's items fall where it stands; Haulers carry them back to an Armory.
  release(worker,{dead=false}={}){
    const unit=this.unit(worker);const order=this.order(worker);if(order)this.cancel(order.id);if(!unit)return false;
    if(UNIT_TYPES[unit.type].mount)this.scene.stables?.returnHorse(worker.id,worker.tile);
    if(UNIT_TYPES[unit.type].vehicle)this.engines.release(worker);
    this.units.delete(worker.id);const at=this.scene.gameTime?.totalElapsed??0;
    for(const[slot,id]of Object.entries(unit.equipment)){this.storage.spill(id,1,worker.tile);this.scene.resourceLedger?.income(id,1,'Recovered Equipment',{id:`military-return:${worker.id}:${slot}:${at}`,entityId:worker.id});}
    if(!dead)this.apply(worker);else{delete worker.statModifiers.military;delete worker.statModifiers.militaryEquipment;}
    this.scene.updateInventory?.();return true;
  }
  // A threat: a living animal fighting one of our people (a resident or the king) near this unit's Barracks, in sight.
  nearestEnemy(worker,radius,ok=()=>true){let best=null,d=radius;if(!(radius>0))return null;for(const a of this.scene.animalSystem?.animals.values()??[]){if(!a.isAlive||a.active===false||!(a.type==='wolf'||a.definition?.gameplay?.hostile)||!ok(a))continue;if(this.scene.fog&&!this.scene.fog.isVisibleObject(a))continue;const e=Math.hypot(a.position.x-worker.position.x,a.position.y-worker.position.y);if(e<=d){d=e;best=a;}}return best;}
  // War (owner 16 Nov 2026): an attack order on one enemy is an attack on its whole group – the enemies linked to it
  // within `groupLink` tiles. Every soldier gets his own enemy (the nearest one with fewer than `crowd` melee fighters;
  // archers may share), and the group's middle and size are the area the soldiers clear before they stop.
  enemyGroup(enemy){
    const all=[...(this.scene.animalSystem?.animals.values()??[])].filter(a=>a.isAlive&&a.active!==false&&(a.type==='wolf'||a.definition?.gameplay?.hostile)),group=[enemy],seen=new Set([enemy]);
    for(let i=0;i<group.length&&group.length<400;i++)for(const a of all)if(!seen.has(a)&&Math.hypot(a.position.x-group[i].position.x,a.position.y-group[i].position.y)<=MILITARY_RULES.groupLink){seen.add(a);group.push(a);}
    return group;
  }
  orderAttack(soldiers,enemy){
    const group=this.enemyGroup(enemy),mid={x:group.reduce((n,a)=>n+a.position.x,0)/group.length,y:group.reduce((n,a)=>n+a.position.y,0)/group.length};
    const radius=Math.max(MILITARY_RULES.orderRadius,...group.map(a=>Math.hypot(a.position.x-mid.x,a.position.y-mid.y)+6)),load=new Map();
    const order=[...soldiers].sort((a,b)=>Math.hypot(a.position.x-mid.x,a.position.y-mid.y)-Math.hypot(b.position.x-mid.x,b.position.y-mid.y));
    for(const w of order){
      let best=null,score=Infinity;for(const a of group){const n=load.get(a)??0;if(w.attackRange<=1&&n>=MILITARY_RULES.crowd)continue;const d=Math.hypot(a.position.x-w.position.x,a.position.y-w.position.y)+n*3+(a===enemy?-1:0);if(d<score){score=d;best=a;}}
      best??=enemy;load.set(best,(load.get(best)??0)+(w.attackRange<=1?1:0));
      this.siege?.stop(w);w.huntWolfId=best.id;w.attackArea={x:mid.x,y:mid.y};w.attackRadius=Math.round(radius);w.militaryRetarget=0;
    }
    return group.length;
  }
  // Owner 18 Nov 2026 ("soldiers cannot be sent at walls; the Catapult drives away instead of coming closer"): from day 2
  // soldiers sleep in the first third of the day, and that rest – and, for a Barracks soldier, the walk to his Barracks
  // after every order – came before the attack order: the men (and the Catapult) walked off to the Castle. A soldier
  // on duty skips both: one with an order, in a fight, attacked, with an enemy in sight near him, or a Catapult crew or
  // melee soldier with an enemy building in reach. Units of the Test map are always on duty.
  hasOrder(worker){return worker.siegeTargetId!=null||!!worker.huntWolfId||!!worker.attackArea||worker.scoutZone!=null||worker.expeditionGather!=null||!!this.scene.combat?.attacks?.has?.(worker);}
  onDuty(worker){
    if(!worker?.isAlive||worker.profession!=='soldier')return false;if(worker.sandbox||this.hasOrder(worker))return true;
    const now=this.scene.gameTime?.totalElapsed??0,last=worker.dutyCheck;if(last&&now>=last.at&&now-last.at<MILITARY_RULES.dutyCheck)return last.on;
    let on=false;for(const [a,target] of this.scene.combat?.attacks??[])if(target===worker&&a.isAlive){on=true;break;}
    on||=!!this.nearestEnemy(worker,MILITARY_RULES.guardRadius);
    if(!on&&worker.stance!=='hold'){const type=this.unit(worker)?.type;
      if(type==='catapult')on=this.scene.buildings.some(b=>siegeable(b)&&Math.hypot(b.x-worker.tile.x,b.y-worker.tile.y)<=CATAPULT.range+2);
      else if(!UNIT_TYPES[type]?.vehicle&&canSiege(worker))on=!!this.siege.near(worker);}
    worker.dutyCheck={at:now,on};return on;
  }
  // Is there a way on the ground to stand next to this enemy (other units aside)?
  reachable(worker,enemy){const map=this.scene.map,goals=adjacentTiles(enemy,map);return !!goals.length&&!!findPathToAny(map,worker.nextTile??worker.tile,goals);}
  // The enemy is cut off: break through an enemy building on the way; an archer (or with no wall to break) waits.
  cutOff(worker,enemy,delta){
    const siege=this.siege;this.scene.combat.stopAttack(worker);
    if(canSiege(worker)&&worker.commandState?.state!=='Holding'){
      if(siege.target(worker)==null){const b=siege.breachTarget(worker,enemy);if(b)siege.breach(worker,b);}
      if(worker.siegeTargetId!=null&&siege.update(worker,delta))return true;
    }
    worker.path=[];worker.workState='Waiting';worker.workMessage='Enemy out of reach';return true;
  }
  attackers(target){let n=0;for(const [a,t] of this.scene.combat?.attacks??[])if(t===target&&a.isAlive)n++;return n;}
  threat(worker){
    // m-mapa-kraje: in a scouted land the party guards itself – a soldier helps whoever of it is attacked near him.
    const home=this.barracks(worker.assignedWorkplaceId)??(this.unit(worker)?.garrison||this.scene.zone?{x:worker.position.x,y:worker.position.y}:null);if(!home)return null;let best=null,bestDistance=Infinity;
    for(const animal of this.scene.animalSystem?.animals.values()??[]){
      const victim=animal.retaliationTarget;if(!animal.isAlive||!victim?.isAlive||!(victim===this.scene.character||this.scene.workerSystem.workers.has(victim.id)&&victim.isSubject!==false))continue;
      if(this.scene.fog&&!this.scene.fog.isVisibleObject(animal))continue;
      if(Math.hypot(animal.position.x-home.x,animal.position.y-home.y)>MILITARY_RULES.guardRadius)continue;
      const d=Math.hypot(animal.position.x-worker.position.x,animal.position.y-worker.position.y);if(d<bestDistance){best=animal;bestDistance=d;}
    }
    return best;
  }
  // Owner 18 Nov 2026: a soldier standing where he was sent (Holding): a Catapult crew bombards what is in range and a
  // Wagon supplies, without moving; a melee soldier with an enemy building close and no enemy soldier near goes at it.
  holding(worker,delta){
    const unit=this.unit(worker);if(unit&&UNIT_TYPES[unit.type]?.vehicle){this.engines.update(worker,delta,{move:false});return;}
    if(worker.stance==='hold')return;
    // Owner 18 Nov 2026 (combat test: eight Swordsmen standing after a move order lost to eight enemy Recruits – only the
    // one being hit fought back): a soldier standing where he was sent fights the enemies who come near like any other
    // soldier of his stance, does not follow them far (holdLeash) and walks back to his place when it is over. The
    // stance Hold position keeps the old behaviour: he does not move.
    const goal=worker.commandState?.goal??null,place=goal??{x:worker.tile.x,y:worker.tile.y};
    if(this.updateSoldier(worker,delta,{held:place})){worker.holdAway=true;return;}
    if(this.nearestEnemy(worker,(STANCES[worker.stance]??STANCES.aggressive).engage))return;
    const b=this.siege.near(worker);if(b){this.siege.order([worker],b);worker.siegeOrdered=false;return;}
    worker.holdReturn=Math.max(0,(worker.holdReturn??0)-delta);
    if(goal&&worker.holdAway&&!worker.nextTile&&!worker.path.length&&!worker.holdReturn){
      if(worker.tile.x===goal.x&&worker.tile.y===goal.y){worker.holdAway=false;worker.holdTries=0;}else{worker.holdReturn=1000;/* a comrade may stand on his place for a moment: a few tries */if(!worker.moveTo([goal])&&(worker.holdTries=(worker.holdTries??0)+1)>=10){worker.holdAway=false;worker.holdTries=0;}}}
  }
  // Soldier behaviour on top of patrolling. Returns true when it took over this frame.
  // `held`: the place of a soldier standing on a move order (see `holding`); he fights from it and is led back to it.
  updateSoldier(worker,delta,{held=null}={}){
    const order=this.order(worker),combat=this.scene.combat,unit=this.unit(worker);
    if(order?.state==='training'){combat.stopAttack(worker);worker.workState='Working';worker.workMessage='Training';
      if(!this.scene.workplaceSystem.atWorkplace(worker)&&!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){worker.aiCooldown=1000;worker.moveTo(this.scene.workplaceSystem.goals(worker));}return true;}
    // Owner 18 Nov 2026: a Catapult crew or a Military Wagon never fights; it bombards or supplies (SiegeEngines).
    if(unit&&UNIT_TYPES[unit.type]?.vehicle){combat.stopAttack(worker);return this.engines.update(worker,delta);}
    // m-mapa-kraje: a scouting party walks to the map edge.
    if(worker.scoutZone!=null&&this.scene.scouting?.updateSoldier(worker))return true;
    // m-karavana-vyslat: escorts walk to the Marketplace while the caravan gathers.
    if(worker.expeditionGather!=null){const m=this.scene.buildings.find(b=>b.id===worker.expeditionGather);if(m){worker.workState='Traveling to Target';worker.workMessage=t('expedition.gathering');
      if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0&&Math.max(Math.abs(worker.tile.x-(m.x+1)),Math.abs(worker.tile.y-(m.y+1)))>4){worker.aiCooldown=1500;worker.moveTo(towerNeighbors(m));}return true;}delete worker.expeditionGather;}
    // m-hlidka-hradby: on the wall walk (or on the way up) the patrol leads; an Archer on a wall shoots threats in range.
    // Owner 17 Nov 2026 ("archers on Towers, walls and Gates do not shoot and leave their posts"): an archer up there
    // shoots any enemy in sight within his range (+2 from the height) and keeps his post – the post's own update runs
    // every frame (a missed one counted as leaving); he never steps down to chase.
    if(worker.wallPatrol){this.wallPatrol??=new WallPatrol(this.scene);
      if(worker.onWall&&!worker.wallDescent&&isRanged(worker)){const map=this.scene.map,current=combat.attacks.get(worker),fits=a=>a?.isAlive&&inAttackRange(worker,a,map)&&combat.canTarget(worker,a);
        const target=fits(current)?current:this.nearestEnemy(worker,worker.attackRange+WALL_ARCHER_RANGE+1,fits);
        if(target){combat.startAttack(worker,target);if(!worker.nextTile&&!worker.path.length){const dx=target.position.x-worker.position.x,dy=target.position.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};}}else if(current)combat.stopAttack(worker);}
      if(this.wallPatrol.update(worker,delta))return true;}
    // kasarna-branci: Recruits defend near their Barracks too, with their basic stats.
    if(!(unit||this.isRecruit(worker))||worker.commandState?.state==='Holding'&&!held)return false;
    // Combat 16 Nov 2026: stances – aggressive (default: chases and fights on), defensive (fights near itself only),
    // hold (does not move; fights only what is in reach).
    const stance=STANCES[worker.stance]??STANCES.aggressive,tile=worker.position;
    // A badly hurt soldier steps back from the fight until he has healed to half (not when told to hold).
    if(worker.retreating||stance.retreat&&worker.currentHP<worker.maxHP*MILITARY_RULES.retreatBelow&&(combat.attacks.get(worker)||this.nearestEnemy(worker,3))){
      const danger=this.nearestEnemy(worker,MILITARY_RULES.retreatSafe);
      if(worker.currentHP>=worker.maxHP*MILITARY_RULES.retreatUntil||!danger){if(worker.retreating){worker.retreating=false;worker.path=[];}}
      else{worker.retreating=true;
        combat.stopAttack(worker);delete worker.huntWolfId;worker.workState='Retreating';worker.workMessage='Falling back';
        if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=800;
          // Back to the healthy comrades (behind them, away from the enemy), else simply away.
          const friend=this.scene.workerSystem.liveWorkers().filter(w=>w!==worker&&w.profession==='soldier'&&!w.retreating&&!w.away&&w.currentHP>=w.maxHP*.5).sort((a,b)=>Math.hypot(a.position.x-worker.position.x,a.position.y-worker.position.y)-Math.hypot(b.position.x-worker.position.x,b.position.y-worker.position.y))[0];
          const to=friend&&Math.hypot(friend.position.x-worker.position.x,friend.position.y-worker.position.y)<15?awayFrom(this.scene,friend.tile,danger.tile,2):awayFrom(this.scene,worker.tile,danger.tile,6);if(to.length)worker.moveTo(to);}return true;}
    }
    // m-vlk-zustava: "Hunt the wolf" sends a soldier after a lurking wolf anywhere on the map until it is dead or gone.
    let hunted=null;if(worker.huntWolfId){hunted=this.scene.animalSystem?.animals?.get?.(worker.huntWolfId)??[...(this.scene.animalSystem?.animals?.values?.()??[])].find(a=>a.id===worker.huntWolfId);if(!hunted?.isAlive||hunted.active===false){delete worker.huntWolfId;hunted=null;
      // Combat test 16 Nov 2026: the attacked group fights on – the next enemy near him, not standing idle.
      // …and with an attack order, the rest of the enemies around the place he was sent to.
      const next=(this.nearestEnemy(worker,stance.follow,a=>this.attackers(a)<MILITARY_RULES.crowd)??this.nearestEnemy(worker,stance.follow))??(worker.attackArea&&!stance.hold?this.nearestEnemy({position:worker.attackArea},worker.attackRadius??MILITARY_RULES.orderRadius,a=>this.attackers(a)<MILITARY_RULES.crowd)??this.nearestEnemy({position:worker.attackArea},worker.attackRadius??MILITARY_RULES.orderRadius):null);if(next){worker.huntWolfId=next.id;hunted=next;}else{delete worker.attackArea;delete worker.attackRadius;}}}
    const ranged=isRanged(worker);
    // Archers shoot the nearest enemy they can reach rather than walking to a far one.
    if(ranged&&!stance.hold){const inReach=this.nearestEnemy(worker,worker.attackRange,a=>inAttackRange(worker,a,this.scene.map)&&combat.canTarget(worker,a));if(inReach&&(!hunted||!inAttackRange(worker,hunted,this.scene.map)))hunted=inReach;}
    // Spread out: a melee soldier whose enemy already has enough fighters around it takes a free one close by.
    if(hunted&&!ranged&&!combat.attacks.get(worker)&&this.attackers(hunted)>=MILITARY_RULES.crowd){const other=this.nearestEnemy(worker,MILITARY_RULES.spreadRadius,a=>a!==hunted&&this.attackers(a)<MILITARY_RULES.crowd);if(other){worker.huntWolfId=other.id;hunted=other;}}
    // An enemy coming close is fought without an order.
    if(!hunted&&!combat.attacks.get(worker)){const near=this.nearestEnemy(worker,stance.hold?worker.attackRange+.5:stance.engage);if(near)hunted=near;}
    const current=combat.attacks.get(worker)?.isAlive&&combat.attacks.get(worker).definition?combat.attacks.get(worker):null;
    const target=current??(stance.hold?hunted:this.threat(worker)??hunted);if(!target)return this.siege?.update(worker,delta)??false;
    // A soldier standing on a move order does not follow an enemy far from his place (he walks back to it).
    if(held&&target!==current&&Math.hypot(target.position.x-held.x,target.position.y-held.y)>MILITARY_RULES.holdLeash){combat.stopAttack(worker);return false;}
    // Owner 18 Nov 2026 (siege test: "soldiers stand below the walls doing nothing while the defenders are inside"):
    // an enemy with no way to him (behind enemy walls) is not waited for – a melee soldier breaks through the wall on
    // the way (or keeps hitting the wall he was sent at); with the wall down the way is looked for again.
    const now=this.scene.gameTime?.totalElapsed??0;
    if(worker.cutOff?.id===target.id&&target!==current&&!(inAttackRange(worker,target,this.scene.map)&&combat.canTarget(worker,target))){
      if(now>=worker.cutOff.until&&this.reachable(worker,target))delete worker.cutOff;
      else{if(now>=worker.cutOff.until)worker.cutOff.until=now+MILITARY_RULES.cutOffFor;return this.cutOff(worker,target,delta);}
    }
    worker.workState='Working';worker.workMessage='Defending the kingdom';
    // Archers keep their distance: an enemy right next to one makes him step back (unless he holds).
    if(ranged&&!stance.hold&&!worker.nextTile&&(worker.kiteWait??0)<=0){const close=this.nearestEnemy(worker,1.6);if(close&&this.attackers(close)>0){worker.kiteWait=2500;combat.stopAttack(worker);const to=awayFrom(this.scene,worker.tile,close.tile,3);if(to.length){worker.moveTo(to);return true;}}}
    worker.kiteWait=Math.max(0,(worker.kiteWait??0)-delta);
    const ready=!worker.nextTile&&(ranged?inAttackRange(worker,target,this.scene.map)&&combat.canTarget(worker,target):canInteractAdjacent(this.scene.map,worker,target)||worker.attackRange>1&&inAttackRange(worker,target,this.scene.map)&&combat.canTarget(worker,target));
    if(ready){worker.path=[];combat.startAttack(worker,target);const dx=target.position.x-worker.position.x,dy=target.position.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};return true;}
    if(!ranged)combat.stopAttack(worker);
    if(stance.hold){worker.path=[];return true;}
    // A defensive soldier does not chase far from where the fight found him.
    if(stance.leash&&Math.hypot(target.position.x-tile.x,target.position.y-tile.y)>stance.leash){combat.stopAttack(worker);delete worker.huntWolfId;return false;}
    worker.militaryRetarget=(worker.militaryRetarget??0)-delta;
    if(worker.militaryRetarget<=0){worker.militaryRetarget=MILITARY_RULES.retarget;
      if(!worker.moveTo(ranged?adjacentTiles(target,this.scene.map):freeAround(this.scene,target,worker))&&!this.reachable(worker,target)){worker.cutOff={id:target.id,until:now+MILITARY_RULES.cutOffFor};return this.cutOff(worker,target,delta);}}
    return true;
  }
  // kasarna-branci: the wage table entry for this resident (a Recruit is paid as `recruit`, a trained unit as `soldier`).
  wageProfession(worker){return this.isRecruit(worker)?'recruit':worker?.profession;}
  // Recruit stats follow the job: hired into a Barracks (or given the Soldier job) adds them, a new job removes them.
  syncRecruits(){
    for(const w of this.scene.workerSystem.liveWorkers()){if(this.units.has(w.id))continue;const want=this.isRecruit(w),has=!!w.statModifiers.military;
      if(want!==has||has&&w.statModifiers.military.maxHP!==RECRUIT.modifiers.maxHP)this.apply(w);}
  }
  wageBonus(worker){const unit=this.unit(worker);return unit?UNIT_TYPES[unit.type].wageBonus:0;}
  // Logistics catalog: equipment from Armory stock to the kit store, and leftovers back.
  candidates(){
    const storage=this.storage,tasks=[];if(!storage)return tasks;const stores=[...storage.locations.values()].filter(l=>storage.isStock(l));
    for(const kit of [...storage.locations.values()].filter(l=>l.kind==='kit')){
      const need=this.kitNeeds(kit.buildingId);
      for(const resource of kit.allowed){const missing=this.missing(kit.buildingId,resource);
        if(missing>0)for(const source of stores)if(storage.free(source.id,resource)>0)tasks.push({priority:20,sourceId:source.id,destinationId:kit.id,resource,amount:missing});
        const surplus=storage.free(kit.id,resource)-(need[resource]??0);
        if(surplus>0)for(const destination of stores)if(destination.allowed.includes(resource)&&storage.room(destination.id,resource)>0)tasks.push({priority:40,sourceId:kit.id,destinationId:destination.id,resource,amount:surplus});
      }
    }
    return tasks;
  }
  update(delta){
    if(this.scene.gameOver||this.scene.gameTime?.paused||!this.storage)return;
    // A unit moved out of its Barracks (new job, Unemployed) hands its gear back: it drops where the resident stands.
    this.syncRecruits();
    for(const workerId of [...this.units.keys()]){const w=this.scene.workerSystem.workers.get(workerId);if(!w?.isAlive)this.units.delete(workerId);else if(w.profession!=='soldier'||(!this.barracks(w.assignedWorkplaceId)&&!this.units.get(workerId).garrison))this.release(w);}
    for(const order of [...this.orders.values()].sort((a,b)=>a.id-b.id)){
      const worker=this.scene.workerSystem.workers.get(order.workerId);
      if(!worker?.isAlive||worker.assignedWorkplaceId!==order.barracksId||!this.barracks(order.barracksId)){this.cancel(order.id);continue;}
      if(order.state==='supplying'){const kit=unitKit(order.type);if(!Object.keys(kit).length||this.storage.withdrawBatch(`kit-${order.barracksId}`,kit)){order.items=kit;order.state='training';}else continue;}
      if(!this.scene.workplaceSystem.atWorkplace(worker))continue;
      order.workDone=Math.min(order.required,order.workDone+Math.max(0,delta)*(this.scene.workplaceSystem.workFactor?.(worker)??1));
      if(order.workDone>=order.required)this.finish(order,worker);
    }
  }
  finish(order,worker){
    this.orders.delete(order.id);const equipment=Object.fromEntries(Object.entries(UNIT_TYPES[order.type].equipment).filter(([,id])=>order.items?.[id]>0));/* p71: an order trained before Light Armor joined the kit gives what it got */if(UNIT_TYPES[order.type].mount)this.scene.stables?.mountRider(worker.id);this.units.set(worker.id,{type:order.type,equipment});
    for(const[id,n]of Object.entries(order.items))this.scene.resourceLedger?.expense(id,n,'Military Equipment',{id:`military-equip:${order.id}:${id}`,entityId:worker.id});
    this.apply(worker);worker.currentHP=worker.maxHP;this.scene.activities?.emit('unitTrained',{actor:worker,objectType:order.type,quantity:1});this.scene.updateInventory?.();
  }
  exportState(){return {units:[...this.units].map(([workerId,u])=>({workerId,type:u.type,equipment:{...u.equipment},...(u.garrison?{garrison:true}:{})})),orders:[...this.orders.values()].map(o=>structuredClone(o)),nextOrder:this.nextOrder};}
  importState(data){
    this.units=new Map((data?.units??[]).map(u=>[u.workerId,{type:u.type,equipment:{...u.equipment},...(u.garrison?{garrison:true}:{})}]));
    this.orders=new Map((data?.orders??[]).map(o=>[o.id,structuredClone(o)]));this.nextOrder=data?.nextOrder??1;
  }
  // p70: a Knight from a save made before he lost his horse gives it back (called once the Stables are loaded).
  releaseUnusedHorses(){
    const st=this.scene.stables;if(!st)return;const riders=new Set([...this.units].filter(([,u])=>UNIT_TYPES[u.type]?.mount).map(([id])=>id));
    for(const o of this.orders.values())if(UNIT_TYPES[o.type]?.mount)riders.add(o.workerId);
    for(const h of [...st.horses.values()])if(h.riderId&&!riders.has(h.riderId)){const w=this.scene.workerSystem?.liveWorkers?.().find(w=>w.id===h.riderId);st.returnHorse(h.riderId,w?.tile??null);if(w&&this.units.has(w.id))this.apply(w);}
  }
}
