import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { groupTiles } from '../src/game/natureGroups.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { setLanguage,t } from '../src/i18n/index.js';
import { workMessageLabel } from '../src/i18n/names.js';
import { newTally,tallyCount,clearingSummary } from '../src/systems/RockMiningWork.js';
import { materialLine } from '../src/ui/ConstructionUI.js';
import { mergeNotices } from '../src/ui/noticeBar.js';
import { staffingLine } from '../src/systems/StaffingStatus.js';
import { tutorialQuarryDeposit,depositCentre } from '../src/systems/Tutorial.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-drobnosti-083 (report 0.83.0 points 3, 4, 6, 7, 8).
const dep=(type,x,y,{remaining=100,bound=null}={})=>({type,x,y,definition:objectRegistry.require(type),natural:{remaining,boundBuildingId:bound}});

test('point 3: the Quarry arrow takes large deposits too and prefers one the player can see',()=>{
  const castle={x:50,y:50},near=dep('stone_deposit',60,50),large=dep('stone_deposit_large',40,40);
  assert.deepEqual(depositCentre(large),{x:41.5,y:41.5},'3 × 3: the centre of the footprint');assert.deepEqual(depositCentre(near),{x:61,y:51});
  // Shot 02: the ordinary deposit is nearer but in the dark, the large one is in sight.
  const seen=d=>d===large?2:0;assert.equal(tutorialQuarryDeposit([near,large],castle,seen),large);
  assert.equal(tutorialQuarryDeposit([near,large],castle,d=>d===large?1:0),large,'explored beats unexplored');
  assert.equal(tutorialQuarryDeposit([near,large],castle,()=>2),near,'both in sight: the nearer one');
  assert.equal(tutorialQuarryDeposit([dep('stone_deposit_large',52,52)],castle)?.type,'stone_deposit_large','a large deposit alone is found');
  assert.equal(tutorialQuarryDeposit([dep('iron_deposit',51,51),dep('stone_deposit',70,70,{remaining:0}),dep('stone_deposit',55,55,{bound:3})],castle),null,'no iron, empty or taken deposit');
});

test('point 4: wait messages, construction materials and the marking line are Czech and grammatical',()=>{
  setLanguage('cs');
  assert.equal(workMessageLabel('No mature trees in working radius'),'Na známé mapě nejsou vzrostlé stromy');
  for(const m of ['No reachable mature tree','Waiting for reachable timber storage capacity','Timber preserved on the ground','No fish biting','Overfished','Deposit Depleted','Waiting for an assigned finite deposit','Walking to the shore','Training'])assert.notEqual(workMessageLabel(m),m,`${m} is translated`);
  // Shot 08: "wood: potřeba 6 …" – the row's own resource id overrode the name.
  const line=materialLine(objectRegistry,{resource:'wood',required:6,reserved:0,carried:0,ground:0,delivered:0,missing:6});
  assert.match(line,/^Dřevo: potřeba 6/);assert.doesNotMatch(line,/wood/);
  // Marking: the plural and the kind of what was marked.
  const tally=(o)=>{const t=newTally();for(const [k,n]of Object.entries(o))for(let i=0;i<n;i++)t[k].add(`${k}${i}`);return t;};
  assert.equal(clearingSummary(tally({rock:4})),'Označeno k odstranění: 4 skály.');
  assert.equal(clearingSummary(tally({rock:5})),'Označeno k odstranění: 5 skal.');
  assert.equal(clearingSummary(tally({thicket:1})),'Označeno k odstranění: 1 houština.');
  assert.equal(clearingSummary(tally({tree:2,bush:1})),'Označeno k odstranění: 2 stromy, 1 keř.');
  assert.equal(clearingSummary(newTally()),'Nic k odstranění se neoznačilo.');assert.equal(tallyCount(tally({rock:2,tree:1})),3);
  setLanguage('en');assert.equal(clearingSummary(tally({rock:1,bush:3})),'Marked for removal: 1 rock, 3 bushes.');
});

