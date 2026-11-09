import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { t } from '../i18n/index.js';

// m-drobnosti-083 (report 0.83.0 point 7): the output line of a workplace window. Free places ("2 workers missing") and
// assigned workers who are not at work just now ("1 away from the building") are told apart, so a Barracks with 1 of 5
// assigned and that soldier walking home reads "4 workers missing, 1 away", not "5 missing (0 present)".
// `summary`: WorkplaceSystem.summary – count (assigned), capacity, present, output.
export function staffingLine({count=0,capacity=0,present=0,output=0}){
  const open=Math.max(0,capacity-count),away=Math.max(0,count-present),parts=[];
  if(open)parts.push(t('staffing.open',{count:open}));if(away)parts.push(t('staffing.away',{count:away}));
  const head=t('staffing.output',{percent:Math.round(output*100)});return parts.length?`${head} – ${parts.join(', ')}`:head;
}

// Derived presentation data. Assigned residents occupy seats while travelling,
// recovering or resting; physical presence and work activity do not define it.
export function staffingStatus(scene,building){
  const definition=buildingDefinition(building),capacity=definition.workplace?.capacity;
  if(!buildingIsComplete(building)||building.depleted||!Number.isInteger(capacity)||capacity<=0)return null;
  const ids=new Set(scene.workplaceSystem.records.get(building.id)?.workerIds??[]);
  const count=[...ids].reduce((n,id)=>{const worker=scene.workerSystem.workers.get(id);return n+Number(!!worker?.isAlive&&worker.isSubject!==false&&worker.assignedWorkplaceId===building.id);},0);
  // m-zamestnani-2: a building with employment switched off shows its own sign instead of missing workers.
  const disabled=!!scene.employment?.blockReason?.(building);
  return {building,count,capacity,missing:Math.max(0,capacity-count),tone:disabled?'disabled':count?'partial':'empty'};
}

export class StaffingStatus {
  constructor(scene){
    this.scene=scene;this.records=new Map();this.revision=0;this.checks=0;this.listeners=new Set();
    this.changed=id=>this.refresh(id);this.worldChanged=()=>this.refresh();
    this.unsubscribe=scene.workplaceSystem.onChange(this.changed);this.offEmployment=scene.employment?.onChange?.(this.worldChanged)??(()=>{});scene.events?.on('buildings:changed',this.worldChanged);this.refresh();
  }
  refresh(id=null){
    const buildings=id==null?this.scene.buildings:this.scene.buildings.filter(b=>b.id===id),keep=new Set();let changed=false;
    for(const building of buildings){
      keep.add(building.id);this.checks++;const next=staffingStatus(this.scene,building),previous=this.records.get(building.id);
      if(!next?.missing){if(this.records.delete(building.id))changed=true;continue;}
      if(!previous||previous.building!==building||previous.count!==next.count||previous.capacity!==next.capacity||previous.tone!==next.tone){this.records.set(building.id,next);changed=true;}
    }
    for(const key of this.records.keys())if((id==null||key===id)&&!keep.has(key)){this.records.delete(key);changed=true;}
    if(changed){this.revision++;for(const listener of this.listeners)listener();}
  }
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  destroy(){this.unsubscribe();this.offEmployment?.();this.scene.events?.off('buildings:changed',this.worldChanged);this.records.clear();this.listeners.clear();}
}
