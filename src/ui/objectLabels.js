export const CATEGORY_LABELS={terrain:'Terrain',resource:'Resources',building:'Buildings',character:'Characters',decoration:'Decorations',animal:'Animals',equipment:'Equipment',treasure:'Treasure'};
export function element(tag,className,text) {
  const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;
}
export function formatCost(cost,registry) {
  const entries=Object.entries(cost);
  return entries.length?entries.map(([id,amount])=>`${registry.get(id)?.symbol??registry.get(id)?.name??id} ${amount}`).join(' · '):'Bez ceny';
}
export function formatModifiers(modifiers){
  const names={attackBonus:'% DPS',armor:' Armor',maxHP:' HP',hpRegenPerSecond:' HP/s'};
  return Object.entries(modifiers).map(([key,value])=>`${value>=0?'+':''}${value}${names[key]??` ${key}`}`).join(' · ');
}
export function missingCost(cost,inventory,registry) {
  const parts=Object.entries(cost).filter(([id,amount])=>inventory.count(id)<amount).map(([id,amount])=>{
    const missing=amount-inventory.count(id),resource=registry.require(id),forms=resource.quantityNames;
    const name=forms?forms[missing===1?0:missing>=2&&missing<=4?1:2]:resource.name;
    return `${missing} ${name}`;
  });
  return parts.length?`Chybí ${parts.join(', ')}.`:'Dostatek surovin pro stavbu.';
}
