import { gridToWorld } from './isometric.js';

// Small dust puffs over a construction site while builders are actually
// working on it: a few soft clouds rise, grow and fade. Budgets keep it cheap:
// one puff every few hundred milliseconds per site, a cap per site and a
// global cap, pooled images and nothing at all with reduced motion.
export const DUST=Object.freeze({texture:'construction-dust',interval:[240,520],life:[950,1450],rise:[12,24],drift:7,scale:[.5,1.4],alpha:.58,maxPerSite:6,maxActive:48,colours:[0xd9cdb1,0xcbbd9c,0xbfb291]});

// Scaffolding appears only once work has started (first builder at work), then grows with progress.
export function scaffoldStage(construction){
  if(!construction||!(construction.workDone>0))return null;
  return construction.progress<=33?'low':construction.progress<=66?'mid':'high';
}

const prefersReducedMotion=()=>{try{return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}catch{return false;}};
const between=([a,b],r)=>a+(b-a)*r;
let active=0;
export const activeDust=()=>active;

export class DustEmitter{
  constructor(scene,site,{width=1,height=1,depth=0,random=Math.random,reducedMotion=prefersReducedMotion()}={}){
    this.scene=scene;this.site=site;this.width=width;this.height=height;this.depth=depth;this.random=random;this.reducedMotion=reducedMotion;
    this.next=0;this.pool=[];this.live=new Set();
  }
  // Called whenever builders advanced the work this frame; returns true when a puff was emitted.
  emit(now){
    if(this.reducedMotion||now<this.next||this.live.size>=DUST.maxPerSite||active>=DUST.maxActive)return false;
    const r=this.random;this.next=now+between(DUST.interval,r());
    ensureTexture(this.scene);
    const p=gridToWorld(this.site.x+this.width*(.18+.64*r()),this.site.y+this.height*(.18+.64*r())),life=between(DUST.life,r());
    const puff=this.pool.pop()??this.scene.add.image(0,0,DUST.texture);
    puff.setPosition(p.x,p.y-4-r()*8).setDepth(this.depth+.4).setTint(DUST.colours[Math.floor(r()*DUST.colours.length)]).setAlpha(DUST.alpha).setScale(DUST.scale[0]).setVisible(true);
    this.live.add(puff);active++;
    this.scene.tweens.add({targets:puff,y:puff.y-between(DUST.rise,r()),x:puff.x+(r()-.5)*2*DUST.drift,scale:DUST.scale[1]*(.8+.4*r()),alpha:0,duration:life,ease:'Sine.easeOut',onComplete:()=>this.release(puff)});
    return true;
  }
  release(puff){if(!this.live.delete(puff))return;active--;puff.setVisible(false);this.pool.push(puff);}
  setVisible(value){if(!value)for(const puff of [...this.live]){this.scene.tweens.killTweensOf?.(puff);this.release(puff);}}
  destroy(){for(const puff of [...this.live]){this.scene.tweens.killTweensOf?.(puff);this.release(puff);}for(const puff of this.pool)puff.destroy();this.pool=[];}
}

function ensureTexture(scene){
  if(scene.textures.exists(DUST.texture))return;
  const g=scene.make.graphics({x:0,y:0,add:false});
  for(let i=6;i>=1;i--){g.fillStyle(0xffffff,.07+.05*(6-i));g.fillCircle(12,12,2*i);}
  g.generateTexture(DUST.texture,24,24);g.destroy();
}