test('point 4: marking counts each rock, tree, bush and thicket once, also when a drag passes a group again',()=>{
  const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true});s.workerSystem.unsubscribe();s.gameSettings=gameSettings({dayLengthSeconds:240});s.bushes??=new Map();s.natureGroups??=[];
  const marks=s.naturalResources.miningWork.rocks;
  for(const t of groupTiles({x:60,y:50,w:2,h:2}))s.bushes.set(`${t.x},${t.y}`,0);s.natureGroups.push({kind:'thicket',x:60,y:50,w:2,h:2});
  for(const t of groupTiles({x:70,y:50,w:2,h:2})){s.terrainGrid[t.y][t.x]=1;s.map[t.y][t.x]=1;}s.natureGroups.push({kind:'rocks',x:70,y:50,w:2,h:2});
  s.bushes.set('65,55',0);
  const tally=newTally();for(let y=50;y<=51;y++)for(let x=60;x<=61;x++)marks.markTile({x,y},true,tally);
  assert.equal(tally.thicket.size,1,'a thicket is one thicket');assert.equal(tally.bush.size,0,'its bushes are not counted as bushes');
  for(let y=50;y<=51;y++)for(let x=70;x<=71;x++)marks.markTile({x,y},true,tally);assert.equal(tally.rock.size,4,'a 2 × 2 rock: 4 rocks (shot 06), not 16');
  marks.markTile({x:65,y:55},true,tally);assert.equal(tally.bush.size,1);
  setLanguage('cs');assert.equal(clearingSummary(tally),'Označeno k odstranění: 4 skály, 1 keř, 1 houština.');
});

test('point 6: identical notices are one row with a count',()=>{
  const issues=[{key:'1:noFarm',text:'Pšeničné pole: pole čeká na farmáře své farmy.'},{key:'2:storageFull',text:'Sklad je plný.'},{key:'3:noFarm',text:'Pšeničné pole: pole čeká na farmáře své farmy.'}];
  const rows=mergeNotices(issues,i=>i.text);
  assert.equal(rows.length,2);assert.equal(rows[0].count,2);assert.deepEqual(rows[0].keys,['1:noFarm','3:noFarm'],'closing the row closes both');assert.equal(rows[0].issue.key,'1:noFarm','the first keeps its place');
  assert.equal(rows[1].count,1);
  setLanguage('cs');assert.equal(t('notice.merged',{count:2}),'×2');assert.equal(t('notice.mergedTip',{count:2}),'2 stejná upozornění');
});

test('point 7: the workplace window tells free places from workers away from the building',()=>{
  setLanguage('cs');
  // Shot 09: Barracks 1 / 5, the soldier walking home.
  assert.equal(staffingLine({count:1,capacity:5,present:0,output:0}),'Výkon 0 % – chybí 4 pracovníci, 1 je mimo budovu');
  assert.equal(staffingLine({count:2,capacity:3,present:2,output:.67}),'Výkon 67 % – chybí 1 pracovník');
  assert.equal(staffingLine({count:3,capacity:3,present:1,output:.5}),'Výkon 50 % – 2 jsou mimo budovu');
  assert.equal(staffingLine({count:5,capacity:5,present:0,output:0}),'Výkon 0 % – 5 je mimo budovu');
  assert.equal(staffingLine({count:3,capacity:3,present:3,output:1}),'Výkon 100 %');
  setLanguage('en');assert.equal(staffingLine({count:1,capacity:5,present:0,output:0}),'Output 0% – 4 workers missing, 1 away from the building');
});

test('point 8: the icon look of the speed buttons shows a moon badge on the step held by the night speed-up',()=>{
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  const rule=css.match(/\.speed-controls \.speed-button\.is-night-auto::after \{([^}]*)\}/);
  assert.ok(rule,'a badge rule for the held step');assert.match(rule[1],/content:"☾"/);assert.match(rule[1],/position:absolute/);
  // The icon look hides the text, so the badge is the only moon there.
  assert.match(css,/\.speed-controls \.speed-button \{ position:relative;[^}]*font-size:0/);
  const controls=readFileSync(new URL('../src/ui/SpeedControls.js',import.meta.url),'utf8');assert.match(controls,/classList\.toggle\('is-night-auto',moon\)/);
});
