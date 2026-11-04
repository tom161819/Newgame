import assert from 'node:assert/strict';
export async function buildingMenuSmoke(page){
  if(!await page.locator('#building-categories').count())return;
  const definitions=await page.evaluate(()=>window.__game.registry.get('application').scene.objectRegistry.buildables().map(d=>({id:d.id,category:d.buildingCategory})));
  await page.locator('#buildings-tab').click();
  const categories=await page.locator('[data-building-category]').evaluateAll(tabs=>tabs.map(t=>t.dataset.buildingCategory));
  assert.deepEqual(categories,['all','defense','housing','food','industry','logistics','infrastructure']);
  for(const category of categories){
    const tab=page.locator(`[data-building-category="${category}"]`);await tab.click();assert.equal(await tab.getAttribute('aria-pressed'),'true');
    assert.deepEqual(await page.locator('#building-options [data-building-id]').evaluateAll(buttons=>buttons.map(b=>b.dataset.buildingId)),definitions.filter(d=>category==='all'||d.category===category).map(d=>d.id));
  }
  await page.locator('[data-building-category="defense"]').click();await page.locator('#tower-choice').click();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode),true);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="food"]').click();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode),false);
  const hasUnlocks=await page.evaluate(()=>!!window.__game.registry.get('application').scene.buildingUnlocks);
  if(hasUnlocks){
    assert.equal(await page.locator('#farmhouse-choice').isDisabled(),true);assert.equal(await page.locator('#wheat_field-choice').isDisabled(),true);assert.equal(await page.locator('#orchard-choice').isDisabled(),true);assert.equal(await page.locator('#granary-choice').isDisabled(),false);
    assert.match(await page.locator('#farmhouse-availability').textContent(),/Build a Granary/);
    assert.equal(await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return s.startBuilding(s.objectRegistry.require('farmhouse'));}),false);
  }
  const before=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.scrollY);await page.keyboard.down('w');await page.waitForTimeout(140);await page.keyboard.up('w');
  assert.ok(await page.evaluate(before=>window.__game.registry.get('application').scene.cameras.main.scrollY<before,before),'Camera remains operable with Buildings open.');
  await page.setViewportSize({width:390,height:844});const overflow=await page.locator('#building-categories').evaluate(e=>e.scrollWidth>e.clientWidth);assert.equal(overflow,true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('[data-building-category="all"]').click();await page.locator('#buildings-tab').click();await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.__game.registry.get('application').scene.worldCamera.syncSize();});
  await page.locator('#asset-library-button').click();await page.locator('#asset-categories [data-category="building"]').click();await page.locator('#asset-grid [data-object-id="farmhouse"]').click();assert.match(await page.locator('#asset-detail').textContent(),/Food & Farming/);
  if(hasUnlocks)assert.match(await page.locator('#asset-detail').textContent(),/Requires a completed Granary/);
  await page.locator('#close-asset-gallery').click();
  console.log('PASS registered building categories, All/empty tabs, preview cancellation, camera controls and mobile horizontal tabs');
}

