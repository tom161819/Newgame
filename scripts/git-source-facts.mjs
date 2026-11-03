import { execFileSync } from 'node:child_process';
import { versionParts } from '../src/data/semver.js';
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const safeFile=value=>typeof value==='string'&&!value.includes('..')&&/^[A-Za-z0-9_./-]+$/.test(value);
export function readSourceFacts(root,{packages=[],evidence=[],commits=[]}={}){
  const ids=[...new Set([...packages,...evidence.map(e=>e.commit),...commits])];
  if(ids.some(id=>!sha(id))||evidence.some(e=>!safeFile(e.file)))throw new Error('Unsafe source provenance query.');
  const run=(args,input,buffer=false)=>execFileSync('git',args,{cwd:root,input,encoding:buffer?undefined:'utf8',stdio:['pipe','pipe','pipe'],timeout:15000,maxBuffer:16*1024*1024});
  const dates=new Map(),subjects=new Map(),packageData=new Map(),types=new Map();if(!ids.length)return {dates,subjects,packages:packageData,types};
  const checks=[...ids.map(query=>({query,type:'commit'})),...evidence.map(e=>({query:`${e.commit}:${e.file}`,type:'blob'}))];
  const lines=run(['cat-file','--batch-check'],checks.map(c=>c.query).join('\n')+'\n').trim().split('\n');
  for(let i=0;i<checks.length;i++){const header=lines[i]?.split(' '),check=checks[i];if(!sha(header?.[0])||header[1]!==check.type)throw new Error(`Missing historical source ${check.query}.`);types.set(check.query,header[1]);}
  for(const line of run(['log','--no-walk','--format=%H%x09%aI%x09%s',...ids]).trim().split('\n')){const [id,date,...subject]=line.split('\t');if(!sha(id)||!/^\d{4}-\d{2}-\d{2}T/.test(date??''))throw new Error('Invalid original commit date.');dates.set(id,date);subjects.set(id,subject.join('\t'));}
  if(packages.length){
    const bytes=run(['cat-file','--batch'],packages.map(id=>`${id}:package.json`).join('\n')+'\n',true);let offset=0;
    for(const id of packages){
      const end=bytes.indexOf(10,offset),header=end<0?[]:bytes.toString('utf8',offset,end).split(' '),size=Number(header[2]);
      if(!sha(header[0])||header[1]!=='blob'||!Number.isSafeInteger(size)||size<0||size>1024*1024||end+1+size>=bytes.length)throw new Error(`Missing original package.json for ${id}.`);
      let pkg;try{pkg=JSON.parse(bytes.toString('utf8',end+1,end+1+size));}catch{throw new Error(`Invalid original package.json for ${id}.`);}versionParts(pkg.version);packageData.set(id,pkg);offset=end+size+2;
    }
  }
  return {dates,subjects,packages:packageData,types};
}
