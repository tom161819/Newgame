import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile,stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { recordsIn,verifyCatalog,digest } from './archive-lib.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),site=path.resolve(root,'dist'),source=path.join(root,'public/versions'),records=await recordsIn(source),staged=await recordsIn(path.join(site,'versions'));
assert.equal(staged.length,records.length);for(const original of records){const copy=staged.find(r=>r.commit===original.commit);assert.deepEqual(copy,original);assert.equal(await readFile(path.join(site,'versions',original.commit,'snapshot.json'),'utf8'),await readFile(path.join(source,original.commit,'snapshot.json'),'utf8'));}
const metadata=JSON.parse(await readFile(path.join(site,'versions/versions.json'),'utf8')),index=await readFile(path.join(site,'versions/index.html'),'utf8'),catalog=JSON.parse(await readFile(path.join(site,'versions/catalog.json'),'utf8'));verifyCatalog(records,metadata,index);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'},base=catalog.projectBase;
const server=createServer(async(req,res)=>{try{const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!requested.startsWith(base)){res.writeHead(404).end();return;}let relative=requested.slice(base.length);if(!relative||relative.endsWith('/'))relative+='index.html';const file=path.resolve(site,relative);if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}const info=await stat(file);if(!info.isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const origin=`http://127.0.0.1:${server.address().port}`,jobs=[];
  for(const record of records){jobs.push({url:record.basePath,hash:record.files['index.html'],mime:'text/html'});for(const [file,hash]of Object.entries(record.files))jobs.push({url:record.basePath+file.split('/').map(encodeURIComponent).join('/'),hash,mime:mime[path.extname(file)]??'application/octet-stream'});}
  let cursor=0,bytes=0;const results=await Promise.allSettled(Array.from({length:8},async()=>{while(cursor<jobs.length){const job=jobs[cursor++],response=await fetch(origin+job.url);assert.equal(response.status,200,job.url);assert.ok(response.headers.get('content-type')?.startsWith(job.mime),job.url);const content=Buffer.from(await response.arrayBuffer());assert.equal(digest(content),job.hash,job.url);bytes+=content.length;}}));for(const result of results)if(result.status==='rejected')throw result.reason;
  console.log(JSON.stringify({snapshots:records.length,canonicalPlayURLs:records.length,verifiedHTTPFiles:jobs.length,bytes,scope:'local production artifact; original canonical paths, MIME and SHA-256'}));
}finally{await new Promise(resolve=>server.close(resolve));}
