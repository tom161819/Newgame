import test from 'node:test';
import assert from 'node:assert/strict';
import { tipPlacement,tipTop,TutorialGuide,TIP_CLEAR } from '../src/ui/TutorialGuide.js';
import { TipQueue } from '../src/ui/tipQueue.js';
import { TIPS,TIP_PARK_DAYS } from '../src/data/tips.js';
import { NoticeBarState } from '../src/ui/noticeBar.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { NightSpeedUp,NIGHT_SPEED_TIP_DAY } from '../src/systems/NightSpeedUp.js';
import { setLanguage } from '../src/i18n/index.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-tipy-mimo-listu (report 0.83.0 point 2): tips keep clear of the HUD and open windows, fold into the Notices bar
// after a game day without a reaction, and come one at a time.
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
const ov=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const box=(at,b)=>({left:at.x,top:at.y,right:at.x+b.w,bottom:at.y+b.h});
const centre=r=>({x:r.left+r.width/2,y:r.top+r.height/2});

test('a tip never covers the top bar, the side tabs, the Dev tool or "Follow the king" (shots 03, 04, 11)',()=>{
  const bubble={w:300,h:120};
  for(const [vw,vh] of [[1440,900],[1280,720],[1920,1080]]){
    // Shot 03: the night tip points at the day part inside the top bar (speed buttons and resources next to it).
    const topBar=R(20,50,vw-40,85),dayPart=R(vw-490,100,40,18),speed=R(vw-640,96,130,24),tabs=[R(vw-42,260,30,135),R(vw-42,405,30,120),R(vw-42,535,30,110)];
    const settings=R(10,405,34,34),devButton=R(10,450,34,34),follow=R(20,760,120,28),bottom=R(12,830,vw-24,60);
    const windows=[...tabs,settings,devButton,follow,bottom];
    const night=tipPlacement({point:centre(dayPart),rect:dayPart,vw,vh,bubble,windows,topBar,arrowLength:40}),b=box(night.bubble,bubble);
    assert.ok(!ov(b,topBar),`the night tip over the top bar at ${vw}×${vh}: ${JSON.stringify(b)}`);assert.ok(!ov(b,speed));
    for(const w of windows)assert.ok(!ov(b,w),`over a HUD box ${JSON.stringify(w)}`);
    assert.ok(b.top>=topBar.bottom,'below the top bar');
    // Shot 11: the cat tip points off screen to the left while the Dev tool panel is open there.
    const dev=R(55,270,320,620),cat=tipPlacement({point:{x:-300,y:700},vw,vh,bubble,windows:[...windows,dev],topBar,arrowLength:40}),c=box(cat.bubble,bubble);
    assert.ok(!ov(c,dev),`the cat tip over the Dev tool at ${vw}×${vh}: ${JSON.stringify(c)}`);assert.ok(!ov(c,follow)&&!ov(c,topBar)&&!ov(c,devButton));
    // A tip with no target (caravan): a free spot, clear of everything.
    const free=tipPlacement({vw,vh,bubble,windows:[...windows,dev],topBar}),f=box(free.bubble,bubble);
    assert.equal(free.arrow,null);for(const w of [...windows,dev,topBar])assert.ok(!ov(f,w),`the free tip over ${JSON.stringify(w)}`);
  }
});

test('the tip is placed again for the new layout: a window that opens or a smaller screen moves it',()=>{
  const bubble={w:300,h:120},topBar=R(20,50,1400,85),target=R(600,500,40,40);
  const before=box(tipPlacement({point:centre(target),rect:target,vw:1440,vh:900,bubble,windows:[],topBar,arrowLength:40}).bubble,bubble);
  // The Population panel opens right where the tip was.
  const panel=R(before.left-20,before.top-20,before.right-before.left+40,before.bottom-before.top+40);
  const after=box(tipPlacement({point:centre(target),rect:target,vw:1440,vh:900,bubble,windows:[panel],topBar,arrowLength:40}).bubble,bubble);
  assert.ok(!ov(after,panel),'moved off the panel that opened');
  // The HUD at the bottom (UI design option): the top limit falls back to 70 px.
  assert.equal(tipTop(R(8,820,1400,70)),70);assert.equal(tipTop(R(8,50,1400,85)),143);assert.equal(tipTop(null),70);
  for(const sel of ['.inventory','.population-tab','#dev-balance-panel','#dev-tool-button','#follow-king','#settings-button'])assert.ok(TIP_CLEAR.split(',').includes(sel),sel);
});

