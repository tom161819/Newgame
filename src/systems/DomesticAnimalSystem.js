import { RATS,CATS,ratLevel } from '../data/domesticAnimals.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { PLAYER_START,COLUMNS,ROWS } from '../game/config.js';
import { t } from '../i18n/index.js';

// Domestic animals Z1 (brief zadani-domaci-zvirata.md): rats breed in every store that holds food (Granary, Starter
// Stockpile, the food buffers of food buildings) and eat part of the stock; cats keep them down. A cat is not a
// subject: no needs, eats nothing from the stores, never dies. Cats come as strays (Take in), from caravans
// (30 Gold) or as kittens. Positions are tile coordinates (floats); cats walk straight lines around their home.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const emptyDomesticState=()=>({seq:0,rats:{},loss:{},notified:{},cats:[],nextStrayAt:null,caravanCats:null});
export class DomesticAnimalSystem {
  constructor(scene,{random=Math.random}={}){
    this.scene=scene;this.random=random;this.listeners=new Set();this.importState(emptyDomesticState());
  }
  get day(){return this.scene.gameTime?.dayDuration??120000;}
  now(){return this.scene.gameTime?.totalElapsed??0;}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const l of this.listeners)l();}
  get storage(){return this.scene.foodStorage;}
  // Stores rats live in: stock locations and food buffers whose allowed goods include food.
  foodLocations(){
    const out=[];for(const l of this.storage?.locations.values()??[]){
      if(!['storage','fallback','input','output'].includes(l.kind)||!l.allowed?.some(id=>FOOD_RESOURCE_IDS.includes(id)))continue;
      const b=l.buildingId==null?null:this.scene.buildings?.find(b=>b.id===l.buildingId);if(l.buildingId!=null&&(!b||!buildingIsComplete(b)))continue;out.push(l);
    }
    return out;
  }
  foodStored(l){return FOOD_RESOURCE_IDS.reduce((n,id)=>n+(l.stock[id]??0),0);}
  ratsAt(locationId){return this.rats.get(locationId)??0;}
  // Rats of a building: the worst of its food locations.
  buildingRats(buildingId){let worst=0;for(const l of this.foodLocations())if(l.buildingId===buildingId)worst=Math.max(worst,this.ratsAt(l.id));return worst;}
  buildingLocations(buildingId){return this.foodLocations().filter(l=>l.buildingId===buildingId);}
  catsAt(buildingId){return [...this.cats.values()].filter(c=>c.buildingId===buildingId);}
  // One cat per 120 food of capacity; the Starter Stockpile mixes food with materials, so there only its food counts.
  catsNeeded(buildingId){const capacity=this.buildingLocations(buildingId).reduce((n,l)=>n+(l.kind==='fallback'?this.foodStored(l):l.capacity),0);return Math.max(1,Math.ceil(capacity/CATS.capacityPerCat));}
  isHouse(building){return !!this.scene.objectRegistry?.get?.(building?.type)?.housing;}
  catAtHome(house){return !!house&&this.isHouse(house)&&this.catsAt(house.id).length>0;}
  // Buildings a cat can live at: food stores and houses (one cat per house).
  homes(){
    const ids=new Set(this.foodLocations().map(l=>l.buildingId).filter(id=>id!=null)),list=[];
    for(const b of this.scene.buildings??[])if(buildingIsComplete(b)&&(ids.has(b.id)||this.isHouse(b)))list.push(b);
    return list.sort((a,b)=>this.buildingRats(b.id)-this.buildingRats(a.id)||a.id-b.id);
  }
  canHome(building,cat=null){return !!building&&this.homes().some(b=>b.id===building.id)&&!(this.isHouse(building)&&this.catsAt(building.id).some(c=>c!==cat));}
  cap(){return 1+new Set(this.foodLocations().map(l=>l.buildingId)).size+(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&this.isHouse(b)).length;}
  lossPerDay(locationId){const l=this.storage?.locations.get(locationId);return l?this.foodStored(l)*RATS.loss[ratLevel(this.ratsAt(locationId))]:0;}
  status(buildingId){const rats=this.buildingRats(buildingId),loss=this.buildingLocations(buildingId).reduce((n,l)=>n+this.lossPerDay(l.id),0);return {rats:Math.round(rats),level:ratLevel(rats),loss:Math.round(loss*10)/10,cats:this.catsAt(buildingId).length,needed:this.catsNeeded(buildingId)};}

  update(delta){
    if(!(delta>0)||!this.storage)return;const days=delta/this.day;let dirty=false;
    for(const l of this.foodLocations()){
      const cats=l.buildingId==null?0:this.catsAt(l.buildingId).filter(c=>!c.walking).length,cover=cats?Math.min(1,cats/this.catsNeeded(l.buildingId)):0;
      const stored=this.foodStored(l),fill=l.capacity?stored/l.capacity:0,before=this.ratsAt(l.id);let pop=before;
      if(cover>=1)pop-=CATS.catch*days;
      else{let growth=stored>0?RATS.base+RATS.growth*fill:-RATS.emptyDecay;if(cover>0&&growth>0)growth*=.5;pop+=growth*days;}
      pop=clamp(pop,0,RATS.max);this.rats.set(l.id,pop);
      // Losses run continuously: whole units leave when a share adds up; reserved goods are never eaten.
      let acc=(this.loss.get(l.id)??0)+stored*RATS.loss[ratLevel(pop)]*days;
      while(acc>=1){const id=RATS.lossOrder.find(r=>this.storage.free(l.id,r)>0);if(!id){acc=0;break;}this.storage.withdraw(l.id,id,1);this.scene.inventory?.ledger?.expense?.(id,1,RATS.ledgerSource);acc-=1;dirty=true;}
      this.loss.set(l.id,acc);
      const level=ratLevel(pop),last=this.notified.get(l.id)??'none';
      if((level==='many'||level==='infestation')&&level!==last&&(level==='infestation'||last!=='infestation')){this.notified.set(l.id,level);this.feed(`rats:${l.id}:${level}:${Math.floor(this.now()/this.day)}`,t(`pets.feed.${level}`,{building:this.buildingName(l.buildingId)}),level==='infestation');}
      else if(level==='none'||level==='few')this.notified.set(l.id,'none');
    }
    for(const id of [...this.rats.keys()])if(!this.storage.locations.has(id)){this.rats.delete(id);this.loss.delete(id);this.notified.delete(id);}
    this.updateCats(delta);this.updateStray();this.updateKittens();this.updateCaravan();
    if(dirty)this.scene.updateInventory?.();
  }
  buildingName(id){const b=this.scene.buildings?.find(b=>b.id===id);return b?(this.scene.objectRegistry?.get?.(b.type)?.name??b.type):t('pets.stockpile');}
  feed(key,text,important=false){this.scene.eventFeed?.push(key,text,{important});}
  anchor(cat){
    if(cat.buildingId!=null){const b=this.scene.buildings?.find(b=>b.id===cat.buildingId);if(b){const d=buildingDefinition(b);return {x:b.x+d.width/2,y:b.y+d.height+.6};}}
    if(cat.motherId!=null){const m=this.cats.get(cat.motherId);if(m)return {x:m.x,y:m.y};}
    return cat.home??{x:cat.x,y:cat.y};
  }
  updateCats(delta){
    const seconds=delta/1000;
    for(const cat of [...this.cats.values()]){
      if(cat.buildingId!=null&&!this.scene.buildings?.some(b=>b.id===cat.buildingId&&buildingIsComplete(b))){cat.buildingId=null;cat.state='stray';cat.home={x:cat.x,y:cat.y};cat.leaveAt=null;}
      if(cat.leaving){const edge=cat.target;this.step(cat,edge,CATS.stray.leaveSpeed*seconds);if(cat.x<0||cat.y<0||cat.x>COLUMNS||cat.y>ROWS||Math.hypot(cat.x-edge.x,cat.y-edge.y)<.2){this.cats.delete(cat.id);this.changed();}continue;}
      const home=this.anchor(cat),far=Math.hypot(cat.x-home.x,cat.y-home.y)>CATS.wanderRadius+1.5;
      cat.walking=far&&cat.buildingId!=null;
      if(far){cat.target={...home};}
      else if(!cat.target||Math.hypot(cat.x-cat.target.x,cat.y-cat.target.y)<.15){cat.wait=(cat.wait??0)-seconds;if(cat.wait>0)continue;const a=this.random()*Math.PI*2,r=this.random()*CATS.wanderRadius;cat.target={x:clamp(home.x+Math.cos(a)*r,.5,COLUMNS-.5),y:clamp(home.y+Math.sin(a)*r,.5,ROWS-.5)};cat.wait=1+this.random()*4;}
      this.step(cat,cat.target,CATS.speed*seconds*(far?1.6:1));
    }
  }
  step(cat,target,distance){const dx=target.x-cat.x,dy=target.y-cat.y,d=Math.hypot(dx,dy);if(d<=distance||!d){cat.x=target.x;cat.y=target.y;}else{cat.x+=dx/d*distance;cat.y+=dy/d*distance;}cat.facing={x:dx,y:dy};}
  newCat(fields){const id=`cat-${++this.seq}`,cat={id,name:CATS.names[(this.seq-1)%CATS.names.length],x:PLAYER_START.x,y:PLAYER_START.y,buildingId:null,state:'stray',leaveAt:null,leaving:false,kittenAt:null,motherId:null,home:null,target:null,wait:0,...fields};this.cats.set(id,cat);this.changed();return cat;}
  // A stray at the edge of the village: about every 4 days, every 2 when a store has Many rats; one at a time.
  updateStray(){
    const now=this.now(),rats=this.foodLocations().some(l=>this.ratsAt(l.id)>=RATS.levels[2][1]);
    const interval=(rats?CATS.stray.ratIntervalDays:CATS.stray.intervalDays)*this.day;
    if(this.nextStrayAt==null||rats&&this.nextStrayAt>now+interval)this.nextStrayAt=now+interval*(.6+this.random()*.8);
    for(const cat of this.cats.values())if(cat.state==='stray'&&cat.leaveAt!=null&&now>=cat.leaveAt&&!cat.leaving)this.leave(cat);
    if(now<this.nextStrayAt)return;
    this.nextStrayAt=null;if([...this.cats.values()].some(c=>c.state==='stray'&&c.leaveAt!=null))return;
    if(this.cats.size>=this.cap())return;
    const spot=this.straySpot();if(!spot)return;
    const cat=this.newCat({x:spot.x+.5,y:spot.y+.5,home:{x:spot.x+.5,y:spot.y+.5},state:'stray',leaveAt:now+CATS.stray.stayDays*this.day});
    this.feed(`cat:stray:${cat.id}`,t('pets.feed.stray',{name:cat.name}));
  }
  straySpot(){
    const map=this.scene.map,[lo,hi]=CATS.stray.distance;
    for(let i=0;i<200;i++){const a=this.random()*Math.PI*2,r=lo+this.random()*(hi-lo),x=Math.round(PLAYER_START.x+Math.cos(a)*r),y=Math.round(PLAYER_START.y+Math.sin(a)*r);if(map?.[y]?.[x]===0)return {x,y};}
    return null;
  }
  leave(cat){
    const dx=cat.x-PLAYER_START.x,dy=cat.y-PLAYER_START.y,d=Math.hypot(dx,dy)||1;cat.leaving=true;cat.target={x:cat.x+dx/d*60,y:cat.y+dy/d*60};this.feed(`cat:left:${cat.id}`,t('pets.feed.left',{name:cat.name}));this.changed();
  }
  // "Take in" / "Reassign": always works; the cat walks to its new home.
  assign(catId,buildingId){
    const cat=this.cats.get(catId),building=this.scene.buildings?.find(b=>b.id===buildingId);
    if(!cat||cat.leaving||!this.canHome(building,cat))return false;
    cat.buildingId=building.id;cat.state='home';cat.leaveAt=null;cat.motherId=null;cat.home=null;cat.target=null;
    cat.kittenAt??=this.now()+CATS.kitten.everyDays*this.day;this.changed();return true;
  }
  // Kittens: a cat living at a store or house with a house within 8 tiles may have one every 10 days (50 %).
  updateKittens(){
    const now=this.now();
    for(const cat of [...this.cats.values()]){
      if(cat.state!=='home'||cat.kittenAt==null||now<cat.kittenAt)continue;cat.kittenAt=now+CATS.kitten.everyDays*this.day;
      const b=this.scene.buildings?.find(b=>b.id===cat.buildingId);if(!b||this.random()>=CATS.kitten.chance||this.cats.size>=this.cap())continue;
      const house=(this.scene.buildings??[]).some(h=>buildingIsComplete(h)&&this.isHouse(h)&&Math.hypot(h.x-b.x,h.y-b.y)<=CATS.kitten.houseDistance);if(!house)continue;
      const kitten=this.newCat({x:cat.x,y:cat.y,state:'kitten',motherId:cat.id});
      this.feed(`cat:kitten:${kitten.id}`,t('pets.feed.kitten',{name:kitten.name,mother:cat.name}),true);
    }
  }
  // Caravans: Food and General merchants sometimes bring a cat or two (30 Gold, not resold).
  updateCaravan(){
    const c=this.scene.caravans?.active;if(!c){if(this.caravanCats){this.caravanCats=null;this.changed();}return;}
    if(this.caravanCats?.caravanId===c.id)return;
    const range=CATS.merchants[c.type];let count=0;if(range&&this.random()<CATS.merchantChance)count=range[0]+Math.floor(this.random()*(range[1]-range[0]+1));
    this.caravanCats={caravanId:c.id,count};this.changed();
  }
  catsForSale(){const c=this.scene.caravans?.active;return c&&c.phase==='trading'&&this.caravanCats?.caravanId===c.id?this.caravanCats.count:0;}
  buyCat(buildingId){
    const c=this.scene.caravans?.active,building=this.scene.buildings?.find(b=>b.id===buildingId),market=c?this.scene.buildings?.find(b=>b.id===c.marketplaceId):null;
    if(!this.catsForSale())return {ok:false,error:'noCat'};if(!this.canHome(building))return {ok:false,error:'home'};
    if(this.scene.inventory.count('gold')<CATS.price)return {ok:false,error:'gold'};
    if(!this.scene.inventory.spend('gold',CATS.price,{source:'Trade Purchase'}))return {ok:false,error:'gold'};
    c.gold+=CATS.price;this.caravanCats.count--;
    const d=market?buildingDefinition(market):null,cat=this.newCat({x:market?market.x+d.width/2:c.tile?.x??PLAYER_START.x,y:market?market.y+d.height+.5:c.tile?.y??PLAYER_START.y,state:'home'});
    this.assign(cat.id,buildingId);this.scene.updateInventory?.();return {ok:true,cat};
  }
  atPoint(x,y){let best=null;for(const cat of this.cats.values()){const v=cat.view;if(!v||!v.visible)continue;const d=Math.hypot(v.x-x,v.y-6-y);if(d<16&&(!best||v.depth>best.view.depth))best=cat;}return best;}
  exportState(){
    const round=v=>Math.round(v*1000)/1000;
    return {seq:this.seq,rats:Object.fromEntries([...this.rats].map(([k,v])=>[k,round(v)])),loss:Object.fromEntries([...this.loss].map(([k,v])=>[k,round(v)])),notified:Object.fromEntries(this.notified),
      cats:[...this.cats.values()].map(c=>({id:c.id,name:c.name,x:round(c.x),y:round(c.y),buildingId:c.buildingId,state:c.state,leaveAt:c.leaveAt,leaving:c.leaving,kittenAt:c.kittenAt,motherId:c.motherId,home:c.home?{x:round(c.home.x),y:round(c.home.y)}:null,target:c.target?{x:round(c.target.x),y:round(c.target.y)}:null})),
      nextStrayAt:this.nextStrayAt,caravanCats:this.caravanCats?{...this.caravanCats}:null};
  }
  importState(state){
    const s=state??emptyDomesticState();this.seq=s.seq??0;this.rats=new Map(Object.entries(s.rats??{}));this.loss=new Map(Object.entries(s.loss??{}));this.notified=new Map(Object.entries(s.notified??{}));
    for(const cat of this.cats?.values()??[])cat.view?.destroy?.();
    this.cats=new Map((s.cats??[]).map(c=>[c.id,{...c,wait:0}]));this.nextStrayAt=s.nextStrayAt??null;this.caravanCats=s.caravanCats?{...s.caravanCats}:null;this.changed();
  }
  destroy(){for(const cat of this.cats.values())cat.view?.destroy?.();this.listeners.clear();}
}
// Save validation (schema 52).
export function validateDomesticState(d,{check,number,integer,array,day,buildingIds,locationIds,time}){
  check(d&&typeof d==='object'&&Object.keys(d).sort().join()==='caravanCats,cats,loss,nextStrayAt,notified,rats,seq');integer(d.seq,0);
  for(const [id,v]of Object.entries(d.rats)){check(locationIds.has(id));number(v,0,RATS.max);}
  for(const [id,v]of Object.entries(d.loss)){check(locationIds.has(id));number(v,0,1);}
  for(const [id,v]of Object.entries(d.notified)){check(locationIds.has(id)&&['none','many','infestation'].includes(v));}
  array(d.cats,500);const ids=new Set();
  for(const c of d.cats){
    check(c&&typeof c.id==='string'&&/^cat-\d+$/.test(c.id)&&Number(c.id.slice(4))<=d.seq&&!ids.has(c.id));ids.add(c.id);check(typeof c.name==='string'&&c.name.length<=40);
    number(c.x,-100,COLUMNS+100);number(c.y,-100,ROWS+100);check(['stray','home','kitten'].includes(c.state)&&typeof c.leaving==='boolean');
    check(c.buildingId===null||buildingIds.has(c.buildingId));check((c.state==='home')===(c.buildingId!==null));
    for(const k of ['leaveAt','kittenAt'])if(c[k]!==null)number(c[k],0);
    for(const k of ['home','target'])if(c[k]!==null){check(c[k]&&typeof c[k]==='object');number(c[k].x,-100,COLUMNS+100);number(c[k].y,-100,ROWS+100);}
  }
  for(const c of d.cats)if(c.motherId!==null)check(typeof c.motherId==='string');
  if(d.nextStrayAt!==null)number(d.nextStrayAt,0);
  if(d.caravanCats!==null){check(typeof d.caravanCats.caravanId==='string');integer(d.caravanCats.count,0,5);}
  void day;void time;
}
