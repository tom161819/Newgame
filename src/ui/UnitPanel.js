import { localized,workMessageLabel } from '../i18n/names.js';
import { t,language } from '../i18n/index.js';
import { SKILLS,JOBS,WORK_RULES } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { TALENTS,TALENT_XP_BONUS } from '../data/economy.js';
import { carryCapacity,IDLE_STONE,defaultStoneCollection } from '../data/logistics.js';
import { cargoLabel,transportLabel } from './transportLabels.js';

export class UnitPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#unit-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-unit').addEventListener('click',()=>this.close(),options);
    document.querySelector('#king-profile').addEventListener('click',()=>this.open(scene.character),options);
    this.jobSelect=document.querySelector('#assign-job');this.jobSelect.replaceChildren(...Object.entries(JOBS).map(([id,job])=>{const option=element('option','',job.name);option.value=id;return option;}));
    this.jobSelect.addEventListener('change',()=>{if(this.unit){if(this.jobSelect.value==='idle')scene.employment?.hold(this.unit);else scene.employment?.release(this.unit);scene.workerSystem.jobs.assign(this.unit,this.jobSelect.value);}this.refresh();},options);
    this.stoneToggle=document.querySelector('#stone-collect');this.stoneRadius=document.querySelector('#stone-radius');
    this.stoneToggle.addEventListener('change',()=>{if(this.unit?.profession==='hauler'){(this.unit.stoneCollection??=defaultStoneCollection()).enabled=this.stoneToggle.checked;this.refresh();}},options);
    this.stoneRadius.addEventListener('change',()=>{if(this.unit?.profession==='hauler'){const v=Math.min(IDLE_STONE.maxRadius,Math.max(0,Math.round(Number(this.stoneRadius.value))));(this.unit.stoneCollection??=defaultStoneCollection()).radius=Number.isFinite(v)?v:IDLE_STONE.defaultRadius;this.refresh();}},options);
    this.commandControls=element('div','unit-command-controls');
    for(const action of ['hold','resume']){const button=element('button','',t(`command.${action}`));button.type='button';button.dataset.unitCommand=action;button.addEventListener('click',()=>{scene.workerSystem.commands[action](this.unit);this.refresh();},options);this.commandControls.append(button);}
    document.querySelector('#unit-job-controls').append(this.commandControls);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(unit,{management=false}={}){this.unit=unit;this.management=management&&this.scene.workerSystem?.workers.get(unit.id)===unit&&unit.isSubject!==false;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open||!this.unit)return;
    const s=this.scene,u=this.unit,view=u.view??u.sprite;
    const managed=this.management&&s.workerSystem?.workers.get(u.id)===u&&u.isSubject!==false&&u.isAlive;
    if((!view?.scene||!s.fog.isVisibleObject(u))&&!managed){this.close();return;}
    const e=s.experienceSystem.getLevelProgress(u),format=n=>String(Math.round(n*100)/100);
    document.querySelector('#unit-name').textContent=u.name??u.definition.name;
    document.querySelector('#unit-level').textContent=t('unit.level',{level:e.level,max:e.maxLevel});
    document.querySelector('#unit-xp').textContent=e.level===e.maxLevel?t('unit.xpMax'):t('unit.xpProgress',{current:format(e.currentXP),next:e.xpToNextLevel});
    document.querySelector('#unit-cargo').textContent=cargoLabel(s,u);document.querySelector('#unit-transport').textContent=transportLabel(s,u);
    const bar=document.querySelector('#unit-xp-bar');bar.max=e.xpToNextLevel||1;bar.value=e.level===e.maxLevel?1:e.currentXP;
    const values={hp:`${format(u.currentHP)} / ${u.maxHP}`,dps:format(u.attackDPS),armor:`${format(u.armor)} %`,totalXP:format(e.totalXP)};
    for(const [key,value]of Object.entries(values))document.querySelector(`[data-unit-stat="${key}"]`).textContent=value;
    const worker=s.workerSystem?.workers.has(u.id)&&u.isSubject!==false;document.querySelector('#unit-job-controls').hidden=!worker;
    if(worker){this.commandControls.hidden=!s.workerSystem.commands.owns(u);for(const button of this.commandControls.children){button.textContent=t(`command.${button.dataset.unitCommand}`);button.disabled=!!s.gameTime.paused;}for(const option of this.jobSelect.options)option.textContent=JOBS[option.value].name;this.jobSelect.value=u.profession;document.querySelector('#unit-profession').textContent=JOBS[u.profession].name;document.querySelector('#unit-work-state').textContent=`${(['Holding','MovingToHold'].includes(u.commandState?.state)?t(`command.${u.commandState.state}`):localized(`work.state.${u.workState}`,u.workState))}${u.workMessage?` · ${workMessageLabel(u.workMessage)}`:''}${s.foodSystem.workMultiplier(u)<1?` · ${t('unit.hungry')}`:''}`;
      const hauler=u.profession==='hauler'&&u.stoneCollection;document.querySelector('#unit-stone-controls').hidden=!hauler;if(hauler){this.stoneToggle.checked=u.stoneCollection.enabled;if(document.activeElement!==this.stoneRadius)this.stoneRadius.value=u.stoneCollection.radius;}
      document.querySelector('#unit-wage').textContent=t('unit.wage',{amount:s.wageSystem.dailyWage(u).toFixed(2)});
      document.querySelector('#unit-talent').textContent=t('unit.talent',{talent:localized(`talent.${u.naturalTalent}`,TALENTS[u.naturalTalent]),bonus:TALENT_XP_BONUS*100,skill:SKILLS[u.naturalTalent]});
      document.querySelector('#unit-unpaid').textContent=t('unit.unpaid',{amount:s.wageSystem.unpaid(u).toFixed(2)});
      document.querySelector('#unit-workplace').textContent=t('unit.workplace',{place:u.profession==='hauler'?t('unit.wholeKingdom'):s.workplaceSystem?.building(u)?.definition.name??t('unit.notAssigned')});
    }
    const signature=JSON.stringify([u.skills,u.naturalTalent,language()]);
    if(this.skillSignature!==`${u.id}:${signature}`){
      const rows=Object.entries(SKILLS).map(([id,name])=>{const skill=u.skills[id],talented=id===u.naturalTalent,row=element('div',`skill-row${talented?' talented-skill':''}`);row.dataset.skill=id;row.append(element('strong','',`${name}${talented?' ★':''}`),element('span','',t('unit.skillLevel',{level:skill.level})),element('span','',skill.level===skill.maxLevel?t('unit.xpMax'):t('unit.skillXp',{current:format(skill.currentXP),next:skill.xpToNextLevel})),element('small','',id==='logistics'?t('unit.haulerCapacity',{count:carryCapacity({...u,profession:'hauler'})}):`${Math.round((1+(skill.level-1)*WORK_RULES.efficiencyPerLevel)*100)} %${talented?' · +20 % XP':''}`));return row;});
      document.querySelector('#unit-skills').replaceChildren(...rows);this.skillSignature=`${u.id}:${signature}`;
    }
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();this.commandControls.remove();}
}
