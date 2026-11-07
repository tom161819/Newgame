// m-obchod-vylepseni: keep-between rules, vehicle prices.
import test from 'node:test';
import assert from 'node:assert/strict';
import { autoRule,effectiveAutoRule,vehicleSalePrice,TRADE_RULES } from '../src/data/trade.js';

test('Keep between buys below the low level and sells above the high one, never both',()=>{
  const {rule}=autoRule({mode:'between',below:50,above:300,maxPrice:9,minPrice:2});assert.ok(rule);
  assert.deepEqual(effectiveAutoRule(rule,20),{mode:'buy',below:50,upTo:50,maxPrice:9});
  assert.deepEqual(effectiveAutoRule(rule,320),{mode:'sell',keep:300,minPrice:2});
  assert.equal(effectiveAutoRule(rule,120),null,'in between: nothing');
  assert.equal(autoRule({mode:'between',below:300,above:50,maxPrice:9,minPrice:2}).error,'above');
  assert.equal(autoRule({mode:'between',below:50,above:50,maxPrice:9,minPrice:2}).error,'above');
  assert.equal(effectiveAutoRule({mode:'sell',keep:5,minPrice:1},0).mode,'sell','plain rules pass through');
});
test('a merchant buys vehicles for their inputs at the sell factor',()=>{
  assert.equal(vehicleSalePrice('wheelbarrow'),Math.round(120*TRADE_RULES.sellFactor));
  assert.equal(vehicleSalePrice('horse_wagon'),Math.round(520*TRADE_RULES.sellFactor));
  assert.equal(vehicleSalePrice('wood'),null);
});
