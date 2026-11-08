import { recipeResources } from './production.js';
import { EDIBLE_RESOURCES } from './seasons.js';
import { GATHER_OUTPUTS } from './diagnostics.js';

// m-notice-bar-hlasky (owner requests 66, 70): who makes and who uses a resource, read from the building data
// (recipes, crops and gathering workplaces) instead of hand-written lists. Pure: building definitions in, ids out.
const byMenu=(a,b)=>(a.menuOrder??0)-(b.menuOrder??0)||a.id.localeCompare(b.id);
const recipeOf=(definition,kind)=>definition.recipe?recipeResources(definition,kind):[];
// What a building brings into the kingdom: a recipe's output, its crop or what its workers gather.
export function buildingOutputs(definition){
  return [...new Set([...recipeOf(definition,'output'),...(definition.crop?.resource?[definition.crop.resource]:[]),...(GATHER_OUTPUTS[definition.id]?[GATHER_OUTPUTS[definition.id]]:[])])];
}
export const buildingInputs=definition=>recipeOf(definition,'input');
export const producersOf=(definitions,resource)=>definitions.filter(d=>buildingOutputs(d).includes(resource)).sort(byMenu);
export const consumersOf=(definitions,resource)=>definitions.filter(d=>buildingInputs(d).includes(resource)).sort(byMenu);
// A raw source makes its output from nothing (a field, a lodge, a mine); a workshop needs inputs.
export const isRawSource=definition=>!buildingInputs(definition).length;
// The chain that ends in `resource`, raw source first (bread: Wheat Field → Mill → Bakery). Follows the first producer
// of each input; null when a link has no producer or the chain loops.
export function chainTo(definitions,resource,seen=new Set()){
  if(seen.has(resource))return null;seen.add(resource);
  const producer=producersOf(definitions,resource).find(isRawSource)??producersOf(definitions,resource)[0];if(!producer)return null;
  if(isRawSource(producer))return [producer];
  const before=chainTo(definitions,buildingInputs(producer)[0],seen);return before?[...before,producer]:null;
}
// Low food advice (request 66): every way to food, one entry per edible resource's chain, in menu order. A raw source
// (Hunting Lodge, Fisherman's Hut, Orchard) is one building; processed food lists its whole chain.
export function foodSources(definitions,edible=EDIBLE_RESOURCES){
  const chains=[],keys=new Set();
  for(const resource of edible){const chain=chainTo(definitions,resource);if(!chain)continue;const key=chain.map(d=>d.id).join('>');if(keys.has(key))continue;keys.add(key);chains.push(chain);}
  return chains.sort((a,b)=>(a.length>1)-(b.length>1)||byMenu(a.at(-1),b.at(-1)));
}
// The links between producers and consumers of the given resources (request 70), used for "what's missing" advice:
// a consumer whose input nobody makes, or a raw output nobody uses. Other chains reuse it with other resources.
export function chainLinks(definitions,resources){
  const links=[];
  for(const resource of resources){
    const producers=producersOf(definitions,resource),consumers=consumersOf(definitions,resource);
    if(producers.length&&consumers.length)links.push({resource,producers:producers.map(d=>d.id),consumers:consumers.map(d=>d.id),edible:EDIBLE_RESOURCES.includes(resource)});
  }
  return links;
}
