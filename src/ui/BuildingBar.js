import { element,formatCost,missingCost } from './objectLabels.js';

export class BuildingBar {
  constructor({registry,assets,onSelect,onCancel}) {
    Object.assign(this,{registry,assets,onSelect});
    this.controller=new AbortController();
    this.tab=document.querySelector('#buildings-tab');this.panel=document.querySelector('#buildings-panel');
    this.list=document.querySelector('#building-options');this.cancel=document.querySelector('#cancel-building');
    const options={signal:this.controller.signal};
    this.tab.addEventListener('click',()=>this.toggle(),options);
    this.list.addEventListener('click',event=>{const button=event.target.closest('[data-building-id]');if(button&&onSelect(registry.require(button.dataset.buildingId)))this.close();},options);
    this.cancel.addEventListener('click',onCancel,options);
    this.unsubscribe=registry.subscribe(()=>this.render());this.unsubscribeAssets=assets.subscribe(()=>this.render());
    this.render();
  }
  render() {
    this.choices=new Map();
    const cards=this.registry.buildables().map(definition=>{
      const card=element('div','building-option'),button=element('button','building-choice');
      button.type='button';button.id=`${definition.id}-choice`;button.dataset.buildingId=definition.id;
      button.setAttribute('aria-pressed','false');button.setAttribute('aria-describedby',`${definition.id}-description ${definition.id}-availability`);
      const image=element('img','tower-icon');image.src=this.assets.previewURL(definition);image.alt='';
      const names=element('span','building-name');names.append(element('strong','',definition.name),element('small','',`${definition.width} × ${definition.height} políčka`));
      button.append(image,names,element('span','building-price',formatCost(definition.cost,this.registry)));
      const description=element('p','',definition.description);description.id=`${definition.id}-description`;
      const availability=element('p','building-availability');availability.id=`${definition.id}-availability`;availability.setAttribute('role','status');
      card.append(button,description,availability);this.choices.set(definition.id,{button,availability,definition});return card;
    });
    this.list.replaceChildren(...cards);this.choice=this.choices.get('tower')?.button;
    if(this.inventory)this.update(this.inventory,this.selected);
  }
  toggle(){this.panel.hidden=!this.panel.hidden;this.tab.setAttribute('aria-expanded',String(!this.panel.hidden));}
  close(){this.panel.hidden=true;this.tab.setAttribute('aria-expanded','false');}
  update(inventory,selected){
    this.inventory=inventory;this.selected=selected;
    for(const {button,availability,definition}of this.choices.values()){
      availability.textContent=missingCost(definition.cost,inventory,this.registry);
      availability.classList.toggle('shortage',!inventory.canAfford(definition.cost));
      button.setAttribute('aria-pressed',String(selected?.id===definition.id));
    }
    this.cancel.hidden=!selected;
    document.querySelector('#building-selection').textContent=selected?`${selected.name} · ${selected.width} × ${selected.height} · ${formatCost(selected.cost,this.registry)}`:'';
  }
  destroy(){this.controller.abort();this.unsubscribe();this.unsubscribeAssets();}
}
