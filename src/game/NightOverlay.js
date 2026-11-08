import { DAY_NIGHT } from '../data/dayNight.js';
import { gridToWorld } from './isometric.js';

// Day and night N1: the light map. One render texture the size of the screen lies over the world (below the HTML UI):
// it is filled with a bluish ambient darkness and the lights cut soft holes into it (erase with a radial brush); a
// second, additive texture adds the warm glow. Only lights inside the camera view are drawn, and nothing at all by day.
// House windows glow from dusk until the family goes to bed; the castle's windows glow all night.
const BRUSH='night:light-brush',GLOW='night:light-glow';
export class NightOverlay {
  constructor(scene,dayNight){
    this.scene=scene;this.dayNight=dayNight;this.ensureTextures();
    const {width,height}=scene.scale;this.width=width;this.height=height;
    this.dark=scene.add.renderTexture(0,0,width,height).setOrigin(0,0).setDepth(900000).setVisible(false);
    this.glow=scene.add.renderTexture(0,0,width,height).setOrigin(0,0).setDepth(900001).setBlendMode('ADD').setVisible(false);
    this.brush=scene.make.image({x:0,y:0,key:BRUSH,add:false});this.glowBrush=scene.make.image({x:0,y:0,key:GLOW,add:false});
  }
  ensureTextures(){
    const t=this.scene.textures,make=(key,stops)=>{if(t.exists(key))return;const c=t.createCanvas(key,128,128),ctx=c.getContext(),g=ctx.createRadialGradient(64,64,0,64,64,64);for(const [at,color] of stops)g.addColorStop(at,color);ctx.fillStyle=g;ctx.fillRect(0,0,128,128);c.refresh();};
    make(BRUSH,[[0,'rgba(255,255,255,1)'],[.55,'rgba(255,255,255,.75)'],[1,'rgba(255,255,255,0)']]);
    make(GLOW,[[0,'rgba(255,190,110,.55)'],[.5,'rgba(255,160,80,.18)'],[1,'rgba(255,140,60,0)']]);
  }
  update(){
    const dn=this.dayNight,alpha=dn.ambientAlpha(),cam=this.scene.cameras.main;
    if(alpha<=.001){if(this.dark.visible){this.dark.setVisible(false);this.glow.setVisible(false);}return;}
    const view=cam.worldView,zoom=cam.zoom,{width,height}=this.scene.scale;
    if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.dark.resize(width,height);this.glow.resize(width,height);}
    // The textures sit in world space over exactly the camera view, scaled back by the zoom.
    for(const rt of [this.dark,this.glow])rt.setPosition(view.x,view.y).setScale(1/zoom).setVisible(true);
    this.dark.clear().fill(DAY_NIGHT.ambient.color,alpha);this.glow.clear();
    const hands=(this.scene.lightFuel?.handLights?.()??[]).map(h=>{const p=gridToWorld(h.x,h.y);return {x:p.x,y:p.y-30,radius:h.radius*DAY_NIGHT.pxPerTile,type:'torch'};});
    const lights=[...(this.scene.lightSources?.lights?.()??[]),...this.dayNight.houseWindows(),...hands,...(this.scene.fireViews?.lights?.()??[])],margin=200;
    // performance-1: the additive glow is transparent outside its brushes, so only their box is drawn (the same pixels;
    // without a GPU a full-screen additive blit cost ~4 ms a frame).
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    for(const l of lights){
      if(l.x<view.x-margin||l.x>view.right+margin||l.y<view.y-margin||l.y>view.bottom+margin)continue;
      const sx=(l.x-view.x)*zoom,sy=(l.y-view.y)*zoom,size=Math.max(24,l.radius*2.2*zoom)*(l.strength??1);
      this.brush.setDisplaySize(size,size*.8);this.dark.erase(this.brush,sx,sy);
      this.glowBrush.setDisplaySize(size*.9,size*.7).setAlpha(Math.min(1,alpha*1.4));this.glow.draw(this.glowBrush,sx,sy);
      x0=Math.min(x0,sx-size*.45);x1=Math.max(x1,sx+size*.45);y0=Math.min(y0,sy-size*.35);y1=Math.max(y1,sy+size*.35);
    }
    x0=Math.max(0,Math.floor(x0)-2);y0=Math.max(0,Math.floor(y0)-2);x1=Math.min(width,Math.ceil(x1)+2);y1=Math.min(height,Math.ceil(y1)+2);
    if(x1>x0&&y1>y0)this.glow.setCrop(x0,y0,x1-x0,y1-y0);else this.glow.setVisible(false);
    // Phaser 4 buffers drawing commands: render them into the textures.
    this.dark.render();this.glow.render();
  }
  destroy(){this.dark.destroy();this.glow.destroy();this.brush.destroy();this.glowBrush.destroy();}
}
