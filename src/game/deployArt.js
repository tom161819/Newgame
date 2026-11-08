import { APPROVED_DEPLOY_ART as ART } from '../data/objects/approvedDeployArt.js';
import { assetURL } from '../systems/AssetManager.js';

// Plan m-nasadit-schvalenou-grafiku: loading and picking the approved art deployed with this update (wildlife,
// vehicles, caravans, children, night icons). Each texture loads once on first use; until it is in (or if it fails)
// the caller keeps its procedural drawing. Picks are seeded by ids, so nothing new is saved.
export function stableHash(text){let h=2166136261;text=String(text);for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function pick(list,seed){return list.length?list[stableHash(seed)%list.length]:null;}
// True once the texture exists; otherwise queues it (image, or a sprite sheet when `frame` is given) and returns false.
export function requestTexture(scene,key,src,frame=null){
  if(scene?.textures?.exists?.(key))return true;if(!scene?.load||!src)return false;
  scene.__deployArtRequested??=new Set();if(scene.__deployArtRequested.has(key))return false;scene.__deployArtRequested.add(key);
  const url=assetURL(src,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/');
  if(frame)scene.load.spritesheet(key,url,{frameWidth:frame.frameWidth,frameHeight:frame.frameHeight});else scene.load.image(key,url);
  if(!scene.load.isLoading())scene.load.start();return false;
}
export const imageKey=src=>`deploy-art:${src}`;
// Ready image key for an approved still ({src, origin}), or null while it loads / after it failed.
export function stillKey(scene,art){if(!art)return null;const key=imageKey(art.src);return requestTexture(scene,key,art.src)?key:null;}

// ---- Wild animals: one look per animal (seeded by species and id), poses of that look when it has them.
export function wildLook(species,id,art=ART.wild){const looks=Object.keys(art[species]?.looks??{});return pick(looks,`${species}:${id}`);}
export function wildArt(species,look,art=ART.wild){return art[species]?.looks?.[look]??null;}
// The pose a wild animal shows: attacking → attack (or run), a tamed horse → harness, a ridden horse → saddled, a hare
// standing still → sit; otherwise the plain look. A pose the look does not have falls back to the plain look.
export function wildPose(look,{attacking=false,moving=false,tamed=false,ridden=false}={}){
  const poses=look?.poses??{};
  if(ridden&&poses.saddled)return 'saddled';
  if(attacking)return poses.attack?'attack':poses.run?'run':null;
  if(tamed&&poses.harness)return 'harness';
  if(!moving&&poses.sit)return 'sit';
  return null;
}

// ---- Vehicles: the Horse Wagon and Wheelbarrow look follows the operator's cargo.
const WAGON_CARGO={stone:'tumbril-stone',iron_ore:'ore',iron:'ore',wheat:'hay',flour:'farm-sacks',apple:'farm-sacks'};
export function wagonVariant(cargo,vehicleId,art=ART.wagon){
  let v='farm-empty';
  if(cargo?.amount>0){v=cargo.resource==='wood'?(stableHash(`wagon:${vehicleId}`)%2?'timber':'farm-wood'):WAGON_CARGO[cargo.resource]??'covered';}
  return art[v]?v:art['farm-empty']?'farm-empty':null;
}
const BARROW_CARGO={stone:'stone',wood:'wood',iron_ore:'ore',iron:'ironbars',fish:'fish',meat:'meat',bread:'bread'};
export function barrowVariant(cargo,art=ART.barrow){const v=cargo?.amount>0?BARROW_CARGO[cargo.resource]??'mixed':'empty';return art[v]?v:art.empty?'empty':null;}

// ---- Merchant caravan: a style per caravan; unloading while trading, empty without goods, otherwise full.
export function caravanStyle(caravanId,art=ART.caravan){return pick(Object.keys(art),`caravan:${caravanId}`);}
export function caravanArt(caravanId,{trading=false,full=true}={},art=ART.caravan){
  const style=art[caravanStyle(caravanId,art)];if(!style)return null;
  return (trading&&style.unloading)||(!full&&!trading&&style.empty)||style.full;
}

// ---- Children: the look follows the child's sex and colour set; activities show the look's key frame.
const CHILD_POSE={tag:['tag','run'],hoop:['hoop'],ball:['kick'],swing:['swing'],snowball:['throw'],snowman:['snow'],hay:['hay']};
export function childLook(child,art=ART.children){const list=art.sexes?.[child?.sex]??[];const id=list[(child?.look??0)%Math.max(1,list.length)];return art.looks?.[id]?id:null;}
export function childPose(child,look,art=ART.children){
  const poses=art.looks?.[look]?.poses??{};if(child?.state==='fleeing')return poses.run?'run':null;
  if(child?.state!=='out'||!child.activity)return null;
  return (CHILD_POSE[child.activity.kind]??[]).find(p=>poses[p])??null;
}
// Children's game loops: the game a child plays maps to the loop of its look (tag → child-play-tag for the tunic boy,
// child-play-tag-girl for the braid girl; hoop, ball, swing, snowball, snowman and hay to their sheet). Null when the
// child plays nothing (or flees) or its look has no loop for the game: then the key frame / walk sheet stays.
export function childPlay(child,look,art=ART.children){
  if(child?.state!=='out'||!child.activity)return null;
  return art.looks?.[look]?.play?.[child.activity.kind]??null;
}
// Sheet frame of a loop for a facing row (0–7) after `playedMs` of play: the clip's frames in turn at the loop's fps.
export function childPlayFrame(play,row,playedMs){const f=play.frames?.length?play.frames:[0];return row*play.columns+f[Math.floor(playedMs*play.fps/1000)%f.length];}

// ---- Night icons: the round badge for a sign (thief, wolves, fire, no-torch, torch, pitch).
export function nightIcon(level,art=ART.nightIcons){return art[level]??null;}
// Event feed lines about the night get the matching badge (by the line's key).
const FEED_ICONS=[[/^(thief-caught|theft):/,'thief'],[/^wolves-near:/,'wolves'],[/^(fire|fire-warning|fire-help|burnt):/,'fire'],[/^lights-no-fuel-/,'no-torch']];
export function feedIcon(key){const hit=FEED_ICONS.find(([re])=>re.test(String(key)));return hit?nightIcon(hit[1]):null;}

// Screen-left facings mirror the art, which faces the viewer's right.
export const facesLeft=direction=>!!direction&&(direction.x-direction.y)<0;
export { ART as APPROVED_DEPLOY_ART };
