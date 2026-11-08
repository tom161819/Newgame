import { countName } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { buildingDemolitionRefund } from '../data/demolition.js';
import { buildingName } from '../game/depletedMine.js';
const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
export class DemolitionUI {
  constructor(scene){
    this.scene=scene;this.controller=new AbortController();const options={signal:this.controller.signal};
    this.inspect=document.querySelector('#inspect-selected-building');this.dialog=document.querySelector('#building-detail-dialog');this.confirm=document.querySelector('#demolition-confirm-dialog');
    this.section=element('section','demolition-actions');this.section.id='demolition-actions';this.heading=element('h3');this.refund=element('p');this.status=element('p');this.status.setAttribute('role','status');
    this.progress=element('progress');this.progress.max=100;this.progress.setAttribute('aria-label',t('demolition.title'));this.start=element('button');this.start.id='demolition-start';this.start.type='button';this.cancel=element('button');this.cancel.id='demolition-cancel';this.cancel.type='button';
    this.section.append(this.heading,this.refund,this.status,this.progress,this.start,this.cancel);
    this.inspect.addEventListener('click',()=>this.openSelected(),options);document.querySelector('#close-building-detail').addEventListener('click',()=>this.dialog.close(),options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.dialog.close();},options);this.dialog.addEventListener('close',()=>scene.setGalleryInput(true),options);
    this.start.addEventListener('click',()=>this.ask(),options);this.cancel.addEventListener('click',()=>{scene.demolition.cancel(this.buildingId);this.refresh();},options);
    document.querySelector('#demolition-confirm-cancel').addEventListener('click',()=>this.confirm.close(),options);
    this.confirm.addEventListener('cancel',e=>{e.preventDefault();this.confirm.close();},options);this.confirm.addEventListener('close',()=>{this.pendingId=null;scene.setGalleryInput(true);},options);
    document.querySelector('#demolition-confirm-accept').addEventListener('click',()=>{
      const b=this.building(this.pendingId);if(b&&!this.reason(b)&&scene.demolition.request(b))scene.setStatus(t('demolition.queued'));
      this.confirm.close();this.refresh();
    },options);this.refresh();
  }
  building(id){return this.scene.buildings.find(b=>b.id===id);}
  select(building){this.selectedId=building&&buildingIsComplete(building)?building.id:null;this.refresh();}
  attach(dialog,building){if(!building)return;this.buildingId=building.id;this.host=dialog;dialog.append(this.section);this.refresh();}
  openSelected(){
    const b=this.building(this.selectedId);if(!b||!this.scene.fog.isVisibleObject(b))return;
    if(this.scene.character.state==='ground'&&this.scene.character.order?.kind==='enter'&&this.scene.character.order.tower?.id===b.id)this.scene.character.stopForBuilding();
    text(document.querySelector('#building-detail-title'),`${buildingName(b)} #${b.id}`);text(document.querySelector('#building-detail-description'),buildingDefinition(b).description);
    this.scene.setGalleryInput(false);if(!this.dialog.open)this.dialog.showModal();this.attach(this.dialog,b);this.refresh();
  }
  reason(b){
    if(!b||!this.scene.fog.isVisibleObject(b))return 'unavailable';if(b.type==='castle')return 'castle';if(b.type==='starter_stockpile')return 'starter';
    if(!buildingIsComplete(b))return 'unfinished';if(!this.scene.demolition.eligible(b))return 'unavailable';if(this.scene.demolition.roofBlocked(b))return 'roof';return null;
  }
  refundLabel(b){const refund=buildingDemolitionRefund(b,buildingDefinition(b));return Object.keys(refund).length?Object.entries(refund).map(([id,n])=>countName(this.scene.objectRegistry.require(id),n)).join(', '):t('demolition.noRefund');}
  ask(){
    const b=this.building(this.buildingId);if(this.reason(b)||b.demolition)return;
    this.pendingId=b.id;text(document.querySelector('#demolition-confirm-text'),t('demolition.confirmText',{name:buildingName(b),refund:this.refundLabel(b)}));
    this.scene.setGalleryInput(false);this.confirm.showModal();
  }
  refresh(){
    const selected=this.building(this.selectedId);this.inspect.hidden=!selected||!this.scene.fog.isVisibleObject(selected);
    if(selected){const label=t('demolition.inspect',{name:buildingName(selected)});text(this.inspect,label);this.inspect.title=label;}
    const b=this.building(this.buildingId);if(!b){this.section.hidden=true;if(this.host?.open)this.host.close();return;}
    this.section.hidden=!this.host?.open;if(this.section.hidden)return;
    const reason=this.reason(b),record=b.demolition;
    this.progress.setAttribute('aria-label',t('demolition.title'));
    text(this.heading,t('demolition.title'));text(this.refund,t('demolition.refund',{refund:this.refundLabel(b)}));text(this.start,t('demolition.start'));text(this.cancel,t('demolition.cancel'));
    this.start.hidden=!!record||b.type==='starter_stockpile';this.start.disabled=!!reason;this.cancel.hidden=!record;this.progress.hidden=!record;this.progress.value=record?.progress??0;
    text(this.status,reason?t(`demolition.${reason}`):!record?t('demolition.note'):record.workDone>=record.requiredWork?t('demolition.waitSafe'):t(record.assignedBuilders.length?'demolition.progress':'demolition.waitBuilder',{percent:record.progress.toFixed(1),count:record.assignedBuilders.length}));
    if(this.confirm.open){const pending=this.building(this.pendingId);document.querySelector('#demolition-confirm-accept').disabled=!!this.reason(pending)||!!pending?.demolition;}
  }
  destroy(){this.controller.abort();this.confirm.close();this.dialog.close();this.section.remove();this.inspect.hidden=true;}
}
