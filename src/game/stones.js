import { tileCenter } from './map.js';
import { reachableTiles } from './pathfinding.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';

const stoneDefinition=()=>objectRegistry.require('stone');
export const STONE_COUNT=stoneDefinition().spawn.initial;
export const MAX_STONES=stoneDefinition().spawn.max;
export const STONE_INTERVAL=stoneDefinition().spawn.interval;
export const tileKey=({x,y})=>`${x},${y}`;

export function resourceTiles(anchor,definition={width:1,height:1}) {
  const tiles=[];
  for(let dy=0;dy<definition.height;dy++)for(let dx=0;dx<definition.width;dx++)tiles.push({x:anchor.x+dx,y:anchor.y+dy});
  return tiles;
}
export function resourceCandidates(map,origins,reservedTiles,occupied,definition={width:1,height:1}) {
  const reserved=new Set(reservedTiles.map(tileKey));
  const reachable=reachableTiles(map,origins),keys=new Set(reachable.map(tileKey));
  return reachable.filter(anchor=>resourceTiles(anchor,definition).every(tile=>keys.has(tileKey(tile))&&!reserved.has(tileKey(tile))&&!occupied.has(tileKey(tile))));
}
export const stoneCandidates=resourceCandidates;

export function generateResourcePositions(map,start,count,random=Math.random,occupied=new Map(),definition={width:1,height:1}) {
  const candidates=resourceCandidates(map,[start],[start],occupied,definition);
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  const positions=[],used=new Set(occupied.keys());
  for(const anchor of candidates){
    if(positions.length>=count)break;
    const footprint=resourceTiles(anchor,definition);
    if(footprint.some(tile=>used.has(tileKey(tile))))continue;
    positions.push(anchor);
    for(const tile of footprint)used.add(tileKey(tile));
  }
  return positions;
}
export function generateStones(map,start,count=STONE_COUNT,random=Math.random) {
  const candidates=generateResourcePositions(map,start,count,random);
  if(candidates.length<count)throw new RangeError('Na mapě není dost dosažitelného místa pro kameny.');
  return candidates;
}

export class ResourceSpawner {
  exportState(){return {elapsed:this.elapsed};}
  importState(data){this.elapsed=data.elapsed;}
  constructor({map,stones,resources=stones,getOrigins,getReserved,spawn,random=Math.random,definition=stoneDefinition(),getCount,spawnSettings=definition.spawn}) {
    Object.assign(this,{map,stones:resources,getOrigins,getReserved,spawn,random,definition});
    this.getCount=getCount??(()=>this.stones.size);this.elapsed=0;this.spawnSettings=spawnSettings;
  }
  spawnOne() {
    if(!this.spawnSettings||this.getCount()>=this.spawnSettings.max)return false;
    const candidates=resourceCandidates(this.map,this.getOrigins(),this.getReserved(),this.stones,this.definition);
    if(!candidates.length)return false;
    this.spawn(candidates[Math.floor(this.random()*candidates.length)]);return true;
  }
  update(delta) {
    if(!this.spawnSettings)return;
    this.elapsed+=delta;
    while(this.elapsed>=this.spawnSettings.interval){this.elapsed-=this.spawnSettings.interval;this.spawnOne();}
  }
}
// Původní rozhraní zůstává aliasem stejného systému, nikoli druhým generátorem.
export { ResourceSpawner as StoneSpawner };

export function drawStone(scene,tile,definition=stoneDefinition()) {
  const position=tileCenter(tile),visual=definition.visual??{};
  const stone=scene.add.graphics({x:position.x,y:position.y+(visual.offsetY??0)}).setDepth(position.y+(definition.depth?.offset??0));
  stone.setData('tile',{...tile});stone.setData('objectId',definition.id);
  const shadow=definition.shadow;
  if(shadow){stone.fillStyle(shadow.color,shadow.alpha);stone.fillEllipse(shadow.x,shadow.y,shadow.width,shadow.height);}
  stone.fillStyle(0x868c88);stone.fillPoints([{x:-11,y:-1},{x:-3,y:3},{x:-3,y:9},{x:-10,y:5}],true);
  stone.fillStyle(0x606d70);stone.fillPoints([{x:-3,y:3},{x:10,y:-2},{x:9,y:6},{x:-3,y:9}],true);
  stone.fillStyle(0xb4b9b1);stone.fillPoints([{x:-11,y:-1},{x:-5,y:-9},{x:3,y:-10},{x:10,y:-2},{x:-3,y:3}],true);
  return stone;
}
