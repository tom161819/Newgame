import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// velke-prirodni-objekty in a real page: a New Game from a fixed world code has thickets, rock obstacles, ridges and
// large (3 × 3) deposits; each is drawn as ONE approved atlas sprite placed on its footprint centre and sorted by its
// front tile (the screenshots carry a second copy with the footprint outlined); thickets and ridges change with the
// season, a large deposit falls back to the medium pile once mined below two thirds, and Save/Load keeps them all.
// Screenshots in /tmp/shots/ (SMOKE_SHOTS overrides the folder).
const CODE='MKW5-155515555555-7KQ9X2';
export async function bigNatureSmoke(context,url,instrument){
  const shots=process.env.SMOKE_SHOTS??'/tmp/shots';await mkdir(shots,{recursive:true});
  const page=await context.newPage();await instrument?.(page);const missing=[],errors=[];
  page.on('response',r=>{if(r.status()>=400)missing.push(`${r.status()} ${r.url()}`);});page.on('pageerror',e=>errors.push(e.message));
  // Centre the camera on a footprint, let the terrain draw, then shoot it plain and with the footprint outlined.
  const shoot=async(name,g,zoom=2.4)=>{
    await page.evaluate(({g,zoom})=>{const s=window.__game.registry.get('application').scene;if(s.worldCamera){s.worldCamera.following=false;s.worldCamera.panTarget=null;}
      const p=s.map.length*32+(g.x+g.w/2-(g.y+g.h/2))*32,q=128+(g.x+g.w/2+g.y+g.h/2)*16;s.cameras.main.setZoom(zoom).centerOn(p,q-20);s.terrain.lastView='';},{g,zoom});
    await page.waitForTimeout(1200);await page.screenshot({path:`${shots}/${name}.png`});
    await page.evaluate(g=>{const s=window.__game.registry.get('application').scene,o=s.map.length*32,c=(x,y)=>({x:o+(x-y)*32,y:128+(x+y)*16});
      const line=s.add.graphics().setDepth(1e6);line.lineStyle(2,0xff2020,1);line.strokePoints([c(g.x,g.y),c(g.x+g.w,g.y),c(g.x+g.w,g.y+g.h),c(g.x,g.y+g.h)],true,true);window.__outline=line;},g);
    await page.waitForTimeout(150);await page.screenshot({path:`${shots}/${name}-footprint.png`});await page.evaluate(()=>window.__outline?.destroy());
  };
  // The drawn sprite of a group: its frame, position and depth against the footprint (centre and front tile).
  const drawn=g=>page.evaluate(g=>{const s=window.__game.registry.get('application').scene,sprite=s.terrain.groupSprites.get(`${g.kind}:${g.x},${g.y}`);
    if(!sprite?.visible)return null;const o=s.map.length*32,centre={x:o+(g.x+g.w/2-g.y-g.h/2)*32,y:128+(g.x+g.w/2+g.y+g.h/2)*16},front=128+(g.x+g.w-1+.5+g.y+g.h-1+.5)*16;
    return {w:sprite.displayWidth,frame:sprite.frame.name,key:sprite.texture.key,dx:sprite.x-centre.x,dy:sprite.y-centre.y,depth:sprite.depth-front};},g);
  try{
    await page.setViewportSize({width:1280,height:800});await page.goto(url);
    await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill(CODE);await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.naturalResources&&window.__game.registry.get('application').scene.minimap);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility();s.employment?.setEnabled?.(false);s.foodSystem.eat=()=>true;});
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.textures.exists('nature-atlas'),null,{timeout:30000});

    // ---- The world has every kind; pick the largest thicket, a ridge, a 2 × 2 rock group and both large deposits near the King.
    const found=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,k=s.character.tile,near=o=>Math.hypot(o.x-k.x,o.y-k.y),by=(a,b)=>b.w*b.h-a.w*a.h||near(a)-near(b);
      const groups=[...s.natureGroups],deposits=s.naturalResources.mining.deposits();
      const pick=list=>list.sort(by)[0]??null,dep=type=>{const d=deposits.filter(d=>d.type===type).sort((a,b)=>near(a)-near(b))[0];return d?{id:d.natural.id,x:d.x,y:d.y,w:3,h:3,key:`${d.x},${d.y}`}:null;};
      return {count:groups.length,thickets:groups.filter(g=>g.kind==='thicket').map(g=>`${g.w}x${g.h}`),thicket:pick(groups.filter(g=>g.kind==='thicket')),
        ridge:pick(groups.filter(g=>g.kind==='rocks'&&g.w===4)),obstacle:pick(groups.filter(g=>g.kind==='rocks'&&g.w===2)),stone:dep('stone_deposit_large'),iron:dep('iron_deposit_large')};});
    for(const key of ['thicket','ridge','obstacle','stone','iron'])assert.ok(found[key],`a ${key} in world ${CODE}`);
    for(const size of ['2x1','2x2','3x2'])assert.ok(found.thickets.includes(size),`a ${size} thicket (${found.thickets.join(' ')})`);

    // ---- One sprite per group, on the footprint centre, sorted by the front tile; the parts are not drawn as well.
    for(const [name,g,pattern] of [['thicket',found.thicket,new RegExp(`^thicket-${found.thicket.w}x${found.thicket.h}-(hazel|bramble)$`)],['ridge',found.ridge,/^rock-ridge-(granite|slate)$/],['obstacle',found.obstacle,/^rock-obstacles-medium-/]]){
      await shoot(`big-nature-${name}`,g);
      const d=await drawn(g);if(process.env.SMOKE_DEBUG)console.log(name,JSON.stringify(g),JSON.stringify(d));assert.ok(d,`${name} drawn as one sprite`);assert.equal(d.key,'nature-atlas');assert.match(d.frame,pattern,name);
      assert.ok(Math.abs(d.dx)<.01&&Math.abs(d.dy)<.01,`${name} at its footprint centre (${JSON.stringify(d)})`);assert.ok(d.depth>=0&&d.depth<1,`${name} sorted by its front tile (${JSON.stringify(d)})`);
      const parts=await page.evaluate(g=>{const s=window.__game.registry.get('application').scene,t=s.terrain;let n=0;for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++)if(t.bushSprites.get(`${x},${y}`)?.visible||t.tiles.get(`${x},${y}`)?.visible)n++;return n;},g);
      assert.equal(parts,0,`${name}: its bushes or rocks are not drawn one by one`);
    }
    // ---- Seasons: autumn and winter thickets, a snowy ridge.
    for(const season of ['Autumn','Winter']){
      await page.evaluate(season=>{const s=window.__game.registry.get('application').scene;s.terrain.setSeason(season);},season);
      await shoot(`big-nature-thicket-${season.toLowerCase()}`,found.thicket);
      assert.equal((await drawn(found.thicket))?.frame,`thicket-${found.thicket.w}x${found.thicket.h}-${season.toLowerCase()}`);
    }
    await shoot('big-nature-ridge-winter',found.ridge);assert.equal((await drawn(found.ridge))?.frame,'rock-ridge-winter');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.terrain.setSeason(s.seasons.season);});

    // ---- Large deposits: the large pile while rich, the medium pile below two thirds.
    const deposit=async(d,name,large)=>{await shoot(`big-nature-${name}`,d,2);
      const look=await page.evaluate(key=>{const s=window.__game.registry.get('application').scene,v=s.resources.get(key);return {frame:v.art.visible?v.art.frame.name:null,tiles:v.getData('object').tiles.length};},d.key);
      assert.equal(look.tiles,9);assert.equal(look.frame,large,`${name} shows the large pile`);};
    await deposit(found.stone,'stone-deposit-large','stone-deposit-large-granite-7');await deposit(found.iron,'iron-deposit-large','iron-deposit-large-red-7');
    const mined=await page.evaluate(key=>{const s=window.__game.registry.get('application').scene,v=s.resources.get(key),o=v.getData('object');o.natural.remaining=Math.floor(o.natural.max*.6);v.setNaturalState(o);return v.art.frame.name;},found.stone.key);
    assert.match(mined,/^stone-deposit-medium-/,'mined below two thirds: the medium pile');await shoot('big-nature-stone-deposit-mined',found.stone,2);

    // ---- Save/Load keeps the groups and the large deposits; they are drawn again after the load.
    const saved=await page.evaluate(async()=>{const a=window.__game.registry.get('application'),state=a.snapshot();await a.load(state);return state;});
    assert.ok(saved.natureGroups.length===found.count&&saved.resources.filter(r=>r.type.endsWith('_large')).length>=3);
    await page.waitForFunction(()=>window.__game.registry.get('application').scene?.naturalResources&&window.__game.registry.get('application').scene.minimap);
    const loaded=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
    assert.deepEqual(loaded.natureGroups,saved.natureGroups,'groups after Load');assert.deepEqual(loaded.resources.filter(r=>r.type.endsWith('_large')),saved.resources.filter(r=>r.type.endsWith('_large')),'large deposits after Load');
    // The fog setting comes from the save (the smoke turned it off only in the running scene).
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility();});
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.textures.exists('nature-atlas'),null,{timeout:30000});
    await shoot('big-nature-thicket-loaded',found.thicket);assert.ok(await drawn(found.thicket),'the thicket is drawn after Load');
    assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
    console.log(`PASS Big nature: ${found.count} groups (thickets ${[...new Set(found.thickets)].sort().join(', ')}, ridges, 2 × 2 rocks) and large deposits drawn as one sprite on their footprint, seasons, mined-down look, Save/Load`);
  }finally{await page.close();}
}
