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
    const first=s.workerSystem.liveSubjects()[0];s.workerSystem.jobs.assign(first,'miner');s.experienceSystem.addXP(first,200);s.populationSidebar.refresh(true);
    return {first:first.id,name:first.name,last:s.populationSidebar.records.at(-1).id,count:s.workerSystem.liveSubjects().length};
  });
  assert.equal(ids.count,200);assert.equal(await page.locator('#population-tab-count').textContent(),'200');assert.match(await page.locator('#population-summary').textContent(),/Population: 200 · Employed: 1 · Unemployed: 199/);
  assert.ok(await page.locator('.population-row').count()<=14);const first=page.locator(`.population-row[data-worker-id="${ids.first}"]`);
  assert.equal(await first.locator('strong').textContent(),ids.name);assert.equal(await first.locator('.population-row-text > small').first().textContent(),'Miner');
  const hex=JOBS.miner.portraitColor;assert.equal(await first.locator('img').evaluate(e=>e.style.backgroundColor),`rgb(${[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)).join(', ')})`);
  await first.locator('.population-select').hover();await page.locator('#population-tooltip:not([hidden])').waitFor();assert.equal(await page.locator('#population-tooltip h3').textContent(),ids.name);assert.equal(await page.locator('#population-tooltip .population-skill').count(),9);assert.equal(await page.locator('#population-tooltip .talented-skill').count(),1);
  const skill=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id),xp=w.experience.totalXP;s.skillSystem.addXP(w,'mining',25);s.populationSidebar.refresh(true);return {level:w.skills.mining.level,xp:w.skills.mining.currentXP,total:w.experience.totalXP,before:xp};},ids.first);
  assert.equal(skill.total,skill.before);assert.equal(await page.locator('#population-tooltip [data-skill="mining"] > span').textContent(),`LVL ${skill.level}`);assert.equal(await page.locator('#population-tooltip [data-skill="mining"] progress').evaluate(e=>e.value),skill.xp);
  await first.locator('.population-select').click();await page.locator('#unit-dialog[open]').waitFor();assert.equal(await page.locator('#unit-name').textContent(),ids.name);await page.locator('#close-unit').click();
  await page.locator('#population-profession').selectOption('miner');await page.locator('#population-sort').selectOption('skill:mining');await page.locator('#population-search').fill('MATEJ');assert.equal(await page.locator('.population-row').count(),1);assert.match(await first.locator('.population-row-progress').textContent(),/Mining/);
  await page.locator('#population-search').fill('no such villager');assert.equal(await page.locator('.population-row').count(),0);assert.equal(await page.locator('#population-empty').isVisible(),true);
  await page.locator('#population-search').fill('');await page.locator('#population-profession').selectOption('all');await page.locator('#population-sort').selectOption('name');await page.locator('#population-order').selectOption('asc');assert.equal(await page.locator('.population-row strong').first().textContent(),'Anna');await page.locator('#population-order').selectOption('desc');assert.match(await page.locator('.population-row strong').first().textContent(),/^Tereza/);
  await page.locator('#population-sort').selectOption('level');const stable=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,node=document.querySelector('.population-row');s.populationSidebar.refresh(true);return node===document.querySelector('.population-row');});assert.equal(stable,true);
  const zoom=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom);await page.locator('#population-viewport').hover();await page.mouse.wheel(0,600);assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom),zoom);
  await page.locator('#population-viewport').evaluate(e=>{e.scrollTop=e.scrollHeight;e.dispatchEvent(new Event('scroll'));});await page.locator(`.population-row[data-worker-id="${ids.last}"]`).waitFor();assert.ok(await page.locator('.population-row').count()<=14);
  await page.locator('#population-tab').click();assert.equal(await page.locator('.population-row').count(),0);
  await page.setViewportSize({width:390,height:844});await page.locator('#population-tab').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('.population-row').count()<=14);
  await page.locator(`.population-row[data-worker-id="${ids.last}"] .population-select`).click();await page.locator('#unit-dialog[open]').waitFor();const mobileDetail=await page.locator('#unit-dialog').boundingBox();assert.ok(mobileDetail.x>=0&&mobileDetail.x+mobileDetail.width<=390);assert.equal(await page.locator('#unit-skills > .skill-row').count(),9);assert.equal(await page.locator('#population-tooltip').evaluate(e=>e.hidden),true);await page.locator('#close-unit').click();await page.locator('#close-population').click();await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__populationReady=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('population-smoke',true);window.__populationReady=true;app.onGameReady=ready;};await app.load(state);},baseline);await page.waitForFunction(()=>window.__populationReady);
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),baseline);assert.equal(await page.locator('.population-row').count(),0);
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('population-smoke',false));await page.locator('#population-tab').click();
  const before=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.scrollY);await page.keyboard.down('w');await page.waitForTimeout(140);await page.keyboard.up('w');assert.ok(await page.evaluate(y=>window.__game.registry.get('application').scene.cameras.main.scrollY<y,before));
  await page.locator('.population-select').first().hover();await page.locator('#population-tooltip:not([hidden])').hover();const activeZoom=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom);await page.mouse.wheel(0,250);await page.waitForFunction(()=>document.querySelector('#population-tooltip').scrollTop>0);assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom),activeZoom);
  await page.locator('#population-tab').click();await page.evaluate(()=>window.__game.registry.get('application').scene.worldCamera.follow());
  console.log('PASS native Population sidebar, real portraits and profession colour, actual skill/talent/XP tooltip, permanent/dead/visitor filtering, 200-resident virtual rows, active scroll isolation, camera controls, bounded mobile details and exact world restoration');
}

