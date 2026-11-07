// Owner rule (plan m-e1-drevo-start, 7 Nov 2026): wood is the material of the basic buildings, so a kingdom without
// wood and without a Lumberjack Hut could never get wood again. Then one Lumberjack Hut is free: the offer holds while
// no hut stands or is planned and the stores cannot pay its price.
export const FREE_WHEN_STUCK=Object.freeze(['lumberjack_hut']);
export function freeOffer(scene,definition){
  if(!definition||!FREE_WHEN_STUCK.includes(definition.id))return false;
  if((scene.buildings??[]).some(b=>b.type===definition.id))return false;
  return !scene.inventory?.canAfford?.(definition.cost);
}
// The definition the player places: the same building at no cost while the offer holds. The construction site books
// the empty price (investedMaterials {}), so saves keep it free.
export const placeableDefinition=(scene,definition)=>freeOffer(scene,definition)?{...definition,cost:{},freeOffer:true}:definition;
