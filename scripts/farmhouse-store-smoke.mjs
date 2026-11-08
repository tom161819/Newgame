import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { placeBlueprint,supplyAndBuild } from './building-menu-smoke.mjs';

// farmhouse-store (owner 8 Nov 2026) in a real page: a Farmhouse keeps a 200-unit store for Wheat and Flour, the
// Granary refuses both. The resource bar counts Farmhouse grain (raw food group), the Farmhouse panel shows its store
// and opens the store window, the map preview over the Farmhouse lists its grain, rats grow there, and Save/Load
// keeps the store. Screenshot: /tmp/shots/farmhouse-store.png.
export async function farmhouseStoreSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.foodStorage&&window.__game.registry.get('application').scene.domestic);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    // A Farmhouse and a Granary built the ordinary way (blueprint, the King carries the materials and builds).
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.employment?.setEnabled(false);s.fog?.setEnabled(false);s.refreshVisibility?.();});
    const farmSite=await placeBlueprint(page,'farmhouse');await supplyAndBuild(page,farmSite);const granarySite=await placeBlueprint(page,'granary');await supplyAndBuild(page,granarySite);
    const ids={farm:farmSite.id,granary:granarySite.id};
    const state=await page.evaluate(({farm,granary})=>{
      const s=window.__game.registry.get('application').scene,st=s.foodStorage,l=st.locations.get(`farmhouse-${farm}`),g=st.locations.get(`granary-${granary}`);
      const refused=[st.deposit(g.id,'wheat',1),st.deposit(g.id,'flour',1)];const before=s.inventory.count('wheat');
      const stored=[st.deposit(l.id,'wheat',150),st.deposit(l.id,'flour',20)];s.updateInventory?.();
      return {kind:l.kind,capacity:l.capacity,allowed:l.allowed,granaryAllowed:g.allowed,refused,stored,wheat:s.inventory.count('wheat')-before};
    },ids);
    assert.equal(state.kind,'storage');assert.equal(state.capacity,200);assert.deepEqual(state.allowed,['wheat','flour']);
    assert.ok(!state.granaryAllowed.includes('wheat')&&!state.granaryAllowed.includes('flour'),'the Granary takes no grain');assert.deepEqual(state.refused,[false,false]);
    assert.deepEqual(state.stored,[true,true]);assert.equal(state.wheat,150,'Farmhouse grain is kingdom stock');
    // Resource bar: Wheat sits in the raw-food group and shows the Farmhouse stock.
    await page.waitForFunction(()=>document.querySelector('#wheat-count')?.textContent?.trim()!=='0');
    const bar=await page.evaluate(()=>{const o=document.querySelector('#wheat-count');return {group:o.closest('[data-resource-economy]')?.dataset.resourceGroup,count:o.textContent.trim()};});
    assert.equal(bar.group,'foodRaw');assert.ok(Number(bar.count)>=150,`bar shows ${bar.count}`);
    // The map preview over the Farmhouse lists its grain.
    // (The live hover follows the real pointer every frame, so the preview content is rendered directly here.)
    const preview=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,p=s.storePreview,b=s.buildings.find(b=>b.id===id);p.render({key:'smoke',locations:()=>p.locationsOf(b)});const t=p.root;return {hidden:false,text:t.textContent,groups:[...t.querySelectorAll('[data-resource-group]')].map(e=>e.dataset.resourceGroup)};},ids.farm);
    assert.equal(preview.hidden,false);assert.match(preview.text,/170 \/ 200/);assert.ok(preview.groups.includes('foodRaw'));
    // The Farmhouse click opens the workplace panel with its store line; the button opens the store window.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,d=s.domestic;d.rats.set(`farmhouse-${id}`,50);s.workplacePanel.open(s.buildings.find(b=>b.id===id));},ids.farm);
    await page.locator('#workplace-dialog[open]').waitFor();
    const panel={store:(await page.locator('#farm-store-text').textContent()).trim(),rats:(await page.locator('#workplace-rats').textContent()).trim(),hidden:await page.locator('#farm-store').isHidden()};
    assert.equal(panel.hidden,false);assert.match(panel.store,/150 Wheat \+ 20 Flour · 170\/200|150 .* · 170\/200/);assert.match(panel.rats,/Rats: Many|Krysy:/);
    await page.locator('#farm-store-open').click();await page.locator('#storage-dialog[open]').waitFor();
    const window_=(await page.locator('#storage-details').textContent());assert.match(window_,/Wheat|Pšenice/);assert.match(window_,/170 \/ 200/);
    const dir=process.env.SMOKE_SHOTS??'/tmp/shots';await mkdir(dir,{recursive:true});await page.waitForTimeout(500);await page.screenshot({path:`${dir}/farmhouse-store.png`});
    await page.keyboard.press('Escape');
    // Save/Load keeps the Farmhouse store.
    const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.equal(saved.saveVersion,SAVE_VERSION);
    await page.evaluate(async state=>{const a=window.__game.registry.get('application');window.__fsReady=false;const ready=a.onGameReady.bind(a);a.onGameReady=s=>{ready(s);window.__fsReady=true;a.onGameReady=ready;};await a.load(state);},saved);
    await page.waitForFunction(()=>window.__fsReady);
    const loaded=await page.evaluate(id=>window.__game.registry.get('application').scene.foodStorage.locations.get(`farmhouse-${id}`)?.stock,ids.farm);
    assert.ok(loaded.wheat>=140&&loaded.flour>=18,`stock after load ${JSON.stringify(loaded)}`);
    assert.deepEqual(errors,[]);
    console.log(`PASS farmhouse-store: Farmhouse store 200 (Wheat, Flour), Granary refuses grain, bar ${bar.count} Wheat in foodRaw, preview "${preview.text.slice(0,40)}", panel "${panel.store}", rats "${panel.rats}", Save/Load schema ${SAVE_VERSION} keeps ${JSON.stringify(loaded)}; screenshot ${dir}/farmhouse-store.png`);
  }finally{await page.close();}
}
