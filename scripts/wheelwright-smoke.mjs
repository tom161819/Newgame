import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild } from './building-menu-smoke.mjs';

// S12 phase B: a real Wheelwright's Workshop builds a Wheelbarrow from delivered goods; a Hauler takes it, the unit
// panel shows the Transport mode, and Save/Load keeps the vehicle in his hands.
export async function wheelwrightSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__wwReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__wwReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__wwReady);};
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',12);s.inventory.add('wood',15);s.updateInventory();});
  const site=await placeBlueprint(page,'wheelwright_workshop');await supplyAndBuild(page,site);
  const ids=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),[a,c,h]=s.workerSystem.liveSubjects().filter(w=>!w.arriving);s.employment?.setEnabled(false);
    s.workplaceSystem.assign(b,a);s.workplaceSystem.assign(b,c);s.workerSystem.jobs.assign(h,'hauler');h.stoneCollection={enabled:false,radius:80};s.inventory.add('wood',10);s.inventory.add('iron_bar',2);s.updateInventory();return{hauler:h.id,wheelwrights:[a.id,c.id].map(x=>s.workerSystem.workers.get(x).profession)};},site.id);
  assert.deepEqual(ids.wheelwrights,['wheelwright','wheelwright']);
  await page.waitForFunction(()=>window.__game.registry.get('application').scene.vehicles.vehicles.size===1,null,{timeout:150000});
  await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return !!s.vehicles.held(s.workerSystem.workers.get(id));},ids.hauler,{timeout:60000});
  const state=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return [w.vehicleType,s.inventory.count('iron_bar'),s.inventory.count('wood')];},ids.hauler);assert.deepEqual(state,['wheelbarrow',0,0]);
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.unitPanel.open(s.workerSystem.workers.get(id));},ids.hauler);await page.locator('#unit-dialog[open]').waitFor();
  assert.equal(await page.locator('#transport-mode').inputValue(),'auto');await page.locator('#close-unit').click();
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.equal(saved.vehicles.vehicles[0].state,'inUse');await load(saved);
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).vehicleType,ids.hauler),'wheelbarrow');
  await load(baseline);
  console.log('PASS S12 Wheelwright: real workshop, 2 Wheelwrights, 10 Wood + 2 Iron Bars → physical Wheelbarrow, Hauler fetched it (Transport Auto), kept in hand after Load');
}
