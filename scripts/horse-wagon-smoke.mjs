import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild } from './building-menu-smoke.mjs';

// S12 phase D: in the real Wheelwright's panel the player picks Horse Wagon; Wheelwrights wait for a tamed horse,
// reserve it, build the wagon from delivered goods and harness the horse; a Hauler in Auto takes the wagon (not the
// Wheelbarrow), the horse travels hidden with it and Save/Load keeps everything.
export async function horseWagonSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__hwReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__hwReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__hwReady);};
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',10);s.inventory.add('wood',15);s.updateInventory();});
  const stables=await placeBlueprint(page,'stables');await supplyAndBuild(page,stables);
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',12);s.inventory.add('wood',15);s.updateInventory();});
  const shop=await placeBlueprint(page,'wheelwright_workshop');await supplyAndBuild(page,shop);
  const ids=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),[a,c,h]=s.workerSystem.liveSubjects().filter(w=>!w.arriving);s.employment?.setEnabled(false);
    // These three subjects are autonomous fixture staff. A prior scenario's manual Move/Hold
    // must not prevent a correctly assigned worker from ever reaching the recipe's blocker.
    for(const w of [a,c,h])s.workerSystem.commands.resume(w);
    if(!s.workplaceSystem.assign(b,a)||!s.workplaceSystem.assign(b,c)||!s.workerSystem.jobs.assign(h,'hauler'))throw Error('Horse wagon fixture could not assign its staff');
    h.stoneCollection={enabled:false,radius:80};s.workplacePanel.open(b);return{hauler:h.id,wheelwright:a.id};},shop.id);
  await page.locator('#workplace-dialog[open] #recipe-choice').waitFor();
  assert.deepEqual(await page.locator('#recipe-choice option').evaluateAll(o=>o.map(x=>x.value)),['wheelbarrow','horse_wagon']);
  await page.locator('#recipe-choice').selectOption('horse_wagon');
  assert.match(await page.locator('#food-production-recipe').textContent(),/30 .*6 .*90/);
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.foodProduction.records.get(id).recipe,shop.id),'horse_wagon');
  await page.locator('#close-workplace').click();
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',30);s.inventory.add('iron_bar',6);s.updateInventory();});
  try{await page.waitForFunction(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).workMessage==='Waiting for a tamed horse in the Stables',ids.wheelwright,{timeout:120000});}
  catch(error){const diagnostic=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);return {time:s.gameTime.totalElapsed,workers:s.workerSystem.liveSubjects().map(w=>({id:w.id,job:w.profession,cmd:w.commandState,tile:w.tile,next:w.nextTile,path:w.path.length,state:w.workState,message:w.workMessage,home:w.assignedWorkplaceId,reached:w.workplaceReached,cargo:w.cargo,task:w.workTask})),stock:[...s.foodStorage.locations.values()].map(l=>({id:l.id,stock:l.stock,incoming:s.foodStorage.incoming(l.id)})),record:s.foodProduction.records.get(id),shortage:s.foodProduction.inputShortage(b),drops:[...s.dropSystem.drops.values()].map(d=>({id:d.id,resource:d.resource,amount:d.amount})),king:{tile:s.character.tile,cargo:s.character.cargo}};},shop.id);throw new Error(`Horse wagon supply did not reach horse wait: ${JSON.stringify(diagnostic)}`,{cause:error});}
  const horse=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),a=s.animalSystem.create(s.objectRegistry.require('horse'),{x:b.x+2,y:b.y+2});s.stables.horses.set(a.id,{state:'stabled',stableId:b.id});s.stables.place(a.id);return a.id;},stables.id);
  await page.waitForFunction(()=>window.__game.registry.get('application').scene.vehicles.vehicles.size===1,null,{timeout:240000});
  await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.vehicles.held(s.workerSystem.workers.get(id))?.type==='horse_wagon';},ids.hauler,{timeout:90000});
  const state=await page.evaluate(({hauler,horse})=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(hauler),[v]=s.vehicles.vehicles.values(),a=s.animalSystem.animals.get(horse);
    return [w.vehicleType,v.horseId===horse,s.stables.horses.get(horse).state,a.view.visible,s.inventory.count('iron_bar'),s.inventory.count('wood')];},{hauler:ids.hauler,horse});
  assert.deepEqual(state,['horse_wagon',true,'harnessed',false,0,0]);
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());await load(saved);
  assert.deepEqual(await page.evaluate(({hauler,horse})=>{const s=window.__game.registry.get('application').scene;return [s.workerSystem.workers.get(hauler).vehicleType,s.stables.horses.get(horse).state,s.foodProduction.records.get(s.buildings.find(b=>b.type==='wheelwright_workshop').id).recipe];},{hauler:ids.hauler,horse}),['horse_wagon','harnessed','horse_wagon']);
  await load(baseline);
  console.log('PASS S12 Horse Wagon: recipe chosen in the real Wheelwright panel, waited for a tamed horse, 30 Wood + 6 Iron Bars → wagon with harnessed hidden horse, Hauler in Auto took it, kept after Load');
}
