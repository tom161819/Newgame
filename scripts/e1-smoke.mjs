import assert from 'node:assert/strict';
import { clickWorld } from './building-menu-smoke.mjs';
// Plan E1 (report 0.48.0): food days in the HUD, a Granary paid with wood, "Add a Builder" from the No builders notice,
// and no Czech text in the English interface (resident names aside).
export async function e1Smoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  assert.match(await page.locator('#food-countdown').textContent(),/^Food for \d+ days?$/);
  const spot=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.employment.setEnabled?.(false);for(const w of s.workerSystem.liveSubjects()){if(w.profession!=='idle'){s.workplaceSystem.remove?.(w);s.workerSystem.jobs.assign(w,'idle');}s.workerSystem.commands.hold(w);}
    // m-start-v2: more residents (the garrison) stand near the Castle; the spot avoids every resident's tile.
    const busy=new Set(s.workerSystem.liveWorkers().flatMap(w=>[w.tile,w.nextTile].filter(Boolean).map(t=>`${t.x},${t.y}`)));
    const d=s.objectRegistry.require('granary'),castle=s.buildings.find(b=>b.type==='castle')??s.character.tile;s.inventory.add('wood',d.cost.wood);
    for(let r=3;r<20;r++)for(let y=castle.y-r;y<=castle.y+r;y++)for(let x=castle.x-r;x<=castle.x+r;x++){if(Math.max(Math.abs(x-castle.x),Math.abs(y-castle.y))!==r)continue;s.selectedBuilding=d;s.buildMode=true;s.previewAnchor={x,y};s.previewKey=null;s.updateBuildingPreview();/* 0.61.0: the preview key ends with the gate axis */const ok=String(s.previewKey).endsWith(':false:null:null')&&![...Array(d.width*d.height).keys()].some(i=>{const dx=i%d.width,dy=Math.floor(i/d.width);for(const [ox,oy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]])if(busy.has(`${x+dx+ox},${y+dy+oy}`))return true;return false;});s.buildMode=false;s.selectedBuilding=null;if(ok)return {x,y,point:{x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16}};}
    return null;});
  assert.ok(spot,'room for a Granary');
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator('#granary-choice').click();await clickWorld(page,spot.point,{forBlueprint:true});
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildings.some(b=>b.type==='granary')),true,'the Granary is planned with wood');
  if(await page.evaluate(()=>!!window.__game.registry.get('application').scene.selectedBuilding))await page.keyboard.press('Escape');
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;for(let i=0;i<8;i++){s.gameTime.totalElapsed+=2000;s.diagnostics.update();}});
  const hire=page.locator('#notices-list [data-notice-action="builder"]');await hire.waitFor({timeout:10000});assert.equal(await hire.textContent(),'Add a Builder');
  await hire.click();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.workerSystem.liveSubjects().filter(w=>w.profession==='builder').length),1);
  const czech=await page.evaluate(()=>{const names=new Set(window.__game.registry.get('application').scene.workerSystem.liveSubjects().map(w=>w.name));const out=[];const walk=n=>{for(const c of n.childNodes){if(c.nodeType===3){const text=c.textContent.trim();if(/[ěščřžůňťď]/i.test(text)&&![...names].some(name=>text.includes(name))&&c.parentElement&&c.parentElement.offsetParent!==null)out.push(text);}else if(c.nodeType===1&&getComputedStyle(c).display!=='none')walk(c);}};walk(document.body);return out;});
  assert.deepEqual(czech,[],'no Czech text in the English interface');
  await page.evaluate(save=>{const app=window.__game.registry.get('application');return new Promise(resolve=>{const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);app.onGameReady=ready;resolve();};app.load(save);});},baseline);
  console.log('PASS E1: food days in the HUD, a wooden Granary, Add a Builder from the notice, no Czech in the English UI');
}
