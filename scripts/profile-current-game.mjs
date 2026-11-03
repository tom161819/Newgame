import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { browserRuntime } from './browser-runtime.mjs';
const args=process.argv.slice(2),option=name=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3),directory=path.resolve(option('site')??'dist'),base='/Newgame/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{let relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!relative.startsWith(base)){res.writeHead(404).end();return;}relative=relative.slice(base.length);if(!relative||relative.endsWith('/'))relative+='index.html';const file=path.resolve(directory,relative);if(!file.startsWith(directory+path.sep)){res.writeHead(403).end();return;}await stat(file);res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
  const runtime=await browserRuntime();browser=await runtime.chromium.launch({executablePath:runtime.executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],errors=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(()=>{let state=77123;Math.random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32);});
  await page.route('**/assets/index-*.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/new ([\w$]+)\.Game\(/,'window.__game = new $1.Game(')});});
  const started=Date.now();await page.goto(`http://127.0.0.1:${server.address().port}${base}`);await page.locator('#new-game').click();await page.locator('.setup-advanced summary').click();await page.locator('#setup-fog').uncheck();await page.locator('#setup-respawn').selectOption('off');await page.locator('#setup-stones').evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#start-game').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
  const sceneReadyMs=Date.now()-started;await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;for(const w of s.workerSystem.liveWorkers())w.aiCooldown=1e8;for(const a of s.animalSystem.animals.values())a.wanderWait=1e8;});
  const sample=()=>page.evaluate(async()=>{const intervals=[];await new Promise(resolve=>{let last;const frame=time=>{if(last!==undefined)intervals.push(time-last);last=time;if(intervals.length<180)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});const sorted=[...intervals].sort((a,b)=>a-b),mean=intervals.reduce((a,b)=>a+b)/intervals.length;return {frames:intervals.length,meanMs:+mean.toFixed(3),p95Ms:+sorted[Math.floor(sorted.length*.95)].toFixed(3),fps:+(1000/mean).toFixed(2)};});
  const coldCatalogRequests=requests.filter(url=>url.includes('/versions/catalog.json')).length,initialSnapshotRows=await page.locator('#archive-snapshot-list > article').count(),cold=await sample();
  await page.evaluate(async()=>{await window.__game.registry.get('application').archive.open();document.querySelector('#archive-snapshot-count').closest('details').open=true;});await page.waitForFunction(()=>document.querySelector('#archive-snapshot-list').childElementCount>0);await page.evaluate(()=>window.__game.registry.get('application').archive.close(false));
  const closedSnapshotRows=await page.locator('#archive-snapshot-list > article').count(),afterArchive=await sample(),historicalGameRequests=requests.filter(url=>/\/versions\/[a-f0-9]{40}\//.test(url)).length;
  assert.equal(historicalGameRequests,0);assert.deepEqual(errors,[]);const report={site:directory,sceneReadyMs,seed:77123,viewport:[1440,1000],coldCatalogRequests,initialSnapshotRows,closedSnapshotRows,historicalGameRequests,cold,afterArchive};if(option('report'))await writeFile(option('report'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
