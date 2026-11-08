import assert from 'node:assert/strict';

// m-oznacovani-tezby (51, 56) in a real page: the marking tool marks a tree with a real mouse click (strong diamond only
// while marking); a wall line dragged over a tree and a rock marks both for the plan, the site waits until they are gone,
// the marks are saved, and cancelling the plan removes only its marks.
export async function markingSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const f=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,nr=s.naturalResources,c=s.character.tile;s.employment?.setEnabled?.(false);s.fog?.setEnabled?.(false);
      for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);for(const a of s.animalSystem.animals.values()){a.path=[];a.wanderWait=1e8;}
      const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),free=t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.bushes?.has(`${t.x},${t.y}`)&&![...s.dropSystem.drops.values()].some(d=>d.tile.x===t.x&&d.tile.y===t.y)&&!s.isFordTile?.(t);
      let row=null;for(let r=6;r<16&&!row;r++)for(let dy=-r;dy<=r&&!row;dy++)for(let dx=-r;dx<=r&&!row;dx++){const tiles=Array.from({length:4},(_,i)=>({x:c.x+dx+i,y:c.y+dy}));if(tiles.every(t=>free(t)&&free({x:t.x,y:t.y-1})&&free({x:t.x,y:t.y+1})&&free({x:t.x,y:t.y-3})))row=tiles;}
      if(!row)throw Error('No open row for the marking smoke');
      const tree=tile=>{const state={id:`tree-${nr.nextId++}`,kind:'tree',stage:3,growthDays:0,ageDays:12,cycle:0,workDone:0,growthCheckpoint:nr.growthClock,ageCheckpoint:nr.ageClock};s.addResource(s.objectRegistry.require('oak_tree'),tile,state);return state.id;};
      const lone={x:row[0].x,y:row[0].y-3},loneId=tree(lone),wallTree=tree(row[1]),rock=row[2];s.terrainGrid[rock.y][rock.x]=1;s.map[rock.y][rock.x]=1;s.naturalResources.mining.restoreTiles([rock]);s.terrain?.invalidateArea?.([rock]);
      s.worldCamera.following=false;s.cameras.main.setZoom(1.25).centerOn(s.map.length*32+(row[1].x-row[1].y)*32,128+(row[1].x+row[1].y+1)*16);return {row,lone,loneId,wallTree,rock};
    });
    const point=async tile=>{const canvas=await page.locator('canvas:not(.minimap-canvas):not(.world-preview):not(.we-map):not(.we-iso)').boundingBox(),p=await page.evaluate(tile=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main;return {x:((s.map.length*32+(tile.x-tile.y)*32-c.scrollX-c.width/2)*c.zoom+c.width/2)/c.width,y:((128+(tile.x+tile.y+1)*16-c.scrollY-c.height/2)*c.zoom+c.height/2)/c.height};},tile);return {x:canvas.x+p.x*canvas.width,y:canvas.y+p.y*canvas.height};};
    await page.waitForTimeout(150);
    // Marking mode: a real click on the tree marks it; Esc ends the mode and the mark stays (drawn faint).
    await page.click('#mark-rocks');await page.waitForTimeout(100);const p=await point(f.lone);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.up();
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.naturalResources.miningWork.rocks.trees.has(id),f.loneId),true,'the clicked tree is marked');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#cancel-rock-marking').isVisible(),false);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.rockMiningTool.enabled),false);
    // A wall line dragged over the tree and the rock.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.startBuilding(s.objectRegistry.require('wall'));});
    const a=await point(f.row[0]),b=await point(f.row.at(-1));await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:6});await page.mouse.up();await page.waitForTimeout(100);
    const plan=await page.evaluate(f=>{const app=window.__game.registry.get('application'),s=app.scene,rocks=s.naturalResources.miningWork.rocks,site=t=>s.buildings.find(b=>b.type==='wall'&&b.x===t.x&&b.y===t.y);
      const onTree=site(f.row[1]),onRock=site(f.row[2]),save=app.snapshot();
      return {count:f.row.filter(site).length,treePlan:rocks.trees.get(f.wallTree)?.planId,treeSite:onTree?.id,rockPlan:rocks.records.get(`${f.rock.x},${f.rock.y}`)?.planId,rockSite:onRock?.id,blocked:[onTree,onRock].map(b=>s.constructionSystem.obstructed(b)),open:s.constructionSystem.obstructed(site(f.row[0])),saved:save.naturalResources.rockMining.marks};},f);
    assert.equal(plan.count,4,'four wall blueprints');assert.equal(plan.treePlan,plan.treeSite,'the plan marked its tree');assert.equal(plan.rockPlan,plan.rockSite,'the plan marked its rock');
    assert.deepEqual(plan.blocked,[true,true]);assert.equal(plan.open,false);assert.ok(plan.saved.trees.some(t=>t.id===f.loneId&&t.planId===undefined)&&plan.saved.trees.some(t=>t.id===f.wallTree&&t.planId===plan.treeSite),'marks are saved');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marking.png`});
    const after=await page.evaluate(f=>{const s=window.__game.registry.get('application').scene,rocks=s.naturalResources.miningWork.rocks;for(const b of s.buildings.filter(b=>b.type==='wall'&&f.row.some(t=>t.x===b.x&&t.y===b.y))){s.constructionSystem.cancel(b);s.towerViews.get(b.id)?.destroy();s.towerViews.delete(b.id);}
      return {lone:rocks.trees.has(f.loneId),tree:rocks.trees.has(f.wallTree),rock:rocks.records.get(`${f.rock.x},${f.rock.y}`).marked};},f);
    assert.deepEqual(after,{lone:true,tree:false,rock:false},'cancelling the plan removes only its marks');
    assert.deepEqual(errors,[]);
    console.log('PASS Marking: a real click marks a tree, Esc keeps the faint mark, a dragged wall line over a tree and a rock marks both for its plan and waits, marks are saved, cancelling removes only the plan marks');
  }finally{await page.close();}
}
