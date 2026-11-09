import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild } from './building-menu-smoke.mjs';

// m-budovy-tooltip (owner point 86) and m-noc-zrychleni (82) in a real page (`--building-tooltip`).
// Tooltip: resting the real pointer on a Farmhouse (workplace + store), the Starter Stockpile (store), a House and a
// construction site shows #store-preview.building-tooltip after 0.8 s (not before), at most 4 lines; not in build
// mode, not for the selected building, not with Settings → Building tooltips off; the Dev slider changes the delay.
// Night speed-up: with Auto speed-up at night on, the night shows ☾3× and dawn returns 1×; off (default) nothing.
// Screenshot: $SMOKE_SHOTS/building-tooltip.png.
async function hoverPoint(page,id){
  // An exposed point of the building (like clickBuilding), camera centred on it, then the screen position.
  return page.evaluate(async id=>{
    const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),height=b.definition?.visualHeight??60;let world=null;
    for(const tile of b.tiles??[{x:b.x,y:b.y}]){for(let lift=8;lift<=height&&!world;lift+=8){const x=s.map.length*32+(tile.x-tile.y)*32,y=128+(tile.x+tile.y+1)*16-lift,h=(x-s.map.length*32)/32,v=(y-128)/16,hit=s.pickInteraction(x,y,{x:Math.floor((v+h)/2),y:Math.floor((v-h)/2)});if(hit?.kind==='building'&&hit.object.id===id)world={x,y};}if(world)break;}
    if(!world)throw Error(`No exposed surface for building ${id}.`);
    s.worldCamera.following=false;s.cameras.main.setZoom(.9).centerOn(world.x,world.y);s.cameras.main.preRender();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const c=s.cameras.main,r=s.game.canvas.getBoundingClientRect();return {x:r.left+((world.x-c.worldView.x)*c.zoom)*r.width/c.width,y:r.top+((world.y-c.worldView.y)*c.zoom)*r.height/c.height};
  },id);
}
async function rest(page,id,ms=950){
  const p=await hoverPoint(page,id);await page.mouse.move(5,5);await page.waitForTimeout(80);await page.mouse.move(p.x,p.y);await page.mouse.move(p.x+1,p.y);await page.waitForTimeout(ms);
  return page.evaluate(()=>{const t=document.querySelector('#store-preview');return {visible:!t.hidden,building:t.classList.contains('building-tooltip'),lines:[...t.children].map(c=>c.textContent.trim())};});
}
export async function buildingTooltipSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.storePreview);
    await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.employment?.setEnabled(false);s.fog?.setEnabled(false);if(s.tutorial){s.tutorial.active=false;s.tutorial.hide?.();}s.refreshVisibility?.();});
    const farm=await placeBlueprint(page,'farmhouse');await supplyAndBuild(page,farm);const house=await placeBlueprint(page,'house');await supplyAndBuild(page,house);
    const site=await placeBlueprint(page,'granary');
    const starter=await page.evaluate(()=>window.__game.registry.get('application').scene.buildings.find(b=>b.type==='starter_stockpile')?.id);
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.foodStorage.deposit(`farmhouse-${id}`,'wheat',40);},farm.id);
    // Not before the delay, then the tooltip.
    const early=await rest(page,farm.id,400);assert.equal(early.visible,false,'nothing after 0.4 s');
    const f=await rest(page,farm.id);assert.ok(f.visible&&f.building,'Farmhouse tooltip after 0.8 s');assert.match(f.lines[0],/^Farmhouse/);assert.ok(f.lines.some(l=>/^Workers \d+ \/ 3$/.test(l)),f.lines.join(' | '));assert.ok(f.lines.some(l=>/40 \/ 200$/.test(l)),'the grain store');assert.ok(f.lines.length<=4);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/building-tooltip.png`});
    if(starter!=null){const st=await rest(page,starter);assert.ok(st.visible);assert.match(st.lines.at(-1),/\d+ \/ 300$/,'store: used / capacity');assert.ok(st.lines.length<=4);}
    const h=await rest(page,house.id);assert.ok(h.visible);assert.match(h.lines[1],/^Residents \d+ \/ \d+/);
    const c=await rest(page,site.id);assert.ok(c.visible);assert.match(c.lines[1],/^Construction \d+ %$/);assert.ok(c.lines.length<=4);
    // Leaving hides it at once.
    await page.mouse.move(5,780);await page.waitForTimeout(100);assert.equal(await page.locator('#store-preview').isVisible(),false);
    // Build mode: nothing.
    await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator('#house-choice').click();
    assert.equal((await rest(page,farm.id)).visible,false,'not in build mode');
    // Escape leaves build mode; a second Escape would open the Game Menu (the map then gets no pointer at all).
    const building=()=>page.evaluate(()=>!!window.__game.registry.get('application').scene.buildMode);
    for(let i=0;i<2&&await building();i++)await page.keyboard.press('Escape');assert.equal(await building(),false);assert.equal(await page.locator('dialog[open]').count(),0,'no dialog over the map');
    // The selected building (its info panel open): nothing.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.demolitionUI.selectedId=id;},farm.id);assert.equal((await rest(page,farm.id)).visible,false,'not for the selected building');
    await page.evaluate(()=>{window.__game.registry.get('application').scene.demolitionUI.selectedId=null;});
    // Settings switch off: nothing; on again: back.
    await page.evaluate(()=>{const box=document.querySelector('#settings-building-tooltips');box.checked=false;box.dispatchEvent(new Event('change'));});assert.equal((await rest(page,farm.id)).visible,false,'switched off');
    await page.evaluate(()=>{const box=document.querySelector('#settings-building-tooltips');box.checked=true;box.dispatchEvent(new Event('change'));});assert.equal((await rest(page,farm.id)).visible,true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.buildingTooltips')),'on');
    // A longer delay (as the Dev slider sets it, 2 s): not yet after 1 s.
    // (The bundled modules are not importable from the page; the slider's value reaches StorePreview as buildingDelay.)
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.storePreview.buildingDelay=2000;});
    assert.equal((await rest(page,farm.id,1000)).visible,false,'a 2 s delay');
    await page.evaluate(()=>{window.__game.registry.get('application').scene.storePreview.buildingDelay=null;});
    assert.deepEqual(errors,[]);
    console.log(`PASS building tooltip: Farmhouse (${f.lines.join(' | ')}), store, House (${h.lines.join(' | ')}), site (${c.lines.join(' | ')}); none in build mode, for the selected building or switched off`);
  }finally{await page.close();}
}
// m-noc-zrychleni (82) (`--night-speed`): the indicator during the night with the option on and off.
export async function nightSpeedSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.nightSpeed'));await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.nightSpeedUp);
    await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    assert.equal(await page.locator('#settings-night-speed').inputValue(),'1','off by default');
    const toNight=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.gameTime.elapsed=(s.dayNight.nightStart()+.02)*s.gameTime.dayDuration;});
    const toDawn=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.gameTime.elapsed=s.gameTime.dayDuration-50;});
    const choose=v=>page.evaluate(v=>{const e=document.querySelector('#settings-night-speed');e.value=v;e.dispatchEvent(new Event('change'));},v);
    const pressed=()=>page.evaluate(()=>{const b=document.querySelector('#speed-controls [aria-pressed="true"]');return b?.textContent;});
    await toNight();await page.waitForTimeout(300);assert.equal(await pressed(),'1×','option off: the night keeps 1×');
    await choose('3');await page.waitForTimeout(300);assert.equal(await pressed(),'☾3×','option on: ☾3× at night');
    await toDawn();await page.waitForFunction(()=>window.__game.registry.get('application').scene.dayNight.part()==='dawn',null,{timeout:10000});await page.waitForTimeout(200);assert.equal(await pressed(),'1×','dawn: back to 1×');
    await toNight();await page.waitForTimeout(300);await page.evaluate(()=>document.activeElement?.blur?.());await page.keyboard.press('Digit2');await page.waitForTimeout(300);assert.equal(await pressed(),'2×','a manual change wins');
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.gameSpeed')),'2');
    // The tip after a year (option off).
    await choose('1');await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;if(s.tutorial){s.tutorial.active=false;s.tutorial.hide?.();}s.gameTime.day=21;});
    await page.locator('#night-speed-tip:not([hidden])').waitFor({timeout:5000});await page.locator('#night-speed-tip-enable').click();
    assert.equal(await page.locator('#settings-night-speed').inputValue(),'3','Turn on = ×3');
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.nightSpeedUp.exportState()),true);
    assert.deepEqual(errors,[]);console.log('PASS night speed-up: off by default, ☾3× at night with the option, back at dawn, a manual change wins, the tip once after a year');
  }finally{await page.evaluate(()=>{localStorage.removeItem('newgame.nightSpeed');localStorage.removeItem('newgame.gameSpeed');}).catch(()=>{});await page.close();}
}
