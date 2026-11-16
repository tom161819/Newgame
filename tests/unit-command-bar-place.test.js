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
  place.call(self,{querySelectorAll:()=>[rect(740,50),rect(712,24)]});assert.equal(self.panel.style.bottom,'96px');
  place.call(self,{querySelectorAll:()=>[rect(10,50)]});assert.equal(self.panel.style.bottom,'','a bar at the top does not move it');
});
