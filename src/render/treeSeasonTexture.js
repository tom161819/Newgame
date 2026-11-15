// Spring and autumn made from a summer picture at run time: only the leaves (green hues) change colour, trunk and
// shadow stay. Used by the Village Green's tree (the oaks have the owner's season renders since 15 Nov 2026).
// `tone` 0/1 gives two autumn colours so a forest is not one flat orange.
const clamp=v=>v<0?0:v>1?1:v;
function toHsv(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return [h,max?d/max:0,max/255];}
function toRgb(h,s,v){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];}
export const isLeaf=(h,s)=>h>=55&&h<=175&&s>=.12;
// Recolours RGBA bytes in place and returns them.
export function recolourLeaves(data,season,tone=0){
  if(season!=='Spring'&&season!=='Autumn')return data;
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]===0)continue;const [h,s,v]=toHsv(data[i],data[i+1],data[i+2]);if(!isLeaf(h,s))continue;
    const [r,g,b]=season==='Spring'?toRgb(Math.max(55,h-10),clamp(s*1.08),clamp(v*1.1+.02)):toRgb((tone?38:24)+(h-55)*.12,clamp(s*(tone?1.2:1.3)+.05),clamp(v*(tone?1.22:1.1)+.02));
    data[i]=r;data[i+1]=g;data[i+2]=b;
  }
  return data;
}
// The texture key of `key` in a season; made on first use. Summer (and anything unknown) is the render itself.
export function seasonTextureKey(scene,key,season,tone=0){
  if(season!=='Spring'&&season!=='Autumn')return key;
  const name=`${key}:${season}${season==='Autumn'?tone:''}`,textures=scene.textures;if(textures.exists(name))return name;
  try{
    const image=textures.get(key).getSourceImage(),canvas=textures.createCanvas(name,image.width,image.height),ctx=canvas.getContext();
    ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height);recolourLeaves(pixels.data,season,tone);ctx.putImageData(pixels,0,0);canvas.refresh();return name;
  }catch{return key;}
}
const OAK_VIEWS=Object.freeze([0,90,180,270]);
export const treeHash=tile=>((Math.imul((tile?.x??0)+17,374761393)^Math.imul((tile?.y??0)+29,668265263))>>>0)%64;
// The oak's look: young (stage 2), broad (grown, one tile) or grand (2 × 2), in its season (the owner's season renders,
// 15 Nov 2026) and one of four views.
export function oakLook(natural,season,hash=0){
  const s=['Spring','Summer','Autumn','Winter'].includes(season)?season.toLowerCase():'summer';
  return `${natural.stage===2?'young':natural.grand?'grand':'broad'}-${s}-${OAK_VIEWS[hash%4]}`;
}
