import test from 'node:test';
import assert from 'node:assert/strict';
import { directionName, DIRECTION_POSES } from '../src/game/directions.js';
import { gridToWorld } from '../src/game/isometric.js';

const vectors=[['N',0,-1],['NE',1,-1],['E',1,0],['SE',1,1],['S',0,1],['SW',-1,1],['W',-1,0],['NW',-1,-1]];

test('osm natočení vychází z logických směrů a nezávisí na velikosti vektoru', () => {
  for(const [name,x,y] of vectors){
    assert.equal(directionName({x,y}),name);
    assert.equal(directionName({x:x*0.012,y:y*0.012}),name);
  }
  assert.equal(directionName({x:0,y:0}),null);
});

test('všech osm póz odpovídá skutečné izometrické projekci', () => {
  const origin=gridToWorld(2,2);
  for(const [name,x,y] of vectors){
    const projected=gridToWorld(2+x,2+y),pose=DIRECTION_POSES[name];
    const dx=projected.x-origin.x,dy=projected.y-origin.y;
    assert.ok(Math.abs(dx*pose.screenY-dy*pose.screenX)<1e-9,name);
    assert.ok(dx*pose.screenX+dy*pose.screenY>0,name);
  }
});
