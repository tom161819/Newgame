import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { DIAGNOSTICS,NOTICE_REPEAT_DAYS,validNoticeState } from '../src/data/diagnostics.js';
import { NOTICE_BAR,NoticeBarState,mostImportant } from '../src/ui/noticeBar.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';

// Notices 3: m-hlasky-jednou (owner point 79) and m-notice-bar-zasunuti (owner point 80).
globalThis.document??={querySelector:()=>({textContent:''})};
const DAY=120000;
// A bare scene whose detected problems the test sets directly (`s.problems`).
function scene(){
  const s={buildings:[],gameTime:{totalElapsed:0,paused:false,dayDuration:DAY},workerSystem:{liveSubjects:()=>[]},objectRegistry:null,needs:null,feed:[],log:[]};
  s.eventFeed={push:(key,text)=>{s.feed.push(key);return true;}};s.activities={emit:(type,data)=>{if(type==='productionIssue')s.log.push(data);},on:()=>()=>{}};
  s.diagnostics=new ProductionDiagnostics(s);s.problems=[];s.diagnostics.detect=()=>s.problems.map(p=>({...p}));return s;
}
const advance=(s,ms)=>{for(let t=0;t<ms;t+=DIAGNOSTICS.checkInterval){s.gameTime.totalElapsed+=DIAGNOSTICS.checkInterval;s.diagnostics.update();}};
const lasts=s=>advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
const noBuilder={entityId:0,reason:'noBuilder',category:'construction',params:{count:1},feed:true};
const rows=s=>s.diagnostics.active();

test('a repeated notice stays one row: no second notice, no event, no feed line, it keeps its place; only the count and time change',()=>{
  const s=scene();s.problems=[noBuilder];lasts(s);assert.equal(rows(s).length,1);assert.equal(s.log.length,1);assert.equal(s.feed.length,1);
  const first=rows(s)[0].lastNotified;s.problems=[noBuilder,{entityId:7,reason:'outputFull',category:'production',params:{}}];lasts(s);
  advance(s,DAY*6);assert.equal(rows(s).filter(i=>i.reason==='noBuilder').length,1,'lasting: still one row, never repeated');assert.equal(s.log.length,2);
  for(let i=0;i<3;i++){s.problems=[s.problems[1]];advance(s,DIAGNOSTICS.checkInterval*2);s.problems=[noBuilder,s.problems[0]];lasts(s);}
  const row=rows(s).find(i=>i.reason==='noBuilder');assert.equal(row.count,4,'×4');assert.equal(row.lastNotified,first,'not moved up');assert.equal(row.updatedAt,s.gameTime.totalElapsed,'time updated');
  assert.equal(s.log.length,2,'no new event');assert.equal(s.feed.length,1,'no new feed line');assert.equal(rows(s)[0].reason,'noBuilder','still first');
});

test('a closed notice comes back at the earliest 4 game days after the close – lasting, or gone and back',()=>{
  assert.equal(NOTICE_REPEAT_DAYS.warning,4);
  const s=scene();s.problems=[noBuilder];lasts(s);const closedAt=s.gameTime.totalElapsed;s.diagnostics.dismiss(rows(s)[0].key);assert.equal(rows(s).length,0);
  // Gone, then back within the 4 days: stays closed.
  s.problems=[];advance(s,DAY);s.problems=[noBuilder];lasts(s);assert.equal(rows(s).length,0,'gone and back: still closed');assert.equal(s.log.length,1);
  s.problems=[];advance(s,DAY*2);s.problems=[noBuilder];advance(s,closedAt+4*DAY-s.gameTime.totalElapsed-DIAGNOSTICS.checkInterval);assert.equal(rows(s).length,0,'not within 4 days of the close');
  advance(s,DIAGNOSTICS.checkInterval);assert.equal(rows(s).length,1,'back after 4 days');assert.equal(s.log.length,2);assert.equal(s.feed.length,2,'as a new notice');
  // Gone for good and back long after the close: a new notice.
  const again=s.gameTime.totalElapsed;s.diagnostics.dismiss(rows(s)[0].key);s.problems=[];advance(s,4*DAY);s.problems=[noBuilder];lasts(s);assert.ok(s.gameTime.totalElapsed-again>4*DAY);assert.equal(rows(s).length,1);assert.equal(s.log.length,3);
});

test('danger is never held back: every new occurrence shows at once, also after a close',()=>{
  const s=scene(),fire={entityId:3,reason:'fire',severity:'danger',category:'production',params:{}};s.problems=[fire];lasts(s);assert.equal(rows(s)[0].severity,'danger');assert.equal(s.log.length,1);
  s.problems=[];advance(s,DIAGNOSTICS.checkInterval*2);s.problems=[fire];lasts(s);assert.equal(s.log.length,2,'a second occurrence is reported');
  s.diagnostics.dismiss(rows(s)[0].key);assert.equal(s.diagnostics.closed.size,0,'closing danger holds nothing back');
  advance(s,DAY);assert.equal(rows(s).length,0,'a lasting closed danger stays closed');
  s.problems=[];advance(s,DIAGNOSTICS.checkInterval*2);s.problems=[fire];lasts(s);assert.equal(rows(s).length,1,'a new occurrence shows at once');assert.equal(s.log.length,3);
});

