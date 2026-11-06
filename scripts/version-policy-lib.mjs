import { nextVersion,versionParts } from '../src/data/semver.js';
import { parseChangelog,lastRecordedSave } from './changelog-lib.mjs';

// #174: the version and change-record policy every pull request into main follows.
// Paths that ship to players as the game. Changing them is a release (Studio, scripts, tests and docs are not).
export const APP_PATHS=Object.freeze([/^src\//,/^index\.html$/,/^public\/(?!versions\/)/,/^vite\.config\.js$/]);
export const CHANGE_RECORD=/^docs\/changes\/(?!TEMPLATE\.md$|README\.md$)[^/]+\.md$/;
export const CHANGE_RECORD_SECTIONS=Object.freeze(['What and why','Files and systems','Implementation decisions','Save/Load impact','Testing','Notes for the next agent']);
const escape=text=>text.replace(/[.*+?^${}()|[\]\\/]/g,'\\$&');

// A short record for the next agent: every section present and not empty.
export function changeRecordProblems(text){
  const problems=[],lines=String(text).replace(/\r\n/g,'\n').split('\n');
  for(const section of CHANGE_RECORD_SECTIONS){
    const start=lines.findIndex(line=>new RegExp(`^##\\s+${escape(section)}\\s*$`,'i').test(line));
    if(start<0){problems.push(`missing section "## ${section}"`);continue;}
    const next=lines.findIndex((line,i)=>i>start&&/^#{1,2}\s/.test(line)),body=lines.slice(start+1,next<0?lines.length:next).join('\n').replace(/<!--[\s\S]*?-->/g,'').trim();
    if(!body)problems.push(`section "## ${section}" is empty`);
  }
  return problems;
}

// base/head: {version, save, changelog}; changed: paths this pull request changes; records: [{path,text}] of its change records.
export function checkVersionPolicy({base,head,changed,records=[]}){
  versionParts(base.version);versionParts(head.version);
  const errors=[],baseData=parseChangelog(base.changelog,base.version);
  // Bootstrap: the policy blocks once main carries a release written under it (one that recorded its SAVE_VERSION).
  const enforced=lastRecordedSave(baseData)!==null;
  const steps={patch:nextVersion(base.version,'patch'),minor:nextVersion(base.version,'minor'),major:nextVersion(base.version,'major')};
  const bump=head.version===base.version?null:Object.keys(steps).find(type=>steps[type]===head.version)??'invalid';
  const app=changed.filter(file=>APP_PATHS.some(pattern=>pattern.test(file))),saveChanged=head.save!==base.save;
  if(bump==='invalid')errors.push(`Version ${head.version} skips or goes back: from ${base.version} the next release is ${steps.patch} (patch), ${steps.minor} (minor) or ${steps.major} (major).`);
  if(saveChanged&&bump!=='minor'&&bump!=='major')errors.push(`SAVE_VERSION changed ${base.save} → ${head.save}: release it as MINOR ${steps.minor} or MAJOR ${steps.major} (npm run release:prepare -- minor).`);
  if(app.length&&bump===null)errors.push(`The game changed (${app.slice(0,3).join(', ')}${app.length>3?', …':''}) without a release: run npm run release:prepare -- patch (minor/major for a new SAVE_VERSION) so the deployed version is new and listed in the changelog.`);
  if(bump&&bump!=='invalid'){
    const data=parseChangelog(head.changelog,head.version),release=data.releases.find(r=>r.version===head.version);
    if(release?.metadata?.saveVersion!==head.save)errors.push(`Release ${head.version} must record the SAVE_VERSION it ships with ("saveVersion": ${head.save}); npm run release:prepare writes it.`);
    if(Object.values(data.unreleased.changes).some(items=>items.length))errors.push(`Unreleased must be empty in a release: every deployed change belongs to ${head.version}.`);
  }
  if(changed.some(file=>!file.startsWith('docs/'))&&!records.length)errors.push('Add a change record docs/changes/<issue>-<slug>.md (copy docs/changes/TEMPLATE.md): what and why, files, decisions, Save/Load impact, testing, notes for the next agent.');
  for(const record of records)for(const problem of changeRecordProblems(record.text))errors.push(`${record.path}: ${problem}.`);
  return {enforced,errors,bump,steps,app,saveChanged};
}
