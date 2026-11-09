import assert from 'node:assert/strict';
import { placeBlueprint,clickWorld } from './building-menu-smoke.mjs';

// Children and the Village Green D2 in a real page: a House, then a Swing Tree and a Well beside it and a Haystack beside
// a Farmhouse, all placed from the Housing menu with a real click (finished at once for the test). Residents get +1
// for each, and children play at the tree and the hay.
const finish=(page,id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
// A free tile next to a building (inside sight), where the given decoration may stand.
const siteNear=(page,{id,type,avoid=[]})=>page.evaluate(({id,type,avoid})=>{
  const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),d=b.definition??s.objectRegistry.require(b.type),busy=new Set([...s.reservedTiles(),...s.buildings.flatMap(x=>x.tiles)].map(t=>`${t.x},${t.y}`));
  for(let r=1;r<4;r++)for(let y=b.y-r;y<b.y+d.height+r;y++)for(let x=b.x-r;x<b.x+d.width+r;x++){
    if(avoid.some(a=>a.x===x&&a.y===y)||busy.has(`${x},${y}`)||s.map[y]?.[x]!==0||s.resourceOccupancy.has(`${x},${y}`)||s.pathWear.level({x,y})>=2||s.pathWear.isPaved({x,y}))continue;
    if(s.fog&&!s.fog.isVisible?.(x,y)&&s.fog.isVisible)continue;
    return {tile:{x,y},point:{x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16}};
  }throw Error(`No ${type} site by ${b.type}`);},{id,type,avoid});
async function placeAt(page,type,site){
  const before=await page.evaluate(type=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type).length,type);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="housing"]').click();await page.locator(`#${type}-choice`).click();
  await clickWorld(page,site.point,{forBlueprint:true});
  await page.waitForFunction(({type,before})=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type).length>before,{type,before},{timeout:8000});
  if(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode))await page.keyboard.press('Escape');
  return page.evaluate(type=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type).at(-1).id,type);
}
export async function houseDecorationsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW4-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.childrenSystem);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',80);s.inventory.add('stone',40);s.updateInventory();s.fog?.setEnabled?.(false);for(const a of [...s.animalSystem.animals.values()])if(a.definition.id==='wild_boar')s.animalSystem.remove(a);});
    const house=await placeBlueprint(page,'house');assert.equal(await finish(page,house.id),true);
    const farm=await placeBlueprint(page,'farmhouse');assert.equal(await finish(page,farm.id),true);
    // The Haystack stands beside the Farmhouse (far from a farm it is refused: unit test).
    const tree=await siteNear(page,{id:house.id,type:'swing_tree'}),tid=await placeAt(page,'swing_tree',tree);assert.equal(await finish(page,tid),true);
    const well=await siteNear(page,{id:house.id,type:'well',avoid:[tree.tile]}),wid=await placeAt(page,'well',well);assert.equal(await finish(page,wid),true);
    const hay=await siteNear(page,{id:farm.id,type:'haystack'}),hid=await placeAt(page,'haystack',hay);assert.equal(await finish(page,hid),true);
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return s.needs.homes().size>0;},null,{timeout:20000});
    const st=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,homes=s.needs.homes(),r=[...homes].find(([,h])=>h.kind==='house'&&h.buildingId===id);return r?s.needs.status(s.workerSystem.workers.get(r[0])):null;},house.id);
    assert.ok(st,'somebody lives in the house');assert.equal(st.swing,1,'Swing nearby +1');assert.equal(st.well,1,'Well nearby +1');
    // Children play at the tree and the hay (a family house: fill it).
    await page.evaluate(()=>window.mkDev.fillChildren(12));
    await page.waitForFunction(({tid,hid})=>{const c=window.__game.registry.get('application').scene.childrenSystem;return c.playingAtDecoration(tid)+c.playingAtDecoration(hid)>0;},{tid,hid},{timeout:90000});
    if(process.env.SMOKE_SHOTS){await page.evaluate(tile=>{const s=window.__game.registry.get('application').scene;if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(1.5);s.cameras.main.centerOn(s.map.length*32+(tile.x-tile.y)*32,128+(tile.x+tile.y)*16);},tree.tile);
      await page.waitForTimeout(1500);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/house-decorations.png`});}
    console.log('PASS Children D2: Swing Tree, Well and Haystack placed from the Housing menu, residents get Swing nearby +1 and Well nearby +1, children play at the tree or in the hay');
  }finally{await page.close();}
}
