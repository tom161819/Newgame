import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';

// Derived presentation data. Assigned residents occupy seats while travelling,
// recovering or resting; physical presence and work activity do not define it.
export function staffingStatus(scene,building){
  const definition=buildingDefinition(building),capacity=definition.workplace?.capacity;
  if(!buildingIsComplete(building)||!Number.isInteger(capacity)||capacity<=0)return null;
  const ids=new Set(scene.workplaceSystem.records.get(building.id)?.workerIds??[]);
  const count=[...ids].reduce((n,id)=>{const worker=scene.workerSystem.workers.get(id);return n+Number(!!worker?.isAlive&&worker.isSubject!==false&&worker.assignedWorkplaceId===building.id);},0);
  return {building,count,capacity,missing:Math.max(0,capacity-count),tone:count?'partial':'empty'};
}

export class StaffingStatus {
  constructor(scene){
    this.scene=scene;this.records=new Map();this.revision=0;this.checks=0;this.listeners=new Set();
    this.changed=id=>this.refresh(id);this.worldChanged=()=>this.refresh();
    this.unsubscribe=scene.workplaceSystem.onChange(this.changed);scene.events?.on('buildings:changed',this.worldChanged);this.refresh();
  }
  refresh(id=null){
    const buildings=id==null?this.scene.buildings:this.scene.buildings.filter(b=>b.id===id),keep=new Set();let changed=false;
    for(const building of buildings){
      keep.add(building.id);this.checks++;const next=staffingStatus(this.scene,building),previous=this.records.get(building.id);
      if(!next?.missing){if(this.records.delete(building.id))changed=true;continue;}
      if(!previous||previous.building!==building||previous.count!==next.count||previous.capacity!==next.capacity){this.records.set(building.id,next);changed=true;}
    }
    for(const key of this.records.keys())if((id==null||key===id)&&!keep.has(key)){this.records.delete(key);changed=true;}
    if(changed){this.revision++;for(const listener of this.listeners)listener();}
  }
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  destroy(){this.unsubscribe();this.scene.events?.off('buildings:changed',this.worldChanged);this.records.clear();this.listeners.clear();}
}
