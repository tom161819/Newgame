import { buildingDefinition } from '../game/buildings.js';
import { JOBS,SKILLS } from '../data/jobs.js';
import { TALENTS } from '../data/economy.js';
import { element } from './objectLabels.js';

export class WorkplacePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#workplace-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    this.forestryDetails=element('section');this.forestryDetails.id='forestry-details';this.forestryDetails.hidden=true;this.forestryTrees=element('p');this.forestryTrees.id='forestry-tree-count';this.forestryTotal=element('p');this.forestryTotal.id='forestry-output-total';this.forestryToday=element('p');this.forestryToday.id='forestry-output-today';this.forestryDetails.append(this.forestryTrees,this.forestryTotal,this.forestryToday);this.dialog.insertBefore(this.forestryDetails,document.querySelector('#food-production-details'));
    this.miningDetails=element('p');this.miningDetails.id='mining-details';this.miningDetails.hidden=true;this.dialog.insertBefore(this.miningDetails,this.forestryDetails);
    document.querySelector('#close-workplace').addEventListener('click',()=>this.close(),options);
    document.querySelector('#assign-workplace-worker').addEventListener('click',()=>{document.querySelector('#workplace-candidates').hidden=!document.querySelector('#workplace-candidates').hidden;},options);
    document.querySelector('#toggle-food-production').addEventListener('click',()=>{const record=scene.foodProduction.records.get(this.building?.id);if(record)scene.foodProduction.toggle(this.building.id,!record.auto);this.refresh();},options);
    this.dialog.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button)return;
      const assign=button.dataset.assignWorker,remove=button.dataset.removeWorker;
      if(assign)scene.workplaceSystem.assign(this.building,scene.workerSystem.workers.get(assign));
      if(remove)scene.workplaceSystem.remove(scene.workerSystem.workers.get(remove));this.refresh();
    },options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(building){this.building=building;this.signature=null;this.restored=false;this.scene.setGalleryInput(false);document.querySelector('#workplace-candidates').hidden=true;this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open||!this.building)return;
    const s=this.scene,b=this.building;if(!s.buildings.includes(b)||!s.fog.isVisibleObject(b)){this.close();return;}
    const spec=buildingDefinition(b),summary=s.workplaceSystem.summary(b),employees=s.workplaceSystem.employees(b),candidates=s.workerSystem.liveSubjects().filter(w=>w.assignedWorkplaceId!==b.id);
    const production=spec.recipe?s.foodProduction.records.get(b.id):null;
    const forestry=spec.id==='lumberjack_hut'?s.naturalResources.forestry.summary(b):null;this.forestryDetails.hidden=!forestry;
    const mining=spec.mining?s.naturalResources?.mining.summary(b):null;this.miningDetails.hidden=!mining;this.miningDetails.textContent=mining??'';
    const signature=JSON.stringify([summary,production,forestry,mining,production?s.foodStorage.revision:0,employees.map(w=>[w.id,w.workState,w.workMessage,w.skills[spec.workplace.skill].level]),candidates.map(w=>[w.id,w.profession,w.naturalTalent,w.skills[spec.workplace.skill].level])]);if(signature===this.signature)return;this.signature=signature;
    if(forestry){this.forestryTrees.textContent=`${forestry.known?'Known mature':'Mature'} trees in working radius: ${forestry.trees}`;this.forestryTotal.textContent=`Timber cut: ${forestry.harvested} Wood`;this.forestryToday.textContent=`Wood production today: ${forestry.today}`;}
    const recipePanel=document.querySelector('#food-production-details');recipePanel.hidden=!production;
    if(production){
      const format=items=>Object.entries(items).map(([id,n])=>`${n} ${s.objectRegistry.require(id).name}`).join(' + '),cycle=production.cycle;
      document.querySelector('#food-production-recipe').textContent=`${format(spec.recipe.input)} → ${format(spec.recipe.output)} · ${spec.recipe.duration/1000} seconds of active work`;
      document.querySelector('#food-production-status').textContent=`${!production.auto?'Paused':cycle?'Producing':employees[0]?.workMessage||'Waiting for Worker'} · ${production.completed} batches completed`;
      document.querySelector('#food-production-progress').value=cycle?.progress??0;
      const input=s.foodStorage.locations.get(`input-${b.id}`),output=s.foodStorage.locations.get(`output-${b.id}`);
      document.querySelector('#food-production-buffers').textContent=`Input: ${format(input.stock)||'empty'} · Output: ${format(output.stock)||'empty'}`;
      document.querySelector('#food-production-missing').textContent=cycle?`Current batch: ${format(cycle.inputs)}`:`Missing: ${format(Object.fromEntries(Object.entries(spec.recipe.input).map(([id,n])=>[id,Math.max(0,n-(input.stock[id]??0))])))}`;
      const toggle=document.querySelector('#toggle-food-production');toggle.textContent=`Auto Production: ${production.auto?'ON':'OFF'}`;toggle.setAttribute('aria-pressed',String(production.auto));
    }
    document.querySelector('#workplace-name').textContent=spec.name;const image=document.querySelector('#workplace-image');image.src=s.assets.previewURL(spec);image.alt=spec.name;
    document.querySelector('#workplace-count').textContent=`Workers: ${summary.count} / ${summary.capacity}`;
    document.querySelector('#workplace-wages').textContent=`Worker Wages: ${summary.wages.toFixed(2)} Gold/day`;
    document.querySelector('#workplace-average').textContent=`Average ${SKILLS[spec.workplace.skill]}: ${summary.averageSkill.toFixed(2)}`;
    document.querySelector('#workplace-production').textContent=`Delivered: ${Object.entries(summary.delivered).map(([id,n])=>`${s.objectRegistry.require(id).name} ${n}`).join(' · ')||'0'}`;
    const rows=employees.map(w=>{const row=element('li','workplace-worker'),text=element('span','',`${w.name} · ${SKILLS[spec.workplace.skill]} Lv. ${w.skills[spec.workplace.skill].level} · ${w.workState}${w.workMessage?` — ${w.workMessage}`:''}`),remove=element('button','','Remove Worker');remove.type='button';remove.dataset.removeWorker=w.id;row.append(text,remove);return row;});
    for(let i=summary.count;i<summary.capacity;i++)rows.push(element('li','empty-slot','Empty Slot'));document.querySelector('#workplace-workers').replaceChildren(...rows);
    document.querySelector('#assign-workplace-worker').disabled=summary.count>=summary.capacity;
    document.querySelector('#workplace-candidates').replaceChildren(...candidates.map(w=>{const row=element('li','workplace-worker'),button=element('button','','Assign');button.type='button';button.dataset.assignWorker=w.id;button.disabled=summary.count>=summary.capacity;
      row.append(element('span','',`${w.name} · ${JOBS[w.profession].name} · ${SKILLS[spec.workplace.skill]} Lv. ${w.skills[spec.workplace.skill].level} · ${TALENTS[w.naturalTalent]} · ${s.workplaceSystem.predictedWage(w,spec.workplace.profession).toFixed(2)} Gold/day`),button);return row;}));
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();this.forestryDetails.remove();this.miningDetails.remove();}
}
