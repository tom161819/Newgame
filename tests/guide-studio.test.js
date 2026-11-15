import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDE } from '../src/data/guide.js';
import { draftFromGame, draftKey, move, addTask, addTip, draftProblems } from '../studio/src/lib/guideDraft.js';
import { guideSource } from '../scripts/guide-sync.mjs';
import cs from '../src/i18n/cs.js';
import en from '../src/i18n/en.js';

// Owner 15 Nov 2026: the Studio Guide page edits the start arrows, Getting started tasks and tips; Claude writes the
// sent draft back into src/data/guide.js (guide:sync).
const buildings = new Set(['granary', 'hunting_lodge', 'lumberjack_hut', 'material_yard', 'fisherman_hut', 'house']), jobs = new Set(['builder', 'hauler']);
test('a draft copies the game guide; event tips take the game text; reorder and add keep ids unique', () => {
  const d = draftFromGame(GUIDE, { cs, en });
  assert.equal(d.tasks.length, GUIDE.tasks.length);assert.equal(d.tips.find(t => t.id === 'night').text.cs, cs['tips.night']);
  assert.deepEqual(draftProblems(d, { buildings, jobs }), []);
  const moved = move(d.tasks, 0, 1);assert.deepEqual(moved.slice(0, 2).map(t => t.id), ['builder', 'granary']);assert.deepEqual(move(d.tasks, 0, -1), d.tasks);
  const more = addTask(addTask(d, { kind: 'build', building: 'house' }), { kind: 'build', building: 'house' });assert.deepEqual(more.tasks.slice(-2).map(t => t.id), ['house', 'house_2']);
  assert.match(draftProblems(more, { buildings, jobs }).join(' '), /Task "house" has no Czech title/);
  const tipped = addTip(d, 'Kolečkem myši přibližuješ mapu.'), seq = tipped.tips.filter(t => t.kind === 'sequence');
  assert.equal(seq.at(-1).text.cs, 'Kolečkem myši přibližuješ mapu.', 'a new tip goes after the last “in order” tip');
  assert.notEqual(draftKey(tipped), draftKey(d));assert.equal(draftKey(draftFromGame(GUIDE, { cs, en })), draftKey(d));
  assert.match(draftProblems({ ...d, tipGap: 5 }, { buildings, jobs }).join(' '), /10–3600 seconds/);
});
test('guide:sync writes a module the game can import with the same content', async () => {
  const d = addTip(draftFromGame(GUIDE, { cs, en }), 'Nový tip.');
  const source = guideSource(d, '// header\n'), url = `data:text/javascript,${encodeURIComponent(source)}`, mod = await import(url);
  assert.deepEqual(mod.GUIDE.tasks.map(t => t.id), GUIDE.tasks.map(t => t.id));
  assert.equal(mod.GUIDE.tips.at(GUIDE.tips.filter(t => t.kind === 'sequence').length).text.cs, 'Nový tip.');
  assert.equal(mod.GUIDE.tips.find(t => t.id === 'night').text.cs, cs['tips.night'], 'an event tip keeps its text in the file');
  assert.equal(mod.guideText(mod.GUIDE.tips.find(t => t.id === 'Novy_tip' || t.text.cs === 'Nový tip.').text, 'en'), 'Nový tip.', 'missing English shows the Czech text');
});
