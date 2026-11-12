import { t } from '../i18n/index.js';
import { UNIT_TYPES,UNIT_TYPE_IDS,unitKit } from '../data/military.js';
import { MILITARY_ITEMS } from '../data/militaryEquipment.js';
import { element } from './objectLabels.js';

// C08 Barracks section: the four unit types with their kit, Gold, training time, kits in stock and why one is blocked,
// then every Soldier here with Train / Cancel / Discharge. Clicks are handled by WorkplacePanel through data attributes.
const itemList=(scene,kit)=>Object.entries(kit).map(([id,n])=>`${n} ${scene.objectRegistry.require(id).name}`).join(' + ');
// m-vojaci-chyba (owner point 87): the reason a unit cannot be trained, in words ("Needs an Armory", "Needs 1 Sword in
// an Armory. Swordsmith makes Sword from 3 Iron + 2 Wood."), shown on the card and the Soldier's row, not only as a title.
export function militaryBlockedText(scene,reason,type){
  if(reason!=='kit')return t(`military.blocked.${reason}`);
  const short=scene.military.kitShortage(type),name=id=>scene.objectRegistry.get(id)?.name??id;
  const how=Object.keys(short).map(id=>MILITARY_ITEMS[id]?t('military.make',{workshop:name(MILITARY_ITEMS[id].workshop),item:name(id),recipe:itemList(scene,MILITARY_ITEMS[id].recipe)}):'').join(' ');
  return t('military.blocked.kit',{list:itemList(scene,short),how}).trim();
}
// kasarna-branci: the military rank shown for a resident with the Soldier job – the trained unit type or Recruit.
export function militaryRank(scene,worker){const unit=scene.military?.unit(worker);return unit?t(`unit.type.${unit.type}`):t('military.recruit');}
export function militarySignature(scene,building){const m=scene.military;return m?JSON.stringify([[...m.units],[...m.orders.values()].filter(o=>o.barracksId===building.id),scene.inventory.count('gold'),['sword','bow','armor'].map(id=>m.available(id)),UNIT_TYPE_IDS.map(type=>m.supplyBlocker(type))]):'';}
export function renderMilitary(scene,building,root,employees){
  const m=scene.military;root.hidden=!m||building.type!=='barracks';if(root.hidden)return;
  const cards=UNIT_TYPE_IDS.map(type=>{
    const spec=UNIT_TYPES[type],kit=unitKit(type),kits=Math.min(...Object.entries(kit).map(([id,n])=>Math.floor(m.available(id)/n))),card=element('li','unit-type-card');card.dataset.unitType=type;
    card.append(element('strong','',t(`unit.type.${type}`)),element('span','',t('military.kit',{list:itemList(scene,kit)})),element('span','',t('military.cost',{gold:spec.goldCost,seconds:spec.trainingTime/1000,level:spec.requiredCombatLevel})),
      element('span','',t('military.kits',{count:kits})),...(spec.mount?[element('span','',t('military.horses',{count:scene.stables?[...scene.stables.horses.values()].filter(h=>h.state==='stabled').length:0}))]:[]));
    const missing=m.supplyBlocker(type);card.dataset.blocked=missing??'';if(missing)card.append(element('span','unit-type-blocked',militaryBlockedText(scene,missing,type)));
    return card;
  });
  const soldierRow=w=>{
    const row=element('li','military-soldier'),unit=m.unit(w),order=m.order(w);row.dataset.soldier=w.id;
    let state=militaryRank(scene,w);
    if(order)state=order.state==='supplying'?t('military.waitingKit',{type:t(`unit.type.${order.type}`),list:itemList(scene,unitKit(order.type))}):t('military.training',{type:t(`unit.type.${order.type}`),percent:Math.floor(order.workDone/order.required*100)});
    row.append(element('span','',`${w.name} · ${state}`));
    if(order){const b=element('button','',t('military.cancel'));b.type='button';b.dataset.cancelTraining=String(order.id);row.append(b);}
    else if(unit){const b=element('button','',t('military.discharge'));b.type='button';b.dataset.discharge=w.id;row.append(b);}
    else{for(const type of UNIT_TYPE_IDS){const reason=m.blocker(w,type),b=element('button','',t('military.train',{type:t(`unit.type.${type}`)}));b.type='button';b.dataset.train=type;b.dataset.trainWorker=w.id;b.disabled=!!reason;if(reason){b.title=militaryBlockedText(scene,reason,type);b.dataset.blocked=reason;}row.append(b);}
      const first=m.blocker(w,'soldier');if(first){const why=element('small','military-reason',t('military.reason',{type:t('unit.type.soldier'),reason:militaryBlockedText(scene,first,'soldier')}));why.dataset.blocked=first;row.append(why);}}
    return row;
  };
  // kasarna-branci: Recruits (with Train buttons) and trained units (with Discharge) in two lists under the place count.
  const recruits=employees.filter(w=>!m.unit(w)),trained=employees.filter(w=>m.unit(w)),capacity=scene.objectRegistry.get(building.type)?.workplace?.capacity??employees.length;
  const cardList=element('ul','unit-type-cards'),soldiers=element('ul','military-soldiers'),units=element('ul','military-soldiers military-units');cardList.append(...cards);
  soldiers.dataset.list='recruits';units.dataset.list='units';
  soldiers.append(...(recruits.length?recruits.map(soldierRow):[element('li','empty-slot',t('military.noSoldiers'))]));units.append(...(trained.length?trained.map(soldierRow):[element('li','empty-slot',t('military.noUnits'))]));
  const places=element('p','military-places',t('military.places',{used:employees.length,capacity}));
  root.replaceChildren(element('h3','',t('military.title')),places,cardList,element('h4','',t('military.recruits',{count:recruits.length})),soldiers,element('h4','',t('military.units',{count:trained.length})),units);
}
export function handleMilitaryClick(scene,button){
  const m=scene.military;if(!m)return false;
  if(button.dataset.train){m.train(scene.workerSystem.workers.get(button.dataset.trainWorker),button.dataset.train);return true;}
  if(button.dataset.cancelTraining){m.cancel(Number(button.dataset.cancelTraining));return true;}
  if(button.dataset.discharge){m.release(scene.workerSystem.workers.get(button.dataset.discharge));return true;}
  return false;
}
