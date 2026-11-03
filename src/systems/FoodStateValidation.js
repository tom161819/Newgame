import { FOOD_RESOURCE_IDS,FOOD_RULES } from '../data/foodProduction.js';
import { PLAYER_START } from '../game/config.js';
import { buildingIsComplete } from '../game/buildings.js';

export function validateFoodState(s,registry,{check,number,integer,array}){
  const storage=s.foodStorage,production=s.foodProduction;
  if(!storage){check(!production&&!s.buildings.some(b=>buildingIsComplete(b)&&(registry.require(b.type).storage||registry.require(b.type).recipe))&&!(s.workers??[]).some(w=>['foodPickup','foodDeliver','produce'].includes(w.workTask?.kind)));return;}
  check(storage&&production);array(storage.locations);array(storage.reservations);array(production.records);integer(storage.nextReservation,1);integer(production.nextTransfer,1);
  const expected=new Map([['food-camp',{kind:'fallback',buildingId:null,x:PLAYER_START.x,y:PLAYER_START.y,width:1,height:1,capacity:FOOD_RULES.fallbackCapacity,allowed:[...FOOD_RESOURCE_IDS]}]]);
  const producers=s.buildings.filter(b=>buildingIsComplete(b)&&registry.require(b.type).recipe);
  for(const b of s.buildings)if(buildingIsComplete(b)){
    const d=registry.require(b.type),base={buildingId:b.id,x:b.x,y:b.y,width:d.width,height:d.height};
    if(d.storage)expected.set(`granary-${b.id}`,{...base,kind:'storage',capacity:d.storage.capacity,allowed:d.storage.resources});
    if(d.recipe)for(const kind of ['input','output'])expected.set(`${kind}-${b.id}`,{...base,kind,capacity:d.bufferCapacity,allowed:Object.keys(d.recipe[kind])});
  }
  const locations=new Map(),reservations=new Map(),used=l=>Object.values(l.stock).reduce((n,v)=>n+v,0);
  check(storage.locations.length===expected.size);
  for(const l of storage.locations){
    const e=expected.get(l.id);check(e&&!locations.has(l.id));locations.set(l.id,l);
    for(const [key,value]of Object.entries(e))check(JSON.stringify(l[key])===JSON.stringify(value));
    check(l.stock&&typeof l.stock==='object'&&!Array.isArray(l.stock));for(const [id,n]of Object.entries(l.stock)){check(l.allowed.includes(id));integer(n,1);}
    integer(l.legacyOverflow);check(l.legacyOverflow===Math.max(0,used(l)-l.capacity));check(l.kind==='fallback'||l.legacyOverflow===0);
  }
  for(const r of storage.reservations){
    const l=locations.get(r.locationId);check(l&&!reservations.has(r.id)&&['stock','capacity'].includes(r.kind)&&l.allowed.includes(r.resource));reservations.set(r.id,r);
    const id=String(r.id).match(/^food-reservation-(\d+)$/);check(id);integer(Number(id[1]),1,storage.nextReservation-1);integer(r.amount,1,FOOD_RULES.carryCapacity);check(typeof r.owner==='string');
  }
  for(const l of locations.values()){
    const incoming=[...reservations.values()].filter(r=>r.locationId===l.id&&r.kind==='capacity').reduce((n,r)=>n+r.amount,0);check(used(l)+incoming<=l.capacity+l.legacyOverflow);
    for(const resource of l.allowed)check([...reservations.values()].filter(r=>r.kind==='stock'&&r.locationId===l.id&&r.resource===resource).reduce((n,r)=>n+r.amount,0)<=(l.stock[resource]??0));
    if(l.kind==='fallback'||l.kind==='storage')for(const resource of l.allowed){
      const count=[...locations.values()].filter(p=>['fallback','storage'].includes(p.kind)).reduce((n,p)=>n+(p.stock[resource]??0)-[...reservations.values()].filter(r=>r.kind==='stock'&&r.locationId===p.id&&r.resource===resource).reduce((a,r)=>a+r.amount,0),0);
      check((s.inventory[resource]??0)===count);
    }
  }
  const capacityRefs=new Set(),stockRefs=new Set(),records=new Map();
  const adjacent=(l,t)=>l&&((t.x>=l.x&&t.x<l.x+l.width&&(t.y===l.y-1||t.y===l.y+l.height))||(t.y>=l.y&&t.y<l.y+l.height&&(t.x===l.x-1||t.x===l.x+l.width))||(l.kind==='fallback'&&t.x===l.x&&t.y===l.y));
  const capacity=(id,owner,resource,amount)=>{if(id==null)return;const r=reservations.get(id);check(r?.kind==='capacity'&&r.owner===owner&&r.resource===resource&&r.amount===amount&&!capacityRefs.has(id));capacityRefs.add(id);};
  check(production.records.length===producers.length);
  for(const r of production.records){
    const b=producers.find(b=>b.id===r.buildingId);check(b&&!records.has(b.id));records.set(b.id,r);check(typeof r.auto==='boolean');integer(r.nextCycle,1);integer(r.completed,0,r.nextCycle-1);
    check(r.nextCycle===1+r.completed+(r.cycle?1:0));
    const recipe=registry.require(b.type).recipe,[outId,outAmount]=Object.entries(recipe.output)[0];
    if(r.cycle){
      const c=r.cycle,match=String(c.id).match(new RegExp(`^food-cycle-${b.id}-(\\d+)$`));check(match);integer(Number(match[1]),1,r.nextCycle-1);
      check(!r.outputReservation&&c.state==='building'&&c.requiredWork===recipe.duration&&JSON.stringify(c.inputs)===JSON.stringify(recipe.input));number(c.workDone,0,c.requiredWork);number(c.progress,0,100);check(Math.abs(c.progress-100*c.workDone/c.requiredWork)<1e-7);number(c.startedAt,0,s.time.totalElapsed);
      check(c.contributions&&typeof c.contributions==='object');let total=0;for(const [id,work]of Object.entries(c.contributions)){check(s.workers?.some(w=>w.id===id));number(work,0,c.requiredWork);total+=work;}check(Math.abs(total-c.workDone)<1e-5);
      capacity(c.outputReservation,c.id,outId,outAmount);
    }else if(r.outputReservation){const cap=reservations.get(r.outputReservation);capacity(r.outputReservation,cap?.owner,outId,outAmount);check((locations.get(`output-${b.id}`).stock[outId]??0)>=outAmount);}
  }
  for(const w of s.workers??[]){
    const t=w.workTask;if(!t)continue;
    if(['foodPickup','foodDeliver','produce','harvest'].includes(t.kind)&&t.transferId){const match=t.transferId.match(/^food-transfer-(\d+)$/);check(match);integer(Number(match[1]),1,production.nextTransfer-1);}
    if(t.kind==='produce'){const b=producers.find(b=>b.id===t.targetId);check(b&&w.assignedWorkplaceId===b.id&&registry.require(b.type).workplace.profession===w.profession&&adjacent(locations.get(`input-${b.id}`),t.goal));continue;}
    if(t.kind==='harvest'){
      const crop=registry.require(s.buildings.find(b=>b.id===t.targetId).type).crop;check(t.capacityReservation&&locations.has(t.destinationId));capacity(t.capacityReservation,t.transferId,crop.resource,crop.yield);continue;
    }
    if(!['foodPickup','foodDeliver'].includes(t.kind))continue;
    check(FOOD_RESOURCE_IDS.includes(t.resource)&&locations.has(t.destinationId));integer(t.amount,1,FOOD_RULES.carryCapacity);
    check(adjacent(locations.get(t.kind==='foodPickup'?t.sourceId:t.destinationId),t.goal));
    if(t.kind==='foodPickup'){
      const stock=reservations.get(t.stockReservation);check(stock?.kind==='stock'&&stock.locationId===t.sourceId&&stock.resource===t.resource&&stock.amount===t.amount&&stock.owner===t.transferId&&!stockRefs.has(stock.id));stockRefs.add(stock.id);check(!w.cargo);
    }else check(w.cargo?.resource===t.resource&&w.cargo.amount>=t.amount);
    const cap=reservations.get(t.capacityReservation);
    if(t.outputBuildingId&&t.kind==='foodPickup'&&records.get(t.outputBuildingId)?.outputReservation===t.capacityReservation){check(cap?.resource===t.resource&&cap.amount===t.amount);}
    else capacity(t.capacityReservation,t.transferId,t.resource,t.amount);
    check(cap?.locationId===t.destinationId);
  }
  for(const r of reservations.values())check(r.kind==='stock'?stockRefs.has(r.id):capacityRefs.has(r.id));
}
