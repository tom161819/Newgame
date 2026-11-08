import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameProfiler,profileHooks,frameSummary } from '../src/systems/FrameProfiler.js';
import { findPathToAny } from '../src/game/pathfinding.js';

// performance-1: the developer frame profiler.
function fixture(){
  let clock=0;const events=new Map(),on=(name,fn)=>events.set(name,fn),off=name=>events.delete(name);
  class Workers{update(ms){clock+=ms;scene.pathing();}}
  const scene={workerSystem:new Workers(),gameTime:{update(ms){clock+=ms;}},pathing(){let paid=false;findPathToAny([[0,0],[0,0]],{x:0,y:0},[{x:1,y:1}],{speedMultiplier:()=>{if(!paid){paid=true;clock+=1;}return 1;}});},sys:{sceneUpdate(){}}};
  const game={events:{on,off},scene:{update(){}},renderer:{render(){clock+=2;}}};
  const profiler=new FrameProfiler(game,{now:()=>clock,scene:()=>scene});
  const frame=()=>{events.get('prestep')();scene.workerSystem.update(3);scene.gameTime.update(1);game.renderer.render();clock+=4;events.get('postrender')();};
  return {scene,game,profiler,frame,events};
}
test('the profiler wraps only while on and puts the original methods back (zero cost off)',()=>{
  const {scene,game,profiler,events}=fixture(),update=scene.gameTime.update,render=game.renderer.render;
  assert.equal(Object.hasOwn(scene.workerSystem,'update'),false);
  profiler.setEnabled(true);assert.notEqual(scene.gameTime.update,update);assert.ok(Object.hasOwn(scene.workerSystem,'update'));assert.equal(profileHooks.on,true);assert.equal(events.size,2);
  profiler.setEnabled(false);assert.equal(scene.gameTime.update,update);assert.equal(game.renderer.render,render);assert.equal(Object.hasOwn(scene.workerSystem,'update'),false);assert.equal(profileHooks.on,false);assert.equal(events.size,0);
});
test('self time per system, group totals, FPS and the 95th percentile over the window',()=>{
  const {profiler,frame}=fixture();profiler.setEnabled(true);for(let i=0;i<20;i++)frame();
  const r=profiler.report(),row=label=>r.rows.find(x=>x.label===label);
  assert.equal(row('workers').avg,3,'pathfinding (1 ms) inside workers is booked to pathfinding');assert.equal(row('pathfinding').avg,1);assert.equal(row('game time').avg,1);assert.equal(row('render').avg,2);
  assert.equal(r.groups.sim.avg,4);assert.equal(r.groups.pathfinding.avg,1);assert.equal(r.groups.render.avg,2);assert.equal(r.groups.total.avg,11);assert.equal(r.frameMs.avg,11);assert.equal(r.fps,+(1000/11).toFixed(1));assert.equal(r.frames,20);
  assert.match(profiler.text(r),/Profiler \(F8\) · [\d.]+ FPS/);profiler.setEnabled(false);
  assert.deepEqual(frameSummary(Float32Array.from([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,100]),20),{avg:14.5,p95:100,max:100});
});
