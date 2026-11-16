import { adjacentTiles } from './interaction.js';

// Combat 16 Nov 2026 (owner: "units stand on each other in one heap"): the tiles around a target that no other fighter
// stands on or steps to, so melee fighters spread around it. Falls back to every adjacent tile when all are taken.
export function freeAround(scene,target,self){
  const all=adjacentTiles(target,scene.map),taken=new Set();
  const mark=u=>{if(u===self||!u?.isAlive)return;for(const t of [u.tile,u.nextTile])if(t)taken.add(`${t.x},${t.y}`);if(u.path?.length){const g=u.path[u.path.length-1];taken.add(`${g.x},${g.y}`);}};
  for(const w of scene.workerSystem?.liveWorkers?.()??[])mark(w);for(const a of scene.animalSystem?.animals?.values?.()??[])mark(a);if(scene.character&&!scene.character.away)mark(scene.character);
  const free=all.filter(t=>!taken.has(`${t.x},${t.y}`));return free.length?free:all;
}
// A walkable tile about `distance` tiles from `from`, away from `danger` (for retreat and for archers keeping range).
export function awayFrom(scene,from,danger,distance){
  const dx=from.x-danger.x,dy=from.y-danger.y,n=Math.hypot(dx,dy)||1,map=scene.map,out=[];
  for(let d=distance;d>=1&&out.length<6;d--){const c={x:Math.round(from.x+dx/n*d),y:Math.round(from.y+dy/n*d)};
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const t={x:c.x+ox,y:c.y+oy};if(map[t.y]?.[t.x]===0)out.push(t);}}
  return out;
}
export const isHostile=a=>!!a&&(a.type==='wolf'||!!a.definition?.gameplay?.hostile);
