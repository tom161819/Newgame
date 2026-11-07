// Path Lab (#115) model: a small editable wear map, brush strokes, undo/redo, scenarios and the JSON exchange
// format. Pure: no DOM, so the tests and the future V2 renderer (#116) share it.
export const LAB_SIZE = 24;
// Schema 2 (2026-11-07): five levels. 1 = trampled grass (a dark green track, no soil yet), 2–4 = the soil wear
// levels that were 1–3 in schema 1. Schema 1 files still import: their worn tiles move up by one.
export const LAB_SCHEMA = 2;
export const MAX_LEVEL = 4;
export const LEVELS = Object.freeze([0, 1, 2, 3, 4]);
export const SEASONS = Object.freeze(['Summer', 'Spring', 'Autumn', 'Winter']);

export class WearMap {
  constructor(size = LAB_SIZE, cells = null) { this.size = size; this.cells = cells ? Uint8Array.from(cells) : new Uint8Array(size * size); }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.size && y < this.size; }
  get(x, y) { return this.inside(x, y) ? this.cells[y * this.size + x] : 0; }
  set(x, y, level) { if (this.inside(x, y)) this.cells[y * this.size + x] = Math.max(0, Math.min(MAX_LEVEL, level | 0)); }
  clone() { return new WearMap(this.size, this.cells); }
  equals(other) { return other && other.size === this.size && this.cells.every((v, i) => v === other.cells[i]); }
  count() { return this.cells.reduce((n, v) => n + (v ? 1 : 0), 0); }
}

// A square brush of `size` tiles (1, 2, 3 …) centred on the tile.
export function stamp(map, x, y, level, size = 1) {
  const from = -Math.floor((size - 1) / 2);
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) map.set(x + from + dx, y + from + dy, level);
}
// A drag between two tiles paints every tile on the way (no gaps when the pointer moves fast).
export function strokeLine(map, a, b, level, size = 1) {
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  for (let i = 0; i <= steps; i++) stamp(map, Math.round(a.x + (b.x - a.x) * i / steps), Math.round(a.y + (b.y - a.y) * i / steps), level, size);
}

// Undo/redo of whole map snapshots (24 × 24 bytes each, so cheap); one entry per finished stroke.
export class History {
  constructor(map, limit = 100) { this.undoStack = []; this.redoStack = []; this.limit = limit; this.current = map.clone(); }
  commit(map) { if (map.equals(this.current)) return false; this.undoStack.push(this.current); if (this.undoStack.length > this.limit) this.undoStack.shift(); this.current = map.clone(); this.redoStack = []; return true; }
  undo() { if (!this.undoStack.length) return null; this.redoStack.push(this.current); this.current = this.undoStack.pop(); return this.current.clone(); }
  redo() { if (!this.redoStack.length) return null; this.undoStack.push(this.current); this.current = this.redoStack.pop(); return this.current.clone(); }
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
}

