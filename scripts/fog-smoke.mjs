import assert from 'node:assert/strict';

export async function explorationMenuSmoke(page){
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('fog-smoke',true);window.__fogSmoke={position:{...s.character.position},tile:{...s.character.tile},fog:s.fog.enabled,exploration:s.fog.explorationEnabled};});
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').check();await page.locator('#exploration-toggle').check();
  const sample=()=>page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene,tile={x:95,y:95},cx=Math.floor(tile.x/10),cy=Math.floor(tile.y/10),texture=s.terrain.chunkTexture(cx,cy),point={x:3200+(tile.x-tile.y)*32,y:128+(tile.x+tile.y+1)*16};
    const pixel=Array.from(s.textures.get(texture.key).getContext().getImageData(point.x-texture.x,point.y-texture.y,1,1).data);
    return {pixel,seen:s.fog.explored.reduce((a,b)=>a+b,0),state:s.fog.state(tile),display:s.fog.displayState(tile),memory:s.mapMemory.terrain.has(9595)};
  });
  const black=await sample();assert.deepEqual(black.pixel,[0,0,0,255]);assert.equal(black.state,0);assert.equal(black.memory,false);
  await page.locator('#exploration-toggle').uncheck();const grey=await sample();assert.equal(grey.display,1);assert.ok(grey.pixel.slice(0,3).some(v=>v>0));assert.equal(grey.seen,black.seen);
  await page.locator('#fog-toggle').uncheck();const clear=await sample();assert.equal(clear.display,2);assert.ok(clear.pixel.slice(0,3).reduce((a,b)=>a+b,0)>grey.pixel.slice(0,3).reduce((a,b)=>a+b,0)*1.5);assert.equal(clear.seen,black.seen);
  await page.locator('#exploration-toggle').check();await page.locator('#fog-toggle').check();const restored=await sample();assert.deepEqual(restored,black);
  const history=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene,old={...s.character.tile},index=old.y*100+old.x;
    const before=s.mapMemory.terrain.get(index)?.slice();s.character.position={x:80.5,y:80.5};s.refreshVisibility();
    const result={state:s.fog.state(old),old:before,remembered:s.mapMemory.terrain.get(index)?.slice(),unknown:s.fog.state({x:95,y:95}),count:s.fog.explored.reduce((a,b)=>a+b,0)};
    s.character.position={...window.__fogSmoke.position};s.refreshVisibility();return result;
  });
  assert.equal(history.state,1);assert.deepEqual(history.remembered,history.old);assert.equal(history.unknown,0);assert.ok(history.count>black.seen);
  const original=await page.evaluate(()=>window.__fogSmoke);await page.locator('#fog-toggle').setChecked(original.fog);await page.locator('#exploration-toggle').setChecked(original.exploration);await page.locator('#close-settings').click();
  await page.evaluate(()=>{window.__game.registry.get('application').scene.pauseManager.set('fog-smoke',false);delete window.__fogSmoke;});
  console.log('PASS native circular exploration, black/grey/normal terrain pixels, independent runtime switches, unchanged discovery on test reveal and frozen known terrain');
}
