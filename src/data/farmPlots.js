import { buildingIsComplete } from '../game/buildingState.js';
export const FARM_PLOT_CAPACITY=4;
const center=(b,definitionOf)=>{const d=definitionOf(b);return {x:b.x+d.width/2,y:b.y+d.height/2};};
export function farmInRange(farm,plot,definitionOf){
  if(farm?.type!=='farmhouse'||farm.unverified||!buildingIsComplete(farm))return false;
  const a=center(farm,definitionOf),b=center(plot,definitionOf);return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=definitionOf(farm).workRadius;
}
export const farmPlots=(farm,buildings,definitionOf)=>buildings.filter(b=>definitionOf(b).crop&&b.farmId===farm.id);
export function availableFarm(plot,buildings,definitionOf){
  const point=center(plot,definitionOf),distance=farm=>{const c=center(farm,definitionOf);return Math.hypot(c.x-point.x,c.y-point.y);};
  return buildings.filter(farm=>farmInRange(farm,plot,definitionOf)&&farmPlots(farm,buildings,definitionOf).filter(b=>b!==plot).length<FARM_PLOT_CAPACITY).sort((a,b)=>distance(a)-distance(b)||a.id-b.id)[0]??null;
}
export function reconcileFarmPlots(buildings,definitionOf){
  const plots=buildings.filter(b=>definitionOf(b).crop).sort((a,b)=>a.id-b.id),farms=new Map(buildings.filter(b=>b.type==='farmhouse').map(b=>[b.id,b])),used=new Map(),before=new Map(plots.map(b=>[b.id,b.farmId]));
  // Preserve existing valid ownership before filling free slots with orphan plots.
  for(const plot of plots){const farm=farms.get(plot.farmId),n=used.get(plot.farmId)??0;if(!farm||!farmInRange(farm,plot,definitionOf)||n>=FARM_PLOT_CAPACITY)plot.farmId=null;else used.set(farm.id,n+1);}
  for(const plot of plots)if(plot.farmId==null){const farm=availableFarm(plot,buildings,definitionOf);if(farm)plot.farmId=farm.id;}
  return plots.filter(b=>before.get(b.id)!==b.farmId);
}
