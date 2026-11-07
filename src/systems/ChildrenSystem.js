import { CHILDREN,VILLAGE_GREEN,hashOf,seeded,childCount,allocateChildren } from '../data/children.js';
import { isWaterGround } from '../data/worldTerrain.js';
import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { findPath } from '../game/pathfinding.js';
import { isRestTime } from './DailyRest.js';
import { COLUMNS,ROWS } from '../game/config.js';
import { t } from '../i18n/index.js';

// Children and the Village Green D1 (brief zadani-deti-naves.md). A family house (a completed House with at least two
// residents) has 0–3 children, chosen from the house id and the number of residents, at most 40 on the map, spread
// evenly. Children are not workers: they are not in the WorkerSystem, so they are no residents, eat nothing, earn
// nothing and animals never target them. By day they play near their house, at a Village Green within 15 tiles or,
// in summer, by the water; in winter only about half go out and they throw snowballs and build snowmen. At rest time
// they go home and stay inside until morning; a wild boar within 10 tiles sends them home for a quarter of a day.
// Children never wear paths: they wander off the roads on purpose and would trample the whole village into paths.
// Positions are tile coordinates (floats, tile centre at +0.5). Paths are found once per trip, never every frame.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];
export const emptyChildrenState=()=>({kids:[],hidden:{},snowmen:[],alarmDay:null,seq:0});

