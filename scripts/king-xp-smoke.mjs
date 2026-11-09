import assert from 'node:assert/strict';

// m-kral-odmeny-xp (owner request 39) in a real page: a finished Royal task gives the King skill points and a feed
// line; the King panel shows the free points, Leadership and Stewardship and a + on every skill row; spending raises
// the level and the points survive Save/Load.
export async function kingXpSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingSkills);
    await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    // Finish the Bread task (one of the first three) by counting one finished Bakery cycle; the check pays once.
    const earned=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;
      const before=s.kingSkills.points;s.royalGoals.produced.bakery=1;const done=s.royalGoals.check();
      return {before,after:s.kingSkills.points,done:done.map(g=>g.id),points:done.reduce((n,g)=>n+g.skillPoints,0)};});
    assert.ok(earned.done.includes('bread'),`the bread task finished (${earned.done})`);assert.equal(earned.after-earned.before,earned.points);
    const feed=await page.evaluate(()=>document.body.textContent);
    assert.match(feed,/The King earned \d skill points?\./,'feed line');
    // King panel: points, royal skills and a + on each row.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.unitPanel.open(s.character);});await page.locator('#unit-dialog[open]').waitFor();
    await page.locator('#king-skills:not([hidden])').waitFor();
    assert.match(await page.locator('#king-skill-points').textContent(),new RegExp(`Free skill points: ${earned.after}`));
    assert.equal(await page.locator('#king-skills [data-king-skill-row]').count(),2);
    assert.ok(await page.locator('#unit-skills .skill-row [data-king-skill]').count()>=12,'a + on every ordinary skill');
    const tip=await page.locator('#king-skills [data-king-skill="leadership"]').getAttribute('title');assert.match(tip,/\+3 %/);
    assert.match(await page.locator('#king-skills [data-king-skill="stewardship"]').getAttribute('title'),/\+4 %/);
    const combat0=await page.evaluate(()=>window.__game.registry.get('application').scene.character.skills.combat.level);
    await page.locator('#king-skills [data-king-skill="leadership"]').click();
    // A second task (10 residents, faked for one check) pays the point for Combat.
    const second=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem,real=w.liveSubjects;w.liveSubjects=()=>Array.from({length:10},(_,i)=>real.call(w)[0]??{id:i});const done=s.royalGoals.check();w.liveSubjects=real;return done.reduce((n,g)=>n+g.skillPoints,0);});
    await page.locator('#unit-skills [data-skill="combat"] [data-king-skill]').click();
    const after=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {points:s.kingSkills.points,leadership:s.kingSkills.levels.leadership,combat:s.character.skills.combat.level};});
    assert.deepEqual(after,{points:earned.after+second-2,leadership:1,combat:combat0+1});
    // Save: the app snapshot carries the points and levels (Save/Load itself is covered by tests/king-xp.test.js).
    const loaded=await page.evaluate(()=>({saved:window.__game.registry.get('application').snapshot().kingSkills}));
    assert.deepEqual(loaded.saved,{points:after.points,leadership:1,stewardship:0});
    assert.deepEqual(errors,[]);
    console.log('PASS king-xp: a Royal task gives King skill points with a feed line; the King panel spends them; the snapshot keeps them');
  }finally{await page.close();}
}
