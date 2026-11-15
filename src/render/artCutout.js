// A part of a loaded picture as its own texture (same size, only the pixels inside `polygon` kept), so one render can
// be drawn in layers: the whole picture on the ground and its tall parts again, sorted by depth among the people.
export function cutoutKey(scene,key,name,polygon){
  const out=`${key}:cut:${name}`,textures=scene.textures;if(textures.exists(out))return out;
  try{
    const image=textures.get(key).getSourceImage(),canvas=textures.createCanvas(out,image.width,image.height),ctx=canvas.getContext();
    ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(image,0,0);canvas.refresh();return out;
  }catch{return null;}
}
