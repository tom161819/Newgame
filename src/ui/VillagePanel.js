import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { VILLAGE_GREEN } from '../data/children.js';

// Children and the Village Green D1: one small dialog for a House (residents and children), a Village Green (reach,
// houses in reach, bonus, children playing there now; the reach is shown on the map while it is open) and a child
// (name, age, home). Children are never selected for orders.
export class VillagePanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#village-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#close-village').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);
    this.unsubscribe=scene.childrenSystem?.onChange(()=>{if(this.dialog.open)this.render();});
  }
  get isOpen(){return this.dialog.open;}
  open(kind,object){
    this.showRange(false);this.kind=kind;this.object=object;this.render();this.showRange(kind==='green');
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput?.(false);this.dialog.showModal();}
  }
  showRange(on){if(this.kind==='green'&&this.object)this.scene.towerViews?.get(this.object.id)?.showRange?.(on);}
  houseName(house){return t('village.houseName',{id:house.id});}
  render(){
    const s=this.scene,c=s.childrenSystem,root=document.querySelector('#village-details'),title=document.querySelector('#village-title'),lines=[];
    const workers=s.workerSystem?.workers,homes=s.needs?.homes?.()??new Map();
    if(this.kind==='house'){
      const house=this.object,residents=[...homes].filter(([,h])=>h?.kind==='house'&&h.buildingId===house.id).map(([id])=>workers?.get(id)?.name??id),kids=c?.childrenOf(house.id)??[];
      title.textContent=this.houseName(house);
      lines.push(element('p','village-residents',residents.length?t('village.residents',{names:residents.join(', '),count:residents.length}):t('village.noResidents')));
      // m-obyvatele-jmena-spanek-pohyb (42): who sleeps inside right now.
      const inside=s.workerSystem?.sleepersIn?.(house.id)??[],insideLine=element('p','village-inside',inside.length?t('village.inside',{count:inside.length,names:inside.map(w=>w.name).join(', ')}):t('village.nobodyInside'));insideLine.dataset.inside=String(inside.length);lines.push(insideLine);
      lines.push(element('p','village-children',kids.length?t('village.children',{names:kids.map(k=>t('village.childName',{name:c.nameOf(k),age:k.age})).join(', ')}):residents.length>=2?t('village.noChildren'):t('village.notFamily')));
      const bonus=c?.greenBonus(house,homes);if(bonus?.near)lines.push(element('p','village-bonus',t('village.houseBonus',{value:bonus.near+bonus.family})));
    }else if(this.kind==='green'){
      const green=this.object,houses=c?.housesInRange(green)??[],families=houses.filter(h=>c.isFamily(h,homes)).length;
      title.textContent=t('object.village_green.name');
      lines.push(element('p','village-help',t('village.greenHelp',{range:VILLAGE_GREEN.range,happiness:VILLAGE_GREEN.happiness,family:VILLAGE_GREEN.familyBonus})));
      lines.push(element('p','village-houses',t('village.greenHouses',{houses:houses.length,families})));
      const playing=c?.playingAt(green.id)??0;const p=element('p','village-playing',t('village.greenPlaying',{count:playing}));p.dataset.playing=String(playing);lines.push(p);
    }else{
      const child=this.object,house=c?.home(child);
      title.textContent=t('village.childTitle',{name:c?.nameOf?.(child,{full:true})??''});
      lines.push(element('p','village-child',t(child.sex==='girl'?'village.girlLine':'village.boyLine',{age:child.age,house:house?this.houseName(house):'—'})));
      lines.push(element('p','village-help',t('village.childHelp')));
    }
    root.replaceChildren(...lines);
  }
  close(){if(this.dialog.open)this.dialog.close();}
  restore(){if(this.restored)return;this.restored=true;this.showRange(false);this.kind=null;this.object=null;this.scene.setGalleryInput?.(true);}
  destroy(){this.controller.abort();this.unsubscribe?.();this.showRange(false);}
}
