import { workplaceAuthoringEditor } from './WorkplaceAuthoringEditor.js';
import { buildingCostEditor } from './BuildingCostEditor.js';
import { t } from '../i18n/index.js';
import { localized } from '../i18n/names.js';
import { SKILLS,JOBS } from '../data/jobs.js';
const yes=value=>t(value?'asset.yes':'asset.no');
import { element,formatCost,formatModifiers,CATEGORY_LABELS } from './objectLabels.js';
import { buildingCategoryLabel } from '../data/buildingCategories.js';

export class AssetGallery {
  constructor({registry,assets,onOpen,onClose,onWorkplaceApply,onCostApply}) {
    Object.assign(this,{registry,assets,onOpen,onClose,onWorkplaceApply,onCostApply});
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
    const categories=[['all',t('buildingCategory.all')],...Object.entries(CATEGORY_LABELS)];
    this.tabs.replaceChildren(...categories.map(([id,label])=>{const button=element('button','asset-tab',label);button.type='button';button.dataset.category=id;button.setAttribute('aria-pressed',String(id===this.category));return button;}));
    const definitions=this.registry.forGallery(this.category);
    if(!definitions.some(d=>d.id===this.selectedId))this.selectedId=definitions[0]?.id??null;
    const cards=definitions.map(definition=>{
      const button=element('button','asset-card');button.type='button';button.dataset.objectId=definition.id;
      button.setAttribute('aria-pressed',String(definition.id===this.selectedId));
      const image=element('img','asset-thumbnail');image.src=this.assets.previewURL(definition);image.alt=definition.name;
      button.append(image,element('strong','',definition.name),element('small','',t('building.size',{width:definition.width,height:definition.height})));
      button.append(element('small','asset-flags',t('asset.flags',{walkable:yes(definition.walkable),collectible:yes(definition.collectible),buildable:yes(definition.buildable)})));
      if(definition.category==='building'){const cost=element('span','asset-cost',formatCost(definition.cost,this.registry));if(this.registry.costOverrides?.[definition.id]){cost.classList.add('asset-cost-changed');cost.title=t('costEditor.cardChanged',{price:formatCost(this.registry.costDefaults.get(definition.id),this.registry)});}button.append(cost);}
      button.append(element('span','asset-description',definition.description),element('small','',t('asset.interactions',{list:definition.interactions.join(', ')||t('asset.none')})));
      return button;
    });
    this.grid.replaceChildren(...cards);
    document.querySelector('#asset-count').textContent=t('asset.count',{count:definitions.length,total:this.registry.all().length});
    this.renderDetail(this.registry.get(this.selectedId));
  }

