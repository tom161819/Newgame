import { t } from '../i18n/index.js';
import { buildingDefinition } from '../game/buildings.js';
import { constructionPhase,CONSTRUCTION_RULES } from '../data/construction.js';
import { element } from './objectLabels.js';

export class ConstructionUI {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#construction-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-construction').addEventListener('click',()=>this.close(),options);
    document.querySelector('#construction-king-work').addEventListener('click',()=>{scene.constructionSystem.commandKing(this.site,{fetch:true});this.refresh();},options);
    document.querySelector('#construction-king-stop').addEventListener('click',()=>{scene.constructionSystem.stopKing();this.refresh();},options);
    document.querySelector('#cancel-construction').addEventListener('click',()=>{scene.constructionSystem.cancel(this.site);this.close();},options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(site){this.site=site;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open)return;const s=this.scene,site=this.site;if(!site||!s.constructionSystem.sites.has(site.id)||!s.fog.isVisibleObject(site)){this.close();return;}
    const crop=!!buildingDefinition(site).crop,c=site.construction,system=s.constructionSystem,active=system.activeBuilders(site),estimate=system.estimatedSeconds(site),king=system.assignments.get('king'),kingHere=king?.siteId===site.id;
    document.querySelector('#construction-name').textContent=buildingDefinition(site).name;
    document.querySelector('#construction-percentage').textContent=`${c.progress.toFixed(1)} % · ${t(`construction.phase.${constructionPhase(site)}`)}`;document.querySelector('#construction-progress').value=c.progress;
    document.querySelector('#construction-builders').textContent=t(crop?'construction.farmers':'construction.builders',{working:active.length,slots:CONSTRUCTION_RULES.maximumBuilders,reserved:c.assignedBuilders.length});
    const slow=crop?0:active.filter(p=>p.actor.profession==='builder'&&system.workshops.factor(p.actor)<1).length;document.querySelector('#construction-workshop').textContent=crop?'':t(slow?'workshop.someSlow':'workshop.rule',{count:slow});
    document.querySelector('#construction-eta').textContent=!system.materials.ready(site)?t('construction.waitMaterials'):estimate==null?t(crop?'construction.waitFarmers':'construction.waitBuilders'):t('construction.remaining',{seconds:Math.ceil(estimate)});
    document.querySelector('#construction-king-task').textContent=crop?t('construction.farmerOnly'):t(s.kingLogistics.workflowSiteId===site.id?'construction.kingDelivering':kingHere?(system.atSite(s.character,king)?'construction.kingBuilding':'construction.kingTravelling'):'construction.kingNone');
    const ready=system.materials.ready(site),summary=system.materials.summary(site);
    document.querySelector('#construction-materials').replaceChildren(...summary.map(row=>element('p','',t('construction.material',{resource:s.objectRegistry.require(row.resource).name,...row}))));
    const button=document.querySelector('#construction-king-work');button.hidden=crop;button.disabled=crop||s.kingLogistics.workflowSiteId===site.id||kingHere||ready&&c.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders;document.querySelector('#construction-king-stop').hidden=crop||!kingHere;
    document.querySelector('#construction-refund').textContent=t(crop?'construction.refundNone':c.workDone>0?'construction.refundHalf':'construction.refundFull');document.querySelector('#construction-unreachable').textContent=site.unreachableReason??'';
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();}
}
