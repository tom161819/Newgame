import { towerBase,buildingDefinition } from './buildings.js';
import { APPROVED_DEPLOY_ART } from '../data/objects/approvedDeployArt.js';
import { Fire,drawFlames,drawSmoke,roofSpots } from './fireModel.js';

// m-nasadit-schvalenou-grafiku: a burning building shows the owner's approved Fire Lab fire (art/effects/fire.json):
// flames on spots along the roof, smoke and embers, simulated by the Lab's particle model and drawn into a canvas per
// fire. The game's fire intensity scales the flames. Only fires in sight and on screen are simulated. Without a
// canvas (tests, no document) the provisional drawing of Day and night N3 stays. Also adds the glow to the light map.
const CANVAS={width:320,height:360,roofY:250};
export class FireViews {
  constructor(scene){this.scene=scene;this.views=new Map();this.phase=0;}
  lights(){const out=[];for(const [id,g] of this.views)out.push({x:g.x,y:g.y,radius:140,type:'fire',buildingId:id,strength:.9+Math.sin(this.phase*2)*.1});return out;}
  canUseModel(){return typeof document!=='undefined'&&!!this.scene.textures?.createCanvas&&!!APPROVED_DEPLOY_ART.fire?.params;}
  create(fire,b){
    const s=this.scene;
    if(this.canUseModel()){
      const key=`fire-lab:${fire.id}:${Math.random().toString(36).slice(2)}`,texture=s.textures.createCanvas(key,CANVAS.width,CANVAS.height);
      if(texture){const d=buildingDefinition(b),model=new Fire(APPROVED_DEPLOY_ART.fire.params,(Number(fire.id)||0)*7919+13);
        model.setSpots(roofSpots(APPROVED_DEPLOY_ART.fire.params.spots,Math.max(40,(d.width+d.height)*16),(Number(fire.id)||0)*31+5));model.ignite();
        const image=s.add.image(0,0,key).setOrigin(.5,CANVAS.roofY/CANVAS.height);image.model=model;image.texture2d=texture;image.textureKey=key;return image;}
    }
    return s.add.graphics();
  }
  update(delta){
    const s=this.scene,fires=s.nightThreats?.fires;if(!fires)return;this.phase+=delta/1000;
    for(const [id,g] of this.views)if(!fires.has(id)){this.remove(g);this.views.delete(id);}
    const view=s.cameras?.main?.worldView;
    for(const fire of fires.values()){
      const b=s.buildings.find(x=>x.id===fire.id);if(!b)continue;let g=this.views.get(fire.id);
      const base=towerBase(b),h=buildingDefinition(b).visualHeight??80;if(!g){g=this.create(fire,b);this.views.set(fire.id,g);}
      const visible=!s.fog||!s.fog.enabled||s.fog.isVisibleObject?.(b)!==false;
      g.setPosition(base.x,base.y-h*.7).setDepth(base.y+5000).setVisible(visible);
      if(g.model){
        const onScreen=!view||base.x>view.x-200&&base.x<view.right+200&&base.y>view.y-100&&base.y-h<view.bottom+300;if(!visible||!onScreen)continue;
        g.model.scale=Math.max(.15,Math.min(1,fire.intensity/100));g.model.step(Math.min(.1,delta/1000));
        const ctx=g.texture2d.getContext();ctx.clearRect(0,0,CANVAS.width,CANVAS.height);
        drawSmoke(ctx,g.model,CANVAS.width/2,CANVAS.roofY);drawFlames(ctx,g.model,CANVAS.width/2,CANVAS.roofY);g.texture2d.refresh();continue;
      }
      g.clear();const k=.5+fire.intensity/200,w=(buildingDefinition(b).width+buildingDefinition(b).height)*10;
      for(let i=0;i<5;i++){const x=(i-2)*w/4,f=Math.sin(this.phase*8+i*1.7)*.25+1,size=(10+fire.intensity/8)*k*f;
        g.fillStyle(0xff8a2a,.85);g.fillEllipse(x,-size*.6,size*.9,size*1.8);g.fillStyle(0xffd060,.95);g.fillEllipse(x,-size*.4,size*.45,size*.95);}
      for(let i=0;i<3;i++){const t=(this.phase*.6+i/3)%1;g.fillStyle(0x3a3a3a,.35*(1-t));g.fillCircle(Math.sin(this.phase+i)*8,-30-t*60,8+t*14);}
    }
  }
  remove(g){const key=g.textureKey;g.destroy();if(key&&this.scene.textures?.exists?.(key))this.scene.textures.remove(key);}
  destroy(){for(const g of this.views.values())this.remove(g);this.views.clear();}
}
