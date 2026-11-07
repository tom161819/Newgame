import assert from 'node:assert/strict';
import { clickWorld } from './building-menu-smoke.mjs';
// Owner 7. 11. 2026: drawing a Farmhouse blueprint and its fields gives no "no Farmhouse" notice; plots beyond every
// Farmhouse's room give one summary notice instead of one per plot.
export async function farmBlueprintSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const spots=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);for(const a of s.animalSystem.animals.values()){a.path=[];a.wanderWait=1e8;}
    const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),clear=(x,y,w,h)=>{for(let dy=-1;dy<=h;dy++)for(let dx=-1;dx<=w;dx++)if(s.map[y+dy]?.[x+dx]!==0||s.resourceOccupancy.has(`${x+dx},${y+dy}`)||occupied.has(`${x+dx},${y+dy}`))return false;return true;};
    const home=s.objectRegistry.require('farmhouse'),field=s.objectRegistry.require('wheat_field');let anchor;
    // A Farmhouse with room for 3 + 3 rows of fields and nothing farm-like nearby.
    for(let y=12;y<70&&!anchor;y++)for(let x=12;x<70&&!anchor;x++)if(clear(x,y,home.width+(field.width+1)*3,home.height+field.height*2+2)&&!s.buildings.some(b=>(b.type==='farmhouse'||b.definition?.crop)&&Math.hypot(b.x-x,b.y-y)<40))anchor={x,y};
    if(!anchor)throw Error('No room for the farm blueprint fixture');
    const point=(x,y)=>({x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16});
    const fields=[];for(let i=0;i<5;i++){const x=anchor.x+home.width+1+(i%3)*(field.width+1),y=anchor.y+Math.floor(i/3)*(field.height+1);fields.push({x,y,point:point(x,y,field)});}
    for(const [r,n]of Object.entries(home.cost))s.inventory.add(r,n*2);s.refreshVisibility();
    return {home:{...anchor,point:point(anchor.x,anchor.y,home)},fields};
  });
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();
  await page.locator('#farmhouse-choice').click();await clickWorld(page,spots.home.point,{forBlueprint:true});const homeStatus=await page.locator('#status').textContent();await page.keyboard.press('Escape');
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator('#wheat_field-choice').click();
  for(const f of spots.fields.slice(0,4)){await clickWorld(page,f.point,{forBlueprint:true});assert.doesNotMatch(await page.locator('#status').textContent(),/No Farmhouse/,'a field next to a planned Farmhouse is not an orphan');}
  const four=await page.evaluate(spots=>{const s=window.__game.registry.get('application').scene,home=s.buildings.find(b=>b.type==='farmhouse'&&b.x===spots.home.x&&b.y===spots.home.y),fields=spots.fields.slice(0,4).map(f=>s.buildings.find(b=>b.type==='wheat_field'&&b.x===f.x&&b.y===f.y));
    return {home:home&&{id:home.id,complete:!home.construction||home.construction.state==='complete'},farmIds:fields.map(b=>b?.farmId),issues:s.diagnostics.detect().filter(i=>i.reason==='noFarm'||i.reason==='noFarmer').length};},spots);
  assert.ok(four.home&&!four.home.complete,`the Farmhouse is a blueprint (${homeStatus})`);assert.deepEqual(four.farmIds,[four.home.id,four.home.id,four.home.id,four.home.id]);assert.equal(four.issues,0,'no field notices while the Farmhouse is planned');
  await clickWorld(page,spots.fields[4].point,{forBlueprint:true});assert.match(await page.locator('#status').textContent(),/No Farmhouse/,'the fifth field has no room');await page.keyboard.press('Escape');
  const five=await page.evaluate(()=>window.__game.registry.get('application').scene.diagnostics.detect().filter(i=>i.reason==='noFarm').map(i=>i.params.count));
  assert.ok(five.length<=1,'at most one summary notice');
  await page.evaluate(save=>{const app=window.__game.registry.get('application');return new Promise(resolve=>{const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);app.onGameReady=ready;resolve();};app.load(save);});},baseline);
  console.log('PASS farm blueprint: four fields of a planned Farmhouse are connected without notices, the fifth is the only orphan');
}
