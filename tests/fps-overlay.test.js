import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameStats,FpsOverlay,readDevSettings,saveDevSettings,FRAME_RULES } from '../src/ui/FpsOverlay.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),map:m};};
function fakeGame(){const handlers=new Set();return {renderer:{type:1},handlers,events:{on:(e,f)=>{assert.equal(e,'postrender');handlers.add(f);},off:(e,f)=>handlers.delete(f)},step(){for(const f of [...handlers])f();}};}
function fakeDocument(){const listeners=new Map(),el=(o={})=>({hidden:true,textContent:'',checked:false,...o,listeners:new Map(),addEventListener(type,f){this.listeners.set(type,f);}});
  const overlay=el(),toggle=el();return {overlay,toggle,listeners,querySelector:s=>({'#fps-overlay':overlay,'#dev-fps-toggle':toggle})[s]??null,defaultView:{addEventListener:(type,f)=>listeners.set(type,f)}};}

test('FrameStats: FPS over the last second, the slowest frame and stutters over 50 ms within 5 s',()=>{
  const s=new FrameStats();let now=0;s.frame(now);
  for(let i=0;i<60;i++){now+=16;s.frame(now);}now+=120;s.frame(now);now+=70;s.frame(now);for(let i=0;i<30;i++){now+=16;s.frame(now);}
  const r=s.summary(now);assert.equal(r.worstMs,120);assert.equal(r.stutters,2);
  let last=0;for(let k=0;k<s.size;k++){if(s.at[(s.head+k)%s.at.length]>=now-1000)last++;}assert.equal(r.fps,last);
  now+=FRAME_RULES.windowMs+1;s.frame(now);const later=s.summary(now);assert.equal(later.stutters,1,'old stutters leave the 5 s window; the long gap itself counts');
  const small=new FrameStats(4);for(let i=0;i<=10;i++)small.frame(i*10);assert.equal(small.size,4,'fixed ring buffer');
});

test('developer settings live in their own browser key and survive a reload; broken storage falls back',()=>{
  const st=memory();st.setItem('newgame.settings','{"fogOfWar":true}');assert.deepEqual(readDevSettings(st),{showFps:false});
  saveDevSettings(st,{showFps:true});assert.deepEqual(readDevSettings(st),{showFps:true});assert.equal(st.map.get('newgame.settings'),'{"fogOfWar":true}','game settings untouched');
  assert.deepEqual(readDevSettings({getItem(){throw new Error('blocked');}}),{showFps:false});saveDevSettings(undefined,{showFps:true});
});

test('FPS overlay: off adds no game-loop listener; the toggle and F3 switch it; the text refreshes at most 4× per second',()=>{
  const st=memory(),game=fakeGame(),doc=fakeDocument();let now=0;
  const o=new FpsOverlay(game,{storage:st,document:doc,now:()=>now,camera:()=>({zoom:.5})});
  assert.equal(game.handlers.size,0);assert.equal(doc.overlay.hidden,true);
  doc.toggle.checked=true;doc.toggle.listeners.get('change')();assert.equal(game.handlers.size,1);assert.equal(doc.overlay.hidden,false);assert.deepEqual(readDevSettings(st),{showFps:true});
  let writes=0;const el=doc.overlay;let text='';Object.defineProperty(el,'textContent',{get:()=>text,set:v=>{text=v;writes++;}});
  for(let i=0;i<=60;i++){now=i*16;game.step();}
  assert.ok(writes>=1&&writes<=Math.ceil(960/FRAME_RULES.refreshMs)+1,`${writes} DOM writes`);assert.match(text,/FPS/);assert.match(text,/Canvas/);assert.match(text,/0\.50/);
  let prevented=false;doc.listeners.get('keydown')({key:'F3',repeat:false,preventDefault:()=>prevented=true});assert.equal(prevented,true);assert.equal(game.handlers.size,0);assert.equal(doc.overlay.hidden,true);assert.equal(doc.toggle.checked,false);assert.deepEqual(readDevSettings(st),{showFps:false});
  doc.listeners.get('keydown')({key:'F3',repeat:false,preventDefault(){}});const again=new FpsOverlay(fakeGame(),{storage:st,document:fakeDocument()});assert.equal(again.enabled,true,'the choice survives a reload');
  o.destroy();assert.equal(game.handlers.size,0);
});
