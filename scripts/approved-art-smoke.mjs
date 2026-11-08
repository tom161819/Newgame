import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// m-nasadit-schvalenou-grafiku + m-animace-rybar in a real page: the art deployed with this update loads without 404s
// and is drawn – a Fisher plays the fishing loop through a catch (cast → sit-idle → bite → reel → store), horses and the
// other wild animals, a Horse Wagon and a Wheelbarrow, the grass zones and shore transitions, a night badge in the event
// feed, the Fire Lab fire on a building and children playing their game loops (tag, hoop). Screenshots in /tmp/shots/ (SMOKE_SHOTS overrides the folder).
export async function approvedArtSmoke(context,url,instrument){
  const shots=process.env.SMOKE_SHOTS??'/tmp/shots';await mkdir(shots,{recursive:true});
  const page=await context.newPage();await instrument?.(page);const missing=[],errors=[];
  page.on('response',r=>{if(r.status()>=400)missing.push(`${r.status()} ${r.url()}`);});page.on('pageerror',e=>errors.push(e.message));
  const shot=async(name,x,y,zoom=1.6)=>{await page.evaluate(({x,y,zoom})=>{const s=window.__game.registry.get('application').scene;if(s.worldCamera){s.worldCamera.following=false;s.worldCamera.panTarget=null;}s.cameras.main.setZoom(zoom).centerOn(x,y);},{x,y,zoom});await page.waitForTimeout(400);await page.screenshot({path:`${shots}/${name}.png`});};
  try{
    await page.setViewportSize({width:1280,height:800});await page.goto(url);
    await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.fishing&&window.__game.registry.get('application').scene.minimap);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility();s.employment?.setEnabled?.(false);s.foodSystem.eat=()=>true;});

    // ---- Ground: the zone and transition strips load and the terrain repaints with them.
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return ['meadow','lush','dry','forest','flowers','stony'].every(z=>s.textures.exists(`ground-zone:${z}:summer`))&&['water-grass','water-sand','sand-grass'].every(p=>s.textures.exists(`ground-transition:${p}`));},null,{timeout:30000});

    // ---- Fisher: a hut beside the nearest shore, one Fisher, the loop recorded while he fishes and catches one fish.
    const fisher=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('fisherman_hut'),c=s.character.tile;let best=null;
      const free=t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.buildings.some(b=>b.tiles.some(p=>p.x===t.x&&p.y===t.y));
      for(let y=2;y<96;y++)for(let x=2;x<96;x++){const tiles=[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>({x:x+dx,y:y+dy}));if(!tiles.every(free))continue;
        const near=[-2,-1,2,3].some(k=>[0,1].some(j=>s.map[y+j]?.[x+k]===2||s.map[y+k]?.[x+j]===2));if(!near)continue;const d2=Math.hypot(x-c.x,y-c.y);if(!best||d2<best.d)best={x,y,tiles,d:d2};}
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'fisherman_hut',definition:d,x:best.x,y:best.y,tiles:best.tiles};
      s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');
      const w=[...s.workerSystem.workers.values()].find(w=>w.isAlive&&w.isSubject!==false);s.workplaceSystem.assign(b,w);w.position={x:best.x+2.5,y:best.y+.5};w.tile={x:best.x+2,y:best.y};w.path=[];w.nextTile=null;
      return {worker:w.id};
    });
    await page.waitForFunction(id=>{const w=window.__game.registry.get('application').scene.workerSystem.workers.get(id);return w.workTask?.kind==='fish'&&w.workState==='Working';},fisher.worker,{timeout:120000});
    // Frames change only on screen: look at the Fisher.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);if(s.worldCamera){s.worldCamera.following=false;s.worldCamera.panTarget=null;}s.cameras.main.centerOn(w.view.x,w.view.y);},fisher.worker);
    await page.waitForFunction(id=>{const v=window.__game.registry.get('application').scene.workerSystem.workers.get(id).view;return v.fishArt?.visible&&v.fishArt.texture.key.startsWith('fishing-anim:');},fisher.worker,{timeout:30000}).catch(async e=>{
      throw Error(`${e.message}: ${JSON.stringify(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id),v=w.view;return {prof:w.profession,state:w.workState,walking:w.walking,next:w.nextTile,path:w.path.length,pos:w.position,goal:w.workTask?.goal,fishing:w.fishingView,has:typeof v.setFishing,tex:s.textures.exists('fishing-anim:male')||s.textures.exists('fishing-anim:female'),art:!!v.fishArt,vis:v.visible,anim:v.fishAnimator?.clip};},fisher.worker))}`);});
    await page.evaluate(id=>{const v=window.__game.registry.get('application').scene.workerSystem.workers.get(id).view,a=v.fishAnimator,update=a.update.bind(a);window.__clips=[];
      a.update=(d,info)=>{const r=update(d,info);if(r&&window.__clips.at(-1)!==r.clip)window.__clips.push(r.clip);return r;};},fisher.worker);
    await page.waitForFunction(()=>window.__clips.includes('sit-idle'),null,{timeout:20000});
    const p=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return {x:s.map.length*32+(w.position.x-w.position.y)*32,y:128+(w.position.x+w.position.y)*16,caught:w.workTask.caught};},fisher.worker);
    await shot('approved-art-fisher-wait',p.x,p.y-20,2.4);
    await page.evaluate(id=>{const w=window.__game.registry.get('application').scene.workerSystem.workers.get(id);w.workTask.fraction=Math.max(w.workTask.fraction,1.01);},fisher.worker);
    await page.waitForFunction(()=>window.__clips.includes('reel'),null,{timeout:20000});await shot('approved-art-fisher-reel',p.x,p.y-20,2.4);
    await page.waitForFunction(()=>{const c=window.__clips,i=c.indexOf('bite');return i>=0&&c.slice(i).includes('cast');},null,{timeout:20000});
    const clips=await page.evaluate(()=>window.__clips.slice());const bite=clips.indexOf('bite');
    assert.deepEqual(clips.slice(bite,bite+4),['bite','reel','store','cast'],clips.join(' '));

    // ---- Wild animals: horses, deer, boars and hares show the approved stills.
    const animals=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,out={};
      for(const a of s.animalSystem.animals.values()){if(!a.isAlive||!['horse','deer','wild_boar','rabbit'].includes(a.type))continue;a.view.animate?.(16,false,{x:1,y:0});
        const art=a.view.art;(out[a.type]??=[]).push({id:a.id,key:art?.visible?art.texture.key:null,x:a.view.x,y:a.view.y});}
      return out;});
    for(const type of ['horse','deer','wild_boar','rabbit'])assert.ok(animals[type]?.length,`${type} in the world`);
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return [...s.animalSystem.animals.values()].filter(a=>a.isAlive&&['horse','deer','wild_boar','rabbit'].includes(a.type)).every(a=>{a.view.animate?.(16,false,{x:1,y:0});return a.view.art?.visible&&a.view.art.texture.key.startsWith('deploy-art:/assets/characters/wildlife/');});},null,{timeout:30000});
    const horse=animals.horse[0];await shot('approved-art-horse',horse.x,horse.y-20,2.4);

    // ---- Vehicles: a parked Horse Wagon and Wheelbarrow beside the King.
    const vehicles=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,k=s.character.tile;const w=s.vehicles.create('horse_wagon',{x:k.x+3,y:k.y+1}),b=s.vehicles.create('wheelbarrow',{x:k.x+1,y:k.y+3});return {wagon:w.id,barrow:b.id};});
    await page.waitForFunction(v=>{const s=window.__game.registry.get('application').scene;s.vehicleViews?.update?.();const a=s.vehicleViews.views.get(v.wagon),b=s.vehicleViews.views.get(v.barrow);return a?.texture.key==='deploy-art:/assets/vehicles/horse_wagon/horse-wagon-farm-empty.v4.png'&&b?.texture.key==='deploy-art:/assets/vehicles/wheelbarrow/wheelbarrow-plank-empty.v1.png';},vehicles,{timeout:30000});
    const wv=await page.evaluate(v=>{const s=window.__game.registry.get('application').scene,a=s.vehicleViews.views.get(v.wagon);return {x:a.x,y:a.y,w:a.width};},vehicles);
    assert.equal(wv.w,131,'the wagon is drawn at the Studio scale, its horse as big as a standalone horse');
    await shot('approved-art-vehicles',wv.x,wv.y,2.2);

    // ---- Children (dev fill), the night badge in the feed and the Fire Lab fire on the hut.
    await page.evaluate(()=>window.mkDev?.fillChildren?.(4));
    // Children's game loops: three children out play tag (the tunic boy and the braid girl) and hoop (the cap boy); each
    // plays its look's loop in its facing, frame by frame, instead of the key frame.
    await page.waitForFunction(()=>[...window.__game.registry.get('application').scene.childrenSystem.children.values()].filter(c=>c.state==='out').length>=3,null,{timeout:30000});
    const kids=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,cs=s.childrenSystem,out=[...cs.children.values()].filter(c=>c.state==='out').slice(0,3);
      const plan=[['boy',0,'tag','child-play:child-boy-tunic:tag'],['girl',0,'tag','child-play:child-girl-braid:tag'],['boy',1,'hoop','child-play:child-boy-cap:hoop']];
      const k=s.character.tile;return out.map((c,i)=>{const [sex,look,kind,key]=plan[i];c.sex=sex;c.look=look;c.x=k.x+1.5+i*.9;c.y=k.y+2.5;c.local=null;c.path=[];
        c.activity={kind,center:{x:Math.floor(c.x),y:Math.floor(c.y)},until:cs.now()+1e9};return {id:c.id,key};});});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,k=s.character;if(s.worldCamera){s.worldCamera.following=false;s.worldCamera.panTarget=null;}const t=k.tile;s.cameras.main.setZoom(2.6).centerOn(s.map.length*32+(t.x-t.y+.5)*32,128+(t.x+t.y+5)*16);});
    await page.waitForFunction(kids=>{const cs=window.__game.registry.get('application').scene.childrenSystem;return kids.every(({id,key})=>{const a=cs.children.get(id)?.view?.art;return a?.visible&&a.texture.key===key;});},kids,{timeout:30000}).catch(async e=>{
      throw Error(`${e.message}: ${JSON.stringify(await page.evaluate(kids=>{const cs=window.__game.registry.get('application').scene.childrenSystem;return kids.map(({id})=>{const c=cs.children.get(id),a=c?.view?.art;return {state:c?.state,kind:c?.activity?.kind,vis:c?.view?.visible,key:a?.texture.key};});},kids))}`);});
    const frames=new Set();for(let i=0;i<8;i++){frames.add(await page.evaluate(id=>window.__game.registry.get('application').scene.childrenSystem.children.get(id).view.art.frame.name,kids[0].id));await page.waitForTimeout(130);}
    assert.ok(frames.size>=2,`the tag loop animates (frames ${[...frames].join(',')})`);
    await page.screenshot({path:`${shots}/children-play.png`});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.eventFeed.push('wolves-near:999','Wolves are near the village.');});
    await page.waitForFunction(()=>{const img=document.querySelector('#event-feed .feed-icon');return img&&img.complete&&img.naturalWidth>0;},null,{timeout:15000});
    const fire=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.type==='fisherman_hut');s.nightThreats.ignite(b);s.fireViews.update(16);const g=s.fireViews.views.get(b.id);return {model:!!g?.model,x:g.x,y:g.y};});
    assert.ok(fire.model,'the burning building uses the Fire Lab model');await page.waitForTimeout(5000);await shot('approved-art-fire',fire.x,fire.y+40,2);
    const flames=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=[...s.fireViews.views.values()][0];return g?g.model.flames.length+g.model.smoke.length:-1;});assert.ok(flames!==0,`${flames} flame and smoke particles (−1: already put out)`);
    // Summer shores use the approved marching-squares transition tiles.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.terrain.seasonMix=()=>null;s.terrain.setSeason('Summer');});await shot('approved-art-shore-summer',p.x,p.y,1.6);

    // ---- No deployed texture failed to load.
    assert.deepEqual(missing.filter(m=>/\/assets\//.test(m)),[],'no 404s');assert.deepEqual(errors,[]);
    console.log(`PASS Approved art: Fisher loop ${clips.join(' → ')}; ${Object.entries(animals).map(([t,l])=>`${l.length} ${t}`).join(', ')} with Studio looks; Horse Wagon and Wheelbarrow art; zones and shore transitions loaded; night badge in the feed; Fire Lab fire; children play tag (boy + girl loops) and hoop, frames ${[...frames].join(",")}; screenshots in ${shots}`);
  }finally{await page.close();}
}
