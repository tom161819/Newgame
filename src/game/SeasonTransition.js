import { SEASONS, SEASON_DAYS } from '../data/seasons.js';
import { COLUMNS, ROWS } from './config.js';

// Gradual, uneven change of the seasonal look. The rules of the seasons stay in
// SeasonSystem; this only decides how far each tile has blended from the
// previous season into the current one. Everything is derived from game time,
// so Save/Load, background catch-up and Seasons ON/OFF give the same picture
// and nothing new is stored.
export const SEASON_TRANSITION=Object.freeze({share:.2,steps:24,levels:12,spread:.7,seed:1,chunksPerFrame:10});

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

// {from, to, progress} during the first `share` of a season, otherwise null.
// No transition in the first season of a game or with Seasons OFF (summer).
export function transitionState(seasons,{share=SEASON_TRANSITION.share}={}){
  if(!seasons?.enabled||!(seasons.cycleDay>SEASON_DAYS))return null;
  const calendar=seasons.calendar,day=seasons.time.dayDuration;
  const progress=((calendar.dayInSeason-1)*day+seasons.cycleElapsed)/(SEASON_DAYS*day*share);
  if(!(progress<1))return null;
  return{from:SEASONS[(SEASONS.indexOf(calendar.season)+3)%4],to:calendar.season,progress:Math.max(0,progress)};
}

export class SeasonTransition{
  constructor(scene,{seasons=scene.seasons,terrain=scene.terrain,trees=()=>scene.naturalResources?.byId.values()??[],view=object=>scene.naturalResources?.view(object),
    redraw=()=>{if(scene.worldCamera)terrain?.update(scene.cameras.main,scene.fog,scene.mapMemory);},paused=()=>!!scene.pauseManager?.paused}={}){
    Object.assign(this,{seasons,terrain,trees,view,redraw,paused});this.pending=new Map();
    this.levels=new Uint8Array(COLUMNS*ROWS).fill(SEASON_TRANSITION.levels);this.key='none';
    // Follow game time itself, so the picture is exact even while the scene is paused.
    // While paused (menus, tests) the whole change is drawn at once; while playing it is spread over frames.
    this.unsubscribe=seasons?.time?.onAfterAdvance?.(()=>{this.update();if(this.paused())this.flush(Infinity);})??null;
  }
  destroy(){this.unsubscribe?.();this.unsubscribe=null;}
  // Progress is stepped, so tiles repaint a handful of times, not every frame.
  state(){
    const state=transitionState(this.seasons);if(!state)return null;
    const step=Math.floor(state.progress*SEASON_TRANSITION.steps);
    return{...state,step,progress:step/SEASON_TRANSITION.steps};
  }
  amount(x,y,state=this.state()){
    if(!state)return 1;
    const levels=SEASON_TRANSITION.levels;return Math.round(seasonBlend(state.progress,x,y)*levels)/levels;
  }
  // Terrain tint of a visible tile that already shows the new season: how much of it.
  mix(x,y,season){
    const state=this.state();if(!state||season!==state.to)return null;
    const amount=this.amount(x,y,state);return amount>=1?null:{from:state.from,amount};
  }
  // Season a live tree on this tile should show.
  seasonAt(tile,season){
    const state=this.state();if(!state||season!==state.to||!Number.isFinite(tile?.x))return season;
    return this.amount(Math.floor(tile.x),Math.floor(tile.y),state)>=.5?state.to:state.from;
  }
  // Once per progress step: queue the 10 × 10 chunks whose tiles changed blend level and update trees.
  update(){
    const state=this.state(),key=state?`${state.from}>${state.to}:${state.step}`:'none';
    if(key===this.key)return false;
    this.key=key;const changed=[],levels=SEASON_TRANSITION.levels;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++){
      const index=y*COLUMNS+x,level=state?Math.round(seasonBlend(state.progress,x,y)*levels):levels;
      if(level!==this.levels[index]){this.levels[index]=level;changed.push({x,y});}
    }
    for(const tile of changed){const key=`${Math.floor(tile.x/10)},${Math.floor(tile.y/10)}`;if(!this.pending.has(key))this.pending.set(key,tile);}
    for(const object of this.trees())this.view(object)?.applySeason?.();
    return true;
  }
  // Repaint queued chunks: a few per frame while playing, all at once when asked. A
  // chunk repaints in one pass, so the picture equals a fresh draw.
  flush(limit=SEASON_TRANSITION.chunksPerFrame){
    if(!this.pending.size)return 0;
    const tiles=[];for(const [key,tile]of this.pending){if(tiles.length>=limit)break;tiles.push(tile);this.pending.delete(key);}
    this.terrain?.invalidateChunksOf(tiles);this.redraw?.();return tiles.length;
  }
}
