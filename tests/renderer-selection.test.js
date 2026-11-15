import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseRenderer,parseRendererPreference,probeWebGL,rendererLabel } from '../src/systems/RendererSelection.js';

// A fake document whose canvas hands out a WebGL context only when allowed.
function fakeDocument({gpu='NVIDIA GeForce',software=false,missing=false}={}){
  const calls=[];let lost=0;
  const doc={calls,get lost(){return lost;},createElement:tag=>{assert.equal(tag,'canvas');return {getContext:(type,attributes)=>{
    calls.push({type,attributes});
    if(missing||(software&&attributes.failIfMajorPerformanceCaveat))return null;
    return {RENDERER:7937,getExtension:name=>name==='WEBGL_debug_renderer_info'?{UNMASKED_RENDERER_WEBGL:37446}:name==='WEBGL_lose_context'?{loseContext:()=>{lost++;}}:null,
      getParameter:id=>id===37446?(software?'Google SwiftShader':gpu):null};
  }};}};
  return doc;
}
const probeWith=doc=>requireHardware=>probeWebGL(doc,{requireHardware});

// Owner 15 Nov 2026: WebGL is the default.
test('renderer preference comes only from a valid ?renderer value and defaults to WebGL',()=>{
  assert.equal(parseRendererPreference(''),'webgl');
  assert.equal(parseRendererPreference('?renderer=webgl'),'webgl');
  assert.equal(parseRendererPreference('?renderer=AUTO'),'auto');
  assert.equal(parseRendererPreference('?renderer=canvas&changelog=0.2.0'),'canvas');
  assert.equal(parseRendererPreference('?renderer=vulkan'),'webgl');
  assert.equal(parseRendererPreference('?renderer='),'webgl');
});

test('chosen Canvas never creates a WebGL probe context',()=>{
  const doc=fakeDocument();
  assert.deepEqual(chooseRenderer('canvas',probeWith(doc)),{type:'canvas',preference:'canvas',reason:'',gpu:null});
  assert.equal(doc.calls.length,0);
  assert.equal(rendererLabel(chooseRenderer('canvas',probeWith(doc))),'Canvas (requested)');
});

test('requested WebGL is used when available, including a reported software rasteriser',()=>{
  const gpu=chooseRenderer('webgl',probeWith(fakeDocument()));
  assert.equal(gpu.type,'webgl');assert.equal(gpu.gpu,'NVIDIA GeForce');assert.equal(rendererLabel(gpu),'WebGL (default)');
  const software=chooseRenderer('webgl',probeWith(fakeDocument({software:true})));
  assert.equal(software.type,'webgl');assert.match(software.reason,/software rasteriser/);
  const missing=chooseRenderer('webgl',probeWith(fakeDocument({missing:true})));
  assert.equal(missing.type,'canvas');assert.match(rendererLabel(missing),/^Canvas \(default\) · WebGL is not available\. Using Canvas\.$/);
});

test('auto selects WebGL only with hardware acceleration and otherwise falls back to Canvas',()=>{
  const doc=fakeDocument();
  const hardware=chooseRenderer('auto',probeWith(doc));
  assert.equal(hardware.type,'webgl');
  assert.equal(doc.calls[0].attributes.failIfMajorPerformanceCaveat,true);
  assert.equal(doc.lost,1,'probe contexts are released immediately');
  const software=chooseRenderer('auto',probeWith(fakeDocument({software:true})));
  assert.equal(software.type,'canvas');assert.match(software.reason,/hardware-accelerated/);
  // A browser that ignores the caveat flag but reports a software rasteriser still gets Canvas.
  const reported={createElement:()=>({getContext:()=>({RENDERER:1,getExtension:()=>null,getParameter:()=>'llvmpipe (LLVM 17)'})})};
  assert.equal(chooseRenderer('auto',probeWith(reported)).type,'canvas');
});

test('probe failures never throw and keep the game on Canvas',()=>{
  const broken={createElement:()=>({getContext:()=>{throw new Error('blocked');}})};
  assert.deepEqual(probeWebGL(broken),{available:false,hardware:false,renderer:null,reason:'WebGL probe failed: blocked'});
  assert.equal(chooseRenderer('auto',probeWith(broken)).type,'canvas');
  assert.equal(chooseRenderer('webgl',probeWith(undefined)).type,'canvas');
});
