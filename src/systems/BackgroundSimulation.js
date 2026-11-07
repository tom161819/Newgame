import { BACKGROUND_SIMULATION } from '../data/backgroundSimulation.js';
import { buildingIsComplete } from '../game/buildingState.js';

// #60: Run in Background and the catch-up. The manager keeps no second clock: it only measures how long the tab was
// hidden (performance.now, which ignores changes of the system clock) and then drives the scene's own simulation step
// (`simulationStep`, or `tick` in tests) in batches. Nothing is simulated while the player paused, after Game Over, or
// for time when the game was closed (a loaded game starts fresh).
export class BackgroundSimulation {
  constructor(scene,{enabled=false,now=()=>performance.now(),rules=BACKGROUND_SIMULATION,onStart=()=>{},onProgress=()=>{},onFinish=()=>{}}={}){
    this.scene=scene;this.enabled=!!enabled;this.now=now;this.rules=rules;this.onStart=onStart;this.onProgress=onProgress;this.onFinish=onFinish;
    this.hiddenAt=null;this.pending=0;this.session=null;
  }
  get running(){return this.pending>0;}
  setEnabled(value){this.enabled=!!value;if(!this.enabled)this.hiddenAt=null;}
  // Whether time may pass at all: same conditions as a normal frame.
  canRun(){const s=this.scene;return !s.gameOver&&!s.gameTime?.paused;}
  hide(){if(this.hiddenAt!==null)return;this.hiddenAt=this.enabled&&this.canRun()?this.now():null;}
  // Back on the tab: queue the missed time (capped per absence), counted once even when events repeat.
  show(){
    if(this.hiddenAt===null)return 0;const away=Math.max(0,this.now()-this.hiddenAt);this.hiddenAt=null;
    if(!this.enabled||!this.canRun()||away<=0)return 0;
    if(!this.session){this.session={away:0,queued:0,simulated:0,skipped:0,steps:0,before:this.snapshot(),events:[]};this.record();this.onStart(this.session);}
    const s=this.session,room=Math.max(0,this.rules.maxAbsenceMs-s.queued),add=Math.min(away,room);
    s.away+=away;s.queued+=add;s.skipped+=away-add;this.pending+=add;
    if(!this.pending)this.finish();
    return add;
  }
  // Called by the scene every drawn frame while running: simulate within the frame budget.
  step(){
    if(!this.running)return false;const start=this.now(),s=this.session,step=this.rules.stepMs;
    // At least one step per frame, then as many as fit in the frame budget.
    for(let first=true;this.pending>0&&(first||this.now()-start<this.rules.frameBudgetMs);first=false){
      if(this.scene.gameOver){this.pending=0;break;}
      if(this.scene.gameTime?.paused)break; // a pause (menu) holds the catch-up; it continues after the pause
      const d=Math.min(step,this.pending),result=this.scene.simulationStep?this.scene.simulationStep(d):this.scene.tick(d);
      this.pending-=d;s.simulated+=d;s.steps++;
      if(s.steps%this.rules.fogEverySteps===0)this.scene.observeWorld?.();
      if(result===null||this.scene.gameOver){this.pending=0;break;}
    }
    this.onProgress(s.queued?s.simulated/s.queued:1,s);
    if(!this.pending)this.finish();
    return true;
  }
  // Runs the whole queue at once (tests, and the developer console).
  runAll(){let guard=0;while(this.running&&!this.scene.gameTime?.paused&&guard++<1e7)this.step();}
  finish(){
    const s=this.session;if(!s)return;this.session=null;this.pending=0;this.stopRecording();this.scene.observeWorld?.();
    const report={...this.report(s),gameOver:!!this.scene.gameOver};this.lastReport=report;this.onFinish(report);
  }
  // Events the existing feed shows while catching up are collected for the summary.
  record(){const feed=this.scene.eventFeed;if(!feed||this.restorePush)return;const push=feed.push.bind(feed),events=this.session.events;
    feed.push=(key,text,options={})=>{const added=push(key,text,options);if(added&&this.session)events.push({text,important:!!options.important});return added;};this.restorePush=()=>{feed.push=push;};}
  stopRecording(){this.restorePush?.();this.restorePush=null;}
  snapshot(){
    const s=this.scene,resources={};for(const d of s.objectRegistry?.byCategory?.('resource')??[])if(d.collectible)resources[d.id]=s.inventory?.count?.(d.id)??0;
    return {day:s.gameTime?.day??1,elapsed:s.gameTime?.totalElapsed??0,resources,buildings:(s.buildings??[]).filter(buildingIsComplete).length,
      population:s.workerSystem?.liveWorkers?.().length??0};
  }
  // Real changes only: differences of the saved quantities before and after.
  report(s){
    const after=this.snapshot(),before=s.before,changes=[];
    for(const [id,value]of Object.entries(after.resources)){const d=value-(before.resources[id]??0);if(Math.abs(d)>=0.5)changes.push({resource:id,amount:Math.round(d)});}
    changes.sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount));
    return {away:s.away,simulated:s.simulated,skipped:s.skipped,gameMs:after.elapsed-before.elapsed,days:after.day-before.day,
      changes,buildings:after.buildings-before.buildings,population:after.population-before.population,
      events:s.events.filter(e=>e.important).concat(s.events.filter(e=>!e.important)).slice(0,this.rules.maxEvents)};
  }
  destroy(){this.stopRecording();this.pending=0;this.session=null;this.hiddenAt=null;}
}
