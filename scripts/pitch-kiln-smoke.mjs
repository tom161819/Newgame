import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright-core'));}catch{({chromium}=require('/tmp/perfdiag/node_modules/playwright-core'));}
import { createServer } from 'node:http';import { readFile } from 'node:fs/promises';import { extname,join } from 'node:path';
// Owner 13 Nov: "the Pitch Maker makes the first batch and then nothing". A kiln with a warehouse, wood in the stores
// and a Pitch Maker runs for several game days; the test prints how much Pitch and Torches exist over time.
const dist=process.env.DIST??'dist',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]).replace(/^\/Newgame/,'');if(p.endsWith('/'))p+='index.html';try{const b=await readFile(join(dist,p));res.writeHead(200,{'content-type':types[extname(p)]??'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end();}}).listen(0);
const url=`http://127.0.0.1:${server.address().port}/Newgame/`;
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});const context=await browser.newContext({viewport:{width:1400,height:900}});const page=await context.newPage();
await context.addInitScript(()=>{try{localStorage.setItem('newgame.tutorial','off');}catch{}});
await page.route('**/assets/index-*.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/new ([\w$]+)\.Game\(/,'window.__game = new $1.Game(')});});
// Places a blueprint through the game's own click handler on the first free tile near the castle.
const placeBlueprint=(page,type)=>page.evaluate(type=>{const s=window.__game.registry.get('application').scene,def=s.objectRegistry.require(type);
  for(const [id,n] of Object.entries(def.cost??{}))if(s.inventory.count(id)<n)s.inventory.add(id,n-s.inventory.count(id));
  const before=s.buildings.length,c=s.character.tile,orig=s.pointerTile;
  for(let r=4;r<20;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    s.selectedBuilding=def;s.buildMode=true;s.pointerTile=()=>({x:c.x+dx,y:c.y+dy});
    try{s.handleClick({rightButtonDown:()=>false,leftButtonDown:()=>true,updateWorldPoint(){}},true);}catch(e){}
    s.pointerTile=orig;if(s.buildings.length>before){s.cancelBuilding?.();return {id:s.buildings.at(-1).id};}}
  throw new Error('no site');},type);
const finish=(id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
await page.goto(url);await page.waitForFunction(()=>window.__game?.registry.get('application'));
await page.evaluate(()=>{const app=window.__game.registry.get('application');app.start(null,{...app.setup.value(),worldCode:'MKW5-155515555555-1'});});
await page.waitForFunction(()=>window.__game.registry.get('application').scene?.lightFuel&&window.__game.registry.get('application').scene?.workerSystem);await page.waitForTimeout(1500);
await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;const s=window.__game.registry.get('application').scene;s.inventory.add('wood',80);s.inventory.add('stone',40);s.updateInventory();s.fog?.setEnabled?.(false);});
await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;if(!s.playerPaused)s.speedControls.togglePause();});
const kiln=await placeBlueprint(page,'pitch_kiln');await finish(kiln.id);
const wh=await placeBlueprint(page,'warehouse');await finish(wh.id);
await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',80);s.updateInventory();});
const hauler=process.env.HAULER==='1';
await page.evaluate(({id,hauler})=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);const free=s.workerSystem.liveSubjects().filter(w=>!w.assignedWorkplaceId);
  s.workplaceSystem.assign?.(free[0],b)??s.workerSystem.jobs.assign(free[0],'pitch_maker');if(hauler)s.workerSystem.jobs.assign(free[1],'hauler');
  if(s.playerPaused)s.speedControls.togglePause();s.speedControls?.setSpeed?.(5);},{id:kiln.id,hauler});
let made=0,stuck=0,last=null,fail=null;
for(let i=0;i<Number(process.env.STEPS??16);i++){
  await page.waitForTimeout(10000);
  const row=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,r=s.foodProduction.records.get(id),st=s.foodStorage;
    const w=s.workerSystem.liveWorkers().find(w=>w.assignedWorkplaceId===id);
    return {t:Math.round(s.gameTime.totalElapsed/1000),pitch:st.available('pitch'),torch:st.available('torch'),wood:st.available('wood'),recipe:r?.recipe,cycle:r?.cycle?Math.round(r.cycle.progress*100):null,
      input:st.locations.get(`input-${id}`)?.stock,output:st.locations.get(`output-${id}`)?.stock,worker:w&&`${w.profession}:${w.workState}:${w.workMessage}`,made:r?.nextCycle};},kiln.id);
  console.log(JSON.stringify(row));
  // Stuck = no batch running, products lying in the output buffer and the Pitch Maker not resting, three samples in a row.
  stuck=!row.cycle&&Object.values(row.output??{}).some(n=>n>0)&&!/Resting/.test(row.worker)?stuck+1:0;if(stuck>=3)fail='output buffer stuck';
  made=row.made;
}
if(!fail&&made<6)fail=`only ${made} batches`;
console.log(fail?`FAIL Pitch Kiln: ${fail}`:`PASS Pitch Kiln: ${made} batches, keeps producing after the recipe switches`);
await browser.close();server.close();process.exit(fail?1:0);
