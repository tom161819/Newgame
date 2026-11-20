import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { objectRegistry } = await import('../src/systems/ObjectRegistry.js');
const { defenseSpeed } = await import('../src/game/defenseWorks.js');

// Owner 20 Nov 2026 (defence list, point 2): Stakes and Moat.
const scene=types=>({buildings:types.map(([type,x,y],id)=>({id,type,x,y,definition:objectRegistry.require(type),tiles:[{x,y}],construction:{state:'complete'}})),military:{mounted:u=>!!u.rider,spec:u=>u.cart?{vehicle:'wagon'}:null}});

test('Stakes and Moat are walkable defence lines dragged like a wall',()=>{
  for(const id of ['stakes','moat']){const d=objectRegistry.require(id);assert.equal(d.walkable,true);assert.equal(d.construction.mode,'line');assert.equal(d.buildingCategory,'defense');assert.ok(d.defense);}
});

test('men on foot wade slowly through Stakes and the Moat; riders hardly get through Stakes; wheels hardly cross the Moat',()=>{
  const s=scene([['stakes',5,5],['moat',6,5]]),foot={},rider={rider:true},cart={cart:true};
  assert.equal(defenseSpeed(s,foot,{x:5,y:5}),objectRegistry.require('stakes').defense.speed);
  assert.ok(defenseSpeed(s,rider,{x:5,y:5})<.1,'a rider is stopped by the stakes');
  assert.ok(defenseSpeed(s,cart,{x:6,y:5})<.05,'a cart cannot cross the moat');
  assert.ok(defenseSpeed(s,foot,{x:6,y:5})<.5);
  assert.equal(defenseSpeed(s,foot,{x:7,y:5}),1,'elsewhere nothing changes');
  const site=scene([['stakes',5,5]]);site.buildings[0].construction={state:'planned'};assert.equal(defenseSpeed(site,foot,{x:5,y:5}),1,'a site does nothing yet');
});
