import test from 'node:test';
import assert from 'node:assert/strict';
import { closeOpenPanels,dismissPanel,installPanelDismiss,DISMISSIBLE_PANELS } from '../src/ui/PanelDismiss.js';

function dialog(id,{handlesCancel=true}={}){
  const d={id,open:true,listeners:{},closed:0,close(){this.open=false;this.closed++;},addEventListener(type,f){this.listeners[type]=f;},dispatchEvent(e){this.listeners[e.type]?.(e);return true;},closest(){return this;}};
  if(handlesCancel)d.addEventListener('cancel',e=>{e.preventDefault();d.close();});
  return d;
}
const doc=(...dialogs)=>{const listeners={};return {listeners,querySelectorAll:()=>dialogs.filter(d=>d.open),addEventListener:(type,f)=>{listeners[type]=f;}};};

test('a right click closes every open ordinary panel through its own Escape path and reports it was used',()=>{
  const unit=dialog('unit-dialog'),gallery=dialog('asset-gallery',{handlesCancel:false}),settings={open:true,setOpen(v){this.open=v;}};
  const population={open:true,setOpen(v){this.open=v;}};
  assert.equal(closeOpenPanels(doc(unit,gallery),{panels:[settings,population,null]}),true);assert.equal(population.open,false);
  assert.deepEqual([unit.open,gallery.open,settings.open],[false,false,false]);assert.equal(unit.closed,1,'closed once, by its own cancel handler');
  assert.equal(closeOpenPanels(doc(unit,gallery),{panels:[settings]}),false,'nothing open: the right click keeps its normal meaning (Move)');
  assert.ok(DISMISSIBLE_PANELS.includes('workplace-dialog'));
});

test('confirmations, pause, Save/Load and Game Over are never closed, and while one is open nothing else is closed either',()=>{
  for(const id of ['save-confirm','pause-menu','save-load-dialog','game-over']){
    const blocking=dialog(id),unit=dialog('unit-dialog');
    assert.equal(closeOpenPanels(doc(blocking,unit)),false,id);assert.equal(blocking.open,true,id);assert.equal(unit.open,true,id);
    assert.equal(dismissPanel(blocking),false,id);
  }
});

test('a right click on a modal panel backdrop closes it and suppresses the browser menu; a click inside the panel is left alone',()=>{
  const unit=dialog('unit-dialog'),d=doc(unit);installPanelDismiss(d);let prevented=0;
  d.listeners.contextmenu({target:{closest:()=>unit},preventDefault(){prevented++;}});
  assert.equal(unit.open,true,'right click on a control inside the panel keeps its meaning');assert.equal(prevented,0);
  d.listeners.contextmenu({target:unit,preventDefault(){prevented++;}});
  assert.equal(unit.open,false);assert.equal(prevented,1);
});
