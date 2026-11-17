// Point 68 (owner 17 Nov 2026): a soldier who carries a torch shows a small flame above his hand (the glow on the
// ground comes from the night light map). One graphics per bearer, redrawn with a flicker.
export class TorchFlames {
  constructor(scene){this.scene=scene;this.flames=new Map();this.t=0;}
  update(delta){
    const s=this.scene,f=s.lightFuel;if(!f||!s.add)return;this.t+=delta;const live=new Set();
    for(const id of f.hands){const w=s.workerSystem?.workers.get(id);if(!w?.isAlive||!w.view?.active||w.view.visible===false)continue;live.add(id);
      let g=this.flames.get(id);if(!g){g=s.add.graphics();this.flames.set(id,g);}
      const k=(Math.sin(this.t/70+id.length*3)+Math.sin(this.t/43))*.25+1,x=w.view.x+9,y=w.view.y-30;
      g.clear().setDepth((w.view.depth??0)+.5).lineStyle(2,0x5a3a1e,1).lineBetween(x-1,y+12,x,y+1).fillStyle(0xd9451c,.95).fillTriangle(x-3,y+1,x+3,y+1,x,y-7*k).fillStyle(0xffc240,.95).fillTriangle(x-1.6,y+1,x+1.6,y+1,x,y-4*k);}
    for(const [id,g] of this.flames)if(!live.has(id)){g.destroy();this.flames.delete(id);}
  }
  destroy(){for(const g of this.flames.values())g.destroy();this.flames.clear();}
}
