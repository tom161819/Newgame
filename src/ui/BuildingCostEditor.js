import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { CostError,costDiff,validateCost,writeBuildingCosts,priceProposals,COST_LIMIT } from '../data/buildingCostAuthoring.js';

// Asset Library: change the price of a building (#91 part 1). Every change applies at once to the menu, tooltips and new
// construction; standing buildings and sites keep the price they were placed with. Kept in this browser only.
const messages=new Map();
const storage=()=>{try{return globalThis.localStorage;}catch{return null;}};
export function buildingCostEditor(registry,definition,onApply){
  const id=definition.id,defaults=registry.costDefaults.get(id);
  const section=element('section','cost-editor');section.dataset.costEditor=id;
  section.append(element('h4','',t('costEditor.title')));
  const status=element('p','cost-editor-status',messages.get(id)??'');status.setAttribute('role','status');messages.delete(id);
  const say=(message,error=false)=>{status.textContent=message;status.classList.toggle('error',error);};
  const name=resource=>registry.get(resource)?.name??resource;
  const errorText=error=>error instanceof CostError?t(`costEditor.${error.code}`,{resource:name(error.detail.resource),max:COST_LIMIT}):t('costEditor.cost.invalid');
  // The registry change re-renders the Asset Library at once, so the message is left for the new editor first.
  const apply=(cost,message)=>{
    const overrides={...registry.costOverrides};
    try{if(cost)overrides[id]=validateCost(cost,new Set(registry.costResources().map(d=>d.id)));else delete overrides[id];}catch(error){say(errorText(error),true);return;}
    messages.set(id,message);
    try{registry.configureCosts({version:1,costs:overrides});}catch(error){messages.delete(id);say(errorText(error),true);return;}
    if(!writeBuildingCosts(storage(),registry.costOverrides)){const live=document.querySelector(`[data-cost-editor="${id}"] .cost-editor-status`);if(live)live.textContent=`${message} ${t('costEditor.sessionOnly')}`;}
    messages.delete(id);if(section.isConnected)say(message);onApply?.();
  };
  const current=definition.cost,rows=element('ul','cost-rows'),live=Object.keys(current).length;
  for(const row of costDiff(defaults,current)){
    const item=element('li',`cost-row cost-${row.state}`);item.dataset.costResource=row.resource;
    item.title=t('costEditor.default',{amount:row.from??0,resource:name(row.resource)});
    item.append(element('span','cost-name',name(row.resource)));
    if(row.state==='removed'){
      item.append(element('s','cost-old',String(row.from)));
      const restore=element('button','cost-restore',t('costEditor.restore'));restore.type='button';restore.dataset.costRestore=row.resource;
      restore.addEventListener('click',()=>apply({...current,[row.resource]:row.from},t('costEditor.restored',{resource:name(row.resource)})));item.append(restore);
    }else{
      const amount=element('input','cost-amount');amount.type='number';amount.min='1';amount.max=String(COST_LIMIT);amount.step='1';amount.value=String(row.to);amount.dataset.costAmount=row.resource;
      amount.setAttribute('aria-label',t('costEditor.amountLabel',{resource:name(row.resource)}));
      amount.addEventListener('change',()=>{const value=amount.value.trim()===''?NaN:Number(amount.value);if(!Number.isSafeInteger(value)||value<1||value>COST_LIMIT){say(t('costEditor.cost.amount',{resource:name(row.resource),max:COST_LIMIT}),true);amount.value=String(row.to);return;}if(value!==row.to)apply({...current,[row.resource]:value},t('costEditor.changed',{resource:name(row.resource),amount:value}));});
      item.append(amount);
      if(row.state==='changed')item.append(element('small','cost-was',t('costEditor.was',{amount:row.from})));
      if(row.state==='added')item.append(element('small','cost-was',t('costEditor.new')));
      const remove=element('button','cost-remove','×');remove.type='button';remove.dataset.costRemove=row.resource;remove.setAttribute('aria-label',t('costEditor.remove',{resource:name(row.resource)}));
      remove.addEventListener('click',()=>{if(live<=1){say(t('costEditor.cost.empty'),true);return;}const next={...current};delete next[row.resource];apply(next,t('costEditor.removed',{resource:name(row.resource)}));});
      item.append(remove);
    }
    rows.append(item);
  }
  if(!rows.children.length)rows.append(element('li','cost-row cost-free',t('costEditor.free')));
  section.append(rows);
  const missing=registry.costResources().filter(d=>!(d.id in current));
  if(missing.length){
    const add=element('div','cost-add'),select=element('select'),amount=element('input'),button=element('button','',t('costEditor.add'));
    select.dataset.costAddResource='';select.setAttribute('aria-label',t('costEditor.addResource'));
    for(const d of missing){const option=element('option','',d.name);option.value=d.id;select.append(option);}
    amount.type='number';amount.min='1';amount.max=String(COST_LIMIT);amount.step='1';amount.value='1';amount.dataset.costAddAmount='';amount.setAttribute('aria-label',t('costEditor.addAmount'));
    button.type='button';button.dataset.costAdd='';
    button.addEventListener('click',()=>{const value=Number(amount.value);if(!Number.isSafeInteger(value)||value<1||value>COST_LIMIT){say(t('costEditor.cost.amount',{resource:name(select.value),max:COST_LIMIT}),true);return;}apply({...current,[select.value]:value},t('costEditor.added',{resource:name(select.value),amount:value}));});
    add.append(element('span','',t('costEditor.addResource')),select,amount,button);section.append(add);
  }
  const actions=element('div','cost-actions');
  if(registry.costOverrides[id]){const reset=element('button','',t('costEditor.reset'));reset.type='button';reset.dataset.costReset='';reset.addEventListener('click',()=>apply(null,t('costEditor.resetDone')));actions.append(reset);}
  const count=Object.keys(registry.costOverrides).length;
  if(count){
    const all=element('button','',t('costEditor.resetAll',{count}));all.type='button';all.dataset.costResetAll='';
    all.addEventListener('click',()=>{messages.set(id,t('costEditor.resetAllDone'));registry.configureCosts({version:1,costs:{}});messages.delete(id);writeBuildingCosts(storage(),{});onApply?.();});
    const copy=element('button','',t('costEditor.copy',{count}));copy.type='button';copy.dataset.costCopy='';
    const output=element('textarea','cost-json');output.readOnly=true;output.hidden=true;output.dataset.costJson='';output.setAttribute('aria-label',t('costEditor.json'));
    copy.addEventListener('click',async()=>{
      const text=JSON.stringify(priceProposals(registry.costOverrides),null,2);output.value=text;output.hidden=false;output.select();
      try{await navigator.clipboard.writeText(text);say(t('costEditor.copied'));}catch{say(t('costEditor.copyManual'));}
    });
    actions.append(all,copy);section.append(actions,output);
  }else if(actions.children.length)section.append(actions);
  section.append(element('p','cost-help',t('costEditor.help')),status);
  return section;
}
