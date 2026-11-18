import { definitionFor } from '../game/buildings.js';
import { canPatrolWalls } from '../systems/WallPatrol.js';
import { t,language } from '../i18n/index.js';
import { localized,workMessageLabel } from '../i18n/names.js';
import { element } from './objectLabels.js';
import { militaryRank } from './militaryPanel.js';
import { commanded } from '../systems/UnitCommands.js';
import { squads,makeSquad,dissolveSquad,squadMembers } from './armySquads.js';

// m-zalozka-vojsko (owner, 12 Nov): an Army tab beside Buildings – every soldier (Recruits and trained units) with rank,
// Barracks, health, order and what he is doing. Orders: Patrol (the default: he walks the settlement's round) and Guard
// (he stands where he is put – "Guard here", or the right mouse button on the map for the chosen ones). A click on a row
// moves the camera to the soldier and marks him; Shift + click adds or removes one, the camera then shows them all.
// The orders are the existing unit commands (hold / move / resume), so they are saved and loaded as before.
const RANK_ORDER=['knight','light_cavalry','halberdier','swordsman','royal_archer','crossbowman','archer','catapult','military_wagon','soldier'];
export function armyRows(scene){
  const military=scene.military,names=new Intl.Collator(language()==='cs'?'cs':'en',{numeric:true});
  const rank=w=>{const type=military?.unit(w)?.type;return type?RANK_ORDER.indexOf(type):RANK_ORDER.length;};
  return (scene.workerSystem?.liveSubjects?.()??[]).filter(w=>w.profession==='soldier').map(w=>{
    const barracks=scene.buildings.find(b=>b.id===w.assignedWorkplaceId)??null,shelter=w.sleepingIn!=null?scene.buildings.find(b=>b.id===w.sleepingIn):null;
    return {id:w.id,squad:Number.isInteger(w.squad)?w.squad:null,name:w.name,rank:militaryRank(scene,w),rankOrder:rank(w),barracksId:barracks?.id??null,hp:Math.round(w.currentHP),maxHp:Math.round(w.maxHP),order:w.huntWolfId?'hunt':w.wallPatrol?'walls':commanded(w)?'guard':'patrol',
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
    for(const action of ['patrol','guard','walls','hunt']){const b=element('button');b.type='button';b.dataset.armyOrder=action;b.addEventListener('click',()=>this.order(action),options);this.actions.append(b);this.buttons[action]=b;}
    // Squads: a bar of squad chips under the orders (click = choose the whole squad, Shift adds it, × dissolves it).
    this.squadBar=element('div','army-squads');this.squadBar.id='army-squads';
    this.squadBar.addEventListener('click',event=>{const out=event.target.closest('[data-squad-dissolve]');if(out){dissolveSquad(this.scene,Number(out.dataset.squadDissolve));this.update(true);return;}
      const chip=event.target.closest('[data-squad]');if(chip)this.pickSquad(Number(chip.dataset.squad),event.shiftKey);},options);
    this.panel.append(this.title,this.actions,this.squadBar,this.hint,this.list);anchor.before(this.panel);
    this.tab.addEventListener('click',()=>this.toggle(),options);
    this.list.addEventListener('click',event=>{if(event.target.closest('[data-squad-make]')){event.stopPropagation();this.makeSquad();return;}const row=event.target.closest('[data-army-id]');if(row)this.pick(row.dataset.armyId,event.shiftKey);},options);
    this.update(true);
  }
  // For the right-click dismissal: open while shown and nobody is chosen (a right click with chosen soldiers sends them).
  get dismissable(){const army=this;return {get open(){return !!army.panel&&!army.panel.hidden&&!(army.workers().length&&army.scene.unitSelection?.ids.size);},setOpen(v){if(!v)army.toggle(false);}};}
  workers(){return [...this.picked].map(id=>this.scene.workerSystem.workers.get(id)).filter(w=>w?.isAlive&&w.profession==='soldier');}
  clearPick(){this.picked.clear();this.update(true);}
  toggle(open=this.panel.hidden){this.panel.hidden=!open;this.tab.setAttribute('aria-expanded',String(open));if(open){this.scene.buildingBar?.close?.();this.update(true);}}
  makeSquad(){const id=makeSquad(this.scene,this.workers());if(id!=null)this.update(true);return id;}
  pickSquad(id,shift=false){const members=squadMembers(this.scene,id).map(w=>w.id);this.picked=new Set(shift?[...this.picked,...members]:members);this.focus();}
  pick(id,shift=false){this.picked=armyPick(this.picked,id,shift);this.focus();}
  focus(){
    const s=this.scene,workers=this.workers();
    // The map's own selection follows (only soldiers awake and in sight can be commanded there).
    s.unitSelection?.set(workers);
    if(workers.length){const x=workers.reduce((n,w)=>n+w.position.x,0)/workers.length,y=workers.reduce((n,w)=>n+w.position.y,0)/workers.length;s.worldCamera?.lookAt?.({x,y});}
    this.update(true);
  }
  order(action){
    const s=this.scene,commands=s.workerSystem.commands;if(s.gameOver||s.gameTime.paused)return;
    if(action==='hunt'){const wolves=s.nightThreats?.lurkingWolves?.()??[];if(!wolves.length){s.setStatus?.(t('army.huntNone'));return;}
      for(const w of this.workers()){if(commanded(w))commands.resume(w);s.military?.wallPatrol?.set(w,false);const near=[...wolves].sort((a,b)=>Math.hypot(a.position.x-w.position.x,a.position.y-w.position.y)-Math.hypot(b.position.x-w.position.x,b.position.y-w.position.y))[0];w.huntWolfId=near.id;}
      s.unitSelection?.draw?.();this.update(true);return;}
    if(action==='walls'){const wp=s.military?.wallPatrol;if(!wp||!canPatrolWalls(s.buildings)){s.setStatus?.(t('army.wallsNone'));return;}
      for(const w of this.workers()){delete w.huntWolfId;if(commanded(w))commands.resume(w);wp.set(w,true);}s.unitSelection?.draw?.();this.update(true);return;}
    for(const w of this.workers()){delete w.huntWolfId;s.military?.wallPatrol?.set(w,false);if(action==='guard')commands.hold(w);else if(commanded(w))commands.resume(w);}
    s.unitSelection?.draw?.();this.update(true);
  }
  update(force=false){
    if(!this.tab)return;const now=globalThis.performance?.now?.()??Date.now();if(!force&&now<this.next)return;this.next=now+500;
    const s=this.scene,rows=armyRows(s),ids=new Set(rows.map(r=>r.id));for(const id of [...this.picked])if(!ids.has(id))this.picked.delete(id);
    const label=t('army.tab',{count:rows.length});if(this.tab.textContent!==label)this.tab.textContent=label;this.tab.hidden=!rows.length&&this.panel.hidden;
    if(this.panel.hidden)return;
    const groups=squads(s);
    const sig=JSON.stringify([rows,[...this.picked],language(),!!s.gameTime?.paused,groups.map(g=>[g.id,g.members.length])]);if(sig===this.sig)return;this.sig=sig;
    this.squadBar.hidden=!groups.length;
    this.squadBar.replaceChildren(...groups.map(g=>{const all=g.members.every(w=>this.picked.has(w.id)),chip=element('span','army-squad');chip.dataset.squad=String(g.id);chip.setAttribute('role','button');chip.tabIndex=0;chip.setAttribute('aria-pressed',String(all));chip.title=t('army.squad.pick');
      const out=element('button','army-squad-dissolve','×');out.type='button';out.dataset.squadDissolve=String(g.id);out.title=t('army.squad.dissolve');out.setAttribute('aria-label',t('army.squad.dissolve'));
      chip.append(element('strong','',t('army.squad.name',{number:g.id})),element('span','',` ${g.members.length}`),out);return chip;}));
    const canMake=this.workers().length>=2;
    const units=rows.filter(r=>r.rankOrder<RANK_ORDER.length).length;this.title.textContent=t('army.title',{count:rows.length,units,recruits:rows.length-units,guards:rows.filter(r=>r.order==='guard').length});
    this.hint.textContent=t(this.picked.size?'army.hintPicked':'army.hint',{count:this.picked.size});
    for(const [action,b] of Object.entries(this.buttons)){b.textContent=t(`army.order.${action}Button`);b.disabled=!this.picked.size||!!s.gameTime?.paused||action==='hunt'&&!(s.nightThreats?.lurkingWolves?.().length)||action==='walls'&&!canPatrolWalls(s.buildings);if(action==='hunt')b.title=b.disabled&&this.picked.size?t('army.huntNone'):'';if(action==='walls')b.title=!canPatrolWalls(s.buildings)?t('army.wallsNone'):'';}
    const nodes=[];let group=undefined;
    for(const r of rows){
      if(r.barracksId!==group){group=r.barracksId;const b=s.buildings.find(x=>x.id===group);nodes.push(element('h3','army-group',b?`${definitionFor(b,s.objectRegistry,true)?.name??b.type} #${b.id}`:t('army.noBarracks')));}
      const row=element('button','army-row');row.type='button';row.dataset.armyId=r.id;row.dataset.order=r.order;row.setAttribute('aria-pressed',String(this.picked.has(r.id)));row.title=t('population.locateName',{name:r.name});
      const make=element('span','army-squad-make');
      if(canMake&&this.picked.has(r.id)){make.textContent='⚑';make.dataset.squadMake='1';make.setAttribute('role','button');make.title=t('army.squad.make',{count:this.workers().length});make.setAttribute('aria-label',make.title);}
      row.append(element('strong','',r.squad?`${r.name} `:r.name),element('span','army-rank',r.rank),element('span','army-hp',`${r.hp} / ${r.maxHp}`),element('span','army-order',t(`army.order.${r.order}`)),make,element('small','',r.squad?`${t('army.squad.name',{number:r.squad})} · ${r.state}`:r.state));nodes.push(row);
    }
    if(!rows.length)nodes.push(element('p','army-empty',t('army.empty')));
    this.list.replaceChildren(...nodes);
  }
  destroy(){this.abort?.abort();this.tab?.remove();this.panel?.remove();}
}
