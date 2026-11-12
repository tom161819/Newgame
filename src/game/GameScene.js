import { clockMinutes,formatClock } from '../data/dayNight.js';
import { personHover } from '../ui/personHover.js';
import { TutorialGuide } from '../ui/TutorialGuide.js';
import { SpeedControls } from '../ui/SpeedControls.js';
import { FOOD_OUTLOOK,foodDays } from '../data/foodOutlook.js';
import { placeableDefinition,freeOffer } from './freeBuildings.js';
import { DomesticAnimalSystem } from '../systems/DomesticAnimalSystem.js';
import { DomesticViews } from './DomesticViews.js';
import { CatPanel } from '../ui/CatPanel.js';
import { ChildrenSystem } from '../systems/ChildrenSystem.js';
import { ChildViews } from './ChildViews.js';
import { VillageGreenView } from './VillageGreenView.js';
import { DecorationView } from './DecorationView.js';
import { PorchSystem } from '../systems/PorchSystem.js';
import { DayNightSystem } from '../systems/DayNightSystem.js';
import { LightFuelSystem } from '../systems/LightFuelSystem.js';
import { NightOverlay } from './NightOverlay.js';
import { FogEdgeLayer } from './FogEdgeLayer.js';
import { RiverLife } from './RiverLife.js';
import { FishShadows } from './FishShadows.js';
import { FuelIcons } from './FuelIcons.js';
import { CampfireView } from './CampfireView.js';
import { FireViews } from './FireViews.js';
import { NightThreatSystem } from '../systems/NightThreatSystem.js';
import { KingdomOverview,HelpArrow } from '../ui/KingdomOverview.js';
import { NightControls } from '../ui/NightControls.js';
import { NightSpeedUp } from '../systems/NightSpeedUp.js';
import { buildingTooltipAllowed } from '../data/buildingTooltip.js';
import { VillagePanel } from '../ui/VillagePanel.js';
import { IssueIcons } from './IssueIcons.js';
import { MaterialYardView,MaterialPiles } from './MaterialPiles.js';
import { SideCards } from '../ui/SideCards.js';
import { ArmyPanel } from '../ui/ArmyPanel.js';
import { decodeWorldCode,randomWorldCode,defaultWorldLevels,settingsFromLevels } from '../data/worldCode.js';
import { buildRelief,setRelief,sightBonus } from './terrainRelief.js';
import { worldStreams } from './seededRandom.js';
import { FORESTRY as WORLD_FORESTRY } from '../data/naturalResources.js';
import { createBackgroundSimulation } from '../ui/BackgroundSimulationUI.js';
import { RockMiningTool } from '../ui/RockMiningTool.js';
import { DemolitionSystem } from '../systems/DemolitionSystem.js';
import { finishDemolition } from './buildingRemoval.js';
import { DemolitionUI } from '../ui/DemolitionUI.js';
import { KingdomHappinessIndicator } from '../ui/NeedsDisplay.js';
import { NeedsSystem } from '../systems/NeedsSystem.js';
import { blockingDialog } from '../ui/dockedPanels.js';
import { Minimap } from '../ui/Minimap.js';
import { EventFeed } from '../ui/EventFeed.js';
import { MillSails } from './MillSails.js';
import { KingCargoControl } from '../ui/KingCargoControl.js';
import { UnitSelection } from '../ui/UnitSelection.js';
import { t } from '../i18n/index.js';
import { localized } from '../i18n/names.js';
import Phaser from 'phaser';
import { COLUMNS, ROWS, PLAYER_START, isWalkable, tileCenter } from './map.js';
import { generateWorld, mapFromWorld, emptyGround, importGround, importBushes, emptyZones, importZones, importReeds } from './worldGeneration.js';
import { importNatureGroups, pruneNatureGroups, exportNatureGroups, thicketTiles } from './natureGroups.js';
import { isFertileGround, isFordGround, FORD_SPEED, WORLD_GENERATION } from '../data/worldTerrain.js';
import { tilePolygon, worldToTile, gridToWorld, clampMapCenter } from './isometric.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { WorldCamera } from './WorldCamera.js';
import { ResourceTransactionLedger } from '../systems/ResourceTransactionLedger.js';
import '../ui/resourceLedger.css';
import { Inventory } from './inventory.js';
import { drawStone, generateResourcePositions, resourceTiles, tileKey, ResourceSpawner } from './stones.js';
import { placeBuilding, placementError, buildingTiles, towerBase, towerNeighbors, buildingDefinition,buildingDepth,buildingIsComplete } from './buildings.js';
import { footprintShown,applyFootprint,selectedBuildingIds } from './footprintHighlight.js';
import { TowerView } from './TowerView.js';
import { KingView } from './KingView.js';
import { PlayerController, PLAYER_STATE } from './PlayerController.js';
import { BuildingBar } from '../ui/BuildingBar.js';
import { InventoryBar } from '../ui/InventoryBar.js';
import { FarmConnections } from '../ui/FarmConnections.js';
import { AssetGallery } from '../ui/AssetGallery.js';
import { formatCost } from '../ui/objectLabels.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { AssetManager } from '../systems/AssetManager.js';
import { AnimalView } from './AnimalView.js';
import { AnimalSystem } from '../systems/AnimalSystem.js';
import { HuntingSystem } from '../systems/HuntingSystem.js';
import { DropSystem } from '../systems/DropSystem.js';
import { FoodSystem } from '../systems/FoodSystem.js';
import { FogOfWarSystem,OUTSIDE_SIGHT } from '../systems/FogOfWarSystem.js';
import { subjectSight } from '../systems/VisibilityModifiers.js';
import { EmploymentSystem } from '../systems/EmploymentSystem.js';
import { EmploymentPanel } from '../ui/EmploymentPanel.js';
import { ProductionDiagnostics } from '../systems/ProductionDiagnostics.js';
import { NoticesPanel } from '../ui/NoticesPanel.js';
import { isProvisional,knownPlacementError,knownContext } from './provisionalSites.js';
import { mineSpotError,provisionalMineError } from './siteObstacles.js';
import { MountSystem } from '../systems/MountSystem.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';
import { FpsOverlay } from '../ui/FpsOverlay.js';
import { devProduction } from '../data/devBalance.js';
import { DevBalancePanel } from '../ui/DevBalancePanel.js';
import { installPanelDismiss,closeOpenPanels } from '../ui/PanelDismiss.js';
import { FortificationView } from './FortificationView.js';
import { wallLine,wallLinePlan,placeWallLine,wallIndex,connectionsFor,connectedWalls,isWall,gateAxis,turnGate } from './walls.js';
import { replaceWalls } from './wallReplacement.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { CombatFeedback } from '../ui/CombatFeedback.js';
import { GameTimeSystem } from '../systems/GameTimeSystem.js';
import { RegenerationSystem } from '../systems/RegenerationSystem.js';
import { ProductionSystem } from '../systems/ProductionSystem.js';
import { EquipmentSystem } from '../systems/EquipmentSystem.js';
import { TreasureSystem } from '../systems/TreasureSystem.js';
import { EquipmentPanel } from '../ui/EquipmentPanel.js';
import { TreasurePanel } from '../ui/TreasurePanel.js';
import { GettingStartedPanel } from '../ui/GettingStartedPanel.js';
import { FishingSystem } from '../systems/FishingSystem.js';
import { BuilderWorkshopPanel } from '../ui/BuilderWorkshopPanel.js';
import { BuilderWorkshopSystem } from '../systems/BuilderWorkshopSystem.js';
import { MarketplacePanel } from '../ui/MarketplacePanel.js';
import { CaravanSystem } from '../systems/CaravanSystem.js';
import { TradeSystem } from '../systems/TradeSystem.js';
import { PolicySystem } from '../systems/PolicySystem.js';
import { PolicyPanel } from '../ui/PolicyPanel.js';
import { CaravanViews } from './CaravanViews.js';
import { ChestView } from './ChestView.js';
import { PauseManager } from '../systems/PauseManager.js';
import { loadGameState } from '../systems/GameStateLoader.js';
import { PathWearSystem } from '../systems/PathWearSystem.js';
import { GameActivityBus } from '../systems/GameActivityBus.js';
import { ExperienceSystem } from '../systems/ExperienceSystem.js';
import { ExperienceFeedback } from '../ui/ExperienceFeedback.js';
import { UnitPanel } from '../ui/UnitPanel.js';
import { HumanView } from './HumanView.js';
import { WorkerSystem } from '../systems/WorkerSystem.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { WageSystem } from '../systems/WageSystem.js';
import { EconomyPanel } from '../ui/EconomyPanel.js';
import { WorkplaceSystem } from '../systems/WorkplaceSystem.js';
import { WorkplaceView } from './WorkplaceView.js';
import { WorkplacePanel } from '../ui/WorkplacePanel.js';
import { MissingWorkersIndicators } from '../ui/MissingWorkersIndicators.js';
import { NaturalResourcesSystem } from '../systems/NaturalResourcesSystem.js';
import { TreeView } from './TreeView.js';
import { resourceBlocks } from '../data/minerals.js';
import { DepositView } from './DepositView.js';
import { natureReady } from './natureArt.js';
import { NaturalResourcePanel } from '../ui/NaturalResourcePanel.js';
import { ConstructionSystem } from '../systems/ConstructionSystem.js';
import { ConstructionView } from './ConstructionView.js';
import { SeasonTransition } from './SeasonTransition.js';
import { ConstructionUI } from '../ui/ConstructionUI.js';
import { gameSettings,resourceSpawnSettings } from '../systems/GameSettings.js';
import { createStartingCastle,createStartingStockpile,depositStartingResources } from '../systems/WorldGenerationConfig.js';
import { WildlifeRespawnSystem } from '../systems/WildlifeRespawnSystem.js';
import { FarmingSystem } from '../systems/FarmingSystem.js';
import { CropPlotView } from './CropPlotView.js';
import { FarmingPanel } from '../ui/FarmingPanel.js';
import { FoodStorageSystem } from '../systems/FoodStorageSystem.js';
import { FoodProductionSystem } from '../systems/FoodProductionSystem.js';
import { MilitarySystem } from '../systems/MilitarySystem.js';
import { VehicleSystem } from '../systems/VehicleSystem.js';
import { StableSystem } from '../systems/StableSystem.js';
import { VehicleViews } from './VehicleViews.js';
import { PavementView } from './PavementView.js';
import { PavementTool } from './PavementTool.js';
import { LogisticsTaskManager } from '../systems/LogisticsTaskManager.js';
import { LegacyStockpileMarkers } from './LegacyStockpileMarkers.js';
import { cargoLabel,transportLabel } from '../ui/transportLabels.js';
import { StoragePanel } from '../ui/StoragePanel.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { KingdomAttractivenessSystem } from '../systems/KingdomAttractivenessSystem.js';
import { FoodEconomyPanel } from '../ui/FoodEconomyPanel.js';
import { KingLogisticsSystem } from '../systems/KingLogisticsSystem.js';
import { BuildingUnlockManager } from '../systems/BuildingUnlockManager.js';
import { MapMemory } from '../systems/MapMemory.js';
import { captureMapKnowledge,rememberBlueprint } from './mapMemoryObjects.js';
import { MapMemoryRenderer } from './MapMemoryRenderer.js';
import { PopulationSidebar } from '../ui/PopulationSidebar.js';
import { LightSourceSystem } from '../systems/LightSourceSystem.js';
import { RoyalGoals } from '../systems/RoyalGoals.js';
import { RoyalGoalsPanel } from '../ui/RoyalGoalsPanel.js';
import { KingSkills } from '../systems/KingSkills.js';
import { CompletionFlash } from '../ui/CompletionFlash.js';
import { StorePreview } from '../ui/StorePreview.js';
import { WikiPanel } from '../ui/WikiPanel.js';
import { DangerMarks } from '../ui/DangerMarks.js';
import { bindSoundSetting } from '../ui/sound.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  init({state=null,settings}={}){this.loadState=state;this.gameSettings=gameSettings(state?.gameSettings??settings);}

  preload() {
    this.objectRegistry=objectRegistry;
    this.assets=new AssetManager(this,this.objectRegistry);
    this.assets.queue();
  }

  create() {
    this.worldCamera=null;
    this.workerSystem=null;
    this.wageSystem=null;this.economyPanel=null;this.resourceLedger=null;
    this.workplaceSystem=null;
    this.constructionSystem=null;
    this.farmingSystem=null;
    this.foodStorage=null;this.foodProduction=null;this.logisticsTasks=null;this.legacyStockpiles=null;
    this.seasons=null;
    this.kingLogistics=null;
    this.naturalResources=null;this.naturalResourcePanel=null;
    this.fog=null;this.mapMemory=null;this.memoryRenderer=null;this.populationSidebar=null;
    this.gameOver=false;this.input.enabled=true;this.input.keyboard.enabled=true;this.tweens.resumeAll();
    this.activeFramePending=true;this.visibilityPaused=document.hidden;
    this.assets.initialize();
    this.lightSources=new LightSourceSystem(this);
    this.assets.registerRenderer('stone',(definition,context)=>drawStone(this,context.tile,definition));
    this.assets.registerRenderer('tree',(definition,context)=>new TreeView(this,definition,context));
    this.assets.registerRenderer('deposit',(definition,context)=>new DepositView(this,definition,context));
    natureReady(this); // g-nasadit-prirodu: the nature atlas loads at the start; views fall back until it is in.
    this.assets.registerRenderer('king',(definition,context)=>new KingView(this,context.x,context.y,definition));
    this.assets.registerRenderer('tower',(_definition,context)=>new TowerView(this,context.building,context.preview));
    this.assets.registerRenderer('animal',(definition,context)=>new AnimalView(this,context.x,context.y,definition));
    this.assets.registerRenderer('fortification',(_definition,context)=>new FortificationView(this,context.building,context.preview));
    this.assets.registerRenderer('chest',(_definition,context)=>new ChestView(this,context.x,context.y));
    this.assets.registerRenderer('human',(definition,context)=>new HumanView(this,context.x,context.y,definition));
    this.assets.registerRenderer('workplace',(_definition,context)=>new WorkplaceView(this,context.building,context.preview));
    this.assets.registerRenderer('food_building',(_definition,context)=>new WorkplaceView(this,context.building,context.preview));
    this.assets.registerRenderer('crop',(_definition,context)=>new CropPlotView(this,context.building,context.preview));
    this.assets.registerRenderer('pavement',(_definition,context)=>new PavementView(this,context.building,context.preview));
    this.assets.registerRenderer('village_green',(_definition,context)=>new VillageGreenView(this,context.building,context.preview));
    this.assets.registerRenderer('campfire',(_definition,context)=>new CampfireView(this,context.building,context.preview));
    this.assets.registerRenderer('decoration',(_definition,context)=>new DecorationView(this,context.building,context.preview));
    this.assets.registerRenderer('material_yard',(_definition,context)=>new MaterialYardView(this,context.building,context.preview));
    // #100: rock layer (terrainGrid), ground layer (grass, sand, water) and bushes; water cells block but stay see-through.
    // World v2 step 1: a new game draws its whole starting world from the world code (seed + settings), one random
    // stream per part; a loaded game keeps its saved world and its code.
    if(!this.loadState&&!this.gameSettings.worldCode)this.gameSettings=gameSettings({...this.gameSettings,worldCode:randomWorldCode()});
    const worldCode=this.gameSettings.worldCode?decodeWorldCode(this.gameSettings.worldCode,this.loadState?{current:null}:undefined):null;
    this.worldLevels=worldCode?.levels??defaultWorldLevels();this.worldSeed=worldCode?.seed??0;this.worldRandom=worldCode?worldStreams(worldCode.seed):()=>Math.random;
    const world=this.loadState?{terrain:this.loadState.terrain.map(row=>[...row]),ground:this.loadState.ground?importGround(this.loadState.ground):emptyGround(),bushes:importBushes(this.loadState.bushes??[]),
      zones:this.loadState.grassZones?importZones(this.loadState.grassZones):emptyZones(),reeds:importReeds(this.loadState.reeds),natureGroups:importNatureGroups(this.loadState.natureGroups)}:generateWorld(Math.random,{levels:this.worldLevels,streams:this.worldRandom});
    this.terrainGrid=world.terrain;this.groundGrid=world.ground;
    // m-teren-vyska: the hills of this world, from its ground and seed (not saved; the same after every load).
    // Part 2: the ground and everything on it is drawn lifted by the height, unless localStorage newgame.terrainLift is
    // 'off' (the browser smokes, which click by the flat projection; also a way out on a weak machine).
    // The address ?lift=off / ?lift=on sets and remembers it (like ?renderer=).
    let liftOn=true;try{const asked=new URLSearchParams(globalThis.location?.search??'').get('lift');if(asked==='off'||asked==='on')globalThis.localStorage?.setItem('newgame.terrainLift',asked);liftOn=globalThis.localStorage?.getItem('newgame.terrainLift')!=='off';}catch{}
    this.reliefLift=liftOn;this.relief=setRelief(buildRelief(world.ground,this.worldSeed),{lift:liftOn});this.bushes=world.bushes;this.grassZones=world.zones;this.reeds=world.reeds;
    // velke-prirodni-objekty: thickets and rock groups drawn as one object over their bushes and rock tiles.
    this.natureGroups=world.natureGroups??[];
    // Generator 2's weights for where forests and ore deposits grow (new games only; not saved).
    this.worldWeights=world.forestWeight?{forest:world.forestWeight,stone:world.stoneWeight}:null;
    this.fordKeys=new Set();for(let y=0;y<this.groundGrid.length;y++)for(let x=0;x<this.groundGrid[y].length;x++)if(isFordGround(this.groundGrid[y][x]))this.fordKeys.add(`${x},${y}`);
    this.map=mapFromWorld(this.terrainGrid,this.groundGrid);
    this.terrain=new TerrainRenderer(this,this.terrainGrid,this.objectRegistry,this.assets);
    this.inventory=new Inventory();if(!this.loadState)this.inventory.add('gold',this.gameSettings.startingGold);
    this.gameTime=new GameTimeSystem(this.gameSettings.dayLengthSeconds*1000);this.regeneration=new RegenerationSystem();
    this.seasons=new SeasonSystem(this.gameTime,{enabled:this.gameSettings.seasonsEnabled,initialWeather:this.loadState?(this.loadState.seasons?.weather??'Sunny'):undefined});this.terrain.setSeason(this.seasons.season);for(const b of this.buildings??[])if((b.type==='village_green'||this.objectRegistry.get(b.type)?.decoration))this.towerViews.get(b.id)?.setSeason?.(this.seasons.season);
    this.dayNight=new DayNightSystem(this);this.lightFuel=new LightFuelSystem(this);this.nightThreats=new NightThreatSystem(this);
    this.nightThreats.onChange(()=>{for(const b of this.buildings??[])if(b.type==='campfire')(this.towerViews.get(b.id)?.inner??this.towerViews.get(b.id))?.refresh?.();});
    this.seasonTransition=new SeasonTransition(this);this.terrain.seasonMix=(x,y,season)=>this.seasonTransition.mix(x,y,season);this.terrain.seasonAt=(tile,season)=>this.seasonTransition.seasonAt(tile,season);this.terrain.seasonGroundLook=(cx,cy,season,size)=>this.seasonTransition.groundLook(cx,cy,season,size);
    this.unsubscribeSeason=this.seasons.onChange(()=>{const changed=this.terrain.season!==this.seasons.season;this.terrain.setSeason(this.seasons.season);if(changed&&this.worldCamera){this.terrain.invalidateArea(this.mapMemory.observeTerrain(this.terrainGrid,this.pathWear,this.seasons.season,this.map));this.terrain.update(this.cameras.main,this.fog,this.mapMemory);}this.updateTimeDisplay();this.settingsPanel?.syncSeasons();});
    this.activities=new GameActivityBus();this.experienceSystem=new ExperienceSystem(this.activities);
    this.skillSystem=new SkillSystem(this);
    this.pathWear=new PathWearSystem({map:this.map,terrain:this.terrainGrid,time:this.gameTime,groundSpeed:tile=>isFordGround(this.groundGrid[tile.y]?.[tile.x])?FORD_SPEED:1,isGrass:tile=>this.terrainGrid[tile.y]?.[tile.x]===0&&isFertileGround(this.groundGrid[tile.y]?.[tile.x])});this.terrain.setPathWear(this.pathWear);
    this.pauseManager=new PauseManager(this);
    this.noticeRemaining=0;document.querySelector('#day-notice').hidden=true;
    this.resources=new Map();this.stones=this.resources; // Kompatibilní označení původního seznamu kamenů.
    this.resourceOccupancy=new Map();
    this.buildings=[];this.towerViews=new Map();
    this.wallMap=new Map();this.wallPreviews=new Map();this.dragAnchor=null;this.wallLastLine=null;
    this.buildMode=false;this.selectedBuilding=null;this.previewAnchor=null;this.previewTracking=false;this.previewKey=null;
    this.preview=this.createBuildingView(this.objectRegistry.require('tower'),{x:0,y:0},true);this.preview.setVisible(false);this.pavementTool=new PavementTool(this);
    this.marker=this.add.graphics().setDepth(9998).setVisible(false);
    const position=tileCenter(PLAYER_START);
    this.player=this.assets.createView('king',position);
    this.character=new PlayerController(this,this.player,PLAYER_START);
    if(!this.loadState){createStartingCastle(this);createStartingStockpile(this);}
    this.skillSystem.initialize(this.character);
    this.equipment=new EquipmentSystem(this.character,this.objectRegistry,this.inventory,()=>{this.equipmentPanel?.refresh();this.combatFeedback?.refresh();});
    this.combat=new CombatSystem({map:this.map,canFight:unit=>unit.isAlive&&!unit.mounted&&(unit!==this.character||unit.state===PLAYER_STATE.GROUND),regenerationRate:unit=>this.regeneration.rateFor(unit),canTarget:(attacker,target)=>attacker.attackRange<=1||!this.workerSystem?.workers.has(attacker.id)||!this.fog||this.fog.isVisibleObject(target)});
    this.skillSystem.attachCombat(this.combat);
    this.resourceSpawners=[];
    for(const definition of this.objectRegistry.byCategory('resource').filter(d=>d.spawn)){
      const spawnSettings=resourceSpawnSettings(definition,this.gameSettings);
      const spawner=new ResourceSpawner({
        map:this.map,resources:this.resourceOccupancy,definition,spawnSettings,
        getOrigins:()=>this.resourceOrigins(),getReserved:()=>[...this.reservedTiles(),...this.fordTiles(),...this.thicketTileList()],
        getCount:()=>this.resourceCount(definition.id),spawn:tile=>this.addResource(definition,tile),
      });
      this.resourceSpawners.push(spawner);
      if(!this.loadState&&definition.walkable){
        const occupied=new Map([...this.resourceOccupancy,...[...this.fordKeys].map(k=>[k,'ford']),...[...thicketTiles(this.natureGroups)].map(k=>[k,'thicket'])]),F=WORLD_GENERATION.fairStart;
        // Fair start: some loose stones close to the castle first.
        if(definition.id==='stone'){const near=generateResourcePositions(this.map,PLAYER_START,10000,this.worldRandom('start-stones'),occupied,definition).filter(t=>{const d=Math.hypot(t.x-PLAYER_START.x,t.y-PLAYER_START.y);return d>5&&d<=F.radius;}).slice(0,Math.min(F.stones,spawnSettings.initial));for(const tile of near){this.addResource(definition,tile);occupied.set(tileKey(tile),'stone');}}
        const candidates=generateResourcePositions(this.map,PLAYER_START,Math.max(0,spawnSettings.initial-this.resourceCount(definition.id)),this.worldRandom(`resource:${definition.id}`),occupied,definition);
        for(const tile of candidates)if(resourceTiles(tile,definition).every(p=>!this.resourceOccupancy.has(tileKey(p))))this.addResource(definition,tile);
      }
      if(!this.loadState){const random=spawner.random;spawner.random=this.worldRandom(`resource-fill:${definition.id}`);while(this.resourceCount(definition.id)<spawnSettings.initial&&spawner.spawnOne()){}spawner.random=random;}
    }
    this.spawner=this.resourceSpawners.find(s=>s.definition.id==='stone');
    this.dropSystem=new DropSystem(this);
    this.foodStorage=new FoodStorageSystem(this,{physicalMaterials:true});this.kingLogistics=new KingLogisticsSystem(this);if(!this.loadState)depositStartingResources(this);
    this.animalSystem=new AnimalSystem(this);if(!this.loadState){this.animalSystem.random=this.worldRandom('animals');this.animalSystem.spawn(PLAYER_START);this.animalSystem.random=Math.random;}
    this.huntingSystem=new HuntingSystem(this);
    this.combatFeedback=new CombatFeedback(this);
    this.combat.on('attack',(attacker,target)=>{if(this.animalSystem.animals.has(target.id))this.animalSystem.onAttacked(target,attacker);});
    this.combat.on('attack',(attacker,target)=>{if(this.workerSystem?.workers.has(target.id)&&target.profession==='soldier'&&target.isAlive)this.combat.startAttack(target,attacker);});
    this.combat.on('damage',(unit,amount,attacker)=>{this.combatFeedback.hit(unit);this.skillSystem.creditDamage(attacker,unit,amount);});
    this.combat.on('death',(unit,killer)=>this.onUnitDeath(unit,killer));
    this.mountSystem=new MountSystem(this);this.fog=new FogOfWarSystem(this.character);
    // Day and night N1: a third of the sight outside light at night (one light list per fog update).
    this.fog.sightBonus=center=>sightBonus(this.relief,center);
    this.fog.sightScale=()=>{if(this.dayNight.darkness()<=0)return null;const lights=this.dayNight.lights();return c=>this.dayNight.sightFactor(c,lights);};
    this.mapMemory=new MapMemory(this.fog);this.memoryRenderer=new MapMemoryRenderer(this,this.mapMemory);
    this.settingsPanel=new SettingsPanel(settings=>{this.fog.setEnabled(settings.fogOfWar);this.fog.setExplorationEnabled(settings.explorationMode);this.fog.setMemoryBrightness(settings.memoryBrightness);this.terrain.setDebug(settings.pathWearDebug);this.background?.setEnabled(settings.runInBackground);this.refreshVisibility();},open=>this.pauseManager.set('settings',open),{seasons:this.seasons,onSeasonsChange:enabled=>{this.gameSettings=gameSettings({...this.gameSettings,seasonsEnabled:enabled});this.seasons.setEnabled(enabled);this.refreshVisibility();}});
    this.fog.setEnabled(this.settingsPanel.settings.fogOfWar);
    this.fog.setMemoryBrightness(this.settingsPanel.settings.memoryBrightness);
    if(!this.loadState){this.settingsPanel.applySettings({...this.settingsPanel.settings,fogOfWar:this.gameSettings.fogOfWar,explorationMode:this.gameSettings.explorationMode});this.fog.setEnabled(this.gameSettings.fogOfWar);}
    this.fog.setExplorationEnabled(this.settingsPanel.settings.explorationMode);
    this.terrain.setDebug(this.settingsPanel.settings.pathWearDebug);
    let devStorage;try{devStorage=window.localStorage;}catch{}this.fpsOverlay=new FpsOverlay(this.game,{storage:devStorage,camera:()=>this.cameras?.main});this.devBalancePanel=new DevBalancePanel(this,{storage:devStorage});
    this.foodSystem=new FoodSystem(this.inventory,this.objectRegistry.require('meat'),()=>this.updateInventory(),{time:this.gameTime,scene:this,subscribe:true});
    this.attractiveness=new KingdomAttractivenessSystem(this);this.foodEconomyPanel=new FoodEconomyPanel(this);
    this.inventoryBar=new InventoryBar(this.objectRegistry,this.assets,this.inventory);
    this.buildingUnlocks=new BuildingUnlockManager(this);
    this.buildingBar=new BuildingBar({registry:this.objectRegistry,assets:this.assets,unlocks:this.buildingUnlocks,freeOffer:definition=>freeOffer(this,definition),onSelect:definition=>this.startBuilding(definition),onCancel:()=>this.cancelBuilding()});
    this.assetGallery=new AssetGallery({registry:this.objectRegistry,assets:this.assets,onWorkplaceApply:()=>{this.workplaceSystem.reconcileDefinitions();if(this.selectedBuilding)this.selectedBuilding=this.objectRegistry.require(this.selectedBuilding.id);},onCostApply:()=>{if(this.selectedBuilding)this.selectedBuilding=this.objectRegistry.require(this.selectedBuilding.id);this.updateInventory();},onOpen:()=>this.setGalleryInput(false),onClose:()=>this.setGalleryInput(true)});
    this.equipmentPanel=new EquipmentPanel(this);
    this.workerSystem=new WorkerSystem(this,{onChange:(count,maximum)=>{document.querySelector('#population-count').textContent=t('hud.population',{count,maximum});}});if(!this.loadState)this.workerSystem.spawnInitial(this.worldRandom('villagers'));this.builderWorkshops=new BuilderWorkshopSystem(this);this.fishing=new FishingSystem(this);
    // Every living subject is a moving sight source (diameter 15); leaving, dying or emigrating removes it.
    this.fog.registerSource('subjects',()=>this.workerSystem.liveSubjects().map(subjectSight));
    this.workplaceSystem=new WorkplaceSystem(this);this.workplacePanel=new WorkplacePanel(this);
    this.constructionSystem=new ConstructionSystem(this,{onProgress:site=>this.towerViews.get(site.id)?.updateProgress?.(site),
      onComplete:site=>{this.towerViews.get(site.id)?.destroy();if(buildingDefinition(site).pavement){this.towerViews.delete(site.id);this.terrain.invalidateArea([site]);this.updateInventory();this.constructionUI?.refresh();return;}this.towerViews.set(site.id,this.createBuildingView(buildingDefinition(site),site));this.refreshWallConnections();this.updateInventory();this.constructionUI?.refresh();this.setStatus(t('status.built',{name:buildingDefinition(site).name}));this.completionFlash?.flash(site);},
      onCancel:site=>{this.towerViews.get(site.id)?.destroy();this.towerViews.delete(site.id);if(this.mapMemory?.objects.delete(`building:${site.id}`))this.mapMemory.revision++;this.terrain.invalidateArea(site.tiles);this.refreshWallConnections();this.updateInventory();this.constructionUI?.refresh();this.setStatus(t('status.siteCancelled'));}});
    this.demolition=new DemolitionSystem(this,{complete:(building,refund)=>finishDemolition(this,building,refund)});
    this.constructionUI=new ConstructionUI(this);
    this.foodProduction=new FoodProductionSystem(this);this.military=new MilitarySystem(this);if(!this.loadState&&this.gameSettings.startingGarrison)this.military.enlistStartingGarrison(this.worldRandom('villagers'));this.vehicles=new VehicleSystem(this);this.stables=new StableSystem(this);this.needs=new NeedsSystem(this);this.kingdomHappiness=new KingdomHappinessIndicator(this);this.vehicleViews=new VehicleViews(this);this.caravans=new CaravanSystem(this);this.trade=new TradeSystem(this);this.caravanViews=new CaravanViews(this);this.employment=new EmploymentSystem(this,{enabled:this.gameSettings.autoEmployment});this.diagnostics=new ProductionDiagnostics(this);this.employmentPanel=new EmploymentPanel(this);this.logisticsTasks=new LogisticsTaskManager(this);this.storagePanel=new StoragePanel(this);this.kingCargoControl=new KingCargoControl(this);this.legacyStockpiles=new LegacyStockpileMarkers(this);
    this.farmingSystem=new FarmingSystem(this,{growthModifier:()=>this.seasons.growthMultiplier(),onHarvest:result=>this.foodProduction.harvest(result)});this.farmingPanel=new FarmingPanel(this);this.farmConnections=new FarmConnections(this);
    this.experienceFeedback=new ExperienceFeedback(this);this.unitPanel=new UnitPanel(this);this.demolitionUI=new DemolitionUI(this);this.populationSidebar=new PopulationSidebar(this);this.noticesPanel=new NoticesPanel(this);
    this.treasureSystem=new TreasureSystem(this,{onReady:chest=>this.treasurePanel.open(chest),canShow:()=>!document.querySelector('dialog[open]'),onChange:()=>this.updateInventory()});
    this.treasurePanel=new TreasurePanel(this);if(!this.loadState){this.treasureSystem.random=this.worldRandom('treasures');this.treasureSystem.spawn(PLAYER_START);this.treasureSystem.random=Math.random;}
    this.wildlifeRespawn=new WildlifeRespawnSystem(this,this.animalSystem);
    this.policy=new PolicySystem(this);
    this.production=new ProductionSystem(this.gameTime,this.inventory,()=>this.buildings,(day,totals)=>this.onDailyIncome(day,totals));
    this.wageSystem=new WageSystem(this,{onPayroll:()=>this.updateInventory()});this.economyPanel=new EconomyPanel(this);
    this.buildingBar.close();this.updateInventory();
    this.gettingStarted=new GettingStartedPanel(this);this.wikiPanel=new WikiPanel(this);
    this.domestic=new DomesticAnimalSystem(this);this.combat.shield=(target,attacker)=>this.domestic?.shield(target,attacker);this.domesticViews=new DomesticViews(this,this.domestic);this.issueIcons=new IssueIcons(this);this.materialPiles=new MaterialPiles(this);this.childrenSystem=new ChildrenSystem(this);this.porches=new PorchSystem(this);this.nightOverlay=new NightOverlay(this,this.dayNight);/* m-svet-vzhled-2: soft fog edge, fish in water */this.fogEdge=new FogEdgeLayer(this);this.fishShadows=new FishShadows(this);this.riverLife=new RiverLife(this);this.fuelIcons=new FuelIcons(this);this.fireViews=new FireViews(this);this.kingdomOverview=new KingdomOverview(this);this.speedControls=new SpeedControls(this);this.tutorial=new TutorialGuide(this);this.royalGoals=new RoyalGoals(this);this.kingSkills=new KingSkills(this,this.royalGoals);this.royalGoalsPanel=new RoyalGoalsPanel(this,this.royalGoals);this.completionFlash=new CompletionFlash(this);this.storePreview=new StorePreview(this);this.dangerMarks=new DangerMarks(this);this.soundController=new AbortController();bindSoundSetting(document,this.soundController.signal);this.helpArrow=new HelpArrow(this);this.nightControls=new NightControls(this);this.nightSpeedUp=new NightSpeedUp(this);this.dayNight.attention=()=>!!this.nightThreats?.wolvesNear||!!this.nightThreats?.fires.size||[...this.combat.attacks.keys()].some(attacker=>attacker.profession===undefined&&attacker!==this.character);this.childViews=new ChildViews(this,this.childrenSystem);this.villagePanel=new VillagePanel(this);this.catPanel=new CatPanel(this);
    this.marketplacePanel=new MarketplacePanel(this);this.builderWorkshopPanel=new BuilderWorkshopPanel(this);this.policyPanel=new PolicyPanel(this);this.sideCards=new SideCards(this);
    this.updateTimeDisplay();
    this.setStatus(t('status.idle'));
    this.worldCamera=new WorldCamera(this,this.player);this.staffingIndicators=new MissingWorkersIndicators(this);
    this.naturalResources=new NaturalResourcesSystem(this);this.naturalResourcePanel=new NaturalResourcePanel(this);if(!this.loadState){const weights=this.worldWeights,at=(grid,t)=>grid[t.y*this.groundGrid[0].length+t.x]??0,F=WORLD_GENERATION.fairStart;
      this.naturalResources.generate(this.worldRandom('trees'),Math.round(WORLD_FORESTRY.initialTrees*settingsFromLevels(this.worldLevels).forest),{weight:weights?t=>at(weights.forest,t):null,start:settingsFromLevels(this.worldLevels).forest>=.5?{center:PLAYER_START,radius:F.radius,trees:F.trees}:null});
      this.naturalResources.mining.generate(this.worldRandom('minerals'),weights?t=>.25+.75*at(weights.stone,t):null);
      // m-kamenolom-u-hradu: a Quarry deposit 8–16 tiles from the Castle in every world (generator 3).
      this.naturalResources.mining.ensureStartQuarry(this.worldRandom('start-quarry'));
      // m-zelezny-dul-misto: a free Iron Mine spot beside the nearest Iron Deposit (generator 5).
      this.naturalResources.mining.ensureIronMine(this.worldRandom('start-iron-mine'));}
    // velke-prirodni-objekty: a group with a tree, deposit or building on a tile is single bushes or rocks again.
    pruneNatureGroups(this);
    // World v2: a fingerprint of the starting world as generated (terrain, water, bushes, every placed resource, animals,
    // chests), so tests and the Studio can check that a world code always gives the same world.
    this.startWorldFingerprint=this.loadState?null:this.worldFingerprint();
    this.resourceLedger=new ResourceTransactionLedger(this);if(this.loadState)this.resourceLedger.suspend();this.inventoryBar.setLedger(this.resourceLedger);
    const onBackground=()=>{this.background?.hide();this.visibilityPaused=true;this.tweens.pauseAll();this.setGalleryInput(false);};
    const onForeground=()=>{this.visibilityPaused=false;this.activeFramePending=true;if(!this.gameOver&&!this.gameTime.paused)this.tweens.resumeAll();this.setGalleryInput(true);this.background?.show();};
    this.game.events.on(Phaser.Core.Events.PAUSE,onBackground);this.game.events.on(Phaser.Core.Events.RESUME,onForeground);
    this.controls=new AbortController();
    this.background=createBackgroundSimulation(this);
    // Automatic employment ON/OFF in Settings; it belongs to this game and is saved with it.
    const autoToggle=document.querySelector('#auto-employment-toggle');autoToggle.checked=this.employment.enabled;autoToggle.addEventListener('change',()=>this.employment.setEnabled(autoToggle.checked),{signal:this.controls.signal});
    this.unsubscribeEmployment=this.employment.onChange(()=>{autoToggle.checked=this.employment.enabled;});
    const dismount=()=>this.mountSystem.dismount();
    document.querySelector('#dismount').addEventListener('click',dismount,{signal:this.controls.signal});
    this.gameOverDialog=document.querySelector('#game-over');
    this.gameOverDialog.addEventListener('cancel',event=>event.preventDefault(),{signal:this.controls.signal});
    document.querySelector('#restart-game').addEventListener('click',()=>{this.gameOverDialog.close();this.scene.restart({settings:this.gameSettings});},{signal:this.controls.signal});
    const onDismount=event=>{if(!event.repeat&&!this.assetGallery.isOpen)dismount();};
    this.input.keyboard.on('keydown-H',onDismount);this.updateMountUI();
    const onRotate=event=>{if(!event.repeat&&!this.assetGallery.isOpen)this.rotateGate();};this.input.keyboard.on('keydown-R',onRotate);
    this.combatFeedback.refresh();
    this.input.mouse.disableContextMenu();
    this.unitSelection=new UnitSelection(this);this.armyPanel=new ArmyPanel(this);this.rockMiningTool=new RockMiningTool(this);this.minimap=new Minimap(this);this.eventFeed=new EventFeed(this);this.millSails=new MillSails(this);
    // #121: a right click on the map first closes open panels (and does nothing else); otherwise it commands as before.
    // Request 28: a right click inside any window closes that window (PanelDismiss.js, one delegated listener).
    // m-pravy-klik-zavre-panel (owner, 12 Nov): the right mouse button on the map also closes the Buildings menu and the
    // Army panel (the Army panel only when no soldier is chosen in it – then the right click sends them, as on the map).
    const sidePanels=()=>[this.settingsPanel,this.populationSidebar,this.buildingBar?.dismissable,this.armyPanel?.dismissable];
    installPanelDismiss(document,{panels:sidePanels,scene:this,signal:this.controls.signal});
    this.input.on('pointerdown',pointer=>{if(pointer.rightButtonDown()&&closeOpenPanels(document,{panels:sidePanels()}))return;if(this.rockMiningTool.down(pointer))return;if(!this.unitSelection.down(pointer))this.handleClick(pointer);});
    this.input.on('pointerup',pointer=>{if(this.rockMiningTool.up(pointer))return;if(this.unitSelection.up(pointer))return;if(this.pavementTool?.anchor&&this.pavementTool.active()&&pointer.leftButtonReleased()){this.pavementTool.confirm(this.pointerTile(pointer));return;}if(this.dragAnchor&&pointer.leftButtonReleased())this.confirmWallLine(pointer);});
    this.input.on('pointerupoutside',()=>{this.rockMiningTool.cancelDrag();this.unitSelection.cancelDrag();this.clearWallPreviews();});
    this.input.on('pointermove',pointer=>{this.rockMiningTool.move(pointer);this.unitSelection.move(pointer);this.updateHover(pointer);if(this.buildMode&&!this.assetGallery.isOpen){if(!this.dragAnchor)this.wallLastLine=null;this.previewTracking=true;this.previewAnchor=this.pointerTile(pointer);this.updateBuildingPreview();}});
    this.input.on('gameout',()=>{/* Only a map building's tooltip: Phaser handles the queued canvas "out" after the HUD gauge's pointerenter, which would cancel its preview (map now under the HUD to the window edge, 9 Nov 2026). */if(this.storePreview?.key?.startsWith?.('building:'))this.storePreview.hide();this.rockMiningTool.cancelDrag();this.unitSelection.cancelDrag();this.previewAnchor=null;this.previewTracking=false;this.preview.setVisible(false);this.previewKey=null;this.clearWallPreviews();document.querySelector('#object-tooltip').hidden=true;});
    // #97: a Gate opens across its wall: in a wall running east–west the opening faces the other way (mirrored sprite).
    // m-staveni-zdi-studna (59): the axis comes from the wall run, else from the Gate's stored gateAxis (gateAxis in walls.js).
    this.orientGates=()=>{const index=wallIndex(this.buildings,true);for(const b of this.buildings)if(b.type==='wall_gate')this.flipGateView(this.towerViews.get(b.id),b,gateAxis(index,b)==='x');};
    this.events.on('buildings:changed',this.orientGates);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.events.off('buildings:changed',this.orientGates);
      this.rockMiningTool.destroy();this.unitSelection.destroy();this.minimap?.destroy();this.eventFeed?.destroy();this.millSails?.destroy();this.kingCargoControl.destroy();this.kingLogistics.destroy();this.lightSources.destroy();
      this.memoryRenderer.destroy();
      setRelief(null);
      this.populationSidebar.destroy();this.armyPanel?.destroy();
      this.staffingIndicators.destroy();
      this.naturalResourcePanel.destroy();this.naturalResources.destroy();this.resourceLedger.destroy();
      this.noticesPanel.destroy();this.diagnostics.destroy();this.employmentPanel.destroy();this.unsubscribeEmployment?.();this.employment.destroy();this.assetGallery.destroy();this.inventoryBar.destroy();this.buildingBar.destroy();this.worldCamera.destroy();this.assets.destroy();
      this.buildingUnlocks.destroy();
      this.animalSystem.destroy();this.dropSystem.destroy();document.querySelector('#object-tooltip').hidden=true;
      this.settingsPanel.destroy();this.fpsOverlay.destroy();this.devBalancePanel?.destroy();this.controls.abort();this.input.keyboard.off('keydown-H',onDismount);this.input.keyboard.off('keydown-R',onRotate);
      this.clearWallPreviews();
      this.combatFeedback.destroy();this.combat.clear();this.gameOverDialog.close();
      this.equipmentPanel.destroy();this.treasurePanel.destroy();this.gettingStarted.destroy();this.wikiPanel?.destroy();this.royalGoalsPanel?.destroy();this.royalGoals?.destroy();this.kingSkills?.destroy();this.completionFlash?.destroy();this.storePreview?.destroy();this.dangerMarks?.destroy();this.soundController?.abort();this.marketplacePanel.destroy();this.catPanel?.destroy();this.domesticViews?.destroy();this.domestic?.destroy();this.villagePanel?.destroy();this.issueIcons?.destroy();this.materialPiles?.destroy();this.sideCards?.destroy();this.childViews?.destroy();this.childrenSystem?.destroy();this.porches?.destroy();this.lightFuel?.destroy();this.nightThreats?.destroy();this.fuelIcons?.destroy();this.fireViews?.destroy();this.kingdomOverview?.destroy();this.speedControls?.destroy();this.tutorial?.destroy();this.helpArrow?.destroy();this.nightOverlay?.destroy();this.fogEdge?.destroy();this.fishShadows?.destroy();this.nightControls?.destroy();this.nightSpeedUp?.destroy();this.background?.destroy();this.builderWorkshopPanel.destroy();this.fishing?.destroy();this.caravanViews.destroy();this.trade.destroy();this.caravans.destroy();this.policyPanel.destroy();this.policy.destroy();this.treasureSystem.destroy();this.production.destroy();this.gameTime.destroy();
      this.pathWear.destroy();this.terrain.destroy();
      this.experienceFeedback.destroy();this.pavementTool.destroy();this.unitPanel.destroy();this.experienceSystem.destroy();this.activities.destroy();
      this.demolitionUI.destroy();this.demolition.destroy();this.farmConnections.destroy();this.farmingPanel.destroy();this.farmingSystem.destroy();this.constructionUI.destroy();this.constructionSystem.destroy();this.workplacePanel.destroy();this.workplaceSystem.destroy();this.workerSystem.destroy();this.skillSystem.destroy();this.wageSystem.destroy();
      this.storagePanel.destroy();this.legacyStockpiles.destroy();this.logisticsTasks.destroy();this.foodProduction.destroy();this.foodStorage.destroy();
      this.foodEconomyPanel.destroy();this.foodSystem.destroy();this.needs?.destroy();this.unsubscribeSeason();this.seasonTransition?.destroy();this.seasons.destroy();
      this.game.events.off(Phaser.Core.Events.PAUSE,onBackground);this.game.events.off(Phaser.Core.Events.RESUME,onForeground);
      this.game.canvas.style.cursor='';
    });
    if(this.loadState){loadGameState(this,this.loadState);this.loadState=null;this.nightControls?.syncThreats();}
    this.game.registry.get('application')?.onGameReady(this);
  }

  setGalleryInput(enabled) {
    enabled=enabled&&!this.gameOver&&!this.gameTime.paused&&!this.visibilityPaused&&!blockingDialog(document);
    this.input.enabled=enabled;this.input.keyboard.enabled=enabled;
    for(const key of Object.values(this.worldCamera?.keys??{}))key.reset();
    this.previewTracking=false;this.preview.setVisible(false);
    this.dragAnchor=null;for(const preview of this.wallPreviews.values())preview.setVisible(false);
    document.querySelector('#object-tooltip').hidden=true;
  }
  setPaused(value){
    if(this.gameOver)return;
    this.gameTime.setPaused(value);if(value||this.visibilityPaused)this.tweens.pauseAll();else{this.activeFramePending=true;this.tweens.resumeAll();}this.setGalleryInput(!value);
  }

  isFordTile(tile){return this.fordKeys?.has(`${tile.x},${tile.y}`)??false;}
  // velke-prirodni-objekty: loose stones, new trees and deposits keep off thickets (they would split them).
  thicketTileList(){return [...thicketTiles(this.natureGroups)].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};});}
  fordTiles(){return [...(this.fordKeys??[])].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};});}
  reservedTiles(){return [...this.character.reservedTiles(),...(this.animalSystem?.reservedTiles()??[]),...(this.workerSystem?.reservedTiles()??[]),...(this.foodStorage?.reservedTiles()??[]),...this.buildings.flatMap(b=>b.tiles)];}
  updateHover(pointer){
    this.hoverX=pointer.x;this.hoverY=pointer.y;this.hoverAt=performance.now();
    const tooltip=document.querySelector('#object-tooltip');
    const wearInfo=document.querySelector('#path-wear-info');wearInfo.hidden=!this.settingsPanel.settings.pathWearDebug;
    if(!wearInfo.hidden){const tile=this.pointerTile(pointer);if(!this.fog.isVisibleTile(tile)){wearInfo.textContent='Path Wear: outside current sight.';}else{const grass=this.pathWear.isGrass(tile),score=grass?this.pathWear.scores[this.pathWear.index(tile)]:0;
      const text=grass?t('status.pathWear',{x:tile.x,y:tile.y,score,level:this.pathWear.level(tile)}):t('status.pathWearNone');if(wearInfo.textContent!==text)wearInfo.textContent=text;
    }}
    if(this.buildMode||blockingDialog(document)){tooltip.hidden=true;this.storePreview?.hide();return;}
    pointer.updateWorldPoint(this.cameras.main);
    const hoverHit=this.pickInteraction(pointer.worldX,pointer.worldY,this.pointerTile(pointer));
    {const rect=this.game.canvas.getBoundingClientRect(),b=hoverHit?.kind==='building'&&this.buildingReachable(hoverHit.object)?hoverHit.object:null;
      // m-budovy-tooltip (86): not while dragging, for the selected building or on touch (build mode returned above).
      const allowed=!!b&&buildingTooltipAllowed({dragging:!!pointer.isDown||!!this.unitSelection?.dragging,selected:selectedBuildingIds(this).has(b.id),touch:!!pointer.wasTouch||!!globalThis.matchMedia?.('(hover: none)').matches});
      this.storePreview?.hoverBuilding(b,rect.left+pointer.x*rect.width/this.scale.width,rect.top+pointer.y*rect.height/this.scale.height,{allowed});}
    if(hoverHit?.kind==='human'){
      const unit=hoverHit.object;tooltip.hidden=false;this.personTooltip(tooltip,personHover(unit,{king:unit===this.character}));
      const rect=this.game.canvas.getBoundingClientRect();tooltip.style.left=`${Math.min(window.innerWidth-150,rect.left+pointer.x*rect.width/this.scale.width+14)}px`;tooltip.style.top=`${Math.max(4,rect.top+pointer.y*rect.height/this.scale.height-32)}px`;return;
    }
    // Owner 9 Nov 2026: a child shows its name and "Child" as its occupation.
    if(hoverHit?.kind==='child'){const child=hoverHit.object;tooltip.hidden=false;this.personTooltip(tooltip,{name:this.childrenSystem.nameOf(child,{full:true}),role:t('hover.child')});
      const rect=this.game.canvas.getBoundingClientRect();tooltip.style.left=`${Math.min(window.innerWidth-180,rect.left+pointer.x*rect.width/this.scale.width+14)}px`;tooltip.style.top=`${Math.max(4,rect.top+pointer.y*rect.height/this.scale.height-44)}px`;return;}
    const drop=this.dropSystem.atPoint(pointer.worldX,pointer.worldY);
    tooltip.hidden=!drop||hoverHit?.kind!=='drop';
    if(drop){
      tooltip.classList.remove('person-tooltip');tooltip.textContent=`${this.objectRegistry.require(drop.resource).name} ×${drop.amount}`;
      const rect=this.game.canvas.getBoundingClientRect();
      tooltip.style.left=`${Math.min(window.innerWidth-110,rect.left+pointer.x*rect.width/this.scale.width+14)}px`;
      tooltip.style.top=`${Math.max(4,rect.top+pointer.y*rect.height/this.scale.height-32)}px`;
    }
  }

  resourceOrigins() {
    const c=this.character;
    if(c.exitTile)return [c.exitTile];
    if(c.currentTower&&isWall(c.currentTower))return connectedWalls(this.buildings,c.currentTower).flatMap(towerNeighbors);
    return c.currentTower?towerNeighbors(c.currentTower):[c.nextTile??c.tile];
  }
  resourceCount(id) { let count=0;for(const view of this.resources.values())if(view.getData('objectId')===id)count++;return count; }
  addResource(definition,tile,natural=null) {
    const point=gridToWorld(tile.x+definition.width/2,tile.y+definition.height/2),key=tileKey(tile);
    const object={x:tile.x,y:tile.y,type:definition.id,definition,tiles:resourceTiles(tile,definition),...(natural?{natural:structuredClone(natural)}:{})};
    const view=this.assets.createView(definition.id,{...point,tile,object});
    view.setData('tile',{...tile});view.setData('object',object);
    this.resources.set(key,view);
    for(const part of object.tiles){this.resourceOccupancy.set(tileKey(part),key);if(resourceBlocks(object))this.map[part.y][part.x]=1;}
    this.naturalResources?.register(object);
    this.updateWorldCount();
  }

  pointerTile(pointer) { pointer.updateWorldPoint(this.cameras.main);return worldToTile(pointer.worldX,pointer.worldY); }
  handleClick(pointer,released=false) {
    if(this.gameOver||this.gameTime.paused||blockingDialog(document))return;
    if(pointer.rightButtonDown()){if(this.buildMode)this.cancelBuilding();return;}
    if(!released&&!pointer.leftButtonDown())return;
    this.naturalResources?.cancelKing();
    this.populationSidebar?.clearSelection();
    this.treasureSystem.cancelRequest();
    let goal=this.pointerTile(pointer);
    if(this.buildMode){
      this.previewAnchor=goal;
      if(this.selectedBuilding.construction?.mode==='pavement'){this.pavementTool.begin(goal);return;}
      if(this.selectedBuilding.construction?.mode==='line'){
        this.dragAnchor={...goal};this.wallLastLine=null;this.previewTracking=true;this.previewKey=null;this.updateBuildingPreview();return;
      }
      // Outside sight a blueprint is provisional: checked against known ground now, against the real site once seen.
      // m-zelezny-dul-misto: an Iron Mine says why a spot is invalid, and outside sight it needs a known Iron Deposit.
      const provisional=isProvisional(this.fog,buildingTiles(goal,this.selectedBuilding)),known=provisional?mineSpotError(this,goal,this.selectedBuilding,knownPlacementError(this,goal,this.selectedBuilding))??provisionalMineError(this,goal,this.selectedBuilding):null;
      if(known){this.previewKey=null;this.updateBuildingPreview();this.setStatus(known);return;}
      // m-staveni-zdi-studna (59): a Gate or Tower over Stone Wall segments replaces them; a Gate keeps the axis it was placed with.
      const fields=this.selectedBuilding.id==='wall_gate'?{gateAxis:gateAxis(wallIndex(this.buildings,true),{...goal,gateAxis:this.gateAxis})}:null;
      const result=placeBuilding({map:this.map,anchor:goal,resources:this.resourceOccupancy,reservedTiles:this.reservedTiles(),inventory:this.inventory,buildings:this.buildings,definition:this.selectedBuilding,reserveMaterials:true,provisional,fields,replaceWalls:(walls,building)=>replaceWalls(this,walls,building)});
      if(result.error){this.previewKey=null;this.updateBuildingPreview();this.setStatus(mineSpotError(this,goal,this.selectedBuilding,result.error));}
      else{
        this.constructionSystem.plan(result.building);
        this.towerViews.set(result.building.id,this.createBuildingView(this.selectedBuilding,result.building));if(provisional)this.rememberBlueprint(result.building);
        let message=this.selectedBuilding.crop&&result.building.farmId==null?t('farmPlots.orphan'):t(provisional?'status.blueprintProvisional':'status.blueprintReady',{name:this.selectedBuilding.name,cost:formatCost(this.selectedBuilding.cost,this.objectRegistry)});
        if(result.replaced)message+=` ${t('status.wallReplaced',{count:result.replaced.length,refund:Object.keys(result.refund??{}).length?formatCost(result.refund,this.objectRegistry):t('demolition.noRefund')})}`;
        this.updateInventory();
        // Keep the same tool after each accepted order of a repeat-placement building (Farmhouse, Wheat Field, Orchard;
        // m-staveni-zdi-studna (59): Stone Wall, Tower and Gate too).
        // Revalidate the occupied footprint immediately so a second click cannot create or pay for another order there.
        if(this.selectedBuilding.repeatPlacement){
          this.previewKey=null;this.updateBuildingPreview();this.updateBuildingUI();this.setStatus(message);
        }else this.cancelBuilding(message);
      }
      return;
    }
    const selected=this.pickInteraction(pointer.worldX,pointer.worldY,goal);
    // Unseen ground can be a destination; nothing hidden there is checked or revealed.
    const unknown=!selected&&!this.fog.isVisibleTile(goal);
    if(unknown&&!this.fog.isInMap(goal)){this.setStatus(OUTSIDE_SIGHT);return;}
    this.demolitionUI.select(selected?.kind==='building'?selected.object:null);
    if(selected?.kind==='human'){this.unitPanel.open(selected.object);return;}
    if(selected?.kind==='cat'){if(selected.object.id.startsWith('dog-'))this.catPanel.openDog(selected.object);else this.catPanel.open(selected.object);return;}
    if(selected?.kind==='stockpile'){this.storagePanel.open(null,selected.object.location.id);return;}
    if(selected?.kind==='building'&&!buildingIsComplete(selected.object)){if(this.kingLogistics.workflowSiteId!==selected.object.id){this.kingLogistics.cancel();this.constructionSystem.commandKing(selected.object);}this.constructionUI.open(selected.object);return;}
    if(selected?.kind==='building'&&buildingDefinition(selected.object).crop){this.farmingPanel.open(selected.object);return;}
    if(selected?.kind==='child'){this.villagePanel.open('child',selected.object);return;}
    if(selected?.kind==='building'&&selected.object.type==='village_green'){this.villagePanel.open('green',selected.object);return;}
    if(selected?.kind==='building'&&buildingDefinition(selected.object).housing){this.villagePanel.open('house',selected.object);return;}
    if(selected?.kind==='building'&&selected.object.type==='castle')this.employmentPanel.open();
    if(selected?.kind==='building'&&buildingDefinition(selected.object).trade){this.marketplacePanel.open(selected.object);return;}
    if(selected?.kind==='building'&&buildingDefinition(selected.object).builderWorkshop){this.builderWorkshopPanel.open(selected.object);return;}
    // farmhouse-store: a workplace with its own store (the Farmhouse) opens the workplace panel, which links to the store.
    if(selected?.kind==='building'&&buildingDefinition(selected.object).storage&&!buildingDefinition(selected.object).workplace){this.storagePanel.open(selected.object);return;}
    if(selected?.kind==='building'&&buildingDefinition(selected.object).workplace){this.workplacePanel.open(selected.object);return;}
    if(this.character.transitioning){this.setStatus(t('status.waitClimb'));return;}
    this.constructionSystem.stopKing();
    this.kingLogistics.cancel();
    this.character.order=null;
    this.huntingSystem.cancel();this.mountSystem.cancel();
    const hit=selected,building=hit?.kind==='building'?hit.object:null;
    const animal=hit?.kind==='animal'?hit.object:null,drop=hit?.kind==='drop'?hit.object:null;
    let accepted=false;
    if(building){
      if(buildingDefinition(building).interactions.includes('enter')){
        if(this.character.mountedHorse&&!this.mountSystem.dismount())return;
        accepted=this.character.command({kind:'enter',tower:building});
      }
      else this.setStatus(buildingDefinition(building).description);
    }else if(animal){
      accepted=animal.definition.interactions.includes('mount')?this.mountSystem.command(animal):this.huntingSystem.command(animal);
    }else if(drop){
      accepted=this.character.command({kind:'drop',goal:drop.tile,dropId:drop.id});
    }else if(hit?.kind==='chest'){
      accepted=this.character.command({kind:'openChest',chest:hit.object});
    }else{
      const resource=hit?.kind==='resource'?hit.object:null;
      if(resource){
        const object=resource.getData('object'),definition=object.definition;
        if(definition.tree||definition.deposit){this.naturalResourcePanel.open(object);return;}
        if(!definition.collectible){this.setStatus(definition.description);return;}
        goal=resource.getData('tile');
        if(!definition.walkable)accepted=this.character.command({kind:'collect',resource:object,pickupKey:tileKey(goal)});
        else accepted=this.character.command({kind:'move',goal,pickupKey:tileKey(goal)});
      }else if(unknown)accepted=this.character.command({kind:'move',goal,pickupKey:null,explore:true});
      else if(!isWalkable(this.map,goal.x,goal.y))this.setStatus(t('status.obstacle'));
      else accepted=this.character.command({kind:'move',goal,pickupKey:null});
    }
    if(accepted)this.worldCamera.follow();
  }
  // Owner 9 Nov 2026: the hover label of a person – the name, then the occupation (with its level), plain text.
  personTooltip(tooltip,{name,role}){tooltip.classList.add('person-tooltip');const a=document.createElement('strong'),b=document.createElement('span');a.textContent=name;b.textContent=role;tooltip.replaceChildren(a,b);}
  pickInteraction(x,y,tile){
    const hits=[],building=this.towerAtPoint(x,y,tile),animal=this.animalSystem.atPoint(x,y),chest=this.treasureSystem.atPoint(x,y,tile);
    const drop=this.dropSystem.atPoint(x,y)??this.dropSystem.atTile(tile);
    const resourceHit=[...this.resources.values()].sort((a,b)=>b.depth-a.depth).find(view=>this.fog.isVisibleObject(view.getData('object'))&&this.assets.hitTest(view,x,y));
    let resource=resourceHit??this.resources.get(this.resourceOccupancy.get(tileKey(tile)));
    if(resource&&!this.fog.isVisibleObject(resource.getData('object')))resource=null;
    if(building)hits.push({kind:'building',object:building,depth:buildingDefinition(building).crop?tileCenter(tile).y-.2:buildingDepth(building)+.3});
    const stockpile=this.legacyStockpiles.atPoint(x,y);if(stockpile)hits.push({kind:'stockpile',object:stockpile,depth:stockpile.depth});
    for(const unit of this.selectableHumans()){
      const view=unit.view??unit.sprite;if(unit.sleepingIn==null&&this.fog.isVisibleObject(unit)&&this.assets.hitTest(view,x,y))hits.push({kind:'human',object:unit,depth:view.depth});
    }
    if(animal)hits.push({kind:'animal',object:animal,depth:animal.view.depth});
    const cat=this.domestic?.atPoint(x,y);if(cat)hits.push({kind:'cat',object:cat,depth:cat.view.depth+1});
    const child=this.childrenSystem?.atPoint(x,y);if(child)hits.push({kind:'child',object:child,depth:child.view.depth+1});
    if(chest)hits.push({kind:'chest',object:chest,depth:chest.view.depth});
    if(drop)hits.push({kind:'drop',object:drop,depth:drop.view.depth});
    if(resource)hits.push({kind:'resource',object:resource,depth:resource.depth});
    return hits.sort((a,b)=>b.depth-a.depth)[0]??null;
  }

  createBuildingView(definition,building,preview=false) {
    const object={...building,type:definition.id,definition,tiles:building.tiles??buildingTiles(building,definition)};
    if(!preview){this.naturalResources?.mining.registerBuilding(building);this.terrain.invalidateArea(object.tiles);this.workplaceSystem?.register(building);this.farmingSystem?.register(building);this.foodStorage?.register(building);this.foodProduction?.register(building);}
    let view=this.assets.createView(definition.id,{building:object,preview});
    if(!preview&&definition.lights?.length&&buildingIsComplete(building)&&this.lightSources)view=this.lightSources.attach(view,object);
    if(!preview&&definition.crop&&buildingIsComplete(building))view.setGrowth?.(this.farmingSystem?.records.get(building.id)?.stage??0);
    if(!preview&&definition.id==='wall_gate')this.time?.delayedCall?.(0,()=>this.orientGates?.());
    return !preview&&!buildingIsComplete(building)?new ConstructionView(this,building,view):view;
  }
  flipGateView(view,building,flip){
    const sprite=view?.back?.sprite??view?.view?.back?.sprite;if(!sprite)return;const o=building.definition?.origin??{x:.38372,y:.84348};sprite.setFlipX(flip);sprite.setOrigin(flip?1-o.x:o.x,o.y);
  }
  // m-staveni-zdi-studna (59): R (or Shift+wheel) turns the Gate being placed; a wall run under the cursor still decides.
  rotateGate(){
    if(!this.buildMode||this.selectedBuilding?.id!=='wall_gate')return false;
    const turn=turnGate(wallIndex(this.buildings,true),this.previewAnchor,this.gateAxis);
    if(turn.locked){this.setStatus(t('status.gateFollowsWall'));return true;}
    this.gateAxis=turn.axis;this.previewKey=null;this.updateBuildingPreview();return true;
  }
  selectableHumans(){return this.workerSystem?.liveWorkers()??[];}
  // m-budovy-klik-mimo-dohled (owner, 12 Nov): the King always knows his own buildings, so one on explored ground (grey
  // fog) opens like one in sight; animals, loot and strangers in the fog stay out of reach.
  buildingReachable(building){const f=this.fog;if(!f?.enabled||f.isVisibleObject(building))return true;if(building.unverified)return true;const w=f.width;return !!f.explored&&(building.tiles??[]).some(t=>f.explored[t.y*w+t.x]);}
  towerAtPoint(x,y,tile) {
    return [...this.buildings].filter(building=>this.buildingReachable(building)).sort((a,b)=>towerBase(b).y-towerBase(a).y).find(building=>this.towerViews.get(building.id).contains(x,y)||building.tiles.some(part=>tileKey(part)===tileKey(tile)));
  }
  startBuilding(definition=this.objectRegistry.require('tower')) {
    this.rockMiningTool?.close();
    if(this.gameOver||this.gameTime.paused)return false;
    if(this.character.transitioning){this.setStatus(t('status.finishClimb'));return false;}
    definition=this.objectRegistry.get(definition.id);if(!definition?.buildable)return false;
    const status=this.buildingUnlocks.status(definition,{live:true});if(!status.unlocked){this.setStatus(status.description);return false;}
    this.kingLogistics?.cancel();
    this.huntingSystem.cancel();this.mountSystem.cancel();
    this.treasureSystem.cancelRequest();
    this.clearWallPreviews();
    this.unitSelection?.clear();this.constructionSystem.stopKing();this.character.stopForBuilding();definition=placeableDefinition(this,definition);this.selectedBuilding=definition;
    this.preview.destroy();this.preview=this.createBuildingView(definition,{x:0,y:0},true);this.preview.setVisible(false);
    this.buildMode=true;this.previewKey=null;this.previewAnchor=null;this.previewTracking=false;this.game.canvas.style.cursor='crosshair';this.pavementTool.clear();
    this.updateBuildingUI();this.setStatus(t('status.placing',{name:definition.name,size:t('building.size',{width:definition.width,height:definition.height}),cost:formatCost(definition.cost,this.objectRegistry)})+(definition.id==='wall_gate'?` · ${t('build.rotateHint')}`:''));
    return true;
  }
  cancelBuilding(message=t('status.buildCancelled')) {
    this.clearWallPreviews();
    this.buildMode=false;this.pavementTool?.clear();this.selectedBuilding=null;this.previewAnchor=null;this.previewTracking=false;this.previewKey=null;
    this.preview.setVisible(false);this.game.canvas.style.cursor='';this.updateBuildingUI();this.setStatus(message);
  }
  // The player sees the provisional blueprint they placed, as a remembered site, until someone sees the real ground.
  rememberBlueprint(building){
    rememberBlueprint(this,building);
  }
  updateBuildingPreview() {
    const anchor=this.previewAnchor,definition=this.selectedBuilding;
    if(this.buildMode&&anchor&&definition.construction?.mode==='line'){this.updateWallPreview(anchor);return;}
    if(this.buildMode&&anchor&&definition.construction?.mode==='pavement'){this.pavementTool.preview(anchor);return;}
    if(!this.buildMode||!anchor||anchor.x<0||anchor.y<0||anchor.x>=COLUMNS||anchor.y>=ROWS){this.preview.setVisible(false);return;}
    // Outside sight the preview is amber (provisional): only known ground decides, never a hidden obstacle.
    const provisional=isProvisional(this.fog,buildingTiles(anchor,definition));
    const error=mineSpotError(this,anchor,definition,provisional?knownPlacementError(this,anchor,definition):placementError(this.map,anchor,this.resourceOccupancy,this.reservedTiles(),definition,this.buildings,this.buildingUnlocks))
      ??(provisional?provisionalMineError(this,anchor,definition):null)??(!this.inventory.canAfford(definition.cost)?t('status.noFunds'):null);
    const gate=definition.id==='wall_gate'?gateAxis(wallIndex(this.buildings,true),{...anchor,gateAxis:this.gateAxis}):null;
    const key=`${tileKey(anchor)}:${provisional}:${error}:${gate}`;
    if(key!==this.previewKey){
      this.preview.paint({x:anchor.x,y:anchor.y,type:definition.id,definition,tiles:buildingTiles(anchor,definition)},error?0xf27777:provisional?0xe3c46b:0x71dba6);
      let water='',hint='';if(gate){this.flipGateView(this.preview,{definition},gate==='x');hint=` · ${t('build.rotateHint')}`;}
      this.previewKey=key;if(!error&&definition.fishing&&this.fishing){const distance=this.fishing.previewDistance(anchor,definition);water=` · ${distance?t('fishing.previewWater',{distance}):t('fishing.previewNoWater')}`;}
      this.setStatus((error??t(provisional?'status.provisionalPlace':'status.validPlace',{name:definition.name,cost:formatCost(definition.cost,this.objectRegistry)})+water)+hint);
    }
    this.preview.setVisible(true);
  }
  clearWallPreviews(){
    for(const view of this.wallPreviews.values())view.destroy();this.wallPreviews.clear();this.dragAnchor=null;this.wallLastLine=null;
  }
  // A wall line reaching outside sight is planned against known ground and every segment becomes provisional.
  wallOptions(tiles){const provisional=isProvisional(this.fog,tiles);return {map:this.map,tiles,resources:this.resourceOccupancy,reservedTiles:this.reservedTiles(),buildings:this.buildings,definition:this.selectedBuilding,inventory:this.inventory,reserveMaterials:true,...(provisional?{...knownContext(this),provisional}:{})};}
  updateWallPreview(anchor){
    this.preview.setVisible(false);
    const tiles=this.dragAnchor?wallLine(this.dragAnchor,anchor):this.wallLastLine??[anchor],options=this.wallOptions(tiles),plan=wallLinePlan(options);
    const key=`walls:${tiles.map(tileKey).join(';')}:${!!options.provisional}:${plan.error}`;
    if(key===this.previewKey){for(const view of this.wallPreviews.values())view.setVisible(true);return;}
    const definition=this.selectedBuilding,existing=wallIndex(this.buildings,true),index=new Map(existing);
    for(const tile of tiles)index.set(tileKey(tile),{...tile,type:definition.id,definition});
    const needed=new Set();
    for(const tile of tiles){
      const tileId=tileKey(tile);if(existing.has(tileId))continue;needed.add(tileId);
      const object={...tile,type:definition.id,definition,tiles:buildingTiles(tile,definition),connections:connectionsFor(index,tile)};
      let view=this.wallPreviews.get(tileId);
      if(!view){view=this.createBuildingView(definition,object,true);this.wallPreviews.set(tileId,view);}
      view.paint(object,plan.error?0xf27777:options.provisional?0xe3c46b:0x71dba6);view.setVisible(true);
    }
    for(const [id,view]of this.wallPreviews)if(!needed.has(id)){view.destroy();this.wallPreviews.delete(id);}
    this.previewKey=key;
    this.setStatus(plan.error??t(options.provisional?'status.wallPlanProvisional':'status.wallPlan',{count:plan.tiles.length,cost:formatCost(plan.cost,this.objectRegistry)}));
  }
  confirmWallLine(pointer){
    if(!this.buildMode||this.selectedBuilding.construction?.mode!=='line'||!this.dragAnchor)return;
    const tiles=wallLine(this.dragAnchor,this.pointerTile(pointer)),options=this.wallOptions(tiles);
    const result=placeWallLine(options);
    this.dragAnchor=null;
    if(result.error){this.wallLastLine=tiles;this.previewTracking=false;this.previewKey=null;this.updateBuildingPreview();return;}
    for(const building of result.buildings){this.constructionSystem.plan(building);this.towerViews.set(building.id,this.createBuildingView(this.selectedBuilding,building));if(building.unverified)this.rememberBlueprint(building);}
    this.refreshWallConnections();this.updateInventory();
    const message=t('status.wallBlueprints',{count:result.buildings.length,cost:formatCost(result.cost,this.objectRegistry)});
    // m-staveni-zdi-studna (59): the wall tool stays selected for the next line (Esc, right click or another building ends it).
    if(this.selectedBuilding.repeatPlacement){this.clearWallPreviews();this.previewAnchor=this.pointerTile(pointer);this.previewTracking=true;this.previewKey=null;this.updateBuildingPreview();this.updateBuildingUI();this.setStatus(message);}
    else this.cancelBuilding(message);
  }
  refreshWallConnections(){
    this.wallMap=wallIndex(this.buildings);
    for(const building of this.wallMap.values()){
      const connections=connectionsFor(this.wallMap,building),key=JSON.stringify(connections);
      if(key!==building.connectionKey){building.connections=connections;building.connectionKey=key;this.towerViews.get(building.id)?.paint(building);}
    }
  }
  showMarker(tile) { this.marker.clear().lineStyle(2,0xe3c879,1).strokePoints(tilePolygon(tile),true).setVisible(true); }

  collectResource(key,standingTile,actor=this.character) {
    if(actor.state!==PLAYER_STATE.GROUND)return false;
    const view=this.resources.get(key);if(!view)return false;
    const object=view.getData('object'),definition=object.definition;
    if(!definition.collectible)return false;
    const reachable=definition.walkable?key===tileKey(standingTile):towerNeighbors(object).some(p=>tileKey(p)===tileKey(standingTile));
    if(!reachable)return false;
    if(actor===this.character&&this.foodStorage.manages(definition.id)&&this.kingLogistics?.room(definition.id)<1){this.setStatus(t('status.cargoFull'));return false;}
    view.destroy();this.resources.delete(key);
    for(const tile of object.tiles){this.dropSystem.refreshOccupancy(tile);if(!definition.walkable)this.map[tile.y][tile.x]=0;}
    const event={type:'resourceCollected',objectType:definition.id,quantity:1};
    if(actor===this.character&&this.kingLogistics&&this.foodStorage.manages(definition.id))this.kingLogistics.receive({resource:definition.id,amount:1,event});
    else if(!this.workplaceSystem?.carryCollection(actor,{resource:definition.id,amount:1,event})){this.inventory.add(definition.id,1,{track:false});this.activities.emit(event.type,{...event,actor});}
    this.resourceLedger?.income(definition.id,1,definition.id==='stone'?'Stone Collection':'Resource Collection',{entityId:key});
    this.updateInventory();return true;
  }
  collectStone(tile) { return this.collectResource(tileKey(tile),this.character.tile); }
  updateInventory() { this.inventoryBar.update();this.updateBuildingUI();this.updateWorldCount();this.updateFoodDisplay();this.equipmentPanel?.refresh();this.economyPanel?.update(); }
  // Language switch during play: refresh every HUD text that is built in code.
  relabelUI(){
    this.speedControls?.render();this.tutorial?.relabel();this.wikiPanel?.relabel();this.royalGoalsPanel?.relabel();
    this.updateTimeDisplay();this.updateFoodDisplay();this.updateWorldCount();this.updateMountUI?.();this.combatFeedback?.refresh();this.experienceFeedback?.refresh();this.workerSystem?.updateUI();this.inventoryBar?.update();this.gettingStarted?.relabel();this.marketplacePanel?.relabel();this.policyPanel?.render();this.buildingBar?.selectCategory?.(this.buildingBar.category);if(this.populationSidebar){this.populationSidebar.renderOptions();this.populationSidebar.lastRefresh=-Infinity;}this.updateBuildingUI();
    if(this.worldCamera?.following)document.querySelector('#camera-mode').textContent=t('hud.cameraKing');
  }
  updateTimeDisplay(){const output=document.querySelector('#game-time');if(output.textContent!==this.gameTime.label)output.textContent=this.gameTime.label;output.title=this.gameTime.tooltip;const clock=document.querySelector('#game-clock');if(clock&&this.dayNight){const text=formatClock(clockMinutes(this.dayNight.fraction(),this.dayNight.nightStart()));if(clock.textContent!==text)clock.textContent=text;clock.title=output.title;}const seasonTip=document.querySelector('#season-weather');if(seasonTip)seasonTip.title=this.seasons.tooltip;const seasons=document.querySelector('#season-weather');if(seasons.textContent!==this.seasons.label)seasons.textContent=this.seasons.label;}
  onDailyIncome(day,totals){
    const labels=new Set(this.buildings.map(b=>buildingDefinition(b).production).filter(p=>p?.interval==='day'&&totals[p.resource]).map(p=>localized(`production.${p.resource}`,p.label)).filter(Boolean));
    const details=Object.entries(totals).map(([id,amount])=>`+${amount} ${this.objectRegistry.require(id).name}`).join(' · ');
    const notice=document.querySelector('#day-notice');notice.textContent=t('hud.dayNotice',{day,labels:[...labels].join(', ')||t('hud.income'),details});
    notice.hidden=false;this.noticeRemaining=4000;this.updateInventory();
  }
  updateFoodDisplay(){
    // Plan m-e1-jidlo-vydrz: how long the edible stores last; portions a day in the tooltip.
    const days=foodDays(this.foodSystem),text=Number.isFinite(days)?t('hud.foodDays',{days:Math.floor(days),count:Math.floor(days)}):t('hud.food',{count:this.foodSystem.dailyConsumption});
    const output=document.querySelector('#food-countdown');if(output.textContent!==text)output.textContent=text;
    output.dataset.tone=days<FOOD_OUTLOOK.warnDays?'bad':days<FOOD_OUTLOOK.warnDays*2?'warn':'good';output.title=t('hud.foodTip',{count:this.foodSystem.dailyConsumption});
    const warning=document.querySelector('#food-warning');warning.hidden=!this.foodSystem.shortage;warning.textContent=t('hud.foodShortage',{count:this.foodSystem.hungryCount});
  }
  updateBuildingUI() { this.buildingBar.update(this.inventory,this.buildMode?this.selectedBuilding:null); }
  updateWorldCount() {
    const capacity=resourceSpawnSettings(this.objectRegistry.require('stone'),this.gameSettings).max;
    const count=this.fog?.enabled?[...this.mapMemory.objects.values()].filter(entry=>entry.kind==='resource'&&entry.type==='stone').length:this.resourceCount('stone');
    const text=this.fog?.enabled?t('hud.worldKnownStones',{columns:COLUMNS,rows:ROWS,count}):t('hud.worldStones',{columns:COLUMNS,rows:ROWS,count,capacity});
    const output=document.querySelector('#world-stones');if(output.textContent!==text)output.textContent=text;
  }
  // The fog module's shared English sight message is translated here, at display.
  setStatus(message) { document.querySelector('#status').textContent=message===OUTSIDE_SIGHT?t('status.outsideSight'):message; }
  // m-hlasky-udalosti (45): the camera glides to what an event is about (a live object's current place, a building's
  // centre or a point) and a golden ring marks it. A target that no longer exists keeps its last known place.
  focusOn(target){
    let p=typeof target==='function'?target():target;if(!p)return false;
    if(p.position&&Number.isFinite(p.position.x))p={x:p.position.x,y:p.position.y};
    else if(Array.isArray(p.tiles)&&p.tiles.length){const xs=p.tiles.map(t=>t.x),ys=p.tiles.map(t=>t.y);p={x:(Math.min(...xs)+Math.max(...xs)+1)/2,y:(Math.min(...ys)+Math.max(...ys)+1)/2};}
    else if(p.tile&&!Number.isFinite(p.x))p={x:p.tile.x+.5,y:p.tile.y+.5};
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
    const w=gridToWorld(p.x,p.y);if(this.worldCamera){this.worldCamera.following=false;this.worldCamera.panTarget=clampMapCenter(w.x,w.y);}else this.cameras.main.centerOn(w.x,w.y);this.dangerMarks?.ping(p);return true;
  }
  onUnitDeath(unit,killer=null){
    if(unit===this.character){this.finishGame();return;}
    if(this.workerSystem.workers.has(unit.id)){
      // m-hlasky-udalosti (41): every death has a cause; a danger mark where it happened (54).
      const by=killer?(killer.definition?.id??killer.type??null):null,cause=by&&/^[a-z_]{1,40}$/.test(by)?`killed:${by}`:'wounds';unit.deathCause=cause;
      if(unit.isSubject!==false)this.workerSystem.recordDeath(unit,cause);this.dangerMarks?.mark(unit.position);this.workerSystem.onDeath(unit);return;}
    const tile={x:Math.floor(unit.position.x),y:Math.floor(unit.position.y)},amount=Math.round(unit.definition.gameplay.meatDrop*devProduction('hunter'));
    if(killer){const event={type:'animalKilled',objectType:unit.type,quantity:1,objectId:unit.id};if(!this.workplaceSystem?.deferReward(killer,event))this.activities.emit(event.type,{...event,actor:killer});}
    this.mountSystem.onDeath(unit);this.animalSystem.remove(unit);this.combatFeedback.remove(unit.id);
    const drop=amount>0?this.dropSystem.create('meat',tile,amount):null;this.workerSystem.ai.animalDied(unit,killer,drop);
    if(amount>0)this.foodSystem.recordProduction('meat',amount,`meat-${unit.id}`);
    if(this.huntingSystem.target===unit)this.huntingSystem.cancel();
    if(amount>0)this.setStatus(t('status.hunted',{name:unit.definition.name,meat:this.objectRegistry.require('meat').name,count:amount}));
  }
  finishGame(){
    if(this.gameOver)return;
    this.gameOver=true;this.gameTime.setPaused(true);this.huntingSystem.cancel();this.mountSystem.cancel();this.treasureSystem.cancelRequest();this.cancelBuilding(t('status.kingFell'));
    this.character.stopForBuilding();this.character.nextTile=null;this.character.walking=false;this.character.state=PLAYER_STATE.DEAD;
    for(const attacker of [...this.combat.attacks.keys()])this.combat.stopAttack(attacker);
    this.assetGallery.close();this.equipmentPanel.close();this.treasurePanel.close();this.settingsPanel.setOpen(false);this.input.enabled=false;this.input.keyboard.enabled=false;
    this.unitPanel.close();
    for(const key of Object.values(this.worldCamera.keys))key.reset();
    this.tweens.pauseAll();this.combatFeedback.refresh();this.gameOverDialog.showModal();
    document.querySelector('#restart-game').focus();
  }
  updateMountUI(){
    document.querySelector('#dismount').hidden=!this.character.mountedHorse;
    const text=this.fog.enabled?t('hud.sight',{count:this.fog.radius}):t('hud.fogOff');
    const output=document.querySelector('#vision-status');if(output.textContent!==text)output.textContent=text;
  }
  update(_time,delta) {
    // #60: while catching up after a hidden tab, every frame runs a batch of simulation steps and draws once.
    if(this.background?.running&&!this.visibilityPaused){this.background.step();this.activeFramePending=true;this.updateTimeDisplay();this.updateFoodDisplay();this.refreshVisibility();return;}
    if(this.gameOver||this.gameTime.paused||this.visibilityPaused)return;
    // Phaser delta je vyhlazené a při pomalých snímcích ořezané. Herní čas,
    // pohyb i DPS používají skutečné aktivní milisekundy mezi snímky.
    const raw=this.game.loop.rawDelta;
    delta=this.activeFramePending?0:Number.isFinite(raw)?Math.max(0,raw):Math.max(0,delta);
    this.activeFramePending=false;
    // Autosave counts only these active, visible, unpaused milliseconds.
    this.registry.get('application')?.autosave?.update(delta);
    // První snímek po Load/Resume pouze obnoví obraz. Nulový čas nesmí
    // změnit uloženou animaci, rozpracovanou AI ani příkazy jednotek.
    if(!delta){this.refreshVisibility();return;}
    // Day and night N1: Skip to dawn runs faster (×8 steps); a fight stops it.
    // E2: the player's pause stops the simulation (the map stays usable); 2× and 3× repeat the same steps per frame.
    // m-noc-zrychleni (82): the night speed-up now raises the game speed itself (indicator 3 with a moon, back at dawn).
    this.nightSpeedUp?.update();const steps=this.dayNight.speed(1),speed=this.playerPaused?0:(this.gameSpeed??1);let activeDelta=0;
    for(let g=0;g<speed;g++)for(let i=0;i<steps;i++){const step=this.simulationStep(delta);if(step===null)return;activeDelta+=step;if(i&&!this.dayNight.isNight())break;}
    this.updateTimeDisplay();this.nightControls?.update();this.nightOverlay?.update(delta);this.fuelIcons?.update();this.fireViews?.update(delta);this.fishShadows?.update(delta);if(this.terrain?.groundStyle==='continuous')this.riverLife?.update(delta);else this.riverLife?.graphics.clear();this.kingdomOverview?.update();this.armyPanel?.update();this.helpArrow?.update();this.tutorial?.update();this.royalGoalsPanel?.update();this.completionFlash?.update(delta);this.dangerMarks?.update(delta);
    this.updateFoodDisplay();this.worldCamera.update(delta);this.refreshVisibility();this.lightSources.update(delta);
    if(this.buildMode&&!document.querySelector('dialog[open]')){if(this.previewTracking)this.previewAnchor=this.pointerTile(this.input.activePointer);this.updateBuildingPreview();}
  }
  // #60: one step of the authoritative simulation, shared by normal frames and the background catch-up. Drawing and
  // the HUD are refreshed by the caller. Returns the active game time, or null when the King fell during the step.
  worldFingerprint(){
    const parts=[this.terrainGrid.map(r=>r.join('')).join('|'),this.groundGrid.map(r=>r.join('')).join('|'),[...this.bushes].sort().join(';'),
      [...this.resources.values()].map(v=>{const o=v.getData('object');return `${v.getData('objectId')}@${o?.tile?.x??o?.x},${o?.tile?.y??o?.y}`;}).sort().join(';'),
      [...this.animalSystem.animals.values()].map(a=>`${a.type??a.definition?.id}@${a.tile.x},${a.tile.y}`).sort().join(';'),
      [...(this.treasureSystem?.chests.values()??[])].map(c=>`${c.tile?.x??c.x},${c.tile?.y??c.y}:${c.contents?.gold??''}`).sort().join(';'),
      exportNatureGroups(this.natureGroups).map(g=>g.join(':')).join(';')];
    const fnv=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');};
    return {hash:fnv(parts.join('#')),parts:Object.fromEntries(['terrain','ground','bushes','resources','animals','chests','natureGroups'].map((k,i)=>[k,fnv(parts[i])])),counts:{resources:this.resources.size,animals:this.animalSystem.animals.size,chests:this.treasureSystem?.chests.size??0,bushes:this.bushes.size,natureGroups:this.natureGroups?.length??0}};
  }
  // Sight and the explored-map memory between catch-up steps (normal frames do this in refreshVisibility).
  observeWorld(){captureMapKnowledge(this);}
  simulationStep(delta){
    // Časové úseky uzavírají mzdy před novou prací, změnou skillu nebo úmrtím tohoto snímku.
    const activeDelta=this.gameTime.update(delta);this.millSails?.update(activeDelta);
    this.character.update(delta);this.naturalResources.updateKing(delta);this.player.animate(delta,this.character.walking&&[PLAYER_STATE.GROUND,PLAYER_STATE.ON_WALL].includes(this.character.state),this.character.direction);
    this.kingLogistics.update(delta);
    this.logisticsTasks.update();
    this.animalSystem.update(delta);this.huntingSystem.update(delta);this.mountSystem.update(delta);this.workerSystem.update(delta);this.naturalResources.mining.updateDepletion();const covered=this.combat.update(delta);
    if(this.gameOver)return null;
    this.constructionSystem.update(delta);this.demolition.update(delta);
    this.farmingSystem.update(delta);
    this.foodProduction.update(delta);this.military.update(delta);this.vehicles.update();this.stables.update(delta);this.caravans.update(delta);this.trade.update();this.caravanViews.update();this.vehicleViews.update();this.employment.update();this.diagnostics.update();
    this.regeneration.update(delta,[this.character,...this.animalSystem.animals.values(),...this.workerSystem.liveWorkers()],covered);
    this.combatFeedback.update(activeDelta);this.foodSystem.update(activeDelta);
    this.experienceFeedback.update(activeDelta);
    for(const spawner of this.resourceSpawners)spawner.update(activeDelta);
    this.wildlifeRespawn.update(activeDelta);
    this.domestic?.update(activeDelta);
    this.childrenSystem?.update(activeDelta);
    this.porches?.update(activeDelta);
    this.royalGoals?.update(activeDelta);this.lightFuel?.update();
    this.nightThreats?.update(activeDelta);
    this.noticeRemaining=Math.max(0,this.noticeRemaining-activeDelta);if(!this.noticeRemaining)document.querySelector('#day-notice').hidden=true;
    return activeDelta;
  }
  refreshVisibility(){
    if(this.inventoryRevision!==this.foodStorage.revision){this.inventoryRevision=this.foodStorage.revision;this.updateInventory();}
    document.querySelector('#path-wear-info').hidden=!this.settingsPanel.settings.pathWearDebug;
    captureMapKnowledge(this);this.updateMountUI();this.updateWorldCount();this.domesticViews?.update(16);this.childViews?.update(16);this.issueIcons?.update();this.materialPiles?.update();
    this.terrain.update(this.cameras.main,this.fog,this.mapMemory);this.fogEdge?.update(this.cameras.main,this.fog);
    const view=this.cameras.main.worldView;
    this.legacyStockpiles?.update(view,this.fog);
    this.memoryRenderer.update(view);
    this.player.setCargo?.(this.character.cargo);for(const worker of this.workerSystem?.liveWorkers()??[])worker.view.setCargo?.(worker.cargo);
    this.kingCargoControl?.refresh();const cargoStatus=document.querySelector('#king-cargo-status');cargoStatus.hidden=!this.character.cargo&&!this.kingLogistics.task;
    const cargoText=`${cargoLabel(this,this.character)} · ${transportLabel(this,this.character)}`;if(cargoStatus.textContent!==cargoText){cargoStatus.textContent=cargoText;cargoStatus.title=cargoText;}
    this.dropSystem.update(view,this.fog);
    // Off the map (the pointer over a menu, a dialog or a panel): a map building tooltip is not shown or started.
    // performance-2: with the pointer still, the hover is looked up eight times a second (it moves with the pointer at once).
    if(this.input.manager.isOver){const p=this.input.activePointer,now=performance.now();if(p.x!==this.hoverX||p.y!==this.hoverY||now-(this.hoverAt??0)>=120)this.updateHover(p);}else if(this.storePreview?.key?.startsWith?.('building:'))this.storePreview.hoverBuilding(null);
    for(const animal of this.animalSystem.animals.values()){const seen=this.fog.isVisibleObject(animal),tracked=!seen&&animal.isAlive&&animal.definition.gameplay?.huntable&&this.domestic?.tracked(animal);animal.view.setAlpha?.(seen?1:.35);animal.view.setVisible(!animal.mounted&&!['ridden','harnessed'].includes(this.stables?.horses.get(animal.id)?.state)&&(seen||tracked)&&animal.view.x>view.x-60&&animal.view.x<view.right+60&&animal.view.y>view.y-40&&animal.view.y<view.bottom+70);}
    for(const worker of this.workerSystem?.liveWorkers()??[])worker.view.setVisible(worker.sleepingIn==null&&this.fog.isVisibleObject(worker)&&worker.view.x>view.x-40&&worker.view.x<view.right+40&&worker.view.y>view.y-20&&worker.view.y<view.bottom+60);
    for(const resource of this.resources.values()){
      const definition=this.objectRegistry.require(resource.getData('objectId'));
      resource.setVisible(this.fog.isVisibleObject(resource.getData('object'))&&resource.x>view.x-64&&resource.x<view.right+64&&resource.y>view.y-40&&resource.y<view.bottom+(definition.visualHeight??40));
    }
    // m-vytezeny-dul-ctverecky (63): footprint squares of finished buildings only while placing or for the selected one.
    const selectedIds=selectedBuildingIds(this);
    for(const building of this.buildings){const visual=this.towerViews.get(building.id),shown=this.fog.isVisibleObject(building)&&visual.inView(view);visual.setVisible(shown);
      if(shown&&buildingIsComplete(building))applyFootprint(visual,footprintShown({selected:selectedIds.has(building.id),buildMode:!!this.buildMode}));}
    this.player.setVisible(this.player.x>view.x-40&&this.player.x<view.right+40&&this.player.y>view.y-20&&this.player.y<view.bottom+70);
    this.combatFeedback?.refresh();
    this.experienceFeedback?.refreshVisibility();this.unitPanel?.refresh();
    this.rockMiningTool?.refresh();this.populationSidebar?.update();this.unitSelection?.draw();this.minimap?.update();this.eventFeed?.update();this.kingdomHappiness?.update();
    this.economyPanel?.update();
    this.workplacePanel?.refresh();this.farmConnections?.refresh();
    this.staffingIndicators?.update();
    this.naturalResources?.refreshSeason();this.seasonTransition?.update();this.seasonTransition?.flush();this.naturalResourcePanel?.refresh();
    this.constructionUI?.refresh();
    this.farmingPanel?.refresh();
    this.storagePanel?.refresh();this.demolitionUI?.refresh();
    this.foodEconomyPanel?.refresh();
    this.treasureSystem?.update(view,this.fog);if(this.equipmentPanel?.dialog.open)this.equipmentPanel.updateStats();
  }
}
