import assert from 'node:assert/strict';

// #99: a real Mill shows the approved still body with a separate sails layer at the hub; the sails turn only while a
// Miller grinds, follow game time (frozen while paused) and the full sprite stays the approved art.
export async function millSailsSmoke(page, { screenshot = null } = {}) {
  const snapshot = await page.evaluate(() => window.__game.registry.get('application').snapshot());
  const placed = await page.evaluate(() => {
    const s = window.__game.registry.get('application').scene, d = s.objectRegistry.require('mill'), occupied = new Set(s.reservedTiles().map(t => `${t.x},${t.y}`)), c = s.character.tile;
    let anchor = null, tiles = null;
    for (let r = 3; r < 14 && !anchor; r++) for (let dy = -r; dy <= r && !anchor; dy++) for (let dx = -r; dx <= r && !anchor; dx++) { const x = c.x + dx, y = c.y + dy, t = []; for (let j = 0; j < d.height; j++) for (let i = 0; i < d.width; i++) t.push({ x: x + i, y: y + j }); if (t.every(p => s.map[p.y]?.[p.x] === 0 && !occupied.has(`${p.x},${p.y}`))) { anchor = { x, y }; tiles = t; } }
    if (!anchor) throw Error('No room for the test Mill');
    const b = { id: Math.max(0, ...s.buildings.map(b => b.id)) + 1, type: 'mill', definition: d, ...anchor, tiles }; s.buildings.push(b); for (const t of tiles) s.map[t.y][t.x] = 1;
    s.towerViews.set(b.id, s.createBuildingView(d, b)); s.events.emit('buildings:changed'); s.workplaceSystem.register(b); s.foodProduction.register(b);
    const view = s.towerViews.get(b.id); s.worldCamera.following = false; s.cameras.main.setZoom(1.4).centerOn(view.rotor?.x ?? 0, view.rotor?.y ?? 0);
    window.__millSails = b.id;
    return { rotor: !!view.rotor, still: view.back.sprite.texture.key, rotorKey: view.rotor?.texture.key, depths: [view.back.container?.depth ?? view.back.sprite.depth, view.rotor?.depth], pivot: view.rotor ? [view.rotor.x - view.base.x, view.rotor.y - view.base.y] : null, expected: [d.rotor.pivot.x, d.rotor.pivot.y] };
  });
  assert.ok(placed.rotor, 'the Mill has a sails layer');assert.match(placed.still, /still/);assert.match(placed.rotorKey, /rotor/);assert.deepEqual(placed.pivot, placed.expected, 'sails sit on the hub');
  // Idle: nobody grinds, the sails stay put.
  const idle = await page.evaluate(() => { const s = window.__game.registry.get('application').scene, v = s.towerViews.get(window.__millSails); s.millSails.update(3000); return v.rotor.rotation; });
  assert.equal(idle, 0, 'idle sails do not turn');
  // Grinding (a Miller with a produce task at this Mill while a cycle runs): they spin up; paused game time freezes them.
  const spin = await page.evaluate(() => {
    const s = window.__game.registry.get('application').scene, b = s.buildings.find(x => x.id === window.__millSails), v = s.towerViews.get(b.id), w = s.workerSystem.liveSubjects()[0];
    const workplace = s.workplaceSystem.building, record = s.foodProduction.records.get(b.id), task = w.workTask, cycle = record.cycle;
    s.workplaceSystem.building = worker => worker === w ? b : workplace.call(s.workplaceSystem, worker); w.workTask = { kind: 'produce' }; record.cycle = {};
    const angles = []; for (let i = 0; i < 4; i++) { s.millSails.update(1000); angles.push(v.rotor.rotation); }
    s.workplaceSystem.building = workplace; w.workTask = task; record.cycle = cycle; return angles;
  });
  assert.ok(spin[0] > 0 && spin.every((a, i) => i === 0 || a !== spin[i - 1]), `grinding turns the sails ${JSON.stringify(spin)}`);
  await page.evaluate(() => window.__game.registry.get('application').scene.pauseManager.set('mill-sails', true));
  const paused = await page.evaluate(() => window.__game.registry.get('application').scene.towerViews.get(window.__millSails).rotor.rotation);await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.__game.registry.get('application').scene.towerViews.get(window.__millSails).rotor.rotation), paused, 'paused: no movement');
  if (screenshot) await page.screenshot({ path: screenshot });
  await page.evaluate(() => window.__game.registry.get('application').scene.pauseManager.set('mill-sails', false));
  await page.evaluate(async state => { const a = window.__game.registry.get('application'), ready = a.onGameReady.bind(a); window.__millReady = false; a.onGameReady = s => { ready(s); window.__millReady = true; a.onGameReady = ready; }; await a.load(state); }, snapshot);
  await page.waitForFunction(() => window.__millReady);await page.evaluate(() => { delete window.__millReady; delete window.__millSails; });
  console.log('PASS #99 Mill sails: approved still body + sails layer on the hub, still while idle, turning while a Miller grinds, frozen while paused');
}
