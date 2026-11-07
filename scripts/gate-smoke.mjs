import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// #97 in its own page: a Gate can be placed from the Defense menu; in a finished wall line the King climbs at the Gate
// (not at the clicked segment), walks along the top to the clicked segment and comes down again only at the Gate.
export async function gateSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    // A fixed world (World v2): the wall fixture needs open, reachable ground south of the start.
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const {id}=await placeBlueprint(page,'wall_gate');
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id).type,id),'wall_gate');
    const line=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let row=null;
      for(let dy=3;dy<14&&!row;dy++){const y=c.y+dy;for(let x0=c.x-8;x0<c.x+2&&!row;x0++){const tiles=Array.from({length:6},(_,i)=>({x:x0+i,y}));if(tiles.every(t=>s.map[t.y]?.[t.x]===0&&s.map[t.y-1]?.[t.x]===0&&s.map[t.y+1]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`)))row=tiles;}}
      const ids=[];row.forEach((t,i)=>{const type=i===0?'wall_gate':'wall',d=s.objectRegistry.require(type),b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x:t.x,y:t.y,tiles:[t]};s.buildings.push(b);s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));ids.push(b.id);});
      s.wallMap=undefined;s.events.emit('buildings:changed');s.fog?.setEnabled?.(false);return {ids,row};
    });
    assert.equal(await page.evaluate(t=>window.__game.registry.get('application').scene.map[t.y][t.x],line.row[0]),0,'people walk through the Gate');
    if(process.env.SMOKE_SHOTS){await page.evaluate(t=>{const s=window.__game.registry.get('application').scene,v=s.towerViews.get(t);s.worldCamera&&(s.worldCamera.following=false);const p=v?.container??v?.back??v;s.cameras.main.centerOn(p.x??0,p.y??0);s.cameras.main.setZoom(1.6);},line.ids[0]);await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/gate.png`});}
    const target=line.ids.at(-1);
    assert.equal(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return s.character.command({kind:'enter',tower:s.buildings.find(b=>b.id===id)});},target),true);
    await page.waitForFunction(t=>{const c=window.__game.registry.get('application').scene.character;return c.state==='onWall'&&c.tile.x===t.x&&c.tile.y===t.y&&!c.nextTile;},line.row.at(-1),{timeout:90000});
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.character.command({kind:'move',goal:{...window.__game.registry.get('application').scene.character.tile,y:window.__game.registry.get('application').scene.character.tile.y+3}})),true);
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.character.state==='exitingTower',null,{timeout:60000});
    const exit=await page.evaluate(()=>window.__game.registry.get('application').scene.character.exitTile);
    assert.ok(Math.abs(exit.x-line.row[0].x)+Math.abs(exit.y-line.row[0].y)<=1,`came down at the Gate, not at the clicked segment (${JSON.stringify(exit)})`);
    console.log('PASS Gate: placed from the menu, walkable on the ground, the King climbs at the Gate, walks the wall top and comes down only at the Gate');
  }finally{await page.close();}
}
