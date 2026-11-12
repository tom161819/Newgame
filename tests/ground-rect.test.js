import test from 'node:test';
import assert from 'node:assert/strict';
import { paintContinuousGround } from '../src/render/continuousGround.js';

// A canvas context stand-in: pixels in one array, getImageData / putImageData by rectangle.
const fakeContext=(W,H)=>{const data=new Uint8ClampedArray(W*H*4);return {data,
  getImageData(x,y,w,h){const out=new Uint8ClampedArray(w*h*4);for(let r=0;r<h;r++)out.set(data.subarray(((y+r)*W+x)*4,((y+r)*W+x+w)*4),r*w*4);return {data:out,width:w,height:h};},
  putImageData(image,x,y){for(let r=0;r<image.height;r++)data.set(image.data.subarray(r*image.width*4,(r+1)*image.width*4),((y+r)*W+x)*4);}};};
const scene=()=>{const W=120,H=66,toWorld=(px,py)=>[10+px/64+py/32,10+py/32-px/64];
  return {W,H,options:{width:W,height:H,toWorld,isGrass:(x,y)=>(x+y)%7!==0,zoneAt:(x,y)=>(x*3+y)%3,depthAt:(x,y)=>(x+y)%7===0?1:-1,step:6}};};

test('performance-2: a rectangle of the ground paints the same pixels as the whole picture does there, and nothing outside it',()=>{
  const {W,H,options}=scene(),whole=fakeContext(W,H);paintContinuousGround(whole,options);
  for(const rect of [{x:0,y:0,w:W,h:36},{x:30,y:18,w:42,h:24},{x:66,y:36,w:54,h:30},{x:7,y:5,w:13,h:11}]){
    const part=fakeContext(W,H);paintContinuousGround(part,{...options,rect});
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4,inside=x>=rect.x&&y>=rect.y&&x<rect.x+rect.w&&y<rect.y+rect.h;
      for(let k=0;k<4;k++){if(inside)assert.equal(part.data[o+k],whole.data[o+k],`pixel ${x},${y} channel ${k} in ${JSON.stringify(rect)}`);else assert.equal(part.data[o+k],0,`pixel ${x},${y} outside ${JSON.stringify(rect)} untouched`);}}
  }
});
test('performance-2: bands of rows one after another give the whole picture',()=>{
  const {W,H,options}=scene(),whole=fakeContext(W,H),banded=fakeContext(W,H);paintContinuousGround(whole,options);
  for(let y=0;y<H;y+=36)paintContinuousGround(banded,{...options,rect:{x:0,y,w:W,h:Math.min(36,H-y)}});
  assert.deepEqual(banded.data,whole.data);
});
