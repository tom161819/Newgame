import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { dataName } from '../i18n/names.js';
import { buildingDefinition } from '../game/buildings.js';
import { BUILDER_WORKSHOP } from '../data/builderWorkshop.js';
import { JOBS } from '../data/jobs.js';

// #118: the Builder's Workshop panel: how many Builders it serves, who they are, and how many Builders in the kingdom
// still work without a workshop.
export class BuilderWorkshopPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#builder-workshop-dialog');this.controller=new AbortController();this.restored=true;
    const options={signal:this.controller.signal};
    document.querySelector('#close-builder-workshop').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);
    this.dialog.addEventListener('click',event=>{if(event.target===this.dialog)this.close();},options);
  }
  get isOpen(){return this.dialog.open;}
  render(){
    const system=this.scene.builderWorkshops,b=this.building;if(!system||!b)return;
    const served=system.served(b),capacity=system.capacity(b),summary=system.summary(),without=summary.builders-summary.served;
    document.querySelector('#builder-workshop-title').textContent=dataName(buildingDefinition(b));
    document.querySelector('#builder-workshop-count').textContent=t('builderWorkshop.count',{count:served.length,capacity});
    document.querySelector('#builder-workshop-list').replaceChildren(...(served.length?served.map(w=>element('li','',w.name??`${JOBS.builder.name} ${w.id}`)):[element('li','builder-workshop-empty',t('builderWorkshop.none'))]));
    document.querySelector('#builder-workshop-kingdom').textContent=without>0?t('builderWorkshop.without',{count:without,percent:Math.round((1-BUILDER_WORKSHOP.unservedSpeed)*100)}):t('builderWorkshop.allServed');
  }
  open(building){
    this.building=building;this.render();
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();clearInterval(this.timer);this.timer=setInterval(()=>{if(this.dialog.open)this.render();},1000);}
    this.scene.demolitionUI?.attach(this.dialog,building);
  }
  restore(){clearInterval(this.timer);this.timer=null;if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  destroy(){this.close();this.controller.abort();}
}
