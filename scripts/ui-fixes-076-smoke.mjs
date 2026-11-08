import assert from 'node:assert/strict';

// m-ui-prekryvy-076 + m-drobnosti-076 (report 0.76.0 points 4–8, 12): the places of the playtest shots 03, 04, 05, 07,
// 08 and 09. The tutorial bubble and a tip never lie over the open Build menu, the Population panel or a resident's card;
// the Royal tasks card clears the Build menu; feed lines stay left of the side tabs and wrap to two lines; Policy and
// Employments never show together; the King panel has no sideways scrollbar; "More" reads "Více" in Czech; the stores
// counter is "Materiál". With SMOKE_SHOTS=<dir> it saves a screenshot of each place.
const ov=(a,b)=>!!a&&!!b&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
const S='window.__game.registry.get("application").scene';
export async function uiFixes076Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);await page.setViewportSize({width:1440,height:900});
  const shot=async name=>{if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/ui-fixes-076-${name}.png`});};
  const rect=sel=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e||e.hidden||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};},sel);
  let saved=null;
  try{
    await page.goto(url);saved=await page.evaluate(()=>Object.fromEntries(['newgame.language','newgame.tutorial','newgame.tipsSeen','newgame.tutorial.speedSeen','newgame.tips'].map(k=>[k,localStorage.getItem(k)])));await page.evaluate(()=>{localStorage.setItem('newgame.language','cs');localStorage.removeItem('newgame.tutorial');localStorage.removeItem('newgame.tipsSeen');localStorage.removeItem('newgame.tutorial.speedSeen');});await page.reload();
    await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-9H2936D1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.tutorial);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>page.keyboard.press('Escape')).catch(()=>{});
    // Point 8: the More toggle follows the language read after it was built.
    assert.equal((await page.locator('#hud-details-toggle').textContent()).trim(),'Více');
    // Point 12: the stores counter says Materiál and explains what it counts.
    const store=page.locator('.storage-capacity');if(await store.count()){assert.match(await store.textContent(),/^Materiál/);assert.match(await store.getAttribute('title'),/Jídlo se sem nepočítá/);}
    // Point 4, shot 04: the "Storage and workshop" step with the Build menu open on Logistics.
    await page.evaluate(s=>{const g=eval(s),t=g.tutorial;for(const step of t.progress().steps)if(step.id!=='storage'&&step.id!=='speed')t.skipped.add(step.id);t.active=true;t.update(true);},S);
    await page.locator('#buildings-tab').click();await page.locator('#buildings-panel:not([hidden])').waitFor();
    await page.locator('[data-building-category="logistics"]').click();await page.evaluate(s=>eval(s).tutorial.update(true),S);await page.waitForTimeout(200);
    let bubble=await rect('#tutorial-bubble');assert.ok(bubble,'the storage step shows its bubble');
    assert.ok(!ov(bubble,await rect('#buildings-panel')),`step 15 bubble over the Build menu ${JSON.stringify(bubble)}`);
    assert.ok(!ov(bubble,await rect('[data-building-category="infrastructure"]')),'step 15 bubble over Infrastructure');
    assert.ok(!ov(await rect('#tutorial-arrow'),await rect('[data-building-category="infrastructure"]')),'the arrow leaves Infrastructure free');
    await shot('04-storage-step');
    // Point 4, shot 05: the rats tip with the Build menu open on Housing.
    await page.locator('[data-building-category="housing"]').click();
    await page.evaluate(s=>{const t=eval(s).tutorial;t.active=false;t.hide();t.tip={id:'rats',target:'#notices-panel',wiki:'rats'};t.text.textContent='Krysy ti jedí jídlo.';t.bubble.classList.add('is-tip');t.bubble.hidden=false;t.placeTip();},S);
    bubble=await rect('#tutorial-bubble');assert.ok(!ov(bubble,await rect('#buildings-panel')),`the rats tip over the Build menu ${JSON.stringify(bubble)}`);
    await shot('05-rats-tip');
    // Point 5, shots 05 and 07: the Royal tasks card is above the open Build menu (or folded), never over it.
    await page.evaluate(s=>{const t=eval(s).tutorial;t.closeTip(false);t.active=false;eval(s).royalGoalsPanel.render(true);},S);await page.waitForTimeout(400);
    const goals=await rect('#royal-goals');if(goals)assert.ok(!ov(goals,await rect('#buildings-panel')),`Royal tasks over the Build menu ${JSON.stringify(goals)}`);
    await shot('05-royal-goals');
    await page.locator('#buildings-tab').click();await page.waitForTimeout(300);
    // Point 5, shot 07: a long feed line wraps (two lines at most) and stays left of the side tabs.
    await page.evaluate(s=>eval(s).eventFeed.push('smoke:long','Děti utekly domů – u domů je divočák, a tahle hláška je schválně tak dlouhá, že se musí zalomit, aby nebyla useknutá pod záložkou Zaměstnání.',{important:true}),S);
    const line=await page.evaluate(()=>{const e=document.querySelector('.feed-entry');const r=e.getBoundingClientRect(),lh=parseFloat(getComputedStyle(e).lineHeight)||16;return {right:r.right,lines:Math.round((e.clientHeight-8)/lh)};});
    const tabs=await page.evaluate(()=>Math.min(...['#policy-tab','#population-tab','#employment-tab'].map(s=>document.querySelector(s).getBoundingClientRect().left)));
    assert.ok(line.right<=tabs+1,`the feed line runs under the side tabs (${line.right} > ${tabs})`);assert.ok(line.lines<=2,`at most two lines (${line.lines})`);
    await shot('07-feed-line');
    // Point 6, shot 08: Policy and Employments never show together; the Employments card has no copy of the policy.
    const open=()=>page.evaluate(()=>({policy:!document.querySelector('#policy-card').hidden,employment:!document.querySelector('#employment-panel').hidden,castlePolicy:!document.querySelector('#employment-panel section.kingdom-policy').hidden}));
    await page.locator('#policy-tab').click();await page.locator('#employment-tab').click();
    assert.deepEqual(await open(),{policy:false,employment:true,castlePolicy:false});await shot('08-employment-card');
    await page.locator('#employment-panel .side-card-link').click();assert.deepEqual((({policy,employment})=>({policy,employment}))(await open()),{policy:true,employment:false});
    await page.locator('#policy-tab').click();
    // Point 4, shot 03: the job step with the Population panel and a resident's card open.
    await page.evaluate(s=>{const g=eval(s),t=g.tutorial;t.skipped.clear();t.seen.add('king');t.active=true;g.populationSidebar.setOpen(true);const w=g.workerSystem.liveSubjects().find(w=>w.profession==='idle')??g.workerSystem.liveSubjects()[0];g.unitPanel.open(w);t.update(true);},S);await page.waitForTimeout(300);
    bubble=await rect('#tutorial-bubble');
    if(bubble){assert.ok(!ov(bubble,await rect('#population-panel')),'bubble over the Population panel');assert.ok(!ov(bubble,await rect('#unit-dialog')),`bubble over the resident's card ${JSON.stringify(bubble)}`);}
    await shot('03-population-step');
    await page.evaluate(s=>{const g=eval(s);g.tutorial.end();g.unitPanel.close();g.populationSidebar.setOpen(false);},S);
    // Point 7, shot 09: the King panel fits – no sideways scrollbar, the + buttons inside.
    await page.locator('#king-profile').click();await page.locator('#unit-dialog[open]').waitFor();await page.waitForTimeout(300);
    const king=await page.evaluate(()=>{const d=document.querySelector('#unit-dialog'),r=d.getBoundingClientRect();return {scroll:d.scrollWidth-d.clientWidth,outside:[...d.querySelectorAll('.king-skill-plus')].filter(b=>b.getBoundingClientRect().right>r.right+1).length,buttons:d.querySelectorAll('.king-skill-plus').length};});
    assert.ok(king.scroll<=0,`the King panel scrolls sideways by ${king.scroll}px`);assert.equal(king.outside,0,'every + button inside the panel');assert.ok(king.buttons>0);
    await page.locator('#unit-dialog').evaluate(d=>{d.scrollTop=d.scrollHeight;});await shot('09-king-panel');
    console.log('PASS UI fixes 0.76 playtest: tutorial bubble and tips clear the open windows, Royal tasks clear the Build menu, feed lines wrap left of the tabs, Policy and Employments one at a time, the King panel fits, Více and Materiál');
  }finally{
    // The context is shared with the other scenarios: put the browser's language and tutorial memory back.
    if(saved)await page.evaluate(saved=>{for(const [k,v] of Object.entries(saved))if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);},saved).catch(()=>{});
    await page.close();
  }
}
