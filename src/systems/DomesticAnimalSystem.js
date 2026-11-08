import { RATS,CATS,DOGS,ratLevel,tameChance,HOUSE_RATS,RAT_BUILDINGS } from '../data/domesticAnimals.js';
import { FOOD_RESOURCE_IDS } from '../data/foodProduction.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { PLAYER_START,COLUMNS,ROWS } from '../game/config.js';
import { t } from '../i18n/index.js';
import { MOVEMENT_SPEED_SCALE } from '../data/movement.js';

// Domestic animals Z1 (brief zadani-domaci-zvirata.md): rats breed in every store that holds food (Granary, Starter
// Stockpile, the food buffers of food buildings) and eat part of the stock; cats keep them down. A cat is not a
// subject: no needs, eats nothing from the stores, never dies. Cats come as strays (Take in), from caravans
// (30 Gold) or as kittens. Positions are tile coordinates (floats); cats walk straight lines around their home.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const emptyDomesticState=()=>({seq:0,rats:{},loss:{},notified:{},cats:[],nextStrayAt:null,caravanCats:null,dogs:[],nextDogAt:null,caravanDog:null});
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
  // m-zvirata-2 (52): rats in Houses with no assigned cat within HOUSE_RATS.catRadius tiles for HOUSE_RATS.afterDays.
  houseHasRats(house){const since=this.houseRats?.get(house?.id);return since!=null&&this.now()-since>=HOUSE_RATS.afterDays*this.day;}
  housesWithRats(){return (this.scene.buildings??[]).filter(b=>this.isHouse(b)&&this.houseHasRats(b));}
  updateHouseRats(){
    this.houseRats??=new Map();this.houseRatsNotified??=new Set();const now=this.now(),keep=new Set();
    const guards=[...this.cats.values()].filter(c=>c.buildingId!=null&&c.state!=='kitten').map(c=>this.scene.buildings?.find(b=>b.id===c.buildingId)).filter(Boolean);
    for(const b of this.scene.buildings??[]){
      if(!this.isHouse(b)||!buildingIsComplete(b))continue;keep.add(b.id);
      const cx=b.x+(b.tiles?.length?Math.sqrt(b.tiles.length)/2:1),cy=b.y+(b.tiles?.length?Math.sqrt(b.tiles.length)/2:1);
      const covered=guards.some(g=>Math.hypot(g.x-cx,g.y-cy)<=HOUSE_RATS.catRadius);
      if(covered){this.houseRats.delete(b.id);this.houseRatsNotified.delete(b.id);continue;}
      if(!this.houseRats.has(b.id))this.houseRats.set(b.id,now);
      if(this.houseHasRats(b)&&!this.houseRatsNotified.has(b.id)){this.houseRatsNotified.add(b.id);this.feed(`rats:house:${b.id}:${Math.floor(now/this.day)}`,t('pets.feed.houseRats'),false,b);}
    }
    for(const id of [...this.houseRats.keys()])if(!keep.has(id))this.houseRats.delete(id);
  }
  catAtHome(house){return !!house&&this.isHouse(house)&&this.catsAt(house.id).length>0;}
  // m-zvirata-3 (71): rat buildings – complete buildings listed in RAT_BUILDINGS plus any other that keeps food in
  // its own store. Rats live in their food locations; a cat can live at each of them.
  ratBuildings(){
    const ids=new Set(this.foodLocations().map(l=>l.buildingId).filter(id=>id!=null));
    return (this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&(ids.has(b.id)||RAT_BUILDINGS.includes(b.type)));
  }
  // Buildings a cat can live at: rat buildings and houses (one cat per house).
  homes(){
    const ids=new Set(this.ratBuildings().map(b=>b.id)),list=[];
    for(const b of this.scene.buildings??[])if(buildingIsComplete(b)&&(ids.has(b.id)||this.isHouse(b)))list.push(b);
    return list.sort((a,b)=>this.buildingRats(b.id)-this.buildingRats(a.id)||a.id-b.id);
  }
  canHome(building,cat=null){return !!building&&this.homes().some(b=>b.id===building.id)&&!(this.isHouse(building)&&this.catsAt(building.id).some(c=>c!==cat));}
  // Kingdom cat cap: 1 + rat buildings (and the camp food store while it exists) + Houses.
  cap(){const camp=this.foodLocations().some(l=>l.buildingId==null)?1:0;return 1+camp+this.ratBuildings().length+(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&this.isHouse(b)).length;}
  lossPerDay(locationId){const l=this.storage?.locations.get(locationId);return l?this.foodStored(l)*RATS.loss[ratLevel(this.ratsAt(locationId))]:0;}
  status(buildingId){const rats=this.buildingRats(buildingId),loss=this.buildingLocations(buildingId).reduce((n,l)=>n+this.lossPerDay(l.id),0);return {rats:Math.round(rats),level:ratLevel(rats),loss:Math.round(loss*10)/10,cats:this.catsAt(buildingId).length,needed:this.catsNeeded(buildingId)};}

  update(delta){
    if(!(delta>0)||!this.storage)return;const days=delta/this.day;let dirty=false;this.updateHouseRats();
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
    this.updateCats(delta);this.updateStray();this.updateKittens();this.updateCaravan();this.updateDogs(delta);
    if(dirty)this.scene.updateInventory?.();
  }
  buildingName(id){const b=this.scene.buildings?.find(b=>b.id===id);return b?(this.scene.objectRegistry?.get?.(b.type)?.name??b.type):t('pets.stockpile');}
  feed(key,text,important=false,target=null){this.scene.eventFeed?.push(key,text,{important,target});}
  anchor(cat){
    if(cat.buildingId!=null){const b=this.scene.buildings?.find(b=>b.id===cat.buildingId);if(b){const d=buildingDefinition(b);return {x:b.x+d.width/2,y:b.y+d.height+.6,lodge:true};}}
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
  step(cat,target,distance){distance*=MOVEMENT_SPEED_SCALE;const dx=target.x-cat.x,dy=target.y-cat.y,d=Math.hypot(dx,dy);if(d<=distance||!d){cat.x=target.x;cat.y=target.y;}else{cat.x+=dx/d*distance;cat.y+=dy/d*distance;}cat.facing={x:dx,y:dy};}
  newCat(fields){const id=`cat-${++this.seq}`,cat={id,name:CATS.names[(this.seq-1)%CATS.names.length],x:PLAYER_START.x,y:PLAYER_START.y,buildingId:null,state:'stray',leaveAt:null,leaving:false,kittenAt:null,motherId:null,home:null,target:null,wait:0,...fields};this.cats.set(id,cat);this.changed();return cat;}
  // A stray at the edge of the village: about every 4 days, every 2 when a store has Many rats; one at a time.
  updateStray(){
    const now=this.now(),rats=this.foodLocations().some(l=>this.ratsAt(l.id)>=RATS.levels[2][1]);
    const interval=(rats?CATS.stray.ratIntervalDays:CATS.stray.intervalDays)*this.day;
    // m-zvirata-2: before any cat has come the first one is due on day 1–2.
    if(this.nextStrayAt==null&&!this.cats.size&&!this.firstCatDone&&now<CATS.stray.firstDays[1]*this.day){const [a,b]=CATS.stray.firstDays;this.nextStrayAt=Math.max(now,(a+this.random()*(b-a))*this.day);}
    if(this.nextStrayAt==null||rats&&this.nextStrayAt>now+interval)this.nextStrayAt=now+interval*(.6+this.random()*.8);
    for(const cat of this.cats.values())if(cat.state==='stray'&&cat.leaveAt!=null&&now>=cat.leaveAt&&!cat.leaving)this.leave(cat);
    if(now<this.nextStrayAt)return;
    this.nextStrayAt=null;if([...this.cats.values()].some(c=>c.state==='stray'&&c.leaveAt!=null))return;
    if(this.cats.size>=this.cap())return;
    const spot=this.straySpot();if(!spot)return;
    const cat=this.newCat({x:spot.x+.5,y:spot.y+.5,home:{x:spot.x+.5,y:spot.y+.5},state:'stray',leaveAt:now+CATS.stray.stayDays*this.day});this.firstCatDone=true;
    this.feed(`cat:stray:${cat.id}`,t('pets.feed.stray',{name:cat.name}),false,()=>this.cats.get(cat.id)??cat);
  }
  straySpot(){
    const map=this.scene.map,[lo,hi]=CATS.stray.distance;
    for(let i=0;i<200;i++){const a=this.random()*Math.PI*2,r=lo+this.random()*(hi-lo),x=Math.round(PLAYER_START.x+Math.cos(a)*r),y=Math.round(PLAYER_START.y+Math.sin(a)*r);if(map?.[y]?.[x]===0)return {x,y};}
    return null;
  }
  leave(cat){
    const dx=cat.x-PLAYER_START.x,dy=cat.y-PLAYER_START.y,d=Math.hypot(dx,dy)||1;cat.leaving=true;cat.target={x:cat.x+dx/d*60,y:cat.y+dy/d*60};const dog=cat.id.startsWith('dog-');this.feed(`${dog?'dog':'cat'}:left:${cat.id}`,t(dog?'pets.dog.feed.left':'pets.feed.left',{name:cat.name}));this.changed();
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
  // ---- Z2: hunting dogs ----
  hunters(){return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.profession==='hunter'&&w.isAlive);}
  dogOf(worker){return [...this.dogs.values()].find(d=>d.hunterId===worker?.id)??null;}
  freeHunters(){return this.hunters().filter(h=>!this.dogOf(h));}
  huntingLevel(worker){return worker?.skills?.hunting?.level??1;}
  // A dog helps its Hunter only while healthy and close.
  activeDog(worker){const d=this.dogOf(worker);if(!d||d.injuredUntil!=null||!worker?.position)return null;return Math.hypot(d.x-worker.position.x,d.y-worker.position.y)<=DOGS.closeEnough?d:null;}
  tracks(worker,tile){const d=this.dogOf(worker);return !!d&&d.injuredUntil==null&&Math.hypot(d.x-tile.x,d.y-tile.y)<=DOGS.trackRadius;}
  // Any healthy owned dog within tracking range: the animal shows as a faint outline under Fog of War.
  tracked(animal){for(const d of this.dogs.values())if(d.hunterId!=null&&d.injuredUntil==null&&Math.hypot(d.x-animal.position.x,d.y-animal.position.y)<=DOGS.trackRadius)return true;return false;}
  // Combat: an animal attacking a Hunter with his dog close bites the dog first.
  shield(target,attacker){if(!attacker||!this.scene.animalSystem?.animals?.has?.(attacker.id))return null;const d=this.activeDog(target);if(!d)return null;return {absorb:amount=>{d.hp=Math.max(0,d.hp-amount);if(d.hp<=0)this.injure(d);}};}
  injure(dog){dog.injuredUntil=this.now()+DOGS.healDays*this.day;dog.hp=0;this.feed(`dog:hurt:${dog.id}:${Math.floor(this.now())}`,t('pets.dog.feed.hurt',{name:dog.name}));this.changed();}
  lodge(dog){
    const hunter=this.scene.workerSystem?.workers?.get(dog.hunterId),b=hunter?.assignedWorkplaceId!=null?this.scene.buildings?.find(b=>b.id===hunter.assignedWorkplaceId):(this.scene.buildings??[]).find(b=>b.type==='hunting_lodge'&&buildingIsComplete(b));
    if(b){const d=buildingDefinition(b);return {x:b.x+d.width/2,y:b.y+d.height+.6,lodge:true};}return {x:PLAYER_START.x+.5,y:PLAYER_START.y+3};
  }
  newDog(fields){const id=`dog-${++this.seq}`,dog={id,name:DOGS.names[(this.seq-1)%DOGS.names.length],x:PLAYER_START.x,y:PLAYER_START.y,hunterId:null,state:'unassigned',hp:DOGS.maxHP,injuredUntil:null,leaveAt:null,leaving:false,tried:false,tamerId:null,home:null,target:null,...fields};this.dogs.set(id,dog);this.changed();return dog;}
  updateDogs(delta){
    const now=this.now(),seconds=delta/1000,workers=this.scene.workerSystem?.workers;
    for(const dog of [...this.dogs.values()]){
      if(dog.hunterId!=null){const h=workers?.get(dog.hunterId);if(!h||!h.isAlive||h.profession!=='hunter'){dog.hunterId=null;dog.state='unassigned';this.feed(`dog:free:${dog.id}:${Math.floor(now)}`,t('pets.dog.feed.unassigned',{name:dog.name}));this.changed();}}
      if(dog.injuredUntil!=null){dog.hp=Math.min(DOGS.maxHP,dog.hp+DOGS.maxHP*seconds*1000/(DOGS.healDays*this.day));if(now>=dog.injuredUntil){dog.injuredUntil=null;dog.hp=DOGS.maxHP;this.changed();}}
      if(dog.leaving){this.step(dog,dog.target,DOGS.speed*seconds);if(dog.x<0||dog.y<0||dog.x>COLUMNS||dog.y>ROWS||Math.hypot(dog.x-dog.target.x,dog.y-dog.target.y)<.2){this.dogs.delete(dog.id);this.changed();}continue;}
      if(dog.state==='caravan'){const c=this.scene.caravans?.active;if(!c||this.caravanDog?.dogId!==dog.id){this.dogs.delete(dog.id);this.changed();continue;}const p=c.position??c.tile??{x:dog.x,y:dog.y};this.step(dog,{x:p.x+1.2,y:p.y+.6},DOGS.speed*seconds);continue;}
      if(dog.state==='stray'){
        if(dog.tamerId!=null){const h=workers?.get(dog.tamerId);if(!h?.isAlive||h.profession!=='hunter'||this.dogOf(h)){dog.tamerId=null;continue;}
          this.step(dog,h.position,DOGS.speed*seconds);if(Math.hypot(dog.x-h.position.x,dog.y-h.position.y)<=DOGS.tame.meetDistance)this.tryTame(dog,h);continue;}
        if(dog.leaveAt!=null&&now>=dog.leaveAt){this.leave(dog);continue;}
        this.wander(dog,dog.home,seconds);continue;
      }
      const h=dog.hunterId!=null?workers?.get(dog.hunterId):null;
      if(h&&dog.injuredUntil==null&&h.position){const home=this.lodge(dog);if(this.atLodge(h,home))this.lodgeIdle(dog,home,seconds);else this.roam(dog,h.position,seconds);}
      else{dog.sitting=false;this.wander(dog,this.lodge(dog),seconds);}
    }
    // Hunters run faster and hit harder with their dog close.
    for(const h of this.hunters()){const d=this.activeDog(h);h.speedFactor=d?DOGS.huntSpeed:1;h.damageFactor=d?DOGS.huntDamage:1;}
    // A stray dog near the castle about every 6 days (one at a time); it stays 2–3 days.
    if(this.nextDogAt==null&&!this.dogs.size&&now<DOGS.stray.firstDays[1]*this.day){const [a,b]=DOGS.stray.firstDays;this.nextDogAt=Math.max(now,(a+this.random()*(b-a))*this.day);}
    if(this.nextDogAt==null)this.nextDogAt=now+DOGS.stray.intervalDays*this.day*(.6+this.random()*.8);
    if(now>=this.nextDogAt){this.nextDogAt=null;if(![...this.dogs.values()].some(d=>d.state==='stray')){const [lo,hi]=DOGS.stray.distance,spot=this.spotNear(lo,hi);
      if(spot){const [a,b]=DOGS.stray.stayDays,dog=this.newDog({x:spot.x+.5,y:spot.y+.5,home:{x:spot.x+.5,y:spot.y+.5},state:'stray',leaveAt:now+(a+this.random()*(b-a))*this.day});this.feed(`dog:stray:${dog.id}`,t('pets.dog.feed.stray',{name:dog.name}),false,()=>this.dogs.get(dog.id)??dog);}}}
    // Caravans: about one in three brings a hunting dog as an escort (120 Gold).
    const c=this.scene.caravans?.active;
    if(!c){if(this.caravanDog){this.caravanDog=null;this.changed();}}
    else if(this.caravanDog?.caravanId!==c.id){let dogId=null;if(this.random()<DOGS.caravanChance){const p=c.position??c.tile??{x:0,y:0};dogId=this.newDog({x:p.x+1,y:p.y+.5,state:'caravan'}).id;}this.caravanDog={caravanId:c.id,dogId};this.changed();}
  }
  atLodge(hunter,home){return !!home?.lodge&&Math.hypot(hunter.position.x-home.x,hunter.position.y-home.y)<=DOGS.atLodge.radius;}
  // Following: a random spot in a small circle around the Hunter, changed every second or few, with short pauses
  // to sniff; a dog left behind runs to catch up.
  roam(dog,center,seconds){
    const R=DOGS.roam,range=(a)=>a[0]+this.random()*(a[1]-a[0]);dog.sitting=false;dog.mode='roam';
    const d=Math.hypot(dog.x-center.x,dog.y-center.y);
    if(d>R.catchUp){dog.offset=null;dog.wait=0;this.step(dog,{x:center.x+(dog.x-center.x)/d*R.radius*.6,y:center.y+(dog.y-center.y)/d*R.radius*.6},DOGS.speed*1.6*seconds);return;}
    dog.retargetIn=(dog.retargetIn??0)-seconds;
    const target=dog.offset?{x:clamp(center.x+dog.offset.x,.5,COLUMNS-.5),y:clamp(center.y+dog.offset.y,.5,ROWS-.5)}:null;
    if(target&&Math.hypot(dog.x-target.x,dog.y-target.y)<.12){dog.target=null;dog.wait=(dog.wait??range(R.pause))-seconds;if(dog.wait>0&&dog.retargetIn>0)return;dog.offset=null;}
    if(!dog.offset||dog.retargetIn<=0){const a=this.random()*Math.PI*2,r=(.45+this.random()*.55)*R.radius;dog.offset={x:Math.cos(a)*r,y:Math.sin(a)*r};dog.retargetIn=range(R.retarget);dog.wait=range(R.pause);}
    dog.target={x:clamp(center.x+dog.offset.x,.5,COLUMNS-.5),y:clamp(center.y+dog.offset.y,.5,ROWS-.5)};this.step(dog,dog.target,DOGS.speed*seconds);
  }
  // At the lodge: sit by the door; after a while run a few quick rounds around it and sit again.
  lodgeIdle(dog,home,seconds){
    const L=DOGS.atLodge,range=(a)=>a[0]+this.random()*(a[1]-a[0]),seat={x:home.x+.7,y:home.y+.2};
    if(dog.mode!=='lodge'){dog.mode='lodge';dog.rounds=0;dog.target={...seat};dog.sitting=false;dog.sitFor=range(L.sit);}
    if(dog.target){this.step(dog,dog.target,DOGS.speed*(dog.rounds>0?L.runSpeed:1)*seconds);if(Math.hypot(dog.x-dog.target.x,dog.y-dog.target.y)>.1)return;
      if(dog.rounds>0){dog.rounds--;const a=this.random()*Math.PI*2,r=(.5+this.random()*.5)*L.runRadius;dog.target=dog.rounds>0?{x:clamp(home.x+Math.cos(a)*r,.5,COLUMNS-.5),y:clamp(home.y+Math.sin(a)*r,.5,ROWS-.5)}:{...seat};return;}
      dog.target=null;dog.sitting=true;dog.facing={x:0,y:1};return;}
    dog.sitFor-=seconds;if(dog.sitFor>0)return;
    dog.sitting=false;dog.rounds=Math.round(range(L.rounds));dog.sitFor=range(L.sit);const a=this.random()*Math.PI*2;dog.target={x:clamp(home.x+Math.cos(a)*L.runRadius,.5,COLUMNS-.5),y:clamp(home.y+Math.sin(a)*L.runRadius,.5,ROWS-.5)};
  }
  wander(animal,home,seconds){
    if(!home)return;const far=Math.hypot(animal.x-home.x,animal.y-home.y)>CATS.wanderRadius+1.5;
    if(far)animal.target={...home};else if(!animal.target||Math.hypot(animal.x-animal.target.x,animal.y-animal.target.y)<.15){animal.wait=(animal.wait??0)-seconds;if(animal.wait>0)return;const a=this.random()*Math.PI*2,r=this.random()*CATS.wanderRadius;animal.target={x:clamp(home.x+Math.cos(a)*r,.5,COLUMNS-.5),y:clamp(home.y+Math.sin(a)*r,.5,ROWS-.5)};animal.wait=1+this.random()*4;}
    this.step(animal,animal.target,DOGS.speed*.5*seconds);
  }
  spotNear(lo,hi){const map=this.scene.map;for(let i=0;i<200;i++){const a=this.random()*Math.PI*2,r=lo+this.random()*(hi-lo),x=Math.round(PLAYER_START.x+Math.cos(a)*r),y=Math.round(PLAYER_START.y+Math.sin(a)*r);if(map?.[y]?.[x]===0)return {x,y};}return null;}
  // "Try to tame": the stray runs to the chosen Hunter; when they meet, one try decides.
  startTaming(dogId,hunterId){
    const dog=this.dogs.get(dogId),h=this.scene.workerSystem?.workers?.get(hunterId);
    if(!dog||dog.state!=='stray'||dog.tried||dog.leaving||!h||h.profession!=='hunter'||this.dogOf(h))return false;
    dog.tamerId=h.id;this.changed();return true;
  }
  tryTame(dog,hunter){
    dog.tried=true;dog.tamerId=null;const chance=tameChance(this.huntingLevel(hunter)),ok=this.random()<chance;
    if(ok){dog.state='owned';dog.hunterId=hunter.id;dog.leaveAt=null;dog.home=null;this.scene.skillSystem?.addXP?.(hunter,'hunting',DOGS.tame.xp);this.feed(`dog:tamed:${dog.id}`,t('pets.dog.feed.tamed',{name:dog.name,hunter:hunter.name??''}),true);}
    else{this.feed(`dog:fled:${dog.id}`,t('pets.dog.feed.fled',{name:dog.name}));this.leave(dog);}
    this.changed();return ok;
  }
  assignDog(dogId,hunterId){
    const dog=this.dogs.get(dogId),h=this.scene.workerSystem?.workers?.get(hunterId);
    if(!dog||!['owned','unassigned'].includes(dog.state)||!h||h.profession!=='hunter'||(this.dogOf(h)&&this.dogOf(h)!==dog))return false;
    dog.hunterId=h.id;dog.state='owned';this.changed();return true;
  }
  dogForSale(){const c=this.scene.caravans?.active;return c&&c.phase==='trading'&&this.caravanDog?.caravanId===c.id&&this.caravanDog.dogId&&this.dogs.has(this.caravanDog.dogId)?this.dogs.get(this.caravanDog.dogId):null;}
  buyDog(hunterId){
    const dog=this.dogForSale(),c=this.scene.caravans?.active,h=this.scene.workerSystem?.workers?.get(hunterId);
    if(!dog)return {ok:false,error:'noDog'};if(!h||h.profession!=='hunter'||this.dogOf(h))return {ok:false,error:'hunter'};
    if(this.scene.inventory.count('gold')<DOGS.price||!this.scene.inventory.spend('gold',DOGS.price,{source:'Trade Purchase'}))return {ok:false,error:'gold'};
    c.gold+=DOGS.price;this.caravanDog.dogId=null;dog.state='owned';dog.hunterId=h.id;this.changed();this.scene.updateInventory?.();return {ok:true,dog};
  }
  atPoint(x,y){let best=null;for(const cat of [...this.cats.values(),...this.dogs.values()]){const v=cat.view;if(!v||!v.visible)continue;const d=Math.hypot(v.x-x,v.y-6-y);if(d<16&&(!best||v.depth>best.view.depth))best=cat;}return best;}
  exportState(){
    const round=v=>Math.round(v*1000)/1000;
    return {seq:this.seq,rats:Object.fromEntries([...this.rats].map(([k,v])=>[k,round(v)])),loss:Object.fromEntries([...this.loss].map(([k,v])=>[k,round(v)])),notified:Object.fromEntries(this.notified),
      cats:[...this.cats.values()].map(c=>({id:c.id,name:c.name,x:round(c.x),y:round(c.y),buildingId:c.buildingId,state:c.state,leaveAt:c.leaveAt,leaving:c.leaving,kittenAt:c.kittenAt,motherId:c.motherId,home:c.home?{x:round(c.home.x),y:round(c.home.y)}:null,target:c.target?{x:round(c.target.x),y:round(c.target.y)}:null})),
      nextStrayAt:this.nextStrayAt,caravanCats:this.caravanCats?{...this.caravanCats}:null,
      dogs:[...this.dogs.values()].map(d=>({id:d.id,name:d.name,x:round(d.x),y:round(d.y),hunterId:d.hunterId,state:d.state,hp:round(d.hp),injuredUntil:d.injuredUntil,leaveAt:d.leaveAt,leaving:d.leaving,tried:d.tried,tamerId:d.tamerId,home:d.home?{x:round(d.home.x),y:round(d.home.y)}:null,target:d.target?{x:round(d.target.x),y:round(d.target.y)}:null})),
      nextDogAt:this.nextDogAt,caravanDog:this.caravanDog?{...this.caravanDog}:null,
      ...(this.houseRats?.size?{houseRats:Object.fromEntries([...this.houseRats].map(([k,v])=>[String(k),v]))}:{})};
  }
  importState(state){
    const s=state??emptyDomesticState();this.seq=s.seq??0;this.rats=new Map(Object.entries(s.rats??{}));this.loss=new Map(Object.entries(s.loss??{}));this.notified=new Map(Object.entries(s.notified??{}));
    for(const cat of this.cats?.values()??[])cat.view?.destroy?.();
    this.cats=new Map((s.cats??[]).map(c=>[c.id,{...c,wait:0}]));this.nextStrayAt=s.nextStrayAt??null;this.caravanCats=s.caravanCats?{...s.caravanCats}:null;
    for(const dog of this.dogs?.values()??[])dog.view?.destroy?.();this.dogs=new Map((s.dogs??[]).map(d=>[d.id,{...d,wait:0}]));this.nextDogAt=s.nextDogAt??null;this.caravanDog=s.caravanDog?{...s.caravanDog}:null;
    this.houseRats=new Map(Object.entries(s.houseRats??{}).map(([k,v])=>[Number(k),v]));this.houseRatsNotified=new Set([...this.houseRats.keys()].filter(id=>this.houseHasRats({id})));this.changed();
  }
  destroy(){for(const cat of [...this.cats.values(),...this.dogs.values()])cat.view?.destroy?.();this.listeners.clear();}
}
// Save validation (schema 52).
export function validateDomesticState(d,{check,number,integer,array,day,buildingIds,locationIds,workerIds=new Set(),time}){
  check(d&&typeof d==='object'&&['caravanCats,caravanDog,cats,dogs,loss,nextDogAt,nextStrayAt,notified,rats,seq','caravanCats,caravanDog,cats,dogs,houseRats,loss,nextDogAt,nextStrayAt,notified,rats,seq'].includes(Object.keys(d).sort().join()));integer(d.seq,0);
  if(d.houseRats!==undefined){check(d.houseRats&&typeof d.houseRats==='object'&&!Array.isArray(d.houseRats));for(const [id,since] of Object.entries(d.houseRats)){check(buildingIds.has(Number(id)));number(since,0);}}
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
  array(d.dogs,200);const dogIds=new Set();
  for(const g of d.dogs){
    check(g&&typeof g.id==='string'&&/^dog-\d+$/.test(g.id)&&Number(g.id.slice(4))<=d.seq&&!dogIds.has(g.id));dogIds.add(g.id);check(typeof g.name==='string'&&g.name.length<=40);
    number(g.x,-100,COLUMNS+100);number(g.y,-100,ROWS+100);check(['stray','owned','unassigned','caravan'].includes(g.state)&&typeof g.leaving==='boolean'&&typeof g.tried==='boolean');
    check((g.state==='owned')===(g.hunterId!==null));if(g.hunterId!==null)check(workerIds.has(g.hunterId));if(g.tamerId!==null)check(g.state==='stray'&&workerIds.has(g.tamerId));
    number(g.hp,0,DOGS.maxHP);for(const k of ['injuredUntil','leaveAt'])if(g[k]!==null)number(g[k],0);
    for(const k of ['home','target'])if(g[k]!==null){check(g[k]&&typeof g[k]==='object');number(g[k].x,-100,COLUMNS+100);number(g[k].y,-100,ROWS+100);}
  }
  if(new Set(d.dogs.filter(g=>g.hunterId!==null).map(g=>g.hunterId)).size!==d.dogs.filter(g=>g.hunterId!==null).length)check(false);
  if(d.nextDogAt!==null)number(d.nextDogAt,0);
  if(d.caravanDog!==null){check(typeof d.caravanDog.caravanId==='string');check(d.caravanDog.dogId===null||dogIds.has(d.caravanDog.dogId));}
  void day;void time;
}
