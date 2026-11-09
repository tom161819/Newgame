import { SEASONS, SEASON_DAYS } from '../data/seasons.js';
import { SEASON_TRANSITION } from '../data/seasonTransition.js';
import { devFactor } from '../data/devBalance.js';
import { GROUND } from '../data/worldTerrain.js';
import { COLUMNS, ROWS } from './config.js';

// Gradual, uneven change of the seasonal look. The rules of the seasons stay in
// SeasonSystem; this only decides how far each place has blended from the
// previous season into the next one. Everything is derived from game time,
// so Save/Load, background catch-up and Seasons ON/OFF give the same picture
// and nothing new is stored.
// m-plynule-prechody (78): the window is SEASON_TRANSITION.days game days around the season boundary (Dev tool → World
// look), in SEASON_TRANSITION.steps steps; the mask is continuous (the continuous ground blends per pixel, plants,
// trees and bushes per tile) and leans on the terrain: snow first in shade, the thaw first by water.
export { SEASON_TRANSITION };
export const transitionDays=()=>Math.min(SEASON_DAYS,Math.max(.5,devFactor('seasonDays')||SEASON_TRANSITION.days));
export const transitionSteps=()=>Math.max(1,Math.round(devFactor('seasonSteps')||SEASON_TRANSITION.steps));
// Where in the year each season's look sits (continuousGround's year 0–1).
export const SEASON_YEAR=Object.freeze({Winter:.02,Spring:.3,Summer:.5,Autumn:.76});

function hash01(seed,x,y){
  let h=Math.imul(seed^0x9e3779b9,0x85ebca6b)^Math.imul(x,0xc2b2ae35)^Math.imul(y,0x27d4eb2f);
  h=Math.imul(h^h>>>15,0x2c1b3c6d);h=Math.imul(h^h>>>12,0x297a2d39);
  return((h^h>>>15)>>>0)/0x100000000;
}
function lowNoise(seed,x,y,cell=8){
  const gx=x/cell,gy=y/cell,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const at=(i,j)=>hash01(seed+41,i,j),top=at(x0,y0)+(at(x0+1,y0)-at(x0,y0))*sx,bottom=at(x0,y0+1)+(at(x0+1,y0+1)-at(x0,y0+1))*sx;
  return top+(bottom-top)*sy;
}
// Normal CDF (Abramowitz–Stegun 7.1.26 erf), for spreading the noise evenly.
function normalCdf(z){const x=Math.abs(z)/Math.SQRT2,t=1/(1+.3275911*x),e=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return .5*(1+(z<0?-e:e));}
const smooth=t=>{const x=Math.min(1,Math.max(0,t));return x*x*(3-2*x);};

// 0 → 1 over the transition window. Each tile starts at its own moment, mixed
// from a stable per-tile hash and slow large-scale noise, so the map never
// flips at once and shows no checkerboard; every tile is done at progress 1.
export function seasonBlend(progress,x,y,{seed=SEASON_TRANSITION.seed,spread=SEASON_TRANSITION.spread}={}){
  if(progress<=0)return 0;if(progress>=1)return 1;
  // Mostly slow noise (patches several tiles wide), a little per-tile jitter: no checkerboard.
  const start=spread*(.15*hash01(seed,x,y)+.85*lowNoise(seed,x,y));
  return smooth((progress-start)/(1-spread));
}

// m-plynule-prechody: continuous start of a place (0 … spread) for the change into `to`. Two octaves of slow noise give
// patches several tiles wide; `bias` (0 = early … 1 = late, from the terrain) moves it; autumn sharpens the noise into
// islands. Deterministic: the same place starts at the same moment in every game with the same seed.
export function transitionStart(fx,fy,to,bias=.5,{seed=SEASON_TRANSITION.seed,spread=SEASON_TRANSITION.spread,weight=SEASON_TRANSITION.bias}={}){
  // The raw noise piles up around 0.5; its normal CDF spreads the starts evenly over the window (no rush in the middle).
  let n=normalCdf((lowNoise(seed,fx,fy,8)*.72+lowNoise(seed+7,fx,fy,3)*.28-.5)/SEASON_TRANSITION.noiseSd);
  if(to==='Autumn')n=smooth((n-.5)*SEASON_TRANSITION.islands+.5);
  const k=to==='Winter'||to==='Spring'?weight:0;
  return spread*Math.min(1,Math.max(0,n*(1-k)+bias*k));
}
// 0 → 1 as `progress` goes 0 → 1: every place is still the old season at 0 and done at 1.
export function seasonWeight(progress,fx,fy,to,bias=.5,options={}){
  if(progress<=0)return 0;if(progress>=1)return 1;const spread=options.spread??SEASON_TRANSITION.spread;
  return smooth((progress-transitionStart(fx,fy,to,bias,options))/(1-spread));
}
// Terrain lean of a place (0 = changes early, 1 = late): `shade` 0–1 (forest floor, stony ground), `water` 0–1
// (1 = right by the water). Snow comes first in shade and away from water; the thaw first by water and in the sun.
export function terrainBias(to,shade,water){
  if(to==='Winter')return Math.min(1,Math.max(0,.5*(1-shade)+.5*water));
  if(to==='Spring')return Math.min(1,Math.max(0,.5*(1-water)+.5*shade));
  return .5;
}

