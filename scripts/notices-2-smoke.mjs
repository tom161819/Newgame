import assert from 'node:assert/strict';

// Notices in a real page. 0.68.0 (m-notice-bar-hlasky 66/70/72): the low-food notice names the Fisherman's Hut.
// Notices 3 (m-hlasky-jednou 79, m-notice-bar-zasunuti 80): the fold button slides the bar to the right edge, leaving
// the tab (arrow, "!" for unread); the choice survives a reload; a new notice while away slides out one message for
// ~4 s (the pointer holds it) and leaves "!"; a quietly repeated notice does not slide out; a closed notice does not
// come back within 4 days; the tab click slides the bar out and clears "!".
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
  const report=found=>page.evaluate(found=>{const s=window.__game.registry.get('application').scene,d=s.diagnostics,now=s.gameTime.totalElapsed;const issue=d.track(found,now);d.notify(issue,found,now);d.changed();return issue.key;},found);
  // The real observe path for a repeat of an existing notice (gone and back): quiet when open or closed.
  const repeat=found=>page.evaluate(found=>{const s=window.__game.registry.get('application').scene,d=s.diagnostics,key=`${found.entityId}:${found.reason}`,old=d.issues.get(key);
    let now=s.gameTime.totalElapsed;if(old)d.forget(key,old);now+=20000;const back=d.track(found,now);back.firstSeen-=20000;const changed=d.observe(back,found,now);d.changed();return {changed,count:back.count,dismissed:back.dismissed};},found);
  const panelX=()=>page.locator('#notices-panel').evaluate(el=>el.getBoundingClientRect().left);
  const edge=()=>page.locator('.viewport').evaluate(el=>el.getBoundingClientRect().right);
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.notices.collapsed'));await start();
    await report({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true});
    await page.locator('#notices-panel:not([hidden])').waitFor();
    const food=await page.locator('#notices-list').textContent();assert.match(food,/Fisherman's Hut near water/);assert.match(food,/Hunting Lodge/);
    // A repeat while open: one row with ×2, no second row.
    assert.equal((await repeat({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true})).count,2);
    assert.equal(await page.locator('#notices-list .notice').count(),1);assert.match(await page.locator('#notices-list .notice-count').first().textContent(),/×2/);
    // Slide away with the fold button: remembered; the panel ends past the right edge, the tab stays at the edge.
    await page.locator('#notices-toggle').click();assert.equal(await page.locator('#notices-panel.collapsed').count(),1);
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.notices.collapsed')),'1');
    await page.waitForTimeout(450);assert.ok(await panelX()>=await edge()-2,'slid off the right edge');
    const tab=await page.locator('#notices-tab').boundingBox();assert.ok(tab&&tab.width>0&&tab.x+tab.width<=await edge()+1&&tab.x+tab.width>=await edge()-12,'tab at the edge');
    assert.match(await page.locator('#notices-tab').textContent(),/◂/);assert.equal(await page.locator('#notices-tab .notices-alert').count(),0,'no "!" without unread');
    // A quiet repeat while away: no slide-out, no "!".
    await repeat({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true});await page.waitForTimeout(400);
    assert.equal(await page.locator('#notices-panel.peeking').count(),0,'a repeated notice does not slide out');assert.equal(await page.locator('#notices-tab .notices-alert').count(),0);
    // A new notice while away: one message out for ~4 s, then back; "!" stays.
    await report({entityId:0,reason:'noBuilder',category:'construction',params:{count:1}});
    await page.locator('#notices-panel.peeking').waitFor({timeout:2000});assert.match(await page.locator('#notices-peek').textContent(),/No builders/);
    assert.equal(await page.locator('#notices-list').isVisible(),false,'only one message');
    assert.equal(await page.locator('#notices-tab .notices-alert').textContent(),'!');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/notices-3-peek.png`});
    await page.waitForTimeout(3000);assert.equal(await page.locator('#notices-panel.peeking').count(),1,'still out at 3 s');
    await page.locator('#notices-panel.peeking').waitFor({state:'detached',timeout:3000});assert.equal(await page.locator('#notices-tab .notices-alert').count(),1,'"!" stays');
    // Hover holds a peek out.
    await report({entityId:0,reason:'storageFull',category:'production',params:{groups:[{helper:'warehouse',resources:['stone']}]},feed:false});await page.locator('#notices-panel.peeking').waitFor({timeout:2000});
    await page.locator('#notices-peek').hover();await page.waitForTimeout(5000);assert.equal(await page.locator('#notices-panel.peeking').count(),1,'held while hovered');
    await page.mouse.move(10,10);await page.locator('#notices-panel.peeking').waitFor({state:'detached',timeout:3000});
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/notices-3-tab.png`});
    // Reload: still slid away.
    await start();assert.equal(await page.locator('#notices-panel.collapsed').count(),1,'slid away after reload');
    await report({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true});await page.locator('#notices-panel:not([hidden])').waitFor();
    await page.locator('#notices-tab').click();assert.equal(await page.locator('#notices-panel.collapsed').count(),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.notices.collapsed')),'0');assert.equal(await page.locator('#notices-tab').isVisible(),false);
    // Close it: a repeat within 4 days stays closed.
    await page.locator('#notices-list .notice-dismiss').first().click();assert.equal(await page.locator('#notices-list .notice').count(),0);
    const back=await repeat({entityId:0,reason:'foodLow',category:'production',params:{days:1},feed:true});assert.equal(back.dismissed,true,'closed stays closed within 4 days');
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.diagnostics.exportState().closed.length),1,'close time is in the save');
    assert.deepEqual(errors,[]);
    console.log('PASS notices-2/3: low food names the Fisherman\'s Hut; repeats stay one row; the bar slides to the edge, peeks new notices for 4 s with "!", repeats stay quiet; closed notices stay closed');
  }finally{await page.evaluate(()=>localStorage.removeItem('newgame.notices.collapsed')).catch(()=>{});await page.close();}
}
