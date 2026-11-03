import { objectRegistry } from './ObjectRegistry.js';
import { DAY_DURATION } from './GameTimeSystem.js';
import { COLUMNS,ROWS } from '../game/config.js';
import { wearLevel } from '../data/pathWear.js';

export const SAVE_VERSION=1;
const copy=value=>value==null?null:structuredClone(value);
const point=value=>value?{x:value.x,y:value.y}:null;
const actorFields=['id','type','currentHP','maxHP','isAlive','speed','walking','wanderWait','mounted','retaliationRepath'];
export function serializeActor(unit){
  return {...Object.fromEntries(actorFields.filter(k=>unit[k]!==undefined).map(k=>[k,unit[k]])),
    baseStats:copy(unit.baseStats),statModifiers:copy(unit.statModifiers),tile:point(unit.tile),position:point(unit.position),
    nextTile:point(unit.nextTile),direction:point(unit.direction),path:unit.path.map(point)};
}
export function serializeOrder(order){
  if(!order)return null;
  return {kind:order.kind,goal:point(order.goal),pickupKey:order.pickupKey??null,dropId:order.dropId??null,silent:!!order.silent,
    buildingId:order.tower?.id??null,animalId:order.animal?.id??null,chestId:order.chest?.id??null,
    resourceKey:order.resource?`${order.resource.x},${order.resource.y}`:null};
}
export function serializeGameState(scene){
  const c=scene.character,camera=scene.cameras.main;
  return {
    saveVersion:SAVE_VERSION,terrain:scene.terrainGrid.map(row=>[...row]),
    ...(scene.pathWear?{pathWear:scene.pathWear.exportState()}:{}),
    player:{...serializeActor(c),state:c.state,currentTowerId:c.currentTower?.id??null,horseId:c.mountedHorse?.id??null,
      exitTile:point(c.exitTile),order:serializeOrder(c.order),
      roofContinuation:c.roofContinuation?{...copy({...c.roofContinuation,order:null}),order:serializeOrder(c.roofContinuation.order)}:null,
      render:{x:scene.player.x,y:scene.player.y,depth:scene.player.depth},
      transition:c.transitioning?{remaining:Math.max(1,(c.transitionTween?.duration??900)-(c.transitionTween?.elapsed??0))}:null},
    inventory:scene.inventory.exportState(),equipment:scene.equipment.exportState(),
    buildings:scene.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y})),
    resources:[...scene.resources.values()].map(v=>({type:v.getData('objectId'),tile:point(v.getData('tile'))})),
    drops:[...scene.dropSystem.drops.values()].map(d=>({id:d.id,resource:d.resource,tile:point(d.tile),amount:d.amount})),
    animals:[...scene.animalSystem.animals.values()].map(a=>({...serializeActor(a),retaliationId:a.retaliationTarget?.id??null})),
    chests:[...scene.treasureSystem.chests.values()].map(c=>({id:c.id,tile:point(c.tile),opened:c.opened,opening:c.opening,looted:c.looted,contents:copy(c.contents),
      animation:c.opening?{elapsed:c.view.openTween?.elapsed??0,lid:c.view.lid?{y:c.view.lid.y,rotation:c.view.lid.rotation}:null}:null})),
    time:scene.gameTime.exportState(),food:scene.foodSystem.exportState(),
    spawners:scene.resourceSpawners.map(s=>({id:s.definition.id,...s.exportState()})),production:scene.production.exportState(),
    camera:{zoom:camera.zoom,x:camera.scrollX+camera.width/2,y:camera.scrollY+camera.height/2,following:scene.worldCamera.following},
    settings:{...scene.settingsPanel.settings},
    commands:{hunt:scene.huntingSystem.target?.id??null,huntRepath:scene.huntingSystem.repath,mount:scene.mountSystem.target?.id??null,mountRepath:scene.mountSystem.repath,
      attacks:[...scene.combat.attacks].map(([a,t])=>[a.id,t.id]),pendingChest:scene.treasureSystem.pending},
    counters:{animal:scene.animalSystem.nextId,drop:scene.dropSystem.nextId,chest:scene.treasureSystem.nextId},
  };
}

