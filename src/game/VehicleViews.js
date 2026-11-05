import { gridToWorld } from './isometric.js';

// S12: procedural Wheelbarrow (a clearly marked fallback until Asset Studio art is approved). A pushed one sits just
// in front of its Hauler and turns with him; a parked one stands on its tile. Visible only where the player can see.
const KEY='vehicle-wheelbarrow';
function texture(scene){
  if(scene.textures.exists(KEY))return KEY;
  const g=scene.make.graphics({x:0,y:0,add:false});
  g.fillStyle(0x2e241a,.35);g.fillEllipse(24,27,34,8);
  g.fillStyle(0x9a6b3c);g.fillPoints([{x:6,y:12},{x:34,y:12},{x:30,y:22},{x:10,y:22}],true);
  g.lineStyle(1.5,0x4a3220);g.strokePoints([{x:6,y:12},{x:34,y:12},{x:30,y:22},{x:10,y:22}],true);
  g.lineStyle(2,0x4a3220);g.lineBetween(34,14,46,8);g.lineBetween(10,22,5,28);
  g.fillStyle(0x5a4a3a);g.fillCircle(20,25,5);g.lineStyle(1.5,0x2e241a);g.strokeCircle(20,25,5);
  g.generateTexture(KEY,48,32);g.destroy();return KEY;
}
export class VehicleViews {
  constructor(scene){this.scene=scene;this.views=new Map();}
  update(){
    const s=this.scene,system=s.vehicles;if(!system)return;const seen=new Set();
    for(const v of system.vehicles.values()){
      seen.add(v.id);let view=this.views.get(v.id);if(!view){view=s.add.image(0,0,texture(s)).setOrigin(.5,.8);this.views.set(v.id,view);}
      const p=system.position(v),ahead=p.direction?{x:p.x+p.direction.x*.45,y:p.y+p.direction.y*.45}:p,w=gridToWorld(ahead.x,ahead.y);
      const visible=!s.fog?.enabled||s.fog.isVisibleTile({x:Math.floor(p.x),y:Math.floor(p.y)});
      view.setPosition(w.x,w.y).setDepth(w.y+.02).setVisible(visible).setFlipX(!!p.direction&&p.direction.x-p.direction.y<0);
    }
    for(const [id,view]of this.views)if(!seen.has(id)){view.destroy();this.views.delete(id);}
  }
  destroy(){for(const v of this.views.values())v.destroy();this.views.clear();}
}
