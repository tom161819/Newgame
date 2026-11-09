import { t } from '../i18n/index.js';

// Owner 9 Nov 2026: "the same style as the Lumberjack Hut in every building window – not much text, the info shows on
// hovering". Explanatory paragraphs of the windows below are hidden; their texts are joined into the title of one "i"
// icon at the right of the window's heading (before Close). Data, statuses and warnings stay as they are.
export const HINT_KEYS=Object.freeze(['market.pricesHelp','market.auto.help','builderWorkshop.help','storage.breakdownNote','village.greenHelp','village.childHelp','deposit.info','tree.info','food.note']);
export const HINT_WINDOWS='#marketplace-dialog,#builder-workshop-dialog,#storage-dialog,#village-dialog,#natural-resource-dialog,#food-economy-dialog,#construction-dialog,#farming-dialog,#workplace-dialog,#cat-dialog';
export function initCompactHints(doc=globalThis.document){
  const texts=()=>new Set(HINT_KEYS.map(k=>t(k)).filter(Boolean));
  const sync=dialog=>{
    const known=texts(),hints=[];
    for(const el of dialog.querySelectorAll('p,small,span.help,div.help,.hint,[class*="help"],[class*="note"]')){
      if(el.closest('.dialog-heading'))continue;const text=el.textContent.trim();
      if(!el.classList.contains('ui-hint')&&!(known.has(text)||[...known].some(k=>k.length>20&&text===k)))continue;
      el.classList.add('ui-hint');if(text)hints.push(text);
    }
    const heading=dialog.querySelector('.dialog-heading');if(!heading)return;
    let icon=heading.querySelector('.ui-hint-icon');
    if(!hints.length){if(icon)icon.hidden=true;return;}
    if(!icon){icon=doc.createElement('span');icon.className='ui-hint-icon';icon.textContent='i';icon.tabIndex=0;icon.setAttribute('role','img');const close=[...heading.children].reverse().find(e=>e.tagName==='BUTTON');heading.insertBefore(icon,close??null);}
    icon.hidden=false;const title=hints.join('\n\n');if(icon.title!==title){icon.title=title;icon.setAttribute('aria-label',title);}
  };
  const timer=setInterval(()=>{for(const d of doc.querySelectorAll(HINT_WINDOWS))if(d.open)sync(d);},400);
  return ()=>clearInterval(timer);
}
