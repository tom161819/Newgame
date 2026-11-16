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
  const back=homeAfterZone({zone:{home,soldiers:[{id:'s0',isAlive:true,currentHP:33},{id:'s1',isAlive:false,currentHP:0}]}});
  assert.deepEqual(back.fallen,['s1']);assert.deepEqual(back.home.scouting.party.ids,['s0']);assert.equal(back.home.scouting.party.phase,'returning');
  assert.equal(back.home.scouting.party.at,5000+300000);assert.equal(back.home.workers[0].currentHP,33);assert.equal(home.scouting.party.phase,'there','the kept home state is not changed');
});
