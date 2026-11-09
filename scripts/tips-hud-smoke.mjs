import assert from 'node:assert/strict';

// m-tipy-mimo-listu + m-drobnosti-083 point 8 (report 0.83.0 points 2 and 8): a tip lies clear of the top bar, the side
// tabs, "Follow the king" and an open window; after a game day without a reaction it folds into the Notices bar and a
// click there opens it again; the step held by the night speed-up shows a moon badge in the icon look.
// With SMOKE_SHOTS=<dir> it saves a screenshot of each place. Written without a browser run (0.83 UI task): run it once.
const ov=(a,b)=>!!a&&!!b&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
const S='window.__game.registry.get("application").scene';
export async function tipsHudSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);await page.setViewportSize({width:1440,height:900});
  const shot=async name=>{if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/tips-hud-${name}.png`});};
  const rect=sel=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e||e.hidden||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};},sel);
  const rects=sel=>page.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}),sel);
  let saved=null;
  try{
    await page.goto(url);saved=await page.evaluate(()=>Object.fromEntries(['newgame.language','newgame.tipsSeen','newgame.tips','newgame.notices.collapsed'].map(k=>[k,localStorage.getItem(k)])));
    await page.evaluate(()=>{localStorage.setItem('newgame.language','cs');localStorage.removeItem('newgame.tipsSeen');localStorage.setItem('newgame.tips','on');localStorage.setItem('newgame.notices.collapsed','1');});await page.reload();
    await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW4-155515555555-SU24BGPY');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.tutorial);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>page.keyboard.press('Escape')).catch(()=>{});
    // Shot 03: the night tip points at the day part in the top bar.
    await page.evaluate(s=>{const g=eval(s),t=g.tutorial;t.active=false;t.hide();t.tips.open({id:'night',target:'#day-part'},t.gameNow());t.showTip(t.tip);},S);await page.waitForTimeout(200);
    let bubble=await rect('#tutorial-bubble');assert.ok(bubble,'the night tip shows');
    for(const sel of ['.inventory','#speed-controls','#follow-king'])assert.ok(!ov(bubble,await rect(sel)),`the tip over ${sel} ${JSON.stringify(bubble)}`);
    for(const tab of await rects('.population-tab'))assert.ok(!ov(bubble,tab),'the tip over a side tab');
    await shot('03-night-tip');
    // A window opening where the tip is: the tip moves (placed again each frame).
    await page.locator('#population-tab').click();await page.locator('#population-panel:not([hidden])').waitFor();await page.waitForTimeout(600);
    bubble=await rect('#tutorial-bubble');assert.ok(!ov(bubble,await rect('#population-panel')),`the tip over the Population panel ${JSON.stringify(bubble)}`);
    await page.locator('#population-tab').click();await page.waitForTimeout(400);
    // No reaction for a game day: it folds into the Notices bar (slid away: the "!" tab), then opens again from there.
    await page.evaluate(s=>{const t=eval(s).tutorial;t.tips.shownAt-=t.dayMs();t.hovered=false;t.updateTips();},S);
    assert.equal(await page.locator('#tutorial-bubble').isHidden(),true,'folded away');
    await page.locator('#notices-tab .notices-alert').waitFor({timeout:3000});await shot('fold-tab');
    await page.locator('#notices-tab').click();await page.locator('[data-notice-tip="night"]').first().click();
    assert.equal(await page.locator('#tutorial-bubble').isVisible(),true,'opened again from the Notices bar');
    assert.equal(await page.locator('[data-notice-tip="night"]').count(),0,'its row is gone');
    await page.evaluate(s=>eval(s).tutorial.closeTip(),S);
    // Point 8: the step held by the night speed-up has a moon badge in the icon look.
    const badge=await page.evaluate(s=>{const g=eval(s);g.nightSpeedUp.engaged=true;g.gameSpeed=3;g.speedControls.render();const b=document.querySelector('#speed-controls [data-speed="3"]');return getComputedStyle(b,'::after').content;},S);
    assert.match(badge,/☾/,'a moon on the held step');await shot('night-badge');
    await page.evaluate(s=>{const g=eval(s);g.nightSpeedUp.engaged=false;g.speedControls.render();},S);
    console.log('PASS tips and HUD 0.83 playtest: tips clear the top bar, side tabs and windows, fold into the Notices bar and open again, moon badge on the held speed step');
  }finally{
    if(saved)await page.evaluate(saved=>{for(const [k,v] of Object.entries(saved))if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);},saved).catch(()=>{});
    await page.close();
  }
}
