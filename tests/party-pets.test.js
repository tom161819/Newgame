import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { DomesticAnimalSystem } from '../src/systems/DomesticAnimalSystem.js';
import { validScouting } from '../src/systems/ScoutingSystem.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=()=>{const s=workerScene(undefined,{foodProduction:true});s.domestic=new DomesticAnimalSystem(s,{random:()=>.5});s.eventFeed={push(){return true;}};return s;};

test('point 67: on an expedition a stray cat or dog joins the party and follows the soldiers', () => {
  const s=scene(),men=[s.workerSystem.create({x:40,y:40}),s.workerSystem.create({x:42,y:40})];s.zone={soldiers:men};const d=s.domestic;
  const dog=d.newDog({x:55.5,y:55.5,home:{x:55.5,y:55.5},state:'stray',leaveAt:d.now()+3*d.day}),cat=d.newCat({x:30.5,y:50.5,home:{x:30.5,y:50.5},state:'stray',leaveAt:d.now()+3*d.day});
  assert.equal(d.joinParty(dog.id),true);assert.equal(d.joinParty(cat.id),true);assert.equal(d.joinParty(cat.id),false,'already with the party');
  assert.deepEqual(d.partyPets(),[{kind:'cat',name:cat.name},{kind:'dog',name:dog.name}]);
  const far=a=>Math.hypot(a.x-41,a.y-40),before=[far(dog),far(cat)];for(let i=0;i<400;i++)d.update(50);
  assert.ok(far(dog)<4&&far(cat)<5,`they follow: dog ${far(dog).toFixed(1)} (was ${before[0].toFixed(1)}), cat ${far(cat).toFixed(1)}`);
  const home=scene();assert.equal(home.domestic.joinParty(home.domestic.newCat({state:'stray'}).id),false,'only on an expedition');
});

test('back home a party pet is a stray that stays until it gets a home; the party keeps its pets in the save', () => {
  const s=scene(),d=s.domestic,cat=d.addHomeStray({kind:'cat',name:'Micka'},{x:50,y:50}),dog=d.addHomeStray({kind:'dog',name:'Rek'},{x:52,y:50});
  assert.equal(cat.state,'stray');assert.equal(cat.leaveAt,null);assert.equal(cat.name,'Micka');assert.equal(dog.name,'Rek');
  s.gameTime.update(s.gameTime.dayDuration*.9);for(let i=0;i<30;i++){s.gameTime.update(s.gameTime.dayDuration*.3);d.update(1000);}assert.ok(d.cats.has(cat.id)&&d.dogs.has(dog.id),'they do not leave by themselves');
  const scouting=p=>({zones:{},party:{zone:'n',ids:[],phase:'returning',since:0,at:10,king:true,...p}});
  assert.ok(validScouting(scouting({pets:[{kind:'cat',name:'Micka'}]}),{workerIds:new Set()}));assert.ok(!validScouting(scouting({pets:[{kind:'cow',name:'X'}]}),{workerIds:new Set()}));assert.ok(!validScouting(scouting({pets:[{kind:'cat',name:''}]}),{workerIds:new Set()}));
});

test('the party brings its pets home with it', async () => {
  const { zoneStart,homeAfterZone } = await import('../src/game/zoneMode.js');
  const home={gameSettings:{worldCode:'MKW5-155515555555-ABC',dayLengthSeconds:600,mapSize:150},time:{totalElapsed:5000},workers:[{id:'s0',currentHP:50}],scouting:{zones:{e:{type:'forest',day:2}},party:{zone:'e',ids:['s0'],phase:'there',since:0,at:9}}};
  const start=zoneStart(home);assert.deepEqual(start.zone.pets,[]);
  const zone={...start.zone,soldiers:[{id:'s0',isAlive:true,currentHP:40,maxHP:60}]};
  const back=homeAfterZone({zone,inventory:{count:()=>0},gameTime:{exportState:()=>({totalElapsed:9})},character:{},domestic:{partyPets:()=>[{kind:'dog',name:'Rek'}]}});
  assert.deepEqual(back.home.scouting.party.pets,[{kind:'dog',name:'Rek'}]);assert.ok(validScouting(back.home.scouting,{workerIds:new Set(['s0'])}));
});
