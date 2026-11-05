import { employmentExclusionsSmoke } from './employment-exclusions-smoke.mjs';
import { chainNoticesSmoke } from './chain-notices-smoke.mjs';
import { idleStoneSmoke } from './idle-stone-smoke.mjs';
import { wildlifeClearanceSmoke } from './wildlife-clearance-smoke.mjs';
import { unitCommandSmoke } from './unit-command-smoke.mjs';
import { i18nSmoke,i18nGameSmoke } from './i18n-smoke.mjs';
import { autosaveSmoke } from './autosave-smoke.mjs';
import { saveTransferSmoke } from './save-transfer-smoke.mjs';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile,stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserRuntime } from './browser-runtime.mjs';
import { projectBase } from './archive-lib.mjs';
import { noticesSmoke } from './notices-smoke.mjs';
import { employmentSmoke } from './employment-smoke.mjs';
import { buildingMenuSmoke,buildingUnlockGameplaySmoke } from './building-menu-smoke.mjs';
import { seasonsMenuSmoke } from './seasons-menu-smoke.mjs';
import { seasonTransitionSmoke } from './season-transition-smoke.mjs';
import { stageArchivedSnapshots } from './stage-archive.mjs';
import { explorationMenuSmoke,staticMemoryRendererSmoke,hiddenInteractionSmoke } from './fog-smoke.mjs';
import { populationSidebarSmoke,populationNavigationSmoke,populationIntegrationSmoke } from './population-smoke.mjs';
import { staffingIndicatorsSmoke } from './staffing-smoke.mjs';
import { mineralSmoke } from './mineral-smoke.mjs';
import { zoomSmoke } from './zoom-smoke.mjs';
import { ledgerSmoke } from './ledger-smoke.mjs';
import { smeltingSmoke } from './smelting-smoke.mjs';
import { militarySmoke } from './military-smoke.mjs';
import { pavementSmoke } from './pavement-smoke.mjs';
import { devFpsSmoke } from './dev-fps-smoke.mjs';
import { wallVisibilitySmoke } from './wall-visibility-smoke.mjs';
import { wheelwrightSmoke } from './wheelwright-smoke.mjs';
import { stablesSmoke } from './stables-smoke.mjs';
import { housingSmoke } from './housing-smoke.mjs';
import { forestrySmoke,forestryHutSmoke } from './forestry-smoke.mjs';


