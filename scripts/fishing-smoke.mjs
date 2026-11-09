import assert from 'node:assert/strict';

// Fishing in its own page: since 0.32.0 a Fisherman's Hut may stand anywhere – here about 15–25 tiles' walk from the
// water, the spot nearest the Castle; one Fisher assigned through the real workplace system walks to the nearest shore,
// fishes there and the catch reaches storage. The panel says how far the water is.
export async function fishingSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.fishing&&window.__game.registry.get('application').scene.minimap);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    const setup=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('fisherman_hut'),c=s.character.tile;let best=null;
      // Walking distance of every tile to the nearest shore tile (one search from all shore tiles).
      const rows=s.map.length,cols=s.map[0].length,dist=new Int32Array(rows*cols).fill(-1),queue=[];
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(s.map[y][x]===0&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>s.map[y+dy]?.[x+dx]===2)){dist[y*cols+x]=0;queue.push(x,y);}
      for(let i=0;i<queue.length;i+=2){const x=queue[i],y=queue[i+1];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows||dist[ny*cols+nx]>=0||s.map[ny][nx]!==0)continue;dist[ny*cols+nx]=dist[y*cols+x]+1;queue.push(nx,ny);}}
      for(let y=1;y<97;y++)for(let x=1;x<97;x++){
        const tiles=[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>({x:x+dx,y:y+dy}));if(!tiles.every(t=>s.map[t.y][t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.buildings.some(b=>b.tiles.some(p=>p.x===t.x&&p.y===t.y))))continue;
        const away=Math.min(...tiles.map(t=>dist[t.y*cols+t.x]).filter(v=>v>=0));if(!(away>=15&&away<=25))continue;
        const d2=Math.hypot(x-c.x,y-c.y);if(!best||d2<best.dist)best={x,y,dist:d2};
      }
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'fisherman_hut',definition:d,x:best.x,y:best.y,tiles:[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>({x:best.x+dx,y:best.y+dy}))};
      s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');
      // The starter stockpile is full on a new game: a finished Granary (required for the hut anyway) takes the fish.
      const g=s.objectRegistry.require('granary');let spot=null;
      for(let r=4;r<20&&!spot;r++)for(let y=c.y-r;y<=c.y+r&&!spot;y++)for(let x=c.x-r;x<=c.x+r&&!spot;x++){const tiles=[];for(let dy=0;dy<g.height;dy++)for(let dx=0;dx<g.width;dx++)tiles.push({x:x+dx,y:y+dy});if(tiles.every(t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.reservedTiles().some(p=>p.x===t.x&&p.y===t.y)))spot={x,y,tiles};}
      const granary={id:b.id+1,type:'granary',definition:g,x:spot.x,y:spot.y,tiles:spot.tiles};s.buildings.push(granary);for(const t of spot.tiles)s.map[t.y][t.x]=1;s.towerViews.set(granary.id,s.createBuildingView(g,granary));s.foodStorage.register(granary);s.events.emit('buildings:changed');
      const w=[...s.workerSystem.workers.values()].find(w=>w.isAlive);s.employment?.setEnabled?.(false);s.workplaceSystem.assign(b,w);
      s.foodSystem.eat=()=>true;return {id:b.id,worker:w.id,shoreCount:s.fishing.spots(b).length,distance:s.fishing.distance(b)};
    });
    assert.ok(setup.shoreCount>0,'the hut has shore spots');assert.ok(setup.distance>=15,`the water is far (${setup.distance} tiles)`);
    // The Fisher walks with the approved Fisher look (walk sheet), not the old drawn figure.
    await page.waitForFunction(w=>{const v=window.__game.registry.get('application').scene.workerSystem.workers.get(w).view;return v.look?.startsWith('fisher-')&&v.art?.visible&&v.art.texture.key===`villager-walk:${v.look}`;},setup.worker,{timeout:60000});
    await page.waitForFunction(w=>{const t=window.__game.registry.get('application').scene.workerSystem.workers.get(w);return t.workTask?.kind==='fish'&&t.workState==='Working';},setup.worker,{timeout:120000});
    // Skip the real fishing time (a day for a basket): the bite count is advanced, the catch then runs through the game.
    if(process.env.SMOKE_SHOTS){await page.evaluate(w=>{const s=window.__game.registry.get('application').scene,p=s.workerSystem.workers.get(w).position;if(s.worldCamera)s.worldCamera.following=false;s.fog?.setEnabled?.(false);s.cameras.main.centerOn(3200+(p.x-p.y)*32,128+(p.x+p.y)*16);},setup.worker);await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/fishing.png`});}
    await page.evaluate(w=>{window.__game.registry.get('application').scene.workerSystem.workers.get(w).workTask.fraction=5;},setup.worker);
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.inventory.count('fish')>0,null,{timeout:240000});
    const summary=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return s.fishing.summary(s.buildings.find(b=>b.id===id));},setup.id);
    assert.match(summary,/Water: \d+ tiles away · Fish: (Plentiful|Thinning)/);
    console.log(`PASS Fishing: hut ${setup.distance} tiles' walk from the water (${setup.shoreCount} reachable shore spots), a Fisher walks to the water, fishes and delivers ${await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('fish'))} fish to a Granary; panel line "${summary}"`);
  }finally{await page.close();}
}
