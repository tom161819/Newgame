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
    console.log('PASS Wiki: button next to ?, categories, search, generated Granary page with facts, link to Rats & Cats and Back, "i" on a rats feed line opens the topic');
  }finally{await page.close();}
}
