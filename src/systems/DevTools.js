import { POPULATION } from '../data/jobs.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { resourceGroup } from '../data/resourceGroups.js';
import { devFactor,DEV_QUICK } from '../data/devBalance.js';
// m-91-asset-library-dev (owner point 88): what the Dev tool menu computes and does. No DOM here (node tests).
const HOURS_PER_DAY=24,MATERIALS=Object.freeze(['wood','stone','iron']),SOURCE='Dev Tool';
const live=scene=>scene.workerSystem?.liveSubjects?.()??[];
// When the next resident arrives (game hours) and what limits arrival now. Migrants come at the day boundary
// (WorkerSystem.onNewDay): migrantsPerDay × the Arrival coefficient a day, the fraction carried over.
export function arrivalForecast(scene){
  const ws=scene.workerSystem,time=scene.gameTime,factor=devFactor('immigration'),perDay=POPULATION.migrantsPerDay*factor,carry=ws?.migrantCarry??0;
  const days=Math.max(1,Math.ceil((1-carry-1e-9)/perDay)),toBoundary=time?(time.dayDuration-time.elapsed)/time.dayDuration:1;
  const hours=Math.round((toBoundary+days-1)*HOURS_PER_DAY*10)/10,count=live(scene).length,capacity=ws?.capacity?.()??count,limits=[];
  if(count>=capacity)limits.push({id:'beds'});
  const block=scene.attractiveness?.blockReason?.();if(block)limits.push({id:block});
  const chance=scene.attractiveness?Math.round(scene.attractiveness.settlementChance*100):100;if(chance<100)limits.push({id:'chance',percent:chance});
  return {hours,days,perDay,factor,freeBeds:Math.max(0,capacity-count),chance,limits};
}
const totals=(day,resource)=>{const v=day?.totals?.[resource];return {income:v?.income??0,expenses:v?.expenses??0};};
// Last game day and the average of the last 3 closed days, from the resource ledger (same numbers as the HUD tooltips).
export function economyOverview(scene){
  const history=scene.resourceLedger?.history??[],last=history.at(-1)??null,recent=history.slice(-3);
  const row=resource=>{const l=totals(last,resource),avg={income:0,expenses:0};for(const d of recent){const v=totals(d,resource);avg.income+=v.income/recent.length;avg.expenses+=v.expenses/recent.length;}return {resource,last:l,average:avg};};
  const workers=live(scene),capacity=scene.workerSystem?.capacity?.()??workers.length;
  return {day:last?.day??null,days:recent.length,gold:row('gold'),food:FOOD_RESOURCE_IDS.map(row),materials:MATERIALS.map(row),
    happiness:scene.needs?.summary?.()?.happiness??null,unemployed:workers.filter(w=>w.profession==='idle').length,residents:workers.length,freeBeds:Math.max(0,capacity-workers.length)};
}
// ---- quick actions: each returns what it did (0 / false when a limit stopped it).
export function addDevGold(scene,amount=DEV_QUICK.gold){const before=scene.inventory.count('gold');scene.inventory.add('gold',amount,{source:SOURCE,type:'acquisition'});scene.updateInventory?.();return scene.inventory.count('gold')-before;}
// Resources (materials and food) the stores hold.
export function devResourceIds(scene){const reg=scene.objectRegistry,ids=scene.foodStorage?.resourceIds?.()??[...FOOD_RESOURCE_IDS,...MATERIALS];return ids.filter(id=>['materials','foodRaw','food'].includes(resourceGroup(reg?.get?.(id)??{id},reg)));}
// +amount of each resource, only into free room of the stores (nothing is spilled on the ground).
export function addDevResources(scene,amount=DEV_QUICK.resources){
  const storage=scene.foodStorage,added={};
  for(const resource of devResourceIds(scene)){
    let left=amount;
    if(storage?.locations)for(const l of storage.locations.values()){if(!left)break;if(!storage.isStock(l)||!l.allowed?.includes(resource))continue;const n=Math.min(left,storage.room(l.id,resource));if(n>0&&storage.deposit(l.id,resource,n))left-=n;}
    else{scene.inventory.add(resource,amount,{track:false});left=0;}
    if(amount-left>0){added[resource]=amount-left;scene.resourceLedger?.income?.(resource,amount-left,SOURCE);}
  }
  scene.updateInventory?.();scene.updateFoodDisplay?.();return added;
}
// One game day: through the background catch-up (the normal simulation, with its overlay and summary).
export function advanceDevDay(scene){const ms=scene.gameTime?.dayDuration??0;if(scene.background?.queue)return scene.background.queue(ms);return 0;}
export function summonDevCaravan(scene){return !!scene.caravans?.summon?.();}
// One resident near the start, only while there is a free bed.
export function addDevResident(scene){const ws=scene.workerSystem;if(!ws||live(scene).length>=ws.capacity())return null;const worker=ws.spawnNearStart();ws.updateUI?.();return worker;}
