import assert from 'node:assert/strict';

// m-wiki-napoveda in a real page: the Wiki button next to "?", categories, search, a generated building page with
// facts and a link to a topic, Back, an "i" on a rats line in the event feed that opens the topic, Czech texts.
export async function wikiSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.wikiPanel);await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.locator('#wiki-toggle').click();await page.locator('#wiki-dialog[open]').waitFor();
    assert.ok(await page.locator('.wiki-category').count()>=6,'categories');
    await page.locator('#wiki-search').fill('granary');await page.locator('.wiki-nav [data-wiki-page="building:granary"]').click();
    assert.match(await page.locator('.wiki-page-title').textContent(),/Granary/);assert.match(await page.locator('.wiki-facts').textContent(),/Price.*Size/s);
    await page.locator('.wiki-related [data-wiki-page="topic:rats"]').click();assert.match(await page.locator('.wiki-page-title').textContent(),/Rats & Cats/);
    await page.locator('.wiki-back').click();assert.match(await page.locator('.wiki-page-title').textContent(),/Granary/);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/wiki.png`});
    await page.keyboard.press('Escape');assert.equal(await page.locator('#wiki-dialog').evaluate(d=>d.open),false);
    // A rats line in the event feed has an "i" that opens Rats & Cats.
    await page.evaluate(()=>window.__game.registry.get('application').scene.eventFeed.push('rats:smoke','Rats in the Granary!',{important:true}));
    await page.locator('#event-feed .wiki-info[data-wiki-topic="rats"]').click();await page.locator('#wiki-dialog[open]').waitFor();
    assert.equal(await page.locator('#wiki-page').getAttribute('data-wiki-current'),'topic:rats');await page.keyboard.press('Escape');
    // m-wiki-v2: the "?" in a building window opens its page; the All chains page links into the bread chain.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(x=>(x.type??x.definition?.id)==='starter_stockpile');s.storagePanel.open(b);});
    await page.locator('#storage-dialog[open] .wiki-help:not([hidden])').click();await page.locator('#wiki-dialog[open]').waitFor();
    assert.equal(await page.locator('#wiki-page').getAttribute('data-wiki-current'),'building:starter_stockpile');
    assert.match(await page.locator('[data-wiki-section="live"]').textContent(),/Built: 1/);
    await page.evaluate(()=>window.__game.registry.get('application').scene.wikiPanel.show('unit:knight'));
    assert.match(await page.locator('[data-wiki-section="numbers"]').textContent(),/Combat level needed\s*4/);
    for(const c of ['guides','units','systems'])assert.equal(await page.locator(`.wiki-category[data-wiki-category="${c}"]`).count(),1,c);
    await page.evaluate(()=>window.__game.registry.get('application').scene.wikiPanel.show('topic:chains'));
    assert.ok(await page.locator('.wiki-chain-row').count()>=10,'chains');
    await page.locator('.wiki-section-chain [data-wiki-page="building:bakery"]').first().click();
    assert.equal(await page.locator('#wiki-page').getAttribute('data-wiki-current'),'building:bakery');
    for(const key of ['why','how','chain','numbers','tips'])assert.equal(await page.locator(`[data-wiki-section="${key}"]`).count(),1,key);
    assert.ok(await page.locator('.wiki-step-here').count()>=2,'bakery marked in its chain');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/wiki-bakery.png`});
    await page.keyboard.press('Escape');await page.evaluate(()=>window.__game.registry.get('application').scene.storagePanel.close?.());
    console.log('PASS Wiki: button next to ?, "?" in a building window, live state, Knight numbers, guides/units/systems, All chains → Bakery with its sections, categories, search, generated Granary page with facts, link to Rats & Cats and Back, "i" on a rats feed line opens the topic');
  }finally{await page.close();}
}
