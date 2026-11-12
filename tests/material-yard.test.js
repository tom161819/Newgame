import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { treeState } from '../src/data/naturalResources.js';
import { LOGISTICS_RULES,YARD_RESOURCES,pileStage,storageResources } from '../src/data/logistics.js';
import { MaterialYardView,MaterialPiles,yardPileStages,producerPileStage } from '../src/game/MaterialPiles.js';

// m-sklady-materialu-koncept (owner requests 21, 49): one Material Yard for wood, stone, iron ore and iron; producers
// drop output on a pile by their building and Haulers take it to the nearest yard.
globalThis.document={querySelector:()=>({textContent:''})};
const fixture=(starter=true)=>{const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;};
function deposit(s,type,tile,remaining){const n={id:`deposit-${s.naturalResources.nextDepositId++}`,kind:'deposit',remaining,max:type==='stone_deposit'?160:60,boundBuildingId:null};s.addResource(s.objectRegistry.require(type),tile,n);return s.naturalResources.byId.get(n.id);}
function building(s,type,anchor){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function person(s,job,home=null){for(let y=46;y<55;y++)for(let x=40;x<45;x++)if(s.map[y][x]===0&&!s.reservedTiles().some(t=>t.x===x&&t.y===y)&&!s.workerSystem.liveWorkers().some(w=>w.tile.x===x&&w.tile.y===y)){const w=s.workerSystem.create({x,y});assert.ok(home?s.workplaceSystem.assign(home,w):s.workerSystem.jobs.assign(w,job));if(job==='hauler')w.stoneCollection={...w.stoneCollection,enabled:false};return w;}throw Error('No free tile');}
function until(s,condition,limit=120000){for(let t=0;t<limit&&!condition();t+=50)s.tick(50);assert.ok(condition(),JSON.stringify(s.workerSystem.liveWorkers().map(w=>({p:w.profession,task:w.workTask?.kind,message:w.workMessage,cargo:w.cargo}))));}
const stock=(s,id,resource)=>s.foodStorage.locations.get(id)?.stock[resource]??0;
const starterId=s=>`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;

test('a 4×2 Material Yard for 20 Wood, without workers, stores only wood, stone, iron ore and iron up to 400; the Warehouse refuses them',()=>{
  const s=fixture(),yard=building(s,'material_yard',{x:60,y:45}),d=yard.definition,id=`yard-${yard.id}`;
  assert.deepEqual([d.width,d.height,d.cost,d.workplace,d.buildingCategory],[4,2,{wood:20},undefined,'logistics']);assert.equal(yard.tiles.length,8);
  assert.deepEqual(s.foodStorage.locations.get(id).allowed,[...YARD_RESOURCES]);assert.equal(s.foodStorage.locations.get(id).capacity,LOGISTICS_RULES.yardCapacity);
  for(const other of ['apple','pitch','torch','sword','bread'])assert.equal(s.foodStorage.deposit(id,other,1),false,other);
  for(const r of YARD_RESOURCES)assert.equal(s.foodStorage.deposit(id,r,100),true,r);assert.equal(s.foodStorage.deposit(id,'wood',1),false,'full at 400 in total');
  const warehouse=storageResources(s.objectRegistry.require('warehouse'),s.objectRegistry);for(const r of YARD_RESOURCES)assert.equal(warehouse.includes(r),false,r);assert.ok(warehouse.includes('pitch')&&warehouse.includes('torch'));
  const starter=storageResources(s.objectRegistry.require('starter_stockpile'),s.objectRegistry);for(const r of YARD_RESOURCES)assert.ok(starter.includes(r),`the Starter Stockpile still keeps ${r}`);
  validateGameState(serializeGameState(s));
});
test('an Iron Mine fills its output pile; a Hauler carries the ore to the Material Yard ahead of the Starter Stockpile',()=>{
  const s=fixture();deposit(s,'iron_deposit',{x:51,y:44},3);const mine=building(s,'iron_mine',{x:50,y:43}),yard=building(s,'material_yard',{x:56,y:50}),pile=`pile-${mine.id}`;
  assert.deepEqual(s.foodStorage.locations.get(pile),{...s.foodStorage.locations.get(pile),kind:'pile',capacity:LOGISTICS_RULES.outputPileCapacity,allowed:['iron_ore']});
  const miner=person(s,'miner',mine);until(s,()=>miner.workTask?.kind==='mineDeposit');assert.equal(miner.workTask.destinationId,pile,'the miner never walks to a store');
  until(s,()=>stock(s,pile,'iron_ore')===1);assert.equal(s.inventory.count('iron_ore'),0,'a pile is not a store');
  const h=person(s,'hauler');until(s,()=>stock(s,`yard-${yard.id}`,'iron_ore')===3);assert.equal(stock(s,starterId(s),'iron_ore'),0);assert.equal(stock(s,pile,'iron_ore'),0);
  assert.equal(s.inventory.count('iron_ore'),3);assert.ok(h.skills.logistics.totalXP>0);assert.equal(s.workplaceSystem.records.get(mine.id).delivered.iron_ore,3);assert.equal(s.foodStorage.reservations.size,0);validateGameState(serializeGameState(s));
});
test('a full Quarry pile stops mining ("Output pile full"), survives Save/Load, and without a yard Haulers empty it into the Starter Stockpile',()=>{
  const s=fixture(),rock=deposit(s,'stone_deposit',{x:49,y:44},80),quarry=building(s,'quarry',{x:47,y:43}),pile=`pile-${quarry.id}`,miner=person(s,'miner',quarry);s.foodProduction.carryOwnOutput=()=>false;/* m-pracovnici-odnaseji-vyrobky: here as if no store had room */
  s.foodStorage.deposit(pile,'stone',LOGISTICS_RULES.outputPileCapacity);s.simulate(20000);assert.equal(rock.natural.remaining,80);assert.equal(miner.workTask,null);assert.equal(miner.workMessage,'Output pile full');
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.saveVersion,SAVE_VERSION);const r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);assert.equal(stock(r,pile,'stone'),LOGISTICS_RULES.outputPileCapacity);
  const before=stock(r,starterId(r),'stone');person(r,'hauler');until(r,()=>r.naturalResources.byId.get(rock.natural.id).natural.remaining<80&&stock(r,starterId(r),'stone')>=before+LOGISTICS_RULES.outputPileCapacity);validateGameState(serializeGameState(r));
});
test('a Lumberjack Hut drops timber on its own pile instead of walking to a store',()=>{
  const s=fixture(),d=s.objectRegistry.require('oak_tree');s.addResource(d,{x:49,y:45},treeState(`tree-${s.naturalResources.nextId++}`,{ageDays:8}));
  const hut=building(s,'lumberjack_hut',{x:44,y:43}),pile=`pile-${hut.id}`,w=person(s,'woodcutter',hut);until(s,()=>w.workTask?.kind==='chopTree'||w.workTask?.kind==='foodPickup');assert.equal(w.workTask.destinationId,pile);
  until(s,()=>stock(s,pile,'wood')===d.tree.wood);assert.equal(s.inventory.count('wood'),0);validateGameState(serializeGameState(s));
});
test('pile sizes follow the amounts: empty and four sizes; views change texture only when a size changes',()=>{
  assert.deepEqual([0,1,25,26,50,51,75,76,100,400].map(n=>pileStage(n,100)),[0,1,1,2,2,3,3,4,4,4]);
  assert.deepEqual(yardPileStages({capacity:400,stock:{wood:100,stone:30,iron:1}}),{wood:4,stone:2,iron_ore:0,iron:1});
  assert.deepEqual([0,5,6,10,20].map(n=>producerPileStage({capacity:20,stock:{stone:n}})),[0,1,2,2,4]);
  const s=fixture(),textures=new Set(),images=[],sets=[];
  const image=()=>{const i={x:0,y:0,setTexture(k){sets.push(k);this.texture=k;return this;},destroy(){this.destroyed=true;}};for(const m of ['setOrigin','setDepth','setAlpha','setVisible','setTint','setScale'])i[m]=()=>i;i.setPosition=(x,y)=>{i.x=x;i.y=y;return i;};images.push(i);return i;};
  const g=new Proxy({},{get:(_,k)=>k==='generateTexture'?key=>textures.add(key):()=>{}});
  Object.assign(s,{add:{image:(x,y,k)=>image().setPosition(x,y).setTexture(k)},make:{graphics:()=>g},textures:{exists:k=>textures.has(k)}});
  const yard=building(s,'material_yard',{x:60,y:45}),view=new MaterialYardView(s,yard);s.towerViews.set(yard.id,view);
  deposit(s,'stone_deposit',{x:49,y:44},80);const quarry=building(s,'quarry',{x:47,y:43});
  const piles=new MaterialPiles(s),id=`yard-${yard.id}`;piles.update();assert.deepEqual(view.stages,{wood:0,stone:0,iron_ore:0,iron:0});
  sets.length=0;s.foodStorage.deposit(id,'wood',10);piles.update();assert.equal(view.stages.wood,1);assert.deepEqual(sets,['material-pile:wood:1']);
  sets.length=0;s.foodStorage.deposit(id,'wood',5);piles.update();piles.update();assert.deepEqual(sets,[],'same size, no redraw');
  s.foodStorage.deposit(id,'wood',85);s.foodStorage.deposit(id,'stone',60);piles.update();assert.deepEqual([view.stages.wood,view.stages.stone],[4,3]);
  s.foodStorage.deposit(`pile-${quarry.id}`,'stone',20);sets.length=0;piles.update();assert.deepEqual(sets,['material-pile:stone:4']);assert.equal(piles.images.size,1);
  for(const key of ['material-pile:wood:4','material-pile:stone:3','material-pile:stone:4'])assert.ok(textures.has(key),key);
  s.foodStorage.removeBuilding(quarry);s.buildings.splice(s.buildings.indexOf(quarry),1);piles.update();assert.equal(piles.images.size,0);
});
