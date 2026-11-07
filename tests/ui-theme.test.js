import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_STYLES,storedUiStyle,applyUiStyle,currentUiStyle } from '../src/ui/UiTheme.js';
import { normalizeUiConfig } from '../art/ui/uiConfig.js';
import studio from '../art/ui/ui-config.json' with { type: 'json' };

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('the owner\'s UI Lab design and the four starting styles load and validate without problems',()=>{
  assert.deepEqual(UI_STYLES.map(s=>s.id),['studio','olive','wood-iron','parchment','stone-castle','classic']);
  for(const style of UI_STYLES.filter(s=>s.config)){const {problems}=normalizeUiConfig(style.config);assert.deepEqual(problems,[],style.id);}
  const {config}=normalizeUiConfig(studio);assert.equal(config.tokens.fontDisplay,'cinzel');assert.equal(config.tokens.frame,'rivets');assert.equal(config.tokens.headings,'smallcaps');
  assert.ok(Object.keys(config.panels).includes('settings-panel'),'the owner reordered Settings');
});

test('the chosen style is kept in this browser only; unknown values fall back to the owner\'s design',()=>{
  const storage=memory();assert.equal(storedUiStyle(storage),'studio');
  assert.equal(applyUiStyle('stone-castle',{doc:null,storage}),'stone-castle');assert.equal(storedUiStyle(storage),'stone-castle');assert.equal(currentUiStyle(),'stone-castle');
  storage.setItem('newgame.uiStyle','neon');assert.equal(storedUiStyle(storage),'studio');
  assert.equal(applyUiStyle('nope',{doc:null,storage}),'studio');assert.equal(applyUiStyle('classic',{doc:null,storage}),'classic');
});
