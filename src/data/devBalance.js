import { BUILDING_TOOLTIP } from './buildingTooltip.js';
import { FORESTRY,GRAND_OAK } from './naturalResources.js';
import { SEASON_TRANSITION } from './seasonTransition.js';
// m-91-asset-library-dev (owner point 88): the Dev tool coefficients. ONE module read at the points where yields,
// consumption, wages, taxes, prices, construction and growth are computed (devFactor(key) / devProduction(key)).
// Since 0.82 the coefficients are part of the GAME: saved in the save (optional field `devBalance`, only the keys that
// differ from ×1), a new game starts at ×1, and they are in force whether or not the Dev tool icon is shown. The browser
// (localStorage) keeps only UI preferences: whether the icon is shown (`mode`, alpha default ON) and the tooltip delay.
// The owner copies the values (JSON) and they become new defaults in the data files.
// Main coefficients, in the menu order (arrival first); `production` is a master on top of the per-building ones.
export const DEV_MAIN_KEYS=Object.freeze(['immigration','production','consumption','wages','taxes','buyPrice','sellPrice','construction','growth']);
// Per-building production multipliers of 0.78 (the "Advanced" fold). `farming` multiplies field growth together with `growth`.
export const DEV_ADVANCED_KEYS=Object.freeze(['hunter','fisher','farming','bakery','mill','woodcutter','mining']);
// m-drevorubci-stromy: the "Forest and wood" group. Own ranges and defaults (the sapling chance is a probability 0–1,
// the hut boost starts at FORESTRY.hutGrowthBoost); the save keeps only the keys that differ from their default.
export const DEV_FOREST_KEYS=Object.freeze(['forestGrowth','saplingChance','hutGrowthBoost','woodRadius','chopTime','woodYield']);
// m-plynule-prechody: the "World look" group – how many game days the season change takes and in how many steps.
export const DEV_LOOK_KEYS=Object.freeze(['seasonDays','seasonSteps']);
export const DEV_BALANCE_KEYS=Object.freeze([...DEV_MAIN_KEYS,...DEV_ADVANCED_KEYS,...DEV_FOREST_KEYS,...DEV_LOOK_KEYS]);
// Production buildings whose work the `production` master speeds up (field growth has its own `growth`).
const PRODUCTION_KEYS=new Set(['hunter','fisher','bakery','mill','woodcutter','mining']);
export const DEV_BALANCE_RANGE=Object.freeze({min:.25,max:4,step:.25});
const KEY_RANGES=Object.freeze({saplingChance:Object.freeze({min:0,max:1,step:.05}),hutGrowthBoost:Object.freeze({min:1,max:3,step:.25}),woodRadius:Object.freeze({min:.5,max:2,step:.25}),woodYield:Object.freeze({min:.5,max:3,step:.25}),seasonDays:SEASON_TRANSITION.dev.days,seasonSteps:SEASON_TRANSITION.dev.steps});
const DEFAULTS=Object.freeze({saplingChance:FORESTRY.saplingChance,hutGrowthBoost:FORESTRY.hutGrowthBoost,seasonDays:SEASON_TRANSITION.days,seasonSteps:SEASON_TRANSITION.steps});
export const devRange=key=>KEY_RANGES[key]??DEV_BALANCE_RANGE;
export const devDefault=key=>DEFAULTS[key]??1;
export const DEV_BALANCE_STORAGE_KEY='newgame.devBalance';
// Quick actions of the Dev tool.
export const DEV_QUICK=Object.freeze({gold:100,resources:50,residents:1});
// m-budovy-tooltip (86): the building tooltip delay in seconds (a browser preference, set in the Dev tool).
const TOOLTIP_DEFAULT=BUILDING_TOOLTIP.delayMs/1000,TOOLTIP_RANGE=BUILDING_TOOLTIP.devDelay;
const clampDelay=v=>Math.min(TOOLTIP_RANGE.max,Math.max(TOOLTIP_RANGE.min,Math.round(v*10)/10));
const ones=()=>Object.fromEntries(DEV_BALANCE_KEYS.map(k=>[k,devDefault(k)]));
// Values sit on a 0.05 grid (the sliders move by 0.25; hand-copied 0.78 values like 1.15 stay valid).
const clamp=(v,key)=>{const r=devRange(key);return Math.min(r.max,Math.max(r.min,Math.round(v*20)/20));};
const state={mode:true,values:ones(),tooltipDelay:TOOLTIP_DEFAULT,storage:null},listeners=new Set();
const changed=()=>{for(const l of listeners)l();};
export function onDevBalanceChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
function persist(){try{state.storage?.setItem(DEV_BALANCE_STORAGE_KEY,JSON.stringify({mode:state.mode,...(state.tooltipDelay!==TOOLTIP_DEFAULT?{tooltipDelay:state.tooltipDelay}:{})}));}catch{/* The game also runs without storage. */}}
// The browser preferences (icon shown, tooltip delay). Coefficients start at ×1: a new game, or the save's values on load.
// Old 0.78–0.81 `values` in localStorage are ignored (they now belong to a save).
export function loadDevBalance(storage){
  state.storage=storage??null;state.mode=true;state.values=ones();state.tooltipDelay=TOOLTIP_DEFAULT;
  try{const raw=storage?.getItem(DEV_BALANCE_STORAGE_KEY);const d=raw?JSON.parse(raw):{};if(d?.mode===false)state.mode=false;
    if(d?.tooltipDelay!==undefined&&Number.isFinite(Number(d.tooltipDelay)))state.tooltipDelay=clampDelay(Number(d.tooltipDelay));}catch{/* broken storage = defaults */}
  changed();return devBalanceValues();
}
export function devFactor(key){return state.values[key]??1;}
// A production building's factor: its own (Advanced) multiplier × the Production master.
export function devProduction(key){return (PRODUCTION_KEYS.has(key)?state.values[key]:1)*state.values.production;}
// "Show Dev tool" (Settings): only whether the icon is shown; the coefficients act either way.
export const devMode=()=>state.mode;
export function setDevMode(on){state.mode=on===true;persist();changed();return state.mode;}
export function setDevFactor(key,value){if(!DEV_BALANCE_KEYS.includes(key)||!Number.isFinite(+value))return false;state.values[key]=clamp(+value,key);changed();return state.values[key];}
export function resetDevBalance(){state.values=ones();state.tooltipDelay=TOOLTIP_DEFAULT;persist();changed();return devBalanceValues();}
export const devBalanceChanged=()=>DEV_BALANCE_KEYS.some(k=>state.values[k]!==devDefault(k));
// ---- save field `devBalance` (optional, no SAVE_VERSION change): only keys ≠ their default; absent = all defaults.
export function exportDevBalance(){const out={};for(const k of DEV_BALANCE_KEYS)if(state.values[k]!==devDefault(k))out[k]=state.values[k];return Object.keys(out).length?out:null;}
export function validDevBalanceState(d){
  if(!d||typeof d!=='object'||Array.isArray(d)||Object.getPrototypeOf(d)!==Object.prototype)return false;const keys=Object.keys(d);
  return keys.length>0&&keys.every(k=>DEV_BALANCE_KEYS.includes(k)&&typeof d[k]==='number'&&Number.isFinite(d[k])&&d[k]>=devRange(k).min&&d[k]<=devRange(k).max&&Math.abs(d[k]*20-Math.round(d[k]*20))<1e-9);
}
// On load (and for a new game with undefined): exactly the save's values, everything else at its default.
export function importDevBalance(d){state.values=ones();if(d!==undefined&&d!==null){if(!validDevBalanceState(d))throw new TypeError('Invalid devBalance state');for(const k of Object.keys(d))state.values[k]=d[k];}changed();return devBalanceValues();}
// The building tooltip delay: the Dev tool value (seconds), the data default until changed.
export const devTooltipDelay=()=>state.tooltipDelay;
export function setDevTooltipDelay(seconds){if(!Number.isFinite(+seconds))return false;state.tooltipDelay=clampDelay(+seconds);persist();changed();return state.tooltipDelay;}
export const buildingTooltipDelayMs=()=>Math.round(state.tooltipDelay*1000);
export const devBalanceValues=()=>({...state.values});
export const devBalanceJSON=()=>JSON.stringify({...devBalanceValues(),...(state.tooltipDelay!==TOOLTIP_DEFAULT?{tooltipDelaySeconds:state.tooltipDelay}:{})},null,2);
// m-drevorubci-stromy: wood per felled tree and the chopping time with the Dev tool's "Forest and wood" factors
// (`factor` lets save validation use the save's own value). At least 1 Wood a tree.
export const devTreeWood=(rule,factor=devFactor('woodYield'))=>Math.max(1,Math.round(rule.wood*factor));
// m-duby: a grand oak (2 × 2) gives its own amount of wood.
export const devObjectWood=(object,factor=devFactor('woodYield'))=>object?.natural?.grand?Math.max(1,Math.round(GRAND_OAK.wood*factor)):devTreeWood(object.definition?.tree??object.tree,factor);
export const devChopDuration=rule=>rule.chopDuration*devFactor('chopTime');
