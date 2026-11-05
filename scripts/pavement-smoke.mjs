import assert from 'node:assert/strict';

// S11: real Stone Pavement tool. Line drag orders a road, Haulers and Builders lay it, Area orders a courtyard,
// Remove clears finished pavement without refund, and Save/Load keeps both finished and unfinished pavement.
export async function pavementSmoke(page,{screenshot=null}={}){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__paveReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__paveReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__paveReady);};
  // A free 6×3 patch of open ground near the king, in sight.
  const patch=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,start=s.character.tile,busy=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));
    for(const b of s.buildings)for(const t of b.tiles)busy.add(`${t.x},${t.y}`);
    for(let y=start.y+3;y<start.y+12;y++)for(let x=start.x-8;x<start.x+8;x++){let ok=true;for(let dy=0;dy<3&&ok;dy++)for(let dx=0;dx<6&&ok;dx++){const t={x:x+dx,y:y+dy};ok=s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!busy.has(`${t.x},${t.y}`)&&s.fog.isVisibleTile(t);}if(ok)return{x,y};}
    throw Error('No free ground for the pavement smoke.');});
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',10);s.updateInventory();});
  const center=await page.evaluate(p=>{const s=window.__game.registry.get('application').scene,x=s.map.length*32+(p.x+3-p.y-1)*32,y=128+(p.x+3+p.y+1+1)*16;s.worldCamera.syncSize();s.worldCamera.following=false;s.cameras.main.setZoom(1).centerOn(x,y);s.cameras.main.preRender();return{x,y};},patch);
  const screen=async tile=>{const c=await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.cameras.main;return{x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,w:c.width,h:c.height,z:c.zoom};}),b=await page.locator('canvas').boundingBox(),m=await page.evaluate(()=>window.__game.registry.get('application').scene.map.length);
    const w={x:m*32+(tile.x-tile.y)*32,y:128+(tile.x+tile.y+1)*16};return{x:b.x+((w.x-c.x)*c.z+c.w/2)*b.width/c.w,y:b.y+((w.y-c.y)*c.z+c.h/2)*b.height/c.h};};
  const drag=async(a,b)=>{const p=await screen(a),q=await screen(b);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move((p.x+q.x)/2,(p.y+q.y)/2,{steps:4});await page.mouse.move(q.x,q.y,{steps:4});await page.mouse.up();};
  const sites=()=>page.evaluate(()=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type.startsWith('stone_pavement')).length);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="infrastructure"]').click();await page.locator('#stone_pavement-choice').click();
  await page.locator('#pavement-modes:not([hidden])').waitFor();assert.equal(await page.locator('[data-pavement-mode="line"]').getAttribute('aria-checked'),'true','Line is the default');
  const stone=await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('stone'));
  const road=[0,1,2,3,4,5].map(i=>({x:patch.x+i,y:patch.y}));await drag(road[0],road[5]);
  assert.equal(await sites(),6,'one line drag ordered six tiles');assert.match(await page.locator('#status').textContent(),/6/);
  const fixture=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,people=s.workerSystem.liveSubjects().filter(w=>!w.arriving);s.employment?.setEnabled(false);
    s.workerSystem.jobs.assign(people[0],'builder');s.workerSystem.jobs.assign(people[1],'hauler');people[1].stoneCollection={enabled:false,radius:80};return people.map(w=>w.id);});
  await page.waitForFunction(tiles=>{const s=window.__game.registry.get('application').scene;return tiles.some(t=>s.pathWear.isPaved(t));},road,{timeout:90000});
  const mid=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.ok(mid.pathWear.paved.length>=1);assert.ok(mid.buildings.some(b=>b.type.startsWith('stone_pavement')),'part of the road is still a blueprint');
  await load(mid);
  await page.waitForFunction(tiles=>{const s=window.__game.registry.get('application').scene;return tiles.every(t=>s.pathWear.isPaved(t));},road,{timeout:120000});
  const after=await page.evaluate(({road})=>{const s=window.__game.registry.get('application').scene;return{stone:s.inventory.count('stone'),speed:s.pathWear.speedMultiplier(s.character,road[2]),sites:s.buildings.filter(b=>b.type.startsWith('stone_pavement')).length,walk:road.every(t=>s.map[t.y][t.x]===0)};},{road});
  assert.deepEqual(after,{stone:stone-3,speed:1.25,sites:0,walk:true});
  if(screenshot){await page.evaluate(c=>{const s=window.__game.registry.get('application').scene;s.cameras.main.setZoom(1.6).centerOn(c.x,c.y);},center);await page.waitForTimeout(400);await page.screenshot({path:screenshot});}
  // Area: a 3×2 courtyard below the road; Remove clears the finished road (no Stone back).
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.selectBuilding?.(s.objectRegistry.require('stone_pavement'));});
  if(!await page.locator('#pavement-modes:not([hidden])').count()){await page.locator('#buildings-tab').click();await page.locator('[data-building-category="infrastructure"]').click();await page.locator('#stone_pavement-choice').click();}
  await page.locator('[data-pavement-mode="area"]').click();await drag({x:patch.x,y:patch.y+1},{x:patch.x+2,y:patch.y+2});assert.equal(await sites(),6,'a 3×2 area ordered six tiles');
  if(!await page.locator('#pavement-modes:not([hidden])').count()){await page.locator('#buildings-tab').click();await page.locator('[data-building-category="infrastructure"]').click();await page.locator('#stone_pavement-choice').click();}
  const before=await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('stone'));
  await page.locator('[data-pavement-mode="remove"]').click();await drag(road[3],road[5]);
  const removed=await page.evaluate(({road})=>{const s=window.__game.registry.get('application').scene;return [road.filter(t=>s.pathWear.isPaved(t)).length,s.inventory.count('stone')];},{road});
  assert.deepEqual(removed,[3,before],'three road tiles removed, no Stone refunded');
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());await load(saved);
  assert.deepEqual((await page.evaluate(()=>window.__game.registry.get('application').snapshot())).pathWear.paved,saved.pathWear.paved);
  await page.keyboard.press('Escape');await load(baseline);
  console.log(`PASS S11: Infrastructure Stone Pavement, Line drag (6 tiles / 3 Stone), Haulers+Builder laid it across Save/Load, +25 % speed, Area 3×2 courtyard, Remove without refund, pavement restored after Load (${fixture.length} residents)`);
}
