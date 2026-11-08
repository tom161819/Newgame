import { t } from '../i18n/index.js';
import { buildingDefinition } from '../game/buildings.js';
import { wikiTopicForFeed } from '../data/wiki.js';
import { wikiInfoButton } from './WikiPanel.js';
import { deathCauseText } from './DangerMarks.js';
import { feedIcon } from '../game/deployArt.js';
import { assetURL } from '../systems/AssetManager.js';

// #105: a short, fading feed of notable events above the minimap. It listens to the existing sources (seasons, the
// GameActivityBus, the population and the food system) instead of keeping a second event queue. Lasting work problems
// stay in the Notices panel (#51). UI only: nothing is saved, and a loaded game starts with a fresh feed.
export const FEED=Object.freeze({maxEntries:5,lifeMs:8000,importantLifeMs:12000,attackThrottleMs:30000});
export function cornerStack(doc=globalThis.document,parent=doc?.querySelector?.('#game')){
  let stack=doc?.querySelector?.('#corner-stack');
  if(!stack&&doc?.createElement&&parent){stack=doc.createElement('div');stack.id='corner-stack';stack.className='corner-stack';parent.append(stack);}
  return stack??null;
}
export class EventFeed {
  constructor(scene,{document:doc=globalThis.document,now=()=>performance.now()}={}){
    this.scene=scene;this.now=now;this.entries=[];this.seen=new Set();this.list=doc?.createElement?.('ol')??null;
    if(this.list){this.list.id='event-feed';this.list.className='event-feed';this.list.setAttribute('aria-live','polite');this.list.setAttribute('aria-label',t('feed.label'));const stack=cornerStack(doc);if(stack)stack.insertBefore(this.list,stack.querySelector('.minimap'));}
    this.season=scene.seasons?.season??null;this.residents=new Set(this.living().map(w=>w.id));this.shortage=!!scene.foodSystem?.shortage;this.attacks=new Map();this.pausedAt=null;
    const off=[];
    if(scene.seasons?.onChange)off.push(scene.seasons.onChange(()=>this.onSeason()));
    if(scene.activities?.on)off.push(scene.activities.on(event=>this.onActivity(event)));
    if(scene.workerSystem?.subscribe)off.push(scene.workerSystem.subscribe(()=>this.onPopulation()));
    this.off=off;
  }
  living(){return (this.scene.workerSystem?.liveSubjects?.()??[]).filter(w=>w.isSubject!==false);}
  gameTime(){return this.scene.gameTime?.totalElapsed??0;}
  // m-hlasky-udalosti (45): `target` – what the line is about (an object with position / x,y / tiles, or a function
  // returning a tile point); a click on the line moves the camera there.
  push(key,text,{important=false,target=null}={}){
    if(this.seen.has(key))return false;this.seen.add(key);
    const entry={key,text,important,expireAt:this.now()+(important?FEED.importantLifeMs:FEED.lifeMs),node:null};
    if(this.list){entry.node=this.list.ownerDocument.createElement('li');entry.node.className=`feed-entry${important?' important':''}`;entry.node.textContent=text;
      // m-nasadit-schvalenou-grafiku: night lines (thieves, wolves, fire, unlit lights) lead with the approved badge.
      const icon=feedIcon(key);if(icon){const base=this.scene.assets?.baseURL??import.meta.env?.BASE_URL??'/',img=this.list.ownerDocument.createElement('img');
        img.className='feed-icon';img.alt='';img.width=img.height=18;img.src=assetURL(icon.png,base);img.srcset=`${assetURL(icon.png,base)} 1x, ${assetURL(icon.png2x,base)} 2x`;
        img.onerror=()=>img.remove?.();entry.node.prepend?.(img,' ');}
      // m-wiki-napoveda: lines with a Wiki topic get a small "i".
      if(target){entry.node.classList.add('is-locatable');entry.node.tabIndex=0;entry.node.title=t('feed.locate');const go=e=>{if(e.target.closest?.('.wiki-info'))return;this.scene.focusOn?.(target);};entry.node.addEventListener('click',go);entry.node.addEventListener('keydown',e=>{if(e.key==='Enter')go(e);});}
      const topic=wikiTopicForFeed(key);if(topic&&this.scene.wikiPanel)entry.node.append(' ',wikiInfoButton(this.scene,topic,this.list.ownerDocument));
      this.list.prepend(entry.node);}
    this.entries.unshift(entry);while(this.entries.length>FEED.maxEntries)this.remove(this.entries.at(-1));
    return true;
  }
  remove(entry){this.entries=this.entries.filter(e=>e!==entry);entry.node?.remove();}
  onSeason(){const season=this.scene.seasons?.season;if(!season||season===this.season)return;this.season=season;const year=this.scene.seasons?.calendar?.year??0;this.push(`season:${year}:${season}`,t(`feed.season.${season}`),{important:true});}
  onActivity(event){
    if(event.type==='buildingCompleted'){const id=event.objectIds?.[0],building=this.scene.buildings?.find(b=>b.id===id);if(id==null)return;const d=building?buildingDefinition(building):this.scene.objectRegistry?.get?.(event.objectType);this.push(`built:${id}`,t('feed.built',{name:d?.name??event.objectType}),{target:building});}
    else if(event.type==='combatDamage'){
      const victim=this.scene.workerSystem?.workers?.get(event.targetId);if(!victim||victim.isSubject===false)return;
      const at=this.gameTime(),last=this.attacks.get(victim.id);if(last!==undefined&&at-last<FEED.attackThrottleMs)return;this.attacks.set(victim.id,at);this.push(`attack:${victim.id}:${at}`,t('feed.attacked',{name:victim.name}),{important:true,target:victim});this.scene.dangerMarks?.mark(victim.position);
    }
  }
  onPopulation(){
    const now=new Set(this.living().map(w=>w.id)),workers=this.scene.workerSystem?.workers;
    for(const id of now)if(!this.residents.has(id))this.push(`arrived:${id}`,t('feed.arrived',{name:workers?.get(id)?.name??id}),{target:workers?.get(id)});
    for(const id of this.residents)if(!now.has(id)){const w=workers?.get(id)??this.scene.workerSystem?.recentDeaths?.().find(d=>d.id===id);this.push(`gone:${id}`,w&&w.isAlive===false&&w.workState!=='Left Kingdom'?t('feed.diedOf',{name:w.name,cause:deathCauseText(this.scene,w.deathCause)}):w&&w.isAlive===false?t('feed.died',{name:w.name}):t('feed.left',{name:w?.name??id}),{important:w?.isAlive===false,target:w?{x:w.position?.x??w.tile?.x,y:w.position?.y??w.tile?.y}:null});}
    this.residents=now;
  }
  update(){
    const now=this.now(),paused=!!(this.scene.gameTime?.paused||this.scene.gameOver);
    // Paused time does not count: entries stay readable until play resumes.
    if(paused){this.pausedAt??=now;return;}
    if(this.pausedAt!==null){const shift=now-this.pausedAt;for(const e of this.entries)e.expireAt+=shift;this.pausedAt=null;}
    const shortage=!!this.scene.foodSystem?.shortage;if(shortage&&!this.shortage)this.push(`shortage:${this.scene.gameTime?.day??0}`,t('feed.foodShortage'),{important:true});this.shortage=shortage;
    for(const e of [...this.entries])if(now>=e.expireAt)this.remove(e);
  }
  destroy(){for(const off of this.off)off?.();this.list?.remove();this.entries=[];}
}
