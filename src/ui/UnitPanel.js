import { SKILLS,JOBS,WORK_RULES } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { TALENTS,TALENT_XP_BONUS } from '../data/economy.js';
import { carryCapacity } from '../data/logistics.js';
import { cargoLabel,transportLabel } from './transportLabels.js';

export class UnitPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#unit-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    document.querySelector('#close-unit').addEventListener('click',()=>this.close(),options);
    document.querySelector('#king-profile').addEventListener('click',()=>this.open(scene.character),options);
    this.jobSelect=document.querySelector('#assign-job');this.jobSelect.replaceChildren(...Object.entries(JOBS).map(([id,job])=>{const option=element('option','',job.name);option.value=id;return option;}));
    this.jobSelect.addEventListener('change',()=>{if(this.unit)scene.workerSystem.jobs.assign(this.unit,this.jobSelect.value);this.refresh();},options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restoreInput(),options);
  }
  open(unit){this.unit=unit;this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();this.refresh();}
  refresh(){
    if(!this.dialog.open||!this.unit)return;
    const s=this.scene,u=this.unit,view=u.view??u.sprite;
    if(!view?.scene||!s.fog.isVisibleObject(u)){this.close();return;}
    const e=s.experienceSystem.getLevelProgress(u),format=n=>String(Math.round(n*100)/100);
    document.querySelector('#unit-name').textContent=u.name??u.definition.name;
    document.querySelector('#unit-level').textContent=`Level ${e.level} / ${e.maxLevel}`;
    document.querySelector('#unit-xp').textContent=e.level===e.maxLevel?'XP MAX':`XP ${format(e.currentXP)} / ${e.xpToNextLevel}`;
    document.querySelector('#unit-cargo').textContent=cargoLabel(s,u);document.querySelector('#unit-transport').textContent=transportLabel(s,u);
    const bar=document.querySelector('#unit-xp-bar');bar.max=e.xpToNextLevel||1;bar.value=e.level===e.maxLevel?1:e.currentXP;
    const values={hp:`${format(u.currentHP)} / ${u.maxHP}`,dps:format(u.attackDPS),armor:`${format(u.armor)} %`,totalXP:format(e.totalXP)};
    for(const [key,value]of Object.entries(values))document.querySelector(`[data-unit-stat="${key}"]`).textContent=value;
    const worker=s.workerSystem?.workers.has(u.id);document.querySelector('#unit-job-controls').hidden=!worker;
    if(worker){this.jobSelect.value=u.profession;document.querySelector('#unit-profession').textContent=JOBS[u.profession].name;document.querySelector('#unit-work-state').textContent=`${u.workState}${u.workMessage?` · ${u.workMessage}`:''}${s.foodSystem.workMultiplier(u)<1?' · Hungry (−20% work efficiency)':''}`;
      document.querySelector('#unit-wage').textContent=`${s.wageSystem.dailyWage(u).toFixed(2)} Gold/day`;
      document.querySelector('#unit-talent').textContent=`${TALENTS[u.naturalTalent]} · +${TALENT_XP_BONUS*100} % ${SKILLS[u.naturalTalent]} XP`;
      document.querySelector('#unit-unpaid').textContent=`Unpaid wages: ${s.wageSystem.unpaid(u).toFixed(2)} Gold`;
      document.querySelector('#unit-workplace').textContent=`Workplace: ${s.workplaceSystem?.building(u)?.definition.name??'Not assigned'}`;
    }
    const signature=JSON.stringify([u.skills,u.naturalTalent]);
    if(this.skillSignature!==`${u.id}:${signature}`){
      const rows=Object.entries(SKILLS).map(([id,name])=>{const skill=u.skills[id],talented=id===u.naturalTalent,row=element('div',`skill-row${talented?' talented-skill':''}`);row.dataset.skill=id;row.append(element('strong','',`${name}${talented?' ★':''}`),element('span','',`LVL ${skill.level}`),element('span','',skill.level===skill.maxLevel?'XP MAX':`${format(skill.currentXP)} / ${skill.xpToNextLevel} XP`),element('small','',id==='logistics'?`Hauler capacity: ${carryCapacity({...u,profession:'hauler'})}`:`${Math.round((1+(skill.level-1)*WORK_RULES.efficiencyPerLevel)*100)} %${talented?' · +20 % XP':''}`));return row;});
      document.querySelector('#unit-skills').replaceChildren(...rows);this.skillSignature=`${u.id}:${signature}`;
    }
  }
  restoreInput(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restoreInput();}
  destroy(){this.close();this.controller.abort();}
}
