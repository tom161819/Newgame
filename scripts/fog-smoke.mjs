import assert from 'node:assert/strict';

export async function explorationMenuSmoke(page){
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('fog-smoke',true);window.__fogSmoke={position:{...s.character.position},tile:{...s.character.tile},fog:s.fog.enabled,exploration:s.fog.explorationEnabled};});
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').check();await page.locator('#exploration-toggle').check();
  const sample=()=>page.evaluate(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const s=window.__game.registry.get('application').scene,tile={x:95,y:95},cx=Math.floor(tile.x/10),cy=Math.floor(tile.y/10),texture=s.terrain.chunkTexture(cx,cy),point={x:3200+(tile.x-tile.y)*32,y:128+(tile.x+tile.y+1)*16};
    const pixel=Array.from(s.textures.get(texture.key).getContext().getImageData(point.x-texture.x,point.y-texture.y,1,1).data);
    const c=s.cameras.main,k=s.character.tile,edge={x:3200+(k.x+9-k.y+8)*32,y:128+(k.x+9+k.y-8)*16},screen={x:Math.round((edge.x-(c.scrollX+c.width/2))*c.zoom+c.width/2),y:Math.round((edge.y-(c.scrollY+c.height/2))*c.zoom+c.height/2)},seam=Array.from(s.game.canvas.getContext('2d').getImageData(screen.x,screen.y,1,1).data);
    return {pixel,seam,backgroundAlpha:c.backgroundColor.alpha,seen:s.fog.explored.reduce((a,b)=>a+b,0),state:s.fog.state(tile),display:s.fog.displayState(tile),memory:s.mapMemory.terrain.has(9595)};
  });
  const black=await sample();assert.deepEqual(black.pixel,[0,0,0,255]);assert.deepEqual(black.seam,[0,0,0,255]);assert.equal(black.backgroundAlpha,255);assert.equal(black.state,0);assert.equal(black.memory,false);
  await page.locator('#exploration-toggle').uncheck();const grey=await sample();assert.equal(grey.display,1);assert.ok(grey.pixel.slice(0,3).some(v=>v>0));assert.equal(grey.seen,black.seen);
  await page.locator('#fog-toggle').uncheck();const clear=await sample();assert.equal(clear.display,2);assert.ok(clear.pixel.slice(0,3).reduce((a,b)=>a+b,0)>grey.pixel.slice(0,3).reduce((a,b)=>a+b,0)*1.5);assert.equal(clear.seen,black.seen);
  await page.locator('#exploration-toggle').check();await page.locator('#fog-toggle').check();const restored=await sample();assert.deepEqual(restored,black);
  const history=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene,old={...s.character.tile},index=old.y*100+old.x;
    // Subjects standing near the king still see his old tile; leave only the king as a source for this check.
    const subjects=s.fog.providers.get('subjects');s.fog.providers.delete('subjects');
    const before=s.mapMemory.terrain.get(index)?.slice();s.character.position={x:80.5,y:80.5};s.refreshVisibility();
    const result={state:s.fog.state(old),old:before,remembered:s.mapMemory.terrain.get(index)?.slice(),unknown:s.fog.state({x:95,y:95}),count:s.fog.explored.reduce((a,b)=>a+b,0)};
    s.character.position={...window.__fogSmoke.position};if(subjects)s.fog.providers.set('subjects',subjects);s.refreshVisibility();return result;
  });
  assert.equal(history.state,1);assert.deepEqual(history.remembered,history.old);assert.equal(history.unknown,0);assert.ok(history.count>black.seen);
  const original=await page.evaluate(()=>window.__fogSmoke);await page.locator('#fog-toggle').setChecked(original.fog);await page.locator('#exploration-toggle').setChecked(original.exploration);await page.locator('#close-settings').click();
  await page.evaluate(()=>{window.__game.registry.get('application').scene.pauseManager.set('fog-smoke',false);delete window.__fogSmoke;});
  console.log('PASS native circular exploration, black/grey/normal terrain pixels, independent runtime switches, unchanged discovery on test reveal and frozen known terrain');
}