export async function clickWorld(page,point,{forBlueprint=false}={}){
  await page.evaluate(async point=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const s=window.__game.registry.get('application').scene;s.worldCamera.syncSize();s.worldCamera.following=false;s.cameras.main.setZoom(.9).centerOn(point.x,point.y);s.cameras.main.preRender();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},point);
  const camera=await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.cameras.main;return{x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,w:c.width,h:c.height,z:c.zoom};}),bounds=await page.locator('canvas').boundingBox();
  // Staffing controls are real DOM overlays. Use an exposed point inside the
  // same 64x32 anchor diamond; never dispatch a synthetic click through them.
  const offsets=forBlueprint?[[0,0],[16,0],[-16,0],[0,-8],[0,8],[12,4],[-12,4],[12,-4],[-12,-4],[24,0],[-24,0]]:[[0,0]];
  for(const [dx,dy]of offsets){
    const target={x:bounds.x+((point.x+dx-camera.x)*camera.z+camera.w/2)*bounds.width/camera.w,y:bounds.y+((point.y+dy-camera.y)*camera.z+camera.h/2)*bounds.height/camera.h};
    if(forBlueprint&&!await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS',target))continue;
    await page.mouse.click(target.x,target.y);return;
  }
  throw Error('The blueprint anchor has no exposed canvas point; a real UI control covers it.');
}
export async function clickBuilding(page,id){
  // A ground tile can be covered by a neighbouring isometric roof. Click an
  // actually exposed part of this building through the ordinary mouse path.
  const point=await page.evaluate(id=>{
    const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),height=b.definition.visualHeight;
    for(const tile of b.tiles)for(let lift=8;lift<=height;lift+=8){const x=s.map.length*32+(tile.x-tile.y)*32,y=128+(tile.x+tile.y+1)*16-lift,horizontal=(x-s.map.length*32)/32,vertical=(y-128)/16,hit=s.pickInteraction(x,y,{x:Math.floor((vertical+horizontal)/2),y:Math.floor((vertical-horizontal)/2)});if(hit?.kind==='building'&&hit.object.id===id)return{x,y};}
    throw Error(`No exposed clickable surface for building ${id}.`);
  },id);await clickWorld(page,point);
}
export async function placeBlueprint(page,type){
  const point=await page.evaluate(type=>{
    const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require(type),occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),start=s.character.tile;
    for(let y=35;y<70;y++)for(let x=35;x<70;x++){
      const distance=Math.hypot(x-start.x,y-start.y);if(distance<5||distance>10)continue;const tiles=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:x+dx,y:y+dy});
      if(!tiles.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`)))continue;
      return {x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16};
    }throw Error(`No free ${type} blueprint site.`);
  },type);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator(`#${type}-choice`).click();await clickWorld(page,point,{forBlueprint:true});
  await page.waitForFunction(type=>window.__game.registry.get('application').scene.buildings.some(b=>b.type===type&&b.construction?.state==='planned'),type);
  const id=await page.evaluate(type=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type&&b.construction?.state==='planned').at(-1).id,type);return {id,point};
}
export async function supplyAndBuild(page,{id,point}){
  await clickBuilding(page,id);await page.locator('#construction-dialog[open]').waitFor();assert.equal(await page.locator('#construction-king-work').isDisabled(),true);await page.locator('#construction-deliver').click();await page.locator('#close-construction').click();
  await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);return s.constructionSystem.materials.ready(b)&&s.kingLogistics.workflowSiteId==null;},id,{timeout:35000});
  // A normal second map click issues the existing royal Build order.
  await clickBuilding(page,id);await page.locator('#construction-dialog[open]').waitFor();assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.constructionSystem.assignments.get('king')?.siteId===id,id),true);await page.locator('#close-construction').click();
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.construction?.state==='complete',id,{timeout:65000});
  console.log(`PASS physical construction and material delivery for site ${id}`);
}
export async function buildingUnlockGameplaySmoke(page){
  if(!await page.evaluate(()=>!!window.__game.registry.get('application').scene.buildingUnlocks))return;
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',29);s.inventory.add('apple',8);s.updateInventory();});
  const granary=await placeBlueprint(page,'granary');
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="food"]').click();assert.equal(await page.locator('#farmhouse-choice').isDisabled(),true);assert.match(await page.locator('#farmhouse-availability').textContent(),/completed Granary/);await page.locator('#buildings-tab').click();
  await supplyAndBuild(page,granary);
  await page.locator('#buildings-tab').click();assert.equal(await page.locator('#farmhouse-choice').isDisabled(),false);assert.equal(await page.locator('#wheat_field-choice').isDisabled(),true);await page.locator('#buildings-tab').click();
  const farm=await placeBlueprint(page,'farmhouse');
  const saved=await page.evaluate(()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('test',true);return app.snapshot();});
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__restored=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('test',true);window.__restored=true;app.onGameReady=ready;};await app.load(state);},saved);
  await page.waitForFunction(()=>window.__restored);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),saved);
  assert.equal(await page.locator('#farmhouse-choice').isDisabled(),false);assert.equal(await page.locator('#wheat_field-choice').isDisabled(),true);await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('test',false));
  await supplyAndBuild(page,farm);
  await page.locator('#buildings-tab').click();assert.equal(await page.locator('#wheat_field-choice').isDisabled(),false);assert.equal(await page.locator('#orchard-choice').isDisabled(),false);await page.locator('#buildings-tab').click();
  const field=await placeBlueprint(page,'wheat_field');
  // There is no completed-building demolition UI yet. Exercise the actual
  // world-change event with a consistent removal fixture, not a new mechanic.
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.buildings.splice(s.buildings.indexOf(b),1);for(const t of b.tiles)s.map[t.y][t.x]=s.terrainGrid[t.y][t.x];s.towerViews.get(id).destroy();s.towerViews.delete(id);s.workplaceSystem.records.delete(id);s.events.emit('buildings:changed');},farm.id);
  await page.locator('#buildings-tab').click();assert.equal(await page.locator('#wheat_field-choice').isDisabled(),true);assert.equal(await page.locator('#orchard-choice').isDisabled(),true);await page.locator('#buildings-tab').click();
  await supplyAndBuild(page,field);
  assert.equal(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return s.farmingSystem.records.has(id)&&s.inventory.count('stone')===7;},field.id),true);
  console.log('PASS actual Granary→Farmhouse physical supply/build, live menu unlocks, exact mid-blueprint Load, relocking and grandfathered field completion');
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',3);s.updateInventory();
    // Reproduce a real staffing button covering the camera-centred anchor.
    const bounds=s.game.canvas.getBoundingClientRect(),control=document.createElement('button');control.id='native-blueprint-ui-obstruction';control.textContent='⚙';window.__blueprintUIHits=0;
    Object.assign(control.style,{position:'fixed',left:`${bounds.left+bounds.width/2-15}px`,top:`${bounds.top+bounds.height/2-15}px`,width:'30px',height:'30px',minWidth:'0',minHeight:'0',padding:'0',margin:'0',border:'0',zIndex:'10000',pointerEvents:'auto'});control.addEventListener('pointerdown',()=>window.__blueprintUIHits++);document.body.append(control);
  });
  let tower;try{tower=await placeBlueprint(page,'tower');assert.equal(await page.evaluate(()=>window.__blueprintUIHits),0,'Blueprint placement uses exposed canvas instead of clicking a UI overlay.');}
  finally{await page.evaluate(()=>{document.querySelector('#native-blueprint-ui-obstruction')?.remove();delete window.__blueprintUIHits;});}
  await clickBuilding(page,tower.id);await page.locator('#construction-dialog[open]').waitFor();await page.locator('#cancel-construction').click();assert.equal(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return !s.buildings.some(b=>b.id===id)&&s.inventory.count('stone')===10;},tower.id),true);
  console.log('PASS actual unstarted blueprint cancellation restores the reserved price without duplicating materials');
}
