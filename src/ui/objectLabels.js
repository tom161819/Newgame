import { t } from '../i18n/index.js';
import { countName } from '../i18n/names.js';
const CATEGORY_IDS=['terrain','resource','building','character','decoration','animal','equipment','treasure'];
// Category labels follow the current language.
export const CATEGORY_LABELS=Object.freeze(CATEGORY_IDS.reduce((labels,id)=>Object.defineProperty(labels,id,{get:()=>t(`category.${id}`),enumerable:true}),{}));
export function element(tag,className,text) {
  const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;
}
export function formatCost(cost,registry) {
  const entries=Object.entries(cost);
  return entries.length?entries.map(([id,amount])=>`${registry.get(id)?.symbol??registry.get(id)?.name??id} ${amount}`).join(' · '):t('cost.free');
}
export function formatModifiers(modifiers){
  const names={attackBonus:'% DPS',armor:` ${t('unit.armor')}`,maxHP:` ${t('panel.hp')}`,hpRegenPerSecond:` ${t('panel.hp')}/s`};
  return Object.entries(modifiers).map(([key,value])=>`${value>=0?'+':''}${value}${names[key]??` ${key}`}`).join(' · ');
}
export function missingCost(cost,inventory,registry) {
  const parts=Object.entries(cost).filter(([id,amount])=>inventory.count(id)<amount).map(([id,amount])=>{
    const missing=amount-inventory.count(id);return countName(registry.require(id),missing);
  });
  return parts.length?t('cost.missing',{list:parts.join(', ')}):t('cost.enough');
}
