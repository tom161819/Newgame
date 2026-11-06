import { readFile,stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { readRelease } from './changelog-lib.mjs';
import { projectBase,escapeHTML } from './archive-lib.mjs';
import { semanticVersion,versionParts,displayBuildVersion,displayVersion } from '../src/data/semver.js';
import { readSourceFacts } from './git-source-facts.mjs';

const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const git=(root,...args)=>{try{return execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:5000,maxBuffer:1024*1024}).trim();}catch{return null;}};
export function catalogContext(base='/Newgame/'){
  projectBase(base);const match=base.match(/^(.*\/)versions\/([a-f0-9]{40})\/$/);return {base,projectBase:match?.[1]??base,archiveCommit:match?.[2]??null};
}
export function sourceBuild(root,environment=process.env){
  const exported=sha(environment.GAME_BUILD_COMMIT)?environment.GAME_BUILD_COMMIT:null,top=git(root,'rev-parse','--show-toplevel'),repository=top===path.resolve(root);
  const commit=exported??(repository?git(root,'rev-parse','HEAD'):null),date=exported?environment.GAME_BUILD_DATE??null:repository?git(root,'show','-s','--format=%aI',commit):null;
  const paths=['src','scripts','index.html','vite.config.js','package.json','package-lock.json','CHANGELOG.md','public/assets','.github/workflows'];
  const dirty=exported?false:repository?!!git(root,'status','--porcelain','--untracked-files=normal','--',...paths):true;
  const tags=exported?(environment.GAME_BUILD_TAG?[environment.GAME_BUILD_TAG]:[]):repository?(git(root,'tag','--points-at',commit)??'').split('\n').filter(Boolean):[];
  return {commit:sha(commit)?commit:null,date,dirty,tags,repository};
}
export const archiveBuildLabel=(number,version,commit)=>`Archive build ${number} · v${displayVersion(version)} · ${commit.slice(0,7)}`;
// #174: what a release means for saved games, from the SAVE_VERSION it recorded and the previous release that recorded one.
export function saveImpacts(releases){const official=releases.filter(r=>!r.metadata?.reconstructed),impacts=new Map();official.forEach((release,i)=>{const save=release.metadata?.saveVersion;if(!Number.isSafeInteger(save))return;const previous=official.slice(i+1).find(r=>Number.isSafeInteger(r.metadata?.saveVersion))?.metadata.saveVersion;impacts.set(release.version,{saveVersion:save,saveImpact:previous==null?'recorded':previous===save?'compatible':'newSchema'});});return impacts;}
export function assembleVersionCatalog({data,records,build,base='/Newgame/'}){
  const context=catalogContext(base),byCommit=new Map(),seenVersions=new Set(),anchors=new Set();
  for(const record of records){if(!sha(record.commit)||byCommit.has(record.commit))throw new Error('Archive commit IDs must be real and unique.');projectBase(record.basePath);if(!record.basePath.endsWith(`/versions/${record.commit}/`))throw new Error('Archive URL does not match its commit.');byCommit.set(record.commit,record);}
  const impacts=saveImpacts(data.releases);
  const versions=data.releases.map(release=>{
    const metadata=release.metadata??{},historical=metadata.reconstructed===true,commit=metadata.commit??release.resolvedCommit??null,record=byCommit.get(commit),self=commit===context.archiveCommit;
    if(seenVersions.has(release.version))throw new Error('Duplicate catalog version.');seenVersions.add(release.version);semanticVersion(release.version);
    if(commit&&anchors.has(commit))throw new Error('A commit cannot represent two distinct version milestones.');if(commit)anchors.add(commit);
    if(historical&&record&&release.date!==record.date.slice(0,10))throw new Error(`Historical date does not match its original commit: ${release.version}.`);
    const available=self||!!record?.available,changes=structuredClone(release.changes),description=Object.values(changes).flat()[0]??'';
    return {version:release.version,title:metadata.title??`Release ${release.version}`,date:release.date,commit,archiveURL:available?(record?.basePath??base):null,available,description,releaseType:metadata.type??'feature',historical,reconstructed:historical,label:historical?'Reconstructed archive label':'Official release',changes,saveVersion:impacts.get(release.version)?.saveVersion??null,saveImpact:impacts.get(release.version)?.saveImpact??null,sequence:record?.sequence??0,commitDate:record?.date??release.resolvedCommitDate??(commit===build.commit?build.date:null),tag:release.resolvedTag??null};
  }).sort((a,b)=>(b.commitDate??b.date).localeCompare(a.commitDate??a.date)||b.sequence-a.sequence);
  const development=Object.values(data.unreleased.changes).some(items=>items.length)||build.dirty,identifier=context.archiveCommit?`${data.version}+git.${context.archiveCommit}`:development?`${data.version}+dev.${build.commit??'working'}`:data.version;
  const currentBuild={version:identifier,gameVersion:data.version,title:context.archiveCommit?'Archived build':development?'Current development build':'Current Version',date:build.date?.slice(0,10)??null,commit:build.commit,archiveURL:base,available:true,description:context.archiveCommit?'The original game build preserved at this commit.':development?'Current development build; released changes are listed separately.':'Current released game.',releaseType:development?'development':'release',historical:!!context.archiveCommit,reconstructed:false,current:!context.archiveCommit,dirty:build.dirty};
  for(const entry of versions)entry.current=!context.archiveCommit&&entry.version===identifier;
  const builds=records.map(record=>({version:`${record.originalVersion??data.version}+git.${record.commit}`,gameVersion:record.originalVersion??data.version,commit:record.commit,date:record.date,title:record.subject??record.name,description:record.description,archiveURL:record.available?record.basePath:null,available:record.available,sequence:record.sequence,buildNumber:record.sequence,buildLabel:archiveBuildLabel(record.sequence,record.originalVersion??data.version,record.commit),releaseType:'snapshot',historical:true,reconstructed:true})).sort((a,b)=>b.sequence-a.sequence);
  const numbers=new Set();for(const entry of builds){if(!Number.isSafeInteger(entry.buildNumber)||entry.buildNumber<1||numbers.has(entry.buildNumber))throw new Error('Archive build numbers must be unique positive integers.');numbers.add(entry.buildNumber);}
  for(const entry of [...versions,...builds,currentBuild])semanticVersion(entry.version);
  return {schema:1,gameVersion:data.version,projectBase:context.projectBase,currentBuild,versions,builds};
}
export async function readVersionCatalog(root,{base='/Newgame/',environment=process.env,release=null}={}){
  const {data}=release??await readRelease(root),context=catalogContext(base),build=sourceBuild(root,environment);let records=[];
  if(context.archiveCommit&&build.commit!==context.archiveCommit)throw new Error('An archive must be built from its actual source commit.');
  try{records=JSON.parse(await readFile(path.join(root,'public/versions/versions.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!Array.isArray(records))throw new Error('Archive build catalog must be an array.');
  const evidence=[];for(const entry of data.releases){const metadata=entry.metadata??{};if(metadata.evidence&&(!Array.isArray(metadata.evidence)||metadata.evidence.some(file=>typeof file!=='string'||file.includes('..')||!file.match(/^[A-Za-z0-9_./-]+$/))))throw new Error('Unsafe historical source evidence.');for(const file of metadata.evidence??[])if(metadata.commit)evidence.push({commit:metadata.commit,file});}
  const facts=build.repository?readSourceFacts(root,{packages:records.map(r=>r.commit),evidence,commits:data.releases.map(r=>r.metadata?.commit).filter(Boolean)}):null;
  records=await Promise.all(records.map(async record=>{
    let available=false;
    if(context.archiveCommit)available=record.verification?.build===true&&record.verification?.browser===true;
    else try{available=(await stat(path.join(root,'public/versions',record.commit,'index.html'))).isFile()&&record.verification?.build===true&&record.verification?.browser===true;}catch(error){if(error.code!=='ENOENT')throw error;}
    const originalVersion=facts?.packages.get(record.commit)?.version??record.originalVersion;if(!originalVersion)throw new Error('Missing original archive package version.');versionParts(originalVersion);
    return {...record,date:facts?.dates.get(record.commit)??record.date,subject:facts?.subjects.get(record.commit)??record.subject,available,originalVersion};
  }));
  const releases=[];
  for(const entry of data.releases){
    const metadata=entry.metadata??{};let commit=metadata.commit??null,resolvedTag=null;
    if(commit&&build.repository){
      if(!facts.dates.has(commit))throw new Error(`Unknown historical commit ${commit}.`);
      if(metadata.reconstructed&&facts.dates.get(commit).slice(0,10)!==entry.date)throw new Error('Historical date differs from the original Git commit.');
    }
    if(!commit&&!metadata.reconstructed){const tag=metadata.tag??`v${entry.version}`;commit=build.repository?git(root,'rev-parse','--verify',`${tag}^{commit}`):build.tags.includes(tag)?build.commit:null;if(sha(commit))resolvedTag=tag;else commit=null;}
    releases.push({...entry,resolvedCommit:commit,resolvedTag,resolvedCommitDate:facts?.dates.get(commit)??null});
  }
  return assembleVersionCatalog({data:{...data,releases},records,build,base});
}
export const saveImpactText=entry=>({compatible:`Saves: compatible with the previous version (save format ${entry.saveVersion}).`,newSchema:`Saves: new save format ${entry.saveVersion}; saves from earlier versions cannot be loaded.`,recorded:`Save format ${entry.saveVersion}.`})[entry.saveImpact]??'';
export function catalogHTML(catalog){
  const entryHTML=entry=>`<article data-version-label="${escapeHTML(entry.version)}"><h2>v${escapeHTML(displayBuildVersion(entry.version))} — ${escapeHTML(entry.title)}</h2><p>${escapeHTML(entry.description)}</p>${entry.saveImpact?`<p>${escapeHTML(saveImpactText(entry))}</p>`:''}<small>${escapeHTML(entry.date??'Date unavailable')} · ${escapeHTML(entry.label??entry.releaseType)}${entry.commit?` · ${entry.commit.slice(0,7)}`:''}</small><p>${entry.available?`<a href="${escapeHTML(entry.archiveURL)}" target="_blank" rel="noopener noreferrer">Play ↗</a>`:'Archive unavailable'} · <a href="${escapeHTML(catalog.projectBase)}?changelog=${encodeURIComponent(catalog.versions.some(v=>v.version===entry.version)?entry.version:catalog.gameVersion)}">View Changes</a></p></article>`;
  const entries=catalog.versions.some(v=>v.version===catalog.currentBuild.version)?catalog.versions:[catalog.currentBuild,...catalog.versions];
  const rows=entries.map(entryHTML).join('\n'),snapshots=catalog.builds.map(entry=>`<article data-version="${entry.commit}"><h3 title="${escapeHTML(entry.version)}" data-build-number="${entry.buildNumber}">Archive build ${entry.buildNumber} — ${escapeHTML(entry.title)}</h3>${entry.description&&entry.description!==entry.title?`<p>${escapeHTML(entry.description)}</p>`:''}<small>${escapeHTML(entry.date)} · Development snapshot · original v${escapeHTML(displayVersion(entry.gameVersion))} · commit ${entry.commit.slice(0,7)}</small><p>${entry.available?`<a href="${escapeHTML(entry.archiveURL)}" target="_blank" rel="noopener noreferrer">Play snapshot ↗</a>`:'Snapshot unavailable'} · <a href="https://github.com/tom161819/Newgame/commit/${entry.commit}" target="_blank" rel="noopener noreferrer">View actual changes ↗</a></p></article>`).join('\n');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Medieval Kingdom · Version Archive</title><style>body{font:16px system-ui;max-width:940px;margin:2rem auto;padding:0 1rem;background:#20271e;color:#eee4c4}article{border:1px solid #77734e;padding:1rem;margin:1rem 0}a{color:#e8cb7a}small{color:#c0bea2}summary{cursor:pointer}h2,h3{overflow-wrap:anywhere}</style><h1>Version Archive</h1><p><a href="${escapeHTML(catalog.projectBase)}">Current game ↗</a></p><p>Reconstructed archive labels identify verified historical milestones. They are not original release numbers. Original builds, dates and URLs are preserved. Archive build numbers count commits on the main history; each one names exactly one development snapshot and is not a release version.</p>${rows}<details><summary>All verified development snapshots (${catalog.builds.length})</summary>${snapshots}</details></html>\n`;
}
