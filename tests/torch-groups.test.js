import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { LightFuelSystem } from '../src/systems/LightFuelSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { TORCHES } from '../src/data/torches.js';
globalThis.document??={querySelector:()=>({textContent:''})};

function world(){
  const s=workerScene(undefined,{logistics:true,workplaces:true});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);
  s.dayNight=new DayNightSystem(s);s.lightFuel=new LightFuelSystem(s);s.eventFeed={push(){return true;}};
  const store=()=>[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));
  const soldiers=(n,x,y)=>Array.from({length:n},(_,i)=>{const w=s.workerSystem.create({x:x+i%5,y:y+Math.floor(i/5)});w.profession='soldier';return w;});
  return {s,f:s.lightFuel,store,soldiers};
}
const night=s=>{const g=s.gameTime;g.update(g.dayDuration*(.97)-g.elapsed);};

test('point 68: one torch for every 10 soldiers of a group, not for everyone', () => {
  const {s,f,store,soldiers}=world();store().stock.torch=20;const a=soldiers(12,30,30),b=soldiers(3,60,60);
  night(s);f.update(16);
  assert.equal(a.filter(w=>f.carries(w)).length,2,'12 men: two torches');assert.equal(b.filter(w=>f.carries(w)).length,1,'3 men: one');assert.equal(store().stock.torch,17);
  assert.equal(TORCHES.perGroup,10);
});

test('inside the mine it is always night; a torch lasts a day and the next one comes from the wagon on an expedition', () => {
  const {s,f,store,soldiers}=world();s.land={dungeon:true};store().stock.torch=0;s.zone={cargo:{torch:2,bread:5}};
  const g=s.gameTime;g.update(g.dayDuration*.3);assert.equal(s.dayNight.isNight(),true);assert.equal(s.dayNight.darkness(),1);assert.equal(s.dayNight.speed(4),1,'no night speed-up underground');
  const men=soldiers(5,30,30);f.update(5000);const bearer=men.find(w=>f.carries(w));assert.ok(bearer);assert.equal(s.zone.cargo.torch,1,'taken from the wagon');
  g.update(g.dayDuration);f.update(5000);assert.ok(f.carries(bearer),'a new torch on the next day');assert.equal(s.zone.cargo.torch,undefined,'the wagon is out of torches');
  g.update(g.dayDuration);f.update(5000);assert.equal(men.some(w=>f.carries(w)),false,'no torch left: darkness');assert.equal(s.zone.cargo.bread,5);
});

test('the Test map gives chosen soldiers a torch for free', () => {
  const {s,f,store,soldiers}=world();store().stock.torch=0;const men=soldiers(3,40,40);
  assert.equal(f.giveFree([...men,s.workerSystem.create({x:50,y:50})]),3);night(s);f.update(16);assert.equal(men.filter(w=>f.carries(w)).length,3,'all three keep their free torch');
});
