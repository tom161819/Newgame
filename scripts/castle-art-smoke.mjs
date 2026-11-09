import assert from 'node:assert/strict';

// The approved castle with a bergfried (castle-keep v1) in a real page: the start castle draws the Studio sprite with a
// front battlement layer and five lights (two gate torches with flames, three window glows without), and the King who
// climbs up stands on the keep platform, behind the front layer. Screenshot: SMOKE_SHOTS/castle-keep.png.
export async function castleArtSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.towerViews);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return s.textures.exists(s.assets.key('castle','front'));},null,{timeout:20000});
    const view=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.buildings.find(b=>b.type==='castle'),v=s.towerViews.get(c.id);
      return {sprite:v.back?.sprite?.texture?.key??null,front:v.front?.sprite?.texture?.key??null,frontDepth:v.front?.depth??v.front?.image?.depth,backDepth:v.back?.depth??v.back?.image?.depth,
        lights:v.lights?.map(l=>[l.type,l.flameSize]),id:c.id};});
    assert.ok(view.sprite&&view.front&&view.sprite!==view.front,`main and front layers: ${JSON.stringify(view)}`);
    assert.ok(view.frontDepth>view.backDepth,'the battlements draw over the keep');
    assert.deepEqual(view.lights,[['window',0],['window',0],['window',0],['torch',1],['torch',1]]);
    // The King walks next to the castle and climbs up.
    const top=await page.evaluate(async id=>{const s=window.__game.registry.get('application').scene;
      const c=s.buildings.find(b=>b.id===id),ch=s.character;
      const near=[];for(let y=c.y-1;y<=c.y+c.definition.height;y++)for(let x=c.x-1;x<=c.x+c.definition.width;x++){const inside=x>=c.x&&x<c.x+c.definition.width&&y>=c.y&&y<c.y+c.definition.height;if(!inside&&s.map[y]?.[x]===0)near.push({x,y});}
      ch.command({kind:'enter',tower:c});return {near:near.length};},view.id);
    assert.ok(top.near>0);
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return s.character.state==='on_tower'||s.character.state==='ON_TOWER'||/platform/i.test(s.character.state);},null,{timeout:30000}).catch(()=>{});
    const king=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.buildings.find(b=>b.type==='castle'),v=s.towerViews.get(c.id);return {state:s.character.state,y:s.player.y,x:s.player.x,depth:s.player.depth,front:v.front?.depth??v.front?.image?.depth,base:v.base,platform:c.definition.platform};});
    assert.match(String(king.state),/tower/i,`the King is on the castle: ${JSON.stringify(king)}`);
    assert.ok(Math.abs(king.y-(king.base.y+king.platform.y))<4,`the King stands on the keep platform: ${JSON.stringify(king)}`);
    assert.ok(king.depth<king.front,'the front battlements cover the King');
    if(process.env.SMOKE_SHOTS){await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.cameras.main.setZoom(1.4);s.cameras.main.centerOn(s.player.x,s.player.y+60);});await page.waitForTimeout(700);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/castle-keep.png`});}
    console.log(`PASS Castle keep: approved sprite with a front battlement layer, 2 torches + 3 window glows, the King stands on the keep platform behind the battlements`);
  }finally{await page.close();}
}
