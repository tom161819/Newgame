import test from 'node:test';
import assert from 'node:assert/strict';
import { DUST, DustEmitter, scaffoldStage, activeDust } from '../src/game/ConstructionDust.js';

function fakeScene(){
  const tweens=[],images=[],img=()=>{const o={x:0,y:0,visible:true,destroyed:false};for(const m of ['setDepth','setTint','setAlpha','setScale'])o[m]=()=>o;o.setPosition=(x,y)=>{o.x=x;o.y=y;return o;};o.setVisible=v=>{o.visible=v;return o;};o.destroy=()=>{o.destroyed=true;};images.push(o);return o;};
  let texture=false;
  return {tweens,images,textures:{exists:()=>texture},make:{graphics:()=>({fillStyle(){},fillCircle(){},generateTexture(){texture=true;},destroy(){}})},add:{image:img},tweens:Object.assign(tweens,{add:cfg=>tweens.push(cfg),killTweensOf(){}})};
}

test('scaffolding waits for the first work and then grows with progress', () => {
  assert.equal(scaffoldStage({workDone:0,progress:0}),null,'a planned or supplied site shows no scaffolding');
  assert.equal(scaffoldStage({workDone:1,progress:1}),'low');
  assert.equal(scaffoldStage({workDone:50,progress:50}),'mid');
  assert.equal(scaffoldStage({workDone:90,progress:90}),'high');
});

test('dust puffs are throttled, capped per site, pooled and off with reduced motion', () => {
  const scene=fakeScene(),dust=new DustEmitter(scene,{x:10,y:12},{width:2,height:2,depth:5,random:()=>.5,reducedMotion:false});
  assert.equal(dust.emit(0),true);assert.equal(dust.emit(100),false,'next puff waits for the interval');
  let now=0;for(let i=0;i<20;i++){now+=1000;dust.emit(now);}
  assert.equal(dust.live.size,DUST.maxPerSite);assert.equal(activeDust(),DUST.maxPerSite);
  for(const cfg of [...scene.tweens])cfg.onComplete();
  assert.equal(dust.live.size,0);assert.equal(activeDust(),0);
  const created=scene.images.length;now+=1000;dust.emit(now);assert.equal(scene.images.length,created,'finished puffs are reused');
  assert.ok(scene.tweens.at(-1).alpha===0&&scene.tweens.at(-1).y<scene.images[0].y+1,'puffs rise and fade out');
  dust.destroy();assert.equal(activeDust(),0);assert.ok(scene.images.every(i=>i.destroyed));
  const calm=new DustEmitter(fakeScene(),{x:0,y:0},{reducedMotion:true});assert.equal(calm.emit(0),false);
});
