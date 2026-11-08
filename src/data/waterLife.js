import { GROUND } from './worldTerrain.js';

// m-svet-vzhled-2 (owner request 47): fish shadows in water, drawn only. Each water tile has a fixed hash; a tile shows
// a fish while the hash is below the chance for its water body's fish stock (Fishing R1 states) and its depth, so the
// same tiles keep their fish and an overfished river goes almost empty. At most `maxOnScreen` fish are drawn.
export const WATER_LIFE=Object.freeze({
  chance:Object.freeze({plentiful:.14,thinning:.06,overfished:.006}),
  depth:Object.freeze({[GROUND.SHALLOW]:.6,[GROUND.DEEP]:1}),
  maxOnScreen:32,refreshMs:250,
  // Swimming: a slow loop around the tile centre (radius in tiles, angular speed in rad/ms) and a faint breathing alpha.
  swim:Object.freeze({radius:.26,speed:.00045,alpha:.3,alphaWave:.08}),
  // A ring on the surface now and then: every fish rolls its next ring in [minMs, maxMs].
  ripple:Object.freeze({minMs:6000,maxMs:16000,durationMs:1700,radius:12,alpha:.45}),
});

// Deterministic 0..1 per tile (and salt), independent of Math.random so a tile keeps its fish.
export function tileHash(x,y,salt=0){
  let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(salt|0,2246822519);
  h=Math.imul(h^h>>>13,1274126177);h^=h>>>16;return (h>>>0)/4294967296;
}
export function fishChance(state,ground){return (WATER_LIFE.chance[state]??0)*(WATER_LIFE.depth[ground]??0);}
export function hasFish(x,y,state,ground){return tileHash(x,y)<fishChance(state,ground);}
// Candidates [{x,y,state,ground}] → the tiles with a fish, the lowest hashes first, at most `cap`.
export function pickFishTiles(candidates,cap=WATER_LIFE.maxOnScreen){
  const out=[];for(const c of candidates){const h=tileHash(c.x,c.y);if(h<fishChance(c.state,c.ground))out.push({...c,rank:h/fishChance(c.state,c.ground)});}
  out.sort((a,b)=>a.rank-b.rank||a.y-b.y||a.x-b.x);return out.slice(0,Math.max(0,cap));
}