// {from, to, progress} while the window runs: the last `days × lead` of a season and the first `days × (1 − lead)` of
// the next. No transition into the first season of a game, none with Seasons OFF (summer).
export function transitionState(seasons,{days=transitionDays(),lead=SEASON_TRANSITION.lead}={}){
  if(!seasons?.enabled||!seasons.time?.dayDuration)return null;
  const calendar=seasons.calendar,t=(calendar.dayInSeason-1)+seasons.cycleElapsed/seasons.time.dayDuration,before=days*lead,after=days-before,i=SEASONS.indexOf(calendar.season);
  if(t<after&&seasons.cycleDay>SEASON_DAYS)return{from:SEASONS[(i+3)%4],to:calendar.season,progress:Math.max(0,(t+before)/days)};
  if(before>0&&t>=SEASON_DAYS-before)return{from:calendar.season,to:SEASONS[(i+1)%4],progress:Math.min(1-1e-9,(t-(SEASON_DAYS-before))/days)};
  return null;
}

// The mask of a chunk mid-change: alpha 0–255 (the new season's share) on a gw × gh grid; `toWorld(gx, gy)` gives the map
// position of a grid point, `weight(fx, fy)` the blend weight there. `data` is RGBA (ImageData.data).
export function blendMask(data,gw,gh,toWorld,weight){
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const [fx,fy]=toWorld(gx,gy),o=(gy*gw+gx)*4;data[o]=data[o+1]=data[o+2]=255;data[o+3]=Math.round(255*Math.min(1,Math.max(0,weight(fx,fy))));}
  return data;
}

