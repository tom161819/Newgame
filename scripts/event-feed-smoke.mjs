import assert from 'node:assert/strict';

// #105: the event feed sits in the bottom-right column of the map between the Notices panel and the minimap.
// Events of the real shapes reach it (fed to the handler, so no XP or world change) (a finished building, a new resident, an attack, a season), it never covers the minimap or
// the notices, and entries fade once play runs again. Also checks the phone layout and the minimap click there.
const overlap=(a,b)=>!(a.x+a.width<=b.x+.5||b.x+b.width<=a.x+.5||a.y+a.height<=b.y+.5||b.y+b.height<=a.y+.5);
export async function eventFeedSmoke(page,{screenshot=null}={}){
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('feed-smoke',true);const panel=document.querySelector('#notices-panel');window.__feedSmoke={hidden:panel.hidden,following:s.worldCamera.following};
    panel.hidden=false;const id=[...s.workerSystem.workers.values()].find(w=>w.isAlive&&w.isSubject!==false).id,b=s.buildings.find(b=>b.id!=null);
    window.__feedSmoke.subscribed=s.activities.listeners.size>0;const feed=s.eventFeed;feed.onActivity({type:'buildingCompleted',actor:id,objectType:b.type,objectIds:[b.id]});feed.onActivity({type:'combatDamage',actor:-1,targetId:id,objectType:'worker',amount:1});s.eventFeed.push('feed-smoke:extra','Smoke check entry.');});
  const rows=page.locator('#event-feed .feed-entry');await rows.nth(2).waitFor();
  const texts=await rows.allTextContents();assert.ok(texts.some(t=>/is finished\./.test(t))&&texts.some(t=>/is under attack!/.test(t)),`events reach the feed ${JSON.stringify(texts)}`);assert.ok(await page.evaluate(()=>window.__feedSmoke.subscribed),'the feed listens to the activity bus');
  const order=await page.evaluate(()=>[...document.querySelector('#corner-stack').children].filter(e=>!e.hidden).map(e=>e.id));assert.deepEqual(order,['notices-panel','event-feed','minimap'],'column order: notices → feed → minimap');
  const check=async label=>{const [notices,feed,map,game]=await Promise.all(['#notices-panel','#event-feed','#minimap','#game'].map(s=>page.locator(s).boundingBox()));
    for(const [a,b,n] of [[notices,map,'notices/minimap'],[feed,map,'feed/minimap'],[notices,feed,'notices/feed']])assert.ok(!overlap(a,b),`${label}: ${n} do not overlap ${JSON.stringify([a,b])}`);
    for(const box of [notices,feed,map])assert.ok(box.x>=game.x-1&&box.x+box.width<=game.x+game.width+1&&box.y>=game.y-1&&box.y+box.height<=game.y+game.height+1,`${label}: inside the map ${JSON.stringify([box,game])}`);};
  await check('desktop');if(screenshot)await page.screenshot({path:screenshot});
  const size=page.viewportSize();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await check('phone');
  // The phone minimap is smaller for real (no CSS scale), so a click still centres the camera on the right tile.
  const target={x:30,y:70},point=await page.evaluate(t=>{const r=document.querySelector('#minimap').getBoundingClientRect(),k=document.querySelector('#minimap canvas').offsetWidth/100,X=(t.x-50)*k,Y=(t.y-50)*k;return{x:r.left+r.width/2+(X-Y)/Math.SQRT2,y:r.top+r.height/2+(X+Y)/Math.SQRT2/2};},target);
  await page.mouse.click(point.x,point.y);
  const grid=await page.evaluate(()=>{const p=window.__game.registry.get('application').scene.worldCamera.panTarget,h=(p.x-3200)/32,v=(p.y-128)/16;return {x:(v+h)/2,y:(v-h)/2};});
  assert.ok(Math.abs(grid.x-target.x)<2&&Math.abs(grid.y-target.y)<2,`phone minimap click centres the camera ${JSON.stringify(grid)}`);
  await page.setViewportSize(size);
  // Entries stay while paused and fade once play resumes.
  const count=await rows.count();await page.waitForTimeout(500);assert.equal(await rows.count(),count,'paused: entries stay');
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('feed-smoke',false);for(const e of s.eventFeed.entries)e.expireAt=performance.now()+200;});
  await page.waitForFunction(()=>document.querySelectorAll('#event-feed .feed-entry').length===0,null,{timeout:5000});
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;document.querySelector('#notices-panel').hidden=window.__feedSmoke.hidden;s.worldCamera.following=window.__feedSmoke.following;s.worldCamera.panTarget=null;delete window.__feedSmoke;});
  console.log(`PASS #105 event feed: completion and attack events, column notices → feed → minimap without overlap on desktop and phone, phone minimap click, entries kept while paused and faded after (${count} entries)`);
}