const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const base=projectBase(args.find(a=>a.startsWith('--base='))?.slice(7)??'/Newgame/'),dist=path.join(root,'dist');
const catalog=JSON.parse(await readFile(path.join(dist,'versions/catalog.json'),'utf8'));
const currentOnly=args.includes('--current-only');
if(!currentOnly)await stageArchivedSnapshots({source:path.join(root,'public/versions'),target:path.join(dist,'versions')});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
  try{
    const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Frozen builds keep their original canonical URLs, even in a custom-base preview.
    const archive=catalog.builds.find(b=>b.archiveURL&&url.startsWith(b.archiveURL));
    let relative=archive?`versions/${archive.commit}/${url.slice(archive.archiveURL.length)}`:url.startsWith(base)?url.slice(base.length):null;
    if(relative===null){res.writeHead(404).end();return;}if(!relative||relative.endsWith('/'))relative+='index.html';
    const file=path.resolve(dist,relative);if(!file.startsWith(dist+path.sep)){res.writeHead(403).end();return;}
    const info=await stat(file);if(!info.isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');createReadStream(file).pipe(res);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
async function runSmoke(){let browser;
try{
  const runtime=await browserRuntime();browser=await runtime.chromium.launch({executablePath:runtime.executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],requests=[];page.on('request',request=>requests.push(request.url()));
  const instrument=async p=>{
    p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    // Instrument the served copy only; no test globals are shipped in the game.
    await p.route('**/assets/index-*.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/new ([\w$]+)\.Game\(/,'window.__game = new $1.Game(')});});
  };
  await page.addInitScript(()=>{let state=77123;Math.random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32);});
  await instrument(page);await page.goto(origin+base);
  assert.ok((await page.title()).includes(`v${catalog.gameVersion}`));
  for(const label of await page.locator('[data-game-version]').allTextContents())assert.equal(label,`v${catalog.gameVersion}`);
  assert.equal(await page.locator('#archive-version-list > article').count(),0);assert.equal(await page.locator('#archive-snapshot-list > article').count(),0);
  assert.equal(requests.some(url=>url.includes('/versions/catalog.json')),false);
  if(!currentOnly){
  await page.locator('#main-archive').click();await page.locator('#version-archive-dialog[open]').waitFor();
  assert.equal(await page.locator('#archive-version-list > article').count(),catalog.versions.length+(catalog.versions.some(v=>v.current)?0:1));
  assert.equal(await page.locator('#archive-snapshot-list > article').count(),0);await page.locator('#archive-snapshot-count').click();
  await page.waitForFunction(expected=>document.querySelector('#archive-snapshot-list').childElementCount===expected,catalog.builds.length);
  assert.equal(await page.locator('#archive-snapshot-list > article').count(),catalog.builds.length);
  const buildNumbers=await page.locator('#archive-snapshot-list > article').evaluateAll(rows=>rows.map(row=>[row.dataset.buildNumber,row.querySelector('h3').textContent]));assert.equal(new Set(buildNumbers.map(([n])=>n)).size,catalog.builds.length);assert.deepEqual(buildNumbers.map(([n])=>Number(n)),catalog.builds.map(v=>v.buildNumber));assert.ok(buildNumbers.every(([n,heading])=>heading.startsWith(`Archive build ${n} — `)));assert.ok(await page.locator('#archive-build-note').isVisible());
  const historical=catalog.versions.find(v=>v.reconstructed&&v.available);assert.ok(historical,'A real historical milestone is required.');
  const row=page.locator('#archive-version-list > article').filter({has:page.locator(`[data-view-changes="${historical.version}"]`)});
  assert.equal(await row.locator('.archive-play').getAttribute('href'),historical.archiveURL);
  await row.getByRole('button',{name:'View Changes',exact:true}).click();
  const changes=page.locator('.changelog-release').filter({has:page.locator('summary').filter({hasText:`v${historical.version} `})});
  assert.equal(await changes.evaluate(e=>e.open),true);assert.equal(await changes.locator('.archive-play').getAttribute('href'),historical.archiveURL);
  await changes.locator('summary').click();assert.equal(await changes.evaluate(e=>e.open),false);
  assert.equal(await page.locator('#changelog-releases').getByText('Unreleased',{exact:true}).count(),0);
  await page.locator('#changelog-back').click();
  await page.setViewportSize({width:390,height:844});await page.locator('#main-archive').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#archive-back').click();await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS main-menu archive, ${catalog.versions.length} milestones / ${catalog.builds.length} actual snapshots, linked collapsible changelog, mobile`);
  }

  if(args.includes('--full')||args.includes('--i18n'))await i18nSmoke(page);
  await page.locator('#new-game').click();await page.locator('.setup-advanced summary').click();await page.locator('#setup-fog').uncheck();await page.locator('#setup-respawn').selectOption('off');
  // Residents stay where the smokes put them; Auto Employment has its own smoke.
  assert.equal(await page.locator('#setup-auto-employment').isChecked(),true);await page.locator('#setup-auto-employment').uncheck();
  if(await page.locator('#setup-seasons').count()){assert.equal(await page.locator('#setup-seasons').isChecked(),true);if(args.includes('--full')||args.includes('--seasons-menu'))await page.locator('#setup-seasons').uncheck();}
  await page.locator('#setup-stones').evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
  if(args.includes('--full')||args.includes('--ledger'))await ledgerSmoke(page);
  if(args.includes('--full')||args.includes('--smelting'))await smeltingSmoke(page);
  if(args.includes('--full')||args.includes('--military'))await militarySmoke(page);
  if(args.includes('--full')||args.includes('--wheelwright'))await wheelwrightSmoke(page);
  if(args.includes('--full')||args.includes('--stables'))await stablesSmoke(page);
  if(args.includes('--full')||args.includes('--pavement'))await pavementSmoke(page,{screenshot:process.env.PAVEMENT_SHOT??null});
  if(args.includes('--full')||args.includes('--dev-fps'))await devFpsSmoke(page);
  if(args.includes('--full')||args.includes('--walls'))await wallVisibilitySmoke(page);
  if(args.includes('--full')||args.includes('--housing'))await housingSmoke(page);
  if(args.includes('--full')||args.includes('--zoom'))await zoomSmoke(page);
  if(args.includes('--full')||args.includes('--minerals'))await mineralSmoke(page);
  if(args.includes('--full')||args.includes('--forestry'))await forestrySmoke(page);
  if(args.includes('--full')||args.includes('--forestry-workers'))await forestryHutSmoke(page);
  if(args.includes('--full')||args.includes('--population')){await populationSidebarSmoke(page);await populationNavigationSmoke(page);await populationIntegrationSmoke(page);}
  if(args.includes('--full')||args.includes('--staffing'))await staffingIndicatorsSmoke(page);
  if(args.includes('--full')||args.includes('--idle-stone'))await idleStoneSmoke(page);
  if(args.includes('--full')||args.includes('--wildlife-clearance'))await wildlifeClearanceSmoke(page);
  if(args.includes('--full')||args.includes('--unit-commands'))await unitCommandSmoke(page);
  if(args.includes('--full')||args.includes('--employment-exclusions'))await employmentExclusionsSmoke(page);
  if(args.includes('--full')||args.includes('--employment'))await employmentSmoke(page);
  if(args.includes('--full')||args.includes('--chain-notices'))await chainNoticesSmoke(page);
  if(args.includes('--full')||args.includes('--notices'))await noticesSmoke(page);
  if(args.includes('--full')||args.includes('--fog')){await explorationMenuSmoke(page);await staticMemoryRendererSmoke(page);await hiddenInteractionSmoke(page);}
  if(args.includes('--full')||args.includes('--i18n'))await i18nGameSmoke(page);
  if(args.includes('--full')||args.includes('--save-transfer'))await saveTransferSmoke(page);
  if(args.includes('--full')||args.includes('--autosave'))await autosaveSmoke(page);
  if(args.includes('--full')||args.includes('--seasons-menu'))await seasonsMenuSmoke(page);
  if(args.includes('--full')||args.includes('--season-transition'))await seasonTransitionSmoke(page);
  await buildingMenuSmoke(page);
  const point=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene;
    for(const a of s.animalSystem.animals.values())a.wanderWait=1e8;for(const w of s.workerSystem.liveWorkers())w.aiCooldown=1e8;
    const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),start=s.character.tile;
    for(let y=40;y<70;y++)for(let x=40;x<70;x++){
      const t={x,y},distance=Math.hypot(x-start.x,y-start.y);if(distance<8||distance>12||s.map[y]?.[x]!==0||occupied.has(`${x},${y}`)||s.resourceOccupancy.has(`${x},${y}`))continue;
      const point={x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16-4};if([...s.resources.values()].some(v=>v.getData('definition').tree&&v.containsPoint(point.x,point.y)))continue;
      if(!s.character.command({kind:'move',goal:t,silent:true}))continue;
      s.character.stopForBuilding();s.addResource(s.objectRegistry.require('stone'),t);
      s.worldCamera.following=false;s.cameras.main.setZoom(.9).centerOn(point.x,point.y);s.cameras.main.preRender();return point;
    }throw Error('No reachable smoke-test stone site.');
  });
  const camera=await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.cameras.main;return{x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,w:c.width,h:c.height,z:c.zoom};}),bounds=await page.locator('canvas').boundingBox();
  await page.mouse.click(bounds.x+((point.x-camera.x)*camera.z+camera.w/2)*bounds.width/camera.w,bounds.y+((point.y-camera.y)*camera.z+camera.h/2)*bounds.height/camera.h);
  await page.waitForFunction(()=>window.__game.registry.get('application').scene.character.cargo?.amount===1,null,{timeout:20000});
  const waiting=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {tile:s.character.tile,task:s.kingLogistics.task,stock:s.inventory.count('stone')};});
  assert.equal(waiting.task,null);assert.equal(waiting.stock,0);await page.waitForTimeout(1200);
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').scene.character.tile),waiting.tile);
  assert.equal(await page.locator('#king-cargo-deliver').isVisible(),true);
  await page.locator('#king-cargo-deliver').click();
  const record=await page.evaluate(async()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('test',true);localStorage.setItem('smoke.main','preserved');return app.saves.save({name:'Browser smoke: cargo in transit',state:app.snapshot()});});
  assert.equal(record.state.player.cargo.amount,1);assert.equal(record.state.inventory.stone??0,0);
  await page.evaluate(async id=>{const app=window.__game.registry.get('application'),record=await app.saves.get(id),ready=app.onGameReady.bind(app);window.__restored=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('test',true);window.__restored=true;app.onGameReady=ready;};await app.load(record.state);},record.id);
  await page.waitForFunction(()=>window.__restored);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),record.state);
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('test',false));await page.waitForFunction(()=>window.__game.registry.get('application').scene.inventory.count('stone')===1,null,{timeout:20000});
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.character.experience.totalXP),3);
  console.log('PASS New Game, real mouse movement/pickup, physical delivery, exact IndexedDB Save/Load in transit, no duplicated stock or XP');
  if(args.includes('--full'))await buildingUnlockGameplaySmoke(page);
  if(currentOnly){assert.equal(requests.some(url=>/\/versions\/[a-f0-9]{40}\//.test(url)),false);assert.equal(requests.some(url=>url.includes('/versions/catalog.json')),false);assert.deepEqual(errors,[]);await context.close();console.log('PASS cold current game starts and plays without requesting an archive catalog, historical script or historical graphic');return;}

  const original=catalog.versions.find(v=>v.version==='0.1.0'&&v.available);assert.ok(original,'Original official archive is required.');
  const old=await context.newPage();await instrument(old);await old.goto(origin+original.archiveURL);await old.locator('#new-game').click();await old.locator('#start-game').click();
  await old.waitForFunction(()=>window.__game?.registry.get('application').scene?.character);
  const isolated=await old.evaluate(async()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('test',true);const record=await app.saves.save({name:'Historical browser smoke',state:app.snapshot()});localStorage.clear();localStorage.setItem('smoke.main','archive only');return{database:(await app.saves.open()).name,id:record.id,schema:record.saveVersion,state:record.state};});
  assert.ok(isolated.database.includes(original.commit));assert.ok(isolated.schema<=record.saveVersion);
  assert.equal(await page.evaluate(()=>localStorage.getItem('smoke.main')),'preserved');assert.deepEqual(await page.evaluate(id=>window.__game.registry.get('application').saves.get(id),record.id),record);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').saves.list().then(rows=>rows.length)),1);
  await old.close();
  // ALPHA policy: an older schema is never converted. The Load menu flags it, offers a new game and keeps the slot.
  const current=await page.evaluate(async state=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('test',true);const before=app.snapshot();let outcome;
    try{await app.load(state);outcome={loaded:true};}catch(error){outcome={loaded:false,name:error.name,savedVersion:error.savedVersion,currentVersion:error.currentVersion};}
    return {before,after:app.snapshot(),outcome};},isolated.state);
  assert.deepEqual(current.outcome,{loaded:false,name:'IncompatibleSaveError',savedVersion:isolated.schema,currentVersion:record.saveVersion});assert.deepEqual(current.after,current.before);
  const stored=await page.evaluate(state=>window.__game.registry.get('application').saves.save({name:'Archived 0.1.0 kingdom',state}),isolated.state);
  await page.evaluate(()=>window.__game.registry.get('application').openSaves('load'));
  const row=page.locator('#save-list .save-row',{hasText:'Archived 0.1.0 kingdom'});await row.locator('.save-warning').waitFor();
  assert.match(await row.locator('.save-warning').textContent(),new RegExp(`schema ${isolated.schema}, current ${record.saveVersion}`));
  await row.locator('[data-action="load"]').click();await page.locator('#save-confirm[open]').waitFor();
  assert.match(await page.locator('#save-confirm-text').textContent(),/Start a new game instead\?/);assert.equal(await page.locator('#confirm-save-yes').textContent(),'Start New Game');
  await page.locator('#confirm-save-no').click();assert.equal(await page.locator('#save-load-dialog').evaluate(d=>d.open),true);
  assert.deepEqual(await page.evaluate(id=>window.__game.registry.get('application').saves.get(id).then(r=>r.state),stored.id),isolated.state,'the incompatible slot stays unchanged');
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),current.before);
  await row.locator('[data-action="load"]').click();await page.locator('#save-confirm[open]').waitFor();await page.locator('#confirm-save-yes').click();
  await page.locator('#game-setup').waitFor({state:'visible',timeout:10000});assert.equal(await page.locator('#start-game').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene),null,'the running game was stopped without saving over any slot');
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').saves.get(id).then(r=>!!r),stored.id),true,'starting a new game never deletes the old save');
  await page.evaluate(id=>window.__game.registry.get('application').saves.delete(id),stored.id);
  console.log(`PASS actual historical schema ${isolated.schema} save is reported as incompatible with schema ${record.saveVersion}; the world and the stored slot stay unchanged and New Game is offered`);
  // N04: starting resources on the restarted New Game screen go into the Starter Stockpile once, capped at its 40 units.
  {const set=(name,value)=>page.locator(`#game-setup-form [name="${name}"]`).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.locator('.setup-advanced summary').click();assert.equal(await page.locator('#setup-resources-total').textContent(),'0 / 40');
  await set('startingStone',25);await set('startingWood',25);assert.equal(await page.locator('#setup-start-wood').inputValue(),'15','the slider stops at the remaining room');assert.equal(await page.locator('#setup-resources-total').textContent(),'40 / 40');
  assert.match(await page.locator('#setup-summary').textContent(),/Stockpile: 25 stone, 15 wood/);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'setup fits a phone');await page.setViewportSize({width:1440,height:1000});
  await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
  const start=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,starter=s.buildings.find(b=>b.type==='starter_stockpile');return {stock:s.foodStorage.locations.get(`stockpile-${starter.id}`).stock,loose:s.resourceCount('stone'),initial:s.gameSettings.initialStoneCount,stone:s.inventory.count('stone'),settings:window.__game.registry.get('application').snapshot().gameSettings};});
  assert.deepEqual(start.stock,{stone:25,wood:15});assert.equal(start.stone,25);assert.equal(start.loose,start.initial,'loose map stones follow Initial Stones only');assert.equal(start.settings.startingWood,15);
  console.log(`PASS New Game starting resources: capped 40-unit Starter Stockpile, 25 Stone + 15 Wood deposited once, ${start.loose} loose map stones kept separate, phone-width setup`);}
  const archivePage=await context.newPage();await instrument(archivePage);await archivePage.goto(origin+base+'versions/');assert.equal(await archivePage.locator('[data-version-label]').count(),catalog.versions.length+(catalog.versions.some(v=>v.current)?0:1));
  await archivePage.setViewportSize({width:390,height:844});assert.equal(await archivePage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const first=catalog.builds.at(-1);await archivePage.goto(origin+first.archiveURL);await archivePage.locator('canvas').waitFor();
  const racePage=await context.newPage();await instrument(racePage);await racePage.route('**/versions/catalog.json',async route=>{const response=await route.fetch();await new Promise(resolve=>setTimeout(resolve,700));await route.fulfill({response});});await racePage.goto(origin+base);await racePage.locator('#main-archive').click();await racePage.locator('#new-game').click();await racePage.locator('#start-game').click();await racePage.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);await racePage.waitForTimeout(800);assert.equal(await racePage.locator('#version-archive-dialog').evaluate(dialog=>dialog.open),false);assert.equal(await racePage.locator('#archive-version-list > article').count(),0);await racePage.close();
  console.log('PASS starting a game cancels a delayed archive opening; hidden snapshot rows are not retained');
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS original historical game, separate real IndexedDB/localStorage, unchanged current save, static archive and earliest actual game');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
await runSmoke();
