import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>({textContent:''})};
const { LoadingScreen,sceneSettled,LOADING }=await import('../src/ui/LoadingScreen.js');

// Owner 19 Nov 2026 (74): a loading screen until the pictures in view have loaded.
function doc(){const el=()=>({hidden:false,style:{},classList:{add(){},remove(){}},setAttribute(){},append(){},remove(){},textContent:''});return {createElement:el,body:{append(){}}};}
test('the screen waits for a quiet loader and never longer than the limit',()=>{
  let now=0;const screen=new LoadingScreen(doc(),()=>now);const real=globalThis.setInterval;globalThis.setInterval=()=>1;const clear=globalThis.clearInterval;globalThis.clearInterval=()=>{};
  try{
    const load={busy:true,isLoading(){return this.busy;},list:{size:0},inflight:{size:0},totalToLoad:10,totalComplete:4};const scene={sys:{isActive:()=>true},load};
    assert.equal(sceneSettled(scene),false);load.busy=false;assert.equal(sceneSettled(scene),true);assert.equal(sceneSettled({sys:{isActive:()=>false}}),false);
    screen.show();assert.equal(screen.root.hidden,false);now=1000;screen.poll();assert.equal(screen.root.hidden,false,'no scene yet');
    screen.watch(scene);load.busy=true;now=2000;screen.poll();assert.equal(screen.root.hidden,false);
    load.busy=false;now=2100;screen.poll();now=2100+LOADING.quietMs-1;screen.poll();assert.equal(screen.root.hidden,false,'not quiet long enough');now=2100+LOADING.quietMs;screen.poll();assert.equal(screen.root.hidden,true);
    screen.show();load.busy=true;now+=LOADING.maxMs;screen.poll();assert.equal(screen.root.hidden,true,'the limit');
  }finally{globalThis.setInterval=real;globalThis.clearInterval=clear;}
});
