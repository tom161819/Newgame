// Point 69 (owner 17 Nov 2026): "the dead lie where they died for at least 3 days, and battles leave blood stains".
// Bodies of people with an approved look stay where they fell (soldiers play their fall first, others lie down) for
// three game days; every wound in a fight leaves a stain that fades within two days. Both are saved.
import { gridToWorld } from '../game/isometric.js';
import { walkKey,FACING_INDEX } from '../data/objects/approvedArt.js';
import { APPROVED_VILLAGER_ART } from '../data/objects/approvedArt.js';
import { SOLDIER_ANIM_ART } from '../data/soldierAnimArt.js';
import { FISHER_WALK_ART } from '../data/fisherWalkArt.js';
import { assetURL } from './AssetManager.js';

export const BATTLE_MARKS=Object.freeze({corpseDays:3,stainDays:2,maxCorpses:300,maxStains:400,stainGapMs:450});
const FACINGS=Object.keys(FACING_INDEX);
const lookArt=look=>APPROVED_VILLAGER_ART[look]??SOLDIER_ANIM_ART[look]??FISHER_WALK_ART[look]??null;
const finite=v=>typeof v==='number'&&Number.isFinite(v);

// Strict check of the saved part (optional in a save).
export function validBattleMarks(m){
  if(!m||typeof m!=='object'||Object.keys(m).some(k=>!['corpses','stains'].includes(k))||!Array.isArray(m.corpses)||!Array.isArray(m.stains))return false;
  if(m.corpses.length>BATTLE_MARKS.maxCorpses||m.stains.length>BATTLE_MARKS.maxStains)return false;
  const pos=o=>finite(o.x)&&finite(o.y)&&o.x>=0&&o.y>=0&&o.x<1000&&o.y<1000&&finite(o.at)&&o.at>=0;
  return m.corpses.every(c=>c&&Object.keys(c).every(k=>['x','y','at','look','facing'].includes(k))&&pos(c)&&typeof c.look==='string'&&c.look.length<80&&FACINGS.includes(c.facing))
    &&m.stains.every(s=>s&&Object.keys(s).every(k=>['x','y','at','size'].includes(k))&&pos(s)&&finite(s.size)&&s.size>=.3&&s.size<=2);
}

