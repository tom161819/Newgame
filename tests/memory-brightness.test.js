import test from 'node:test';
import assert from 'node:assert/strict';
import { FogOfWarSystem,FOG_STYLE,MEMORY_BRIGHTNESS,clampMemoryBrightness,VISIBILITY } from '../src/systems/FogOfWarSystem.js';
import { memoryColor } from '../src/game/MapMemoryRenderer.js';
import { memoryTexture } from '../src/game/memoryTexture.js';
import { TerrainRenderer } from '../src/game/TerrainRenderer.js';
import { readSettings } from '../src/ui/SettingsPanel.js';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const fog=()=>new FogOfWarSystem({tile:{x:50,y:50},position:{x:50.5,y:50.5},definition:{gameplay:{baseSight:10}}},true);
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('#129 brightness range: 15–90 %, the default keeps the former look, invalid values fall back',()=>{
  assert.deepEqual([MEMORY_BRIGHTNESS.min,MEMORY_BRIGHTNESS.max,MEMORY_BRIGHTNESS.default],[.15,.9,FOG_STYLE.brightness]);
  assert.deepEqual([clampMemoryBrightness(0),clampMemoryBrightness(2),clampMemoryBrightness(.55),clampMemoryBrightness('x'),clampMemoryBrightness(null)],[.15,.9,.55,.3,.15]);
  assert.equal(memoryColor(0xffffff),memoryColor(0xffffff,.3));assert.ok((memoryColor(0x808080,.8)&255)>(memoryColor(0x808080,.3)&255),'remembered buildings and objects follow the slider');
});

test('#129 the slider brightens explored ground outside sight only: sight stays 1, unexplored stays unexplored',()=>{
  const f=fog(),far={x:80,y:80},near={x:50,y:50},hidden={x:20,y:20};f.explored[far.y*f.width+far.x]=1;
  assert.equal(f.brightness(far),.3);const before=f.signature;
  assert.equal(f.setMemoryBrightness(.7),true);assert.equal(f.setMemoryBrightness(.7),false,'no repaint without a change');
  assert.notEqual(f.signature,before,'the overlay signature changes so remembered objects repaint');
  assert.equal(f.brightness(far),.7);assert.equal(f.brightness(near),1,'the area in sight is never darkened');
  assert.deepEqual([f.state(hidden),f.displayState(hidden),f.state(far),f.state(near)],[VISIBILITY.UNEXPLORED,VISIBILITY.UNEXPLORED,VISIBILITY.EXPLORED,VISIBILITY.VISIBLE],'the slider reveals nothing');
  const edge=[...Array(4)].map((_,i)=>({x:61+i,y:50})).find(t=>f.state(t)!==VISIBILITY.VISIBLE);f.explored[edge.y*f.width+edge.x]=1;f.setMemoryBrightness(.9);assert.ok(f.brightness(edge)<=1,'the sight-edge gradient never exceeds full brightness');
});

test('#129 the preference lives in browser settings, survives a reload and never enters a save',()=>{
  const st=memory();assert.equal(readSettings(st).memoryBrightness,.3);st.setItem('newgame.settings',JSON.stringify({fogOfWar:true,memoryBrightness:.65}));assert.equal(readSettings(st).memoryBrightness,.65);
  st.setItem('newgame.settings',JSON.stringify({memoryBrightness:5}));assert.equal(readSettings(st).memoryBrightness,.9);assert.equal(readSettings({getItem(){throw new Error('blocked');}}).memoryBrightness,.3);
  const s=workerScene(undefined,{starter:true});s.settingsPanel.settings.memoryBrightness=.65;s.fog.setMemoryBrightness(.65);
  const saved=validateGameState(serializeGameState(s));assert.equal('memoryBrightness' in saved.settings,false,'not a save field');
  const r=workerScene(undefined,{starter:true});r.settingsPanel.settings.memoryBrightness=.45;loadGameState(r,structuredClone(saved));assert.equal(validateGameState(serializeGameState(r)).settings.memoryBrightness,undefined);
});

function textureScene(){const made=new Map(),source={image:{complete:true}},frame={name:'__BASE',cutX:0,cutY:0,cutWidth:64,cutHeight:64,source},textures=new Map([['asset:rock_outcrop:main',{key:'asset:rock_outcrop:main',get:()=>frame}]]);
  return {made,frame,textures:{exists:k=>textures.has(k)||made.has(k),get:k=>textures.get(k),createCanvas(k){const ctx={filter:'',drawImage(){}};made.set(k,ctx);return {getContext:()=>ctx,refresh(){}};}}};}
test('#126 remembered rocks are a muted memory copy, not a tint the Canvas renderer ignores; visible rocks keep the original art',()=>{
  const scene=textureScene(),texture=scene.textures.get('asset:rock_outcrop:main');
  assert.equal(memoryTexture(scene,texture,scene.frame,.3),'memory-texture:0.3:asset:rock_outcrop:main:__BASE');assert.match(scene.made.get('memory-texture:0.3:asset:rock_outcrop:main:__BASE').filter,/grayscale\(85%\) brightness\(30%\)/);
  memoryTexture(scene,texture,scene.frame,.3);assert.equal(scene.made.size,1,'one copy per brightness');
  scene.frame.source={image:{complete:false}};assert.equal(memoryTexture(scene,texture,scene.frame,.5),null,'an art file still loading is never cached as an empty copy');scene.frame.source={image:{complete:true}};
  const terrain=Object.create(TerrainRenderer.prototype);Object.assign(terrain,{scene,wallTexture:'asset:rock_outcrop:main'});
  const wall={texture:{key:'asset:rock_outcrop:main'},setTexture(k){this.texture={key:k};return this;}},fog={memoryBrightness:.6};
  terrain.paintWall(wall,VISIBILITY.EXPLORED,fog);assert.equal(wall.texture.key,'memory-texture:0.6:asset:rock_outcrop:main:__BASE');assert.match(scene.made.get(wall.texture.key).filter,/brightness\(60%\)/,'rocks follow the brightness slider');
  terrain.paintWall(wall,VISIBILITY.VISIBLE,fog);assert.equal(wall.texture.key,'asset:rock_outcrop:main','a rock in sight is shown at full light again');
});
