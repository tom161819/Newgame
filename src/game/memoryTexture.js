import { FOG_STYLE } from '../systems/FogOfWarSystem.js';

// One muted copy of a texture frame per Fog of War memory brightness. A canvas filter, not a tint:
// the Canvas renderer ignores tints, so remembered sprites stayed fully lit there (#126).
export function memoryTexture(scene,texture,frame,brightness=FOG_STYLE.brightness){
  const key=`memory-texture:${brightness}:${texture.key}:${frame.name}`;
  if(!scene.textures.exists(key)){
    const image=frame.source.image;if(!image||image.complete===false||!frame.cutWidth||!frame.cutHeight)return null;
    const copy=scene.textures.createCanvas(key,frame.cutWidth,frame.cutHeight),context=copy.getContext();
    context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${brightness*100}%)`;
    context.drawImage(image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,frame.cutWidth,frame.cutHeight);copy.refresh();
  }
  return key;
}