export class ChildrenSystem {
  constructor(scene,{random=Math.random}={}){
    this.scene=scene;this.random=random;this.children=new Map();this.listeners=new Set();this.syncIn=0;this.dangerIn=0;this.shoreCache=new Map();this.dev=null;
    this.importState(emptyChildrenState());
  }
  get day(){return this.scene.gameTime?.dayDuration??120000;}
  now(){return this.scene.gameTime?.totalElapsed??0;}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const l of this.listeners)l();}
  registry(){return this.scene.objectRegistry;}
  isHouse(b){return !!b&&buildingIsComplete(b)&&!!this.registry()?.get?.(b.type)?.housing;}
  greens(){return (this.scene.buildings??[]).filter(b=>b.type==='village_green'&&buildingIsComplete(b));}
  center(b){const d=buildingDefinition(b);return {x:b.x+d.width/2,y:b.y+d.height/2};}
  distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  // Residents per house from the stored homes (#58 B).
  residentsByHouse(homes=this.scene.needs?.homes?.()??new Map()){
    const out=new Map();for(const [id,h]of homes)if(h?.kind==='house'){if(!out.has(h.buildingId))out.set(h.buildingId,[]);out.get(h.buildingId).push(id);}return out;
  }
  isFamily(house,homes){return (this.residentsByHouse(homes).get(house?.id)?.length??0)>=CHILDREN.familyMin;}
  // Happiness from a Village Green: +4 for a house whose centre is within 10 tiles of a green's centre, +2 more for a
  // family house. More greens never add more.
  greenBonus(house,homes){
    if(!this.isHouse(house))return {near:0,family:0};const c=this.center(house);
    if(!this.greens().some(g=>this.distance(this.center(g),c)<=VILLAGE_GREEN.range))return {near:0,family:0};
    return {near:VILLAGE_GREEN.happiness,family:this.isFamily(house,homes)?VILLAGE_GREEN.familyBonus:0};
  }
  housesInRange(green){const c=this.center(green);return (this.scene.buildings??[]).filter(b=>this.isHouse(b)&&this.distance(this.center(b),c)<=VILLAGE_GREEN.range);}
  nearestGreen(point,reach=CHILDREN.greenReach){let best=null,bestD=Infinity;for(const g of this.greens()){const d=this.distance(this.center(g),point);if(d<=reach&&d<bestD){best=g;bestD=d;}}return best;}
  childrenOf(houseId){return [...this.children.values()].filter(c=>c.houseId===houseId);}
  playingAt(greenId){return [...this.children.values()].filter(c=>c.state==='out'&&c.activity?.greenId===greenId).length;}
  feast(){return (this.scene.policy?.feastBonus?.()??0)>0;}
  restWindow(){
    const g=this.scene.gameTime;if(!isRestTime(g))return null;const start=g.dayDuration*.75,part=(g.elapsed-start)/(g.dayDuration-start);
    return {evening:part<VILLAGE_GREEN.eveningFraction};
  }

  // --- families ------------------------------------------------------------------------------------------------
  home(child){return (this.scene.buildings??[]).find(b=>b.id===child.houseId)??null;}
  door(house,from){
    const map=this.scene.map,tiles=towerNeighbors(house).filter(p=>map?.[p.y]?.[p.x]===0);if(!tiles.length)return null;
    if(!from)return tiles[0];return tiles.reduce((a,b)=>this.distance(a,from)<=this.distance(b,from)?a:b);
  }
  families(){
    if(this.dev){const homes=[...(this.scene.buildings??[]).filter(b=>this.isHouse(b))];const castle=this.scene.buildings?.find(b=>b.type==='castle');if(!homes.length&&castle)homes.push(castle);
      return homes.map(h=>({houseId:h.id,count:Math.ceil(this.dev.count/homes.length)}));}
    const out=[];for(const [houseId,residents]of [...this.residentsByHouse()].sort((a,b)=>a[0]-b[0])){const house=(this.scene.buildings??[]).find(b=>b.id===houseId);if(!this.isHouse(house))continue;
      const count=childCount(houseId,residents.length);if(count)out.push({houseId,count});}
    return out;
  }
  sync(){
    const wanted=allocateChildren(this.families(),this.dev?Math.min(CHILDREN.max,this.dev.count):CHILDREN.max),keep=new Set();let changed=false;
    for(const [houseId,count]of wanted)for(let i=0;i<count;i++){const id=`child-${houseId}-${i}`;keep.add(id);if(!this.children.has(id)){this.children.set(id,this.newChild(houseId,i));changed=true;}
      else if(this.children.get(id).state==='leaving'){this.children.get(id).state='out';this.children.get(id).activity=null;}}
    for(const child of [...this.children.values()]){if(keep.has(child.id))continue;
      // The family moved out: children inside simply go; those outside walk home and disappear (no message).
      if(child.state==='inside'||!this.home(child)){this.children.delete(child.id);changed=true;}else if(child.state!=='leaving'){child.state='leaving';child.activity=null;this.goTo(child,this.door(this.home(child),child));}}
    if(changed)this.changed();
  }
  newChild(houseId,index){
    const r=seeded(hashOf('child',houseId,index)),sex=r()<.5?'boy':'girl',names=CHILDREN.names[sex],[a,b]=CHILDREN.ages;
    const house=(this.scene.buildings??[]).find(h=>h.id===houseId),door=house?this.door(house):null,p=door??(house?this.center(house):{x:0,y:0});
    return {id:`child-${houseId}-${index}`,houseId,index,sex,name:names[Math.floor(r()*names.length)],age:a+Math.floor(r()*(b-a+1)),look:Math.floor(r()*6),
      x:p.x+.5,y:p.y+.5,state:'inside',activity:null,path:[],local:null,emergeAt:null,facing:{x:0,y:1}};
  }

  // --- update --------------------------------------------------------------------------------------------------
  update(delta){
    if(!this.scene.map)return;
    this.syncIn-=delta;if(this.syncIn<=0){this.syncIn=CHILDREN.syncMs;this.sync();this.meltSnowmen();}
    this.dangerIn-=delta;if(this.dangerIn<=0){this.dangerIn=CHILDREN.danger.checkMs;this.checkDanger();}
    const seconds=delta/1000,now=this.now(),rest=this.restWindow(),feastEvening=!!rest?.evening&&this.feast();
    for(const child of [...this.children.values()]){
      const house=this.home(child);if(!house){this.children.delete(child.id);this.changed();continue;}
      if(child.state==='leaving'){if(this.walk(child,seconds,CHILDREN.speed)){this.children.delete(child.id);this.changed();}continue;}
      const hidden=(this.hidden.get(child.houseId)??-Infinity)>now,stayOut=feastEvening&&this.nearestGreen(this.center(house));
      const goHome=hidden||rest&&!stayOut;
      if(child.state==='inside'){
        if(goHome||!this.outsideToday(child)){child.emergeAt=null;continue;}
        if(child.emergeAt==null){const [a,b]=CHILDREN.emergeSeconds;child.emergeAt=now+(a+this.random()*(b-a))*1000;}
        if(now<child.emergeAt)continue;
        const door=this.door(house);if(!door)continue;child.x=door.x+.5;child.y=door.y+.5;child.state='out';child.activity=null;child.emergeAt=null;this.changed();continue;
      }
      if(goHome||child.state==='out'&&!this.outsideToday(child)){
        if(child.state!=='home'&&child.state!=='fleeing'){child.state='home';child.activity=null;child.local=null;this.goTo(child,this.door(house,child));}
        if(this.walk(child,seconds,child.state==='fleeing'?CHILDREN.runSpeed:CHILDREN.speed)){child.state='inside';child.path=[];this.changed();}
        continue;
      }
      if(child.state==='home'||child.state==='fleeing'){child.state='out';child.activity=null;}
      if(feastEvening&&child.activity&&!child.activity.greenId)child.activity=null;
      if(!child.activity||now>=child.activity.until){this.finish(child);this.choose(child,house,feastEvening);}
      if(child.path.length){this.walk(child,seconds,CHILDREN.speed);continue;}
      this.play(child,seconds);
    }
  }
  // Winter: about half of the children stay in, a different half each day.
  outsideToday(child){if(this.scene.seasons?.season!=='Winter')return true;return seeded(hashOf('winter',child.id,this.scene.gameTime?.day??1))()<CHILDREN.winterOutside;}
  choose(child,house,feast=false){
    const season=this.scene.seasons?.season,c=this.center(house),[a,b]=CHILDREN.activitySeconds,pick=list=>list[Math.floor(this.random()*list.length)];
    const until=this.now()+(a+this.random()*(b-a))*1000,green=this.nearestGreen(c);let activity=null;
    if(green&&(feast||this.random()<CHILDREN.greenChance)){const tiles=this.greenTiles(green),spot=tiles[Math.floor(this.random()*tiles.length)];
      activity={kind:season==='Winter'?pick(CHILDREN.activities.snow):pick(CHILDREN.activities.green),center:spot,greenId:green.id,until};}
    else if(season==='Summer'&&this.random()<CHILDREN.shoreChance){const spots=this.shoreSpots(house);if(spots.length)activity={kind:'shore',center:spots[Math.floor(this.random()*spots.length)],until};}
    if(!activity){const spot=this.spotNear(c,CHILDREN.homeRadius,house);activity={kind:season==='Winter'?pick(CHILDREN.activities.snow):pick(CHILDREN.activities.house),center:spot??this.door(house,child)??{x:Math.floor(child.x),y:Math.floor(child.y)},until};}
    child.activity=activity;child.local=null;this.goTo(child,activity.center);
  }
  finish(child){
    const a=child.activity;if(!a||a.kind!=='snowman'||this.scene.seasons?.season!=='Winter'||this.snowmen.length>=CHILDREN.snowman.max||this.random()>=CHILDREN.snowman.chance)return;
    if(this.snowmen.some(s=>Math.hypot(s.x-a.center.x,s.y-a.center.y)<2))return;
    this.snowmen.push({id:`snowman-${++this.seq}`,x:a.center.x+.5,y:a.center.y+.5,variant:this.seq%2});this.changed();
  }
  meltSnowmen(){if(this.snowmen.length&&this.scene.seasons?.season!=='Winter'){this.snowmen=[];this.changed();}}
  greenTiles(green){const d=buildingDefinition(green),out=[];for(let y=green.y;y<green.y+d.height;y++)for(let x=green.x;x<green.x+d.width;x++)if(this.scene.map[y]?.[x]===0)out.push({x,y});return out.length?out:[{x:green.x,y:green.y}];}
  spotNear(c,radius,house){
    const map=this.scene.map;for(let i=0;i<30;i++){const a=this.random()*Math.PI*2,r=1.5+this.random()*(radius-1.5),x=Math.floor(c.x+Math.cos(a)*r),y=Math.floor(c.y+Math.sin(a)*r);
      if(map[y]?.[x]===0&&!this.inside(house,x,y))return {x,y};}
    return null;
  }
  inside(b,x,y){const d=buildingDefinition(b);return x>=b.x&&x<b.x+d.width&&y>=b.y&&y<b.y+d.height;}
  // Walkable tiles beside water within 12 tiles of the house (cached for a while). Children never step into the water.
  shoreSpots(house){
    const cached=this.shoreCache.get(house.id);if(cached&&cached.at>this.now())return cached.spots;
    const s=this.scene,c=this.center(house),r=CHILDREN.waterRange,spots=[];
    for(let y=Math.floor(c.y-r);y<=c.y+r;y++)for(let x=Math.floor(c.x-r);x<=c.x+r;x++){
      if(s.map[y]?.[x]!==0||Math.hypot(x+.5-c.x,y+.5-c.y)>r)continue;
      if(SIDES.some(([dx,dy])=>isWaterGround(s.groundGrid?.[y+dy]?.[x+dx])))spots.push({x,y});
    }
    this.shoreCache.set(house.id,{at:this.now()+this.day,spots});return spots;
  }
  goTo(child,tile){
    if(!tile){child.path=[];return;}const from={x:clamp(Math.floor(child.x),0,COLUMNS-1),y:clamp(Math.floor(child.y),0,ROWS-1)};
    const path=from.x===tile.x&&from.y===tile.y?[]:findPath(this.scene.map,from,tile);child.path=path?path.filter(p=>p.x!==from.x||p.y!==from.y):[{...tile}];
  }
  // Walks along the path; true once it is done.
  walk(child,seconds,speed){
    let left=speed*seconds;
    while(left>0&&child.path.length){const next=child.path[0],tx=next.x+.5,ty=next.y+.5,dx=tx-child.x,dy=ty-child.y,d=Math.hypot(dx,dy);
      if(d<=left){child.x=tx;child.y=ty;child.path.shift();left-=d;if(d)child.facing={x:dx,y:dy};}else{child.x+=dx/d*left;child.y+=dy/d*left;child.facing={x:dx,y:dy};left=0;}}
    child.moving=left<speed*seconds;return !child.path.length;
  }
  // Short hops around the activity spot (no path search): chasing, rolling a hoop, kicking a ball, the swing.
  play(child,seconds){
    const a=child.activity,c={x:a.center.x+.5,y:a.center.y+.5},map=this.scene.map;child.moving=false;
    if(['swing','snowman','snowball'].includes(a.kind)&&!child.local){child.facing={x:0,y:1};return;}
    const radius={tag:1.8,hoop:1.3,ball:1.5,shore:1.2,snowball:1,snowman:.6}[a.kind]??1.2,speed=a.kind==='tag'?CHILDREN.runSpeed:a.kind==='hoop'?CHILDREN.speed*1.2:CHILDREN.speed*.8;
    if(!child.local||Math.hypot(child.local.x-child.x,child.local.y-child.y)<.08){
      child.wait=(child.wait??0)-seconds;if(child.wait>0)return;
      let target=null;for(let i=0;i<6&&!target;i++){const ang=a.kind==='hoop'?Math.atan2(child.y-c.y,child.x-c.x)+.9:this.random()*Math.PI*2,r=a.kind==='hoop'?radius:this.random()*radius,x=c.x+Math.cos(ang)*r,y=c.y+Math.sin(ang)*r;
        if(map[Math.floor(y)]?.[Math.floor(x)]===0)target={x,y};}
      child.local=target??{x:c.x,y:c.y};child.wait=a.kind==='tag'||a.kind==='hoop'?0:.4+this.random()*1.2;
    }
    const dx=child.local.x-child.x,dy=child.local.y-child.y,d=Math.hypot(dx,dy),step=speed*seconds;
    if(d<=step){child.x=child.local.x;child.y=child.local.y;}else{child.x+=dx/d*step;child.y+=dy/d*step;}
    if(d)child.facing={x:dx,y:dy};child.moving=d>.02;
  }
  // A wild boar within 10 tiles: the children around run home and stay in for a quarter of a day (one notice a day).
  checkDanger(){
    const boars=[...(this.scene.animalSystem?.animals?.values?.()??[])].filter(a=>a.isAlive!==false&&a.definition?.id==='wild_boar');if(!boars.length)return;
    const now=this.now(),R=CHILDREN.danger.radius;let fled=false;
    for(const child of this.children.values()){
      if(!['out','home'].includes(child.state))continue;
      const near=boars.some(b=>{const p=b.position??b.tile;return p&&Math.hypot((p.x+(b.position?0:.5))-child.x,(p.y+(b.position?0:.5))-child.y)<=R;});if(!near)continue;
      this.hidden.set(child.houseId,now+CHILDREN.danger.hideDays*this.day);child.state='fleeing';child.activity=null;child.local=null;this.goTo(child,this.door(this.home(child),child));fled=true;
    }
    if(fled){
      for(const child of this.children.values())if(child.state==='out'&&(this.hidden.get(child.houseId)??-Infinity)>now){child.state='fleeing';child.activity=null;child.local=null;this.goTo(child,this.door(this.home(child),child));}
      const day=this.scene.gameTime?.day??1;if(this.alarmDay!==day){this.alarmDay=day;this.scene.eventFeed?.push?.(`children-boar:${day}`,t('children.feed.boar'));}this.changed();
    }
  }

  // --- evening on the green (DailyRest asks) -------------------------------------------------------------------
  // In the first part of rest time a few residents living in range of a green sit there before going home; during a
  // Feast everyone with a home gathers on the nearest green. Purely cosmetic: they rest as if at home.
  eveningSeat(worker){
    const rest=this.restWindow();if(!rest?.evening)return null;const greens=this.greens();if(!greens.length)return null;
    const day=this.scene.gameTime?.day??1,feast=this.feast(),key=`${day}:${feast}:${greens.map(g=>g.id).join(',')}`;
    if(this.seatsKey!==key){this.seatsKey=key;this.seats=this.assignSeats(greens,feast);}
    return this.seats.get(worker.id)??null;
  }
  assignSeats(greens,feast){
    const homes=this.scene.needs?.homes?.()??new Map(),seats=new Map(),byGreen=new Map(greens.map(g=>[g.id,[]]));
    const ids=[...homes.keys()].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
    for(const id of ids){const h=homes.get(id),house=h?.kind==='house'?this.scene.buildings.find(b=>b.id===h.buildingId):null,castle=this.scene.buildings.find(b=>b.type==='castle');
      const from=house?this.center(house):castle&&h?.kind==='settlement'?this.center(castle):null;if(!from)continue;
      const green=feast?this.nearestGreen(from,Infinity):greens.find(g=>this.distance(this.center(g),from)<=VILLAGE_GREEN.range);if(!green)continue;
      const list=byGreen.get(green.id);if(!feast&&list.length>=VILLAGE_GREEN.eveningSeats)continue;list.push(id);}
    for(const green of greens){const tiles=[...this.greenTiles(green),...towerNeighbors(green).filter(p=>this.scene.map[p.y]?.[p.x]===0)];byGreen.get(green.id).forEach((id,i)=>seats.set(id,tiles[i%tiles.length]));}
    return seats;
  }

  // --- clicks, save ----------------------------------------------------------------------------------------------
  atPoint(x,y){let best=null;for(const c of this.children.values()){const v=c.view;if(!v||!v.visible)continue;const d=Math.hypot(v.x-x,v.y-10-y);if(d<14&&(!best||v.depth>best.view.depth))best=c;}return best;}
  setDev(count){this.dev=count?{count:Math.min(CHILDREN.max,count)}:null;this.syncIn=0;}
  exportState(){
    const round=v=>Math.round(v*100)/100;
    return {kids:[...this.children.values()].map(c=>({id:c.id,x:round(c.x),y:round(c.y),state:c.state==='leaving'?'leaving':c.state==='inside'?'inside':'out'})),
      hidden:Object.fromEntries([...this.hidden].filter(([,until])=>until>this.now()).map(([id,until])=>[String(id),until])),snowmen:this.snowmen.map(s=>({...s})),alarmDay:this.alarmDay,seq:this.seq};
  }
  // Which children exist follows from the homes again (deterministic); the saved part keeps them where they were.
  importState(state){
    state={...emptyChildrenState(),...(state??{})};this.children=new Map();this.hidden=new Map(Object.entries(state.hidden).map(([id,until])=>[Number(id),until]));
    this.snowmen=state.snowmen.map(s=>({...s}));this.alarmDay=state.alarmDay;this.seq=state.seq;this.saved=new Map(state.kids.map(k=>[k.id,k]));this.syncIn=0;
    if(this.scene.map&&this.scene.buildings){this.sync();this.restore();}
  }
  restore(){
    if(!this.saved?.size)return;for(const c of this.children.values()){const k=this.saved.get(c.id);if(!k)continue;c.x=k.x;c.y=k.y;c.state=k.state==='leaving'?'leaving':k.state;if(c.state==='leaving')this.goTo(c,this.door(this.home(c),c));}
    this.saved=null;
  }
  destroy(){this.listeners.clear();for(const c of this.children.values()){c.view?.destroy?.();c.view=null;}}
}

export function validateChildrenState(c,{check,number,integer,array,buildingIds,time=Number.MAX_SAFE_INTEGER}){
  check(c&&typeof c==='object'&&Object.keys(c).sort().join()==='alarmDay,hidden,kids,seq,snowmen');integer(c.seq,0);
  array(c.kids,CHILDREN.max*4);const ids=new Set();
  for(const k of c.kids){check(k&&typeof k.id==='string'&&/^child-\d+-\d+$/.test(k.id)&&!ids.has(k.id));ids.add(k.id);number(k.x,0,COLUMNS);number(k.y,0,ROWS);check(['inside','out','leaving'].includes(k.state));}
  check(c.hidden&&typeof c.hidden==='object'&&!Array.isArray(c.hidden));for(const [id,until]of Object.entries(c.hidden)){check(buildingIds.has(Number(id)));number(until,0);}
  array(c.snowmen,CHILDREN.snowman.max);for(const sm of c.snowmen){check(sm&&typeof sm.id==='string'&&[0,1].includes(sm.variant));number(sm.x,0,COLUMNS);number(sm.y,0,ROWS);}
  check(c.alarmDay===null||Number.isInteger(c.alarmDay)&&c.alarmDay>=1);
}
