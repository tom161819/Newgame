import assert from 'node:assert/strict';
import { clickWorld } from './building-menu-smoke.mjs';

// m-zelezny-dul-misto (playtest 0.83.0 #5) in a real page, world of the report (generator 5): the Iron Deposit nearest to
// the Castle has a free Iron Mine spot beside it; the Iron Mine's build mode names why a spot is invalid (Unexplored,
// On the deposit, Rock, Out of deposit range) and a valid spot is green; a blueprint placed on unexplored ground that
// turns out blocked is cancelled into Notices (reason, camera link), not only the status line.
const CODE='MKW5-155515555555-SU24BGPY';
const world=t=>({x:6400/2+(t.x-t.y)*32,y:128+(t.x+t.y+1)*16});
// The build-mode status for the Iron Mine (or another tool) with its footprint anchored at `tile`, by a real mouse move.
async function hover(page,tile){
  const p=await page.evaluate(t=>{const s=window.__game.registry.get('application').scene;return {x:s.map.length*32+(t.x-t.y)*32,y:128+(t.x+t.y+1)*16};},tile);
  await page.evaluate(async point=>{const s=window.__game.registry.get('application').scene;s.worldCamera.following=false;s.worldCamera.panTarget=null;s.cameras.main.setZoom(.9).centerOn(point.x,point.y);s.cameras.main.preRender();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},p);
  const c=await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.cameras.main;return {x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,w:c.width,h:c.height,z:c.zoom};}),b=await page.locator('canvas:not(.minimap-canvas):not(.world-preview):not(.we-map):not(.we-iso)').boundingBox();
  await page.mouse.move(b.x+((p.x-c.x)*c.z+c.w/2)*b.width/c.w+1,b.y+((p.y-c.y)*c.z+c.h/2)*b.height/c.h+1);
  return page.waitForFunction(t=>{const s=window.__game.registry.get('application').scene,a=s.previewAnchor;return a&&a.x===t.x&&a.y===t.y&&document.querySelector('#status').textContent;},tile,{timeout:5000}).then(h=>h.jsonValue());
}
export async function ironMineSpotSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill(CODE);await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.diagnostics&&window.__game.registry.get('application').scene.minimap);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    const info=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,m=s.naturalResources.mining,c=m.startCentre();s.inventory.add('wood',200);s.updateInventory();
      const iron=m.deposits().filter(d=>d.type.startsWith('iron')).map(d=>({id:d.natural.id,x:d.x,y:d.y,w:d.definition.width,dist:Math.hypot(d.x+d.definition.width/2-c.x,d.y+d.definition.height/2-c.y)})).sort((a,b)=>a.dist-b.dist);
      const nearest=s.naturalResources.byId.get(iron[0].id),site=m.ironMineSite(nearest);
      // A rock tile next to the deposit (for the "Rock" reason) and a tile far from every deposit.
      let rock=null;for(let r=1;r<8&&!rock;r++)for(let y=nearest.y-r;y<=nearest.y+1+r&&!rock;y++)for(let x=nearest.x-r;x<=nearest.x+1+r&&!rock;x++)if(s.terrainGrid[y]?.[x]===1)rock={x,y};
      return {iron,site,rock,fog:s.fog.enabled};});
    assert.equal(info.fog,true,'New Game: fog on');assert.ok(info.site,'a free Iron Mine spot beside the nearest Iron Deposit');assert.ok(Math.abs(info.iron[0].dist-18.6)<1.5,`nearest Iron Deposit ~18 tiles (${info.iron[0].dist})`);
    const d=info.iron[0];
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.startBuilding(s.objectRegistry.require('iron_mine'));});
    // Fog: the deposit's ground was never seen.
    assert.equal(await hover(page,info.site),'Iron Mine cannot stand here: Unexplored.');
    await clickWorld(page,world(info.site),{forBlueprint:true});
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildings.some(b=>b.type==='iron_mine')),false,'no blind Iron Mine blueprint');
    // Seen: the reasons and the valid spot.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility();});
    assert.equal(await hover(page,{x:d.x,y:d.y}),'Iron Mine cannot stand here: On the deposit – the mine stands beside it.');
    if(info.rock){const at={x:info.rock.x-1,y:info.rock.y-1},text=await hover(page,at);assert.match(text,/^Iron Mine cannot stand here: (Rock|On the deposit – the mine stands beside it)\.$/,text);}
    assert.equal(await hover(page,{x:d.x+12,y:d.y+12}),'Iron Mine cannot stand here: Out of deposit range (an Iron Deposit within 4 tiles).');
    assert.match(await hover(page,info.site),/^Valid place/,'the guaranteed spot is valid');
    await clickWorld(page,world(info.site),{forBlueprint:true});
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.buildings.some(b=>b.type==='iron_mine'),null,{timeout:8000});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;if(s.buildMode)s.cancelBuilding();});

    // ---- A House blueprint over a rock nobody has seen: cancelled once seen, into Notices with the reason.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(true);s.refreshVisibility();});
    const hidden=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,f=s.fog,house=s.objectRegistry.require('house');
      for(let y=4;y<95;y++)for(let x=4;x<95;x++){if(s.terrainGrid[y][x]!==1)continue;const a={x:x-1,y};const tiles=[];for(let dy=0;dy<house.height;dy++)for(let dx=0;dx<house.width;dx++)tiles.push({x:a.x+dx,y:a.y+dy});
        if(tiles.every(t=>!f.isInSightTile(t)&&!f.explored[t.y*f.width+t.x])&&tiles.filter(t=>s.terrainGrid[t.y][t.x]===1).length===1&&tiles.every(t=>s.map[t.y][t.x]!==2))return a;}return null;});
    assert.ok(hidden,'an unexplored spot with one hidden rock');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',50);s.inventory.add('stone',50);s.updateInventory();s.startBuilding(s.objectRegistry.require('house'));});
    assert.match(await hover(page,hidden),/unexplored ground/i,'provisional (amber)');
    await clickWorld(page,world(hidden),{forBlueprint:true});
    const siteId=await page.waitForFunction(()=>window.__game.registry.get('application').scene.buildings.find(b=>b.type==='house'&&b.unverified)?.id,null,{timeout:8000}).then(h=>h.jsonValue());
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;if(s.buildMode)s.cancelBuilding();});
    await page.evaluate(a=>{const s=window.__game.registry.get('application').scene;s.fog.registerSource('smoke-scout',()=>({center:{x:a.x+1,y:a.y+1},radius:5}));s.refreshVisibility();},hidden);
    await page.waitForFunction(id=>!window.__game.registry.get('application').scene.buildings.some(b=>b.id===id),siteId,{timeout:10000});
    const row=page.locator('#notices-list .notice-text',{hasText:'Construction cancelled: House – Rock. Materials returned.'});await row.first().waitFor({timeout:8000});
    await page.evaluate(()=>window.__game.registry.get('application').scene.worldCamera.follow());await row.first().click();
    const camera=await page.evaluate(a=>{const s=window.__game.registry.get('application').scene,c=s.worldCamera,x=s.map.length*32+(a.x-a.y)*32,y=128+(a.x+a.y)*16-25;return {following:c.following,dx:Math.abs((c.panTarget?.x??1e9)-x),dy:Math.abs((c.panTarget?.y??1e9)-y)};},hidden);
    assert.equal(camera.following,false);assert.ok(camera.dx<40&&camera.dy<40,`camera to the cancelled site ${JSON.stringify(camera)}`);
    console.log(`PASS Iron mine spot: nearest Iron Deposit ${d.dist.toFixed(1)} tiles with a free spot (${info.site.x},${info.site.y}); build mode says Unexplored / On the deposit / Out of deposit range, valid beside it; a hidden-rock House blueprint is cancelled into Notices with the reason and a camera link`);
  }finally{await page.close();}
}
