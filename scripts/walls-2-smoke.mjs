import assert from 'node:assert/strict';

// m-staveni-zdi-studna (59) in a real page: the Stone Wall tool stays selected for a second dragged line and Esc ends it;
// the Gate tool shows "R – rotate", R turns a lone Gate, a Gate clicked onto a planned wall replaces that segment and
// follows the wall (R does not turn it there); a Tower clicked over a finished wall replaces two segments with a refund;
// a right click ends the tool and the game still saves.
export async function walls2Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const f=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,c=s.character.tile;s.employment?.setEnabled?.(false);s.fog?.setEnabled?.(false);
      for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);for(const a of s.animalSystem.animals.values()){a.path=[];a.wanderWait=1e8;}
      const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),free=t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.bushes?.has(`${t.x},${t.y}`)&&!s.isFordTile?.(t);
      // A free 7×12 block: lines at rows 1, 4 and 8, a lone Gate site at row 11.
      let origin=null;for(let r=4;r<30&&!origin;r++)for(let dy=-r;dy<=r&&!origin;dy++)for(let dx=-r;dx<=r&&!origin;dx++){let ok=true;for(let y=0;y<12&&ok;y++)for(let x=0;x<7&&ok;x++)ok=free({x:c.x+dx+x,y:c.y+dy+y});if(ok)origin={x:c.x+dx,y:c.y+dy};}
      if(!origin)throw Error('No open block for the walls-2 smoke');
      const line=y=>Array.from({length:5},(_,i)=>({x:origin.x+1+i,y:origin.y+y}));
      const a=line(1),b=line(4),finished=line(8),lone={x:origin.x+3,y:origin.y+11};
      for(const t of finished){const d=s.objectRegistry.require('wall'),w={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'wall',definition:d,x:t.x,y:t.y,tiles:[t]};s.buildings.push(w);s.map[t.y][t.x]=1;s.towerViews.set(w.id,s.createBuildingView(d,w));}
      s.refreshWallConnections();s.events.emit('buildings:changed');s.inventory.add('stone',80);s.updateInventory();
      s.worldCamera.following=false;s.cameras.main.setZoom(1);const m={x:origin.x+3,y:origin.y+6};s.cameras.main.centerOn(s.map.length*32+(m.x-m.y)*32,128+(m.x+m.y+1)*16);
      return {a,b,finished,lone};
    });
    const point=async tile=>{const canvas=await page.locator('canvas:not(.minimap-canvas):not(.world-preview):not(.we-map):not(.we-iso)').boundingBox(),p=await page.evaluate(tile=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main;return {x:((s.map.length*32+(tile.x-tile.y)*32-c.scrollX-c.width/2)*c.zoom+c.width/2)/c.width,y:((128+(tile.x+tile.y+1)*16-c.scrollY-c.height/2)*c.zoom+c.height/2)/c.height};},tile);return {x:canvas.x+p.x*canvas.width,y:canvas.y+p.y*canvas.height};};
    const state=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {mode:s.buildMode,type:s.selectedBuilding?.id??null,status:document.querySelector('#status')?.textContent??'',axis:s.gateAxis??'y',flip:s.preview?.back?.sprite?.flipX??null};});
    const walls=rows=>page.evaluate(rows=>{const s=window.__game.registry.get('application').scene;return rows.map(row=>row.map(t=>s.buildings.find(b=>b.x===t.x&&b.y===t.y)?.type??null));},rows);
    const drag=async(from,to)=>{const a=await point(from),b=await point(to);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:6});await page.mouse.up();await page.waitForTimeout(80);};
    const click=async tile=>{const p=await point(tile);await page.mouse.move(p.x,p.y,{steps:3});await page.waitForTimeout(40);await page.mouse.down();await page.mouse.up();await page.waitForTimeout(80);};
    const select=async type=>{await page.locator('#buildings-tab').click();await page.locator('[data-building-category="all"]').click();await page.locator(`#${type}-choice`).click();};
    await page.waitForTimeout(150);
    // Repeat placement: two dragged lines with one tool; Esc ends it.
    await select('wall');await drag(f.a[0],f.a.at(-1));assert.deepEqual(await state().then(s=>[s.mode,s.type]),[true,'wall'],'the wall tool stays after a line');
    await drag(f.b[0],f.b.at(-1));assert.deepEqual(await state().then(s=>[s.mode,s.type]),[true,'wall']);
    assert.deepEqual(await walls([f.a,f.b]),[Array(5).fill('wall'),Array(5).fill('wall')],'both lines are planned');
    await page.keyboard.press('Escape');assert.equal((await state()).mode,false);assert.equal(await page.locator('#pause-menu').isVisible(),false);
    // Gate: hint, R on open ground, then onto the planned wall (it follows the wall; R only reports that).
    await select('wall_gate');const lonePoint=await point(f.lone);await page.mouse.move(lonePoint.x,lonePoint.y,{steps:3});await page.waitForTimeout(80);
    const before=await state();assert.match(before.status,/R – rotate|R – otočit/);
    await page.keyboard.press('r');await page.waitForTimeout(60);const turned=await state();assert.notEqual(turned.axis,before.axis,'R turns a lone Gate');assert.notEqual(turned.flip,before.flip,'the preview turns');
    await click(f.lone);const loneGate=await page.evaluate(t=>{const s=window.__game.registry.get('application').scene;return s.buildings.find(b=>b.type==='wall_gate'&&b.x===t.x&&b.y===t.y)?.gateAxis;},f.lone);assert.equal(loneGate,turned.axis,'the placed Gate keeps the chosen axis');
    assert.deepEqual(await state().then(s=>[s.mode,s.type]),[true,'wall_gate'],'the Gate tool stays');
    const mid=f.a[2],midPoint=await point(mid);await page.mouse.move(midPoint.x,midPoint.y,{steps:3});await page.waitForTimeout(80);
    const axis=(await state()).axis;await page.keyboard.press('r');await page.waitForTimeout(60);const locked=await state();assert.equal(locked.axis,axis,'R does not turn a Gate on a wall run');assert.match(locked.status,/follows the wall|řídí směrem hradby/);
    await click(mid);
    const onWall=await page.evaluate(t=>{const s=window.__game.registry.get('application').scene,here=s.buildings.filter(b=>b.x===t.x&&b.y===t.y);return {types:here.map(b=>b.type),axis:here[0]?.gateAxis,flip:s.towerViews.get(here[0]?.id)?.back?.sprite?.flipX??s.towerViews.get(here[0]?.id)?.view?.back?.sprite?.flipX};},mid);
    assert.deepEqual(onWall.types,['wall_gate'],'the planned segment was replaced');assert.equal(onWall.axis,'x','an east–west wall turns the Gate');
    // Tower over two finished segments: replaced, half their stone (1) left beside it.
    const drops=()=>page.evaluate(()=>[...window.__game.registry.get('application').scene.dropSystem.drops.values()].filter(d=>d.resource==='stone').reduce((n,d)=>n+d.amount,0));
    const dropped=await drops();await select('tower');assert.equal((await state()).type,'tower');await click({x:f.finished[1].x,y:f.finished[1].y-1});
    const tower=await page.evaluate(row=>{const s=window.__game.registry.get('application').scene;return row.map(t=>s.buildings.find(b=>b.tiles.some(p=>p.x===t.x&&p.y===t.y))?.type??null);},f.finished);
    assert.deepEqual(tower,['wall','tower','tower','wall','wall'],'two finished segments replaced by the Tower');assert.equal(await drops(),dropped+1,'demolition refund for two 1-stone segments');
    assert.equal((await state()).type,'tower','the Tower tool stays');
    const c=await point(f.lone);await page.mouse.click(c.x,c.y,{button:'right'});assert.equal((await state()).mode,false,'right click ends the tool');
    const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot().buildings.filter(b=>b.type==='wall_gate').map(b=>b.gateAxis));assert.equal(saved.length,2);assert.ok(saved.every(a=>a==='x'||a==='y'));
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/walls-2.png`});
    assert.deepEqual(errors,[]);
    console.log('PASS Walls 2: the wall tool stays for a second line (Esc ends it), R turns a lone Gate (hint shown), a Gate on a planned wall replaces it and follows the wall, a Tower over a finished wall replaces two segments with a refund, right click ends the tool, the game saves');
  }finally{await page.close();}
}
