import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { digest,verifySnapshot } from './archive-lib.mjs';

// A local archive does not prove that a successful, possibly older Pages run
// published it. Read the exact deployed Git tree and hash its actual blob bytes.
// Live main may legitimately contain newer development than the frozen release.
export async function verifyDeployedArchive({root,deploymentCommit,releaseCommit,version}) {
  if (![deploymentCommit,releaseCommit].every(value=>/^[a-f0-9]{40}$/.test(value))) throw new Error('Expected full deployment and release commit SHAs.');
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']}).trim();
  git('merge-base','--is-ancestor',releaseCommit,deploymentCommit);
  if(JSON.parse(git('show',`${releaseCommit}:package.json`)).version!==version) throw new Error('Tagged package version does not match the release.');
  const archivePath=`public/versions/${releaseCommit}/`,directory=path.join(root,archivePath);
  const snapshot=await verifySnapshot(directory,releaseCommit);
  if(snapshot.tree!==git('rev-parse',`${releaseCommit}^{tree}`)) throw new Error('Archive provenance does not match the actual release source tree.');
  const entries=git('ls-tree','-r','-z','--full-tree',deploymentCommit,'--',archivePath).split('\0').filter(Boolean).map(line=>{
    const match=line.match(/^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/);
    if(!match||!match[3].startsWith(archivePath)) throw new Error('Deployed archive contains an unsupported Git entry.');
    return {object:match[2],file:match[3].slice(archivePath.length)};
  });
  const expected={...snapshot.files,'snapshot.json':digest(await readFile(path.join(directory,'snapshot.json')))};
  if(entries.length!==Object.keys(expected).length||entries.some(({file})=>!Object.hasOwn(expected,file))) throw new Error('Successful deployment does not contain the exact release archive file set.');
  const blobs=execFileSync('git',['cat-file','--batch'],{cwd:root,input:entries.map(entry=>entry.object+'\n').join(''),maxBuffer:64*1024*1024,stdio:['pipe','pipe','pipe']});
  let offset=0;
  for(const {object,file} of entries){
    const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString('utf8').match(/^([a-f0-9]{40}) blob (\d+)$/);
    if(end<0||!header||header[1]!==object) throw new Error('Cannot read an actual deployed archive blob.');
    const size=Number(header[2]),start=end+1;offset=start+size+1;
    if(!Number.isSafeInteger(size)||offset>blobs.length||blobs[offset-1]!==10||digest(blobs.subarray(start,start+size))!==expected[file]) throw new Error(`Deployed archive bytes differ from the verified release: ${file}`);
  }
  if(offset!==blobs.length) throw new Error('Unexpected data after deployed archive blobs.');
  const records=JSON.parse(git('show',`${deploymentCommit}:public/versions/versions.json`));
  const matches=records.filter(record=>record.commit===releaseCommit);
  if(matches.length!==1||matches[0].tree!==snapshot.tree||matches[0].basePath!==snapshot.basePath) throw new Error('Deployed version index does not identify the exact release archive.');
  return {deploymentCommit,releaseCommit,archivePath,verifiedGitFiles:entries.length};
}

// A build made before the public tag existed may contain the archive but still
// list the official release as unavailable. Verify what Pages actually serves.
export function verifyPublishedRelease({catalog,manifest,entry,manifestHash}) {
  const matches=catalog?.schema===1&&Array.isArray(catalog.versions)?catalog.versions.filter(item=>item.version===entry.version):[];
  const fields=['version','title','date','tag','commit','archiveURL','available','releaseType','reconstructed','changes'];
  if(matches.length!==1||matches[0].available!==true||fields.some(field=>!isDeepStrictEqual(matches[0][field],entry[field]))) throw new Error('Published catalog does not advertise the exact tagged playable release; run and verify a tag-aware Pages build.');
  if(digest(manifest)!==manifestHash) throw new Error('Published archive manifest differs from the verified immutable release.');
  return {version:entry.version,commit:entry.commit,archiveURL:entry.archiveURL,manifestSHA256:manifestHash};
}
