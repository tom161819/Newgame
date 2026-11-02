import { tileCenter } from './map.js';
import { reachableTiles } from './pathfinding.js';

export const STONE_COUNT = 30;
export const MAX_STONES = 80;
export const STONE_INTERVAL = 20_000;
export const tileKey = ({ x, y }) => `${x},${y}`;

export function stoneCandidates(map, origins, reservedTiles, occupied) {
  const reserved=new Set(reservedTiles.map(tileKey));
  return reachableTiles(map,origins).filter(tile=>!reserved.has(tileKey(tile))&&!occupied.has(tileKey(tile)));
}

export function generateStones(map, start, count = STONE_COUNT, random = Math.random) {
  const candidates=stoneCandidates(map,[start],[start],new Map());
  if(count>candidates.length)throw new RangeError('Na mapě není dost dosažitelného místa pro kameny.');
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  return candidates.slice(0,count);
}

export class StoneSpawner {
  constructor({map,stones,getOrigins,getReserved,spawn,random=Math.random}) {
    Object.assign(this,{map,stones,getOrigins,getReserved,spawn,random});
    this.elapsed=0;
  }

  spawnOne() {
    if(this.stones.size>=MAX_STONES)return false;
    const candidates=stoneCandidates(this.map,this.getOrigins(),this.getReserved(),this.stones);
    if(!candidates.length)return false;
    this.spawn(candidates[Math.floor(this.random()*candidates.length)]);
    return true;
  }

  update(delta) {
    this.elapsed+=delta;
    while(this.elapsed>=STONE_INTERVAL){this.elapsed-=STONE_INTERVAL;this.spawnOne();}
  }
}

export function drawStone(scene, tile) {
  const position=tileCenter(tile);
  const stone=scene.add.graphics({x:position.x,y:position.y-4}).setDepth(position.y+0.05);
  stone.setData('tile',{...tile});
  stone.fillStyle(0x322e20,0.35);stone.fillEllipse(0,7,28,11);
  stone.fillStyle(0x868c88);stone.fillPoints([{x:-11,y:-1},{x:-3,y:3},{x:-3,y:9},{x:-10,y:5}],true);
  stone.fillStyle(0x606d70);stone.fillPoints([{x:-3,y:3},{x:10,y:-2},{x:9,y:6},{x:-3,y:9}],true);
  stone.fillStyle(0xb4b9b1);stone.fillPoints([{x:-11,y:-1},{x:-5,y:-9},{x:3,y:-10},{x:10,y:-2},{x:-3,y:3}],true);
  return stone;
}
