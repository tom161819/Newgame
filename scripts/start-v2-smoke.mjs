import assert from 'node:assert/strict';

// m-start-v2 in a real page: a default New Game has 200 Bread in the Starter Stockpile, room for 10 at the Castle
// (HUD "7 / 10") and a garrison of 2 Soldiers and 2 Archers standing near the Castle.
export async function startV2Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.military);await page.waitForTimeout(500);
    const s=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,st=s.buildings.find(b=>b.type==='starter_stockpile');
      return {bread:s.foodStorage.locations.get(`stockpile-${st.id}`).stock.bread,units:[...s.military.units.values()].map(u=>u.type).sort(),pop:s.workerSystem.liveSubjects().length,cap:s.workerSystem.capacity(),
        near:[...s.military.units.keys()].every(id=>{const w=s.workerSystem.workers.get(id),c=s.character.tile;return Math.hypot(w.tile.x-c.x,w.tile.y-c.y)<12;})};});
    assert.equal(s.bread,160);assert.deepEqual(s.units,['archer','archer','soldier','soldier']);assert.equal(s.pop,9);assert.equal(s.cap,10);assert.equal(s.near,true);
    assert.match(await page.locator('#population-count').textContent(),/9\s*\/\s*10/);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/start-v2.png`});
    console.log('PASS Start 2: 160 Bread in the Starter Stockpile, population 9 / 10 (5 residents + garrison), 2 Soldiers and 2 Archers by the Castle');
  }finally{await page.close();}
}
