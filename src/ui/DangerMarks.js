import { gridToWorld } from '../game/isometric.js';
import { t } from '../i18n/index.js';

// m-hlasky-udalosti (54): where danger was seen (an attack, a fire, a death) a faint red area pulses on the map for
// DANGER.durationMs. Only where the player can see it at that moment (under fog nothing is marked).
export const DANGER=Object.freeze({durationMs:3600,radiusTiles:2.2,throttleMs:4000});
export class DangerMarks {
  constructor(scene){this.scene=scene;this.marks=[];this.recent=new Map();}
  mark(position,{radius=DANGER.radiusTiles}={}){
    const s=this.scene;if(!position||!s.add)return false;const tile={x:Math.floor(position.x),y:Math.floor(position.y)};
    if(s.fog?.enabled&&!s.fog.isVisibleTile?.(tile))return false;
    const key=`${Math.round(position.x/3)},${Math.round(position.y/3)}`,now=s.gameTime?.totalElapsed??0;if(now-(this.recent.get(key)??-Infinity)<DANGER.throttleMs)return false;this.recent.set(key,now);
    const w=gridToWorld(position.x,position.y),g=s.add.graphics();g.setPosition(w.x,w.y).setDepth(w.y+.5);
    this.marks.push({g,elapsed:0,radius});this.draw(this.marks.at(-1));return true;
  }
  draw(m){if(m.ping){const p=Math.min(1,m.elapsed/1000);m.g.clear();m.g.lineStyle(3,0xffe08a,1-p);m.g.strokeEllipse(0,0,(40+60*p)*1.4,(20+30*p)*1.4);return;}const p=m.elapsed/DANGER.durationMs,pulse=.5+.5*Math.sin(m.elapsed/180),rx=m.radius*32*(.85+.15*pulse),ry=rx/2;m.g.clear();m.g.fillStyle(0xd43c2c,.16*(1-p)+.06*pulse*(1-p));m.g.fillEllipse(0,0,rx*2,ry*2);m.g.lineStyle(2,0xe0503c,.45*(1-p));m.g.strokeEllipse(0,0,rx*2,ry*2);}
  // A short golden ring where the camera was sent (event feed click).
  ping(position){const s=this.scene;if(!position||!s.add)return;const w=gridToWorld(position.x,position.y),g=s.add.graphics();g.setPosition(w.x,w.y).setDepth(w.y+.6);this.marks.push({g,elapsed:0,radius:1.4,ping:true});}
  update(delta){for(let i=this.marks.length-1;i>=0;i--){const m=this.marks[i];m.elapsed+=delta;if(m.elapsed>=(m.ping?1000:DANGER.durationMs)){m.g.destroy();this.marks.splice(i,1);continue;}this.draw(m);}}
  destroy(){for(const m of this.marks)m.g.destroy();this.marks=[];}
}
// A cause of death as text: 'killed:wolf' → "killed by a Wolf", 'wounds' → "died of wounds".
export function deathCauseText(scene,cause){
  const m=/^killed:(.+)$/.exec(cause??'');if(m)return t('death.killedBy',{killer:scene.objectRegistry?.get?.(m[1])?.name??(m[1]==='peasant'?t('death.resident'):m[1])});
  return t('death.wounds');
}
