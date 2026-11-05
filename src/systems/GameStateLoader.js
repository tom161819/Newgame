import { t } from '../i18n/index.js';
import { validateGameState } from './GameStateSerializer.js';
import { recalculateStats } from './UnitStats.js';
import { buildingTiles,buildingDepth,towerTop } from '../game/buildings.js';
import { gridToWorld,tileCenter } from '../game/isometric.js';
import { importCharacterExperience } from './ExperienceSystem.js';
import { initializeNaturalTalent } from './NaturalTalentSystem.js';
import { gameSettings,resourceSpawnSettings } from './GameSettings.js';
import { seasonalCropStage } from '../data/seasons.js';

export function restoreActor(unit,data){
  for(const key of ['currentHP','isAlive','speed','walking','wanderWait','mounted','retaliationRepath'])if(data[key]!==undefined)unit[key]=data[key];
  for(const key of ['tile','position','nextTile','direction','path','statModifiers'])unit[key]=structuredClone(data[key]);
  unit.baseStats=Object.freeze({...data.baseStats});recalculateStats(unit);
  importCharacterExperience(unit,data.experience);
  unit.scene?.skillSystem?.importCharacter(unit,data.skills);unit.activitySkill=data.activitySkill??null;
}
export function restoreOrder(data,scene){
  if(!data)return null;
  return {kind:data.kind,goal:data.goal?{...data.goal}:null,pickupKey:data.pickupKey,dropId:data.dropId,silent:data.silent,explore:data.explore,
    tower:scene.buildings.find(b=>b.id===data.buildingId),animal:scene.animalSystem.animals.get(data.animalId),
    chest:scene.treasureSystem.chests.get(data.chestId),resource:scene.resources.get(data.resourceKey)?.getData('object')};
}
export function loadGameState(scene,input){
  const state=validateGameState(input,scene.objectRegistry),p=state.player,c=scene.character;
  scene.resourceLedger?.suspend();
  scene.gameSettings=gameSettings(state.gameSettings);
  scene.gameTime.dayDuration=scene.gameSettings.dayLengthSeconds*1000;
  scene.wildlifeRespawn?.importState(state.wildlifeRespawn);
  for(const spawner of scene.resourceSpawners)spawner.spawnSettings=resourceSpawnSettings(spawner.definition,scene.gameSettings);
  scene.inventory.importState(state.inventory);
  for(const data of state.buildings){
    const definition=scene.objectRegistry.require(data.type),building={...data,definition,tiles:buildingTiles(data,definition)};
    if(!building.unverified)for(const t of building.tiles)scene.map[t.y][t.x]=definition.walkable&&(!building.construction||building.construction.state==='complete')?0:1;
    scene.buildings.push(building);scene.towerViews.set(building.id,scene.createBuildingView(definition,building));
  }
  scene.refreshWallConnections();
  for(const r of state.resources)scene.addResource(scene.objectRegistry.require(r.type),r.tile,r.natural??null);
  for(const a of state.animals){
    const animal=scene.animalSystem.create(scene.objectRegistry.require(a.type),a.tile,a.id);restoreActor(animal,a);
    const pos=gridToWorld(animal.position.x,animal.position.y);animal.view.setPosition(pos.x,pos.y).setDepth(pos.y+(animal.definition.depth?.offset??0));
    animal.view.animate?.(0,animal.walking,animal.direction);
  }
  for(const data of state.workers??[]){
    const worker=scene.workerSystem.create(data.tile,{id:data.id,name:data.name,randomize:false,isSubject:data.isSubject});restoreActor(worker,data);worker.diedAt=data.diedAt;
    if(data.naturalTalent){worker.naturalTalent=data.naturalTalent;worker.initialSkills=structuredClone(data.initialSkills);}
    else initializeNaturalTalent(worker,{legacy:true});
    for(const key of ['profession','workState','workMessage','assignedWorkplaceId','arriving','aiCooldown'])worker[key]=data[key];
    if(data.stoneCollection)worker.stoneCollection=structuredClone(data.stoneCollection);
    worker.workplaceReached=data.workplaceReached??false;worker.cargo=structuredClone(data.cargo??null);worker.pendingWorkRewards=structuredClone(data.pendingWorkRewards??[]);
    worker.workTask=structuredClone(data.workTask);worker.active=worker.isAlive;
    if(worker.workTask)scene.workerSystem.reservations.reserve(worker.workTask.reservation,worker.id);
    if(['chopTree','mineDeposit'].includes(worker.workTask?.kind))scene.workerSystem.reservations.reserve(`natural-slot:${worker.workTask.goal.x},${worker.workTask.goal.y}`,worker.id);
    if(worker.workTask?.kind==='foodPickup'&&worker.workTask.sourceDropId)scene.workerSystem.reservations.reserve(`drop:${worker.workTask.sourceDropId}`,worker.id);
    if(!worker.isAlive)worker.view.destroy();else{const pos=gridToWorld(worker.position.x,worker.position.y);worker.view.setPosition(pos.x,pos.y).setDepth(pos.y+.1);worker.view.animate?.(0,worker.walking,worker.direction);}
  }
  for(const d of state.drops)scene.dropSystem.create(d.resource,d.tile,d.amount,d.id,{rewardRemaining:d.rewardRemaining??1,rewardUnits:d.rewardUnits??(d.resource==='stone'?d.amount:0),haulEligible:d.haulEligible!==false,siteId:d.siteId??null});
  for(const saved of state.chests){
    const chest=scene.treasureSystem.create(saved.tile,saved);
    if(saved.opening){
      chest.opening=true;
      const done=()=>{chest.opening=false;chest.opened=true;};
      if(chest.view.open){
        chest.view.open(done);
        const tween=chest.view.openTween;
        if(tween){
          // První Phaser update pouze zahájí tween a spotřebuje nula času.
          // Samotné seek(ms) by proto obnovilo o jeden snímek méně.
          tween.seek(0);tween.update(0);tween.update(saved.animation.elapsed);
        }
        if(saved.animation.lid)Object.assign(chest.view.lid,saved.animation.lid);
      }
      else scene.tweens.add({targets:chest.view.container??chest.view,alpha:1,duration:Math.max(1,350-saved.animation.elapsed),onComplete:done});
    }
  }
  restoreActor(c,p);c.state=p.state;c.currentTower=scene.buildings.find(b=>b.id===p.currentTowerId)??null;
  if(scene.kingLogistics){c.cargo=structuredClone(p.cargo??null);c.pendingWorkRewards=structuredClone(p.pendingWorkRewards??[]);}
  c.exitTile=p.exitTile?{...p.exitTile}:null;c.order=restoreOrder(p.order,scene);
  c.roofContinuation=p.roofContinuation?{...structuredClone({...p.roofContinuation,order:null}),order:restoreOrder(p.roofContinuation.order,scene)}:null;
  c.mountedHorse=scene.animalSystem.animals.get(p.horseId)??null;
  scene.equipment.importState(state.equipment);scene.player.setMounted?.(c.mountedHorse?.definition??null);
  scene.player.setPosition(p.render.x,p.render.y).setDepth(p.render.depth);scene.player.animate?.(0,c.walking,c.direction);
  if(p.state==='enteringTower'||p.state==='exitingTower'){
    const entering=p.state==='enteringTower',to=entering?towerTop(c.currentTower):tileCenter(c.exitTile);
    c.transitionTween=scene.tweens.add({targets:scene.player,...to,duration:p.transition.remaining,ease:'Sine.InOut',
      onComplete:()=>entering?c.completeClimb(c.currentTower):c.completeDescent(c.exitTile)});
  }
  if(c.state==='onTower')scene.player.setDepth(buildingDepth(c.currentTower)+.2);
  if(c.state==='ground'&&(c.path.length||c.nextTile||c.order))scene.showMarker(c.path.at(-1)??c.nextTile??c.tile);
  const units=new Map([['king',c],...[...scene.animalSystem.animals].map(([id,a])=>[id,a]),...(scene.workerSystem?[...scene.workerSystem.workers]:[])]);
  for(const a of state.animals)scene.animalSystem.animals.get(a.id).retaliationTarget=units.get(a.retaliationId)??null;
  for(const [a,t]of state.commands.attacks){const attacker=units.get(a),target=units.get(t);scene.combat.attacks.set(attacker,target);attacker.attackTarget=target;}
  if(scene.skillSystem)for(const unit of units.values())if(unit.definition.category==='character'){
    const target=scene.combat.attacks.get(unit);unit.activitySkill=target?(unit.profession==='soldier'?'combat':target.definition.gameplay?.huntable?'hunting':'combat'):null;scene.skillSystem.refreshModifier(unit);
  }
  scene.huntingSystem.target=units.get(state.commands.hunt)??null;scene.huntingSystem.repath=state.commands.huntRepath;
  scene.mountSystem.target=units.get(state.commands.mount)??null;scene.mountSystem.repath=state.commands.mountRepath;
  scene.treasureSystem.pending=state.commands.pendingChest;
  scene.animalSystem.nextId=state.counters.animal;scene.dropSystem.nextId=state.counters.drop;scene.treasureSystem.nextId=state.counters.chest;
  scene.gameTime.importState(state.time);scene.seasons?.importState(state.seasons);scene.foodSystem.importState(state.food);scene.production.importState(state.production);
  scene.naturalResources?.importState(state.naturalResources);scene.employment?.importState(state.employment);
  scene.experienceSystem?.importState(state.experienceSystem);
  scene.skillSystem?.importState(state.skillSystem);scene.workerSystem?.importState(state.population);
  if(scene.workerSystem&&state.workers===undefined)scene.workerSystem.spawnInitial();
  scene.wageSystem?.importState(state.wages);
  scene.resourceLedger?.importState(state.resourceLedger);
  scene.workplaceSystem?.importState(state.workplaces);
  scene.constructionSystem?.importState(state.constructionSystem);
  if(scene.seasons&&!state.seasons&&state.farming)for(const record of state.farming.records){const b=scene.buildings.find(b=>b.id===record.buildingId);record.stage=seasonalCropStage(b.type,record.growthDays,b.definition.crop.growthDays,scene.seasons.season);}
  scene.farmingSystem?.importState(state.farming);
  scene.foodStorage?.importState(state.foodStorage,state.inventory);
  scene.constructionSystem?.materials.importLegacySites();
  scene.foodProduction?.importState(state.foodProduction);
  scene.kingLogistics?.importState(state.kingLogistics);
  if(scene.seasons&&!state.seasons)for(const worker of scene.workerSystem.liveWorkers())if(worker.workTask?.kind==='harvest'){
    const plot=scene.farmingSystem.building(worker.workTask.targetId);if(plot&&!scene.farmingSystem.ripe(plot)){scene.workerSystem.ai.cancel(worker);worker.workState='Waiting';worker.workMessage='Waiting for the harvest season';}
  }
  if(scene.foodStorage&&!state.foodStorage?.physicalMaterials)for(const worker of scene.workerSystem.liveWorkers())if(scene.foodStorage.manages(worker.cargo?.resource)&&worker.cargo.amount>20){
    const original=worker.cargo.amount,remainder=original-20;worker.cargo.amount=20;let rewardRemaining=0;
    let rewardUnits=0;for(const event of worker.pendingWorkRewards??[])if(['dropCollected','resourceCollected'].includes(event.type)){const ratio=event.contributionRatio??1;event.contributionRatio=ratio*20/original;if(event.type==='dropCollected')rewardRemaining+=ratio*remainder/original;else rewardUnits+=(event.quantity??1)*ratio*remainder/original;}
    scene.dropSystem.create(worker.cargo.resource,worker.tile,remainder,null,{rewardRemaining,rewardUnits});
  }
  scene.pathWear?.importState(state.pathWear);
  for(const t of state.spawners)scene.resourceSpawners.find(s=>s.definition.id===t.id).importState(t);
  scene.settingsPanel.applySettings(state.settings);scene.fog.setEnabled(state.settings.fogOfWar);
  scene.fog.setExplorationEnabled?.(state.settings.explorationMode??true);
  scene.fog.update?.();scene.mapMemory?.importState(state.exploration);
  scene.terrain?.setDebug(!!state.settings.pathWearDebug);
  scene.events?.emit('buildings:changed');
  scene.updateInventory();scene.worldCamera.syncSize?.();
  const camera=scene.cameras.main;camera.setZoom(state.camera.zoom);scene.worldCamera.syncZoom?.();camera.centerOn(state.camera.x,state.camera.y);camera.preRender();
  scene.worldCamera.following=state.camera.following;
  document.querySelector('#camera-mode').textContent=t(state.camera.following?'hud.cameraKing':'hud.cameraManual');
  scene.updateInventory();scene.updateTimeDisplay();scene.refreshVisibility();scene.activeFramePending=true;
  scene.experienceFeedback?.refresh();
  scene.setStatus(t('status.gameLoaded'));
}
