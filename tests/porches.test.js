import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { PorchSystem } from '../src/systems/PorchSystem.js';
import { PORCH_ART,PORCH_DEFAULT,porchVariant,porchId } from '../src/data/porches.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { readFileSync,existsSync } from 'node:fs';
globalThis.document??={querySelector:()=>({textContent:''})};

function world(){
  const s=workerScene(undefined,{workplaces:true});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);
  s.porches=new PorchSystem(s);
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);return r.building;};
  return {s,p:s.porches,place};
}

test('porch art: approved Studio exports, one per variant, seats inside the 2×1 strip; workplaces map to their porch', () => {
  for(const [variant,art] of Object.entries(PORCH_ART)){
    const meta=JSON.parse(readFileSync(art.artSource,'utf8'));assert.deepEqual(meta.footprint,{width:2,height:1},variant);assert.deepEqual(art.origin,meta.origin);
    assert.ok(existsSync(`public${art.sprite}`),variant);assert.ok(art.seats.length>=1&&art.seats.every(([x,z])=>Math.abs(x)<1&&Math.abs(z)<.5),variant);
    assert.equal(objectRegistry.require(porchId(variant)).category,'decoration');
  }
  assert.equal(porchVariant('mill'),'trade-porch-mill');assert.equal(porchVariant('iron_mine'),'trade-porch-quarry');assert.equal(porchVariant('farmhouse'),'profession-porch-farmer');
  assert.equal(porchVariant('bowyer'),PORCH_DEFAULT);assert.equal(porchVariant('barracks'),null,'soldiers stand guard');
});

test('a completed workplace gets a porch on two free tiles in front of it; it moves when the tiles are built on, and is not saved', () => {
  const {s,p,place}=world(),mill=place('mill',60,60);p.refresh();
  const porch=p.porches.get(mill.id);assert.ok(porch);assert.equal(porch.flip,false);assert.equal(porch.y,62,'the row right in front of the 2×2 mill');
  assert.ok(p.tiles(porch).every(t=>t.x>=60&&t.x<=61));assert.ok(p.tiles(porch).every(t=>s.map[t.y][t.x]===0),'porch tiles stay walkable');
  assert.equal(objectRegistry.require(porchId(porch.variant)).walkable,true);
  // Something is built on the porch: it moves to the front-right side (mirrored).
  for(const t of p.tiles(porch))s.map[t.y][t.x]=1;p.refresh();const moved=p.porches.get(mill.id);assert.ok(moved&&moved!==porch);assert.equal(moved.flip,true);assert.equal(moved.x,62);
  assert.ok(!('porches' in (s.saveState?.()??{})));
});

test('an idle worker of the workplace walks to a seat and sits; work gets him up, and seats are never shared', () => {
  const {s,p,place}=world(),mill=place('mill',60,60);p.refresh();const porch=p.porches.get(mill.id),seats=p.seatPoints(porch);
  const workers=[0,1,2].map(i=>s.workerSystem.create({x:59+i,y:63}));
  for(const w of workers)Object.assign(w,{assignedWorkplaceId:mill.id,workplaceReached:true,profession:'miller',workState:'Waiting',workTask:null,cargo:null});
  for(let i=0;i<200;i++){for(const w of workers){p.check(w);w.update(50);}}
  const seated=workers.filter(w=>w.seated);assert.equal(seated.length,Math.min(workers.length,seats.length),'one per seat');
  assert.equal(new Set(seated.map(w=>w.porchSeat.index)).size,seated.length);assert.equal(p.seatedAt(mill.id),seated.length);
  const first=seated[0],point=seats[first.porchSeat.index];assert.deepEqual(first.position,point,'sits exactly on the seat from the art');
  first.workState='Working';p.check(first);assert.equal(first.seated,false);assert.equal(first.porchSeat,null);assert.equal(p.seatedAt(mill.id),seated.length-1,'the seat is free again');
  // Rest time or an order gets him up too.
  const second=seated[1];second.restPhase='going';p.check(second);assert.equal(second.seated,false);
});
