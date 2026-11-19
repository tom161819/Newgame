// m-zelezny-dul-misto (playtest 0.83.0 #5): every new world (generator 5) has a free Iron Mine spot beside the Iron
// Deposit nearest to the Castle; the Iron Mine's build mode names why a spot is invalid; outside sight it needs a known
// deposit; a blueprint cancelled for an obstacle goes to Notices with its reason and a camera link.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { generateWorld,mapFromWorld } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';
import { defaultWorldLevels,settingsFromLevels,WORLD_GENERATOR_VERSION } from '../src/data/worldCode.js';
import { isFordGround,WORLD_GENERATION } from '../src/data/worldTerrain.js';
import { START_IRON_MINE,depositFamily } from '../src/data/minerals.js';
import { FORESTRY } from '../src/data/naturalResources.js';
import { PLAYER_START } from '../src/game/config.js';
import { placementError,placeBuilding,buildingDefinition } from '../src/game/buildings.js';
import { footprintDistance,rectanglesOverlap } from '../src/systems/MineralSystem.js';
import { gameSettings,NEW_GAME_DEFAULTS } from '../src/systems/GameSettings.js';
import { siteObstacle,mineSpotError,provisionalMineError,SITE_REASONS } from '../src/game/siteObstacles.js';
import { isProvisional,knownPlacementError } from '../src/game/provisionalSites.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { DIAGNOSTICS } from '../src/data/diagnostics.js';
import { noticeText } from '../src/ui/noticeText.js';
import { setLanguage,t } from '../src/i18n/index.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// The New Game order of GameScene (as tests/quarry-near-castle.test.js): world, Castle, trees, deposits, start Quarry, Iron Mine.
function newWorld(seed,{trees=true}={}){
  const levels=defaultWorldLevels(),streams=worldStreams(seed),w=generateWorld(Math.random,{levels,streams});
  const s=workerScene(mapFromWorld(w.terrain,w.ground),{logistics:true,naturalResources:true,construction:true,gameSettings:gameSettings(NEW_GAME_DEFAULTS),start:PLAYER_START});
  s.workerSystem.unsubscribe();s.fog.setEnabled(false);s.terrainGrid=w.terrain.map(r=>[...r]);s.groundGrid=w.ground;
  s.fordKeys=new Set();for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(isFordGround(w.ground[y][x]))s.fordKeys.add(`${x},${y}`);s.isFordTile=t=>s.fordKeys.has(`${t.x},${t.y}`);
  const o=settingsFromLevels(levels),F=WORLD_GENERATION.fairStart,at=(grid,t)=>grid[t.y*100+t.x]??0;
  if(trees)s.naturalResources.generate(streams('trees'),Math.round(FORESTRY.initialTrees*o.forest),{weight:t=>at(w.forestWeight,t),start:o.forest>=.5?{center:PLAYER_START,radius:F.radius,trees:F.trees}:null});
  s.naturalResources.mining.generate(streams('minerals'),t=>.25+.75*at(w.stoneWeight,t));s.naturalResources.mining.ensureStartQuarry(streams('start-quarry'));
  const result=s.naturalResources.mining.ensureIronMine(streams('start-iron-mine'));return {s,result};
}
const castleCentre=s=>{const c=s.buildings.find(b=>b.type==='castle'),d=buildingDefinition(c);return {x:c.x+d.width/2,y:c.y+d.height/2};};
const nearestIron=s=>{const c=castleCentre(s),dist=d=>Math.hypot(d.x+d.definition.width/2-c.x,d.y+d.definition.height/2-c.y);return s.naturalResources.mining.deposits().filter(d=>depositFamily(d.type)==='iron_deposit').sort((a,b)=>dist(a)-dist(b))[0];};
// Every Iron Mine anchor beside the deposit that the game's own placementError accepts (fog off, unlocks granted).
function mineSpots(s,deposit){
  const mine=s.objectRegistry.require('iron_mine'),spots=[];
  for(let y=deposit.y-4;y<=deposit.y+deposit.definition.height+1;y++)for(let x=deposit.x-4;x<=deposit.x+deposit.definition.width+1;x++){
    const site={x,y,definition:mine};if(!rectanglesOverlap(site,deposit))continue;/* m-dul-na-lozisku: the mine stands over its deposit */
    if(placementError(s.map,{x,y},s.resourceOccupancy,s.reservedTiles(),mine,s.buildings,{status:()=>({unlocked:true})})===null)spots.push({x,y});
  }
  return spots;
}

test('generator 5: the nearest Iron Deposit has an Iron Mine spot beside it in every world (sweep), mostly unchanged',()=>{
  assert.ok(WORLD_GENERATOR_VERSION>=5,'generator 5 and later (6: m-teren-vyska part 3)');let added=0;
  for(const [seed,trees] of [...Array.from({length:40},(_,i)=>[1000+i*7919,false]),...Array.from({length:6},(_,i)=>[parseInt('SU24BGPY',36)+i,true])]){
    const {s,result}=newWorld(seed,{trees}),d=nearestIron(s);assert.ok(d,`seed ${seed}: an Iron Deposit`);assert.equal(result.deposit,d,`seed ${seed}: the result is the nearest`);
    assert.ok(result.site,`seed ${seed}: a site`);const spots=mineSpots(s,d);assert.ok(spots.length,`seed ${seed}: a valid Iron Mine spot beside the nearest deposit`);
    assert.ok(spots.some(p=>p.x===result.site.x&&p.y===result.site.y),`seed ${seed}: the chosen spot is valid by the game's rules`);if(result.added)added++;
  }
  assert.ok(added<20,`most worlds keep their deposits (${added} added)`);
});

