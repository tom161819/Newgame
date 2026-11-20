import { buildingReachable } from '../game/fogReach.js';
import { renderCastleUpgrade,clickCastleUpgrade } from './castleCard.js';
import { buildingHP,repairPlan } from '../game/buildingHealth.js';
import { countName } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { element,formatCost } from './objectLabels.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { canRelocate,relocationDefinition } from '../game/relocation.js';
import { buildingDemolitionRefund } from '../data/demolition.js';
import { buildingName } from '../game/depletedMine.js';
import { BALLISTA } from '../data/military.js';
const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
export class DemolitionUI {
  constructor(scene){
    this.scene=scene;this.controller=new AbortController();const options={signal:this.controller.signal};
    this.inspect=document.querySelector('#inspect-selected-building');this.dialog=document.querySelector('#building-detail-dialog');this.confirm=document.querySelector('#demolition-confirm-dialog');
    this.section=element('section','demolition-actions');this.section.id='demolition-actions';this.heading=element('h3');this.refund=element('p');this.status=element('p');this.status.setAttribute('role','status');
    this.progress=element('progress');this.progress.max=100;this.progress.setAttribute('aria-label',t('demolition.title'));this.start=element('button');this.start.id='demolition-start';this.start.type='button';this.cancel=element('button');this.cancel.id='demolition-cancel';this.cancel.type='button';
    this.rebuild=element('button');this.rebuild.id='ruins-rebuild';this.rebuild.type='button';this.rebuildNote=element('p','ruins-rebuild-note');
    // Owner 15 Nov 2026 (59): Move the building for half a new one's materials.
    this.move=element('button');this.move.id='relocation-start';this.move.type='button';this.moveNote=element('p','relocation-note');
    // Owner 20 Nov 2026 (defence list, point 4): a Tower can get a ballista.
    this.ballista=element('button');this.ballista.id='tower-ballista';this.ballista.type='button';this.ballistaNote=element('p','tower-ballista-note');
    this.ballista.addEventListener('click',()=>{const b=this.building(this.buildingId),result=scene.fortDefenses?.mount(b);scene.setStatus(result?.error??t('defense.ballistaMounted'));this.refresh();});
    this.section.append(this.ballistaNote,this.ballista,this.rebuildNote,this.rebuild,this.heading,this.refund,this.status,this.progress,this.start,this.cancel,this.move,this.moveNote);
    this.move.addEventListener('click',()=>{const b=this.building(this.buildingId);if(!b)return;if(this.host?.open)this.host.close();if(this.dialog.open)this.dialog.close();scene.startRelocation(b);});
    this.inspect.addEventListener('click',()=>this.openSelected(),options);
    this.dialog.addEventListener('click',event=>{if(!event.target.closest('[data-castle-upgrade]'))return;const result=clickCastleUpgrade(scene);if(result.done){const castle=scene.buildings.find(b=>b.type==='castle');this.select(castle);this.openSelected();}else this.openSelected();},options);document.querySelector('#close-building-detail').addEventListener('click',()=>this.dialog.close(),options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.dialog.close();},options);this.dialog.addEventListener('close',()=>scene.setGalleryInput(true),options);
    this.rebuild.addEventListener('click',()=>{const b=this.building(this.buildingId),result=scene.rebuildRuin(b);scene.setStatus(result.error??t('ruins.rebuildPlanned',{name:buildingDefinition(result.building).name}));if(!result.error&&this.host?.open)this.host.close();this.refresh();},options);
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
    const b=this.building(this.selectedId);if(!b||!buildingReachable(this.scene.fog,b))return;
    if(this.scene.character.state==='ground'&&this.scene.character.order?.kind==='enter'&&this.scene.character.order.tower?.id===b.id)this.scene.character.stopForBuilding();
    text(document.querySelector('#building-detail-title'),`${buildingName(b)} #${b.id}`);text(document.querySelector('#building-detail-description'),buildingDefinition(b).description);
    {const hp=buildingHP(b),box=document.querySelector('#building-detail-hp');if(box){box.hidden=!hp;if(hp){const r=b.repair,plan=!r&&hp.hp<hp.max?repairPlan(b):null,note=this.scene.nightThreats?.burning?.(b)?t('building.repairFire'):r?(r.assignedBuilders.length||r.workDone>0?t('building.repairWork',{percent:Math.floor(r.progress),count:r.assignedBuilders.length}):t('building.repairWait')):plan?t('building.repairCost',{cost:formatCost(plan.cost,this.scene.objectRegistry)}):'';text(document.querySelector('#building-detail-hp-text'),t('building.hp',{hp:Math.ceil(hp.hp),max:hp.max})+(note?` · ${note}`:''));const bar=document.querySelector('#building-detail-hp-bar');bar.max=hp.max;bar.value=hp.hp;}}}
    // m-hrad-urovne (owner 15 Nov 2026): the Upgrade is in this window.
    {const box=document.querySelector('#building-detail-upgrade');if(box){box.hidden=b.type!=='castle';if(b.type==='castle'){if(b.level)text(document.querySelector('#building-detail-description'),'');renderCastleUpgrade(this.scene,box,b);}}}
    this.scene.setGalleryInput(false);if(!this.dialog.open)this.dialog.showModal();this.attach(this.dialog,b);this.refresh();
  }
  reason(b){
    /* (80): the window opens in fog, demolishing still needs sight */if(!b||!this.scene.fog.isVisibleObject(b))return 'unavailable';if(b.type==='castle')return 'castle';if(b.type==='starter_stockpile')return 'starter';
    if(!buildingIsComplete(b))return 'unfinished';if(!this.scene.demolition.eligible(b))return 'unavailable';if(this.scene.demolition.roofBlocked(b))return 'roof';return null;
  }
  refundLabel(b){const refund=buildingDemolitionRefund(b,buildingDefinition(b));return Object.keys(refund).length?Object.entries(refund).map(([id,n])=>countName(this.scene.objectRegistry.require(id),n)).join(', '):t('demolition.noRefund');}
  ask(){
    const b=this.building(this.buildingId);if(this.reason(b)||b.demolition)return;
    this.pendingId=b.id;text(document.querySelector('#demolition-confirm-text'),t('demolition.confirmText',{name:buildingName(b),refund:this.refundLabel(b)}));
    this.scene.setGalleryInput(false);this.confirm.showModal();
  }
  refresh(){/* m-hrad-urovne: the Upgrade button follows the stores while the detail is open */{const b=this.dialog?.open?this.building(this.buildingId):null,box=b?.type==='castle'?document.querySelector('#building-detail-upgrade'):null;if(box)this.castleKey=renderCastleUpgrade(this.scene,box,b,this.castleKey);}
    const selected=this.building(this.selectedId);this.inspect.hidden=!selected||!buildingReachable(this.scene.fog,selected);
    if(selected){const label=t('demolition.inspect',{name:buildingName(selected)});text(this.inspect,label);this.inspect.title=label;}
    const b=this.building(this.buildingId);if(!b){this.section.hidden=true;if(this.host?.open)this.host.close();return;}
    this.section.hidden=!this.host?.open;if(this.section.hidden)return;
    const reason=this.reason(b),record=b.demolition;
    // m-trosky-znovu: Burnt Ruins offer the burnt building again for its full price.
    {const from=b.type==='burnt_ruins'&&b.burntFrom?this.scene.objectRegistry.require(b.burntFrom):null,show=!!from?.buildable&&!record;this.rebuild.hidden=this.rebuildNote.hidden=!show;
      if(show){const cost=Object.entries(from.cost).map(([id,n])=>countName(this.scene.objectRegistry.require(id),n)).join(', '),can=this.scene.inventory.canAfford(from.cost);text(this.rebuild,t('ruins.rebuild',{name:from.name}));text(this.rebuildNote,t(can?'ruins.rebuildCost':'ruins.rebuildCostMissing',{cost}));this.rebuild.disabled=!can;}}
    {const show=b.type==='tower'&&!b.enemy&&buildingIsComplete(b);this.ballista.hidden=!show||!!b.ballista;this.ballistaNote.hidden=!show;
      if(show){text(this.ballista,t('defense.mountBallista',{cost:formatCost(BALLISTA.cost,this.scene.objectRegistry)}));this.ballista.disabled=!this.scene.sandbox&&!this.scene.inventory.canAfford(BALLISTA.cost);text(this.ballistaNote,t(b.ballista?'defense.ballistaNote':'defense.ballistaOffer'));}}
    this.progress.setAttribute('aria-label',t('demolition.title'));
    text(this.heading,t('demolition.title'));text(this.refund,t('demolition.refund',{refund:this.refundLabel(b)}));text(this.start,t('demolition.start'));text(this.cancel,t('demolition.cancel'));
    this.start.hidden=!!record||b.type==='starter_stockpile';this.start.disabled=!!reason;this.cancel.hidden=!record;this.progress.hidden=!record;this.progress.value=record?.progress??0;
    text(this.status,reason?t(`demolition.${reason}`):!record?t('demolition.note'):record.workDone>=record.requiredWork?t('demolition.waitSafe'):t(record.assignedBuilders.length?'demolition.progress':'demolition.waitBuilder',{percent:record.progress.toFixed(1),count:record.assignedBuilders.length}));
    // Owner 9 Nov 2026: the explanation before dismantling shows on hovering the button (the refund line stays).
    {const note=!reason&&!record;this.status.hidden=note;this.start.title=note?t('demolition.note'):'';}
    {const can=canRelocate(this.scene,b),plan=b.relocation;this.move.hidden=!can;this.moveNote.hidden=!plan&&!can;
      if(can){const cost=relocationDefinition(b).cost;text(this.move,t('relocation.button',{cost:formatCost(cost,this.scene.objectRegistry)}));this.move.disabled=!this.scene.inventory.canAfford(cost);text(this.moveNote,t('relocation.note'));}
      else if(plan)text(this.moveNote,t(plan.siteId!=null?'relocation.inProgress':'relocation.inProgressLater'));}
    if(this.confirm.open){const pending=this.building(this.pendingId);document.querySelector('#demolition-confirm-accept').disabled=!!this.reason(pending)||!!pending?.demolition;}
  }
  destroy(){this.controller.abort();this.confirm.close();this.dialog.close();this.section.remove();this.inspect.hidden=true;}
}
