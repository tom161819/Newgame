import { displayArchiveNumber } from '../src/data/archiveNumbers.js';
import { rockMiningSmoke } from './rock-mining-smoke.mjs';
import { castleGatheringSmoke } from './castle-gathering-smoke.mjs';
import { demolitionSmoke } from './demolition-smoke.mjs';
import { displayVersion } from '../src/data/semver.js';
import { stockpileCleanupSmoke } from './stockpile-cleanup-smoke.mjs';
import { repeatPlacementSmoke } from './repeat-placement-smoke.mjs';
import { farmerEstablishmentSmoke } from './farmer-establishment-smoke.mjs';
import { farmPlotsSmoke } from './farm-plots-smoke.mjs';
import { farmBlueprintSmoke } from './farm-blueprint-smoke.mjs';
import { populationJobMenuSmoke } from './population-job-menu-smoke.mjs';
import { e1Smoke } from './e1-smoke.mjs';
import { e2Smoke,quickStartSmoke } from './e2-smoke.mjs';
import { e4Smoke } from './e4-smoke.mjs';
import { startV2Smoke } from './start-v2-smoke.mjs';
import { resourceGroupsSmoke } from './resource-groups-smoke.mjs';
import { animals2Smoke } from './animals-2-smoke.mjs';
import { wikiSmoke } from './wiki-smoke.mjs';
import { eventsSmoke } from './events-smoke.mjs';
import { markingSmoke } from './marking-smoke.mjs';
import { walls2Smoke } from './walls-2-smoke.mjs';
import { residents3Smoke } from './residents-3-smoke.mjs';
import { worldLook2Smoke } from './world-look-2-smoke.mjs';
import { uiWindowsSmoke } from './ui-windows-smoke.mjs';
import { materialYardSmoke } from './material-yard-smoke.mjs';
import { approvedArtSmoke } from './approved-art-smoke.mjs';
import { kingXpSmoke } from './king-xp-smoke.mjs';
import { notices2Smoke } from './notices-2-smoke.mjs';
import { depletedMineSmoke } from './depleted-mine-smoke.mjs';
import { bigNatureSmoke } from './big-nature-smoke.mjs';
import { woodcutterTreesSmoke } from './woodcutter-trees-smoke.mjs';
import { ironMineSpotSmoke } from './iron-mine-spot-smoke.mjs';
import { animals3Smoke } from './animals-3-smoke.mjs';
import { farmhouseStoreSmoke } from './farmhouse-store-smoke.mjs';
import { buildingTooltipSmoke,nightSpeedSmoke } from './building-tooltip-smoke.mjs';
import { employment2Smoke } from './employment-2-smoke.mjs';
import { animalLooksSmoke } from './animal-looks-smoke.mjs';
import { tutorialSmoke } from './tutorial-smoke.mjs';
import { tutorialV3Smoke } from './tutorial-v3-smoke.mjs';
import { soldiersSmoke,recruitsSmoke } from './soldiers-smoke.mjs';
import { workplaceOutputSmoke } from './workplace-output-smoke.mjs';
import { granaryCapacitySmoke } from './granary-capacity-smoke.mjs';
import { farmerTendingSmoke } from './farmer-tending-smoke.mjs';
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
import { rightClickSmoke } from './right-click-smoke.mjs';
import { paveUnderSmoke } from './pave-under-smoke.mjs';
import { devFpsSmoke } from './dev-fps-smoke.mjs';
import { memoryBrightnessSmoke } from './memory-brightness-smoke.mjs';
import { minimapSmoke } from './minimap-smoke.mjs';
import { hudCargoSmoke } from './hud-cargo-smoke.mjs';
import { millSailsSmoke } from './mill-sails-smoke.mjs';
import { eventFeedSmoke } from './event-feed-smoke.mjs';
import { needsSmoke } from './needs-smoke.mjs';
import { wallVisibilitySmoke } from './wall-visibility-smoke.mjs';
import { wheelwrightSmoke } from './wheelwright-smoke.mjs';
import { stablesSmoke } from './stables-smoke.mjs';
import { horseWagonSmoke } from './horse-wagon-smoke.mjs';
import { housingSmoke } from './housing-smoke.mjs';
import { forestrySmoke,forestryHutSmoke } from './forestry-smoke.mjs';
import { gettingStartedSmoke } from './getting-started-smoke.mjs';
import { buildingCostsSmoke } from './building-costs-smoke.mjs';
import { marketplaceSmoke } from './marketplace-smoke.mjs';
import { gateSmoke } from './gate-smoke.mjs';
import { worldSmoke } from './world-smoke.mjs';
import { builderWorkshopSmoke } from './builder-workshop-smoke.mjs';
import { fishingSmoke } from './fishing-smoke.mjs';
import { pathsV2Smoke } from './paths-v2-smoke.mjs';
import { policySmoke } from './policy-smoke.mjs';
import { devBalanceSmoke } from './dev-balance-smoke.mjs';
import { devToolSmoke } from './dev-tool-smoke.mjs';
import { performanceSmoke } from './performance-smoke.mjs';
import { backgroundSmoke } from './background-smoke.mjs';
import { worldCodeSmoke } from './world-code-smoke.mjs';
import { worldEditorSmoke } from './world-editor-smoke.mjs';
import { flowerNoiseSmoke } from './flower-noise-smoke.mjs';
import { smoothTransitionsSmoke } from './smooth-transitions-smoke.mjs';
import { petsSmoke } from './pets-smoke.mjs';
import { dogSmoke } from './dog-smoke.mjs';
import { walkSmoke } from './walk-smoke.mjs';
import { childrenSmoke } from './children-smoke.mjs';
import { employmentSpreadSmoke } from './employment-spread-smoke.mjs';
import { storageNoticesSmoke } from './storage-notices-smoke.mjs';
import { uiThemeSmoke } from './ui-theme-smoke.mjs';
import { storageWindowSmoke } from './storage-window-smoke.mjs';
import { sideCardsSmoke } from './side-cards-smoke.mjs';
import { uiFixes076Smoke } from './ui-fixes-076-smoke.mjs';
import { tipsHudSmoke } from './tips-hud-smoke.mjs';
import { chosenArtSmoke } from './chosen-art-smoke.mjs';
import { castleArtSmoke } from './castle-art-smoke.mjs';
import { houseDecorationsSmoke } from './house-decorations-smoke.mjs';
import { porchSmoke } from './porch-smoke.mjs';
import { dayNightSmoke } from './day-night-smoke.mjs';
import { torchesSmoke } from './torches-smoke.mjs';
import { campfireSmoke } from './campfire-smoke.mjs';
import { wolvesSmoke } from './wolves-smoke.mjs';
import { thievesSmoke } from './thieves-smoke.mjs';
import { fireSmoke } from './fire-smoke.mjs';
import { kingdomOverviewSmoke } from './kingdom-overview-smoke.mjs';
import { kingdomBarSmoke } from './kingdom-bar-smoke.mjs';


