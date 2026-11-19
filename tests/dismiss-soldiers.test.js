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
import { t } from '../src/i18n/index.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function soldier(s,barracks,tile,combatLevel=1){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(barracks,w),true);assert.equal(w.profession,'soldier');const c=w.skills.combat;Object.assign(c,{level:combatLevel,currentXP:0,totalXP:totalXPForLevel(combatLevel),xpToNextLevel:getXPRequired(combatLevel)});return w;}
function hauler(s,tile){const w=s.workerSystem.create(tile);s.workerSystem.jobs.assign(w,'hauler');return w;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
// A kingdom with an Armory holding items, a Barracks with Soldiers, two Haulers and Gold.
function kingdom(items={sword:4,bow:2,armor:2,light_armor:2}){
  const s=scene(),armory=building(s,'armory',60,44),barracks=building(s,'barracks',50,50);
  for(const [id,n]of Object.entries(items))assert.equal(s.foodStorage.deposit(`armory-${armory.id}`,id,n),true);
  hauler(s,{x:56,y:48});hauler(s,{x:57,y:48});s.inventory.add('gold',200);return {s,armory,barracks};
}

// Owner 19 Nov 2026 (73): dismissed soldiers become ordinary residents and their kit goes back to the store.
test('dismissing soldiers makes them Idle residents, returns their kit and leaves other people alone',()=>{
  const {s,barracks}=kingdom();const a=soldier(s,barracks,{x:52,y:48}),b=soldier(s,barracks,{x:53,y:48}),h=s.workerSystem.liveWorkers().find(w=>w.profession==='hauler');
  assert.ok(s.military.enlist(s.workerSystem.create({x:54,y:48}),'swordsman'));const sw=s.workerSystem.liveWorkers().find(w=>s.military.unit(w)?.type==='swordsman');sw.squad=2;sw.stance='hold';
  const swords=()=>[...s.foodStorage.locations.values()].reduce((n,l)=>n+(l.stock.sword??0),0)+[...s.dropSystem?.drops?.values?.()??[]].filter(d=>d.resource==='sword').reduce((n,d)=>n+d.amount,0);const before=swords();
  assert.equal(s.military.dismiss([a,sw,h]),2);
  for(const w of [a,sw]){assert.equal(w.profession,'idle');assert.equal(s.military.unit(w),null);assert.equal(w.squad,undefined);assert.equal(w.stance,undefined);}
  assert.equal(b.profession,'soldier');assert.equal(h.profession,'hauler');assert.ok(swords()>before,'the sword is back');
  s.tick(1000);assert.equal(a.profession,'idle');validateGameState(serializeGameState(s));
});
