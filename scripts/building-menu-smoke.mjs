import assert from 'node:assert/strict';
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function horizontalStripSmoke(page){
  // Desktop: the open menu is a low horizontal strip with several cards side by side, reachable by buttons, wheel and keyboard.
  // All buildings, whatever category an earlier step left selected.
  await page.locator('[data-building-category="all"]').click();await frames(page);const layout=await page.evaluate(()=>{const panel=document.querySelector('#buildings-panel').getBoundingClientRect(),list=document.querySelector('#building-options'),box=list.getBoundingClientRect();const cards=[...list.querySelectorAll('.building-option')].map(c=>c.getBoundingClientRect());return {height:panel.height,width:panel.width,side:cards.filter(c=>Math.abs(c.top-cards[0].top)<1&&c.left>=box.left-1&&c.right<=box.right+1).length,overflow:list.scrollWidth>list.clientWidth,page:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(layout.side>=3,`at least three building cards side by side (${layout.side})`);assert.ok(layout.height<=420,`Buildings menu stays low (${layout.height}px)`);assert.ok(layout.width>layout.height);assert.equal(layout.page,false);assert.equal(layout.overflow,true);
  const scrollLeft=()=>page.locator('#building-options').evaluate(e=>e.scrollLeft);
  assert.equal(await page.locator('#building-scroll-prev').isDisabled(),true);assert.equal(await page.locator('#building-scroll-next').isDisabled(),false);
  await page.locator('#building-scroll-next').click();await page.waitForFunction(()=>document.querySelector('#building-options').scrollLeft>100);await page.waitForFunction(()=>!document.querySelector('#building-scroll-prev').disabled);
  await page.locator('#building-options').evaluate(e=>{e.scrollLeft=0;});const zoom=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom);
  await page.locator('#building-options').hover();await page.mouse.wheel(0,300);await page.waitForFunction(()=>document.querySelector('#building-options').scrollLeft>0);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.zoom),zoom,'the wheel over the strip does not zoom the map');
  await page.locator('#building-options [data-building-id]').first().focus();await page.keyboard.press('End');await frames(page);
  const last=await page.evaluate(()=>{const list=document.querySelector('#building-options'),buttons=[...list.querySelectorAll('[data-building-id]')],box=list.getBoundingClientRect(),rect=document.activeElement.getBoundingClientRect();return {focused:document.activeElement===buttons.at(-1),visible:rect.left>=box.left-1&&rect.right<=box.right+1};});
  assert.deepEqual(last,{focused:true,visible:true});await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>{const b=[...document.querySelectorAll('#building-options [data-building-id]')];return document.activeElement===b.at(-2);}),true);
  await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('#building-options [data-building-id]')),true);
  await page.locator('#building-options').evaluate(e=>{e.scrollLeft=0;});assert.equal(await scrollLeft(),0);
}
async function mobileLastBuildingSmoke(page){
  // Narrow screens: the last building in All can be scrolled into view and selected without page overflow.
  await page.locator('#building-options').evaluate(e=>{e.scrollLeft=e.scrollWidth;});await frames(page);
  const id=await page.locator('#building-options [data-building-id]:not([disabled])').last().getAttribute('data-building-id'),choice=page.locator(`#${id}-choice`);
  const box=await choice.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390,'the last available building is fully on screen');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await choice.click();assert.equal(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return s.buildMode&&s.selectedBuilding?.id===id;},id),true);
  await page.locator('#cancel-building').click();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode),false);await page.locator('#buildings-tab').click();
}
export async function buildingMenuSmoke(page){
  if(!await page.locator('#building-categories').count())return;
  const definitions=await page.evaluate(()=>window.__game.registry.get('application').scene.objectRegistry.buildables().map(d=>({id:d.id,category:d.buildingCategory,menuOrder:d.menuOrder})));
  // #132: menuOrder sorts buildings inside their category; in All each category keeps its slots.
  const menuOrder=list=>{const out=list.slice(),slots=new Map();list.forEach((d,i)=>{if(!slots.has(d.category))slots.set(d.category,[]);slots.get(d.category).push(i);});for(const idx of slots.values()){const sorted=idx.map(i=>list[i]).sort((a,b)=>(a.menuOrder??Number.MAX_SAFE_INTEGER)-(b.menuOrder??Number.MAX_SAFE_INTEGER));idx.forEach((i,j)=>{out[i]=sorted[j];});}return out;};
  await page.locator('#buildings-tab').click();await horizontalStripSmoke(page);
  const categories=await page.locator('[data-building-category]').evaluateAll(tabs=>tabs.map(t=>t.dataset.buildingCategory));
  assert.deepEqual(categories,['all','defense','housing','food','industry','logistics','infrastructure']);
  for(const category of categories){
    const tab=page.locator(`[data-building-category="${category}"]`);await tab.click();assert.equal(await tab.getAttribute('aria-pressed'),'true');
    assert.deepEqual(await page.locator('#building-options [data-building-id]').evaluateAll(buttons=>buttons.map(b=>b.dataset.buildingId)),menuOrder(definitions.filter(d=>category==='all'||d.category===category)).map(d=>d.id));
  }
  await page.locator('[data-building-category="defense"]').click();await page.locator('#tower-choice').click();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode),true);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="food"]').click();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode),false);
  const hasUnlocks=await page.evaluate(()=>!!window.__game.registry.get('application').scene.buildingUnlocks);
  if(hasUnlocks){
    // Food menu (owner, 7 Nov): nothing is locked; a missing earlier building is a red warning under the choice.
    for(const id of ['granary','farmhouse','wheat_field','orchard','hunting_lodge','fisherman_hut','mill','bakery'])assert.equal(await page.locator(`#${id}-choice`).isDisabled(),false,id);
    assert.match(await page.locator('#farmhouse-availability').textContent(),/Needs a Granary to store food/);assert.match(await page.locator('#hunting_lodge-availability').textContent(),/Needs a Granary to store food/);
    assert.match(await page.locator('#wheat_field-availability').textContent(),/Needs a Farmhouse/);assert.equal(await page.locator('#hunting_lodge-availability.building-warning').count(),1);
    assert.equal(await page.locator('#building-options [data-building-id]').first().getAttribute('data-building-id'),'granary','the Granary leads the Food menu');
    assert.equal(await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,ok=s.startBuilding(s.objectRegistry.require('farmhouse'));s.cancelBuilding?.();return ok;}),true,'a Farmhouse can be chosen before a Granary');
  }
  const before=await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.scrollY);await page.keyboard.down('w');await page.waitForTimeout(140);await page.keyboard.up('w');
  assert.ok(await page.evaluate(before=>window.__game.registry.get('application').scene.cameras.main.scrollY<before,before),'Camera remains operable with Buildings open.');
  await page.setViewportSize({width:390,height:844});const overflow=await page.locator('#building-categories').evaluate(e=>e.scrollWidth>e.clientWidth);assert.equal(overflow,true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('[data-building-category="all"]').click();await mobileLastBuildingSmoke(page);await page.locator('#buildings-tab').click();await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.__game.registry.get('application').scene.worldCamera.syncSize();});
  await page.locator('#asset-library-button').click();await page.locator('#asset-categories [data-category="building"]').click();await page.locator('#asset-grid [data-object-id="farmhouse"]').click();assert.match(await page.locator('#asset-detail').textContent(),/Food & Farming/);
  if(hasUnlocks)assert.match(await page.locator('#asset-detail').textContent(),/Recommended first \(warning only\)Granary/);
  await page.locator('#close-asset-gallery').click();
  console.log('PASS registered building categories, All/empty tabs, horizontal building strip (buttons, wheel, keyboard), preview cancellation, camera controls and mobile last-building selection');
}

