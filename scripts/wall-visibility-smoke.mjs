import assert from 'node:assert/strict';

// NEW20 (#148): a finished wall with the approved kit stays visible after culling hides it (camera pans away) and shows it again.
export async function wallVisibilitySmoke(page){
  const setup=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('wall'),x=s.character.tile.x+3,y=s.character.tile.y+3;
    const make=(id,tx)=>({id,x:tx,y,type:'wall',definition:d,tiles:[{x:tx,y}],connections:{N:false,S:false,E:tx===x,W:tx!==x}});
    window.__wallSmoke=[s.createBuildingView(d,make('smoke-wall-1',x)),s.createBuildingView(d,make('smoke-wall-2',x+1))];});
  await setup();
  await page.waitForFunction(()=>window.__wallSmoke.every(v=>v.artImages.length>0));
  const result=await page.evaluate(()=>{const views=window.__wallSmoke,shown=()=>views.map(v=>Object.entries(v.art).filter(([,i])=>i.visible).map(([p])=>p).sort().join());
    const split=views.every(v=>Object.values(v.art).every(i=>i.texture.key.endsWith(':body'))&&Object.values(v.shadows).every(i=>i.texture.key.endsWith(':shadow')&&i.depth===-80&&i.visible===v.art[Object.keys(v.shadows).find(p=>v.shadows[p]===i)].visible));
    const before=shown();for(const v of views)v.setVisible(false);const hidden=shown();for(const v of views)v.setVisible(true);const after=shown();
    for(const v of views)v.destroy();delete window.__wallSmoke;return {before,hidden,after,split};});
  assert.ok(result.before.every(p=>p.includes('block')),`kit block shown: ${result.before}`);
  assert.deepEqual(result.hidden,['','']);
  assert.deepEqual(result.after,result.before,'culled walls come back with the same kit pieces; joined sides stay without a parapet');
  assert.ok(!result.after[0].split(',').includes('E')&&!result.after[1].split(',').includes('W'),'the shared side has no parapet');
  assert.equal(result.split,true,'#147: kit bodies drawn without their baked shadows; shadows on the ground layer under all walls');
  console.log('PASS approved wall kit stays visible after culling hides and shows it; joined sides keep no parapet; baked shadows drawn on the ground layer, never over a neighbouring wall');
}
