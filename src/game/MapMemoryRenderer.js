import { gridToWorld } from './isometric.js';
import { buildingTiles } from './buildings.js';
import { ConstructionView } from './ConstructionView.js';
import { FOG_STYLE } from '../systems/FogOfWarSystem.js';
import { memoryTexture } from './memoryTexture.js';
import { footprintShown,applyFootprint } from './footprintHighlight.js';

export function memoryColor(color,brightness=FOG_STYLE.brightness){
  const r=(color>>>16)&255,g=(color>>>8)&255,b=color&255,luminance=.2126*r+.7152*g+.0722*b;
  const channel=value=>Math.round((luminance+(value-luminance)*FOG_STYLE.saturation)*brightness);
  return (channel(r)<<16)|(channel(g)<<8)|channel(b);
}
function parts(view,callback,seen=new Set()){
  if(!view||seen.has(view))return;seen.add(view);callback(view);
  for(const name of ['inner','container','body','back','front','rotor','footprint','floor','sprite','overlay','bar','lid'])parts(view[name],callback,seen);
  // Bod 37 (owner 14 Nov 2026): the Stone Wall keeps its art pieces and shadows in plain objects (`art`, `shadows`);
  // they were skipped, so remembered walls stayed fully lit next to dimmed Towers and Gates.
  for(const name of ['art','shadows']){const group=view[name];if(group&&typeof group==='object'&&!group.type&&!Array.isArray(group))for(const child of Object.values(group))parts(child,callback,seen);}
  for(const child of [...(view.list??[]),...(view.plants??[])])parts(child,callback,seen);
}
export const memoryParts=view=>{const out=[];parts(view,part=>out.push(part));return out;};
function frozenAppearance(scene,view,repaint,brightness=FOG_STYLE.brightness){
  parts(view,part=>{
    if(part.type==='Text')part.setColor('#4a4e48');
    if(part.type!=='Graphics')return;
    const fill=part.fillStyle,line=part.lineStyle;
    part.fillStyle=function(color,alpha){return fill.call(this,memoryColor(color,brightness),alpha);};
    part.lineStyle=function(width,color,alpha){return line.call(this,width,memoryColor(color,brightness),alpha);};
  });
  repaint?.();
  parts(view,part=>{
    if(!['Image','Sprite'].includes(part.type))return;
    part.anims?.stop();const key=memoryTexture(scene,part.texture,part.frame,brightness);
    if(key)part.setTexture(key);
  });
}
// Wall art that arrives or is repainted later (FortificationView.paintArt) is muted the same way.
function muteLater(scene,view,brightness){if(view&&'artShown' in view)view.afterPaint=()=>parts(view,part=>{if(!['Image','Sprite'].includes(part.type)||String(part.texture?.key).startsWith('memory-texture:'))return;const key=memoryTexture(scene,part.texture,part.frame,brightness);if(key)part.setTexture(key);});}

// These copies never enter resources, buildings, occupation or interaction maps.
export class MapMemoryRenderer {
  constructor(scene,memory){Object.assign(this,{scene,memory});this.views=new Map();}
  create(entry){
    const s=this.scene,b=this.memory.fog?.memoryBrightness??FOG_STYLE.brightness,d=s.objectRegistry.require(entry.type),point=gridToWorld(entry.x+entry.width/2,entry.y+entry.height/2);let view;
    if(entry.kind==='building'){
      const building={id:entry.key,type:entry.type,x:entry.x,y:entry.y,definition:d,tiles:buildingTiles(entry,d),...structuredClone(entry.visual)};
      view=s.assets.createView(d.id,{building,preview:false});
      view.setGrowth?.(entry.visual.stage??0);view.setSeason?.(entry.visual.season??'Spring');
      if(building.construction?.state!=='complete'&&building.construction)view=new ConstructionView(s,building,view);
      frozenAppearance(s,view,()=>view.paint(building),b);muteLater(s,view.inner??view,b);
    }else if(entry.kind==='stockpile'){
      view=s.legacyStockpiles.createMarker({id:entry.visual.id});frozenAppearance(s,view,()=>view.paint(),b);view.setPosition(point.x,point.y).setDepth(point.y+.12);
    }else{
      view=s.assets.createView(d.id,{...point,tile:{x:entry.x,y:entry.y},...(d.tree?{object:{natural:{stage:entry.visual.stage,...(entry.visual.grand?{grand:true}:{})}},season:entry.visual.season}:d.deposit?{object:{natural:{depleted:entry.visual.depleted}},look:entry.visual.look}:{})});
      frozenAppearance(s,view,()=>view.paint?.(),b);
      if(entry.kind==='chest'){view.setOpened?.(entry.visual.opened);if(view.lid&&entry.visual.lid)Object.assign(view.lid,entry.visual.lid);}
    }
    return view;
  }
  update(camera){
    const fog=this.memory.fog,needed=new Set();
    if(fog.enabled)for(const [key,entry]of this.memory.objects){
      // m-plynuly-prechod-dohledu: a building still fading in keeps its dark copy until it is fully lit.
      const lit=this.scene.sightFade?.get(key);if(fog.isInSightObject(entry)&&lit===undefined)continue;
      const d=this.scene.objectRegistry.require(entry.type),point=gridToWorld(entry.x+d.width/2,entry.y+d.height/2),padding=(d.width+d.height)*32;
      if(point.x+padding<camera.x||point.x-padding>camera.right||point.y+padding<camera.y||point.y-(d.visualHeight??64)-padding>camera.bottom)continue;
      needed.add(key);let record=this.views.get(key);
      if(record?.entry!==entry||record.brightness!==fog.memoryBrightness){record?.view.destroy();record={entry,brightness:fog.memoryBrightness,view:this.create(entry)};this.views.set(key,record);}
      record.view.setVisible(!(entry.kind==='building'&&this.scene.flatBuildings?.on));/* (84) */if(lit!==undefined){record.view.setAlpha?.(1-lit);record.faded=true;}else if(record.faded){record.view.setAlpha?.(1);record.faded=false;}
      // m-vytezeny-dul-ctverecky (63): a remembered finished building shows its footprint only while placing.
      if(entry.kind==='building')applyFootprint(record.view,footprintShown({complete:!entry.visual.construction||entry.visual.construction.state==='complete',buildMode:!!this.scene.buildMode}));
    }
    for(const [key,record]of this.views)if(!needed.has(key)){record.view.destroy();this.views.delete(key);}
  }
  destroy(){for(const record of this.views.values())record.view.destroy();this.views.clear();}
}
