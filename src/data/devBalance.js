import { BUILDING_TOOLTIP } from './buildingTooltip.js';
// m-jidlo-balanc (playtest 0.76.0 #3): developer balance multipliers. ONE module read at the points where yields and
// consumption are computed (devFactor(key)); the hidden Dev mode in Settings and the Balance panel set them. Stored in
// this browser only (localStorage), never in a save; with Dev mode off every factor is 1. The owner copies the values
// (JSON) and they become new defaults in the data files.
export const DEV_BALANCE_KEYS=Object.freeze(['hunter','fisher','farming','bakery','mill','woodcutter','mining','consumption','immigration','wages','taxes']);
export const DEV_BALANCE_RANGE=Object.freeze({min:.25,max:3,step:.05});
// Clicks on the version line in Settings (within `unlockMs`) that reveal the Dev mode switch.
export const DEV_UNLOCK=Object.freeze({clicks:5,unlockMs:3000});
export const DEV_BALANCE_STORAGE_KEY='newgame.devBalance';
// m-budovy-tooltip (86): the building tooltip delay in seconds, tried in the Balance panel (in force only in Dev mode).
const TOOLTIP_DEFAULT=BUILDING_TOOLTIP.delayMs/1000,TOOLTIP_RANGE=BUILDING_TOOLTIP.devDelay;
const clampDelay=v=>Math.min(TOOLTIP_RANGE.max,Math.max(TOOLTIP_RANGE.min,Math.round(v*10)/10));
const ones=()=>Object.fromEntries(DEV_BALANCE_KEYS.map(k=>[k,1]));
const clamp=v=>Math.min(DEV_BALANCE_RANGE.max,Math.max(DEV_BALANCE_RANGE.min,Math.round(v*100)/100));
const state={mode:false,values:ones(),tooltipDelay:TOOLTIP_DEFAULT,storage:null};
function persist(){try{state.storage?.setItem(DEV_BALANCE_STORAGE_KEY,JSON.stringify({mode:state.mode,values:state.values,...(state.tooltipDelay!==TOOLTIP_DEFAULT?{tooltipDelay:state.tooltipDelay}:{})}));}catch{/* The game also runs without storage. */}}
export function loadDevBalance(storage){
  state.storage=storage??null;state.mode=false;state.values=ones();state.tooltipDelay=TOOLTIP_DEFAULT;
  try{const d=JSON.parse(storage?.getItem(DEV_BALANCE_STORAGE_KEY)??'{}');state.mode=d?.mode===true;for(const k of DEV_BALANCE_KEYS){const v=Number(d?.values?.[k]);if(Number.isFinite(v))state.values[k]=clamp(v);}
    if(d?.tooltipDelay!==undefined&&Number.isFinite(Number(d.tooltipDelay)))state.tooltipDelay=clampDelay(Number(d.tooltipDelay));}catch{/* broken storage = defaults */}
  return devBalanceValues();
}
// The factor in force: 1 unless Dev mode is on.
export function devFactor(key){return state.mode?state.values[key]??1:1;}
export const devMode=()=>state.mode;
export function setDevMode(on){state.mode=on===true;persist();return state.mode;}
export function setDevFactor(key,value){if(!DEV_BALANCE_KEYS.includes(key)||!Number.isFinite(+value))return false;state.values[key]=clamp(+value);persist();return state.values[key];}
export function resetDevBalance(){state.values=ones();state.tooltipDelay=TOOLTIP_DEFAULT;persist();return devBalanceValues();}
// The building tooltip delay: the dev value (seconds) in Dev mode, otherwise the data default.
export const devTooltipDelay=()=>state.tooltipDelay;
export function setDevTooltipDelay(seconds){if(!Number.isFinite(+seconds))return false;state.tooltipDelay=clampDelay(+seconds);persist();return state.tooltipDelay;}
export const buildingTooltipDelayMs=()=>state.mode?Math.round(state.tooltipDelay*1000):BUILDING_TOOLTIP.delayMs;
export const devBalanceValues=()=>({...state.values});
export const devBalanceJSON=()=>JSON.stringify({...devBalanceValues(),...(state.tooltipDelay!==TOOLTIP_DEFAULT?{tooltipDelaySeconds:state.tooltipDelay}:{})},null,2);
