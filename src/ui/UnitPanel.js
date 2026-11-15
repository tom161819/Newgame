import { haulerCarry } from './transportLabels.js';
import { changeProfession,jobChoices,jobStatLabel,jobBlocked } from './jobChange.js';
import { HAUL_PRIORITIES,HAULABLE_RESOURCES } from '../data/logistics.js';
import { haulPriorityFromValue,haulPriorityValue,setHaulPriority } from '../systems/haulPriority.js';
import { localized,workMessageLabel } from '../i18n/names.js';
import { t,language } from '../i18n/index.js';
import { SKILLS,JOBS,WORK_RULES } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { TALENTS,TALENT_XP_BONUS } from '../data/economy.js';
import { carryCapacity,IDLE_STONE,defaultStoneCollection,TRANSPORT_MODES } from '../data/logistics.js';
import { cargoLabel,transportLabel } from './transportLabels.js';
import { blockingDialog } from './dockedPanels.js';
import { renderNeeds } from './NeedsDisplay.js';
import { KingSkillsSection } from './KingSkillsSection.js';

export class UnitPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#unit-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-unit').addEventListener('click',()=>this.close(),options);
    document.querySelector('#king-profile').addEventListener('click',()=>this.open(scene.character),options);
    this.jobSelect=document.querySelector('#assign-job');this.jobSelect.replaceChildren(...Object.entries(JOBS).map(([id,job])=>{const option=element('option','',job.name);option.value=id;return option;}));
    this.jobSelect.addEventListener('change',()=>{if(this.unit){changeProfession(scene,this.unit,this.jobSelect.value);this.jobSelect.value=this.unit.profession;}this.refresh();},options);
    this.stoneToggle=document.querySelector('#stone-collect');this.stoneRadius=document.querySelector('#stone-radius');
    // S12: a Hauler's transport mode (Auto takes a free Wheelbarrow when one exists).
    this.transportRow=document.createElement('label');this.transportRow.className='transport-mode';this.transportRow.append(document.createTextNode(t('transport.mode')+' '));
    this.transportMode=document.createElement('select');this.transportMode.id='transport-mode';for(const mode of TRANSPORT_MODES){const o=document.createElement('option');o.value=mode;o.textContent=t(`transport.mode.${mode}`);this.transportMode.append(o);}
    this.transportRow.append(this.transportMode);document.querySelector('#unit-stone-controls').append(this.transportRow);
    // m-nosic-priorita (owner, 12 Nov): what this Hauler carries first; the choice also goes to every other chosen Hauler.
    this.haulRow=document.createElement('label');this.haulRow.className='haul-priority';this.haulLabel=document.createTextNode('');this.haulRow.append(this.haulLabel);
    this.haulSelect=document.createElement('select');this.haulSelect.id='haul-priority';this.haulRow.append(this.haulSelect);document.querySelector('#unit-stone-controls').append(this.haulRow);
    this.haulSelect.addEventListener('change',()=>{if(this.unit?.profession!=='hauler')return;const priority=haulPriorityFromValue(this.haulSelect.value);
      const chosen=scene.unitSelection?.workers?.()??[];for(const w of new Set([this.unit,...chosen.filter(w=>w.profession==='hauler')]))setHaulPriority(w,priority);this.refresh();},options);
    this.transportMode.addEventListener('change',()=>{if(this.unit?.profession==='hauler'){scene.vehicles?.setMode(this.unit,this.transportMode.value);this.refresh();}},options);
    this.stoneToggle.addEventListener('change',()=>{if(this.unit?.profession==='hauler'){(this.unit.stoneCollection??=defaultStoneCollection()).enabled=this.stoneToggle.checked;this.refresh();}},options);
    this.stoneRadius.addEventListener('change',()=>{if(this.unit?.profession==='hauler'){const v=Math.min(IDLE_STONE.maxRadius,Math.max(0,Math.round(Number(this.stoneRadius.value))));(this.unit.stoneCollection??=defaultStoneCollection()).radius=Number.isFinite(v)?v:IDLE_STONE.defaultRadius;this.refresh();}},options);
    this.commandControls=element('div','unit-command-controls');
    // #120: compact icon commands through the existing UnitCommands; the name shows as a tooltip on hover or focus.
    for(const [action,icon]of [['hold','⏸'],['resume','▶']]){const button=element('button','icon-command',icon);button.type='button';button.dataset.unitCommand=action;button.addEventListener('click',()=>{scene.workerSystem.commands[action](this.unit);this.refresh();scene.unitSelection?.draw();},options);this.commandControls.append(button);}
    document.querySelector('#unit-job-controls').append(this.commandControls);
    // S13: the resident's needs, Happiness, mood, main problem and home.
    // Day and night N2: a soldier with "Tend torches" refills light places near his post.
    this.tendRow=element('label','unit-tend-torches');this.tendRow.id='unit-tend-torches';this.tendToggle=document.createElement('input');this.tendToggle.type='checkbox';this.tendToggle.id='unit-tend-toggle';
    this.tendRow.append(this.tendToggle,element('span','',t('unit.tendTorches')));this.tendRow.hidden=true;document.querySelector('#unit-job-controls').append(this.tendRow);
    // N3: a soldier makes a campfire beside him from local wood.
    this.campfireButton=element('button','unit-campfire',t('campfire.make'));this.campfireButton.type='button';this.campfireButton.id='unit-campfire';this.campfireButton.hidden=true;document.querySelector('#unit-job-controls').append(this.campfireButton);
    this.campfireButton.addEventListener('click',()=>{const u=this.unit;if(u?.profession!=='soldier')return;const b=scene.nightThreats?.makeCampfire(u);scene.setStatus?.(b?t('campfire.made',{name:u.name}):t('campfire.cannot'));this.refresh();},options);
    this.tendToggle.addEventListener('change',()=>{if(this.unit?.profession==='soldier'){this.unit.tendTorches=this.tendToggle.checked||undefined;this.refresh();}},options);
    this.needs=element('section','unit-needs');this.needs.id='unit-needs';this.needs.hidden=true;document.querySelector('#unit-job-controls').after(this.needs);
    // m-kral-odmeny-xp: the King's skill points and royal skills.
    this.kingSkills=new KingSkillsSection(scene,this.dialog,{onChange:()=>this.refresh()});
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.repeat&&this.dialog.open&&!blockingDialog(document)){e.preventDefault();this.close();}},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  // Docked beside the map (no modal backdrop): the scene stays visible and clicking another villager switches the detail.
  open(unit,{management=false}={}){this.unit=unit;this.management=management&&this.scene.workerSystem?.workers.get(unit.id)===unit&&unit.isSubject!==false;this.restored=false;if(!this.dialog.open)this.dialog.show();this.refresh();this.scene.unitSelection?.draw();}
  renderHaulPriority(u){
    const s=this.scene,sig=language();if(this.haulSig!==sig){this.haulSig=sig;this.haulLabel.textContent=t('haul.priority')+' ';
      const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
      this.haulSelect.replaceChildren(...HAUL_PRIORITIES.filter(k=>k!=='resource').map(k=>option(k,t(`haul.priority.${k}`))),...HAULABLE_RESOURCES.map(r=>option(`resource:${r}`,t('haul.priority.only',{resource:s.objectRegistry.get(r)?.name??r}))));}
    const value=haulPriorityValue(u.haulPriority);if(document.activeElement!==this.haulSelect&&this.haulSelect.value!==value)this.haulSelect.value=value;
  }
  refresh(){
    if(!this.dialog.open||!this.unit)return;
    const s=this.scene,u=this.unit,view=u.view??u.sprite;
    const managed=this.management&&s.workerSystem?.workers.get(u.id)===u&&u.isSubject!==false&&u.isAlive;
    if((!view?.scene||!s.fog.isVisibleObject(u))&&!managed){this.close();return;}
    const e=s.experienceSystem.getLevelProgress(u),format=n=>String(Math.round(n*100)/100);
    document.querySelector('#unit-name').textContent=u.fullName??u.name??u.definition.name;
    document.querySelector('#unit-level').textContent=t('unit.level',{level:e.level,max:e.maxLevel});
    document.querySelector('#unit-xp').textContent=e.level===e.maxLevel?t('unit.xpMax'):t('unit.xpProgress',{current:format(e.currentXP),next:e.xpToNextLevel});
    document.querySelector('#unit-cargo').textContent=cargoLabel(s,u);document.querySelector('#unit-transport').textContent=transportLabel(s,u);
    const bar=document.querySelector('#unit-xp-bar');bar.max=e.xpToNextLevel||1;bar.value=e.level===e.maxLevel?1:e.currentXP;
    const values={hp:`${format(u.currentHP)} / ${u.maxHP}`,dps:format(u.attackDPS),armor:`${format(u.armor)} %`,totalXP:format(e.totalXP)};
    for(const [key,value]of Object.entries(values))document.querySelector(`[data-unit-stat="${key}"]`).textContent=value;
    const worker=s.workerSystem?.workers.has(u.id)&&u.isSubject!==false;document.querySelector('#unit-job-controls').hidden=!worker;
    if(worker){this.commandControls.hidden=!s.workerSystem.commands.owns(u);const state=u.commandState?.state,holding=state==='Holding'||state==='MovingToHold';for(const button of this.commandControls.children){const action=button.dataset.unitCommand,label=t(`command.${action}`);button.setAttribute('aria-label',label);button.dataset.tooltip=label;button.disabled=!!s.gameTime.paused||(action==='hold'?state==='Holding':!holding);if(action==='hold')button.setAttribute('aria-pressed',String(holding));}// m-zamestnani-2 (19): the panel refreshes all the time; rewriting an open <select> closed it, so the first pick
    // was lost. Texts change only when they differ, and the value is left alone while the list has focus.
    {const choices=new Map(jobChoices(s,u).map(c=>[c.id,c]));for(const option of this.jobSelect.options){const c=choices.get(option.value),name=c?jobStatLabel(JOBS[option.value].name,c.stat):JOBS[option.value].name,blocked=!!c&&jobBlocked(c);if(option.textContent!==name)option.textContent=name;if(option.disabled!==blocked)option.disabled=blocked;}}if(document.activeElement!==this.jobSelect&&this.jobSelect.value!==u.profession)this.jobSelect.value=u.profession;document.querySelector('#unit-profession').textContent=JOBS[u.profession].name+(u.profession==='hauler'&&s.workerSystem.workers.get(u.id)===u?` · ${haulerCarry(s,u)}`:'');document.querySelector('#unit-work-state').textContent=`${(['Holding','MovingToHold'].includes(u.commandState?.state)?t(`command.${u.commandState.state}`):localized(`work.state.${u.workState}`,u.workState))}${u.workMessage?` · ${workMessageLabel(u.workMessage)}`:''}${s.foodSystem.workMultiplier(u)<1?` · ${t('unit.hungry')}`:''}`;
      this.tendRow.hidden=u.profession!=='soldier';this.campfireButton.hidden=u.profession!=='soldier';if(!this.tendRow.hidden)this.tendToggle.checked=!!u.tendTorches;
      const hauler=u.profession==='hauler'&&u.stoneCollection;document.querySelector('#unit-stone-controls').hidden=!hauler;if(hauler){this.renderHaulPriority(u);this.transportMode.value=s.vehicles?.mode(u)??'auto';this.stoneToggle.checked=u.stoneCollection.enabled;if(document.activeElement!==this.stoneRadius)this.stoneRadius.value=u.stoneCollection.radius;}
      document.querySelector('#unit-wage').textContent=t('unit.wage',{amount:s.wageSystem.dailyWage(u).toFixed(2)});
      document.querySelector('#unit-talent').textContent=t('unit.talent',{talent:localized(`talent.${u.naturalTalent}`,TALENTS[u.naturalTalent]),bonus:TALENT_XP_BONUS*100,skill:SKILLS[u.naturalTalent]});
      document.querySelector('#unit-unpaid').textContent=t('unit.unpaid',{amount:s.wageSystem.unpaid(u).toFixed(2)});
      const workshop=u.profession==='builder'?s.builderWorkshops?.workshopFor(u):null;
      document.querySelector('#unit-workplace').textContent=u.profession==='builder'&&s.builderWorkshops&&!workshop?t('unit.noBuilderWorkshop',{percent:50}):t('unit.workplace',{place:u.profession==='hauler'?t('unit.wholeKingdom'):(workshop??s.workplaceSystem?.building(u))?.definition.name??(u.profession!=='idle'&&s.workplaceSystem?.hasWorkplaces?.(u.profession)?t('unit.noFreeWorkplace'):t('unit.notAssigned'))});
      // Z2: a Hunter's dog.
      {const dog=u.profession==='hunter'?s.domestic?.dogOf?.(u):null,el=document.querySelector('#unit-workplace');if(dog)el.textContent+=` · ${t('pets.dog.unitLine',{name:dog.name,state:dog.injuredUntil!=null?t('pets.dog.injuredShort'):''}).trim()}`;}
    }
    renderNeeds(this.needs,worker&&s.needs?s.needs.status(u):null);
    const signature=JSON.stringify([u.skills,u.naturalTalent,language()]);
    if(this.skillSignature!==`${u.id}:${signature}`){
      const rows=Object.entries(SKILLS).map(([id,name])=>{const skill=u.skills[id],talented=id===u.naturalTalent,row=element('div',`skill-row${talented?' talented-skill':''}`);row.dataset.skill=id;row.append(element('strong','',`${name}${talented?' ★':''}`),element('span','',t('unit.skillLevel',{level:skill.level})),element('span','',skill.level===skill.maxLevel?t('unit.xpMax'):t('unit.skillXp',{current:format(skill.currentXP),next:skill.xpToNextLevel})),element('small','',id==='logistics'?t('unit.haulerCapacity',{count:carryCapacity({...u,profession:'hauler'})}):`${Math.round((1+(skill.level-1)*WORK_RULES.efficiencyPerLevel)*100)} %${talented?' · +20 % XP':''}`));return row;});
      document.querySelector('#unit-skills').replaceChildren(...rows);this.skillSignature=`${u.id}:${signature}`;
    }
    this.kingSkills?.render(u);
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();if(!this.destroyed)this.scene.unitSelection?.draw();}
  destroy(){this.destroyed=true;this.close();this.needs?.remove();this.kingSkills?.destroy();this.controller.abort();this.commandControls.remove();this.transportRow.remove();}
}
