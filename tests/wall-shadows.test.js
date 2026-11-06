import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { isShadowPixel,splitPixels } from '../src/game/wallShadows.js';
import { APPROVED_WALL_ART } from '../src/data/objects/approvedArt.js';

// Minimal RGBA PNG decoder (8-bit, colour type 6) for the approved kit.
function png(file){const b=readFileSync(file);let o=8,w,h,idat=[];while(o<b.length){const len=b.readUInt32BE(o),type=b.toString('ascii',o+4,o+8),d=b.subarray(o+8,o+8+len);if(type==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);assert.equal(d[8],8);assert.equal(d[9],6);}if(type==='IDAT')idat.push(d);o+=12+len;}
  const raw=inflateSync(Buffer.concat(idat)),out=new Uint8ClampedArray(w*h*4),bpp=4,stride=w*4;
  for(let y=0;y<h;y++){const f=raw[y*(stride+1)],row=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));for(let x=0;x<stride;x++){const a=x>=bpp?out[y*stride+x-bpp]:0,up=y?out[(y-1)*stride+x]:0,c=x>=bpp&&y?out[(y-1)*stride+x-bpp]:0;let v=row[x];
    if(f===1)v+=a;else if(f===2)v+=up;else if(f===3)v+=(a+up)>>1;else if(f===4){const p=a+up-c,pa=Math.abs(p-a),pb=Math.abs(p-up),pc=Math.abs(p-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?up:c;}out[y*stride+x]=v;}}
  return {w,h,data:out};}

test('wall shadow pixels: only near-black, semi-transparent pixels count as shadow',()=>{
  assert.equal(isShadowPixel(0,0,0,80),true);assert.equal(isShadowPixel(30,28,20,120),true);
  assert.equal(isShadowPixel(0,0,0,0),false,'empty');assert.equal(isShadowPixel(0,0,0,255),false,'opaque outline stays on the wall');assert.equal(isShadowPixel(120,110,90,80),false,'a soft stone edge stays');
  const data=new Uint8ClampedArray([0,0,0,80, 150,140,120,255, 10,10,10,200]),shadow=splitPixels(data);
  assert.deepEqual([...data],[0,0,0,0, 150,140,120,255, 10,10,10,200]);assert.deepEqual([...shadow],[0,0,0,80, 0,0,0,0, 0,0,0,0]);
});

test('every approved wall kit piece splits into an opaque body and a separate ground shadow',()=>{
  for(const [piece,art]of Object.entries(APPROVED_WALL_ART)){
    const {data}=png(new URL(`../public${art.sprite}`,import.meta.url)),before=data.filter((v,i)=>i%4===3&&v>0).length,shadow=splitPixels(data);
    const body=data.filter((v,i)=>i%4===3&&v>0).length,shade=shadow.filter((v,i)=>i%4===3&&v>0).length;
    assert.equal(body+shade,before,piece);assert.ok(shade>100,`${piece} has a baked shadow (${shade} px)`);assert.ok(body>400,`${piece} keeps its stone (${body} px)`);
  }
});
