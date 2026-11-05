import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild,clickBuilding } from './building-menu-smoke.mjs';

// C08: a real Barracks panel trains a Soldier with a Sword a Hauler carries from a real Armory; Save/Load keeps the unit.
export async function militarySmoke(page){
  const app=()=>window.__game.registry.get('application');
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__militaryReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__militaryReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__militaryReady);};
  // Materials for one building at a time: the Starter Stockpile holds 40 units.
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',10);s.inventory.add('wood',12);s.updateInventory();});
  const armory=await placeBlueprint(page,'armory');await supplyAndBuild(page,armory);
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',20);s.updateInventory();});const barracks=await placeBlueprint(page,'barracks');await supplyAndBuild(page,barracks);
  const fixture=await page.evaluate(({armory,barracks})=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===barracks),[soldier,hauler]=s.workerSystem.liveSubjects().filter(w=>!w.arriving);
    s.employment?.setEnabled(false);s.foodStorage.deposit(`armory-${armory}`,'sword',1);s.inventory.add('gold',20);s.workplaceSystem.assign(b,soldier);s.workerSystem.jobs.assign(hauler,'hauler');hauler.stoneCollection={enabled:false,radius:80};s.updateInventory();return{soldier:soldier.id,hauler:hauler.id};},{armory:armory.id,barracks:barracks.id});
  await clickBuilding(page,barracks.id);await page.locator('#workplace-dialog[open]').waitFor();await page.locator('#military-details:not([hidden])').waitFor();
  assert.deepEqual(await page.locator('.unit-type-card').evaluateAll(cards=>cards.map(c=>c.dataset.unitType)),['soldier','swordsman','archer','knight']);
  assert.match(await page.locator('[data-unit-type="soldier"]').textContent(),/1 kit/);assert.match(await page.locator('[data-unit-type="knight"]').textContent(),/Stables/);
  const row=page.locator(`.military-soldier[data-soldier="${fixture.soldier}"]`);assert.equal(await row.locator('[data-train="knight"]').isDisabled(),true);assert.equal(await row.locator('[data-train="swordsman"]').isDisabled(),true,'Combat 1 is too low for a Swordsman');
  await row.locator('[data-train="soldier"]').click();await page.locator('#close-workplace').click();
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.military.order({id})?.state==='training',fixture.soldier,{timeout:60000});
  const mid=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.equal(mid.saveVersion,25);assert.equal(mid.military.orders[0].state,'training');assert.deepEqual(mid.military.orders[0].items,{sword:1});
  await load(mid);
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.military.units.get(id)?.type==='soldier',fixture.soldier,{timeout:60000});
  const unit=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return [w.maxHP,w.attackDPS,s.foodStorage.available('sword')];},fixture.soldier);assert.deepEqual(unit,[80,12,0]);
  await clickBuilding(page,barracks.id);await page.locator(`.military-soldier[data-soldier="${fixture.soldier}"] [data-discharge]`).waitFor();assert.match(await page.locator(`.military-soldier[data-soldier="${fixture.soldier}"]`).textContent(),/Soldier/);await page.locator('#close-workplace').click();
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());await load(saved);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot().military),saved.military);
  await load(baseline);
  console.log('PASS C08: real Armory and Barracks, four unit cards with kits and locked Knight, Train Soldier, Hauler-carried Sword, training Save/Load, 80 HP / 12 DPS unit restored');
}
