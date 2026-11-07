import assert from 'node:assert/strict';

// #100 in its own page: a new game has a river (shallow and deep water, blocked for walking), beaches, a desert and
// bushes; the ground tiles and bush sprites are loaded and drawn: blue water and sand-coloured desert in the ground
// layer, bush sprites on screen near a cluster. SMOKE_SHOTS=<dir> saves a shore and a bush screenshot.
export async function worldSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.terrain&&window.__game.registry.get('application').scene.minimap);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const world=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,counts=[0,0,0,0,0];s.groundGrid.flat().forEach(c=>counts[c]++);
      let shore=null;for(let y=1;y<99&&!shore;y++)for(let x=1;x<99&&!shore;x++)if(s.groundGrid[y][x]===4&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>s.groundGrid[y+dy][x+dx]===3))shore={x,y};
      const bushes=[...s.bushes.keys()].map(k=>k.split(',').map(Number));
      return {counts,shore,bushes:bushes.length,firstBush:bushes[0],waterCell:shore?s.map[shore.y][shore.x]:null,loaded:s.terrain.groundKinds.slice(1).map(k=>k.length)};
    });
    assert.ok(world.counts[3]>50&&world.counts[4]>50,`river and lake water (${world.counts})`);
    assert.ok(world.counts[1]>50&&world.counts[2]>150,`beaches and a desert (${world.counts})`);
    assert.ok(world.bushes>100,'bushes');assert.equal(world.waterCell,2,'water blocks walking');
    assert.deepEqual(world.loaded,[4,4,4,4],'four tiles for each ground type');
    // Look at the shore with Fog of War off: the deep-water tile is painted blue in the ground layer.
    const colour=await page.evaluate(async tile=>{
      const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility?.();if(s.worldCamera)s.worldCamera.following=false;
      const p={x:(100*64/2)+(tile.x-tile.y)*32,y:128+(tile.x+tile.y+1)*16};s.cameras.main.centerOn(p.x,p.y);
      await new Promise(r=>setTimeout(r,600));
      const chunk=s.terrain.chunkTexture(Math.floor(tile.x/10),Math.floor(tile.y/10)),canvas=s.textures.get(chunk.key).getSourceImage();
      const [r,g,b]=canvas.getContext('2d').getImageData(Math.round(p.x-chunk.x),Math.round(p.y-chunk.y),1,1).data;return {r,g,b};
    },world.shore);
    assert.ok(colour.b>colour.r+25,`deep water is blue (${JSON.stringify(colour)})`);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/world-shore.png`});
    const shown=await page.evaluate(async tile=>{
      const s=window.__game.registry.get('application').scene,p={x:(100*64/2)+(tile[0]-tile[1])*32,y:128+(tile[0]+tile[1]+1)*16};s.cameras.main.centerOn(p.x,p.y);
      await new Promise(r=>setTimeout(r,600));return [...s.terrain.bushSprites.values()].filter(v=>v.visible).length;
    },world.firstBush);
    assert.ok(shown>0,'bush sprites are drawn near a bush');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/world-bushes.png`});
    console.log(`PASS #100 world: river, lake, beaches, desert and ${world.bushes} bushes; water blocks walking, ground tiles loaded, water drawn blue, bush sprites shown`);
  }finally{await page.close();}
}
