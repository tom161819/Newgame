import { objectRegistry } from '../../src/systems/ObjectRegistry.js';
import { Inventory } from '../../src/game/inventory.js';
import { PlayerController } from '../../src/game/PlayerController.js';
import { AnimalSystem } from '../../src/systems/AnimalSystem.js';
import { DropSystem } from '../../src/systems/DropSystem.js';
import { TreasureSystem } from '../../src/systems/TreasureSystem.js';
import { EquipmentSystem } from '../../src/systems/EquipmentSystem.js';
import { GameTimeSystem } from '../../src/systems/GameTimeSystem.js';
import { ProductionSystem } from '../../src/systems/ProductionSystem.js';
import { FoodSystem } from '../../src/systems/FoodSystem.js';
import { CombatSystem } from '../../src/systems/CombatSystem.js';
import { RegenerationSystem } from '../../src/systems/RegenerationSystem.js';
import { PathWearSystem } from '../../src/systems/PathWearSystem.js';
import { ExperienceSystem } from '../../src/systems/ExperienceSystem.js';
import { GameActivityBus } from '../../src/systems/GameActivityBus.js';
import { SkillSystem } from '../../src/systems/SkillSystem.js';
import { WageSystem } from '../../src/systems/WageSystem.js';
import { WorkplaceSystem } from '../../src/systems/WorkplaceSystem.js';
import { ConstructionSystem } from '../../src/systems/ConstructionSystem.js';
import { WildlifeRespawnSystem } from '../../src/systems/WildlifeRespawnSystem.js';
import { FarmingSystem } from '../../src/systems/FarmingSystem.js';
import { FoodStorageSystem } from '../../src/systems/FoodStorageSystem.js';
import { FoodProductionSystem } from '../../src/systems/FoodProductionSystem.js';
import { SeasonSystem } from '../../src/systems/SeasonSystem.js';
import { KingdomAttractivenessSystem } from '../../src/systems/KingdomAttractivenessSystem.js';
import { KingLogisticsSystem } from '../../src/systems/KingLogisticsSystem.js';
import { createStartingStockpile,createStartingCastle } from '../../src/systems/WorldGenerationConfig.js';
import { WorkerSystem } from '../../src/systems/WorkerSystem.js';
import { ResourceSpawner } from '../../src/game/stones.js';
import { tileCenter } from '../../src/game/isometric.js';
import { wallIndex,connectionsFor } from '../../src/game/walls.js';

