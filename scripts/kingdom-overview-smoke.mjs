import assert from 'node:assert/strict';

// Plan m-horni-lista-prehled in a real page: the HUD's second row shows residents / housing room, unemployed and the
// average mood; hovering opens the panel with the average needs and the attractiveness; the help arrow bobs under "?"
// until the help is opened, and stays gone after a reload. Screenshots at 1280, 1920 and 900 px wide.
export async function kingdomOverviewSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    for(const [width,height] of [[1280,800],[1920,1080],[900,800]]){
      await page.setViewportSize({width,height});await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.helpSeen'));
      await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW4-155515555555-1');await page.locator('#start-game').click();
      await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingdomOverview);
      await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
      await page.waitForFunction(()=>/\d+ \/ \d+/.test(document.querySelector('#overview-population').textContent));
      const chips=await page.evaluate(()=>['#overview-population','#overview-unemployed','#overview-mood'].map(id=>document.querySelector(id).textContent));
      // m-start-v2 start: King, two residents and the Castle garrison, so the chip shows the live resident count.
      const residents=await page.evaluate(()=>window.__game.registry.get('application').scene.workerSystem.liveSubjects().length);
      assert.ok(residents>=3);assert.match(chips[0],new RegExp(`${residents} \\/ \\d+`));assert.match(chips[1],/Unemployed \d/);assert.match(chips[2],/%|—/);
      assert.equal(await page.locator('#help-arrow').isVisible(),true,'the help arrow at the start');
      // No overlap between the overview and the food status.
      const boxes=await page.evaluate(()=>['#kingdom-overview','.food-status','.hud-status'].map(q=>{const r=document.querySelector(q).getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom};}));
      const overlap=(a,b)=>a.l<b.r-1&&b.l<a.r-1&&a.t<b.b-1&&b.t<a.b-1;assert.ok(!overlap(boxes[0],boxes[1])&&!overlap(boxes[0],boxes[2]),`no overlap at ${width}px: ${JSON.stringify(boxes)}`);
      await page.locator('#kingdom-overview').hover();await page.locator('#kingdom-overview-panel').waitFor({state:'visible'});
      const panel=await page.locator('#kingdom-overview-panel').textContent();for(const word of ['Happiness','Food','Rest','Housing','Safety','Average mood','Kingdom Attractiveness'])assert.ok(panel.includes(word),word);
      if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/overview-${width}.png`,clip:{x:0,y:0,width,height:Math.min(height,420)}});
      await page.mouse.move(width/2,height-100);await page.setViewportSize({width:1440,height:1000});
    }
    await page.locator('#help-toggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#help-arrow').isVisible(),false,'gone once the help was opened');
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.helpArrow);
    assert.equal(await page.locator('#help-arrow').isVisible(),false,'and it does not come back');
    console.log('PASS HUD overview: residents / room, unemployed and mood in the second row (no overlap at 1280, 1920, 900 px), hover panel with needs and attractiveness, help arrow until the help is opened');
  }finally{await page.evaluate(()=>localStorage.removeItem('newgame.helpSeen')).catch(()=>{});await page.close();await context.pages()[0]?.bringToFront?.();}
}
