import { COLUMNS, ROWS } from './config.js';
import { BUSH_TYPES } from '../data/worldTerrain.js';

// Large nature objects (velke-prirodni-objekty): a thicket (2 × 1, 2 × 2, 3 × 2) and a rock obstacle (2 × 2) or rock
// ridge (4 × 2) are ONE object on screen, drawn with the approved Studio art at the footprint's front, over tiles that
// keep their ordinary per-tile objects underneath: the thicket's bushes stay in scene.bushes and the rock tiles stay
// rock (terrainGrid 1). So walking, building, fog, mining and clearing keep their existing rules; a group only says
// "these tiles are drawn as one". The group is gone as soon as one of its parts is (a bush cleared, a rock mined,
// something placed on it); the remaining parts then show as single bushes or rocks again.
// A group: {kind:'thicket'|'rocks', x, y, w, h}; x, y is the back (smallest) tile; w runs along x, h along y.
export const NATURE_GROUP_SIZES=Object.freeze({
  thicket:Object.freeze([[3,2],[2,2],[2,1]]),
  rocks:Object.freeze([[4,2],[2,2]]),
});
const SCRUB=BUSH_TYPES.indexOf('bush_scrub');
export const isThicketBush=type=>Number.isInteger(type)&&type>=0&&type<BUSH_TYPES.length&&type!==SCRUB;
export const groupKey=g=>`${g.kind}:${g.x},${g.y}`;
export function groupTiles(g){const tiles=[];for(let dy=0;dy<g.h;dy++)for(let dx=0;dx<g.w;dx++)tiles.push({x:g.x+dx,y:g.y+dy});return tiles;}
// The front (bottom) tile: sprites of the group sort by it, like a unit standing there.
export const groupFront=g=>({x:g.x+g.w-1,y:g.y+g.h-1});
export const validGroupSize=(kind,w,h)=>!!NATURE_GROUP_SIZES[kind]?.some(([a,b])=>a===w&&b===h);

// The parts are all there: every thicket tile holds a grass bush, every rock tile is rock.
export function groupIntact(g,{bushes,terrain}){
  return groupTiles(g).every(t=>g.kind==='thicket'?isThicketBush(bushes?.get(`${t.x},${t.y}`))&&terrain?.[t.y]?.[t.x]===0:terrain?.[t.y]?.[t.x]===1);
}
// tile key → group
export function groupIndex(groups){const index=new Map();for(const g of groups??[])for(const t of groupTiles(g))index.set(`${t.x},${t.y}`,g);return index;}
export const thicketTiles=groups=>new Set((groups??[]).filter(g=>g.kind==='thicket').flatMap(g=>groupTiles(g).map(t=>`${t.x},${t.y}`)));

// Drops every group that lost a part, or that has a resource (tree, deposit, stone) or a placed building on a tile.
// Returns true when something changed. Called after world creation, on load, before saving and when drawing.
export function pruneNatureGroups(scene){
  const groups=scene?.natureGroups;if(!groups?.length)return false;
  const built=new Set();for(const b of scene.buildings??[])if(!b.unverified)for(const t of b.tiles??[])built.add(`${t.x},${t.y}`);
  const keep=groups.filter(g=>groupIntact(g,{bushes:scene.bushes,terrain:scene.terrainGrid})&&groupTiles(g).every(t=>{const key=`${t.x},${t.y}`;return !built.has(key)&&!scene.resourceOccupancy?.has(key);}));
  if(keep.length===groups.length)return false;
  groups.splice(0,groups.length,...keep);scene.natureGroupsRevision=(scene.natureGroupsRevision??0)+1;return true;
}

// Save format: ['thicket'|'rocks', x, y, w, h], sorted by position.
export function exportNatureGroups(groups){return (groups??[]).map(g=>[g.kind,g.x,g.y,g.w,g.h]).sort((a,b)=>a[2]-b[2]||a[1]-b[1]||a[0].localeCompare(b[0]));}
export function importNatureGroups(list){return (list??[]).map(([kind,x,y,w,h])=>({kind,x,y,w,h}));}
// Validates the saved list against the saved bushes and rock layer; `check` throws on a false condition.
export function validateNatureGroups(list,{bushes,terrain},check){
  check(Array.isArray(list)&&list.length<=COLUMNS*ROWS);
  const bushMap=new Map((bushes??[]).map(([x,y,type])=>[`${x},${y}`,type])),taken=new Set();
  for(const entry of list){
    check(Array.isArray(entry)&&entry.length===5);const [kind,x,y,w,h]=entry;
    check(typeof kind==='string'&&Object.hasOwn(NATURE_GROUP_SIZES,kind)&&[x,y,w,h].every(Number.isInteger)&&validGroupSize(kind,w,h));
    check(x>=0&&y>=0&&x+w<=COLUMNS&&y+h<=ROWS);
    const g={kind,x,y,w,h};check(groupIntact(g,{bushes:bushMap,terrain}));
    for(const t of groupTiles(g)){const key=`${t.x},${t.y}`;check(!taken.has(key));taken.add(key);}
  }
}

// ---- Generator 4. Rocks: called by placeRocks for a placement whose tiles were all open before it.
export function rockGroupFor(x,y,w,h){return validGroupSize('rocks',w,h)?{kind:'rocks',x,y,w,h}:null;}
// Thickets: dense grass-bush patches along the water or at a forest edge become one thicket, the largest size first,
// scanning the map in a fixed order. A patch missing up to a third of its bushes gets them (bushes of the patch's main
// kind) when those tiles are free grass and the roll allows (`fill`). Returns the thickets; `bushes` gains the filled bushes.
export function mergeThickets({bushes,canGrow,qualifies,random,fill=.6}){
  const groups=[],taken=new Set(),key=(x,y)=>`${x},${y}`;
  for(const [w,h] of NATURE_GROUP_SIZES.thicket){
    for(let y=0;y+h<=ROWS;y++)for(let x=0;x+w<=COLUMNS;x++){
      const g={kind:'thicket',x,y,w,h},tiles=groupTiles(g);
      if(tiles.some(t=>taken.has(key(t.x,t.y)))||!tiles.some(t=>qualifies(t.x,t.y)))continue;
      const missing=tiles.filter(t=>!isThicketBush(bushes.get(key(t.x,t.y))));
      if(missing.length>Math.floor(w*h/3))continue;
      if(missing.length){
        if(missing.some(t=>bushes.has(key(t.x,t.y))||!canGrow(t.x,t.y))||random()>=fill)continue;
        const counts=new Map();for(const p of tiles){const type=bushes.get(key(p.x,p.y));if(isThicketBush(type))counts.set(type,(counts.get(type)??0)+1);}
        const main=[...counts].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0][0];for(const t of missing)bushes.set(key(t.x,t.y),main);
      }
      for(const t of tiles)taken.add(key(t.x,t.y));groups.push(g);
    }
  }
  return groups;
}
