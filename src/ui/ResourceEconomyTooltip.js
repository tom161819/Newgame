import { ledgerLabel } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { economyAmount,operatingNet } from './resourceEconomy.js';

export class ResourceEconomyTooltip {
  constructor(bar){
    this.bar=bar;this.controller=new AbortController();this.root=element('aside','resource-economy-tooltip');this.root.id='resource-economy-tooltip';this.root.hidden=true;this.root.tabIndex=0;this.root.setAttribute('role','tooltip');document.body.append(this.root);const options={signal:this.controller.signal};
    for(const type of ['wheel','keydown','keyup','pointerdown','mousedown','mouseup','click'])this.root.addEventListener(type,e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();this.hide();}},options);
    this.root.addEventListener('pointerenter',()=>clearTimeout(this.closeTimer),options);this.root.addEventListener('pointerleave',()=>this.scheduleHide(),options);this.root.addEventListener('focusout',()=>this.scheduleHide(),options);window.addEventListener('resize',()=>this.position(),options);window.addEventListener('blur',()=>this.hide(),options);
    this.root.addEventListener('focusin',()=>this.bar.resetCameraKeys(),options);
  }
  show(resource,item){clearTimeout(this.closeTimer);const changed=this.resource!==resource;this.resource=resource;this.item=item;this.root.hidden=false;this.refresh();if(changed)this.root.scrollTop=0;}
  scheduleHide(){clearTimeout(this.closeTimer);this.closeTimer=setTimeout(()=>{if(!this.root.contains(document.activeElement)&&document.activeElement!==this.item)this.hide();},160);}
  hide(){clearTimeout(this.closeTimer);this.root.hidden=true;this.resource=null;this.item=null;}
  refresh(){
    if(this.root.hidden||!this.resource)return;const id=this.resource,d=this.bar.registry.require(id),summary=this.bar.ledger?.summary(id),today=this.bar.ledger?.today?.(id)??null,count=this.bar.format(id),signature=JSON.stringify([id,d.name,count,summary,today,t('economy.storage',{count:''})]);if(signature===this.signature){this.position();return;}this.signature=signature;const title=element('h3','',d.name),stored=element('p','',t('economy.storage',{count})),nodes=[title,stored];
    // ryby-nepricteny (owner report 0.85.0): what came in and went out so far today, so a delivery that hungry residents
    // ate at once shows up as +5 Fishing / −5 Villager Consumption instead of a stock that never moved.
    if(today){nodes.push(element('h4','',t('economy.today',{day:today.day})));const list=element('ul','resource-economy-today');
      for(const [entries,sign]of [[today.incomeBySource,'+'],[today.expensesBySource,'−']])for(const [source,amount]of Object.entries(entries).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])))list.append(element('li','',`${sign}${economyAmount(id,amount)} ${ledgerLabel(source)}`));
      nodes.push(list);}
    if(!summary)nodes.push(element('p','',t('economy.noDay')));
    else{
      nodes.push(element('h4','',`${t('economy.lastDay',{day:summary.day})}${summary.partial?` · ${t('economy.partial')}`:''}`),element('p','resource-economy-summary',t('economy.summary',{income:`${summary.income?'+':''}${economyAmount(id,summary.income)}`,expenses:`${summary.expenses?'−':''}${economyAmount(id,summary.expenses)}`,net:economyAmount(id,summary.net,{signed:true})})));
      // (85) the balance in the bar leaves out building and hand collection.
      nodes.push(element('p','resource-economy-operating',t('economy.operating',{net:economyAmount(id,operatingNet(summary),{signed:true})})));
      for(const [title,entries,sign]of [[t('economy.income'),summary.incomeBySource,'+'],[t('economy.expenses'),summary.expensesBySource,'−']]){nodes.push(element('h4','',title));const list=element('ul');for(const [source,amount]of Object.entries(entries).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])))list.append(element('li','',`${sign}${economyAmount(id,amount)} ${ledgerLabel(source)}`));if(!list.childElementCount)list.append(element('li','', '0'));nodes.push(list);}
    }
    this.root.replaceChildren(...nodes);this.position();
  }
  position(){if(this.root.hidden||!this.item)return;const target=this.item.getBoundingClientRect(),width=this.root.offsetWidth,height=this.root.offsetHeight,left=Math.max(8,Math.min(innerWidth-width-8,target.left)),top=target.bottom+8+height<=innerHeight-8?target.bottom+8:Math.max(8,target.top-height-8);Object.assign(this.root.style,{left:`${left}px`,top:`${top}px`});}
  destroy(){this.hide();this.controller.abort();this.root.remove();}
}
