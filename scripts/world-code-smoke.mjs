import assert from 'node:assert/strict';

// World v2 step 1: the World section of New Game Setup and seeded worlds. Two New Games with the same pasted code
// must give the same starting world (terrain, water, bushes, trees, stones, deposits, animals, chests); the game
// menu shows the code with Copy world code; choices and New seed update the code; a broken code is refused.
const CODE='MKW5-155515555555-7KQ9X2';
async function newGame(context,url,instrument,code,{check=false}={}){
  const page=await context.newPage();await instrument?.(page);
  await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#game-setup:not([hidden])').waitFor();
  const input=page.locator('#setup-world-code');assert.match(await input.inputValue(),/^MKW5-155515555555-[0-9A-Z]{1,8}$/,'a fresh random code is proposed');
  if(check){
    const first=await input.inputValue();await page.locator('#setup-new-seed').click();assert.notEqual(await input.inputValue(),first,'New seed');
    if(process.env.SMOKE_SHOTS)await page.locator('.setup-world').screenshot({path:`${process.env.SMOKE_SHOTS}/setup-world.png`});
    await page.locator('#setup-water').selectOption('high');assert.match(await input.inputValue(),/^MKW5-185535555555-/,'Water High: width 8, three lakes');
    await page.locator('#setup-forest').selectOption('dense');assert.match(await input.inputValue(),/^MKW5-185535558555-/);
    await input.fill('MKW5-155515559555-AB');assert.equal(await page.locator('#setup-forest').inputValue(),'custom','a forest level outside the choices shows Custom');assert.equal(await page.locator('#setup-water').inputValue(),'normal');
    await input.fill('MKW5-155915555555-AB');assert.equal(await page.locator('#setup-water').inputValue(),'custom','a setting without a simple choice (fords) shows Custom everywhere');
    await input.fill('MKW5-oops');assert.equal(await page.locator('#setup-world-error').isVisible(),true);assert.match(await page.locator('#setup-world-error').textContent(),/Invalid world code/);
    await page.locator('#start-game').click();assert.equal(await page.locator('#game-setup').isHidden(),false,'a broken code does not start');
    await input.fill('MKW1-155515555555-AB');assert.match(await page.locator('#setup-world-error').textContent(),/generator version 1; this build uses version 5/);
  }
  await input.fill(code);await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.animalSystem);
  await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
  // The fingerprint is taken when the world is created, before any respawn or growth can happen.
  const world=await page.evaluate(()=>{const app=window.__game.registry.get('application'),s=app.snapshot();return {code:s.gameSettings.worldCode,terrain:s.terrain,ground:s.ground,bushes:s.bushes,natureGroups:s.natureGroups,start:app.scene.startWorldFingerprint};});
  return {page,world};
}
export async function worldCodeSmoke(context,url,instrument){
  const a=await newGame(context,url,instrument,CODE,{check:true});
  try{
    assert.equal(a.world.code,CODE,'the code is kept in the save');
    const b=await newGame(context,url,instrument,CODE.toLowerCase());
    try{
      for(const key of ['code','terrain','ground','bushes','natureGroups','start'])assert.deepEqual(b.world[key],a.world[key],`same code, same ${key}`);
      assert.ok(a.world.start.counts.resources>100,'trees, stones and deposits are part of it');assert.ok(a.world.start.counts.animals>0&&a.world.start.counts.chests>0);
    }finally{await b.page.close();}
    const c=await newGame(context,url,instrument,'MKW5-155515555555-7KQ9X3');
    try{assert.notDeepEqual(c.world.ground,a.world.ground,'another seed, another world');assert.notEqual(c.world.start.hash,a.world.start.hash);}finally{await c.page.close();}
    await a.page.keyboard.press('Escape');await a.page.locator('#pause-menu[open]').waitFor();
    assert.equal(await a.page.locator('#pause-world-code').textContent(),CODE);assert.equal(await a.page.locator('#copy-world-code').isVisible(),true);
    if(process.env.SMOKE_SHOTS)await a.page.locator('#pause-menu').screenshot({path:`${process.env.SMOKE_SHOTS}/pause-world-code.png`});
    console.log('PASS World code: New Game Setup proposes a code, choices and New seed update it, broken codes are refused; the same pasted code gives the same world twice (terrain, water, bushes, resources, animals, chests); the game menu shows the code');
  }finally{await a.page.close();}
}
