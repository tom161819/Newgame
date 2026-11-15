import test from 'node:test';
import assert from 'node:assert/strict';
import { SeasonTransition, SEASON_TRANSITION, seasonBlend, transitionState, seasonWeight, transitionStart, terrainBias, transitionDays, transitionSteps } from '../src/game/SeasonTransition.js';
import { calendar, SEASON_DAYS } from '../src/data/seasons.js';
import { COLUMNS, ROWS } from '../src/game/config.js';

const DAY = 120000;
const seasons = (cycleDay, elapsed = 0, enabled = true) => ({ enabled, cycleDay, cycleElapsed: elapsed, time: { dayDuration: DAY }, get calendar() { return calendar(this.cycleDay); } });
const DAYS = SEASON_TRANSITION.days, HALF = DAYS * SEASON_TRANSITION.lead;
// m-plynule-prechody: the window runs DAYS game days around the boundary (HALF before it, the rest after).
const move = (s, season, day) => { const t = at(season, day); s.cycleDay = t.cycleDay; s.cycleElapsed = t.cycleElapsed; return s; };
const at = (season, day) => seasons(SEASON_DAYS * season + 1 + Math.floor(day), (day - Math.floor(day)) * DAY); // season 0 = first spring

test('the transition runs over 3 game days around the season boundary, never into the first season or with Seasons OFF', () => {
  assert.equal(DAYS, 3); assert.equal(transitionDays(), 3); assert.ok(transitionSteps() >= 20 && transitionSteps() <= 28);
  assert.equal(transitionState(seasons(1)), null, 'a new game starts in plain spring');
  assert.equal(transitionState(seasons(3)), null, 'the middle of a season is plain');
  assert.deepEqual(transitionState(at(0, SEASON_DAYS - HALF)), { from: 'Spring', to: 'Summer', progress: 0 }, 'starts HALF days before the boundary');
  assert.deepEqual(transitionState(at(1, 0)), { from: 'Spring', to: 'Summer', progress: 0.5 }, 'half way at the boundary');
  const autumn = transitionState(at(2, 0.75)); assert.equal(autumn.from, 'Summer'); assert.ok(Math.abs(autumn.progress - (HALF + 0.75) / DAYS) < 1e-9);
  assert.deepEqual(transitionState(at(4, 0)), { from: 'Winter', to: 'Spring', progress: 0.5 }, 'winter returns to spring in the second year');
  assert.equal(transitionState(at(1, DAYS - HALF)), null, 'done after the window');
  assert.equal(transitionState(seasons(SEASON_DAYS + 1, 1000, false)), null, 'Seasons OFF is permanent summer without animation');
  // Progress grows evenly from 0 to 1 over the 3 days.
  let last = -1; for (let d = SEASON_DAYS - HALF; d < SEASON_DAYS + DAYS - HALF - 1e-6; d += 0.25) { const t = transitionState(at(Math.floor(d / SEASON_DAYS), d % SEASON_DAYS)); assert.ok(t && t.progress > last && t.progress < 1); last = t.progress; }
});

