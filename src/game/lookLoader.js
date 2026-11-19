// Approved villager and soldier looks load on first use (moved out of HumanView so UI code can load a look – e.g.
// the Barracks training cards – without pulling in Phaser).
import { APPROVED_VILLAGER_ART,walkKey } from '../data/objects/approvedArt.js';
import { SOLDIER_ANIM_ART } from '../data/soldierAnimArt.js';
import { FISHER_WALK_ART } from '../data/fisherWalkArt.js';
import { assetURL } from '../systems/AssetManager.js';
const villagerArt=look=>APPROVED_VILLAGER_ART[look]??SOLDIER_ANIM_ART[look]??FISHER_WALK_ART[look]??null;
// Approved villager looks load per look on first use (8 directions each).
export const lookKey=(look,k)=>`villager-art:${look}:${k}`;
export function ensureLook(scene,look,ready){
  scene.__villagerLooks??=new Map();const state=scene.__villagerLooks.get(look);
  if(state==='ready')return true;if(state){state.add(ready);return false;}
  const art=villagerArt(look),waiting=new Set([ready]);scene.__villagerLooks.set(look,waiting);
  // g-vojaci-grafika: a look with a walk sheet loads only the sheet (its idle column is the standing pose), so the game
  // ships one file per look instead of nine (the published game may hold 512 files).
  if(art.walkSrc||art.walk){ // walk-only look (a data URL or the exported sheet)
    const done=()=>{scene.__villagerLooks.set(look,'ready');for(const fn of waiting)fn();};
    if(scene.textures.exists(walkKey(look))){done();return true;}
    scene.load.once(`filecomplete-spritesheet-${walkKey(look)}`,done);
    scene.load.spritesheet(walkKey(look),art.walkSrc??assetURL(`${art.base}.walk.png`,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'),{frameWidth:art.walk.frameWidth,frameHeight:art.walk.frameHeight});
    if(!scene.load.isLoading())scene.load.start();return false;
  }
  for(let k=0;k<8;k++)if(!scene.textures.exists(lookKey(look,k)))scene.load.image(lookKey(look,k),assetURL(`${art.base}.facing-${k}.png`,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));
  const w=art.walk;if(w&&!scene.textures.exists(walkKey(look)))scene.load.spritesheet(walkKey(look),assetURL(`${art.base}.walk.png`,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'),{frameWidth:w.frameWidth,frameHeight:w.frameHeight});
  scene.load.once('complete',()=>{if(![0,1,2,3,4,5,6,7].every(k=>scene.textures.exists(lookKey(look,k))))return;scene.__villagerLooks.set(look,'ready');for(const fn of waiting)fn();});
  if(!scene.load.isLoading())scene.load.start();return false;
}

