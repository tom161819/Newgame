import assert from 'node:assert/strict';

// #104: the real minimap in the bottom-right corner shows only knowledge (grey unexplored, live sight, muted memory),
// marks the king, repaints only on change, centres the camera on a click and fits beside the HUD on a phone.
export async function minimapSmoke(page,{screenshot=null}={}){
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('minimap-smoke',true);window.__minimapSmoke={fog:s.fog.enabled,exploration:s.fog.explorationEnabled,following:s.worldCamera.following};});
  await page.locator('#settings-button').click();await page.locator('#fog-toggle').check();await page.locator('#exploration-toggle').check();await page.locator('#close-settings').click();
  await page.locator('#minimap').waitFor();const box=await page.locator('#minimap').boundingBox(),game=await page.locator('#game').boundingBox();
  assert.ok(box.x+box.width<=game.x+game.width+1&&box.y+box.height<=game.y+game.height+1&&box.x>game.x+game.width/2&&box.y>game.y+game.height/2,`bottom-right inside the map ${JSON.stringify([box,game])}`);
  for(const other of ['.camera-controls','#settings-button','#population-tab']){const o=await page.locator(other).first().boundingBox();if(o)assert.ok(o.x+o.width<=box.x||o.x>=box.x+box.width||o.y+o.height<=box.y||o.y>=box.y+box.height,`${other} does not overlap the minimap`);}
  // Read the minimap's own canvas: one tile is 2×2 pixels.
  const read=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene,m=s.minimap;m.nextRefresh=0;m.nextOverlay=0;m.update();const c=m.base.getContext('2d'),px=(x,y)=>Array.from(c.getImageData(x,y,1,1).data.slice(0,3));
    const king=s.character.tile,far=[[2,2],[97,97],[2,97],[97,2]].find(([x,y])=>s.fog.state({x,y})===0);return {king:px(king.x,king.y),far:px(far[0],far[1]),farState:s.fog.state({x:far[0],y:far[1]}),redraws:m.redraws,label:m.root.getAttribute('aria-label')};});
  const first=await read();assert.deepEqual(first.far,[66,68,64],'unexplored land is grey');assert.notDeepEqual(first.king,[66,68,64],'the area in sight is shown');assert.equal(first.label,'Minimap of explored land');
  await page.waitForTimeout(1000);const idle=await page.evaluate(()=>window.__game.registry.get('application').scene.minimap.redraws);assert.ok(idle-first.redraws<=1,`no repaint without a change (${idle-first.redraws})`);
  if(screenshot)await page.screenshot({path:screenshot});
  // A click on the minimap centres the camera there (a known or unknown spot; nothing is revealed).
  const target={x:30,y:70},point=await page.evaluate(t=>{const r=document.querySelector('#minimap').getBoundingClientRect(),k=150/100,X=(t.x-50)*k,Y=(t.y-50)*k;return{x:r.left+r.width/2+(X-Y)/Math.SQRT2,y:r.top+r.height/2+(X+Y)/Math.SQRT2/2};},target);
  const explored=await page.evaluate(()=>window.__game.registry.get('application').scene.fog.explored.reduce((a,b)=>a+b,0));
  await page.mouse.click(point.x,point.y);
  const after=await page.evaluate(t=>{const s=window.__game.registry.get('application').scene,p=s.worldCamera.panTarget,g={x:(p.y-128+((p.x-3200)/32)*16)/32,y:0};const h=(p.x-3200)/32,v=(p.y-128)/16;return {grid:{x:(v+h)/2,y:(v-h)/2},following:s.worldCamera.following,explored:s.fog.explored.reduce((a,b)=>a+b,0),moved:s.character.order?.goal??null};},target);
  assert.ok(Math.abs(after.grid.x-target.x)<1.5&&Math.abs(after.grid.y-target.y)<1.5,`camera centred on the clicked tile ${JSON.stringify(after.grid)}`);assert.equal(after.following,false);assert.equal(after.explored,explored,'nothing revealed');assert.equal(after.moved,null,'the king was not ordered anywhere');
  // Phone width: still visible inside the viewport.
  const size=page.viewportSize();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);const phone=await page.locator('#minimap').boundingBox();
  assert.ok(phone.width>0&&phone.x>=0&&phone.x+phone.width<=391&&phone.y+phone.height<=845,`fits a phone ${JSON.stringify(phone)}`);await page.setViewportSize(size);
  const original=await page.evaluate(()=>window.__minimapSmoke);await page.locator('#settings-button').click();await page.locator('#fog-toggle').setChecked(original.fog);await page.locator('#exploration-toggle').setChecked(original.exploration);await page.locator('#close-settings').click();
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.worldCamera.following=window.__minimapSmoke.following;s.worldCamera.panTarget=null;s.pauseManager.set('minimap-smoke',false);delete window.__minimapSmoke;});
  console.log(`PASS #104 minimap: bottom-right beside the HUD, grey unexplored, king's area shown, ${idle-first.redraws} repaint(s) in an idle second, click centres the camera without revealing or moving anyone, fits a phone`);
}
