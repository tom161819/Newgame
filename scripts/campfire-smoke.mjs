import assert from 'node:assert/strict';

// Day and night N3 (campfire, switches) in a real page: the Settings show the three night threat switches (on), one is
// switched off; a campfire is made beside the King from local wood, burns at night and turns to ashes in the morning.
export async function campfireSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW6-1555155555555555-1');
    assert.equal(await page.locator('#setup-night-wolves').isChecked(),true);await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.nightThreats);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    const switches=await page.evaluate(()=>['wolves','thieves','fires'].map(id=>document.querySelector(`#settings-threat-${id}`).checked));assert.deepEqual(switches,[true,true,true]);
    await page.evaluate(()=>{const box=document.querySelector('#settings-threat-thieves');box.checked=false;box.dispatchEvent(new Event('change'));});
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.nightThreats.enabled.thieves),false);
    // A campfire beside a tree near the King (walk him to a tree first).
    const fire=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,trees=[...s.naturalResources.byId.values()].filter(o=>o.definition.tree),k=s.character.tile;
      trees.sort((a,b)=>Math.hypot(a.x-k.x,a.y-k.y)-Math.hypot(b.x-k.x,b.y-k.y));const t=trees[0];
      for(let r=2;r<5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const tile={x:t.x+dx,y:t.y+dy};if(s.map[tile.y]?.[tile.x]!==0)continue;const f=s.nightThreats.makeCampfire({tile});if(f)return {id:f.id,x:f.x,y:f.y};}return null;});
    assert.ok(fire,'a campfire next to a tree');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration*(s.dayNight.nightStart()+.02)-g.elapsed);});
    await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.lightFuel.isLit(s.buildings.find(b=>b.id===id));},fire.id,{timeout:10000});
    if(process.env.SMOKE_SHOTS){await page.evaluate(f=>{const s=window.__game.registry.get('application').scene;if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(1.6);s.cameras.main.centerOn(s.map.length*32+(f.x-f.y)*32,128+(f.x+f.y)*16);},fire);
      await page.waitForTimeout(800);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/campfire.png`});}
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration-g.elapsed+g.dayDuration*.3);});
    await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);return b&&s.nightThreats.campfireAshes(b);},fire.id,{timeout:10000});
    console.log('PASS Day and night N3a: threat switches in setup and Settings; a campfire from local wood burns at night and is ashes in the morning');
  }finally{await page.close();}
}
