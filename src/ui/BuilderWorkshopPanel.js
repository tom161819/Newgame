import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { dataName } from '../i18n/names.js';
import { buildingDefinition } from '../game/buildings.js';
import { BUILDER_WORKSHOP } from '../data/builderWorkshop.js';
import { JOBS } from '../data/jobs.js';
import { formatCost } from './objectLabels.js';

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
    this.renderEngines(b);
    document.querySelector('#builder-workshop-kingdom').textContent=without>0?t('builderWorkshop.without',{count:without,percent:Math.round((1-BUILDER_WORKSHOP.unservedSpeed)*100)}):t('builderWorkshop.allServed');
  }
  // Owner 18 Nov 2026: the Builders here also build Catapults – a site beside the workshop, built like a building.
  renderEngines(b){
    const s=this.scene;if(!s.military?.engines)return;let box=this.dialog.querySelector('#builder-workshop-engines');
    if(!box){box=element('section','builder-workshop-engines');box.id='builder-workshop-engines';const text=element('p','builder-workshop-engines-text'),button=element('button','',t('siege.orderCatapult',{cost:formatCost(s.objectRegistry.require('catapult_site').cost,s.objectRegistry)}));button.type='button';button.id='order-catapult';
      button.addEventListener('click',()=>{const result=s.military.engines.orderCatapult(this.building);s.setStatus(result.error??t('siege.catapultOrdered'));this.render();},{signal:this.controller.signal});const ram=element('button','',t('siege.orderRam',{cost:formatCost(s.objectRegistry.require('ram_site').cost,s.objectRegistry)}));ram.type='button';ram.id='order-ram';
      ram.addEventListener('click',()=>{const result=s.military.engines.orderRam(this.building);s.setStatus(result.error??t('siege.ramOrdered'));this.render();},{signal:this.controller.signal});box.append(text,button,ram);document.querySelector('#builder-workshop-kingdom').after(box);}
    const sites=s.military.engines.sites(b),parked=type=>[...(s.vehicles?.vehicles.values()??[])].filter(v=>v.type===type&&v.state==='parked').length,building=sites.filter(x=>x.type==='catapult_site').length,ready=parked('catapult');
    box.querySelector('p').textContent=`${t('siege.catapultStatus',{building,ready})} ${t('siege.ramStatus',{building:sites.filter(x=>x.type==='ram_site').length,ready:parked('ram')})}`;
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
