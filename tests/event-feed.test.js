import test from 'node:test';
import assert from 'node:assert/strict';
import { EventFeed,FEED } from '../src/ui/EventFeed.js';
import { GameActivityBus } from '../src/systems/GameActivityBus.js';

function world(){
  const seasonListeners=new Set(),popListeners=new Set(),workers=new Map([[1,{id:1,name:'Anna',isAlive:true}],[2,{id:2,name:'Bohuslav',isAlive:true}]]);
  const scene={activities:new GameActivityBus(),gameTime:{totalElapsed:0,day:1,paused:false},foodSystem:{shortage:false},
    seasons:{season:'Spring',calendar:{year:1},onChange:l=>{seasonListeners.add(l);return()=>seasonListeners.delete(l);}},
    buildings:[{id:7,type:'house',definition:{id:'house',name:'House'}}],
    workerSystem:{workers,liveSubjects:()=>[...workers.values()].filter(w=>w.isAlive),recentDeaths:()=>[],subscribe:l=>{popListeners.add(l);return()=>popListeners.delete(l);}}};
  return {scene,season:value=>{scene.seasons.season=value;for(const l of seasonListeners)l();},population:()=>{for(const l of popListeners)l();},seasonListeners,popListeners};
}
const texts=feed=>feed.entries.map(e=>e.text);

test('#105 feed collects season, completion, arrival, death, attack and shortage events, newest first, without duplicates',()=>{
  const w=world(),s=w.scene;let now=0;const feed=new EventFeed(s,{document:null,now:()=>now});
  assert.deepEqual(feed.entries,[],'a new or loaded game starts with an empty feed (no replay)');
  w.season('Summer');w.season('Summer');
  for(const actor of [1,2])s.activities.emit('buildingCompleted',{actor,objectType:'house',objectIds:[7]});
  s.workerSystem.workers.set(3,{id:3,name:'Cyril',isAlive:true});w.population();
  s.workerSystem.workers.get(2).isAlive=false;w.population();
  s.activities.emit('combatDamage',{actor:99,targetId:1,objectType:'worker',amount:3});s.activities.emit('combatDamage',{actor:99,targetId:1,objectType:'worker',amount:3});
  s.activities.emit('combatDamage',{actor:1,targetId:99,objectType:'wolf',amount:3});
  s.foodSystem.shortage=true;feed.update();feed.update();
  assert.equal(feed.entries.length,FEED.maxEntries,'at most five entries');
  assert.deepEqual(texts(feed),['Food is running short.','Anna is under attack!','Bohuslav died – wounds.','Cyril has joined the kingdom.','House is finished.']);
  assert.ok(feed.entries[0].important&&!feed.entries.at(-1).important);
});

test('#105 entries fade after their lifetime; paused time does not count; attacks are throttled per resident',()=>{
  const w=world(),s=w.scene;let now=1000;const feed=new EventFeed(s,{document:null,now:()=>now});
  s.activities.emit('buildingCompleted',{actor:1,objectType:'house',objectIds:[7]});
  s.gameTime.paused=true;feed.update();now+=FEED.lifeMs*3;feed.update();assert.equal(feed.entries.length,1,'kept while paused');
  s.gameTime.paused=false;feed.update();now+=FEED.lifeMs-1;feed.update();assert.equal(feed.entries.length,1);now+=2;feed.update();assert.equal(feed.entries.length,0,'expired after the unpaused lifetime');
  s.activities.emit('combatDamage',{targetId:1});s.gameTime.totalElapsed+=FEED.attackThrottleMs-1;s.activities.emit('combatDamage',{targetId:1});assert.equal(feed.entries.length,1);
  s.gameTime.totalElapsed+=2;s.activities.emit('combatDamage',{targetId:1});assert.equal(feed.entries.length,2,'a later attack is reported again');
  feed.destroy();assert.equal(w.seasonListeners.size+w.popListeners.size+s.activities.listeners.size,0,'destroy unsubscribes every source');
});
