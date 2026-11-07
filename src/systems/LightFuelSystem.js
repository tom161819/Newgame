import { TORCHES } from '../data/torches.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';

// Day and night N2: fuelled light places (Torch Post, Brazier, tower holders). Each keeps a small physical store
// (`fuel-<id>`, kind 'fuel') that Haulers fill during the day like any delivery. At dusk a place with a night's fuel
// uses it at once and burns until morning; an empty place stays dark, shows "No fuel" and is counted in one notice.
// Places without `fuel` (castle, gate, bakery…) burn for free. Saved: which places burn tonight.
export class LightFuelSystem {
  constructor(scene){this.scene=scene;this.lit=new Set();this.hands=new Set();this.litDay=null;this.wasDark=false;this.listeners=new Set();}
  get storage(){return this.scene.foodStorage;}
  places(){return (this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&buildingDefinition(b).fuel);}
  locationId(building){return `fuel-${building.id}`;}
  stock(building){const d=buildingDefinition(building).fuel,l=this.storage?.locations.get(this.locationId(building));return l?.stock[d.resource]??0;}
  // Light from a building is on: places without fuel always; fuelled places only on a night they took fuel.
  isLit(building){return !buildingDefinition(building).fuel||this.lit.has(building.id);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const l of this.listeners)l();}
  register(building){if(buildingDefinition(building).fuel)this.storage?.register(building);}
  // At dusk every place takes a night's fuel if it has it; in the morning all go out.
  update(){
    const dn=this.scene.dayNight;if(!dn)return;const dark=dn.part()==='dusk'||dn.part()==='night',day=this.scene.gameTime.day;
    if(dark&&!this.wasDark&&this.litDay!==day)this.lightUp(day);
    if(dn.part()==='day'&&(this.lit.size||this.hands.size)){this.lit.clear();this.hands.clear();this.changed();}
    // A torch in hand burns out with its bearer leaving the watch (dead or gone).
    for(const id of this.hands)if(!this.scene.workerSystem?.workers.get(id)?.isAlive)this.hands.delete(id);
    this.wasDark=dark;
  }
  lightUp(day){
    this.litDay=day;this.lit.clear();const empty=[];
    for(const b of this.places()){
      const d=buildingDefinition(b).fuel,id=this.locationId(b);
      if(this.stock(b)>=d.perNight&&this.storage.withdraw(id,d.resource,d.perNight)!==false){this.lit.add(b.id);this.scene.resourceLedger?.expense(d.resource,d.perNight,'Lighting',{id:`light:${b.id}:${day}`,entityId:b.id});}
      else empty.push(b);
    }
    this.handOut(day);
    if(empty.length)this.scene.eventFeed?.push?.(`lights-no-fuel-${day}`,empty.length===1?'1 light has no fuel tonight.':`${empty.length} lights have no fuel tonight.`);
    this.changed();
  }
  // Soldiers on the night watch take one Torch each from the stores (the nearest store with one).
  soldiersOnWatch(){return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.profession==='soldier'&&w.isAlive&&!w.restPhase);}
  handOut(day){
    this.hands.clear();const storage=this.storage;if(!storage)return;
    for(const w of this.soldiersOnWatch()){
      const stores=[...storage.locations.values()].filter(l=>storage.isStock(l)&&storage.free(l.id,'torch')>0).sort((a,b)=>Math.hypot(a.x-w.position.x,a.y-w.position.y)-Math.hypot(b.x-w.position.x,b.y-w.position.y));
      if(stores.length&&storage.withdraw(stores[0].id,'torch',1)){this.hands.add(w.id);this.scene.resourceLedger?.expense('torch',1,'Hand Torch',{id:`hand:${w.id}:${day}`,entityId:w.id});}
    }
  }
  // Torches in hand as lights: tile coordinates (sight, safety) and world pixels (light map).
  handLights(){return [...this.hands].map(id=>this.scene.workerSystem?.workers.get(id)).filter(w=>w?.isAlive).map(w=>({x:w.position.x,y:w.position.y,radius:TORCHES.handTorch.radius,workerId:w.id}));}
  carries(worker){return this.hands.has(worker?.id);}
  // Who else refills: a Pitch Maker with nothing to do after midday when no Hauler is free, and a soldier with
  // "Tend torches" on his post (places within 8 tiles of him). Checked every 2 s per worker.
  help(worker){
    if(!worker?.isAlive||worker.workTask||worker.cargo||worker.restPhase||(worker.commandState&&worker.commandState.state!=='Working'))return;
    const pitch=worker.profession==='pitch_maker'&&worker.workState==='Waiting',soldier=worker.profession==='soldier'&&worker.tendTorches&&worker.workState==='Patrolling';
    if(!pitch&&!soldier)return;const now=this.scene.gameTime?.totalElapsed??0;if((worker.fuelCheckAt??-Infinity)>now)return;worker.fuelCheckAt=now+2000;
    const logistics=this.scene.logisticsTasks;if(!logistics||!this.places().some(b=>this.stock(b)+this.storage.incoming(this.locationId(b),buildingDefinition(b).fuel.resource)<buildingDefinition(b).fuel.capacity))return;
    if(pitch&&((this.scene.dayNight?.fraction()??0)<TORCHES.pitchMakerFrom||logistics.freeHauler()))return;
    const before={state:worker.workState,message:worker.workMessage,cooldown:worker.aiCooldown};worker.aiCooldown=0;
    const near=soldier?{x:worker.position.x,y:worker.position.y,range:TORCHES.tendRange}:null;
    if(!logistics.updateWorker(worker,{fuelOnly:true,near})){worker.workState=before.state;worker.workMessage=before.message;worker.aiCooldown=before.cooldown;}
  }
  unfuelled(){return this.places().filter(b=>!this.lit.has(b.id)&&this.stock(b)<buildingDefinition(b).fuel.perNight);}
  // Haulers' delivery list: fill every place to its store size (priority below construction, above ordinary hauling).
  candidates(){
    const storage=this.storage;if(!storage)return [];const stores=[...storage.locations.values()].filter(l=>storage.isStock(l)),out=[];
    for(const b of this.places()){
      const d=buildingDefinition(b).fuel,id=this.locationId(b);if(!storage.locations.has(id))storage.register(b);
      const missing=d.capacity-this.stock(b)-storage.incoming(id,d.resource);if(missing<=0)continue;
      for(const source of stores)if(storage.free(source.id,d.resource)>0)out.push({priority:TORCHES.refillPriority,sourceId:source.id,destinationId:id,resource:d.resource,amount:missing,fuel:true});
    }
    return out;
  }
  exportState(){return {lit:[...this.lit].sort((a,b)=>a-b),hands:[...this.hands].sort(),litDay:this.litDay,wasDark:this.wasDark};}
  importState(data){this.lit=new Set(data?.lit??[]);this.hands=new Set(data?.hands??[]);this.litDay=data?.litDay??null;this.wasDark=!!data?.wasDark;}
  destroy(){this.listeners.clear();}
}
export function validLightFuelState(data){
  return !!data&&typeof data==='object'&&Array.isArray(data.lit)&&data.lit.every(Number.isSafeInteger)&&Array.isArray(data.hands)&&data.hands.every(id=>typeof id==='string')&&(data.litDay===null||Number.isSafeInteger(data.litDay))&&typeof data.wasDark==='boolean';
}