test('season blend weight goes 0 → 1 over the window, in patches, with a deterministic mask leaning on the terrain', () => {
  for (const to of ['Spring', 'Summer', 'Autumn', 'Winter']) {
    let mid = new Set();
    for (let y = 0; y < 40; y += 1.5) for (let x = 0; x < 40; x += 1.5) {
      assert.equal(seasonWeight(0, x, y, to, 0.5), 0); assert.equal(seasonWeight(1, x, y, to, 0.5), 1);
      let prev = 0; for (let p = 0.05; p < 1; p += 0.1) { const w = seasonWeight(p, x, y, to, 0.5); assert.ok(w >= prev - 1e-12, 'never goes back'); prev = w; }
      mid.add(Math.round(seasonWeight(0.5, x, y, to, 0.5) * 4));
      assert.equal(transitionStart(x, y, to, 0.3), transitionStart(x, y, to, 0.3), 'deterministic');
    }
    assert.ok(mid.size >= 3, `${to}: midway places show several blend levels`);
  }
  // Continuous: neighbouring points a tenth of a tile apart differ only a little (no checkerboard).
  for (let x = 0; x < 30; x += 0.1) assert.ok(Math.abs(transitionStart(x, 7, 'Summer') - transitionStart(x + 0.1, 7, 'Summer')) < 0.05);
  // Snow first in shade and away from water; the thaw first by the water and in the sun.
  assert.ok(terrainBias('Winter', 1, 0) < terrainBias('Winter', 0, 1)); assert.ok(terrainBias('Spring', 0, 1) < terrainBias('Spring', 1, 0));
  assert.equal(terrainBias('Autumn', 1, 1), 0.5);
  assert.ok(transitionStart(5, 5, 'Winter', 0) < transitionStart(5, 5, 'Winter', 1), 'an early (shady) place starts first');
});

test('a chunk shows one season until its patch begins; the stepped key changes only between steps', () => {
  const ground = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLUMNS }, (_, x) => x === 50 ? 4 : 0)), zones = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
  const s = at(2, 0), transition = new SeasonTransition({}, { seasons: s, ground: () => ground, zones: () => zones });
  const look = transition.groundLook(3, 3, 'Autumn'); assert.match(look.key, /^Summer>Autumn:\d+\/\d+$/); assert.ok(look.blend.weight(35, 35) >= 0);
  assert.deepEqual(transition.groundLook(3, 3, 'Spring'), { key: 'Spring' }, 'remembered ground of another season is left alone');
  move(s, 1, SEASON_DAYS - HALF - 0.5); // still summer, window not yet open
  assert.deepEqual(transition.groundLook(3, 3, 'Summer'), { key: 'Summer' });
  const w = transition.weight(20.5, 20.5, { from: 'Autumn', to: 'Winter', progress: 0.5 }); assert.ok(w >= 0 && w <= 1);
  const near = transition.bias(49.5, 20.5, 'Winter'), far = transition.bias(10.5, 20.5, 'Winter'); assert.ok(near > far, 'snow later by the river');
});

test('blend is uneven, monotonic and complete; the game and studio share it', async () => {
  const studio = await import('../studio/src/lib/surface.js');
  assert.equal(studio.seasonBlend, seasonBlend);
  let early = 0, late = 0;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) { const v = seasonBlend(0.5, x, y); if (v > 0.9) early++; if (v < 0.1) late++; assert.equal(seasonBlend(1, x, y), 1); }
  assert.ok(early > 20 && late > 20, 'some tiles lead, others lag');
});

test('stepped updates repaint only changed tiles, trees follow their tile, the end restores the plain season', () => {
  const s = at(1, SEASON_DAYS - HALF), invalidated = [], applied = [];
  const tree = { x: 5, y: 7 }, view = { applySeason() { applied.push(transition.seasonAt(tree, s.calendar.season)); } };
  const transition = new SeasonTransition({}, { seasons: s, terrain: { invalidateChunksOf: tiles => invalidated.push(tiles.length) }, trees: () => [tree], view: () => view });
  assert.equal(transition.update(), true);
  assert.equal(transition.flush(), SEASON_TRANSITION.chunksPerFrame, 'a frame repaints only a few chunks');
  transition.flush(Infinity);
  assert.equal(invalidated.reduce((a, b) => a + b, 0), (COLUMNS / 10) * (ROWS / 10), 'at the start every chunk is queued once');
  assert.equal(transition.update(), false, 'nothing to do until the next step');
  assert.equal(transition.mix(5, 7, 'Summer'), null, 'the first step still shows the old season');
  assert.equal(transition.mix(5, 7, 'Spring'), null, 'remembered tiles of another season are left alone');
  assert.equal(applied.at(-1), 'Summer');
  move(s, 1, SEASON_DAYS - 0.2); transition.update(); assert.ok(transition.flush(Infinity) > 0, 'later in the window chunks repaint');
  const before = transition.mix(5, 7, 'Summer'), a = transition.amount(5, 7); assert.ok(a >= 1 || a === 0 || (before.from === 'Autumn' && Math.abs(before.amount - (1 - a)) < 1e-9), 'before the boundary the new season is drawn under the old one');
  assert.equal(applied.at(-1), a >= 0.5 ? 'Autumn' : 'Summer', 'the tree follows its tile');
  s.cycleElapsed += 10; assert.equal(transition.update(), false, 'within one step nothing repaints');
  move(s, 2, DAYS - HALF + 0.01); transition.update(); transition.flush(Infinity);
  assert.equal(transition.mix(5, 7, 'Autumn'), null); assert.equal(applied.at(-1), 'Autumn');
  assert.ok(transition.levels.every(level => level === SEASON_TRANSITION.levels));
  assert.equal(transition.seasonAt({}, 'Autumn'), 'Autumn', 'trees without a tile (map memory) keep their season');
});

