import { t,language } from '../i18n/index.js';
import { localized,workMessageLabel } from '../i18n/names.js';
import { element } from './objectLabels.js';
import { militaryRank } from './militaryPanel.js';
import { commanded } from '../systems/UnitCommands.js';

// m-zalozka-vojsko (owner, 12 Nov): an Army tab beside Buildings – every soldier (Recruits and trained units) with rank,
// Barracks, health, order and what he is doing. Orders: Patrol (the default: he walks the settlement's round) and Guard
// (he stands where he is put – "Guard here", or the right mouse button on the map for the chosen ones). A click on a row
// moves the camera to the soldier and marks him; Shift + click adds or removes one, the camera then shows them all.
// The orders are the existing unit commands (hold / move / resume), so they are saved and loaded as before.
const RANK_ORDER=['knight','swordsman','archer','soldier'];
export function armyRows(scene){
  const military=scene.military,names=new Intl.Collator(language()==='cs'?'cs':'en',{numeric:true});
  const rank=w=>{const type=military?.unit(w)?.type;return type?RANK_ORDER.indexOf(type):RANK_ORDER.length;};
  return (scene.workerSystem?.liveSubjects?.()??[]).filter(w=>w.profession==='soldier').map(w=>{
    const barracks=scene.buildings.find(b=>b.id===w.assignedWorkplaceId)??null,shelter=w.sleepingIn!=null?scene.buildings.find(b=>b.id===w.sleepingIn):null;
    return {id:w.id,name:w.name,rank:militaryRank(scene,w),rankOrder:rank(w),barracksId:barracks?.id??null,hp:Math.round(w.currentHP),maxHp:Math.round(w.maxHP),order:commanded(w)?'guard':'patrol',
      state:shelter?t('population.soldierAsleep',{building:scene.objectRegistry.get(shelter.type)?.name??shelter.type}):w.workMessage?workMessageLabel(w.workMessage):localized(`work.state.${w.workState}`,w.workState)};
  }).sort((a,b)=>(a.barracksId??1e9)-(b.barracksId??1e9)||a.rankOrder-b.rankOrder||names.compare(a.name,b.name));
}
// The chosen soldiers after a click on `id`: alone, or with Shift added to / taken from those chosen before.
export function armyPick(current,id,shift){const next=new Set(shift?current:[]);if(shift&&current.has(id))next.delete(id);else next.add(id);return next;}

export class ArmyPanel {
  constructor(scene,{document:doc=globalThis.document}={}){
    this.scene=scene;this.picked=new Set();this.next=0;this.sig='';const anchor=doc?.querySelector?.('#buildings-tab');if(!anchor?.after)return;
    this.abort=new AbortController();const options={signal:this.abort.signal};
    this.tab=element('button','army-tab');this.tab.id='army-tab';this.tab.type='button';this.tab.setAttribute('aria-expanded','false');this.tab.setAttribute('aria-controls','army-panel');anchor.after(this.tab);
    this.panel=element('div','army-panel');this.panel.id='army-panel';this.panel.hidden=true;
    this.title=element('h2');this.hint=element('p','army-hint');this.actions=element('div','army-actions');this.list=element('div','army-list');this.buttons={};
    for(const action of ['patrol','guard']){const b=element('button');b.type='button';b.dataset.armyOrder=action;b.addEventListener('click',()=>this.order(action),options);this.actions.append(b);this.buttons[action]=b;}
    this.panel.append(this.title,this.actions,this.hint,this.list);anchor.before(this.panel);
    this.tab.addEventListener('click',()=>this.toggle(),options);
    this.list.addEventListener('click',event=>{const row=event.target.closest('[data-army-id]');if(row)this.pick(row.dataset.armyId,event.shiftKey);},options);
    this.update(true);
  }
  // For the right-click dismissal: open while shown and nobody is chosen (a right click with chosen soldiers sends them).
  get dismissable(){const army=this;return {get open(){return !!army.panel&&!army.panel.hidden&&!(army.workers().length&&army.scene.unitSelection?.ids.size);},setOpen(v){if(!v)army.toggle(false);}};}
  workers(){return [...this.picked].map(id=>this.scene.workerSystem.workers.get(id)).filter(w=>w?.isAlive&&w.profession==='soldier');}
  clearPick(){this.picked.clear();this.update(true);}
  toggle(open=this.panel.hidden){this.panel.hidden=!open;this.tab.setAttribute('aria-expanded',String(open));if(open){this.scene.buildingBar?.close?.();this.update(true);}}
  pick(id,shift=false){
    const s=this.scene;this.picked=armyPick(this.picked,id,shift);const workers=this.workers();
    // The map's own selection follows (only soldiers awake and in sight can be commanded there).
    s.unitSelection?.set(workers);
    if(workers.length){const x=workers.reduce((n,w)=>n+w.position.x,0)/workers.length,y=workers.reduce((n,w)=>n+w.position.y,0)/workers.length;s.worldCamera?.lookAt?.({x,y});}
    this.update(true);
  }
  order(action){
    const s=this.scene,commands=s.workerSystem.commands;if(s.gameOver||s.gameTime.paused)return;
    for(const w of this.workers()){if(action==='guard')commands.hold(w);else if(commanded(w))commands.resume(w);}
    s.unitSelection?.draw?.();this.update(true);
  }
  update(force=false){
    if(!this.tab)return;const now=globalThis.performance?.now?.()??Date.now();if(!force&&now<this.next)return;this.next=now+500;
    const s=this.scene,rows=armyRows(s),ids=new Set(rows.map(r=>r.id));for(const id of [...this.picked])if(!ids.has(id))this.picked.delete(id);
    const label=t('army.tab',{count:rows.length});if(this.tab.textContent!==label)this.tab.textContent=label;this.tab.hidden=!rows.length&&this.panel.hidden;
    if(this.panel.hidden)return;
    const sig=JSON.stringify([rows,[...this.picked],language(),!!s.gameTime?.paused]);if(sig===this.sig)return;this.sig=sig;
    const units=rows.filter(r=>r.rankOrder<RANK_ORDER.length).length;this.title.textContent=t('army.title',{count:rows.length,units,recruits:rows.length-units,guards:rows.filter(r=>r.order==='guard').length});
    this.hint.textContent=t(this.picked.size?'army.hintPicked':'army.hint',{count:this.picked.size});
    for(const [action,b] of Object.entries(this.buttons)){b.textContent=t(`army.order.${action}Button`);b.disabled=!this.picked.size||!!s.gameTime?.paused;}
    const nodes=[];let group=undefined;
    for(const r of rows){
      if(r.barracksId!==group){group=r.barracksId;const b=s.buildings.find(x=>x.id===group);nodes.push(element('h3','army-group',b?`${s.objectRegistry.get(b.type)?.name??b.type} #${b.id}`:t('army.noBarracks')));}
      const row=element('button','army-row');row.type='button';row.dataset.armyId=r.id;row.dataset.order=r.order;row.setAttribute('aria-pressed',String(this.picked.has(r.id)));row.title=t('population.locateName',{name:r.name});
      row.append(element('strong','',r.name),element('span','army-rank',r.rank),element('span','army-hp',`${r.hp} / ${r.maxHp}`),element('span','army-order',t(`army.order.${r.order}`)),element('small','',r.state));nodes.push(row);
    }
    if(!rows.length)nodes.push(element('p','army-empty',t('army.empty')));
    this.list.replaceChildren(...nodes);
  }
  destroy(){this.abort?.abort();this.tab?.remove();this.panel?.remove();}
}
