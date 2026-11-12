import { localized } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { element,formatCost,missingCost } from './objectLabels.js';
import { BUILDING_CATEGORIES,buildingsInCategory } from '../data/buildingCategories.js';
import { bottomLift,fromDom } from './hudLayout.js';

export class BuildingBar {
  constructor({registry,assets,onSelect,onCancel,unlocks,freeOffer=()=>false}) {
    this.freeOffer=freeOffer;
    Object.assign(this,{registry,assets,onSelect,onCancel,unlocks});
    // E2 (report 0.48.0): open on the last used category, Food & Farming the first time (not the defences).
    let saved=null;try{saved=localStorage.getItem('newgame.buildingCategory');}catch{/* default */}this.category=saved==='all'||Object.hasOwn(BUILDING_CATEGORIES,saved??'')?saved:'food';
    this.controller=new AbortController();
    this.tab=document.querySelector('#buildings-tab');this.panel=document.querySelector('#buildings-panel');
    this.list=document.querySelector('#building-options');this.cancel=document.querySelector('#cancel-building');
    this.categories=document.querySelector('#building-categories');this.prev=document.querySelector('#building-scroll-prev');this.next=document.querySelector('#building-scroll-next');
    const options={signal:this.controller.signal};
    this.tab.addEventListener('click',()=>this.toggle(),options);
    this.list.addEventListener('click',event=>{const button=event.target.closest('[data-building-id]');if(button&&!button.disabled&&onSelect(registry.require(button.dataset.buildingId)))this.close();},options);
    this.cancel.addEventListener('click',onCancel,options);
    this.prev?.addEventListener('click',()=>this.scrollBy(-1),options);this.next?.addEventListener('click',()=>this.scrollBy(1),options);
    this.list.addEventListener('scroll',()=>this.updateScroll(),{...options,passive:true});window.addEventListener('resize',()=>{this.updateScroll();this.updateLift();},options);
    // A vertical wheel or trackpad gesture over the strip moves it sideways; the map never receives it.
    this.list.addEventListener('wheel',event=>{if(this.list.scrollWidth<=this.list.clientWidth+1||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;event.preventDefault();this.list.scrollLeft+=event.deltaY;},{...options,passive:false});
    this.list.addEventListener('keydown',event=>{const step={ArrowRight:1,ArrowLeft:-1,Home:-Infinity,End:Infinity}[event.key];const current=event.target.closest?.('[data-building-id]');if(!step||!current)return;const buttons=[...this.list.querySelectorAll('[data-building-id]')],index=buttons.indexOf(current),target=buttons[Math.max(0,Math.min(buttons.length-1,Number.isFinite(step)?index+step:step<0?0:buttons.length-1))];if(target&&target!==current){event.preventDefault();target.focus();target.closest('.building-option')?.scrollIntoView({block:'nearest',inline:'nearest'});}},options);
    this.categories.addEventListener('click',event=>{const button=event.target.closest('[data-building-category]');if(button)this.selectCategory(button.dataset.buildingCategory);},options);
    this.unsubscribe=registry.subscribe(()=>this.render());this.unsubscribeAssets=assets.subscribe(()=>this.render());
    this.unsubscribeUnlocks=unlocks?.subscribe(()=>{if(this.selected&&!unlocks.status(this.selected).unlocked)this.onCancel();if(this.inventory)this.update(this.inventory,this.selected);});
    this.render();
  }
  render() {
    const categories={all:{name:t('buildingCategory.all'),icon:'☷'},...Object.fromEntries(Object.entries(BUILDING_CATEGORIES).map(([id,c])=>[id,{...c,name:localized(`buildingCategory.${id}`,c.name)}]))};
    this.categories.replaceChildren(...Object.entries(categories).map(([id,{name,icon}])=>{const button=element('button','building-category',`${icon} ${name}`);button.type='button';button.dataset.buildingCategory=id;button.setAttribute('aria-pressed',String(this.category===id));return button;}));
    this.choices=new Map();
    const cards=buildingsInCategory(this.registry,this.category).map(definition=>{
      const card=element('div','building-option'),button=element('button','building-choice');
      button.type='button';button.id=`${definition.id}-choice`;button.dataset.buildingId=definition.id;
      button.setAttribute('aria-pressed','false');button.setAttribute('aria-describedby',`${definition.id}-description ${definition.id}-availability`);
      const image=element('img','tower-icon');image.src=this.assets.previewURL(definition);image.alt='';
      const names=element('span','building-name');names.append(element('strong','',definition.name),element('small','',t('building.size',{width:definition.width,height:definition.height})));
      button.append(image,names,element('span','building-price',formatCost(definition.cost,this.registry)));
      const description=element('p','',definition.description);description.id=`${definition.id}-description`;
      const availability=element('p','building-availability');availability.id=`${definition.id}-availability`;availability.setAttribute('role','status');
      const lock=element('span','building-lock');button.append(lock);
      card.append(button,description,availability);this.choices.set(definition.id,{button,availability,definition,card,lock});return card;
    });
    this.list.replaceChildren(...(cards.length?cards:[element('p','building-empty',t('building.empty'))]));this.choice=this.choices.get('tower')?.button;
    this.list.scrollLeft=0;if(this.inventory)this.update(this.inventory,this.selected);this.updateScroll();this.updateLift();
  }
  // m-prehled-kralovstvi-pozice: the open strip spans the window; the map's bottom items move up above it (--buildings-lift
  // on the map, read by the CSS of the camera chips and the corner stack); the Kingdom overview bar re-places itself.
  updateLift(){
    const view=document.querySelector('.viewport');if(!view)return;const open=!this.panel.hidden,lift=open?bottomLift(fromDom(view.getBoundingClientRect()),fromDom(this.panel.getBoundingClientRect())):0,value=lift?`${lift}px`:'';
    if(view.style.getPropertyValue('--buildings-lift')!==value){if(value)view.style.setProperty('--buildings-lift',value);else view.style.removeProperty('--buildings-lift');}
    document.dispatchEvent(new CustomEvent('hud-layout'));
  }
  scrollBy(direction){this.list.scrollBy({left:direction*Math.max(160,this.list.clientWidth*.8),behavior:'smooth'});}
  updateScroll(){if(!this.prev||!this.next)return;const max=this.list.scrollWidth-this.list.clientWidth,overflow=max>1;this.prev.hidden=this.next.hidden=!overflow;this.prev.disabled=this.list.scrollLeft<=1;this.next.disabled=this.list.scrollLeft>=max-1;}
  selectCategory(category){
    if(category!=='all'&&!Object.hasOwn(BUILDING_CATEGORIES,category))return;
    this.category=category;try{localStorage.setItem('newgame.buildingCategory',category);}catch{/* still switches */}
    if(this.selected&&!buildingsInCategory(this.registry,category).some(d=>d.id===this.selected.id))this.onCancel();
    this.render();
  }
  toggle(){this.panel.hidden=!this.panel.hidden;this.tab.setAttribute('aria-expanded',String(!this.panel.hidden));this.updateScroll();this.updateLift();}
  // For the right-click dismissal (PanelDismiss.closeOpenPanels): open while the menu shows.
  get dismissable(){const bar=this;return {get open(){return !bar.panel.hidden;},setOpen(v){if(!v)bar.close();}};}
  close(){this.panel.hidden=true;this.tab.setAttribute('aria-expanded','false');this.updateLift();}
  update(inventory,selected){
    this.inventory=inventory;this.selected=selected;
    for(const {button,availability,definition,card,lock}of this.choices.values()){
      const status=this.unlocks?.status(definition)??{unlocked:true};
      button.disabled=!status.unlocked;card.classList.toggle('building-locked',!status.unlocked);lock.textContent=status.unlocked?'':`🔒 ${t('building.locked')}`;
      const warning=status.unlocked?status.warning??'':'';
      card.title=status.unlocked?[definition.description,warning].filter(Boolean).join('\n'):status.description;
      const free=status.unlocked&&this.freeOffer(definition);
      availability.textContent=status.unlocked?[warning,free?t('building.freeOffer'):missingCost(definition.cost,inventory,this.registry)].filter(Boolean).join(' · '):status.description;
      availability.classList.toggle('shortage',!status.unlocked||!free&&!inventory.canAfford(definition.cost)||!!warning);card.classList.toggle('building-free',!!free);availability.classList.toggle('building-warning',!!warning);card.classList.toggle('building-warned',!!warning);
      button.setAttribute('aria-pressed',String(selected?.id===definition.id));
    }
    this.cancel.hidden=!selected;
    document.querySelector('#building-selection').textContent=selected?`${selected.name} · ${selected.width} × ${selected.height} · ${formatCost(selected.cost,this.registry)}`:'';
  }
  destroy(){document.querySelector('.viewport')?.style.removeProperty('--buildings-lift');this.controller.abort();this.unsubscribe();this.unsubscribeAssets();this.unsubscribeUnlocks?.();}
}
