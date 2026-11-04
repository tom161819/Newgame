import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initCompactHud, HUD_DETAILS_KEY } from '../src/ui/CompactHud.js';

function element() {
  const attributes = new Map(), listeners = new Map(), classes = new Set();
  return {
    hidden: false, textContent: '', title: '',
    setAttribute: (k, v) => attributes.set(k, v), getAttribute: k => attributes.get(k),
    addEventListener: (type, fn) => listeners.set(type, fn), click() { listeners.get('click')?.(); },
    classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)), contains: name => classes.has(name) },
  };
}
function fixture(saved = null, wageHidden = true) {
  const nodes = { '#hud-details-toggle': element(), '#hud-details': element(), '#wage-warning': Object.assign(element(), { hidden: wageHidden }) };
  const memory = new Map(saved == null ? [] : [[HUD_DETAILS_KEY, saved]]);
  const storage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  return { doc: { querySelector: s => nodes[s] ?? null }, nodes, memory, storage };
}

test('HUD details start collapsed, toggle accessibly and remember the choice', () => {
  const { doc, nodes, memory, storage } = fixture();
  const hud = initCompactHud(doc, storage), toggle = nodes['#hud-details-toggle'], panel = nodes['#hud-details'];
  assert.equal(panel.hidden, true); assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(toggle.textContent, 'Více');
  toggle.click();
  assert.equal(panel.hidden, false); assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.equal(toggle.textContent, 'Méně');
  assert.equal(memory.get(HUD_DETAILS_KEY), '1'); assert.equal(hud.isOpen(), true);
  const reopened = fixture('1');
  initCompactHud(reopened.doc, reopened.storage);
  assert.equal(reopened.nodes['#hud-details'].hidden, false, 'saved preference restores the open panel');
});

test('a wage warning inside collapsed details marks the toggle and storage failures are harmless', () => {
  const { doc, nodes } = fixture(null, false);
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  initCompactHud(doc, blocked);
  assert.equal(nodes['#hud-details-toggle'].classList.contains('has-alert'), true);
  assert.equal(initCompactHud({ querySelector: () => null }, blocked), null, 'pages without the HUD are unaffected');
});

test('the game layout keeps every HUD element id once and floats the HUD over the map', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['inventory-items', 'king-profile', 'king-health', 'game-time', 'season-weather', 'food-countdown', 'open-storage', 'open-food-economy', 'economy-overview', 'wage-warning', 'population-count', 'world-stones', 'equipment-summary', 'camera-mode', 'vision-status', 'follow-king', 'dismount', 'status', 'game', 'hud-details-toggle', 'hud-details'])
    assert.equal(html.split(`id="${id}"`).length - 1, 1, id);
  const viewport = html.slice(html.indexOf('<div class="viewport">'), html.indexOf('<div class="status-row">'));
  assert.ok(viewport.includes('id="game"') && viewport.includes('class="inventory"') && viewport.includes('class="camera-controls"'));
  assert.match(html, /<h1 class="game-title">Medieval Kingdom<span class="game-version" data-game-version/);
});
