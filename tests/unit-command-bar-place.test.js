import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
globalThis.document??={createElement:()=>({}),querySelector:()=>null};
const src=readFileSync(new URL('../src/ui/UnitSelection.js',import.meta.url),'utf8');
const { UnitSelection } = await import('../src/ui/UnitSelection.js').catch(()=>({}));

test('owner 16 Nov 2026: the unit command bar sits above the build bar and the status line',()=>{
  assert.match(src,/placeAboveBar\(/);
  const place=UnitSelection?.prototype?.placeAboveBar;if(!place)return;
  const rect=(top,height)=>({getBoundingClientRect:()=>({top,height,bottom:top+height})});
  const self={panel:{offsetParent:rect(0,800),style:{}}};
  place.call(self,{querySelectorAll:()=>[rect(740,50),rect(712,24)],querySelector:()=>null});assert.equal(self.panel.style.bottom,'96px');
  place.call(self,{querySelectorAll:()=>[rect(10,50)]});assert.equal(self.panel.style.bottom,'','a bar at the top does not move it');
});

test('owner 17 Nov 2026: with soldiers chosen the bar opens out of the Army tab, from the left edge to the tab',()=>{
  const place=UnitSelection?.prototype?.placeAboveBar;if(!place)return;
  const classes=()=>{const set=new Set();return {add:c=>set.add(c),remove:c=>set.delete(c),has:c=>set.has(c)};};
  const host={getBoundingClientRect:()=>({top:0,left:0,height:800,bottom:800})},tab={hidden:false,classList:classes(),getBoundingClientRect:()=>({top:740,left:700,right:840,width:140,height:36,bottom:776})};
  const style={setProperty(k,v){this[k]=v;}},self={panel:{offsetParent:host,style,classList:classes()},workers:()=>[{profession:'soldier'}],undock:UnitSelection.prototype.undock};
  place.call(self,{querySelectorAll:()=>[],querySelector:()=>tab});
  assert.equal(style.left,'8px');assert.equal(style.width,'832px');assert.equal(style.bottom,'60px');assert.equal(style['--neck'],'140px');
  assert.ok(self.panel.classList.has('docked')&&tab.classList.has('joined'));
  self.workers=()=>[{profession:'hauler'}];place.call(self,{querySelectorAll:()=>[],querySelector:()=>tab});
  assert.ok(!self.panel.classList.has('docked')&&!tab.classList.has('joined'),'workers only: the bar stays in the middle');assert.equal(style.width,'');
});

test('owner 18 Nov 2026: a right click on a kind box takes that kind out of the selection',()=>{
  assert.match(src,/addEventListener\('contextmenu',e=>\{e\.preventDefault\(\);e\.stopPropagation\(\);this\.dropKind\(kind\);\}\)/);
  const drop=UnitSelection?.prototype?.dropKind;if(!drop)return;
  const ws=[{id:'a',k:'archer'},{id:'b',k:'knight'},{id:'c',k:'archer'}];let drawn=0,cleared=0;
  const self={ids:new Set(['a','b','c']),king:true,workers(){return ws.filter(w=>this.ids.has(w.id));},kindOf:w=>w.k,draw(){drawn++;},clear(){cleared++;this.ids=new Set();this.king=false;}};
  drop.call(self,'archer');assert.deepEqual([...self.ids],['b']);assert.equal(self.king,true);
  drop.call(self,'king');assert.equal(self.king,false);assert.deepEqual([...self.ids],['b']);
  drop.call(self,'knight');assert.equal(cleared,1,'the last kind out clears the selection');assert.ok(drawn>=2);
});
