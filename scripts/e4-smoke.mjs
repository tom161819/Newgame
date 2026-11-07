import assert from 'node:assert/strict';
// Plan E4 (report 0.48.0): Royal tasks card with three goals, a finished goal pays once with a feed line and a flash;
// a finished building gets a golden burst; Settings → Sound; Save keeps the goals.
export async function e4Smoke(page){
  await page.locator('#royal-goals').waitFor({state:'visible'});
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.royalGoals.importState({done:[],produced:{}});s.royalGoals.check();s.royalGoalsPanel.render(true);});
  const before=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {gold:s.inventory.count('gold'),active:s.royalGoals.active().map(g=>g.id),done:[...s.royalGoals.done]};});
  assert.equal(await page.locator('#royal-goals .royal-goal').count(),3,'three tasks on the card');
  assert.match(await page.locator('#royal-goals summary').textContent(),/Royal tasks · \d+ \/ 8/);
  assert.ok(before.active.includes('bread')||before.done.includes('bread'),'bread is among the first tasks');
  assert.match(await page.locator('#royal-goals').textContent(),/Reward: \d+ (gold|wood|stone)/);
  if(!before.done.includes('bread')){
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.activities.emit('foodProduced',{objectType:'bakery',quantity:1});s.royalGoals.check();s.royalGoals.check();});
    const after=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {gold:s.inventory.count('gold'),done:[...s.royalGoals.done],feed:document.querySelector('#event-feed')?.textContent??''};});
    assert.ok(after.done.includes('bread'));assert.ok(after.gold>=before.gold+30&&after.gold<before.gold+30+20+40+1,`reward paid once (${before.gold} → ${after.gold})`);
    assert.match(after.feed,/Royal task done: Bake the first bread · 30 gold/);
    assert.equal(await page.locator('#royal-goals').evaluate(e=>e.classList.contains('goal-flash')),true,'the card flashes');
    assert.equal(await page.locator('#royal-goals [data-goal="bread"]').count(),0,'the next task took its place');
  }
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot().royalGoals);
  assert.ok(saved.done.includes('bread'),'Save keeps the finished task');
  const flashed=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>s.towerViews.get(b.id));return b?s.completionFlash.flash(b)&&s.completionFlash.effects.length>0:null;});
  assert.equal(flashed,true,'a finished building gets a burst');
  await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.completionFlash.effects.length),0,'the burst fades');
  const sound=page.locator('#settings-sound');assert.equal(await sound.count(),1);
  assert.equal(await sound.isChecked(),true,'sound is on by default');
  await sound.evaluate(i=>{i.checked=false;i.dispatchEvent(new Event('change'));});assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.sound')),'off');
  await sound.evaluate(i=>{i.checked=true;i.dispatchEvent(new Event('change'));});assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.sound')),'on');
  if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/e4-royal-goals.png`});
  console.log('PASS E4: Royal tasks card (3 of 8, rewards), first bread pays 30 gold once with a feed line and a flash, next task moves up, Save keeps it, building burst fades, Settings → Sound');
}
