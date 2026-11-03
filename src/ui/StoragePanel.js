import { element } from './objectLabels.js';

export class StoragePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#storage-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#open-storage').addEventListener('click',()=>this.open(),options);
    document.querySelector('#close-storage').addEventListener('click',()=>this.close(),options);
    document.querySelector('#storage-king-deposit').addEventListener('click',()=>scene.kingLogistics?.startDelivery(this.building?.id??null),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))scene.setGalleryInput(true);},options);
  }
  open(building=null){this.building=building;this.signature=null;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open)return;
    const storage=this.scene.foodStorage,signature=JSON.stringify([storage.revision,this.scene.character.cargo,this.scene.workerSystem.liveWorkers().map(w=>[w.id,w.assignedWorkplaceId,w.workState,w.workMessage])]);if(this.signature===signature)return;this.signature=signature;
    document.querySelector('#storage-title').textContent=this.building?.definition.name??'Resources & Storage';
    document.querySelector('#storage-king-deposit').hidden=!this.scene.kingLogistics||!this.scene.character.cargo;
    const locations=[...storage.locations.values()].filter(l=>storage.isStock(l)&&(!this.building||l.buildingId===this.building.id));
    document.querySelector('#storage-details').replaceChildren(...locations.map(l=>{
      const building=this.scene.buildings.find(b=>b.id===l.buildingId),section=element('section','storage-location'),title=element('h3','',building?`${building.definition.name} #${building.id}`:l.id==='legacy-materials'?'Legacy Stockpile':'Camp Storage');
      const used=storage.used(l),incoming=storage.incoming(l.id);
      section.append(title,element('p','',`Stored: ${used} / ${l.capacity} · Free: ${storage.room(l.id)} · Reserved incoming: ${incoming}`));
      if(l.legacyOverflow)section.append(element('p','',`Preserved legacy surplus: ${l.legacyOverflow}. New deliveries wait for room.`));
      for(const resource of l.allowed)section.append(element('p','',`${this.scene.objectRegistry.require(resource).name}: ${l.stock[resource]??0} · Reserved: ${storage.reserved(l.id,resource)}`));
      if(building?.definition.workplace?.profession==='hauler'){
        const workers=this.scene.workplaceSystem.employees(building),button=element('button','','Manage Haulers');button.type='button';button.addEventListener('click',()=>{this.close();this.scene.workplacePanel.open(building);});
        section.append(element('p','',`Haulers: ${workers.length} / ${building.definition.workplace.capacity}`),button);
      }
      return section;
    }));
  }
  close(){this.dialog.close();this.scene.setGalleryInput(true);}
  destroy(){this.close();this.controller.abort();}
}
