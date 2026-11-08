import assert from 'node:assert/strict';
import { clickWorld } from './building-menu-smoke.mjs';
// E3 arrow tutorial in its own page: a New Game starts it instead of the Getting started window; the arrow points at the
// next click; every step ticks by doing it through the real interface (Population job menu, Buildings menu, map clicks,
// Mark rocks, speed); "Skip" and the Settings switch work.
const scene=page=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {step:s.tutorial.progress().current?.id??null,active:s.tutorial.active};});
async function arrowOn(page,selector){
  await page.waitForFunction(sel=>{const a=document.querySelector('#tutorial-arrow'),t=document.querySelector(sel);if(!a||a.hidden||!t)return false;const r=a.getBoundingClientRect(),q=t.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;return Math.hypot(cx-(q.left+q.width/2),cy-(q.top+q.height/2))<Math.max(q.width,q.height)/2+60;},selector,{timeout:8000});
}
async function placeHere(page,id){
  const spot=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require(id),c=s.buildings.find(b=>b.type==='castle')??s.character.tile;
    for(let r=3;r<24;r++)for(let y=c.y-r;y<=c.y+r;y++)for(let x=c.x-r;x<=c.x+r;x++){if(Math.max(Math.abs(x-c.x),Math.abs(y-c.y))!==r)continue;const keep=s.selectedBuilding,mode=s.buildMode;s.selectedBuilding=d;s.buildMode=true;s.previewAnchor={x,y};s.previewKey=null;s.updateBuildingPreview();/* 0.61.0: the preview key ends with the gate axis */const ok=String(s.previewKey).endsWith(':false:null:null');s.selectedBuilding=keep;s.buildMode=mode;if(ok)return {x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16};}return null;},id);
  assert.ok(spot,`room for ${id}`);await clickWorld(page,spot,{forBlueprint:true});
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.some(b=>b.type===id),id);
  if(await page.evaluate(()=>!!window.__game.registry.get('application').scene.buildMode))await page.keyboard.press('Escape');
}
// m-tutorial-v2 point 2: inside the Population panel the arrow sits beside the panel at the target's height and
// neither the arrow nor the bubble covers the panel.
async function arrowBeside(page,selector){
  await page.waitForFunction(sel=>{const a=document.querySelector('#tutorial-arrow'),t=document.querySelector(sel),b=document.querySelector('#tutorial-bubble');if(!a||a.hidden||!t)return false;
    const boxes=[document.querySelector('#population-panel'),document.querySelector('#population-job-menu')].filter(e=>e&&!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect());
    const r=a.getBoundingClientRect(),q=t.getBoundingClientRect(),w=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,ov=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
    return Math.abs(cy-(q.top+q.height/2))<=q.height/2+12&&!boxes.some(p=>cx>p.left&&cx<p.right&&cy>p.top&&cy<p.bottom)&&!boxes.some(p=>ov(w,p))&&!ov(w,q);},selector,{timeout:8000});
}
// Builder, Hauler, Miner: Population tab → a free resident's job button → the profession in the job menu.
async function jobStep(page,job,next){
  await arrowOn(page,'#population-tab');await page.locator('#population-tab').click();
  await arrowBeside(page,'.population-row .population-job.is-unemployed');await page.locator('.population-row .population-job.is-unemployed').first().click();
  await arrowBeside(page,`#population-job-menu [data-job="${job}"]`);await page.locator(`#population-job-menu [data-job="${job}"]`).click();
  await page.locator('#close-population').click();await page.waitForFunction(next=>window.__game.registry.get('application').scene.tutorial.progress().current?.id===next,next);
}
// Optional steps (fisherman, mill, bakery): info with an arrow at the card and a "Next" button.
async function nextStep(page,id,next){
  assert.equal((await scene(page)).step,id);assert.equal(await page.locator('#tutorial-bubble .tutorial-next').isVisible(),true,`${id} has Next`);
  await page.locator('#tutorial-bubble .tutorial-next').click();assert.equal((await scene(page)).step,next);
}
// Follow the arrow: Buildings tab → category → card, then the map.
async function buildStep(page,id){
  if(!await page.locator('#buildings-panel').isVisible()){await arrowOn(page,'#buildings-tab');await page.locator('#buildings-tab').click();}
  const card=`#${id}-choice`;if(!await page.locator(card).isVisible()){const cat=await page.evaluate(id=>window.__game.registry.get('application').scene.objectRegistry.get(id).buildingCategory,id);await arrowOn(page,`[data-building-category="${cat}"]`);await page.locator(`[data-building-category="${cat}"]`).click();}
  await arrowOn(page,card);await page.locator(card).click();await page.waitForFunction(()=>/green|zelené/i.test(document.querySelector('#tutorial-bubble .tutorial-text').textContent),null,{timeout:5000});
  await placeHere(page,id);
}
export async function tutorialSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.setItem('newgame.tutorial','on'));await page.reload();
    await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.tutorial?.active);
    assert.equal(await page.locator('#help-dialog').evaluate(d=>d.open),false,'no Getting started window over the map');
    assert.equal((await scene(page)).step,'king');assert.equal(await page.locator('#tutorial-bubble').isVisible(),true);
    await page.locator('#tutorial-bubble .tutorial-next').click();assert.equal((await scene(page)).step,'builder');
    await jobStep(page,'builder','hauler');await jobStep(page,'hauler','granary');
    await buildStep(page,'granary');await buildStep(page,'hunting_lodge');
    await nextStep(page,'fisherman','farm');
    await buildStep(page,'farmhouse');assert.equal((await scene(page)).step,'mill','building an optional step also moves on');
    await nextStep(page,'mill','bakery');await nextStep(page,'bakery','lumberjack_hut');
    await buildStep(page,'lumberjack_hut');
    // Stone (points 5, 6): "Mark to clear" → the arrow points down at the rock nearest the Castle; marking it ends the step.
    assert.equal((await scene(page)).step,'stone');await arrowOn(page,'#mark-rocks');await page.locator('#mark-rocks').click();
    await page.waitForFunction(()=>/arrow|šipka/i.test(document.querySelector('#tutorial-bubble .tutorial-text').textContent)&&document.querySelector('#tutorial-arrow').style.transform.includes('1.57'),null,{timeout:5000});
    const rock=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,t=s.tutorial.rockTile();return t&&{x:s.map.length*32+(t.x-t.y)*32,y:128+(t.x+t.y+1)*16};});
    assert.ok(rock,'a visible rock near the Castle');
    await clickWorld(page,rock);
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.tutorial.progress().current?.id==='miner',null,{timeout:5000});
    if(await page.locator('#cancel-rock-marking').isVisible())await page.locator('#cancel-rock-marking').click();
    await jobStep(page,'miner','house');
    await page.locator('#tutorial-bubble .tutorial-skip').click();assert.equal((await scene(page)).step,'storage','Skip moves on');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/tutorial-house.png`});
    // Settings: switch off and on again – it resumes at the first step not done.
    await page.evaluate(()=>{const c=document.querySelector('#settings-tutorial');c.checked=false;c.dispatchEvent(new Event('change'));});assert.equal(await page.locator('#tutorial-bubble').isVisible(),false);
    await page.evaluate(()=>{const c=document.querySelector('#settings-tutorial');c.checked=true;c.dispatchEvent(new Event('change'));});await page.waitForFunction(()=>!document.querySelector('#tutorial-bubble').hidden);
    assert.equal((await scene(page)).step,'house','skips are forgotten when the tutorial is switched back on');
    // Tips (m-e3-tipy): with the tutorial off, the first time more than 3 residents are idle a tip points at Population.
    await page.evaluate(()=>{localStorage.setItem('newgame.tips','on');localStorage.removeItem('newgame.tipsSeen');const s=window.__game.registry.get('application').scene;const c=document.querySelector('#settings-tutorial');c.checked=false;c.dispatchEvent(new Event('change'));s.tutorial.tipsSeen.clear();for(let i=0;i<4;i++)s.workerSystem.create({x:s.character.tile.x+1,y:s.character.tile.y+i});});
    await page.waitForFunction(()=>document.querySelector('#tutorial-bubble.is-tip')&&!document.querySelector('#tutorial-bubble').hidden,null,{timeout:8000});
    assert.match(await page.locator('#tutorial-bubble .tutorial-text').textContent(),/no work/);await arrowOn(page,'#population-tab');
    await page.locator('#tutorial-bubble .tutorial-next').click();assert.equal(await page.locator('#tutorial-bubble').isVisible(),false);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.tipsSeen'))),['unemployed'],'a tip shows once');
    await page.evaluate(()=>localStorage.setItem('newgame.tips','off'));
    console.log('PASS E3 tutorial v2: starts instead of the Getting started window, arrow on every click (beside the Population panel, Buildings tab, category, card, a rock), Builder/Hauler/Miner steps, optional steps with Next, marking a rock ends the stone step, Skip, Settings off/on; a one-time tip with an arrow');
  }finally{await page.evaluate(()=>localStorage.setItem('newgame.tutorial','off')).catch(()=>{});await page.close();}
}
