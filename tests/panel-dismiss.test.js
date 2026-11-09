import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { closeOpenPanels,dismissPanel,installPanelDismiss,DISMISSIBLE_PANELS,NEVER_DISMISSED,SIDE_WINDOWS,WINDOW_SELECTOR,keepsContextMenu } from '../src/ui/PanelDismiss.js';

function dialog(id,{handlesCancel=true}={}){
  const d={id,tagName:'DIALOG',open:true,listeners:{},closed:0,close(){this.open=false;this.closed++;},addEventListener(type,f){this.listeners[type]=f;},dispatchEvent(e){this.listeners[e.type]?.(e);return true;},closest(sel){return sel.split(',').includes(`#${this.id}`)?this:null;}};
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

// A tiny DOM element whose closest() understands '#id' and tag-name selector lists.
function node(tagName,{id='',parent=null,type=null,...rest}={}){
  const n={tagName,id,parent,hidden:false,attrs:{type},classList:{set:new Set(),contains(c){return this.set.has(c);},add(c){this.set.add(c);},toggle(c,v){if(v)this.set.add(c);else this.set.delete(c);}},...rest,
    getAttribute(name){return this.attrs[name]??null;},
    matches(sel){return sel.split(',').some(p=>p.startsWith('#')?p.slice(1)===this.id:p.toUpperCase()===this.tagName);},
    closest(sel){for(let e=this;e;e=e.parent)if(e.matches(sel))return e;return null;}};
  return n;
}
const rightClick=(d,target)=>{let prevented=0;d.listeners.contextmenu({target,preventDefault(){prevented++;}});return prevented;};

test('a right click on a modal panel backdrop closes all panels; inside a panel it closes just that panel',()=>{
  const unit=dialog('unit-dialog'),wiki=dialog('wiki-dialog'),d=doc(unit,wiki);installPanelDismiss(d);
  const inWiki=node('BUTTON',{parent:node('DIV',{parent:Object.assign(wiki,{matches(sel){return sel.split(',').includes('#wiki-dialog');}})})});
  assert.equal(rightClick(d,inWiki),1);assert.equal(wiki.open,false,'the Wiki opened over a panel closes alone');assert.equal(unit.open,true);
  wiki.open=true;assert.equal(rightClick(d,unit),1);assert.deepEqual([unit.open,wiki.open],[false,false],'the backdrop closes everything');
});

test('request 28: a right click inside any side window closes that window; text fields keep the browser menu',()=>{
  const closed=[];const scene={settingsPanel:{setOpen:v=>closed.push(['settings',v])},populationSidebar:{setOpen:v=>closed.push(['population',v])},
    sideCards:{close:name=>closed.push(['card',name])},employmentPanel:{close:()=>closed.push(['employment'])},noticesPanel:{setCollapsed:v=>closed.push(['notices',v])}};
  const d=doc();installPanelDismiss(d,{scene});
  for(const id of Object.keys(SIDE_WINDOWS)){
    const root=node(id==='royal-goals'?'DETAILS':'ASIDE',{id,open:true}),inner=node('SPAN',{parent:node('DIV',{parent:root})});
    const before=closed.length;assert.equal(rightClick(d,inner),1,id);
    if(id==='royal-goals')assert.equal(root.open,false,'the Royal tasks card folds');else assert.equal(closed.length,before+1,id);
  }
  assert.deepEqual(closed,[['settings',false],['population',false],['card','policy'],['employment'],['notices',true]]);
  const population=node('ASIDE',{id:'population-panel'}),search=node('INPUT',{parent:population,type:'search'}),select=node('SELECT',{parent:population}),checkbox=node('INPUT',{parent:population,type:'checkbox'});
  assert.equal(rightClick(d,search),0,'search field: browser menu stays, nothing closes');assert.equal(rightClick(d,select),0);assert.equal(closed.length,5);
  assert.equal(keepsContextMenu(node('TEXTAREA')),true);assert.equal(keepsContextMenu(checkbox),false,'a checkbox is not a text field');
  assert.equal(rightClick(d,checkbox),1);assert.deepEqual(closed.at(-1),['population',false]);
  const hidden=node('ASIDE',{id:'policy-card'});hidden.hidden=true;rightClick(d,node('B',{parent:hidden}));assert.equal(closed.length,6,'a hidden card is not closed again');
});

test('request 28: every window root in the page is registered with the right-click handler',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ids=new Set([...html.matchAll(/<dialog[^>]*\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const file of readdirSync(new URL('../src/ui/',import.meta.url)).filter(f=>f.endsWith('.js'))){
    const src=readFileSync(new URL(`../src/ui/${file}`,import.meta.url),'utf8');
    for(const m of src.matchAll(/createElement\('dialog'\);this\.dialog\.id='([^']+)'/g))ids.add(m[1]);
  }
  assert.ok(ids.size>=25,`found ${ids.size} dialogs`);// 25 since Getting started became a docked window (9 Nov 2026)
  for(const id of ids)assert.ok(DISMISSIBLE_PANELS.includes(id)||NEVER_DISMISSED.includes(id),`dialog #${id} must be in DISMISSIBLE_PANELS or NEVER_DISMISSED`);
  for(const id of [...DISMISSIBLE_PANELS,...NEVER_DISMISSED])assert.ok(ids.has(id),`registered #${id} exists`);
  // Side windows: every pop-out card / sidebar with its own close button, plus the folding cards.
  for(const id of ['settings-panel','population-panel','policy-card','employment-panel','notices-panel','royal-goals']){
    assert.ok(id in SIDE_WINDOWS,id);assert.ok(WINDOW_SELECTOR.split(',').includes(`#${id}`),id);
    assert.ok(html.includes(`id="${id}"`)||id==='royal-goals',`#${id} exists in the page`);
  }
  // The villager tooltip and the Asset Gallery's detail pane (inside #asset-gallery) are not windows of their own.
  for(const m of html.matchAll(/<aside[^>]*\bid="([^"]+)"/g))assert.ok(m[1] in SIDE_WINDOWS||['population-tooltip','asset-detail'].includes(m[1]),`aside #${m[1]} must be registered`);
});

test('a right click on the game canvas while the game is paused by Settings still closes Settings',()=>{
  const settings={open:true,setOpen(v){this.open=v;}},d=doc();installPanelDismiss(d,{panels:()=>[settings]});let prevented=0;
  d.listeners.contextmenu({target:{tagName:'CANVAS',closest:()=>null},preventDefault(){prevented++;}});
  assert.equal(settings.open,false);assert.equal(prevented,1);
  d.listeners.contextmenu({target:{tagName:'CANVAS',closest:()=>null},preventDefault(){prevented++;}});assert.equal(prevented,1,'nothing open: untouched');
});
