// Plan m-nasadit-schvalenou-grafiku: the art deployed with this update is approved, byte for byte the Studio export,
// with the origin from its metadata; nothing unapproved is deployed. Plus the pure picks the views use.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { APPROVED_DEPLOY_ART as ART } from '../src/data/objects/approvedDeployArt.js';
import { wildLook,wildPose,wagonVariant,barrowVariant,caravanArt,caravanStyle,childLook,childPose,childPlay,childPlayFrame,feedIcon,requestTexture } from '../src/game/deployArt.js';
import { transitionIndex } from '../src/game/TerrainRenderer.js';
import { objectDefinitions } from '../src/data/objects/index.js';

const root=new URL('../',import.meta.url);
const approvals=JSON.parse(readFileSync(new URL('art/approvals.json',root),'utf8')).assets;
const sha=file=>createHash('sha256').update(readFileSync(new URL(file.replace(/^\//,''),root))).digest('hex');
const json=file=>JSON.parse(readFileSync(new URL(file,root),'utf8'));
// Every deployed file: [public path, art source json, the export file it copies, expected origin or null].
function deployed(){
  const out=[];const exportOf=(src,artSource)=>`${artSource.slice(0,artSource.lastIndexOf('/'))}/${src.slice(src.lastIndexOf('/')+1)}`;
  const still=(a,origin=true)=>out.push({src:a.src,artSource:a.artSource,origin:origin?a.origin:null,from:exportOf(a.src,a.artSource)});
  for(const s of Object.values(ART.wild))for(const look of Object.values(s.looks)){still(look);for(const p of Object.values(look.poses))still(p);}
  for(const a of [...Object.values(ART.wagon),...Object.values(ART.barrow)])still(a);
  for(const style of Object.values(ART.caravan))for(const a of Object.values(style))still(a);
  for(const look of Object.values(ART.children.looks)){out.push({src:look.sheet,artSource:look.artSource,walk:look.walk,from:exportOf(look.sheet,look.artSource)});for(const p of Object.values(look.poses))still(p);
    for(const g of Object.values(look.play??{}))out.push({src:g.sheet,artSource:g.artSource,play:g,from:exportOf(g.sheet,g.artSource)});}
  for(const f of Object.values(ART.fishing))out.push({src:f.sheet,artSource:f.artSource,fishing:f,from:exportOf(f.sheet,f.artSource)});
  for(const i of Object.values(ART.nightIcons))for(const src of [i.png,i.png2x])out.push({src,artSource:i.artSource,from:exportOf(src,i.artSource)});
  for(const z of Object.values(ART.zones))for(const a of Object.values(z))out.push({src:a.strip,artSource:a.artSource,from:exportOf(a.strip,a.artSource)});
  for(const g of Object.values(ART.shore))for(const src of g.tiles)out.push({src,artSource:g.artSource,from:exportOf(src,g.artSource)});
  for(const t of Object.values(ART.transitions))out.push({src:t.strip,artSource:t.artSource,from:exportOf(t.strip,t.artSource)});
  return out;
}

test('every deployed file exists, is approved and equals the Studio export byte for byte (sha256), origin from the metadata',()=>{
  const files=deployed();assert.ok(files.length>=120,`${files.length} files`);
  for(const f of files){
    const meta=json(f.artSource),record=approvals[meta.assetId]?.variants?.[meta.variantId];
    assert.equal(record?.status,'approved',`${meta.variantId} is approved`);assert.equal(record.version,meta.version,`${meta.variantId}: the approved version`);
    assert.ok(existsSync(new URL(`public${f.src}`,root)),`${f.src} exists`);
    assert.equal(sha(`public${f.src}`),sha(f.from),`${f.src} equals ${f.from}`);
    if(f.origin){const o=meta.origin;assert.ok(Math.abs(f.origin.x-o.x)<1e-5&&Math.abs(f.origin.y-o.y)<1e-5,`${f.src}: origin ${JSON.stringify(f.origin)} vs ${JSON.stringify(o)}`);}
    if(f.walk){assert.equal(f.walk.frameWidth,meta.walk.frameWidth);assert.equal(f.walk.frameHeight,meta.walk.frameHeight);assert.ok(Math.abs(f.walk.origin.y-meta.walk.origin.y)<1e-5);}
    if(f.play){const a=meta.anim;assert.equal(f.play.fps,a.fps);assert.equal(f.play.columns,a.columns.length);assert.equal(f.play.frameWidth,a.frameWidth);assert.equal(f.play.frameHeight,a.frameHeight);
      assert.deepEqual(f.play.frames,a.clips[a.loop[0]]);assert.ok(Math.abs(f.play.origin.x-a.origin.x)<1e-5&&Math.abs(f.play.origin.y-a.origin.y)<1e-5,`${f.src}: anim origin`);}
    if(f.fishing){const a=meta.anim;assert.deepEqual(f.fishing.clips,a.clips);assert.equal(f.fishing.fps,a.fps);assert.equal(f.fishing.columns,a.columns.length);assert.equal(f.fishing.frameWidth,a.frameWidth);assert.ok(Math.abs(f.fishing.origin.y-a.origin.y)<1e-5);}
  }
});

test('nothing unapproved is deployed: every file in the deployed folders is listed and approved',()=>{
  const listed=new Set(deployed().map(f=>f.src));
  for(const folder of ['characters/wildlife','vehicles/horse_wagon','vehicles/wheelbarrow','vehicles/caravan','characters/children','characters/fishing','ui/night-icons','terrain/grass/zones','terrain/shore','terrain/transitions'])
    for(const name of readdirSync(new URL(`public/assets/${folder}/`,root)))assert.ok(listed.has(`/assets/${folder}/${name}`),`${folder}/${name} is an approved, listed export`);
  // The provisional World v2 ground is gone: ford, mud and pebbles use the approved shore tiles.
  for(const id of ['ford_shallows','mud_bank','shore_rocks']){const d=objectDefinitions.find(x=>x.id===id);assert.deepEqual(d.spriteVariants,ART.shore[id].tiles);assert.equal(d.provisional,undefined);}
  assert.deepEqual(ART.fire.params,json('art/effects/fire.json').params,'the building fire uses the approved Fire Lab values');
});

test('looks and poses: seeded by id, poses only where the look has them, young and two-horse variants are not used',()=>{
  assert.equal(wildLook('deer',7),wildLook('deer',7));
  const seen=new Set();for(let i=0;i<60;i++)seen.add(wildLook('horse',i));assert.ok(seen.size>=6,'horses vary');
  assert.ok(!Object.keys(ART.wild.deer.looks).includes('deer-calf')&&!Object.keys(ART.wild.wild_boar.looks).includes('boar-piglet'));
  const boar=ART.wild.wild_boar.looks['boar-boar'],sow=ART.wild.wild_boar.looks['boar-sow'];
  assert.equal(wildPose(boar,{attacking:true}),'attack');assert.equal(wildPose(sow,{attacking:true}),null);
  assert.equal(wildPose(ART.wild.horse.looks['horse-bay'],{ridden:true}),'saddled');assert.equal(wildPose(ART.wild.horse.looks['horse-grey'],{tamed:true}),'harness');
  assert.equal(wildPose(ART.wild.rabbit.looks['hare-brown'],{moving:false}),'sit');assert.equal(wildPose(ART.wild.rabbit.looks['hare-brown'],{moving:true}),null);
  assert.equal(wagonVariant(null,1),'farm-empty');assert.equal(wagonVariant({resource:'stone',amount:5},1),'tumbril-stone');assert.equal(wagonVariant({resource:'bread',amount:5},1),'covered');
  assert.ok(['timber','farm-wood'].includes(wagonVariant({resource:'wood',amount:5},3)));assert.ok(!Object.keys(ART.wagon).some(k=>k.startsWith('pair')));
  assert.equal(barrowVariant(null),'empty');assert.equal(barrowVariant({resource:'iron',amount:2}),'ironbars');assert.equal(barrowVariant({resource:'flour',amount:2}),'mixed');
  for(let id=1;id<20;id++){const style=ART.caravan[caravanStyle(id)];assert.equal(caravanArt(id,{trading:true}),style.unloading??style.full);assert.equal(caravanArt(id,{full:false}),style.empty??style.full);}
  assert.equal(childLook({sex:'girl',look:4}),'child-girl-kerchief');
  assert.equal(childPose({state:'out',activity:{kind:'swing'}},'child-girl-kerchief'),'swing');assert.equal(childPose({state:'out',activity:{kind:'swing'}},'child-boy-ball'),null);
  assert.equal(feedIcon('wolves-near:3').png,ART.nightIcons.wolves.png);assert.equal(feedIcon('trade:auto:1'),null);
  assert.equal(transitionIndex([1,0,0,0]),1);assert.equal(transitionIndex([0,.5,1,.75]),14);
});

test('a missing or failed texture is queued once and keeps the fallback',()=>{
  const queued=[];const scene={textures:{exists:()=>false},load:{image:k=>queued.push(k),spritesheet:k=>queued.push(k),isLoading:()=>true,start(){}}};
  assert.equal(requestTexture(scene,'a','/assets/x.png'),false);assert.equal(requestTexture(scene,'a','/assets/x.png'),false);assert.deepEqual(queued,['a']);
});

test('children\'s game loops: all eight approved sheets are deployed and each game maps to the loop of its look',()=>{
  const sheets=Object.values(ART.children.looks).flatMap(l=>Object.values(l.play??{}).map(g=>g.artSource.match(/child-play-(.+)\.v1\.json$/)[1])).sort();
  assert.deepEqual(sheets,['ball','hay','hoop','snowball','snowman','swing','tag','tag-girl']);
  for(const name of sheets)assert.equal(approvals.child.variants[`child-play-${name}`].status,'approved');
  const sheetOf=(look,kind,state='out')=>childPlay({state,activity:{kind}},look)?.sheet.match(/child-play-(.+)\.v1\.anim\.png$/)?.[1]??null;
  // The loop is drawn on the look that had the game's key frame: tag = the tunic boy chasing, tag-girl = the braid girl catching.
  const expected={'child-boy-tunic':{tag:'tag',snowball:'snowball'},'child-boy-cap':{hoop:'hoop',hay:'hay'},'child-boy-ball':{ball:'ball'},
    'child-girl-braid':{tag:'tag-girl',snowman:'snowman'},'child-girl-kerchief':{swing:'swing'},'child-girl-basket':{}};
  for(const [look,games] of Object.entries(expected))for(const kind of ['tag','hoop','ball','swing','snowball','snowman','hay','shore'])assert.equal(sheetOf(look,kind),games[kind]??null,`${look} playing ${kind}`);
  assert.equal(childLook({sex:'girl',look:0}),'child-girl-braid');assert.equal(childLook({sex:'boy',look:3}),'child-boy-tunic');
  assert.equal(sheetOf('child-boy-tunic','tag','fleeing'),null,'fleeing keeps the run key frame');assert.equal(childPlay({state:'out',activity:null},'child-boy-tunic'),null);
  // Frames: row = facing (8 rows), the clip's two columns at 4 fps.
  const tag=ART.children.looks['child-boy-tunic'].play.tag;assert.equal(tag.fps,4);
  assert.equal(childPlayFrame(tag,0,0),0);assert.equal(childPlayFrame(tag,0,250),1);assert.equal(childPlayFrame(tag,0,500),0);assert.equal(childPlayFrame(tag,7,250),15);
});

// m-svet-vzhled-2 (32): the Fisherman's Hut uses the approved, preferred stilt hut (v2) instead of the temporary drawing.
test('32: the Fisherman\'s Hut is the approved GPT fishing hut (owner 13 Nov 2026), byte for byte, anchored at the front corner, 3 × 3 like its export',async()=>{
  const { APPROVED_BUILDING_ART }=await import('../src/data/objects/approvedArt.js');
  const art=APPROVED_BUILDING_ART.fisherman_hut,d=objectDefinitions.find(o=>o.id==='fisherman_hut'),meta=json(art.artSource),repo=approvals['fisherman-hut'];
  assert.equal(repo.preferred,'fisherman-hut-gpt-0');assert.equal(meta.variantId,repo.preferred);
  const record=repo.variants[meta.variantId];assert.equal(record.status,'approved');assert.equal(record.version,meta.version);assert.equal(record.specHash,meta.specHash);
  assert.equal(d.renderMode,'sprite');assert.equal(d.renderer,'workplace','the procedural hut stays as the fallback if the image fails');
  assert.equal(d.sprite,'/assets/buildings/fisherman_hut/fisherman-hut-gpt-0.v1.png');assert.ok(existsSync(new URL(`public${d.sprite}`,root)));
  assert.equal(sha(`public${d.sprite}`),sha('art/sprites/fisherman-hut/fisherman-hut-gpt-0.v1.png'));
  assert.deepEqual(d.origin,meta.baseOrigin,'origin = the export base (footprint front corner)');assert.equal(d.visualHeight,meta.visualHeight);assert.deepEqual(d.lights??[],meta.gameLights);
  const spec=json('art/assets/buildings/fisherman-hut/asset.json');
  assert.deepEqual([d.width,d.height],[3,3]);assert.deepEqual(d.legacyFootprint,{width:2,height:2});assert.deepEqual([meta.footprint.width,meta.footprint.height],[3,3]);
});
