import assert from 'node:assert/strict';

// m-notice-bar-hlasky (owner requests 66, 70, 72) in a real page: the low-food notice names the Fisherman's Hut; the
// fold button folds the Notices bar and the choice survives a reload; while folded a new notice flashes one line,
// fades after ~2 s and leaves an unread count on the button until the bar is unfolded; a notice that comes back
// within its interval stays one row with a count.
export async function notices2Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const start=async()=>{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.noticesPanel);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    // Paused: the injected notices are not real problems, so a running diagnostics check would forget them at once.
    await page.evaluate(()=>window.__game.registry.get('application').scene.gameTime.setPaused(true));
  };
  // Reports one notice right away through the real diagnostics (no 10 s wait).
  const report=found=>page.evaluate(found=>{const d=window.__game.registry.get('application').scene.diagnostics,now=window.__game.registry.get('application').scene.gameTime.totalElapsed;const issue=d.track(found,now);d.notify(issue,found,now);d.changed();return issue.key;},found);
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.notices.collapsed'));await start();
    await report({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true});
    await page.locator('#notices-panel:not([hidden])').waitFor();
    const food=await page.locator('#notices-list').textContent();assert.match(food,/Fisherman's Hut near water/);assert.match(food,/Hunting Lodge/);
    // Fold with the button: remembered in the browser.
    await page.locator('#notices-toggle').click();assert.equal(await page.locator('#notices-panel.collapsed').count(),1);
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.notices.collapsed')),'1');
    // A new notice while folded: one line next to the button, then it fades; the button keeps the count.
    await report({entityId:0,reason:'noBuilder',category:'construction',params:{count:1}});
    await page.locator('.notices-flash:not([hidden])').waitFor();assert.match(await page.locator('.notices-flash').textContent(),/No builders/);
    assert.equal(await page.locator('#notices-toggle .notices-unread').textContent(),'1');
    await page.locator('.notices-flash.fading').waitFor({timeout:4000});await page.locator('.notices-flash').waitFor({state:'hidden',timeout:4000});
    assert.equal(await page.locator('#notices-toggle .notices-unread').textContent(),'1','the count stays after the flash');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/notices-2-folded.png`});
    // Reload: still folded.
    await start();assert.equal(await page.locator('#notices-panel.collapsed').count(),1,'folded after reload');
    // A fresh game has no notices (the bar is hidden): report one so the folded bar shows.
    await report({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true});await page.locator('#notices-panel:not([hidden])').waitFor();
    await page.locator('#notices-toggle').click();assert.equal(await page.locator('#notices-panel.collapsed').count(),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.notices.collapsed')),'0');assert.equal(await page.locator('#notices-toggle .notices-unread').count(),0);
    // A flickering problem comes back quietly to its one row with a count.
    const counted=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.diagnostics,found={entityId:0,reason:'noBuilder',category:'construction',params:{count:1}};
      let now=s.gameTime.totalElapsed;const issue=d.track(found,now);d.notify(issue,found,now);d.forget(issue.key,issue);now+=20000;const back=d.track(found,now);back.firstSeen-=20000;d.observe(back,found,now);d.changed();return back.count;});
    assert.equal(counted,2);await page.locator('#notices-list .notice-count').first().waitFor();assert.match(await page.locator('#notices-list .notice-count').first().textContent(),/×2/);
    assert.deepEqual(errors,[]);
    console.log('PASS notices-2: low food names the Fisherman\'s Hut; the fold button remembers its state, flashes new notices and counts them; repeats stay one row');
  }finally{await page.evaluate(()=>localStorage.removeItem('newgame.notices.collapsed')).catch(()=>{});await page.close();}
}
