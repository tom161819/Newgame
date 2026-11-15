import { TREE_WIND } from '../data/objects/treeWind.js';
import { assetURL } from '../systems/AssetManager.js';
import { treeHash } from './treeSeasonTexture.js';

// m-duby-vitr, m-smrky (owner 15 Nov 2026): the owner's season oaks and spruces come as sheets (scripts/tree-wind.py):
// rows = the four views, columns = wind frames, frame 0 = the approved picture. A tree shows frame 0 while it stands
// still and the other frames in the wind: the trunk stays, the crown bends, leaves and twigs flutter. Every tree has its
// own phase and a slightly different pace, so a forest never sways in step. Only trees on screen with the camera close
// enough move. A sheet loads the first time a tree of that species, look and season is drawn; until then the tree is
// drawn the old procedural way.
export const WIND_ZOOM=.7,WIND_MARGIN=220;
export const sheetKey=(species,name)=>`tree-sheet:${species}:${name}`;
export const frameName=(view,f)=>`${view}:${f}`;
const state=new WeakMap();
function trees(scene){
  let w=state.get(scene);if(w)return w;
  w={all:new Set(),live:new Set(),loading:new Set()};state.set(scene,w);
  const tick=()=>update(scene,w);scene.events?.on?.('update',tick);scene.events?.once?.('shutdown',()=>{scene.events.off('update',tick);w.all.clear();w.live.clear();});
  return w;
}
export const sheetOf=(species,name)=>TREE_WIND.sheets[species]?.[name]??null;
// Adds the frames of a loaded sheet.
function cut(scene,species,name){
  const s=sheetOf(species,name),tex=scene.textures.get(sheetKey(species,name));if(!s||!tex||tex.has?.(frameName(s.views[0],0)))return;
  s.views.forEach((view,row)=>{for(let f=0;f<TREE_WIND.frames;f++)tex.add(frameName(view,f),0,f*s.frameWidth,row*s.frameHeight,s.frameWidth,s.frameHeight);});
}
export function sheetReady(scene,species,name){const s=sheetOf(species,name),key=sheetKey(species,name);return !!s&&!!scene.textures?.exists?.(key)&&scene.textures.get(key).has(frameName(s.views[0],0));}
export function requestSheet(scene,species,name){
  const w=trees(scene),id=`${species}:${name}`,s=sheetOf(species,name);if(!s||w.loading.has(id)||!scene.load)return;w.loading.add(id);
  const key=sheetKey(species,name);if(scene.textures.exists(key)){cut(scene,species,name);return;}
  scene.load.image(key,assetURL(s.sprite,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));
  scene.load.once(`filecomplete-image-${key}`,()=>{cut(scene,species,name);for(const tree of w.all)if(tree.sheetWanted===id)tree.paint();});
  if(!scene.load.isLoading())scene.load.start();
}
// live: a tree in the world (moves in the wind); remembered trees under the fog only need their picture.
export function trackTree(view,live){const w=trees(view.scene);w.all.add(view);if(live)w.live.add(view);}
export function untrackTree(view){const w=view?.scene&&state.get(view.scene);if(w){w.all.delete(view);w.live.delete(view);}}
// Frame of a tree at time `now` (ms): its own phase and pace from its tile.
export function windFrame(tile,now){
  const h=treeHash(tile),seed=(Math.imul((tile?.x??0)+101,2246822519)^Math.imul((tile?.y??0)+7,3266489917))>>>0;
  const pace=.85+(seed%31)/100,phase=((seed>>>8)%1000)/1000+h/64;
  return Math.floor(((now*pace/TREE_WIND.periodMs)+phase)*TREE_WIND.frames)%TREE_WIND.frames;
}
function update(scene,w){
  const cam=scene.cameras?.main;if(!cam||!w.live.size)return;const close=cam.zoom>=WIND_ZOOM,v=cam.worldView,now=scene.time?.now??performance.now();
  for(const tree of w.live){
    const look=tree.sheetLook;if(!look)continue;
    const on=close&&tree.art?.visible&&tree.visible!==false&&tree.x>v.x-WIND_MARGIN&&tree.x<v.right+WIND_MARGIN&&tree.y>v.y-WIND_MARGIN&&tree.y<v.bottom+WIND_MARGIN*2;
    tree.showFrame(on?windFrame(tree.tile??tree.object,now):0);
  }
}
