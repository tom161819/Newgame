// The standing picture of a soldier class or a look (facing the viewer), cut from the loaded walk sheet – the same
// picture the selection bar shows over the selected units. Owner 19 Nov 2026: the Barracks training cards use it too.
import { APPROVED_VILLAGER_ART,walkKey,militaryLook } from '../data/objects/approvedArt.js';
import { SOLDIER_ANIM_ART } from '../data/soldierAnimArt.js';
import { FISHER_WALK_ART } from '../data/fisherWalkArt.js';
import { ensureLook } from '../game/lookLoader.js';

export const lookArt=look=>APPROVED_VILLAGER_ART[look]??SOLDIER_ANIM_ART[look]??FISHER_WALK_ART[look]??null;
// A kind without a picture yet (catapult, wagon, the King) shows its emoji.
export const KIND_ICONS=Object.freeze({king:'👑','soldier:soldier':'🛡️','soldier:swordsman':'⚔️','soldier:archer':'🏹','soldier:knight':'🛡️','soldier:light_cavalry':'🐎','soldier:catapult':'🪨','soldier:military_wagon':'🛒','soldier:halberdier':'🔱','soldier:royal_archer':'🏹','soldier:crossbowman':'🎯','soldier:recruit':'🪖',hauler:'📦',builder:'🔨',woodcutter:'🪓',miner:'⛏️',hunter:'🦌',fisher:'🎣',farmer:'🌾',idle:'💤'});

// A data URL of the look's standing frame (W × H, feet at the bottom), or null while its sheet is not loaded.
export function lookPicture(scene,look,W=36,H=50){
  const art=look?lookArt(look):null,key=look?walkKey(look):null;
  if(!art?.walk||!scene?.textures?.exists?.(key))return null;const cache=scene.__lookPictures??=new Map(),id=`${look}:${W}x${H}`;if(cache.has(id))return cache.get(id);
  try{const frame=scene.textures.getFrame(key,0),src=frame?.source?.image;if(!src)return null;const ax=Math.round(art.walk.origin.x*art.walk.frameWidth),ay=Math.round(art.walk.origin.y*art.walk.frameHeight);
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
    const z=1/(art.walk.scale??1);ctx.imageSmoothingEnabled=z>1;ctx.drawImage(src,frame.cutX+ax-W*z/2,frame.cutY+ay-(H-3)*z,W*z,H*z,0,0,W,H);
    const url=canvas.toDataURL();cache.set(id,url);return url;}catch{return null;}
}
// The picture of a unit class; when its sheet still loads, `ready` is called once it is there.
export function unitTypePicture(scene,type,ready){
  const look=militaryLook(type,'male','');if(!look||!lookArt(look)?.walk)return null;
  if(!ensureLook(scene,look,()=>ready?.(lookPicture(scene,look))))return null;return lookPicture(scene,look);
}

// What a soldier is doing, as an icon (its text on hover): patrol, guard, walls (wall walk and towers), hunting a
// wolf, away with the party (expedition).
export const ORDER_ICONS=Object.freeze({patrol:'👣',guard:'🛡️',walls:'🏰',hunt:'🐺',away:'🧭'});
