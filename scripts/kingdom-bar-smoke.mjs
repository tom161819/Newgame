import assert from 'node:assert/strict';

// m-prehled-kralovstvi-pozice (plan point 81, owner comments 9 Nov) in a real page, at 1920×1080 and 1366×768:
// 1. the Kingdom overview is a permanent bar in the map's bottom-left corner that covers neither the camera chips,
//    Notices, minimap, side buttons nor the HUD; it folds to a strip (kept after a reload) and the top-bar chips toggle it;
// 2. the Notices bar can be dragged by its grip, keeps its place after a reload and a resize, slides away to the nearer
//    side edge and goes back to the corner on a double-click of the grip;
// 3. the open building strip spans the window from edge to edge and the overview bar, camera chips and minimap sit above it.
// Run with `npm run smoke -- --current-only --kingdom-bar`. SMOKE_SHOTS=<dir> saves screenshots.
const KEYS=['newgame.kingdomBar.collapsed','newgame.notices.position','newgame.notices.collapsed','newgame.notices.muted'];
const overlap=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
async function boxes(page,selectors){
  return page.evaluate(list=>Object.fromEntries(list.map(q=>{const el=document.querySelector(q);if(!el||el.hidden||!el.getClientRects().length)return [q,null];const r=el.getBoundingClientRect();return [q,{left:r.left,top:r.top,right:r.right,bottom:r.bottom}];})),selectors);
}
async function start(page,url){
  // A muted category keeps the Notices bar on screen even before the first notice (NoticesPanel.render).
  await page.goto(url);await page.evaluate(keys=>{for(const k of keys)localStorage.removeItem(k);localStorage.setItem('newgame.notices.muted','["construction"]');},KEYS);
  await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW6-1555155555555555-1');await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingdomOverview);
  await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
}
export async function kingdomBarSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    for(const [width,height] of [[1920,1080],[1366,768]]){
      await page.setViewportSize({width,height});await start(page,url);
      const bar=page.locator('#kingdom-bar');await bar.waitFor({state:'visible'});
      const view=(await boxes(page,['.viewport']))['.viewport'];
      const check=async label=>{
        const b=await boxes(page,['#kingdom-bar','.camera-controls','#notices-panel','#minimap','#event-feed','#settings-button','#dev-tool-button','.inventory','#buildings-panel']);
        const me=b['#kingdom-bar'];assert.ok(me,`${label}: the bar is shown`);
        assert.ok(me.left>=view.left&&me.right<=view.right&&me.top>=view.top&&me.bottom<=view.bottom,`${label}: inside the map ${JSON.stringify(me)}`);
        for(const [q,r] of Object.entries(b))if(q!=='#kingdom-bar'&&r)assert.ok(!overlap(me,r),`${label}: clear of ${q} ${JSON.stringify({me,r})}`);
        return b;
      };
      // 1. Bottom-left corner, fixed, bigger text with bold numbers.
      const first=await check(`${width} open`);assert.ok(first['#kingdom-bar'].left-view.left<=24,`in the left column ${JSON.stringify({bar:first['#kingdom-bar'],view,first})}`);assert.ok(view.bottom-first['#kingdom-bar'].bottom<=60,'at the bottom');
      const font=await page.evaluate(()=>{const row=document.querySelector('#kingdom-bar-body .overview-row');return {size:parseFloat(getComputedStyle(row).fontSize),bold:Number(getComputedStyle(row.querySelector('strong')).fontWeight)};});
      assert.ok(font.size>=13,`text ≥ 13 px (was 11), got ${font.size}`);assert.ok(font.bold>=700,'values bold');
      for(const word of ['Happiness','Food','Rest','Housing','Safety','Average mood'])assert.ok((await page.locator('#kingdom-bar-body').textContent()).includes(word),word);
      if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/kingdom-bar-${width}.png`});
      // Folded by the top-bar chips, kept after a reload, opened by its own toggle.
      await page.locator('#kingdom-bar-toggle').click();await page.waitForFunction(()=>document.querySelector('#kingdom-bar').classList.contains('collapsed'));
      assert.equal(await page.locator('#kingdom-bar-body').isVisible(),false);assert.match(await page.locator('#kingdom-bar-summary').textContent(),/\d+ \/ \d+/);
      await check(`${width} folded`);
      await page.reload();await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingdomOverview);
      await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
      assert.equal(await bar.evaluate(e=>e.classList.contains('collapsed')),true,'folded after a reload');
      await page.locator('#kingdom-bar-toggle').click();await page.locator('#kingdom-bar-body').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.kingdomBar.collapsed')),'0');
      // 3. The building strip: edge to edge, the bar above it, the chips and minimap lifted above it too.
      await page.locator('#buildings-tab').click();await page.locator('#buildings-panel').waitFor({state:'visible'});await page.waitForTimeout(300);
      const strip=(await boxes(page,['#buildings-panel']))['#buildings-panel'];assert.ok(strip.left<=1&&strip.right>=width-1,`the strip spans the window ${JSON.stringify(strip)}`);
      const open=await check(`${width} building strip`);
      for(const q of ['.camera-controls','#minimap'])if(open[q])assert.ok(open[q].bottom<=strip.top+1,`${q} above the strip`);
      // The lifted corner stack never covers the top bar: the Royal tasks card folds instead (RoyalGoalsPanel.clearBuildMenu).
      await page.waitForTimeout(400);const top=await boxes(page,['.inventory','#royal-goals','#notices-panel']);
      for(const q of ['#royal-goals','#notices-panel'])if(top[q])assert.ok(!overlap(top[q],top['.inventory']),`${q} clear of the top bar ${JSON.stringify(top)}`);
      if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/kingdom-bar-strip-${width}.png`});
      await page.locator('#buildings-tab').click();await page.waitForTimeout(200);await check(`${width} strip closed`);
      // 2. Drag the Notices bar by its grip to the upper left, keep it after a reload, then reset with a double-click.
      const notices=page.locator('#notices-panel');await notices.waitFor({state:'visible'});
      const grip=await page.locator('#notices-grip').boundingBox(),before=await notices.boundingBox(),offset=grip.x+grip.width/2-before.x;
      await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();await page.mouse.move(view.left+260,view.top+200,{steps:8});await page.mouse.up();
      const moved=await notices.boundingBox();assert.ok(Math.abs(moved.x-(view.left+260-offset))<=3,`follows the pointer ${JSON.stringify({moved,offset})}`);
      const kept=await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.notices.position')));assert.equal(kept.ax,'left');assert.equal(kept.ay,'top');
      await check(`${width} notices moved`);
      // Slid away it folds to the left edge (its nearer side); out again at the kept place.
      await page.locator('#notices-toggle').click();await page.waitForTimeout(400);
      const tab=await page.locator('#notices-tab').boundingBox();assert.ok(Math.abs(tab.x-view.left)<=2,`tab at the left edge ${JSON.stringify(tab)}`);
      await page.locator('#notices-tab').click();await page.waitForTimeout(400);const out=await notices.boundingBox();assert.ok(Math.abs(out.x-moved.x)<=2&&Math.abs(out.y-moved.y)<=2,'back at its place');
      // A smaller window keeps it on screen.
      await page.setViewportSize({width:1024,height:640});await page.waitForTimeout(300);
      const small=await notices.boundingBox();assert.ok(small.x>=0&&small.y>=0&&small.x+small.width<=1024&&small.y+small.height<=640,`on screen after a resize ${JSON.stringify(small)}`);
      await page.setViewportSize({width,height});await page.waitForTimeout(200);
      await page.reload();await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.noticesPanel);
      await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
      assert.equal(await notices.evaluate(e=>e.classList.contains('notices-moved')),true,'moved after a reload');
      await page.locator('#notices-grip').dblclick();assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.notices.position')),null,'the double-click clears it');
      assert.equal(await notices.evaluate(e=>e.classList.contains('notices-moved')),false,'back in the corner stack');
      await check(`${width} notices reset`);
    }
    console.log('PASS kingdom bar: bottom-left overview bar clear of chips / Notices / minimap / side buttons at 1920 and 1366, folds and is kept, edge-to-edge building strip with the bar above, draggable Notices kept and reset by a double-click');
  }finally{await page.evaluate(keys=>{for(const k of keys)localStorage.removeItem(k);},KEYS).catch(()=>{});await page.close();await context.pages()[0]?.bringToFront?.();}
}
