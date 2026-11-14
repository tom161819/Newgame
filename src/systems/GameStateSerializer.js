import { buildingMaxHP } from '../game/buildingHealth.js';
import { HEATED_BUILDINGS } from '../data/heating.js';
import { validExpedition } from './Expedition.js';
import { fishingGround } from './FishingSystem.js';
import { SQUAD_MAX } from '../ui/armySquads.js';
import { validHaulPriority } from '../data/logistics.js';
import { validNightThreatState } from './NightThreatSystem.js';
import { validHeatingState } from './HeatingSystem.js';
import { validRoyalGoalState } from './RoyalGoals.js';
import { validKingSkillState } from './KingSkills.js';
import { validNightSpeedTipState } from '../data/dayNight.js';
import { exportDevBalance,validDevBalanceState,devRange } from '../data/devBalance.js';
import { validNoticeState } from '../data/diagnostics.js';
import { validLightFuelState } from './LightFuelSystem.js';
import { validateRockMining } from './RockMiningState.js';
import { CARAVAN_RULES,MERCHANT_TYPES,PRICE_MODEL,validateAutoTrade } from '../data/trade.js';
import { ORDER_STATUSES,validateTradeStats } from './TradeSystem.js';
import { validateDomesticState } from './DomesticAnimalSystem.js';
import { validateChildrenState } from './ChildrenSystem.js';
import { TAX_RATES,RATIONS,FEAST,LEGACY_RATIONS_EFFECT } from '../data/policy.js';
import { ROCK_MINING,CLEARING,clearsObstacles } from '../data/rockMining.js';
import { buildingDemolitionRefund } from '../data/demolition.js';
import { t } from '../i18n/index.js';
import { objectRegistry } from './ObjectRegistry.js';
import { COLUMNS,ROWS,validMapSize,withMapSize } from '../game/config.js';
import { exportGround,importGround,validGroundRows,exportBushes,emptyGround,exportZones,emptyZones,validZoneRows,exportReeds } from '../game/worldGeneration.js';
import { isWaterGround,isRiverGround,BUSH_TYPES,GROUND } from '../data/worldTerrain.js';
import { exportNatureGroups,validateNatureGroups,pruneNatureGroups } from '../game/natureGroups.js';
import { depositFamily } from '../data/minerals.js';
import { validateFishingState,waterBodies } from './FishingSystem.js';
import { FISHING } from '../data/fishing.js';
import { wearLevel } from '../data/pathWear.js';
import { getXPRequired,totalXPForLevel,createProgress } from '../data/experience.js';
import { JOBS,SKILL_IDS,WORK_RULES,POPULATION } from '../data/jobs.js';
import { CONSTRUCTION_RULES } from '../data/construction.js';
import { buildingDefinition,buildingIsComplete,towerNeighbors,withFootprint } from '../game/buildings.js';
import { pavementHost } from '../game/pavement.js';
import { gameSettings,WILDLIFE_INTERVALS } from './GameSettings.js';
import { groundOverride,validateGroundLook } from '../data/groundLook.js';
import { farmInRange,FARM_PLOT_CAPACITY } from '../data/farmPlots.js';
import { FARMING_RULES } from '../data/farming.js';
import { FOOD_RESOURCE_IDS,FOOD_RULES } from '../data/foodProduction.js';
import { TALENTS } from '../data/economy.js';
import { validateFoodState } from './FoodStateValidation.js';
import { validateSeasonFoodState } from './SeasonFoodStateValidation.js';
import { seasonalCropStage } from '../data/seasons.js';
import { carryCapacity,IDLE_STONE,VEHICLES,TRANSPORT_MODES } from '../data/logistics.js';
import { repairTransportInstructions } from './TransportStateMigration.js';
import { captureMapKnowledge } from '../game/mapMemoryObjects.js';
import { validateMapMemory } from './MapMemoryValidation.js';
import { FORESTRY,emptyNaturalState } from '../data/naturalResources.js';
import { EMPLOYMENT_PROFESSIONS,PRIORITY_RANGE } from '../data/employment.js';
import { UNIT_TYPES } from '../data/military.js';
import { MIN_ZOOM,MAX_ZOOM } from '../data/camera.js';
import { validIdentity,identityKey } from '../data/names.js';
import { emptyLedgerState } from '../data/resourceLedger.js';
import { validateResourceLedger } from './ResourceLedgerValidation.js';

// 61 (velke-prirodni-objekty): `natureGroups` – thickets, rock obstacles and ridges drawn as one object.
// 62 (tabulka-budov-1): workplace capacities, crop yields and Mill/Bakery recipes changed – saved workplaces, harvest
// reservations and running batches of 61 no longer match the rules.
export const SAVE_VERSION=62;
const copy=value=>value==null?null:structuredClone(value);
const point=value=>value?{x:value.x,y:value.y}:null;
const actorFields=['id','type','currentHP','maxHP','isAlive','speed','walking','wanderWait','mounted','retaliationRepath'];
export function serializeActor(unit){
  // m-hlidka-hradby: a soldier on the wall walk is saved on the ground where he climbed up (he climbs again after loading).
  const ground=unit.onWall&&unit.wallPatrol?.ground;if(ground)unit={...unit,tile:{...ground},position:{x:ground.x+.5,y:ground.y+.5},nextTile:null,path:[]};
  return {...Object.fromEntries(actorFields.filter(k=>unit[k]!==undefined).map(k=>[k,unit[k]])),
    ...(unit.experience?{experience:copy(unit.experience)}:{}),
    ...(unit.skills?{skills:copy(unit.skills),activitySkill:unit.activitySkill??null}:{}),
    baseStats:copy(unit.baseStats),statModifiers:copy(unit.statModifiers),tile:point(unit.tile),position:point(unit.position),
    nextTile:point(unit.nextTile),direction:point(unit.direction),path:unit.path.map(point)};
}
export function serializeOrder(order){
  if(!order)return null;
  return {kind:order.kind,goal:point(order.goal),pickupKey:order.pickupKey??null,dropId:order.dropId??null,silent:!!order.silent,explore:!!order.explore,
    buildingId:order.tower?.id??null,animalId:order.animal?.id??null,chestId:order.chest?.id??null,
    resourceKey:order.resource?`${order.resource.x},${order.resource.y}`:null};
}
export function serializeGameState(scene){
  scene.naturalResources?.flushGrowth();
  scene.naturalResources?.refreshSeason();
  captureMapKnowledge(scene,{force:true});
  const c=scene.character,camera=scene.cameras.main,exploration=scene.mapMemory.exportState();
  // A provisional order is already persisted in buildings. Its marker must not masquerade as
  // an observed object on unexplored ground (and must not weaken memory validation).
  const provisionalKeys=new Set(scene.buildings.filter(b=>b.unverified).map(b=>`building:${b.id}`));
  exploration.objects=exploration.objects.filter(entry=>!provisionalKeys.has(entry.key));
  return {
    saveVersion:SAVE_VERSION,gameSettings:{...gameSettings(scene.gameSettings),...(scene.seasons?{seasonsEnabled:scene.seasons.enabled}:{})},terrain:scene.terrainGrid.map(row=>[...row]),ground:exportGround(scene.groundGrid??emptyGround()),bushes:exportBushes(scene.bushes??new Map()),natureGroups:(pruneNatureGroups(scene),exportNatureGroups(scene.natureGroups)),grassZones:exportZones(scene.grassZones??emptyZones()),reeds:exportReeds(scene.reeds??new Set()),
    exploration,
    // World Editor: the player's ground look (optional; absent = the game's own look).
    ...(groundOverride()?{groundLook:groundOverride()}:{}),
    naturalResources:scene.naturalResources?.exportState()??emptyNaturalState(),
    resourceLedger:scene.resourceLedger?.exportState()??emptyLedgerState(scene.gameTime),
    ...(scene.experienceSystem?{experienceSystem:scene.experienceSystem.exportState()}:{}),
    ...(scene.skillSystem?{skillSystem:scene.skillSystem.exportState()}:{}),
    ...(scene.wageSystem?{wages:scene.wageSystem.exportState()}:{}),
    ...(scene.workplaceSystem?{workplaces:scene.workplaceSystem.exportState()}:{}),
    ...(scene.constructionSystem?{constructionSystem:scene.constructionSystem.exportState()}:{}),
    ...(scene.fishing?{fishing:scene.fishing.exportState()}:{}),
    ...(scene.farmingSystem?{farming:scene.farmingSystem.exportState()}:{}),
    ...(scene.seasons?{seasons:scene.seasons.exportState()}:{}),
    ...(scene.employment?{employment:scene.employment.exportState()}:{}),
    ...(scene.military?{military:scene.military.exportState()}:{}),
    ...(scene.vehicles?{vehicles:scene.vehicles.exportState()}:{}),
    ...(scene.stables?{stables:scene.stables.exportState()}:{}),
    ...(scene.needs?{needs:scene.needs.exportState()}:{}),
    ...(scene.caravans?{caravans:scene.caravans.exportState()}:{}),
    ...(scene.trade?{trade:scene.trade.exportState()}:{}),
    ...(scene.domestic?{domestic:scene.domestic.exportState()}:{}),
    ...(scene.childrenSystem?{children:scene.childrenSystem.exportState()}:{}),
    ...(scene.lightFuel?{lightFuel:scene.lightFuel.exportState()}:{}),
    ...(scene.nightThreats?{nightThreats:scene.nightThreats.exportState()}:{}),
    ...(scene.heating?{heating:scene.heating.exportState()}:{}),
    ...(scene.royalGoals?{royalGoals:scene.royalGoals.exportState()}:{}),
    ...(scene.kingSkills?{kingSkills:scene.kingSkills.exportState()}:{}),
    // m-noc-zrychleni (82): the night speed-up tip was shown in this game (optional; only `true`, absent = not yet).
    ...(scene.nightSpeedUp?.exportState?.()?{nightSpeedTip:true}:{}),
    // m-91 Dev tool: the coefficients that differ from ×1 (optional; absent = all ×1).
    ...(exportDevBalance()?{devBalance:exportDevBalance()}:{}),
    // m-hlasky-jednou (79): when the player closed which notice (optional; absent = none closed).
    ...(scene.diagnostics?.exportState?{notices:scene.diagnostics.exportState()}:{}),
    ...(scene.policy?{policy:scene.policy.exportState()}:{}),
    ...(scene.kingLogistics?{kingLogistics:scene.kingLogistics.exportState()}:{}),
    ...(scene.logisticsTasks?{logistics:{version:1,...(scene.constructionSystem?.materials.enabled?{materialsVersion:1}:{})}}:{}),
    ...(scene.foodStorage?{foodStorage:scene.foodStorage.exportState(),foodProduction:scene.foodProduction.exportState()}:{}),
    ...(scene.workerSystem?{population:scene.workerSystem.exportState(),workers:[...scene.workerSystem.workers.values()].map(w=>({...serializeActor(w),commandState:copy(w.commandState??{state:'Working',goal:null}),name:w.name,...(w.identity?{identity:copy(w.identity)}:{}),profession:w.profession,displayProfession:w.displayProfession,manualRockId:w.manualRockId,isSubject:w.isSubject!==false,diedAt:w.diedAt??null,
      ...(w.naturalTalent?{naturalTalent:w.naturalTalent,initialSkills:copy(w.initialSkills)}:{}),
      ...(w.stoneCollection?{stoneCollection:copy(w.stoneCollection)}:{}),...(w.haulPriority&&w.haulPriority.kind!=='any'?{haulPriority:copy(w.haulPriority)}:{}),...(Number.isInteger(w.squad)&&w.profession==='soldier'?{squad:w.squad}:{}),...(w.wallPatrol&&w.profession==='soldier'&&w.isAlive?{wallPatrol:w.wallPatrol.post?{post:{x:w.wallPatrol.post.x,y:w.wallPatrol.post.y,...(w.wallPatrol.post.tower?{tower:w.wallPatrol.post.tower}:{})}}:true}:{}),workplaceReached:w.workplaceReached,...(w.restPhase&&w.isAlive&&w.isSubject?{restPhase:w.restPhase}:{}),...(w.tendTorches?{tendTorches:true}:{}),...(w.clearingLoan&&w.isAlive&&w.isSubject&&w.profession==='miner'&&w.assignedWorkplaceId!=null?{clearingLoan:true}:{}),cargo:copy(w.cargo),pendingWorkRewards:copy(w.pendingWorkRewards),
      workState:w.workState,workMessage:w.workMessage??'',workTask:copy(w.workTask),assignedWorkplaceId:w.assignedWorkplaceId,arriving:w.arriving,aiCooldown:w.aiCooldown}))}:{}),
    ...(scene.pathWear?{pathWear:scene.pathWear.exportState()}:{}),
    player:{...serializeActor(c),state:c.state,currentTowerId:c.currentTower?.id??null,horseId:c.mountedHorse?.id??null,
      ...(scene.kingLogistics?{cargo:copy(c.cargo),pendingWorkRewards:copy(c.pendingWorkRewards)}:{}),
      exitTile:point(c.exitTile),order:serializeOrder(c.order),
      roofContinuation:c.roofContinuation?{...copy({...c.roofContinuation,order:null}),order:serializeOrder(c.roofContinuation.order)}:null,
      render:{x:scene.player.x,y:scene.player.y,depth:scene.player.depth},
      transition:c.transitioning?{remaining:Math.max(1,(c.transitionTween?.duration??900)-(c.transitionTween?.elapsed??0))}:null},
    inventory:scene.inventory.exportState(),equipment:scene.equipment.exportState(),
    buildings:scene.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,...(b.burntFrom?{burntFrom:b.burntFrom}:{}),...(buildingDefinition(b).crop?{farmId:b.farmId??null}:{}),...(b.type==='quarry'?{quarryMode:b.quarryMode??(buildingIsComplete(b)?'legacy':'unbound')}:{}),...(b.depositId?{depositId:b.depositId}:{}),...(b.depleted?{depleted:true}:{}),...(buildingDefinition(b).legacyFootprint&&!buildingDefinition(b).legacy?{size:buildingDefinition(b).width}:{}),...(typeof b.look==='string'&&buildingDefinition(b).artLooks?.includes(b.look)?{look:b.look}:{}),...(b.unverified?{unverified:true}:{}),...(['wall_gate','gate'].includes(b.type)&&['x','y'].includes(b.gateAxis)?{gateAxis:b.gateAxis}:{}),...(b.type==='barracks'&&Number.isInteger(b.autoHire)?{autoHire:b.autoHire}:{}),...(b.type==='iron_mine'&&b.miningMode==='adjacent'?{miningMode:'adjacent'}:{}),...(b.type==='tower'&&[1,2,3].includes(b.facing)?{facing:b.facing}:{}),...(b.level?{level:b.level}:{}),...(b.hp!=null&&buildingMaxHP(b)!=null&&b.hp<buildingMaxHP(b)?{hp:b.hp}:{}),...(b.construction?{construction:copy(b.construction)}:{}),...(b.demolition?{demolition:copy(b.demolition)}:{}),...(b.materialSupply?{materialSupply:copy(b.materialSupply)}:{})})),
    resources:[...scene.resources.values()].map(v=>({type:v.getData('objectId'),tile:point(v.getData('tile')),...(v.getData('object').natural?{natural:copy(v.getData('object').natural)}:{})})),
    drops:[...scene.dropSystem.drops.values()].map(d=>({id:d.id,resource:d.resource,tile:point(d.tile),amount:d.amount,rewardRemaining:d.rewardRemaining??1,rewardUnits:d.rewardUnits??(d.resource==='stone'?d.amount:0),haulEligible:d.haulEligible!==false,...(d.siteId!=null?{siteId:d.siteId}:{})})),
    // m-ulozeni-animals (owner 14 Nov 2026): an animal may fight back at another animal (a hunter's dog, a wolf) or at
    // somebody who is gone by now (left, removed); only a target that is still in the game is saved.
    animals:[...scene.animalSystem.animals.values()].map(a=>{const target=a.retaliationTarget,known=target&&(target===scene.character||scene.animalSystem.animals.get(target.id)===target||scene.workerSystem?.workers.get(target.id)===target);return {...serializeActor(a),retaliationId:known?target.id:null};}),
    chests:[...scene.treasureSystem.chests.values()].map(c=>({id:c.id,tile:point(c.tile),opened:c.opened,opening:c.opening,looted:c.looted,contents:copy(c.contents),
      animation:c.opening?{elapsed:c.view.openTween?.elapsed??0,lid:c.view.lid?{y:c.view.lid.y,rotation:c.view.lid.rotation}:null}:null})),
    time:scene.gameTime.exportState(),food:scene.foodSystem.exportState(),wildlifeRespawn:scene.wildlifeRespawn?.exportState()??{elapsed:0},
    spawners:scene.resourceSpawners.map(s=>({id:s.definition.id,...s.exportState()})),production:scene.production.exportState(),
    camera:{zoom:camera.zoom,x:camera.scrollX+camera.width/2,y:camera.scrollY+camera.height/2,following:scene.worldCamera.following},
    settings:(({memoryBrightness,runInBackground,...game})=>game)(scene.settingsPanel.settings),
    commands:{hunt:scene.huntingSystem.target?.id??null,huntRepath:scene.huntingSystem.repath,mount:scene.mountSystem.target?.id??null,mountRepath:scene.mountSystem.repath,
      attacks:[...scene.combat.attacks].map(([a,t])=>[a.id,t.id]),pendingChest:scene.treasureSystem.pending},
    counters:{animal:scene.animalSystem.nextId,drop:scene.dropSystem.nextId,chest:scene.treasureSystem.nextId},
  };
}

