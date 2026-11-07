// E4 Royal tasks (plan m-e4-cile-odmeny): three active goals in order, each pays its reward once, Save/Load keeps them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoyalGoals, validRoyalGoalState } from '../src/systems/RoyalGoals.js';
import { ROYAL_GOALS, ROYAL_GOALS_ACTIVE } from '../src/data/royalGoals.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';

const b=(type,complete=true)=>({type,construction:complete?undefined:{state:'planned'}});
function scene({buildings=[],residents=3,gold=0}={}){
  const listeners=new Set(),stock={gold,wood:0,stone:0},income=[];
  return {buildings,stock,income,residents,
    activities:{on:l=>{listeners.add(l);return ()=>listeners.delete(l);},emit:(type,data)=>{for(const l of listeners)l({...data,type});}},
    workerSystem:{liveSubjects(){return Array.from({length:this.owner.residents},()=>({}));}},
    inventory:{count:id=>stock[id]??0,add:(id,n,details)=>{stock[id]=(stock[id]??0)+n;income.push([id,n,details.id]);}}};
}
const make=opts=>{const s=scene(opts);s.workerSystem.owner=s;return {s,goals:new RoyalGoals(s)};};

test('goal data: known buildings, unique ids, texts in both languages, rewards in known resources',()=>{
  assert.equal(new Set(ROYAL_GOALS.map(g=>g.id)).size,ROYAL_GOALS.length);
  for(const g of ROYAL_GOALS){
    if(g.building)assert.ok(objectRegistry.get(g.building),`${g.id}: ${g.building} exists`);
    assert.ok(en[`goals.${g.id}`]&&cs[`goals.${g.id}`],`${g.id} text`);
    for(const id of Object.keys(g.reward)){assert.ok(en[`goals.res.${id}`]&&cs[`goals.res.${id}`],`${id} reward text`);assert.ok(g.reward[id]>0);}
  }
});
test('three goals are active at a time, in order; a finished one makes room for the next',()=>{
  const {s,goals}=make();
  assert.deepEqual(goals.active().map(g=>g.id),ROYAL_GOALS.slice(0,ROYAL_GOALS_ACTIVE).map(g=>g.id));
  s.buildings.push(b('house'),b('house'),b('house',false));assert.deepEqual(goals.check(),[],'a site is not a house');
  assert.equal(goals.progress()[0].value,2);
  s.buildings.push(b('house'));const done=goals.check();
  assert.deepEqual(done.map(g=>g.id),['houses3']);assert.equal(s.stock.gold,20);
  assert.deepEqual(goals.active().map(g=>g.id),['pop10','bread','pop20']);
});
test('a reward is paid exactly once, also when the goal stays met',()=>{
  const {s,goals}=make({buildings:[b('house'),b('house'),b('house')]});
  goals.check();goals.check();goals.update(10000);goals.update(10000);
  assert.equal(s.income.filter(([, ,id])=>id==='royal-goal:houses3:gold').length,1);assert.equal(s.stock.gold,20);
});
test('bread counts finished bakery production; population and gold are read from the world',()=>{
  const {s,goals}=make();
  s.activities.emit('foodProduced',{objectType:'mill'});assert.equal(goals.check().length,0);
  s.activities.emit('foodProduced',{objectType:'bakery'});assert.deepEqual(goals.check().map(g=>g.id),['bread']);
  s.residents=20;assert.deepEqual(goals.check().map(g=>g.id),['pop10','pop20'],'both population goals in one check');
  assert.equal(s.stock.wood,20);assert.equal(s.stock.gold,70);
});
test('Save/Load keeps finished goals and counted production; an old save marks met goals without paying',()=>{
  const {s,goals}=make({buildings:[b('house'),b('house'),b('house')]});goals.check();
  s.activities.emit('foodProduced',{objectType:'mill'});
  const saved=JSON.parse(JSON.stringify(goals.exportState()));assert.ok(validRoyalGoalState(saved));
  assert.deepEqual(saved,{done:['houses3'],produced:{mill:1}});
  const other=make();other.goals.importState(saved);assert.deepEqual(other.goals.active().map(g=>g.id),['pop10','bread','pop20']);
  assert.equal(other.goals.produced.mill,1);
  const old=make({buildings:[b('house'),b('house'),b('house')]});old.goals.importState(undefined);
  assert.deepEqual(old.goals.check(),[]);assert.ok(old.goals.done.has('houses3'));assert.equal(old.s.stock.gold,0,'no reward for a pre-E4 save');
});
test('invalid saved goal state is refused',()=>{
  assert.equal(validRoyalGoalState({done:['nope'],produced:{}}),false);
  assert.equal(validRoyalGoalState({done:['wall','wall'],produced:{}}),false);
  assert.equal(validRoyalGoalState({done:[],produced:{bakery:-1}}),false);
  assert.equal(validRoyalGoalState({done:[]}),false);
  assert.equal(validRoyalGoalState({done:['wall'],produced:{bakery:2}}),true);
});
