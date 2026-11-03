import { execFileSync } from 'node:child_process';
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
export function archiveOptions(args){
  const result={base:'/Newgame/',through:'HEAD',commits:[],all:false},seen=new Set();
  for(let i=0;i<args.length;i++){
    const arg=args[i];if(arg==='--all-commits'){result.all=true;continue;}
    const equal=arg.indexOf('='),name=equal<0?arg:arg.slice(0,equal),key={'--base':'base','--through':'through','--commit':'commits'}[name];
    if(!key)throw new Error(`Unknown archive option: ${arg}.`);const value=equal<0?args[++i]:arg.slice(equal+1);
    if(!value||value.startsWith('--'))throw new Error(`Missing value for ${name}.`);
    if(key==='commits')result.commits.push(value);else{if(seen.has(key))throw new Error(`Duplicate archive option: ${name}.`);seen.add(key);result[key]=value;}
  }
  return result;
}
export function archiveSourcePaths(root,commit){
  if(!sha(commit))throw new Error('Archive source must be an actual full commit SHA.');
  const names=tree=>execFileSync('git',['ls-tree','--name-only','-z',tree],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).split('\0').filter(Boolean);
  const roots=names(commit),paths=roots.filter(name=>name!=='public');
  if(roots.includes('public'))paths.push(...names(`${commit}:public`).filter(name=>name!=='versions').map(name=>`public/${name}`));
  return paths;
}
export function selectArchiveCommits({history,through,milestones=[],tags=[],requested=[],all=false}){
  const known=new Set(history),wanted=new Set(all?history:[through,...milestones,...tags,...requested]);
  for(const commit of wanted)if(!sha(commit)||!known.has(commit))throw new Error(`Requested archive is outside the selected actual history: ${commit}.`);
  return history.filter(commit=>wanted.has(commit));
}