export async function clickWorld(page,point,{forBlueprint=false}={}){
  await page.evaluate(async point=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const s=window.__game.registry.get('application').scene;s.worldCamera.syncSize();s.worldCamera.following=false;s.cameras.main.setZoom(.9).centerOn(point.x,point.y);s.cameras.main.preRender();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},point);
  const camera=await page.evaluate(()=>{const c=window.__game.registry.get('application').scene.cameras.main;return{x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,w:c.width,h:c.height,z:c.zoom};}),bounds=await page.locator('canvas:not(.minimap-canvas)').boundingBox();
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
// A villager or animal can step onto the chosen free footprint between choosing it and the real click; then the game
// rightly refuses the blueprint. Choose a fresh site and click again instead of waiting for a placement that never comes.
export async function placeBlueprint(page,type){
  const placed=()=>page.evaluate(type=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type&&b.construction?.state==='planned').length,type);
  const before=await placed();let point;
  for(let attempt=0;attempt<4;attempt++){
    point=await chooseBlueprintSite(page,type);
    if(attempt===0||!await page.evaluate(type=>{const s=window.__game.registry.get('application').scene;return !!s.buildMode&&s.selectedBuilding?.id===type;},type)){await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator(`#${type}-choice`).click();}
    await clickWorld(page,point,{forBlueprint:true});
    try{await page.waitForFunction(({type,before})=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type&&b.construction?.state==='planned').length>before,{type,before},{timeout:8000});break;}
    catch(error){if(attempt===3)throw new Error(`${type} blueprint not placed after 4 sites; status: ${await page.locator('#status').textContent()}`);}
  }
  const id=await page.evaluate(type=>window.__game.registry.get('application').scene.buildings.filter(b=>b.type===type&&b.construction?.state==='planned').at(-1).id,type);
  // This helper promises one blueprint; repeat-placement tools must be dismissed before inspecting it.
  if(await page.evaluate(()=>window.__game.registry.get('application').scene.buildMode))await page.keyboard.press('Escape');
  return {id,point};
}
export async function chooseBlueprintSite(page,type){
  return page.evaluate(type=>{
    const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require(type),occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),start=s.character.tile;
    for(let y=35;y<70;y++)for(let x=35;x<70;x++){
      const distance=Math.hypot(x-start.x,y-start.y);if(distance<5||distance>10)continue;const tiles=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:x+dx,y:y+dy});
      if(!tiles.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`)))continue;
      return {x:s.map.length*32+(x-y)*32,y:128+(x+y+1)*16};
    }throw Error(`No free ${type} blueprint site.`);
  },type);
}
export async function supplyAndBuild(page,{id,point}){
  // There is no Deliver Materials button: Build with King first carries the missing materials, then builds.
  await clickBuilding(page,id);await page.locator('#construction-dialog[open]').waitFor();assert.equal(await page.locator('#construction-deliver').count(),0);assert.equal(await page.locator('#construction-king-work').isDisabled(),false);await page.locator('#construction-king-work').click();await page.locator('#close-construction').click();
  await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);return s.constructionSystem.materials.ready(b)&&s.kingLogistics.workflowSiteId==null&&s.constructionSystem.assignments.get('king')?.siteId===id;},id,{timeout:120000});
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.construction?.state==='complete',id,{timeout:65000});
  console.log(`PASS physical construction and material delivery for site ${id}`);
}
export async function buildingUnlockGameplaySmoke(page){
  if(!await page.evaluate(()=>!!window.__game.registry.get('application').scene.buildingUnlocks))return;
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',29);s.inventory.add('apple',8);s.updateInventory();});
  const granary=await placeBlueprint(page,'granary');
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="food"]').click();assert.equal(await page.locator('#farmhouse-choice').isDisabled(),false,'Food menu: never locked');assert.match(await page.locator('#farmhouse-availability').textContent(),/Needs a Granary to store food/);assert.match(await page.locator('#hunting_lodge-availability').textContent(),/Needs a Granary/);assert.equal(await page.locator('#hunting_lodge-availability.building-warning').count(),1,'red warning');await page.locator('#buildings-tab').click();
  await supplyAndBuild(page,granary);
  await page.locator('#buildings-tab').click();assert.equal(await page.locator('#farmhouse-choice').isDisabled(),false);assert.doesNotMatch(await page.locator('#hunting_lodge-availability').textContent(),/Needs/,'the warning goes with a completed Granary');assert.equal(await page.locator('#wheat_field-choice').isDisabled(),false);assert.match(await page.locator('#wheat_field-availability').textContent(),/Needs a Farmhouse/);await page.locator('#buildings-tab').click();
  const farm=await placeBlueprint(page,'farmhouse');
  const saved=await page.evaluate(()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('test',true);return app.snapshot();});
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__restored=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('test',true);window.__restored=true;app.onGameReady=ready;};await app.load(state);},saved);
  await page.waitForFunction(()=>window.__restored);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),saved);
  assert.equal(await page.locator('#farmhouse-choice').isDisabled(),false);assert.match(await page.locator('#wheat_field-availability').textContent(),/Needs a Farmhouse/);await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('test',false));
  await supplyAndBuild(page,farm);
  await page.locator('#buildings-tab').click();assert.doesNotMatch(await page.locator('#wheat_field-availability').textContent(),/Needs/);assert.doesNotMatch(await page.locator('#orchard-availability').textContent(),/Needs/);await page.locator('#buildings-tab').click();
  const field=await placeBlueprint(page,'wheat_field');
  // There is no completed-building demolition UI yet. Exercise the actual
  // world-change event with a consistent removal fixture, not a new mechanic.
  const removedFarm=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),saved={...b,definition:undefined};s.buildings.splice(s.buildings.indexOf(b),1);for(const t of b.tiles)s.map[t.y][t.x]=s.terrainGrid[t.y][t.x];s.towerViews.get(id).destroy();s.towerViews.delete(id);s.events.emit('buildings:changed');return saved;},farm.id);
  await page.locator('#buildings-tab').click();assert.match(await page.locator('#wheat_field-availability').textContent(),/Needs a Farmhouse/);assert.equal(await page.locator('#orchard-choice').isDisabled(),false);await page.locator('#buildings-tab').click();
  assert.equal(await page.evaluate(id=>{const b=window.__game.registry.get('application').scene.buildings.find(b=>b.id===id);return b.farmId===null&&b.construction.workDone===0;},field.id),true);
  // Restore the same completed-house fixture after testing its removal. Goods
  // are unchanged; establishment must wait for the returned owner and a Farmer.
  await page.evaluate(saved=>{const s=window.__game.registry.get('application').scene,b={...saved,definition:s.objectRegistry.require(saved.type)};s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(b.definition,b));s.events.emit('buildings:changed');const w=s.workerSystem.liveSubjects().find(w=>w.profession==='idle');if(!w||!s.workplaceSystem.assign(b,w))throw Error('No Farmer available for establishment');s.employment.release(w);s.workerSystem.commands.resume(w);},removedFarm);
  await clickBuilding(page,field.id);await page.locator('#construction-dialog[open]').waitFor();assert.equal(await page.locator('#construction-king-work').isDisabled(),true);assert.equal(await page.locator('#construction-king-work').isVisible(),false);await page.locator('#close-construction').click();
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.construction?.state==='complete',field.id,{timeout:60000});
  assert.equal(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return s.farmingSystem.records.has(id)&&s.inventory.count('stone')===10;},field.id),true);
  console.log('PASS actual Granary→Farmhouse physical supply/build, live unlocks and exact mid-blueprint Load; orphan waits, owner reconnects and a Farmer establishes the free field');
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',3);s.updateInventory();
    // Reproduce a real staffing button covering the camera-centred anchor.
    const bounds=s.game.canvas.getBoundingClientRect(),control=document.createElement('button');control.id='native-blueprint-ui-obstruction';control.textContent='⚙';window.__blueprintUIHits=0;
    Object.assign(control.style,{position:'fixed',left:`${bounds.left+bounds.width/2-15}px`,top:`${bounds.top+bounds.height/2-15}px`,width:'30px',height:'30px',minWidth:'0',minHeight:'0',padding:'0',margin:'0',border:'0',zIndex:'10000',pointerEvents:'auto'});control.addEventListener('pointerdown',()=>window.__blueprintUIHits++);document.body.append(control);
  });
  let tower;try{tower=await placeBlueprint(page,'tower');assert.equal(await page.evaluate(()=>window.__blueprintUIHits),0,'Blueprint placement uses exposed canvas instead of clicking a UI overlay.');}
  finally{await page.evaluate(()=>{document.querySelector('#native-blueprint-ui-obstruction')?.remove();delete window.__blueprintUIHits;});}
  await clickBuilding(page,tower.id);await page.locator('#construction-dialog[open]').waitFor();await page.locator('#cancel-construction').click();assert.equal(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return !s.buildings.some(b=>b.id===id)&&s.inventory.count('stone')===13;},tower.id),true);
  console.log('PASS actual unstarted blueprint cancellation restores the reserved price without duplicating materials');
}
