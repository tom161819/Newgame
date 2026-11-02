import test from 'node:test';
import assert from 'node:assert/strict';
import { gridToWorld, worldToGrid, worldToTile, tileCenter, tilePolygon, WORLD_BOUNDS } from '../src/game/isometric.js';

test('projekce a její inverze zachovají souřadnice včetně desetinného pohybu', () => {
  for (const x of [0, 0.5, 12.25, 50.5, 99.99, 100]) for (const y of [0, 0.5, 31.75, 99.5, 100]) {
    const world=gridToWorld(x,y),back=worldToGrid(world.x,world.y);
    assert.ok(Math.abs(back.x-x)<1e-9);assert.ok(Math.abs(back.y-y)<1e-9);
  }
});

test('všech 10 000 středů se po kliknutí převede na správné políčko', () => {
  for(let y=0;y<100;y++)for(let x=0;x<100;x++){
    const p=tileCenter({x,y});assert.deepEqual(worldToTile(p.x,p.y),{x,y});
    assert.ok(p.x>=0&&p.x<WORLD_BOUNDS.width&&p.y>=0&&p.y<WORLD_BOUNDS.height);
  }
});

test('políčko je kosočtverec 64 × 32 a vedlejší políčka sdílí hrany', () => {
  const p=tilePolygon({x:5,y:7});
  assert.equal(Math.max(...p.map(v=>v.x))-Math.min(...p.map(v=>v.x)),64);
  assert.equal(Math.max(...p.map(v=>v.y))-Math.min(...p.map(v=>v.y)),32);
  assert.deepEqual(p[1],tilePolygon({x:6,y:7})[0]);
  assert.deepEqual(p[2],tilePolygon({x:6,y:7})[3]);
});
