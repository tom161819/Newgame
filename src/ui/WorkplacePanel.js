import { localized,workMessageLabel } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { buildingDefinition } from '../game/buildings.js';
import { JOBS,SKILLS } from '../data/jobs.js';
import { TALENTS } from '../data/economy.js';
import { element } from './objectLabels.js';
import { CANDIDATE_GROUPS,candidateGroups } from './workplaceCandidates.js';
import { renderMilitary,militarySignature,handleMilitaryClick } from './militaryPanel.js';

export class WorkplacePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#workplace-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    this.farmCount=element('p');this.farmCount.id='farm-plot-count';this.farmCount.hidden=true;this.dialog.insertBefore(this.farmCount,document.querySelector('#food-production-details'));
    this.staffingStatus=element('p');this.staffingStatus.id='workplace-staffing-output';this.dialog.insertBefore(this.staffingStatus,document.querySelector('#food-production-details'));
    this.exclusions=element('section');this.exclusions.id='employment-exclusions';this.exclusionInputs={};this.exclusionLabels={};
    for(const kind of ['local','type']){const label=element('label'),input=element('input'),text=element('span');input.type='checkbox';input.dataset.employmentExclusion=kind;this.exclusionInputs[kind]=input;this.exclusionLabels[kind]=text;label.append(input,text);this.exclusions.append(label);
      input.addEventListener('change',()=>{const e=scene.employment;if(e&&this.building){if(kind==='local')e.setBuildingDisabled(this.building,input.checked);else e.setTypeDisabled(this.building,input.checked);}this.pendingMove=null;this.signature=null;this.refresh();},options);}
    this.exclusionReason=element('p');this.exclusionReason.id='employment-exclusion-reason';this.exclusionHelp=element('p');this.exclusions.append(this.exclusionReason,this.exclusionHelp);this.dialog.insertBefore(this.exclusions,document.querySelector('#food-production-details'));
    this.forestryDetails=element('section');this.forestryDetails.id='forestry-details';this.forestryDetails.hidden=true;this.forestryTrees=element('p');this.forestryTrees.id='forestry-tree-count';this.forestryTotal=element('p');this.forestryTotal.id='forestry-output-total';this.forestryToday=element('p');this.forestryToday.id='forestry-output-today';this.forestryDetails.append(this.forestryTrees,this.forestryTotal,this.forestryToday);this.dialog.insertBefore(this.forestryDetails,document.querySelector('#food-production-details'));
    this.militaryDetails=element('section','military-details');this.militaryDetails.id='military-details';this.militaryDetails.hidden=true;this.dialog.insertBefore(this.militaryDetails,document.querySelector('#food-production-details'));
    this.miningDetails=element('p');this.miningDetails.id='mining-details';this.miningDetails.hidden=true;this.dialog.insertBefore(this.miningDetails,this.forestryDetails);
    document.querySelector('#close-workplace').addEventListener('click',()=>this.close(),options);
    document.querySelector('#assign-workplace-worker').addEventListener('click',()=>{document.querySelector('#workplace-candidates').hidden=!document.querySelector('#workplace-candidates').hidden;},options);
    // S12: a workshop with several recipes (Wheelwright: Wheelbarrow or Horse Wagon); a running batch keeps its recipe.
    document.querySelector('#recipe-choice').addEventListener('change',e=>{if(this.building)scene.foodProduction.setRecipe(this.building.id,e.target.value);this.refresh();},options);
    document.querySelector('#toggle-food-production').addEventListener('click',()=>{const record=scene.foodProduction.records.get(this.building?.id);if(record)scene.foodProduction.toggle(this.building.id,!record.auto);this.refresh();},options);
    this.dialog.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button)return;
      if(handleMilitaryClick(scene,button)){this.signature=null;this.refresh();return;}
      const assign=button.dataset.assignWorker,remove=button.dataset.removeWorker;
      // Moving someone who already has another job takes a second, confirming click.
      if(assign&&button.dataset.confirmMove&&this.pendingMove!==assign){this.pendingMove=assign;this.signature=null;this.refresh();return;}
      if(assign){this.pendingMove=null;const worker=scene.workerSystem.workers.get(assign);if(scene.workplaceSystem.assign(this.building,worker))scene.employment?.release(worker);}
      if(remove){const worker=scene.workerSystem.workers.get(remove);scene.employment?.hold(worker);scene.workplaceSystem.remove(worker);}this.refresh();
    },options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(building){this.building=building;this.signature=null;this.pendingMove=null;this.restored=false;this.scene.setGalleryInput(false);document.querySelector('#workplace-candidates').hidden=true;this.dialog.showModal();this.refresh();this.scene.farmConnections?.refresh();}
  refresh(){
    if(!this.dialog.open||!this.building)return;
    const s=this.scene,b=this.building;if(!s.buildings.includes(b)||!s.fog.isVisibleObject(b)){this.close();return;}
    const spec=buildingDefinition(b),summary=s.workplaceSystem.summary(b),employees=s.workplaceSystem.employees(b),candidates=s.workerSystem.liveSubjects();
    const plots=b.type==='farmhouse'?s.farmingSystem?.plotSummary(b):null;this.farmCount.hidden=!plots;if(plots)this.farmCount.textContent=t('farmPlots.count',plots);
    const employment=s.employment,blocked=employment?.blockReason(b)??null;
    this.exclusions.hidden=!employment;this.exclusionInputs.local.checked=employment?.blockedBuildings.has(b.id)??false;this.exclusionInputs.type.checked=employment?.blockedTypes.has(b.type)??false;
    for(const kind of ['local','type'])this.exclusionLabels[kind].textContent=t(`employment.exclude.${kind}`,{name:spec.name});this.exclusionReason.textContent=t(`employment.exclude.${blocked??'allowed'}`+'Status');this.exclusionHelp.textContent=t('employment.exclude.help');
    const production=spec.recipe?s.foodProduction.records.get(b.id):null;
    const forestry=spec.id==='lumberjack_hut'?s.naturalResources.forestry.summary(b):null;this.forestryDetails.hidden=!forestry;
    const stable=spec.horseCapacity&&s.stables?s.stables.summary(b.id):null,mining=spec.mining?s.naturalResources?.mining.summary(b):stable?t('stables.summary',{count:stable.horses.length,capacity:stable.capacity,taming:stable.taming}):null;this.miningDetails.hidden=!mining;this.miningDetails.textContent=mining??'';
    const signature=JSON.stringify([blocked,this.exclusionInputs.local.checked,this.exclusionInputs.type.checked,summary,production,forestry,mining,production?s.foodStorage.revision:0,employees.map(w=>[w.id,w.workState,w.workMessage,w.skills[spec.workplace.skill].level]),militarySignature(s,b),candidates.map(w=>[w.id,w.profession,w.assignedWorkplaceId,w.naturalTalent,w.skills[spec.workplace.skill].level,w.skills[spec.workplace.skill].totalXP]),this.pendingMove]);if(signature===this.signature)return;this.signature=signature;
    if(forestry){this.forestryTrees.textContent=t(forestry.known?'workplace.knownTrees':'workplace.trees',{count:forestry.trees});this.forestryTotal.textContent=t('workplace.timber',{count:forestry.harvested});this.forestryToday.textContent=t('workplace.woodToday',{count:forestry.today});}
    const recipePanel=document.querySelector('#food-production-details');recipePanel.hidden=!production;
    if(production){
      const format=items=>Object.entries(items).map(([id,n])=>`${n} ${s.objectRegistry.require(id).name}`).join(' + '),cycle=production.cycle;
      const recipe=s.foodProduction.recipe(b),choice=document.querySelector('#recipe-choice'),choiceRow=document.querySelector('#recipe-choice-row');choiceRow.hidden=!spec.recipes;
      if(spec.recipes){if(choice.dataset.building!==String(b.id)||choice.options.length!==Object.keys(spec.recipes).length){choice.replaceChildren(...Object.entries(spec.recipes).map(([key,r])=>{const o=document.createElement('option');o.value=key;o.textContent=s.objectRegistry.require(Object.keys(r.output)[0]).name;return o;}));choice.dataset.building=String(b.id);}choice.value=production.recipe;}
      document.querySelector('#food-production-recipe').textContent=t('workplace.recipe',{input:format(recipe.input),output:format(recipe.output),seconds:recipe.duration/1000})+(recipe.horse?` ${t('workplace.recipeHorse')}`:'');
      document.querySelector('#food-production-status').textContent=t('workplace.status',{state:!production.auto?t('workplace.paused'):cycle?t('workplace.producing'):employees[0]?.workMessage?workMessageLabel(employees[0].workMessage):t('workplace.waitingWorker'),count:production.completed});
      document.querySelector('#food-production-progress').value=cycle?.progress??0;
      const input=s.foodStorage.locations.get(`input-${b.id}`),output=s.foodStorage.locations.get(`output-${b.id}`);
      document.querySelector('#food-production-buffers').textContent=t('workplace.buffers',{input:format(input.stock)||t('transport.empty'),output:format(output.stock)||t('transport.empty')});
      document.querySelector('#food-production-missing').textContent=cycle?t('workplace.batch',{list:format(cycle.inputs)}):t('workplace.missing',{list:format(Object.fromEntries(Object.entries(recipe.input).map(([id,n])=>[id,Math.max(0,n-(input.stock[id]??0))])))});
      const toggle=document.querySelector('#toggle-food-production');toggle.textContent=t('workplace.auto',{state:t(production.auto?'state.on':'state.off')});toggle.setAttribute('aria-pressed',String(production.auto));
    }
    document.querySelector('#workplace-name').textContent=spec.name;const image=document.querySelector('#workplace-image');image.src=s.assets.previewURL(spec);image.alt=spec.name;
    this.staffingStatus.textContent=t('staffing.status',{count:summary.missing,percent:Math.round(summary.output*100),missing:summary.missing,present:summary.present});
    document.querySelector('#workplace-count').textContent=t('workplace.workers',{count:summary.count,capacity:summary.capacity});
    document.querySelector('#workplace-wages').textContent=t('workplace.wages',{amount:summary.wages.toFixed(2)});
    document.querySelector('#workplace-average').textContent=t('workplace.average',{skill:SKILLS[spec.workplace.skill],value:summary.averageSkill.toFixed(2)});
    document.querySelector('#workplace-production').textContent=t('workplace.delivered',{list:Object.entries(summary.delivered).map(([id,n])=>`${s.objectRegistry.require(id).name} ${n}`).join(' · ')||'0'});
    const rows=employees.map(w=>{const row=element('li','workplace-worker'),text=element('span','',`${w.name} · ${t('workplace.skillLevel',{skill:SKILLS[spec.workplace.skill],level:w.skills[spec.workplace.skill].level})} · ${localized(`work.state.${w.workState}`,w.workState)}${w.workMessage?` — ${workMessageLabel(w.workMessage)}`:''}`),remove=element('button','',t('workplace.remove'));remove.type='button';remove.dataset.removeWorker=w.id;row.append(text,remove);return row;});
    for(let i=summary.count;i<summary.capacity;i++)rows.push(element('li','empty-slot',t('workplace.emptySlot')));document.querySelector('#workplace-workers').replaceChildren(...rows);renderMilitary(s,b,this.militaryDetails,employees);
    document.querySelector('#assign-workplace-worker').disabled=!!blocked||summary.count>=summary.capacity;
    // Three groups in a fixed order (Unemployed, other profession, this profession), each sorted by the skill this building needs.
    const skill=spec.workplace.skill,groups=candidateGroups(candidates,spec.workplace),full=summary.count>=summary.capacity;
    const workplaceName=w=>{const home=s.buildings.find(x=>x.id===w.assignedWorkplaceId);return home?buildingDefinition(home).name:JOBS[w.profession].name;};
    const row=(w,group)=>{
      const item=element('li',`workplace-worker workplace-candidate candidate-${group}`),here=w.assignedWorkplaceId===b.id,portrait=element('img','candidate-portrait');portrait.alt='';portrait.src=s.populationSidebar?.portrait(w)??'';
      const details=element('span','candidate-details');details.append(element('strong','',w.name),element('span','',`${t('workplace.skillXP',{skill:SKILLS[skill],level:w.skills[skill].level,xp:Math.floor(w.skills[skill].totalXP??0)})} · ${localized(`talent.${w.naturalTalent}`,TALENTS[w.naturalTalent])}`),element('span','',`${t('workplace.currentJob',{job:w.profession==='idle'?JOBS.idle.name:workplaceName(w)})} · ${t('unit.wage',{amount:s.workplaceSystem.predictedWage(w,spec.workplace.profession).toFixed(2)})}`));
      const button=element('button','',here?t('workplace.assignedHere'):this.pendingMove===w.id?t('workplace.confirmMove',{job:workplaceName(w)}):t('workplace.assignOne'));button.type='button';
      if(here)button.disabled=true;else{button.dataset.assignWorker=w.id;button.disabled=full||!!blocked;button.title=blocked?this.exclusionReason.textContent:'';if(w.profession!=='idle')button.dataset.confirmMove='true';}
      item.append(portrait,details,button);return item;
    };
    document.querySelector('#workplace-candidates').replaceChildren(...CANDIDATE_GROUPS.map(group=>{
      const section=element('li','candidate-group'),list=element('ul','candidate-list');section.dataset.candidateGroup=group;
      list.append(...(groups[group].length?groups[group].map(w=>row(w,group)):[element('li','empty-slot',t('workplace.groupEmpty'))]));
      section.append(element('h3','',t(`workplace.group.${group}`,{count:groups[group].length})),list);return section;
    }));
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();this.scene.farmConnections?.refresh();}
  destroy(){this.close();this.controller.abort();this.farmCount.remove();this.staffingStatus.remove();this.exclusions.remove();this.forestryDetails.remove();this.miningDetails.remove();this.militaryDetails.remove();}
}
