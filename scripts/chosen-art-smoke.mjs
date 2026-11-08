import assert from 'node:assert/strict';

// Studio art chosen on 7 Nov in a real page: House v3, Builder's Workshop v4, Farmhouse v2 (3×3), Bakery v3 (3×2), Iron
// Mine adit v2, Barracks hall, Marketplace square and Wheelwright yard v2 draw their approved sprites; the caravan uses
// the approved wagon. One screenshot of all of them (SMOKE_SHOTS).
export async function chosenArtSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW3-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.towerViews);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const placed=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene;s.fog?.setEnabled?.(false);const types=['house','builder_workshop','farmhouse','bakery','iron_mine','barracks','marketplace','wheelwright_workshop'];
      const free=(x,y,w,h)=>{for(let dy=-1;dy<=h;dy++)for(let dx=-1;dx<=w;dx++){const tx=x+dx,ty=y+dy;if(s.map[ty]?.[tx]!==0||s.resourceOccupancy.has(`${tx},${ty}`)||s.buildings.some(b=>b.tiles.some(t=>t.x===tx&&t.y===ty))||s.reservedTiles().some(t=>t.x===tx&&t.y===ty))return false;}return true;};
      const out=[];const c=s.character.tile;
      for(const type of types){const d=s.objectRegistry.require(type);let spot=null;for(let r=3;r<30&&!spot;r++)for(let y=c.y-r;y<=c.y+r&&!spot;y++)for(let x=c.x-r;x<=c.x+r&&!spot;x++)if(free(x,y,d.width,d.height))spot={x,y};
        const tiles=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:spot.x+dx,y:spot.y+dy});
        const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x:spot.x,y:spot.y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));
        out.push({type,w:d.width,h:d.height,sprite:d.sprite,mode:d.renderMode,x:spot.x,y:spot.y});}
      s.events.emit('buildings:changed');return out;});
    assert.deepEqual(placed.map(p=>[p.type,p.w,p.h]),[['house',2,2],['builder_workshop',3,3],['farmhouse',3,3],['bakery',3,2],['iron_mine',3,3],['barracks',3,3],['marketplace',3,3],['wheelwright_workshop',3,3]]);
    assert.ok(placed.every(p=>p.mode==='sprite'&&/\.v\d\.png$/.test(p.sprite)),'every one uses its approved sprite');
    await page.waitForFunction(types=>{const s=window.__game.registry.get('application').scene;return types.every(t=>s.textures.exists(s.assets.key(t)));},placed.map(p=>p.type),{timeout:20000});
    if(process.env.SMOKE_SHOTS){await page.evaluate(p=>{const s=window.__game.registry.get('application').scene,xs=p.map(b=>b.x),ys=p.map(b=>b.y),cx=(Math.min(...xs)+Math.max(...xs))/2+1,cy=(Math.min(...ys)+Math.max(...ys))/2+1;if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(.8);s.cameras.main.centerOn(s.map.length*32+(cx-cy)*32,128+(cx+cy)*16);},placed);
      await page.waitForTimeout(800);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/chosen-art.png`});}
    console.log(`PASS Chosen Studio art: ${placed.map(p=>`${p.type} ${p.w}×${p.h}`).join(', ')} draw their approved sprites`);
  }finally{await page.close();}
}
