import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// m-zvirata-3 (owner 67, 71) in a real page: cats are drawn 1.5× (data CAT_SIZE) next to the King, still smaller
// than a dog; a Bakery is a rat building – rats show in its panel and a cat can be taken in there.
// Screenshot: /tmp/shots/animals-3.png.
export async function animals3Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.domesticViews);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    const bakeryId=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene;s.employment?.setEnabled(false);s.fog?.setEnabled(false);s.refreshVisibility?.();
      const d=s.objectRegistry.require('bakery'),k=s.character.tile;for(const [r,n]of Object.entries(d.cost))if(s.inventory.count(r)<n)s.inventory.add(r,n-s.inventory.count(r));
      if(!s.startBuilding(d))throw Error('Bakery menu unavailable');
      for(let r=4;r<16;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const anchor={x:k.x+dx,y:k.y+dy};s.previewAnchor=anchor;s.previewKey=null;s.updateBuildingPreview();if(!s.previewKey?.endsWith(':false:null:null'))continue;
        const before=s.buildings.length,world={x:s.map.length*32+(anchor.x-anchor.y)*32,y:128+(anchor.x+anchor.y+1)*16};
        s.handleClick({rightButtonDown:()=>false,leftButtonDown:()=>true,updateWorldPoint(){},worldX:world.x,worldY:world.y},true);
        if(s.buildings.length>before){if(s.buildMode)s.cancelBuilding();const b=s.buildings.at(-1);
          if(b.materialSupply){const loc=s.foodStorage.locations.get(s.constructionSystem.materials.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;s.constructionSystem.finish(b);return b.id;}
      }
      throw Error('No site for a Bakery');
    });
    // Rats in the Bakery's flour; a cat taken in there; a second cat and a dog beside the King for the size comparison.
    const info=await page.evaluate(id=>{
      const s=window.__game.registry.get('application').scene,d=s.domestic,b=s.buildings.find(b=>b.id===id),input=`input-${id}`;
      s.foodStorage.deposit(input,'flour',15);d.rats.set(input,50);
      const home=d.newCat({x:b.x+1,y:b.y+3,home:{x:b.x+1,y:b.y+3},state:'stray'}),ok=d.assign(home.id,id);
      const w=s.workerSystem.liveWorkers()[0],k=s.character.tile,p={x:k.x-1.4,y:k.y+.9},cat=d.newCat({x:p.x,y:p.y,home:{x:p.x,y:p.y},state:'stray',facing:{x:1,y:-1}});cat.wait=1e9;cat.target=null;
      const dog=d.newDog({x:p.x-.6,y:p.y+1.1,home:{x:p.x-.6,y:p.y+1.1},state:'stray',leaveAt:1e12});dog.wait=1e9;
      return {ok,home:home.id,cat:cat.id,dog:dog.id,rat:d.ratBuildings().some(r=>r.id===id),homes:d.homes().some(h=>h.id===id),worker:w.id};
    },bakeryId);
    assert.equal(info.rat,true,'the Bakery is a rat building');assert.equal(info.homes,true,'a cat can live at the Bakery');assert.equal(info.ok,true,'Take in to the Bakery');
    await page.waitForFunction(id=>{const v=window.__game.registry.get('application').scene.domestic.cats.get(id)?.view;return v?.art?.visible;},info.cat,{timeout:15000});
    const size=await page.evaluate(({cat,dog,worker})=>{
      const s=window.__game.registry.get('application').scene,c=s.domestic.cats.get(cat).view;
      if(s.worldCamera){s.worldCamera.following=false;s.worldCamera.panTarget=null;}s.cameras.main.setZoom(1.8);s.cameras.main.centerOn(c.x,c.y-20);
      const g=s.domestic.dogs.get(dog).view,w=s.workerSystem.workers.get(worker);
      const box=o=>{const b=o.getBounds();return {w:b.width,h:b.height};};
      return {scale:c.scaleX,cat:box(c.art),dog:g?.art?.visible?box(g.art):null};void w;
    },info);
    assert.equal(size.scale,1.5,'cats drawn at 1.5× (CAT_SIZE.adult)');
    // The art frames share one 67 px width; on screen the cat's frame is 1.5× the dog's (content: cat 39 px vs hound 41 px wide).
    if(size.dog)assert.ok(Math.abs(size.cat.w/size.dog.w-1.5)<.05,`frame ratio ${JSON.stringify(size)}`);
    // The Bakery panel shows its rats and the cat.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.workplacePanel.open(s.buildings.find(b=>b.id===id));},bakeryId);
    const line=await page.locator('#workplace-rats').textContent();assert.match(line,/Rats: Many|Krysy:/);assert.match(line,/cats 1 \/ 1|kočky 1 \/ 1/);
    await page.evaluate(()=>window.__game.registry.get('application').scene.workplacePanel.close());
    const dir=process.env.SMOKE_SHOTS??'/tmp/shots';await mkdir(dir,{recursive:true});await page.waitForTimeout(1500);await page.screenshot({path:`${dir}/animals-3.png`});
    assert.deepEqual(errors,[]);
    console.log(`PASS animals-3: cat drawn ×${size.scale} beside the King (frame ${Math.round(size.cat.w)}×${Math.round(size.cat.h)} px in world px${size.dog?`, dog ${Math.round(size.dog.w)}×${Math.round(size.dog.h)}`:''}), Bakery is a rat building, cat taken in there, panel: "${line.trim()}"; screenshot ${dir}/animals-3.png`);
  }finally{await page.close();}
}