// ALPHA policy: only the current SAVE_VERSION loads. Older or newer schemas are
// reported as incompatible (never migrated, never deleted automatically).
export class IncompatibleSaveError extends Error {
  constructor(savedVersion){
    super(`This save uses save schema ${savedVersion ?? 'unknown'}, but this alpha build loads only schema ${SAVE_VERSION}. Older saves are not converted during alpha development.`);
    this.name='IncompatibleSaveError';this.savedVersion=savedVersion??null;this.currentVersion=SAVE_VERSION;
  }
}
export function saveSchemaStatus(input){
  const savedVersion=Number.isInteger(input?.saveVersion)?input.saveVersion:null;
  return {compatible:savedVersion===SAVE_VERSION,savedVersion,currentVersion:SAVE_VERSION};
}

// Validace proběhne ještě před zastavením právě běžící scény. Poškozený save
// proto nemění současný svět ani záznam v IndexedDB.
// m-velikost-mapy: a save is checked at its own map size (its terrain's height), whatever map is running now.
export function validateGameState(input,registry=objectRegistry){
  const size=Array.isArray(input?.terrain)?input.terrain.length:0;
  return validMapSize(size)?withMapSize(size,()=>validateAtSize(input,registry)):validateAtSize(input,registry);
}
function validateAtSize(input,registry){
  // m-ukladani-chyba: which part of the save failed, so the message (and a bug report) can say where.
  let part='header';const fail=()=>{const error=new Error(`${t('saves.corrupt')} [${part}]`);error.savePart=part;throw error;};
  const check=value=>{if(!value)fail();};
  const number=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>check(Number.isFinite(n)&&n>=min&&n<=max);
  const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>{number(n,min,max);check(Number.isInteger(n));};
  const tile=p=>{check(p&&typeof p==='object');integer(p.x,0,COLUMNS-1);integer(p.y,0,ROWS-1);};
  const position=p=>{check(p&&typeof p==='object');number(p.x,0,COLUMNS);number(p.y,0,ROWS);};
  const array=(a,max=Math.max(20000,COLUMNS*ROWS))=>check(Array.isArray(a)&&a.length<=max);
  const definition=(id,category)=>{const d=registry.get(id);check(d&&(!category||d.category===category));return d;};
  // Owner 13 Nov 2026: a Farmhouse of an older save (no `size`) keeps its 3 × 3 footprint.
  const bdef=b=>withFootprint(b,definition(b.type));
  const unique=(array)=>{const ids=new Set();for(const a of array){check(a.id!=null&&!ids.has(a.id));ids.add(a.id);}return ids;};
  check(input&&typeof input==='object');
  const schema=saveSchemaStatus(input);if(!schema.compatible){if(schema.savedVersion!==null)throw new IncompatibleSaveError(schema.savedVersion);fail();}
  let s;try{s=JSON.parse(JSON.stringify(input));}catch{fail();}
  if(!s.logistics){
    for(const actor of [s.player,...(s.workers??[])])for(const key of ['skills','initialSkills'])if(actor?.[key])actor[key].logistics??=createProgress();
  }else check(s.logistics.version===1);
  for(const d of s.drops??[]){d.haulEligible??=true;check(typeof d.haulEligible==='boolean');}
  try{if(s.gameSettings&&typeof s.gameSettings==='object'&&Array.isArray(s.terrain))s.gameSettings={...s.gameSettings,mapSize:s.terrain.length};const settings=gameSettings(s.gameSettings);s.gameSettings={...settings,fogOfWar:s.gameSettings?.fogOfWar??s.settings?.fogOfWar??settings.fogOfWar};}catch{fail();}
  s.saveVersion=SAVE_VERSION;
  if(s.groundLook!==undefined){try{s.groundLook=validateGroundLook(s.groundLook);}catch{fail();}}
  const dayDuration=s.gameSettings.dayLengthSeconds*1000;
  s.wildlifeRespawn??={elapsed:0};number(s.wildlifeRespawn.elapsed,0,(WILDLIFE_INTERVALS[s.gameSettings.wildlifeRespawn]||1)-1e-7);
  part='terrain';array(s.terrain,ROWS);check(s.terrain.length===ROWS);for(const row of s.terrain){array(row,COLUMNS);check(row.length===COLUMNS&&row.every(n=>n===0||n===1));}
  // #100 ground layer (water has no rock) and bushes (open ground, one per tile).
  s.ground??=exportGround(emptyGround());s.bushes??=[];check(validGroundRows(s.ground));const ground=importGround(s.ground),open=(x,y)=>s.terrain[y]?.[x]===0&&!isWaterGround(ground[y]?.[x]);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLUMNS;x++)if(isRiverGround(ground[y][x]))check(s.terrain[y][x]===0);
  // World v2: grass zones (one digit per tile) and reeds (shallow water tiles, one each).
  s.grassZones??=exportZones(emptyZones());check(validZoneRows(s.grassZones));s.reeds??=[];array(s.reeds,COLUMNS*ROWS);
  {const seen=new Set();for(const r of s.reeds){array(r,2);check(r.length===2);integer(r[0],0,COLUMNS-1);integer(r[1],0,ROWS-1);check(ground[r[1]][r[0]]===GROUND.SHALLOW&&!seen.has(`${r[0]},${r[1]}`));seen.add(`${r[0]},${r[1]}`);}}
  array(s.bushes,COLUMNS*ROWS);{const seen=new Set();for(const b of s.bushes){array(b,3);check(b.length===3);integer(b[0],0,COLUMNS-1);integer(b[1],0,ROWS-1);integer(b[2],0,BUSH_TYPES.length-1);check(open(b[0],b[1])&&!seen.has(`${b[0]},${b[1]}`));seen.add(`${b[0]},${b[1]}`);}}
  // velke-prirodni-objekty (61): thickets over grass bushes and rock groups over rock tiles, never overlapping.
  s.natureGroups??=[];validateNatureGroups(s.natureGroups,{bushes:s.bushes,terrain:s.terrain},check);
  for(const key of ['buildings','resources','animals','drops','chests','spawners'])array(s[key]);
  if(s.workers!==undefined)array(s.workers);
  const bIds=unique(s.buildings),aIds=unique(s.animals),dIds=unique(s.drops),cIds=unique(s.chests);
  const wIds=unique(s.workers??[]),unitIds=new Set(['king',...aIds,...wIds]);
  const occupied=new Set(),solid=new Set();
  // m-oznacovani-tezby (56): an unfinished wall, tower or gate may stand over a marked rock (checked in RockMiningState).
  const occupy=(p,w=1,h=1,rock=false)=>{tile(p);for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
    const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;check((open(x,y)||rock&&s.terrain[y]?.[x]===1)&&!occupied.has(key));occupied.add(key);
  }};
  const siteAssignments=new Set();
  // A provisional site (placed outside sight) claims no tiles until verified: it may lie over hidden terrain or resources.
  const provisional=new Set();
  part='buildings';for(const b of s.buildings){integer(b.id,1);const d=withFootprint(b,definition(b.type,'building'));check(d.buildable||d.starter||d.pavement||d.id==='burnt_ruins'||d.id==='wall_gate'/* m-brana-2x2: the old 1 × 1 Gate of older saves */);if(d.id==='burnt_ruins')check(buildingIsComplete(b));if(d.starter)check(buildingIsComplete(b));if(d.pavement)check(!buildingIsComplete(b));
    check(b.unverified===undefined||b.unverified===true&&b.construction?.state==='planned'&&!b.depositId);
    // m-staveni-zdi-studna (59): optional Gate axis chosen with R (older saves have none: 'y').
    check(b.gateAxis===undefined||['wall_gate','gate'].includes(b.type)&&['x','y'].includes(b.gateAxis));
    check(b.facing===undefined||b.type==='tower'&&[1,2,3].includes(b.facing));
    /* m-hrad-urovne: optional level of a Castle */check(b.level===undefined||b.type==='castle'&&[1,2,3,4].includes(b.level));
    /* m-budovy-hp: optional hit points of a damaged fortification */if(b.hp!==undefined){check(buildingMaxHP(b)!=null);number(b.hp,0,buildingMaxHP(b));}/* m-vez-otaceni: optional facing of a Tower */
    // m-kasarna-limit-zamestnani: optional automatic-employment limit of a Barracks (older saves: the default 4).
    if(b.autoHire!==undefined){check(b.type==='barracks');integer(b.autoHire,0,d.workplace?.capacity??0);}
    check(b.burntFrom===undefined||b.type==='burnt_ruins'&&typeof b.burntFrom==='string'&&definition(b.burntFrom,'building')?.id===b.burntFrom);
    if(b.unverified){tile(b);for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++){const x=b.x+dx,y=b.y+dy,key=`${x},${y}`;check(s.terrain[y]?.[x]!==undefined&&!provisional.has(key));provisional.add(key);}}
    // #150: a pavement site may lie on the floor of a finished building (not farmland); it claims no tile of its own.
    else if(d.pavement&&pavementHost(s.buildings,b,registry))tile(b);
    else occupy(b,d.width,d.height,clearsObstacles(d)&&!buildingIsComplete(b));
    if(!b.unverified&&(!d.walkable||!buildingIsComplete(b)))for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)solid.add(`${b.x+dx},${b.y+dy}`);
    if(b.construction){
      const c=b.construction;check(['planned','building','complete'].includes(c.state));number(c.requiredWork,1,86400000);check(c.requiredWork===(d.constructionTime??CONSTRUCTION_RULES.defaultTime));
      number(c.workDone,0,c.requiredWork);number(c.progress,0,100);check(Math.abs(c.progress-100*c.workDone/c.requiredWork)<1e-6);
      check(c.state==='planned'?c.workDone===0:c.state==='complete'?c.workDone===c.requiredWork:c.workDone>0&&c.workDone<c.requiredWork);
      check(typeof c.rewardsGranted==='boolean'&&c.rewardsGranted===(c.state==='complete'));
      // The price booked at placement. Since 0.9.4 the Asset Library can change prices in one browser, so it may differ from
      // today's price: a finished building keeps any valid price; a site must match today's or the default price, or the
      // materials its supply booked (physical materials).
      const invested=c.investedMaterials,samePrice=(x,y)=>!!x&&!!y&&JSON.stringify(Object.entries(x).sort())===JSON.stringify(Object.entries(y).sort());
      check(invested&&typeof invested==='object'&&!Array.isArray(invested)&&Object.entries(invested).every(([id,n])=>registry.get(id)?.category==='resource'&&Number.isSafeInteger(n)&&n>=0));
      check(c.state==='complete'||samePrice(invested,d.cost)||samePrice(invested,registry.costDefaults?.get(d.id))||(!!b.materialSupply?.required&&Object.entries(b.materialSupply.required).every(([id,n])=>invested[id]===n)));
      check(c.contributions&&typeof c.contributions==='object'&&!Array.isArray(c.contributions));let work=0;
      for(const [id,amount]of Object.entries(c.contributions)){check(id==='king'||wIds.has(id));number(amount,Number.MIN_VALUE,c.requiredWork);work+=amount;}check(Math.abs(work-c.workDone)<1e-6);
      array(c.assignedBuilders,CONSTRUCTION_RULES.maximumBuilders);check(new Set(c.assignedBuilders).size===c.assignedBuilders.length);if(c.state==='complete')check(!c.assignedBuilders.length);
      for(const id of c.assignedBuilders){check((id==='king'||wIds.has(id))&&!siteAssignments.has(id));siteAssignments.add(id);}
    }
  }
  for(const b of s.buildings)if(b.demolition!==undefined){
    const d=bdef(b),c=b.demolition;
    check(buildingIsComplete(b)&&(d.buildable||d.id==='burnt_ruins')&&!d.starter&&!d.pavement&&b.type!=='castle'&&!b.unverified);
    check(c&&typeof c==='object'&&!Array.isArray(c)&&Object.keys(c).every(k=>['state','requiredWork','workDone','progress','contributions','assignedBuilders','refund'].includes(k)));
    check(['planned','building'].includes(c.state));number(c.requiredWork,1,86400000);check(c.requiredWork===(d.constructionTime??CONSTRUCTION_RULES.defaultTime));
    number(c.workDone,0,c.requiredWork);number(c.progress,0,100);check(Math.abs(c.progress-100*c.workDone/c.requiredWork)<1e-6);check(c.state==='planned'?c.workDone===0:c.workDone>0);
    check(c.refund&&typeof c.refund==='object'&&JSON.stringify(Object.entries(c.refund).sort())===JSON.stringify(Object.entries(buildingDemolitionRefund(b,d)).sort()));
    check(c.contributions&&typeof c.contributions==='object'&&!Array.isArray(c.contributions));let work=0;
    for(const [id,amount]of Object.entries(c.contributions)){check(wIds.has(id));number(amount,Number.MIN_VALUE,c.requiredWork);work+=amount;}check(Math.abs(work-c.workDone)<1e-6);
    array(c.assignedBuilders,CONSTRUCTION_RULES.maximumBuilders);check(new Set(c.assignedBuilders).size===c.assignedBuilders.length);
    for(const id of c.assignedBuilders){const w=s.workers?.find(w=>w.id===id);check(w?.isAlive&&w.profession==='builder'&&w.workTask?.kind==='dismantle'&&w.workTask.targetId===b.id&&!siteAssignments.has(id));siteAssignments.add(id);}
  }
  const plotCounts=new Map();
  for(const b of s.buildings){
    const d=bdef(b);if(!d.crop){check(b.farmId===undefined);continue;}
    check(b.farmId===null||Number.isSafeInteger(b.farmId)&&b.farmId>0);
    if(b.farmId!==null){const farm=s.buildings.find(f=>f.id===b.farmId);check(farmInRange(farm,b,x=>bdef(x)));const count=(plotCounts.get(farm.id)??0)+1;check(count<=FARM_PLOT_CAPACITY);plotCounts.set(farm.id,count);}
  }
  for(const key of provisional)check(!occupied.has(key));
  repairTransportInstructions(s,registry,check);
  part='nature';const natural=s.naturalResources;check(natural&&Object.keys(natural).every(key=>['nextId','nextDepositId','growthClock','ageClock','refreshElapsed','kingTask','rockMining'].includes(key)));integer(natural.nextId,1);integer(natural.nextDepositId,1);number(natural.ageClock,0,s.time.totalElapsed/dayDuration+1e-6);number(natural.growthClock,0,natural.ageClock*1.25*devRange('forestGrowth').max+1e-6);/* m-drevorubci-stromy: Dev forest growth up to ×4 */number(natural.refreshElapsed,0,FORESTRY.refreshInterval);check(natural.refreshElapsed<FORESTRY.refreshInterval);
  const resourceTiles=new Set(),treeIds=new Map(),depositIds=new Map();
  for(const r of s.resources){const d=definition(r.type,'resource');tile(r.tile);
    if(d.tree){const n=r.natural;check(n&&n.kind==='tree'&&Object.keys(n).every(key=>['id','kind','stage','ageDays','growthDays','cycle','workDone','growthCheckpoint','ageCheckpoint','rot'].includes(key)));if(n.rot!==undefined)number(n.rot,0,FORESTRY.stumpRotDays);const id=String(n.id).match(/^tree-([1-9]\d*)$/);check(id&&Number(id[1])<natural.nextId&&!treeIds.has(n.id));treeIds.set(n.id,r);integer(n.stage,0,3);integer(n.cycle,0);number(n.ageDays);number(n.growthDays,0,n.stage===3?0:FORESTRY.stageDays[n.stage]);number(n.workDone,0,n.stage===3?Math.max(d.tree.chopDuration*(s.devBalance?.chopTime??1),FORESTRY.legacyChopDuration):0);/* m-drevorubci-stromy: the save's chopping time */number(n.growthCheckpoint,0,natural.growthClock+1e-8);number(n.ageCheckpoint,0,natural.ageClock+1e-8);}
    else if(d.deposit){const n=r.natural;check(n&&n.kind==='deposit'&&Object.keys(n).every(key=>['id','kind','remaining','max','boundBuildingId'].includes(key)));const id=String(n.id).match(/^deposit-([1-9]\d*)$/);check(id&&Number(id[1])<natural.nextDepositId&&!depositIds.has(n.id));depositIds.set(n.id,r);/* m-loziska-kamene-2x: a stone deposit from before the change (max under the new minimum) gets twice its stone, once */if(d.deposit.resource==='stone'&&Number.isInteger(n.max)&&n.max<d.deposit.min&&n.max*2>=d.deposit.min&&Number.isInteger(n.remaining)){n.max*=2;n.remaining*=2;}integer(n.max,d.deposit.min,d.deposit.max);integer(n.remaining,0,n.max);check(n.boundBuildingId==null||bIds.has(n.boundBuildingId));}
    else check(r.natural===undefined);
    for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++){
    // Rock edges may sit under a neighbouring Quarry; unique reciprocal primary bindings are checked below.
    const x=r.tile.x+dx,y=r.tile.y+dy,key=`${x},${y}`,overlap=s.buildings.find(b=>!b.unverified&&x>=b.x&&x<b.x+bdef(b).width&&y>=b.y&&y<b.y+bdef(b).height),allowedOverlap=d.tree&&(r.natural.stage===0||!!overlap&&clearsObstacles(bdef(overlap))&&!buildingIsComplete(overlap))||depositFamily(r.type)==='stone_deposit'&&overlap?.type==='quarry'&&overlap.quarryMode==='finite'||depositFamily(r.type)==='iron_deposit'&&overlap?.type==='iron_mine'&&overlap.miningMode!=='adjacent';check(open(x,y)&&(!occupied.has(key)||allowedOverlap)&&!resourceTiles.has(key));resourceTiles.add(key);if(d.deposit||d.tree&&r.natural.stage===3)solid.add(key);
  }}
  const boundDeposits=new Set();for(const b of s.buildings){
    if(b.type==='quarry'){check(['finite','legacy','unbound'].includes(b.quarryMode));if(b.quarryMode==='legacy')check(buildingIsComplete(b)&&b.depositId===undefined);if(b.quarryMode==='unbound')check(b.depositId===undefined);}
    // m-vytezeny-dul-ctverecky (64): optional `depleted: true` only on a finished mine whose bound deposit is empty.
    check(b.size===undefined||!!definition(b.type).legacyFootprint&&b.size===definition(b.type).width);
    check(b.look===undefined||(bdef(b)?.artLooks??[]).includes(b.look));
    check(b.depleted===undefined||b.depleted===true&&buildingIsComplete(b)&&(b.type==='iron_mine'||b.type==='quarry'&&b.quarryMode==='finite')&&depositIds.get(b.depositId)?.natural.remaining===0);
    if(b.type==='iron_mine'||b.type==='quarry'&&b.quarryMode==='finite'){const r=depositIds.get(b.depositId),spec=bdef(b).mining;check(r&&depositFamily(r.type)===spec.depositType&&r.natural.boundBuildingId===b.id&&!boundDeposits.has(b.depositId));boundDeposits.add(b.depositId);const rd=bdef(r),bd=bdef(b);const over=r.tile.x<b.x+bd.width&&r.tile.x+rd.width>b.x&&r.tile.y<b.y+bd.height&&r.tile.y+rd.height>b.y;
      // m-dul-na-lozisku: an Iron Mine of an older save stands beside its deposit; it keeps working it.
      if(b.type==='iron_mine'&&b.miningMode===undefined&&!over)b.miningMode='adjacent';check(b.miningMode===undefined||b.type==='iron_mine'&&b.miningMode==='adjacent'&&!over);
      if(spec.overlap&&b.miningMode!=='adjacent')check(over);else{const dx=Math.max(0,b.x-r.tile.x-rd.width+1,r.tile.x-b.x-bd.width+1),dy=Math.max(0,b.y-r.tile.y-rd.height+1,r.tile.y-b.y-bd.height+1);check(Math.hypot(dx,dy)<=spec.range);}}
  }
  for(const r of depositIds.values())if(r.natural.boundBuildingId!=null)check(boundDeposits.has(r.natural.id));
  if(natural.kingTask!=null){const task=natural.kingTask,r=treeIds.get(task.treeId);check(r&&r.natural.stage===3&&!s.player.horseId&&typeof task.arrived==='boolean'&&Object.keys(task).every(key=>['treeId','goal','arrived'].includes(key)));tile(task.goal);check(Math.abs(task.goal.x-r.tile.x)+Math.abs(task.goal.y-r.tile.y)===1);}
  part='chests';for(const c of s.chests){check(typeof c.id==='string');occupy(c.tile);solid.add(`${c.tile.x},${c.tile.y}`);check(!resourceTiles.has(`${c.tile.x},${c.tile.y}`));
    check(typeof c.opened==='boolean'&&typeof c.opening==='boolean'&&typeof c.looted==='boolean'&&(!c.looted||c.opened));
    integer(c.contents?.gold,50,100);array(c.contents?.equipment,10);for(const id of c.contents.equipment)definition(id,'equipment');
    if(c.opening){number(c.animation?.elapsed,0,350);if(c.animation.lid){number(c.animation.lid.y,-100,100);number(c.animation.lid.rotation,-10,10);}}
  }
  part='drops';for(const d of s.drops){check(typeof d.id==='string');check(definition(d.resource,'resource').collectible);tile(d.tile);integer(d.amount,1);d.rewardRemaining??=1;number(d.rewardRemaining);d.rewardUnits??=d.resource==='stone'?d.amount:0;number(d.rewardUnits,0,d.amount);check(open(d.tile.x,d.tile.y)&&!solid.has(`${d.tile.x},${d.tile.y}`));}
  const skillsState=skills=>{
    check(skills&&typeof skills==='object'&&!Array.isArray(skills)&&Object.keys(skills).length===SKILL_IDS.length);
      for(const id of SKILL_IDS){const e=skills[id];check(e&&typeof e.enabled==='boolean');integer(e.maxLevel,1,50);integer(e.level,1,e.maxLevel);number(e.gainMultiplier,0,1e6);number(e.currentXP);number(e.totalXP,0,totalXPForLevel(e.maxLevel));
        const required=e.level===e.maxLevel?0:getXPRequired(e.level);check(e.xpToNextLevel===required);check(required?e.currentXP<required:e.currentXP===0);check(Math.abs(e.totalXP-totalXPForLevel(e.level)-e.currentXP)<1e-6);
        check(e.modifiers&&typeof e.modifiers==='object'&&!Array.isArray(e.modifiers));for(const [key,value]of Object.entries(e.modifiers)){check(!['__proto__','constructor','prototype'].includes(key));number(value,0,1e6);}
      }
  };
  const actor=a=>{
    check(a&&typeof a.isAlive==='boolean');bdef(a);tile(a.tile);position(a.position);if(a.nextTile)tile(a.nextTile);array(a.path,20000);a.path.forEach(tile);
    number(a.direction?.x,-1,1);number(a.direction?.y,-1,1);number(a.speed,0,100);
    number(a.maxHP,1,1e9);number(a.currentHP,0,a.maxHP);check(a.isAlive?a.currentHP>0:a.currentHP===0);
    const b=a.baseStats;check(b);number(b.maxHP,1,1e9);number(b.attackDPS,0,1e9);number(b.armor,0,90);number(b.attackRange,0,100);number(b.hpRegenPerSecond,0,1e6);
    check(a.statModifiers&&typeof a.statModifiers==='object'&&!Array.isArray(a.statModifiers));
    for(const [name,m]of Object.entries(a.statModifiers)){check(!['__proto__','prototype','constructor'].includes(name)&&m&&typeof m==='object');for(const [key,v]of Object.entries(m)){check(['maxHP','attackBonus','attackMultiplier','armor','hpRegenPerSecond','attackRange'].includes(key));number(v,key==='attackMultiplier'?0:-1e6,1e6);}}
    if(a.experience!==undefined){
      const e=a.experience;check(bdef(a).category==='character'&&e&&typeof e.enabled==='boolean');
      integer(e.maxLevel,1,50);integer(e.level,1,e.maxLevel);number(e.gainMultiplier,0,1e6);number(e.currentXP);number(e.totalXP,0,totalXPForLevel(e.maxLevel));
      const required=e.level===e.maxLevel?0:getXPRequired(e.level);check(e.xpToNextLevel===required);check(required?e.currentXP<required:e.currentXP===0);
      check(Math.abs(e.totalXP-totalXPForLevel(e.level)-e.currentXP)<1e-6);check(e.modifiers&&typeof e.modifiers==='object'&&!Array.isArray(e.modifiers));
      for(const [key,value]of Object.entries(e.modifiers)){check(!['__proto__','constructor','prototype'].includes(key));number(value,0,1e6);}
    }
    if(a.skills!==undefined){
      check(bdef(a).category==='character');skillsState(a.skills);
      check(a.activitySkill==null||SKILL_IDS.includes(a.activitySkill));
    }
  };
  part='king';const p=s.player;actor(p);check(p.id==='king'&&p.type==='king'&&p.isAlive);
  check(['ground','enteringTower','onTower','onWall','exitingTower'].includes(p.state));
  check(p.currentTowerId==null||bIds.has(p.currentTowerId));check(p.horseId==null||aIds.has(p.horseId));
  if(p.state!=='ground')check(bIds.has(p.currentTowerId)&&buildingIsComplete(s.buildings.find(b=>b.id===p.currentTowerId))&&!p.horseId);
  if(p.exitTile)tile(p.exitTile);
  if(['enteringTower','exitingTower'].includes(p.state)){number(p.transition?.remaining,1,900);if(p.state==='exitingTower')tile(p.exitTile);}
  number(p.render?.x,-1e6,1e6);number(p.render?.y,-1e6,1e6);number(p.render?.depth,-1e6,1e6);
  part='animals';for(const a of s.animals){definition(a.type,'animal');check(typeof a.id==='string');actor(a);number(a.wanderWait,-1e9,1e9);check(a.retaliationId==null||unitIds.has(a.retaliationId));if(a.mounted)check(p.horseId===a.id&&a.type==='horse');}
  const depositClaims=new Map(),reservations=new Set(natural.kingTask?[`natural:${natural.kingTask.treeId}`]:[]);
  part='workers';if(s.workers!==undefined){
    integer(s.population?.nextId,1);integer(s.population.lastMigrationDay,1,s.time?.day??Number.MAX_SAFE_INTEGER);
    if(s.population.deceased!==undefined){array(s.population.deceased,50);for(const d of s.population.deceased){check(d&&['cause,day,name,profession','cause,day,identity,name,profession'].includes(Object.keys(d).sort().join())&&(d.identity===undefined||validIdentity(d.identity))&&typeof d.name==='string'&&d.name.length<100&&Object.hasOwn(JOBS,d.profession)&&/^(wounds|killed:[a-z_]{1,40})$/.test(d.cause));integer(d.day,1);}}
    const identities=new Set();
    for(const w of s.workers){
      if(w.naturalTalent!==undefined||w.initialSkills!==undefined){
        check(Object.hasOwn(TALENTS,w.naturalTalent)&&w.skills);skillsState(w.initialSkills);
        for(const id of SKILL_IDS)check(w.initialSkills[id].totalXP<=w.skills[id].totalXP+1e-6);
      }
      check(w.type==='peasant');actor(w);check(typeof w.name==='string'&&w.name.length>0&&w.name.length<100&&Object.hasOwn(JOBS,w.profession));
      // m-obyvatele-jmena-spanek-pohyb (31): an optional identity of name list indices; a name never repeats in a game.
      if(w.identity!==undefined){check(validIdentity(w.identity)&&!identities.has(identityKey(w.identity)));identities.add(identityKey(w.identity));}
      const command=w.commandState;check(command&&['Working','MovingToHold','Holding'].includes(command.state)&&Object.keys(command).length===2);
      if(command.state==='MovingToHold')tile(command.goal);else check(command.goal===null||command.state==='Holding');
      if(command.state==='Holding'&&command.goal!==null)tile(command.goal);
      if(command.state!=='Working')check(w.isAlive&&w.isSubject&&!w.workTask&&!w.arriving);
      if(command.state==='Holding')check(w.path.length===0);
      check(typeof w.isSubject==='boolean');if(w.isAlive)check(w.diedAt===null);else number(w.diedAt,0,s.time?.totalElapsed);
      check(w.isSubject||(!w.workTask&&w.assignedWorkplaceId==null&&w.profession==='idle'&&!w.cargo&&!(w.pendingWorkRewards?.length)));
      const match=String(w.id).match(/^worker-(\d+)$/);check(match&&Number(match[1])>0&&Number(match[1])<s.population.nextId);
      check(typeof w.arriving==='boolean');number(w.aiCooldown,-1e9,1e9);number(w.wanderWait,-1e9,1e9);check(w.assignedWorkplaceId==null||bIds.has(w.assignedWorkplaceId));
      check(['Holding','MovingToHold','Idle','Searching for Work','Moving to Target','Working','Returning','Waiting','Fleeing','Recovering','Arriving','Dead','Going to Workplace','Searching for Target','Traveling to Target','Returning to Workplace','Patrolling','Going Home','Resting','On Strike','Leaving Kingdom','Left Kingdom'].includes(w.workState));
      // #58 phase B: only a living resident goes home or rests.
      if(w.restPhase!==undefined)check(['going','resting'].includes(w.restPhase)&&w.isAlive&&w.isSubject);
      if(w.tendTorches!==undefined)check(w.tendTorches===true);
      // Army squads (owner, 12 Nov): optional squad number of a soldier.
      if(w.squad!==undefined){integer(w.squad,1,SQUAD_MAX);check(w.profession==='soldier');}
      // m-hlidka-hradby: optional wall patrol order of a soldier.
      if(w.wallPatrol!==undefined){check(w.profession==='soldier');if(w.wallPatrol!==true){const post=w.wallPatrol?.post;check(post&&Object.keys(w.wallPatrol).join()==='post'&&Number.isInteger(post.x)&&Number.isInteger(post.y)&&Object.keys(post).every(k=>['x','y','tower'].includes(k))&&(post.tower===undefined||Number.isInteger(post.tower)));}}
      // m-oznacovani-tezby (56): a Miner lent out to the rocks of a wall plan keeps his workplace.
      if(w.clearingLoan!==undefined)check(w.clearingLoan===true&&w.isAlive&&w.isSubject&&w.profession==='miner'&&w.assignedWorkplaceId!=null);
      check(typeof w.workMessage==='string'&&w.workMessage.length<200);
      // m-nosic-priorita: optional, so saves of 0.98 and older still load (SAVE_VERSION stays 62).
      if(w.haulPriority!==undefined)check(validHaulPriority(w.haulPriority)&&w.haulPriority.kind!=='any');
      if(w.stoneCollection!==undefined){check(w.stoneCollection&&typeof w.stoneCollection.enabled==='boolean'&&Object.keys(w.stoneCollection).length===2);integer(w.stoneCollection.radius,0,IDLE_STONE.maxRadius);}if(w.profession==='hauler')check(w.stoneCollection);if(!w.isAlive)check(['Dead','Left Kingdom'].includes(w.workState)&&!w.workTask&&!w.arriving);else check(w.workState!=='Left Kingdom');
      check(Object.hasOwn(JOBS,w.displayProfession)&&['idle',w.profession].includes(w.displayProfession));
      const t=w.workTask;if(t){
        check(w.isAlive&&['mine','mineDrop','hunt','collectMeat','build','dismantle','harvest','chopTree','clearMark','mineDeposit','mineRock','foodPickup','foodDeliver','produce','fish'].includes(t.kind));tile(t.goal);number(t.progressMs,0,t.kind==='clearMark'?Math.max(CLEARING.bushMs,CLEARING.saplingMs):t.kind==='fish'?s.gameSettings.dayLengthSeconds*1000*FISHING.maxTripDays:t.kind==='mineRock'?ROCK_MINING.duration:t.kind==='mineDeposit'?(definition(s.buildings.find(b=>b.id===w.assignedWorkplaceId)?.type).mining?.duration??0):t.kind==='harvest'?(definition(s.buildings.find(b=>b.id===t.targetId)?.type).crop?.workDuration??0):WORK_RULES.miningDuration);
        const prefix=t.kind==='mine'?'resource':t.kind==='hunt'?'animal':'drop',expected=t.kind==='fish'?`natural-slot:${t.goal.x},${t.goal.y}`:t.kind==='mineRock'?`rock:${t.targetId}`:t.kind==='clearMark'?`clear:${t.targetId}`:t.kind==='mineDeposit'?`mineral:${t.targetId}:${w.id}`:t.kind==='chopTree'?`natural:${t.targetId}`:t.kind==='produce'?`production-slot:${t.goal.x},${t.goal.y}`:['foodPickup','foodDeliver'].includes(t.kind)?`food-task:${t.transferId}`:['build','dismantle'].includes(t.kind)?`construction-slot:${t.goal.x},${t.goal.y}`:t.kind==='harvest'?`crop:${t.targetId}`:`${prefix}:${t.targetId}`;check(t.reservation===expected&&!reservations.has(t.reservation));reservations.add(t.reservation);
        if(t.kind==='foodPickup'&&t.sourceDropId){check(!reservations.has(`drop:${t.sourceDropId}`));reservations.add(`drop:${t.sourceDropId}`);}
        if(['mine','mineDrop'].includes(t.kind)){const home=s.buildings.find(b=>b.id===w.assignedWorkplaceId);check(home?.type!=='iron_mine'&&!['finite','unbound'].includes(home?.quarryMode));}
        if(t.kind==='mineRock')check(w.profession==='miner'&&(w.assignedWorkplaceId==null||w.clearingLoan===true)&&w.manualRockId===t.targetId);
        // m-oznacovani-tezby (51): a Woodcutter cutting a marked bush or sapling (the mark itself: RockMiningState).
        if(t.kind==='clearMark'){const home=s.buildings.find(b=>b.id===w.assignedWorkplaceId),slot=`natural-slot:${t.goal.x},${t.goal.y}`;check(w.profession==='woodcutter'&&home?.type==='lumberjack_hut'&&buildingIsComplete(home)&&typeof t.targetId==='string'&&/^(tree|bush):/.test(t.targetId)&&!reservations.has(slot));reservations.add(slot);}
        if(t.kind==='mine')check((w.profession==='miner'&&t.idleStone===undefined||w.profession==='hauler'&&t.idleStone===true&&w.stoneCollection?.enabled)&&s.resources.some(r=>r.type==='stone'&&`${r.tile.x},${r.tile.y}`===t.targetId));
        if(t.kind==='fish'){const home=s.buildings.find(b=>b.id===w.assignedWorkplaceId);check(w.profession==='fisher'&&home?.id===t.targetId&&home.type==='fisherman_hut'&&buildingIsComplete(home)&&open(t.goal.x,t.goal.y));
          integer(t.caught,0,FISHING.basket-1);number(t.fraction,0,FISHING.basket+1);check(Object.hasOwn(FISHING.depth,t.depth)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>fishingGround(ground[t.goal.y+dy]?.[t.goal.x+dx])===t.depth));integer(t.bodyId,0);}
        if(t.kind==='hunt')check(w.profession==='hunter'&&aIds.has(t.targetId));if(t.kind==='collectMeat')check(w.profession==='hunter'&&dIds.has(t.targetId));
        if(t.kind==='mineDrop')check(w.profession==='miner'&&s.drops.some(d=>d.id===t.targetId&&d.resource==='stone'));
        if(t.kind==='chopTree'){const target=treeIds.get(t.targetId),home=s.buildings.find(b=>b.id===w.assignedWorkplaceId),slot=`natural-slot:${t.goal.x},${t.goal.y}`;check(w.profession==='woodcutter'&&home?.type==='lumberjack_hut'&&buildingIsComplete(home)&&target?.natural.stage===3&&Math.abs(target.tile.x-t.goal.x)+Math.abs(target.tile.y-t.goal.y)===1&&!reservations.has(slot));reservations.add(slot);}
        if(t.kind==='mineDeposit'){
          const target=depositIds.get(t.targetId),home=s.buildings.find(b=>b.id===w.assignedWorkplaceId),spec=home&&bdef(home).mining,slot=`natural-slot:${t.goal.x},${t.goal.y}`;
          check(w.profession==='miner'&&home&&buildingIsComplete(home)&&spec&&home.depositId===t.targetId&&target?.natural.remaining>0&&!reservations.has(slot)&&!solid.has(`${t.goal.x},${t.goal.y}`));reservations.add(slot);
          const workObject=spec.overlap&&home.miningMode!=='adjacent'?{...home,definition:bdef(home)}:{...target.tile,definition:bdef(target)};check(towerNeighbors(workObject).some(p=>p.x===t.goal.x&&p.y===t.goal.y));
          const count=(depositClaims.get(t.targetId)??0)+1;depositClaims.set(t.targetId,count);check(count<=target.natural.remaining);
        }
        if(t.kind==='dismantle'){
          const target=s.buildings.find(b=>b.id===t.targetId);check(target&&buildingIsComplete(target)&&target.demolition?.assignedBuilders.includes(w.id)&&w.profession==='builder');
          check(towerNeighbors({...target,definition:bdef(target)}).some(p=>p.x===t.goal.x&&p.y===t.goal.y));
        }
        if(t.kind==='build'){
          const site=s.buildings.find(b=>b.id===t.targetId);check(site&&!buildingIsComplete(site)&&site.construction.assignedBuilders.includes(w.id));if(bdef(site).crop){const home=s.buildings.find(b=>b.id===w.assignedWorkplaceId);check(w.profession==='farmer'&&home?.type==='farmhouse'&&buildingIsComplete(home)&&site.farmId===home.id);}else check(w.profession==='builder');
          check(towerNeighbors(pavementHost(s.buildings,site,registry)??site).some(p=>p.x===t.goal.x&&p.y===t.goal.y));
        }
        if(t.kind==='harvest'){
          const plot=s.buildings.find(b=>b.id===t.targetId),record=s.farming?.records?.find(r=>r.buildingId===t.targetId),home=s.buildings.find(b=>b.id===w.assignedWorkplaceId);
          check(w.profession==='farmer'&&plot&&home?.type==='farmhouse'&&buildingIsComplete(plot)&&buildingIsComplete(home)&&bdef(plot).crop&&plot.farmId===home.id&&record?.reservedBy===w.id);
          check(t.goal.x>=plot.x&&t.goal.x<plot.x+bdef(plot).width&&t.goal.y>=plot.y&&t.goal.y<plot.y+bdef(plot).height);
          integer(t.cycle);check(t.cycle===record.cycle&&record.growthDays===bdef(plot).crop.growthDays);number(t.startedAt,0,s.time?.totalElapsed??0);
        }
      }
      if(w.workplaceReached!==undefined)check(typeof w.workplaceReached==='boolean');
      if(w.cargo){check(w.isAlive&&(w.assignedWorkplaceId!=null||(['hauler','builder'].includes(w.profession)||w.profession==='miner'&&w.cargo.rockId!=null))&&definition(w.cargo.resource).category==='resource'&&w.cargo.resource!=='gold');integer(w.cargo.amount,1,s.foodStorage?.physicalMaterials||s.foodStorage&&FOOD_RESOURCE_IDS.includes(w.cargo.resource)?carryCapacity({...w,vehicleType:s.vehicles?.vehicles.find(v=>v.operatorId===w.id&&v.state==='inUse')?.type??null},w.cargo.resource):Number.MAX_SAFE_INTEGER);if(w.cargo.transportCancelled!==undefined)check(typeof w.cargo.transportCancelled==='boolean');}
      if(w.pendingWorkRewards!==undefined){array(w.pendingWorkRewards,10000);for(const event of w.pendingWorkRewards){
        check(w.isAlive&&w.assignedWorkplaceId!=null);check((event.type==='resourceCollected'&&event.objectType==='stone')||(event.type==='dropCollected'&&event.objectType==='meat')||(event.type==='animalKilled'&&registry.get(event.objectType)?.category==='animal')/* m-ukladani-chyba: a Hunter who kills a wolf or a fox keeps that reward too */);integer(event.quantity??1,1);if(event.contributionRatio!==undefined)number(event.contributionRatio);
      }}
    }
  }
  part='fishing';if(s.fishing!==undefined)validateFishingState(s.fishing,{bodies:waterBodies(ground).bodies,buildingIds:new Set(s.buildings.filter(b=>b.type==='fisherman_hut').map(b=>b.id)),check,integer,number});
  part='workplaces';if(s.workplaces!==undefined){
    array(s.workplaces?.records);const recorded=new Set(),assigned=new Set();
    for(const record of s.workplaces.records){
      check(bIds.has(record.buildingId)&&!recorded.has(record.buildingId));recorded.add(record.buildingId);
      const b=s.buildings.find(b=>b.id===record.buildingId),spec=bdef(b).workplace;check(spec&&buildingIsComplete(b)&&record.capacity===spec.capacity);
      array(record.workerIds,spec.capacity);check(new Set(record.workerIds).size===record.workerIds.length&&(!b.depleted||!record.workerIds.length));
      for(const id of record.workerIds){const worker=s.workers?.find(w=>w.id===id);check(worker?.isAlive&&worker.isSubject&&worker.assignedWorkplaceId===b.id&&worker.profession===spec.profession&&!assigned.has(id));assigned.add(id);}
      check(record.delivered&&typeof record.delivered==='object'&&!Array.isArray(record.delivered));for(const [id,n]of Object.entries(record.delivered)){check(definition(id).category==='resource'&&id!=='gold');integer(n);}
      if(record.forestry){check(b.type==='lumberjack_hut');integer(record.forestry.harvested,0);integer(record.forestry.day,1,s.time.day);integer(record.forestry.producedToday,0,record.forestry.harvested);}
    }
    check(s.buildings.filter(b=>buildingIsComplete(b)&&bdef(b).workplace).every(b=>recorded.has(b.id)));
    for(const worker of s.workers??[])if(worker.assignedWorkplaceId!=null)check(assigned.has(worker.id));
  }
  part='construction';if(s.constructionSystem!==undefined){
    const c=s.constructionSystem;check(c);integer(c.nextId,Math.max(0,...s.buildings.map(b=>b.id))+1);
    check(c.kingSiteId==null||bIds.has(c.kingSiteId));
    if(c.kingSiteId!=null){const site=s.buildings.find(b=>b.id===c.kingSiteId);check(!buildingIsComplete(site)&&!bdef(site).crop&&site.construction.assignedBuilders.includes('king'));tile(c.kingGoal);check(towerNeighbors(pavementHost(s.buildings,site,registry)??site).some(p=>p.x===c.kingGoal.x&&p.y===c.kingGoal.y));check(!reservations.has(`construction-slot:${c.kingGoal.x},${c.kingGoal.y}`));}
    else check(c.kingGoal==null&&!siteAssignments.has('king'));
    for(const id of siteAssignments)if(id!=='king'){const w=s.workers?.find(w=>w.id===id);check(w?.isAlive&&['build','dismantle'].includes(w.workTask?.kind)&&['builder','farmer'].includes(w.profession));}
  }else check(!s.buildings.some(b=>!buildingIsComplete(b)));
  const plots=s.buildings.filter(b=>buildingIsComplete(b)&&bdef(b).crop);
  part='farming';if(s.farming!==undefined){
    const f=s.farming;check(f&&f.clocks&&typeof f.clocks==='object'&&Object.keys(f.clocks).length===Object.keys(FARMING_RULES.crops).length);
    for(const id of Object.keys(FARMING_RULES.crops))number(f.clocks[id]);number(f.refreshElapsed,0,FARMING_RULES.refreshInterval);array(f.records);check(f.records.length===plots.length);const recorded=new Set();
    for(const r of f.records){const plot=plots.find(b=>b.id===r.buildingId);check(plot&&!recorded.has(r.buildingId));recorded.add(r.buildingId);const crop=bdef(plot).crop;
      number(r.growthDays,0,crop.growthDays);number(r.lastClock,0,f.clocks[plot.type]);integer(r.stage,0,3);check(r.stage===seasonalCropStage(plot.type,r.growthDays,crop.growthDays,s.seasons?.season));integer(r.cycle);
      check(r.reservedBy==null||s.workers?.some(w=>w.isAlive&&w.id===r.reservedBy&&w.profession==='farmer'&&w.workTask?.kind==='harvest'&&w.workTask.targetId===r.buildingId));
    }
  }else check(!plots.length);
  if(p.horseId)check(s.animals.some(a=>a.id===p.horseId&&a.type==='horse'&&a.mounted&&a.isAlive));
  const order=o=>{if(!o)return;check(['move','enter','collect','drop','openChest','approachAnimal'].includes(o.kind));check(typeof o.explore==='boolean'&&(!o.explore||o.kind==='move'));if(o.kind==='move'||o.kind==='drop')tile(o.goal);
    if(o.kind==='enter')check(bIds.has(o.buildingId)&&buildingIsComplete(s.buildings.find(b=>b.id===o.buildingId)));if(o.kind==='approachAnimal')check(aIds.has(o.animalId));if(o.kind==='drop')check(dIds.has(o.dropId));
    if(o.kind==='openChest')check(cIds.has(o.chestId));if(o.kind==='collect')check(s.resources.some(r=>`${r.tile.x},${r.tile.y}`===o.resourceKey));};
  order(p.order);if(p.roofContinuation){order(p.roofContinuation.order);tile(p.roofContinuation.exit);tile(p.roofContinuation.destination);array(p.roofContinuation.path);p.roofContinuation.path.forEach(tile);}
  part='inventory';check(s.inventory&&typeof s.inventory==='object');for(const [id,count]of Object.entries(s.inventory)){const d=definition(id);check(['resource','equipment'].includes(d.category));if(id==='gold')number(count);else integer(count);}
  check(s.equipment&&Object.keys(s.equipment).length===2);for(const slot of ['weapon','armor'])if(s.equipment[slot]!=null){const id=s.equipment[slot];check(definition(id,'equipment').equipment.slot===slot&&(s.inventory[id]??0)>0);}
  part='time';integer(s.time?.day,1);number(s.time.elapsed,0,dayDuration-1e-7);number(s.time.totalElapsed);check(Math.abs(s.time.totalElapsed-((s.time.day-1)*dayDuration+s.time.elapsed))<.01);
  s.time.compensation??=0;number(s.time.compensation,-1e-6,1e-6);
  part='ledger';validateResourceLedger(s.resourceLedger,registry,s.time,dayDuration,{check,number,integer,array});
  number(s.food?.elapsed,0,(s.food?.residents?dayDuration/2:registry.require('meat').consumption.interval)-1e-7);
  const spawnIds=new Set();for(const t of s.spawners){const d=definition(t.id,'resource');check(d.spawn&&!spawnIds.has(t.id));spawnIds.add(t.id);number(t.elapsed,0,d.spawn.interval-1e-7);}
  check(registry.byCategory('resource').filter(d=>d.spawn).every(d=>spawnIds.has(d.id)));
  integer(s.production?.lastProcessedDay,1,s.time.day);
  part='wages';if(s.wages!==undefined){
    const wages=s.wages;check(wages&&s.workers);integer(wages.lastProcessedDay,1,s.time.day);check(wages.lastProcessedDay===s.time.day);
    check(wages.accruals&&typeof wages.accruals==='object'&&!Array.isArray(wages.accruals));
    for(const [id,cost]of Object.entries(wages.accruals)){check(wIds.has(id)&&cost);number(cost.rateMilliseconds,0,s.time.elapsed*6+1e-6);number(cost.compensation,-1e-6,1e-6);}
    array(wages.arrears,1000000);const debts=new Set();
    for(const debt of wages.arrears){check(wIds.has(debt.workerId));integer(debt.day,1,s.time.day-1);number(debt.amount,Number.MIN_VALUE,6);const key=`${debt.workerId}:${debt.day}`;check(!debts.has(key));debts.add(key);}
  }
  if(s.pathWear){
    const w=s.pathWear;for(const key of ['scores','levels','lastPassDays']){array(w[key],COLUMNS*ROWS);check(w[key].length===COLUMNS*ROWS);}
    integer(w.lastDecayDay,1,s.time.day);
    // S11 pavement: sorted unique tile indices on open, non-rock ground.
    array(w.paved,COLUMNS*ROWS);for(let i=0;i<w.paved.length;i++){integer(w.paved[i],0,COLUMNS*ROWS-1);if(i)check(w.paved[i]>w.paved[i-1]);check(open(w.paved[i]%COLUMNS,Math.floor(w.paved[i]/COLUMNS)));}
    for(let i=0;i<COLUMNS*ROWS;i++){integer(w.scores[i]);integer(w.levels[i],0,4);integer(w.lastPassDays[i],0,s.time.day);check(w.levels[i]===wearLevel(w.scores[i]));if(w.scores[i])check(w.lastPassDays[i]>0);}
  }
  part='camera';number(s.camera?.zoom,MIN_ZOOM,MAX_ZOOM);number(s.camera.x,-1e6,1e6);number(s.camera.y,-1e6,1e6);check(typeof s.camera.following==='boolean');
  check(typeof s.settings?.fogOfWar==='boolean');if(s.settings.pathWearDebug!==undefined)check(typeof s.settings.pathWearDebug==='boolean');const c=s.commands;check(c);check(c.hunt==null||aIds.has(c.hunt));check(c.mount==null||aIds.has(c.mount));
  number(c.huntRepath,-1e9,1e9);number(c.mountRepath,-1e9,1e9);check(c.pendingChest==null||cIds.has(c.pendingChest));array(c.attacks,1000);
  for(const pair of c.attacks){array(pair,2);check(pair.length===2&&pair[0]!==pair[1]&&pair.every(id=>unitIds.has(id)));}
  for(const [key,objects,prefix]of [['animal',s.animals,'animal'],['drop',s.drops,'drop'],['chest',s.chests,'treasure']]){
    integer(s.counters?.[key],1);
    for(const object of objects){const match=String(object.id).match(new RegExp(`^${prefix}-(\\d+)$`));check(match&&Number(match[1])>0&&Number(match[1])<s.counters[key]);}
  }
  const dropKeys=s.drops.map(d=>`${d.resource}:${d.siteId??'free'}:${d.tile.x},${d.tile.y}`);check(new Set(dropKeys).size===dropKeys.length);
  part='experience';if(s.experienceSystem!==undefined){
    const e=s.experienceSystem;check(e);integer(e.nextEventId,1);array(e.processedEventIds,1000000);check(new Set(e.processedEventIds).size===e.processedEventIds.length);
    for(const id of e.processedEventIds){check(typeof id==='string'&&id.length>0&&id.length<=128);const match=id.match(/^activity-(\d+)$/);if(match)integer(Number(match[1]),1,e.nextEventId-1);}
  }
  part='skills';if(s.skillSystem!==undefined){
    check(s.skillSystem?.damageAwards&&typeof s.skillSystem.damageAwards==='object'&&!Array.isArray(s.skillSystem.damageAwards));
    for(const [key,amount]of Object.entries(s.skillSystem.damageAwards)){const [actorId,targetId]=key.split(':');check((actorId==='king'||wIds.has(actorId))&&(targetId==='king'||wIds.has(targetId)||/^animal-\d+$/.test(targetId)));number(amount,0,WORK_RULES.combatXPPerTarget+1e-7);}
  }
  part='food';validateFoodState(s,registry,{check,number,integer,array});
  part='seasonFood';validateSeasonFoodState(s,{check,number,integer,array});
  check(typeof s.settings.explorationMode==='boolean');
  part='exploration';validateMapMemory(s.exploration,registry,{check,number,integer,array});
  // Automatic employment: ON/OFF, a 1–5 priority for every workplace profession, residents held Unemployed by hand.
  part='employment';if(s.employment!==undefined){const e=s.employment;check(e&&typeof e==='object'&&Object.keys(e).filter(k=>k!=='haulers').sort().join()==='blockedBuildings,blockedTypes,enabled,held,priorities'&&typeof e.enabled==='boolean'&&(e.haulers===undefined||Number.isInteger(e.haulers)&&e.haulers>=0&&e.haulers<=30));
    check(e.priorities&&typeof e.priorities==='object'&&Object.keys(e.priorities).sort().join()===[...EMPLOYMENT_PROFESSIONS].sort().join());for(const value of Object.values(e.priorities))integer(value,PRIORITY_RANGE.min,PRIORITY_RANGE.max);
    array(e.held);check(new Set(e.held).size===e.held.length&&e.held.every(id=>wIds.has(id)));
    array(e.blockedBuildings);check(new Set(e.blockedBuildings).size===e.blockedBuildings.length);for(const id of e.blockedBuildings){integer(id,1);const b=s.buildings.find(b=>b.id===id);check(b&&buildingIsComplete(b)&&!b.unverified&&!!bdef(b).workplace);}
    array(e.blockedTypes);check(new Set(e.blockedTypes).size===e.blockedTypes.length);for(const type of e.blockedTypes)check(typeof type==='string'&&!!definition(type,'building').workplace);}
  // S12 Stables: each tamed horse once, a living horse in an existing Stables within capacity; jobs by living Stablehands.
  part='stables';if(s.stables!==undefined){const st=s.stables;check(st&&typeof st==='object'&&Object.keys(st).sort().join()==='horses,jobs,ridden');array(st.horses);array(st.jobs);
    const animals=new Map(s.animals.map(a=>[a.id,a])),stables=new Map(s.buildings.filter(b=>b.type==='stables'&&buildingIsComplete(b)).map(b=>[b.id,b])),seen=new Set(),count=new Map();
    const riders=new Set();for(const h of st.horses){const keys=Object.keys(h).sort().join(),a=animals.get(h.id);check(a?.type==='horse'&&a.isAlive&&!seen.has(h.id));
      if(h.state==='stabled')check(keys==='id,stableId,state'&&!a.mounted&&stables.has(h.stableId));
      // Horse Wagon: reserved for a Wheelwright's batch (still in its paddock), or harnessed to its wagon (out of the Stables).
      else if(h.workshopId!=null){check(h.state==='reserved'&&keys==='id,stableId,state,workshopId'&&!a.mounted&&(h.stableId===null||stables.has(h.stableId))&&s.foodProduction?.records.some(r=>r.buildingId===h.workshopId&&(r.cycle?.horseId===h.id||(s.foodStorage.locations.find(l=>l.id===`output-${h.workshopId}`)?.stock.horse_wagon??0)>0)));}
      else if(h.state==='harnessed'){check(keys==='id,state,vehicleId'&&!a.mounted&&(s.vehicles?.vehicles??[]).some(v=>v.id===h.vehicleId&&v.type==='horse_wagon'&&v.horseId===h.id));seen.add(h.id);continue;}
      else{check(['reserved','ridden'].includes(h.state)&&keys==='id,riderId,stableId,state'&&!riders.has(h.riderId)&&s.workers.some(w=>w.id===h.riderId&&w.isAlive));riders.add(h.riderId);check(!a.mounted&&(h.stableId===null||stables.has(h.stableId)));}seen.add(h.id);if(h.stableId!==null)count.set(h.stableId,(count.get(h.stableId)??0)+1);}
    const workers=new Map(s.workers.map(w=>[w.id,w]));for(const j of st.jobs){check(j&&Object.keys(j).sort().join()==='horseId,phase,progress,stableId,workerId'&&['approach','taming','leading'].includes(j.phase)&&workers.get(j.workerId)?.isAlive&&workers.get(j.workerId).profession==='stablehand'&&animals.get(j.horseId)?.type==='horse'&&!seen.has(j.horseId)&&stables.has(j.stableId));number(j.progress,0,1e9);seen.add(j.horseId);count.set(j.stableId,(count.get(j.stableId)??0)+1);}
    for(const [id,n]of count)check(n<=registry.require('stables').horseCapacity);check(st.ridden==null||animals.get(st.ridden)?.mounted===true);}
  // S12 vehicles: unique ids on open ground; an operator is one living Hauler at most once; modes are known.
  // S13 needs: one record per living permanent resident at most, values 0–100, an attack time never in the future.
  part='needs';if(s.needs!==undefined){const n=s.needs;check(n&&typeof n==='object'&&Object.keys(n).sort().join()==='homes,pending,records');number(n.pending,0,s.time?.totalElapsed??Number.MAX_SAFE_INTEGER);array(n.records);array(n.homes);
    const residents=new Set((s.workers??[]).filter(w=>w.isAlive&&w.isSubject).map(w=>w.id)),seen=new Set();
    for(const r of n.records){check(r&&Object.keys(r).filter(k=>k!=='unfedDays').sort().join()==='attackedAt,criticalDays,food,hp,id,leaving,lowDays,rest,strike'&&residents.has(r.id)&&!seen.has(r.id));if(r.unfedDays!==undefined)number(r.unfedDays,0,100000);integer(r.lowDays,0,100000);integer(r.criticalDays,0,100000);check(typeof r.strike==='boolean'&&typeof r.leaving==='boolean'&&!(r.strike&&r.leaving));seen.add(r.id);number(r.food,0,100);number(r.rest,0,100);check(Number.isFinite(r.hp));if(r.attackedAt!==null)number(r.attackedAt,0,s.time?.totalElapsed??Number.MAX_SAFE_INTEGER);}
    // #58 phase B homes: each living resident at most once, a House seat in a completed House within its capacity,
    // or one of the settlement's base places.
    const homed=new Set(),seats=new Map();let base=0;
    for(const h of n.homes){check(h&&residents.has(h.id)&&!homed.has(h.id));homed.add(h.id);
      if(h.kind==='settlement'){check(Object.keys(h).sort().join()==='id,kind');base++;continue;}
      check(h.kind==='house'&&Object.keys(h).sort().join()==='buildingId,id,kind');const house=s.buildings.find(b=>b.id===h.buildingId),d=house&&buildingDefinition(house);
      check(house&&d?.housing&&buildingIsComplete(house));seats.set(house.id,(seats.get(house.id)??0)+1);check(seats.get(house.id)<=(d.housing.capacity??POPULATION.houseCapacity));}
    check(base<=POPULATION.maximum);}
  part='vehicles';if(s.vehicles!==undefined){const v=s.vehicles;check(v&&typeof v==='object'&&Object.keys(v).sort().join()==='modes,nextId,vehicles');integer(v.nextId,1);array(v.vehicles);const ids=new Set(),operators=new Set(),workers=new Map(s.workers.map(w=>[w.id,w]));
    for(const x of v.vehicles){check(x&&Object.keys(x).sort().join()==='horseId,id,operatorId,state,type,x,y'&&(x.horseId===null||x.type==='horse_wagon'&&(s.stables?.horses??[]).some(h=>h.id===x.horseId&&h.state==='harnessed'&&h.vehicleId===x.id))&&Object.hasOwn(VEHICLES,x.type)&&['parked','reserved','inUse'].includes(x.state));const m=String(x.id).match(/^vehicle-(\d+)$/);check(m&&Number(m[1])<v.nextId&&!ids.has(x.id));ids.add(x.id);
      integer(x.x,0,COLUMNS-1);integer(x.y,0,ROWS-1);check(open(x.x,x.y));check((x.state==='parked')===(x.operatorId==null));if(x.operatorId!=null){const w=workers.get(x.operatorId);check(w?.isAlive&&w.profession==='hauler'&&!operators.has(x.operatorId));operators.add(x.operatorId);}}
    check(v.modes&&typeof v.modes==='object');for(const [id,mode]of Object.entries(v.modes))check(workers.has(id)&&TRANSPORT_MODES.includes(mode)&&mode!=='auto');}
  // C08 units and training orders: one per living Soldier, a known type, its exact kit; a Knight has his horse (S12).
  const st0=new Set((s.stables?.horses??[]).filter(h=>h.riderId).map(h=>h.riderId));
  part='military';if(s.military!==undefined){const m=s.military;check(m&&typeof m==='object'&&Object.keys(m).sort().join()==='nextOrder,orders,units');integer(m.nextOrder,1);array(m.units);array(m.orders);
    const workers=new Map(s.workers.map(w=>[w.id,w])),seen=new Set(),kit=type=>Object.values(UNIT_TYPES[type].equipment);
    for(const u of m.units){check(u&&['equipment,type,workerId','equipment,garrison,type,workerId'].includes(Object.keys(u).sort().join())&&(u.garrison===undefined||u.garrison===true)&&Object.hasOwn(UNIT_TYPES,u.type)&&(!UNIT_TYPES[u.type].mount||st0.has(u.workerId))&&workers.get(u.workerId)?.isAlive&&!seen.has(u.workerId));seen.add(u.workerId);check(JSON.stringify(u.equipment)===JSON.stringify(UNIT_TYPES[u.type].equipment));}
    const ids=new Set();for(const o of m.orders){check(o&&Object.keys(o).sort().join()==='barracksId,id,items,required,state,type,workDone,workerId'&&Object.hasOwn(UNIT_TYPES,o.type)&&(!UNIT_TYPES[o.type].mount||st0.has(o.workerId)));integer(o.id,1,m.nextOrder-1);check(!ids.has(o.id)&&!seen.has(o.workerId));ids.add(o.id);seen.add(o.workerId);
      const w=workers.get(o.workerId);check(w?.isAlive&&w.profession==='soldier'&&w.assignedWorkplaceId===o.barracksId&&s.buildings.some(b=>b.id===o.barracksId&&b.type==='barracks'));check(o.required===UNIT_TYPES[o.type].trainingTime);number(o.workDone,0,o.required);
      check(['supplying','training'].includes(o.state));const items={};if(o.state==='training')for(const id of kit(o.type))items[id]=(items[id]??0)+1;check(o.items&&JSON.stringify(Object.entries(o.items).sort())===JSON.stringify(Object.entries(items).sort()));if(o.state==='supplying')check(o.workDone===0);}}
  // Trade F1.2: the merchant caravan (schema 38). Its stock and Gold are the merchant's own, never the kingdom's.
  part='caravans';if(s.caravans!==undefined){
    const v=s.caravans,now=s.time?.totalElapsed??Number.MAX_SAFE_INTEGER;check(v&&typeof v==='object'&&Object.keys(v).sort().join()==='active,nextVisitAt,seq');integer(v.seq,0);
    check(v.nextVisitAt===null||(Number.isFinite(v.nextVisitAt)&&v.nextVisitAt>=0));
    if(v.active!==null){
      const c=v.active;check(c&&typeof c==='object'&&['departAt,entry,gold,id,marketplaceId,nextTile,path,phase,position,stock,tile,type,waiting,warned','departAt,entry,escort,gold,id,marketplaceId,nextTile,path,phase,position,stock,tile,type,waiting,warned'].includes(Object.keys(c).sort().join()));
      if(c.escort!==undefined){check(c.escort&&Object.keys(c.escort).sort().join()==='guards,porters');integer(c.escort.porters,0,CARAVAN_RULES.maxPorters);integer(c.escort.guards,0,CARAVAN_RULES.maxGuards);}
      check(typeof c.id==='string'&&/^caravan-\d+$/.test(c.id)&&Number(c.id.slice(8))<=v.seq&&v.nextVisitAt===null);check(Object.hasOwn(MERCHANT_TYPES,c.type));check(['arriving','trading','leaving'].includes(c.phase));
      check(c.stock&&typeof c.stock==='object'&&!Array.isArray(c.stock));for(const [id,n]of Object.entries(c.stock)){definition(id,'resource');integer(n,0,100000);}integer(c.gold,0,1000000);
      tile(c.entry);tile(c.tile);position(c.position);array(c.path,10000);for(const p of c.path)tile(p);if(c.nextTile!==null)tile(c.nextTile);
      check(typeof c.warned==='boolean'&&typeof c.waiting==='boolean');
      if(c.phase==='trading'){number(c.departAt,0);check(c.departAt<=now+CARAVAN_RULES.stay*s.gameSettings.dayLengthSeconds*1000+1e-6);}else check(c.departAt===null&&!c.waiting);
      if(c.phase!=='leaving'){const m=s.buildings.find(b=>b.id===c.marketplaceId);check(m&&m.type==='marketplace');}else integer(c.marketplaceId,0);
    }
  }
  // #103: kingdom policy (schema 40).
  part='policy';if(s.policy!==undefined){const p=s.policy;check(p&&typeof p==='object'&&Object.keys(p).sort().join()==='effect,feastUntil,lastFeastAt,lastTaxDay,pending,rations,tax');check(Object.hasOwn(TAX_RATES,p.tax)&&Object.hasOwn(RATIONS,p.rations));integer(p.lastTaxDay,1,s.time?.day??Number.MAX_SAFE_INTEGER);
    // Policy v2 P1 (schema 45): a pending policy for tomorrow and the Happiness effect on its way to the target.
    if(p.pending!==null){check(typeof p.pending==='object'&&Object.keys(p.pending).sort().join()==='rations,tax'&&Object.hasOwn(TAX_RATES,p.pending.tax)&&Object.hasOwn(RATIONS,p.pending.rations)&&(p.pending.tax!==p.tax||p.pending.rations!==p.rations));}
    const effects=Object.values(TAX_RATES).map(a=>a.happiness);number(p.effect,Math.min(...effects),Math.max(...effects)+LEGACY_RATIONS_EFFECT); // #68: older saves may hold the removed Generous +5
    // Policy v2 P3 (schema 47): the Feast running until feastUntil and the start of the last one.
    const total=s.time?.totalElapsed??0,dayMs=s.gameSettings.dayLengthSeconds*1000;check((p.feastUntil===null)===(p.lastFeastAt===null));if(p.lastFeastAt!==null){number(p.lastFeastAt,0,total);check(Math.abs(p.feastUntil-p.lastFeastAt-FEAST.days*dayMs)<1e-6);}}
  // Trade F1.3: orders (schema 39). Open orders belong to the active caravan and an existing Marketplace.
  // Children D1 (schema 54): which children exist follows from the homes; saved are positions, hidden houses, snowmen.
  // Day and night N2 (schema 56): which light places burn tonight and which soldiers carry a torch.
  part='lightFuel';if(s.lightFuel!==undefined)check(validLightFuelState(s.lightFuel)&&s.lightFuel.lit.every(id=>s.buildings.some(b=>b.id===id)));
  // Day and night N3 (schema 57): threat switches and campfires.
  part='heating';if(s.heating!==undefined)check(validHeatingState(s.heating,new Set(s.buildings.filter(b=>HEATED_BUILDINGS.includes(b.type)).map(b=>b.id))));
  part='nightThreats';if(s.nightThreats!==undefined)check(validNightThreatState(s.nightThreats,new Set(s.buildings.map(b=>b.id))));
  // E4: finished Royal tasks and counted production (optional, older saves start with none done).
  part='royalGoals';if(s.royalGoals!==undefined)check(validRoyalGoalState(s.royalGoals));
  // m-kral-odmeny-xp: the King's unspent skill points and royal skill levels (optional; points come from finished tasks).
  part='kingSkills';if(s.kingSkills!==undefined)check(validKingSkillState(s.kingSkills,s.royalGoals?.done??[]));
  // m-noc-zrychleni (82): the night speed-up tip shown (optional, only `true`).
  if(s.nightSpeedTip!==undefined)check(validNightSpeedTipState(s.nightSpeedTip));
  // m-91 Dev tool: known keys only, numbers on the 0.05 grid within ×0.25–×4, at least one key.
  if(s.devBalance!==undefined)check(validDevBalanceState(s.devBalance));
  // m-hlasky-jednou (79): closed notices – [memory key, game time of the close], unique, never in the future.
  part='notices';if(s.notices!==undefined)check(validNoticeState(s.notices,s.time?.totalElapsed??0));
  part='children';if(s.children!==undefined)validateChildrenState(s.children,{check,number,integer,array,buildingIds:new Set(s.buildings.map(b=>b.id))});
  part='domestic';if(s.domestic!==undefined)validateDomesticState(s.domestic,{check,number,integer,array,day:s.time?.day??1,buildingIds:new Set(s.buildings.map(b=>b.id)),locationIds:new Set((s.foodStorage?.locations??[]).map(l=>l.id)),workerIds:new Set((s.workers??[]).map(w=>w.id)),time:s.time});
  part='trade';if(s.trade!==undefined){
    const v=s.trade;check(v&&typeof v==='object'&&['auto,orders,seq,stats','auto,expedition,orders,seq,stats'].includes(Object.keys(v).sort().join()));
    /* m-karavana-vyslat: the kingdom's own caravan, optional */check(validExpedition(v.expedition,{workerIds:new Set((s.workers??[]).map(w=>w.id)),buildingIds:new Set(s.buildings.filter(b=>b.type==='marketplace').map(b=>b.id)),vehicleIds:new Set((s.vehicles?.vehicles??[]).filter(x=>x.type==='horse_wagon').map(x=>x.id)),registry}));
    // m-ukladani-chyba: saves of 0.100 and older may keep prices older than the history window; they drop out here.
    {const day=s.time?.day??1,h=v.stats?.history;if(h&&typeof h==='object'&&Number.isInteger(day))for(const [id,rows]of Object.entries(h))if(Array.isArray(rows)){h[id]=rows.filter(e=>!(Number.isInteger(e?.day)&&e.day<=day-PRICE_MODEL.historyDays));if(!h[id].length)delete h[id];}}validateAutoTrade(v.auto,{check,integer,resource:id=>definition(id,'resource')});validateTradeStats(v.stats,{check,number,integer,array,resource:id=>definition(id,'resource'),day:s.time?.day??1});integer(v.seq,0);array(v.orders,200);const ids=new Set();
    for(const o of v.orders){
      check(o&&typeof o==='object'&&Object.keys(o).filter(k=>k!=='auto').sort().join()==='caravanId,delivered,id,marketplaceId,placedAt,price,quantity,resource,side,status'&&(o.auto===undefined||o.auto===true));
      check(typeof o.id==='string'&&/^trade-\d+$/.test(o.id)&&Number(o.id.slice(6))<=v.seq&&!ids.has(o.id));ids.add(o.id);
      definition(o.resource,'resource');check(['buy','sell'].includes(o.side)&&ORDER_STATUSES.includes(o.status));integer(o.quantity,1,100000);integer(o.delivered,0,o.quantity);integer(o.price,1,1000000);
      number(o.placedAt,0);check(typeof o.caravanId==='string');integer(o.marketplaceId,0);
      if(['Pending','Transporting'].includes(o.status)){check(s.caravans?.active?.id===o.caravanId&&s.caravans.active.marketplaceId===o.marketplaceId);check(s.buildings.some(b=>b.id===o.marketplaceId&&b.type==='marketplace'));}
      if(o.status==='Completed')check(o.delivered===o.quantity);
    }
  }
  part='rockMining';validateRockMining(s,registry,{check,integer,number,array});
  return s;
}
