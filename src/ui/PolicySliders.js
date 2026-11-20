import { t } from '../i18n/index.js';
import { TAX_RATES,RATIONS,TAX_RANGE,RATION_RANGE,taxLevel,rationLevel,normalizeTax,normalizeRations } from '../data/policy.js';
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
  // Owner 20 Nov 2026 (87): rations are analog too (0.4–1.2 portions a day in steps of 0.05).
  if(kind==='tax'||kind==='rations')return createAnalogSlider(scene,kind,{id});
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

// The value above the slider (e.g. "Normal · 0.50") carries its meaning in a tooltip; a change holds at once (point 87).
const ANALOG=Object.freeze({
  tax:Object.freeze({range:TAX_RANGE,normalize:normalizeTax,level:taxLevel,title:'policy.tax',tip:'policy.taxTip'}),
  rations:Object.freeze({range:RATION_RANGE,normalize:normalizeRations,level:rationLevel,title:'policy.rations',tip:'policy.rationsTip'}),
});
function createAnalogSlider(scene,kind,{id=null}={}){
  const spec=ANALOG[kind],root=document.createElement('div');root.className=`policy-slider policy-slider-${kind}`;root.dataset.policySlider=kind;
  const label=document.createElement('label'),title=document.createElement('span'),icon=document.createElement('span'),input=document.createElement('input'),name=document.createElement('output');
  title.textContent=t(spec.title);icon.className='policy-icon';name.className='policy-level';
  input.type='range';input.min=String(spec.range.min);input.max=String(spec.range.max);input.step=String(spec.range.step);if(id)input.id=id;label.htmlFor=input.id||'';
  input.setAttribute('aria-label',title.textContent);label.append(title);root.append(label,icon,input,name);
  const policy=()=>scene.policy,chosen=()=>policy()?.[kind];
  const set=value=>{const v=spec.normalize(value);if(v!==null&&v!==chosen())policy()?.set(kind,v);render();};
  input.addEventListener('input',()=>set(Number(input.value)));
  input.addEventListener('keydown',event=>{const step={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[event.key];
    if(step!==undefined)set(chosen()+step*spec.range.step);else if(event.key==='Home')set(spec.range.min);else if(event.key==='End')set(spec.range.max);else return;event.preventDefault();event.stopPropagation();});
  input.addEventListener('wheel',event=>{event.preventDefault();set(chosen()+(event.deltaY<0?1:-1)*spec.range.step);},{passive:false});
  const render=()=>{const value=chosen();if(typeof value!=='number')return;const level=spec.level(value);if(Math.abs(Number(input.value)-value)>1e-9)input.value=String(value);
    input.dataset.level=level;root.dataset.level=level;const text=`${t(`policy.${kind}.${level}`)} · ${value.toFixed(2)}`,tip=t(spec.tip,{value:value.toFixed(2)});
    input.setAttribute('aria-valuetext',text);name.textContent=text;name.title=tip;input.title=tip;icon.innerHTML=policyIcon(kind,level);icon.dataset.icon=`${kind}:${level}`;};
  const unsubscribe=policy()?.onChange?.(render);render();
  return {root,input,render,destroy:()=>unsubscribe?.()};
}
