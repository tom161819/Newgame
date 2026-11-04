import { objectRegistry } from './ObjectRegistry.js';
import { COLUMNS,ROWS } from '../game/config.js';
import { wearLevel } from '../data/pathWear.js';
import { getXPRequired,totalXPForLevel,createProgress } from '../data/experience.js';
import { JOBS,SKILL_IDS,WORK_RULES } from '../data/jobs.js';
import { CONSTRUCTION_RULES } from '../data/construction.js';
import { buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { gameSettings,WILDLIFE_INTERVALS } from './GameSettings.js';
import { FARMING_RULES } from '../data/farming.js';
import { FOOD_RESOURCE_IDS,FOOD_RULES } from '../data/foodProduction.js';
import { TALENTS } from '../data/economy.js';
import { validateFoodState } from './FoodStateValidation.js';
import { validateSeasonFoodState } from './SeasonFoodStateValidation.js';
import { seasonalCropStage } from '../data/seasons.js';
import { carryCapacity } from '../data/logistics.js';
import { repairTransportInstructions } from './TransportStateMigration.js';
import { captureMapKnowledge } from '../game/mapMemoryObjects.js';
import { validateMapMemory } from './MapMemoryValidation.js';
import { FORESTRY,emptyNaturalState } from '../data/naturalResources.js';

export const SAVE_VERSION=11;
const copy=value=>value==null?null:structuredClone(value);
const point=value=>value?{x:value.x,y:value.y}:null;
const actorFields=['id','type','currentHP','maxHP','isAlive','speed','walking','wanderWait','mounted','retaliationRepath'];
export function serializeActor(unit){
  return {...Object.fromEntries(actorFields.filter(k=>unit[k]!==undefined).map(k=>[k,unit[k]])),
    ...(unit.experience?{experience:copy(unit.experience)}:{}),
    ...(unit.skills?{skills:copy(unit.skills),activitySkill:unit.activitySkill??null}:{}),
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
  scene.naturalResources?.flushGrowth();
  scene.naturalResources?.refreshSeason();
  captureMapKnowledge(scene);
  const c=scene.character,camera=scene.cameras.main;
  return {
    saveVersion:SAVE_VERSION,gameSettings:{...gameSettings(scene.gameSettings),...(scene.seasons?{seasonsEnabled:scene.seasons.enabled}:{})},terrain:scene.terrainGrid.map(row=>[...row]),
    exploration:scene.mapMemory.exportState(),
    naturalResources:scene.naturalResources?.exportState()??emptyNaturalState(),
    ...(scene.experienceSystem?{experienceSystem:scene.experienceSystem.exportState()}:{}),
    ...(scene.skillSystem?{skillSystem:scene.skillSystem.exportState()}:{}),
    ...(scene.wageSystem?{wages:scene.wageSystem.exportState()}:{}),
    ...(scene.workplaceSystem?{workplaces:scene.workplaceSystem.exportState()}:{}),
    ...(scene.constructionSystem?{constructionSystem:scene.constructionSystem.exportState()}:{}),
    ...(scene.farmingSystem?{farming:scene.farmingSystem.exportState()}:{}),
    ...(scene.seasons?{seasons:scene.seasons.exportState()}:{}),
    ...(scene.kingLogistics?{kingLogistics:scene.kingLogistics.exportState()}:{}),
    ...(scene.logisticsTasks?{logistics:{version:1,...(scene.constructionSystem?.materials.enabled?{materialsVersion:1}:{})}}:{}),
    ...(scene.foodStorage?{foodStorage:scene.foodStorage.exportState(),foodProduction:scene.foodProduction.exportState()}:{}),
    ...(scene.workerSystem?{population:scene.workerSystem.exportState(),workers:[...scene.workerSystem.workers.values()].map(w=>({...serializeActor(w),name:w.name,profession:w.profession,isSubject:w.isSubject!==false,diedAt:w.diedAt??null,
      ...(w.naturalTalent?{naturalTalent:w.naturalTalent,initialSkills:copy(w.initialSkills)}:{}),
      workplaceReached:w.workplaceReached,cargo:copy(w.cargo),pendingWorkRewards:copy(w.pendingWorkRewards),
      workState:w.workState,workMessage:w.workMessage??'',workTask:copy(w.workTask),assignedWorkplaceId:w.assignedWorkplaceId,arriving:w.arriving,aiCooldown:w.aiCooldown}))}:{}),
    ...(scene.pathWear?{pathWear:scene.pathWear.exportState()}:{}),
    player:{...serializeActor(c),state:c.state,currentTowerId:c.currentTower?.id??null,horseId:c.mountedHorse?.id??null,
      ...(scene.kingLogistics?{cargo:copy(c.cargo),pendingWorkRewards:copy(c.pendingWorkRewards)}:{}),
      exitTile:point(c.exitTile),order:serializeOrder(c.order),
      roofContinuation:c.roofContinuation?{...copy({...c.roofContinuation,order:null}),order:serializeOrder(c.roofContinuation.order)}:null,
      render:{x:scene.player.x,y:scene.player.y,depth:scene.player.depth},
      transition:c.transitioning?{remaining:Math.max(1,(c.transitionTween?.duration??900)-(c.transitionTween?.elapsed??0))}:null},
    inventory:scene.inventory.exportState(),equipment:scene.equipment.exportState(),
    buildings:scene.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,...(b.construction?{construction:copy(b.construction)}:{}),...(b.materialSupply?{materialSupply:copy(b.materialSupply)}:{})})),
    resources:[...scene.resources.values()].map(v=>({type:v.getData('objectId'),tile:point(v.getData('tile')),...(v.getData('object').natural?{natural:copy(v.getData('object').natural)}:{})})),
    drops:[...scene.dropSystem.drops.values()].map(d=>({id:d.id,resource:d.resource,tile:point(d.tile),amount:d.amount,rewardRemaining:d.rewardRemaining??1,rewardUnits:d.rewardUnits??(d.resource==='stone'?d.amount:0),haulEligible:d.haulEligible!==false,...(d.siteId!=null?{siteId:d.siteId}:{})})),
    animals:[...scene.animalSystem.animals.values()].map(a=>({...serializeActor(a),retaliationId:a.retaliationTarget?.id??null})),
    chests:[...scene.treasureSystem.chests.values()].map(c=>({id:c.id,tile:point(c.tile),opened:c.opened,opening:c.opening,looted:c.looted,contents:copy(c.contents),
      animation:c.opening?{elapsed:c.view.openTween?.elapsed??0,lid:c.view.lid?{y:c.view.lid.y,rotation:c.view.lid.rotation}:null}:null})),
    time:scene.gameTime.exportState(),food:scene.foodSystem.exportState(),wildlifeRespawn:scene.wildlifeRespawn?.exportState()??{elapsed:0},
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
  check(input&&[1,2,3,4,5,6,7,8,9,10,SAVE_VERSION].includes(input.saveVersion));
  let s;try{s=JSON.parse(JSON.stringify(input));}catch{fail();}
  if(input.saveVersion<9&&s.settings)s.settings.explorationMode??=true;
  if(input.saveVersion<9&&s.exploration===undefined)s.exploration={version:1,explored:[],terrain:[],objects:[]};
  if(input.saveVersion<10)for(const worker of s.workers??[]){worker.isSubject??=true;worker.diedAt??=worker.isAlive?null:s.time?.totalElapsed;}
  if(input.saveVersion<11)s.naturalResources??=emptyNaturalState();
  if(input.saveVersion<4)for(const actor of [s.player,...(s.workers??[])])for(const key of ['skills','initialSkills'])if(actor?.[key])for(const id of ['milling','baking'])actor[key][id]??=createProgress();
  if(!s.logistics){
    for(const actor of [s.player,...(s.workers??[])])for(const key of ['skills','initialSkills'])if(actor?.[key])actor[key].logistics??=createProgress();
    if(s.workplaces?.records)for(const b of s.buildings??[])if(['granary','warehouse'].includes(b.type)&&buildingIsComplete(b)&&!s.workplaces.records.some(r=>r.buildingId===b.id))s.workplaces.records.push({buildingId:b.id,capacity:registry.require(b.type).workplace.capacity,workerIds:[],delivered:{}});
  }else check(s.logistics.version===1);
  for(const d of s.drops??[]){d.haulEligible??=true;check(typeof d.haulEligible==='boolean');}
  try{const settings=gameSettings(s.gameSettings);s.gameSettings={...settings,fogOfWar:s.gameSettings?.fogOfWar??s.settings?.fogOfWar??settings.fogOfWar};}catch{fail();}
  if(input.saveVersion<8&&s.seasons&&s.seasons.enabled===undefined){const data=s.seasons;data.enabled=true;data.cycleDay=data.lastProcessedDay;data.cycleElapsed=s.time?.elapsed;data.cycleCompensation=0;data.rememberedSeason=data.season;}
  s.saveVersion=SAVE_VERSION;
  const dayDuration=s.gameSettings.dayLengthSeconds*1000;
  s.wildlifeRespawn??={elapsed:0};number(s.wildlifeRespawn.elapsed,0,(WILDLIFE_INTERVALS[s.gameSettings.wildlifeRespawn]||1)-1e-7);
  array(s.terrain,ROWS);check(s.terrain.length===ROWS);for(const row of s.terrain){array(row,COLUMNS);check(row.length===COLUMNS&&row.every(n=>n===0||n===1));}
  for(const key of ['buildings','resources','animals','drops','chests','spawners'])array(s[key]);
  if(s.workers!==undefined)array(s.workers);
  const bIds=unique(s.buildings),aIds=unique(s.animals),dIds=unique(s.drops),cIds=unique(s.chests);
  const wIds=unique(s.workers??[]),unitIds=new Set(['king',...aIds,...wIds]);
  const occupied=new Set(),solid=new Set();
  const occupy=(p,w=1,h=1)=>{tile(p);for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
    const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;check(s.terrain[y]?.[x]===0&&!occupied.has(key));occupied.add(key);
  }};
  const siteAssignments=new Set();
  for(const b of s.buildings){integer(b.id,1);const d=definition(b.type,'building');check(d.buildable||d.starter);if(d.starter)check(buildingIsComplete(b));occupy(b,d.width,d.height);
    if(!d.walkable||!buildingIsComplete(b))for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)solid.add(`${b.x+dx},${b.y+dy}`);
    if(b.construction){
      const c=b.construction;check(['planned','building','complete'].includes(c.state));number(c.requiredWork,1,86400000);check(c.requiredWork===(d.constructionTime??CONSTRUCTION_RULES.defaultTime));
      number(c.workDone,0,c.requiredWork);number(c.progress,0,100);check(Math.abs(c.progress-100*c.workDone/c.requiredWork)<1e-6);
      check(c.state==='planned'?c.workDone===0:c.state==='complete'?c.workDone===c.requiredWork:c.workDone>0&&c.workDone<c.requiredWork);
      check(typeof c.rewardsGranted==='boolean'&&c.rewardsGranted===(c.state==='complete'));
      check(c.investedMaterials&&typeof c.investedMaterials==='object'&&JSON.stringify(Object.entries(c.investedMaterials).sort())===JSON.stringify(Object.entries(d.cost).sort()));
      check(c.contributions&&typeof c.contributions==='object'&&!Array.isArray(c.contributions));let work=0;
      for(const [id,amount]of Object.entries(c.contributions)){check(id==='king'||wIds.has(id));number(amount,Number.MIN_VALUE,c.requiredWork);work+=amount;}check(Math.abs(work-c.workDone)<1e-6);
      array(c.assignedBuilders,CONSTRUCTION_RULES.maximumBuilders);check(new Set(c.assignedBuilders).size===c.assignedBuilders.length);if(c.state==='complete')check(!c.assignedBuilders.length);
      for(const id of c.assignedBuilders){check((id==='king'||wIds.has(id))&&!siteAssignments.has(id));siteAssignments.add(id);}
    }
  }
  repairTransportInstructions(s,registry,check);
  const natural=s.naturalResources;check(natural&&Object.keys(natural).every(key=>['nextId','growthClock','ageClock','refreshElapsed','kingTask'].includes(key)));integer(natural.nextId,1);number(natural.ageClock,0,s.time.totalElapsed/dayDuration+1e-6);number(natural.growthClock,0,natural.ageClock*1.25+1e-6);number(natural.refreshElapsed,0,FORESTRY.refreshInterval);check(natural.refreshElapsed<FORESTRY.refreshInterval);
  const resourceTiles=new Set(),treeIds=new Map();
  for(const r of s.resources){const d=definition(r.type,'resource');tile(r.tile);
    if(d.tree){const n=r.natural;check(n&&n.kind==='tree'&&Object.keys(n).every(key=>['id','kind','stage','ageDays','growthDays','cycle','workDone','growthCheckpoint','ageCheckpoint'].includes(key)));const id=String(n.id).match(/^tree-([1-9]\d*)$/);check(id&&Number(id[1])<natural.nextId&&!treeIds.has(n.id));treeIds.set(n.id,r);integer(n.stage,0,3);integer(n.cycle,0);number(n.ageDays);number(n.growthDays,0,n.stage===3?0:FORESTRY.stageDays[n.stage]);number(n.workDone,0,n.stage===3?d.tree.chopDuration:0);number(n.growthCheckpoint,0,natural.growthClock+1e-8);number(n.ageCheckpoint,0,natural.ageClock+1e-8);}else check(r.natural===undefined);
    for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++){
    const x=r.tile.x+dx,y=r.tile.y+dy,key=`${x},${y}`;check(s.terrain[y]?.[x]===0&&!occupied.has(key)&&!resourceTiles.has(key));resourceTiles.add(key);
  }}
  if(natural.kingTask!=null){const task=natural.kingTask,r=treeIds.get(task.treeId);check(r&&r.natural.stage===3&&!s.player.horseId&&typeof task.arrived==='boolean'&&Object.keys(task).every(key=>['treeId','goal','arrived'].includes(key)));tile(task.goal);check(Math.abs(task.goal.x-r.tile.x)+Math.abs(task.goal.y-r.tile.y)===1);}
  for(const c of s.chests){check(typeof c.id==='string');occupy(c.tile);solid.add(`${c.tile.x},${c.tile.y}`);check(!resourceTiles.has(`${c.tile.x},${c.tile.y}`));
    check(typeof c.opened==='boolean'&&typeof c.opening==='boolean'&&typeof c.looted==='boolean'&&(!c.looted||c.opened));
    integer(c.contents?.gold,50,100);array(c.contents?.equipment,10);for(const id of c.contents.equipment)definition(id,'equipment');
    if(c.opening){number(c.animation?.elapsed,0,350);if(c.animation.lid){number(c.animation.lid.y,-100,100);number(c.animation.lid.rotation,-10,10);}}
  }
  for(const d of s.drops){check(typeof d.id==='string');check(definition(d.resource,'resource').collectible);tile(d.tile);integer(d.amount,1);d.rewardRemaining??=1;number(d.rewardRemaining);d.rewardUnits??=d.resource==='stone'?d.amount:0;number(d.rewardUnits,0,d.amount);check(s.terrain[d.tile.y][d.tile.x]===0&&!solid.has(`${d.tile.x},${d.tile.y}`));}
  const skillsState=skills=>{
    check(skills&&typeof skills==='object'&&!Array.isArray(skills)&&Object.keys(skills).length===SKILL_IDS.length);
      for(const id of SKILL_IDS){const e=skills[id];check(e&&typeof e.enabled==='boolean');integer(e.maxLevel,1,50);integer(e.level,1,e.maxLevel);number(e.gainMultiplier,0,1e6);number(e.currentXP);number(e.totalXP,0,totalXPForLevel(e.maxLevel));
        const required=e.level===e.maxLevel?0:getXPRequired(e.level);check(e.xpToNextLevel===required);check(required?e.currentXP<required:e.currentXP===0);check(Math.abs(e.totalXP-totalXPForLevel(e.level)-e.currentXP)<1e-6);
        check(e.modifiers&&typeof e.modifiers==='object'&&!Array.isArray(e.modifiers));for(const [key,value]of Object.entries(e.modifiers)){check(!['__proto__','constructor','prototype'].includes(key));number(value,0,1e6);}
      }
  };
  const actor=a=>{
    check(a&&typeof a.isAlive==='boolean');definition(a.type);tile(a.tile);position(a.position);if(a.nextTile)tile(a.nextTile);array(a.path,20000);a.path.forEach(tile);
    number(a.direction?.x,-1,1);number(a.direction?.y,-1,1);number(a.speed,0,100);
    number(a.maxHP,1,1e9);number(a.currentHP,0,a.maxHP);check(a.isAlive?a.currentHP>0:a.currentHP===0);
    const b=a.baseStats;check(b);number(b.maxHP,1,1e9);number(b.attackDPS,0,1e9);number(b.armor,0,90);number(b.attackRange,0,100);number(b.hpRegenPerSecond,0,1e6);
    check(a.statModifiers&&typeof a.statModifiers==='object'&&!Array.isArray(a.statModifiers));
    for(const [name,m]of Object.entries(a.statModifiers)){check(!['__proto__','prototype','constructor'].includes(name)&&m&&typeof m==='object');for(const [key,v]of Object.entries(m)){check(['maxHP','attackBonus','attackMultiplier','armor','hpRegenPerSecond'].includes(key));number(v,key==='attackMultiplier'?0:-1e6,1e6);}}
    if(a.experience!==undefined){
      const e=a.experience;check(definition(a.type).category==='character'&&e&&typeof e.enabled==='boolean');
      integer(e.maxLevel,1,50);integer(e.level,1,e.maxLevel);number(e.gainMultiplier,0,1e6);number(e.currentXP);number(e.totalXP,0,totalXPForLevel(e.maxLevel));
      const required=e.level===e.maxLevel?0:getXPRequired(e.level);check(e.xpToNextLevel===required);check(required?e.currentXP<required:e.currentXP===0);
      check(Math.abs(e.totalXP-totalXPForLevel(e.level)-e.currentXP)<1e-6);check(e.modifiers&&typeof e.modifiers==='object'&&!Array.isArray(e.modifiers));
      for(const [key,value]of Object.entries(e.modifiers)){check(!['__proto__','constructor','prototype'].includes(key));number(value,0,1e6);}
    }
    if(a.skills!==undefined){
      check(definition(a.type).category==='character');skillsState(a.skills);
      check(a.activitySkill==null||SKILL_IDS.includes(a.activitySkill));
    }
  };
  const p=s.player;actor(p);check(p.id==='king'&&p.type==='king'&&p.isAlive);
  check(['ground','enteringTower','onTower','onWall','exitingTower'].includes(p.state));
  check(p.currentTowerId==null||bIds.has(p.currentTowerId));check(p.horseId==null||aIds.has(p.horseId));
  if(p.state!=='ground')check(bIds.has(p.currentTowerId)&&buildingIsComplete(s.buildings.find(b=>b.id===p.currentTowerId))&&!p.horseId);
  if(p.exitTile)tile(p.exitTile);
  if(['enteringTower','exitingTower'].includes(p.state)){number(p.transition?.remaining,1,900);if(p.state==='exitingTower')tile(p.exitTile);}
  number(p.render?.x,-1e6,1e6);number(p.render?.y,-1e6,1e6);number(p.render?.depth,-1e6,1e6);
  for(const a of s.animals){definition(a.type,'animal');check(typeof a.id==='string');actor(a);number(a.wanderWait,-1e9,1e9);check(a.retaliationId==null||a.retaliationId==='king'||wIds.has(a.retaliationId));if(a.mounted)check(p.horseId===a.id&&a.type==='horse');}
  const reservations=new Set();
  if(s.workers!==undefined){
    integer(s.population?.nextId,1);integer(s.population.lastMigrationDay,1,s.time?.day??Number.MAX_SAFE_INTEGER);
    for(const w of s.workers){
      if(w.naturalTalent!==undefined||w.initialSkills!==undefined){
        check(Object.hasOwn(TALENTS,w.naturalTalent)&&w.skills);skillsState(w.initialSkills);
        for(const id of SKILL_IDS)check(w.initialSkills[id].totalXP<=w.skills[id].totalXP+1e-6);
      }
      check(w.type==='peasant');actor(w);check(typeof w.name==='string'&&w.name.length>0&&w.name.length<100&&Object.hasOwn(JOBS,w.profession));
      check(typeof w.isSubject==='boolean');if(w.isAlive)check(w.diedAt===null);else number(w.diedAt,0,s.time?.totalElapsed);
      check(w.isSubject||(!w.workTask&&w.assignedWorkplaceId==null&&w.profession==='idle'&&!w.cargo&&!(w.pendingWorkRewards?.length)));
      const match=String(w.id).match(/^worker-(\d+)$/);check(match&&Number(match[1])>0&&Number(match[1])<s.population.nextId);
      check(typeof w.arriving==='boolean');number(w.aiCooldown,-1e9,1e9);number(w.wanderWait,-1e9,1e9);check(w.assignedWorkplaceId==null||bIds.has(w.assignedWorkplaceId));
      check(['Idle','Searching for Work','Moving to Target','Working','Returning','Waiting','Fleeing','Recovering','Arriving','Dead','Going to Workplace','Searching for Target','Traveling to Target','Returning to Workplace','Patrolling'].includes(w.workState));
      check(typeof w.workMessage==='string'&&w.workMessage.length<200);if(!w.isAlive)check(w.workState==='Dead'&&!w.workTask&&!w.arriving);
      const t=w.workTask;if(t){
        check(w.isAlive&&['mine','mineDrop','hunt','collectMeat','build','harvest','foodPickup','foodDeliver','produce'].includes(t.kind));tile(t.goal);number(t.progressMs,0,t.kind==='harvest'?(definition(s.buildings.find(b=>b.id===t.targetId)?.type).crop?.workDuration??0):WORK_RULES.miningDuration);
        const prefix=t.kind==='mine'?'resource':t.kind==='hunt'?'animal':'drop',expected=t.kind==='produce'?`production-slot:${t.goal.x},${t.goal.y}`:['foodPickup','foodDeliver'].includes(t.kind)?`food-task:${t.transferId}`:t.kind==='build'?`construction-slot:${t.goal.x},${t.goal.y}`:t.kind==='harvest'?`crop:${t.targetId}`:`${prefix}:${t.targetId}`;check(t.reservation===expected&&!reservations.has(t.reservation));reservations.add(t.reservation);
        if(t.kind==='foodPickup'&&t.sourceDropId){check(!reservations.has(`drop:${t.sourceDropId}`));reservations.add(`drop:${t.sourceDropId}`);}
        if(t.kind==='mine')check(w.profession==='miner'&&s.resources.some(r=>r.type==='stone'&&`${r.tile.x},${r.tile.y}`===t.targetId));
        if(t.kind==='hunt')check(w.profession==='hunter'&&aIds.has(t.targetId));if(t.kind==='collectMeat')check(w.profession==='hunter'&&dIds.has(t.targetId));
        if(t.kind==='mineDrop')check(w.profession==='miner'&&s.drops.some(d=>d.id===t.targetId&&d.resource==='stone'));
        if(t.kind==='build'){
          const site=s.buildings.find(b=>b.id===t.targetId);check(w.profession==='builder'&&site&&!buildingIsComplete(site)&&site.construction.assignedBuilders.includes(w.id));
          check(towerNeighbors(site).some(p=>p.x===t.goal.x&&p.y===t.goal.y));
        }
        if(t.kind==='harvest'){
          const plot=s.buildings.find(b=>b.id===t.targetId),record=s.farming?.records?.find(r=>r.buildingId===t.targetId),home=s.buildings.find(b=>b.id===w.assignedWorkplaceId);
          check(w.profession==='farmer'&&plot&&home?.type==='farmhouse'&&buildingIsComplete(plot)&&buildingIsComplete(home)&&definition(plot.type).crop&&record?.reservedBy===w.id);
          check(t.goal.x>=plot.x&&t.goal.x<plot.x+definition(plot.type).width&&t.goal.y>=plot.y&&t.goal.y<plot.y+definition(plot.type).height);
          integer(t.cycle);check(t.cycle===record.cycle&&record.growthDays===definition(plot.type).crop.growthDays);number(t.startedAt,0,s.time?.totalElapsed??0);
        }
      }
      if(w.workplaceReached!==undefined)check(typeof w.workplaceReached==='boolean');
      if(w.cargo){check(w.isAlive&&w.assignedWorkplaceId!=null&&definition(w.cargo.resource).category==='resource'&&w.cargo.resource!=='gold');integer(w.cargo.amount,1,s.foodStorage?.physicalMaterials||s.foodStorage&&FOOD_RESOURCE_IDS.includes(w.cargo.resource)?carryCapacity(w):Number.MAX_SAFE_INTEGER);if(w.cargo.transportCancelled!==undefined)check(typeof w.cargo.transportCancelled==='boolean');}
      if(w.pendingWorkRewards!==undefined){array(w.pendingWorkRewards,10000);for(const event of w.pendingWorkRewards){
        check(w.isAlive&&w.assignedWorkplaceId!=null);check((event.type==='resourceCollected'&&event.objectType==='stone')||(event.type==='dropCollected'&&event.objectType==='meat')||(event.type==='animalKilled'&&['rabbit','deer','wild_boar'].includes(event.objectType)));integer(event.quantity??1,1);if(event.contributionRatio!==undefined)number(event.contributionRatio);
      }}
    }
  }
  if(s.workplaces!==undefined){
    array(s.workplaces?.records);const recorded=new Set(),assigned=new Set();
    for(const record of s.workplaces.records){
      check(bIds.has(record.buildingId)&&!recorded.has(record.buildingId));recorded.add(record.buildingId);
      const b=s.buildings.find(b=>b.id===record.buildingId),spec=definition(b.type).workplace;check(spec&&buildingIsComplete(b)&&record.capacity===spec.capacity);
      array(record.workerIds,spec.capacity);check(new Set(record.workerIds).size===record.workerIds.length);
      for(const id of record.workerIds){const worker=s.workers?.find(w=>w.id===id);check(worker?.isAlive&&worker.isSubject&&worker.assignedWorkplaceId===b.id&&worker.profession===spec.profession&&!assigned.has(id));assigned.add(id);}
      check(record.delivered&&typeof record.delivered==='object'&&!Array.isArray(record.delivered));for(const [id,n]of Object.entries(record.delivered)){check(definition(id).category==='resource'&&id!=='gold');integer(n);}
    }
    check(s.buildings.filter(b=>buildingIsComplete(b)&&definition(b.type).workplace).every(b=>recorded.has(b.id)));
    for(const worker of s.workers??[])if(worker.assignedWorkplaceId!=null)check(assigned.has(worker.id));
  }
  if(s.constructionSystem!==undefined){
    const c=s.constructionSystem;check(c);integer(c.nextId,Math.max(0,...s.buildings.map(b=>b.id))+1);
    check(c.kingSiteId==null||bIds.has(c.kingSiteId));
    if(c.kingSiteId!=null){const site=s.buildings.find(b=>b.id===c.kingSiteId);check(!buildingIsComplete(site)&&site.construction.assignedBuilders.includes('king'));tile(c.kingGoal);check(towerNeighbors(site).some(p=>p.x===c.kingGoal.x&&p.y===c.kingGoal.y));check(!reservations.has(`construction-slot:${c.kingGoal.x},${c.kingGoal.y}`));}
    else check(c.kingGoal==null&&!siteAssignments.has('king'));
    for(const id of siteAssignments)if(id!=='king'){const w=s.workers?.find(w=>w.id===id);check(w?.isAlive&&w.profession==='builder'&&w.workTask?.kind==='build');}
  }else check(!s.buildings.some(b=>!buildingIsComplete(b)));
  const plots=s.buildings.filter(b=>buildingIsComplete(b)&&definition(b.type).crop);
  if(s.farming!==undefined){
    const f=s.farming;check(f&&f.clocks&&typeof f.clocks==='object'&&Object.keys(f.clocks).length===Object.keys(FARMING_RULES.crops).length);
    for(const id of Object.keys(FARMING_RULES.crops))number(f.clocks[id]);number(f.refreshElapsed,0,FARMING_RULES.refreshInterval);array(f.records);check(f.records.length===plots.length);const recorded=new Set();
    for(const r of f.records){const plot=plots.find(b=>b.id===r.buildingId);check(plot&&!recorded.has(r.buildingId));recorded.add(r.buildingId);const crop=definition(plot.type).crop;
      number(r.growthDays,0,crop.growthDays);number(r.lastClock,0,f.clocks[plot.type]);integer(r.stage,0,3);check(r.stage===seasonalCropStage(plot.type,r.growthDays,crop.growthDays,s.seasons?.season));integer(r.cycle);
      check(r.reservedBy==null||s.workers?.some(w=>w.isAlive&&w.id===r.reservedBy&&w.profession==='farmer'&&w.workTask?.kind==='harvest'&&w.workTask.targetId===r.buildingId));
    }
  }else check(!plots.length);
  if(p.horseId)check(s.animals.some(a=>a.id===p.horseId&&a.type==='horse'&&a.mounted&&a.isAlive));
  const order=o=>{if(!o)return;check(['move','enter','collect','drop','openChest','approachAnimal'].includes(o.kind));if(o.kind==='move'||o.kind==='drop')tile(o.goal);
    if(o.kind==='enter')check(bIds.has(o.buildingId)&&buildingIsComplete(s.buildings.find(b=>b.id===o.buildingId)));if(o.kind==='approachAnimal')check(aIds.has(o.animalId));if(o.kind==='drop')check(dIds.has(o.dropId));
    if(o.kind==='openChest')check(cIds.has(o.chestId));if(o.kind==='collect')check(s.resources.some(r=>`${r.tile.x},${r.tile.y}`===o.resourceKey));};
  order(p.order);if(p.roofContinuation){order(p.roofContinuation.order);tile(p.roofContinuation.exit);tile(p.roofContinuation.destination);array(p.roofContinuation.path);p.roofContinuation.path.forEach(tile);}
  check(s.inventory&&typeof s.inventory==='object');for(const [id,count]of Object.entries(s.inventory)){const d=definition(id);check(['resource','equipment'].includes(d.category));if(id==='gold')number(count);else integer(count);}
  check(s.equipment&&Object.keys(s.equipment).length===2);for(const slot of ['weapon','armor'])if(s.equipment[slot]!=null){const id=s.equipment[slot];check(definition(id,'equipment').equipment.slot===slot&&(s.inventory[id]??0)>0);}
  integer(s.time?.day,1);number(s.time.elapsed,0,dayDuration-1e-7);number(s.time.totalElapsed);check(Math.abs(s.time.totalElapsed-((s.time.day-1)*dayDuration+s.time.elapsed))<.01);
  s.time.compensation??=0;number(s.time.compensation,-1e-6,1e-6);
  number(s.food?.elapsed,0,(s.food?.residents?dayDuration/2:registry.require('meat').consumption.interval)-1e-7);
  const spawnIds=new Set();for(const t of s.spawners){const d=definition(t.id,'resource');check(d.spawn&&!spawnIds.has(t.id));spawnIds.add(t.id);number(t.elapsed,0,d.spawn.interval-1e-7);}
  check(registry.byCategory('resource').filter(d=>d.spawn).every(d=>spawnIds.has(d.id)));
  integer(s.production?.lastProcessedDay,1,s.time.day);
  if(s.wages!==undefined){
    const wages=s.wages;check(wages&&s.workers);integer(wages.lastProcessedDay,1,s.time.day);check(wages.lastProcessedDay===s.time.day);
    check(wages.accruals&&typeof wages.accruals==='object'&&!Array.isArray(wages.accruals));
    for(const [id,cost]of Object.entries(wages.accruals)){check(wIds.has(id)&&cost);number(cost.rateMilliseconds,0,s.time.elapsed*6+1e-6);number(cost.compensation,-1e-6,1e-6);}
    array(wages.arrears,1000000);const debts=new Set();
    for(const debt of wages.arrears){check(wIds.has(debt.workerId));integer(debt.day,1,s.time.day-1);number(debt.amount,Number.MIN_VALUE,6);const key=`${debt.workerId}:${debt.day}`;check(!debts.has(key));debts.add(key);}
  }
  if(s.pathWear){
    const w=s.pathWear;for(const key of ['scores','levels','lastPassDays']){array(w[key],COLUMNS*ROWS);check(w[key].length===COLUMNS*ROWS);}
    integer(w.lastDecayDay,1,s.time.day);
    for(let i=0;i<COLUMNS*ROWS;i++){integer(w.scores[i]);integer(w.levels[i],0,3);integer(w.lastPassDays[i],0,s.time.day);check(w.levels[i]===wearLevel(w.scores[i]));if(w.scores[i])check(w.lastPassDays[i]>0);}
  }
  number(s.camera?.zoom,.45,1.8);number(s.camera.x,-1e6,1e6);number(s.camera.y,-1e6,1e6);check(typeof s.camera.following==='boolean');
  check(typeof s.settings?.fogOfWar==='boolean');if(s.settings.pathWearDebug!==undefined)check(typeof s.settings.pathWearDebug==='boolean');const c=s.commands;check(c);check(c.hunt==null||aIds.has(c.hunt));check(c.mount==null||aIds.has(c.mount));
  number(c.huntRepath,-1e9,1e9);number(c.mountRepath,-1e9,1e9);check(c.pendingChest==null||cIds.has(c.pendingChest));array(c.attacks,1000);
  for(const pair of c.attacks){array(pair,2);check(pair.length===2&&pair[0]!==pair[1]&&pair.every(id=>unitIds.has(id)));}
  for(const [key,objects,prefix]of [['animal',s.animals,'animal'],['drop',s.drops,'drop'],['chest',s.chests,'treasure']]){
    integer(s.counters?.[key],1);
    for(const object of objects){const match=String(object.id).match(new RegExp(`^${prefix}-(\\d+)$`));check(match&&Number(match[1])>0&&Number(match[1])<s.counters[key]);}
  }
  const dropKeys=s.drops.map(d=>`${d.resource}:${d.tile.x},${d.tile.y}`);check(new Set(dropKeys).size===dropKeys.length);
  if(s.experienceSystem!==undefined){
    const e=s.experienceSystem;check(e);integer(e.nextEventId,1);array(e.processedEventIds,1000000);check(new Set(e.processedEventIds).size===e.processedEventIds.length);
    for(const id of e.processedEventIds){check(typeof id==='string'&&id.length>0&&id.length<=128);const match=id.match(/^activity-(\d+)$/);if(match)integer(Number(match[1]),1,e.nextEventId-1);}
  }
  if(s.skillSystem!==undefined){
    check(s.skillSystem?.damageAwards&&typeof s.skillSystem.damageAwards==='object'&&!Array.isArray(s.skillSystem.damageAwards));
    for(const [key,amount]of Object.entries(s.skillSystem.damageAwards)){const [actorId,targetId]=key.split(':');check((actorId==='king'||wIds.has(actorId))&&(targetId==='king'||wIds.has(targetId)||/^animal-\d+$/.test(targetId)));number(amount,0,WORK_RULES.combatXPPerTarget+1e-7);}
  }
  validateFoodState(s,registry,{check,number,integer,array});
  validateSeasonFoodState(s,{check,number,integer,array});
  check(typeof s.settings.explorationMode==='boolean');
  validateMapMemory(s.exploration,registry,{check,number,integer,array});
  return s;
}
