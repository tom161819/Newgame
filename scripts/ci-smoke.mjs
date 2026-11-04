import { readFile } from 'node:fs/promises';
import { execFileSync,spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export function smokeScope({paths=[],previousVersion,currentVersion,manual=false}){
  const historyData=new Set(['src/data/semver.js','src/data/changelogCategories.js']);
  if(manual||previousVersion!==currentVersion||paths.some(file=>/^src\/(game|systems)\//.test(file)||file.startsWith('src/data/')&&!historyData.has(file)||/^src\/ui\/(PopulationSidebar|populationData|MissingWorkersIndicators|NaturalResourcePanel|WorkplacePanel|InventoryBar|ResourceEconomyTooltip|resourceEconomy)\.js$/.test(file)||(/^scripts\/(population|staffing|fog|forestry|mineral|zoom|ledger|smelting)-smoke\.mjs$/.test(file)||file==='src/ui/resourceLedger.css')))return 'full';
  if(paths.some(file=>historyData.has(file)||/^public\/versions\//.test(file)||/^(CHANGELOG\.md|vite\.config\.js|index\.html|src\/style\.css)$/.test(file)||/^src\/ui\/(VersionArchivePanel|ChangelogPanel|GameApplication)\.js$/.test(file)||/^scripts\/(.*archive.*|version-catalog|git-source-facts|browser-smoke|ci-smoke).*\.mjs$/.test(file)))return 'archive';
  return 'current';
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=fileURLToPath(new URL('../',import.meta.url)),git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();let event={};
  if(process.env.GITHUB_EVENT_PATH)event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  const previous=/^[a-f0-9]{40}$/.test(event.before??'')&&!/^0+$/.test(event.before)?event.before:null,currentVersion=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
  let paths=[],previousVersion=currentVersion;if(previous){git('merge-base','--is-ancestor',previous,'HEAD');paths=git('diff','--name-only','--no-renames',previous,'HEAD').split('\n');previousVersion=JSON.parse(git('show',`${previous}:package.json`)).version;}
  const mode=smokeScope({paths,previousVersion,currentVersion,manual:!previous}),base=process.argv.slice(2).find(arg=>arg.startsWith('--base='))??'--base=/Newgame/';
  console.log(`Browser scope: ${mode}; ${paths.length} changed paths. Full archive checks remain mandatory at release gates.`);
  if(mode!=='current'){const check=spawnSync(process.execPath,['scripts/verify-site-archives.mjs'],{cwd:root,stdio:'inherit'});if(check.error)throw check.error;if(check.status!==0)throw new Error('The composed archive failed its original URL/byte checks.');}
  const args=['scripts/browser-smoke.mjs',base,...(mode==='full'?['--full']:mode==='current'?['--current-only']:[])],result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??1;
}
