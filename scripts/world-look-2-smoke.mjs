import assert from 'node:assert/strict';

// m-svet-vzhled-2 (owner requests 30, 47, 35) in a real page with Fog of War on: fish shadows swim in visible water
// with fish and never under the fog (an overfished river goes almost empty); the fog edge is a gradient (the mask has
// partly transparent pixels at the border, none deep inside sight); the Marketplace sprite is drawn at Studio scale
// with its bottom on the front corner of its 3×3 footprint. WORLD_LOOK_SHOTS=<dir> saves fog edge, water, marketplace.
export async function worldLook2Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));const shots=process.env.WORLD_LOOK_SHOTS;
  const scene=fn=>page.evaluate(fn);
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW4-155515555555-1');
    if(!await page.locator('#setup-fog').isVisible())await page.locator('.setup-advanced summary').click();await page.locator('#setup-fog').check();
    await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.fishShadows);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    // Daylight for the checks and pictures; the King stays home.
    await scene(()=>{const s=window.__game.registry.get('application').scene;s.dayNight.ambientAlpha=()=>0;s.worldCamera.following=false;});

    // 30: the fog edge around the King's sight.
    const edge=await scene(()=>{const s=window.__game.registry.get('application').scene,c=s.character.tile,r=s.fog.radius,cam=s.cameras.main,g=(x,y)=>({x:3200+(x-y)*32,y:128+(x+y)*16});
      const p=g(c.x+.5+r*.6,c.y+.5);cam.setZoom(1.4).centerOn(p.x,p.y);cam.preRender();s.refreshVisibility();return {c,r};});
    await page.waitForFunction(()=>{const e=window.__game.registry.get('application').scene.fogEdge;return e.container.visible&&e.stats.builds>0;});await page.waitForTimeout(300);
    const fog=await scene(()=>{const s=window.__game.registry.get('application').scene,e=s.fogEdge,c=s.character.tile,g=(x,y)=>({x:3200+(x-y)*32,y:128+(x+y)*16});
      // Walk outward from the King along +x to the last tile in sight and sample the mask there and at the centre.
      let x=c.x;while(s.fog.isInSightTile({x:x+1,y:c.y}))x++;const centre=g(c.x+.5,c.y+.5),border=g(x+.75,c.y+.5),inner=g(x-.3,c.y+.5);
      const data=e.pixels.data,W=e.canvas.width,crop={width:e.info.W,height:e.info.H};let partial=0,opaque=0;
      for(let y=0;y<crop.height;y++)for(let i=0;i<crop.width;i++){const a=data[(y*W+i)*4+3];if(a>0&&a<255)partial++;else if(a===255)opaque++;}
      return {centre:e.alphaAt(centre.x,centre.y),border:e.alphaAt(border.x,border.y),inner:e.alphaAt(inner.x,inner.y),partial,opaque,depth:e.container.depth,stats:{...e.stats}};});
    assert.equal(fog.centre,0,'deep inside sight the ground is untouched');
    assert.ok(fog.border>100&&fog.border<=255,`a dark but not opaque gradient at the border (${fog.border})`);assert.ok(fog.inner<fog.border,'lighter a tile further in');
    assert.ok(fog.partial>200,`partly transparent pixels along the edge (${fog.partial})`);assert.ok(fog.depth<0,'under every object (ground layer)');
    if(shots)await page.screenshot({path:`${shots}/world-look-2-fog-edge.png`});

    // 47: water with fish, revealed by a test sight source; then hidden again.
    const water=await scene(()=>{const s=window.__game.registry.get('application').scene,gr=s.groundGrid,c=s.character.tile;let best=null;
      for(let y=0;y<gr.length;y++)for(let x=0;x<gr[y].length;x++)if(gr[y][x]===4&&s.fishing.state(s.fishing.bodyAt(x,y))==='plentiful'){const d=Math.hypot(x-c.x,y-c.y);if(!best||d<best.d)best={x,y,d};}
      window.__worldLookSight=s.fog.registerSource('world-look-2',()=>({center:{x:best.x+.5,y:best.y+.5},radius:7}));
      const cam=s.cameras.main;cam.setZoom(1.4).centerOn(3200+(best.x-best.y)*32,128+(best.x+best.y+1)*16);cam.preRender();s.refreshVisibility();return {...best,body:s.fishing.bodyAt(best.x,best.y)};});
    assert.ok(water,'deep water with plentiful fish near the start');
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.fishShadows.tiles().some(t=>t.visible),null,{timeout:5000});await page.waitForTimeout(600);
    const fish=await scene(()=>{const s=window.__game.registry.get('application').scene,f=s.fishShadows,tiles=f.tiles();
      return {count:tiles.length,visible:tiles.filter(t=>t.visible).length,inSight:tiles.filter(t=>t.visible).every(t=>s.fog.isInSightTile(t)),onWater:tiles.every(t=>[3,4].includes(s.groundGrid[t.y][t.x])),
        depth:[...f.fish.values()][0]?.image.depth,alpha:Math.max(...[...f.fish.values()].map(v=>v.image.alpha))};});
    assert.ok(fish.visible>=2,`fish shadows in visible water (${fish.visible})`);assert.ok(fish.count<=32,'capped on screen');
    assert.ok(fish.inSight&&fish.onWater,'only on water tiles in sight');assert.ok(fish.alpha<.5,'subtle');assert.ok(fish.depth<0,'on the water, under objects');
    // A ripple appears now and then (the fixture brings the next one forward).
    await scene(()=>{const f=window.__game.registry.get('application').scene.fishShadows;for(const v of f.fish.values())v.ripple=f.time;});
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.fishShadows.ripples.length>0,null,{timeout:3000});
    if(shots)await page.screenshot({path:`${shots}/world-look-2-water-fish.png`});
    // Overfished: the same water goes almost empty (every body, so no neighbouring pond keeps its fish).
    const overfished=await scene(b=>{const s=window.__game.registry.get('application').scene;window.__worldLookStocks=new Map(s.fishing.stocks);for(const body of s.fishing.bodies)s.fishing.stocks.set(body.id,body.capacity*.05);s.fishShadows.next=0;return s.fishing.state(b);},water.body);
    assert.equal(overfished,'overfished');await page.waitForTimeout(500);
    const few=await scene(()=>window.__game.registry.get('application').scene.fishShadows.tiles().filter(t=>t.visible).length);
    assert.ok(few<fish.visible&&few<=1,`overfished water: almost no fish (${few} of ${fish.visible})`);
    await scene(b=>{const s=window.__game.registry.get('application').scene;s.fishing.stocks=window.__worldLookStocks;s.fishShadows.next=0;},water.body);await page.waitForTimeout(500);
    // Out of sight: the water stays remembered, the fish disappear at once.
    await scene(()=>{window.__worldLookSight();window.__game.registry.get('application').scene.refreshVisibility();});await page.waitForTimeout(100);
    const hidden=await scene(()=>{const s=window.__game.registry.get('application').scene;return {shown:s.fishShadows.tiles().filter(t=>t.visible).length,underFog:[...s.fishShadows.fish.values()].filter(f=>f.image.visible&&!s.fog.isInSightTile(f.tile)).length};});
    assert.deepEqual(hidden,{shown:0,underFog:0},'no fish under the fog');

    // 35: the Marketplace stands on its 3×3 footprint (Studio scale, bottom at the front corner).
    const market=await scene(()=>{const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('marketplace'),c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let anchor,tiles;
      for(let y=c.y+4;y<c.y+24&&!anchor;y++)for(let x=c.x-14;x<c.x+14&&!anchor;x++){const t=[];for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++)t.push({x:x+dx,y:y+dy});if(t.every(q=>s.map[q.y]?.[q.x]===0&&!occupied.has(`${q.x},${q.y}`)&&!s.resourceOccupancy.has(`${q.x},${q.y}`))){anchor={x,y};tiles=t;}}
      s.fog.setEnabled(false);const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'marketplace',definition:d,...anchor,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');
      const front={x:3200+(b.x+3-b.y-3)*32,y:128+(b.x+b.y+6)*16},v=s.towerViews.get(b.id),sprite=v.back.sprite,box=sprite.getBounds();
      const cam=s.cameras.main;cam.setZoom(1.5).centerOn(front.x,front.y-60);cam.preRender();s.refreshVisibility();
      return {front,position:{x:v.back.container.x,y:v.back.container.y},scale:[sprite.scaleX,sprite.scaleY],size:[sprite.displayWidth,sprite.displayHeight],origin:[sprite.originX,sprite.originY],bottom:box.bottom,left:box.left,right:box.right};});
    assert.deepEqual(market.position,market.front,'placed at the footprint front corner');assert.deepEqual(market.scale,[1,1],'Studio scale, not stretched');assert.deepEqual(market.size,[195,116]);
    assert.ok(Math.abs(market.bottom-market.front.y)<=3,`sprite bottom on the front corner (${market.bottom} vs ${market.front.y})`);
    assert.ok(Math.abs((market.right-market.left)-192)<=4,'as wide as the 3×3 diamond');
    if(shots){await page.waitForTimeout(500);await page.screenshot({path:`${shots}/world-look-2-marketplace.png`});}
    assert.deepEqual(errors,[]);
    console.log(`PASS world-look-2: fog edge gradient (${fog.partial} partial mask pixels, border α ${fog.border}, build ${fog.stats.lastMs.toFixed(2)} ms), ${fish.visible} fish shadows in sight on plentiful water → ${few} when overfished → 0 under fog, ripples; Marketplace ${market.size.join('×')} at scale 1 on its footprint`);
  }finally{await page.close();}
}
