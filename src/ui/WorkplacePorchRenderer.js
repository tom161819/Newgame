import { tileCenter } from '../game/isometric.js';
// Functional placeholder approved by #98. Replace this renderer for #114, not the seat policy.
export class WorkplacePorchRenderer {
  constructor(scene){this.scene=scene;this.views=new Map();}
  create(tile){
    const s=this.scene,p=tileCenter(tile),back=s.add.graphics({x:p.x,y:p.y}).setDepth(p.y-.3),front=s.add.graphics({x:p.x,y:p.y}).setDepth(p.y+.5);
    back.fillStyle(0x806a47,.72).fillPoints([{x:-24,y:0},{x:0,y:-12},{x:24,y:0},{x:0,y:12}],true);
    back.lineStyle(1,0xb29b67,.75);for(const y of [-3,2,7])back.lineBetween(-14,y,10,y-8);
    back.lineStyle(3,0x5b422e,1).lineBetween(-9,-11,-9,1).lineBetween(9,-10,9,2);
    back.fillStyle(0x9e7b49,1).fillPoints([{x:-13,y:-11},{x:3,y:-16},{x:14,y:-10},{x:-2,y:-5}],true);
    back.lineStyle(3,0x715437,1).lineBetween(-10,-18,9,-13);
    front.lineStyle(3,0x6b4e30,1).lineBetween(-10,-5,8,-1);return {back,front};
  }
  update(policy){
    if(!this.scene.add?.graphics)return;const s=this.scene,seen=new Set(),view=s.cameras.main?.worldView;
    for(const home of s.buildings){if(!home.definition?.workplace||!policy.complete(home))continue;
      for(const tile of policy.anchors(home)){
        const key=`${home.id}:${tile.x},${tile.y}`,p=tileCenter(tile),visible=policy.open(tile)&&s.fog.isVisibleObject(home)&&s.fog.isVisibleTile(tile)&&(!view||p.x>=view.x-40&&p.x<=view.right+40&&p.y>=view.y-30&&p.y<=view.bottom+40);seen.add(key);
        let item=this.views.get(key);if(!item&&visible){item=this.create(tile);this.views.set(key,item);}if(item){item.back.setVisible(visible);item.front.setVisible(visible);}
      }
    }
    for(const [key,v]of this.views)if(!seen.has(key)){v.back.destroy();v.front.destroy();this.views.delete(key);}
  }
  destroy(){for(const v of this.views.values()){v.back.destroy();v.front.destroy();}this.views.clear();}
}
