import test from 'node:test';
import assert from 'node:assert/strict';
import { milestoneStages,completedStages,pagesEvidence,pagesRunEvidence,releaseNumber } from '../scripts/release-gate-lib.mjs';
test('release gate reads the existing roadmap and refuses missing, incomplete or uncommitted stages',()=>{
  const roadmap='| 01 | A | Feature | M1 | spec |\n| 02 | B | Feature | M1 | spec |\n| 03 | C | Feature | M2 | spec |';assert.deepEqual(milestoneStages(roadmap,'M1'),['01','02']);
  const progress='| 01 | A | M1 | DONE | aaaaaaa tests passed |\n| 02 | B | M1 | PARTIAL | bbbbbbb |';assert.throws(()=>completedStages(progress,['01','02']),/not DONE/);assert.deepEqual(completedStages(progress,['01']),[{stage:'01',commit:'aaaaaaa'}]);
  assert.throws(()=>completedStages(progress.replace('aaaaaaa','not committed'),['01']),/commit/);assert.throws(()=>milestoneStages(roadmap,'M6'));assert.throws(()=>milestoneStages(roadmap,'M5'));
});
test('actual Pages evidence requires the requested run, deployed commit, successful main push and game URL',()=>{
  const commit='a'.repeat(40),run='123',html=`<a href="/tom161819/Newgame/actions/runs/123">Run</a><a href="/tom161819/Newgame/commit/${commit}">Source</a><p>Triggered via push Today user pushed aaaaaaa main Status Success Total duration 30s deploy https://tom161819.github.io/Newgame/</p>`;
  assert.equal(pagesEvidence(html,{run,commit}).status,'Success');
  for(const bad of [html.replace('Success','Failure'),html.replace('aaaaaaa','bbbbbbb'),html.replace('main','work'),html.replace('/123','/124'),html.replace('https://tom161819.github.io/Newgame/','')])assert.throws(()=>pagesEvidence(bad,{run,commit}));
  assert.throws(()=>pagesEvidence(`<script>${html}</script>`,{run,commit}));
  assert.throws(()=>pagesEvidence(html.replace(`/commit/${commit}`,'/commit/bbbbbbb'),{run,commit}));
});
test('master gates accept only intended pre-1.0 minor release numbers',()=>{assert.equal(releaseNumber('0.2.0'),'0.2.0');for(const bad of ['1.0.0','0.2.1','0.2.0+archive.1'])assert.throws(()=>releaseNumber(bad));});

test('#174 Pages evidence from the GitHub REST API: only a completed successful push run of the Pages workflow for the exact SHA',()=>{
  const commit='a'.repeat(40),run={id:42,run_attempt:2,repository:{full_name:'tom161819/Newgame'},path:'.github/workflows/pages.yml',event:'push',head_branch:'main',head_sha:commit,status:'completed',conclusion:'success'};
  assert.deepEqual(pagesRunEvidence(run,{run:'42',commit}),{run:'42',commit,url:'https://tom161819.github.io/Newgame/',status:'Success',attempt:2},'a successful re-run of failed jobs is still the push run');
  for(const [field,value]of [['id',43],['head_sha','b'.repeat(40)],['head_branch','work'],['event','pull_request'],['path','.github/workflows/pr-quality.yml'],['conclusion','failure'],['status','in_progress'],['repository',{full_name:'someone/Newgame'}]])
    assert.throws(()=>pagesRunEvidence({...run,[field]:value},{run:'42',commit}),/Pages has not confirmed/,field);
  assert.throws(()=>pagesRunEvidence(run,{run:'x',commit}),/real Pages run/);assert.throws(()=>pagesRunEvidence(run,{run:'42',commit:'abc'}),/real Pages run/);
});