export class SeasonTransition{
  constructor(scene,{seasons=scene.seasons,terrain=scene.terrain,trees=()=>scene.naturalResources?.byId.values()??[],view=object=>scene.naturalResources?.view(object),
    redraw=()=>{if(scene.worldCamera)terrain?.update(scene.cameras.main,scene.fog,scene.mapMemory);},paused=()=>!!scene.pauseManager?.paused,
    ground=()=>scene.groundGrid,zones=()=>scene.grassZones}={}){
    Object.assign(this,{seasons,terrain,trees,view,redraw,paused,ground,zones});this.pending=new Map();this.chunkRange=new Map();
    this.levels=new Uint8Array(COLUMNS*ROWS).fill(SEASON_TRANSITION.levels);this.key='none';
    // Follow game time itself, so the picture is exact even while the scene is paused.
    // While paused (menus, tests) the whole change is drawn at once; while playing it is spread over frames.
    this.unsubscribe=seasons?.time?.onAfterAdvance?.(()=>{this.update();if(this.paused())this.flush(Infinity);})??null;
  }
  destroy(){this.unsubscribe?.();this.unsubscribe=null;}
  // Progress is stepped, so places repaint a handful of times (SEASON_TRANSITION.steps), not every frame.
  state(){
    const state=transitionState(this.seasons);if(!state)return null;
    const steps=transitionSteps(),step=Math.floor(state.progress*steps);
    return{...state,step,steps,progress:step/steps};
  }
  // Shade and water closeness per tile (from the world's ground and grass zones), built once.
  terrainGrids(){
    if(this.grids!==undefined)return this.grids;const ground=this.ground?.(),zones=this.zones?.();if(!ground?.length){return null;}
    const n=COLUMNS*ROWS,shade=new Float32Array(n),water=new Float32Array(n),dist=new Float32Array(n).fill(Infinity),queue=[],reach=SEASON_TRANSITION.waterReach;
    const LAND={[GROUND.BEACH]:6,[GROUND.DESERT]:7,[GROUND.MUD]:8,[GROUND.SHORE_ROCKS]:9};
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){const i=y*COLUMNS+x,g=ground[y]?.[x];
      if(g===GROUND.SHALLOW||g===GROUND.DEEP||g===GROUND.FORD){dist[i]=0;queue.push(i);}
      shade[i]=SEASON_TRANSITION.shade[g===GROUND.GRASS?(zones?.[y]?.[x]??0):LAND[g]??0]??0;}
    for(let q=0;q<queue.length;q++){const i=queue[q],x=i%COLUMNS,y=(i-x)/COLUMNS,d=dist[i]+1;if(d>reach)continue;
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;const j=ny*COLUMNS+nx;if(dist[j]>d){dist[j]=d;queue.push(j);}}}
    for(let i=0;i<n;i++)water[i]=Math.max(0,1-dist[i]/reach);
    return this.grids={shade,water};
  }
  // Terrain lean at a map position (bilinear between tile centres, so the mask stays continuous).
  bias(fx,fy,to){
    if(to!=='Winter'&&to!=='Spring')return .5;const grids=this.terrainGrids();if(!grids)return .5;
    const gx=Math.min(COLUMNS-1.001,Math.max(0,fx-.5)),gy=Math.min(ROWS-1.001,Math.max(0,fy-.5)),ix=Math.floor(gx),iy=Math.floor(gy),ax=gx-ix,ay=gy-iy,i=iy*COLUMNS+ix;
    const at=g=>g[i]*(1-ax)*(1-ay)+g[i+1]*ax*(1-ay)+g[i+COLUMNS]*(1-ax)*ay+g[i+COLUMNS+1]*ax*ay;
    return terrainBias(to,at(grids.shade),at(grids.water));
  }
  weight(fx,fy,state=this.state()){return state?seasonWeight(state.progress,fx,fy,state.to,this.bias(fx,fy,state.to)):1;}
  amount(x,y,state=this.state()){
    if(!state)return 1;
    const levels=SEASON_TRANSITION.levels;return Math.round(this.weight(x+.5,y+.5,state)*levels)/levels;
  }
  // Terrain tint of a visible tile: how much of `season` it shows over the other season of the window (the tile
  // renderer draws `from` under `season` at `amount`). Before the boundary the terrain still draws the old season, so
  // the new one is the one under it.
  mix(x,y,season){
    const state=this.state();if(!state||(season!==state.to&&season!==state.from))return null;
    const a=this.amount(x,y,state),amount=season===state.to?a:1-a;return amount>=1?null:{from:season===state.to?state.from:state.to,amount};
  }
  // Season a live tree or bush on this tile should show.
  seasonAt(tile,season){
    const state=this.state();if(!state||(season!==state.to&&season!==state.from)||!Number.isFinite(tile?.x))return season;
    return this.amount(Math.floor(tile.x),Math.floor(tile.y),state)>=.5?state.to:state.from;
  }
  // The continuous ground of one 10 × 10 chunk (TerrainRenderer): {key: season} while the whole chunk shows one season,
  // else the step key with from, to and blend.weight (the mask). Start bounds per chunk are sampled once per change.
  groundLook(cx,cy,season,size=10){
    const state=this.state();if(!state||(season!==state.to&&season!==state.from))return{key:season};
    const ck=`${cx},${cy}:${state.to}`;let range=this.chunkRange.get(ck);
    if(!range){let lo=Infinity,hi=-Infinity;for(let y=-1;y<=size+1;y++)for(let x=-1;x<=size+1;x++){const fx=cx*size+x,fy=cy*size+y,v=transitionStart(fx,fy,state.to,this.bias(fx,fy,state.to));if(v<lo)lo=v;if(v>hi)hi=v;}
      range=[lo-.12,hi+.12];this.chunkRange.set(ck,range);}
    const spread=SEASON_TRANSITION.spread;
    if(state.progress<=0||state.progress<=range[0])return{key:state.from};
    if(state.progress>=range[1]+(1-spread))return{key:state.to};
    return{key:`${state.from}>${state.to}:${state.step}/${state.steps}`,from:state.from,to:state.to,blend:{weight:(fx,fy)=>this.weight(fx,fy,state)}};
  }
  // Once per progress step: queue the 10 × 10 chunks whose tiles changed blend level and update trees.
  update(){
    const state=this.state(),key=state?`${state.from}>${state.to}:${state.step}/${state.steps}`:'none';
    if(key===this.key)return false;
    this.key=key;const changed=[],levels=SEASON_TRANSITION.levels;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){
      const index=y*COLUMNS+x,level=state?Math.round(this.weight(x+.5,y+.5,state)*levels):levels;
      if(level!==this.levels[index]){this.levels[index]=level;changed.push({x,y});}
    }
    for(const tile of changed){const key=`${Math.floor(tile.x/10)},${Math.floor(tile.y/10)}`;if(!this.pending.has(key))this.pending.set(key,tile);}
    // The continuous ground's look of a chunk (groundLook) changes with every step while the chunk is mid-change, even
    // where no tile changed its rounded level: those chunks are queued too.
    const looks=this.chunkLooks??=new Map();
    for(let cy=0;cy<ROWS/10;cy++)for(let cx=0;cx<COLUMNS/10;cx++){const key=`${cx},${cy}`,look=state?this.groundLook(cx,cy,state.to).key:'none';if(looks.get(key)!==look){looks.set(key,look);if(!this.pending.has(key))this.pending.set(key,{x:cx*10,y:cy*10});}}
    for(const object of this.trees())this.view(object)?.applySeason?.();
    return true;
  }
  // Repaint queued chunks: a few per frame while playing, all at once when asked. A
  // chunk repaints in one pass, so the picture equals a fresh draw.
  flush(limit=SEASON_TRANSITION.chunksPerFrame){
    if(!this.pending.size)return 0;
    const tiles=[];for(const [key,tile]of this.pending){if(tiles.length>=limit)break;tiles.push(tile);this.pending.delete(key);}
    // A paused scene has no later simulation frames to drain the renderer budget.
    this.terrain?.invalidateChunksOf(tiles,{immediate:limit===Infinity});this.redraw?.();return tiles.length;
  }
}
