// Asset Library price editing (#91 part 1, owner request 7 Nov 2026). Prices changed in the Asset Library live only in this
// browser (localStorage), never in a save. Each override is the whole new price of a building: resources missing from it
// are removed from the price, new ones added. A price has at least one resource, each a whole number >= 1.
// "Copy prices JSON" exports the shared proposal format that `prices:sync` and the Studio use:
// { buildingId, cost, by, at, note }.
export const BUILDING_COST_KEY='newgame.building-costs.v1';
export const COST_LIMIT=9999;

export class CostError extends Error { constructor(code,detail={}){super(code);this.code=code;this.detail=detail;} }

const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
// One price: { resourceId: amount }. `resources` is the set of known resource ids.
export function validateCost(cost,resources){
  if(!plain(cost))throw new CostError('cost.invalid');
  const entries=Object.entries(cost);if(!entries.length)throw new CostError('cost.empty');
  for(const [id,amount]of entries){
    if(!resources.has(id))throw new CostError('cost.unknownResource',{resource:id});
    if(!Number.isSafeInteger(amount)||amount<1||amount>COST_LIMIT)throw new CostError('cost.amount',{resource:id});
  }
  return Object.fromEntries(entries);
}
export const sameCost=(a,b)=>{const x=Object.entries(a??{}),y=Object.entries(b??{});return x.length===y.length&&x.every(([id,n])=>b[id]===n);};
// defaults: Map buildingId -> default cost. Overrides equal to the default are dropped.
export function validateCostOverrides(input,defaults,resources){
  if(!input||input.version!==1||!plain(input.costs))throw new CostError('cost.file');
  const result={};
  for(const [id,cost]of Object.entries(input.costs)){
    if(!defaults.has(id))throw new CostError('cost.unknownBuilding',{building:id});
    const valid=validateCost(cost,resources);if(!sameCost(valid,defaults.get(id)))result[id]=valid;
  }
  return result;
}
// What changed against the default price, for the Asset Library rows.
export function costDiff(defaultCost,cost){
  const ids=[...new Set([...Object.keys(defaultCost),...Object.keys(cost)])];
  return ids.map(id=>({resource:id,from:defaultCost[id]??null,to:cost[id]??null,state:!(id in cost)?'removed':!(id in defaultCost)?'added':defaultCost[id]!==cost[id]?'changed':'same'}));
}
export function readBuildingCosts(storage){try{return JSON.parse(storage?.getItem(BUILDING_COST_KEY)??'null');}catch{return null;}}
export function writeBuildingCosts(storage,overrides){
  try{if(Object.keys(overrides).length)storage?.setItem(BUILDING_COST_KEY,JSON.stringify({version:1,costs:overrides}));else storage?.removeItem(BUILDING_COST_KEY);return true;}catch{return false;}
}
export function priceProposals(overrides,{by='asset-library',at=new Date().toISOString(),note=''}={}){
  return Object.entries(overrides).map(([buildingId,cost])=>({buildingId,cost:{...cost},by,at,note}));
}
