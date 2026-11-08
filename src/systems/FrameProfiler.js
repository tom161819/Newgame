// m-vykon-fps (performance-1): the developer frame profiler (Dev mode, F8 or Balance panel → Profiler). Time per frame
// split into simulation systems, the frame's HUD/panel work, fog, minimap and Phaser rendering; average and 95th
// percentile over the last 10 s. Off = zero cost: the wrappers are installed only while it is on and the original
// methods are put back when it is turned off (the only permanent hook is one boolean check in findPathToAny).
export const PROFILER_RULES=Object.freeze({windowMs:10000,capacity:1500,refreshMs:500});
// Hook for module functions that cannot be wrapped from outside (pathfinding). profileHooks.on is false unless the
// profiler is running; run() is the profiler's timed call.
export const profileHooks={on:false,run:(label,fn,args)=>fn(...args)};

// [label, group, path from the scene, method]. Self time: a nested measured call (pathfinding inside workers, needs
// inside game time) is subtracted from its caller, so the rows add up to the frame.
export const PROFILE_TARGETS=Object.freeze([
  ['game time',          'sim','gameTime','update'],
  ['needs',              'sim','needs','advance'],
  ['game time: food',    'sim','foodSystem','advance'],['game time: wages','sim','wageSystem','accrue'],['game time: nature','sim','naturalResources','advance'],
  ['game time: crops',   'sim','farmingSystem','advanceGrowth'],['game time: seasons','sim','seasons','advance'],
  ['king',               'sim','character','update'],['king',       'sim','naturalResources','updateKing'],['king','sim','player','animate'],
  ['logistics',          'sim','kingLogistics','update'],['logistics','sim','logisticsTasks','update'],
  ['animals',            'sim','animalSystem','update'],['animals',   'sim','huntingSystem','update'],['animals','sim','mountSystem','update'],
  ['workers',            'sim','workerSystem','update'],
  ['mining',             'sim','naturalResources.mining','updateDepletion'],
  ['combat',             'sim','combat','update'],
  ['construction',       'sim','constructionSystem','update'],['construction','sim','demolition','update'],
  ['farming',            'sim','farmingSystem','update'],
  ['food production',    'sim','foodProduction','update'],['food','sim','foodSystem','update'],
  ['military',           'sim','military','update'],
  ['vehicles/trade',     'sim','vehicles','update'],['vehicles/trade','sim','stables','update'],['vehicles/trade','sim','caravans','update'],['vehicles/trade','sim','trade','update'],
  ['vehicle views',      'sim','caravanViews','update'],['vehicle views','sim','vehicleViews','update'],
  ['employment',         'sim','employment','update'],
  ['diagnostics',        'sim','diagnostics','update'],
  ['regeneration',       'sim','regeneration','update'],
  ['feedback',           'sim','combatFeedback','update'],['feedback','sim','experienceFeedback','update'],
  ['wildlife respawn',   'sim','wildlifeRespawn','update'],
  ['domestic animals',   'sim','domestic','update'],
  ['children',           'sim','childrenSystem','update'],
  ['porches',            'sim','porches','update'],
  ['royal goals',        'sim','royalGoals','update'],['light fuel','sim','lightFuel','update'],
  ['night threats',      'sim','nightThreats','update'],
  ['fishing',            'sim','fishing','update'],
  ['simulation (other)', 'sim','','simulationStep'],
  // Frame work outside the simulation steps.
  ['fog: sight',         'fog','fog','update'],
  ['fog: map memory',    'fog','mapMemory','observeTerrain'],['fog: map memory','fog','mapMemory','observeObjects'],
  ['fog: edge',          'fog','fogEdge','update'],
  ['fog: memory view',   'fog','memoryRenderer','update'],
  ['terrain',            'view','terrain','update'],
  ['minimap',            'minimap','minimap','update'],
  ['views: animals/kids','view','domesticViews','update'],['views: animals/kids','view','childViews','update'],
  ['views: icons',       'view','issueIcons','update'],['views: icons','view','materialPiles','update'],['views: icons','view','fuelIcons','update'],['views: icons','view','staffingIndicators','update'],
  ['views: night',       'view','nightOverlay','update'],['views: night','view','lightSources','update'],['views: night','view','fireViews','update'],
  ['views: river/fish',  'view','fishShadows','update'],['views: river/fish','view','riverLife','update'],
  ['views: drops',       'view','dropSystem','update'],['views: drops','view','treasureSystem','update'],['views: drops','view','legacyStockpiles','update'],
  ['camera',             'view','worldCamera','update'],
  ['ui: inventory',      'ui','','updateInventory'],
  ['ui: time/food HUD',  'ui','','updateTimeDisplay'],['ui: time/food HUD','ui','','updateFoodDisplay'],['ui: time/food HUD','ui','','updateWorldCount'],['ui: time/food HUD','ui','','updateMountUI'],
  ['ui: population',     'ui','populationSidebar','update'],
  ['ui: event feed',     'ui','eventFeed','update'],
  ['ui: kingdom',        'ui','kingdomOverview','update'],['ui: kingdom','ui','kingdomHappiness','update'],
  ['ui: economy',        'ui','economyPanel','update'],['ui: economy','ui','foodEconomyPanel','refresh'],
  ['ui: panels',         'ui','unitPanel','refresh'],['ui: panels','ui','workplacePanel','refresh'],['ui: panels','ui','farmConnections','refresh'],['ui: panels','ui','naturalResourcePanel','refresh'],['ui: panels','ui','constructionUI','refresh'],['ui: panels','ui','farmingPanel','refresh'],['ui: panels','ui','storagePanel','refresh'],['ui: panels','ui','demolitionUI','refresh'],['ui: panels','ui','rockMiningTool','refresh'],['ui: panels','ui','kingCargoControl','refresh'],
  ['ui: feedback',       'ui','combatFeedback','refresh'],['ui: feedback','ui','experienceFeedback','refreshVisibility'],
  ['ui: tutorial/goals', 'ui','tutorial','update'],['ui: tutorial/goals','ui','helpArrow','update'],['ui: tutorial/goals','ui','royalGoalsPanel','update'],['ui: tutorial/goals','ui','nightControls','update'],
  ['ui: hover/select',   'ui','','updateHover'],['ui: hover/select','ui','unitSelection','draw'],
  ['seasons',            'view','naturalResources','refreshSeason'],['seasons','view','seasonTransition','update'],['seasons','view','seasonTransition','flush'],
  ['visibility (other)', 'view','','refreshVisibility'],
  ['frame (other)',      'ui','sys','sceneUpdate'],
]);
export const PROFILE_GROUPS=Object.freeze(['sim','pathfinding','view','fog','minimap','ui','render','phaser']);

