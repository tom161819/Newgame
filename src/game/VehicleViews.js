import { gridToWorld } from './isometric.js';
import { APPROVED_DEPLOY_ART as ART,wagonVariant,barrowVariant,stillKey,facesLeft } from './deployArt.js';

// S12: procedural Wheelbarrow (a clearly marked fallback until Asset Studio art is approved). A pushed one sits just
// in front of its Hauler and turns with him; a parked one stands on its tile. Visible only where the player can see.
const KEY='vehicle-wheelbarrow',WAGON='vehicle-horse_wagon';
// Horse Wagon: the harnessed horse in front, the wagon bed behind on two visible wheels (procedural fallback too).
function wagonTexture(scene){
  if(scene.textures.exists(WAGON))return WAGON;
  const g=scene.make.graphics({x:0,y:0,add:false});
  g.fillStyle(0x2e241a,.3);g.fillEllipse(38,36,64,8);
  g.fillStyle(0x7a5233);g.fillPoints([{x:4,y:14},{x:9,y:9},{x:14,y:10},{x:22,y:12},{x:28,y:11},{x:31,y:15},{x:31,y:24},{x:28,y:24},{x:27,y:19},{x:15,y:19},{x:14,y:30},{x:11,y:30},{x:11,y:24},{x:6,y:20}],true);
  g.lineStyle(1.2,0x3b2616);g.strokePoints([{x:4,y:14},{x:9,y:9},{x:14,y:10},{x:22,y:12},{x:28,y:11},{x:31,y:15},{x:31,y:24},{x:28,y:24},{x:27,y:19},{x:15,y:19},{x:14,y:30},{x:11,y:30},{x:11,y:24},{x:6,y:20}],true);
  g.lineStyle(2,0x4a3220);g.lineBetween(30,18,40,18);
  g.fillStyle(0x9a6b3c);g.fillPoints([{x:38,y:12},{x:68,y:12},{x:66,y:26},{x:40,y:26}],true);g.lineStyle(1.5,0x4a3220);g.strokePoints([{x:38,y:12},{x:68,y:12},{x:66,y:26},{x:40,y:26}],true);
  for(const x of [46,62]){g.fillStyle(0x5a4a3a);g.fillCircle(x,29,6);g.lineStyle(1.5,0x2e241a);g.strokeCircle(x,29,6);}
  g.generateTexture(WAGON,72,40);g.destroy();return WAGON;
}
const textureFor=(scene,type)=>type==='horse_wagon'?wagonTexture(scene):texture(scene);
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
  constructor(scene){this.scene=scene;this.views=new Map();this.facing=new Map();}
  art(v){const cargo=v.state==='inUse'?this.scene.workerSystem?.workers?.get(v.operatorId)?.cargo:null;
    if(v.type==='horse_wagon'){const k=wagonVariant(cargo,v.id);return k?ART.wagon[k]:null;}if(v.type==='wheelbarrow'){const k=barrowVariant(cargo);return k?ART.barrow[k]:null;}return null;}
  update(){
    const s=this.scene,system=s.vehicles;if(!system)return;const seen=new Set();
    for(const v of system.vehicles.values()){
      seen.add(v.id);let view=this.views.get(v.id);if(!view){view=s.add.image(0,0,textureFor(s,v.type)).setOrigin(.5,.8);this.views.set(v.id,view);}
      const p=system.position(v),ahead=p.direction?{x:p.x+p.direction.x*.45,y:p.y+p.direction.y*.45}:p,w=gridToWorld(ahead.x,ahead.y);
      const visible=!s.fog?.enabled||s.fog.isVisibleTile({x:Math.floor(p.x),y:Math.floor(p.y)});
      // m-nasadit-schvalenou-grafiku: the approved wagon (horse in front, drawn at the standalone horse's size) or
      // barrow with the operator's load; the drawing above stays while it loads or if it fails.
      const art=visible?this.art(v):null,key=art&&stillKey(s,art);
      if(key){if(view.texture.key!==key)view.setTexture(key);view.setOrigin(art.origin.x,art.origin.y);}
      else{const fallback=textureFor(s,v.type);if(view.texture.key!==fallback)view.setTexture(fallback);view.setOrigin(.5,.8);}
      view.setPosition(w.x,w.y).setDepth(w.y+.02).setVisible(visible).setFlipX(key?facesLeft(p.direction??this.facing.get(v.id)):!!p.direction&&p.direction.x-p.direction.y<0);
      if(p.direction)this.facing.set(v.id,p.direction);
    }
    for(const [id,view]of this.views)if(!seen.has(id)){view.destroy();this.views.delete(id);this.facing.delete(id);}
  }
  destroy(){for(const v of this.views.values())v.destroy();this.views.clear();}
}
