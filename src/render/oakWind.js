import { OAK_WIND } from '../data/objects/oakWind.js';
import { assetURL } from '../systems/AssetManager.js';
import { treeHash } from './treeSeasonTexture.js';

// m-duby-vitr (owner 15 Nov 2026): oaks move in the wind. The approved pictures stay; the sheets of scripts/oak-wind.py
// hold frames in which the trunk stays, the crown bends and the leaves flutter (frame 0 is the picture itself). Every
// tree has its own phase and a slightly different pace, so a forest never sways in step. Only trees on screen and with
// the camera close enough animate; far away or out of view a tree shows its still picture. A sheet loads the first
// time a tree of that look and season is close.
export const OAK_WIND_ZOOM=.7,OAK_WIND_MARGIN=220;
const sheetKey=name=>`oak-wind:${name}`,frameName=(view,f)=>`${view}:${f}`;
const state=new WeakMap();
function wind(scene){
  let w=state.get(scene);if(w)return w;
  w={trees:new Set(),loading:new Set()};state.set(scene,w);
  const tick=()=>update(scene,w);scene.events?.on?.('update',tick);scene.events?.once?.('shutdown',()=>{scene.events.off('update',tick);w.trees.clear();});
  return w;
}
// Adds the frames of a loaded sheet (rows = views, columns = frames).
function cut(scene,name){
  const s=OAK_WIND.sheets[name],tex=scene.textures.get(sheetKey(name));if(!tex||tex.has?.(frameName(s.views[0],0)))return;
  s.views.forEach((view,row)=>{for(let f=0;f<OAK_WIND.frames;f++)tex.add(frameName(view,f),0,f*s.frameWidth,row*s.frameHeight,s.frameWidth,s.frameHeight);});
}
export function windReady(scene,name){return !!OAK_WIND.sheets[name]&&scene.textures?.exists?.(sheetKey(name))&&scene.textures.get(sheetKey(name)).has(frameName(OAK_WIND.sheets[name].views[0],0));}
function load(scene,w,name){
  if(w.loading.has(name)||!scene.load||!OAK_WIND.sheets[name])return;w.loading.add(name);
  const key=sheetKey(name);if(scene.textures.exists(key)){cut(scene,name);return;}
  scene.load.image(key,assetURL(OAK_WIND.sheets[name].sprite,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));
  scene.load.once(`filecomplete-image-${key}`,()=>cut(scene,name));if(!scene.load.isLoading())scene.load.start();
}
export function trackOak(view){if(view?.scene)wind(view.scene).trees.add(view);}
export function untrackOak(view){if(view?.scene)state.get(view.scene)?.trees.delete(view);}
// The look `broad-summer-90` → sheet `broad-summer`, view 90.
export const windPart=look=>{const m=/^(young|broad|grand)-(spring|summer|autumn|winter)-(\d+)$/.exec(look??'');return m?{name:`${m[1]}-${m[2]}`,view:Number(m[3])}:null;};
// Frame of a tree at time `now` (ms): its own phase and pace from its tile.
export function windFrame(tile,now){
  const h=treeHash(tile),seed=(Math.imul((tile?.x??0)+101,2246822519)^Math.imul((tile?.y??0)+7,3266489917))>>>0;
  const pace=.85+(seed%31)/100,phase=((seed>>>8)%1000)/1000+h/64;
  return Math.floor(((now*pace/OAK_WIND.periodMs)+phase)*OAK_WIND.frames)%OAK_WIND.frames;
}
function update(scene,w){
  const cam=scene.cameras?.main;if(!cam||!w.trees.size)return;const close=cam.zoom>=OAK_WIND_ZOOM,v=cam.worldView,now=scene.time?.now??performance.now();
  for(const tree of w.trees){
    const part=windPart(tree.artLook),onScreen=close&&tree.art?.visible&&tree.visible!==false&&tree.x>v.x-OAK_WIND_MARGIN&&tree.x<v.right+OAK_WIND_MARGIN&&tree.y>v.y-OAK_WIND_MARGIN&&tree.y<v.bottom+OAK_WIND_MARGIN*2;
    if(!part||!onScreen){if(tree.windOn)tree.stopWind();continue;}
    if(!windReady(scene,part.name)){load(scene,w,part.name);continue;}
    tree.showWind(sheetKey(part.name),frameName(part.view,windFrame(tree.tile??tree.object,now)),OAK_WIND.sheets[part.name].origin);
  }
}
