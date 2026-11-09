import { NATURE_ATLAS } from '../data/natureArt.js';
import { requestTexture,stableHash,pick } from './deployArt.js';
import { memoryTexture } from './memoryTexture.js';

// Plan g-nasadit-prirodu: the approved Studio nature art (deposits, rock obstacles, shrubs, orchard trees and wheat
// field tiles) in one atlas. The atlas loads once; until it is in (or if it fails) every caller keeps its procedural
// drawing and is called back when it arrives. Looks are picked from ids and tiles, so nothing new is saved.
export const NATURE_KEY='nature-atlas';
export const natureFrame=variant=>NATURE_ATLAS.frames[variant]??null;

// True once the atlas and its frames are ready; otherwise queues the atlas and remembers `onReady` (called once).
export function natureReady(scene,onReady=null){
  const textures=scene?.textures;if(!textures)return false;
  if(textures.exists(NATURE_KEY)){addFrames(textures.get(NATURE_KEY));return true;}
  if(onReady){(scene.__natureWaiting??=[]).push(onReady);}
  if(!scene.__natureListening&&scene.load?.once){
    scene.__natureListening=true;
    scene.load.once(`filecomplete-image-${NATURE_KEY}`,()=>{
      addFrames(textures.get(NATURE_KEY));const waiting=scene.__natureWaiting??[];scene.__natureWaiting=[];
      for(const callback of waiting){try{callback();}catch(error){console.warn('nature art',error);}}
    });
  }
  requestTexture(scene,NATURE_KEY,NATURE_ATLAS.src);return false;
}
function addFrames(texture){
  if(!texture||texture.__natureFrames)return;texture.__natureFrames=true;
  for(const [name,f] of Object.entries(NATURE_ATLAS.frames))if(!texture.has(name))texture.add(name,0,f.x,f.y,f.w,f.h);
}
// Shows a frame on an image (normal or remembered look). Returns false when the atlas or the frame is not there.
export function showNature(scene,image,variant,{remembered=false,brightness}={}){
  const frame=natureFrame(variant);if(!frame||!natureReady(scene))return false;
  if(remembered){
    const texture=scene.textures.get(NATURE_KEY),key=memoryTexture(scene,texture,texture.get(variant),brightness);
    if(key){if(image.texture?.key!==key)image.setTexture(key);}else image.setTexture(NATURE_KEY,variant);
  }else if(image.texture?.key!==NATURE_KEY||image.frame?.name!==variant)image.setTexture(NATURE_KEY,variant);
  image.setOrigin(frame.origin.x,frame.origin.y);return true;
}
const has=variant=>!!natureFrame(variant);
const first=list=>list.find(has)??null;

// ---- Stone and iron deposits (2 × 2): the medium pile while rich, a smaller one when nearly mined out, a few
// stones once empty; snow-covered piles in winter. Each deposit keeps one rock (granite or mossy granite).
// velke-prirodni-objekty: a large (3 × 3) deposit shows the large pile while more than two thirds are left (only the
// approved granite and red looks exist), then the same medium and small piles as a 2 × 2 deposit.
export function depositLook({type,id,remaining=1,max=1,depleted=false,season='Spring'}){
  const iron=type==='iron_deposit'||type==='iron_deposit_large',share=max>0?remaining/max:1,winter=season==='Winter';
  const kind=iron?'iron':'stone',rock=iron?'red':pick(['granite','mossy'].filter(r=>has(`stone-deposit-medium-${r}-5`)),`${type}:${id}`)??'granite';
  const level=depleted||remaining<=0?'empty':share<=1/3?'low':share<=2/3?'mid':'full';
  if(String(type).endsWith('_large')&&level==='full'){const large=first(winter?[`${kind}-deposit-large-${iron?'red':'granite'}-winter`]:[`${kind}-deposit-large-${iron?'red':'granite'}-7`]);if(large)return large;}
  if(winter)return first(level==='full'||level==='mid'?[`${kind}-deposit-medium-${rock==='mossy'?'granite':rock}-winter`]:[`${kind}-deposit-small-${rock==='mossy'?'granite':rock}-winter`]);
  if(level==='full')return first([`${kind}-deposit-medium-${rock}-5`]);
  if(level==='mid')return first([`${kind}-deposit-medium-${rock}-stage1`,`${kind}-deposit-medium-${rock}-5`]);
  if(level==='low')return first([`${kind}-deposit-small-${rock}-8`,`${kind}-deposit-small-${rock}-3`]);
  return first([`${kind}-deposit-small-${rock}-3`]);
}

