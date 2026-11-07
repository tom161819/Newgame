import assert from 'node:assert/strict';

// m-zvirata-2 in a real page: rats at the Starter Stockpile wander further than the old circle and sometimes hide;
// a stray cat carries a faint "?" that goes once it is taken in.
export async function animals2Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.domesticViews);await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const loc=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.domestic,st=s.buildings.find(b=>b.type==='starter_stockpile');s.fog?.setEnabled?.(false);
      const l=d.foodLocations().find(l=>l.buildingId===st.id);d.rats.set(l.id,80);const k=s.character.tile;const c=d.newCat({x:k.x+2.5,y:k.y+2.5,home:{x:k.x+2.5,y:k.y+2.5},state:'stray'});c.wait=1e9;c.target=null;
      if(s.worldCamera)s.worldCamera.following=false;const w={x:s.map.length*32+(st.x-st.y)*32,y:128+(st.x+st.y+2)*16};s.cameras.main.centerOn(w.x,w.y);return {id:l.id,cx:st.x+1,cy:st.y+1,cat:c.id};});
    const samples=[];for(let i=0;i<24;i++){await page.waitForTimeout(250);samples.push(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,g=s.domesticViews.rats.get(id)??[];return g.map(r=>({x:r.rat?.x,y:r.rat?.y,hidden:(r.rat?.hidden??0)>0}));},loc.id));}
    const all=samples.flat().filter(r=>r.x!=null),far=Math.max(...all.map(r=>Math.hypot(r.x-loc.cx,r.y-loc.cy)));
    assert.ok(all.length>0,'rats are drawn');assert.ok(far>2.2,`rats roam beyond the store edge (${far.toFixed(1)} tiles)`);
    const moved=new Set(all.map(r=>`${Math.round(r.x)},${Math.round(r.y)}`)).size;assert.ok(moved>=4,'rats move around');
    const mark=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,c=s.domestic.cats.get(id);s.domesticViews.update(16);return !!c.view?.wild?.visible;},loc.cat);assert.equal(mark,true,'a stray shows the faint mark');
    const gone=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,c=s.domestic.cats.get(id),st=s.buildings.find(b=>b.type==='starter_stockpile');s.domestic.assign(id,st.id);s.domesticViews.update(16);return !c.view?.wild?.visible;},loc.cat);assert.equal(gone,true,'taken in: no mark');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/animals-2.png`});
    console.log(`PASS Animals 2: rats wander up to ${far.toFixed(1)} tiles from the store${all.some(r=>r.hidden)?' and hide':''}, a stray cat shows a faint "?" that goes when taken in`);
  }finally{await page.close();}
}
