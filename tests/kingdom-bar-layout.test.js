import test from 'node:test';
import assert from 'node:assert/strict';
import { rect,overlaps,placeBottomLeft,bottomLift,anchorPosition,resolvePosition,normalizePosition,readPosition,writePosition,clearPosition,edgeTabLeft,readBarCollapsed,writeBarCollapsed,NOTICE_POSITION,KINGDOM_BAR } from '../src/ui/hudLayout.js';
import { KingdomOverview,kingdomBarSummary } from '../src/ui/KingdomOverview.js';
import { workerScene } from './helpers/workerScene.js';

// m-prehled-kralovstvi-pozice (plan point 81 with the owner's comments of 9 Nov).
const node=tag=>{const n={tag,className:'',dataset:{},title:'',children:[],own:'',append(...kids){n.children.push(...kids);}};
  Object.defineProperty(n,'textContent',{get:()=>n.own+n.children.map(c=>typeof c==='string'?c:c.textContent).join(''),set:v=>{n.own=String(v);n.children=[];}});return n;};
globalThis.document??={createElement:node,querySelector:()=>null};
const memory=()=>{const store=new Map();return {store,getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};};
const inside=(box,view)=>box.left>=view.left&&box.right<=view.right&&box.top>=view.top&&box.bottom<=view.bottom;
const lifted=(r,lift)=>({...r,top:r.top-lift,bottom:r.bottom-lift});
// The game's screen at two sizes, measured the way the page lays it out (body padding 8/12/10, main ≤ 1560 px centred,
// the header, status row and buildings bar outside the map; side buttons fixed at 45 % of the window height).
function screen(width,height){
  const mainW=Math.min(width-24,1560),left=(width-mainW)/2,barTop=height-10-50,view={left,top:48,right:left+mainW,bottom:barTop-33};
  const hudRows=width<1500?2:1,hud=rect(left+8,view.top+8,mainW-16,hudRows*38+14);
  const chips=rect(left+8,view.bottom-8-26,width<1500?380:420,26),minimap=rect(view.right-12-212,view.bottom-10-106,212,106),notices=rect(view.right-12-340,minimap.top-8-220,340,220);
  const settings=rect(8,Math.round(height*.45),38,38),dev=rect(8,Math.round(height*.45)+46,38,38),sideTabs=[rect(width-8-30,Math.round(height*.45),30,120)];
  const panel=rect(0,barTop-8-262,width,262);
  return {view,hud,chips,minimap,notices,settings,dev,sideTabs,panel,barTop};
}
const EXPANDED={width:330,height:152},COLLAPSED={width:210,height:30};

for(const [width,height] of [[1920,1080],[1366,768]]){
  test(`the overview bar keeps the bottom-left corner without covering anything at ${width}×${height}`,()=>{
    const s=screen(width,height);
    for(const size of [EXPANDED,COLLAPSED]){
      const obstacles=[s.hud,s.chips,s.minimap,s.notices,s.settings,s.dev,...s.sideTabs],box=placeBottomLeft({view:s.view,size,obstacles});
      assert.ok(inside(box,s.view),`inside the map ${JSON.stringify(box)}`);
      for(const o of obstacles)assert.ok(!overlaps(box,o),`clear of ${JSON.stringify(o)}: ${JSON.stringify(box)}`);
      assert.equal(box.left,s.view.left+8,'in the corner column');assert.ok(box.bottom<=s.chips.top&&box.bottom>=s.chips.top-10,'right above the camera chips');
      assert.ok(box.left+size.width<s.minimap.left&&box.left+size.width<s.notices.left,'far from the corner stack');
    }
  });
  test(`with the building strip open (full width) the overview bar moves above it at ${width}×${height}`,()=>{
    const s=screen(width,height),lift=bottomLift(s.view,s.panel);assert.ok(lift>0,'the strip reaches into the map');
    assert.equal(s.panel.left,0);assert.equal(s.panel.right,width,'the strip spans the window');
    const chips=lifted(s.chips,lift),minimap=lifted(s.minimap,lift),notices=lifted(s.notices,lift);
    assert.ok(chips.bottom<=s.panel.top&&minimap.bottom<=s.panel.top,'the lifted chips and corner stack are above the strip');
    for(const size of [EXPANDED,COLLAPSED]){
      const obstacles=[s.hud,chips,minimap,notices,s.settings,s.dev,...s.sideTabs,s.panel],box=placeBottomLeft({view:s.view,size,obstacles});
      assert.ok(inside(box,s.view),`inside the map ${JSON.stringify(box)}`);assert.ok(box.top>=s.hud.bottom,'below the HUD');
      for(const o of obstacles)assert.ok(!overlaps(box,o),`clear of ${JSON.stringify(o)}: ${JSON.stringify(box)}`);
    }
  });
}

test('the bar moves right of an obstacle when the corner column has no room, and the strip opening downwards lifts nothing',()=>{
  const view=rect(0,0,800,400),tall=rect(0,40,120,360),box=placeBottomLeft({view,size:{width:200,height:100},obstacles:[tall]});
  assert.ok(!overlaps(box,tall));assert.ok(box.left>=tall.right,'beside the tall obstacle');assert.equal(box.bottom,392,'still at the bottom');
  assert.equal(bottomLift(view,rect(0,20,800,120)),0,'a strip in the upper half (buildings bar at the top) lifts nothing');assert.equal(bottomLift(view,null),0);
});

