import assert from 'node:assert/strict';

export async function farmerTendingSmoke(page){
 const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
 const f=await page.evaluate(()=>{
  const s=window.__game.registry.get('application').scene;s.pauseManager.set('tending-smoke',true);s.fog.setEnabled(false);s.employment.setEnabled(false);s.workerSystem.unsubscribe();for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);
  let anchor;const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));for(let y=12;y<80&&!anchor;y++)for(let x=12;x<80&&!anchor;x++){let free=true;for(let dy=0;dy<7;dy++)for(let dx=0;dx<11;dx++)if(s.map[y+dy]?.[x+dx]!==0||s.resourceOccupancy.has(`${x+dx},${y+dy}`)||occupied.has(`${x+dx},${y+dy}`))free=false;if(free)anchor={x,y};}
  if(!anchor)throw Error('No clear tending fixture');
  const add=(type,x,y)=>{const definition=s.objectRegistry.require(type),tiles=[];for(let dy=0;dy<definition.height;dy++)for(let dx=0;dx<definition.width;dx++)tiles.push({x:x+dx,y:y+dy});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=definition.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(definition,b));s.events.emit('buildings:changed');return b;};
  const home=add('farmhouse',anchor.x+1,anchor.y+1),field=add('wheat_field',anchor.x+6,anchor.y+1),w=s.workerSystem.create({x:anchor.x+1,y:anchor.y+4});if(!s.workplaceSystem.assign(home,w))throw Error('Farmer assignment failed');s.farmingSystem.growthModifier=()=>0;s.refreshVisibility();return {worker:w.id,home:home.id,field:field.id,xp:w.experience.totalXP,farmingXP:w.skills.farming.totalXP,stock:s.inventory.count('wheat')};
 });
 await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('tending-smoke',false));
 await page.waitForFunction(f=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(f.worker);return w.workMessage==='Tending crops'&&w.view.workPhase>0;},f,{timeout:30000});
 const first=await page.evaluate(f=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(f.worker);return {tile:w.tile,xp:w.experience.totalXP,farmingXP:w.skills.farming.totalXP,stock:s.inventory.count('wheat'),task:w.workTask,phase:w.view.workPhase};},f);
 await page.evaluate(f=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('tending-staffing-ui',true);s.workplacePanel.open(s.buildings.find(b=>b.id===f.home));},f);
 assert.match(await page.locator('#workplace-staffing-output').textContent(),/33%.*1 present/);await page.click('#close-workplace');await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('tending-staffing-ui',false));
 assert.equal(first.task,null);assert.equal(first.xp,f.xp);assert.equal(first.farmingXP,f.farmingXP);assert.equal(first.stock,f.stock);assert.ok(first.phase>0);
 await page.waitForFunction(({f,tile})=>{const w=window.__game.registry.get('application').scene.workerSystem.workers.get(f.worker);return w.workMessage==='Tending crops'&&(w.tile.x!==tile.x||w.tile.y!==tile.y);},{f,tile:first.tile},{timeout:15000});
 const mid=await page.evaluate(()=>window.__game.registry.get('application').snapshot());assert.equal(Object.hasOwn(mid.farming,'tending'),false);
 const load=async state=>{await page.evaluate(state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__tendingReady=false;app.onGameReady=s=>{ready(s);window.__tendingReady=true;app.onGameReady=ready;};app.load(state);},state);await page.waitForFunction(()=>window.__tendingReady);};
 await load(mid);await page.waitForFunction(f=>window.__game.registry.get('application').scene.workerSystem.workers.get(f.worker).workMessage==='Tending crops',f,{timeout:15000});
 await page.evaluate(f=>{const s=window.__game.registry.get('application').scene;s.farmingSystem.records.get(f.field).growthDays=s.objectRegistry.require('wheat_field').crop.growthDays;},f);
 await page.waitForFunction(f=>window.__game.registry.get('application').scene.workerSystem.workers.get(f.worker).workTask?.kind==='harvest',f,{timeout:5000});
 assert.equal(await page.evaluate(f=>window.__game.registry.get('application').scene.farmingSystem.tending.has(f.worker),f),false);
 await page.waitForFunction(f=>window.__game.registry.get('application').scene.inventory.count('wheat')===f.stock+8,f,{timeout:25000});await page.evaluate(()=>window.__game.registry.get('application').snapshot());await load(saved);
 console.log('PASS farmer tending: real walk, existing work animation, reposition, no idle XP/goods, Save/Load without new tasks and ripe harvest preemption with physical delivery');
}
