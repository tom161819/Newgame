import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../scripts/png-lite.mjs';
import { NATURE_ATLAS } from '../src/data/natureArt.js';
import { depositLook,outcropLook,bushLook,cropLook,natureFrame } from '../src/game/natureArt.js';

const approvals=JSON.parse(readFileSync(new URL('../art/approvals.json',import.meta.url),'utf8')).assets;
const atlas=decodePng(readFileSync(new URL(`../public${NATURE_ATLAS.src}`,import.meta.url)));

test('g-nasadit-prirodu: every atlas frame is an approved export, pixel for pixel, with its metadata origin', () => {
  assert.equal(atlas.width,NATURE_ATLAS.width);assert.equal(atlas.height,NATURE_ATLAS.height);
  assert.ok(Object.keys(NATURE_ATLAS.frames).length>=60);
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
  assert.equal(bushLook('bush_scrub',1,1,'Summer'),null,'the desert scrub keeps its art');
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