export class BattleMarks {
  constructor(scene){this.scene=scene;this.corpses=[];this.stains=[];this.lastStain=new Map();this.check=0;}
  now(){return this.scene.gameTime?.totalElapsed??0;}
  day(){return this.scene.gameTime?.dayDuration??600000;}
  // A body where the unit died (only figures drawn from an approved look: the procedural ones vanish as before).
  addCorpse(unit){
    const look=unit?.view?.look,art=look?lookArt(look):null;if(!art?.walk||!unit.position)return null;
    const c={x:unit.position.x,y:unit.position.y,at:this.now(),look,facing:FACINGS.includes(unit.view.facing)?unit.view.facing:'S'};
    this.corpses.push(c);while(this.corpses.length>BATTLE_MARKS.maxCorpses)this.drop(this.corpses,0);
    this.draw(c,true);this.addStain(unit,1.3,true);return c;
  }
  // A stain at a wounded unit, not more often than every 450 ms per unit.
  addStain(unit,size=null,force=false){
    if(!unit?.position)return null;const now=this.now(),id=unit.id??unit;if(!force&&now-(this.lastStain.get(id)??-1e9)<BATTLE_MARKS.stainGapMs)return null;this.lastStain.set(id,now);
    const r=Math.random,s={x:Math.max(0,unit.position.x+(r()-.5)*.6),y:Math.max(0,unit.position.y+(r()-.5)*.6),at:now,size:size??.4+r()*.45};
    this.stains.push(s);while(this.stains.length>BATTLE_MARKS.maxStains)this.drop(this.stains,0);this.draw(s);return s;
  }
  drop(list,i){const [m]=list.splice(i,1);m?.view?.destroy?.();m?.timer?.remove?.();}
  // Pictures: a stain is a few dark red blots on the ground (under the fog), a body the last frame of the fall (soldiers)
  // or the standing frame laid down.
  draw(m,fresh=false){
    const s=this.scene;if(!s?.add)return;const p=gridToWorld(m.x,m.y);
    if(m.look===undefined){const g=s.add.graphics().setDepth(-64),k=m.size*10,seed=Math.floor((m.x*73+m.y*131)*1000);
      for(let i=0;i<4;i++){const a=((seed>>(i*3))%628)/100,d=i?k*.45:0;g.fillStyle(i?0x4a0a08:0x5c0e0b,i?.7:.8).fillEllipse(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.5,k*(i?.7:1.3),k*(i?.35:.6));}
      m.view=g;return;}
    const art=lookArt(m.look),key=walkKey(m.look);if(!art||!s.textures?.exists?.(key)){this.waitFor(m);return;}
    const k=FACING_INDEX[m.facing]??0,anim=art.anim,img=s.add.image(p.x,p.y,key,0).setOrigin(art.walk.origin.x,art.walk.origin.y).setScale(art.walk.scale??1).setDepth(p.y-2);m.view=img;
    if(anim){const frames=anim.die.map(c=>k*anim.columns+c);img.setFrame(frames[fresh?0:frames.length-1]);
      if(fresh){let t=0,done=false;const timer=m.timer=s.time?.addEvent?.({delay:50,loop:true,callback:()=>{if(done)return;t+=50;if(!img.active){done=true;timer?.remove();return;}const i=Math.min(frames.length-1,Math.floor(t*anim.dieFps/1000));img.setFrame(frames[i]);if(i>=frames.length-1){done=true;timer?.remove();if(m.timer===timer)m.timer=null;}}});}}
    else img.setFrame(k*3).setRotation(Math.PI/2*(k<4?1:-1)).setTint(0xb8b0a6).setOrigin(art.walk.origin.x,art.walk.origin.y*.85);
  }
  // A body whose look is not loaded yet (after Load) is drawn when it is.
  waitFor(m){const s=this.scene;if(m.waiting||!s?.load)return;m.waiting=true;const art=lookArt(m.look);if(!art)return;
    const key=walkKey(m.look),go=()=>{m.waiting=false;if(this.corpses.includes(m)&&!m.view)this.draw(m);};
    if(s.textures.exists(key)){go();return;}s.load.once?.(`filecomplete-spritesheet-${key}`,go);
    s.load.spritesheet?.(key,art.walkSrc??assetURL(`${art.base}.walk.png`,s.assets?.baseURL??import.meta.env?.BASE_URL??'/'),{frameWidth:art.walk.frameWidth,frameHeight:art.walk.frameHeight});if(!s.load.isLoading?.())s.load.start?.();}
  update(delta){
    this.check-=delta;if(this.check>0)return;this.check=1000;const now=this.now(),day=this.day(),fog=this.scene.fog;
    for(let i=this.corpses.length-1;i>=0;i--)if(now-this.corpses[i].at>=BATTLE_MARKS.corpseDays*day)this.drop(this.corpses,i);
    for(let i=this.stains.length-1;i>=0;i--){const st=this.stains[i],age=(now-st.at)/(BATTLE_MARKS.stainDays*day);if(age>=1){this.drop(this.stains,i);continue;}st.view?.setAlpha?.(Math.min(1,1.6*(1-age)));}
    for(const m of [...this.corpses,...this.stains]){const t={x:Math.floor(m.x),y:Math.floor(m.y)},state=fog?.displayState?.(t)??2;m.view?.setVisible?.(state>0);}
  }
  exportState(){return {corpses:this.corpses.map(c=>({x:c.x,y:c.y,at:c.at,look:c.look,facing:c.facing})),stains:this.stains.map(s=>({x:s.x,y:s.y,at:s.at,size:s.size}))};}
  importState(data){this.clear();if(!data)return;for(const c of data.corpses??[]){const m={...c};this.corpses.push(m);this.draw(m);}for(const s of data.stains??[]){const m={...s};this.stains.push(m);this.draw(m);}}
  clear(){for(const m of [...this.corpses,...this.stains]){m.view?.destroy?.();m.timer?.remove?.();}this.corpses=[];this.stains=[];}
}
