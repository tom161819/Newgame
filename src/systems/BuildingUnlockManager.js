import { buildingIsComplete } from '../game/buildingState.js';

const unlocked=Object.freeze({unlocked:true,missing:[],description:''});
function worldIndex(buildings){
  const complete=new Set(),pending=new Set();
  for(const b of buildings)(buildingIsComplete(b)?complete:pending).add(b.type??b.definition?.id??'tower');
  return {complete,pending};
}
function evaluate(definition,index,registry){
  const missing=(definition.requiresCompletedBuildings??[]).filter(id=>!index.complete.has(id));if(!missing.length)return unlocked;
  const description=missing.map(id=>{const name=registry?.get(id)?.name??id;return index.pending.has(id)?`Requires a completed ${name}`:`Requires: Build a ${name}`;}).join(' · ');
  return {unlocked:false,missing,description};
}
// The placement transaction reads the current world; the UI uses an event-updated index.
export function buildingUnlockStatus(definition,buildings,registry){
  if(!definition.requiresCompletedBuildings?.length)return unlocked;
  return evaluate(definition,worldIndex(buildings),registry);
}
export class BuildingUnlockManager {
  constructor(scene){
    this.scene=scene;this.listeners=new Set();this.changed=()=>this.refresh();
    scene.events?.on('buildings:changed',this.changed);this.unsubscribe=scene.objectRegistry.subscribe(this.changed);this.refresh();
  }
  refresh(){this.index=worldIndex(this.scene.buildings);for(const listener of this.listeners)listener();}
  status(definition,{live=false}={}){return live?buildingUnlockStatus(definition,this.scene.buildings,this.scene.objectRegistry):evaluate(definition,this.index,this.scene.objectRegistry);}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  destroy(){this.scene.events?.off('buildings:changed',this.changed);this.unsubscribe();this.listeners.clear();}
}
