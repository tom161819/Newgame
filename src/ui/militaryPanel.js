import { t } from '../i18n/index.js';
import { UNIT_TYPES,UNIT_TYPE_IDS,unitKit } from '../data/military.js';
import { element } from './objectLabels.js';

// C08 Barracks section: the four unit types with their kit, Gold, training time, kits in stock and why one is blocked,
// then every Soldier here with Train / Cancel / Discharge. Clicks are handled by WorkplacePanel through data attributes.
const itemList=(scene,kit)=>Object.entries(kit).map(([id,n])=>`${n} ${scene.objectRegistry.require(id).name}`).join(' + ');
export function militarySignature(scene,building){const m=scene.military;return m?JSON.stringify([[...m.units],[...m.orders.values()].filter(o=>o.barracksId===building.id),scene.inventory.count('gold'),['sword','bow','armor'].map(id=>m.available(id))]):'';}
export function renderMilitary(scene,building,root,employees){
  const m=scene.military;root.hidden=!m||building.type!=='barracks';if(root.hidden)return;
  const cards=UNIT_TYPE_IDS.map(type=>{
    const spec=UNIT_TYPES[type],kit=unitKit(type),kits=Math.min(...Object.entries(kit).map(([id,n])=>Math.floor(m.available(id)/n))),card=element('li','unit-type-card');card.dataset.unitType=type;
    card.append(element('strong','',t(`unit.type.${type}`)),element('span','',t('military.kit',{list:itemList(scene,kit)})),element('span','',t('military.cost',{gold:spec.goldCost,seconds:spec.trainingTime/1000,level:spec.requiredCombatLevel})),
      element('span','',spec.lockedUntil?t('military.locked'):t('military.kits',{count:kits})));
    return card;
  });
  const rows=employees.map(w=>{
    const row=element('li','military-soldier'),unit=m.unit(w),order=m.order(w);row.dataset.soldier=w.id;
    let state=unit?t('military.trained',{type:t(`unit.type.${unit.type}`)}):t('military.recruit');
    if(order)state=order.state==='supplying'?t('military.waitingKit',{type:t(`unit.type.${order.type}`),list:itemList(scene,unitKit(order.type))}):t('military.training',{type:t(`unit.type.${order.type}`),percent:Math.floor(order.workDone/order.required*100)});
    row.append(element('span','',`${w.name} · ${state}`));
    if(order){const b=element('button','',t('military.cancel'));b.type='button';b.dataset.cancelTraining=String(order.id);row.append(b);}
    else if(unit){const b=element('button','',t('military.discharge'));b.type='button';b.dataset.discharge=w.id;row.append(b);}
    else for(const type of UNIT_TYPE_IDS){const reason=m.blocker(w,type),b=element('button','',t('military.train',{type:t(`unit.type.${type}`)}));b.type='button';b.dataset.train=type;b.dataset.trainWorker=w.id;b.disabled=!!reason;if(reason)b.title=t(`military.blocked.${reason}`);row.append(b);}
    return row;
  });
  const cardList=element('ul','unit-type-cards'),soldiers=element('ul','military-soldiers');cardList.append(...cards);soldiers.append(...(rows.length?rows:[element('li','empty-slot',t('military.noSoldiers'))]));
  root.replaceChildren(element('h3','',t('military.title')),cardList,soldiers);
}
export function handleMilitaryClick(scene,button){
  const m=scene.military;if(!m)return false;
  if(button.dataset.train){m.train(scene.workerSystem.workers.get(button.dataset.trainWorker),button.dataset.train);return true;}
  if(button.dataset.cancelTraining){m.cancel(Number(button.dataset.cancelTraining));return true;}
  if(button.dataset.discharge){m.release(scene.workerSystem.workers.get(button.dataset.discharge));return true;}
  return false;
}
