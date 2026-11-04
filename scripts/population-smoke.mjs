import assert from 'node:assert/strict';
import { JOBS } from '../src/data/jobs.js';

export async function populationSidebarSmoke(page){
  const baseline=await page.evaluate(()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('population-smoke',true);return app.snapshot();});
  assert.equal(await page.locator('#population-tab').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.population-row').count(),0);
  await page.locator('#population-tab').click();assert.equal(await page.locator('#population-tab').getAttribute('aria-expanded'),'true');
  await page.waitForFunction(()=>[...document.querySelectorAll('.population-portrait')].every(image=>image.complete&&image.naturalWidth>0));
  const ids=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));
    for(let y=2;y<98&&s.workerSystem.liveSubjects().length<200;y++)for(let x=2;x<98&&s.workerSystem.liveSubjects().length<200;x++){
      const key=`${x},${y}`;if(s.map[y][x]!==0||occupied.has(key)||s.resourceOccupancy.has(key))continue;s.workerSystem.create({x,y});occupied.add(key);
    }
    const visitor=s.workerSystem.create({x:1,y:1});visitor.isSubject=false;
    const dead=s.workerSystem.create({x:2,y:1});dead.currentHP=0;dead.isAlive=false;s.workerSystem.onDeath(dead);s.workerSystem.updateUI();
    const first=s.workerSystem.liveSubjects()[0];s.workerSystem.jobs.assign(first,'miner');s.populationSidebar.refresh(true);
    return {first:first.id,name:first.name,last:s.workerSystem.liveSubjects().at(-1).id,count:s.workerSystem.liveSubjects().length};
  });
  assert.equal(ids.count,200);assert.equal(await page.locator('#population-tab-count').textContent(),'200');assert.match(await page.locator('#population-summary').textContent(),/Population: 200 · Employed: 1 · Unemployed: 199/);
  assert.ok(await page.locator('.population-row').count()<=14);const first=page.locator(`.population-row[data-worker-id="${ids.first}"]`);
  assert.equal(await first.locator('strong').textContent(),ids.name);assert.equal(await first.locator('.population-row-text > small').first().textContent(),'Miner');
  const hex=JOBS.miner.portraitColor;assert.equal(await first.locator('img').evaluate(e=>e.style.backgroundColor),`rgb(${[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)).join(', ')})`);
  await first.locator('button').click();await page.locator('#unit-dialog[open]').waitFor();assert.equal(await page.locator('#unit-name').textContent(),ids.name);await page.locator('#close-unit').click();
  const zoom=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom);await page.locator('#population-viewport').hover();await page.mouse.wheel(0,600);assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom),zoom);
  await page.locator('#population-viewport').evaluate(e=>{e.scrollTop=e.scrollHeight;e.dispatchEvent(new Event('scroll'));});await page.locator(`.population-row[data-worker-id="${ids.last}"]`).waitFor();assert.ok(await page.locator('.population-row').count()<=14);
  await page.locator('#population-tab').click();assert.equal(await page.locator('.population-row').count(),0);
  await page.setViewportSize({width:390,height:844});await page.locator('#population-tab').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('.population-row').count()<=14);await page.locator('#close-population').click();await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__populationReady=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('population-smoke',true);window.__populationReady=true;app.onGameReady=ready;};await app.load(state);},baseline);await page.waitForFunction(()=>window.__populationReady);
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),baseline);assert.equal(await page.locator('.population-row').count(),0);
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('population-smoke',false));await page.locator('#population-tab').click();
  const before=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.scrollY);await page.keyboard.down('w');await page.waitForTimeout(140);await page.keyboard.up('w');assert.ok(await page.evaluate(y=>window.__game.registry.get('application').scene.cameras.main.scrollY<y,before));
  await page.locator('#population-tab').click();await page.evaluate(()=>window.__game.registry.get('application').scene.worldCamera.follow());
  console.log('PASS native Population sidebar, real portraits and profession colour, permanent/dead/visitor filtering, 200-resident virtual rows, scroll isolation, camera controls, mobile and exact world restoration');
}
