import { execFileSync,spawnSync } from 'node:child_process';
import { readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { milestoneStages,completedStages,pagesEvidence,releaseNumber } from './release-gate-lib.mjs';
import { readRelease } from './changelog-lib.mjs';
import { readVersionCatalog } from './version-catalog.mjs';
import { verifySnapshot } from './archive-lib.mjs';
import { nextVersion } from '../src/data/semver.js';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),mode=args[0];
const option=name=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const git=(...params)=>execFileSync('git',params,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const run=(command,params)=>{const result=spawnSync(command,params,{cwd:root,stdio:'inherit'});if(result.status!==0)throw new Error(`${command} ${params.join(' ')} failed; release gate is closed.`);};
if(!['check','verify'].includes(mode))throw new Error('Usage: release:gate -- M1 --pages-run=ID --pages-commit=FULL_SHA [--report=/tmp/file.json]; release:verify -- --pages-run=ID --pages-commit=FULL_SHA');
const head=git('rev-parse','HEAD'),deployed=option('pages-commit'),pagesRun=option('pages-run');
if(!deployed||!pagesRun)throw new Error('An actual successful Pages deployment is required; no release was prepared.');
if(git('status','--porcelain'))throw new Error('Commit verified work before running a release gate.');
const url=`https://github.com/tom161819/Newgame/actions/runs/${encodeURIComponent(pagesRun)}`;
const response=await fetch(url);if(!response.ok)throw new Error(`Cannot verify actual Pages run: HTTP ${response.status}.`);
const pages=pagesEvidence(await response.text(),{run:pagesRun,commit:deployed});
git('merge-base','--is-ancestor',deployed,head);
const sourcePaths=['src','scripts','index.html','vite.config.js','package.json','package-lock.json','CHANGELOG.md','public/assets','.github/workflows'];
if(git('diff','--name-only',deployed,head,'--',...sourcePaths))throw new Error('The source under review differs from the successfully deployed game.');
const {data}=await readRelease(root),report={mode,head,version:data.version,pages,checks:[],recordedAt:new Date().toISOString()};
if(mode==='check'){
  const milestone=args[1],roadmap=await readFile(new URL('../docs/UPGRADE_ROADMAP_25_37.md',import.meta.url),'utf8'),progress=await readFile(new URL('../docs/UPGRADE_PROGRESS.md',import.meta.url),'utf8');
  milestoneStages(roadmap,milestone);
  const prerequisiteStages=Array.from({length:Number(milestone.slice(1))},(_,i)=>milestoneStages(roadmap,`M${i+1}`)).flat();
  const stages=completedStages(progress,prerequisiteStages);for(const stage of stages){stage.commit=git('rev-parse','--verify',`${stage.commit}^{commit}`);git('merge-base','--is-ancestor',stage.commit,head);}
  if(git('tag','--list',`v${nextVersion(data.version,'minor')}`))throw new Error('The proposed milestone version already has a tag; do not reuse a release number.');
  report.milestone=milestone;report.stages=stages;
  // Includes legacy save migrations, logistics, construction/cancellation and no-duplication scenarios.
  for(const command of [['ci'],['run','changelog:validate'],['run','versions:validate'],['test'],['run','archive:verify'],['run','build','--','--base=/Newgame/'],['run','archive:stage'],['run','archive:verify-site'],['run','smoke','--','--base=/Newgame/','--full']]){run('npm',command);report.checks.push({command:`npm ${command.join(' ')}`,status:'passed'});}
}else{
  releaseNumber(data.version);const tag=`v${data.version}`,commit=git('rev-parse','--verify',`${tag}^{commit}`);git('merge-base','--is-ancestor',commit,head);
  if(git('diff','--name-only',commit,head,'--',...sourcePaths))throw new Error('Tagged source differs from the deployed release.');
  const remote=git('ls-remote','origin',`refs/tags/${tag}`,`refs/tags/${tag}^{}`);if(!remote.split('\n').some(line=>line.startsWith(`${commit}\t`)))throw new Error('The release tag is not actually published.');
  const snapshot=await verifySnapshot(fileURLToPath(new URL(`../public/versions/${commit}/`,import.meta.url)),commit);
  if(snapshot.tree!==git('rev-parse',`${commit}^{tree}`))throw new Error('Archive provenance does not match the actual tag tree.');
  const catalog=await readVersionCatalog(root),entry=catalog.versions.find(v=>v.version===data.version);if(!entry?.available||entry.commit!==commit)throw new Error('The official release has no matching playable archive.');
  report.tag=tag;report.releaseCommit=commit;report.archiveURL=entry.archiveURL;report.checks.push({command:'exact tag / remote tag / immutable source archive / deployed source',status:'passed'});
}
if(option('report'))await writeFile(option('report'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
