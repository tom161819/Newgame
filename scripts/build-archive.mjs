import { execFileSync,spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadStream } from 'node:fs';
import { openSync,closeSync } from 'node:fs';
import { mkdir,readFile,writeFile,cp,rm,symlink,stat,mkdtemp,rename } from 'node:fs/promises';
import { projectBase,digest,fileHashes,verifySnapshot,recordsIn,archiveRuntime,archiveIndex,releaseMetadata } from './archive-lib.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const base=projectBase(option('--base','/Newgame/')),ref=option('--through','HEAD'),archives=path.join(root,'public/versions');
const git=(...params)=>execFileSync('git',params,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).trim();
if(git('rev-parse','--is-shallow-repository')==='true')throw new Error('Archiv vyžaduje úplnou historii Git; použij checkout s fetch-depth: 0.');
const through=git('rev-parse','--verify',`${ref}^{commit}`),commits=git('rev-list','--reverse','--first-parent',through).split('\n');
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
const workspace=await mkdtemp(path.join(tmpdir(),'newgame-version-archive-')),logs=path.join(workspace,'logs');await mkdir(logs);
const rootLock=digest(await readFile(path.join(root,'package-lock.json'))),existing=new Map((await recordsIn(archives)).map(r=>[r.commit,r]));
const results=[],skipped=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
let activeDirectory=null,activeURL=null;
const server=createServer(async(request,response)=>{
  try{
    const requested=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    if(!activeDirectory||!requested.startsWith(activeURL)){response.writeHead(404).end();return;}
    let relative=requested.slice(activeURL.length);if(!relative||relative.endsWith('/'))relative+='index.html';
    const file=path.resolve(activeDirectory,relative);if(!file.startsWith(activeDirectory+path.sep)){response.writeHead(403).end();return;}
    const info=await stat(file);if(!info.isFile()){response.writeHead(404).end();return;}response.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');response.setHeader('Content-Length',info.size);createReadStream(file).pipe(response);
  }catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
function run(command,params,cwd,log){
  const fd=openSync(log,'a');try{const result=spawnSync(command,params,{cwd,stdio:['ignore',fd,fd],env:process.env});if(result.status!==0)throw new Error(`${command} ${params.join(' ')} selhal (${result.status??result.error?.message}); log ${log}`);}finally{closeSync(fd);}
}
async function dependencies(source){
  const lock=digest(await readFile(path.join(source,'package-lock.json')));
  let modules=path.join(root,'node_modules');
  try{if(lock!==rootLock)throw new Error('Different lock');await stat(path.join(modules,'vite'));}catch{
    const cache=path.join(workspace,'dependencies',lock);modules=path.join(cache,'node_modules');
    try{await stat(path.join(modules,'vite'));}catch{await mkdir(cache,{recursive:true});await cp(path.join(source,'package.json'),path.join(cache,'package.json'));await cp(path.join(source,'package-lock.json'),path.join(cache,'package-lock.json'));run('npm',['ci'],cache,path.join(logs,`dependencies-${lock}.log`));}
  }
  await symlink(modules,path.join(source,'node_modules'),'dir');
}
async function browserCheck(directory,url){
  activeDirectory=directory;activeURL=url;const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  try{
    await page.goto(`http://127.0.0.1:${port}${url}`,{waitUntil:'networkidle',timeout:30000});
    if(await page.locator('#new-game').count())await page.locator('#new-game').click();
    await page.locator('canvas').waitFor({state:'visible',timeout:30000});await page.waitForTimeout(450);
    await page.waitForFunction(()=>[...document.images].filter(image=>image.getAttribute('src')).every(image=>image.complete&&image.naturalWidth>0));
    const rendered=await page.locator('canvas').evaluate(canvas=>{
      const context=canvas.getContext('2d');if(!context)return canvas.width>0&&canvas.height>0;
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;let first=null;
      for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]){const color=pixels[i]*65536+pixels[i+1]*256+pixels[i+2];if(first===null)first=color;else if(first!==color)return true;}return false;
    });if(!rendered)throw new Error('Hra nevykreslila mapu.');if(errors.length)throw new Error(errors.join('\n'));
  }finally{await context.close();activeDirectory=null;activeURL=null;}
}
try{
  await mkdir(archives,{recursive:true});
  for(let i=0;i<commits.length;i++){
    const commit=commits[i],short=commit.slice(0,7);if(existing.has(commit)){console.log(`[${i+1}/${commits.length}] ${short} existující neměnný archiv ověřen`);continue;}
    const source=path.join(workspace,short),log=path.join(logs,`${short}.log`),url=`${base}versions/${commit}/`;await mkdir(source);
    try{
      const tar=path.join(workspace,`${short}.tar`);execFileSync('git',['archive','--format=tar','--output',tar,commit],{cwd:root});execFileSync('tar',['-xf',tar,'-C',source]);await rm(tar);
      const pkg=JSON.parse(await readFile(path.join(source,'package.json'),'utf8'));if(!pkg.scripts?.build)throw new Error('Commit neobsahuje sestavitelnou hru.');
      const subject=git('show','-s','--format=%s',commit),metadata=await releaseMetadata(source,commit,subject);
      // Archiv nesmí při budoucím archivování obsahovat další vnořený archiv.
      await rm(path.join(source,'public/versions'),{recursive:true,force:true});await dependencies(source);
      if(pkg.scripts.test)run('npm',['test'],source,log);run('npm',['run','build','--',`--base=${url}`],source,log);
      const built=path.join(source,'dist');await writeFile(path.join(built,'archive-runtime.js'),archiveRuntime(commit,base));
      const index=path.join(built,'index.html'),html=await readFile(index,'utf8');if(!/<head(?:\s[^>]*)?>/i.test(html))throw new Error('Chybí HTML head.');
      await writeFile(index,html.replace(/<head(?:\s[^>]*)?>/i,head=>`${head}<link rel="icon" href="data:,"><script src="${url}archive-runtime.js"></script>`));
      await browserCheck(built,url);
      const record={schema:1,commit,tree:git('rev-parse',`${commit}^{tree}`),date:git('show','-s','--format=%aI',commit),sequence:i+1,subject,...metadata,basePath:url,
        verification:{tests:!!pkg.scripts.test,build:true,browser:true},files:await fileHashes(built)};
      await writeFile(path.join(built,'snapshot.json'),JSON.stringify(record,null,2)+'\n');const temporary=path.join(archives,`.pending-${commit}`);await cp(built,temporary,{recursive:true});await rename(temporary,path.join(archives,commit));
      await verifySnapshot(path.join(archives,commit),commit);results.push(record);console.log(`[${i+1}/${commits.length}] ${short} build + testy + skutečný prohlížeč OK · ${metadata.name}`);
    }catch(error){skipped.push({commit,error:error.message,log});console.log(`[${i+1}/${commits.length}] ${short} NEDOSTUPNÉ: ${error.message}`);}
    await rm(source,{recursive:true,force:true});
  }
  const records=await recordsIn(archives);await writeFile(path.join(archives,'index.html'),archiveIndex(records,base));
  await writeFile(path.join(archives,'versions.json'),JSON.stringify(records.map(({files,...record})=>record).sort((a,b)=>b.sequence-a.sequence),null,2)+'\n');
  await writeFile(path.join(workspace,'report.json'),JSON.stringify({through,records:records.length,created:results.map(r=>r.commit),skipped},null,2));
  console.log(`Dokončeno: ${records.length} verzí, ${results.length} nových, ${skipped.length} vynechaných. Report a logy: ${workspace}`);
  if(skipped.length)process.exitCode=1;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
