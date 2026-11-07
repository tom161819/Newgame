import { openAssetLibrary } from './building-menu-smoke.mjs';
import assert from 'node:assert/strict';

// N07 (#38): Czech/English switch in the main menu, translated screens, remembered across a reload, then back to English.
export async function i18nSmoke(page){
  const text=selector=>page.locator(selector).first().textContent();
  assert.equal(await page.locator('#main-language').inputValue(),'en');assert.equal(await text('#new-game'),'New Game');
  await page.locator('#main-language').selectOption('cs');
  assert.equal(await text('#new-game'),'Nová hra');assert.equal(await text('#main-load-game'),'Načíst hru');assert.equal(await page.evaluate(()=>document.documentElement.lang),'cs');
  assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.language')),'cs');
  await page.reload();await page.locator('#new-game:not([disabled])').waitFor();
  assert.equal(await text('#new-game'),'Nová hra','the choice survives a restart');assert.equal(await page.locator('#main-language').inputValue(),'cs');
  await page.locator('#new-game').click();await page.locator('#game-setup:not([hidden])').waitFor();
  assert.equal(await text('#setup-title'),'Nastavení nové hry');assert.equal(await text('#start-game'),'Spustit hru');
  assert.match(await text('#setup-summary'),/^NORMÁLNÍ · Normálně · 9 zvířat · 1 truhla · 30 kamenů na mapě/);
  const body=await page.evaluate(()=>document.body.innerText);assert.doesNotMatch(body,/undefined|\{\w+\}/,'no raw keys or undefined');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Czech setup fits a phone');await page.setViewportSize({width:1440,height:1000});
  await page.locator('#setup-back').click();await page.locator('#main-menu:not([hidden])').waitFor();
  await page.locator('#main-language').selectOption('en');assert.equal(await text('#new-game'),'New Game');assert.equal(await page.evaluate(()=>document.documentElement.lang),'en');
  console.log('PASS Czech/English switch in the main menu, translated setup with Czech plurals, remembered after reload, phone width, back to English');
}

// In-game switch from Settings: HUD texts and data names change at once, without a restart.
export async function i18nGameSmoke(page){
  const text=selector=>page.locator(selector).first().textContent();
  await page.locator('#settings-button').click();await page.locator('#settings-panel.open').waitFor();
  assert.equal(await page.locator('#settings-language').inputValue(),'en');await page.locator('#settings-language').selectOption('cs');
  assert.equal(await text('#settings-title'),'Nastavení');assert.equal(await page.locator('#main-language').inputValue(),'cs','both pickers stay in sync');
  await page.locator('#close-settings').click();
  assert.match(await text('#game-time'),/^Den \d+$/);assert.match(await text('#season-weather'),/^(Jaro|Léto|Podzim|Zima)/);assert.equal(await text('#buildings-tab'),'Budovy');
  assert.match(await text('#vision-status'),/^(Mlha války: VYP|Dohled: )/);assert.match(await text('#king-health'),/^Životy: /);assert.match(await text('#king-level'),/^Král \| úroveň \d+$/);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.objectRegistry.require('warehouse').name),'Sklad');
  const body=await page.evaluate(()=>document.querySelector('main').innerText);assert.doesNotMatch(body,/undefined|\{\w+\}/);
  // Panels in Czech: storage and the king's character sheet.
  await page.evaluate(()=>window.__game.registry.get('application').scene.storagePanel.open());await page.locator('#storage-dialog[open]').waitFor();
  assert.equal(await text('#storage-title'),'Suroviny a sklady');assert.match(await page.locator('#storage-details').innerText(),/Uloženo: \d+ \/ \d+/);assert.doesNotMatch(await page.locator('#storage-dialog').innerText(),/undefined|\{\w+\}/);
  await page.locator('#close-storage').click();
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.unitPanel.open(s.character);});await page.locator('#unit-dialog[open]').waitFor();
  assert.match(await text('#unit-level'),/^Úroveň \d+ \/ \d+$/);assert.equal(await text('#unit-dialog h3[data-i18n="unit.skills"]'),'Dovednosti');assert.doesNotMatch(await page.locator('#unit-dialog').innerText(),/undefined|\{\w+\}/);
  await page.locator('#close-unit').click();
  // Population sidebar and Asset Library in Czech.
  await page.locator('#population-tab').click();await page.locator('#population-panel.open').waitFor();
  assert.match(await text('#population-summary'),/^Obyvatelé: \d+ · zaměstnaní: \d+ · nezaměstnaní: \d+$/);assert.equal(await page.locator('#population-order option[value="desc"]').textContent(),'Sestupně');
  assert.doesNotMatch(await page.locator('#population-panel').innerText(),/undefined|\{\w+\}/);await page.locator('#close-population').click();
  await openAssetLibrary(page);await page.locator('#asset-gallery[open]').waitFor();
  assert.match(await text('#asset-count'),/^\d+ \/ \d+ objektů$/);assert.doesNotMatch(await page.locator('#asset-gallery').innerText(),/undefined|\{\w+\}/);await page.locator('#close-asset-gallery').click();
  await page.locator('#settings-button').click();await page.locator('#settings-language').selectOption('en');await page.locator('#close-settings').click();
  assert.match(await text("#game-time"),/^Day \d+$/);assert.equal(await text('#buildings-tab'),'Buildings');assert.match(await text('#king-level'),/^King \| LVL \d+$/);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.objectRegistry.require('warehouse').name),'Warehouse');
  console.log('PASS in-game language switch from Settings: day, season, sight, HP, level, Buildings tab, object names, storage, character, population and Asset Library panels follow at once; pickers in sync; back to English');
}
