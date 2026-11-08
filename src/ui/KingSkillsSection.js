import { t,language } from '../i18n/index.js';
import { SKILLS,WORK_RULES } from '../data/jobs.js';
import { KING_SKILLS,KING_SKILL_IDS } from '../data/kingSkills.js';
import { element } from './objectLabels.js';

const percent=n=>String(Math.round(n*1000)/10);
// m-kral-odmeny-xp: the Skills part of the King panel (UnitPanel opened on the King). Free points, Leadership and
// Stewardship with their levels, and a + button on every row: on the two royal skills here and on each ordinary skill
// row UnitPanel draws in #unit-skills. Every button's tooltip names the exact bonus of one more level.
export class KingSkillsSection {
  constructor(scene,dialog,{document:doc=globalThis.document,onChange=()=>{}}={}){
    this.scene=scene;this.doc=doc;this.onChange=onChange;this.signature='';
    this.root=element('section','king-skills');this.root.id='king-skills';this.root.hidden=true;
    this.heading=element('h3','',t('kingSkills.title'));this.points=element('p','king-skill-points');this.points.id='king-skill-points';this.rows=element('div','king-skill-rows');
    this.root.append(this.heading,this.points,this.rows);
    const skills=doc.querySelector?.('#unit-skills');if(skills)skills.before(this.root);else dialog?.append?.(this.root);
    this.click=event=>{const button=event.target?.closest?.('[data-king-skill]');if(!button||button.disabled)return;event.preventDefault?.();if(this.scene.kingSkills?.spend(button.dataset.kingSkill)){this.signature='';this.onChange();}};
    this.root.addEventListener?.('click',this.click);skills?.addEventListener?.('click',this.click);this.skillList=skills;
  }
  tooltip(id){
    const k=this.scene.kingSkills;
    if(id==='leadership')return t('kingSkills.leadershipTip',{each:percent(KING_SKILLS.leadership.workBonusPerLevel),now:percent(k.leadershipBonus()),max:KING_SKILLS.leadership.maxLevel});
    if(id==='stewardship')return t('kingSkills.stewardshipTip',{each:percent(KING_SKILLS.stewardship.taxBonusPerLevel),now:percent(k.stewardshipBonus()),max:KING_SKILLS.stewardship.maxLevel});
    return t(id==='combat'?'kingSkills.combatTip':'kingSkills.skillTip',{skill:SKILLS[id],each:percent(WORK_RULES.efficiencyPerLevel)});
  }
  button(id){
    const b=element('button','king-skill-plus','+');b.type='button';b.dataset.kingSkill=id;const tip=this.tooltip(id);b.title=tip;b.setAttribute('aria-label',tip);b.disabled=!this.scene.kingSkills.canSpend(id);return b;
  }
  render(unit){
    const k=this.scene.kingSkills,king=!!k&&unit===this.scene.character;this.root.hidden=!king;
    if(!king){if(this.signature)this.hideRowButtons();this.signature='';return;}
    // UnitPanel rebuilds the ordinary rows when the skills change; a row without its button gets one again.
    const missing=[...(this.skillList?.querySelectorAll?.('.skill-row[data-skill]')??[])].some(row=>!row.querySelector('.king-skill-plus'));
    const signature=JSON.stringify([k.points,k.levels,k.revision,language(),Object.fromEntries(Object.entries(unit.skills??{}).map(([id,s])=>[id,s.level]))]);
    if(signature===this.signature&&!missing)return;this.signature=signature;
    this.heading.textContent=t('kingSkills.title');this.points.textContent=t('kingSkills.points',{count:k.points});
    this.rows.replaceChildren(...KING_SKILL_IDS.map(id=>{
      const row=element('div','skill-row king-skill-row');row.dataset.kingSkillRow=id;
      row.append(element('strong','',t(`kingSkills.${id}`)),element('span','',t('kingSkills.level',{level:k.levels[id],max:KING_SKILLS[id].maxLevel})),element('span','',t(`kingSkills.${id}Now`,{now:percent(id==='leadership'?k.leadershipBonus():k.stewardshipBonus())})),element('small',''),this.button(id));return row;
    }));
    for(const row of this.skillList?.querySelectorAll?.('.skill-row[data-skill]')??[]){row.querySelector('.king-skill-plus')?.remove();row.append(this.button(row.dataset.skill));}
    this.skillList?.classList?.add('king-skill-list');
  }
  hideRowButtons(){for(const b of this.skillList?.querySelectorAll?.('.king-skill-plus')??[])b.remove();this.skillList?.classList?.remove('king-skill-list');}
  destroy(){this.root.removeEventListener?.('click',this.click);this.skillList?.removeEventListener?.('click',this.click);this.hideRowButtons();this.root.remove();}
}
