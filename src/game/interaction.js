import { isWalkable } from './map.js';

export function adjacentTiles(unit){
  const center=unit.nextTile??unit.tile,tiles=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)tiles.push({x:center.x+dx,y:center.y+dy});
  return tiles;
}
export function canInteractAdjacent(map,actor,target){
  if(Math.max(Math.abs(actor.position.x-target.position.x),Math.abs(actor.position.y-target.position.y))>1+1e-8)return false;
  const a={x:Math.floor(actor.position.x),y:Math.floor(actor.position.y)},b={x:Math.floor(target.position.x),y:Math.floor(target.position.y)};
  return a.x===b.x||a.y===b.y||(isWalkable(map,a.x,b.y)&&isWalkable(map,b.x,a.y));
}
