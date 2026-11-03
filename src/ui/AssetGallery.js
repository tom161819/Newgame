import { element,formatCost,formatModifiers,CATEGORY_LABELS } from './objectLabels.js';
import { buildingCategoryLabel } from '../data/buildingCategories.js';

export class AssetGallery {
  constructor({registry,assets,onOpen,onClose}) {
    Object.assign(this,{registry,assets,onOpen,onClose});
    this.dialog=document.querySelector('#asset-gallery');this.grid=document.querySelector('#asset-grid');
    this.detail=document.querySelector('#asset-detail');this.tabs=document.querySelector('#asset-categories');
    this.category='all';this.selectedId=null;this.restored=true;
    this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#asset-library-button').addEventListener('click',()=>this.open(),options);
    document.querySelector('#close-asset-gallery').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);
    this.dialog.addEventListener('click',event=>{if(event.target===this.dialog){const b=this.dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)this.close();}},options);
    this.tabs.addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button){this.category=button.dataset.category;this.selectedId=null;this.render();}},options);
    this.grid.addEventListener('click',event=>{const button=event.target.closest('[data-object-id]');if(button){this.selectedId=button.dataset.objectId;this.render();}},options);
    this.unsubscribe=registry.subscribe(()=>{if(this.isOpen)this.render();});
    this.unsubscribeAssets=assets.subscribe(()=>{if(this.isOpen)this.render();});
  }
  get isOpen(){return this.dialog.open;}
  open(){if(this.isOpen)return;this.restored=false;this.onOpen?.();this.render();this.dialog.showModal();document.querySelector('#close-asset-gallery').focus();}
  restore(){if(this.restored)return;this.restored=true;this.onClose?.();}
  close(){if(this.isOpen)this.dialog.close();this.restore();}

  render(){
    const categories=[['all','All'],...Object.entries(CATEGORY_LABELS)];
    this.tabs.replaceChildren(...categories.map(([id,label])=>{const button=element('button','asset-tab',label);button.type='button';button.dataset.category=id;button.setAttribute('aria-pressed',String(id===this.category));return button;}));
    const definitions=this.registry.forGallery(this.category);
    if(!definitions.some(d=>d.id===this.selectedId))this.selectedId=definitions[0]?.id??null;
    const cards=definitions.map(definition=>{
      const button=element('button','asset-card');button.type='button';button.dataset.objectId=definition.id;
      button.setAttribute('aria-pressed',String(definition.id===this.selectedId));
      const image=element('img','asset-thumbnail');image.src=this.assets.previewURL(definition);image.alt=definition.name;
      button.append(image,element('strong','',definition.name),element('small','',`${definition.width} × ${definition.height} políčka`));
      button.append(element('small','asset-flags',`Průchozí: ${definition.walkable?'ano':'ne'} · Sběr: ${definition.collectible?'ano':'ne'} · Stavba: ${definition.buildable?'ano':'ne'}`));
      if(definition.category==='building')button.append(element('span','asset-cost',formatCost(definition.cost,this.registry)));
      button.append(element('span','asset-description',definition.description),element('small','',`Interakce: ${definition.interactions.join(', ')||'žádné'}`));
      return button;
    });
    this.grid.replaceChildren(...cards);
    document.querySelector('#asset-count').textContent=`${definitions.length} / ${this.registry.all().length} objektů`;
    this.renderDetail(this.registry.get(this.selectedId));
  }

  renderDetail(definition){
    this.detail.replaceChildren();
    if(!definition){this.detail.append(element('p','','V této kategorii nejsou žádné objekty.'));return;}
    const image=element('img','asset-detail-image');image.src=this.assets.previewURL(definition);image.alt=definition.name;
    this.detail.append(image,element('h3','',definition.name),element('p','',definition.description));
    const list=element('dl','asset-properties');
    const rows=[['ID',definition.id],['Kategorie',CATEGORY_LABELS[definition.category]],['Rozměry',`${definition.width} × ${definition.height} políčka`],
      ['Průchozí',definition.walkable?'Ano':'Ne'],['Sběratelný',definition.collectible?'Ano':'Ne'],['Postavitelný',definition.buildable?'Ano':'Ne'],
      ['Cena',formatCost(definition.cost,this.registry)],['Interakce',definition.interactions.join(', ')||'Žádné']];
    if(definition.category==='building')rows.push(['Building Category',buildingCategoryLabel(definition)]);
    if(definition.category==='building')rows.push(['Unlock Requirements',(definition.requiresCompletedBuildings??[]).map(id=>this.registry.require(id).name).join(', ')||'None'],['Unlock Description',definition.unlockDescription??'Available from the start.']);
    if(definition.stats)rows.push(['Max HP',String(definition.stats.maxHP)],['DPS',String(definition.stats.attackDPS)],['Armor',`${definition.stats.armor} %`],['Attack Range',`${definition.stats.attackRange} políčko`]);
    if(definition.stats)rows.push(['HP Regeneration',`${definition.stats.hpRegenPerSecond??0} HP/s`]);
    if(definition.experience)rows.push(['Počáteční level',String(definition.experience.initialLevel)],['Max level',String(definition.experience.maxLevel)],['Získává XP',definition.experience.enabled?'Ano':'Ne'],['XP multiplier',`${definition.experience.gainMultiplier}×`]);
    if(definition.skills)rows.push(['Skilly',definition.skills.join(', ')],['Efektivita / level',`${definition.workEfficiencyPerLevel*100} %`]);
    if(definition.availableJobs)rows.push(['Profese',definition.availableJobs.join(', ')]);
    if(definition.constructionTime)rows.push(['Doba výstavby',`${definition.constructionTime/1000} s`]);
    if(definition.workplace)rows.push(['Pracovní místa',String(definition.workplace.capacity)],['Profese',definition.workplace.profession],['Pracovní skill',definition.workplace.skill]);
    if(definition.equipment)rows.push(['Slot',definition.equipment.slot],['Bonus',formatModifiers(definition.equipment.modifiers)]);
    if(definition.production)rows.push(['Produkce',`${definition.production.amount} ${this.registry.require(definition.production.resource).name} / day`]);
    if(definition.treasure)rows.push(['Obsah',`${definition.treasure.goldMin}–${definition.treasure.goldMax} Gold + ${definition.treasure.equipment.map(id=>this.registry.require(id).name).join(', ')}`]);
    for(const [name,value]of rows)list.append(element('dt','',name),element('dd','',value));
    this.detail.append(list);
    const technical=element('details','asset-technical');technical.append(element('summary','','Grafika a animace'));
    technical.append(element('p','',definition.sprite),element('p','',`Origin: ${definition.origin?.x??0.5}, ${definition.origin?.y??1} · Výška: ${definition.visualHeight??0} px`));
    technical.append(element('p','',`Grafika: ${definition.renderMode??'sprite'} · Animace: ${definition.animations?.mode??'žádné'}`));
    if(definition.animations?.clips)technical.append(element('p','',definition.animations.clips.map(c=>c.name).join(', ')));
    this.detail.append(technical);
    if(!this.assets.hasTexture(definition.id))this.detail.append(element('p','asset-fallback-note','Obrázek není dostupný. Používá se náhradní grafika.'));
  }

  destroy(){this.close();this.controller.abort();this.unsubscribe();this.unsubscribeAssets();}
}
