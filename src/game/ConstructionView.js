import { gridToWorld } from './isometric.js';
import { towerBase,buildingDepth,buildingDefinition } from './buildings.js';
import { constructionPhase } from '../data/construction.js';
import { DustEmitter,scaffoldStage } from './ConstructionDust.js';
import { APPROVED_SCAFFOLD_ART,TIMBER_SCAFFOLD_BUILDINGS } from '../data/objects/approvedArt.js';
import { assetURL } from '../systems/AssetManager.js';

// Approved scaffold images load on first use; open sites repaint when they arrive.
const scaffoldKey=look=>`scaffold-art:${look}`,liveViews=new Set();
function ensureScaffoldArt(scene){
  if(scene.__scaffoldArtRequested||!scene.load)return;scene.__scaffoldArtRequested=true;let queued=0;
  for(const [look,art]of Object.entries(APPROVED_SCAFFOLD_ART))if(!scene.textures.exists(scaffoldKey(look))){scene.load.image(scaffoldKey(look),assetURL(art.sprite,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));queued++;}
  if(!queued)return;
  scene.load.once('complete',()=>{for(const view of liveViews)if(view.scene===scene){view.signature=null;view.updateProgress(view.site);}});
  if(!scene.load.isLoading())scene.load.start();
}

export class ConstructionView {
  constructor(scene,site,inner){
    this.inner=inner;this.definition=buildingDefinition(site);this.base=towerBase(site);this.overlay=scene.add.graphics();this.bar=scene.add.graphics();
    this.scene=scene;this.dust=new DustEmitter(scene,site,{width:this.definition.width,height:this.definition.height,depth:buildingDepth(site)});
    this.scaffold=scene.add.image(this.base.x,this.base.y,'__DEFAULT').setVisible(false);liveViews.add(this);ensureScaffoldArt(scene);this.updateProgress(site);
  }
  updateProgress(site){
    const c=site.construction,phase=constructionPhase(site),signature=`${phase}:${Math.floor(c.progress*10)}`;
    if(this.lastWork!==undefined&&c.workDone>this.lastWork&&this.overlay.visible)this.dust.emit(this.scene.time?.now??0);this.lastWork=c.workDone;
    this.site=site;if(signature===this.signature)return;this.signature=signature;
    const stage=scaffoldStage(c),look=stage==='mid'&&TIMBER_SCAFFOLD_BUILDINGS.includes(this.definition.id)?'timber':stage,art=look?APPROVED_SCAFFOLD_ART[look]:null,useArt=!!art&&this.scene.textures.exists(scaffoldKey(look));
    this.inner.setAlpha(c.workDone===0?.4:useArt?(c.progress<=33?.12:c.progress<=66?.3:.62):c.progress<=33?.18:c.progress<=66?.38:.72);
    const scale=this.definition.width/2;
    if(useArt)this.scaffold.setTexture(scaffoldKey(look)).setOrigin(art.origin.x,art.origin.y).setScale(scale).setPosition(this.base.x,this.base.y).setDepth(buildingDepth(site)+.35).setVisible(this.overlay.visible);
    else this.scaffold.setVisible(false);
    const d=this.definition,base=this.base,depth=buildingDepth(site),point=(x,y,z=0)=>{const p=gridToWorld(x,y);return{x:p.x-base.x,y:p.y-base.y-z};},g=this.overlay.clear().setPosition(base.x,base.y).setDepth(depth+.35);
    const corners=[[site.x,site.y],[site.x+d.width,site.y],[site.x+d.width,site.y+d.height],[site.x,site.y+d.height]].map(([x,y])=>point(x,y));
    if(stage&&!useArt){
      const height=c.progress<=33?9:c.progress<=66?d.visualHeight*.4:d.visualHeight*.72;
      const [a,b,front,left]=corners;g.fillStyle(0xb0a58a,.85);g.fillPoints([left,front,{x:front.x,y:front.y-9},{x:left.x,y:left.y-9}],true);g.fillStyle(0x777f6b,.85);g.fillPoints([front,b,{x:b.x,y:b.y-9},{x:front.x,y:front.y-9}],true);
      g.lineStyle(3,0xa18b54,.95);for(const p of corners)g.lineBetween(p.x,p.y-4,p.x,p.y-height);
      if(c.progress>33){for(const [p,q]of [[left,front],[front,b],[a,left]]){g.lineBetween(p.x,p.y-height,q.x,q.y-height);g.lineBetween(p.x,p.y-height*.5,q.x,q.y-height*.5);g.lineBetween(p.x,p.y-5,q.x,q.y-height);}}
    }
    const bar=this.bar.clear().setPosition(base.x,base.y-Math.max(d.visualHeight,useArt?art.visualHeight*scale:0)-17).setDepth(depth+.6);bar.fillStyle(0x17251d,.95);bar.fillRoundedRect(-35,-6,70,11,3);bar.lineStyle(1,0xd1bb7c,.9);bar.strokeRoundedRect(-35,-6,70,11,3);bar.fillStyle(0xc1a359);bar.fillRect(-32,-3,64*c.progress/100,5);
  }
  paint(site,tint=null){this.inner.paint(site,tint);this.signature=null;this.updateProgress(site);}
  contains(x,y){return this.inner.contains(x,y);}
  inView(view){return this.inner.inView(view);}
  setVisible(value){this.inner.setVisible(value);this.overlay.setVisible(value);this.bar.setVisible(value);this.dust.setVisible(value);this.scaffold.setVisible(value&&this.scaffold.texture?.key!=='__DEFAULT'&&!!scaffoldStage(this.site?.construction));return this;}
  destroy(){liveViews.delete(this);this.inner.destroy();this.overlay.destroy();this.bar.destroy();this.dust.destroy();this.scaffold.destroy();}
}