export async function populationNavigationSmoke(page){
  const baseline=await page.evaluate(()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('navigation-smoke',true);return app.snapshot();});
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').check();await page.locator('#close-settings').click();
  const fixture=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let hidden,visible;
    for(let y=2;y<98&&(!hidden||!visible);y++)for(let x=2;x<98&&(!hidden||!visible);x++){
      const tile={x,y},key=`${x},${y}`;if(s.map[y][x]!==0||occupied.has(key)||s.resourceOccupancy.has(key))continue;const distance=Math.hypot(x-s.character.tile.x,y-s.character.tile.y);
      if(!hidden&&distance>35){hidden=s.workerSystem.create(tile,{name:'Hidden navigation resident'});occupied.add(key);}
      if(!visible&&distance>=2&&distance<=4&&s.fog.isVisibleTile(tile)){visible=s.workerSystem.create(tile,{name:'Visible navigation resident'});occupied.add(key);}
    }
    if(!hidden||!visible)throw Error('Missing navigation fixture location.');hidden.aiCooldown=visible.aiCooldown=1e8;
    for(let y=visible.tile.y-4;y<=visible.tile.y+4&&!visible.path.length;y++)for(let x=visible.tile.x-4;x<=visible.tile.x+4&&!visible.path.length;x++)if(s.map[y]?.[x]===0&&Math.hypot(x-visible.tile.x,y-visible.tile.y)>=3)visible.moveTo([{x,y}]);
    s.worldCamera.following=false;s.worldCamera.panTarget=null;s.cameras.main.centerOn(s.player.x,s.player.y+150);s.cameras.main.preRender();s.refreshVisibility();
    return {hidden:hidden.id,visible:visible.id,path:visible.path.map(t=>({...t})),task:structuredClone(visible.workTask),profession:visible.profession,camera:{x:s.cameras.main.scrollX,y:s.cameras.main.scrollY},explored:s.mapMemory.exportState().explored};
  });
  await page.locator('#population-tab').click();await page.locator('#population-search').fill('Hidden navigation resident');await page.locator(`.population-row[data-worker-id="${fixture.hidden}"] .population-locate`).click();
  const rejected=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {x:s.cameras.main.scrollX,y:s.cameras.main.scrollY,target:s.worldCamera.panTarget,highlight:s.populationSidebar.selection.visible,explored:s.mapMemory.exportState().explored};});
  assert.deepEqual({x:rejected.x,y:rejected.y},fixture.camera);assert.equal(rejected.target,null);assert.equal(rejected.highlight,false);assert.deepEqual(rejected.explored,fixture.explored);assert.match(await page.locator('#status').textContent(),/outside current sight/);
  await page.locator(`.population-row[data-worker-id="${fixture.hidden}"] .population-select`).click();await page.locator('#unit-dialog[open]').waitFor();assert.equal(await page.locator('#unit-name').textContent(),'Hidden navigation resident');await page.locator('#close-unit').click();
  await page.locator('#population-search').fill('Visible navigation resident');const row=page.locator(`.population-row[data-worker-id="${fixture.visible}"] .population-select`);await row.click();await page.locator('#unit-dialog[open]').waitFor();await page.locator('#close-unit').click();await row.dblclick();await page.waitForTimeout(300);assert.equal(await page.locator('#unit-dialog').evaluate(e=>e.open),false);
  const selected=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return{path:w.path,task:w.workTask,profession:w.profession,target:s.worldCamera.panTarget,highlight:s.populationSidebar.selection.visible};},fixture.visible);
  assert.deepEqual(selected.path,fixture.path);assert.deepEqual(selected.task,fixture.task);assert.equal(selected.profession,fixture.profession);assert.ok(selected.target);assert.equal(selected.highlight,true);
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('navigation-smoke',false));await page.waitForFunction(y=>Math.abs(window.__game.registry.get('application').scene.cameras.main.scrollY-y)>1,fixture.camera.y);await page.waitForFunction(target=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main;return Math.hypot(c.scrollX+c.width/2-target.x,c.scrollY+c.height/2-target.y)<3;},selected.target);
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').scene.mapMemory.exportState().explored),fixture.explored);
  await page.locator('#population-tab').click();
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__navigationReady=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('navigation-smoke',true);window.__navigationReady=true;app.onGameReady=ready;};await app.load(state);},baseline);await page.waitForFunction(()=>window.__navigationReady);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),baseline);await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('navigation-smoke',false));
  console.log('PASS native hidden Locate refusal and paper-only own-unit inspection, visible single/double click and smooth camera selection without changing route, profession, task or exploration');
}
