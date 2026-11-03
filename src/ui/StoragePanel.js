import { element } from './objectLabels.js';

export class StoragePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#storage-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#open-storage').addEventListener('click',()=>this.open(),options);
    document.querySelector('#close-storage').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>scene.setGalleryInput(true),options);
  }
  open(building=null){this.building=building;this.signature=null;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open)return;
    const storage=this.scene.foodStorage;if(this.signature===storage.revision)return;this.signature=storage.revision;
    document.querySelector('#storage-title').textContent=this.building?'Granary':'Food Storage';
    const locations=[...storage.locations.values()].filter(l=>storage.isStock(l)&&(!this.building||l.buildingId===this.building.id));
    document.querySelector('#storage-details').replaceChildren(...locations.map(l=>{
      const section=element('section','storage-location'),title=element('h3','',l.kind==='fallback'?'Camp Storage':`Granary #${l.buildingId}`);
      const used=storage.used(l),incoming=storage.incoming(l.id);
      section.append(title,element('p','',`Stored: ${used} / ${l.capacity} · Free: ${storage.room(l.id)} · Reserved incoming: ${incoming}`));
      if(l.legacyOverflow)section.append(element('p','',`Preserved legacy surplus: ${l.legacyOverflow}. New deliveries wait for room.`));
      for(const resource of l.allowed)section.append(element('p','',`${this.scene.objectRegistry.require(resource).name}: ${l.stock[resource]??0} · Reserved: ${storage.reserved(l.id,resource)}`));
      return section;
    }));
  }
  close(){this.dialog.close();this.scene.setGalleryInput(true);}
  destroy(){this.close();this.controller.abort();}
}
