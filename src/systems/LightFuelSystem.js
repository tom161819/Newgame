import { TORCHES } from '../data/torches.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';

// Day and night N2: fuelled light places (Torch Post, Brazier, tower holders). Each keeps a small physical store
// (`fuel-<id>`, kind 'fuel') that Haulers fill during the day like any delivery. At dusk a place with a night's fuel
// uses it at once and burns until morning; an empty place stays dark, shows "No fuel" and is counted in one notice.
// Places without `fuel` (castle, gate, bakery…) burn for free. Saved: which places burn tonight.
export class LightFuelSystem {
  constructor(scene){this.scene=scene;this.lit=new Set();this.hands=new Set();this.handDay=new Map();this.free=new Set();this.litDay=null;this.wasDark=false;this.listeners=new Set();this.regroup=0;}
  get storage(){return this.scene.foodStorage;}
  places(){return (this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&buildingDefinition(b).fuel);}
  locationId(building){return `fuel-${building.id}`;}
  stock(building){const d=buildingDefinition(building).fuel,l=this.storage?.locations.get(this.locationId(building));return l?.stock[d.resource]??0;}
  // Light from a building is on: places without fuel always; fuelled places only on a night they took fuel.
  isLit(building){const d=buildingDefinition(building);if(d.campfire)return !!this.scene.nightThreats?.campfireBurning(building);return !d.fuel||this.lit.has(building.id);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const l of this.listeners)l();}
  register(building){if(buildingDefinition(building).fuel)this.storage?.register(building);}
  // At dusk every place takes a night's fuel if it has it; in the morning all go out.
  update(delta=1000/60){
    const dn=this.scene.dayNight;if(!dn)return;const dark=dn.part()==='dusk'||dn.part()==='night',day=this.scene.gameTime.day;
    if(dark&&!this.wasDark&&this.litDay!==day)this.lightUp(day);
    if(dn.part()==='day'&&(this.lit.size||this.hands.size)){this.lit.clear();this.hands.clear();this.handDay.clear();this.changed();}
    // A torch in hand burns out with its bearer leaving the watch (dead or gone).
    for(const id of this.hands)if(!this.scene.workerSystem?.workers.get(id)?.isAlive){this.hands.delete(id);this.handDay.delete(id);this.free.delete(id);}
    // Point 68: while it is dark the bearers follow the groups (every few seconds); underground a torch lasts a day.
    if(dark&&(this.regroup-=delta)<=0){this.regroup=TORCHES.regroupMs;this.assignTorches(day);}
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
  handOut(day){this.hands.clear();this.handDay.clear();for(const id of this.free)this.hands.add(id);this.assignTorches(day);}
  // Point 68: groups of soldiers (within groupLink tiles of each other) and, in each, one torch per perGroup soldiers –
  // the bearers already lit keep theirs, new ones are the men nearest the group's middle.
  groups(soldiers=this.soldiersOnWatch()){
    const link=TORCHES.groupLink,left=new Set(soldiers),out=[];
    while(left.size){const first=left.values().next().value,group=[first];left.delete(first);
      for(let i=0;i<group.length;i++)for(const w of [...left])if(Math.hypot(w.position.x-group[i].position.x,w.position.y-group[i].position.y)<=link){group.push(w);left.delete(w);}
      out.push(group);}
    return out;
  }
  assignTorches(day=this.scene.gameTime?.day??1){
    let changed=false;
    // underground the night does not end: a torch lit on an earlier day is spent and must be replaced
    for(const id of [...this.hands])if(!this.free.has(id)&&(this.handDay.get(id)??day)<day){const w=this.scene.workerSystem?.workers.get(id);if(!(w&&this.takeTorch(w,day))){this.hands.delete(id);this.handDay.delete(id);changed=true;}}
    for(const group of this.groups()){
      const need=Math.ceil(group.length/TORCHES.perGroup),have=group.filter(w=>this.hands.has(w.id)).length;if(have>=need)continue;
      const mid={x:group.reduce((n,w)=>n+w.position.x,0)/group.length,y:group.reduce((n,w)=>n+w.position.y,0)/group.length};
      const candidates=group.filter(w=>!this.hands.has(w.id)).sort((a,b)=>Math.hypot(a.position.x-mid.x,a.position.y-mid.y)-Math.hypot(b.position.x-mid.x,b.position.y-mid.y));
      for(const w of candidates.slice(0,need-have)){if(!this.takeTorch(w,day))break;this.hands.add(w.id);changed=true;}
    }
    if(changed)this.changed();
  }
  // One torch: from the nearest store with one, or on an expedition from the wagon's load.
  takeTorch(w,day){
    const storage=this.storage,zone=this.scene.zone;
    // Owner 18 Nov 2026: a Military Wagon nearby hands out its Torches first.
    if(this.scene.military?.engines?.torch?.(w)){this.handDay.set(w.id,day);return true;}
    const stores=storage?[...storage.locations.values()].filter(l=>storage.isStock(l)&&storage.free(l.id,'torch')>0).sort((a,b)=>Math.hypot(a.x-w.position.x,a.y-w.position.y)-Math.hypot(b.x-w.position.x,b.y-w.position.y)):[];
    if(stores.length&&storage.withdraw(stores[0].id,'torch',1)){this.scene.resourceLedger?.expense('torch',1,'Hand Torch',{id:`hand:${w.id}:${day}`,entityId:w.id});this.handDay.set(w.id,day);return true;}
    if(zone?.cargo?.torch>0){zone.cargo.torch--;if(!zone.cargo.torch)delete zone.cargo.torch;this.handDay.set(w.id,day);return true;}
    return false;
  }
  // The Test map: these soldiers carry a torch at no cost (the button in the Test panel).
  giveFree(workers){let n=0;for(const w of workers)if(w?.profession==='soldier'&&w.isAlive){this.free.add(w.id);this.hands.add(w.id);n++;}if(n)this.changed();return n;}
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
  importState(data){this.lit=new Set(data?.lit??[]);this.hands=new Set(data?.hands??[]);this.handDay=new Map([...this.hands].map(id=>[id,this.scene.gameTime?.day??1]));this.litDay=data?.litDay??null;this.wasDark=!!data?.wasDark;}
  destroy(){this.listeners.clear();}
}
export function validLightFuelState(data){
  return !!data&&typeof data==='object'&&Array.isArray(data.lit)&&data.lit.every(Number.isSafeInteger)&&Array.isArray(data.hands)&&data.hands.every(id=>typeof id==='string')&&(data.litDay===null||Number.isSafeInteger(data.litDay))&&typeof data.wasDark==='boolean';
}
