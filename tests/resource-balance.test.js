import test from 'node:test';
import assert from 'node:assert/strict';
import { operatingNet,dailyResourceLabel,dailyResourceTone,outsideBalance } from '../src/ui/resourceEconomy.js';

// Owner 20 Nov 2026 (85): the +/− in the resource bar leaves out building and hand collection.
test('the bar balance counts production and use, not building or hand collection',()=>{
  const day={income:20,expenses:30,net:-10,incomeBySource:{Woodcutting:12,'Resource Collection':5,'Construction Refund':3},expensesBySource:{'House Construction':25,'Material Yard Cancellation Loss':1,'Smelting Fuel':4}};
  assert.equal(operatingNet(day),12-4);assert.equal(dailyResourceLabel('wood',day),'+8');assert.equal(dailyResourceTone(day),'positive');
  const only={income:4,expenses:10,net:-6,incomeBySource:{'Stone Collection':4},expensesBySource:{'Castle Upgrade':10}};assert.equal(operatingNet(only),0);assert.equal(dailyResourceTone(only),'neutral');assert.equal(dailyResourceLabel('stone',only),'0');
  assert.equal(dailyResourceLabel('wood',null),'—');assert.equal(outsideBalance('Trade Sale',false),false);assert.equal(outsideBalance('Villager Consumption',false),false);
});
