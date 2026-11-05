import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';

export class TreasurePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#treasure-dialog');this.controller=new AbortController();this.restored=true;
    const options={signal:this.controller.signal};
    document.querySelector('#take-all').addEventListener('click',()=>{if(scene.treasureSystem.takeAll(this.chest.id))this.close();},options);
    document.querySelector('#close-treasure').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restore(),options);
  }
  open(chest){
    this.chest=chest;this.restored=false;this.scene.setGalleryInput(false);
    const list=document.querySelector('#treasure-contents');
    const entries=chest.looted?[element('li','',t('treasure.empty'))]:[
      element('li','',`🪙 ${t('treasure.gold',{count:chest.contents.gold})}`),...chest.contents.equipment.map(id=>element('li','',`1 × ${this.scene.objectRegistry.require(id).name}`)),
    ];
    list.replaceChildren(...entries);document.querySelector('#take-all').hidden=chest.looted;this.dialog.showModal();
  }
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restore();}
  destroy(){this.close();this.controller.abort();}
}
