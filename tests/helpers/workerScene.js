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
import { WorkerSystem } from '../../src/systems/WorkerSystem.js';
import { ResourceSpawner } from '../../src/game/stones.js';
import { tileCenter } from '../../src/game/isometric.js';
import { wallIndex,connectionsFor } from '../../src/game/walls.js';

export function workerScene(terrain=Array.from({length:100},()=>Array(100).fill(0))){
  const scene={objectRegistry,terrainGrid:terrain.map(r=>[...r]),map:terrain.map(r=>[...r]),inventory:new Inventory(),gameOver:false,
    resources:new Map(),resourceOccupancy:new Map(),buildings:[],towerViews:new Map(),animations:[],
    marker:{visible:false,setVisible(v){this.visible=v;}},showMarker(){this.marker.visible=true;},setStatus(){},updateBuildingUI(){},updateInventory(){},updateTimeDisplay(){},refreshVisibility(){},
    reservedTiles(){return [...this.character.reservedTiles(),...this.animalSystem.reservedTiles(),...(this.workerSystem?.reservedTiles()??[])];},
    huntingSystem:{target:null,repath:0},mountSystem:{target:null,repath:0},combatFeedback:{hit(){},remove(){}},
    settingsPanel:{settings:{fogOfWar:false,pathWearDebug:false},applySettings(d){this.settings={...d};}},fog:{setEnabled(){}},worldCamera:{following:false},
    cameras:{main:{zoom:1,scrollX:2500,scrollY:1300,width:1000,height:640,setZoom(z){this.zoom=z;return this;},centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;return this;},preRender(){}}},
    refreshWallConnections(){this.wallMap=wallIndex(this.buildings);for(const b of this.wallMap.values())b.connections=connectionsFor(this.wallMap,b);},
  };
  function view(type,p){const data={objectId:type,definition:objectRegistry.require(type)};return {...p,scene,visible:true,depth:p.y,
    setData(k,v){data[k]=v;return this;},getData(k){return data[k];},setVisible(v){this.visible=v;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(d){this.depth=d;return this;},
    animate(){},setMounted(){},setOpened(){},destroy(){this.scene=null;}};}
  scene.assets={createView:view};scene.createBuildingView=(d,b)=>view(d.id,tileCenter(b));
  scene.tweens={add(config){const t={...config,elapsed:0};scene.animations.push(t);return t;}};
  scene.player=view('king',tileCenter({x:40,y:40}));scene.character=new PlayerController(scene,scene.player,{x:40,y:40});
  scene.gameTime=new GameTimeSystem();scene.activities=new GameActivityBus();scene.experienceSystem=new ExperienceSystem(scene.activities);scene.skillSystem=new SkillSystem(scene);scene.skillSystem.initialize(scene.character);
  scene.pathWear=new PathWearSystem({map:scene.map,terrain:scene.terrainGrid,time:scene.gameTime});scene.regeneration=new RegenerationSystem();
  scene.equipment=new EquipmentSystem(scene.character,objectRegistry,scene.inventory);scene.combat=new CombatSystem({map:scene.map,regenerationRate:u=>scene.regeneration.rateFor(u)});scene.skillSystem.attachCombat(scene.combat);
  scene.animalSystem=new AnimalSystem(scene);scene.dropSystem=new DropSystem(scene);scene.treasureSystem=new TreasureSystem(scene);scene.workerSystem=new WorkerSystem(scene);
  scene.foodSystem=new FoodSystem(scene.inventory,objectRegistry.require('meat'));scene.production=new ProductionSystem(scene.gameTime,scene.inventory,()=>scene.buildings);
  scene.addResource=(d,tile)=>{const v=view(d.id,tileCenter(tile)),key=`${tile.x},${tile.y}`;v.setData('tile',{...tile}).setData('object',{type:d.id,definition:d,x:tile.x,y:tile.y,tiles:[{...tile}]});scene.resources.set(key,v);scene.resourceOccupancy.set(key,key);};
  scene.collectResource=(key,tile,actor)=>{const v=scene.resources.get(key);if(!v||key!==`${tile.x},${tile.y}`||actor.state!=='ground')return false;
    const type=v.getData('objectId');scene.resources.delete(key);v.destroy();scene.dropSystem.refreshOccupancy(tile);scene.inventory.add(type);scene.activities.emit('resourceCollected',{actor,objectType:type});return true;};
  scene.resourceSpawners=[new ResourceSpawner({map:scene.map,resources:scene.resourceOccupancy,getCount:()=>scene.resources.size,getOrigins:()=>[scene.character.tile],getReserved:()=>scene.reservedTiles(),spawn:t=>scene.addResource(objectRegistry.require('stone'),t)})];
  scene.combat.on('attack',(a,t)=>{if(scene.animalSystem.animals.has(t.id))scene.animalSystem.onAttacked(t,a);});
  scene.combat.on('damage',(t,damage,a)=>scene.skillSystem.creditDamage(a,t,damage));
  scene.combat.on('death',(target,killer)=>{
    if(scene.workerSystem.workers.has(target.id)){scene.workerSystem.onDeath(target);return;}
    if(!scene.animalSystem.animals.has(target.id))return;
    const tile={x:Math.floor(target.position.x),y:Math.floor(target.position.y)};if(killer)scene.activities.emit('animalKilled',{actor:killer,objectType:target.type});
    scene.animalSystem.remove(target);const drop=scene.dropSystem.create('meat',tile,target.definition.gameplay.meatDrop);scene.workerSystem.ai.animalDied(target,killer,drop);
  });
  scene.tick=delta=>{scene.animalSystem.update(delta);scene.workerSystem.update(delta);const covered=scene.combat.update(delta);scene.regeneration.update(delta,[scene.character,...scene.animalSystem.animals.values(),...scene.workerSystem.liveWorkers()],covered);scene.gameTime.update(delta);};
  scene.simulate=(ms,step=50)=>{let elapsed=0;while(elapsed<ms){const delta=Math.min(step,ms-elapsed);scene.tick(delta);elapsed+=delta;}};
  return scene;
}
