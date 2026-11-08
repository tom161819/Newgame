import { NIGHT_THREATS } from '../data/nightThreats.js';
import { buildingDefinition,buildingIsComplete,buildingTiles,placementError,campfireWood,towerNeighbors } from '../game/buildings.js';
import { removeBuildingShell } from '../game/buildingRemoval.js';
import { adjacentTiles } from '../game/interaction.js';
import { inAttackRange } from './CombatSystem.js';
import { isWalkable } from '../game/map.js';
import { isWaterGround } from '../data/worldTerrain.js';
import { worldToGrid } from '../game/isometric.js';
import { t } from '../i18n/index.js';

// Day and night N3: the switches of the night threats (wolves, thieves, fires; from the New Game setup, changeable in
// Settings) and the campfire. A campfire is built from local wood (a tree or a bush within 6 tiles) and costs nothing
// from the stores; it burns one night (at once if it is finished at night), then lies as ashes for a day and goes.
export const hasLocalWood=(scene,tile,range=NIGHT_THREATS.campfire.woodRange)=>campfireWood(scene,tile,range);
export class NightThreatSystem {
  constructor(scene,settings=scene.gameSettings){
    this.scene=scene;this.enabled={wolves:settings?.nightWolves!==false,thieves:settings?.nightThieves!==false,fires:settings?.nightFires!==false};
    this.campfires=new Map();this.listeners=new Set();this.wolfDay=null;this.wolvesNear=false;this.random=Math.random;
    this.thieves=new Map();this.thiefDay=null;this.reports=[];
    this.fires=new Map();this.fireDay=null;this.spreadIn=0;
  }
  onChange(l){this.listeners.add(l);return()=>this.listeners.delete(l);}
  changed(){for(const l of this.listeners)l();}
  setEnabled(id,value){if(!NIGHT_THREATS.ids.includes(id))return;this.enabled[id]=!!value;this.changed();}
  get dayNight(){return this.scene.dayNight;}
  dark(){const p=this.dayNight?.part();return p==='dusk'||p==='night';}
  // --- campfires --------------------------------------------------------------------------------------------------
  campfireState(b){return this.campfires.get(b.id)??null;}
  campfireBurning(b){const c=this.campfireState(b);return !!c&&c.litDay!=null&&c.ashesDay==null;}
  campfireAshes(b){return this.campfireState(b)?.ashesDay!=null;}
  updateCampfires(){
    const day=this.scene.gameTime?.day??1,part=this.dayNight?.part();
    for(const b of [...(this.scene.buildings??[])]){
      if(!buildingDefinition(b).campfire||!buildingIsComplete(b))continue;
      let c=this.campfires.get(b.id);if(!c){c={litDay:null,ashesDay:null};this.campfires.set(b.id,c);}
      if(c.litDay==null&&this.dark()){c.litDay=day;this.changed();}
      else if(c.litDay!=null&&c.ashesDay==null&&part==='day'){c.ashesDay=day;this.changed();}
      else if(c.ashesDay!=null&&day>c.ashesDay+NIGHT_THREATS.campfire.ashesDays-1&&part==='day'&&day>c.ashesDay){this.campfires.delete(b.id);removeBuildingShell(this.scene,b);this.scene.events?.emit?.('buildings:changed');this.changed();}
    }
    for(const id of this.campfires.keys())if(!this.scene.buildings.some(b=>b.id===id))this.campfires.delete(id);
  }
  // A soldier (or the King) makes a campfire on a free tile next to him with local wood; it is finished at once.
  makeCampfire(actor){
    const s=this.scene,d=s.objectRegistry.require('campfire'),origin=actor.tile;
    for(let r=1;r<=2;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const anchor={x:origin.x+dx,y:origin.y+dy};if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      if(placementError(s.map,anchor,{has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}},s.reservedTiles(),d,s.buildings))continue;
      const building={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:d.id,definition:d,...anchor,tiles:buildingTiles(anchor,d)};
      for(const t of building.tiles)s.map[t.y][t.x]=1;s.buildings.push(building);s.towerViews?.set(building.id,s.createBuildingView(d,building));s.events?.emit?.('buildings:changed');
      this.updateCampfires();return building;
    }
    return null;
  }
  // --- wolves ------------------------------------------------------------------------------------------------------
  wolves(){return [...(this.scene.animalSystem?.animals?.values?.()??[])].filter(a=>a.isAlive&&a.active!==false&&a.definition.gameplay.nightPredator);}
  // Burning lights wolves keep out of (a torch in a hand does not count).
  scaryLights(){return (this.scene.dayNight?.flameLights?.()??[]).filter(l=>l.workerId==null);}
  lit(tile,lights=this.scaryLights()){return lights.some(l=>Math.hypot(l.x-(tile.x+.5),l.y-(tile.y+.5))<=l.radius);}
  houses(){return (this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&this.scene.objectRegistry?.get?.(b.type)?.housing);}
  // At nightfall a pack may come (a roll per night, more often in winter) from far away at the map edge, outside light.
  spawnWolves(day){
    const W=NIGHT_THREATS.wolves,s=this.scene;this.wolfDay=day;if(!this.enabled.wolves||!s.animalSystem||!this.started())return [];
    const season=s.seasons?.enabled===false?'Summer':s.seasons?.season??'Summer';if(this.random()>=(W.chance[season]??.3))return [];
    const def=s.objectRegistry.require('wolf'),rows=s.map.length,cols=s.map[0].length,far=t=>[s.character?.tile,...this.houses()].filter(Boolean).every(p=>Math.hypot(p.x-t.x,p.y-t.y)>=W.spawnDistance);
    const lights=this.scaryLights(),taken=new Set((s.reservedTiles?.()??[]).map(t=>`${t.x},${t.y}`));let start=null;
    for(let i=0;i<300&&!start;i++){const side=Math.floor(this.random()*4),a=Math.floor(this.random()*(side%2?rows:cols)),d=Math.floor(this.random()*W.edge);
      const tile=side===0?{x:a,y:d}:side===1?{x:cols-1-d,y:a}:side===2?{x:a,y:rows-1-d}:{x:d,y:a};
      if(isWalkable(s.map,tile.x,tile.y)&&!taken.has(`${tile.x},${tile.y}`)&&far(tile)&&!this.lit(tile,lights))start=tile;}
    if(!start)return [];const [lo,hi]=W.pack,count=lo+Math.floor(this.random()*(hi-lo+1)),out=[];
    for(let r=0;r<4&&out.length<count;r++)for(let dy=-r;dy<=r&&out.length<count;dy++)for(let dx=-r;dx<=r&&out.length<count;dx++){
      const tile={x:start.x+dx,y:start.y+dy};if(!isWalkable(s.map,tile.x,tile.y)||taken.has(`${tile.x},${tile.y}`))continue;taken.add(`${tile.x},${tile.y}`);
      const wolf=s.animalSystem.create(def,tile);wolf.wolf={state:'hunting',repath:0,since:s.gameTime?.totalElapsed??0};out.push(wolf);}
    return out;
  }
  // Prey outdoors and out of light: wild animals, the King and residents who are not asleep inside a house.
  prey(lights){
    const s=this.scene,out=[];
    for(const a of s.animalSystem?.animals?.values?.()??[])if(a.isAlive&&a.active!==false&&!a.definition.gameplay.nightPredator&&a.definition.gameplay.huntable&&!a.mounted)out.push(a);
    if(s.character?.isAlive!==false&&s.character?.state==='ground')out.push(s.character);
    for(const w of s.workerSystem?.liveSubjects?.()??[])if(!(w.restPhase==='resting'&&s.needs?.homeOf?.(w)?.kind==='house'))out.push(w);
    return out.filter(p=>p.position&&!this.lit({x:Math.floor(p.position.x),y:Math.floor(p.position.y)},lights));
  }
  soldiersNear(wolf){const W=NIGHT_THREATS.wolves;return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.profession==='soldier'&&w.isAlive&&Math.hypot(w.position.x-wolf.position.x,w.position.y-wolf.position.y)<=W.fleeRange);}
  edgeGoal(wolf){
    const s=this.scene,rows=s.map.length,cols=s.map[0].length,{x,y}=wolf.tile,options=[{x:0,y},{x:cols-1,y},{x,y:0},{x,y:rows-1}];
    options.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));return options;
  }
  // Called by AnimalSystem for every wolf; true = handled this frame.
  leadsWolf(wolf,delta){
    const s=this.scene,W=NIGHT_THREATS.wolves,state=wolf.wolf??=({state:'hunting',repath:0,since:s.gameTime?.totalElapsed??0}),combat=s.combat;
    const part=s.dayNight?.part(),now=s.gameTime?.totalElapsed??0;
    const away=goal=>{combat?.stopAttack(wolf);wolf.retaliationTarget=null;state.target=null;state.repath-=delta;if(state.repath<=0||(!wolf.nextTile&&!wolf.path.length)){state.repath=W.repathMs*3;wolf.moveTo(goal);}};
    // Dawn: the pack leaves for the edge and is gone there (or after a while).
    if(part==='dawn'||part==='day'||state.state==='leaving'){
      if(state.state!=='leaving'){state.state='leaving';state.since=now;}
      const edge=this.edgeGoal(wolf);if(edge.some(t=>t.x===wolf.tile.x&&t.y===wolf.tile.y)||now-state.since>W.leaveMs){combat?.stopAttack(wolf);s.animalSystem.remove(wolf);return true;}
      away(edge.slice(0,2).map(t=>({x:Math.max(0,Math.min(s.map[0].length-1,t.x)),y:Math.max(0,Math.min(s.map.length-1,t.y))})));return true;
    }
    // Three or more soldiers close by: run.
    const soldiers=this.soldiersNear(wolf);
    if(soldiers.length>=W.fleeSoldiers){const cx=soldiers.reduce((n,w)=>n+w.position.x,0)/soldiers.length,cy=soldiers.reduce((n,w)=>n+w.position.y,0)/soldiers.length,dx=wolf.position.x-cx,dy=wolf.position.y-cy,l=Math.hypot(dx,dy)||1;
      away([{x:Math.round(wolf.tile.x+dx/l*8),y:Math.round(wolf.tile.y+dy/l*8)}].filter(t=>isWalkable(s.map,t.x,t.y)));return true;}
    const lights=this.scaryLights();
    // Standing in light (a torch was lit nearby): step out of it.
    if(this.lit(wolf.tile,lights)){const out=[];for(let r=1;r<8&&!out.length;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const t={x:wolf.tile.x+dx,y:wolf.tile.y+dy};if(isWalkable(s.map,t.x,t.y)&&!this.lit(t,lights))out.push(t);}away(out.slice(0,6));return true;}
    let target=state.target;
    if(!target?.isAlive||target.active===false||this.lit({x:Math.floor(target.position.x),y:Math.floor(target.position.y)},lights)||(target.restPhase==='resting'&&s.needs?.homeOf?.(target)?.kind==='house')){
      target=null;const prey=this.prey(lights).filter(p=>Math.hypot(p.position.x-wolf.position.x,p.position.y-wolf.position.y)<=W.huntRange&&!(state.avoid?.has(p.id)));
      prey.sort((a,b)=>Math.hypot(a.position.x-wolf.position.x,a.position.y-wolf.position.y)-Math.hypot(b.position.x-wolf.position.x,b.position.y-wolf.position.y));target=prey[0]??null;state.target=target;
    }
    if(!target){combat?.stopAttack(wolf);if(!wolf.nextTile&&!wolf.path.length){state.repath-=delta;if(state.repath<=0){state.repath=2500;const g={x:wolf.tile.x+Math.floor(this.random()*9)-4,y:wolf.tile.y+Math.floor(this.random()*9)-4};if(isWalkable(s.map,g.x,g.y)&&!this.lit(g,lights))wolf.moveTo([g]);}}return true;}
    if(combat?.canFight?.(target)!==false&&inAttackRange(wolf,target,s.map)){
      wolf.path=[];combat.startAttack(wolf,target);const dx=target.position.x-wolf.position.x,dy=target.position.y-wolf.position.y,l=Math.hypot(dx,dy);if(l&&!wolf.nextTile)wolf.direction={x:dx/l,y:dy/l};return true;
    }
    combat?.stopAttack(wolf);state.repath-=delta;
    if(state.repath<=0){state.repath=W.repathMs;wolf.moveTo(adjacentTiles(target,s.map));
      // Never into a light: give the target up for a while when the way goes through one.
      if(wolf.path.some(t=>this.lit(t,lights))){wolf.path=[];(state.avoid??=new Set()).add(target.id);state.target=null;}}
    return true;
  }
  // --- thieves -----------------------------------------------------------------------------------------------------
  // Kingdom happiness: the average of the residents (100 when nobody lives here yet).
  happiness(){return this.scene.needs?.summary?.()?.happiness??100;}
  // Unlit targets: stores (and the castle for its Gold) without a burning light within 6 tiles.
  thiefTargets(){
    const s=this.scene,storage=s.foodStorage,out=[];
    for(const l of storage?.locations?.values?.()??[]){if(!storage.isStock(l)||l.buildingId==null||!Object.values(l.stock).some(v=>v>0))continue;const c={x:l.x+l.width/2,y:l.y+l.height/2};if(s.dayNight?.darkAt?.(c))out.push({kind:'store',id:l.id,buildingId:l.buildingId,center:c});}
    const castle=(s.buildings??[]).find(b=>b.type==='castle'&&buildingIsComplete(b));if(castle&&(s.inventory?.count?.('gold')??0)>0){const d=buildingDefinition(castle),c={x:castle.x+d.width/2,y:castle.y+d.height/2};if(s.dayNight?.darkAt?.(c))out.push({kind:'castle',id:'castle',buildingId:castle.id,center:c});}
    return out;
  }
  thiefChance(targets=this.thiefTargets()){
    const T=NIGHT_THREATS.thieves;if(!targets.length)return 0;const h=this.happiness(),unhappy=Math.max(0,Math.min(1,(T.happyAt-h)/(T.happyAt-T.unhappyAt)));
    return T.maxChance*(.25+.75*unhappy)*(h>=T.happyAt?.5:1);
  }
  edgeTile(far,T){
    const s=this.scene,rows=s.map.length,cols=s.map[0].length;
    for(let i=0;i<300;i++){const side=Math.floor(this.random()*4),a=Math.floor(this.random()*(side%2?rows:cols)),d=Math.floor(this.random()*T.edge);
      const tile=side===0?{x:a,y:d}:side===1?{x:cols-1-d,y:a}:side===2?{x:a,y:rows-1-d}:{x:d,y:a};if(isWalkable(s.map,tile.x,tile.y)&&far(tile))return tile;}
    return null;
  }
  spawnThief(day){
    const T=NIGHT_THREATS.thieves,s=this.scene;this.thiefDay=day;if(!this.enabled.thieves||!s.workerSystem||!this.started())return null;
    const targets=this.thiefTargets();if(!targets.length||this.random()>=this.thiefChance(targets))return null;
    const target=targets[Math.floor(this.random()*targets.length)],start=this.edgeTile(t=>Math.hypot(t.x-target.center.x,t.y-target.center.y)>=T.spawnDistance,T);if(!start)return null;
    const thief=s.workerSystem.create(start,{isSubject:false,name:t('threats.thiefName')});thief.workState='Moving to Target';thief.workMessage='Sneaking';
    this.thieves.set(thief.id,{id:thief.id,state:'sneaking',target:{kind:target.kind,id:target.id,buildingId:target.buildingId},loot:null,pursuer:null,since:s.gameTime?.totalElapsed??0,repath:0});return thief;
  }
  thiefOf(worker){return this.thieves.get(worker?.id)??null;}
  removeThief(id){const w=this.scene.workerSystem?.workers.get(id);if(w){w.view?.destroy?.();this.scene.workerSystem.workers.delete(id);}this.thieves.delete(id);}
  steal(thief,state){
    const T=NIGHT_THREATS.thieves,s=this.scene,[lo,hi]=state.target.kind==='castle'?T.gold:T.goods,want=lo+Math.floor(this.random()*(hi-lo+1));
    if(state.target.kind==='castle'){const amount=Math.min(want,Math.floor(s.inventory.count('gold')));if(amount>0&&s.inventory.spend('gold',amount,{source:'Theft',id:`theft:${thief.id}`}))state.loot={resource:'gold',amount,from:'Castle'};}
    else{const l=s.foodStorage.locations.get(state.target.id);if(l){const [resource]=Object.entries(l.stock).filter(([r])=>s.foodStorage.free(l.id,r)>0).sort((a,b)=>b[1]-a[1])[0]??[];
      const amount=resource?Math.min(want,s.foodStorage.free(l.id,resource)):0;const b=s.buildings.find(x=>x.id===l.buildingId);
      if(amount>0&&s.foodStorage.withdraw(l.id,resource,amount)){s.resourceLedger?.expense(resource,amount,'Theft',{id:`theft:${thief.id}`,entityId:l.buildingId});state.loot={resource,amount,from:b?s.objectRegistry.require(b.type).name:'store'};}}}
    state.state='escaping';state.repath=0;
  }
  // A soldier sees the thief within his sight (a third at night outside light, full with a torch or in light).
  spotter(thief){
    const dn=this.scene.dayNight,lights=dn?.lights?.()??[];
    return (this.scene.workerSystem?.liveWorkers?.()??[]).find(w=>w.profession==='soldier'&&w.isAlive&&w.isSubject!==false&&Math.hypot(w.position.x-thief.position.x,w.position.y-thief.position.y)<=(w.definition.gameplay.baseSight/2)*(dn?dn.sightFactor(w.position,lights):1))??null;
  }
  caught(thief,state){
    const s=this.scene,loot=state.loot;
    if(loot?.resource==='gold')s.inventory.add('gold',loot.amount,{source:'Recovered from Thief',id:`recovered:${thief.id}`});
    else if(loot)s.dropSystem?.create(loot.resource,{x:thief.tile.x,y:thief.tile.y},loot.amount);
    this.reports.push({caught:true});this.removeThief(thief.id);s.eventFeed?.push?.(`thief-caught:${thief.id}`,t('threats.thiefCaught'),{important:true});
  }
  updateThieves(delta){
    const T=NIGHT_THREATS.thieves,s=this.scene,now=s.gameTime?.totalElapsed??0;
    for(const state of [...this.thieves.values()]){
      const thief=s.workerSystem?.workers.get(state.id);if(!thief){this.thieves.delete(state.id);continue;}
      const exit=()=>this.edgeGoal(thief).slice(0,2).map(p=>({x:Math.max(0,Math.min(s.map[0].length-1,p.x)),y:Math.max(0,Math.min(s.map.length-1,p.y))}));
      const atEdge=this.edgeGoal(thief).some(p=>p.x===thief.tile.x&&p.y===thief.tile.y);
      if(state.state!=='sneaking'&&(atEdge||now-state.since>T.escapeMs)){if(state.loot)this.reports.push({...state.loot});this.removeThief(state.id);continue;}
      // Seen by a soldier: he runs, the soldier chases him.
      if(state.state!=='fleeing'){const soldier=this.spotter(thief);if(soldier){state.state='fleeing';state.pursuer=soldier.id;state.repath=0;}}
      if(state.state==='fleeing'){const p=s.workerSystem.workers.get(state.pursuer);if(p?.isAlive&&Math.hypot(p.position.x-thief.position.x,p.position.y-thief.position.y)<=T.catchRange){this.caught(thief,state);continue;}}
      state.repath-=delta;if(state.repath>0&&(thief.nextTile||thief.path.length))continue;state.repath=T.repathMs;
      if(state.state==='sneaking'){
        const b=s.buildings.find(x=>x.id===state.target.buildingId);if(!b){state.state='escaping';continue;}
        const goals=towerNeighbors(b).filter(g=>isWalkable(s.map,g.x,g.y));if(goals.some(g=>g.x===thief.tile.x&&g.y===thief.tile.y)&&!thief.nextTile&&!thief.path.length){this.steal(thief,state);continue;}
        thief.moveTo(goals);
      }else thief.moveTo(exit());
    }
  }
  // A soldier chasing a thief runs after him (called after his own AI step).
  pursue(worker){
    if(worker?.profession!=='soldier')return;const state=[...this.thieves.values()].find(st=>st.state==='fleeing'&&st.pursuer===worker.id);if(!state)return;
    const thief=this.scene.workerSystem.workers.get(state.id);if(!thief)return;const now=this.scene.gameTime?.totalElapsed??0;
    if((worker.pursueAt??0)>now)return;worker.pursueAt=now+NIGHT_THREATS.thieves.repathMs;worker.moveTo(adjacentTiles(thief,this.scene.map));worker.workMessage='Chasing a thief';
  }
  reportMorning(day){
    if(!this.reports.length)return;const stolen=this.reports.filter(r=>!r.caught);
    for(const r of stolen)this.scene.eventFeed?.push?.(`theft:${day}:${r.from}:${r.resource}`,t('threats.stolen',{amount:r.amount,resource:this.scene.objectRegistry?.get?.(r.resource)?.name??r.resource,from:r.from}),{important:true});
    this.reports=[];
  }
  // --- fires -------------------------------------------------------------------------------------------------------
  // Wooden or thatched: more Wood than Stone in its cost (Houses, farms, huts…), never the castle, towers or walls.
  flammable(b){const d=buildingDefinition(b);if(!buildingIsComplete(b)||d.campfire||d.fuel||['castle','tower','wall','wall_gate','burnt_ruins'].includes(d.id)||d.category!=='building')return false;if(d.flammable!=null)return !!d.flammable;const wood=d.cost?.wood??0;return wood>0&&wood>=(d.cost?.stone??0);}
  center(b){const d=buildingDefinition(b);return {x:b.x+d.width/2,y:b.y+d.height/2};}
  // Distance from a point to the nearest tile of a building.
  gap(b,p){const d=buildingDefinition(b),dx=Math.max(b.x-p.x,0,p.x-(b.x+d.width)),dy=Math.max(b.y-p.y,0,p.y-(b.y+d.height));return Math.hypot(dx,dy);}
  fireRisk(){const F=NIGHT_THREATS.fires,s=this.scene;return F.chance*(F.weather[s.seasons?.weather]??1)*(s.seasons?.season==='Winter'?F.winter:1);}
  // At nightfall every burning flame may set a wooden building within 2 tiles alight (one roll per building a night).
  igniteFires(day){
    this.fireDay=day;if(!this.enabled.fires||!this.started())return [];const F=NIGHT_THREATS.fires,s=this.scene,flames=[];
    for(const l of s.lightSources?.lights?.()??[]){if(!['torch','brazier','campfire'].includes(l.type))continue;const p=worldToGrid(l.x,l.y);flames.push({x:p.x,y:p.y,buildingId:l.buildingId});}
    const out=[],risk=this.fireRisk();
    for(const b of s.buildings??[]){if(!this.flammable(b)||this.fires.has(b.id))continue;
      if(!flames.some(f=>f.buildingId!==b.id&&this.gap(b,f)<=F.range))continue;if(this.random()<risk){
        // The first spark only warns: neighbours put it out, the building stays.
        if(!this.fireWarned){this.fireWarned=true;s.eventFeed?.push?.(`fire-warning:${day}`,t('nightThreats.fireWarning',{name:buildingDefinition(b).name}),{important:true});return out;}
        out.push(this.ignite(b));}}
    return out;
  }
  ignite(b){
    const F=NIGHT_THREATS.fires,fire={id:b.id,intensity:F.startIntensity,health:100};this.fires.set(b.id,fire);
    this.scene.eventFeed?.push?.(`fire:${b.id}:${this.scene.gameTime?.day??1}`,t('threats.fire',{name:this.scene.objectRegistry.require(b.type).name}),{important:true,target:b});this.scene.dangerMarks?.mark({x:b.x+1,y:b.y+1});this.changed();return fire;
  }
  burning(b){return this.fires.has(b?.id);}
  // The fire grows, eats the building and may jump to a wooden neighbour; at 0 health it burns down.
  updateFires(delta){
    const F=NIGHT_THREATS.fires,s=this.scene,seconds=delta/1000,day=s.gameTime?.dayDuration??120000;if(!this.fires.size)return;
    this.spreadIn-=seconds;const spread=this.spreadIn<=0;if(spread)this.spreadIn=F.spreadEverySeconds;
    for(const fire of [...this.fires.values()]){
      const b=s.buildings.find(x=>x.id===fire.id);if(!b){this.fires.delete(fire.id);continue;}
      fire.intensity=Math.min(100,fire.intensity+F.regrowPerSecond*seconds);
      fire.health-=100*(delta/(day*F.burnDays))*(fire.intensity/100);if(fire.fate==='saved')fire.health=Math.max(F.savedHealth,fire.health);
      if(fire.health<=0){this.burnDown(b);continue;}
      if(spread&&this.enabled.fires)for(const other of s.buildings){if(other===b||!this.flammable(other)||this.fires.has(other.id))continue;if(this.gap(other,this.center(b))<=F.range+buildingDefinition(b).width/2&&this.random()<F.spreadChance)this.ignite(other);}
    }
  }
  burnDown(b){
    const s=this.scene,name=s.objectRegistry.require(b.type).name,storage=s.foodStorage;this.fires.delete(b.id);
    // Stored goods burn with it (nothing spills), then the building and its functions go.
    for(const l of [...(storage?.locations?.values?.()??[])])if(l.buildingId===b.id)l.stock={};
    for(const w of s.workerSystem?.liveWorkers?.()??[])if(w.assignedWorkplaceId===b.id)s.workplaceSystem?.remove?.(w);
    storage?.removeBuilding?.(b);s.foodProduction?.records?.delete?.(b.id);const d=buildingDefinition(b),anchor={x:b.x,y:b.y};removeBuildingShell(s,b);
    if(d.width>=2&&d.height>=2){const rd=ruinDefinition(s.objectRegistry,b.type),ruin={id:Math.max(0,...s.buildings.map(x=>x.id),b.id)+1,type:rd.id,burntFrom:b.type,definition:rd,...anchor,tiles:buildingTiles(anchor,rd)};
      for(const tl of ruin.tiles)s.map[tl.y][tl.x]=1;s.buildings.push(ruin);s.towerViews?.set(ruin.id,s.createBuildingView(rd,ruin));}
    s.events?.emit?.('buildings:changed');s.eventFeed?.push?.(`burnt:${b.id}`,t('threats.burntDown',{name}),{important:true,target:{x:b.x+1,y:b.y+1}});this.changed();
  }
  // Water: the nearest completed Well's neighbours, otherwise walkable tiles beside water near the fire.
  waterGoals(fire){
    const s=this.scene,b=s.buildings.find(x=>x.id===fire.id),c=this.center(b),wells=(s.buildings??[]).filter(x=>x.type==='well'&&buildingIsComplete(x)).sort((a,z)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(z.x-c.x,z.y-c.y));
    if(wells.length&&Math.hypot(wells[0].x-c.x,wells[0].y-c.y)<=25)return {kind:'well',goals:towerNeighbors(wells[0]).filter(g=>isWalkable(s.map,g.x,g.y))};
    const shore=[];for(let r=1;r<=25&&shore.length<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=Math.floor(c.x)+dx,y=Math.floor(c.y)+dy;
      if(isWalkable(s.map,x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([ax,ay])=>isWaterGround(s.groundGrid?.[y+ay]?.[x+ax])))shore.push({x,y});}
    return {kind:'shore',goals:shore};
  }
  // A resident within 15 tiles drops what he is doing (if his hands are free) and carries buckets; true = handled.
  firefight(worker,delta){
    const F=NIGHT_THREATS.fires,s=this.scene;if(!this.fires.size||worker.isSubject===false||!worker.isAlive||worker.workTask||worker.cargo){if(worker.firefight&&!this.fires.has(worker.firefight.fireId))worker.firefight=null;return false;}
    let job=worker.firefight;
    if(job&&!this.fires.has(job.fireId)){worker.firefight=null;worker.path=[];worker.workState='Idle';worker.workMessage='';return false;}
    if(!job){
      const fire=[...this.fires.values()].map(f=>({f,b:s.buildings.find(x=>x.id===f.id)})).filter(x=>x.b&&this.gap(x.b,worker.position)<=F.helperRange).sort((a,z)=>this.gap(a.b,worker.position)-this.gap(z.b,worker.position))[0];
      if(!fire||s.workerSystem.liveSubjects().filter(w=>w.firefight?.fireId===fire.f.id).length>=F.helpers)return false;
      if(worker.restPhase)s.workerSystem.rest?.stop?.(worker);job=worker.firefight={fireId:fire.f.id,phase:'toWater',t:0};worker.path=[];
      // m-pozary (36): when the first resident answers, the fate is rolled once – 10 % the building is lost, otherwise it is saved.
      if(!fire.f.fate){fire.f.fate=this.random()<F.destroyChance?'lost':'saved';s.eventFeed?.push?.(`fire-help:${fire.f.id}:${s.gameTime?.day??1}`,t('threats.fireHelp',{name:s.objectRegistry.require(fire.b.type).name}),{target:fire.b});}
    }
    const b=s.buildings.find(x=>x.id===job.fireId),fire=this.fires.get(job.fireId);worker.workState='Working';worker.workMessage='Fighting the fire';
    const at=goals=>goals.some(g=>g.x===worker.tile.x&&g.y===worker.tile.y)&&!worker.nextTile&&!worker.path.length;
    if(job.phase==='toWater'){const water=this.waterGoals(fire);if(!water.goals.length){worker.firefight=null;return false;}if(at(water.goals)){job.phase='fill';job.t=F.fillMs;}else if(!worker.nextTile&&!worker.path.length&&!worker.moveTo(water.goals)){worker.firefight=null;return false;}}
    else if(job.phase==='fill'){job.t-=delta;if(job.t<=0)job.phase='toFire';}
    else if(job.phase==='toFire'){const goals=towerNeighbors(b).filter(g=>isWalkable(s.map,g.x,g.y));if(at(goals)){job.phase='throw';job.t=F.throwMs;}else if(!worker.nextTile&&!worker.path.length&&!worker.moveTo(goals)){worker.firefight=null;return false;}}
    else if(job.phase==='throw'){job.t-=delta;if(job.t<=0){if(fire.fate!=='lost')fire.intensity-=F.bucket;job.phase='toWater';if(fire.intensity<=0){this.fires.delete(fire.id);s.eventFeed?.push?.(`fire-out:${fire.id}:${s.gameTime?.totalElapsed??0}`,t('threats.fireOut',{name:s.objectRegistry.require(b.type).name}));this.changed();}}}
    return true;
  }
  checkWolvesNear(day){
    const W=NIGHT_THREATS.wolves,houses=this.houses();
    const near=this.wolves().some(w=>houses.some(h=>{const d=buildingDefinition(h);return Math.hypot(h.x+d.width/2-w.position.x,h.y+d.height/2-w.position.y)<=W.nearHouses;}));
    if(near&&!this.wolvesNear){const wolf=[...(this.scene.animalSystem?.animals?.values?.()??[])].find(a=>a.type==='wolf'&&a.wolf);this.scene.eventFeed?.push?.(`wolves-near:${day}`,t('threats.wolvesNear'),{important:true,target:wolf?()=>wolf.active?wolf.position:null:null});if(wolf)this.scene.dangerMarks?.mark(wolf.position);}
    this.wolvesNear=near;
  }
  update(delta=0){
    this.updateCampfires();this.updateThieves(delta);this.updateFires(delta);
    const day=this.scene.gameTime?.day??1;
    if(this.scene.dayNight?.isNight()&&this.wolfDay!==day)this.spawnWolves(day);
    if(this.scene.dayNight?.isNight()&&this.thiefDay!==day)this.spawnThief(day);
    if(this.scene.dayNight?.isNight()&&this.fireDay!==day)this.igniteFires(day);
    if(this.scene.dayNight?.part()==='day')this.reportMorning(day);
    this.checkWolvesNear(day);
  }
  exportState(){return {enabled:{...this.enabled},...(this.fireWarned?{fireWarned:true}:{}),wolfDay:this.wolfDay,thiefDay:this.thiefDay,thieves:[...this.thieves.values()].map(t=>({id:t.id,state:t.state,target:{...t.target},loot:t.loot?{...t.loot}:null,pursuer:t.pursuer})),reports:this.reports.map(r=>({...r})),fireDay:this.fireDay,fires:[...this.fires.values()].map(f=>({id:f.id,intensity:Math.round(f.intensity*100)/100,health:Math.round(f.health*100)/100,...(f.fate?{fate:f.fate}:{})})),campfires:[...this.campfires].map(([id,c])=>({id,litDay:c.litDay,ashesDay:c.ashesDay})).sort((a,b)=>a.id-b.id)};}
  // Threats wait until the kingdom stands: enough finished Houses or the start year passed (plan m-e1-hrozby-pozdeji).
  started(){
    const S=NIGHT_THREATS.start,s=this.scene;
    if((s.buildings??[]).filter(b=>b.type==='house'&&buildingIsComplete(b)).length>=S.houses)return true;
    if(s.seasons?.enabled!==false&&s.seasons?.calendar)return s.seasons.calendar.year>=S.year;
    return (s.gameTime?.day??1)>S.daysWithoutSeasons;
  }
  importState(data){if(!data)return;this.fireWarned=!!data.fireWarned;this.enabled={...this.enabled,...data.enabled};this.wolfDay=data.wolfDay??null;this.thiefDay=data.thiefDay??null;this.fireDay=data.fireDay??null;this.fires=new Map((data.fires??[]).map(f=>[f.id,{...f}]));this.reports=(data.reports??[]).map(r=>({...r}));
    this.thieves=new Map((data.thieves??[]).map(t=>[t.id,{...t,target:{...t.target},loot:t.loot?{...t.loot}:null,since:this.scene?.gameTime?.totalElapsed??0,repath:0}]));this.campfires=new Map((data.campfires??[]).map(c=>[c.id,{litDay:c.litDay,ashesDay:c.ashesDay}]));}
  destroy(){this.listeners.clear();}
}
// m-pozary (60): the ruins say what burnt – "Burnt Bakery" in the tooltip and the panel.
export function ruinDefinition(registry,fromType){
  const rd=registry.require('burnt_ruins'),from=fromType&&registry.get?.(fromType);if(!from)return rd;
  return Object.freeze({...rd,name:t('threats.ruinName',{name:from.name}),description:t('threats.ruinDescription',{name:from.name}),burntFrom:fromType});
}
export function validNightThreatState(data,buildingIds){
  const n=v=>v===null||Number.isSafeInteger(v)&&v>=1;
  // `wolfDay` came in 0.44.0; saves of 0.43.0 (same schema 57) have none.
  return !!data&&typeof data==='object'&&!!data.enabled&&(data.wolfDay===undefined||n(data.wolfDay))&&NIGHT_THREATS.ids.every(id=>typeof data.enabled[id]==='boolean')&&Object.keys(data.enabled).length===NIGHT_THREATS.ids.length&&Object.keys(data).every(k=>['enabled','campfires','wolfDay','thiefDay','thieves','reports','fireDay','fires','fireWarned'].includes(k))&&(data.fireWarned===undefined||data.fireWarned===true)&&(data.fireDay===undefined||n(data.fireDay))
    &&(data.fires===undefined||Array.isArray(data.fires)&&data.fires.every(f=>f&&buildingIds.has(f.id)&&Number.isFinite(f.intensity)&&f.intensity>0&&f.intensity<=100&&Number.isFinite(f.health)&&f.health>0&&f.health<=100&&(f.fate===undefined||f.fate==='saved'||f.fate==='lost')&&Object.keys(f).every(k=>['id','intensity','health','fate'].includes(k))))&&(data.thiefDay===undefined||n(data.thiefDay))
    &&(data.thieves===undefined||Array.isArray(data.thieves)&&data.thieves.every(t=>t&&typeof t.id==='string'&&['sneaking','escaping','fleeing'].includes(t.state)&&t.target&&typeof t.target.id==='string'&&(t.loot===null||Number.isFinite(t.loot.amount)&&t.loot.amount>0&&typeof t.loot.resource==='string')))
    &&(data.reports===undefined||Array.isArray(data.reports))
    &&Array.isArray(data.campfires)&&data.campfires.every(c=>c&&buildingIds.has(c.id)&&n(c.litDay)&&n(c.ashesDay));
}