// Validace proběhne ještě před zastavením právě běžící scény. Poškozený save
// proto nemění současný svět ani záznam v IndexedDB.
export function validateGameState(input,registry=objectRegistry){
  const fail=()=>{throw new Error('Uložená hra je poškozená nebo má nepodporovanou verzi.');};
  const check=value=>{if(!value)fail();};
  const number=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>check(Number.isFinite(n)&&n>=min&&n<=max);
  const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>{number(n,min,max);check(Number.isInteger(n));};
  const tile=p=>{check(p&&typeof p==='object');integer(p.x,0,COLUMNS-1);integer(p.y,0,ROWS-1);};
  const position=p=>{check(p&&typeof p==='object');number(p.x,0,COLUMNS);number(p.y,0,ROWS);};
  const array=(a,max=20000)=>check(Array.isArray(a)&&a.length<=max);
  const definition=(id,category)=>{const d=registry.get(id);check(d&&(!category||d.category===category));return d;};
  const unique=(array)=>{const ids=new Set();for(const a of array){check(a.id!=null&&!ids.has(a.id));ids.add(a.id);}return ids;};
  check(input&&input.saveVersion===SAVE_VERSION);
  let s;try{s=JSON.parse(JSON.stringify(input));}catch{fail();}
  array(s.terrain,ROWS);check(s.terrain.length===ROWS);for(const row of s.terrain){array(row,COLUMNS);check(row.length===COLUMNS&&row.every(n=>n===0||n===1));}
  for(const key of ['buildings','resources','animals','drops','chests','spawners'])array(s[key]);
  const bIds=unique(s.buildings),aIds=unique(s.animals),dIds=unique(s.drops),cIds=unique(s.chests);
  const occupied=new Set();
  const occupy=(p,w=1,h=1)=>{tile(p);for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
    const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;check(s.terrain[y]?.[x]===0&&!occupied.has(key));occupied.add(key);
  }};
  for(const b of s.buildings){integer(b.id,1);const d=definition(b.type,'building');check(d.buildable);occupy(b,d.width,d.height);}
  const resourceTiles=new Set();
  for(const r of s.resources){const d=definition(r.type,'resource');tile(r.tile);for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++){
    const x=r.tile.x+dx,y=r.tile.y+dy,key=`${x},${y}`;check(s.terrain[y]?.[x]===0&&!occupied.has(key)&&!resourceTiles.has(key));resourceTiles.add(key);
  }}
  for(const c of s.chests){check(typeof c.id==='string');occupy(c.tile);check(!resourceTiles.has(`${c.tile.x},${c.tile.y}`));
    check(typeof c.opened==='boolean'&&typeof c.opening==='boolean'&&typeof c.looted==='boolean'&&(!c.looted||c.opened));
    integer(c.contents?.gold,50,100);array(c.contents?.equipment,10);for(const id of c.contents.equipment)definition(id,'equipment');
    if(c.opening){number(c.animation?.elapsed,0,350);if(c.animation.lid){number(c.animation.lid.y,-100,100);number(c.animation.lid.rotation,-10,10);}}
  }
  for(const d of s.drops){check(typeof d.id==='string');check(definition(d.resource,'resource').collectible);tile(d.tile);integer(d.amount,1);check(s.terrain[d.tile.y][d.tile.x]===0&&!occupied.has(`${d.tile.x},${d.tile.y}`));}
  const actor=a=>{
    check(a&&typeof a.isAlive==='boolean');definition(a.type);tile(a.tile);position(a.position);if(a.nextTile)tile(a.nextTile);array(a.path,20000);a.path.forEach(tile);
    number(a.direction?.x,-1,1);number(a.direction?.y,-1,1);number(a.speed,0,100);
    number(a.maxHP,1,1e9);number(a.currentHP,0,a.maxHP);check(a.isAlive?a.currentHP>0:a.currentHP===0);
    const b=a.baseStats;check(b);number(b.maxHP,1,1e9);number(b.attackDPS,0,1e9);number(b.armor,0,90);number(b.attackRange,0,100);number(b.hpRegenPerSecond,0,1e6);
    check(a.statModifiers&&typeof a.statModifiers==='object'&&!Array.isArray(a.statModifiers));
    for(const [name,m]of Object.entries(a.statModifiers)){check(!['__proto__','prototype','constructor'].includes(name)&&m&&typeof m==='object');for(const [key,v]of Object.entries(m)){check(['maxHP','attackBonus','armor','hpRegenPerSecond'].includes(key));number(v,-1e6,1e6);}}
  };
  const p=s.player;actor(p);check(p.id==='king'&&p.type==='king'&&p.isAlive);
  check(['ground','enteringTower','onTower','onWall','exitingTower'].includes(p.state));
  check(p.currentTowerId==null||bIds.has(p.currentTowerId));check(p.horseId==null||aIds.has(p.horseId));
  if(p.state!=='ground')check(bIds.has(p.currentTowerId)&&!p.horseId);
  if(p.exitTile)tile(p.exitTile);
  if(['enteringTower','exitingTower'].includes(p.state)){number(p.transition?.remaining,1,900);if(p.state==='exitingTower')tile(p.exitTile);}
  number(p.render?.x,-1e6,1e6);number(p.render?.y,-1e6,1e6);number(p.render?.depth,-1e6,1e6);
  for(const a of s.animals){definition(a.type,'animal');check(typeof a.id==='string');actor(a);number(a.wanderWait,-1e9,1e9);check(a.retaliationId==null||a.retaliationId==='king');if(a.mounted)check(p.horseId===a.id&&a.type==='horse');}
  if(p.horseId)check(s.animals.some(a=>a.id===p.horseId&&a.type==='horse'&&a.mounted&&a.isAlive));
  const order=o=>{if(!o)return;check(['move','enter','collect','drop','openChest','approachAnimal'].includes(o.kind));if(o.kind==='move'||o.kind==='drop')tile(o.goal);
    if(o.kind==='enter')check(bIds.has(o.buildingId));if(o.kind==='approachAnimal')check(aIds.has(o.animalId));if(o.kind==='drop')check(dIds.has(o.dropId));
    if(o.kind==='openChest')check(cIds.has(o.chestId));if(o.kind==='collect')check(s.resources.some(r=>`${r.tile.x},${r.tile.y}`===o.resourceKey));};
  order(p.order);if(p.roofContinuation){order(p.roofContinuation.order);tile(p.roofContinuation.exit);tile(p.roofContinuation.destination);array(p.roofContinuation.path);p.roofContinuation.path.forEach(tile);}
  check(s.inventory&&typeof s.inventory==='object');for(const [id,count]of Object.entries(s.inventory)){const d=definition(id);check(['resource','equipment'].includes(d.category));integer(count);}
  check(s.equipment&&Object.keys(s.equipment).length===2);for(const slot of ['weapon','armor'])if(s.equipment[slot]!=null){const id=s.equipment[slot];check(definition(id,'equipment').equipment.slot===slot&&(s.inventory[id]??0)>0);}
  integer(s.time?.day,1);number(s.time.elapsed,0,DAY_DURATION-1e-7);number(s.time.totalElapsed);check(Math.abs(s.time.totalElapsed-((s.time.day-1)*DAY_DURATION+s.time.elapsed))<.01);
  number(s.food?.elapsed,0,registry.require('meat').consumption.interval-1e-7);
  const spawnIds=new Set();for(const t of s.spawners){const d=definition(t.id,'resource');check(d.spawn&&!spawnIds.has(t.id));spawnIds.add(t.id);number(t.elapsed,0,d.spawn.interval-1e-7);}
  check(registry.byCategory('resource').filter(d=>d.spawn).every(d=>spawnIds.has(d.id)));
  integer(s.production?.lastProcessedDay,1,s.time.day);
  if(s.pathWear){
    const w=s.pathWear;for(const key of ['scores','levels','lastPassDays']){array(w[key],COLUMNS*ROWS);check(w[key].length===COLUMNS*ROWS);}
    integer(w.lastDecayDay,1,s.time.day);
    for(let i=0;i<COLUMNS*ROWS;i++){integer(w.scores[i]);integer(w.levels[i],0,3);integer(w.lastPassDays[i],0,s.time.day);check(w.levels[i]===wearLevel(w.scores[i]));if(w.scores[i])check(w.lastPassDays[i]>0);}
  }
  number(s.camera?.zoom,.45,1.8);number(s.camera.x,-1e6,1e6);number(s.camera.y,-1e6,1e6);check(typeof s.camera.following==='boolean');
  check(typeof s.settings?.fogOfWar==='boolean');if(s.settings.pathWearDebug!==undefined)check(typeof s.settings.pathWearDebug==='boolean');const c=s.commands;check(c);check(c.hunt==null||aIds.has(c.hunt));check(c.mount==null||aIds.has(c.mount));
  number(c.huntRepath,-1e9,1e9);number(c.mountRepath,-1e9,1e9);check(c.pendingChest==null||cIds.has(c.pendingChest));array(c.attacks,1000);
  for(const pair of c.attacks){array(pair,2);check(pair.length===2&&pair[0]!==pair[1]&&pair.every(id=>id==='king'||aIds.has(id)));}
  for(const [key,objects,prefix]of [['animal',s.animals,'animal'],['drop',s.drops,'drop'],['chest',s.chests,'treasure']]){
    integer(s.counters?.[key],1);
    for(const object of objects){const match=String(object.id).match(new RegExp(`^${prefix}-(\\d+)$`));check(match&&Number(match[1])>0&&Number(match[1])<s.counters[key]);}
  }
  const dropKeys=s.drops.map(d=>`${d.resource}:${d.tile.x},${d.tile.y}`);check(new Set(dropKeys).size===dropKeys.length);
  return s;
}
