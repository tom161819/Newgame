import assert from 'node:assert/strict';

// #129: Settings → "Brightness of explored areas outside sight". The real slider repaints remembered ground and rocks live;
// unexplored ground stays black, the area in sight is untouched, the choice is kept per browser and never saved.
export async function memoryBrightnessSmoke(page,{screenshot=null}={}){
  await page.evaluate(()=>{try{const d=JSON.parse(localStorage.getItem('newgame.settings')??'{}');delete d.memoryBrightness;localStorage.setItem('newgame.settings',JSON.stringify(d));}catch{}
    const s=window.__game.registry.get('application').scene;s.pauseManager.set('brightness-smoke',true);window.__brightnessSmoke={position:{...s.character.position},fog:s.fog.enabled,exploration:s.fog.explorationEnabled,subjects:s.fog.providers.get('subjects')};
    s.fog.providers.delete('subjects');s.fog.update();});
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').check();await page.locator('#exploration-toggle').check();
  assert.equal(await page.locator('#memory-brightness').inputValue(),'30');assert.equal(await page.locator('#memory-brightness-value').textContent(),'30 %');
  // Explore a patch away from the king, then come back: it is remembered (explored) but outside sight.
  const tiles=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,home={...s.character.position},king={...s.character.tile};
    s.character.position={x:king.x+28.5,y:king.y+.5};s.refreshVisibility();s.character.position=home;s.refreshVisibility();
    const remembered={x:king.x+30,y:king.y},unknown={x:Math.min(98,king.x+45),y:Math.min(98,king.y+40)};return {king,remembered,unknown,states:[s.fog.state(king),s.fog.state(remembered),s.fog.state(unknown)]};});
  assert.deepEqual(tiles.states,[2,1,0],JSON.stringify(tiles));
  const set=async value=>{await page.locator('#memory-brightness').evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
    return page.evaluate(async tiles=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const s=window.__game.registry.get('application').scene;
      const pixel=tile=>{const texture=s.terrain.chunkTexture(Math.floor(tile.x/10),Math.floor(tile.y/10)),p={x:3200+(tile.x-tile.y)*32,y:128+(tile.x+tile.y+1)*16};return Array.from(s.textures.get(texture.key).getContext().getImageData(p.x-texture.x,p.y-texture.y,1,1).data);};
      const stale=[...s.terrain.chunks.keys()].filter(k=>s.terrain.dirtyChunks.has(k));
      return {stale,fog:s.fog.memoryBrightness,king:pixel(tiles.king),remembered:pixel(tiles.remembered),unknown:pixel(tiles.unknown),states:[s.fog.state(tiles.king),s.fog.state(tiles.remembered),s.fog.state(tiles.unknown)],label:document.querySelector('#memory-brightness-value').textContent};},tiles);};
  const sum=p=>p[0]+p[1]+p[2],shots=[];
  const shot=async value=>{if(!screenshot)return;const path=screenshot.replace(/(\.png)?$/,`-${value}.png`);await page.locator("#close-settings").click();await page.waitForTimeout(400);await page.screenshot({path});shots.push(path);await page.locator('#settings-button').click();};
  const low=await set(15);await shot(15);const normal=await set(30);await shot(30);const high=await set(90);await shot(90);
  assert.deepEqual([low.fog,normal.fog,high.fog],[.15,.3,.9]);assert.equal(high.label,'90 %');
  assert.ok(sum(low.remembered)<sum(normal.remembered)&&sum(normal.remembered)*2<sum(high.remembered),`remembered ground follows the slider ${JSON.stringify([low.remembered,normal.remembered,high.remembered])}`);
  for(const r of [low,normal,high]){assert.deepEqual(r.stale,[],'every shown chunk is repainted at once, although Settings pause the game');assert.deepEqual(r.unknown,[0,0,0,255],'unexplored ground stays black');assert.deepEqual(r.king,low.king,'the area in sight is not darkened');assert.deepEqual(r.states,[2,1,0],'the slider reveals nothing');}
  // Remembered rocks use the same brightness.
  const rocks=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,t=s.terrain;return [...t.tiles.entries()].filter(([k])=>{const [x,y]=k.split(',').map(Number);return s.fog.displayState({x,y})===1;}).map(([,img])=>img.tintTopLeft);});
  assert.ok(rocks.every(tint=>tint===((230<<16)|(233<<8)|230)),`remembered rock tint ${JSON.stringify(rocks.slice(0,4))}`);
  const kept=await page.evaluate(()=>({stored:JSON.parse(localStorage.getItem('newgame.settings')).memoryBrightness,saved:'memoryBrightness' in window.__game.registry.get('application').snapshot().settings}));
  assert.deepEqual(kept,{stored:.9,saved:false},'kept in this browser, never in a save');
  await page.locator('#memory-brightness-reset').click();assert.equal(await page.locator('#memory-brightness').inputValue(),'30');assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.fog.memoryBrightness),.3);
  const original=await page.evaluate(()=>window.__brightnessSmoke);await page.locator('#fog-toggle').setChecked(original.fog);await page.locator('#exploration-toggle').setChecked(original.exploration);await page.locator('#close-settings').click();
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;if(window.__brightnessSmoke.subjects)s.fog.providers.set('subjects',window.__brightnessSmoke.subjects);s.fog.update();s.pauseManager.set('brightness-smoke',false);delete window.__brightnessSmoke;try{const d=JSON.parse(localStorage.getItem('newgame.settings')??'{}');delete d.memoryBrightness;localStorage.setItem('newgame.settings',JSON.stringify(d));}catch{}});
  console.log(`PASS fog brightness slider: remembered ground ${sum(low.remembered)}→${sum(normal.remembered)}→${sum(high.remembered)} at 15/30/90 %, rocks retinted, unexplored black, sight untouched, kept per browser, never saved, Default resets${shots.length?`; screenshots ${shots.join(', ')}`:''}`);
}