test('the reported world MKW…-SU24BGPY: the nearest Iron Deposit (18 tiles) already had free spots; the generator keeps it',()=>{
  const {s,result}=newWorld(parseInt('SU24BGPY',36));assert.equal(result.added,false);const d=nearestIron(s),c=castleCentre(s);
  const far=Math.hypot(d.x+1-c.x,d.y+1-c.y);/* Generator 6 (rocks lean to hills) makes another world of this seed: its nearest Iron Deposit is ~28 tiles away (18 in generator 5). */assert.ok(far>14&&far<32,'within reach of the Castle');assert.ok(mineSpots(s,d).length>=1);
});

test('a nearest Iron Deposit walled in by rock gets a new Iron Deposit with a free spot nearer to the Castle',()=>{
  const terrain=Array.from({length:100},()=>Array(100).fill(0));
  // A deposit at (66,48), 16 tiles east of the Castle, inside a rock ring.
  for(let y=42;y<=55;y++)for(let x=60;x<=73;x++)if(!(x>=66&&x<=67&&y>=48&&y<=49)&&Math.max(Math.abs(x-66.5),Math.abs(y-48.5))<=6.5)terrain[y][x]=1;
  const s=workerScene(terrain,{logistics:true,naturalResources:true,construction:true,gameSettings:gameSettings(NEW_GAME_DEFAULTS),start:PLAYER_START});s.workerSystem.unsubscribe();s.fog.setEnabled(false);
  const old={id:'deposit-90',kind:'deposit',remaining:80,max:80,boundBuildingId:null};s.addResource(s.objectRegistry.require('iron_deposit'),{x:66,y:48},old);
  assert.equal(s.naturalResources.mining.ironMineSite(s.naturalResources.byId.get('deposit-90')),null,'walled in');
  const {deposit,site,added}=s.naturalResources.mining.ensureIronMine(worldStreams(42)('start-iron-mine'));
  assert.equal(added,true);assert.notEqual(deposit.natural.id,'deposit-90');assert.equal(deposit.type,'iron_deposit');assert.equal(nearestIron(s),deposit,'the new one is the nearest');
  const c=castleCentre(s),d=Math.hypot(deposit.x+1-c.x,deposit.y+1-c.y);assert.ok(d>=START_IRON_MINE.min&&d<=START_IRON_MINE.max,`${d}`);
  assert.ok(mineSpots(s,deposit).some(p=>p.x===site.x&&p.y===site.y));assert.ok(deposit.natural.remaining>=60&&deposit.natural.remaining<=120);
});

test('m-dul-na-lozisku: an Iron Mine stands over its deposit; beside it the game says it must overlap',()=>{
  setLanguage('en',{persist:false});const terrain=Array.from({length:100},()=>Array(100).fill(0));
  const s=workerScene(terrain,{logistics:true,naturalResources:true,construction:true});s.workerSystem.unsubscribe();s.fog.setEnabled(false);s.terrainGrid=terrain.map(r=>[...r]);
  s.addResource(s.objectRegistry.require('iron_deposit'),{x:60,y:40},{id:'deposit-1',kind:'deposit',remaining:80,max:80,boundBuildingId:null});
  const mine=s.objectRegistry.require('iron_mine'),place=a=>placementError(s.map,a,s.resourceOccupancy,s.reservedTiles(),mine,s.buildings,{status:()=>({unlocked:true})});
  assert.equal(place({x:59,y:39}),null,'over the deposit is valid');assert.ok(place({x:56,y:40}),'beside it is not');
  assert.equal(mineSpotError(s,{x:56,y:40},mine,'whatever'),'whatever','no beside-the-deposit reasons any more');void siteObstacle;void SITE_REASONS;void provisionalMineError;void knownPlacementError;void isProvisional;
});

test('a provisional blueprint cancelled for an obstacle is a notice at once, with the reason and the site as camera target; not repeated',()=>{
  setLanguage('en',{persist:false});const terrain=Array.from({length:100},()=>Array(100).fill(0));terrain[50][81]=1;
  const s=workerScene(terrain,{construction:true});s.terrainGrid=terrain.map(r=>[...r]);s.fog.setEnabled(true);s.fog.update();s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.foodIssues=()=>[];
  const d=s.objectRegistry.require('house');Object.entries(d.cost).forEach(([r,k])=>s.inventory.add(r,k));
  const r=placeBuilding({map:s.map,anchor:{x:80,y:49},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true,provisional:true});assert.ifError(r.error);s.constructionSystem.plan(r.building);
  s.fog.registerSource('scout',()=>({center:{x:81,y:50},radius:5}));s.tick(50);s.tick(50);assert.equal(s.buildings.includes(r.building),false,'cancelled');
  const row=s.diagnostics.active().find(i=>i.reason==='buildCancelled');assert.ok(row,'in Notices at once');assert.equal(row.category,'construction');
  assert.deepEqual(row.params,{type:'house',obstacle:'rock',tile:{x:80,y:49}});assert.equal(noticeText(s,row),'Construction cancelled: House – Rock. Materials returned.');
  setLanguage('cs',{persist:false});assert.equal(noticeText(s,row),'Stavba zrušena: Dům – Skála. Materiál se vrátil.');setLanguage('en',{persist:false});
  for(let i=0;i<10;i++){s.gameTime.totalElapsed+=DIAGNOSTICS.checkInterval;s.diagnostics.update();}assert.equal(s.diagnostics.active().filter(i=>i.reason==='buildCancelled').length,1,'one row');
  s.gameTime.totalElapsed+=DIAGNOSTICS.cancelledDays*s.gameTime.dayDuration;s.diagnostics.update();assert.equal(s.diagnostics.active().filter(i=>i.reason==='buildCancelled').length,0,'gone after two days');
  assert.equal(t('status.obstacleFound',{name:'House'}).length>0,true);
});
