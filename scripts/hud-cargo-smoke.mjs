import assert from 'node:assert/strict';

// #101: picking up a stone made the top bar reflow (the cargo button and status appeared and pushed Food and the
// clock onto other lines), seen as a flicker, most visibly when zoomed out. On desktop their place is now reserved.
const boxes=page=>page.evaluate(()=>Object.fromEntries(['#inventory-items','.food-status','.hud-status','#hud-details-toggle','.inventory'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]];})));
export async function hudCargoSmoke(page,{screenshot=null}={}){
  // Restored at the end: the test stone, its pickup XP and the cargo must not leak into later checks.
  const snapshot=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const key=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,k=s.character.tile;window.__hudCargo={following:s.worldCamera.following,zoom:s.cameras.main.zoom};s.cameras.main.setZoom(.25);
    for(const [dx,dy] of [[2,0],[0,2],[-2,0],[0,-2],[2,2],[3,0],[0,3]]){const t={x:k.x+dx,y:k.y+dy};if(s.map[t.y]?.[t.x]===0&&!s.resources.has(`${t.x},${t.y}`)&&!s.character.cargo){s.addResource(s.objectRegistry.require('stone'),t);return `${t.x},${t.y}`;}}return null;});
  assert.ok(key,'a free tile for the test stone');
  assert.equal(await page.locator('#king-cargo-deliver').isVisible(),false,'no cargo: no button');
  const before=await boxes(page);if(screenshot)await page.locator('.inventory').screenshot({path:`${screenshot}-empty.png`});
  await page.evaluate(k=>{const s=window.__game.registry.get('application').scene,[x,y]=k.split(',').map(Number);s.character.command({kind:'move',goal:{x,y},pickupKey:k});},key);
  await page.waitForFunction(k=>!window.__game.registry.get('application').scene.resources.has(k),key,{timeout:30000});
  await page.locator('#king-cargo-deliver').waitFor({state:'visible'});
  // Rows and heights exactly; x and width within 3 px (the running clock changes its own text width).
  if(screenshot)await page.locator('.inventory').screenshot({path:`${screenshot}-cargo.png`});
  const after=await boxes(page);for(const [k,[x,y,w,h]] of Object.entries(before)){const [x2,y2,w2,h2]=after[k];assert.ok(Math.abs(x2-x)<=3&&y2===y&&h2===h&&Math.abs(w2-w)<=3,`${k} keeps its place in the top bar ${JSON.stringify({before:before[k],after:after[k]})}`);}
  const status=await page.locator('#king-cargo-status').evaluate(e=>({text:e.textContent,title:e.title,visible:getComputedStyle(e).visibility}));
  assert.match(status.text,/Stone/);assert.equal(status.title,status.text,'the full cargo text is in the tooltip');assert.equal(status.visible,'visible');
  // Phone width keeps the original wrapping layout (no reserved space).
  const size=page.viewportSize();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  assert.equal(await page.locator('#king-cargo-deliver').isVisible(),true);await page.setViewportSize(size);
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.cameras.main.setZoom(window.__hudCargo.zoom);s.worldCamera.following=window.__hudCargo.following;delete window.__hudCargo;});
  await page.evaluate(async state=>{const a=window.__game.registry.get('application'),ready=a.onGameReady.bind(a);window.__hudCargoReady=false;a.onGameReady=s=>{ready(s);window.__hudCargoReady=true;a.onGameReady=ready;};await a.load(state);},snapshot);
  await page.waitForFunction(()=>window.__hudCargoReady);await page.evaluate(()=>delete window.__hudCargoReady);
  console.log('PASS #101 stone pickup at zoom 0.25: the top bar keeps its exact layout when the cargo button and status appear; full cargo text in the tooltip; phone layout unchanged');
}
