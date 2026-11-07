import { towerBase,buildingDefinition } from './buildings.js';

// Day and night N3: provisional fire on a burning building's roof (flickering flames and rising smoke, stronger with the
// fire's intensity) until the Studio fire loop is approved. Also adds the fire's glow to the light map.
export class FireViews {
  constructor(scene){this.scene=scene;this.views=new Map();this.phase=0;}
  lights(){const out=[];for(const [id,g] of this.views)out.push({x:g.x,y:g.y,radius:140,type:'fire',buildingId:id,strength:.9+Math.sin(this.phase*2)*.1});return out;}
  update(delta){
    const s=this.scene,fires=s.nightThreats?.fires;if(!fires)return;this.phase+=delta/1000;
    for(const [id,g] of this.views)if(!fires.has(id)){g.destroy();this.views.delete(id);}
    for(const fire of fires.values()){
      const b=s.buildings.find(x=>x.id===fire.id);if(!b)continue;let g=this.views.get(fire.id);
      const base=towerBase(b),h=buildingDefinition(b).visualHeight??80;if(!g){g=s.add.graphics();this.views.set(fire.id,g);}
      g.setPosition(base.x,base.y-h*.7).setDepth(base.y+5000).clear();const k=.5+fire.intensity/200,w=(buildingDefinition(b).width+buildingDefinition(b).height)*10;
      for(let i=0;i<5;i++){const x=(i-2)*w/4,f=Math.sin(this.phase*8+i*1.7)*.25+1,size=(10+fire.intensity/8)*k*f;
        g.fillStyle(0xff8a2a,.85);g.fillEllipse(x,-size*.6,size*.9,size*1.8);g.fillStyle(0xffd060,.95);g.fillEllipse(x,-size*.4,size*.45,size*.95);}
      for(let i=0;i<3;i++){const t=(this.phase*.6+i/3)%1;g.fillStyle(0x3a3a3a,.35*(1-t));g.fillCircle(Math.sin(this.phase+i)*8,-30-t*60,8+t*14);}
      g.setVisible(!s.fog||!s.fog.enabled||s.fog.isVisibleObject?.(b)!==false);
    }
  }
  destroy(){for(const g of this.views.values())g.destroy();this.views.clear();}
}
