import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { CATS,DOGS,tameChance } from '../data/domesticAnimals.js';

// Domestic animals Z1: a cat's panel (name, home, Take in / Reassign with the list of homes and their rats) and the
// home chooser for a cat bought from a caravan.
export class CatPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#cat-dialog');this.controller=new AbortController();const options={signal:this.controller.signal};
    document.querySelector('#close-cat').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);
    this.unsubscribe=scene.domestic?.onChange(()=>{if(this.dialog.open)this.render();});
  }
  get isOpen(){return this.dialog.open;}
  // mode: 'cat' (a cat was clicked) or 'buy' (choose a home for a cat bought from the caravan).
  open(cat,mode='cat'){this.cat=cat;this.mode=mode;this.message='';this.render();if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput?.(false);this.dialog.showModal();}}
  // Z2: a dog's panel (tame / reassign) and the Hunter chooser for a dog bought from a caravan.
  openDog(dog,mode='dog'){this.cat=dog;this.mode=mode;this.message='';this.render();if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput?.(false);this.dialog.showModal();}}
  renderDog(){
    const d=this.scene.domestic,dog=this.cat?d.dogs.get(this.cat.id):null,root=document.querySelector('#cat-details'),title=document.querySelector('#cat-title');
    if(this.mode==='dog'&&!dog){this.close();return;}
    title.textContent=this.mode==='buyDog'?t('pets.dog.buyTitle',{price:DOGS.price}):dog.name;const lines=[];
    if(this.mode==='dog'){const h=dog.hunterId!=null?this.scene.workerSystem?.workers?.get(dog.hunterId):null;
      lines.push(element('p','cat-state',dog.state==='stray'?(dog.tamerId?t('pets.dog.taming'):t('pets.dog.stray')):h?t('pets.dog.hunter',{hunter:h.name??''}):t('pets.dog.unassigned')));
      if(dog.state!=='stray')lines.push(element('p','cat-state',dog.injuredUntil!=null?t('pets.dog.injured'):t('pets.dog.hp',{hp:Math.round(dog.hp),max:DOGS.maxHP})));}
    const stray=this.mode==='dog'&&dog.state==='stray';
    if(this.mode==='buyDog'||stray&&!dog.tried&&!dog.tamerId&&!dog.leaving||this.mode==='dog'&&['owned','unassigned'].includes(dog.state)){
      const hunters=d.freeHunters();lines.push(element('p','cat-help',t(stray?'pets.dog.chooseTame':this.mode==='buyDog'?'pets.dog.chooseBuy':'pets.dog.chooseReassign')));
      if(!hunters.length)lines.push(element('p','cat-message',t('pets.dog.needsHunter')));
      const list=element('ul','cat-homes');
      for(const h of hunters){const level=d.huntingLevel(h),label=stray?t('pets.dog.tameOption',{hunter:h.name??'',level,chance:Math.round(tameChance(level)*100)}):t('pets.dog.hunterOption',{hunter:h.name??'',level});
        const item=element('li'),button=element('button','',label);button.type='button';button.dataset.dogHunter=h.id;button.addEventListener('click',()=>this.chooseHunter(h.id,stray));item.append(button);list.append(item);}
      lines.push(list);
    }
    if(this.message)lines.push(element('p','cat-message',this.message));root.replaceChildren(...lines);
  }
  chooseHunter(hunterId,stray){
    const d=this.scene.domestic;
    if(this.mode==='buyDog'){const r=d.buyDog(hunterId);if(!r.ok){this.message=t(`pets.dog.error.${r.error}`);this.render();return;}this.close();return;}
    if(stray){if(d.startTaming(this.cat.id,hunterId))this.close();return;}
    if(d.assignDog(this.cat.id,hunterId))this.close();
  }
  render(){
    if(this.mode==='dog'||this.mode==='buyDog'){this.renderDog();return;}
    const d=this.scene.domestic,cat=this.cat&&d.cats.get(this.cat.id)?d.cats.get(this.cat.id):this.cat,root=document.querySelector('#cat-details');
    if(this.mode==='cat'&&(!cat||!d.cats.has(cat.id))){this.close();return;}
    const title=document.querySelector('#cat-title');title.textContent=this.mode==='buy'?t('pets.buyTitle',{price:CATS.price}):cat.name;
    const lines=[];
    if(this.mode==='cat'){
      const home=cat.buildingId!=null?d.buildingName(cat.buildingId):null;
      lines.push(element('p','cat-state',home?t('pets.livesAt',{building:home}):cat.state==='kitten'?t('pets.kitten'):cat.leaving?t('pets.leaving'):t('pets.stray',{time:this.timeLeft(cat)})));
    }
    if(this.mode==='buy'||!cat.leaving){
      lines.push(element('p','cat-help',t(this.mode==='buy'?'pets.chooseBuy':cat.buildingId!=null?'pets.chooseReassign':'pets.chooseTakeIn')));
      const list=element('ul','cat-homes');
      for(const b of d.homes()){
        const s=d.status(b.id),item=element('li'),button=element('button','',`${d.buildingName(b.id)} · ${d.isHouse(b)?t('pets.house'):t(`pets.rats.${s.level}`)}${s.cats?` · ${t('pets.catsThere',{count:s.cats})}`:''}`);
        button.type='button';button.dataset.catHome=b.id;button.disabled=!d.canHome(b,this.mode==='cat'?d.cats.get(cat.id):null)||cat?.buildingId===b.id;
        button.addEventListener('click',()=>this.choose(b.id));item.append(button);list.append(item);
      }
      lines.push(list);
    }
    if(this.message)lines.push(element('p','cat-message',this.message));
    root.replaceChildren(...lines);
  }
  timeLeft(cat){const days=Math.max(0,(cat.leaveAt-this.scene.gameTime.totalElapsed)/this.scene.gameTime.dayDuration);return Math.round(days*10)/10;}
  choose(buildingId){
    const d=this.scene.domestic;
    if(this.mode==='buy'){const r=d.buyCat(buildingId);if(!r.ok){this.message=t(`pets.error.${r.error}`);this.render();return;}this.close();this.scene.setStatus?.(t('pets.bought',{name:r.cat.name,building:d.buildingName(buildingId)}));return;}
    if(d.assign(this.cat.id,buildingId)){this.scene.setStatus?.(t('pets.assigned',{name:this.cat.name,building:d.buildingName(buildingId)}));this.close();}
  }
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput?.(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  relabel(){if(this.dialog.open)this.render();}
  destroy(){this.close();this.unsubscribe?.();this.controller.abort();}
}