const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const base=projectBase(args.find(a=>a.startsWith('--base='))?.slice(7)??'/Newgame/'),dist=path.join(root,'dist');
const catalog=JSON.parse(await readFile(path.join(dist,'versions/catalog.json'),'utf8'));
const currentOnly=args.includes('--current-only');
// --keep-going (0.49.0): a failing scenario is reported and the run goes on, so one run lists every failure. Scenarios
// on the shared main page may then start from an unusual state: re-run a failed one alone with its own flag.
const keepGoing=args.includes('--keep-going'),failures=[];
const selected=name=>args.includes('--full')||args.includes(`--${name}`);
async function step(name,run){
  if(!selected(name))return;if(!keepGoing)return run();
  const started=Date.now();try{await run();}catch(error){failures.push(name);console.log(`FAIL --${name} (${Math.round((Date.now()-started)/1000)} s): ${String(error?.message??error).split('\n')[0].slice(0,300)}`);}
}
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
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],requests=[];
  // UI Lab styles (m-ui-lab-do-hry): SMOKE_UI_STYLE=stone-castle (or olive, wood-iron, parchment, classic) runs the whole
  // smoke in that style; without it the game uses the owner's Studio design, as players get it.
  // E2: the New Game setup folds its form under Custom settings; the smokes work with it open.
  // m-teren-vyska (part 2): the smokes click the map by the flat projection (ROWS*32+(x-y)*32, 128+(x+y+1)*16 in about
  // twenty scripts), so they run with the ground drawn flat (hills and their rules stay on). The performance smoke turns
  // the lift on again.
  await context.addInitScript(()=>{try{if(!localStorage.getItem('newgame.terrainLift'))localStorage.setItem('newgame.terrainLift','off');}catch{}});
  await context.addInitScript(()=>{try{if(!localStorage.getItem('newgame.setupCustom'))localStorage.setItem('newgame.setupCustom','open');if(!localStorage.getItem('newgame.tutorial'))localStorage.setItem('newgame.tutorial','off');if(!localStorage.getItem('newgame.tips'))localStorage.setItem('newgame.tips','off');}catch{}});
  // E3: the smokes were written for the Getting started window after New Game; the arrow tutorial has its own smoke.
  if(process.env.SMOKE_UI_STYLE)await context.addInitScript(style=>{try{localStorage.setItem('newgame.uiStyle',style);}catch{}},process.env.SMOKE_UI_STYLE);page.on('request',request=>requests.push(request.url()));
  const instrument=async p=>{
    p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    // Instrument the served copy only; no test globals are shipped in the game.
    await p.route('**/assets/index-*.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/new ([\w$]+)\.Game\(/,'window.__game = new $1.Game(')});});
  };
  await page.addInitScript(()=>{let state=77123;Math.random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32);});
  await instrument(page);await page.goto(origin+base);
  // #174: players see two-digit MINOR/PATCH (0.3.0 → v0.03.00); the canonical version stays in a data attribute.
  const shown=`v${displayVersion(catalog.gameVersion)}`;assert.match(shown,/^v\d+\.\d{2,}\.\d{2,}$/);assert.ok((await page.title()).includes(shown));
  for(const label of await page.locator('[data-game-version]').allTextContents())assert.equal(label,shown);
  for(const value of await page.locator('[data-game-version]').evaluateAll(labels=>labels.map(l=>l.dataset.canonicalVersion)))assert.equal(value,catalog.gameVersion);
  assert.equal(await page.locator('#archive-version-list > article').count(),0);assert.equal(await page.locator('#archive-snapshot-list > article').count(),0);
  assert.equal(requests.some(url=>url.includes('/versions/catalog.json')),false);
  if(!currentOnly){
  await page.locator('#main-archive').click();await page.locator('#version-archive-dialog[open]').waitFor();
  assert.equal(await page.locator('#archive-version-list > article').count(),catalog.versions.length+(catalog.versions.some(v=>v.current)?0:1));
  assert.equal(await page.locator('#archive-snapshot-list > article').count(),0);await page.locator('#archive-snapshot-count').click();
  await page.waitForFunction(expected=>document.querySelector('#archive-snapshot-list').childElementCount===expected,catalog.builds.length);
  assert.equal(await page.locator('#archive-snapshot-list > article').count(),catalog.builds.length);
  const buildNumbers=await page.locator('#archive-snapshot-list > article').evaluateAll(rows=>rows.map(row=>[row.dataset.buildNumber,row.querySelector('h3').textContent]));assert.equal(new Set(buildNumbers.map(([n])=>n)).size,catalog.builds.length);assert.deepEqual(buildNumbers.map(([n])=>Number(n)),catalog.builds.map(v=>v.buildNumber));assert.ok(buildNumbers.every(([n,heading],i)=>heading.startsWith(`v${displayArchiveNumber(catalog.builds[i].number)} — `)),'m-verzovani-archivu: snapshots show their time-ordered number');assert.equal(new Set(catalog.builds.map(b=>b.number)).size,catalog.builds.length);assert.ok(await page.locator('#archive-build-note').isVisible());
  const historical=catalog.versions.find(v=>v.reconstructed&&v.available);assert.ok(historical,'A real historical milestone is required.');
  const row=page.locator('#archive-version-list > article').filter({has:page.locator(`[data-view-changes="${historical.version}"]`)});
  assert.equal(await row.locator('.archive-play').getAttribute('href'),historical.archiveURL);
  await row.getByRole('button',{name:'View Changes',exact:true}).click();
  const changes=page.locator('.changelog-release').filter({has:page.locator('summary').filter({hasText:`v${displayVersion(historical.version)} `})});
  assert.equal(await changes.evaluate(e=>e.open),true);assert.equal(await changes.locator('.archive-play').getAttribute('href'),historical.archiveURL);
  await changes.locator('summary').click();assert.equal(await changes.evaluate(e=>e.open),false);
  assert.equal(await page.locator('#changelog-releases').getByText('Unreleased',{exact:true}).count(),0);
  await page.locator('#changelog-back').click();
  await page.setViewportSize({width:390,height:844});await page.locator('#main-archive').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#archive-back').click();await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS main-menu archive, ${catalog.versions.length} milestones / ${catalog.builds.length} actual snapshots, linked collapsible changelog, mobile`);
  }

  await step('i18n',()=>i18nSmoke(page));
  await page.locator('#new-game').click();await page.locator('.setup-advanced summary').click();await page.locator('#setup-fog').uncheck();await page.locator('#setup-respawn').selectOption('off');
  // Residents stay where the smokes put them; Auto Employment has its own smoke.
  assert.equal(await page.locator('#setup-auto-employment').isChecked(),true);await page.locator('#setup-auto-employment').uncheck();
  if(await page.locator('#setup-seasons').count()){assert.equal(await page.locator('#setup-seasons').isChecked(),true);await step('seasons-menu',()=>page.locator('#setup-seasons').uncheck());}
  // Owner request 7 Nov 2026: the setup proposes a Castle, 500 Gold and the starting resources. This scenario keeps
  // the earlier empty start (no Castle, no Gold, empty stockpile) that the steps below were written for.
  assert.equal(await page.locator('#setup-castle').isChecked(),true);assert.equal(await page.locator('#setup-gold').inputValue(),'500');
  // E1 (owner 7 Nov 2026): basic buildings are wooden, so the start has more wood and no Iron Ore.
  for(const [id,value] of [['stone','30'],['wood','110'],['iron-ore','0'],['bread','160']])assert.equal(await page.locator(`#setup-start-${id}`).inputValue(),value);
  await page.locator('#setup-castle').uncheck();await page.locator('#setup-garrison').uncheck();
  for(const selector of ['#setup-gold','#setup-start-stone','#setup-start-wood','#setup-start-iron-ore','#setup-start-bread'])await page.locator(selector).evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#setup-stones').evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
  // A New Game from the setup opens Getting started once (0.9.3); the scenario below starts with it closed.
  await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});assert.equal(await page.locator('#help-dialog').evaluate(d=>d.open),false);
  await step('getting-started',()=>gettingStartedSmoke(context,origin+base,instrument));
  await step('building-costs',()=>buildingCostsSmoke(context,origin+base,instrument));
  await step('e2',()=>quickStartSmoke(context,origin+base,instrument));
  await step('animal-looks',()=>animalLooksSmoke(context,origin+base,instrument));
  await step('start-v2',()=>startV2Smoke(context,origin+base,instrument));
  await step('resource-groups',()=>resourceGroupsSmoke(context,origin+base,instrument));
  await step('animals-2',()=>animals2Smoke(context,origin+base,instrument));
  await step('wiki',()=>wikiSmoke(context,origin+base,instrument));
  await step('events',()=>eventsSmoke(context,origin+base,instrument));
  await step('marking',()=>markingSmoke(context,origin+base,instrument));
  await step('walls-2',()=>walls2Smoke(context,origin+base,instrument));
  await step('residents-3',()=>residents3Smoke(context,origin+base,instrument));
  await step('world-look-2',()=>worldLook2Smoke(context,origin+base,instrument));
  await step('ui-windows',()=>uiWindowsSmoke(context,origin+base,instrument));
  await step('material-yard',()=>materialYardSmoke(context,origin+base,instrument));
  await step('approved-art',()=>approvedArtSmoke(context,origin+base,instrument));
  await step('king-xp',()=>kingXpSmoke(context,origin+base,instrument));
  await step('notices-2',()=>notices2Smoke(context,origin+base,instrument));
  await step('depleted-mine',()=>depletedMineSmoke(context,origin+base,instrument));
  await step('big-nature',()=>bigNatureSmoke(context,origin+base,instrument));
  await step('woodcutter-trees',()=>woodcutterTreesSmoke(context,origin+base,instrument));
  await step('iron-mine-spot',()=>ironMineSpotSmoke(context,origin+base,instrument));
  await step('animals-3',()=>animals3Smoke(context,origin+base,instrument));
  await step('farmhouse-store',()=>farmhouseStoreSmoke(context,origin+base,instrument));
  await step('building-tooltip',()=>buildingTooltipSmoke(context,origin+base,instrument));
  await step('night-speed',()=>nightSpeedSmoke(context,origin+base,instrument));
  await step('tutorial',()=>tutorialSmoke(context,origin+base,instrument));
  await step('tutorial-v3',()=>tutorialV3Smoke(context,origin+base,instrument));
  await step('soldiers',()=>soldiersSmoke(context,origin+base,instrument));
  await step('recruits',()=>recruitsSmoke(context,origin+base,instrument));
  await step('marketplace',()=>marketplaceSmoke(context,origin+base,instrument));
  await step('gate',()=>gateSmoke(context,origin+base,instrument));
  await step('world',()=>worldSmoke(context,origin+base,instrument));
  await step('builder-workshop',()=>builderWorkshopSmoke(context,origin+base,instrument));
  await step('fishing',()=>fishingSmoke(context,origin+base,instrument));
  await step('paths-v2',()=>pathsV2Smoke(context,origin+base,instrument));
  await step('policy',()=>policySmoke(context,origin+base,instrument));
  await step('dev-balance',()=>devBalanceSmoke(context,origin+base,instrument));
  await step('dev-tool',()=>devToolSmoke(context,origin+base,instrument));
  await step('performance',()=>performanceSmoke(context,origin+base,instrument));
  await step('background',()=>backgroundSmoke(context,origin+base,instrument));
  await step('world-code',()=>worldCodeSmoke(context,origin+base,instrument));
  await step('world-editor',()=>worldEditorSmoke(context,origin+base,instrument));
  await step('flower-noise',()=>flowerNoiseSmoke(context,origin+base,instrument));
  await step('smooth-transitions',()=>smoothTransitionsSmoke(context,origin+base,instrument));
  await step('pets',()=>petsSmoke(context,origin+base,instrument));
  await step('dog',()=>dogSmoke(context,origin+base,instrument));
  await step('walk',()=>walkSmoke(context,origin+base,instrument));
  await step('children',()=>childrenSmoke(context,origin+base,instrument));
  await step('employment-spread',()=>employmentSpreadSmoke(context,origin+base,instrument));
  await step('storage-notices',()=>storageNoticesSmoke(context,origin+base,instrument));
  await step('ui-theme',()=>uiThemeSmoke(context,origin+base,instrument));
  await step('storage-window',()=>storageWindowSmoke(context,origin+base,instrument));
  await step('side-cards',()=>sideCardsSmoke(context,origin+base,instrument));
  await step('ui-fixes-076',()=>uiFixes076Smoke(context,origin+base,instrument));
  await step('tips-hud',()=>tipsHudSmoke(context,origin+base,instrument));
  await step('chosen-art',()=>chosenArtSmoke(context,origin+base,instrument));
  await step('castle-art',()=>castleArtSmoke(context,origin+base,instrument));
  await step('decorations',()=>houseDecorationsSmoke(context,origin+base,instrument));
  await step('porch',()=>porchSmoke(context,origin+base,instrument));
  await step('day-night',()=>dayNightSmoke(context,origin+base,instrument));
  await step('torches',()=>torchesSmoke(context,origin+base,instrument));
  await step('campfire',()=>campfireSmoke(context,origin+base,instrument));
  await step('wolves',()=>wolvesSmoke(context,origin+base,instrument));
  await step('thieves',()=>thievesSmoke(context,origin+base,instrument));
  await step('fire',()=>fireSmoke(context,origin+base,instrument));
  await step('overview',()=>kingdomOverviewSmoke(context,origin+base,instrument));
  await step('kingdom-bar',()=>kingdomBarSmoke(context,origin+base,instrument));
  await step('ledger',()=>ledgerSmoke(page));
  await step('smelting',()=>smeltingSmoke(page));
  await step('military',()=>militarySmoke(page));
  await step('wheelwright',()=>wheelwrightSmoke(page));
  await step('stables',()=>stablesSmoke(page));
  await step('horse-wagon',()=>horseWagonSmoke(page));
  await step('pavement',()=>pavementSmoke(page,{screenshot:process.env.PAVEMENT_SHOT??null}));
  await step('right-click',()=>rightClickSmoke(page));
  await step('pave-under',()=>paveUnderSmoke(page));
  await step('dev-fps',()=>devFpsSmoke(page));
  await step('fog-brightness',()=>memoryBrightnessSmoke(page,{screenshot:process.env.BRIGHTNESS_SHOT??null}));
  await step('needs',()=>needsSmoke(page,{screenshot:process.env.NEEDS_SHOT??null}));
  await step('mill-sails',()=>millSailsSmoke(page,{screenshot:process.env.MILL_SHOT??null}));
  await step('hud-cargo',()=>hudCargoSmoke(page,{screenshot:process.env.HUD_CARGO_SHOT??null}));
  await step('minimap',()=>minimapSmoke(page,{screenshot:process.env.MINIMAP_SHOT??null}));
  await step('event-feed',()=>eventFeedSmoke(page,{screenshot:process.env.FEED_SHOT??null}));
  await step('walls',()=>wallVisibilitySmoke(page));
  await step('housing',()=>housingSmoke(page));
  await step('zoom',()=>zoomSmoke(page));
  await step('minerals',()=>mineralSmoke(page));
  await step('forestry',()=>forestrySmoke(page));
  await step('forestry-workers',()=>forestryHutSmoke(page));
  await step('population',async()=>{await populationSidebarSmoke(page);await populationNavigationSmoke(page);await populationIntegrationSmoke(page);});
  await step('workplace-output',()=>workplaceOutputSmoke(page));
  await step('granary-capacity',()=>granaryCapacitySmoke(page));
  await step('farmer-establishment',()=>farmerEstablishmentSmoke(page));
  await step('rock-mining',()=>rockMiningSmoke(page,{screenshot:args.includes('--rock-shot')?'/tmp/newgame-rock-mining.png':null}));
  await step('castle-gathering',()=>castleGatheringSmoke(page,{screenshot:args.includes('--gather-shot')?'/tmp/newgame-castle-gathering.png':null}));
  await step('demolition',()=>demolitionSmoke(page,{screenshot:args.includes('--demolition-shot')?'/tmp/newgame-demolition-confirm.png':null}));
  await step('stockpile-cleanup',()=>stockpileCleanupSmoke(page));
  await step('repeat-placement',()=>repeatPlacementSmoke(page));
  await step('farm-plots',()=>farmPlotsSmoke(page));
  await step('farm-blueprint',()=>farmBlueprintSmoke(page));
  await step('job-menu',()=>populationJobMenuSmoke(page));
  await step('e1',()=>e1Smoke(page));
  await step('e2',()=>e2Smoke(page));
  await step('e4',()=>e4Smoke(page));
  await step('farmer-tending',()=>farmerTendingSmoke(page));
  await step('staffing',()=>staffingIndicatorsSmoke(page));
  await step('idle-stone',()=>idleStoneSmoke(page));
  await step('wildlife-clearance',()=>wildlifeClearanceSmoke(page));
  await step('unit-commands',()=>unitCommandSmoke(page));
  await step('employment-exclusions',()=>employmentExclusionsSmoke(page));
  await step('employment',()=>employmentSmoke(page));
  await step('employment-2',()=>employment2Smoke(page));
  await step('chain-notices',()=>chainNoticesSmoke(page));
  await step('notices',()=>noticesSmoke(page));
  await step('fog',async()=>{await explorationMenuSmoke(page);await staticMemoryRendererSmoke(page);await hiddenInteractionSmoke(page);});
  await step('i18n',()=>i18nGameSmoke(page));
  await step('save-transfer',()=>saveTransferSmoke(page));
  await step('autosave',()=>autosaveSmoke(page));
  await step('seasons-menu',()=>seasonsMenuSmoke(page));
  await step('season-transition',()=>seasonTransitionSmoke(page));
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
  const camera=await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.cameras.main;return{x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,w:c.width,h:c.height,z:c.zoom};}),bounds=await page.locator('canvas:not(.minimap-canvas):not(.world-preview):not(.we-map):not(.we-iso)').boundingBox();
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
  await step('building-unlocks',()=>buildingUnlockGameplaySmoke(page));
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
  // N04: starting resources on the restarted New Game screen go into the Starter Stockpile once, capped at its 300 units (m-start-v2)
  // (0.9.2: the setup proposes 40 of each, which fills it).
  {const set=(name,value)=>page.locator(`#game-setup-form [name="${name}"]`).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.locator('.setup-advanced summary').click();assert.equal(await page.locator('#setup-resources-total').textContent(),'300 / 300');
  await set('startingIronOre',0);await set('startingBread',0);await set('startingWood',0);/* m-drevo-start: 110 default Wood would cap Stone at 190 */await set('startingStone',200);await set('startingWood',200);assert.equal(await page.locator('#setup-start-wood').inputValue(),'100','the slider stops at the remaining room');assert.equal(await page.locator('#setup-resources-total').textContent(),'300 / 300');
  assert.match(await page.locator('#setup-summary').textContent(),/Stockpile: 200 stone, 100 wood/);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'setup fits a phone');await page.setViewportSize({width:1440,height:1000});
  await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
  const start=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,starter=s.buildings.find(b=>b.type==='starter_stockpile');return {stock:s.foodStorage.locations.get(`stockpile-${starter.id}`).stock,loose:s.resourceCount('stone'),initial:s.gameSettings.initialStoneCount,stone:s.inventory.count('stone'),settings:window.__game.registry.get('application').snapshot().gameSettings};});
  assert.deepEqual(start.stock,{stone:200,wood:100});assert.equal(start.stone,200);assert.equal(start.loose,start.initial,'loose map stones follow Initial Stones only');assert.equal(start.settings.startingWood,100);
  console.log(`PASS New Game starting resources: capped 300-unit Starter Stockpile, 200 Stone + 100 Wood deposited once, ${start.loose} loose map stones kept separate, phone-width setup`);}
  const archivePage=await context.newPage();await instrument(archivePage);await archivePage.goto(origin+base+'versions/');assert.equal(await archivePage.locator('[data-version-label]').count(),catalog.versions.length+(catalog.versions.some(v=>v.current)?0:1));
  await archivePage.setViewportSize({width:390,height:844});assert.equal(await archivePage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const first=catalog.builds.at(-1);await archivePage.goto(origin+first.archiveURL);await archivePage.locator('canvas:not(.minimap-canvas):not(.world-preview):not(.we-map):not(.we-iso)').waitFor();
  const racePage=await context.newPage();await instrument(racePage);await racePage.route('**/versions/catalog.json',async route=>{const response=await route.fetch();await new Promise(resolve=>setTimeout(resolve,700));await route.fulfill({response});});await racePage.goto(origin+base);await racePage.locator('#main-archive').click();await racePage.locator('#new-game').click();await racePage.locator('#start-game').click();await racePage.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);await racePage.waitForTimeout(800);assert.equal(await racePage.locator('#version-archive-dialog').evaluate(dialog=>dialog.open),false);assert.equal(await racePage.locator('#archive-version-list > article').count(),0);await racePage.close();
  console.log('PASS starting a game cancels a delayed archive opening; hidden snapshot rows are not retained');
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS original historical game, separate real IndexedDB/localStorage, unchanged current save, static archive and earliest actual game');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
await runSmoke();
if(failures.length){console.log(`FAILED ${failures.length}: ${failures.map(f=>`--${f}`).join(' ')}`);process.exitCode=1;}else if(keepGoing)console.log('ALL SMOKES PASSED');
