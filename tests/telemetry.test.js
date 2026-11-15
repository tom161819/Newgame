import test from 'node:test';
import assert from 'node:assert/strict';
import { Telemetry } from '../src/systems/Telemetry.js';
import { TELEMETRY,telemetryHost } from '../src/data/telemetry.js';
import { reportPayload,recentReports } from '../src/ui/ReportDialog.js';

const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const config={...TELEMETRY,goatcounter:'mkgame'};

// Owner 15 Nov: anonymous statistics only on GitHub Pages, with a key, and never after the player turns them off.
test('statistics are sent only from the GitHub Pages host with a key, and stop when the player opts out', () => {
  const sent=[],storage=memory();
  const on=new Telemetry({storage,version:'0.138.3',hostname:'tom161819.github.io',send:url=>sent.push(url),config});
  assert.equal(on.visit(),true);assert.equal(on.visit(),false,'one page view per visit');
  assert.match(sent[0],/^https:\/\/mkgame\.goatcounter\.com\/count\?p=%2Fplay%2F0\.138\.3/);assert.doesNotMatch(sent[0],/e=true/);
  on.setOptOut(true);assert.equal(on.gameStarted(false),false);assert.equal(storage.getItem(TELEMETRY.storageKey),'off');
  assert.equal(new Telemetry({storage:memory(),hostname:'claude.ai',send:()=>assert.fail(),config}).visit(),false,'not from claude.ai');
  assert.equal(new Telemetry({storage:memory(),hostname:'tom161819.github.io',send:()=>assert.fail(),config:{...config,goatcounter:''}}).visit(),false,'not without a key');
  assert.equal(telemetryHost('Tom161819.GitHub.io'),true);
});

test('day milestones are sent once per game, play minutes only while running', () => {
  const sent=[],tel=new Telemetry({storage:memory(),version:'x',hostname:'tom161819.github.io',send:url=>sent.push(decodeURIComponent(url)),config});
  tel.gameStarted(false);tel.tick(1,true,0);tel.tick(5,true,1000);tel.tick(5,true,2000);
  assert.deepEqual(sent.filter(u=>u.includes('/day/')).map(u=>u.match(/\/day\/\d+/)[0]),['/day/2','/day/5']);
  let now=2000;for(let i=0;i<5*60;i++)tel.tick(5,false,now+=1000);assert.equal(sent.some(u=>u.includes('/time/')),false,'paused time does not count');
  for(let i=0;i<5*60;i++)tel.tick(5,true,now+=1000);assert.ok(sent.some(u=>u.includes('/time/5min')));
  tel.gameStarted(true);tel.tick(5,true,now+=1000);assert.equal(sent.filter(u=>u.includes('/day/5')).length,2,'a new game counts its days again');
});

test('a report carries the text, kind, contact and context, and the hourly limit counts recent reports', () => {
  const p=reportPayload({kind:'bug',text:'  Stromy blikají  ',contact:'',version:'0.138.3',context:{day:12,population:30},accessKey:'k'});
  assert.equal(p.message,'Stromy blikají');assert.equal(p.kind,'bug');assert.equal(p.contact,'—');assert.equal(p.day,12);assert.equal(p.access_key,'k');assert.match(p.subject,/0\.138\.3: bug/);
  assert.equal(reportPayload({kind:'hack',text:'x'.repeat(5000),version:'v'}).message.length,TELEMETRY.report.maxLength);
  const s=memory();s.setItem(TELEMETRY.report.storageKey,JSON.stringify([0,3500000,3600000]));assert.deepEqual(recentReports(s,3700000),[3500000,3600000]);
});
