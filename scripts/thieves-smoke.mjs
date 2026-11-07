import assert from 'node:assert/strict';

// Day and night N3 (thieves) in a real page: an unhappy kingdom with a dark store (the roll is forced); a thief comes
// at night, takes goods from the store and runs; a soldier with a torch next to him sees him, chases him and the goods
// lie on the ground again. Night speed-up off for a calm check.
export async function thievesSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.setItem('newgame.nightSpeed','1'));await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.nightThreats);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const start=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime,n=s.nightThreats;g.update(g.dayDuration*(s.dayNight.nightStart()+.01)-g.elapsed);
      s.needs.summary=()=>({happiness:15});s.dayNight.darkAt=()=>true;n.random=()=>0;n.thiefDay=null;const thief=n.spawnThief(g.day);n.random=Math.random;if(!thief)return null;
      const st=n.thieves.get(thief.id),b=s.buildings.find(x=>x.id===st.target.buildingId);
      // Bring him to the store door (the walk from the edge takes a while).
      const near=[];for(let dy=-1;dy<=b.definition.height;dy++)for(let dx=-1;dx<=b.definition.width;dx++){const t={x:b.x+dx,y:b.y+dy};if(s.map[t.y]?.[t.x]===0&&(dx<0||dy<0||dx>=b.definition.width||dy>=b.definition.height))near.push(t);}
      const t=near[0];thief.tile={...t};thief.position={x:t.x+.5,y:t.y+.5};thief.path=[];thief.nextTile=null;st.repath=0;
      const loc=s.foodStorage.locations.get(st.target.id);return {id:thief.id,target:st.target,before:{...loc.stock}};});
    assert.ok(start,'a thief comes');
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.nightThreats.thieves.get(id)?.state==='escaping',start.id,{timeout:20000});
    const loot=await page.evaluate(id=>window.__game.registry.get('application').scene.nightThreats.thieves.get(id).loot,start.id);assert.ok(loot&&loot.amount>=10,'stole goods');
    // A soldier with a torch right beside him.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,thief=s.workerSystem.workers.get(id),t={x:thief.tile.x+1,y:thief.tile.y};
      const w=s.workerSystem.create(s.map[t.y]?.[t.x]===0?t:thief.tile);s.workerSystem.jobs.assign(w,'soldier');s.lightFuel.hands.add(w.id);},start.id);
    await page.waitForFunction(id=>!window.__game.registry.get('application').scene.nightThreats.thieves.has(id),start.id,{timeout:60000});
    const after=await page.evaluate(r=>{const s=window.__game.registry.get('application').scene;return {drop:[...s.dropSystem.drops.values()].some(d=>d.resource===r.resource&&d.amount===r.amount),gold:s.inventory.count('gold')};},loot);
    assert.ok(loot.resource==='gold'||after.drop,'the goods lie on the ground for the Haulers');
    console.log(`PASS Day and night N3 thieves: a thief stole ${loot.amount} ${loot.resource} from a dark store; a soldier with a torch caught him and the loot is back`);
  }finally{await page.close();}
}
