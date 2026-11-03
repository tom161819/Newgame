import { versionParts } from '../src/data/semver.js';

export function milestoneStages(roadmap,milestone){
  if(!/^M[1-5]$/.test(milestone))throw new Error('Expected milestone M1–M5.');
  const rows=[...roadmap.matchAll(/^\|\s*(\d{2})\s*\|[^\n]*?\|\s*(M[1-5])\s*\|/gm)].map(m=>({stage:m[1],milestone:m[2]}));
  const stages=rows.filter(r=>r.milestone===milestone).map(r=>r.stage);if(!stages.length)throw new Error('Milestone is absent from the authoritative roadmap.');return stages;
}
export function completedStages(progress,stages){
  return stages.map(stage=>{const row=progress.split('\n').find(line=>new RegExp(`^\\|\\s*${stage}\\s*\\|`).test(line));
    const cells=row?.split('|').map(s=>s.trim());if(cells?.[4]!=='DONE')throw new Error(`Stage ${stage} is not DONE.`);
    const commit=cells[5]?.match(/\b[a-f0-9]{7,40}\b/)?.[0];if(!commit)throw new Error(`Stage ${stage} has no verified implementation commit.`);return {stage,commit};});
}
export function pagesEvidence(html,{run,commit}){
  if(!/^\d+$/.test(String(run))||!/^[a-f0-9]{40}$/.test(commit))throw new Error('A real Pages run and full deployed commit are required.');
  const plain=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|#160);/g,' ').replace(/\s+/g,' ');
  const trigger=plain.slice(plain.indexOf('Triggered via'),plain.indexOf('Artifacts Produced'));
  if(!new RegExp(`pushed ${commit.slice(0,7)}(?:[a-f0-9]{0,33}) main Status Success\\b`).test(trigger)||!trigger.includes('https://tom161819.github.io/Newgame/'))throw new Error('Pages has not confirmed Success for the exact deployment on main.');
  if(!html.includes(`/tom161819/Newgame/actions/runs/${run}`))throw new Error('Pages evidence does not belong to the requested run.');
  if(!html.includes(`/tom161819/Newgame/commit/${commit}`))throw new Error('Pages evidence does not identify the full deployed source SHA.');
  return {run:String(run),commit,url:'https://tom161819.github.io/Newgame/',status:'Success'};
}
export function releaseNumber(version){const parts=versionParts(version);if(parts[0]!==0||parts[2]!==0)throw new Error('Master milestones use pre-1.0 MINOR releases (0.MINOR.0).');return version;}
