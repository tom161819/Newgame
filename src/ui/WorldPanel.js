import { t } from '../i18n/index.js';
import { SCOUTING,scoutTypeById } from '../data/scouting.js';
import { armyRows } from './ArmyPanel.js';

// What a soldier is doing, as an icon (its text on hover): patrol, guard, walls (wall walk and towers), hunting a wolf.
export const ORDER_ICONS=Object.freeze({patrol:'👣',guard:'🛡️',walls:'🏰',hunt:'🐺'});
// Pure: the soldiers (armyRows) by class, in the army panel's rank order; inside a class the free ones (on patrol) first.
const ORDER_RANK={patrol:0,guard:1,walls:2,hunt:3};
export function worldClasses(rows){
  const groups=new Map();for(const r of rows){if(!groups.has(r.rank))groups.set(r.rank,{rank:r.rank,order:r.rankOrder,rows:[]});groups.get(r.rank).rows.push(r);}
  for(const g of groups.values())g.rows.sort((a,b)=>(ORDER_RANK[a.order]??9)-(ORDER_RANK[b.order]??9));
  return [...groups.values()].sort((a,b)=>a.order-b.order);
}
// Pure: the picked ids after the class slider is set to n – keeps who is picked where it can, adds the next free ones
// in the class order, or drops the last ones.
export function pickClass(picked,rows,n){
  const next=new Set(picked),inClass=rows.filter(r=>next.has(r.id));
  if(inClass.length>n)for(const r of inClass.slice(n))next.delete(r.id);
  else for(const r of rows){if(rows.filter(x=>next.has(x.id)).length>=n)break;next.add(r.id);}
  return next;
}

