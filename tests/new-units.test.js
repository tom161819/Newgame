import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { UNIT_TYPES,UNIT_TYPE_IDS,unitKit,RECRUIT } from '../src/data/military.js';
import { totalXPForLevel,getXPRequired } from '../src/data/experience.js';
import { WageSystem } from '../src/systems/WageSystem.js';
import { BASE_DAILY_WAGES } from '../src/data/economy.js';
import { hasLineOfSight } from '../src/game/lineOfSight.js';
import { inAttackRange } from '../src/systems/CombatSystem.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { isRanged } from '../src/systems/CombatSystem.js';
import { MILITARY_ITEMS } from '../src/data/militaryEquipment.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function soldier(s,barracks,tile,combatLevel=1){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(barracks,w),true);assert.equal(w.profession,'soldier');const c=w.skills.combat;Object.assign(c,{level:combatLevel,currentXP:0,totalXP:totalXPForLevel(combatLevel),xpToNextLevel:getXPRequired(combatLevel)});return w;}
function hauler(s,tile){const w=s.workerSystem.create(tile);s.workerSystem.jobs.assign(w,'hauler');return w;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
// A kingdom with an Armory holding items, a Barracks with Soldiers, two Haulers and Gold.
function kingdom(items={sword:4,bow:2,armor:2}){
  const s=scene(),armory=building(s,'armory',60,44),barracks=building(s,'barracks',50,50);
  for(const [id,n]of Object.entries(items))assert.equal(s.foodStorage.deposit(`armory-${armory.id}`,id,n),true);
  hauler(s,{x:56,y:48});hauler(s,{x:57,y:48});s.inventory.add('gold',200);return {s,armory,barracks};
}
const armoryStock=(s,armory)=>s.foodStorage.locations.get(`armory-${armory.id}`).stock;

test('p70: Halberdier, Royal Archer, Crossbowman and Light Cavalry train from their own kit; the Halberdier strikes from 2 tiles as a melee fighter',()=>{
  const {s,barracks,armory}=kingdom({sword:2,halberd:1,armor:2,bow:1,crossbow:1,light_armor:1});
  const h=soldier(s,barracks,{x:50,y:56},9),r=soldier(s,barracks,{x:51,y:56},9),c=soldier(s,barracks,{x:52,y:56},9),k=soldier(s,barracks,{x:53,y:56},9);
  for(const [w,type]of [[h,'halberdier'],[r,'royal_archer'],[c,'crossbowman'],[k,'knight']])assert.equal(s.military.train(w,type),null,type);
  until(s,()=>s.military.units.size===4);
  assert.equal(h.attackRange,2);assert.equal(isRanged(h),false);assert.ok(h.armor>=30);
  assert.equal(r.attackRange,6);assert.equal(isRanged(r),true);assert.ok(r.maxHP>=120&&r.armor>=15,'the Royal Archer has the Swordsman\'s defence');
  assert.equal(c.attackRange,5);assert.equal(c.armor,15);
  assert.equal(k.speed,k.definition?.gameplay?.movementSpeed??k.speed,'the Knight walks');
  assert.deepEqual(Object.keys(MILITARY_ITEMS).filter(id=>['halberd','crossbow','light_armor'].includes(id)).map(id=>MILITARY_ITEMS[id].workshop),['swordsmith','bowyer','armorer']);
  const stock=armoryStock(s,armory);for(const id of ['halberd','crossbow','light_armor'])assert.equal(stock[id]??0,0,id);
  const target={position:{x:h.position.x+2,y:h.position.y},tile:{x:h.tile.x+2,y:h.tile.y}};assert.equal(inAttackRange(h,target,s.map),true);
});

test('p70: the Swordsmith, Bowyer and Armorer switch to Halberds, Crossbows and Light Armor; an older save of the workshop loads on its first recipe',()=>{
  const s=scene(),ids=[];
  for(const [i,[type,second]] of [['swordsmith','halberd'],['bowyer','crossbow'],['armorer','light_armor']].entries()){
    const b=building(s,type,36+i*5,40),d=s.objectRegistry.require(type);ids.push(b.id);
    assert.deepEqual(Object.keys(d.recipes),[Object.keys(d.recipe.output)[0],second]);
    s.foodProduction.register(b);const record=s.foodProduction.records.get(b.id);assert.equal(record.recipe,Object.keys(d.recipes)[0]);
    assert.equal(s.foodProduction.setRecipe(b.id,second),true);
    assert.deepEqual(Object.keys(s.foodProduction.recipe(b).output),[second]);
  }
  const state=serializeGameState(s);for(const r of state.foodProduction.records)if(ids.includes(r.buildingId))delete r.recipe;
  const t=scene(false);loadGameState(t,validateGameState(state));
  for(const id of ids){const b=t.buildings.find(b=>b.id===id);assert.equal(t.foodProduction.records.get(id).recipe,Object.keys(t.objectRegistry.require(b.type).recipes)[0]);}
});
