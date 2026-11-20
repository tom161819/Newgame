// World generator in New Game setup (plan m-generator-sveta, owner 8 Nov 2026: "bod 1"). The same idea as the
// Studio's World Lab: every world setting gets a slider, the seed can be rolled, and a map preview shows the world the
// code makes. The result is only a world code (MKW…); the game builds the world from that code at start, as before.
import { generateWorld } from '../game/worldGeneration.js';
import { worldStreams } from '../game/seededRandom.js';
import { COLUMNS, ROWS, PLAYER_START, DEFAULT_MAP_SIZE, validMapSize, withMapSize } from '../game/config.js';
import { GROUND, GRASS_ZONE } from '../data/worldTerrain.js';
import { WORLD_SETTINGS } from '../data/worldCode.js';
import { HEIGHT_SETTINGS } from '../game/terrainHeight.js';
import { t } from '../i18n/index.js';

const GROUND_COLORS = {
  [GROUND.BEACH]: [217, 197, 138], [GROUND.DESERT]: [224, 194, 122], [GROUND.SHALLOW]: [111, 150, 140], [GROUND.DEEP]: [70, 104, 104],
  [GROUND.FORD]: [143, 160, 130], [GROUND.MUD]: [122, 95, 67], [GROUND.SHORE_ROCKS]: [154, 149, 138],
};
const ZONE_COLORS = {
  [GRASS_ZONE.MEADOW]: [122, 154, 74], [GRASS_ZONE.LUSH]: [86, 136, 58], [GRASS_ZONE.DRY]: [179, 164, 94],
  [GRASS_ZONE.FOREST_FLOOR]: [79, 106, 52], [GRASS_ZONE.FLOWERS]: [143, 168, 90], [GRASS_ZONE.STONY]: [140, 144, 122],
};
const ROCK = [92, 88, 76], BUSH = [44, 84, 36], FOREST = [30, 66, 30];

// The world a code makes (same call as the game's new-game start).
export const previewWorld = (levels, seed) => generateWorld(Math.random, { levels, streams: worldStreams(seed) });

// One pixel per tile; forest weight darkens grass so the player sees where the woods will grow.
export function previewPixels(world) {
  const data = new Uint8ClampedArray(COLUMNS * ROWS * 4);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLUMNS; x++) {
    const i = y * COLUMNS + x, g = world.ground[y][x];
    let c = world.terrain[y][x] === 1 ? ROCK : g === GROUND.GRASS ? ZONE_COLORS[world.zones[y][x]] ?? ZONE_COLORS[0] : GROUND_COLORS[g] ?? ROCK;
    if (world.bushes?.has?.(`${x},${y}`)) c = BUSH;
    const f = g === GROUND.GRASS ? Math.min(0.8, (world.forestWeight?.[i] ?? 0) * 0.8) : 0;
    const o = i * 4; data[o] = c[0] * (1 - f) + FOREST[0] * f; data[o + 1] = c[1] * (1 - f) + FOREST[1] * f; data[o + 2] = c[2] * (1 - f) + FOREST[2] * f; data[o + 3] = 255;
  }
  return data;
}

// Slider value in the player's language (the Studio keeps the English describe() from worldCode.js).
const COUNTS = { fords: 22, forest: 200, rocks: 65, bushes: 26 };
export function describe(setting, level) {
  const k = setting.key, v = setting.value?.(level);
  // Generator 6: the terrain settings say what they make (numbers from terrainHeight.js).
  if (setting.height) { const h = HEIGHT_SETTINGS.find(s => s.key === k).value(level); const count = k === 'hilliness' ? Math.round(2 * h.scale) : k === 'plains' ? Math.round(100 * h) : k === 'hillHeight' ? h.toFixed(1) : h.toFixed(1); return t(`setup.gen.${k}Is`, { count }); }
  if (k === 'rivers') return t(`setup.gen.rivers.${level}`);
  if (k === 'lakes') return t('setup.gen.lakesCount', { count: level });
  if (k === 'desert' && !level) return t('setup.gen.none');
  if (k === 'fords') return t('setup.gen.fordsEvery', { count: Math.round(COUNTS.fords * v) });
  if (k in COUNTS) return t(`setup.gen.${k}Count`, { count: Math.round(COUNTS[k] * v) });
  return `×${Number(v).toFixed(2)}`;
}

export class WorldGenerator {
  // host: element to fill; get/set the setup's {levels, seed}; onChange after a slider moves.
  constructor(host, { get, set, size = () => DEFAULT_MAP_SIZE }) {
    this.host = host; this.get = get; this.set = set; this.size = size;
    host.innerHTML = `<canvas class="world-preview" width="${COLUMNS}" height="${ROWS}" role="img"></canvas><p class="setup-help world-preview-note"></p><div class="world-sliders"></div>`;
    this.canvas = host.querySelector('canvas'); this.note = host.querySelector('.world-preview-note');
    this.sliders = WORLD_SETTINGS.map((s, i) => {
      const label = document.createElement('label'), input = document.createElement('input'), out = document.createElement('output');
      label.innerHTML = `<span>${t(`setup.gen.${s.key}`)}</span> `; label.append(out);
      Object.assign(input, { type: 'range', min: 0, max: s.max, step: 1, name: `gen-${s.key}` }); input.dataset.level = i;
      input.addEventListener('input', () => { const w = this.get(); w.levels[i] = Number(input.value); this.set(w); });
      const cell = document.createElement('div'); cell.append(label, input); this.host.querySelector('.world-sliders').append(cell);
      return { input, out, s };
    });
    this.canvas.setAttribute('aria-label', t('setup.gen.preview'));
  }
  // Update the sliders and redraw the preview (debounced: a world takes a few tens of ms to generate).
  refresh() {
    const { levels } = this.get();
    for (const [i, { input, out, s }] of this.sliders.entries()) { input.value = levels[i]; out.textContent = describe(s, levels[i]); }
    clearTimeout(this.timer); this.timer = setTimeout(() => this.draw(), 120);
  }
  draw() {
    if (this.host.closest('details:not([open])') || this.host.closest('[hidden]')) { this.stale = true; return; }
    this.stale = false;
    const { levels, seed } = this.get(), started = performance.now();
    // m-velikost-mapy: the preview is generated at the chosen map size (and the running size is put back).
    const size = validMapSize(this.size()) ? this.size() : DEFAULT_MAP_SIZE;
    withMapSize(size, () => {
      const world = previewWorld(levels, seed); this.canvas.width = COLUMNS; this.canvas.height = ROWS; const ctx = this.canvas.getContext('2d');
      ctx.putImageData(new ImageData(previewPixels(world), COLUMNS, ROWS), 0, 0);
      ctx.fillStyle = '#b3261e'; ctx.fillRect(PLAYER_START.x - 1, PLAYER_START.y - 1, 3, 3);
    });
    this.note.textContent = t('setup.gen.note');
    this.lastMs = performance.now() - started;
  }
}
