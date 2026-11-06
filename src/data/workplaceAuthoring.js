import { validStaffing } from './workplaces.js';
export const WORKPLACE_AUTHORING_KEY='newgame.workplace-authoring.v1';
export function validateWorkplaceOverrides(input,defaults){
  if(!input||input.version!==1||!input.workplaces||typeof input.workplaces!=='object'||Array.isArray(input.workplaces))throw new TypeError('Invalid workplace authoring file');
  const result={};
  for(const [id,value]of Object.entries(input.workplaces)){
    if(!defaults.has(id)||!value||Object.keys(value).some(k=>!['capacity','staffingOutput'].includes(k))||!validStaffing(value))throw new TypeError(`Invalid workplace: ${id}`);
    result[id]={capacity:value.capacity,...(value.staffingOutput?{staffingOutput:[...value.staffingOutput]}:{})};
  }
  return result;
}
export function readWorkplaceAuthoring(storage){try{return JSON.parse(storage?.getItem(WORKPLACE_AUTHORING_KEY)??'null');}catch{return null;}}
