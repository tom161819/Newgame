import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_NIGHT,nightStartFor,dayPart,darknessAt,moonLight } from '../src/data/dayNight.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { isRestTime,restStart,DailyRest } from '../src/systems/DailyRest.js';
import { readNightSpeed } from '../src/ui/NightControls.js';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=({day=1,fraction=0,seasons=true}={})=>{const g=new GameTimeSystem(120000);g.day=day;g.elapsed=fraction*120000;return {gameTime:g,seasons:{enabled:seasons}};};

test('night starts at 82 % in summer, 75 % in spring and autumn, 62 % in winter, and moves smoothly through the year', () => {
  // Season middles (5-day seasons): spring day 3.5, summer 8.5, autumn 13.5, winter 18.5.
  for(const [day,season] of [[3.5,'Spring'],[8.5,'Summer'],[13.5,'Autumn'],[18.5,'Winter']])assert.ok(Math.abs(nightStartFor(day)-DAY_NIGHT.nightStart[season])<1e-9,season);
  for(let d=1;d<=40;d+=.25)assert.ok(Math.abs(nightStartFor(d+.25)-nightStartFor(d))<.02,`no jump at day ${d}`);
  assert.equal(nightStartFor(18.5,false),.82,'seasons off: summer');
  assert.equal(dayPart(.02,.75),'dawn');assert.equal(dayPart(.3,.75),'day');assert.equal(dayPart(.66,.75),'dusk');assert.equal(dayPart(.75,.75),'night');
  assert.equal(darknessAt(.3,.75),0);assert.equal(darknessAt(.8,.75),1);assert.ok(Math.abs(darknessAt(.7,.75)-.5)<1e-9);assert.ok(Math.abs(darknessAt(.025,.75)-.5)<1e-9);
  assert.equal(moonLight(1),0);assert.ok(Math.abs(moonLight(5)-1)<1e-9,'full moon on day 5 of 8');
});

test('sleep starts with the night: the rest start follows the season, the old fixed start stays without the cycle', () => {
  const winter=scene({day:19,fraction:.65}),dn=new DayNightSystem(winter);
  assert.ok(Math.abs(restStart(winter.gameTime)-dn.nightStart())<1e-12);assert.equal(isRestTime(winter.gameTime),true,'winter night at 65 %');
  const summer=scene({day:9,fraction:.78});new DayNightSystem(summer);assert.equal(isRestTime(summer.gameTime),false,'summer evening at 78 % is still awake');
  const plain=new GameTimeSystem(120000);plain.elapsed=.76*120000;assert.equal(restStart(plain),.75);assert.equal(isRestTime(plain),true);
});

test('soldiers keep the night watch and rest in the first third of the day', () => {
  const s=workerScene(undefined,{workplaces:true});const dn=new DayNightSystem(s),rest=new DailyRest(s.workerSystem);void dn;
  const soldier={profession:'soldier'};assert.equal(rest.nightWatch(soldier),true);
  s.gameTime.elapsed=s.gameTime.dayDuration*.9;assert.equal(rest.wants(soldier),false,'awake at night');
  s.gameTime.elapsed=s.gameTime.dayDuration*.1;assert.equal(rest.wants(soldier),true,'sleeps in the morning');
  s.gameTime.elapsed=s.gameTime.dayDuration*.4;assert.equal(rest.done(soldier),true,'up again after a third of the day');
});

test('at night everyone sees a third outside light, the full sight inside a torch light; by day the full sight', () => {
  const sc=scene({day:1,fraction:.9}),dn=new DayNightSystem(sc);const lights=[{x:10,y:10,radius:3}];
  assert.ok(Math.abs(dn.sightFactor({x:30,y:30},lights)-1/3)<1e-9);assert.equal(dn.sightFactor({x:11,y:11},lights),1);
  sc.gameTime.elapsed=.4*120000;assert.equal(dn.sightFactor({x:30,y:30},lights),1);
  sc.gameTime.elapsed=(dn.nightStart()-.05)*120000;const dusk=dn.sightFactor({x:30,y:30},lights);assert.ok(dusk<1&&dusk>1/3,'dusk in between');
  // Only flames count as light for sight (windows do not).
  sc.lightSources={lights:()=>[{type:'window',x:0,y:0,radius:64},{type:'torch',x:0,y:400,radius:96}]};assert.deepEqual(dn.lights().map(l=>l.radius),[3]);
});

test('Speed up nights: ×3 by default (×1 by day), Skip to dawn ×8 until dawn, a fight stops it', () => {
  const sc=scene({day:1,fraction:.9}),dn=new DayNightSystem(sc);
  assert.equal(readNightSpeed({getItem:()=>null}),3);assert.equal(readNightSpeed({getItem:()=>'2'}),2);assert.equal(readNightSpeed({getItem:()=>'7'}),3);
  assert.equal(dn.speed(3),3);assert.equal(dn.speed(1),1);assert.equal(dn.skipToDawn(),true);assert.equal(dn.speed(3),DAY_NIGHT.skipSpeed);
  dn.attention=()=>true;assert.equal(dn.speed(3),1);assert.equal(dn.skipping,false,'a fight cancels the skip');dn.attention=()=>false;
  dn.skipToDawn();sc.gameTime.day=2;sc.gameTime.elapsed=.1*120000;assert.equal(dn.speed(3),1,'day');assert.equal(dn.skipping,false);
  assert.equal(dn.skipToDawn(),false,'nothing to skip by day');
});

test('house windows glow from dusk while somebody lives there and go dark at bedtime; empty houses stay dark', () => {
  const s=workerScene(undefined,{workplaces:true});const dn=new DayNightSystem(s);
  const place=(x,y)=>{const d=s.objectRegistry.require('house');for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);return r.building;};
  const lived=place(60,60),empty=place(70,60);s.workerSystem.create({x:62,y:66});s.workerSystem.create({x:63,y:66});s.needs.homes();
  const ids=()=>dn.houseWindows().map(w=>w.buildingId);const start=dn.nightStart();
  s.gameTime.elapsed=s.gameTime.dayDuration*.3;assert.deepEqual(ids(),[],'by day');
  s.gameTime.elapsed=s.gameTime.dayDuration*(start-.05);assert.deepEqual(ids(),[lived.id],'at dusk, only the lived-in house');void empty;
  s.gameTime.elapsed=s.gameTime.dayDuration*(start+DAY_NIGHT.houseWindows.bedtimeSpread+.01);assert.deepEqual(ids(),[],'everybody is asleep');
});
