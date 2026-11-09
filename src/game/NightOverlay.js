import { gridToWorld } from './isometric.js';
import { readLightSettings,resolveLights,LightMap,LIGHT_TYPES,hash01 } from '../render/lightLab.js';
import LIGHTING_V1 from '../data/lighting-v1.json';

// Owner 9 Nov 2026: "lighting v1" from the Studio Light Lab. The Lab's light map is the night: the screen (at the
// settings' resolution) is filled with the ambient colour (white by day, the dusk colour while it darkens, the night
// colour at night, mixed in by the night strength) and every light adds its own coloured ellipse (radius in tiles,
// reach up the walls, flicker, switching on one by one as it gets dark). The map is multiplied over the world.
// Directional shading and people's shadows of the Lab are not in the game yet.
export const LIGHTING=readLightSettings(LIGHTING_V1).settings;
const KEY='night:light-map',FORGES=new Set(['smelter','swordsmith','armorer','bakery']);
export function lightType(light,building){
  if(light.kind==='window')return 'window';if(building&&FORGES.has(building.type))return 'forge';
  if(light.type==='fire')return 'campfire';return LIGHT_TYPES.includes(light.type)?light.type:'torch';
}
export class NightOverlay {
  constructor(scene,dayNight,settings=LIGHTING){
    this.scene=scene;this.dayNight=dayNight;this.settings=settings;this.map=new LightMap({createCanvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}});this.seconds=0;
    if(scene.textures.exists(KEY))scene.textures.remove(KEY);this.texture=null;this.image=null;
    // Phaser's Canvas renderer probes the new blend modes once at start-up and the probe can fail (then MULTIPLY draws
    // as normal); every current browser supports 'multiply'.
    const modes=scene.sys?.game?.renderer?.blendModes;if(Array.isArray(modes)&&!scene.sys.game.renderer.gl&&modes[2]!=='multiply')modes[2]='multiply';
  }
  sources(){
    const s=this.scene,out=[],seed=(x,y)=>Math.floor(hash01(Math.round(x)*73856093^Math.round(y)*19349663)*1e6);
    for(const l of s.lightSources?.lights?.()??[]){const b=l.buildingId!=null?s.buildings?.find(x=>x.id===l.buildingId):null;out.push({type:lightType(l,b),x:l.x,y:l.y,seed:l.seed??seed(l.x,l.y)});}
    for(const w of this.dayNight.houseWindows())out.push({type:'window',x:w.x,y:w.y,seed:seed(w.x,w.y)});
    for(const h of s.lightFuel?.handLights?.()??[]){const p=gridToWorld(h.x,h.y);out.push({type:'torch',x:p.x,y:p.y,seed:seed(h.x,h.y)});}
    for(const f of s.fireViews?.lights?.()??[])out.push({type:'campfire',x:f.x,y:f.y,seed:seed(f.x,f.y)});
    return out;
  }
  update(delta=16){
    const darkness=this.dayNight.darkness(),cam=this.scene.cameras.main;this.seconds+=delta/1000;
    if(darkness<=.001){this.image?.setVisible(false);return;}
    const {width,height}=this.scene.scale,view=cam.worldView,lights=resolveLights(this.sources(),this.settings,{darkness,seconds:this.seconds});
    const canvas=this.map.render({width,height,view:{x:view.x,y:view.y,zoom:cam.zoom},lights,darkness,settings:this.settings});
    if(!this.texture||this.texture.getSourceImage()!==canvas){if(this.scene.textures.exists(KEY))this.scene.textures.remove(KEY);this.texture=this.scene.textures.addCanvas(KEY,canvas);this.image?.destroy();this.image=this.scene.add.image(0,0,KEY).setOrigin(0,0).setDepth(900000).setBlendMode(2);}
    else this.texture.refresh();
    this.image.setPosition(view.x,view.y).setScale(width/canvas.width/cam.zoom,height/canvas.height/cam.zoom).setVisible(true);
  }
  destroy(){this.image?.destroy();if(this.scene.textures.exists(KEY))this.scene.textures.remove(KEY);}
}
