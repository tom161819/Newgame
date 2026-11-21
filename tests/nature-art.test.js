import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../scripts/png-lite.mjs';
import { NATURE_ATLAS } from '../src/data/natureArt.js';
import { depositLook,outcropLook,bushLook,cropLook,natureFrame,thicketLook,rockGroupLook } from '../src/game/natureArt.js';
import { NATURE_GROUP_SIZES } from '../src/game/natureGroups.js';

const approvals=JSON.parse(readFileSync(new URL('../art/approvals.json',import.meta.url),'utf8')).assets;
const atlas=decodePng(readFileSync(new URL(`../public${NATURE_ATLAS.src}`,import.meta.url)));

test('g-nasadit-prirodu: every atlas frame is an approved export, pixel for pixel, with its metadata origin', () => {
  assert.equal(atlas.width,NATURE_ATLAS.width);assert.equal(atlas.height,NATURE_ATLAS.height);
  assert.ok(Object.keys(NATURE_ATLAS.frames).length>=60);/* 21 Nov 2026: the old shrub fallbacks not chosen in the Studio are no longer packed */assert.match(NATURE_ATLAS.src,/^\/assets\/nature\/nature-atlas\.v2\.png$/);
  for(const [variant,f] of Object.entries(NATURE_ATLAS.frames)){
    const asset=f.artSource.split('/')[2],record=approvals[asset].variants[variant];
    assert.equal(record.status,'approved',variant);assert.equal(f.artSource,`art/sprites/${asset}/${variant}.v${record.version}.json`);
    const meta=JSON.parse(readFileSync(new URL(`../${f.artSource}`,import.meta.url),'utf8')),png=decodePng(readFileSync(new URL(`../${f.artSource.replace(/\.json$/,'.png')}`,import.meta.url)));
    assert.deepEqual([f.w,f.h],[png.width,png.height],variant);assert.ok(Math.abs(f.origin.x-meta.origin.x)<1e-4&&Math.abs(f.origin.y-meta.origin.y)<1e-4,variant);
    for(let y=0;y<f.h;y++)assert.deepEqual(atlas.data.subarray(((f.y+y)*atlas.width+f.x)*4,((f.y+y)*atlas.width+f.x+f.w)*4),png.data.subarray(y*f.w*4,(y+1)*f.w*4),`${variant} row ${y}`);
  }
});

test('g-nasadit-prirodu: rejected variants never reach the game', () => {
  for(const [asset,{variants}] of Object.entries(approvals))for(const [variant,r] of Object.entries(variants))if(r.status!=='approved')assert.equal(natureFrame(variant),null,`${asset}/${variant}`);
});

test('g-nasadit-prirodu: deposits shrink as they are mined, snow in winter, and every look is a packed frame', () => {
  const look=(o)=>depositLook({type:'stone_deposit',id:'deposit-1',max:120,...o});
  assert.match(look({remaining:120}),/^stone-deposit-medium-(granite|mossy)-5$/);
  assert.match(look({remaining:20}),/^stone-deposit-small-/);
  assert.match(look({remaining:0,depleted:true}),/-3$/);
  assert.match(look({remaining:120,season:'Winter'}),/winter$/);
  assert.equal(depositLook({type:'iron_deposit',id:'d',remaining:100,max:100}),'iron-deposit-medium-red-5');
  for(const remaining of [120,70,30,0])for(const season of ['Spring','Summer','Autumn','Winter'])for(const type of ['stone_deposit','iron_deposit'])
    assert.ok(natureFrame(depositLook({type,id:`d${remaining}`,remaining,max:120,season})),`${type} ${remaining} ${season}`);
});

