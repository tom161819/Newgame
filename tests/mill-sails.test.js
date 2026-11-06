import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SAILS, stepSails, millGrinding } from '../src/game/MillSails.js';
import { objectDefinitions } from '../src/data/objects/index.js';
import { withApprovedArt } from '../src/data/objects/approvedArt.js';

test('#99 sails spin up while grinding, slow to a stop otherwise, advance only with game time, never accelerate without bound', () => {
  const s = { angle: 0, speed: 0 };
  stepSails(s, true, 0);assert.equal(s.angle, 0, 'no game time (paused): no movement');
  for (let i = 0; i < 600; i++) stepSails(s, true, 1 / 60);assert.ok(s.speed > 0.95 && s.speed <= 1, `full speed after a few seconds (${s.speed})`);
  const before = s.angle;stepSails(s, true, 1);const turned = ((s.angle - before) + Math.PI * 2) % (Math.PI * 2);
  assert.ok(Math.abs(turned - SAILS.turnsPerSecond * Math.PI * 2) < 0.05, 'turns at the authored speed, never faster');
  for (let i = 0; i < 1200; i++) stepSails(s, false, 1 / 60);assert.equal(s.speed, 0, 'stops when nobody grinds');
  const still = s.angle;stepSails(s, false, 5);assert.equal(s.angle, still);
  const big = { angle: 0, speed: 0 };stepSails(big, true, 1000);assert.ok(big.speed <= 1 && big.angle >= 0 && big.angle < Math.PI * 2, 'a huge frame step stays bounded');
});

test('#99 grinding means a Miller with a produce task at this Mill while a cycle runs', () => {
  const mill = { id: 5 }, other = { id: 6 }, worker = { workTask: { kind: 'produce' } };
  const scene = { foodProduction: { records: new Map([[5, { cycle: {} }]]) }, workerSystem: { liveWorkers: () => [worker] }, workplaceSystem: { building: () => mill } };
  assert.equal(millGrinding(scene, mill), true);assert.equal(millGrinding(scene, other), false, 'no record → no grinding');
  scene.foodProduction.records.get(5).cycle = null;assert.equal(millGrinding(scene, mill), false, 'no running cycle');
  scene.foodProduction.records.get(5).cycle = {};worker.workTask = { kind: 'foodPickup' };assert.equal(millGrinding(scene, mill), false, 'carrying is not grinding');
});

test('#99 the Mill uses the approved art split into a still body and a sails layer from the same export', () => {
  const mill = withApprovedArt(objectDefinitions.find(d => d.id === 'mill')), meta = JSON.parse(readFileSync(new URL('../art/sprites/windmill/windmill-tower.v1.json', import.meta.url)));
  assert.equal(mill.sprite, '/assets/buildings/mill/windmill-tower.v1.png', 'the approved full sprite is unchanged');
  assert.deepEqual(mill.rotor.pivot, meta.rotor.gamePivot);assert.ok(Math.abs(mill.rotor.origin.x - meta.rotor.pivot.x / meta.width) < 1e-4 && Math.abs(mill.rotor.origin.y - meta.rotor.pivot.y / meta.height) < 1e-4);
  for (const layer of ['still', 'rotor']) assert.deepEqual(readFileSync(new URL(`../public${mill.rotor[layer === 'rotor' ? 'sprite' : 'still']}`, import.meta.url)), readFileSync(new URL(`../art/sprites/windmill/windmill-tower.v1.${layer}.png`, import.meta.url)), `${layer} matches the export`);
});
