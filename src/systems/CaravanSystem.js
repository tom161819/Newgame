import { t } from '../i18n/index.js';
import { CARAVAN_RULES,MERCHANT_TYPES } from '../data/trade.js';
import { findPathToAny,canStep } from '../game/pathfinding.js';
import { advanceMovement } from '../game/movement.js';
import { buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { COLUMNS,ROWS } from '../game/config.js';

// Trade F1.2 (#59): a merchant caravan with its own horse wagon. While a finished Marketplace exists, one caravan comes
// every 2–4 game days from a walkable map edge, drives (no teleport) to a Marketplace, trades there for 0.75 of a day and
// drives back to an edge. It is not a resident: no needs, no population, never the player's wagon. Orders (F1.3) can keep
// it up to 0.25 of a day longer through `deliveryPending`.
export const CARAVAN_PHASES=Object.freeze(['arriving','trading','leaving']);
const key=t=>`${t.x},${t.y}`;
const randomInt=(random,min,max)=>min+Math.floor(random()*(max-min+1));
export function edgeTiles(map){
  const tiles=[];for(let x=0;x<COLUMNS;x++)tiles.push({x,y:0},{x,y:ROWS-1});for(let y=1;y<ROWS-1;y++)tiles.push({x:0,y},{x:COLUMNS-1,y});
  return tiles.filter(p=>map[p.y]?.[p.x]===0);
}
export function rollMerchant(random=Math.random){
  const types=Object.keys(MERCHANT_TYPES),type=types[Math.floor(random()*types.length)%types.length],stock={};
  const entries=Object.entries(MERCHANT_TYPES[type].stock);
  for(const [resource,[min,max]]of entries)if(random()<.75)stock[resource]=randomInt(random,min,max);
  if(!Object.keys(stock).length){const [resource,[min,max]]=entries[Math.floor(random()*entries.length)%entries.length];stock[resource]=randomInt(random,min,max);}
  return {type,stock,gold:randomInt(random,CARAVAN_RULES.goldMin,CARAVAN_RULES.goldMax)};
}
export class CaravanSystem {
  constructor(scene,{random=Math.random}={}){
    this.scene=scene;this.random=random;this.active=null;this.nextVisitAt=null;this.seq=0;this.listeners=new Set();
    // F1.3 sets this: true while an order of the caravan is being carried, which lets it stay up to maxWait longer.
    this.deliveryPending=()=>false;
    // A tile that became blocked is never entered; the next update plans around it.
    this.enter=tile=>canStep(this.scene.map,this.active?.tile??tile,tile);
    // The first Marketplace finished starts the clock at once (the panel shows when the first caravan is due).
    this.buildingsChanged=()=>{if(!this.active&&this.nextVisitAt===null&&this.marketplaces().length)this.schedule();};scene.events?.on?.('buildings:changed',this.buildingsChanged);
  }
  get time(){return this.scene.gameTime;}
  get now(){return this.time.totalElapsed;}
  get day(){return this.time.dayDuration;}
  marketplaces(){return this.scene.buildings.filter(b=>b.type==='marketplace'&&buildingIsComplete(b)&&!b.unverified);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const listener of this.listeners)listener();}
  feed(id,key,params={},important=false){this.scene.eventFeed?.push(`caravan:${this.active?.id??id}:${key}`,t(`caravan.${key}`,params),{important});}
  schedule(){this.nextVisitAt=this.now+(CARAVAN_RULES.minInterval+this.random()*(CARAVAN_RULES.maxInterval-CARAVAN_RULES.minInterval))*this.day;this.changed();}
  goals(marketplace){return towerNeighbors(marketplace).filter(p=>this.scene.map[p.y]?.[p.x]===0);}
  route(from,goals){if(!goals.length)return null;const route=findPathToAny(this.scene.map,from,goals,this.scene.pathWear?.routingOptions(this.active??{}));return route&&route.path.length<=CARAVAN_RULES.maxRoute?route:null;}
  // Developer shortcut (console `mkDev.summonCaravan()`, smoke tests): the next caravan comes now.
  summon(){if(this.active||!this.marketplaces().length)return false;this.nextVisitAt=this.now;return this.spawn();}
  spawn(){
    const markets=this.marketplaces();if(!markets.length)return false;
    const edges=edgeTiles(this.scene.map);
    for(let attempt=0;attempt<CARAVAN_RULES.spawnAttempts&&edges.length;attempt++){
      const marketplace=markets[Math.floor(this.random()*markets.length)%markets.length],entry=edges[Math.floor(this.random()*edges.length)%edges.length];
      const route=this.route(entry,this.goals(marketplace));if(!route)continue;
      const merchant=rollMerchant(this.random);
      this.active={id:`caravan-${++this.seq}`,...merchant,marketplaceId:marketplace.id,phase:'arriving',entry:{...entry},tile:{...entry},position:{x:entry.x+.5,y:entry.y+.5},
        path:route.path,nextTile:null,speed:CARAVAN_RULES.speed,departAt:null,warned:false,waiting:false,canEnterTile:this.enter};
      this.nextVisitAt=null;this.feed(null,'arriving',{type:t(`caravan.type.${merchant.type}`)});this.changed();return true;
    }
    this.scene.eventFeed?.push(`caravan:unreachable:${Math.round(this.now)}`,t('caravan.unreachable'),{important:true});
    this.schedule();return false;
  }
  leave(){
    const c=this.active;if(!c)return;this.scene.trade?.caravanLeft(c);c.phase='leaving';c.departAt=null;c.waiting=false;
    const edges=edgeTiles(this.scene.map),preferred=[c.entry,...edges].filter(p=>this.scene.map[p.y]?.[p.x]===0);
    const route=findPathToAny(this.scene.map,c.nextTile??c.tile,preferred.length?preferred:edges);
    c.path=route?.path??[];this.feed(null,'left');this.changed();
    if(!route)this.finish();
  }
  finish(){this.active=null;this.marketplaces().length?this.schedule():(this.nextVisitAt=null,this.changed());}
  // A blocked step (a new building on the road) replans; with no way left the caravan gives up and leaves the map.
  replan(){
    const c=this.active,from=c.nextTile??c.tile;
    if(c.phase==='arriving'){const m=this.scene.buildings.find(b=>b.id===c.marketplaceId);const route=m&&this.route(from,this.goals(m));if(route){c.path=route.path;return;}this.leave();return;}
    const route=findPathToAny(this.scene.map,from,edgeTiles(this.scene.map));if(route)c.path=route.path;else this.finish();
  }
  update(delta){
    const markets=this.marketplaces();
    if(!this.active){
      if(!markets.length){if(this.nextVisitAt!==null){this.nextVisitAt=null;this.changed();}return;}
      if(this.nextVisitAt===null){this.schedule();return;}
      if(this.now>=this.nextVisitAt)this.spawn();
      return;
    }
    const c=this.active,market=markets.find(m=>m.id===c.marketplaceId);
    if(c.phase!=='leaving'&&!market){this.leave();return;}
    if(c.phase==='trading'){
      const leaveAt=c.departAt+(c.waiting?CARAVAN_RULES.maxWait*this.day:0);
      if(!c.warned&&this.now>=c.departAt-CARAVAN_RULES.leavingWarning*this.day){c.warned=true;this.feed(null,'leavingSoon');}
      if(this.now>=c.departAt&&!c.waiting&&this.deliveryPending(c)){c.waiting=true;this.changed();return;}
      if(this.now>=leaveAt||(c.waiting&&!this.deliveryPending(c)&&this.now>=c.departAt))this.leave();
      return;
    }
    if(c.path.length&&!c.nextTile&&!canStep(this.scene.map,c.tile,c.path[0]))this.replan();
    if(!this.active)return;
    advanceMovement(c,delta);
    if(c.nextTile||c.path.length)return;
    if(c.phase==='arriving'){c.phase='trading';c.departAt=this.now+CARAVAN_RULES.stay*this.day;this.feed(null,'arrived',{type:t(`caravan.type.${c.type}`)},true);this.scene.trade?.recordOffers?.(c);this.changed();}
    else if(c.phase==='leaving')this.finish();
  }
  status(){const c=this.active;return {active:c?{id:c.id,type:c.type,phase:c.phase,marketplaceId:c.marketplaceId,stock:{...c.stock},gold:c.gold,leavesIn:c.departAt===null?null:Math.max(0,c.departAt+(c.waiting?CARAVAN_RULES.maxWait*this.day:0)-this.now),waiting:c.waiting}:null,nextIn:this.nextVisitAt===null?null:Math.max(0,this.nextVisitAt-this.now)};}
  exportState(){
    const c=this.active;
    return {seq:this.seq,nextVisitAt:this.nextVisitAt,active:c?{id:c.id,type:c.type,stock:{...c.stock},gold:c.gold,marketplaceId:c.marketplaceId,phase:c.phase,entry:{...c.entry},tile:{...c.tile},
      position:{...c.position},path:c.path.map(p=>({...p})),nextTile:c.nextTile?{...c.nextTile}:null,departAt:c.departAt,warned:c.warned,waiting:c.waiting}:null};
  }
  importState(state){
    this.seq=state?.seq??0;this.nextVisitAt=state?.nextVisitAt??null;const c=state?.active;
    this.active=c?{...structuredClone(c),speed:CARAVAN_RULES.speed,direction:null,walking:false,canEnterTile:this.enter}:null;this.changed();
  }
  destroy(){this.scene.events?.off?.('buildings:changed',this.buildingsChanged);this.listeners.clear();this.active=null;}
}
export { key as caravanTileKey };
