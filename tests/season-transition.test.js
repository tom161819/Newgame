import test from 'node:test';
import assert from 'node:assert/strict';
import { SeasonTransition, SEASON_TRANSITION, seasonBlend, transitionState } from '../src/game/SeasonTransition.js';
import { calendar, SEASON_DAYS } from '../src/data/seasons.js';
import { COLUMNS, ROWS } from '../src/game/config.js';

const DAY = 120000;
const seasons = (cycleDay, elapsed = 0, enabled = true) => ({ enabled, cycleDay, cycleElapsed: elapsed, time: { dayDuration: DAY }, get calendar() { return calendar(this.cycleDay); } });
const windowMs = SEASON_DAYS * DAY * SEASON_TRANSITION.share;

test('the transition runs over the first part of a season, from the previous season, and never in the first season or with Seasons OFF', () => {
  assert.equal(transitionState(seasons(1)), null, 'a new game starts in plain spring');
  assert.equal(transitionState(seasons(3)), null);
  assert.deepEqual(transitionState(seasons(SEASON_DAYS + 1)), { from: 'Spring', to: 'Summer', progress: 0 });
  assert.equal(transitionState(seasons(SEASON_DAYS * 3 + 1, windowMs / 2)).from, 'Autumn');
  assert.equal(transitionState(seasons(SEASON_DAYS * 3 + 1, windowMs / 2)).progress, 0.5);
  assert.deepEqual(transitionState(seasons(SEASON_DAYS * 4 + 1)), { from: 'Winter', to: 'Spring', progress: 0 }, 'winter returns to spring in the second year');
  assert.equal(transitionState(seasons(SEASON_DAYS + 2, windowMs)), null, 'done after the window');
  assert.equal(transitionState(seasons(SEASON_DAYS + 1, 1000, false)), null, 'Seasons OFF is permanent summer without animation');
});

test('blend is uneven, monotonic and complete; the game and studio share it', async () => {
  const studio = await import('../studio/src/lib/surface.js');
  assert.equal(studio.seasonBlend, seasonBlend);
  let early = 0, late = 0;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) { const v = seasonBlend(0.5, x, y); if (v > 0.9) early++; if (v < 0.1) late++; assert.equal(seasonBlend(1, x, y), 1); }
  assert.ok(early > 20 && late > 20, 'some tiles lead, others lag');
});

test('stepped updates repaint only changed tiles, trees follow their tile, the end restores the plain season', () => {
  const s = seasons(SEASON_DAYS * 2 + 1), invalidated = [], applied = [];
  const tree = { x: 5, y: 7 }, view = { applySeason() { applied.push(transition.seasonAt(tree, 'Autumn')); } };
  const transition = new SeasonTransition({}, { seasons: s, terrain: { invalidateChunksOf: tiles => invalidated.push(tiles.length) }, trees: () => [tree], view: () => view });
  assert.equal(transition.update(), true);
  assert.equal(transition.flush(), SEASON_TRANSITION.chunksPerFrame, 'a frame repaints only a few chunks');
  transition.flush(Infinity);
  assert.equal(invalidated.reduce((a, b) => a + b, 0), (COLUMNS / 10) * (ROWS / 10), 'at the start every chunk is queued once');
  assert.equal(transition.update(), false, 'nothing to do until the next step');
  assert.deepEqual(transition.mix(5, 7, 'Autumn'), { from: 'Summer', amount: 0 });
  assert.equal(transition.mix(5, 7, 'Summer'), null, 'remembered tiles of another season are left alone');
  assert.equal(applied.at(-1), 'Summer');
  s.cycleElapsed = windowMs * 0.5; transition.update(); assert.ok(transition.flush(Infinity) > 0, 'midway chunks repaint');
  s.cycleElapsed = windowMs * 0.5 + 10; assert.equal(transition.update(), false, 'within one step nothing repaints');
  s.cycleElapsed = windowMs + 1; transition.update(); transition.flush(Infinity);
  assert.equal(transition.mix(5, 7, 'Autumn'), null); assert.equal(applied.at(-1), 'Autumn');
  assert.ok(transition.levels.every(level => level === SEASON_TRANSITION.levels));
  assert.equal(transition.seasonAt({}, 'Autumn'), 'Autumn', 'trees without a tile (map memory) keep their season');
});
