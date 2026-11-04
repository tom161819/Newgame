import { gridToWorld } from './isometric.js';
import { buildingTiles } from './buildings.js';
import { ConstructionView } from './ConstructionView.js';
import { FOG_STYLE } from '../systems/FogOfWarSystem.js';

export function memoryColor(color){
  const r=(color>>>16)&255,g=(color>>>8)&255,b=color&255,luminance=.2126*r+.7152*g+.0722*b;
  const channel=value=>Math.round((luminance+(value-luminance)*FOG_STYLE.saturation)*FOG_STYLE.brightness);
  return (channel(r)<<16)|(channel(g)<<8)|channel(b);
}
function parts(view,callback,seen=new Set()){
  if(!view||seen.has(view))return;seen.add(view);callback(view);
  for(const name of ['inner','container','body','back','front','footprint','floor','sprite','overlay','bar','lid'])parts(view[name],callback,seen);
  for(const child of [...(view.list??[]),...(view.plants??[])])parts(child,callback,seen);
}
function frozenAppearance(scene,view,repaint){
  parts(view,part=>{
    if(part.type==='Text')part.setColor('#4a4e48');
    if(part.type!=='Graphics')return;
    const fill=part.fillStyle,line=part.lineStyle;
    part.fillStyle=function(color,alpha){return fill.call(this,memoryColor(color),alpha);};
    part.lineStyle=function(width,color,alpha){return line.call(this,width,memoryColor(color),alpha);};
  });
  repaint?.();
  parts(view,part=>{
    if(!['Image','Sprite'].includes(part.type))return;
    part.anims?.stop();const frame=part.frame,key=`memory-texture:${part.texture.key}:${frame.name}`;
    if(!scene.textures.exists(key)){
      const texture=scene.textures.createCanvas(key,frame.cutWidth,frame.cutHeight),context=texture.getContext();
      context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${FOG_STYLE.brightness*100}%)`;
      context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,frame.cutWidth,frame.cutHeight);texture.refresh();
    }
    part.setTexture(key);
  });
}

// These copies never enter resources, buildings, occupation or interaction maps.
export class MapMemoryRenderer {
  constructor(scene,memory){Object.assign(this,{scene,memory});this.views=new Map();}
  create(entry){
    const s=this.scene,d=s.objectRegistry.require(entry.type),point=gridToWorld(entry.x+entry.width/2,entry.y+entry.height/2);let view;
    if(entry.kind==='building'){
      const building={id:entry.key,type:entry.type,x:entry.x,y:entry.y,definition:d,tiles:buildingTiles(entry,d),...structuredClone(entry.visual)};
      view=s.assets.createView(d.id,{building,preview:false});
      view.setGrowth?.(entry.visual.stage??0);view.setSeason?.(entry.visual.season??'Spring');
      if(building.construction?.state!=='complete'&&building.construction)view=new ConstructionView(s,building,view);
      frozenAppearance(s,view,()=>view.paint(building));
    }else if(entry.kind==='stockpile'){
      view=s.legacyStockpiles.createMarker({id:entry.visual.id});frozenAppearance(s,view,()=>view.paint());view.setPosition(point.x,point.y).setDepth(point.y+.12);
    }else{
      view=s.assets.createView(d.id,{...point,tile:{x:entry.x,y:entry.y},...(d.tree?{object:{natural:{stage:entry.visual.stage}},season:entry.visual.season}:d.deposit?{object:{natural:{depleted:entry.visual.depleted}}}:{})});
      frozenAppearance(s,view,()=>view.paint?.());
      if(entry.kind==='chest'){view.setOpened?.(entry.visual.opened);if(view.lid&&entry.visual.lid)Object.assign(view.lid,entry.visual.lid);}
    }
    return view;
  }
  update(camera){
    const fog=this.memory.fog,needed=new Set();
    if(fog.enabled)for(const [key,entry]of this.memory.objects){
      if(fog.isInSightObject(entry))continue;
      const d=this.scene.objectRegistry.require(entry.type),point=gridToWorld(entry.x+d.width/2,entry.y+d.height/2),padding=(d.width+d.height)*32;
      if(point.x+padding<camera.x||point.x-padding>camera.right||point.y+padding<camera.y||point.y-(d.visualHeight??64)-padding>camera.bottom)continue;
      needed.add(key);let record=this.views.get(key);
      if(record?.entry!==entry){record?.view.destroy();record={entry,view:this.create(entry)};this.views.set(key,record);}
      record.view.setVisible(true);
    }
    for(const [key,record]of this.views)if(!needed.has(key)){record.view.destroy();this.views.delete(key);}
  }
  destroy(){for(const record of this.views.values())record.view.destroy();this.views.clear();}
}
