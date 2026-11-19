import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Storage window (owner, 7 Nov): no "Collect with King" buttons; one table per store with an icon on every row, amounts,
// small grey reserved counts, groups (materials / food / equipment), empty goods hidden and a fill bar on top. Checked on
// the Starter Stockpile, a Material Yard and a Granary, in every UI style (screenshots with SMOKE_SHOTS).
const finish=(page,ids)=>page.evaluate(ids=>ids.map(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);}),ids);
export async function storageWindowSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW6-1555155555555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.storagePanel);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',40);s.inventory.add('stone',40);s.updateInventory();});
    const warehouse=await placeBlueprint(page,'material_yard'),granary=await placeBlueprint(page,'granary');assert.deepEqual(await finish(page,[warehouse.id,granary.id]),[true,true]);
    await page.evaluate(({w,g})=>{const s=window.__game.registry.get('application').scene,st=s.foodStorage;st.deposit(`yard-${w}`,'wood',30);st.deposit(`yard-${w}`,'stone',12);
      const gl=[...st.locations.values()].find(l=>l.buildingId===g&&st.isStock(l));st.deposit(gl.id,'wheat',25);st.deposit(gl.id,'bread',6);st.reserve('stock',gl.id,'bread',2,'smoke');},{w:warehouse.id,g:granary.id});
    const stores=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return s.buildings.filter(b=>['starter_stockpile','material_yard','granary'].includes(b.type)).map(b=>({id:b.id,type:b.type}));});
    const check=async store=>{
      await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.storagePanel.open(s.buildings.find(b=>b.id===id));},store.id);await page.locator('#storage-dialog[open]').waitFor();
      const r=await page.evaluate(()=>{const d=document.querySelector('#storage-details');return {collect:d.querySelectorAll('[data-king-collect]').length,rows:[...d.querySelectorAll('tr.storage-resource')].map(tr=>({id:tr.dataset.storageResource,icon:!!tr.querySelector('.storage-icon'),temp:tr.querySelector('[data-missing-icon]')?.dataset.missingIcon??null,amount:tr.querySelector('.storage-amount').textContent,reserved:tr.querySelector('.storage-reserved').textContent})),groups:[...d.querySelectorAll('tr.storage-group')].map(g=>g.textContent),meter:!!d.querySelector('.storage-fill meter')||!!d.querySelector('[data-granary-group]'),fill:d.querySelector('.storage-fill-count')?.textContent??null};});
      assert.equal(r.collect,0,'no Collect with King');assert.ok(r.rows.length>0,`${store.type} lists goods`);assert.ok(r.rows.every(x=>x.icon),'every row has an icon');assert.ok(r.rows.every(x=>Number(x.amount)>0||x.reserved),'empty goods hidden');assert.ok(r.meter,'fill shown');
      return r;
    };
    const results={};for(const store of stores)results[store.type]=await check(store);await page.keyboard.press('Escape');
    assert.deepEqual(results.material_yard.rows.map(r=>[r.id,r.amount]).sort(),[['stone','12'],['wood','30']]);assert.match(results.material_yard.fill,/^42 \/ 400$/);
    assert.ok(results.granary.rows.some(r=>r.id==='bread'&&/reserved 2/.test(r.reserved)),'reserved in small grey');assert.ok(results.granary.groups.some(g=>/Food/i.test(g)));
    assert.ok(results.starter_stockpile.groups.length>=2,'the Starter Stockpile groups materials and food');
    const missing=[...new Set(Object.values(results).flatMap(r=>r.rows.map(x=>x.temp).filter(Boolean)))];
    if(process.env.SMOKE_SHOTS)for(const style of ['studio','olive','wood-iron','parchment','stone-castle']){
      await page.evaluate(style=>{document.querySelector('#settings-ui-style').value=style;document.querySelector('#settings-ui-style').dispatchEvent(new Event('change'));},style);
      for(const store of stores.filter(s=>s.type!=='starter_stockpile')){await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.storagePanel.open(s.buildings.find(b=>b.id===id));},store.id);await page.locator('#storage-dialog[open]').waitFor();
        await page.screenshot({path:`${process.env.SMOKE_SHOTS}/storage-${store.type}-${style}.png`});await page.keyboard.press('Escape');}
    }
    console.log(`PASS Storage window: no Collect with King; Starter Stockpile, Material Yard and Granary as grouped tables with icons, fill bar, grey reserved, empty goods hidden${missing.length?`; temporary icons for ${missing.join(', ')}`:'; every resource has its icon'}`);
  }finally{await page.close();}
}
