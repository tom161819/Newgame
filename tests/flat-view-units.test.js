import test from 'node:test';
import assert from 'node:assert/strict';
import { towerTop,FLAT_VIEW } from '../src/game/buildings.js';
import { tileCenter,setProjectionLift } from '../src/game/isometric.js';
import { doorShape,TOWER_DOOR } from '../src/game/TowerDoors.js';

// Owner 20 Nov 2026: with Space, people on Towers, Gates and walls stand on the ground plan; tower doors follow the wall.
test('the flat view puts the top of a Tower on its own tile (no lift)',()=>{
  const tower={id:1,type:'tower',x:10,y:10,tiles:[]};const high=towerTop(tower);
  FLAT_VIEW.on=true;try{assert.deepEqual(towerTop(tower),tileCenter(tower));}finally{FLAT_VIEW.on=false;}
  assert.ok(towerTop(tower).y<tileCenter(tower).y,'normally the top is up in the air');assert.deepEqual(towerTop(tower),high);
});
test('a tower door follows the height of the wall that leads to it on sloping ground',()=>{
  const tower={id:1,type:'tower',x:10,y:10},door={side:'S',column:0};
  const flat=doorShape(tower,door);
  setProjectionLift((x,y)=>y>=13?0:10);// the Tower's face is 10 px up, the wall's front corner on the low ground
  try{const slope=doorShape(tower,door);assert.ok(Math.abs((flat.bl.y-slope.bl.y)-0)<1e-6,'the door stays at the wall walk, not 10 px up with the face');}
  finally{setProjectionLift(null);}
  assert.ok(TOWER_DOOR.walkHeight>0);
});
