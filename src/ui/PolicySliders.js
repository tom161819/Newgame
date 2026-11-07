import { t } from '../i18n/index.js';
import { TAX_RATES,RATIONS } from '../data/policy.js';

// Owner request (7 Nov): taxes and food rations are set with sliders whose icon changes with the level (an empty purse …
// an overflowing chest; a half-empty bowl … a full basket). Moving a slider sets the pending policy (from tomorrow,
// Policy v2 P1); the icon and the name show the chosen level. Mouse, wheel and arrow keys move one level at a time.
// The same rations slider is in the Castle panel and the Granary window: both set the one kingdom policy.
// Icons are drawn here as provisional SVG until the Studio sets (g-ikony-dane-jidlo) are approved.
export const POLICY_LEVELS=Object.freeze({tax:Object.freeze(Object.keys(TAX_RATES)),rations:Object.freeze(Object.keys(RATIONS))});

const coin=(x,y,r=5)=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.55}" fill="#e3b53c" stroke="#8a6a1d" stroke-width="1"/>`;
const stack=(x,y,n)=>Array.from({length:n},(_,i)=>coin(x,y-i*2.6)).join('');
const TAX_ICONS={
  none:`<path d="M12 16q8-8 16 0l3 14q-11 6-22 0z" fill="#8a6a43" stroke="#4b3622"/><path d="M14 15q6-4 12 0" stroke="#4b3622" fill="none"/>`,
  low:`${stack(14,30,1)}${stack(24,31,2)}`,
  normal:`${stack(10,31,2)}${stack(20,31,3)}${stack(30,31,2)}`,
  high:`<path d="M6 33q14-22 28 0z" fill="#e3b53c" stroke="#8a6a1d"/>${coin(14,26,4)}${coin(24,25,4)}${coin(19,20,4)}`,
  very_high:`<rect x="5" y="20" width="30" height="14" rx="2" fill="#7a4e2a" stroke="#3f2a16"/><path d="M5 20q15-12 30 0" fill="#e3b53c" stroke="#8a6a1d"/>${coin(12,17,4)}${coin(20,13,4)}${coin(28,17,4)}<rect x="18" y="24" width="4" height="5" fill="#d9b44a"/>`,
};
const bowl=fill=>`<path d="M5 20h30q-2 12-15 12T5 20z" fill="#9b7a4d" stroke="#4b3622"/>${fill}`;
const RATION_ICONS={
  small:bowl(`<path d="M10 20q10-3 20 0z" fill="#d8c08a"/>`),
  normal:bowl(`<path d="M6 20q14-10 28 0z" fill="#d8c08a"/><circle cx="16" cy="16" r="2" fill="#a0602d"/>`),
  generous:`<path d="M4 22h32l-4 12H8z" fill="#a67c3e" stroke="#4b3622"/><ellipse cx="13" cy="18" rx="7" ry="5" fill="#c98b3a"/><circle cx="25" cy="17" r="4" fill="#b8352c"/><path d="M20 21q6-9 13-2" fill="#d9a5a0" stroke="#8a4b45"/><ellipse cx="30" cy="20" rx="5" ry="2.5" fill="#8fa3b5"/>`,
};
export function policyIcon(kind,level){const shapes=(kind==='tax'?TAX_ICONS:RATION_ICONS)[level]??'';return `<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">${shapes}</svg>`;}

// A slider bound to the kingdom policy. `id` keeps the old element id (#policy-tax / #policy-rations) for the input.
export function createPolicySlider(scene,kind,{id=null}={}){
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