// Owner 15 Nov 2026 (koncept v1, m-mapa-kraje): the World window. The home map (a minimap snapshot) in the middle, the
// eight zones around it – "?" until a party has been there. Pick a zone, tick soldiers, send. Turned 45° like the
// minimap, so a zone sits on the same side as the map edge the party leaves over.
export class WorldPanel {
  constructor(scene,doc=globalThis.document){
    this.scene=scene;this.doc=doc;this.selected=null;this.picked=new Set();if(!doc?.createElement)return;
    this.dialog=doc.createElement('dialog');this.dialog.id='world-dialog';const d=this.dialog;d.className='game-dialog world-dialog';d.setAttribute('aria-labelledby','world-title');
    doc.body.append(d);d.addEventListener('close',()=>{this.selected=null;});
    this.off=scene.scouting?.onChange?.(()=>{if(d.open)this.render();});
  }
  open(){if(!this.dialog)return;this.picked=new Set();this.render();if(!this.dialog.open)this.dialog.showModal?.();}
  close(){this.dialog?.open&&this.dialog.close();}
  el(tag,cls,text){const e=this.doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  render(){
    const s=this.scene.scouting,d=this.dialog;d.replaceChildren();if(!s)return;
    d.append(this.el('h2','',t('scouting.title')));d.querySelector('h2').id='world-title';
    const block=s.blocker();if(block)d.append(this.el('p','world-locked',t(`scouting.locked.${block}`)));
    const grid=this.el('div','world-grid'),party=s.party;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy){const home=this.el('div','world-home');const src=this.scene.minimap?.canvas,c=this.doc.createElement('canvas');c.width=src?.width||100;c.height=src?.height||100;try{c.getContext('2d')?.drawImage(src,0,0);}catch{}home.append(c);grid.append(home);continue;}
      const z=SCOUTING.zones.find(z=>z.dx===dx&&z.dy===dy),found=s.zones[z.id],type=found&&scoutTypeById(found.type);
      const b=this.el('button','world-zone');b.type='button';b.dataset.zone=z.id;
      const inner=this.el('span','world-zone-label');inner.append(this.el('b','',type?type.icon:'?'),this.el('small','',type?t(`scouting.type.${type.id}`):t(`scouting.zone.${z.id}`)));
      if(party?.zone===z.id)inner.append(this.el('em','',t(`scouting.phase.${party.phase}`)));
      b.append(inner);if(this.selected===z.id)b.classList.add('on');if(found)b.classList.add('found');
      b.title=t(`scouting.zone.${z.id}`);b.disabled=!!block;b.addEventListener('click',()=>{this.selected=z.id;this.render();});grid.append(b);
    }
    d.append(grid);
    if(party){
      const left=party.at!=null?Math.max(0,(party.at-this.scene.gameTime.totalElapsed)/this.scene.gameTime.dayDuration*24):null;
      d.append(this.el('p','world-status',t('scouting.status',{zone:t(`scouting.zone.${party.zone}`),count:party.ids.length,phase:t(`scouting.phase.${party.phase}`)})+(left!=null&&party.phase!=='there'?` · ${t('scouting.hoursLeft',{hours:Math.ceil(left)})}`:'')));
      // Owner 16 Nov 2026: a party that has arrived can be played (the map switches to its zone) or sent home.
      if(party.phase==='there'){const row=this.el('div','world-actions'),app=this.scene.game?.registry?.get?.('application');
        if(!this.scene.zone){const play=this.el('button','world-play',t('scouting.play'));play.type='button';play.addEventListener('click',()=>{this.close();app?.enterZone();});row.append(play);
          const back=this.el('button','world-back',t('scouting.sendHome'));back.type='button';back.addEventListener('click',()=>this.scene.scouting.sendHome());row.append(back);}
        else{const back=this.el('button','world-back',t('zone.sendHome'));back.type='button';back.addEventListener('click',()=>{this.close();app?.leaveZone();});row.append(back);}
        d.append(row);}
    }else if(!block){
      const soldiers=s.soldiers();
      if(!this.selected)d.append(this.el('p','world-hint',t('scouting.pickZone')));
      else{
        d.append(this.el('p','world-hint',t('scouting.pickSoldiers',{zone:t(`scouting.zone.${this.selected}`),hours:Math.round(SCOUTING.travelDays*24)})));
        const list=this.el('div','world-soldiers');
        // Owner 16 Nov 2026: the King may go along (otherwise he is not on the zone's map).
        if(s.kingFree()){const l=this.el('label','world-king');const c=this.doc.createElement('input');c.type='checkbox';c.checked=!!this.withKing;c.addEventListener('change',()=>{this.withKing=c.checked;this.render();});l.append(c,` 👑 ${t('scouting.withKing')}`);list.append(l);}
        if(!soldiers.length)list.append(this.el('p','',t('scouting.noSoldiers')));
        else list.append(this.classes(soldiers));
        if(soldiers.length){const all=this.el('button','world-all',t('scouting.all'));all.type='button';all.addEventListener('click',()=>{this.picked=new Set(soldiers.map(w=>w.id));this.render();});list.append(all);}
        d.append(list);
        // A Horse Wagon with goods from the stores (up to its load).
        const cart=s.freeWagon(),wagon=this.el('div','world-wagon');
        if(!cart)wagon.append(this.el('p','world-hint',t('scouting.noWagonHere')));
        else{const l=this.el('label');const c=this.doc.createElement('input');c.type='checkbox';c.checked=!!this.withWagon;c.addEventListener('change',()=>{this.withWagon=c.checked;this.render();});l.append(c,` 🐴 ${t('scouting.withWagon')}`);wagon.append(l);
          if(this.withWagon){this.cargo??={};const load=s.load(this.cargo);wagon.append(this.el('p','world-hint',t('scouting.wagonLoad',{load:Math.round(load),max:s.capacity()})));
            const grid=this.el('div','world-goods');for(const g of s.goods()){const row=this.el('label');const n=this.doc.createElement('input');n.type='number';n.min='0';n.max=String(g.available);n.step='1';n.value=String(this.cargo[g.resource]??0);n.addEventListener('change',()=>{const v=Math.max(0,Math.min(g.available,Math.floor(Number(n.value)||0)));if(v)this.cargo[g.resource]=v;else delete this.cargo[g.resource];this.render();});row.append(`${g.name} (${g.available}) `,n);grid.append(row);}
            wagon.append(grid);if(load>s.capacity())wagon.append(this.el('p','world-error',t('scouting.heavy')));}}
        d.append(wagon);
        const send=this.el('button','world-send',t('scouting.send'));send.type='button';send.disabled=!this.picked.size&&!this.withKing;this.sendButton=send;
        send.addEventListener('click',()=>{const r=s.send(this.selected,[...this.picked],{king:!!this.withKing,wagon:!!this.withWagon,cargo:this.withWagon?this.cargo:{}});if(r.error){this.error=r.error;}else{this.error=null;this.picked=new Set();this.withKing=false;this.withWagon=false;this.cargo={};}this.render();});d.append(send);
        this.safetyWarn=this.el('p','world-warn',t('scouting.safetyWarn'));this.safetyWarn.hidden=!this.picked.size;d.append(this.safetyWarn);if(this.withKing)d.append(this.el('p','world-warn',t('scouting.kingWarn')));
      }
    }
    if(this.error)d.append(this.el('p','world-error',this.error));
    const close=this.el('button','world-close',t('scouting.close'));close.type='button';close.addEventListener('click',()=>this.close());d.append(close);
  }
  // Owner 19 Nov 2026: the soldiers by class – a slider picks how many of a class go (6 of 10), the arrow opens the class
  // with every soldier by name (a tick each) and an icon of what he is doing (its text on hover).
  classes(soldiers){
    const ids=new Set(soldiers.map(w=>w.id)),groups=worldClasses(armyRows(this.scene).filter(r=>ids.has(r.id))),box=this.el('div','world-classes');
    this.expanded??=new Set();
    for(const g of groups){
      const wrap=this.el('div','world-class'),head=this.el('div','world-class-head'),open=this.expanded.has(g.rank);
      const toggle=this.el('button','world-class-toggle',open?'▾':'▸');toggle.type='button';toggle.setAttribute('aria-expanded',String(open));toggle.title=toggle.ariaLabel=t(open?'scouting.classHide':'scouting.classShow');
      toggle.addEventListener('click',()=>{open?this.expanded.delete(g.rank):this.expanded.add(g.rank);this.render();});
      const slider=this.doc.createElement('input');slider.type='range';slider.min='0';slider.max=String(g.rows.length);slider.step='1';slider.className='world-class-slider';slider.setAttribute('aria-label',g.rank);
      const count=this.el('output','world-class-count'),list=this.el('div','world-class-list'),boxes=[];
      const sync=()=>{const n=g.rows.filter(r=>this.picked.has(r.id)).length;slider.value=String(n);count.textContent=t('scouting.classCount',{picked:n,total:g.rows.length});for(const [c,r] of boxes)c.checked=this.picked.has(r.id);this.refreshSend();};
      slider.addEventListener('input',()=>{this.picked=pickClass(this.picked,g.rows,Number(slider.value));sync();});
      head.append(toggle,this.el('span','world-class-name',g.rank),slider,count);wrap.append(head);
      list.hidden=!open;
      for(const r of g.rows){const l=this.el('label','world-soldier');const c=this.doc.createElement('input');c.type='checkbox';boxes.push([c,r]);c.addEventListener('change',()=>{c.checked?this.picked.add(r.id):this.picked.delete(r.id);sync();});
        const icon=this.el('span','world-soldier-state',ORDER_ICONS[r.order]??'•');icon.title=`${t(`army.order.${r.order}`)} · ${r.state}`;icon.setAttribute('aria-label',icon.title);
        l.append(c,this.el('span','world-soldier-name',r.name),icon);list.append(l);}
      wrap.append(list);sync();box.append(wrap);
    }
    return box;
  }
  refreshSend(){if(this.sendButton)this.sendButton.disabled=!this.picked.size&&!this.withKing;if(this.safetyWarn)this.safetyWarn.hidden=!this.picked.size;}
  destroy(){this.off?.();this.dialog?.remove();}
}