test('g-nasadit-prirodu: rocks, shrubs and crop tiles pick packed frames for every season and stage', () => {
  for(const season of ['Spring','Summer','Autumn','Winter']){
    for(let i=0;i<20;i++)assert.ok(natureFrame(outcropLook(i,i*3,season)));
    for(const type of ['bush_meadow','bush_berry','bush_flowering'])for(let i=0;i<10;i++)assert.ok(natureFrame(bushLook(type,i,7,season)),`${type} ${season}`);
    for(const type of ['wheat_field','orchard'])for(const stage of [0,1,2,3])assert.ok(natureFrame(cropLook(type,stage,season,{x:stage,y:5})),`${type} ${stage} ${season}`);
  }
  // Owner 18 Nov 2026: Blender bushes – one model and view per tile the whole year, the tile's season; the desert scrub too.
  for(const type of ['bush_meadow','bush_berry','bush_flowering','bush_scrub'])for(let i=0;i<10;i++){
    const looks=['Spring','Summer','Autumn','Winter'].map(season=>bushLook(type,i,4,season));
    for(const [k,look] of looks.entries())assert.match(look,new RegExp(`-${['spring','summer','autumn','winter'][k]}-(000|090|180|270)$`),type);
    assert.equal(new Set(looks.map(l=>l.replace(/-(spring|summer|autumn|winter)-/,'-'))).size,1,'same model and view all year');
  }
  assert.match(bushLook('bush_scrub',1,1,'Summer'),/^bush-scrub-summer-/);
  for(let i=0;i<40;i++)assert.match(bushLook('bush_berry',i,2,'Summer'),/^(shrubs-(rosehip|bramble)-[123]|bush-berry)-/);
  assert.equal(cropLook('wheat_field',3,'Summer',{x:0,y:0}).startsWith('wheat-field-tile-ripe'),true);
  assert.equal(cropLook('orchard',0,'Winter',{x:0,y:0}).startsWith('orchard-tree-winter'),true);
});

test('Fishers walk with their approved look: the walk sheets are the approved exports, byte for byte', async () => {
  const { FISHER_WALK_ART,FISHER_LOOKS } = await import('../src/data/fisherWalkArt.js');
  assert.deepEqual(FISHER_LOOKS,{male:'fisher-male',female:'fisher-female'});
  for(const look of Object.values(FISHER_LOOKS)){
    const art=FISHER_WALK_ART[look],png=readFileSync(new URL(`../${art.artSource.replace(/\.json$/,'.walk.png')}`,import.meta.url));
    assert.equal(approvals.fisher.variants[look].status,'approved');
    assert.equal(art.walkSrc,`data:image/png;base64,${png.toString('base64')}`);
    const sheet=decodePng(png);assert.equal(sheet.width,art.walk.frameWidth*3);assert.equal(sheet.height,art.walk.frameHeight*8);
  }
});

test('velke-prirodni-objekty: every approved thicket, ridge, 2 × 2 rock and 3 × 3 deposit variant is packed; their footprints fit the game objects', () => {
  const sizes={'thicket-2x1':[2,1],'thicket-2x2':[2,2],'thicket-3x2':[3,2],'rock-ridge':[4,2],'rock-obstacles-medium':[2,2],'stone-deposit-large':[3,3],'iron-deposit-large':[3,3]};
  for(const [asset,[w,h]] of Object.entries(sizes))for(const [variant,record] of Object.entries(approvals[asset].variants)){
    if(record.status!=='approved'){assert.equal(natureFrame(variant),null,variant);continue;}
    const frame=natureFrame(variant);assert.ok(frame,variant);
    const meta=JSON.parse(readFileSync(new URL(`../${frame.artSource}`,import.meta.url),'utf8'));assert.deepEqual([meta.footprint.width,meta.footprint.height],[w,h],variant);
  }
  for(const kind of Object.keys(NATURE_GROUP_SIZES))for(const [w,h] of NATURE_GROUP_SIZES[kind])
    assert.ok(Object.values(sizes).some(([a,b])=>a===w&&b===h),`${kind} ${w}x${h} has art`);
});

