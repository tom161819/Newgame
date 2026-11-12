import { localized,workMessageLabel } from '../i18n/names.js';
import { TORCH_TARGET_MAX } from '../systems/FoodProductionSystem.js';
import { t } from '../i18n/index.js';
import { buildingDefinition } from '../game/buildings.js';
import { JOBS,SKILLS } from '../data/jobs.js';
import { TALENTS } from '../data/economy.js';
import { element } from './objectLabels.js';
import { CANDIDATE_GROUPS,candidateGroups } from './workplaceCandidates.js';
import { buildingIssueLine } from './noticeText.js';
import { buildingName } from '../game/depletedMine.js';
import { renderMilitary,militarySignature,handleMilitaryClick } from './militaryPanel.js';
import { staffingLine } from '../systems/StaffingStatus.js';

export class WorkplacePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#workplace-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    this.farmCount=element('p');this.farmCount.id='farm-plot-count';this.farmCount.hidden=true;this.dialog.insertBefore(this.farmCount,document.querySelector('#food-production-details'));
    // farmhouse-store (8 Nov 2026): a workplace with its own store (the Farmhouse's grain store) shows its fill and opens the store window.
    this.farmStore=element('section','farm-store');this.farmStore.id='farm-store';this.farmStore.hidden=true;this.farmStoreText=element('p');this.farmStoreText.id='farm-store-text';
    this.farmStoreButton=element('button','',t('workplace.openStore'));this.farmStoreButton.type='button';this.farmStoreButton.id='farm-store-open';
    this.farmStoreButton.addEventListener('click',()=>{const b=this.building;if(!b)return;this.close();scene.storagePanel?.open(b);},options);
    this.farmStore.append(this.farmStoreText,this.farmStoreButton);this.dialog.insertBefore(this.farmStore,document.querySelector('#food-production-details'));
    this.staffingStatus=element('p');this.staffingStatus.id='workplace-staffing-output';this.dialog.insertBefore(this.staffingStatus,document.querySelector('#food-production-details'));
    this.exclusions=element('section');this.exclusions.id='employment-exclusions';this.exclusionInputs={};this.exclusionLabels={};
    for(const kind of ['local','type']){const label=element('label','exclusion-toggle'),input=element('input'),text=element('span','exclusion-text'),icon=element('span','exclusion-icon',kind==='local'?'⊘':'⛔');icon.setAttribute('aria-hidden','true');label.dataset.kind=kind;input.type='checkbox';input.dataset.employmentExclusion=kind;this.exclusionInputs[kind]=input;this.exclusionLabels[kind]=text;label.append(input,icon,text);this.exclusions.append(label);
      input.addEventListener('change',()=>{const e=scene.employment;if(e&&this.building){if(kind==='local')e.setBuildingDisabled(this.building,input.checked);else e.setTypeDisabled(this.building,input.checked);}this.pendingMove=null;this.signature=null;this.refresh();},options);}
    this.exclusionReason=element('p');this.exclusionReason.id='employment-exclusion-reason';this.exclusionHelp=element('p');this.exclusionReason.hidden=true;this.exclusionHelp.hidden=true;this.exclusions.append(this.exclusionReason,this.exclusionHelp);
    // Owner 9 Nov 2026: the two bans are icon toggles at the top right of the window; their texts show on hover.
    {const heading=this.dialog.querySelector('.dialog-heading'),close=heading?.querySelector('button');this.exclusions.classList.add('exclusion-icons');if(close)heading.insertBefore(this.exclusions,close);else this.dialog.insertBefore(this.exclusions,document.querySelector('#food-production-details'));}
    this.forestryDetails=element('section');this.forestryDetails.id='forestry-details';this.forestryDetails.hidden=true;this.forestryTrees=element('p');this.forestryTrees.id='forestry-tree-count';this.forestryTotal=element('p');this.forestryTotal.id='forestry-output-total';this.forestryToday=element('p');this.forestryToday.id='forestry-output-today';this.forestryDetails.append(this.forestryTrees,this.forestryTotal,this.forestryToday);this.dialog.insertBefore(this.forestryDetails,document.querySelector('#food-production-details'));
    // m-drevorubci-stromy: young trees in the radius and when the next one is mature.
    this.forestryYoung=element('p');this.forestryYoung.id='forestry-young';this.forestryDetails.insertBefore(this.forestryYoung,this.forestryTotal);
    this.militaryDetails=element('section','military-details');this.militaryDetails.id='military-details';this.militaryDetails.hidden=true;this.dialog.insertBefore(this.militaryDetails,document.querySelector('#food-production-details'));
    this.miningDetails=element('p');this.miningDetails.id='mining-details';this.miningDetails.hidden=true;this.dialog.insertBefore(this.miningDetails,this.forestryDetails);
    // m-zvirata-3 (71): rats and cats of a rat building (Mill, Bakery, Farmhouse).
    this.ratsDetails=element('p','rats-line');this.ratsDetails.id='workplace-rats';this.ratsDetails.hidden=true;this.dialog.insertBefore(this.ratsDetails,this.forestryDetails);
    // Owner points 14–15: a depleted source or a full output, with advice (the same issue the notice and the icon show).
    this.issueLine=element('p','workplace-issue');this.issueLine.id='workplace-issue';this.issueLine.hidden=true;{const heading=this.dialog.querySelector('.dialog-heading');if(heading)heading.after(this.issueLine);else this.dialog.insertBefore(this.issueLine,this.miningDetails);}
    document.querySelector('#close-workplace').addEventListener('click',()=>this.close(),options);
    document.querySelector('#assign-workplace-worker').addEventListener('click',()=>{document.querySelector('#workplace-candidates').hidden=!document.querySelector('#workplace-candidates').hidden;},options);
    // S12: a workshop with several recipes (Wheelwright: Wheelbarrow or Horse Wagon); a running batch keeps its recipe.
    document.querySelector('#recipe-choice').addEventListener('change',e=>{if(this.building)scene.foodProduction.setRecipe(this.building.id,e.target.value);this.refresh();},options);
    document.querySelector('#toggle-food-production').addEventListener('click',()=>{const record=scene.foodProduction.records.get(this.building?.id);if(record)scene.foodProduction.toggle(this.building.id,!record.auto);this.refresh();},options);
    // m-zamestnani-2 (35): while someone works the panel redraws its rows (progress text), which replaced the button
    // between press and release, so "Remove worker" was lost. Rows are kept still while a button is held down.
    this.dialog.addEventListener('pointerdown',e=>{if(e.target.closest('button'))this.pressing=true;},options);
    document.addEventListener('pointerup',()=>{if(this.pressing)setTimeout(()=>{this.pressing=false;},0);},{...options,capture:true});
    document.addEventListener('pointercancel',()=>{this.pressing=false;},options);
    this.dialog.addEventListener('click',e=>{
      this.pressing=false;const button=e.target.closest('button');if(!button)return;
      if(handleMilitaryClick(scene,button)){this.signature=null;this.refresh();return;}
      const assign=button.dataset.assignWorker,remove=button.dataset.removeWorker;
      // Moving someone who already has another job takes a second, confirming click.
      if(assign&&button.dataset.confirmMove&&this.pendingMove!==assign){this.pendingMove=assign;this.signature=null;this.refresh();return;}
      if(assign){this.pendingMove=null;const worker=scene.workerSystem.workers.get(assign);if(scene.workplaceSystem.assign(this.building,worker))scene.employment?.release(worker);}
      if(remove){const worker=scene.workerSystem.workers.get(remove);scene.employment?.hold(worker);scene.workplaceSystem.remove(worker);}this.refresh();
    },options);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.dialog.open&&this.dialog.classList.contains('farm-workplace-dialog')&&!document.querySelector('dialog:modal')){e.preventDefault();e.stopPropagation();this.close();}},options);
    window.addEventListener('resize',()=>{if(this.dialog.open&&this.building?.type==='farmhouse')requestAnimationFrame(()=>{if(this.dialog.open&&this.building?.type==='farmhouse')this.scene.farmConnections?.focus(this.building,this.dialog);});},options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>{if(!this.dialog.open)this.restoreInput();},options);
  }
  open(building){if(this.dialog.open)this.close();this.building=building;this.signature=null;this.pendingMove=null;this.restored=false;this.scene.setGalleryInput(false);document.querySelector('#workplace-candidates').hidden=true;this.dialog.classList.toggle('farm-workplace-dialog',building.type==='farmhouse');if(building.type==='farmhouse')this.dialog.show();else this.dialog.showModal();this.scene.demolitionUI?.attach(this.dialog,building);this.refresh();this.scene.farmConnections?.refresh();if(building.type==='farmhouse')this.scene.farmConnections?.focus(building,this.dialog);}
  refresh(){
    if(this.pressing)return;
    if(!this.dialog.open||!this.building)return;
    const s=this.scene,b=this.building;if(!s.buildings.includes(b)||!s.fog.isVisibleObject(b)){this.close();return;}
    const spec=buildingDefinition(b),summary=s.workplaceSystem.summary(b),employees=s.workplaceSystem.employees(b),candidates=s.workerSystem.liveSubjects();
    const plots=b.type==='farmhouse'?s.farmingSystem?.plotSummary(b):null;this.farmCount.hidden=!plots;if(plots)this.farmCount.textContent=t('farmPlots.count',plots);
    const store=spec.storage&&s.foodStorage?[...s.foodStorage.locations.values()].find(l=>l.buildingId===b.id&&s.foodStorage.isStock(l)):null;this.farmStore.hidden=!store;
    if(store){const used=s.foodStorage.used(store),list=Object.entries(store.stock).filter(([,n])=>n>0).map(([id,n])=>`${n} ${s.objectRegistry.require(id).name}`).join(' + ')||t('transport.empty');this.farmStoreText.textContent=t('workplace.store',{used,capacity:store.capacity,list});}
    const employment=s.employment,blocked=employment?.blockReason(b)??null;
    this.exclusions.hidden=!employment||!!b.depleted;this.exclusionInputs.local.checked=employment?.blockedBuildings.has(b.id)??false;this.exclusionInputs.type.checked=employment?.blockedTypes.has(b.type)??false;
    for(const kind of ['local','type'])this.exclusionLabels[kind].textContent=t(`employment.exclude.${kind}`,{name:spec.name});this.exclusionReason.textContent=t(`employment.exclude.${blocked??'allowed'}`+'Status');this.exclusionHelp.textContent=t('employment.exclude.help');for(const kind of ['local','type']){const label=this.exclusionLabels[kind].parentElement;label.title=`${this.exclusionLabels[kind].textContent}\n${this.exclusionReason.textContent}\n${this.exclusionHelp.textContent}`;label.classList.toggle('on',this.exclusionInputs[kind].checked);}
    const production=spec.recipe?s.foodProduction.records.get(b.id):null;
    const forestry=spec.id==='lumberjack_hut'?s.naturalResources.forestry.summary(b):null;this.forestryDetails.hidden=!forestry;
    const issue=buildingIssueLine(s,s.diagnostics?.buildingIssue?.(b.id));this.issueLine.hidden=!issue;this.issueLine.textContent=issue??'';{let anchor=this.dialog.querySelector('.dialog-heading');if(anchor?.nextElementSibling?.id==='workplace-image')anchor=anchor.nextElementSibling;if(anchor&&anchor.nextElementSibling!==this.issueLine)anchor.after(this.issueLine);/* the UI Lab layout restores its remembered order: keep the issue first there too */const order=this.dialog.__uiOriginalOrder;if(anchor&&Array.isArray(order)&&order[order.indexOf(anchor)+1]!==this.issueLine){const i=order.indexOf(this.issueLine);if(i>=0)order.splice(i,1);order.splice(order.indexOf(anchor)+1,0,this.issueLine);}}
    const stable=spec.horseCapacity&&s.stables?s.stables.summary(b.id):null,mining=spec.mining?s.naturalResources?.mining.summary(b):stable?t('stables.summary',{count:stable.horses.length,capacity:stable.capacity,taming:stable.taming}):spec.fishing&&s.fishing?s.fishing.summary(b):null;this.miningDetails.hidden=!mining;this.miningDetails.textContent=mining??'';
    const rats=s.domestic?.ratBuildings?.().some(r=>r.id===b.id)?s.domestic.status(b.id):null;this.ratsDetails.hidden=!rats;
    if(rats){this.ratsDetails.className=`rats-line ${rats.level}`;this.ratsDetails.dataset.rats=rats.level;this.ratsDetails.textContent=t('pets.ratsLine',{level:t(`pets.level.${rats.level}`),loss:rats.loss,cats:rats.cats,needed:rats.needed});}
    const signature=JSON.stringify([rats,blocked,this.exclusionInputs.local.checked,this.exclusionInputs.type.checked,summary,production,forestry,mining,production?s.foodStorage.revision:0,employees.map(w=>[w.id,w.workState,w.workMessage,w.skills[spec.workplace.skill].level]),militarySignature(s,b),candidates.map(w=>[w.id,w.profession,w.assignedWorkplaceId,w.naturalTalent,w.skills[spec.workplace.skill].level,w.skills[spec.workplace.skill].totalXP]),this.pendingMove]);if(signature===this.signature)return;this.signature=signature;
    if(forestry){this.forestryTrees.textContent=t(forestry.known?'workplace.knownTrees':'workplace.trees',{count:forestry.trees});this.forestryTotal.textContent=t('workplace.timber',{count:forestry.harvested});this.forestryToday.textContent=t('workplace.woodToday',{count:forestry.today});
      this.forestryYoung.textContent=`${t('workplace.youngTrees',{count:forestry.young})} · ${forestry.nextDays==null?t('workplace.nextTreeNone'):t('workplace.nextTree',{days:forestry.nextDays<1?'<1':String(Math.round(forestry.nextDays)),count:Math.max(1,Math.round(forestry.nextDays))})}`;}
    const recipePanel=document.querySelector('#food-production-details');recipePanel.hidden=!production;
    if(production){
      const format=items=>Object.entries(items).map(([id,n])=>`${n} ${s.objectRegistry.require(id).name}`).join(' + '),cycle=production.cycle;
      const recipe=s.foodProduction.recipe(b),choice=document.querySelector('#recipe-choice'),choiceRow=document.querySelector('#recipe-choice-row');choiceRow.hidden=!spec.recipes;
      if(spec.recipes){const auto=spec.recipeChoice?1:0;
        if(choice.dataset.building!==String(b.id)||choice.options.length!==Object.keys(spec.recipes).length+auto){const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
          choice.replaceChildren(...(auto?[option('auto',t('workplace.recipeAuto'))]:[]),...Object.entries(spec.recipes).map(([key,r])=>option(key,s.objectRegistry.require(Object.keys(r.output)[0]).name)));choice.dataset.building=String(b.id);}
        choice.value=s.foodProduction.recipeMode(b);}
      // m-smolar-pochodne: the automatic choice says what it makes and why, with the Torch target to set.
      let autoRow=document.querySelector('#recipe-auto-row');
      if(!autoRow){autoRow=document.createElement('p');autoRow.id='recipe-auto-row';autoRow.className='recipe-auto-row';const text=document.createElement('span');text.id='recipe-auto-text';const range=document.createElement('input');range.type='range';range.id='recipe-torch-target';range.min='0';range.max=String(TORCH_TARGET_MAX);range.step='1';
        range.addEventListener('input',()=>{if(this.building)s.foodProduction.setTorchTarget(this.building.id,range.value);this.refresh();});autoRow.append(text,range);choiceRow.after(autoRow);}
      const isAuto=!!spec.recipeChoice&&s.foodProduction.recipeMode(b)==='auto';autoRow.hidden=!isAuto;
      if(isAuto){const target=s.foodProduction.torchTarget(b),have=s.foodStorage.available('torch'),range=autoRow.querySelector('input');if(document.activeElement!==range)range.value=String(target);range.setAttribute('aria-label',t('workplace.torchTarget'));
        autoRow.querySelector('span').textContent=t(production.recipe===spec.recipeChoice?'workplace.autoTorches':'workplace.autoPitch',{have,target});}
      document.querySelector('#food-production-recipe').textContent=t('workplace.recipe',{input:format(recipe.input),output:format(recipe.output),seconds:recipe.duration/1000})+(recipe.horse?` ${t('workplace.recipeHorse')}`:'');
      document.querySelector('#food-production-status').textContent=t('workplace.status',{state:!production.auto?t('workplace.paused'):cycle?t('workplace.producing'):employees[0]?.workMessage?workMessageLabel(employees[0].workMessage):t('workplace.waitingWorker'),count:production.completed});
      document.querySelector('#food-production-progress').value=cycle?.progress??0;
      const input=s.foodStorage.locations.get(`input-${b.id}`),output=s.foodStorage.locations.get(`output-${b.id}`);
      document.querySelector('#food-production-buffers').textContent=t('workplace.buffers',{input:format(input.stock)||t('transport.empty'),output:format(output.stock)||t('transport.empty')});
      document.querySelector('#food-production-missing').textContent=cycle?t('workplace.batch',{list:format(cycle.inputs)}):t('workplace.missing',{list:format(Object.fromEntries(Object.entries(recipe.input).map(([id,n])=>[id,Math.max(0,n-(input.stock[id]??0))])))});
      const toggle=document.querySelector('#toggle-food-production');toggle.textContent=t('workplace.auto',{state:t(production.auto?'state.on':'state.off')});toggle.setAttribute('aria-pressed',String(production.auto));
    }
    document.querySelector('#workplace-name').textContent=buildingName(b);const image=document.querySelector('#workplace-image');image.src=s.assets.previewURL(spec);image.alt=buildingName(b);
    this.staffingStatus.textContent=b.depleted?t('building.depletedInfo'):staffingLine(summary);
    document.querySelector('#workplace-count').textContent=t('workplace.workers',{count:summary.count,capacity:summary.capacity});
    document.querySelector('#workplace-wages').textContent=t('workplace.wages',{amount:summary.wages.toFixed(2)});
    document.querySelector('#workplace-average').textContent=t('workplace.average',{skill:SKILLS[spec.workplace.skill],value:summary.averageSkill.toFixed(2)});
    document.querySelector('#workplace-production').textContent=t('workplace.delivered',{list:Object.entries(summary.delivered).map(([id,n])=>`${s.objectRegistry.require(id).name} ${n}`).join(' · ')||'0'});
    const rows=employees.map(w=>{const row=element('li','workplace-worker'),text=element('span','',`${w.name} · ${t('workplace.skillLevel',{skill:SKILLS[spec.workplace.skill],level:w.skills[spec.workplace.skill].level})} · ${localized(`work.state.${w.workState}`,w.workState)}${w.workMessage?` — ${workMessageLabel(w.workMessage)}`:''}`),remove=element('button','',t('workplace.remove'));remove.type='button';remove.dataset.removeWorker=w.id;row.append(text,remove);return row;});
    if(!b.depleted)for(let i=summary.count;i<summary.capacity;i++)rows.push(element('li','empty-slot',t('workplace.emptySlot')));document.querySelector('#workplace-workers').replaceChildren(...rows);renderMilitary(s,b,this.militaryDetails,employees);
    document.querySelector('#assign-workplace-worker').disabled=!!blocked||summary.count>=summary.capacity;
    // Three groups in a fixed order (this profession without a workplace, others without one, already working: elsewhere or as a Hauler/Builder), each sorted by the skill this building needs.
    const skill=spec.workplace.skill,groups=candidateGroups(candidates,spec.workplace),full=summary.count>=summary.capacity;
    const workplaceName=w=>{const home=s.buildings.find(x=>x.id===w.assignedWorkplaceId);return home?buildingName(home):JOBS[w.profession].name;};
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
      section.append(element('h3','',t(`workplace.group.${group}`,{count:groups[group].length,profession:JOBS[spec.workplace.profession]?.name??spec.workplace.profession})),list);return section;
    }));
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();this.scene.farmConnections?.refresh();}
  destroy(){this.close();this.controller.abort();this.farmCount.remove();this.staffingStatus.remove();this.exclusions.remove();this.forestryDetails.remove();this.miningDetails.remove();this.issueLine.remove();this.militaryDetails.remove();}
}
