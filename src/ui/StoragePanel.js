import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { transportLabel,storageName } from './transportLabels.js';

export class StoragePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#storage-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#open-storage').addEventListener('click',()=>this.open(),options);
    document.querySelector('#close-storage').addEventListener('click',()=>this.close(),options);
    document.querySelector('#storage-king-deposit').addEventListener('click',()=>scene.kingLogistics?.startDelivery(this.building?.id??null),options);
    document.querySelector('#storage-king-drop').addEventListener('click',()=>scene.kingLogistics?.dropCargo(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))scene.setGalleryInput(true);},options);
  }
  open(building=null,locationId=null){this.building=building;this.locationId=locationId;this.signature=null;this.breakdownOpen=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
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
    const signature=JSON.stringify([storage.revision,breakdown,actors.map(w=>[w.id,w.assignedWorkplaceId,w.workState,w.workMessage,w.cargo,w.workTask?.kind,w.skills?.logistics.level]),scene.kingLogistics.task,scene.character.state]);if(this.signature===signature)return;this.signature=signature;
    document.querySelector('#storage-title').textContent=this.building?.definition.name??(this.locationId?storageName(scene,this.locationId):t('hud.storage'));
    document.querySelector('#storage-king-deposit').hidden=!scene.kingLogistics||!scene.character.cargo;
    const dropButton=document.querySelector('#storage-king-drop');dropButton.hidden=!scene.character.cargo;dropButton.disabled=scene.character.state!=='ground'||!!scene.character.nextTile;
    const locations=[...storage.locations.values()].filter(l=>storage.isStock(l)&&(!this.building||l.buildingId===this.building.id)&&(!this.locationId||l.id===this.locationId));
    const sections=locations.map(l=>{
      const building=scene.buildings.find(b=>b.id===l.buildingId),section=element('section','storage-location'),title=element('h3','',storageName(scene,l.id));
      const used=storage.used(l),incoming=storage.incoming(l.id);
      section.append(title);const groups=storage.groups(l.id);
      if(groups)for(const [group,values]of Object.entries(groups)){const row=element('p','',t(`storage.granary.${group}`,values));row.dataset.granaryGroup=group;section.append(row);}
      else section.append(element('p','',t('storage.stored',{used,capacity:l.capacity,free:storage.room(l.id),incoming})));
      if(l.legacyOverflow)section.append(element('p','',t('storage.legacy',{count:l.legacyOverflow})));
      for(const resource of l.allowed){
        const row=element('p','',t('storage.row',{resource:scene.objectRegistry.require(resource).name,count:l.stock[resource]??0,reserved:storage.reserved(l.id,resource)})+' '),collect=element('button','',t('storage.collect'));collect.type='button';collect.dataset.kingCollect=resource;collect.dataset.storageId=l.id;collect.disabled=!!scene.character.cargo||storage.free(l.id,resource)<1;
        collect.addEventListener('click',()=>scene.kingLogistics.startPickup(l.id,resource));row.append(collect);section.append(row);
      }
      const tasks=actors.filter(actor=>{const t=actor===scene.character?scene.kingLogistics.task:actor.workTask;return t&&(t.sourceId===l.id||t.destinationId===l.id);});
      section.append(element('h4','',t('storage.active',{count:tasks.length})));for(const actor of tasks)section.append(element('p','',`${actor.name??actor.definition.name}: ${transportLabel(scene,actor)}`));return section;
    });
    document.querySelector('#storage-details').replaceChildren(...(breakdown?[this.breakdown(breakdown),...sections]:sections));
  }
  close(){this.dialog.close();this.scene.setGalleryInput(true);}
  destroy(){this.close();this.controller.abort();}
}
