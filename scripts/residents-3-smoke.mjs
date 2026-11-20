import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// m-obyvatele-jmena-spanek-pohyb (31, 42) in a real page: residents have a first name, a surname and an origin (panel
// rows show the short form, the detail the full one); at rest time the residents of a House walk to it and disappear
// inside, the House panel lists who is inside, a sleeper cannot be clicked and Locate finds his House; in the
// morning they come out again.
const finish=(page,id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
export async function residents3Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW6-1555155555555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.childrenSystem);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    const names=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',60);s.inventory.add('stone',30);s.updateInventory();
      for(const a of [...s.animalSystem.animals.values()])if(a.definition.id==='wild_boar')s.animalSystem.remove(a);for(const id of ['wolves','thieves','fires'])s.nightThreats?.setEnabled?.(id,false);
      return s.workerSystem.liveSubjects().map(w=>({id:w.id,name:w.name,full:w.fullName}));});
    assert.ok(names.length>=2);assert.equal(new Set(names.map(n=>n.name)).size,names.length,'no name repeats');
    for(const n of names){assert.match(n.name,/^\S+ \S+$/,'first name and surname');assert.doesNotMatch(n.name,/\d/);assert.match(n.full,new RegExp(`^${n.name} (of|z|ze) \\S`),'the full name adds the origin');}
    await page.locator('#population-tab').click();const row=await page.locator('.population-row strong').first().textContent();assert.ok(names.some(n=>n.name===row),'panel rows show the short form');
    await page.locator('.population-row .population-select').first().click();await page.locator('#unit-dialog[open]').waitFor();assert.ok(names.some(n=>n.full===(row&&names.find(x=>x.name===row).full)));
    assert.equal(await page.locator('#unit-name').textContent(),names.find(x=>x.name===row).full,'the detail shows the full name');await page.locator('#close-unit').click();await page.locator('#population-tab').click();
    const site=await placeBlueprint(page,'house');assert.equal(await finish(page,site.id),true);
    const home=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,homes=s.needs.homes();const all=[...homes].filter(([,h])=>h.kind==='house'&&h.buildingId===id).map(([w])=>s.workerSystem.workers.get(w));
      // Soldiers keep the night watch (they sleep by day): only the others go in at night.
      return {sleepers:all.filter(w=>w.profession!=='soldier').map(w=>w.id),guards:all.filter(w=>w.profession==='soldier').map(w=>w.id)};},site.id);
    const residents=home.sleepers;assert.ok(residents.length>=1,'residents moved into the House');
    // Rest time: they walk home and go in.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;s.gameSpeed=3;g.update(Math.max(0,g.dayDuration*.8-g.elapsed));});
    await page.waitForFunction(({id,ids})=>{const s=window.__game.registry.get('application').scene;return ids.every(w=>s.workerSystem.workers.get(w)?.sleepingIn===id);},{id:site.id,ids:residents},{timeout:90000}).catch(async e=>{
      throw Error(`${e.message.split('\n')[0]}: ${JSON.stringify(await page.evaluate(ids=>{const s=window.__game.registry.get('application').scene;return {t:s.gameTime.elapsed/s.gameTime.dayDuration,rest:s.gameTime.restStartFraction?.(),w:ids.map(i=>{const w=s.workerSystem.workers.get(i);return [w.tile,w.restPhase,w.workState,w.workMessage,w.sleepingIn,w.commandState?.state,w.profession];})};},residents))}`);});
    const inside=await page.evaluate(({id,ids,guards})=>{const s=window.__game.registry.get('application').scene,ws=ids.map(w=>s.workerSystem.workers.get(w)),w=ws[0];
      const hit=s.pickInteraction(w.view.x,w.view.y-12,w.tile);s.villagePanel.open('house',s.buildings.find(b=>b.id===id));
      return {guardsOut:guards.every(g=>s.workerSystem.workers.get(g).sleepingIn==null),visible:ws.some(x=>x.view.visible),hit:hit?.kind==='human'&&hit.object===w,names:ws.map(x=>x.name),selectable:s.workerSystem.commands.selectable(w),located:s.populationSidebar.locateResident(w.id),following:s.worldCamera.following};},{id:site.id,ids:residents,guards:home.guards});
    assert.equal(inside.visible,false,'sleepers are hidden');assert.equal(inside.guardsOut,true,'soldiers on the night watch stay out');assert.equal(inside.hit,false,'a sleeper cannot be clicked');assert.equal(inside.selectable,false);
    assert.equal(inside.located,true,'Locate finds the sleeper at his House');assert.equal(inside.following,false);
    await page.locator('#village-dialog[open]').waitFor();const text=await page.locator('#village-details .village-inside').textContent();
    for(const n of inside.names)assert.ok(text.includes(n),`the House panel lists ${n} inside`);assert.equal(Number(await page.locator('#village-details .village-inside').getAttribute('data-inside')),inside.names.length);
    await page.locator('#close-village').click();
    // Morning: they come out at the door.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration-g.elapsed+g.dayDuration*.05);});
    await page.waitForFunction(ids=>{const s=window.__game.registry.get('application').scene;return ids.every(w=>s.workerSystem.workers.get(w)?.sleepingIn==null);},residents,{timeout:90000});
    assert.deepEqual(errors,[]);
    console.log(`PASS residents-3: ${names.length} residents with surname and origin (e.g. "${names[0].full}"), ${residents.length} asleep inside House ${site.id} (${home.guards.length} soldier(s) on watch outside) and listed in its panel, not clickable, Locate → House, out in the morning`);
  }finally{await page.close();}
}
