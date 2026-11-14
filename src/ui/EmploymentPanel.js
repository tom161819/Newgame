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
    this.panel.addEventListener('click',event=>{const step=event.target.closest('[data-haulers]')?.dataset.haulers;if(!step)return;const e=scene.employment;e.setHaulers(step==='auto'?null:Math.max(0,e.haulerTarget()+Number(step)));},options);
    this.panel.addEventListener('change',event=>{const profession=event.target.dataset?.priorityProfession;if(profession)scene.employment.setPriority(profession,Number(event.target.value));},options);
    this.unsubscribe=scene.employment.onChange(()=>this.render());
  }
  open(){this.panel.hidden=false;this.render();}
  close(){this.panel.hidden=true;}
  render(){
    if(this.panel.hidden)return;const e=this.scene.employment,current=e.preset;
    document.querySelector('#employment-state').textContent=t('employment.state',{state:t(e.enabled?'state.on':'state.off')});
    document.querySelector('#employment-presets').replaceChildren(...[...Object.keys(EMPLOYMENT_PRESETS),'custom'].map(id=>{const button=element('button','',t(`employment.preset.${id}`));button.type='button';button.dataset.employmentPreset=id;button.setAttribute('role','radio');button.setAttribute('aria-checked',String(current===id));button.disabled=id==='custom';return button;}));
    // m-nosici-auto: the wanted number of Haulers with the recommended number marked; Builders are shown for information.
    {const box=document.querySelector('#employment-haulers'),button=(text,step,label)=>{const b=element('button','',text);b.type='button';b.dataset.haulers=step;if(label)b.setAttribute('aria-label',label);return b;},recommended=e.recommendedHaulers(),target=e.haulerTarget(),auto=e.haulers===null;
      const row=element('div','employment-row'),controls=element('span','employment-stepper'),value=element('strong','employment-hauler-count'+(target===recommended?' is-recommended':''),String(target));
      controls.append(button('−','-1',t('employment.haulers.less')),value,button('+','1',t('employment.haulers.more')));row.append(element('span','',t('employment.haulers.wanted')),controls);
      const note=element('p','employment-help',t(auto?'employment.haulers.auto':'employment.haulers.manual',{recommended,now:e.count('hauler'),residents:e.residentCount()}));
      const reset=button(t('employment.haulers.useRecommended',{recommended}),'auto');reset.className='employment-recommended';reset.disabled=auto;
      const builders=element('p','employment-help',t(e.builderPlaces()?'employment.builders.auto':'employment.builders.none',{now:e.count('builder'),target:e.builderTarget(),places:e.builderPlaces()}));
      box.replaceChildren(row,note,reset,builders);}
    document.querySelector('#employment-priorities').replaceChildren(...EMPLOYMENT_PROFESSIONS.map(profession=>{
      const row=element('li','employment-row'),label=element('label','',JOBS[profession].name),select=element('select');select.id=`priority-${profession}`;label.htmlFor=select.id;select.dataset.priorityProfession=profession;
      for(let value=PRIORITY_RANGE.max;value>=PRIORITY_RANGE.min;value--){const option=element('option','',String(value));option.value=String(value);select.append(option);}
      select.value=String(e.priorities[profession]);row.append(label,select);return row;
    }));
  }
  destroy(){this.close();this.controller.abort();this.unsubscribe();}
}
