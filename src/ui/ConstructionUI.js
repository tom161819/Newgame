import { buildingDefinition } from '../game/buildings.js';
import { constructionPhase,CONSTRUCTION_RULES } from '../data/construction.js';

export class ConstructionUI {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#construction-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-construction').addEventListener('click',()=>this.close(),options);
    document.querySelector('#construction-king-work').addEventListener('click',()=>{scene.constructionSystem.commandKing(this.site);this.refresh();},options);
    document.querySelector('#construction-king-stop').addEventListener('click',()=>{scene.constructionSystem.stopKing();this.refresh();},options);
    document.querySelector('#cancel-construction').addEventListener('click',()=>{scene.constructionSystem.cancel(this.site);this.close();},options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(site){this.site=site;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open)return;const s=this.scene,site=this.site;if(!site||!s.constructionSystem.sites.has(site.id)||!s.fog.isVisibleObject(site)){this.close();return;}
    const c=site.construction,system=s.constructionSystem,active=system.activeBuilders(site),estimate=system.estimatedSeconds(site),king=system.assignments.get('king'),kingHere=king?.siteId===site.id;
    document.querySelector('#construction-name').textContent=buildingDefinition(site).name;
    document.querySelector('#construction-percentage').textContent=`${c.progress.toFixed(1)} % · ${constructionPhase(site)}`;document.querySelector('#construction-progress').value=c.progress;
    document.querySelector('#construction-builders').textContent=`Builders: ${active.length} working / ${CONSTRUCTION_RULES.maximumBuilders} slots · ${c.assignedBuilders.length} reserved`;
    document.querySelector('#construction-eta').textContent=estimate==null?'Waiting for builders':`Remaining: ${Math.ceil(estimate)} s`;
    document.querySelector('#construction-king-task').textContent=kingHere?(system.atSite(s.character,king)?'King: Building':'King: Travelling to construction site'):'King: Not assigned';
    const button=document.querySelector('#construction-king-work');button.disabled=kingHere||c.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders;document.querySelector('#construction-king-stop').hidden=!kingHere;
    document.querySelector('#construction-refund').textContent=`Cancel refund: ${c.workDone>0?'50 % (rounded down)':'100 %'}`;document.querySelector('#construction-unreachable').textContent=site.unreachableReason??'';
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();}
}
