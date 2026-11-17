import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatFeedback } from '../src/ui/CombatFeedback.js';

// Owner 17 Nov 2026: "naši 1/2 · nepřátelé 5/5" stayed on screen with no enemy in sight. Only a real fight counts now:
// both alive, within reach of each other, the enemy in sight.
const unit=(id,x,y,extra={})=>({id,isAlive:true,position:{x:x+.5,y:y+.5},tile:{x,y},attackRange:1,...extra});
const wolf=(id,x,y)=>unit(id,x,y,{type:'wolf',definition:{gameplay:{}}});
function scene(attacks,fog=null){return {map:Array.from({length:40},()=>Array(40).fill(0)),combat:{attacks:new Map(attacks)},gameTime:{totalElapsed:0},fog,eventFeed:{push(){}}};}

test('the battle panel counts only enemies within reach of our people and in sight; a far chase ends it',()=>{
  const a=unit('a',5,5),b=unit('b',6,6),w1=wolf('w1',30,30),w2=wolf('w2',31,30),w3=wolf('w3',5,6);
  const far=new CombatFeedback(scene([[w1,a],[w2,b]]));far.trackBattle(50);assert.equal(far.battle,null,'wolves far away chasing: no battle');
  const near=new CombatFeedback(scene([[w3,a],[b,w3],[w1,a]]));near.trackBattle(50);assert.ok(near.battle);assert.deepEqual([...near.battle.foes].map(u=>u.id),['w3']);
  const dark=new CombatFeedback(scene([[w3,a]],{enabled:true,isVisibleObject:u=>u.id!=='w3'}));dark.trackBattle(50);assert.equal(dark.battle,null,'an enemy out of sight does not start one');
  // Once nobody is within reach any more, the battle ends after the quiet time.
  near.scene.combat.attacks=new Map([[w1,a]]);for(let i=0;i<120;i++)near.trackBattle(50);assert.equal(near.battle,null);
});
