import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { HeatingSystem } from '../src/systems/HeatingSystem.js';
import { HEATING } from '../src/data/heating.js';
import { SEASON_DAYS } from '../src/data/seasons.js';
import { DAILY_REST } from '../src/data/needs.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-topeni-domu (plan 37): Houses burn Wood in autumn and winter; warm = Happiness bonus, cold = penalty and poor rest.
const scene=(starter=true)=>{const s=workerScene(undefined,{logistics:true,seasons:true,ledger:true,starter});s.workerSystem.unsubscribe?.();s.heating=new HeatingSystem(s);return s;};
function house(s,x,y){const d=s.objectRegistry.require('house');for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.foodStorage.register(result.building);return result.building;}
const resident=(s,tile={x:40,y:40})=>{const w=s.workerSystem.create(tile);w.arriving=false;w.workState='Idle';return w;};
const winterDay=1+3*SEASON_DAYS,autumnDay=1+2*SEASON_DAYS;
const pile=(s,h,n)=>{s.heating.ensurePile(h);s.foodStorage.locations.get(`heat-${h.id}`).stock=n?{wood:n}:{};};

test('a House burns its day\'s Wood in winter (warm, bonus) and turns cold without it (penalty, settlement rest)',()=>{
  const s=scene(),a=house(s,60,60),b=house(s,66,60),w1=resident(s),w2=resident(s,{x:41,y:40});
  // Put one resident in each House.
  s.needs.assignments=new Map([[w1.id,{kind:'house',buildingId:a.id}],[w2.id,{kind:'house',buildingId:b.id}]]);s.needs.revision++;
  s.seasons.weather='Sunny';pile(s,a,5);pile(s,b,2);
  s.heating.newDay(winterDay);
  assert.equal(s.heating.status.get(a.id),'warm');assert.equal(s.heating.stock(a),5-HEATING.perDay.Winter);
  assert.equal(s.heating.status.get(b.id),'cold','2 Wood is not a winter day');assert.equal(s.heating.stock(b),2,'a cold House burns nothing');
  const homes=s.needs.homes(),warm=s.needs.status(w1,homes),cold=s.needs.status(w2,homes);
  assert.equal(warm.heat,HEATING.warmBonus);assert.equal(cold.heat,-HEATING.coldPenalty);
  assert.equal(warm.happiness-cold.happiness,HEATING.warmBonus+HEATING.coldPenalty);
  // Resting: a cold House recovers like the settlement.
  for(const w of [w1,w2]){w.workState='Resting';s.needs.record(w).rest=10;}
  s.needs.step(s.gameTime.dayDuration/10);
  const r1=s.needs.records.get(w1.id).rest-10,r2=s.needs.records.get(w2.id).rest-10;
  assert.ok(Math.abs(r1/r2-DAILY_REST.recoverPerDay.house/DAILY_REST.recoverPerDay[HEATING.coldRestAs])<.01,`${r1} ${r2}`);
});

test('autumn burns 1 and counts half; frost raises the need; spring burns nothing; an empty House burns nothing; switch off',()=>{
  const s=scene(),h=house(s,60,60),empty=house(s,66,60),w=resident(s);
  s.needs.assignments=new Map([[w.id,{kind:'house',buildingId:h.id}]]);s.needs.revision++;
  pile(s,h,12);pile(s,empty,12);s.seasons.weather='Sunny';
  s.heating.newDay(autumnDay);assert.equal(s.heating.stock(h),11);assert.equal(s.heating.happiness(h),Math.round(HEATING.warmBonus*HEATING.seasonEffect.Autumn));
  assert.equal(s.heating.stock(empty),12,'nobody lives there');
  s.seasons.weather='Frost';s.heating.newDay(winterDay);assert.equal(s.heating.stock(h),11-Math.ceil(3*1.5));
  s.heating.newDay(1);assert.equal(s.heating.status.size,0);assert.equal(s.heating.happiness(h),0);
  s.heating.setEnabled(false);s.heating.newDay(winterDay);assert.equal(s.heating.status.size,0);assert.deepEqual(s.heating.candidates(),[]);
});

test('Haulers fill woodpiles only in autumn and winter; the state saves and loads',()=>{
  const s=scene(),h=house(s,60,60),w=resident(s);
  s.needs.assignments=new Map([[w.id,{kind:'house',buildingId:h.id}]]);s.needs.revision++;
  const store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l)&&l.allowed.includes('wood'));store.stock.wood=(store.stock.wood??0)+50;
  s.gameTime.day=1;assert.deepEqual(s.heating.candidates(),[]);
  s.gameTime.day=autumnDay;const list=s.heating.candidates();assert.equal(list.length,1);assert.equal(list[0].destinationId,`heat-${h.id}`);assert.equal(list[0].amount,HEATING.capacity);
  s.gameTime.day=1;pile(s,h,4);s.heating.newDay(winterDay);assert.equal(s.heating.status.get(h.id),'warm');
  const saved=validateGameState(serializeGameState(s));assert.deepEqual(saved.heating.warm,[h.id]);
  const r=scene(false);loadGameState(r,structuredClone(saved));assert.equal(r.heating.status.get(h.id),'warm');assert.equal(r.heating.stock(h),1);
  assert.deepEqual(validateGameState(serializeGameState(r)),saved);
  assert.throws(()=>validateGameState({...saved,heating:{...saved.heating,warm:[999999]}}));
});
