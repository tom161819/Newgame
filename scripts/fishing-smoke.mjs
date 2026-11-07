import assert from 'node:assert/strict';

// Fishing R1 in its own page: a Fisherman's Hut on the shore nearest the Castle (placement rule checked: next to water),
// one Fisher assigned through the real workplace system; he fishes from the shore and the catch reaches storage.
export async function fishingSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.fishing&&window.__game.registry.get('application').scene.minimap);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const setup=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('fisherman_hut'),c=s.character.tile;let best=null;
      for(let y=1;y<97;y++)for(let x=1;x<97;x++){
        const tiles=[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>({x:x+dx,y:y+dy}));if(!tiles.every(t=>s.map[t.y][t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.buildings.some(b=>b.tiles.some(p=>p.x===t.x&&p.y===t.y))))continue;
        const ring=[...[-1,2].flatMap(dy=>[0,1].map(dx=>({x:x+dx,y:y+dy}))),...[-1,2].flatMap(dx=>[0,1].map(dy=>({x:x+dx,y:y+dy})))];
        if(!ring.some(t=>s.map[t.y]?.[t.x]===2)||!ring.some(t=>s.map[t.y]?.[t.x]===0))continue;
        const dist=Math.hypot(x-c.x,y-c.y);if(!best||dist<best.dist)best={x,y,dist};
      }
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'fisherman_hut',definition:d,x:best.x,y:best.y,tiles:[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>({x:best.x+dx,y:best.y+dy}))};
      s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');
      // The starter stockpile is full on a new game: a finished Granary (required for the hut anyway) takes the fish.
      const g=s.objectRegistry.require('granary');let spot=null;
      for(let r=4;r<20&&!spot;r++)for(let y=c.y-r;y<=c.y+r&&!spot;y++)for(let x=c.x-r;x<=c.x+r&&!spot;x++){const tiles=[];for(let dy=0;dy<g.height;dy++)for(let dx=0;dx<g.width;dx++)tiles.push({x:x+dx,y:y+dy});if(tiles.every(t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.reservedTiles().some(p=>p.x===t.x&&p.y===t.y)))spot={x,y,tiles};}
      const granary={id:b.id+1,type:'granary',definition:g,x:spot.x,y:spot.y,tiles:spot.tiles};s.buildings.push(granary);for(const t of spot.tiles)s.map[t.y][t.x]=1;s.towerViews.set(granary.id,s.createBuildingView(g,granary));s.foodStorage.register(granary);s.events.emit('buildings:changed');
      const w=[...s.workerSystem.workers.values()].find(w=>w.isAlive);s.employment?.setEnabled?.(false);s.workplaceSystem.assign(b,w);
      s.foodSystem.eat=()=>true;return {id:b.id,worker:w.id,shoreCount:s.fishing.spots(b).length};
    });
    assert.ok(setup.shoreCount>0,'the hut has shore spots');
    await page.waitForFunction(w=>{const t=window.__game.registry.get('application').scene.workerSystem.workers.get(w);return t.workTask?.kind==='fish'&&t.workState==='Working';},setup.worker,{timeout:120000});
    // Skip the real fishing time (a day for a basket): the bite count is advanced, the catch then runs through the game.
    if(process.env.SMOKE_SHOTS){await page.evaluate(w=>{const s=window.__game.registry.get('application').scene,p=s.workerSystem.workers.get(w).position;if(s.worldCamera)s.worldCamera.following=false;s.fog?.setEnabled?.(false);s.cameras.main.centerOn(3200+(p.x-p.y)*32,128+(p.x+p.y)*16);},setup.worker);await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/fishing.png`});}
    await page.evaluate(w=>{window.__game.registry.get('application').scene.workerSystem.workers.get(w).workTask.fraction=5;},setup.worker);
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.inventory.count('fish')>0,null,{timeout:240000});
    const summary=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return s.fishing.summary(s.buildings.find(b=>b.id===id));},setup.id);
    assert.match(summary,/Fish: (Plentiful|Thinning)/);
    console.log(`PASS Fishing R1: hut on the shore (${setup.shoreCount} shore spots), a Fisher walks to the water, fishes and delivers ${await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('fish'))} fish to a Granary; panel line "${summary}"`);
  }finally{await page.close();}
}
