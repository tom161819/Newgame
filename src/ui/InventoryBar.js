import { element } from './objectLabels.js';
import { ResourceEconomyTooltip } from './ResourceEconomyTooltip.js';
import { dailyResourceLabel,dailyResourceTone } from './resourceEconomy.js';

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
      item.append(image,element('span','',definition.inventoryLabel??definition.name),output,delta);return item;
    });
    this.root.replaceChildren(...items);
  }
  format(id){return id==='gold'?this.inventory.count(id).toFixed(2):String(this.inventory.count(id));}
  resetCameraKeys(){for(const key of Object.values(this.ledger?.scene.worldCamera?.keys??{}))key.reset?.();}
  setLedger(ledger){this.unsubscribeLedger?.();this.ledger=ledger;this.unsubscribeLedger=ledger.onChange(()=>this.update());this.update();}
  update() { for(const [id,output]of this.outputs){const count=this.format(id);if(output.textContent!==count)output.textContent=count;const summary=this.ledger?.summary(id),delta=this.deltas.get(id),text=dailyResourceLabel(id,summary),tone=dailyResourceTone(summary);if(delta.textContent!==text)delta.textContent=text;if(delta.dataset.tone!==tone)delta.dataset.tone=tone;}this.tooltip.refresh(); }
  destroy() { this.unsubscribe();this.unsubscribeAssets();this.unsubscribeLedger?.();this.controller.abort();this.tooltip.destroy(); }
}