test('a game loaded mid-change draws the same step from its time alone', () => {
  const a = new SeasonTransition({}, { seasons: at(3, 0.4) }), b = new SeasonTransition({}, { seasons: at(3, 0.4) });
  assert.deepEqual(a.state(), b.state()); assert.equal(a.state().from, 'Autumn');
  for (let y = 0; y < ROWS; y += 7) for (let x = 0; x < COLUMNS; x += 7) assert.equal(a.amount(x, y), b.amount(x, y));
});

test('an explicit complete transition flush relays immediate painting, while a normal batch keeps its frame budget',()=>{
 const calls=[],transition=new SeasonTransition({}, {seasons:at(2,0),terrain:{invalidateChunksOf(tiles,options){calls.push({tiles:tiles.length,...options});}}});
 transition.update();transition.flush();assert.equal(calls.at(-1).immediate,false);assert.equal(calls.at(-1).tiles,SEASON_TRANSITION.chunksPerFrame);
 transition.flush(Infinity);assert.equal(calls.at(-1).immediate,true);assert.ok(calls.at(-1).tiles>SEASON_TRANSITION.chunksPerFrame);
});

// owner 15 Nov ("někde je stále ostrá hrana"): a further step of a change in play is held until the renderer has it
// prepared for the whole view, then every chunk takes it at once.
test('a season step is held until the renderer commits it, then shown everywhere at once', () => {
  const s = at(1, SEASON_DAYS - HALF + 0.2), jobs = [], invalidated = [];
  const terrain = { prepareSeasonStep(job) { jobs.push(job); }, invalidateChunksOf(tiles, options) { invalidated.push({ tiles: tiles.length, ...options }); } };
  const transition = new SeasonTransition({}, { seasons: s, terrain, trees: () => [], paused: () => false });
  transition.update();const first = transition.state();
  assert.ok(first && first.from === 'Summer' && first.to === 'Autumn');
  // Next step: the shown state stays, the renderer gets a job with the new look.
  s.cycleElapsed += DAY * DAYS / transitionSteps();
  assert.equal(transition.update(), false);
  assert.equal(transition.state().step, first.step, 'the shown step is held');
  const job = jobs.filter(Boolean).at(-1);assert.ok(job, 'the renderer was asked to prepare');
  assert.match(job.look(3, 3, 'Summer', 10).key ?? '', /Summer|Autumn/);
  const before = invalidated.length;job.commit();
  assert.equal(transition.state().step, first.step + 1, 'the new step is shown after the commit');
  assert.ok(invalidated.slice(before).some(call => call.immediate), 'the chunks repaint at once');
  // Paused (menus, tests): no hold.
  const paused = new SeasonTransition({}, { seasons: s, terrain, trees: () => [], paused: () => true });
  paused.update();s.cycleElapsed += DAY * DAYS / transitionSteps();paused.update();
  assert.equal(paused.state().step, transition.liveState().step);
});
