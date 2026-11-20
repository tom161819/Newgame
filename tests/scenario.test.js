import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScenario,storedScenarios,storeScenario,forgetScenario,scenarioFileName,SCENARIO_SCHEMA,SCENARIO_VERSION } from '../src/game/scenario.js';

// Owner 20 Nov 2026 (86a): templates for Conquest / Defence made on the Test map.
const base=()=>({schema:SCENARIO_SCHEMA,version:SCENARIO_VERSION,id:'s1',name:'Hrad na kopci',world:{code:'MKW6-1234',land:'home',mapSize:160},goal:{type:'king'},start:{x:40,y:40},
  buildings:[{type:'wall',x:60,y:60,side:'enemy'},{type:'wall_gate',x:61,y:60,side:'enemy',gateAxis:'x'},{type:'house',x:30,y:30,side:'ours'}],units:[{side:'ours',unit:'swordsman',x:40,y:40},{side:'enemy',id:'enemy_archer',x:60,y:60,wall:true},{side:'wild',id:'deer',x:10,y:10}]});
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
test('a template is checked and cleaned; a broken one is refused',()=>{
  const t=normalizeScenario(base());assert.equal(t.buildings[1].gateAxis,'x');assert.equal(t.units[1].wall,true);assert.equal(t.goal.type,'king');
  assert.deepEqual(normalizeScenario({...base(),goal:{type:'defend'}}).goal,{type:'defend'});
  for(const bad of [{...base(),schema:'x'},{...base(),version:2},{...base(),goal:{type:'win'}},{...base(),waves:[{after:-1,units:{}}]},{...base(),buildings:[{type:'wall',x:-1,y:0}]},{...base(),units:[{side:'alien',x:1,y:1}]},{...base(),world:{}}])
    assert.throws(()=>normalizeScenario(bad),/Invalid scenario/);
  assert.equal(normalizeScenario({...base(),name:'x'.repeat(200)}).name.length,60);
});
test('templates are kept in the browser, replaced by id, deleted and named as files',()=>{
  const s=store();assert.deepEqual(storedScenarios(s),[]);storeScenario(base(),s);storeScenario({...base(),id:'s2',name:'Druhý'},s);storeScenario({...base(),name:'Nový název'},s);
  assert.deepEqual(storedScenarios(s).map(d=>[d.id,d.name]),[['s1','Nový název'],['s2','Druhý']]);
  s.setItem('newgame.scenarios',JSON.stringify([...JSON.parse(s.getItem('newgame.scenarios')),{schema:'bad'}]));assert.equal(storedScenarios(s).length,2,'a broken entry is skipped');
  assert.deepEqual(forgetScenario('s1',s).map(d=>d.id),['s2']);assert.equal(scenarioFileName({name:'Hrad na kopci!'}),'hrad-na-kopci.mk-scenario.json');
});
test('a Defence template keeps its attack points, King and waves; the old "hold" goal reads as Defence',()=>{
  const t=normalizeScenario({...base(),goal:{type:'hold',days:3},spawns:[{x:1,y:2},{x:3,y:4}],king:{x:9,y:9},waves:[{after:2.25,units:{enemy_soldier:5,enemy_knight:0,dragon:9}}]});
  assert.equal(t.goal.type,'defend');assert.deepEqual(t.spawns,[{x:1,y:2},{x:3,y:4}]);assert.deepEqual(t.king,{x:9,y:9});assert.deepEqual(t.waves,[{after:2.3,units:{enemy_soldier:5}}]);
  assert.throws(()=>normalizeScenario({...base(),waves:[{after:500,units:{}}]}),/wave 0 time/);assert.throws(()=>normalizeScenario({...base(),waves:[{after:1,units:{enemy_soldier:1000}}]}),/wave 0/);
  assert.deepEqual(normalizeScenario(base()).waves,[]);
});