test('a tip with no reaction folds into the Notices bar after a game day; it can be opened again from there',()=>{
  const day=120000,q=new TipQueue();
  assert.equal(TIP_PARK_DAYS,1);
  assert.equal(q.next(id=>id==='night',1000)?.id,'night');
  assert.equal(q.due(1000+day-1,day),false,'not before a whole game day');
  assert.equal(q.due(1000+day,day,{held:true}),false,'the pointer over the bubble holds it');
  assert.equal(q.due(1000+day,day),true);assert.equal(q.park(1000+day).id,'night');
  assert.equal(q.current,null);assert.ok(q.seen.has('night'),'it does not pop up again by itself');
  assert.deepEqual(q.parkedList(),[{id:'night',at:1000+day}]);
  // As a notice row: new for the bar, so the collapsed bar shows the "!" tab.
  const guide={tips:q},rows=TutorialGuide.prototype.parkedTips.call(guide);
  assert.equal(rows.length,1);assert.equal(rows[0].key,'tip:night');assert.equal(rows[0].tip,'night');assert.ok(rows[0].text.length>10);
  const bar=new NoticeBarState({collapsed:true});bar.observe([],0);bar.observe(rows,10);assert.equal(bar.alert,true,'"!" on the edge tab');assert.equal(bar.peek.issue.key,'tip:night');
  // Opened again from the bar: back in the bubble, gone from the list; it may fold again after another day.
  assert.equal(q.reopen('night',5*day),true);assert.equal(q.current.id,'night');assert.deepEqual(q.parkedList(),[]);
  assert.equal(q.due(6*day,day),true);
  // Closed in the bar: gone.
  q.park(6*day);assert.equal(q.drop('night'),true);assert.deepEqual(q.parkedList(),[]);
});

test('at most one tip at a time; the others wait in a queue and come when it is gone',()=>{
  const q=new TipQueue(),holds=new Set(['cat','night','winter']),now=0;
  const first=q.next(id=>holds.has(id),now);assert.equal(first.id,'night','first in the tip order');
  assert.equal(q.next(id=>holds.has(id),now),null,'nothing else while one is open');assert.deepEqual(q.waiting,['cat','winter']);
  q.close();assert.equal(q.next(id=>holds.has(id),now).id,'cat','the queue in order');
  // A waiting tip whose moment passed is skipped (it stays unseen and comes again later).
  holds.delete('winter');q.park(10);assert.equal(q.next(id=>holds.has(id),20),null);assert.ok(!q.seen.has('winter'));
  holds.add('winter');assert.equal(q.next(id=>holds.has(id),30).id,'winter');
  // Reopening a parked tip while another is open parks the open one instead (still one bubble).
  assert.equal(q.reopen('cat',40),true);assert.equal(q.current.id,'cat');assert.deepEqual(q.parkedList().map(p=>p.id),['winter']);
  assert.equal(q.reopen('food',50),false,'only a parked tip can be reopened');
  for(const tip of TIPS)assert.ok(tip.id,'every tip has an id');
});

test('the night speed-up tip waits while a tip bubble is open (one tip at a time)',()=>{
  setLanguage('en');
  const g=new GameTimeSystem(120000);g.day=NIGHT_SPEED_TIP_DAY;g.elapsed=.3*120000;
  const s={gameTime:g,seasons:{enabled:true},gameSpeed:1,playerPaused:false},shown=[];s.dayNight=new DayNightSystem(s);
  s.speedControls={applyAuto(v){s.gameSpeed=v;},setSpeed(v){s.gameSpeed=v;}};
  s.nightSpeedUp=new NightSpeedUp(s,{read:()=>1,save:()=>{},tip:{show(){shown.push(g.day);},hide(){},destroy(){}}});
  s.tutorial={active:false,tip:{id:'cat'}};assert.equal(s.nightSpeedUp.checkTip(),false);assert.deepEqual(shown,[]);assert.equal(s.nightSpeedUp.tipShown,false,'not used up, only postponed');
  s.tutorial.tip=null;assert.equal(s.nightSpeedUp.checkTip(),true);assert.deepEqual(shown,[NIGHT_SPEED_TIP_DAY]);
});
