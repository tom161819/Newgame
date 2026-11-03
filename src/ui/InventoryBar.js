import { element } from './objectLabels.js';

// Vykresluje původní Inventory; nevytváří druhý inventář ani nové suroviny.
export class InventoryBar {
  constructor(registry,assets,inventory) {
    Object.assign(this,{registry,assets,inventory});
    this.root=document.querySelector('#inventory-items');
    this.unsubscribe=registry.subscribe(()=>this.render());
    this.unsubscribeAssets=assets.subscribe(()=>this.render());
    this.render();
  }
  render() {
    this.outputs=new Map();
    const items=this.registry.byCategory('resource').filter(d=>d.collectible).sort((a,b)=>(a.inventoryOrder??100)-(b.inventoryOrder??100)).map(definition=>{
      const item=element('div','inventory-item'),image=element('img','stone-icon');
      image.src=this.assets.previewURL(definition);image.alt='';
      const output=element('output','',this.format(definition.id));
      output.id=`${definition.id}-count`;output.dataset.resourceCount=definition.id;
      output.setAttribute('aria-label',definition.inventoryLabel??definition.name);
      output.setAttribute('aria-live','polite');output.setAttribute('aria-atomic','true');
      this.outputs.set(definition.id,output);
      item.append(image,element('span','',definition.inventoryLabel??definition.name),output);return item;
    });
    this.root.replaceChildren(...items);
  }
  format(id){return id==='gold'?this.inventory.count(id).toFixed(2):String(this.inventory.count(id));}
  update() { for(const [id,output]of this.outputs)output.textContent=this.format(id); }
  destroy() { this.unsubscribe();this.unsubscribeAssets(); }
}
