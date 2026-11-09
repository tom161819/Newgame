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
  // m-plynule-prechody (73): a ring on the surface now and then – every fully shown fish on open water rolls its next
  // touch of the surface in [minMs, maxMs]; a touch is 1 or 2 light rings (the second `secondChance` of the time,
  // `ringDelayMs` later and a little smaller), each spreading and fading over durationMs. None under ice (winter).
  ripple:Object.freeze({minMs:8000,maxMs:15000,durationMs:1000,radius:12,alpha:.4,secondChance:.5,ringDelayMs:240,secondScale:.7}),
  // Fish rise from the depth and sink back: opacity 0 → full over inMs (and back over outMs) with a slight scale-up
  // from `depthScale`. Instead of staying put a fish surfaces for visibleMs, then dives for hiddenMs (per fish, from
  // its tile hash), and its swimming loop drifts slowly (radius in tiles, angular speed in rad/ms).
  fade:Object.freeze({inMs:800,outMs:800,depthScale:.82,maxStepMs:100}),
  surface:Object.freeze({visibleMs:Object.freeze([14000,26000]),hiddenMs:Object.freeze([3000,7000])}),
  drift:Object.freeze({radius:.16,speed:.00007}),
  // Under ice the shadows are fainter (× alpha) and there are no rings.
  ice:Object.freeze({alpha:.55}),
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

// ---- m-plynule-prechody (73): smooth fish and surface rings (pure helpers, used by FishShadows) ----
const ease=t=>{const x=Math.min(1,Math.max(0,t));return x*x*(3-2*x);};
// One step of a fish's fade (0 hidden … 1 shown) towards `show`.
export function stepFade(fade,dtMs,show,rule=WATER_LIFE.fade){
  const f=Number.isFinite(fade)?fade:0;return show?Math.min(1,f+Math.max(0,dtMs)/rule.inMs):Math.max(0,f-Math.max(0,dtMs)/rule.outMs);
}
// Opacity factor and scale of a fish at a fade level: rises smoothly from the depth.
export function fishLook(fade,rule=WATER_LIFE.fade){const e=ease(fade);return{alpha:e,scale:rule.depthScale+(1-rule.depthScale)*e};}
// Whether the fish of tile (x, y) is up at `timeMs` (deterministic surfacing cycle per tile).
export function surfaced(x,y,timeMs,rule=WATER_LIFE.surface){
  const up=rule.visibleMs[0]+tileHash(x,y,11)*(rule.visibleMs[1]-rule.visibleMs[0]),down=rule.hiddenMs[0]+tileHash(x,y,12)*(rule.hiddenMs[1]-rule.hiddenMs[0]),cycle=up+down;
  return ((timeMs+tileHash(x,y,13)*cycle)%cycle+cycle)%cycle<up;
}
// Rings only on open water: never on frozen water, never for a fish that is not fully up.
export const ringAllowed=({frozen=false,fade=1}={})=>!frozen&&fade>=1;
// Delay to the next touch of the surface (ms) and how many rings it makes (1–2); `n` counts the touches.
export function nextRingMs(x,y,n,rule=WATER_LIFE.ripple){return rule.minMs+tileHash(x,y,20+(n|0))*(rule.maxMs-rule.minMs);}
export function ringCount(x,y,n,rule=WATER_LIFE.ripple){return tileHash(x,y,40+(n|0))<rule.secondChance?2:1;}
// Scale and opacity of a ring `ageMs` after it started (null once it is gone).
export function ringLook(ageMs,rule=WATER_LIFE.ripple){if(ageMs<0)return{scale:.25,alpha:0};const k=ageMs/rule.durationMs;if(k>=1)return null;return{scale:.25+k*.9,alpha:rule.alpha*(1-k)*(1-k)};}
