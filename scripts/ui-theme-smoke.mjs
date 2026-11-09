import assert from 'node:assert/strict';

// UI Lab in the game (m-ui-lab-do-hry): the owner's Studio design is on by default; Settings switches between it, the
// four starting styles and the original look. In every style the main controls stay usable (Buildings tab, a window
// opens and closes, Settings closes) and nothing covers them.
export async function uiThemeSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.workerSystem);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const attrs=()=>page.evaluate(()=>({theme:document.documentElement.dataset.uiTheme??null,frame:document.documentElement.dataset.uiFrame??null,bar:document.documentElement.dataset.uiBuildingsBar??null}));
    assert.deepEqual(await attrs(),{theme:'olive-custom',frame:'rivets',bar:'bottom'},'the owner\'s design by default');
    const covered=sel=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return 'missing';const r=e.getBoundingClientRect();if(!r.width||!r.height)return 'hidden';const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return hit&&(e===hit||e.contains(hit))?null:`covered by ${hit?.id||hit?.className||hit?.tagName}`;},sel);
    const shots=[];
    for(const style of ['studio','olive','wood-iron','parchment','stone-castle','classic']){
      await page.locator('#settings-button').click();await page.locator('#settings-panel[aria-hidden="false"]').waitFor();
      await page.locator('#settings-ui-style').selectOption(style);await page.locator('#close-settings').click();
      await page.waitForFunction(()=>document.querySelector('#settings-panel').getAttribute('aria-hidden')==='true');
      const a=await attrs();if(style==='classic')assert.equal(a.theme,null,'original look');else assert.ok(a.theme,style);
      if(style==='stone-castle')assert.equal(a.bar,'top','Stone castle puts the buildings bar on top');
      for(const sel of ['#buildings-tab','#settings-button'])assert.equal(await covered(sel),null,`${style}: ${sel} usable`);
      await page.locator('#buildings-tab').click();await page.locator('[data-building-category="housing"]').click();assert.equal(await page.locator('#house-choice').isVisible(),true,`${style}: building menu`);await page.locator('#buildings-tab').click();
      await page.evaluate(()=>window.__game.registry.get('application').scene.storagePanel.open());await page.locator('#storage-dialog[open]').waitFor();
      if(process.env.SMOKE_SHOTS){const path=`${process.env.SMOKE_SHOTS}/ui-${style}.png`;await page.screenshot({path});shots.push(path);}
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storage-dialog[open]'));
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.uiStyle')),'classic','kept in this browser only');
    console.log(`PASS UI Lab in the game: the owner's design by default; Studio / Olive / Wood & iron / Parchment / Stone castle / Original switch in Settings, controls usable in every style${shots.length?` (${shots.length} screenshots)`:''}`);
  }finally{await page.close();}
}
