import { FOOD_RESOURCE_IDS,FOOD_RULES } from '../data/foodProduction.js';
import { PLAYER_START } from '../game/config.js';
import { buildingIsComplete } from '../game/buildings.js';
import { physicalResources,materialResources,storageResources,stockLocationId,carryCapacity,equipmentResources } from '../data/logistics.js';

export function validateFoodState(s,registry,{check,number,integer,array}){
  const storage=s.foodStorage,production=s.foodProduction;
  if(!storage){check(!production&&!s.buildings.some(b=>buildingIsComplete(b)&&(registry.require(b.type).storage||registry.require(b.type).recipe))&&!(s.workers??[]).some(w=>['foodPickup','foodDeliver','produce'].includes(w.workTask?.kind)));return;}
  check(storage&&production);array(storage.locations);array(storage.reservations);array(production.records);integer(storage.nextReservation,1);integer(production.nextTransfer,1);
  const physical=storage.physicalMaterials===true,resources=physical?physicalResources(registry):[...FOOD_RESOURCE_IDS];
  const expected=physical?new Map():new Map([['food-camp',{kind:'fallback',buildingId:null,x:PLAYER_START.x,y:PLAYER_START.y,width:1,height:1,capacity:FOOD_RULES.fallbackCapacity,allowed:[...FOOD_RESOURCE_IDS]}]]);
  if(physical){
    check(s.buildings.filter(b=>b.type==='starter_stockpile').length<=1);
    for(const l of storage.locations)if(l.kind==='fallback'&&l.buildingId==null){
      check(['food-camp','legacy-materials'].includes(l.id));integer(l.x,0,99);integer(l.y,0,99);
      expected.set(l.id,{kind:'fallback',buildingId:null,x:l.x,y:l.y,width:1,height:1,capacity:l.id==='legacy-materials'?40:30,allowed:l.id==='legacy-materials'?materialResources(registry):[...FOOD_RESOURCE_IDS]});
    }
  }
  const producers=s.buildings.filter(b=>buildingIsComplete(b)&&registry.require(b.type).recipe);
  for(const b of s.buildings)if(buildingIsComplete(b)){
    const d=registry.require(b.type),base={buildingId:b.id,x:b.x,y:b.y,width:d.width,height:d.height};
    if(d.storage&&(physical||!d.storage.accepts))expected.set(stockLocationId(b),{...base,kind:d.starter?'fallback':'storage',capacity:d.storage.capacity,allowed:storageResources(d,registry)});
    if(d.recipe)for(const kind of ['input','output'])expected.set(`${kind}-${b.id}`,{...base,kind,capacity:d.bufferCapacity,allowed:Object.keys(d.recipe[kind])});
    if(d.kit)expected.set(`kit-${b.id}`,{...base,kind:'kit',capacity:d.kit.capacity,allowed:equipmentResources(registry)});
  }
  const sites=new Map();
  if(physical)for(const b of s.buildings){
    if(!buildingIsComplete(b)&&s.logistics?.materialsVersion===1)check(b.materialSupply);
    if(!b.materialSupply)continue;check(!buildingIsComplete(b));
    const d=registry.require(b.type),supply=b.materialSupply,required=Object.fromEntries(Object.entries(d.cost).filter(([id])=>resources.includes(id)));
    check(supply.version===1&&typeof supply.legacyPaid==='boolean'&&JSON.stringify(supply.required)===JSON.stringify(required));sites.set(b.id,b);
    expected.set(`site-${b.id}`,{kind:'site',buildingId:b.id,x:b.x,y:b.y,width:d.width,height:d.height,capacity:Object.values(required).reduce((n,v)=>n+v,0),allowed:Object.keys(required)});
  }
  const locations=new Map(),reservations=new Map(),used=l=>Object.values(l.stock).reduce((n,v)=>n+v,0);
  check(storage.locations.length===expected.size);
  for(const l of storage.locations){
    const e=expected.get(l.id);check(e&&!locations.has(l.id));locations.set(l.id,l);
    for(const [key,value]of Object.entries(e))check(JSON.stringify(l[key])===JSON.stringify(value));
    check(l.stock&&typeof l.stock==='object'&&!Array.isArray(l.stock));for(const [id,n]of Object.entries(l.stock)){check(l.allowed.includes(id));integer(n,1);}
    if(l.haulExcluded!==undefined){check(l.haulExcluded&&typeof l.haulExcluded==='object'&&!Array.isArray(l.haulExcluded));for(const [id,n]of Object.entries(l.haulExcluded)){check(l.allowed.includes(id));integer(n,1,l.stock[id]??0);}}
    integer(l.legacyOverflow);check(l.legacyOverflow===Math.max(0,used(l)-l.capacity));check(l.kind==='fallback'&&l.buildingId==null||l.legacyOverflow===0);
  }
  for(const r of storage.reservations){
    const l=locations.get(r.locationId);check(l&&!reservations.has(r.id)&&['stock','capacity'].includes(r.kind)&&l.allowed.includes(r.resource));reservations.set(r.id,r);
    const id=String(r.id).match(/^food-reservation-(\d+)$/);check(id);integer(Number(id[1]),1,storage.nextReservation-1);integer(r.amount,1,r.siteId!=null&&r.owner===`site-${r.siteId}`?Number.MAX_SAFE_INTEGER:38);check(typeof r.owner==='string');
    if(r.siteId!=null)check(sites.has(r.siteId)&&(sites.get(r.siteId).materialSupply.required[r.resource]??0)>0);
  }
  for(const l of locations.values()){
    const incoming=[...reservations.values()].filter(r=>r.locationId===l.id&&r.kind==='capacity').reduce((n,r)=>n+r.amount,0);check(used(l)+incoming<=l.capacity+l.legacyOverflow);
    for(const resource of l.allowed)check([...reservations.values()].filter(r=>r.kind==='stock'&&r.locationId===l.id&&r.resource===resource).reduce((n,r)=>n+r.amount,0)<=(l.stock[resource]??0));
    if(l.kind==='fallback'||l.kind==='storage')for(const resource of l.allowed){
      const count=[...locations.values()].filter(p=>['fallback','storage'].includes(p.kind)).reduce((n,p)=>n+(p.stock[resource]??0)-[...reservations.values()].filter(r=>r.kind==='stock'&&r.locationId===p.id&&r.resource===resource).reduce((a,r)=>a+r.amount,0),0);
      check((s.inventory[resource]??0)===count);
    }
  }
  const capacityRefs=new Set(),stockRefs=new Set(),records=new Map(),groundRefs=new Set((s.workers??[]).filter(w=>['mineDrop','collectMeat'].includes(w.workTask?.kind)).map(w=>w.workTask.targetId));
  for(const r of reservations.values())if(r.siteId!=null&&r.owner===`site-${r.siteId}`){check(r.kind==='stock'&&['storage','fallback'].includes(locations.get(r.locationId)?.kind));stockRefs.add(r.id);}
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
    if(['foodPickup','foodDeliver','produce','harvest','chopTree','mineDeposit'].includes(t.kind)&&t.transferId){const match=t.transferId.match(/^food-transfer-(\d+)$/);check(match);integer(Number(match[1]),1,production.nextTransfer-1);}
    if(t.kind==='produce'){const b=producers.find(b=>b.id===t.targetId);check(b&&w.assignedWorkplaceId===b.id&&registry.require(b.type).workplace.profession===w.profession&&adjacent(locations.get(`input-${b.id}`),t.goal));continue;}
    if(t.kind==='harvest'){
      const crop=registry.require(s.buildings.find(b=>b.id===t.targetId).type).crop;check(t.capacityReservation&&locations.has(t.destinationId));capacity(t.capacityReservation,t.transferId,crop.resource,crop.yield);continue;
    }
    if(t.kind==='chopTree'){const tree=s.resources.find(r=>r.natural?.id===t.targetId),yieldAmount=registry.require(tree?.type).tree.wood;check(t.amount===yieldAmount&&locations.has(t.destinationId)&&['fallback','storage'].includes(locations.get(t.destinationId).kind));capacity(t.capacityReservation,t.transferId,'wood',yieldAmount);check(reservations.get(t.capacityReservation)?.locationId===t.destinationId);continue;}
    if(t.kind==='mineDeposit'){const home=s.buildings.find(b=>b.id===w.assignedWorkplaceId),resource=registry.require(home.type).mining.resource;check(t.amount===1&&locations.has(t.destinationId)&&['fallback','storage'].includes(locations.get(t.destinationId).kind));capacity(t.capacityReservation,t.transferId,resource,1);check(reservations.get(t.capacityReservation)?.locationId===t.destinationId);continue;}
    if(!['foodPickup','foodDeliver'].includes(t.kind))continue;
    check(resources.includes(t.resource)&&locations.has(t.destinationId));integer(t.amount,1,carryCapacity({...w,vehicleType:s.vehicles?.vehicles.find(v=>v.operatorId===w.id&&v.state==='inUse')?.type??null},t.resource));
    const sourceDrop=t.sourceDropId&&s.drops.find(d=>d.id===t.sourceDropId);
    if(t.kind==='foodPickup'&&t.sourceDropId){check(sourceDrop&&sourceDrop.resource===t.resource&&sourceDrop.amount>=t.amount&&t.goal.x===sourceDrop.tile.x&&t.goal.y===sourceDrop.tile.y&&!groundRefs.has(t.sourceDropId));groundRefs.add(t.sourceDropId);}
    else check(adjacent(locations.get(t.kind==='foodPickup'?t.sourceId:t.destinationId),t.goal));
    if(t.hauling!==undefined){check(t.hauling===true&&w.profession==='hauler');if(t.kind==='foodDeliver'){number(t.loadedDistance);number(t.loadedPosition?.x,0,100);number(t.loadedPosition?.y,0,100);}}
    if(t.kind==='foodPickup'){
      if(t.sourceDropId)check(!t.stockReservation&&(t.hauling||t.naturalHarvest===true||t.naturalMining===true||t.siteId!=null&&w.profession==='builder'));
      else{const stock=reservations.get(t.stockReservation);check(stock?.kind==='stock'&&stock.locationId===t.sourceId&&stock.resource===t.resource&&stock.amount===t.amount&&stock.owner===t.transferId&&!stockRefs.has(stock.id));stockRefs.add(stock.id);}check(!w.cargo);
    }else check(w.cargo?.resource===t.resource&&w.cargo.amount>=t.amount);
    if(t.naturalHarvest!==undefined)check(t.naturalHarvest===true&&w.profession==='woodcutter'&&s.buildings.some(b=>b.id===w.assignedWorkplaceId&&b.type==='lumberjack_hut')&&t.resource==='wood');
    if(t.naturalMining!==undefined)check(t.naturalMining===true&&w.profession==='miner'&&s.buildings.some(b=>b.id===w.assignedWorkplaceId&&registry.require(b.type).mining?.resource===t.resource)&&!t.naturalHarvest);
    const cap=reservations.get(t.capacityReservation);
    if(t.siteId!=null){check(sites.has(t.siteId)&&t.destinationId===`site-${t.siteId}`&&cap?.siteId===t.siteId);if(t.kind==='foodPickup')check(t.sourceDropId?sourceDrop?.siteId===t.siteId:reservations.get(t.stockReservation)?.siteId===t.siteId);else check(w.cargo?.siteId===t.siteId);}
    if(t.outputBuildingId&&t.kind==='foodPickup'&&records.get(t.outputBuildingId)?.outputReservation===t.capacityReservation){check(cap?.resource===t.resource&&cap.amount===t.amount);}
    else capacity(t.capacityReservation,t.transferId,t.resource,t.amount);
    check(cap?.locationId===t.destinationId);
  }
  if(physical){
    const royal=s.kingLogistics;check(royal);integer(royal.nextId,1);
    const cargo=s.player.cargo;if(cargo){check(resources.includes(cargo.resource));integer(cargo.amount,1,20);}
    if(cargo?.transportCancelled!==undefined)check(typeof cargo.transportCancelled==='boolean');
    array(s.player.pendingWorkRewards,100000);for(const event of s.player.pendingWorkRewards){check(cargo&&['resourceCollected','dropCollected'].includes(event.type)&&resources.includes(event.objectType));integer(event.quantity,1);if(event.contributionRatio!==undefined)number(event.contributionRatio);}
    if(royal.workflowSiteId!=null)check(sites.has(royal.workflowSiteId));if(royal.buildAfter!==undefined)check(typeof royal.buildAfter==='boolean'&&(!royal.buildAfter||royal.workflowSiteId!=null));if(royal.nextRetry!==undefined)number(royal.nextRetry);
    const t=royal.task;if(t){check(['deposit','stockPickup','siteDeposit','withdraw'].includes(t.kind)&&resources.includes(t.resource)&&(t.kind==='withdraw'||locations.has(t.destinationId)));integer(t.amount,1,20);number(t.retryAt);
      if(t.kind==='withdraw'){
        const r=reservations.get(t.stockReservation),source=locations.get(t.sourceId);check(!cargo&&r?.kind==='stock'&&r.siteId==null&&r.owner===t.id&&r.locationId===t.sourceId&&r.resource===t.resource&&r.amount===t.amount&&!stockRefs.has(r.id)&&['storage','fallback'].includes(source?.kind)&&adjacent(source,t.goal)&&t.capacityReservation==null);stockRefs.add(r.id);
      }else if(t.kind==='stockPickup'){
        check(!cargo&&sites.has(t.siteId)&&t.destinationId===`site-${t.siteId}`);
        if(t.sourceDropId){const drop=s.drops.find(d=>d.id===t.sourceDropId);check(drop&&drop.siteId===t.siteId&&drop.resource===t.resource&&drop.amount>=t.amount&&t.goal.x===drop.tile.x&&t.goal.y===drop.tile.y&&!groundRefs.has(drop.id));groundRefs.add(drop.id);}
        else{const r=reservations.get(t.stockReservation);check(r?.kind==='stock'&&r.owner===t.id&&r.siteId===t.siteId&&r.resource===t.resource&&r.amount===t.amount&&r.locationId===t.sourceId&&!stockRefs.has(r.id)&&adjacent(locations.get(t.sourceId),t.goal));stockRefs.add(r.id);}
      }else{check(cargo&&cargo.resource===t.resource&&cargo.amount>=t.amount&&adjacent(locations.get(t.destinationId),t.goal));if(t.kind==='siteDeposit')check(cargo.siteId===t.siteId&&t.destinationId===`site-${t.siteId}`);}
      if(t.siteId!=null)check(sites.has(t.siteId));
      const match=String(t.id).match(/^king-transfer-(\d+)$/);check(match);integer(Number(match[1]),1,royal.nextId-1);if(t.kind!=='withdraw'){capacity(t.capacityReservation,t.id,t.resource,t.amount);check(reservations.get(t.capacityReservation)?.locationId===t.destinationId);}
    }
  }
  const actors=[s.player,...(s.workers??[])];
  for(const actor of actors)if(actor.cargo?.siteId!=null)check(sites.has(actor.cargo.siteId)&&(sites.get(actor.cargo.siteId).materialSupply.required[actor.cargo.resource]??0)>0);
  const dropKeys=new Set();for(const drop of s.drops){if(drop.siteId!=null)check(sites.has(drop.siteId)&&(sites.get(drop.siteId).materialSupply.required[drop.resource]??0)>0);const key=`${drop.tile.x},${drop.tile.y}:${drop.resource}:${drop.siteId??'free'}`;check(!dropKeys.has(key));dropKeys.add(key);}
  for(const [id,b]of sites){
    const location=locations.get(`site-${id}`);for(const [resource,required]of Object.entries(b.materialSupply.required)){
      const held=[...reservations.values()].filter(r=>r.kind==='stock'&&r.siteId===id&&r.resource===resource).reduce((n,r)=>n+r.amount,0),carried=actors.reduce((n,a)=>n+(a.cargo?.siteId===id&&a.cargo.resource===resource?a.cargo.amount:0),0),ground=s.drops.filter(d=>d.siteId===id&&d.resource===resource).reduce((n,d)=>n+d.amount,0),delivered=location.stock[resource]??0;
      check(held+carried+ground+delivered===required);if(b.construction.workDone>0)check(delivered===required);
    }
  }
  for(const r of reservations.values())check(r.kind==='stock'?stockRefs.has(r.id):capacityRefs.has(r.id));
}
