import { FortificationView } from './FortificationView.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { tileCenter,tilePolygon } from './isometric.js';
import { roofCells,wallIndex,connectionsFor } from './walls.js';

// Reuses the approved wall kit. The middle span crops its block to the lintel;
// the open ground below remains visible. New final gate art stays in Asset Studio.
class LintelView extends FortificationView {
  paint(building,tint=null){
    super.paint(building,tint);
    const block=this.art.block;
    if(block){const source=block.texture.getSourceImage();block.setCrop(0,0,source.width,Math.ceil(source.height*.45));}
    else{
      const p=tileCenter(building),g=this.back.clear().setPosition(p.x,p.y).setDepth(p.y+16);
      g.fillStyle(tint??0xada691).fillPoints([{x:-32,y:-68},{x:0,y:-84},{x:32,y:-68},{x:0,y:-52}],true);
      g.fillStyle(tint??0x818373).fillPoints([{x:0,y:-52},{x:32,y:-68},{x:32,y:-56},{x:0,y:-40}],true);
      this.front.clear();
    }
  }
}
export class GateView {
  constructor(scene,building,preview=false){this.scene=scene;this.preview=preview;this.list=[];this.paint(building);}
  paint(building,tint=null){
    this.building=building;const index=wallIndex(this.scene.buildings),wall=objectRegistry.require('wall');
    const cells=roofCells(building);
    for(let i=0;i<cells.length;i++){
      const node={...cells[i],type:'wall',definition:wall,connections:connectionsFor(index,cells[i])};
      if(!this.list[i])this.list[i]=i===1?new LintelView(this.scene,node,this.preview):new FortificationView(this.scene,node,this.preview);
      this.list[i].paint(node,tint);
    }
    return this;
  }
  contains(x,y){return this.list.some(view=>view.contains(x,y));}
  setVisible(value){for(const view of this.list)view.setVisible(value);return this;}
  setAlpha(value){for(const view of this.list)view.setAlpha(value);return this;}
  inView(view){return this.list.some(part=>part.inView(view));}
  destroy(){for(const view of this.list)view.destroy();this.list=[];}
}
