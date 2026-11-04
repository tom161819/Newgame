import { buildingIsComplete } from '../game/buildings.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';

// Repair only obsolete instructions/bookings, never physical quantities. Bad
// stock, capacities, duplicate IDs and inconsistent amounts still fail the full
// validator. The saved inventory is a checked projection of the old bookings.
export function repairTransportInstructions(state,registry,check){
  const storage=state.foodStorage;if(!storage||!Array.isArray(storage.locations)||!Array.isArray(storage.reservations))return;
  const entries=storage.locations,reservations=storage.reservations;
  if(entries.some(l=>!l||!l.stock)||reservations.some(r=>!r)||new Set(entries.map(l=>l.id)).size!==entries.length||new Set(reservations.map(r=>r.id)).size!==reservations.length)return;
  if(!state.inventory||typeof state.inventory!=='object'||Array.isArray(state.inventory)||entries.some(l=>Object.values(l.stock).some(n=>!Number.isSafeInteger(n)||n<1))||reservations.some(r=>!Number.isSafeInteger(r.amount)||r.amount<1||!['stock','capacity'].includes(r.kind)||registry.get(r.resource)?.category!=='resource'))return;
  const locations=new Map(entries.map(l=>[l.id,l])),bookings=new Map(reservations.map(r=>[r.id,r])),released=new Set();
  for(const l of entries)for(const [id,quantity]of Object.entries(l.stock))if(reservations.filter(r=>r.kind==='stock'&&r.locationId===l.id&&r.resource===id).reduce((n,r)=>n+r.amount,0)>quantity)return;
  const resources=registry.byCategory('resource').filter(d=>d.collectible&&(storage.physicalMaterials?d.id!=='gold':FOOD_RESOURCE_IDS.includes(d.id))).map(d=>d.id);
  const summary=()=>Object.fromEntries(resources.map(id=>[id,entries.filter(l=>['fallback','storage'].includes(l.kind)).reduce((n,l)=>n+(l.stock[id]??0)-reservations.filter(r=>!released.has(r.id)&&r.kind==='stock'&&r.locationId===l.id&&r.resource===id).reduce((v,r)=>v+r.amount,0),0)]));
  const before=summary(),sites=new Set((state.buildings??[]).filter(b=>!buildingIsComplete(b)).map(b=>b.id));let changed=false;
  const adjacent=(l,t)=>l&&t&&Number.isInteger(t.x)&&Number.isInteger(t.y)&&((t.x>=l.x&&t.x<l.x+l.width&&(t.y===l.y-1||t.y===l.y+l.height))||(t.y>=l.y&&t.y<l.y+l.height&&(t.x===l.x-1||t.x===l.x+l.width))||(l.kind==='fallback'&&t.x===l.x&&t.y===l.y));
  const releaseTask=t=>{
    for(const r of reservations){if(r.owner!==(t.transferId??t.id))continue;
      if(r.kind==='stock'&&r.siteId!=null&&sites.has(r.siteId))r.owner=`site-${r.siteId}`;else released.add(r.id);
    }changed=true;
  };
  const invalid=(t,actor,royal=false)=>{
    const pickup=t.kind===(royal?'stockPickup':'foodPickup')||royal&&t.kind==='withdraw',capacity=bookings.get(t.capacityReservation),destination=locations.get(t.destinationId);
    if(pickup&&actor.cargo||!pickup&&!actor.cargo)return false; // Inconsistent ownership is corruption, not a stale route.
    if(t.kind!=='withdraw'&&(!destination||!capacity))return true;
    if(pickup){
      if(t.sourceDropId){const drop=state.drops?.find(d=>d.id===t.sourceDropId);return !drop||!t.goal||drop.tile.x!==t.goal.x||drop.tile.y!==t.goal.y;}
      return !bookings.has(t.stockReservation)||!adjacent(locations.get(t.sourceId),t.goal);
    }return !adjacent(destination,t.goal);
  };
  for(const worker of state.workers??[]){
    const task=worker.workTask;if(!worker.isAlive||!task)continue;
    const transport=['foodPickup','foodDeliver'].includes(task.kind),harvest=task.kind==='harvest'&&!bookings.has(task.capacityReservation);
    if(transport&&invalid(task,worker)||harvest){
      releaseTask(task);if(task.hauling&&worker.cargo)worker.cargo.transportCancelled=true;
      if(harvest){const plot=state.farming?.records?.find(r=>r.buildingId===task.targetId);if(plot?.reservedBy===worker.id)plot.reservedBy=null;}
      worker.workTask=null;worker.path=[];worker.aiCooldown=0;worker.workState='Waiting';worker.workMessage='Delivery route reset; cargo preserved';
    }
  }
  const royal=state.kingLogistics;if(royal?.task&&['deposit','stockPickup','siteDeposit','withdraw'].includes(royal.task.kind)&&invalid(royal.task,state.player,true)){
    releaseTask(royal.task);royal.task=null;state.player.order=null;state.player.path=[];state.player.roofContinuation=null;
  }
  if(royal?.workflowSiteId!=null&&!sites.has(royal.workflowSiteId)){royal.workflowSiteId=null;changed=true;}
  for(const actor of [state.player,...(state.workers??[])])if(actor?.cargo?.siteId!=null&&!sites.has(actor.cargo.siteId)){delete actor.cargo.siteId;actor.cargo.transportCancelled=true;changed=true;}
  if(!changed)return;
  for(const [id,quantity]of Object.entries(before))check((state.inventory?.[id]??0)===quantity);
  storage.reservations=reservations.filter(r=>!released.has(r.id));const after=summary();
  for(const [id,quantity]of Object.entries(after))if(quantity||Object.hasOwn(state.inventory,id)||quantity!==before[id])state.inventory[id]=quantity;
  for(const record of state.foodProduction?.records??[]){
    if(record.outputReservation&&!bookings.has(record.outputReservation))record.outputReservation=null;
    if(record.cycle?.outputReservation&&!bookings.has(record.cycle.outputReservation))record.cycle.outputReservation=null;
  }
}
