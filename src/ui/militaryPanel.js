import { definitionFor } from '../game/buildings.js';
import { t } from '../i18n/index.js';
import { UNIT_TYPES,UNIT_TYPE_IDS,unitKit,barracksAutoHire } from '../data/military.js';
import { MILITARY_ITEMS } from '../data/militaryEquipment.js';
import { element } from './objectLabels.js';
import { GEAR_ICONS,gearOf } from './gearIcons.js';
import { KIND_ICONS,ORDER_ICONS,lookArt,unitTypePicture } from './unitPictures.js';
import { commanded } from '../systems/UnitCommands.js';
import { localized,workMessageLabel } from '../i18n/names.js';
import { militaryLook } from '../data/objects/approvedArt.js';

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
// Owner 19 Nov 2026: each training card shows the class's picture (as in the selection bar) and the weapon / armour
// icons the selection bar uses.
function unitCardHead(scene,root,type,kit){
  const head=element('div','unit-card-head'),pic=element('span','unit-card-pic'),name=element('strong','',t(`unit.type.${type}`)),gear=element('span','unit-card-gear');
  const url=unitTypePicture(scene,type,ready=>{if(ready)for(const img of root.querySelectorAll?.(`img[data-unit-pic="${type}"]`)??[])img.src=ready;});
  const img=element('img');img.alt='';img.dataset.unitPic=type;img.width=36;img.height=50;
  if(url)img.src=url;else if(!lookArt(militaryLook(type,'male','')??'')?.walk){pic.textContent=KIND_ICONS[`soldier:${type}`]??'🛡️';}
  if(!pic.textContent)pic.append(img);
  for(const id of gearOf(Object.keys(kit))){const i=element('i',`gear-${id}`);i.innerHTML=GEAR_ICONS[id];const n=scene.objectRegistry.get(id)?.name??id;i.title=n;i.setAttribute('aria-label',n);gear.append(i);}
  const text=element('span','unit-card-title');text.append(name,gear);head.append(pic,text);return head;
}
export function renderMilitary(scene,building,root,employees){
  const m=scene.military;root.hidden=!m||building.type!=='barracks';if(root.hidden){if(root._autoHire?.parentElement&&root._autoHire.parentElement!==root)root._autoHire.remove();return;}
  const cards=UNIT_TYPE_IDS.map(type=>{
    const spec=UNIT_TYPES[type],kit=unitKit(type),kits=Math.min(...Object.entries(kit).map(([id,n])=>Math.floor(m.available(id)/n))),card=element('li','unit-type-card');card.dataset.unitType=type;
    card.append(unitCardHead(scene,root,type,kit),...(Object.keys(kit).length?[element('span','',t('military.kit',{list:itemList(scene,kit)}))]:[]),element('span','',t('military.cost',{gold:spec.goldCost,seconds:spec.trainingTime/1000,level:spec.requiredCombatLevel})),
      ...(Object.keys(kit).length?[element('span','',t('military.kits',{count:kits}))]:[]),...(spec.vehicle?[element('span','',t(`military.vehicle.${spec.vehicle}`,{count:[...(scene.vehicles?.vehicles.values()??[])].filter(v=>v.type===spec.vehicle&&v.state==='parked'&&!v.crew).length}))]:[]),...(spec.mount?[element('span','',t('military.horses',{count:scene.stables?[...scene.stables.horses.values()].filter(h=>h.state==='stabled').length:0}))]:[]));
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
  const recruits=employees.filter(w=>!m.unit(w)),trained=employees.filter(w=>m.unit(w)),capacity=definitionFor(building,scene.objectRegistry,true)?.workplace?.capacity??employees.length;
  const cardList=element('ul','unit-type-cards'),soldiers=element('ul','military-soldiers'),units=element('ul','military-soldiers military-units');cardList.append(...cards);
  soldiers.dataset.list='recruits';units.dataset.list='units';
  soldiers.append(...(recruits.length?recruits.map(soldierRow):[element('li','empty-slot',t('military.noSoldiers'))]));units.append(...(trained.length?trained.map(soldierRow):[element('li','empty-slot',t('military.noUnits'))]));
  const places=element('p','military-places',t('military.places',{used:employees.length,capacity}));
  // m-kasarna-limit-zamestnani: the slider survives re-renders (kept on the root), so dragging is not interrupted.
  let hire=root._autoHire;if(!hire){hire=element('label','barracks-auto-hire');const text=element('span','barracks-auto-hire-text'),range=element('input');range.type='range';range.id='barracks-auto-hire';range.min='0';range.step='1';
    range.addEventListener('input',()=>{const b=hire._building;if(!b)return;b.autoHire=Number(range.value);text.textContent=t('military.autoHire',{count:b.autoHire,capacity:Number(range.max)});scene.employment?.request?.();});
    hire.append(text,range);root._autoHire=hire;}
  {const range=hire.querySelector('input'),text=hire.querySelector('.barracks-auto-hire-text'),value=barracksAutoHire(building,capacity);hire._building=building;range.max=String(capacity);if(document.activeElement!==range)range.value=String(value);text.textContent=t('military.autoHire',{count:value,capacity});}
  // Point 58 (owner 15 Nov 2026): the automatic hiring slider sits at the very top of the Barracks window.
  // Point 66 (owner 17 Nov 2026: "the automatic count blinks or does not show at all"): the issue line and the slider
  // both claimed the place right after the heading (and the picture), so each render moved them past each other. The
  // slider now has its own place after the issue line, which stays first.
  {const dialog=root.parentElement,heading=dialog?.querySelector?.('.dialog-heading'),issue=dialog?.querySelector?.('#workplace-issue');let anchor=issue&&issue.parentElement===dialog?issue:heading;if(anchor&&anchor.nextElementSibling?.id==='workplace-image')anchor=anchor.nextElementSibling;
    if(anchor){if(hire.previousElementSibling!==anchor)anchor.after(hire);const order=dialog.__uiOriginalOrder;if(Array.isArray(order)&&order[order.indexOf(anchor)+1]!==hire){const i=order.indexOf(hire);if(i>=0)order.splice(i,1);order.splice(order.indexOf(anchor)+1,0,hire);}}else if(hire.parentElement!==root)root.prepend(hire);}
  root.replaceChildren(...(hire.parentElement===root?[hire]:[]),element('h3','',t('military.title')),places,cardList,element('h4','',t('military.recruits',{count:recruits.length})),soldiers,element('h4','',t('military.units',{count:trained.length})),units);
}
export function handleMilitaryClick(scene,button){
  const m=scene.military;if(!m)return false;
  if(button.dataset.train){m.train(scene.workerSystem.workers.get(button.dataset.trainWorker),button.dataset.train);return true;}
  if(button.dataset.cancelTraining){m.cancel(Number(button.dataset.cancelTraining));return true;}
  if(button.dataset.discharge){m.release(scene.workerSystem.workers.get(button.dataset.discharge));return true;}
  return false;
}

// Owner 19 Nov 2026: what a soldier is doing now – the order (patrol, guard, walls, wolf hunt) or away with the party –
// with the current activity (asleep in the Barracks, on guard…) as the hover text.
export function soldierStatus(scene,w){
  const order=w.away?'away':w.huntWolfId?'hunt':w.wallPatrol?'walls':commanded(w)?'guard':'patrol';
  const shelter=w.sleepingIn!=null?scene.buildings.find(b=>b.id===w.sleepingIn):null;
  const now=w.away?'':shelter?t('population.soldierAsleep',{building:scene.objectRegistry.get(shelter.type)?.name??shelter.type}):w.workMessage?workMessageLabel(w.workMessage):localized(`work.state.${w.workState}`,w.workState);
  return {order,icon:ORDER_ICONS[order],label:order==='away'?t('military.away'):t(`army.order.${order}`),now,asleep:!!shelter};
}
// Owner 19 Nov 2026: one compact line per soldier housed in the Barracks – name, class, level, what he is doing, ✕.
export function barracksRosterRow(scene,w){
  const row=element('li','barracks-roster-row'),st=soldierStatus(scene,w),lvl=w.skills?.combat?.level??1;row.dataset.soldier=w.id;
  const state=element('span','barracks-roster-state');const icon=element('span','barracks-roster-icon',st.icon);state.append(icon,element('span','',st.label));if(st.asleep)state.append(element('span','barracks-roster-sleep','💤'));
  state.title=st.now?`${st.label} · ${st.now}`:st.label;state.setAttribute('aria-label',state.title);
  const remove=element('button','barracks-roster-remove','✕');remove.type='button';remove.dataset.removeWorker=w.id;remove.title=t('workplace.remove');remove.setAttribute('aria-label',`${t('workplace.remove')}: ${w.name}`);
  row.append(element('span','barracks-roster-name',w.name),element('span','barracks-roster-class',militaryRank(scene,w)),element('span','barracks-roster-level',t('military.level',{level:lvl})),state,remove);
  return row;
}
