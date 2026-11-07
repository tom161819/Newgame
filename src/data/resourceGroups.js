// m-ui-prehled-surovin (owner 7 Nov 2026): one definition of resource groups for the whole UI (top bar, store
// preview, Marketplace). The group follows the resource's registry data, not a hand-written list per screen.
export const RESOURCE_GROUPS=Object.freeze(['gold','materials','foodRaw','food','equipment']);
// Hover preview of a store: shown after the pointer rests this long (ms); a quick pass shows nothing.
export const STORE_PREVIEW_DELAY_MS=600;
export function resourceGroup(definition,registry){
  if(!definition)return null;
  if(definition.id==='gold')return 'gold';
  if(definition.edible===true)return 'food';
  if(['equipment','vehicle'].includes(definition.resourceCategory))return 'equipment';
  if(registry?.get?.('granary')?.storage?.resources?.includes(definition.id))return 'foodRaw';
  return 'materials';
}
// Resources sorted by group, then by their inventory order.
export function groupedResources(definitions,registry){
  const rank=d=>RESOURCE_GROUPS.indexOf(resourceGroup(d,registry));
  return [...definitions].sort((a,b)=>rank(a)-rank(b)||(a.inventoryOrder??100)-(b.inventoryOrder??100));
}