test('save/load keeps the close times: a closed notice does not come back right after Load; strict validation',()=>{
  const s=workerScene(undefined,{starter:true});s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.detect=()=>s.problems.map(p=>({...p}));s.problems=[noBuilder];
  // Game time moved only for the diagnostics, kept consistent for the save (day + elapsed).
  const tick=(x,ms)=>{for(let t=0;t<ms;t+=DIAGNOSTICS.checkInterval){const g=x.gameTime;g.totalElapsed+=DIAGNOSTICS.checkInterval;g.day=Math.floor(g.totalElapsed/g.dayDuration)+1;g.elapsed=g.totalElapsed-(g.day-1)*g.dayDuration;x.diagnostics.update();}};
  const step=ms=>tick(s,ms);
  step(DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);const key=s.diagnostics.active()[0].key,closedAt=s.gameTime.totalElapsed;s.diagnostics.dismiss(key);
  const saved=validateGameState(serializeGameState(s));assert.deepEqual(saved.notices,{closed:[[`${key}:`,closedAt]]});
  const r=workerScene(undefined,{starter:true});r.diagnostics=new ProductionDiagnostics(r);loadGameState(r,structuredClone(saved));
  assert.deepEqual([...r.diagnostics.closed],[[`${key}:`,closedAt]]);assert.deepEqual(validateGameState(serializeGameState(r)).notices,saved.notices,'round trip');
  r.diagnostics.detect=()=>[{...noBuilder}];const total=r.gameTime.totalElapsed;
  const go=ms=>tick(r,ms);
  go(DIAGNOSTICS.persistence*3);assert.equal(r.diagnostics.active().length,0,'still closed after Load');
  go(closedAt+4*r.gameTime.dayDuration-r.gameTime.totalElapsed);assert.ok(r.gameTime.totalElapsed>total);assert.equal(r.diagnostics.active().length,1,'back 4 days after the close');
  // Old saves without the field still load; a broken field is rejected.
  const legacy=structuredClone(saved);delete legacy.notices;assert.doesNotThrow(()=>validateGameState(legacy));
  const t=saved.time.totalElapsed;
  for(const bad of [{closed:[['0:noBuilder:',t+1]]},{closed:[['0:noBuilder:',1],['0:noBuilder:',2]]},{closed:[['bad key!',1]]},{closed:[['0:x:',-1]]},{closed:[['0:x:']]},{closed:[],extra:1},{closed:{}},[],null,{closed:Array.from({length:501},(_,i)=>[`${i}:x:`,0])}]){
    assert.equal(validNoticeState(bad,t),false,JSON.stringify(bad)?.slice(0,60));assert.throws(()=>validateGameState({...structuredClone(saved),notices:bad}));
  }
  assert.equal(validNoticeState({closed:[]},0),true);
});

test('the bar: a new notice slides it out for 4 s (the pointer holds it), a repeated one does not, "!" stays until it is slid out',()=>{
  const bar=new NoticeBarState({collapsed:true}),a={key:'1:noBuilder',lastNotified:10,severity:'warning'};bar.observe([]);
  const peek=bar.observe([a],1000);assert.equal(peek.issue,a);assert.equal(peek.more,0);assert.equal(peek.until,1000+NOTICE_BAR.peekMs);assert.equal(bar.alert,true);
  assert.equal(bar.expire(1000+NOTICE_BAR.peekMs-1),false,'out for 4 s');
  bar.hover(true,4500);assert.equal(bar.expire(9000),false,'held while the pointer is over it');bar.hover(false,9000);assert.equal(bar.expire(9000+NOTICE_BAR.hoverGraceMs-1),false);
  assert.equal(bar.expire(9000+NOTICE_BAR.hoverGraceMs),true,'then it slides back');assert.equal(bar.peek,null);assert.equal(bar.alert,true,'the "!" stays');
  // A quietly updated notice keeps its report time: not new, no slide-out (also when its row was away for a while).
  assert.equal(bar.observe([{...a,count:3,updatedAt:500}],20000),null);assert.equal(bar.observe([],21000),null);assert.equal(bar.observe([{...a,count:4}],22000),null,'back quietly: no slide-out');assert.equal(bar.unread,1);
  // Several at once: the most important one with "+N".
  const info={key:'chain:mill:wheat:unused:',lastNotified:30,severity:'info'},danger={key:'3:fire',lastNotified:25,severity:'danger'},warn={key:'0:foodLow',lastNotified:40,severity:'warning'};
  const many=bar.observe([a,info,danger,warn],30000);assert.equal(many.issue,danger);assert.equal(many.more,2);assert.equal(bar.unread,4);
  assert.equal(mostImportant([info,warn]),warn);assert.equal(mostImportant([{...warn,lastNotified:1},{...warn,key:'x',lastNotified:2}]).key,'x','newer wins a tie');
  bar.setCollapsed(false);assert.equal(bar.alert,false,'slid out: no "!"');assert.equal(bar.peek,null);
  assert.equal(bar.observe([a,info,danger,warn,{key:'9:noHauler',lastNotified:99}],40000),null,'out: nothing peeks');
});
