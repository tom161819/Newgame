import studioConfig from '../../art/ui/ui-config.json' with { type: 'json' };
import { UI_PRESETS } from '../../art/ui/presets.js';
import { applyUiConfig,normalizeUiConfig } from '../../art/ui/uiConfig.js';
import { t } from '../i18n/index.js';

// UI Lab in the game (plan m-ui-lab-do-hry): the look and layout the owner approved in the Studio (art/ui/ui-config.json)
// is applied to the game's own document with the Studio's applyUiConfig, so the game looks like the UI Lab. The player
// may switch to one of the four starting styles or to the original look; the choice lives in this browser only
// (localStorage), never in a save.
const KEY='newgame.uiStyle';
export const UI_STYLES=Object.freeze([
  {id:'studio',config:studioConfig},
  ...UI_PRESETS.map(p=>({id:p.style,config:p,name:p.name})),
  {id:'classic',config:null},
]);
let undo=null,current=null;
export function storedUiStyle(storage=globalThis.localStorage){try{const id=storage?.getItem(KEY);return UI_STYLES.some(s=>s.id===id)?id:'studio';}catch{return 'studio';}}
export function uiStyleLabel(style){return style.id==='studio'?t('uiStyle.studio'):style.id==='classic'?t('uiStyle.classic'):style.name??style.id;}
export function validUiConfig(config){return normalizeUiConfig(config).config;}
export function applyUiStyle(id=storedUiStyle(),{doc=globalThis.document,storage=globalThis.localStorage}={}){
  const style=UI_STYLES.find(s=>s.id===id)??UI_STYLES[0];
  undo?.();undo=null;if(style.config&&doc)undo=applyUiConfig(doc,style.config);current=style.id;
  try{storage?.setItem(KEY,style.id);}catch{/* the style still applies for this visit */}
  return style.id;
}
export function currentUiStyle(){return current;}