export function workerScene(terrain=Array.from({length:100},()=>Array(100).fill(0)),{randomizeTalents=false,workplaces=false,construction=false,farming=false,foodProduction=false,seasons=false,logistics=false,starter=true,gameSettings}={}){
  const scene={objectRegistry,gameSettings,terrainGrid:terrain.map(r=>[...r]),map:terrain.map(r=>[...r]),inventory:new Inventory(),gameOver:false,
    resources:new Map(),resourceOccupancy:new Map(),buildings:[],towerViews:new Map(),animations:[],
    marker:{visible:false,setVisible(v){this.visible=v;}},showMarker(){this.marker.visible=true;},setStatus(){},updateBuildingUI(){},updateInventory(){},updateTimeDisplay(){},refreshVisibility(){},
    reservedTiles(){return [...this.character.reservedTiles(),...this.animalSystem.reservedTiles(),...(this.workerSystem?.reservedTiles()??[]),...(this.foodStorage?.reservedTiles()??[]),...this.buildings.flatMap(b=>b.tiles??[])];},
    huntingSystem:{target:null,repath:0},mountSystem:{target:null,repath:0},combatFeedback:{hit(){},remove(){}},
    settingsPanel:{settings:{fogOfWar:false,pathWearDebug:false},applySettings(d){this.settings={...d};}},fog:{setEnabled(){}},worldCamera:{following:false},
    cameras:{main:{zoom:1,scrollX:2500,scrollY:1300,width:1000,height:640,setZoom(z){this.zoom=z;return this;},centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;return this;},preRender(){}}},
    refreshWallConnections(){this.wallMap=wallIndex(this.buildings);for(const b of this.wallMap.values())b.connections=connectionsFor(this.wallMap,b);},
  };
  function view(type,p){const data={objectId:type,definition:objectRegistry.require(type)};return {...p,scene,visible:true,depth:p.y,
    setData(k,v){data[k]=v;return this;},getData(k){return data[k];},setVisible(v){this.visible=v;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(d){this.depth=d;return this;},
    animate(){},setMounted(){},setOpened(){},destroy(){this.scene=null;}};}
  scene.assets={createView:view};scene.createBuildingView=(d,b)=>{scene.workplaceSystem?.register(b);scene.farmingSystem?.register(b);scene.foodStorage?.register(b);scene.foodProduction?.register(b);return view(d.id,tileCenter(b));};
  scene.tweens={add(config){const t={...config,elapsed:0};scene.animations.push(t);return t;}};
  scene.player=view('king',tileCenter({x:40,y:40}));scene.character=new PlayerController(scene,scene.player,{x:40,y:40});
  scene.gameTime=new GameTimeSystem((gameSettings?.dayLengthSeconds??120)*1000);scene.activities=new GameActivityBus();scene.experienceSystem=new ExperienceSystem(scene.activities);scene.skillSystem=new SkillSystem(scene);scene.skillSystem.initialize(scene.character);
  if(seasons)scene.seasons=new SeasonSystem(scene.gameTime);
  scene.pathWear=new PathWearSystem({map:scene.map,terrain:scene.terrainGrid,time:scene.gameTime});scene.regeneration=new RegenerationSystem();
  scene.equipment=new EquipmentSystem(scene.character,objectRegistry,scene.inventory);scene.combat=new CombatSystem({map:scene.map,regenerationRate:u=>scene.regeneration.rateFor(u)});scene.skillSystem.attachCombat(scene.combat);
  scene.animalSystem=new AnimalSystem(scene);scene.dropSystem=new DropSystem(scene);scene.treasureSystem=new TreasureSystem(scene);scene.workerSystem=new WorkerSystem(scene);
  scene.wildlifeRespawn=new WildlifeRespawnSystem(scene,scene.animalSystem);
  if(!randomizeTalents){const create=scene.workerSystem.create.bind(scene.workerSystem);scene.workerSystem.create=(tile,options={})=>{const w=create(tile,{...options,randomize:false});w.naturalTalent='woodcutting';w.initialSkills=structuredClone(w.skills);return w;};}
  scene.foodSystem=new FoodSystem(scene.inventory,objectRegistry.require('meat'),()=>{},{time:scene.gameTime,scene,subscribe:seasons});scene.production=new ProductionSystem(scene.gameTime,scene.inventory,()=>scene.buildings);scene.wageSystem=new WageSystem(scene);
  if(seasons)scene.attractiveness=new KingdomAttractivenessSystem(scene);
  if(workplaces||construction||farming||foodProduction||logistics)scene.workplaceSystem=new WorkplaceSystem(scene);
  if(construction)scene.constructionSystem=new ConstructionSystem(scene,{onComplete:b=>{scene.towerViews.set(b.id,scene.createBuildingView(b.definition,b));scene.refreshWallConnections();},onCancel:b=>{scene.towerViews.delete(b.id);scene.refreshWallConnections();}});
  if(logistics&&starter){if(scene.gameSettings?.startingCastle)createStartingCastle(scene,scene.character.tile);createStartingStockpile(scene,scene.character.tile);}
  if(foodProduction||logistics){scene.foodStorage=new FoodStorageSystem(scene,{physicalMaterials:logistics});scene.foodProduction=new FoodProductionSystem(scene);if(logistics)scene.kingLogistics=new KingLogisticsSystem(scene);}
  if(farming||foodProduction||logistics)scene.farmingSystem=new FarmingSystem(scene,{growthModifier:()=>scene.seasons?.growthMultiplier()??1,onHarvest:foodProduction||logistics?result=>scene.foodProduction.harvest(result):null});
  scene.addResource=(d,tile)=>{const v=view(d.id,tileCenter(tile)),key=`${tile.x},${tile.y}`;v.setData('tile',{...tile}).setData('object',{type:d.id,definition:d,x:tile.x,y:tile.y,tiles:[{...tile}]});scene.resources.set(key,v);scene.resourceOccupancy.set(key,key);};
  scene.collectResource=(key,tile,actor)=>{const v=scene.resources.get(key);if(!v||key!==`${tile.x},${tile.y}`||actor.state!=='ground')return false;
    const type=v.getData('objectId');if(actor===scene.character&&scene.foodStorage?.manages(type)&&scene.kingLogistics?.room(type)<1)return false;scene.resources.delete(key);v.destroy();scene.dropSystem.refreshOccupancy(tile);const event={type:'resourceCollected',objectType:type,quantity:1};if(actor===scene.character&&scene.kingLogistics&&scene.foodStorage.manages(type))scene.kingLogistics.receive({resource:type,amount:1,event});else if(!scene.workplaceSystem?.carryCollection(actor,{resource:type,amount:1,event})){scene.inventory.add(type);scene.activities.emit(event.type,{...event,actor});}return true;};
  scene.collectStone=tile=>scene.collectResource(`${tile.x},${tile.y}`,tile,scene.character);
  scene.resourceSpawners=[new ResourceSpawner({map:scene.map,resources:scene.resourceOccupancy,getCount:()=>scene.resources.size,getOrigins:()=>[scene.character.tile],getReserved:()=>scene.reservedTiles(),spawn:t=>scene.addResource(objectRegistry.require('stone'),t)})];
  scene.combat.on('attack',(a,t)=>{if(scene.animalSystem.animals.has(t.id))scene.animalSystem.onAttacked(t,a);});
  scene.combat.on('attack',(a,t)=>{if(scene.workerSystem.workers.has(t.id)&&t.profession==='soldier'&&scene.workplaceSystem)scene.combat.startAttack(t,a);});
  scene.combat.on('damage',(t,damage,a)=>scene.skillSystem.creditDamage(a,t,damage));
  scene.combat.on('death',(target,killer)=>{
    if(scene.workerSystem.workers.has(target.id)){scene.workerSystem.onDeath(target);return;}
    if(!scene.animalSystem.animals.has(target.id))return;
    const tile={x:Math.floor(target.position.x),y:Math.floor(target.position.y)};if(killer){const event={type:'animalKilled',objectType:target.type,quantity:1};if(!scene.workplaceSystem?.deferReward(killer,event))scene.activities.emit(event.type,{...event,actor:killer});}
    scene.animalSystem.remove(target);const amount=target.definition.gameplay.meatDrop,drop=amount>0?scene.dropSystem.create('meat',tile,amount):null;if(amount>0)scene.foodSystem.recordProduction('meat',amount,`meat-${target.id}`);scene.workerSystem.ai.animalDied(target,killer,drop);
  });
  scene.tick=delta=>{if(scene.gameTime.paused||scene.gameOver)return;scene.gameTime.update(delta);if(scene.constructionSystem)scene.character.update(delta);scene.kingLogistics?.update(delta);scene.animalSystem.update(delta);scene.workerSystem.update(delta);const covered=scene.combat.update(delta);scene.constructionSystem?.update(delta);scene.farmingSystem?.update(delta);scene.foodProduction?.update(delta);scene.regeneration.update(delta,[scene.character,...scene.animalSystem.animals.values(),...scene.workerSystem.liveWorkers()],covered);};
  scene.simulate=(ms,step=50)=>{let elapsed=0;while(elapsed<ms){const delta=Math.min(step,ms-elapsed);scene.tick(delta);elapsed+=delta;}};
  return scene;
}
