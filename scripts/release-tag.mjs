import { execFileSync } from 'node:child_process';
import { releaseTagTarget } from './release-tag-lib.mjs';

// Prints "<tag> <commit>" for the current main release, or nothing when that tag already exists.
// Read-only: the tag-release workflow creates and pushes the tag with its own token.
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const commits=git('log','--first-parent','--format=%H','-n','400','HEAD').split('\n').filter(Boolean);
const history=[];
for(const commit of commits){let version;try{version=JSON.parse(git('show',`${commit}:package.json`)).version;}catch{break;}history.push({commit,version});if(history.length>1&&version!==history[0].version)break;}
const {tag,commit}=releaseTagTarget(history);
if(git('tag','--list',tag))process.exit(0);
console.log(`${tag} ${commit}`);
