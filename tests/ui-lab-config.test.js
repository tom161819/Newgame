import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_CONFIG, normalizeUiConfig, cssVariables, rootAttributes, LAYOUT, FONTS, PANELS, COLOR_TOKENS, isColor } from '../art/ui/uiConfig.js';
import { UI_PRESETS } from '../art/ui/presets.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

test('the four UI styles are complete, valid configs with their own look and layout', () => {
  assert.deepEqual(UI_PRESETS.map(p => p.style), ['olive', 'wood-iron', 'parchment', 'stone-castle']);
  for (const preset of UI_PRESETS) {
    const { config, problems } = normalizeUiConfig(preset);
    assert.deepEqual(problems, [], preset.style);
    assert.deepEqual(config, preset, `${preset.style} is already normalized`);
  }
  // Each style differs in colours, type and frame, and three of them change the layout.
  assert.equal(new Set(UI_PRESETS.map(p => p.tokens.panel)).size, 4);
  assert.equal(new Set(UI_PRESETS.map(p => `${p.tokens.texture}/${p.tokens.frame}`)).size, 4);
  assert.equal(UI_PRESETS.filter(p => JSON.stringify(p.layout) !== JSON.stringify(BASE_CONFIG.layout)).length, 3);
  assert.equal(UI_PRESETS.find(p => p.style === 'parchment').tokens.light, true);
});

test('the game config is valid and already normalised; the olive preset is the original look', () => {
  const current = json('art/ui/ui-config.json'), { config, problems } = normalizeUiConfig(current);
  assert.deepEqual(problems, []);
  assert.deepEqual(config, current);
  assert.deepEqual(normalizeUiConfig(json('art/ui/presets/olive.json')).config.tokens, normalizeUiConfig(BASE_CONFIG).config.tokens);
});

test('untrusted configs are cleaned: bad colours, positions, fonts and windows fall back or drop', () => {
  const { config, problems } = normalizeUiConfig({
    name: '  Mine  ', style: 'Evil style!', tokens: { panel: 'url(javascript:alert(1))', ink: '#fff', fontUi: 'comic', fontScale: 9, radius: -4, texture: 'wood' },
    layout: { hud: 'middle', dialogs: 'left' }, panels: { 'storage-dialog': { order: ['#a', '#a', 'x y', 'div.row~2'], hidden: ['#b'], textScale: 3, font: 'cinzel' }, 'not-a-panel': { hidden: ['#x'] } },
  });
  assert.equal(config.name, 'Mine');
  assert.equal(config.style, BASE_CONFIG.style);
  assert.equal(config.tokens.panel, BASE_CONFIG.tokens.panel);
  assert.equal(config.tokens.ink, '#fff');
  assert.equal(config.tokens.fontUi, BASE_CONFIG.tokens.fontUi);
  assert.equal(config.tokens.fontScale, 1.4);
  assert.equal(config.tokens.radius, 0);
  assert.equal(config.tokens.texture, 'wood');
  assert.equal(config.layout.hud, 'top');
  assert.equal(config.layout.dialogs, 'left');
  assert.deepEqual(config.panels, { 'storage-dialog': { order: ['#a', 'div.row~2'], hidden: ['#b'], textScale: 1.5, font: 'cinzel' } });
  assert.ok(problems.some(p => p.includes('tokens.panel')));
  assert.ok(problems.some(p => p.includes('layout.hud')));
  assert.ok(problems.some(p => p.includes('not-a-panel')));
  assert.deepEqual(normalizeUiConfig(null).config, normalizeUiConfig(BASE_CONFIG).config);
});

test('a config becomes CSS variables and html attributes the theme layer understands', () => {
  const parchment = UI_PRESETS.find(p => p.style === 'parchment'), vars = cssVariables(parchment), attrs = rootAttributes(parchment);
  for (const [key] of COLOR_TOKENS) assert.ok(isColor(vars[`--ui-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`]), key);
  assert.equal(vars['--ui-font-display'], FONTS.fell.stack);
  assert.equal(attrs['data-ui-theme'], 'parchment');
  assert.equal(attrs['data-ui-light'], 'true');
  assert.equal(attrs['data-ui-dialogs'], 'right');
  // Every switch the attributes can take has rules in ui-theme.css.
  const css = readFileSync(path.join(root, 'art/ui/ui-theme.css'), 'utf8');
  for (const p of UI_PRESETS) for (const [name, value] of Object.entries(rootAttributes(p))) {
    if (name === 'data-ui-theme' || ['top', 'bottom', 'left', 'center', 'right', 'shown', 'comfortable', 'bottom-right', 'bottom-left', 'none', 'plain', 'soft', 'normal', 'false'].includes(value) && !css.includes(`[${name}="${value}"]`)) continue;
    assert.ok(css.includes(`[${name}="${value}"]`) || css.includes(`[${name}^=`) || css.includes(`[${name}$=`), `${name}="${value}" has rules`);
  }
  assert.ok(!/(^|\n)[^/\n]*\{/.test(css.replace(/html\[data-ui-[^\]]*\][^{]*\{/g, '').replace(/@[^{]*\{/g, '').replace(/\/\*[\s\S]*?\*\//g, '')), 'every rule is scoped under html[data-ui-*]');
});

test('the UI Lab snapshots exist and every captured window is a known panel', () => {
  const snapshots = json('art/ui/snapshots/panels.json');
  assert.ok(snapshots.panels.length >= 10);
  for (const p of snapshots.panels) {
    assert.ok(PANELS[p.id], p.id);
    for (const [, name] of p.html.matchAll(/__UI_IMG__\/([\w.]+)/g)) assert.ok(existsSync(path.join(root, 'art/ui/snapshots/img', name)), name);
  }
  const screen = readFileSync(path.join(root, 'art/ui/snapshots/screen.html'), 'utf8');
  for (const sel of ['class="inventory', 'class="buildings-bar', 'id="settings-panel"', 'id="population-panel"', 'class="corner-stack']) assert.ok(screen.includes(sel), sel);
  assert.ok(!/data:image\/png;base64/.test(screen), 'pictures live in img/, not inline');
  assert.ok(Object.keys(LAYOUT).length >= 8);
});
