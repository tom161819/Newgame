import { element,formatCost,missingCost } from './objectLabels.js';
import { BUILDING_CATEGORIES,buildingsInCategory } from '../data/buildingCategories.js';

export class BuildingBar {
  constructor({registry,assets,onSelect,onCancel,unlocks}) {
    Object.assign(this,{registry,assets,onSelect,onCancel,unlocks});this.category='all';
    this.controller=new AbortController();
    this.tab=document.querySelector('#buildings-tab');this.panel=document.querySelector('#buildings-panel');
    this.list=document.querySelector('#building-options');this.cancel=document.querySelector('#cancel-building');
    this.categories=document.querySelector('#building-categories');
    const options={signal:this.controller.signal};
    this.tab.addEventListener('click',()=>this.toggle(),options);
    this.list.addEventListener('click',event=>{const button=event.target.closest('[data-building-id]');if(button&&!button.disabled&&onSelect(registry.require(button.dataset.buildingId)))this.close();},options);
    this.cancel.addEventListener('click',onCancel,options);
    this.categories.addEventListener('click',event=>{const button=event.target.closest('[data-building-category]');if(button)this.selectCategory(button.dataset.buildingCategory);},options);
    this.unsubscribe=registry.subscribe(()=>this.render());this.unsubscribeAssets=assets.subscribe(()=>this.render());
    this.unsubscribeUnlocks=unlocks?.subscribe(()=>{if(this.selected&&!unlocks.status(this.selected).unlocked)this.onCancel();if(this.inventory)this.update(this.inventory,this.selected);});
    this.render();
  }
  render() {
    const categories={all:{name:'All',icon:'☷'},...BUILDING_CATEGORIES};
    this.categories.replaceChildren(...Object.entries(categories).map(([id,{name,icon}])=>{const button=element('button','building-category',`${icon} ${name}`);button.type='button';button.dataset.buildingCategory=id;button.setAttribute('aria-pressed',String(this.category===id));return button;}));
    this.choices=new Map();
    const cards=buildingsInCategory(this.registry,this.category).map(definition=>{
      const card=element('div','building-option'),button=element('button','building-choice');
      button.type='button';button.id=`${definition.id}-choice`;button.dataset.buildingId=definition.id;
      button.setAttribute('aria-pressed','false');button.setAttribute('aria-describedby',`${definition.id}-description ${definition.id}-availability`);
      const image=element('img','tower-icon');image.src=this.assets.previewURL(definition);image.alt='';
      const names=element('span','building-name');names.append(element('strong','',definition.name),element('small','',`${definition.width} × ${definition.height} políčka`));
      button.append(image,names,element('span','building-price',formatCost(definition.cost,this.registry)));
      const description=element('p','',definition.description);description.id=`${definition.id}-description`;
      const availability=element('p','building-availability');availability.id=`${definition.id}-availability`;availability.setAttribute('role','status');
      const lock=element('span','building-lock');button.append(lock);
      card.append(button,description,availability);this.choices.set(definition.id,{button,availability,definition,card,lock});return card;
    });
    this.list.replaceChildren(...(cards.length?cards:[element('p','building-empty','No registered buildings in this category yet.')]));this.choice=this.choices.get('tower')?.button;
    if(this.inventory)this.update(this.inventory,this.selected);
  }
  selectCategory(category){
    if(category!=='all'&&!Object.hasOwn(BUILDING_CATEGORIES,category))return;
    this.category=category;
    if(this.selected&&!buildingsInCategory(this.registry,category).some(d=>d.id===this.selected.id))this.onCancel();
    this.render();
  }
  toggle(){this.panel.hidden=!this.panel.hidden;this.tab.setAttribute('aria-expanded',String(!this.panel.hidden));}
  close(){this.panel.hidden=true;this.tab.setAttribute('aria-expanded','false');}
  update(inventory,selected){
    this.inventory=inventory;this.selected=selected;
    for(const {button,availability,definition,card,lock}of this.choices.values()){
      const status=this.unlocks?.status(definition)??{unlocked:true};
      button.disabled=!status.unlocked;card.classList.toggle('building-locked',!status.unlocked);lock.textContent=status.unlocked?'':'🔒 Locked';
      card.title=status.unlocked?definition.description:status.description;
      availability.textContent=status.unlocked?missingCost(definition.cost,inventory,this.registry):status.description;
      availability.classList.toggle('shortage',!status.unlocked||!inventory.canAfford(definition.cost));
      button.setAttribute('aria-pressed',String(selected?.id===definition.id));
    }
    this.cancel.hidden=!selected;
    document.querySelector('#building-selection').textContent=selected?`${selected.name} · ${selected.width} × ${selected.height} · ${formatCost(selected.cost,this.registry)}`:'';
  }
  destroy(){this.controller.abort();this.unsubscribe();this.unsubscribeAssets();this.unsubscribeUnlocks?.();}
}
