import { castleRules } from '../data/castle.js';
import { devFactor } from '../data/devBalance.js';
import { t } from '../i18n/index.js';
import { IdleGathering } from './IdleGathering.js';
import { syncWorkerUniform } from '../data/idleGathering.js';
import { UnitCommands } from './UnitCommands.js';
import { WorkerController } from '../game/WorkerController.js';
import { tileCenter,PLAYER_START } from '../game/map.js';
import { reachableTiles } from '../game/pathfinding.js';
import { towerNeighbors,buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { POPULATION,migrantsPerDay } from '../data/jobs.js';
import { CASTLE_START_EXTRA_RESIDENTS } from './GameSettings.js';
import { TaskReservationSystem } from './TaskReservationSystem.js';
import { JobSystem } from './JobSystem.js';
import { WorkerAI } from './WorkerAI.js';
import { DailyRest } from './DailyRest.js';
import { Discontent } from './Discontent.js';
import { initializeNaturalTalent } from './NaturalTalentSystem.js';
import { pickIdentity,identityKey } from '../data/names.js';
import { hashOf,seeded } from '../data/children.js';

export class WorkerSystem {
  constructor(scene,{onChange=()=>{}}={}){
    this.scene=scene;this.onChange=onChange;this.workers=new Map();this.nextId=1;this.lastMigrationDay=scene.gameTime.day;this.listeners=new Set();
    this.reservations=new TaskReservationSystem();this.ai=new WorkerAI(this);this.commands=new UnitCommands(this);this.jobs=new JobSystem(this);this.gather=new IdleGathering(this);this.rest=new DailyRest(this);this.discontent=new Discontent(this);
    this.unsubscribe=scene.gameTime.onNewDay(day=>this.onNewDay(day));this.buildingsChanged=()=>{this.gather.doorsKey=null;this.updateUI();};scene.events?.on?.('buildings:changed',this.buildingsChanged);
  }
  liveWorkers(){return [...this.workers.values()].filter(w=>w.isAlive);}
  liveSubjects(){return this.liveWorkers().filter(w=>w.isSubject!==false);}
  recentDeaths(){const now=this.scene.gameTime.totalElapsed,retention=POPULATION.recentDeathDays*this.scene.gameTime.dayDuration;return [...this.workers.values()].filter(w=>!w.isAlive&&w.workState!=='Left Kingdom'&&w.isSubject!==false&&Number.isFinite(w.diedAt)&&now-w.diedAt>=0&&now-w.diedAt<retention-1e-7).sort((a,b)=>b.diedAt-a.diedAt||a.id.localeCompare(b.id,undefined,{numeric:true}));}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  reservedTiles(){return this.liveWorkers().flatMap(w=>w.reservedTiles());}
  origin(worker=null){
    const workplace=worker?.assignedWorkplaceId?this.scene.buildings.find(b=>b.id===worker.assignedWorkplaceId):null;
    const castle=workplace??this.scene.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b));
    if(!castle)return {...PLAYER_START};const d=buildingDefinition(castle);return {x:castle.x+(d.width-1)/2,y:castle.y+(d.height-1)/2};
  }
  navigationMap(worker){
    if(!this.scene.workplaceSystem)return this.scene.map;
    const map=[...this.scene.map],rows=new Set(),units=[this.scene.character,...this.scene.animalSystem.animals.values(),...this.liveWorkers()];
    // A horse harnessed to a Horse Wagon travels with the wagon and its driver; it never blocks a tile (S12).
    for(const unit of units)if(unit!==worker&&unit.isAlive&&!unit.mounted&&(!unit.state||unit.state==='ground')&&this.scene.stables?.horses.get(unit.id)?.state!=='harnessed'&&!this.scene.stables?.led(unit))for(const tile of unit.reservedTiles()){
      if(!map[tile.y]||map[tile.y][tile.x]===undefined)continue;
      if(!rows.has(tile.y)){rows.add(tile.y);map[tile.y]=[...map[tile.y]];}map[tile.y][tile.x]=1;
    }
    // #163: a unit sharing the worker's own tile (e.g. the King at a doorway) must not trap him: he can always leave it.
    for(const tile of [worker?.tile,worker?.nextTile])if(tile&&map[tile.y]?.[tile.x]===1&&this.scene.map[tile.y]?.[tile.x]===0){if(!rows.has(tile.y)){rows.add(tile.y);map[tile.y]=[...map[tile.y]];}map[tile.y][tile.x]=0;}
    return map;
  }
  homeGoals(worker=null){
    const castle=this.scene.workplaceSystem?.building(worker)??this.scene.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b));
    if(castle)return towerNeighbors(castle).filter(t=>this.scene.map[t.y]?.[t.x]===0);
    const goals=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const t={x:PLAYER_START.x+dx,y:PLAYER_START.y+dy};if(this.scene.map[t.y]?.[t.x]===0)goals.push(t);}return goals;
  }
  candidates(){
    const occupied=new Set([...this.scene.resourceOccupancy.keys(),...this.scene.reservedTiles().map(tileKey)]);
    return reachableTiles(this.scene.map,this.homeGoals()).filter(t=>!occupied.has(tileKey(t)));
  }
  // m-obyvatele-jmena-spanek-pohyb (31): identities already used in this game (living, dead and remembered deaths).
  takenNames(){const out=new Set();for(const w of this.workers.values())if(w.identity)out.add(identityKey(w.identity));for(const d of this.deceased??[])if(d.identity)out.add(identityKey(d.identity));return out;}
  // Seeded by the world code and the resident id, never repeating a name of this game.
  newIdentity(id,options){return pickIdentity(seeded(hashOf('resident-name',this.scene.gameSettings?.worldCode??'',id)),this.takenNames(),options);}
  create(tile,{id=null,name=null,identity=null,randomize=true,isSubject=true}={}){
    if(typeof isSubject!=='boolean')throw new TypeError('Invalid resident ownership.');
    id??=`worker-${this.nextId++}`;const definition=this.scene.objectRegistry.require('peasant');
    const view=this.scene.assets.createView(definition.id,{...tileCenter(tile),tile});
    const worker=new WorkerController(this.scene,definition,id,tile,view,name??'');
    if(name==null)worker.identity=identity?{...identity}:this.newIdentity(id);
    worker.isSubject=isSubject;this.scene.employment?.request();
    if(randomize)initializeNaturalTalent(worker);
    view.setData('worker',worker);this.workers.set(id,worker);this.updateUI();return worker;
  }
  // World v2: the first villagers stand where the world's 'villagers' stream puts them (seeded worlds).
  // One more resident near the start (the starting garrison, m-start-v2); null when there is no free tile.
  spawnNearStart(random=Math.random){const origin=this.origin(),candidates=this.candidates().filter(t=>Math.max(Math.abs(t.x-origin.x),Math.abs(t.y-origin.y))<=6);return candidates.length?this.create(candidates[Math.floor(random()*candidates.length)]):null;}
  spawnInitial(random=Math.random){
    const origin=this.origin(),count=POPULATION.initial+(this.scene.gameSettings?.startingCastle?CASTLE_START_EXTRA_RESIDENTS:0);
    for(let i=0;i<count;i++){
      const candidates=this.candidates().filter(t=>Math.max(Math.abs(t.x-origin.x),Math.abs(t.y-origin.y))<=5);
      if(!candidates.length)break;this.create(candidates[Math.floor(random()*candidates.length)]);
    }
    this.updateUI();
  }
  onNewDay(day){
    if(day<=this.lastMigrationDay)return;this.lastMigrationDay=day;
    // m-start-v2: a full settlement says so once per capacity (the line comes back after new Houses fill up too).
    const capacity=this.capacity();if(this.liveSubjects().length>=capacity&&this.scene.eventFeed?.push)this.scene.eventFeed.push(`population-full:${capacity}`,t('feed.populationFull',{capacity}));
    // m-jidlo-balanc dev multiplier: fractional migrants carry over to the next day (not saved; 1× = exactly migrantsPerDay).
    const want=migrantsPerDay(this.liveSubjects().length)*devFactor('immigration')+(this.migrantCarry??0),migrants=Math.floor(want+1e-9);this.migrantCarry=want-migrants;
    for(let i=0;i<migrants&&this.liveSubjects().length<this.capacity();i++){
      if(this.scene.attractiveness&&!this.scene.attractiveness.shouldSettle())continue;
      const map=this.scene.map,origin=this.origin(),candidates=this.candidates().filter(t=>(t.x<=1||t.y<=1||t.x>=map[0].length-2||t.y>=map.length-2)&&Math.hypot(t.x-origin.x,t.y-origin.y)>25);
      if(!candidates.length)break;const worker=this.create(candidates[Math.floor(Math.random()*candidates.length)]);worker.arriving=true;worker.workState='Arriving';worker.moveTo(this.homeGoals());
    }
    this.updateUI();
  }
  update(delta){for(const worker of this.liveWorkers())if(worker.isSubject!==false){this.ai.update(worker,delta);syncWorkerUniform(this.scene,worker);
    // m-obyvatele-jmena-spanek-pohyb (42): only a resting resident standing still stays inside.
    if(worker.sleepingIn!=null&&(worker.restPhase!=='resting'||worker.nextTile||worker.path.length))worker.sleepingIn=null;}else worker.update(delta);}
  // (42) Residents sleeping inside a building now (House or Castle).
  sleepersIn(buildingId){return this.liveWorkers().filter(w=>w.sleepingIn===buildingId);}
  onDeath(worker){worker.manualRockId=null;this.scene.military?.release(worker,{dead:true});this.scene.vehicles?.release(worker);worker.commandState={state:'Working',goal:null};worker.diedAt??=this.scene.gameTime.totalElapsed;this.scene.workplaceSystem?.detach(worker);this.ai.cancel(worker);worker.active=false;worker.path=[];worker.nextTile=null;worker.walking=false;worker.workState='Dead';worker.workMessage='';worker.arriving=false;worker.view.destroy();this.scene.combatFeedback.remove(worker.id);this.updateUI();}
  // Resident capacity: the base settlement plus every completed House.
  capacity(){return POPULATION.maximum+(this.scene.buildings??[]).reduce((n,b)=>n+(b.type==='castle'&&b.level&&buildingIsComplete(b)?castleRules(b).residents:0),0)+(this.scene.buildings??[]).reduce((n,b)=>n+(buildingIsComplete(b)?this.scene.objectRegistry?.get(b.type)?.housing?.capacity??0:0),0);}
  updateUI(){const count=this.liveSubjects().length,maximum=this.capacity();this.onChange(count,maximum);for(const listener of this.listeners)listener(count,maximum);}
  // m-hlasky-udalosti (41): the last 50 deaths with their cause ('killed:<attacker type>' or 'wounds') and day.
  recordDeath(worker,cause){this.deceased??=[];this.deceased.push({name:worker.name,...(worker.identity?{identity:{...worker.identity}}:{}),profession:worker.displayProfession&&worker.displayProfession!=='idle'?worker.displayProfession:worker.profession,cause,day:this.scene.gameTime?.day??1});if(this.deceased.length>50)this.deceased.splice(0,this.deceased.length-50);}
  exportState(){return {nextId:this.nextId,lastMigrationDay:this.lastMigrationDay,...(this.deceased?.length?{deceased:this.deceased.map(d=>({...d,...(d.identity?{identity:{...d.identity}}:{})}))}:{})};}
  importState(data){this.deceased=(data?.deceased??[]).map(d=>({...d,...(d.identity?{identity:{...d.identity}}:{})}));this.nextId=data?.nextId??1;this.lastMigrationDay=data?.lastMigrationDay??this.scene.gameTime.day;this.updateUI();}
  destroy(){this.unsubscribe();this.scene.events?.off?.('buildings:changed',this.buildingsChanged);this.gather.clear();this.jobs.destroy();this.listeners.clear();this.reservations.clear();for(const worker of this.workers.values())worker.view.destroy();this.workers.clear();}
}
