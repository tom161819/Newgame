import { UnitCommands } from './UnitCommands.js';
import { WorkerController } from '../game/WorkerController.js';
import { tileCenter,PLAYER_START } from '../game/map.js';
import { reachableTiles } from '../game/pathfinding.js';
import { towerNeighbors,buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { POPULATION } from '../data/jobs.js';
import { TaskReservationSystem } from './TaskReservationSystem.js';
import { JobSystem } from './JobSystem.js';
import { WorkerAI } from './WorkerAI.js';
import { initializeNaturalTalent } from './NaturalTalentSystem.js';

const names=['Matěj','Anna','Jakub','Eliška','Pavel','Marie','Jan','Tereza','Ondřej','Klára'];
export class WorkerSystem {
  constructor(scene,{onChange=()=>{}}={}){
    this.scene=scene;this.onChange=onChange;this.workers=new Map();this.nextId=1;this.lastMigrationDay=scene.gameTime.day;this.listeners=new Set();
    this.reservations=new TaskReservationSystem();this.ai=new WorkerAI(this);this.commands=new UnitCommands(this);this.jobs=new JobSystem(this);
    this.unsubscribe=scene.gameTime.onNewDay(day=>this.onNewDay(day));this.buildingsChanged=()=>this.updateUI();scene.events?.on?.('buildings:changed',this.buildingsChanged);
  }
  liveWorkers(){return [...this.workers.values()].filter(w=>w.isAlive);}
  liveSubjects(){return this.liveWorkers().filter(w=>w.isSubject!==false);}
  recentDeaths(){const now=this.scene.gameTime.totalElapsed,retention=POPULATION.recentDeathDays*this.scene.gameTime.dayDuration;return [...this.workers.values()].filter(w=>!w.isAlive&&w.isSubject!==false&&Number.isFinite(w.diedAt)&&now-w.diedAt>=0&&now-w.diedAt<retention-1e-7).sort((a,b)=>b.diedAt-a.diedAt||a.id.localeCompare(b.id,undefined,{numeric:true}));}
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
    for(const unit of units)if(unit!==worker&&unit.isAlive&&!unit.mounted&&(!unit.state||unit.state==='ground'))for(const tile of unit.reservedTiles()){
      if(!map[tile.y]||map[tile.y][tile.x]===undefined)continue;
      if(!rows.has(tile.y)){rows.add(tile.y);map[tile.y]=[...map[tile.y]];}map[tile.y][tile.x]=1;
    }
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
  create(tile,{id=null,name=null,randomize=true,isSubject=true}={}){
    if(typeof isSubject!=='boolean')throw new TypeError('Invalid resident ownership.');
    id??=`worker-${this.nextId++}`;const number=Number(id.split('-')[1]),definition=this.scene.objectRegistry.require('peasant');
    const view=this.scene.assets.createView(definition.id,{...tileCenter(tile),tile});
    const worker=new WorkerController(this.scene,definition,id,tile,view,name??`${names[(number-1)%names.length]}${number>names.length?` ${Math.ceil(number/names.length)}`:''}`);
    worker.isSubject=isSubject;this.scene.employment?.request();
    if(randomize)initializeNaturalTalent(worker);
    view.setData('worker',worker);this.workers.set(id,worker);this.updateUI();return worker;
  }
  spawnInitial(){
    const origin=this.origin();
    for(let i=0;i<POPULATION.initial;i++){
      const candidates=this.candidates().filter(t=>Math.max(Math.abs(t.x-origin.x),Math.abs(t.y-origin.y))<=5);
      if(!candidates.length)break;this.create(candidates[Math.floor(Math.random()*candidates.length)]);
    }
    this.updateUI();
  }
  onNewDay(day){
    if(day<=this.lastMigrationDay)return;this.lastMigrationDay=day;
    for(let i=0;i<POPULATION.migrantsPerDay&&this.liveSubjects().length<this.capacity();i++){
      if(this.scene.attractiveness&&!this.scene.attractiveness.shouldSettle())continue;
      const map=this.scene.map,origin=this.origin(),candidates=this.candidates().filter(t=>(t.x<=1||t.y<=1||t.x>=map[0].length-2||t.y>=map.length-2)&&Math.hypot(t.x-origin.x,t.y-origin.y)>25);
      if(!candidates.length)break;const worker=this.create(candidates[Math.floor(Math.random()*candidates.length)]);worker.arriving=true;worker.workState='Arriving';worker.moveTo(this.homeGoals());
    }
    this.updateUI();
  }
  update(delta){for(const worker of this.liveWorkers())if(worker.isSubject!==false)this.ai.update(worker,delta);else worker.update(delta);}
  onDeath(worker){worker.commandState={state:'Working',goal:null};worker.diedAt??=this.scene.gameTime.totalElapsed;this.scene.workplaceSystem?.detach(worker);this.ai.cancel(worker);worker.active=false;worker.path=[];worker.nextTile=null;worker.walking=false;worker.workState='Dead';worker.workMessage='';worker.arriving=false;worker.view.destroy();this.scene.combatFeedback.remove(worker.id);this.updateUI();}
  // Resident capacity: the base settlement plus every completed House.
  capacity(){return POPULATION.maximum+(this.scene.buildings??[]).reduce((n,b)=>n+(buildingIsComplete(b)?this.scene.objectRegistry?.get(b.type)?.housing?.capacity??0:0),0);}
  updateUI(){const count=this.liveSubjects().length,maximum=this.capacity();this.onChange(count,maximum);for(const listener of this.listeners)listener(count,maximum);}
  exportState(){return {nextId:this.nextId,lastMigrationDay:this.lastMigrationDay};}
  importState(data){this.nextId=data?.nextId??1;this.lastMigrationDay=data?.lastMigrationDay??this.scene.gameTime.day;this.updateUI();}
  destroy(){this.unsubscribe();this.scene.events?.off?.('buildings:changed',this.buildingsChanged);this.jobs.destroy();this.listeners.clear();this.reservations.clear();for(const worker of this.workers.values())worker.view.destroy();this.workers.clear();}
}