const resolve=(root,path)=>path?path.split('.').reduce((o,k)=>o?.[k],root):root;
// Average and the 95th percentile of the first `size` values.
export function frameSummary(values,size){
  if(!size)return {avg:0,p95:0,max:0};let sum=0,max=0;const sorted=Array.from(values.subarray(0,size)).sort((a,b)=>a-b);
  for(const v of sorted){sum+=v;if(v>max)max=v;}return {avg:sum/size,p95:sorted[Math.min(size-1,Math.floor(size*.95))],max};
}

export class FrameProfiler {
  constructor(game,{now=()=>performance.now(),scene=()=>null}={}){
    this.game=game;this.now=now;this.scene=scene;this.hooks=profileHooks;this.enabled=false;this.installed=[];this.buckets=new Map();this.child=0;
    this.frames=0;this.head=0;this.times=new Float64Array(PROFILER_RULES.capacity);this.period=new Float32Array(PROFILER_RULES.capacity);this.lastStep=null;this.stepStarted=0;this.steps=0;
  }
  bucket(label,group){let b=this.buckets.get(label);if(!b){b={label,group,ms:0,calls:0,frames:new Float32Array(PROFILER_RULES.capacity)};this.buckets.set(label,b);}return b;}
  // Self-time wrapper: the time of measured calls inside is booked to them, not to the caller.
  timed(fn,bucket){const profiler=this,now=this.now;return function profiled(...args){const t0=now(),outer=profiler.child;profiler.child=0;try{return fn.apply(this,args);}finally{const spent=now()-t0;bucket.ms+=spent-profiler.child;bucket.calls++;profiler.child=outer+spent;}};}
  wrap(target,method,label,group){
    const fn=target?.[method];if(typeof fn!=='function'||fn.__profiled)return;
    const own=Object.prototype.hasOwnProperty.call(target,method),wrapped=this.timed(fn,this.bucket(label,group));wrapped.__profiled=true;target[method]=wrapped;
    this.installed.push({target,method,own,fn});
  }
  // Scene objects are recreated by New Game / Load: install() is repeated on every report and skips wrapped methods.
  install(){
    const scene=this.scene();if(!scene)return;
    for(const [label,group,path,method] of PROFILE_TARGETS)this.wrap(resolve(scene,path),method,label,group);
    for(const spawner of scene.resourceSpawners??[])this.wrap(spawner,'update','resource spawners','sim');
    const game=this.game;this.wrap(game.scene,'update','phaser: scenes/tweens','phaser');this.wrap(game.renderer,'preRender','render','render');this.wrap(game.renderer,'render','render','render');this.wrap(game.renderer,'postRender','render','render');
  }
  uninstall(){for(const {target,method,own,fn} of this.installed.reverse()){if(own)target[method]=fn;else delete target[method];}this.installed=[];}
  setEnabled(on){
    on=on===true;if(on===this.enabled)return on;this.enabled=on;
    // Phaser binds its loop callback and the scene's update at boot, so the frame is framed by the game's events.
    if(on){this.reset();this.install();this.game.events.on('prestep',this.onBegin??=()=>this.beginFrame());this.game.events.on('postrender',this.onEnd??=()=>this.endFrame());
      profileHooks.run=(label,fn,args)=>this.timed(fn,this.bucket(label,'pathfinding')).apply(null,args);profileHooks.on=true;}
    else{profileHooks.on=false;profileHooks.run=(label,fn,args)=>fn(...args);this.uninstall();this.game.events.off('prestep',this.onBegin);this.game.events.off('postrender',this.onEnd);}
    return on;
  }
  reset(){this.frames=0;this.head=0;this.lastStep=null;for(const b of this.buckets.values()){b.ms=0;b.calls=0;b.frames.fill(0);}}
  beginFrame(){const now=this.now();this.child=0;this.stepStarted=now;this.periodMs=this.lastStep===null?0:now-this.lastStep;this.lastStep=now;}
  endFrame(){
    const now=this.now(),cap=PROFILER_RULES.capacity,i=this.head;this.times[i]=now;this.period[i]=this.periodMs;
    const step=this.bucket('frame total','total');step.ms=now-this.stepStarted;
    for(const b of this.buckets.values()){b.frames[i]=b.ms;b.ms=0;}
    this.head=(i+1)%cap;if(this.frames<cap)this.frames++;
  }
  // The window's frames (newest last): indices into the ring buffers.
  windowIndices(windowMs=PROFILER_RULES.windowMs){
    const cap=PROFILER_RULES.capacity,end=this.times[(this.head-1+cap)%cap],list=[];
    for(let k=this.frames;k>=1;k--){const i=(this.head-k+cap)%cap;if(this.times[i]>=end-windowMs)list.push(i);}
    return list;
  }
  // Average / 95th percentile over the window: FPS from the frame period, ms per bucket, group totals.
  report(windowMs=PROFILER_RULES.windowMs){
    if(this.enabled)this.install();
    const idx=this.windowIndices(windowMs),n=idx.length,pick=a=>{const v=new Float32Array(n);idx.forEach((i,k)=>{v[k]=a[i];});return v;};
    const periods=pick(this.period).filter(v=>v>0),p=frameSummary(periods,periods.length);
    const rows=[],groups=Object.fromEntries([...PROFILE_GROUPS,'total'].map(g=>[g,new Float32Array(n)]));
    for(const b of this.buckets.values()){const v=pick(b.frames),s=frameSummary(v,n);if(b.label!=='frame total')rows.push({label:b.label,group:b.group,avg:+s.avg.toFixed(3),p95:+s.p95.toFixed(3)});const g=groups[b.group];if(g)for(let k=0;k<n;k++)g[k]+=v[k];}
    rows.sort((a,b)=>b.avg-a.avg);
    const groupSummary=Object.fromEntries(Object.entries(groups).map(([g,v])=>{const s=frameSummary(v,n);return [g,{avg:+s.avg.toFixed(3),p95:+s.p95.toFixed(3)}];}));
    return {frames:n,fps:p.avg?+(1000/p.avg).toFixed(1):0,frameMs:{avg:+p.avg.toFixed(2),p95:+p.p95.toFixed(2)},groups:groupSummary,rows};
  }
  text(report=this.report()){
    const f=v=>v.toFixed(2).padStart(6),lines=[`Profiler (F8) · ${report.fps} FPS · frame ${report.frameMs.avg} ms avg / ${report.frameMs.p95} ms p95 · ${report.frames} frames / 10 s`,'           avg ms  p95 ms'];
    for(const [g,s] of Object.entries(report.groups))if(s.avg>=.005||g==='total')lines.push(`${g.padEnd(10)} ${f(s.avg)} ${f(s.p95)}`);
    lines.push('—');for(const r of report.rows.slice(0,16))lines.push(`${r.label.slice(0,20).padEnd(20)} ${f(r.avg)} ${f(r.p95)}`);
    return lines.join('\n');
  }
  destroy(){this.setEnabled(false);}
}
