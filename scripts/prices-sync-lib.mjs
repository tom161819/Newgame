import { CostError,validateCost,sameCost } from '../src/data/buildingCostAuthoring.js';

// Proposals come as a plain list, as { proposals } or as database documents ({ id, data }) from the Studio.
export function normalizeProposals(input){
  const list=Array.isArray(input)?input:Array.isArray(input?.documents)?input.documents:Array.isArray(input?.proposals)?input.proposals:null;
  if(!list)throw new TypeError('Expected a list of price proposals.');
  return list.map((item,index)=>{const data=item&&typeof item==='object'&&item.data&&typeof item.data==='object'?item.data:item;const doc=item?.data?item.id:undefined;
    return {index,docId:doc??null,buildingId:data?.buildingId??(typeof doc==='string'?doc:undefined),cost:data?.cost,at:typeof data?.at==='string'?data.at:'',by:data?.by??null,note:data?.note??''};});
}
// Decides what to apply. Later proposals (by `at`, then list order) for the same building supersede earlier ones.
export function planPriceSync(input,registry){
  const resources=new Set(registry.costResources().map(d=>d.id)),applied=[],ignored=[],remove=[];
  const proposals=normalizeProposals(input),latest=new Map();
  const removeId=p=>remove.push(p.docId??p.buildingId);
  for(const p of proposals){
    if(typeof p.buildingId!=='string'||!registry.costDefaults.has(p.buildingId)){ignored.push({buildingId:p.buildingId??null,reason:'unknown building'});continue;}
    let cost;try{cost=validateCost(p.cost,resources);}catch(error){ignored.push({buildingId:p.buildingId,reason:error instanceof CostError?{'cost.empty':'empty price','cost.unknownResource':`unknown resource ${error.detail.resource}`,'cost.amount':`invalid amount of ${error.detail.resource}`}[error.code]??'invalid price':'invalid price'});continue;}
    const previous=latest.get(p.buildingId);
    if(previous&&previous.at>p.at){ignored.push({buildingId:p.buildingId,reason:'superseded by a newer proposal'});removeId(p);continue;}
    if(previous){ignored.push({buildingId:p.buildingId,reason:'superseded by a newer proposal'});removeId(previous);}
    latest.set(p.buildingId,{...p,cost});
  }
  for(const p of latest.values()){
    const from=registry.require(p.buildingId).cost;
    if(sameCost(from,p.cost)){ignored.push({buildingId:p.buildingId,reason:'unchanged'});removeId(p);continue;}
    applied.push({buildingId:p.buildingId,from:{...from},cost:p.cost,added:Object.keys(p.cost).filter(id=>!(id in from)),removed:Object.keys(from).filter(id=>!(id in p.cost)),docId:p.docId,by:p.by,note:p.note});
    removeId(p);
  }
  return {applied,ignored,remove};
}
// Replaces the price literal of one building in a definitions source file. Returns null when the building is not there.
// Handles `id:'x'` / `id: 'x'` definitions (the first `cost:{...}` after the id, before the next definition) and the
// military `workshop('x','Name',{...},…)` helper.
export function rewriteCost(text,id,cost){
  const literal=spaced=>{const entries=Object.entries(cost);if(!entries.length)return '{}';return spaced?`{ ${entries.map(([k,v])=>`${k}: ${v}`).join(', ')} }`:`{${entries.map(([k,v])=>`${k}:${v}`).join(',')}}`;};
  const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const workshop=new RegExp(`(workshop\\('${escaped}',\\s*'[^']*',\\s*)(\\{[^}]*\\})`).exec(text);
  if(workshop){const start=workshop.index+workshop[1].length;return text.slice(0,start)+literal(/\{ /.test(workshop[2]))+text.slice(start+workshop[2].length);}
  const head=new RegExp(`id\\s*:\\s*'${escaped}'`).exec(text);if(!head)return null;
  const from=head.index+head[0].length,next=/id\s*:\s*'/g;next.lastIndex=from;const end=next.exec(text)?.index??text.length;
  const match=/cost\s*:\s*(\{[^}]*\})/.exec(text.slice(from,end));if(!match)return null;
  const start=from+match.index+match[0].length-match[1].length;
  return text.slice(0,start)+literal(/\{ /.test(match[1]))+text.slice(start+match[1].length);
}
