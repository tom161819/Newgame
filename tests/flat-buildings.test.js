import test from 'node:test';
import assert from 'node:assert/strict';
import { FlatBuildings,flatLook,FLAT_LOOK } from '../src/game/FlatBuildings.js';

// Owner 19 Nov 2026 (84): Space flattens buildings to their ground plans.
function fakeScene(buildings){const calls=[];const g={visible:true,setDepth(){return this;},setVisible(v){this.visible=v;return this;},clear(){calls.push('clear');},fillStyle(){},lineStyle(){},fillPoints(){calls.push('fill');},strokePoints(){},destroy(){calls.push('destroy');}};
  return {calls,g,scene:{buildings,fog:{enabled:false},add:{graphics:()=>g},setStatus(){} }};}
test('the toggle draws every known building plan once and redraws only on a change',()=>{
  const b1={id:1,x:2,y:2,tiles:[{x:2,y:2},{x:3,y:2}]},b2={id:2,x:6,y:6,tiles:[{x:6,y:6}],construction:{state:'planned'}};
  const {calls,g,scene}=fakeScene([b1,b2]),f=new FlatBuildings(scene);
  f.update();assert.equal(calls.length,0,'off: nothing drawn');
  assert.equal(f.toggle(),true);f.update();assert.equal(calls.filter(c=>c==='fill').length,3);f.update();assert.equal(calls.filter(c=>c==='fill').length,3,'no change, no redraw');
  b1.x=4;b1.tiles=[{x:4,y:2}];f.update();assert.equal(calls.filter(c=>c==='fill').length,5);
  assert.equal(f.toggle(),false);assert.equal(g.visible,false);
  assert.equal(flatLook(b2),FLAT_LOOK.site);assert.equal(flatLook({enemy:true}),FLAT_LOOK.enemy);
});
