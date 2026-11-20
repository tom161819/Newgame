import test from 'node:test';
import assert from 'node:assert/strict';
import { conquestGoal,clampSupplies,conquestState,Conquest,CONQUEST } from '../src/game/conquest.js';
import { SCENARIO_SCHEMA,SCENARIO_VERSION } from '../src/game/scenario.js';

// Owner 20 Nov 2026 (86b): Conquest – kill the King (or the template's goal), no economy, supplies at the start.
const tpl=(goal='king',units=[{side:'ours',unit:'swordsman',x:5,y:5},{side:'enemy',id:'enemy_king',x:40,y:40}])=>({schema:SCENARIO_SCHEMA,version:SCENARIO_VERSION,id:'c',name:'C',world:{code:'X',land:'home',mapSize:100},goal:{type:goal},start:{x:5,y:5},buildings:[],units});
function world({foes=[],soldiers=1,buildings=[]}={}){
  const animals=new Map(foes.map((f,i)=>[i,{isAlive:true,sandbox:true,type:f,definition:{gameplay:{hostile:true}},tile:{x:40,y:40}}]));
  const workers=Array.from({length:soldiers},(_,i)=>({id:i,isAlive:true,profession:'soldier',tile:{x:5,y:5}}));
  const marched=[];return {marched,scene:{animalSystem:{animals},workerSystem:{liveWorkers:()=>workers.filter(w=>w.isAlive)},military:{unit:()=>({type:'swordsman'})},buildings,map:Array.from({length:100},()=>Array(100).fill(0)),
    gameTime:{totalElapsed:0,dayDuration:24000},enemyArmy:{march:list=>{marched.push(...list);for(const a of list)a.marching={};return list.length;}},eventFeed:{push(){}},setStatus(){},pauseManager:{set(){}}},workers,animals};
}
test('the goal follows the template; a King goal without a King is played as the whole army',()=>{
  assert.equal(conquestGoal(tpl()),'king');assert.equal(conquestGoal(tpl('king',[])),'army');assert.equal(conquestGoal(tpl('castle')),'castle');
  assert.deepEqual(clampSupplies({food:'2',stone:9,torch:-1}),{food:2,stone:CONQUEST.maxWagons,torch:0});
});
test('won when the King falls, lost when our soldiers are gone; the castle goal ignores walls',()=>{
  const w=world({foes:['enemy_king','enemy_soldier']});assert.equal(conquestState(w.scene,'king'),'on');w.animals.get(0).isAlive=false;assert.equal(conquestState(w.scene,'king'),'won');
  assert.equal(conquestState(w.scene,'army'),'on');w.workers[0].isAlive=false;assert.equal(conquestState(w.scene,'army'),'lost');
  const c=world({buildings:[{enemy:true,type:'wall',x:40,y:40},{enemy:true,type:'tower',x:41,y:40}]});assert.equal(conquestState(c.scene,'castle'),'on');c.scene.buildings.pop();assert.equal(conquestState(c.scene,'castle'),'won');
  const wolf=world({foes:[]});wolf.animals.set(9,{isAlive:true,type:'wolf',definition:{gameplay:{hostile:true}}});assert.equal(conquestState(wolf.scene,'army'),'won','a wolf of the world does not count');
});
test('the enemy counter-attacks when our army comes close and then in waves, never with the King',()=>{
  const w=world({foes:['enemy_king','enemy_soldier','enemy_soldier','enemy_archer','enemy_soldier'],buildings:[{enemy:true,type:'tower',x:30,y:30}]});let over=null;w.scene.onConquestOver=o=>{over=o;};
  const c=new Conquest(w.scene,{template:tpl(),supplies:{}});c.update(1000);assert.equal(w.marched.length,0,'far away: no alarm');
  w.workers[0].tile={x:25,y:25};c.update(1000);assert.equal(w.marched.length,2);assert.ok(w.marched.every(a=>a.type!=='enemy_king'));
  w.scene.gameTime.totalElapsed=CONQUEST.waveEvery*1000+1;c.update(1000);assert.equal(w.marched.length,3);
  w.animals.get(0).isAlive=false;c.update(1000);assert.equal(over?.state,'won');
});