// ---- Rock outcrops (1 × 1 obstacles of the terrain): one of the rock looks per tile, snow in winter.
const OUTCROPS=['rock-obstacles-small-boulder-1','rock-obstacles-small-boulder-2','rock-obstacles-small-boulders','rock-obstacles-small-bush'];
export function outcropLook(x,y,season='Spring'){
  if(season==='Winter'&&has('rock-obstacles-small-boulder-winter'))return 'rock-obstacles-small-boulder-winter';
  return pick(OUTCROPS.filter(has),`outcrop:${x},${y}`);
}

// ---- Bushes: the approved shrub species replace the meadow, berry and flowering bushes (the desert scrub stays);
// three summer shapes, and one look per species in spring, autumn and winter.
export const BUSH_SPECIES=Object.freeze({bush_meadow:['hazel','juniper'],bush_berry:['rosehip','bramble'],bush_flowering:['heather']});
export function bushLook(type,x,y,season='Spring'){
  const species=pick((BUSH_SPECIES[type]??[]).filter(s=>has(`shrubs-${s}-1`)||has(`shrubs-seasons-${s}-spring`)),`bush:${x},${y}`);if(!species)return null;
  const seasonal=`shrubs-seasons-${species}-${String(season).toLowerCase()}`;
  if(season!=='Summer'&&has(seasonal))return seasonal;
  return pick([1,2,3].map(n=>`shrubs-${species}-${n}`).filter(has),`bush-shape:${x},${y}`)??first([seasonal]);
}

// ---- Crop plots, per tile: wheat sown → sprouts → green → ripe (two wind frames spread over the tiles), the
// orchard tree after the harvest → blossom → green fruit → ripe apples; winter looks for both.
export function cropLook(type,stage,season,tile){
  const seed=`${tile?.x},${tile?.y}`,odd=stableHash(seed)&1;
  if(type==='wheat_field'){
    if(season==='Winter')return first(['wheat-field-tile-winter']);
    return first([['wheat-field-tile-sown'],['wheat-field-tile-sprouts'],['wheat-field-tile-green'],[odd?'wheat-field-tile-ripe2':'wheat-field-tile-ripe','wheat-field-tile-ripe']][Math.max(0,Math.min(3,stage))]);
  }
  if(type==='orchard'){
    const look=season==='Winter'?'winter':['harvested','blossom','green','fruit'][Math.max(0,Math.min(3,stage))];
    return first([`orchard-tree-${look}-${odd?5:2}`,`orchard-tree-${look}-2`]);
  }
  return null;
}

// ---- velke-prirodni-objekty: thickets (2 × 1, 2 × 2, 3 × 2) and rock groups (2 × 2 obstacle, 4 × 2 ridge).
// A thicket is hazel, or bramble when at least half its bushes are berry bushes, in spring and summer; it has one
// autumn and one winter look. `bushTypes`: the bush type ids of its tiles.
export function thicketLook({w,h},bushTypes=[],season='Spring'){
  const size=`thicket-${w}x${h}`;
  if(season==='Winter'||season==='Autumn')return first([`${size}-${season.toLowerCase()}`,`${size}-hazel`]);
  const berries=bushTypes.filter(type=>type==='bush_berry').length;
  return first(berries*2>=bushTypes.length&&berries>0?[`${size}-bramble`,`${size}-hazel`]:[`${size}-hazel`,`${size}-bramble`]);
}
const ROCK_GROUP_LOOKS={'2x2':{art:['rock-obstacles-medium-outcrop-1','rock-obstacles-medium-outcrop-2','rock-obstacles-medium-boulders','rock-obstacles-medium-bush'],winter:'rock-obstacles-medium-outcrop-winter'},
  '4x2':{art:['rock-ridge-granite','rock-ridge-slate'],winter:'rock-ridge-winter'}};
export function rockGroupLook({x,y,w,h},season='Spring'){
  const looks=ROCK_GROUP_LOOKS[`${w}x${h}`];if(!looks)return null;
  if(season==='Winter'&&has(looks.winter))return looks.winter;
  return pick(looks.art.filter(has),`rock-group:${x},${y}`);
}