  renderDetail(definition){
    this.detail.replaceChildren();
    if(!definition){this.detail.append(element('p','',t('asset.emptyCategory')));return;}
    const image=element('img','asset-detail-image');image.src=this.assets.previewURL(definition);image.alt=definition.name;
    this.detail.append(image,element('h3','',definition.name),element('p','',definition.description));
    const list=element('dl','asset-properties');
    const rows=[['ID',definition.id],[t('asset.category'),CATEGORY_LABELS[definition.category]],[t('asset.size'),t('building.size',{width:definition.width,height:definition.height})],
      [t('asset.walkable'),yes(definition.walkable)],[t('asset.collectible'),yes(definition.collectible)],[t('asset.buildable'),yes(definition.buildable)],
      [t('asset.cost'),formatCost(definition.cost,this.registry)],[t('asset.interactionsLabel'),definition.interactions.join(', ')||t('asset.none')]];
    if(definition.category==='building')rows.push([t('asset.buildingCategory'),buildingCategoryLabel(definition)]);
    if(definition.category==='building')rows.push([t('asset.unlockRequirements'),(definition.requiresCompletedBuildings??[]).map(id=>this.registry.require(id).name).join(', ')||t('population.none')],[t('asset.unlockDescription'),definition.unlockDescription?localized(`object.${definition.id}.unlock`,definition.unlockDescription):t('asset.availableFromStart')]);
    if(definition.recommendsCompletedBuildings?.length)rows.push([t('asset.recommends'),definition.recommendsCompletedBuildings.map(id=>this.registry.require(id).name).join(', ')]);
    if(definition.stats)rows.push([t('asset.maxHp'),String(definition.stats.maxHP)],['DPS',String(definition.stats.attackDPS)],[t('unit.armor'),`${definition.stats.armor} %`],[t('asset.attackRange'),t('asset.tiles',{count:definition.stats.attackRange})]);
    if(definition.stats)rows.push([t('panel.hpRegen'),`${definition.stats.hpRegenPerSecond??0} HP/s`]);
    if(definition.experience)rows.push([t('asset.initialLevel'),String(definition.experience.initialLevel)],[t('asset.maxLevel'),String(definition.experience.maxLevel)],[t('asset.gainsXp'),yes(definition.experience.enabled)],[t('asset.xpMultiplier'),`${definition.experience.gainMultiplier}×`]);
    if(definition.skills)rows.push([t('unit.skills'),definition.skills.map(id=>SKILLS[id]??id).join(', ')],[t('asset.efficiency'),`${definition.workEfficiencyPerLevel*100} %`]);
    if(definition.availableJobs)rows.push([t('population.profession'),definition.availableJobs.map(id=>JOBS[id]?.name??id).join(', ')]);
    if(definition.constructionTime)rows.push([t('asset.constructionTime'),`${definition.constructionTime/1000} s`]);
    if(definition.workplace)rows.push([t('asset.workplaces'),String(definition.workplace.capacity)],[t('population.profession'),JOBS[definition.workplace.profession]?.name??definition.workplace.profession],[t('asset.workSkill'),SKILLS[definition.workplace.skill]??definition.workplace.skill]);
    if(definition.deposit)rows.push([t('asset.depositSupply'),t('asset.depositRange',{min:definition.deposit.min,max:definition.deposit.max,resource:this.registry.require(definition.deposit.resource).name})],[t('asset.renewal'),t('asset.finite')]);
    if(definition.tree)rows.push([t('asset.growthStages'),definition.tree.stages.map((stage,i)=>localized(`tree.stage.${i}`,stage)).join(' → ')],[t('asset.matureYield'),`${definition.tree.wood} ${this.registry.require('wood').name}`],[t('asset.chopping'),t('asset.choppingValue',{seconds:definition.tree.chopDuration/1000,xp:definition.tree.xp})]);
    if(definition.equipment)rows.push([t('asset.slot'),definition.equipment.slot==='weapon'?t('equipment.weapon'):definition.equipment.slot==='armor'?t('unit.armor'):definition.equipment.slot],[t('asset.bonus'),formatModifiers(definition.equipment.modifiers)]);
    if(definition.production)rows.push([t('asset.production'),t('asset.perDay',{count:definition.production.amount,resource:this.registry.require(definition.production.resource).name})]);
    if(definition.treasure)rows.push([t('asset.contents'),`${t('treasure.gold',{count:`${definition.treasure.goldMin}–${definition.treasure.goldMax}`})} + ${definition.treasure.equipment.map(id=>this.registry.require(id).name).join(', ')}`]);
    for(const [name,value]of rows)list.append(element('dt','',name),element('dd','',value));
    this.detail.append(list);
    if(this.registry.costDefaults?.has(definition.id))this.detail.append(buildingCostEditor(this.registry,definition,this.onCostApply));
    if(definition.workplace)this.detail.append(workplaceAuthoringEditor(this.registry,definition,this.onWorkplaceApply));
    const technical=element('details','asset-technical');technical.append(element('summary','',t('asset.graphics')));
    technical.append(element('p','',definition.sprite),element('p','',t('asset.origin',{x:definition.origin?.x??0.5,y:definition.origin?.y??1,height:definition.visualHeight??0})));
    technical.append(element('p','',t('asset.render',{mode:definition.renderMode??'sprite',animation:definition.animations?.mode??t('asset.none')})));
    if(definition.animations?.clips)technical.append(element('p','',definition.animations.clips.map(c=>c.name).join(', ')));
    this.detail.append(technical);
    if(!this.assets.hasTexture(definition.id))this.detail.append(element('p','asset-fallback-note',t('asset.fallback')));
  }

  destroy(){this.close();this.controller.abort();this.unsubscribe();this.unsubscribeAssets();}
}
