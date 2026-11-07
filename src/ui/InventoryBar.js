import { element } from './objectLabels.js';
import { ResourceEconomyTooltip } from './ResourceEconomyTooltip.js';
import { dailyResourceLabel,dailyResourceTone } from './resourceEconomy.js';
import { t } from '../i18n/index.js';

// Vykresluje původní Inventory; nevytváří druhý inventář ani nové suroviny.
export class InventoryBar {
  constructor(registry,assets,inventory) {
    Object.assign(this,{registry,assets,inventory});
    this.root=document.querySelector('#inventory-items');
    this.controller=new AbortController();this.tooltip=new ResourceEconomyTooltip(this);const options={signal:this.controller.signal};
    const show=e=>{const item=e.target.closest('[data-resource-economy]');if(item)this.tooltip.show(item.dataset.resourceEconomy,item);};this.root.addEventListener('pointerover',show,options);this.root.addEventListener('focusin',e=>{this.resetCameraKeys();show(e);},options);this.root.addEventListener('pointerout',e=>{if(!this.root.contains(e.relatedTarget))this.tooltip.scheduleHide();},options);this.root.addEventListener('focusout',()=>this.tooltip.scheduleHide(),options);for(const type of ['wheel','keydown','keyup'])this.root.addEventListener(type,e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();this.tooltip.hide();e.target.blur();}},options);
    this.unsubscribe=registry.subscribe(()=>this.render());
    this.unsubscribeAssets=assets.subscribe(()=>this.render());
    this.render();
  }
  render() {
    this.tooltip.hide();this.outputs=new Map();this.deltas=new Map();
    const items=this.registry.byCategory('resource').filter(d=>d.collectible).sort((a,b)=>(a.inventoryOrder??100)-(b.inventoryOrder??100)).map(definition=>{
      const item=element('div','inventory-item'),image=element('img','stone-icon');
      item.dataset.resourceEconomy=definition.id;item.tabIndex=0;item.setAttribute('aria-describedby',this.tooltip.root.id);
      image.src=this.assets.previewURL(definition);image.alt='';
      const output=element('output','',this.format(definition.id));
      output.id=`${definition.id}-count`;output.dataset.resourceCount=definition.id;
      output.setAttribute('aria-label',definition.inventoryLabel??definition.name);
      output.setAttribute('aria-live','polite');output.setAttribute('aria-atomic','true');
      this.outputs.set(definition.id,output);
      const delta=element('small','resource-delta',dailyResourceLabel(definition.id,this.ledger?.summary(definition.id)));delta.dataset.resourceDelta=definition.id;delta.dataset.tone=dailyResourceTone(this.ledger?.summary(definition.id));this.deltas.set(definition.id,delta);
      // N2: resources marked `inventoryHideZero` (Pitch, Torches) appear in the bar only while the kingdom has some.
      if(definition.inventoryHideZero){item.dataset.hideZero='true';item.hidden=this.format(definition.id)==='0';}
      item.append(image,element('span','',definition.inventoryLabel??definition.name),output,delta);return item;
    });
    // Owner request 7 Nov 2026: how full the stores are (Starter Stockpile and Warehouses), as used / capacity.
    const store=element('div','inventory-item storage-capacity');store.title=t('hud.storeCapacityHint');store.tabIndex=0;
    this.storeOutput=element('output','',this.storeText());this.storeOutput.id='storage-capacity';this.storeOutput.setAttribute('aria-label',t('hud.storeCapacity'));
    store.append(element('span','',t('hud.storeCapacity')),this.storeOutput);store.hidden=!this.storeUsage();
    this.storeItem=store;this.root.replaceChildren(...items,store);
  }
  storeUsage(){
    const locations=[...(this.inventory.storage?.locations?.values()??[])].filter(l=>(l.kind==='fallback'&&l.buildingId!=null)||String(l.id).startsWith('warehouse-'));
    if(!locations.length)return null;return {used:locations.reduce((n,l)=>n+Object.values(l.stock).reduce((a,v)=>a+v,0),0),capacity:locations.reduce((n,l)=>n+l.capacity,0)};
  }
  storeText(){const u=this.storeUsage();return u?`${u.used} / ${u.capacity}`:'';}
  // Gold shows its limit: 500.00 / 500.
  format(id){const limit=this.inventory.limit?.(id);return id==='gold'?`${this.inventory.count(id).toFixed(2)}${limit!=null?` / ${limit}`:''}`:String(this.inventory.count(id));}
  resetCameraKeys(){for(const key of Object.values(this.ledger?.scene.worldCamera?.keys??{}))key.reset?.();}
  setLedger(ledger){this.unsubscribeLedger?.();this.ledger=ledger;this.unsubscribeLedger=ledger.onChange(()=>this.update());this.update();}
  update() { for(const [id,output]of this.outputs){const count=this.format(id);if(output.textContent!==count)output.textContent=count;const item=output.parentElement;if(item?.dataset.hideZero){const hide=count==='0';if(item.hidden!==hide)item.hidden=hide;}const summary=this.ledger?.summary(id),delta=this.deltas.get(id),text=dailyResourceLabel(id,summary),tone=dailyResourceTone(summary);if(delta.textContent!==text)delta.textContent=text;if(delta.dataset.tone!==tone)delta.dataset.tone=tone;}if(this.storeOutput){const text=this.storeText();if(this.storeOutput.textContent!==text)this.storeOutput.textContent=text;this.storeItem.hidden=!text;}this.tooltip.refresh(); }
  destroy() { this.unsubscribe();this.unsubscribeAssets();this.unsubscribeLedger?.();this.controller.abort();this.tooltip.destroy(); }
}