test('a dragged Notices bar keeps its corner on resize and stays on screen',()=>{
  const big=rect(180,48,1560,939),small=rect(12,48,1342,627),size={width:340,height:220};
  const near=anchorPosition(rect(1300,600,340,220),big);assert.deepEqual([near.ax,near.ay],['right','bottom']);
  const back=resolvePosition(near,size,big);assert.equal(back.left,1300);assert.equal(back.top,600,'round trip');
  const after=resolvePosition(near,size,small);assert.ok(inside(after,small),'still on the smaller screen');assert.equal(small.right-after.right,near.x,'same distance from the right edge');
  const far=resolvePosition({ax:'left',ay:'top',x:5000,y:5000},size,small);assert.ok(inside(far,small),'clamped fully on screen');
  const topLeft=anchorPosition(rect(200,70,340,220),big);assert.deepEqual([topLeft.ax,topLeft.ay,topLeft.x,topLeft.y],['left','top',20,22]);
  assert.equal(normalizePosition({ax:'up',ay:'top',x:1,y:1}),null);assert.equal(normalizePosition({ax:'left',ay:'top',x:'1',y:1}),null);
});

test('the dragged position is kept in the browser and the reset clears it',()=>{
  const storage=memory();assert.equal(readPosition(storage),null,'no position = the corner stack');
  assert.equal(writePosition({ax:'left',ay:'bottom',x:40.4,y:12},storage),true);assert.deepEqual(readPosition(storage),{ax:'left',ay:'bottom',x:40,y:12});
  storage.setItem(NOTICE_POSITION.storageKey,'{bad json');assert.equal(readPosition(storage),null,'broken data falls back to the corner');
  writePosition({ax:'right',ay:'top',x:3,y:4},storage);clearPosition(storage);assert.equal(readPosition(storage),null);
  const broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');},removeItem(){throw new Error('blocked');}};
  assert.equal(readPosition(broken),null);assert.equal(writePosition({ax:'left',ay:'top',x:1,y:1},broken),false);clearPosition(broken);
});

test('slid away, a moved bar folds to its nearer side edge, beside a side tab at the same height',()=>{
  const view=rect(12,48,1342,627),tab={width:40,top:340,height:30};
  assert.equal(edgeTabLeft('left',view,tab),12);assert.equal(edgeTabLeft('right',view,tab),1354-40);
  const side=rect(1328,300,30,120);assert.equal(edgeTabLeft('right',view,tab,[side]),1328-4-40,'left of the side tab');
  assert.equal(edgeTabLeft('right',view,{...tab,top:500},[side]),1314,'a side tab at another height does not matter');
});

// A tiny DOM for the overview bar: the top-bar chips toggle it, the fold is kept in the browser.
function fakeDom(){
  const listeners=new Map(),els=new Map();
  const make=id=>{const el={id,hidden:false,textContent:'',title:'',dataset:{},style:{left:'',bottom:''},attrs:{},children:[],classes:new Set(),
    classList:{toggle:(c,on)=>{on?el.classes.add(c):el.classes.delete(c);},contains:c=>el.classes.has(c)},
    setAttribute:(k,v)=>{el.attrs[k]=v;},addEventListener:(type,fn)=>listeners.set(`${id}:${type}`,fn),replaceChildren:(...kids)=>{el.children=kids;},
    getBoundingClientRect:()=>rect(0,0,0,0),getClientRects:()=>[],contains:()=>false,offsetWidth:330,offsetHeight:150};return el;};
  const doc={querySelector:q=>{const id=q.replace('#','');if(!els.has(id))els.set(id,make(id));return els.get(id);},querySelectorAll:()=>[],addEventListener:()=>{}};
  for(const el of [...['kingdom-overview','kingdom-bar','kingdom-bar-body','kingdom-bar-toggle','kingdom-bar-summary'].map(id=>doc.querySelector(`#${id}`))])el.ownerDocument=doc;
  doc.querySelector('#kingdom-bar').parentElement={getBoundingClientRect:()=>({...rect(0,0,1342,627),width:1342,height:627})};
  return {doc,els,fire:(id,type)=>listeners.get(`${id}:${type}`)?.({key:'Enter',preventDefault(){}})};
}
test('the overview bar folds to a strip, the top-bar chips toggle it and the browser keeps the choice',()=>{
  const scene=workerScene(undefined,{workplaces:true});scene.workerSystem.create({x:40,y:40});
  const storage=memory(),{doc,els,fire}=fakeDom(),overview=new KingdomOverview(scene,{document:doc,storage});
  const bar=els.get('kingdom-bar'),body=els.get('kingdom-bar-body');
  assert.equal(bar.hidden,false,'shown in the game');assert.equal(overview.collapsed,false,'open the first time');assert.ok(body.children.length>=8,'residents, unemployed, needs and mood');
  assert.ok(body.children.some(r=>/Happiness/.test(r.textContent)),'the needs rows');
  fire('kingdom-overview','click');assert.equal(overview.collapsed,true);assert.equal(body.hidden,true);assert.ok(bar.classes.has('collapsed'));
  assert.equal(storage.getItem(KINGDOM_BAR.storageKey),'1');assert.equal(readBarCollapsed(storage),true);assert.equal(els.get('kingdom-overview').attrs['aria-expanded'],'false');
  assert.match(els.get('kingdom-bar-summary').textContent,/\d+ \/ \d+/,'the strip shows residents and mood');
  assert.equal(new KingdomOverview(scene,{document:fakeDom().doc,storage}).collapsed,true,'kept after a reload');
  fire('kingdom-bar-toggle','click');assert.equal(overview.collapsed,false);assert.equal(readBarCollapsed(storage),false);
  assert.equal(bar.style.left,'8px','placed in the corner');assert.equal(bar.style.bottom,'8px');
  overview.destroy();assert.equal(bar.hidden,true);
  writeBarCollapsed(true,{setItem(){throw new Error('blocked');}});
  assert.match(kingdomBarSummary({population:3,capacity:8,happiness:null}),/3 \/ 8/);
});
