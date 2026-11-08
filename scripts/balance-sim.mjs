// m-jidlo-balanc / m-drevo-start: headless 20-day simulation of a default New Game in the real built game (Chromium).
// The default setup (Castle, garrison, starting resources, Auto Employment, normal rations), seeded Math.random; the
// tutorial buildings + 1 Wheat Field are ordered as blueprints in tutorial order on day 1 (2 more Houses so the kingdom
// can grow to 25), then the game's own simulation step runs. Prints one row per day (food made/eaten, food stock, wood,
// gold, happiness, idle residents). Run after a build: node scripts/balance-sim.mjs [--dist=path] [--days=20] [--base=/Newgame/]
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserRuntime } from './browser-runtime.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),arg=(k,d)=>args.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3)??d;
const dist=path.resolve(arg('dist',path.join(root,'dist'))),base=arg('base','/Newgame/'),days=+arg('days',20);
export const BALANCE_SIM_ORDER=['granary','lumberjack_hut','hunting_lodge','fisherman_hut','farmhouse','wheat_field','mill','bakery','house','material_yard','builder_workshop','house','house'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!url.startsWith(base)){res.writeHead(404).end();return;}let rel=url.slice(base.length);if(!rel||rel.endsWith('/'))rel+='index.html';
  const file=path.resolve(dist,rel);if(!file.startsWith(dist+path.sep)||!(await stat(file)).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const runtime=await browserRuntime(),browser=await runtime.chromium.launch({executablePath:runtime.executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{try{localStorage.setItem('newgame.tutorial','off');}catch{}let state=77123;Math.random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32);});
  const page=await context.newPage();
  await page.route('**/assets/index-*.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/new ([\w$]+)\.Game\(/,'window.__game = new $1.Game(')});});
  await page.goto(`http://127.0.0.1:${server.address().port}${base}`);
  await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.military);
  await page.keyboard.press('Escape');
  // Blueprints in order, each as soon as it is affordable (like a player following the tutorial).
  await page.evaluate(order=>{const s=window.__game.registry.get('application').scene;window.__simPlaced=[];window.__simOrder=[...order];
    window.__simPlace=()=>{const c=s.buildings.find(b=>b.type==='castle')??s.character.tile,keepTile=s.pointerTile;
      while(window.__simOrder.length){const id=window.__simOrder[0],d=s.objectRegistry.require(id),center=id==='wheat_field'?s.buildings.find(b=>b.type==='farmhouse'):c;if(!center||!s.inventory.canAfford(d.cost))return;let done=false;
        for(let r=id==='wheat_field'?2:4;r<30&&!done;r++)for(let y=center.y-r;y<=center.y+r&&!done;y++)for(let x=center.x-r;x<=center.x+r&&!done;x++){if(Math.max(Math.abs(x-center.x),Math.abs(y-center.y))!==r)continue;
          s.selectedBuilding=d;s.buildMode=true;s.previewAnchor={x,y};s.previewKey=null;s.updateBuildingPreview();if(!String(s.previewKey).endsWith(':false:null:null'))continue;
          const before=s.buildings.length;s.pointerTile=()=>({x,y});try{s.handleClick({rightButtonDown:()=>false,leftButtonDown:()=>true,updateWorldPoint(){}});}finally{s.pointerTile=keepTile;}
          if(s.buildings.length>before)done=true;}
        s.cancelBuilding?.();if(!done)return;window.__simPlaced.push(`${id}@${s.gameTime.day}`);window.__simOrder.shift();}
    };window.__simPlace();
    // Tutorial steps 2–3: one Builder and one Hauler by hand; Auto Employment staffs the workplaces.
    for(const job of ['builder','hauler']){const w=s.workerSystem.liveSubjects().find(x=>x.profession==='idle');if(w)s.populationSidebar.chooseJob(w.id,job);}
  },BALANCE_SIM_ORDER);
  const rows=await page.evaluate(async days=>{const s=window.__game.registry.get('application').scene,rows=[],start=s.gameTime.day;
    const snap=()=>{const f=s.foodSystem,prev=f.history.find(r=>r.day===s.gameTime.day-1)??{produced:0,consumed:0},subjects=s.workerSystem.liveSubjects();
      return {day:s.gameTime.day-1,made:prev.produced,eaten:prev.consumed,food:f.availablePortions,wood:s.inventory.count('wood'),gold:Math.round(s.inventory.count('gold')),happiness:s.needs?.summary?.()?.happiness??null,residents:subjects.length,idle:subjects.filter(w=>w.profession==='idle').length,
        built:s.buildings.filter(b=>!b.construction||b.construction.state==='complete').length,
        chopped:s.buildings.filter(b=>b.type==='lumberjack_hut').reduce((n,b)=>n+(s.workplaceSystem.records.get(b.id)?.forestry?.harvested??0),0),woodcutters:subjects.filter(w=>w.profession==='woodcutter').length,
        hunters:subjects.filter(w=>w.profession==='hunter').length,fishers:subjects.filter(w=>w.profession==='fisher').length,waits:[...new Set(subjects.filter(w=>w.profession==='woodcutter'&&w.workState==='Waiting').map(w=>w.workMessage))].join('/')};};
    let day=s.gameTime.day;for(let t=0;s.gameTime.day<start+days;t++){s.simulationStep(50);if(t%200===0)window.__simPlace();if(s.gameTime.day!==day){day=s.gameTime.day;rows.push(snap());}if(t%2000===0)await new Promise(r=>setTimeout(r,0));if(s.gameOver)break;}
    return rows;},days);
  const placed=await page.evaluate(()=>window.__simPlaced);
  console.log(JSON.stringify({dist,placed}));
  console.log('day | food made | eaten | food stock | wood stock | wood chopped (total) | gold | happiness | residents | idle | built | woodcutters/hunters/fishers');
  for(const r of rows)console.log([r.day,r.made,r.eaten,r.food,r.wood,r.chopped,r.gold,r.happiness,r.residents,r.idle,r.built,`${r.woodcutters}/${r.hunters}/${r.fishers}${r.waits?' '+r.waits:''}`].join(' | '));
}finally{await browser.close();server.close();}
