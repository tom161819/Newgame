import assert from 'node:assert/strict';
// E1 (0.49.0): the Farmhouse is paid in wood, so the counter below (still named stone) tracks wood.
import { clickWorld,chooseBlueprintSite } from './building-menu-smoke.mjs';
export async function repeatPlacementSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const granaryPoint=await chooseBlueprintSite(page,'granary');
  await page.evaluate(point=>{
    const s=window.__game.registry.get('application').scene;s.employment.setEnabled(false);s.workerSystem.unsubscribe();for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);for(const a of s.animalSystem.animals.values()){a.path=[];a.wanderWait=1e8;}
    const horizontal=(point.x-s.map.length*32)/32,vertical=(point.y-128)/16,x=Math.floor((vertical+horizontal)/2),y=Math.floor((vertical-horizontal)/2),d=s.objectRegistry.require('granary'),tiles=[];
    for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:x+dx,y:y+dy});
    const b={id:Math.max(...s.buildings.map(b=>b.id))+1,type:d.id,definition:d,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');s.inventory.add('wood',40);s.updateInventory();
  },granaryPoint);
  const select=async type=>{await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator(`#${type}-choice`).click();};
  const state=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {mode:s.buildMode,type:s.selectedBuilding?.id??null,stone:s.inventory.count('wood'),sites:s.buildings.filter(b=>b.construction?.state==='planned').map(b=>({id:b.id,type:b.type,x:b.x,y:b.y})),preview:s.previewKey,visible:s.preview.visible??s.preview.body?.visible??s.preview.back?.visible??s.preview.footprint?.visible};});
  await select('farmhouse');const before=await state(),cost=await page.evaluate(()=>window.__game.registry.get('application').scene.objectRegistry.require('farmhouse').cost.wood);
  const first=await chooseBlueprintSite(page,'farmhouse');await clickWorld(page,first,{forBlueprint:true});const one=await state();assert.equal(one.mode,true);assert.equal(one.type,'farmhouse');assert.equal(one.sites.length,before.sites.length+1);assert.equal(one.stone,before.stone-cost);assert.equal(one.visible,true);assert.ok(one.preview);
  // Real rapid double click on the newly occupied anchor must neither duplicate nor spend again.
  await page.mouse.dblclick(...await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.game.canvas.getBoundingClientRect();return[c.left+c.width/2,c.top+c.height/2];}));
  assert.deepEqual((await state()).sites,one.sites);assert.equal((await state()).stone,one.stone);assert.equal((await state()).mode,true);
  const second=await chooseBlueprintSite(page,'farmhouse');await clickWorld(page,second,{forBlueprint:true});const two=await state();assert.equal(two.sites.length,one.sites.length+1);assert.equal(two.stone,before.stone-2*cost);assert.equal(two.type,'farmhouse');
  // Insufficient funds keep the tool and existing orders, without consuming another reservation.
  const funds=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,n=s.inventory.count('wood');s.inventory.spend('wood',n);s.updateInventory();return n;});
  await clickWorld(page,await chooseBlueprintSite(page,'farmhouse'),{forBlueprint:true});assert.equal((await state()).stone,0);assert.equal((await state()).mode,true);assert.deepEqual((await state()).sites,two.sites);
  await page.evaluate(n=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',n);s.updateInventory();},funds);
  await page.keyboard.press('Escape');assert.equal((await state()).mode,false);assert.equal(await page.locator('#pause-menu').isVisible(),false);
  // Orchard ownership unlock requires a completed Farmhouse; complete only our fixture, not the repeated orders.
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.constructionSystem.cancel(b);const d=s.objectRegistry.require('farmhouse'),tiles=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:b.x+dx,y:b.y+dy});const home={id:Math.max(...s.buildings.map(b=>b.id))+1,type:d.id,definition:d,x:b.x,y:b.y,tiles};s.buildings.push(home);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(home.id,s.createBuildingView(d,home));s.events.emit('buildings:changed');},one.sites.at(-1).id);
  await select('orchard');const orchardBefore=await state();for(let i=0;i<2;i++){await clickWorld(page,await chooseBlueprintSite(page,'orchard'),{forBlueprint:true});assert.equal((await state()).type,'orchard');}
  const orchards=await state();assert.equal(orchards.sites.length,orchardBefore.sites.length+2);assert.equal(orchards.stone,orchardBefore.stone);
  await page.mouse.click(...await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.game.canvas.getBoundingClientRect();return[c.left+c.width/2,c.top+c.height/2];}),{button:'right'});assert.equal((await state()).mode,false);assert.deepEqual((await state()).sites,orchards.sites);
  // Owner bug 7. 11.: the Wheat Field tool used to close after one order; it now behaves like the Orchard.
  await select('wheat_field');const wheatBefore=await state();for(let i=0;i<2;i++){await clickWorld(page,await chooseBlueprintSite(page,'wheat_field'),{forBlueprint:true});assert.equal((await state()).type,'wheat_field','the Wheat Field tool stays selected');}
  const wheat=await state();assert.equal(wheat.sites.length,wheatBefore.sites.length+2);assert.equal(wheat.stone,wheatBefore.stone);await page.keyboard.press('Escape');assert.equal((await state()).mode,false);
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.objectRegistry.require('tower').cost;for(const [id,n] of Object.entries(c))s.inventory.add(id,n);s.updateInventory();});
  await select('orchard');await select('tower');assert.equal((await state()).type,'tower');await clickWorld(page,await chooseBlueprintSite(page,'tower'),{forBlueprint:true});assert.equal((await state()).mode,false,'other buildings remain single placement');
  await select('orchard');
  const unseen=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.settingsPanel.applySettings({...s.settingsPanel.settings,fogOfWar:true});s.fog.setEnabled(true);s.refreshVisibility();const d=s.objectRegistry.require('orchard'),points=[];for(let y=5;y<85&&points.length<2;y++)for(let x=5;x<85&&points.length<2;x++){const tiles=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:x+dx,y:y+dy});if(tiles.some(t=>s.fog.isInSightTile(t))||s.buildings.some(b=>b.tiles.some(t=>tiles.some(p=>p.x===t.x&&p.y===t.y)))||points.some(p=>Math.hypot(p.tx-x,p.ty-y)<8))continue;points.push({tx:x,ty:y,x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16});}if(points.length!==2)throw Error('No unseen fixture sites');return points;});
  const fogBefore=await state();for(const point of unseen){await clickWorld(page,point,{forBlueprint:true});assert.equal((await state()).type,'orchard');}
  const fogAfter=await state();assert.equal(fogAfter.sites.length,fogBefore.sites.length+2);assert.equal(fogAfter.stone,fogBefore.stone);
  await clickWorld(page,unseen[1],{forBlueprint:true});assert.deepEqual((await state()).sites,fogAfter.sites);
  assert.equal(await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return s.buildings.filter(b=>b.type==='orchard'&&b.unverified).length;}),2);
  await page.locator('#cancel-building').click();assert.equal((await state()).mode,false);assert.deepEqual((await state()).sites,fogAfter.sites);
  await select('orchard');const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot()),expected=(await state()).sites;
  const load=async save=>{await page.evaluate(save=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__repeatReady=false;app.onGameReady=s=>{ready(s);window.__repeatReady=true;app.onGameReady=ready;};app.load(save);},save);await page.waitForFunction(()=>window.__repeatReady);};
  await load(saved);assert.equal((await state()).mode,false);assert.deepEqual((await state()).sites,expected);await load(baseline);
  console.log('PASS repeated farm/orchard native placement, rapid duplicate/invalid/funds protection, preview, Escape/right-click/type switch, single-placement tower, unseen provisional sites and current Save/Load');
}
