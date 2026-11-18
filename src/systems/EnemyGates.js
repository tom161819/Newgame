import { buildingIsComplete } from '../game/buildings.js';

// Battle test 18 Nov 2026, point 5 ("Gate of the enemy"): an enemy Gate is closed and shows it (closed doors in the
// arch – provisional, drawn by code over the approved Gate picture). It opens for a sortie: while a melee defender who
// has seen our people is near it. An open Gate lets everybody through, our soldiers too; it closes again a moment
// after the last defender has gone from it, never on somebody standing in it. A broken Gate is gone as before.
// Runtime only: nothing is saved (a loaded Gate starts closed).
export const ENEMY_GATE=Object.freeze({sortieRadius:7,check:300,stayOpen:4000});
const GATES=['gate','wall_gate'];
// The arch in the Gate picture, as shares of the sprite (unflipped: the opening looks down-right).
const ARCH=[[.475,.825],[.65,.755],[.65,.6],[.6,.56],[.52,.575],[.475,.64]];
export const isEnemyGate=b=>!!b?.enemy&&GATES.includes(b.type);
export class EnemyGates{
  constructor(scene){this.scene=scene;this.wait=0;this.state=new Map();}
  isOpen(building){return !!this.state.get(building?.id)?.open;}
  centre(b){const d=b.definition,w=d?.width??1,h=d?.height??1;return {x:b.x+w/2,y:b.y+h/2};}
  // A melee defender near the Gate who goes for one of ours.
  sortie(b){
    const c=this.centre(b),r=ENEMY_GATE.sortieRadius;
    for(const a of this.scene.animalSystem?.animals?.values?.()??[]){
      if(!a.isAlive||!a.definition?.gameplay?.hostile||(a.attackRange??1)>2||!a.retaliationTarget?.isAlive)continue;
      if(Math.hypot(a.position.x-c.x,a.position.y-c.y)<=r)return true;
    }
    return false;
  }
  occupied(b){
    const s=this.scene,on=u=>u&&u.isAlive!==false&&b.tiles.some(t=>t.x===u.tile?.x&&t.y===u.tile?.y||u.nextTile&&t.x===u.nextTile.x&&t.y===u.nextTile.y);
    for(const w of s.workerSystem?.liveWorkers?.()??[])if(on(w))return true;
    for(const a of s.animalSystem?.animals?.values?.()??[])if(a.active!==false&&on(a))return true;
    return on(s.character);
  }
  update(delta){
    this.wait-=delta;if(this.wait>0)return;const step=ENEMY_GATE.check-this.wait;this.wait=ENEMY_GATE.check;
    const s=this.scene,live=new Set();
    for(const b of s.buildings??[]){
      if(!isEnemyGate(b)||!buildingIsComplete(b))continue;live.add(b.id);
      let st=this.state.get(b.id);if(!st){st={open:false,left:0,doors:null};this.state.set(b.id,st);this.set(b,st,false);}
      if(this.sortie(b))st.left=ENEMY_GATE.stayOpen;else st.left=Math.max(0,st.left-step);
      const want=st.left>0||st.open&&this.occupied(b);if(want!==st.open)this.set(b,st,want);else if(!st.open)this.paint(b,st);
    }
    for(const [id,st] of this.state)if(!live.has(id)){st.doors?.destroy?.();this.state.delete(id);}
  }
  set(b,st,open){st.open=open;for(const t of b.tiles??[])if(this.scene.map[t.y]?.[t.x]!=null)this.scene.map[t.y][t.x]=open?0:1;this.paint(b,st);}
  // Closed doors in the arch; they follow the sprite (a Gate across the other axis is mirrored).
  paint(b,st){
    const s=this.scene,view=s.towerViews?.get(b.id),sprite=view?.back?.sprite??view?.view?.back?.sprite;
    if(!sprite?.getTopLeft||!s.add?.graphics){return;}
    if(st.open){st.doors?.setVisible(false);return;}
    const key=`${sprite.x}|${sprite.y}|${sprite.displayWidth}|${sprite.flipX}|${sprite.depth}`;
    if(!st.doors){st.doors=s.add.graphics();st.key=null;}
    st.doors.setVisible(true);if(st.key===key)return;st.key=key;
    const tl=sprite.getTopLeft(),w=sprite.displayWidth,h=sprite.displayHeight,pt=([x,y])=>({x:tl.x+(sprite.flipX?1-x:x)*w,y:tl.y+y*h}),p=ARCH.map(pt),g=st.doors;
    g.clear().setDepth((sprite.depth??0)+.01);
    g.fillStyle(0x6e4c30,1).fillPoints(p,true);
    // planks, two iron bands, the gap between the two leaves
    const lerp=(a,b,k)=>({x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}),bl=p[0],br=p[1],topAt=k=>{const tl2=pt([ARCH[5][0]+(ARCH[2][0]-ARCH[5][0])*k,ARCH[5][1]+(ARCH[2][1]-ARCH[5][1])*k-.045*Math.sin(Math.PI*k)]);return tl2;};
    g.lineStyle(1,0x46301f,.9);for(let i=1;i<6;i++){const a=lerp(bl,br,i/6),t=topAt(i/6);g.lineBetween(a.x,a.y,t.x,t.y);}
    g.lineStyle(2,0x1f1712,1);{const a=lerp(bl,br,.5),t=topAt(.5);g.lineBetween(a.x,a.y,t.x,t.y);}
    g.lineStyle(2,0x2b2b2e,1);for(const k of [.3,.72]){const a=lerp(bl,topAt(0),k),z=lerp(br,topAt(1),k);g.lineBetween(a.x,a.y,z.x,z.y);}
    g.lineStyle(1,0x241a13,1).strokePoints(p,true);
  }
  destroy(){for(const st of this.state.values())st.doors?.destroy?.();this.state.clear();}
}
