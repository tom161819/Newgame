import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { transportLabel,storageName } from './transportLabels.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { equipmentResources } from '../data/logistics.js';

// Owner request (7 Nov): one tidy table per store – icon, name, amount (right aligned, same-width digits) and reserved
// in small grey – grouped by kind (materials, food, equipment) with a small heading; empty goods are hidden. A bar on
// top shows how full the store is. The per-resource "Collect with King" buttons are gone (they were the only control
// for the King's pickup from a store; KingLogistics.startPickup stays for a future control).
export const STORAGE_GROUPS=Object.freeze(['materials','food','equipment']);
export function storageGroup(resource,registry){return FOOD_RESOURCE_IDS.includes(resource)?'food':equipmentResources(registry).includes(resource)?'equipment':'materials';}

export class StoragePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#storage-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#open-storage').addEventListener('click',()=>this.open(),options);
    document.querySelector('#close-storage').addEventListener('click',()=>this.close(),options);
    document.querySelector('#storage-king-deposit').addEventListener('click',()=>scene.kingLogistics?.startDelivery(this.building?.id??null),options);
    document.querySelector('#storage-king-drop').addEventListener('click',()=>scene.kingLogistics?.dropCargo(),options);
    document.querySelector('#stockpile-dismantle-start').addEventListener('click',()=>{this.confirmingStockpile=true;this.signature=null;this.refresh();},options);
    document.querySelector('#stockpile-dismantle-cancel').addEventListener('click',()=>{this.confirmingStockpile=false;this.signature=null;this.refresh();},options);
    document.querySelector('#stockpile-dismantle-confirm').addEventListener('click',()=>{
      if(!this.confirmingStockpile)return;
      const result=scene.foodStorage.dismantleStarter(this.building);this.confirmingStockpile=false;
      if(result.removed){this.close();scene.setStatus(t('stockpile.removed'));}else{this.signature=null;this.refresh();}
    },options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))scene.setGalleryInput(true);},options);
  }
  open(building=null,locationId=null){this.building=building;this.locationId=locationId;this.signature=null;this.breakdownOpen=false;this.confirmingStockpile=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.scene.demolitionUI?.attach(this.dialog,building);this.refresh();}
  breakdown(rows){
    const details=element('details','resource-breakdown'),summary=element('summary','',t('storage.breakdown'));details.open=this.breakdownOpen;details.append(summary);details.addEventListener('toggle',()=>{this.breakdownOpen=details.open;});
    details.append(element('p','',t('storage.breakdownNote')));
    for(const row of rows){
      const section=element('section','resource-location-row'),dl=element('dl','resource-location-counts');section.dataset.breakdownResource=row.resource;section.append(element('h3','',t('storage.total',{resource:this.scene.objectRegistry.require(row.resource).name,count:row.total})));
      for(const [label,key]of [[t('storage.free'),'freeStored'],[t('storage.reserved'),'reservedStored'],[t('storage.carried'),'carried'],[t('storage.sites'),'sites'],[t('storage.buffers'),'buffers'],[t('storage.ground'),'ground']]){const count=element('dd','',String(row[key]));count.dataset.resourceLocation=key;dl.append(element('dt','',label),count);}section.append(dl);details.append(section);
    }return details;
  }
  refresh(){
    if(!this.dialog.open)return;
    const scene=this.scene,storage=scene.foodStorage,actors=[scene.character,...scene.workerSystem.liveWorkers()],breakdown=!this.building&&!this.locationId?storage.resourceBreakdown():null;
    const starter=this.building?.type==='starter_stockpile',removalReason=starter?storage.starterRemovalStatus(this.building):'unavailable';
    const signature=JSON.stringify([storage.revision,breakdown,removalReason,this.confirmingStockpile,actors.map(w=>[w.id,w.assignedWorkplaceId,w.workState,w.workMessage,w.cargo,w.workTask?.kind,w.skills?.logistics.level]),scene.kingLogistics.task,scene.character.state]);if(this.signature===signature)return;this.signature=signature;
    document.querySelector('#stockpile-dismantle').hidden=!starter;
    document.querySelector('#stockpile-dismantle-reason').textContent=starter?t(removalReason?`stockpile.${removalReason}`:'stockpile.empty'):'';
    if(removalReason)this.confirmingStockpile=false;
    const remove=document.querySelector('#stockpile-dismantle-start');remove.disabled=!!removalReason;remove.hidden=!!this.confirmingStockpile;
    document.querySelector('#stockpile-dismantle-confirmation').hidden=!this.confirmingStockpile;
    document.querySelector('#storage-title').textContent=this.building?.definition.name??(this.locationId?storageName(scene,this.locationId):t('hud.storage'));
    document.querySelector('#storage-king-deposit').hidden=!scene.kingLogistics||!scene.character.cargo;
    const dropButton=document.querySelector('#storage-king-drop');dropButton.hidden=!scene.character.cargo;dropButton.disabled=scene.character.state!=='ground'||!!scene.character.nextTile;
    const locations=[...storage.locations.values()].filter(l=>storage.isStock(l)&&(!this.building||l.buildingId===this.building.id)&&(!this.locationId||l.id===this.locationId));
    const sections=locations.map(l=>{
      const building=scene.buildings.find(b=>b.id===l.buildingId),section=element('section','storage-location'),title=element('h3','',storageName(scene,l.id));
      const used=storage.used(l),incoming=storage.incoming(l.id);
      section.append(title);const groups=storage.groups(l.id);
      if(groups){const total=Object.values(groups).reduce((n,g)=>n+g.capacity,0),fill=element('div','storage-fill'),meter=element('meter');meter.min=0;meter.max=total;meter.high=total*.85;meter.optimum=0;meter.value=used;meter.setAttribute('aria-label',t('storage.fill'));
        fill.append(element('strong','storage-fill-count',`${used} / ${total}`),meter);section.append(fill);
        for(const [group,values]of Object.entries(groups)){const row=element('p','storage-fill-text',t(`storage.granary.${group}`,values));row.dataset.granaryGroup=group;section.append(row);}}
      else{const fill=element('div','storage-fill'),meter=element('meter');meter.min=0;meter.max=l.capacity;meter.high=l.capacity*.85;meter.optimum=0;meter.value=used;meter.setAttribute('aria-label',t('storage.fill'));
        fill.append(element('strong','storage-fill-count',`${used} / ${l.capacity}`),meter,element('span','storage-fill-text',t('storage.stored',{used,capacity:l.capacity,free:storage.room(l.id),incoming})));section.append(fill);}
      if(l.legacyOverflow)section.append(element('p','',t('storage.legacy',{count:l.legacyOverflow})));
      if(scene.domestic&&l.allowed.some(id=>['wheat','flour','bread','apple','meat','fish'].includes(id))){const r=l.buildingId!=null?scene.domestic.status(l.buildingId):{level:'none',loss:Math.round(scene.domestic.lossPerDay(l.id)*10)/10,cats:0,needed:1},level=l.buildingId!=null?r.level:null;const lv=level??(scene.domestic.ratsAt(l.id)>=67?'infestation':scene.domestic.ratsAt(l.id)>=34?'many':scene.domestic.ratsAt(l.id)>=1?'few':'none');const line=element('p',`rats-line ${lv}`,t('pets.ratsLine',{level:t(`pets.level.${lv}`),loss:r.loss,cats:r.cats,needed:r.needed}));line.dataset.rats=lv;section.append(line);}
      section.append(this.table(l));
      const tasks=actors.filter(actor=>{const t=actor===scene.character?scene.kingLogistics.task:actor.workTask;return t&&(t.sourceId===l.id||t.destinationId===l.id);});
      section.append(element('h4','',t('storage.active',{count:tasks.length})));for(const actor of tasks)section.append(element('p','',`${actor.name??actor.definition.name}: ${transportLabel(scene,actor)}`));return section;
    });
    document.querySelector('#storage-details').replaceChildren(...(breakdown?[this.breakdown(breakdown),...sections]:sections));
  }
  icon(definition){
    const assets=this.scene.assets;if(assets?.hasTexture?.(definition.id)){const img=element('img','storage-icon');img.src=assets.previewURL(definition);img.alt='';return img;}
    // No icon yet: a coloured disc with the first letter (missing icons are listed in the change record for Grafika).
    const disc=element('span','storage-icon storage-icon-temp',(definition.name??definition.id).slice(0,1));disc.dataset.missingIcon=definition.id;return disc;
  }
  table(l){
    const scene=this.scene,storage=scene.foodStorage,registry=scene.objectRegistry,rows=new Map(STORAGE_GROUPS.map(g=>[g,[]]));let hidden=0;
    for(const resource of l.allowed){const count=l.stock[resource]??0,reserved=storage.reserved(l.id,resource);if(!count&&!reserved){hidden++;continue;}rows.get(storageGroup(resource,registry)).push({resource,count,reserved});}
    const table=element('table','storage-table');table.dataset.storageId=l.id;
    for(const group of STORAGE_GROUPS){const list=rows.get(group);if(!list.length)continue;
      const head=element('tr','storage-group');const th=element('th','',t(`storage.group.${group}`));th.colSpan=3;head.append(th);table.append(head);
      for(const r of list){const d=registry.require(r.resource),tr=element('tr','storage-resource');tr.dataset.storageResource=r.resource;
        const name=element('td','storage-name'),inner=element('span','storage-name-inner');inner.append(this.icon(d),element('span','',d.name));name.append(inner);
        const amount=element('td','storage-amount',String(r.count)),reserved=element('td','storage-reserved',r.reserved?t('storage.reservedShort',{count:r.reserved}):'');
        tr.append(name,amount,reserved);table.append(tr);}
    }
    const wrap=element('div','storage-table-wrap');wrap.append(table);
    if(!table.children.length)wrap.append(element('p','storage-empty',t('storage.empty')));
    else if(hidden)wrap.append(element('p','storage-hidden',t('storage.hiddenEmpty',{count:hidden})));
    return wrap;
  }
  close(){this.confirmingStockpile=false;this.dialog.close();this.scene.setGalleryInput(true);}
  destroy(){this.close();this.controller.abort();}
}
