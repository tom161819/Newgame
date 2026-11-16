import { t } from '../i18n/index.js';
import { SCOUTING,scoutTypeById } from '../data/scouting.js';

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
        if(!soldiers.length)list.append(this.el('p','',t('scouting.noSoldiers')));
        for(const w of soldiers){const l=this.el('label');const c=this.doc.createElement('input');c.type='checkbox';c.checked=this.picked.has(w.id);c.addEventListener('change',()=>{c.checked?this.picked.add(w.id):this.picked.delete(w.id);this.render();});l.append(c,` ${w.name??w.id}`);list.append(l);}
        if(soldiers.length){const all=this.el('button','',t('scouting.all'));all.type='button';all.addEventListener('click',()=>{this.picked=new Set(soldiers.map(w=>w.id));this.render();});list.append(all);}
        d.append(list);
        const send=this.el('button','world-send',t('scouting.send'));send.type='button';send.disabled=!this.picked.size;
        send.addEventListener('click',()=>{const r=s.send(this.selected,[...this.picked]);if(r.error){this.error=r.error;}else{this.error=null;this.picked=new Set();}this.render();});d.append(send);
        if(this.picked.size)d.append(this.el('p','world-warn',t('scouting.safetyWarn')));
      }
    }
    if(this.error)d.append(this.el('p','world-error',this.error));
    const close=this.el('button','world-close',t('scouting.close'));close.type='button';close.addEventListener('click',()=>this.close());d.append(close);
  }
  destroy(){this.off?.();this.dialog?.remove();}
}
