import assert from 'node:assert/strict';

// m-zvirata-nahodny-vzhled in a real page: cats, a kitten, dogs (one sitting, one wounded) and a wolf pack are drawn
// with the approved Studio looks (walk sheets load), the look follows the animal's id, and the same animals keep their
// look after Save/Load.
export async function animalLooksSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW6-1555155555555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.domestic);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.domestic,k=s.character.tile;s.fog?.setEnabled?.(false);
      for(let i=0;i<4;i++){const c=d.newCat({x:k.x+1.5+i,y:k.y+2.5,home:{x:k.x+1.5+i,y:k.y+2.5},state:i===3?'kitten':'stray'});c.target=null;c.wait=1e9;}
      const dogs=[0,1,2].map(i=>{const g=d.newDog({x:k.x+1.5+i,y:k.y+4.5,state:'stray',home:{x:k.x+1.5+i,y:k.y+4.5}});g.target=null;g.wait=1e9;return g;});dogs[1].sitting=true;dogs[2].injuredUntil=1e12;
      s.nightThreats.started=()=>true;s.nightThreats.random=()=>0;const wolves=s.nightThreats.spawnWolves(s.gameTime.day);s.nightThreats.random=Math.random;
      wolves.forEach((w,i)=>{const t={x:k.x+5+i,y:k.y+1};if(s.map[t.y]?.[t.x]===0){w.tile=t;w.position={x:t.x+.5,y:t.y+.5};w.path=[];w.view.setPosition(3200+(t.x-t.y)*32,128+(t.x+t.y+1)*16);}});
      window.__looksWolves=wolves.map(w=>w.id);
      if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.centerOn(s.player.x,s.player.y+40).setZoom(1.6);s.domesticViews.update(16);});
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;s.domesticViews.update(16);return [...s.domestic.cats.values(),...s.domestic.dogs.values()].every(a=>a.view?.art?.visible);},null,{timeout:20000});
    const state=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.domestic;s.domesticViews.update(16);
      const view=a=>({id:a.id,look:a.view.look,figure:a.view.figure.visible,texture:a.view.art.texture.key});
      return {cats:[...d.cats.values()].map(c=>({...view(c),kitten:c.state==='kitten'})),dogs:[...d.dogs.values()].map(view),
        wolves:window.__looksWolves.map(id=>{const w=s.animalSystem.animals.get(id);w.view.animate(16,false,{x:0,y:1});return {id,look:w.view.look,art:!!w.view.art?.visible};})};});
    for(const c of state.cats){assert.equal(c.figure,false,'the drawn cat is hidden');assert.equal(c.look,c.kitten?'cat-kitten':c.look);assert.ok(c.kitten||c.look!=='cat-kitten');}
    assert.match(state.dogs[1].texture,/pose:.*:sit$|walk/);assert.match(state.dogs[2].texture,/wounded|walk/);
    assert.ok(state.dogs.every(d=>/^dog-(hound|sheepdog|mastiff)$/.test(d.look)));
    await page.waitForFunction(ids=>ids.every(id=>{const w=window.__game.registry.get('application').scene.animalSystem.animals.get(id);w?.view.animate(16,false,{x:0,y:1});return w?.view.art?.visible;}),state.wolves.map(w=>w.id),{timeout:20000});
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/animal-looks.png`});
    // Save and load: every animal keeps its look (it follows the id, nothing new in the save).
    const before=Object.fromEntries([...state.cats,...state.dogs].map(a=>[a.id,a.look]));
    await page.evaluate(async()=>{const app=window.__game.registry.get('application'),save=app.snapshot(),ready=app.onGameReady.bind(app);window.__looksReady=false;app.onGameReady=s=>{ready(s);window.__looksReady=true;app.onGameReady=ready;};await app.load(save);});
    await page.waitForFunction(()=>window.__looksReady);
    const after=await page.waitForFunction(ids=>{const s=window.__game.registry.get('application').scene,d=s.domestic;s.domesticViews.update(16);const out={};for(const id of ids){const a=d.cats.get(id)??d.dogs.get(id);if(!a?.view?.look)return false;out[id]=a.view.look;}return out;},Object.keys(before),{timeout:20000}).then(h=>h.jsonValue());
    assert.deepEqual(after,before,'looks kept after Load');
    console.log(`PASS animal looks: ${state.cats.length} cats (kitten look for the kitten), ${state.dogs.length} dogs (sit and wounded poses), ${state.wolves.length} wolves drawn with approved Studio looks; looks follow the id and survive Save/Load (${[...new Set(Object.values(before))].join(', ')})`);
  }finally{await page.close();}
}
