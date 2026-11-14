import { buildingIsComplete } from '../game/buildings.js';
import { formatCost } from './objectLabels.js';
import { castleUpgradePlan,upgradeCastle } from '../game/castleUpgrade.js';
import { CASTLE_LEVELS,CASTLE_MAX_LEVEL,castleLevel } from '../data/castle.js';
import { t } from '../i18n/index.js';
import { JOBS } from '../data/jobs.js';
import { EMPLOYMENT_PRESETS,EMPLOYMENT_PROFESSIONS,PRIORITY_RANGE } from '../data/employment.js';
import { element } from './objectLabels.js';

// Castle side panel: presets and a 1–5 priority for every workplace profession. Not modal, so clicking the
// Castle can still send the king inside while the panel stays open beside the map.
export class EmploymentPanel {
  constructor(scene){
    this.scene=scene;this.panel=document.querySelector('#employment-panel');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#close-employment').addEventListener('click',()=>this.close(),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.panel.addEventListener('click',event=>{const preset=event.target.closest('[data-employment-preset]')?.dataset.employmentPreset;if(preset&&preset!=='custom')scene.employment.applyPreset(preset);},options);
    this.panel.addEventListener('click',event=>{if(!event.target.closest('[data-castle-upgrade]'))return;const castle=scene.buildings.find(b=>b.type==='castle'),result=upgradeCastle(scene,castle);scene.setStatus?.(result.error??t('castle.upgraded',{level:result.next}));this.castleKey=null;this.render();},options);
    this.panel.addEventListener('change',event=>{const profession=event.target.dataset?.priorityProfession;if(profession)scene.employment.setPriority(profession,Number(event.target.value));},options);
    this.unsubscribe=scene.employment.onChange(()=>this.render());
  }
  open(){this.panel.hidden=false;this.castleKey=null;this.render();}
  close(){this.panel.hidden=true;}
  render(){
    if(this.panel.hidden)return;const e=this.scene.employment,current=e.preset;
    // m-hrad-urovne: the Castle's level, what it gives and the upgrade.
    {const s=this.scene,box=document.querySelector('#castle-upgrade'),castle=s.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b));
      if(box){box.hidden=!castle;if(castle){const level=castleLevel(castle),rules=CASTLE_LEVELS[level],plan=castleUpgradePlan(s,castle),cost=plan.rules?formatCost(plan.rules.cost,s.objectRegistry):'';
        const key=JSON.stringify([level,castle.level??0,plan.error??'',cost]);if(key!==this.castleKey){this.castleKey=key;
          const parts=[element('h3','',t('castle.level',{level,max:CASTLE_MAX_LEVEL})),element('p','employment-help',t(castle.level?'castle.gives':'castle.legacy',{hp:rules.hp,residents:rules.residents,safety:rules.safety,income:rules.income}))];
          if(!plan.max){const b=element('button','castle-upgrade-button',t('castle.upgrade',{level:plan.next,cost}));b.type='button';b.dataset.castleUpgrade='1';b.disabled=!!plan.error;const next=plan.rules;
            parts.push(element('p','employment-help',t('castle.next',{size:`${next.size} × ${next.size}`,hp:next.hp,residents:next.residents,safety:next.safety,income:next.income})),b);if(plan.error)parts.push(element('p','castle-upgrade-error',plan.error));}
          else parts.push(element('p','employment-help',t('castle.maxLevel')));
          box.replaceChildren(...parts);}}}}
    document.querySelector('#employment-state').textContent=t('employment.state',{state:t(e.enabled?'state.on':'state.off')});
    document.querySelector('#employment-presets').replaceChildren(...[...Object.keys(EMPLOYMENT_PRESETS),'custom'].map(id=>{const button=element('button','',t(`employment.preset.${id}`));button.type='button';button.dataset.employmentPreset=id;button.setAttribute('role','radio');button.setAttribute('aria-checked',String(current===id));button.disabled=id==='custom';return button;}));
    // m-nosici-panel (point 40): the wanted number of Haulers moved to the Population panel (haulerBox.js).
    document.querySelector('#employment-priorities').replaceChildren(...EMPLOYMENT_PROFESSIONS.map(profession=>{
      const row=element('li','employment-row'),label=element('label','',JOBS[profession].name),select=element('select');select.id=`priority-${profession}`;label.htmlFor=select.id;select.dataset.priorityProfession=profession;
      for(let value=PRIORITY_RANGE.max;value>=PRIORITY_RANGE.min;value--){const option=element('option','',String(value));option.value=String(value);select.append(option);}
      select.value=String(e.priorities[profession]);row.append(label,select);return row;
    }));
  }
  destroy(){this.close();this.controller.abort();this.unsubscribe();}
}