export async function staticMemoryRendererSmoke(page){
  const result=await page.evaluate(()=>{
    const app=window.__game.registry.get('application'),s=app.scene;s.pauseManager.set('memory-smoke',true);
    const position={...s.character.position},enabled=s.fog.enabled,before=app.snapshot(),memory=new s.mapMemory.constructor(s.fog),renderer=new s.memoryRenderer.constructor(s,memory);
    const types=['tower','castle','wall','granary','wheat_field','orchard','stone','treasure_chest'];
    const entries=types.map((type,index)=>{const d=s.objectRegistry.require(type),kind=d.category==='building'?'building':type==='treasure_chest'?'chest':'resource';return {key:`fixture:${type}`,kind,type,x:s.character.tile.x+2,y:s.character.tile.y+2,width:d.width,height:d.height,visual:{...(d.crop?{stage:3,season:'Summer'}:{}),...(type==='tower'?{construction:{state:'building',progress:50,workDone:10}}:{}),...(type==='treasure_chest'?{opened:true,lid:{y:-38,rotation:-.65}}:{})}};});
    // Only the king's sight here: subjects standing near his old tile would still see the fixtures.
    const subjects=s.fog.providers.get('subjects');s.fog.providers.delete('subjects');
    s.fog.setEnabled(true);memory.observeObjects(entries);s.character.position={x:80.5,y:80.5};s.fog.update();renderer.update(s.cameras.main.worldView);
    const rendered=[...renderer.views.keys()],chest=renderer.views.get('fixture:treasure_chest')?.view,field=renderer.views.get('fixture:wheat_field')?.view;
    const visual={chestOpened:chest?.opened,chestLid:chest?.lid?.rotation,fieldStage:field?.stage,fieldSeason:field?.season,fieldTexture:field?.plants[0].texture.key};
    renderer.destroy();s.character.position=position;if(subjects)s.fog.providers.set('subjects',subjects);s.fog.setEnabled(enabled);s.refreshVisibility();const after=app.snapshot();
    const keys=['inventory','buildings','workers','resources','drops','foodStorage','foodProduction','farming','production','constructionSystem'];
    const unchanged=keys.every(key=>JSON.stringify(before[key])===JSON.stringify(after[key]));s.pauseManager.set('memory-smoke',false);
    return {rendered,visual,unchanged};
  });
  assert.equal(result.rendered.length,8);assert.equal(result.unchanged,true);assert.equal(result.visual.chestOpened,true);assert.ok(Math.abs(result.visual.chestLid+.65)<1e-12);assert.equal(result.visual.fieldStage,3);assert.equal(result.visual.fieldSeason,'Summer');assert.match(result.visual.fieldTexture,/^memory-texture:/);
  console.log('PASS native frozen tower/scaffold, castle, wall, granary, crops, orchard, stone and opened chest; muted full-height copies leave actual world, workers, stocks and production unchanged');
}

export async function hiddenInteractionSmoke(page){
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').check();await page.locator('#exploration-toggle').check();await page.locator('#path-wear-toggle').check();await page.locator('#close-settings').click();
  // Every living subject is its own sight source (radius 7.5) next to the king's.
  const sight=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,f=s.fog;f.update();const subjects=s.workerSystem.liveSubjects();return {sources:f.sources.length,subjects:subjects.length,radii:[...new Set(f.sources.slice(1).map(x=>x.radius))],own:subjects.every(w=>f.isInSightTile({x:Math.floor(w.position.x),y:Math.floor(w.position.y)}))};});
  assert.ok(sight.subjects>0);assert.equal(sight.sources,sight.subjects+1);assert.deepEqual(sight.radii,[7.5]);assert.equal(sight.own,true);
  const original=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main;const state={x:c.scrollX+c.width/2,y:c.scrollY+c.height/2,zoom:c.zoom,following:s.worldCamera.following,count:s.buildings.length};s.worldCamera.following=false;c.centerOn(3200,3150).setZoom(.9);c.preRender();return state;});
  const clickTile=async tile=>{const point=await page.evaluate(tile=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main,p={x:3200+(tile.x-tile.y)*32,y:128+(tile.x+tile.y+1)*16};return{x:(p.x-(c.scrollX+c.width/2))*c.zoom+c.width/2,y:(p.y-(c.scrollY+c.height/2))*c.zoom+c.height/2,w:c.width,h:c.height};},tile),bounds=await page.locator('canvas').boundingBox();await page.mouse.move(bounds.x+point.x*bounds.width/point.w,bounds.y+point.y*bounds.height/point.h);await page.mouse.click(bounds.x+point.x*bounds.width/point.w,bounds.y+point.y*bounds.height/point.h);};
  await clickTile({x:95,y:95});const first=await page.locator('#status').textContent();assert.equal(first,'Outside current sight. Explore this area first.');assert.equal(await page.locator('#path-wear-info').textContent(),'Path Wear: outside current sight.');
  await clickTile({x:96,y:95});assert.equal(await page.locator('#status').textContent(),first);assert.equal(await page.locator('#object-tooltip').evaluate(e=>e.hidden),true);
  await page.locator('#buildings-tab').click();await page.locator('[data-building-category="defense"]').click();await page.locator('#tower-choice').click();await clickTile({x:95,y:95});assert.equal(await page.locator('#status').textContent(),first);assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.buildings.length),original.count);await page.keyboard.press('Escape');
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').uncheck();await page.locator('#path-wear-toggle').uncheck();await page.locator('#close-settings').click();
  await page.evaluate(original=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main;c.setZoom(original.zoom).centerOn(original.x,original.y);c.preRender();s.worldCamera.following=original.following;s.refreshVisibility();},original);
  console.log('PASS real hidden map clicks and tower preview/confirmation expose one generic message, no tooltip or live path-wear data, and create no hidden blueprint');
}
