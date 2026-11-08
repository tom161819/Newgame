// UI Lab (Studio) and the game share this module: one config describes the look (tokens: colours, fonts, frames,
// textures), the layout (where bars, tabs, sidebars and windows dock) and per-window changes (section order, hidden
// sections, text size and font). The Studio's UI Lab edits it on snapshots of the real interface; the game applies the
// approved config (art/ui/ui-config.json) to its own document with the same applyUiConfig, so both look the same.
// Everything the config switches on is scoped under html[data-ui-theme] in art/ui/ui-theme.css: without a config
// applied the game looks exactly as before.

export const UI_SCHEMA = 1;

// Fonts the styles may use. The CSS stacks fall back to fonts the game already ships.
export const FONTS = Object.freeze({
  figtree: { label: 'Figtree (sans)', stack: "'Figtree Variable', 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  'source-serif': { label: 'Source Serif 4', stack: "'Source Serif 4 Variable', 'Source Serif 4', Georgia, 'Times New Roman', serif" },
  garamond: { label: 'EB Garamond', stack: "'EB Garamond Variable', 'EB Garamond', Georgia, serif" },
  cinzel: { label: 'Cinzel (capitals)', stack: "'Cinzel Variable', 'Cinzel', 'Source Serif 4 Variable', Georgia, serif" },
  fell: { label: 'IM Fell English (old print)', stack: "'IM Fell English', 'EB Garamond Variable', Georgia, serif" },
  system: { label: 'System UI', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
});
export const TEXTURES = Object.freeze({ none: 'Flat', wood: 'Wood grain', parchment: 'Parchment', stone: 'Stone' });
export const FRAMES = Object.freeze({ plain: 'Thin line', rivets: 'Iron rivets', inked: 'Inked double line', carved: 'Carved bevel' });
export const SHADOWS = Object.freeze({ soft: 'Soft', hard: 'Hard', none: 'None' });
export const HEADINGS = Object.freeze({ normal: 'Normal', smallcaps: 'Small capitals', uppercase: 'Capitals' });
// g-e3-tutorial-vzhled: what points at the next step in the tutorial and tips.
export const POINTERS = Object.freeze({ arrow: 'Golden arrow', hand: 'Pointing hand', forged: 'Forged iron arrow', manicula: 'Gloved hand (manicula)', pennant: 'Red pennant', parchment: 'Gilded parchment arrow' });

// Colour tokens, each mapped to a CSS custom property --ui-<name>.
export const COLOR_TOKENS = Object.freeze([
  ['page', 'Page background'], ['panel', 'Panel'], ['panelRaised', 'Panel (raised)'], ['glass', 'Floating bar'],
  ['line', 'Frame line'], ['lineSoft', 'Soft line'], ['ink', 'Text'], ['muted', 'Secondary text'], ['accent', 'Accent / gold'],
  ['button', 'Button'], ['buttonInk', 'Button text'], ['field', 'Input field'], ['good', 'Good'], ['bad', 'Warning'],
]);

// Where things dock. Values are the only positions the layout CSS knows, so a config cannot break the screen.
export const LAYOUT = Object.freeze({
  hud: { label: 'Resource bar', values: { top: 'Top of the map', bottom: 'Bottom of the map' } },
  buildingsBar: { label: 'Buildings bar', values: { bottom: 'Below the map', top: 'Above the map' } },
  settings: { label: 'Settings tab', values: { left: 'Left edge', right: 'Right edge' } },
  population: { label: 'Population tab', values: { right: 'Right edge', left: 'Left edge' } },
  cornerStack: { label: 'Notices, events and minimap', values: { 'bottom-right': 'Bottom right', 'bottom-left': 'Bottom left', 'top-right': 'Top right', 'top-left': 'Top left' } },
  dialogs: { label: 'Windows', values: { center: 'Centre', left: 'Left', right: 'Right' } },
  unitPanel: { label: 'Unit panel', values: { right: 'Right', left: 'Left' } },
  camera: { label: 'Camera chips', values: { 'bottom-left': 'Bottom left', 'bottom-right': 'Bottom right', 'top-left': 'Top left' } },
  header: { label: 'Game title', values: { shown: 'Shown', hidden: 'Hidden' } },
  density: { label: 'Density', values: { comfortable: 'Comfortable', compact: 'Compact' } },
});

// Windows and panels whose sections can be reordered, hidden and resized. Ids are the game's element ids.
export const PANELS = Object.freeze({
  'hud-details': 'Resources (expanded HUD)', 'buildings-panel': 'Buildings menu', 'population-panel': 'Population sidebar',
  'settings-panel': 'Settings', 'help-dialog': 'Getting started', 'storage-dialog': 'Storage', 'food-economy-dialog': 'Food economy',
  'employment-panel': 'Employment', 'equipment-dialog': 'Equipment', 'unit-dialog': 'King / unit panel', 'workplace-dialog': 'Workplace',
  'pause-menu': 'Pause menu', 'marketplace-dialog': 'Marketplace', 'construction-dialog': 'Construction site', 'farming-dialog': 'Farming',
  'notices-panel': 'Notices',
});

const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i, RGB = /^rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+(\s*[,/]\s*[\d.]+%?)?\s*\)$/i;
export const isColor = value => typeof value === 'string' && (HEX.test(value.trim()) || RGB.test(value.trim()));
const clampNum = (value, min, max, fallback) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);
const pick = (value, allowed, fallback) => (Object.hasOwn(allowed, value) ? value : fallback);
const KEY = /^[A-Za-z0-9#._~:-]{1,80}$/;

// The current game look, as a config. Applying it changes almost nothing; it is the base every style builds on.
export const BASE_CONFIG = Object.freeze({
  schema: UI_SCHEMA,
  name: 'Olive (current)',
  style: 'olive',
  tokens: {
    page: '#25291e', panel: '#2c3124', panelRaised: '#363c2c', glass: 'rgb(30 35 25 / .86)', line: '#79704b', lineSoft: '#5b5a40',
    ink: '#ede5c9', muted: '#b9b598', accent: '#e3c57a', button: '#4d503a', buttonInk: '#ece2c4', field: '#26321f', good: '#9fc172', bad: '#e0806b',
    fontUi: 'figtree', fontDisplay: 'source-serif', fontScale: 1, radius: 12, borderWidth: 1,
    texture: 'none', frame: 'plain', shadow: 'soft', headings: 'normal', light: false, pointer: 'arrow',
  },
  layout: { hud: 'top', buildingsBar: 'bottom', settings: 'left', population: 'right', cornerStack: 'bottom-right', dialogs: 'center', unitPanel: 'right', camera: 'bottom-left', header: 'shown', density: 'comfortable' },
  panels: {},
});

// Untrusted input (a shared database document, a pasted JSON) → a complete, valid config, plus what was dropped.
export function normalizeUiConfig(input, base = BASE_CONFIG) {
  const problems = [], src = input && typeof input === 'object' && !Array.isArray(input) ? input : (problems.push('not an object'), {});
  const t = src.tokens && typeof src.tokens === 'object' ? src.tokens : {}, bt = base.tokens;
  const tokens = {};
  for (const [key] of COLOR_TOKENS) {
    if (t[key] === undefined) tokens[key] = bt[key];
    else if (isColor(t[key])) tokens[key] = t[key].trim();
    else { tokens[key] = bt[key]; problems.push(`tokens.${key} is not a colour`); }
  }
  tokens.fontUi = pick(t.fontUi, FONTS, bt.fontUi);
  tokens.fontDisplay = pick(t.fontDisplay, FONTS, bt.fontDisplay);
  tokens.fontScale = clampNum(t.fontScale, 0.8, 1.4, bt.fontScale);
  tokens.radius = clampNum(t.radius, 0, 24, bt.radius);
  tokens.borderWidth = clampNum(t.borderWidth, 0, 4, bt.borderWidth);
  tokens.texture = pick(t.texture, TEXTURES, bt.texture);
  tokens.frame = pick(t.frame, FRAMES, bt.frame);
  tokens.shadow = pick(t.shadow, SHADOWS, bt.shadow);
  tokens.headings = pick(t.headings, HEADINGS, bt.headings);
  tokens.pointer = pick(t.pointer, POINTERS, bt.pointer ?? 'arrow');
  tokens.light = typeof t.light === 'boolean' ? t.light : bt.light;
  const l = src.layout && typeof src.layout === 'object' ? src.layout : {}, layout = {};
  for (const [key, { values }] of Object.entries(LAYOUT)) {
    layout[key] = pick(l[key], values, base.layout[key]);
    if (l[key] !== undefined && layout[key] !== l[key]) problems.push(`layout.${key} "${l[key]}" is not a position`);
  }
  const panels = {};
  for (const [id, p] of Object.entries(src.panels && typeof src.panels === 'object' ? src.panels : {})) {
    if (!Object.hasOwn(PANELS, id) || !p || typeof p !== 'object') { problems.push(`panels.${id} ignored`); continue; }
    const keys = list => (Array.isArray(list) ? [...new Set(list.filter(k => typeof k === 'string' && KEY.test(k)))] : []);
    const out = {}, order = keys(p.order), hidden = keys(p.hidden);
    if (order.length) out.order = order;
    if (hidden.length) out.hidden = hidden;
    if (p.textScale !== undefined) out.textScale = clampNum(p.textScale, 0.8, 1.5, 1);
    if (p.font !== undefined && Object.hasOwn(FONTS, p.font)) out.font = p.font;
    if (Object.keys(out).length) panels[id] = out;
  }
  const name = typeof src.name === 'string' && src.name.trim() ? src.name.trim().slice(0, 60) : base.name;
  const style = typeof src.style === 'string' && /^[a-z0-9-]{1,40}$/.test(src.style) ? src.style : base.style;
  return { config: { schema: UI_SCHEMA, name, style, tokens, layout, panels }, problems };
}

// Custom properties for the theme CSS.
export function cssVariables(config) {
  const { tokens } = config, vars = {};
  for (const [key] of COLOR_TOKENS) vars[`--ui-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`] = tokens[key];
  vars['--ui-font'] = FONTS[tokens.fontUi].stack;
  vars['--ui-font-display'] = FONTS[tokens.fontDisplay].stack;
  vars['--ui-font-scale'] = String(tokens.fontScale);
  vars['--ui-radius'] = `${tokens.radius}px`;
  vars['--ui-border'] = `${tokens.borderWidth}px`;
  return vars;
}
// Data attributes on <html> that switch the theme and layout rules.
export function rootAttributes(config) {
  const { tokens, layout } = config, attrs = { 'data-ui-theme': config.style, 'data-ui-texture': tokens.texture, 'data-ui-frame': tokens.frame, 'data-ui-shadow': tokens.shadow, 'data-ui-headings': tokens.headings, 'data-ui-pointer': tokens.pointer ?? 'arrow', 'data-ui-light': tokens.light ? 'true' : 'false' };
  for (const key of Object.keys(LAYOUT)) attrs[`data-ui-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`] = layout[key];
  return attrs;
}

// ---------- sections inside a window ----------
// A window's sections are the element children of its content root: the window itself, or the single wrapper (form,
// div) it consists of. A section's key is its id (#id) or tag.class with a running number for repeats, so the same
// markup gets the same keys in the game and in the Lab.
export function contentRoot(panel) {
  let root = panel;
  for (let i = 0; i < 3; i++) {
    const kids = [...root.children].filter(c => c.tagName !== 'SCRIPT' && c.tagName !== 'TEMPLATE');
    if (kids.length === 1 && ['FORM', 'DIV', 'SECTION'].includes(kids[0].tagName) && !kids[0].classList.contains('dialog-heading')) root = kids[0];
    else break;
  }
  return root;
}
export function sectionKey(el, seen = new Map()) {
  if (el.id) return `#${el.id}`;
  const base = `${el.tagName.toLowerCase()}${el.classList[0] ? `.${el.classList[0]}` : ''}`, n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  return n === 1 ? base : `${base}~${n}`;
}
export function sectionsOf(panel) {
  const root = contentRoot(panel), seen = new Map(), originals = root.__uiOriginalOrder;
  // Keys follow the game's own order, even after the Lab or a config has moved sections.
  const kids = originals ? originals.filter(el => el.parentElement === root) : [...root.children];
  for (const el of root.children) if (!kids.includes(el)) kids.push(el);
  return kids.filter(el => el.tagName !== 'SCRIPT' && el.tagName !== 'TEMPLATE').map(el => ({ key: sectionKey(el, seen), el, label: sectionLabel(el) }));
}
export function sectionLabel(el) {
  const heading = el.matches('h1,h2,h3,h4,legend,summary') ? el : el.querySelector('h1,h2,h3,h4,legend,summary,label,strong');
  const text = (heading?.textContent || el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 48) || `(${el.tagName.toLowerCase()})`;
}

function applyPanel(panel, settings = {}) {
  const root = contentRoot(panel);
  root.__uiOriginalOrder ??= [...root.children];
  const sections = sectionsOf(panel), byKey = new Map(sections.map(s => [s.key, s.el]));
  const hidden = new Set(settings.hidden ?? []);
  for (const s of sections) { if (hidden.has(s.key)) s.el.setAttribute('data-ui-hidden', ''); else s.el.removeAttribute('data-ui-hidden'); }
  // Wanted order: the listed keys first (in that order), the rest in the game's order. Only moves nodes that are out of
  // place, so applying the same config twice changes nothing (and does not wake the observer again).
  const listed = (settings.order ?? []).filter(k => byKey.has(k)).map(k => byKey.get(k));
  const wanted = [...listed, ...sections.map(s => s.el).filter(el => !listed.includes(el))];
  const current = [...root.children].filter(el => wanted.includes(el));
  if (wanted.some((el, i) => current[i] !== el)) {
    const rest = [...root.children].find(el => !wanted.includes(el)) ?? null;
    for (const el of wanted) root.insertBefore(el, rest);
  }
  panel.style.zoom = settings.textScale && settings.textScale !== 1 ? String(settings.textScale) : '';
  if (settings.font) { panel.style.setProperty('--ui-panel-font', FONTS[settings.font].stack); panel.setAttribute('data-ui-panel-font', ''); }
  else { panel.style.removeProperty('--ui-panel-font'); panel.removeAttribute('data-ui-panel-font'); }
}

// Applies a config to a document: <html> attributes and variables, and every window's sections. Windows the game
// creates or refills later are handled by a MutationObserver. Returns a function that undoes everything.
export function applyUiConfig(doc, input, { observe = true } = {}) {
  const { config } = normalizeUiConfig(input);
  const html = doc.documentElement, vars = cssVariables(config), attrs = rootAttributes(config);
  for (const [k, v] of Object.entries(vars)) html.style.setProperty(k, v);
  for (const [k, v] of Object.entries(attrs)) html.setAttribute(k, v);
  const applyAll = () => { for (const id of Object.keys(PANELS)) { const el = doc.getElementById(id); if (el) applyPanel(el, config.panels[id]); } };
  applyAll();
  let observer = null, queued = false;
  if (observe && typeof doc.defaultView?.MutationObserver === 'function') {
    observer = new doc.defaultView.MutationObserver(() => { if (queued) return; queued = true; doc.defaultView.requestAnimationFrame(() => { queued = false; observer.disconnect(); applyAll(); observer.observe(doc.body, { childList: true, subtree: true }); }); });
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return () => {
    observer?.disconnect();
    for (const k of Object.keys(vars)) html.style.removeProperty(k);
    for (const k of Object.keys(attrs)) html.removeAttribute(k);
    for (const id of Object.keys(PANELS)) {
      const el = doc.getElementById(id); if (!el) continue;
      applyPanel(el, {});
      const root = contentRoot(el);
      for (const child of root.__uiOriginalOrder ?? []) if (child.parentElement === root) root.append(child);
    }
  };
}
