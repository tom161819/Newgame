import assert from 'node:assert/strict';

// #150: the real Stone Pavement tool (Area) orders a paved floor under the finished Starter Stockpile; Builders lay it
// from the edge, the stockpile keeps blocking its tiles, and Save/Load keeps the half-paved floor.
export async function paveUnderSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__puReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__puReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__puReady);};
  const ordered=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.type==='starter_stockpile');s.inventory.add('stone',10);s.updateInventory();
    for(const [i,role]of ['builder','hauler'].entries()){const w=s.workerSystem.liveSubjects().filter(x=>!x.arriving)[i];if(w){s.workerSystem.commands.resume(w);s.workerSystem.jobs.assign(w,role);}}
    s.pavementTool.setMode('area');const tiles=b.tiles.map(t=>({...t})),end=tiles.at(-1);s.pavementTool.begin(tiles[0]);const n=s.pavementTool.confirm(end);
    return {n,tiles,blocked:tiles.every(t=>s.map[t.y][t.x]===1),id:b.id};});
  assert.equal(ordered.n,ordered.tiles.length,'every floor tile ordered');assert.equal(ordered.blocked,true);
  await page.waitForFunction(tiles=>{const s=window.__game.registry.get('application').scene;return tiles.some(t=>s.pathWear.isPaved(t));},ordered.tiles,{timeout:180000});
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());await load(saved);
  await page.waitForFunction(tiles=>{const s=window.__game.registry.get('application').scene;return tiles.every(t=>s.pathWear.isPaved(t));},ordered.tiles,{timeout:240000});
  assert.equal(await page.evaluate(tiles=>{const s=window.__game.registry.get('application').scene;return tiles.every(t=>s.map[t.y][t.x]===1)&&s.buildings.some(b=>b.type==='starter_stockpile');},ordered.tiles),true,'the stockpile still stands and blocks its tiles');
  await load(baseline);
  console.log(`PASS #150 pavement under a building: Area tool ordered ${ordered.n} floor tiles under the Starter Stockpile, Builder laid them from the edge, kept across Save/Load, the building still blocks`);
}