// One-click scenes (#115 C). Each paints a fresh map, so every renderer variant is compared on the same layout.
// The older scenes were drawn with the soil levels 1–3; they keep their look (scenarioMap moves them up by one) unless
// they say `soil: false` and paint the five-level scale themselves.
const line = (map, a, b, level, size = 1) => strokeLine(map, a, b, level, size);
const box = (map, x, y, w, h, level) => { for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) map.set(x + dx, y + dy, level); };
export const SCENARIOS = Object.freeze([
  { id: 'straight', name: 'Straight path 1 × 12', paint: m => line(m, { x: 6, y: 12 }, { x: 17, y: 12 }, 2) },
  { id: 'curves', name: 'Long bend and S-curve', paint: m => { line(m, { x: 3, y: 4 }, { x: 10, y: 4 }, 2); line(m, { x: 10, y: 4 }, { x: 13, y: 7 }, 2); line(m, { x: 13, y: 7 }, { x: 13, y: 11 }, 2); line(m, { x: 13, y: 11 }, { x: 16, y: 14 }, 2); line(m, { x: 16, y: 14 }, { x: 21, y: 14 }, 2); line(m, { x: 4, y: 18 }, { x: 8, y: 18 }, 1); line(m, { x: 8, y: 18 }, { x: 10, y: 20 }, 1); line(m, { x: 10, y: 20 }, { x: 14, y: 20 }, 1); } },
  { id: 'corner', name: 'Sharp 90° L corner', paint: m => { line(m, { x: 5, y: 8 }, { x: 14, y: 8 }, 2); line(m, { x: 14, y: 8 }, { x: 14, y: 18 }, 2); } },
  { id: 'junctions', name: 'T junction, Y branch and crossing', paint: m => { line(m, { x: 2, y: 5 }, { x: 11, y: 5 }, 2); line(m, { x: 6, y: 5 }, { x: 6, y: 10 }, 2); line(m, { x: 14, y: 3 }, { x: 17, y: 6 }, 1); line(m, { x: 20, y: 3 }, { x: 17, y: 6 }, 1); line(m, { x: 17, y: 6 }, { x: 17, y: 10 }, 2); line(m, { x: 4, y: 17 }, { x: 14, y: 17 }, 2); line(m, { x: 9, y: 13 }, { x: 9, y: 21 }, 2); } },
  { id: 'path-to-area', name: 'Narrow path into 3 × 3 and 5 × 5 areas', priority: true, paint: m => { line(m, { x: 2, y: 6 }, { x: 8, y: 6 }, 2); box(m, 9, 5, 3, 3, 3); line(m, { x: 3, y: 16 }, { x: 10, y: 16 }, 1); box(m, 11, 14, 5, 5, 3); line(m, { x: 16, y: 16 }, { x: 21, y: 16 }, 2); } },
  { id: 'mixed', name: 'Parallel paths, clusters, mixed levels, map edge', paint: m => { line(m, { x: 0, y: 3 }, { x: 10, y: 3 }, 1); line(m, { x: 0, y: 5 }, { x: 10, y: 5 }, 2); line(m, { x: 0, y: 7 }, { x: 10, y: 7 }, 3); box(m, 14, 2, 2, 2, 1); box(m, 17, 4, 3, 2, 2); line(m, { x: 4, y: 12 }, { x: 8, y: 12 }, 1); line(m, { x: 8, y: 12 }, { x: 12, y: 12 }, 2); line(m, { x: 12, y: 12 }, { x: 16, y: 12 }, 3); line(m, { x: 23, y: 10 }, { x: 23, y: 23 }, 2); line(m, { x: 12, y: 23 }, { x: 23, y: 23 }, 2); } },
  { id: 'levels', name: 'Wear levels 1–4 (1 = trampled grass; chunk edge at 10)', soil: false, paint: m => { for (const [y, level] of [[3, 1], [7, 2], [11, 3], [15, 4]]) line(m, { x: 3, y }, { x: 20, y }, level); line(m, { x: 10, y: 17 }, { x: 10, y: 22 }, 3); line(m, { x: 6, y: 20 }, { x: 14, y: 20 }, 2); } },
  // Transitions: one path whose wear rises 1 → 4 along its length, into an area of mixed 3 and 4 tiles (the case where
  // the levels used to change at the tile edges), and a grass track branching off a worn path.
  { id: 'transitions', name: 'Level transitions 1 → 4, mixed 3/4 area', soil: false, paint: m => { line(m, { x: 1, y: 8 }, { x: 4, y: 8 }, 1); line(m, { x: 5, y: 8 }, { x: 7, y: 8 }, 2); line(m, { x: 8, y: 8 }, { x: 10, y: 8 }, 3); line(m, { x: 11, y: 8 }, { x: 13, y: 8 }, 4); box(m, 14, 5, 6, 7, 3); box(m, 15, 6, 3, 3, 4); box(m, 17, 8, 2, 3, 4); m.set(14, 10, 4); line(m, { x: 6, y: 9 }, { x: 6, y: 18 }, 1); line(m, { x: 6, y: 18 }, { x: 16, y: 18 }, 2); } },
]);
export function scenarioMap(id, size = LAB_SIZE) {
  const s = SCENARIOS.find(x => x.id === id); if (!s) throw new RangeError(`Unknown scenario ${id}`);
  const map = new WearMap(size); s.paint(map);
  if (s.soil !== false) map.cells = map.cells.map(v => (v ? Math.min(MAX_LEVEL, v + 1) : 0));
  return map;
}

// Exchange format: {schema, kind:'path-lab', name, preset, seed, season, size, wear:[…], config:{…}}.
export function exportLab({ name = 'Untitled', preset = 'current', seed = 1, season = 'Summer', map, config = {} }) {
  return { schema: LAB_SCHEMA, kind: 'path-lab', name, preset, seed, season, size: map.size, wear: Array.from(map.cells), config: { ...config } };
}
export function validateLab(data, { presets = [], params = [] } = {}) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Not a Path Lab JSON object.'];
  if (data.kind !== 'path-lab') errors.push('kind must be "path-lab".');
  if (data.schema !== LAB_SCHEMA && data.schema !== 1) errors.push(`schema ${data.schema} is not supported (expected ${LAB_SCHEMA}).`);
  if (!Number.isInteger(data.size) || data.size < 8 || data.size > 64) errors.push('size must be an integer between 8 and 64.');
  else if (!Array.isArray(data.wear) || data.wear.length !== data.size * data.size || data.wear.some(v => !LEVELS.includes(v) || (data.schema === 1 && v > 3))) errors.push(`wear must hold ${data.size}×${data.size} levels 0–${data.schema === 1 ? 3 : MAX_LEVEL}.`);
  if (!SEASONS.includes(data.season)) errors.push(`season must be one of ${SEASONS.join(', ')}.`);
  if (!Number.isInteger(data.seed)) errors.push('seed must be an integer.');
  if (presets.length && !presets.some(p => p.id === data.preset)) errors.push(`unknown preset "${data.preset}".`);
  for (const [key, value] of Object.entries(data.config ?? {})) {
    const param = params.find(p => p.key === key);
    if (!param) errors.push(`unknown parameter "${key}".`);
    else if (typeof value !== 'number' || value < param.min || value > param.max) errors.push(`${key} must be a number between ${param.min} and ${param.max}.`);
  }
  return errors;
}
export function importLab(data, options) {
  const errors = validateLab(data, options);
  if (errors.length) { const error = new Error(errors.join(' ')); error.errors = errors; throw error; }
  const wear = data.schema === 1 ? data.wear.map(v => (v ? v + 1 : 0)) : data.wear; // schema 1: soil levels 1–3 → 2–4
  return { name: String(data.name ?? 'Imported'), preset: data.preset, seed: data.seed, season: data.season, map: new WearMap(data.size, wear), config: { ...data.config } };
}
