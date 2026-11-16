import { t } from '../i18n/index.js';
import { buildingIsComplete } from '../game/buildingState.js';

const unlocked=Object.freeze({unlocked:true,missing:[],description:'',warnings:[],warning:''});
function worldIndex(buildings){
  const complete=new Set(),pending=new Set(),counts=new Map();
  for(const b of buildings){const type=b.type??b.definition?.id??'tower';(buildingIsComplete(b)?complete:pending).add(type);counts.set(type,(counts.get(type)??0)+1);}
  return {complete,pending,counts};
}
function evaluate(definition,index,registry){
  // A building with maxCount (the Castle) cannot be placed again once that many exist, built or planned.
  if(definition.maxCount&&(index.counts.get(definition.id)??0)>=definition.maxCount)return {unlocked:false,missing:[],description:t('unlock.alreadyBuilt'),limit:true};
  const missing=(definition.requiresCompletedBuildings??[]).filter(id=>!index.complete.has(id));if(!missing.length)return advice(definition,index,registry);
  const description=missing.map(id=>{const name=registry?.get(id)?.name??id;return t(index.pending.has(id)?'unlock.pending':'unlock.build',{name});}).join(' · ');
  return {unlocked:false,missing,description};
}
// A recommended earlier building that is not complete yet: the building can still be placed, the menu shows a red
// warning ("Needs a Granary to store food") until it stands.
function advice(definition,index,registry){
  const warnings=(definition.recommendsCompletedBuildings??[]).filter(id=>!index.complete.has(id));if(!warnings.length)return unlocked;
  const text=id=>{const name=registry?.get(id)?.name??id,key=`unlock.needs.${id}`,specific=t(key,{name});return specific!==key?specific:t('unlock.needs',{name});};
  return {unlocked:true,missing:[],description:'',warnings,warning:warnings.map(text).join(' · ')};
}
// The placement transaction reads the current world; the UI uses an event-updated index.
export function buildingUnlockStatus(definition,buildings,registry){
  if(!definition.requiresCompletedBuildings?.length&&!definition.maxCount&&!definition.recommendsCompletedBuildings?.length)return unlocked;
  return evaluate(definition,worldIndex(buildings),registry);
}
export class BuildingUnlockManager {
  constructor(scene){
    this.scene=scene;this.listeners=new Set();this.changed=()=>this.refresh();
    scene.events?.on('buildings:changed',this.changed);this.unsubscribe=scene.objectRegistry.subscribe(this.changed);this.refresh();
  }
  refresh(){this.index=worldIndex(this.scene.buildings);for(const listener of this.listeners)listener();}
  status(definition,{live=false}={}){if(this.scene.sandbox&&!definition.maxCount)return {unlocked:true,missing:[],description:''};return live?buildingUnlockStatus(definition,this.scene.buildings,this.scene.objectRegistry):evaluate(definition,this.index,this.scene.objectRegistry);}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  destroy(){this.scene.events?.off('buildings:changed',this.changed);this.unsubscribe();this.listeners.clear();}
}
