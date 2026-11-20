import { t } from '../i18n/index.js';
import { TAX_RATES,RATIONS,TAX_RANGE,taxLevel,normalizeTax } from '../data/policy.js';
import { POLICY_ICON_ART } from './policyIconsArt.js';

// Owner request (7 Nov): taxes and food rations are set with sliders whose icon changes with the level (an empty purse …
// an overflowing chest; a half-empty bowl … a full basket). Moving a slider sets the pending policy (from tomorrow,
// Policy v2 P1); the icon and the name show the chosen level. Mouse, wheel and arrow keys move one level at a time.
// The same rations slider is in the Castle panel and the Granary window: both set the one kingdom policy.
// Icons are the Studio sets the owner chose (tax coin stacks, ration bowls), copied by scripts/sync-policy-icons.mjs.
export const POLICY_LEVELS=Object.freeze({tax:Object.freeze(Object.keys(TAX_RATES)),rations:Object.freeze(Object.keys(RATIONS))});

export function policyIcon(kind,level){return (POLICY_ICON_ART[kind==='tax'?'tax':'rations']?.[level]??'').replace('<svg ','<svg aria-hidden="true" ');}

// A slider bound to the kingdom policy. `id` keeps the old element id (#policy-tax / #policy-rations) for the input.
export function createPolicySlider(scene,kind,{id=null}={}){
  // Owner 19 Nov 2026: the tax slider is analog (0–1.5 Gold per resident in steps of 0.05); rations keep their 3 levels.
  if(kind==='tax')return createTaxSlider(scene,{id});
  const levels=POLICY_LEVELS[kind],root=document.createElement('div');root.className=`policy-slider policy-slider-${kind}`;root.dataset.policySlider=kind;
  const label=document.createElement('label'),title=document.createElement('span'),icon=document.createElement('span'),input=document.createElement('input'),name=document.createElement('output');
  title.textContent=t(kind==='tax'?'policy.tax':'policy.rations');icon.className='policy-icon';name.className='policy-level';
  input.type='range';input.min='0';input.max=String(levels.length-1);input.step='1';if(id)input.id=id;label.htmlFor=input.id||'';
  input.setAttribute('aria-label',title.textContent);label.append(title);root.append(label,icon,input,name);
  const policy=()=>scene.policy,chosen=()=>policy()?.pending?.[kind]??policy()?.[kind];
  const set=index=>{const level=levels[Math.max(0,Math.min(levels.length-1,index))];if(level!==chosen())policy()?.set(kind,level);render();};
  input.addEventListener('input',()=>set(Number(input.value)));
  // The game captures the arrow keys for the camera; the slider takes them itself (and keeps them from the camera).
  input.addEventListener('keydown',event=>{const step={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[event.key],now=levels.indexOf(chosen());
    if(step!==undefined)set(now+step);else if(event.key==='Home')set(0);else if(event.key==='End')set(levels.length-1);else return;event.preventDefault();event.stopPropagation();});
  input.addEventListener('wheel',event=>{event.preventDefault();set(levels.indexOf(chosen())+(event.deltaY<0?1:-1));},{passive:false});
  const render=()=>{const level=chosen();if(!level)return;const i=levels.indexOf(level);if(Number(input.value)!==i)input.value=String(i);input.dataset.level=level;root.dataset.level=level;
    input.setAttribute('aria-valuetext',t(`policy.${kind}.${level}`));name.textContent=t(`policy.${kind}.${level}`);icon.innerHTML=policyIcon(kind,level);icon.dataset.icon=`${kind}:${level}`;};
  const unsubscribe=policy()?.onChange?.(render);render();
  return {root,input,render,destroy:()=>unsubscribe?.()};
}

function createTaxSlider(scene,{id=null}={}){
  const root=document.createElement('div');root.className='policy-slider policy-slider-tax';root.dataset.policySlider='tax';
  const label=document.createElement('label'),title=document.createElement('span'),icon=document.createElement('span'),input=document.createElement('input'),name=document.createElement('output');
  title.textContent=t('policy.tax');icon.className='policy-icon';name.className='policy-level';
  input.type='range';input.min=String(TAX_RANGE.min);input.max=String(TAX_RANGE.max);input.step=String(TAX_RANGE.step);if(id)input.id=id;label.htmlFor=input.id||'';
  input.setAttribute('aria-label',title.textContent);label.append(title);root.append(label,icon,input,name);
  const policy=()=>scene.policy,chosen=()=>policy()?.pending?.tax??policy()?.tax;
  const set=value=>{const v=normalizeTax(value);if(v!==null&&v!==chosen())policy()?.set('tax',v);render();};
  input.addEventListener('input',()=>set(Number(input.value)));
  input.addEventListener('keydown',event=>{const step={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[event.key];
    if(step!==undefined)set(chosen()+step*TAX_RANGE.step);else if(event.key==='Home')set(TAX_RANGE.min);else if(event.key==='End')set(TAX_RANGE.max);else return;event.preventDefault();event.stopPropagation();});
  input.addEventListener('wheel',event=>{event.preventDefault();set(chosen()+(event.deltaY<0?1:-1)*TAX_RANGE.step);},{passive:false});
  const render=()=>{const rate=chosen();if(typeof rate!=='number')return;const level=taxLevel(rate);if(Math.abs(Number(input.value)-rate)>1e-9)input.value=String(rate);
    input.dataset.level=level;root.dataset.level=level;const text=`${t(`policy.tax.${level}`)} · ${rate.toFixed(2)}`;
    input.setAttribute('aria-valuetext',text);name.textContent=text;icon.innerHTML=policyIcon('tax',level);icon.dataset.icon=`tax:${level}`;};
  const unsubscribe=policy()?.onChange?.(render);render();
  return {root,input,render,destroy:()=>unsubscribe?.()};
}
