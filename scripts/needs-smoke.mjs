import assert from 'node:assert/strict';

// S13 (#58) phase A: the real unit panel shows a villager's needs, the HUD shows Kingdom Happiness and opens Population,
// the sidebar summarises needs and sorts by Happiness, and Save/Load keeps every resident's needs.
export async function needsSmoke(page,{screenshot=null}={}){
  const app=()=>window.__game.registry.get('application');
  const id=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,[w]=s.workerSystem.liveSubjects().filter(x=>!x.arriving);
    s.pauseManager.set('needs-smoke',true);s.needs.records.set(w.id,{id:w.id,food:15,rest:62,hp:w.currentHP,attackedAt:null});s.needs.revision++;s.needs.refresh();s.kingdomHappiness.update();return w.id;});
  await page.waitForFunction(()=>/☺ \d+ %/.test(document.querySelector('#kingdom-happiness')?.textContent??''));
  const hud=await page.locator('#kingdom-happiness').textContent();
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.unitPanel.open(s.workerSystem.workers.get(id));},id);
  await page.locator('#unit-needs:not([hidden]) [data-need="food"]').waitFor();
  const panel=await page.evaluate(()=>({food:document.querySelector('#unit-needs [data-need="food"] meter').value,rest:document.querySelector('#unit-needs [data-need="rest"] meter').value,happiness:document.querySelector('#unit-needs [data-need="happiness"] b').textContent,problem:document.querySelector('#unit-needs .need-problem').textContent,home:document.querySelector('#unit-needs .need-home').textContent,work:document.querySelector('#unit-needs .need-work').textContent,safetyTip:document.querySelector('#unit-needs [data-need="safety"]').title,foodTip:document.querySelector('#unit-needs [data-need="food"]').title}));
  assert.deepEqual([panel.food,panel.rest],[15,62]);assert.match(panel.problem,/Hungry/);assert.match(panel.home,/Settlement quarters/);assert.match(panel.safetyTip,/^Base 45/,'Safety tooltip lists its factors');assert.match(panel.foodTip,/Missed meals/,'Food tooltip explains the low value');
  // Phase C: the panel's work factor is the mood's, and it is applied to real work speed (on top of skill and hunger).
  const morale=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return {factor:s.needs.status(w).workModifier,applied:s.skillSystem.workEfficiency(w,'mining')/(s.skillSystem.efficiency(w,'mining')*s.foodSystem.workMultiplier(w)),attractiveness:s.attractiveness.modifiers.get('happiness')};},id);
  assert.equal(panel.work,`Work speed: ×${morale.factor.toFixed(2)}`);assert.ok(Math.abs(morale.applied-morale.factor)<1e-9,`mood factor applied ${JSON.stringify(morale)}`);assert.equal(typeof morale.attractiveness,'number','Kingdom Happiness is part of attractiveness');
  if(screenshot)await page.screenshot({path:screenshot});
  await page.locator('#close-unit').click();
  await page.locator('#kingdom-happiness').click();await page.locator('#population-panel.open').waitFor();await page.evaluate(()=>window.__game.registry.get('application').scene.populationSidebar.refresh(true));
  await page.waitForFunction(()=>/Happiness \d+ % · Hungry 1/.test(document.querySelector('#population-needs')?.textContent??''));
  assert.ok(await page.locator('#population-sort option[value="happiness"]').count(),'Happiness sort');
  const sortBefore=await page.locator('#population-sort').inputValue(),orderBefore=await page.locator('#population-order').inputValue();
  await page.locator('#population-sort').selectOption('happiness');await page.locator('#population-order').selectOption('asc');
  await page.waitForFunction(id=>document.querySelector('#population-list [data-worker-id]')?.dataset.workerId===id,id);
  await page.locator('#population-sort').selectOption(sortBefore);await page.locator('#population-order').selectOption(orderBefore);
  await page.locator('#close-population').click();
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('needs-smoke',false));
  // Save/Load in the real application keeps the needs exactly.
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.equal(saved.needs.records.find(r=>r.id===id).food,15);
  await page.evaluate(async state=>{const a=window.__game.registry.get('application');window.__needsReady=false;const ready=a.onGameReady.bind(a);a.onGameReady=s=>{ready(s);window.__needsReady=true;a.onGameReady=ready;};await a.load(state);},saved);
  await page.waitForFunction(()=>window.__needsReady);
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.needs.records.get(id)?.food,id),15);
  console.log(`PASS S13 needs: unit panel bars (Food 15 → Hungry, home), HUD ${hud.trim()} opens Population with the needs summary and Happiness sort, work speed factor shown and applied, need tooltips explain the values, Save/Load keeps needs`);
}
