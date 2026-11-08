import { APPROVED_ANIMAL_ART } from '../data/objects/approvedAnimalArt.js';
import { FACING_INDEX, walkFrame } from '../data/objects/approvedArt.js';
import { assetURL } from '../systems/AssetManager.js';
import { MOVEMENT_SPEED_SCALE } from '../data/movement.js';

// Plan m-zvirata-nahodny-vzhled (owner rule 7 Nov 2026): where several looks of an animal are approved, every animal
// gets one of them at random, seeded by its id, so it keeps the look after Load without anything new in the save.
// Young animals (kittens) use the young look. A look that has not loaded (or failed) keeps the drawn figure.
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function adultLooks(species,art=APPROVED_ANIMAL_ART){const s=art[species];return s?Object.keys(s.looks).filter(id=>id!==s.young):[];}
export function animalLook(species,id,{young=false}={},art=APPROVED_ANIMAL_ART){
  const s=art[species];if(!s)return null;if(young&&s.young)return s.young;
  const looks=adultLooks(species,art);return looks.length?looks[hash(`${species}:${id}`)%looks.length]:null;
}
export const animalWalkKey=look=>`animal-walk:${look}`;
export const animalPoseKey=(look,pose)=>`animal-pose:${look}:${pose}`;
const lookArt=look=>{for(const s of Object.values(APPROVED_ANIMAL_ART))if(s.looks[look])return s.looks[look];return null;};
// Loads the walk sheet and poses of a look once per scene; ready() runs when they are in.
export function ensureAnimalLook(scene,look,ready=()=>{}){
  const art=lookArt(look);if(!art||!scene?.load)return false;
  scene.__animalLooks??=new Map();const state=scene.__animalLooks.get(look);
  if(state==='ready')return true;if(state==='failed')return false;if(state){state.add(ready);return false;}
  const waiting=new Set([ready]);scene.__animalLooks.set(look,waiting);const base=scene.assets?.baseURL??import.meta.env?.BASE_URL??'/';
  if(!scene.textures.exists(animalWalkKey(look)))scene.load.spritesheet(animalWalkKey(look),assetURL(`${art.base}.walk.png`,base),{frameWidth:art.walk.frameWidth,frameHeight:art.walk.frameHeight});
  for(const [pose,p] of Object.entries(art.poses))if(!scene.textures.exists(animalPoseKey(look,pose)))scene.load.image(animalPoseKey(look,pose),assetURL(p.src,base));
  scene.load.once('complete',()=>{const ok=scene.textures.exists(animalWalkKey(look));scene.__animalLooks.set(look,ok?'ready':'failed');if(ok)for(const fn of waiting)fn();});
  if(!scene.load.isLoading())scene.load.start();return false;
}
// Puts the look on an image: the walk frame for the facing (walking or standing), or a pose when the look has it.
// Poses face the viewer's right; facings that look left mirror them. Returns false when the art is not ready.
const LEFT=new Set(['S','SW','W','NW']);
export function applyAnimalArt(scene,image,look,{facing='SE',moving=false,walkedMs=0,pose=null}={}){
  const art=lookArt(look);if(!art||scene?.__animalLooks?.get(look)!=='ready'){image.setVisible(false);return false;}
  if(pose&&art.poses[pose]&&scene.textures.exists(animalPoseKey(look,pose))){
    const p=art.poses[pose];image.setTexture(animalPoseKey(look,pose)).setOrigin(p.origin.x,p.origin.y).setFlipX(LEFT.has(facing)).setVisible(true);return true;
  }
  const k=FACING_INDEX[facing]??0;image.setTexture(animalWalkKey(look),walkFrame(k,walkedMs*MOVEMENT_SPEED_SCALE,art.walk.fps,moving)).setOrigin(art.walk.origin.x,art.walk.origin.y).setFlipX(false).setVisible(true);return true;
}
export function hasPose(look,pose){return !!lookArt(look)?.poses?.[pose];}
