import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>({textContent:''})};
const { SCOUTING,zoneType,zoneEdge,zoneById } = await import('../src/data/scouting.js');
const { ScoutingSystem,validScouting } = await import('../src/systems/ScoutingSystem.js');
const { garrisonRatio } = await import('../src/systems/NeedsSystem.js');

function soldier(id,x=50,y=50){return {id,name:id,profession:'soldier',isAlive:true,tile:{x,y},position:{x:x+.5,y:y+.5},path:[],nextTile:null,moveTo(g){this.goal=g;}};}
function world({level=3,barracks=true,soldiers=3}={}){
  const workers=new Map(Array.from({length:soldiers},(_,i)=>[`s${i}`,soldier(`s${i}`)]));const feed=[];
  const scene={map:Array.from({length:100},()=>Array(100).fill(0)),gameSettings:{worldCode:'ABC'},gameTime:{totalElapsed:0,dayDuration:24000,day:3},
    buildings:[{id:'c',type:'castle',level},...(barracks?[{id:'b',type:'barracks'}]:[])],
    workerSystem:{workers,liveWorkers:()=>[...workers.values()]},eventFeed:{push:(id,text)=>feed.push(text)}};
  return {scene,workers,feed,s:new ScoutingSystem(scene)};
}
test('zone types follow the world code',()=>{
  for(const z of SCOUTING.zones)assert.equal(zoneType('ABC',z.id),zoneType('ABC',z.id));
  assert.deepEqual(zoneEdge(zoneById('n'),100,100),{x:0,y:0});assert.deepEqual(zoneEdge(zoneById('se'),100,100),{x:99,y:50});assert.deepEqual(zoneEdge(zoneById('s'),100,100),{x:99,y:99});
});
test('scouting needs castle level 3 and finished barracks',()=>{
  assert.equal(world({level:2}).s.blocker(),'castle');assert.equal(world({barracks:false}).s.blocker(),'barracks');assert.equal(world().s.blocker(),null);
  assert.ok(world({level:2}).s.send('n',['s0']).error);
});
test('a party leaves, finds the zone, comes back',()=>{
  const {scene,workers,feed,s}=world();
  assert.ok(s.send('e',['s0','s1']).party);assert.ok(s.send('w',['s2']).error,'one party at a time');
  assert.equal(s.soldiers().length,1);
  const a=workers.get('s0');assert.ok(s.updateSoldier(a));assert.ok(a.goal.length);
  scene.gameTime.totalElapsed=SCOUTING.leaveHours*1000+1;s.update();assert.equal(s.party.phase,'away');assert.ok(a.away);
  const saved=JSON.parse(JSON.stringify(s.exportState()));assert.ok(validScouting(saved,{workerIds:new Set(workers.keys())}));
  scene.gameTime.totalElapsed=s.party.at;s.update();assert.equal(s.party.phase,'there');assert.ok(validScouting(JSON.parse(JSON.stringify(s.exportState())),{workerIds:new Set(workers.keys())}));scene.gameTime.totalElapsed+=50000;s.update();assert.equal(s.party.phase,'there','it waits');assert.ok(s.sendHome());assert.equal(s.party.phase,'returning');assert.equal(s.zones.e.type,zoneType('ABC','e'));assert.ok(feed.some(t=>t.includes('Východ')||t.includes('East')));
  scene.gameTime.totalElapsed=s.party.at;s.update();assert.equal(s.party,null);assert.ok(!a.away);assert.equal(a.scoutZone,undefined);assert.ok(a.tile.x>=95||a.tile.y<=4);
});
test('scouting save validation',()=>{
  const ids=new Set(['s0']);assert.ok(validScouting(undefined,{workerIds:ids}));assert.ok(validScouting({zones:{},party:null},{workerIds:ids}));
  assert.ok(!validScouting({zones:{x:{type:'iron',day:1}},party:null},{workerIds:ids}));assert.ok(!validScouting({zones:{n:{type:'gold',day:1}},party:null},{workerIds:ids}));
  assert.ok(!validScouting({zones:{},party:{zone:'n',ids:['zz'],phase:'away',since:0,at:5}},{workerIds:ids}));
  assert.ok(!validScouting({zones:{},party:{zone:'n',ids:['s0'],phase:'leaving',since:0,at:5}},{workerIds:ids}));
});
test('garrison: one soldier per 5 residents for the full bonus',()=>{
  const p=(r,s,away=0)=>[...Array(r).fill({profession:'builder'}),...Array(s).fill({profession:'soldier'}),...Array(away).fill({profession:'soldier',away:true})];
  assert.equal(garrisonRatio(p(10,2)).ratio,1);assert.equal(garrisonRatio(p(10,1)).ratio,.5);assert.equal(garrisonRatio(p(10,0,2)).ratio,0);assert.equal(garrisonRatio(p(0,0)).ratio,1);
});
test('zone play: the zone world, the start and the way home',async()=>{
  const { zoneWorldCode,zoneStart,homeAfterZone,ZONE_LOOK } = await import('../src/game/zoneMode.js');
  const { decodeWorldCode,WORLD_SETTINGS } = await import('../src/data/worldCode.js');
  const code=zoneWorldCode('MKW5-155515555555-ABC','e','forest');assert.equal(code,zoneWorldCode('MKW5-155515555555-ABC','e','forest'),'the same zone, the same world');
  assert.notEqual(code,zoneWorldCode('MKW5-155515555555-ABC','w','forest'));
  assert.equal(decodeWorldCode(code).levels[WORLD_SETTINGS.findIndex(s=>s.key==='forest')],ZONE_LOOK.forest.levels.forest);
  const home={gameSettings:{worldCode:'MKW5-155515555555-ABC',dayLengthSeconds:600,mapSize:150},time:{totalElapsed:5000},workers:[{id:'s0',currentHP:50},{id:'s1',currentHP:50}],
    scouting:{zones:{e:{type:'iron',day:2}},party:{zone:'e',ids:['s0','s1'],phase:'away',since:0,at:9}}};
  assert.equal(zoneStart(home),null,'not there yet');home.scouting.party.phase='there';
  const start=zoneStart(home);assert.equal(start.settings.mapSize,100);assert.deepEqual(start.zone.ids,['s0','s1']);assert.equal(start.zone.type,'iron');
  const zone={...start.zone,soldiers:[{id:'s0',isAlive:true,currentHP:33,maxHP:60},{id:'s1',isAlive:false,currentHP:0}],taken:['zone-0'],loot:{gold:40}};
  const scene={zone,inventory:{count:()=>25},gameTime:{exportState:()=>({totalElapsed:9})},character:{}};
  const back=homeAfterZone(scene);
  assert.deepEqual(back.fallen,['s1']);assert.deepEqual(back.home.scouting.party.ids,['s0']);assert.equal(back.home.scouting.party.phase,'returning');
  assert.equal(back.home.scouting.party.at,5000+300000);assert.equal(back.home.workers[0].currentHP,33);assert.equal(home.scouting.party.phase,'there','the kept home state is not changed');
  assert.deepEqual(back.home.scouting.party.loot,{gold:65},'chest gold and gold picked up');assert.deepEqual(back.home.scouting.zones.e.taken,['zone-0'],'a taken chest stays taken');
  assert.ok(validScouting(back.home.scouting,{workerIds:new Set(['s0','s1'])}));
});
test('owner 16 Nov 2026: the King and a loaded Horse Wagon may go with the party (save check)',()=>{
  const ids=new Set(['s0']),vehicleIds=new Set(['vehicle-1']),registry={get:id=>({bread:{category:'resource'},wood:{category:'resource'}})[id]};
  const party=extra=>({zones:{},party:{zone:'n',ids:['s0'],phase:'there',since:0,at:5,...extra}});
  assert.ok(validScouting(party({king:true}),{workerIds:ids,vehicleIds,registry}));
  assert.ok(validScouting({zones:{},party:{zone:'n',ids:[],phase:'away',since:0,at:5,king:true}},{workerIds:ids,vehicleIds,registry}),'the King alone');
  assert.ok(!validScouting({zones:{},party:{zone:'n',ids:[],phase:'away',since:0,at:5}},{workerIds:ids,vehicleIds,registry}),'nobody');
  assert.ok(!validScouting(party({king:false}),{workerIds:ids,vehicleIds,registry}));
  assert.ok(validScouting(party({wagonId:'vehicle-1',cargo:{bread:10}}),{workerIds:ids,vehicleIds,registry}));
  assert.ok(!validScouting(party({wagonId:'vehicle-2',cargo:{}}),{workerIds:ids,vehicleIds,registry}),'unknown wagon');
  assert.ok(!validScouting(party({wagonId:'vehicle-1',cargo:{gold_bar:1}}),{workerIds:ids,vehicleIds,registry}),'unknown goods');
  assert.ok(!validScouting(party({cargo:{bread:1}}),{workerIds:ids,vehicleIds,registry}),'goods without a wagon');
});
test('owner 16 Nov 2026: bandit camp, ruins and mine shape the land; the mine has an inside',async()=>{
  const { shapeZoneWorld } = await import('../src/game/zoneFeatures.js');
  let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const world=()=>({terrain:Array.from({length:100},()=>Array(100).fill(0)),ground:Array.from({length:100},()=>Array(100).fill(0)),bushes:new Map(),reeds:new Set(),natureGroups:[]});
  const camp=shapeZoneWorld(world(),{type:'bandits',id:'e'},random);assert.equal(camp.kind,'bandits');assert.ok(camp.guards.length>=4);assert.equal(camp.chests.length,1);
  const w=world(),ruins=shapeZoneWorld(w,{type:'ruins',id:'s'},random);assert.equal(ruins.kind,'ruins');assert.ok(w.terrain.flat().some(v=>v===1),'broken walls');assert.equal(w.terrain[ruins.center.y][ruins.center.x],0);
  const m=world(),mine=shapeZoneWorld(m,{type:'mine',id:'n'},random);assert.equal(m.terrain[mine.entrance.y][mine.entrance.x],0,'the entrance is open');assert.equal(m.terrain[mine.center.y][mine.center.x],1,'a rock hill');
  const d=world(),inside=shapeZoneWorld(d,{type:'mine',id:'n',dungeon:true},random);assert.equal(inside.kind,'dungeon');assert.equal(d.terrain[inside.entrance.y][inside.entrance.x],0);
  assert.ok(inside.chests.length>=1&&inside.rats.length>0);assert.ok(d.terrain.flat().filter(v=>v===0).length<3000,'mostly rock');
  for(const c of inside.chests)assert.equal(d.terrain[c.tile.y][c.tile.x],0);
  assert.equal(shapeZoneWorld(world(),{type:'forest',id:'e'},random),null);
  assert.ok(validScouting({zones:{e:{type:'ruins',day:1,taken:['zone-0'],cleared:true}},party:null},{workerIds:new Set()}));
  assert.ok(!validScouting({zones:{e:{type:'ruins',day:1,taken:['x']}},party:null},{workerIds:new Set()}));
});
