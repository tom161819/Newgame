import { APPROVED_DEPLOY_ART } from '../data/objects/approvedDeployArt.js';
import { FACING_INDEX } from '../data/objects/approvedArt.js';
import { directionName } from './directions.js';
import { isWaterGround } from '../data/worldTerrain.js';
import { requestTexture } from './deployArt.js';

// Plan m-animace-rybar: the approved fishing loop (art/sprites/fishing/fishing-<male|female>-loop.v1.anim.png, rows =
// facing 0–7 as in the walk sheets, columns = the frames of the clips in meta.anim.clips, 5 fps). A Fisher at his spot
// casts on arrival, sits waiting (sit-idle) with a twitch of the rod every 4–10 s (random, seeded by the resident),
// and on each catch (the moment FishingSystem adds a fish) plays bite → reel → store and casts again. The animation
// only follows the fishing: it never changes how fast fish are caught. Nothing is saved.
export const FISHING_ART=APPROVED_DEPLOY_ART.fishing;
export const TWITCH_SECONDS=Object.freeze([4,10]);
const mulberry=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export function residentSeed(worker){const text=String(worker?.identity?JSON.stringify(worker.identity):worker?.id??0);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

// The catch sequence: bite, reel (as often as in the approved loop), store, then a new cast.
export function catchSequence(art){const reels=Math.max(1,(art?.loop??[]).filter(c=>c==='reel').length||1);return ['bite',...Array(reels).fill('reel'),'store','cast'];}

export class FishingAnimator {
  constructor(art,seed=0){this.art=art;this.random=mulberry(seed);this.reset();}
  reset(){this.active=false;this.queue=[];this.clip=null;this.t=0;this.waitMs=0;this.caught=0;this.nextTwitch=0;}
  rollTwitch(){const [a,b]=TWITCH_SECONDS;this.nextTwitch=(a+this.random()*(b-a))*1000;this.waitMs=0;}
  clipMs(clip){return (this.art.clips[clip]?.length??1)*1000/this.art.fps;}
  start(list){this.queue=[...list];this.clip=this.queue.shift();this.t=0;}
  // info: {caught} while the Fisher fishes at his spot, null otherwise. Returns the clip and its column for this frame.
  update(deltaMs,info){
    if(!info){this.reset();return null;}
    if(!this.active){this.active=true;this.caught=info.caught;this.start(['cast']);this.rollTwitch();}
    if(info.caught<this.caught)this.caught=info.caught;
    if(info.caught>this.caught){this.caught=info.caught;this.start(catchSequence(this.art));}
    this.t+=deltaMs;
    while(this.clip&&this.clip!=='sit-idle'&&this.t>=this.clipMs(this.clip)){this.t-=this.clipMs(this.clip);this.clip=this.queue.shift()??'sit-idle';if(this.clip==='sit-idle')this.rollTwitch();}
    if(this.clip==='sit-idle'){this.waitMs+=deltaMs;if(this.waitMs>=this.nextTwitch){this.start(['twitch']);this.t=0;}}
    const frames=this.art.clips[this.clip]??[0],step=Math.floor(this.t*this.art.fps/1000);
    const index=this.clip==='sit-idle'?step%frames.length:Math.min(frames.length-1,step);
    return {clip:this.clip,column:frames[index]};
  }
}
// Sheet frame for a facing (0–7) and column.
export const fishingFrame=(art,facing,column)=>facing*art.columns+column;
// Facing towards the water around the tile (all eight neighbours), or null when no water touches it.
export function waterFacing(ground,tile){
  let x=0,y=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;if(isWaterGround(ground?.[tile.y+dy]?.[tile.x+dx])){const w=dx&&dy?.7:1;x+=dx*w;y+=dy*w;}}
  const name=directionName({x,y});return name?FACING_INDEX[name]:null;
}
// What the view needs from a Fisher: null unless he fishes at his spot (arrived, not walking).
export function fishingInfo(worker,scene){
  const task=worker?.workTask;if(task?.kind!=='fish'||worker.workState!=='Working'||worker.walking||worker.nextTile||worker.path?.length)return null;
  if(Math.floor(worker.position?.x??-1)!==task.goal.x||Math.floor(worker.position?.y??-1)!==task.goal.y)return null;
  return {caught:task.caught,facing:waterFacing(scene?.groundGrid,task.goal)};
}
// The loaded sheet for a sex ({art, key}), or null while it loads, after it failed or without approved art: then the
// Fisher keeps today's look. The first call queues the sheet like the walk sheets.
export function fishingSheet(scene,sex,art=FISHING_ART){const a=art?.[sex];if(!a)return null;const key=`fishing-anim:${sex}`;return requestTexture(scene,key,a.sheet,a)?{art:a,key}:null;}
