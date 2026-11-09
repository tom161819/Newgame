import assert from 'node:assert/strict';
import { placeBlueprint,clickWorld } from './building-menu-smoke.mjs';

// Employment spread in a real page: a Quarry and a Lumberjack Hut (finished at once for the test) share the new
// residents instead of one taking all; a manual profession change in the unit panel takes a free seat; the Assign
// Worker list starts with people of the profession without a workplace and ends with those working elsewhere.
// Both finish in the same frame, so the employment plan sees two empty buildings at once.
const finish=(page,ids)=>page.evaluate(ids=>ids.map(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);}),ids);
// A Quarry must cover a stone deposit: find a spot the game itself accepts, then place it through the real menu.
async function placeValid(page,type){
  const spot=await page.evaluate(type=>{const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require(type),c=s.character.tile;
    for(let r=2;r<30;r++)for(let y=c.y-r;y<=c.y+r;y++)for(let x=c.x-r;x<=c.x+r;x++){if(Math.max(Math.abs(x-c.x),Math.abs(y-c.y))!==r)continue;s.selectedBuilding=d;s.buildMode=true;s.previewAnchor={x,y};s.previewKey=null;s.updateBuildingPreview();/* 0.61.0: the preview key ends with the gate axis */const ok=String(s.previewKey).endsWith(':false:null:null');s.buildMode=false;s.selectedBuilding=null;if(ok)return {x,y,point:{x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16}};}return null;},type);
  if(!spot)throw new Error(`no valid ${type} site`);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator(`#${type}-choice`).click();await clickWorld(page,spot.point,{forBlueprint:true});
  const id=await page.evaluate(type=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type).at(-1)?.id,type);if(id==null)throw new Error(`${type} not placed`);
  if(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode))await page.keyboard.press('Escape');return {id,point:spot.point};
}
export async function employmentSpreadSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.employment);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    // 0.49: the Quarry (15 Wood) and the Lumberjack Hut (6 Wood) are paid from the 60 starting Wood.
    // Fog off: blueprints are checked against the real ground at once (a Quarry needs a stone deposit under it).
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility();});
    const quarry=await placeValid(page,'quarry'),hut=await placeBlueprint(page,'lumberjack_hut');
    // m-drevorubci-stromy: automatic employment only sends Woodcutters to a hut with mature trees in its radius; this
    // world's hut site has none, so the fixture grows three beside it.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),n=s.naturalResources,d=s.objectRegistry.require('oak_tree');let added=0;
      for(let r=3;r<10&&added<3;r++)for(let y=b.y-r;y<=b.y+r&&added<3;y++)for(let x=b.x-r;x<=b.x+r&&added<3;x++){const t={x,y},key=`${x},${y}`;
        if(s.map[y]?.[x]!==0||s.resourceOccupancy.has(key)||s.buildings.some(o=>o.tiles.some(p=>p.x===x&&p.y===y))||!n.preservesRoutes(t))continue;
        s.addResource(d,t,{id:`tree-${n.nextId++}`,kind:'tree',stage:3,growthDays:0,ageDays:10,cycle:0,workDone:0,growthCheckpoint:n.growthClock,ageCheckpoint:n.ageClock});added++;}},hut.id);
    assert.deepEqual(await finish(page,[quarry.id,hut.id]),[true,true]);
    await page.waitForFunction(({q,h})=>{const s=window.__game.registry.get('application').scene,n=id=>s.workplaceSystem.employees(s.buildings.find(b=>b.id===id)).length;return n(q)+n(h)>=3;},{q:quarry.id,h:hut.id},{timeout:30000});
    const staff=await page.evaluate(({q,h})=>{const s=window.__game.registry.get('application').scene,n=id=>s.workplaceSystem.employees(s.buildings.find(b=>b.id===id)).length;return [n(q),n(h)];},{q:quarry.id,h:hut.id});
    assert.ok(staff[0]>=1&&staff[1]>=1&&Math.abs(staff[0]-staff[1])<=1,`both buildings get people (${staff})`);
    // A manual change to Miner in the unit panel: the Quarry still has a free seat.
    const w=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,k=s.character.tile;let spot=null;for(let r=1;r<6&&!spot;r++)for(let dx=-r;dx<=r&&!spot;dx++)for(let dy=-r;dy<=r&&!spot;dy++)if(s.map[k.y+dy]?.[k.x+dx]===0)spot={x:k.x+dx,y:k.y+dy};const w=s.workerSystem.create(spot);s.employment.hold(w);s.unitPanel.open(w,{management:true});return w.id;});
    await page.locator('#assign-job').selectOption('miner');
    const placed=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return {profession:w.profession,at:w.assignedWorkplaceId,text:document.querySelector('#unit-workplace').textContent};},w);
    assert.equal(placed.profession,'miner');assert.equal(placed.at,quarry.id,'took the free Quarry seat');assert.match(placed.text,/Quarry/);
    await page.evaluate(()=>window.__game.registry.get('application').scene.unitPanel.close?.());
    // Assign Worker groups in the Quarry panel.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.workplacePanel.open(s.buildings.find(b=>b.id===id));},quarry.id);
    const groups=await page.locator('[data-candidate-group]').evaluateAll(list=>list.map(e=>e.dataset.candidateGroup));assert.deepEqual(groups,['profession','free','employed']);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/employment-groups.png`});
    console.log(`PASS Employment spread: Quarry ${staff[0]} / Lumberjack Hut ${staff[1]}, a manual Miner took the free Quarry seat, Assign Worker groups profession → free → employed`);
  }finally{await page.close();}
}
