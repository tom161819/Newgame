import assert from 'node:assert/strict';
import { SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { placeBlueprint,supplyAndBuild,clickBuilding } from './building-menu-smoke.mjs';

// S12 phase C: real Stables; a Stablehand tames a visible wild horse on his own and leads it into the paddock; the panel
// counts it and Save/Load keeps it inside.
export async function stablesSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__stReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__stReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__stReady);};
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',10);s.inventory.add('wood',15);s.updateInventory();});
  const site=await placeBlueprint(page,'stables');await supplyAndBuild(page,site);
  const fixture=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),[w]=s.workerSystem.liveSubjects().filter(x=>!x.arriving);s.employment?.setEnabled(false);s.workplaceSystem.assign(b,w);
    let tile=null;for(let r=7;r<14&&!tile;r++)for(let dx=-r;dx<=r&&!tile;dx++){const t={x:b.x+2+dx,y:b.y+6+r};if(s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`))tile=t;}
    const horse=s.animalSystem.create(s.objectRegistry.require('horse'),tile);return{horse:horse.id,worker:w.id,profession:w.profession};},site.id);
  assert.equal(fixture.profession,'stablehand');
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.stables.horses.has(id),fixture.horse,{timeout:150000});
  await clickBuilding(page,site.id);await page.locator('#workplace-dialog[open]').waitFor();assert.match(await page.locator("#mining-details").textContent(),/[1-4] \/ 4/);await page.locator('#close-workplace').click();
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.equal(saved.saveVersion,SAVE_VERSION);await load(saved);
  const inside=await page.evaluate(({horse,site})=>{const s=window.__game.registry.get('application').scene,a=s.animalSystem.animals.get(horse),b=s.buildings.find(b=>b.id===site);return s.stables.tamed(a)&&a.tile.x>=b.x&&a.tile.x<b.x+5&&a.tile.y>=b.y&&a.tile.y<b.y+5;},{horse:fixture.horse,site:site.id});assert.equal(inside,true);
  await load(baseline);
  console.log('PASS S12 Stables: real Stables, Stablehand tamed a visible wild horse and led it into the paddock, panel counts it, kept inside after Load');
}
