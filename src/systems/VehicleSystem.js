import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { VEHICLES,TRANSPORT_MODES } from '../data/logistics.js';

// S12 phase B: vehicles are real objects on the map. A finished Wheelbarrow rolls out of its workshop's output buffer
// beside the workshop; an idle Hauler in Auto or Wheelbarrow mode walks to a free one and takes it, and then carries
// five times as much. Hands mode, a new job or death parks it where the Hauler stands; nothing is ever teleported.
export class VehicleSystem {
  constructor(scene){this.scene=scene;this.vehicles=new Map();this.nextId=1;this.listeners=new Set();}
  get storage(){return this.scene.foodStorage;}
  held(worker){return [...this.vehicles.values()].find(v=>v.operatorId===worker.id&&v.state==='inUse')??null;}
  reservedBy(worker){return [...this.vehicles.values()].find(v=>v.operatorId===worker.id&&v.state==='reserved')??null;}
  mode(worker){return TRANSPORT_MODES.includes(worker.transportMode)?worker.transportMode:'auto';}
  setMode(worker,mode){if(!TRANSPORT_MODES.includes(mode))return false;worker.transportMode=mode;if(mode==='hands'){this.unreserve(worker);if(!worker.cargo)this.park(worker);}return true;}
  free(tile){return this.scene.map[tile.y]?.[tile.x]===0&&![...this.vehicles.values()].some(v=>v.state!=='inUse'&&v.x===tile.x&&v.y===tile.y);}
  create(type,tile){const vehicle={id:`vehicle-${this.nextId++}`,type,x:tile.x,y:tile.y,operatorId:null,state:'parked'};this.vehicles.set(vehicle.id,vehicle);this.changed();return vehicle;}
  changed(){for(const listener of this.listeners)listener();}
  // A finished vehicle leaves the output buffer and stands on a free tile next to the workshop.
  rollOut(){
    const storage=this.storage;if(!storage)return;
    for(const b of this.scene.buildings){const d=buildingDefinition(b),recipe=d.recipe;if(!recipe?.vehicle||!buildingIsComplete(b))continue;
      const output=storage.locations.get(`output-${b.id}`);if(!output)continue;
      for(const [type,amount]of Object.entries(output.stock))for(let i=0;i<amount;i++){
        const tile=towerNeighbors(b).find(t=>this.free(t));if(!tile)return;
        if(!storage.withdraw(output.id,type,1))break;this.create(type,tile);this.scene.updateInventory?.();
      }}
  }
  unreserve(worker){const v=this.reservedBy(worker);if(v){v.operatorId=null;v.state='parked';this.changed();}}
  park(worker){const v=this.held(worker);if(!v)return false;v.x=worker.tile.x;v.y=worker.tile.y;v.operatorId=null;v.state='parked';worker.vehicleType=null;this.changed();return true;}
  // Idle Hauler in Auto/Wheelbarrow mode: go to the nearest free vehicle and take it. Returns true while doing so.
  updateHauler(worker){
    if(worker.profession!=='hauler'){this.unreserve(worker);if(this.held(worker)&&!worker.cargo)this.park(worker);return false;}
    const mode=this.mode(worker);
    if(mode==='hands'){if(!worker.cargo&&!worker.workTask&&this.held(worker))this.park(worker);this.unreserve(worker);return false;}
    if(this.held(worker)||worker.cargo||worker.workTask)return false;
    let target=this.reservedBy(worker);
    if(!target){
      const wanted=mode==='auto'?['wheelbarrow']:[mode],options=[...this.vehicles.values()].filter(v=>v.state==='parked'&&wanted.includes(v.type)&&!VEHICLES[v.type]?.requiresHorse);
      if(!options.length)return false;
      target=options.sort((a,b)=>Math.hypot(a.x-worker.tile.x,a.y-worker.tile.y)-Math.hypot(b.x-worker.tile.x,b.y-worker.tile.y))[0];
      target.operatorId=worker.id;target.state='reserved';this.changed();
    }
    // Taken from its tile or a neighbouring one (someone may be standing on it).
    if(Math.max(Math.abs(worker.tile.x-target.x),Math.abs(worker.tile.y-target.y))<=1&&!worker.nextTile&&!worker.path.length){target.state='inUse';worker.vehicleType=target.type;worker.workState='Waiting';worker.workMessage='Taking a Wheelbarrow';this.changed();return false;}
    worker.workState='Traveling to Target';worker.workMessage='Fetching a Wheelbarrow';
    if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=800;const goals=[{x:target.x,y:target.y},...[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].map(([dx,dy])=>({x:target.x+dx,y:target.y+dy}))].filter(t=>this.scene.map[t.y]?.[t.x]===0);if(!worker.moveTo(goals)){target.operatorId=null;target.state='parked';this.changed();return false;}}
    return true;
  }
  // Death or another job: the vehicle stays where the worker stands; another Hauler can take it.
  release(worker){this.unreserve(worker);this.park(worker);}
  update(){
    this.rollOut();
    for(const v of this.vehicles.values()){if(!v.operatorId)continue;const w=this.scene.workerSystem.workers.get(v.operatorId);
      if(!w?.isAlive){v.operatorId=null;v.state='parked';this.changed();continue;}
      if(v.state==='inUse'){v.x=w.tile.x;v.y=w.tile.y;if(w.profession!=='hauler'&&!w.cargo)this.park(w);}}
  }
  position(v){const w=v.state==='inUse'?this.scene.workerSystem.workers.get(v.operatorId):null;return w?{x:w.position.x,y:w.position.y,direction:w.direction}:{x:v.x+.5,y:v.y+.5,direction:null};}
  exportState(){const modes={};for(const w of this.scene.workerSystem.workers.values())if(w.transportMode&&w.transportMode!=='auto')modes[w.id]=w.transportMode;return {nextId:this.nextId,vehicles:[...this.vehicles.values()].map(v=>({...v})),modes};}
  importState(data){
    this.vehicles=new Map((data?.vehicles??[]).map(v=>[v.id,{...v}]));this.nextId=data?.nextId??1;
    for(const w of this.scene.workerSystem.workers.values()){w.vehicleType=null;w.transportMode=data?.modes?.[w.id]??'auto';}
    for(const v of this.vehicles.values())if(v.state==='inUse'){const w=this.scene.workerSystem.workers.get(v.operatorId);if(w)w.vehicleType=v.type;}
    this.changed();
  }
}
export const vehicleKey=v=>tileKey(v);
