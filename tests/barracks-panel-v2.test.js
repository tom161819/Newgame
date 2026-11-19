import test from 'node:test';
import assert from 'node:assert/strict';
import { soldierStatus } from '../src/ui/militaryPanel.js';
import { ORDER_ICONS,KIND_ICONS } from '../src/ui/unitPictures.js';
import { t } from '../src/i18n/index.js';

const scene={buildings:[{id:7,type:'barracks'}],objectRegistry:{get:()=>({name:'Barracks'})}};
test('owner 19 Nov 2026: the Barracks roster says what each soldier is doing',()=>{
  assert.equal(soldierStatus(scene,{away:true}).order,'away');
  assert.equal(soldierStatus(scene,{huntWolfId:3}).order,'hunt');
  assert.equal(soldierStatus(scene,{wallPatrol:{}}).order,'walls');
  const p=soldierStatus(scene,{workState:'Patrolling'});assert.equal(p.order,'patrol');assert.equal(p.icon,ORDER_ICONS.patrol);
  const asleep=soldierStatus(scene,{sleepingIn:7});assert.equal(asleep.asleep,true);assert.match(asleep.now,/Barracks/);
  for(const o of ['away','hunt','walls','patrol','guard'])assert.ok(ORDER_ICONS[o],o);
});
test('owner 19 Nov 2026: the slider reads "Recruit automatically", every unit class has a fallback icon',()=>{
  assert.match(t('military.autoHire',{count:4,capacity:12}),/Recruit automatically: 4 of 12/);
  for(const k of ['soldier','swordsman','archer','knight','halberdier','royal_archer','crossbowman','light_cavalry','catapult','military_wagon','recruit'])assert.ok(KIND_ICONS[`soldier:${k}`],k);
});
