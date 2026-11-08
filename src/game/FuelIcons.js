import { towerBase,buildingDefinition } from './buildings.js';
import { nightIcon,stillKey } from './deployArt.js';

// Day and night N2: a "No fuel" sign over a light place whose store cannot light it tonight (an unlit torch with a
// red stroke). Checked twice a second; hidden under the fog like the other building signs.
export class FuelIcons {
  constructor(scene){this.scene=scene;this.icons=new Map();this.next=0;}
  update(){
    const s=this.scene,fuel=s.lightFuel;if(!fuel)return;const now=performance.now();if(now<this.next)return;this.next=now+500;
    const keep=new Set();
    for(const b of fuel.places()){
      if(fuel.isLit(b)||fuel.stock(b)>=buildingDefinition(b).fuel.perNight)continue;keep.add(b.id);
      // m-nasadit-schvalenou-grafiku: the approved "no torch" badge (2× PNG at half size) once loaded; the drawing until then.
      const badge=nightIcon('no-torch'),key=badge&&stillKey(s,{src:badge.png2x});let g=this.icons.get(b.id);
      if(g&&key&&!g.badge){g.destroy();g=null;this.icons.delete(b.id);}
      if(!g&&key){g=s.add.image(0,0,key).setDisplaySize(badge.size*.55,badge.size*.55);g.badge=true;g.buildingId=b.id;this.icons.set(b.id,g);}
      if(!g){g=s.add.graphics();this.icons.set(b.id,g);
        g.fillStyle(0x2a2108,.85);g.fillCircle(0,0,11);g.lineStyle(3,0x8a6a43);g.lineBetween(-4,6,3,-5);g.fillStyle(0x3a2a18);g.fillCircle(4,-6,3);
        g.lineStyle(2.5,0xd8402e);g.lineBetween(-8,8,8,-8);g.buildingId=b.id;}
      const base=towerBase(b),h=buildingDefinition(b).visualHeight??60;g.setPosition(base.x,base.y-h-18).setDepth(base.y+10000);
    }
    for(const [id,g]of this.icons)if(!keep.has(id)){g.destroy();this.icons.delete(id);}
    for(const [id,g]of this.icons){const b=s.buildings.find(x=>x.id===id);g.setVisible(!!b&&(!s.fog||!s.fog.enabled||s.fog.isVisibleObject?.(b)!==false));}
  }
  destroy(){for(const g of this.icons.values())g.destroy();this.icons.clear();}
}
