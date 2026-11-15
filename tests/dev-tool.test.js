// m-91-asset-library-dev (owner point 88): the Dev tool — arrival coefficient and forecast, coefficients in the save,
// Reset, quick actions within limits and strict save validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { POPULATION,migrantsPerDay } from '../src/data/jobs.js';
import { DEV_BALANCE_KEYS,DEV_QUICK,devDefault,loadDevBalance,setDevFactor,devFactor,devProduction,resetDevBalance,devBalanceChanged,exportDevBalance,importDevBalance,validDevBalanceState } from '../src/data/devBalance.js';
import { price } from '../src/data/trade.js';
import { arrivalForecast,economyOverview,addDevGold,addDevResources,advanceDevDay,summonDevCaravan,addDevResident,devResourceIds } from '../src/systems/DevTools.js';
import { BackgroundSimulation } from '../src/systems/BackgroundSimulation.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const fresh=()=>loadDevBalance(memory());

// Residents who arrive over `days` new days with the Arrival coefficient (beds and the edge never limit here).
function arrivals(factor,days=12){
  fresh();setDevFactor('immigration',factor);const s=workerScene();s.workerSystem.capacity=()=>1000;
  const before=s.workerSystem.liveSubjects().length;arrivals.start=before;for(let d=2;d<2+days;d++)s.workerSystem.onNewDay(d);
  const n=s.workerSystem.liveSubjects().length-before;s.workerSystem.destroy?.();return n;
}
test('m-91: the Arrival coefficient speeds up and slows down arrival proportionally',()=>{
  try{
    // m-prichody-odchody: the daily number grows with the settlement, so the expected count is walked day by day.
    const one=arrivals(1),start=arrivals.start,expected=factor=>{let n=start,carry=0;for(let d=0;d<12;d++){const want=migrantsPerDay(n)*factor+carry,come=Math.floor(want+1e-9);carry=want-come;n+=come;}return n-start;};
    assert.ok(one>=12*POPULATION.migrantsPerDay);
    for(const factor of [1,2,4,.5,.25])assert.equal(arrivals(factor),expected(factor));assert.ok(arrivals(2)>one&&arrivals(.5)<one);
  }finally{fresh();}
});
test('m-91: the forecast gives the next resident in game hours and what limits arrival',()=>{
  try{
    fresh();const s=workerScene();s.gameTime.elapsed=s.gameTime.dayDuration/2;s.workerSystem.capacity=()=>1000;
    assert.equal(arrivalForecast(s).hours,12,'×1: at the next day boundary');
    setDevFactor('immigration',.5);assert.equal(arrivalForecast(s).hours,36,'×0.5: every other day');
    setDevFactor('immigration',.25);assert.equal(arrivalForecast(s).hours,12+3*24);
    s.workerSystem.migrantCarry=.75;assert.equal(arrivalForecast(s).hours,12,'the carried fraction counts');
    assert.deepEqual(arrivalForecast(s).limits,[]);
    s.workerSystem.capacity=()=>s.workerSystem.liveSubjects().length;assert.deepEqual(arrivalForecast(s).limits.map(l=>l.id),['beds']);assert.equal(arrivalForecast(s).freeBeds,0);
    s.attractiveness={blockReason:()=>'food',settlementChance:.6};assert.deepEqual(arrivalForecast(s).limits,[{id:'beds'},{id:'food'},{id:'chance',percent:60}]);
  }finally{fresh();}
});
test('m-91: coefficients are clamped to ×0.25–×4; Production multiplies the per-building ones; Reset returns ×1',()=>{
  try{
    fresh();assert.equal(devBalanceChanged(),false);assert.equal(exportDevBalance(),null);
    assert.equal(setDevFactor('wages',9),4);assert.equal(setDevFactor('wages',.1),.25);assert.equal(setDevFactor('wages',1.3),1.3);
    setDevFactor('production',2);setDevFactor('fisher',1.5);assert.equal(devProduction('fisher'),3);assert.equal(devProduction('bakery'),2);assert.equal(devProduction('smithy'),2,'every production building');
    assert.equal(devBalanceChanged(),true);resetDevBalance();assert.ok(DEV_BALANCE_KEYS.every(k=>devFactor(k)===devDefault(k)));assert.equal(devBalanceChanged(),false);
  }finally{fresh();}
});
test('m-91: Market buy and sell prices have separate coefficients, the buy price stays above the sell price',()=>{
  const base=price('wood','buy'),sell=price('wood','sell');
  assert.ok(price('wood','sell',{sellScale:2})>sell);assert.ok(price('wood','sell',{sellScale:.5})<sell);
  assert.ok(price('wood','buy',{buyScale:2})>base);assert.equal(price('wood','buy',{sellScale:4,buyScale:.25}),price('wood','sell',{sellScale:4})+1);
});
test('m-91: devBalance needs no SAVE_VERSION bump (64 since the building move); devBalance is optional, strictly validated and round-trips; a save without it loads ×1',()=>{
  assert.equal(SAVE_VERSION,64);
  try{
    fresh();const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});
    const plain=serializeGameState(s);assert.equal(Object.hasOwn(plain,'devBalance'),false,'absent at ×1');validateGameState(plain);
    setDevFactor('immigration',3);setDevFactor('buyPrice',.5);const saved=serializeGameState(s);assert.deepEqual(saved.devBalance,{immigration:3,buyPrice:.5});validateGameState(saved);
    for(const bad of [null,[],{},{immigration:5},{immigration:.2},{immigration:'2'},{immigration:1.33},{nonsense:2},{immigration:NaN},1,'x'])assert.throws(()=>validateGameState({...saved,devBalance:bad}),undefined,JSON.stringify(bad));
    resetDevBalance();loadGameState(s,saved);assert.equal(devFactor('immigration'),3,'restored from the save');assert.equal(devFactor('buyPrice'),.5);
    loadGameState(s,plain);assert.ok(DEV_BALANCE_KEYS.every(k=>devFactor(k)===devDefault(k)),'a save without devBalance is at the defaults (×1)');
    assert.equal(validDevBalanceState({wages:1.15}),true,'0.78 values on the 0.05 grid stay valid');assert.throws(()=>importDevBalance({wages:9}));
  }finally{fresh();}
});
test('m-91: quick actions respect limits (+Gold, +resources only into free store room, a resident only with a free bed, a caravan only with a Marketplace)',()=>{
  try{
    fresh();const s=workerScene(undefined,{construction:true,logistics:true,ledger:true,gameSettings:gameSettings()});
    const gold=s.inventory.count('gold');assert.equal(addDevGold(s),DEV_QUICK.gold);assert.equal(s.inventory.count('gold'),gold+DEV_QUICK.gold);
    const ids=devResourceIds(s);assert.ok(ids.includes('wood')&&ids.includes('bread'));assert.ok(!ids.includes('gold'));
    const drops=s.dropSystem.drops.size,stock=()=>Object.fromEntries(ids.map(id=>[id,s.foodStorage.available(id)]));
    for(let i=0;i<40;i++){const before=stock(),added=addDevResources(s);for(const [id,n]of Object.entries(added)){assert.ok(n>0&&n<=DEV_QUICK.resources);assert.equal(stock()[id],before[id]+n);}if(!Object.keys(added).length)break;}
    assert.deepEqual(addDevResources(s),{},'full stores take nothing');assert.equal(s.dropSystem.drops.size,drops,'nothing is spilled on the ground');
    const ws=s.workerSystem,n=ws.liveSubjects().length;ws.capacity=()=>n;assert.equal(addDevResident(s),null,'no free bed');assert.equal(ws.liveSubjects().length,n);
    ws.capacity=()=>n+1;assert.ok(addDevResident(s));assert.equal(ws.liveSubjects().length,n+1);assert.equal(addDevResident(s),null);
    assert.equal(summonDevCaravan(s),false,'no caravan without a Marketplace');
    assert.equal(advanceDevDay(s),0,'no catch-up, no jump');
    s.background=new BackgroundSimulation(s);const day=s.gameTime.day;assert.equal(advanceDevDay(s),s.gameTime.dayDuration);s.background.runAll();assert.equal(s.gameTime.day,day+1,'one game day passed through the normal simulation');
    const o=economyOverview(s);assert.equal(o.days,1);assert.equal(o.gold.resource,'gold');assert.deepEqual(o.materials.map(r=>r.resource),['wood','stone','iron']);assert.equal(o.freeBeds,0);
  }finally{fresh();}
});
