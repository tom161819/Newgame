import assert from 'node:assert/strict';

export async function idleStoneSmoke(page){
 const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
 const restart=async(state,settings)=>{
  await page.evaluate(({state,settings})=>{const app=window.__game.registry.get('application');window.__stoneReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__stoneReady=true;app.onGameReady=ready;};if(state)app.load(state);else app.start(null,settings);},{state,settings});
  await page.waitForFunction(()=>window.__stoneReady);
 };
 const settings=await page.evaluate(()=>({...window.__game.registry.get('application').scene.gameSettings,startingCastle:false,initialStoneCount:0,startingStone:0,startingWood:0,startingIronOre:0,startingBread:0,autoEmployment:false,wildlifeRespawn:'off',fogOfWar:false}));
 await restart(null,settings);
 const fixture=await page.evaluate(()=>{
  const s=window.__game.registry.get('application').scene;s.pauseManager.set('idle-stone-smoke',true);s.workerSystem.unsubscribe();
  for(const a of s.animalSystem.animals.values())a.wanderWait=1e8;
  for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);
  const stock=[...s.foodStorage.locations.values()].find(l=>l.allowed.includes('stone'));
  const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let start,tile;
  for(const goal of s.foodStorage.goals(stock))for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const t={x:goal.x+dx,y:goal.y+dy};if(!start&&s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!occupied.has(`${t.x},${t.y}`)){start=goal;tile=t;}
  }
  if(!tile)throw Error('No adjacent stone fixture beside Starter Stockpile');
  s.addResource(s.objectRegistry.require('stone'),tile);const h=s.workerSystem.create(start);if(!s.workerSystem.jobs.assign(h,'hauler'))throw Error('Hauler assignment failed');h.stoneCollection.enabled=false;
  s.unitPanel.open(h,{management:true});window.__stoneHauler=h.id;window.__stoneStock=stock.id;
  return {id:h.id,stock:stock.id,tile,castle:s.buildings.some(b=>b.type==='castle')};
 });
 assert.equal(fixture.castle,false);await page.locator('#stone-radius').fill('4');await page.locator('#stone-radius').dispatchEvent('change');await page.locator('#stone-collect').check();await page.locator('#close-unit').click();
 await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('idle-stone-smoke',false));
 await page.waitForFunction(()=>{const app=window.__game.registry.get('application'),h=app.scene.workerSystem.workers.get(window.__stoneHauler);if(h.cargo?.resource!=='stone')return false;window.__stoneCargoSave=app.snapshot();return true;},null,{timeout:20000,polling:'raf'});
 const mid=await page.evaluate(()=>window.__stoneCargoSave);await restart(mid);
 await page.waitForFunction(({id,stock})=>{const s=window.__game.registry.get('application').scene,h=s.workerSystem.workers.get(id);return !h.cargo&&s.foodStorage.locations.get(stock).stock.stone===1;},fixture,{timeout:20000});
 const result=await page.evaluate(({id,tile})=>{const app=window.__game.registry.get('application'),s=app.scene,h=s.workerSystem.workers.get(id);app.snapshot();return {settings:h.stoneCollection,ground:s.resources.has(`${tile.x},${tile.y}`),castle:s.buildings.some(b=>b.type==='castle')};},fixture);
 assert.deepEqual(result,{settings:{enabled:true,radius:4},ground:false,castle:false});await restart(saved);
 console.log('PASS AUD63: no Castle, Starter Stockpile collection, real panel ON/radius, physical cargo saved and loaded, exactly one stone delivered');
}