test('velke-prirodni-objekty: thickets are hazel or bramble in spring and summer, autumn and winter looks; rock groups and large deposits by season and fill', () => {
  for(const [w,h] of NATURE_GROUP_SIZES.thicket){
    const tiles=w*h,hazel=Array(tiles).fill('bush_meadow'),bramble=Array(tiles).fill('bush_berry');
    // Owner 18 Nov 2026: the Blender thickets, by kind and season; a long thicket only in views 000 and 180.
    for(const season of ['Spring','Summer','Autumn','Winter'])for(let i=0;i<8;i++){
      const s=season.toLowerCase(),a=thicketLook({x:i,y:3,w,h},hazel,season),b=thicketLook({x:i,y:3,w,h},bramble,season),m=thicketLook({x:i,y:3,w,h},[...hazel.slice(1),'bush_berry'],season);
      assert.match(a,new RegExp(`^thicket-${w}x${h}-hazel-${s}-(000|090|180|270)$`));assert.match(b,new RegExp(`^thicket-${w}x${h}-bramble-${s}-`));if(tiles>2)assert.match(m,new RegExp(`^thicket-${w}x${h}-mixed-${s}-`));
      if(w!==h)assert.match(a,/-(000|180)$/);assert.ok(natureFrame(a)&&natureFrame(b)&&natureFrame(m));
    }
  }
  for(const season of ['Spring','Summer','Autumn','Winter'])for(let i=0;i<12;i++){
    const ridge=rockGroupLook({x:i,y:i*7,w:4,h:2},season),obstacle=rockGroupLook({x:i*3,y:i,w:2,h:2},season);
    assert.match(ridge,season==='Winter'?/^rock-ridge-winter$/:/^rock-ridge-(granite|slate)$/);assert.match(obstacle,season==='Winter'?/-winter$/:/^rock-obstacles-medium-/);
    assert.ok(natureFrame(ridge)&&natureFrame(obstacle));
  }
  assert.equal(rockGroupLook({x:0,y:0,w:3,h:2},'Summer'),null,'3 × 2 rocks stay single rocks');
  const large=(o)=>depositLook({type:'stone_deposit_large',id:'deposit-9',max:300,...o});
  assert.equal(large({remaining:300}),'stone-deposit-large-granite-7');assert.equal(large({remaining:201}),'stone-deposit-large-granite-7');
  assert.equal(large({remaining:300,season:'Winter'}),'stone-deposit-large-granite-winter');
  assert.match(large({remaining:200}),/^stone-deposit-medium-/,'two thirds or less: the medium pile');assert.match(large({remaining:60}),/^stone-deposit-small-/);
  assert.equal(depositLook({type:'iron_deposit_large',id:'d',remaining:240,max:240}),'iron-deposit-large-red-7');
  assert.match(depositLook({type:'iron_deposit_large',id:'d',remaining:100,max:240}),/^iron-deposit-medium-red-/);
  for(const remaining of [300,150,30,0])for(const season of ['Spring','Summer','Autumn','Winter'])for(const type of ['stone_deposit_large','iron_deposit_large'])
    assert.ok(natureFrame(depositLook({type,id:`d${remaining}`,remaining,max:300,season})),`${type} ${remaining} ${season}`);
});

test('owner 18 Nov 2026: the Blender bush atlas holds 28 models x 4 seasons x 4 views, each frame a copy of its render', async () => {
  const { BUSH_ATLAS }=await import('../src/data/bushArt.js');
  const names=Object.keys(BUSH_ATLAS.frames);assert.equal(names.length,448);
  const atlas=decodePng(readFileSync(new URL('../public/assets/nature/bush-atlas.v1.png',import.meta.url)));
  assert.equal(atlas.width,BUSH_ATLAS.width);assert.equal(atlas.height,BUSH_ATLAS.height);
  for(const name of ['shrubs-hazel-2-summer-090','thicket-3x2-mixed-winter-180','bush-scrub-autumn-270']){
    const f=BUSH_ATLAS.frames[name],m=/^(.*)-(spring|summer|autumn|winter)-(\d{3})$/.exec(name);
    const png=decodePng(readFileSync(new URL(`../art/sprites/bush-renders/${m[1]}/${m[2]}-${m[3]}.png`,import.meta.url)));
    assert.equal(png.width,f.w);assert.equal(png.height,f.h);
    for(let y=0;y<f.h;y+=3)for(let x=0;x<f.w;x+=3)for(let c=0;c<4;c++)assert.equal(atlas.data[((f.y+y)*atlas.width+f.x+x)*4+c],png.data[(y*f.w+x)*4+c],name);
    assert.ok(f.origin.x>0&&f.origin.x<1&&f.origin.y>0&&f.origin.y<=1);
  }
});
