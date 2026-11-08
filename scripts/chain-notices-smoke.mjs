import assert from 'node:assert/strict';
// A completion-event fixture exercises the real diagnostics, bus and live panel.
export async function chainNoticesSmoke(page){
 const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
 await page.evaluate(()=>{
  const s=window.__game.registry.get('application').scene;s.pauseManager.set('chain-notices',true);const id=Math.max(0,...s.buildings.map(b=>b.id))+100;
  const add=(type,n)=>{const definition=s.objectRegistry.require(type);const b={id:id+n,type,definition,x:10+n*5,y:10,tiles:[],construction:{state:'complete'}};s.buildings.push(b);return b;};
  const mill=add('mill',0);window.__chainFixture={mill:mill.id,id};s.activities.emit('buildingCompleted',{objectIds:[mill.id]});s.activities.emit('buildingCompleted',{objectIds:[mill.id]});
 });
 const rows=page.locator('#notices-list [data-notice-key^="chain:"]');await rows.first().waitFor();assert.equal(await rows.count(),1);assert.match(await rows.textContent(),/Wheat Field/);assert.match(await rows.textContent(),/needs wheat/);
 await rows.locator('[data-dismiss-notice]').click();assert.equal(await rows.count(),0);
 await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.activities.emit('buildingCompleted',{objectIds:[window.__chainFixture.mill]});});assert.equal(await rows.count(),0);
 await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===window.__chainFixture.mill);s.buildings.splice(s.buildings.indexOf(b),1);s.diagnostics.resolveCompletionNotices();const definition=s.objectRegistry.require('bakery'),bakery={id:window.__chainFixture.id+1,type:'bakery',definition,x:15,y:10,tiles:[],construction:{state:'complete'}};s.buildings.push(bakery);s.activities.emit('buildingCompleted',{objectIds:[bakery.id]});});
 assert.equal(await rows.count(),1);assert.match(await rows.textContent(),/needs flour from a Mill/);
 await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,definition=s.objectRegistry.require('mill');s.buildings.push({id:window.__chainFixture.id+2,type:'mill',definition,x:20,y:10,tiles:[],construction:{state:'complete'}});s.diagnostics.resolveCompletionNotices();});assert.equal(await rows.count(),0);
 await page.evaluate(state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__chainRestored=false;app.onGameReady=s=>{ready(s);window.__chainRestored=true;app.onGameReady=ready;};app.load(state);},saved);await page.waitForFunction(()=>window.__chainRestored);
 assert.equal(await page.locator('#notices-list [data-notice-key^="chain:"]').count(),0);
 console.log('PASS chain completion notices: live panel, missing field/mill, no duplicate completion, dismiss, resolution and reload without replay');
}
