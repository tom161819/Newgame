import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldCamera,MIN_ZOOM,MAX_ZOOM } from '../src/game/WorldCamera.js';
import { tileCenter,worldToTile,worldToGrid } from '../src/game/isometric.js';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
function camera(){const c=Object.create(WorldCamera.prototype);Object.assign(c,{scene:{},camera:{zoom:1,scrollX:2600,scrollY:1300,width:1200,height:600,setZoom(z){this.zoom=z;return this;},centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;},preRender(){}},target:{x:3200,y:1744},keys:Object.fromEntries(['W','A','S','D','UP','DOWN','LEFT','RIGHT'].map(name=>[name,{isDown:false}])),following:false});return c;}
test('wheel zoom eases monotonically from unchanged1x to0.25x and back to unchanged1.8x, independent of frame rate',()=>{
  for(const fps of [30,60,144]){const c=camera();c.zoom(5000);assert.equal(c.camera.zoom,1);assert.equal(c.zoomTarget,.25);let previous=1;for(let i=0;i<fps*2;i++){c.update(1000/fps);assert.ok(c.camera.zoom<=previous&&c.camera.zoom>=MIN_ZOOM);previous=c.camera.zoom;}assert.equal(c.camera.zoom,MIN_ZOOM);c.zoom(-5000);for(let i=0;i<fps*2;i++){c.update(1000/fps);assert.ok(c.camera.zoom>=previous&&c.camera.zoom<=MAX_ZOOM);previous=c.camera.zoom;}assert.equal(c.camera.zoom,MAX_ZOOM);}
});
test('directly restored camera zoom becomes the new stable target and cannot rebound to an old wheel instruction',()=>{
  const c=camera();c.zoom(600);c.update(16);c.camera.setZoom(.25);c.update(16);assert.equal(c.zoomTarget,.25);assert.equal(c.camera.zoom,.25);c.camera.setZoom(1.3);c.zoom(100);assert.ok(Math.abs(c.zoomTarget-1.3*Math.exp(-.1))<1e-10);c.scene.gameTime={paused:true};const target=c.zoomTarget;c.zoom(300);assert.equal(c.zoomTarget,target);c.scene.gameTime.paused=false;c.zoom(NaN);assert.equal(c.zoomTarget,target);
});
test('resizing a tall viewport raises only its safe minimum so its world view still fits within the map',()=>{
  const c=camera();c.camera.height=1200;c.camera.setZoom(.25);c.update(16);assert.equal(c.camera.zoom,1200/3360);assert.equal(c.zoomTarget,c.camera.zoom);c.zoom(10000);c.update(1000);assert.equal(c.camera.zoom,1200/3360);assert.ok(c.camera.height/c.camera.zoom<=3360);assert.ok(c.camera.width/c.camera.zoom<=6400);c.camera.height=600;c.zoom(10000);for(let i=0;i<120;i++)c.update(16);assert.equal(c.camera.zoom,.25);
});
test('all10000 isometric tile centres survive shifted and quarter-scale camera projection without selecting a neighbor',()=>{
  for(const zoom of [.25,.45,1,1.8])for(let y=0;y<100;y++)for(let x=0;x<100;x++){const world=tileCenter({x,y}),center={x:2800,y:1500},screen={x:(world.x-center.x)*zoom+600,y:(world.y-center.y)*zoom+300},back={x:(screen.x-600)/zoom+center.x,y:(screen.y-300)/zoom+center.y};assert.deepEqual(worldToTile(back.x,back.y),{x,y});}
});
test('quarter-scale keyboard panning keeps a logical map centre and normalizes diagonal camera speed',()=>{
  const straight=camera(),diagonal=camera();for(const c of [straight,diagonal])c.camera.setZoom(.25);straight.keys.D.isDown=true;diagonal.keys.D.isDown=diagonal.keys.S.isDown=true;const start={x:3200,y:1600};straight.update(100);diagonal.update(100);const distance=c=>Math.hypot(c.camera.scrollX+c.camera.width/2-start.x,c.camera.scrollY+c.camera.height/2-start.y);assert.ok(Math.abs(distance(straight)-distance(diagonal))<1e-8);for(let i=0;i<200;i++)diagonal.update(100);const grid=worldToGrid(diagonal.camera.scrollX+600,diagonal.camera.scrollY+300);assert.ok(grid.x>=0&&grid.y>=0&&grid.x<=100&&grid.y<=100);
});
test('current and older saves retain actual quarter-scale view without a new schema or altered world/stock/time',()=>{
  const s=workerScene();s.cameras.main.setZoom(.25);const saved=validateGameState(serializeGameState(s)),r=workerScene();loadGameState(r,saved);assert.equal(saved.saveVersion,SAVE_VERSION);assert.deepEqual(serializeGameState(r),saved);for(const invalid of [.249,1.801,Infinity]){const bad=structuredClone(saved);bad.camera.zoom=invalid;assert.throws(()=>validateGameState(bad));}
});
