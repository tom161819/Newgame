import { buildingHP } from './buildingHealth.js';

// Owner 18 Nov 2026 ("udělej vizualizaci pro hradby, jak se postupně bourají, když mají míň HP"): a wall, Tower or Gate
// shows how badly it is hit. Three stages by the share of hit points left; the look is made from the building's own
// (approved) picture by code – stones break off the top in a jagged line, cracks run down, bricks fall out – so no new
// art is needed and a repaired wall is whole again. Provisional until the Studio has drawn damage stages.
export const DAMAGE_STAGES=Object.freeze([.75,.5,.25]);
export function damageStage(building){
  const state=buildingHP(building);if(!state||state.hp>=state.max)return 0;const share=state.hp/state.max;
  return share<DAMAGE_STAGES[2]?3:share<DAMAGE_STAGES[1]?2:share<DAMAGE_STAGES[0]?1:0;
}
export const DAMAGE_VARIANTS=3;
const rng=seed=>{let a=(seed>>>0)||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const hash=text=>{let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
// How deep the top is broken off (share of the picture's height) and how much of its width, per stage.
const CHIP=Object.freeze([null,{depth:[.04,.1],cover:.35,breach:0},{depth:[.08,.22],cover:.8,breach:.22},{depth:[.2,.4],cover:1,breach:.45}]);
// Works on RGBA pixels in place. `chip` false keeps the outline (a Tower or a Gate has layers that must still fit).
export function damagePixels(data,width,height,stage,seed=1,{chip=true}={}){
  if(!(stage>0))return data;const random=rng(hash(`${seed}:${stage}`)),at=(x,y)=>(y*width+x)*4,solid=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&data[at(x,y)+3]>40;
  const top=new Int32Array(width).fill(-1),bottom=new Int32Array(width).fill(-1);let first=height,last=0;
  for(let x=0;x<width;x++)for(let y=0;y<height;y++)if(solid(x,y)){if(top[x]<0)top[x]=y;bottom[x]=y;}
  for(let x=0;x<width;x++)if(top[x]>=0){first=Math.min(first,top[x]);last=Math.max(last,bottom[x]);}
  const tall=Math.max(1,last-first),darken=(x,y,k)=>{if(!solid(x,y))return;const i=at(x,y);data[i]*=k;data[i+1]*=k;data[i+2]*=k;};
  if(chip){
    // The wall stands in an isometric picture: a column cut off at the top would show the ground through it. Instead
    // the wall is lowered in stone-wide steps – in every step the top `cap` (the walk on top) slides down over the
    // face under it, so each step is a shorter, still solid piece of wall; one or two steps are breached deep.
    const rule=CHIP[stage],source=data.slice(),cap=Math.round(Math.min(34,tall*.34)),drop=new Int32Array(width);
    const breachAt=Math.floor(first>=0?width*(.25+random()*.5):0),breachWide=width*(.14+random()*.1);let x=0,previous=0;
    while(x<width){const step=7+Math.floor(random()*8),on=random()<rule.cover;let depth=on?(rule.depth[0]+random()*(rule.depth[1]-rule.depth[0]))*tall:0;
      const near=Math.max(0,1-Math.abs(x+step/2-breachAt)/breachWide);depth+=near*rule.breach*tall*(.7+random()*.3);
      // Neighbouring steps differ, but not by the whole wall (it crumbles, it is not sawn).
      depth=Math.max(0,Math.min(depth,previous+tall*.3));previous=depth;for(let i=x;i<Math.min(width,x+step);i++)drop[i]=Math.round(depth);x+=step;}
    {const room=i=>top[i]<0?0:Math.max(0,bottom[i]-top[i]-10),body=[];for(let i=0;i<width;i++){drop[i]=Math.min(drop[i],room(i));if(room(i)>8)body.push(i);}
      /* at least one stone is always gone */if(body.length&&!body.some(i=>drop[i]>0)){const from=Math.floor(body.length*(.2+random()*.5)),d=Math.round((rule.depth[0]+rule.depth[1])/2*tall);for(let k=from;k<Math.min(body.length,from+10);k++)drop[body[k]]=Math.min(d,room(body[k]));}}
    // No thin needles: a piece under six pixels wide standing higher than both its neighbours comes down with them.
    for(let x=0;x<width;){let end=x;while(end<width&&drop[end]===drop[x])end++;const left=x>0&&top[x-1]>=0?drop[x-1]:Infinity,right=end<width&&top[end]>=0?drop[end]:Infinity,low=Math.min(left,right);
      if(end-x<6&&low!==Infinity&&left>drop[x]&&right>drop[x])for(let i=x;i<end;i++)drop[i]=Math.min(low,Math.max(0,top[i]<0?0:bottom[i]-top[i]-10));x=end;}
    for(let x=0;x<width;x++){const d=drop[x];if(top[x]<0||d<1){drop[x]=0;continue;}
      for(let y=top[x];y<top[x]+d;y++)data[at(x,y)+3]=0;
      for(let y=top[x]+d;y<Math.min(bottom[x]+1,top[x]+d+cap);y++){const i=at(x,y),j=at(x,y-d);data[i]=source[j];data[i+1]=source[j+1];data[i+2]=source[j+2];data[i+3]=Math.max(source[j+3],source[i+3]);}
      // Small chips on the new top edge.
      if(random()<.35){const n=1+Math.floor(random()*3);for(let y=top[x]+d;y<top[x]+d+n;y++)data[at(x,y)+3]=0;}}
    // The side of a higher step beside a lower one is in shadow.
    for(let x=1;x<width;x++){if(drop[x]===drop[x-1]||top[x]<0||top[x-1]<0)continue;const low=drop[x]>drop[x-1]?x:x-1,high=low===x?x-1:x;
      for(let y=top[high]+drop[high];y<top[low]+drop[low]+2;y++){darken(high,y,.5);darken(high+(high<low?-1:1),y,.75);}}
  }
  // Cracks: dark lines wandering down from the top, more and longer with every stage.
  for(let n=0;n<stage*2+1;n++){let x=Math.floor(width*(.1+random()*.8)),y=-1;for(let yy=0;yy<height;yy++)if(solid(x,yy)){y=yy;break;}if(y<0)continue;
    const length=tall*(.15+random()*.2*stage);for(let i=0;i<length;i++){darken(x,y,.35);if(stage>1)darken(x+1,y,.6);y++;if(random()<.45)x+=random()<.5?-1:1;if(!solid(x,y))break;}}
  // Bricks fallen out of the face.
  for(let n=0;n<(stage-1)*3;n++){const cx=Math.floor(width*(.1+random()*.8)),cy=Math.floor(first+tall*(.25+random()*.6)),w=3+Math.floor(random()*4),h=2+Math.floor(random()*3);
    for(let y=cy;y<cy+h;y++)for(let x=cx;x<cx+w;x++)darken(x,y,.4);}
  if(stage===3)for(let y=0;y<height;y++)for(let x=0;x<width;x++)darken(x,y,.9);
  return data;
}
// A Phaser texture of `key` at this damage stage (made once and kept); the clean key at stage 0 or without a canvas.
export function damagedTexture(scene,key,stage,seed=0,options={}){
  if(!(stage>0)||!scene?.textures?.exists?.(key)||!scene.textures.createCanvas)return key;
  const variant=Math.abs(seed|0)%DAMAGE_VARIANTS,name=`${key}:damage${stage}:${variant}${options.chip===false?':whole':''}`;if(scene.textures.exists(name))return name;
  try{
    const source=scene.textures.get(key).getSourceImage(),w=source.width,h=source.height,canvas=scene.textures.createCanvas(name,w,h),context=canvas.getContext();
    context.drawImage(source,0,0);const image=context.getImageData(0,0,w,h);damagePixels(image.data,w,h,stage,`${key}:${variant}`,options);context.putImageData(image,0,0);canvas.refresh();return name;
  }catch(error){console.warn('damage look',error);return key;}
}
// Fallen stones at the foot of a damaged building: [{x,y,w,h,shade}] around the ground outline `corners` (relative points).
export function rubble(corners,stage,seed=0){
  if(!(stage>0))return [];const random=rng(hash(`rubble:${seed}:${stage}`)),out=[],count=stage*6+2,n=corners.length;
  for(let i=0;i<count;i++){const k=Math.floor(random()*n),a=corners[k],b=corners[(k+1)%n],t=random(),push=2+random()*(4+stage*3);
    const mx=(corners[0].x+corners[2%n].x)/2,my=(corners[0].y+corners[2%n].y)/2,px=a.x+(b.x-a.x)*t,py=a.y+(b.y-a.y)*t,dx=px-mx,dy=py-my,d=Math.hypot(dx,dy)||1;
    out.push({x:px+dx/d*push,y:py+dy/d*push*.6,w:1.5+random()*(1.5+stage*.7),h:1.2+random()*1.4,shade:random()});}
  return out.sort((p,q)=>p.y-q.y);
}
