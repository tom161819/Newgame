import test from 'node:test';
import assert from 'node:assert/strict';
import { draftScale,draftStale,DRAFT_VIEW } from '../src/game/TerrainRenderer.js';
import { GroundComposite } from '../src/game/GroundComposite.js';

test('performance-3: ground first seen far out is a draft; a draft is repainted in full once the view zooms in', () => {
  assert.equal(draftScale(1),1);assert.equal(draftScale(.6),1);assert.equal(draftScale(.5),2);assert.equal(draftScale(.31),2);assert.equal(draftScale(.3),4);assert.equal(draftScale(.25),4);
  assert.equal(draftStale(0,1),false,'a full picture is never stale');assert.equal(draftStale(undefined,1),false);
  assert.equal(draftStale(2,.5),false);assert.equal(draftStale(2,.51),true);assert.equal(draftStale(4,.36),false);assert.equal(draftStale(4,.4),true);
  for(const d of DRAFT_VIEW)assert.ok(d.until>=d.zoom,'a draft painted at its zoom is not stale at once');
});

test('performance-3: the ground cache draws a newly shown chunk alone and survives a moving zoom', () => {
  const calls=[],context={setTransform(){},clearRect(){},drawImage(...a){calls.push(a);}};
  const frame={cutX:0,cutY:0,cutWidth:640,cutHeight:320,source:{image:{}}},chunk=(key,x,y)=>({visible:true,x,y,frame,texture:{key},tight:null});
  const a=chunk('a',0,0),b=chunk('b',640,0),chunks=new Map([['0,0',a]]);
  const scene={children:{list:[a,b]},worldCamera:{zoomTarget:1},textures:{exists:()=>false,remove(){}}};
  const c=Object.create(GroundComposite.prototype);Object.assign(c,{scene,terrain:{chunks},canvas:{width:1,height:1},context,texture:{setSize(w,h){c.canvas.width=w;c.canvas.height=h;},refresh(){}},image:{setSizeToFrame(){},setPosition(){return this;},setScale(v){this.scale=v;return this;},setVisible(){return this;}},state:null,touched:new Map(),stats:{full:0,partial:0}});
  const camera=(zoom,x=0,y=0)=>({zoom,width:800,height:600,worldView:{x,y,width:800/zoom,height:600/zoom,right:x+800/zoom,bottom:y+600/zoom}});
  c.sync(camera(1));assert.deepEqual(c.stats,{full:1,partial:0});
  chunks.set('1,0',b);calls.length=0;c.sync(camera(1));assert.deepEqual(c.stats,{full:1,partial:1},'a chunk that joined is drawn alone');assert.ok(calls.length>=1&&calls.length<=2);
  c.sync(camera(1));assert.deepEqual(c.stats,{full:1,partial:1},'nothing changed: nothing drawn');
  // Zooming out: one cache for the view the zoom is heading to, kept while the zoom moves and when it arrives.
  scene.worldCamera.zoomTarget=.5;c.sync(camera(.9,-40,-30));assert.equal(c.stats.full,2);assert.equal(c.state.zoom,.5);assert.equal(c.image.scale,2);
  c.sync(camera(.7,-170,-130));c.sync(camera(.5,-400,-300));assert.equal(c.stats.full,2,'no full redraw on the way out');
  // Zooming in: the coarser cache is shown stretched while the zoom moves, then redrawn sharp once.
  scene.worldCamera.zoomTarget=1;c.sync(camera(.8,-100,-75));assert.equal(c.stats.full,2);c.sync(camera(1));assert.equal(c.stats.full,3);assert.equal(c.state.zoom,1);
});

test('m-sklad-zazdeny: site materials booked in a store no carrier can reach move to a store he can reach', async () => {
  const { ConstructionMaterialsSystem }=await import('../src/systems/ConstructionMaterialsSystem.js');
  const locations=new Map([['stockpile-2',{id:'stockpile-2',stock:{wood:18}}],['yard-10',{id:'yard-10',stock:{wood:4}}],['yard-11',{id:'yard-11',stock:{wood:50}}]]),reservations=new Map();let next=1,changes=0;
  const storage={locations,reservations,isStock:()=>true,reserved:(id,res)=>[...reservations.values()].filter(r=>r.locationId===id&&r.resource===res).reduce((n,r)=>n+r.amount,0),
    free(id,res){return Math.max(0,(locations.get(id).stock[res]??0)-this.reserved(id,res));},reserve(kind,locationId,resource,amount,owner){if(this.free(locationId,resource)<amount)return null;const id=`r${next++}`;reservations.set(id,{id,kind,locationId,resource,amount,owner});return id;},
    release(id){reservations.delete(id);},changed(){changes++;},route:(worker,[l])=>l.id==='stockpile-2'?null:[{x:0,y:0}]};
  const m=new ConstructionMaterialsSystem({scene:{foodStorage:storage,buildings:[]}});
  locations.get('stockpile-2').stock.stone=12;const stone=storage.reserve('stock','stockpile-2','stone',12,'site-19');reservations.get(stone).siteId=19;
  const id=storage.reserve('stock','stockpile-2','wood',10,'site-19');reservations.get(id).siteId=19;
  assert.equal(m.rebook(stone,{id:1}),true,'no stone elsewhere, but the wood of the same site moves');assert.equal(reservations.get(stone).amount,12);reservations.delete(stone);assert.equal(reservations.has(id),false,'the unreachable booking is gone');
  const now=[...reservations.values()].map(r=>`${r.locationId}:${r.amount}:${r.siteId}:${r.owner}`).sort();assert.deepEqual(now,['yard-10:4:19:site-19','yard-11:6:19:site-19']);
  const reachable=[...reservations.values()][0].id;assert.equal(m.rebook(reachable,{id:1}),false,'a booking in a reachable store stays');assert.equal(m.rebook('nope',{id:1}),false);
});
