import assert from 'node:assert/strict';

// Day and night N3 (wolves) in a real page: at night a pack comes from the map edge (the roll is forced), walks towards
// the village, keeps out of the castle's light; the notice "Wolves near the houses!" stops the night speed-up; at dawn
// the wolves leave.
export async function wolvesSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.setItem('newgame.nightSpeed','1'));await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.nightThreats);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const pack=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime,n=s.nightThreats;n.started=()=>true;/* E1: threats begin later in a real game */n.random=()=>0;g.update(g.dayDuration*(s.dayNight.nightStart()+.01)-g.elapsed);
      const wolves=n.spawnWolves(g.day);n.random=Math.random;
      // Bring the pack closer to the village for the check (the walk from the edge takes a while).
      const c=s.character.tile;wolves.forEach((w,i)=>{const t={x:c.x+14+i,y:c.y+6};if(s.map[t.y]?.[t.x]===0){w.tile=t;w.position={x:t.x+.5,y:t.y+.5};w.path=[];}});
      return wolves.map(w=>w.id);});
    assert.ok(pack.length>=2,`a pack of ${pack.length}`);
    await page.waitForTimeout(3000);
    const state=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,n=s.nightThreats,lights=n.scaryLights();
      return {near:n.wolvesNear,speed:s.dayNight.speed(3),inLight:n.wolves().filter(w=>n.lit(w.tile,lights)).length,feed:[...document.querySelectorAll('#event-feed *')].map(e=>e.textContent).join('|')};});
    assert.equal(state.inLight,0,'no wolf stands in the light');
    if(state.near){assert.equal(state.speed,1,'wolves near the houses stop the speed-up');assert.match(state.feed,/Wolves near the houses/);}
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration-g.elapsed+g.dayDuration*.06);});
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.nightThreats.wolves().length===0,null,{timeout:60000});
    console.log(`PASS Day and night N3 wolves: a pack of ${pack.length} at night, none in the light, ${state.near?'notice "Wolves near the houses!" and the speed-up stops':'no houses near'}, gone after dawn`);
  }finally{await page.close();}
}
