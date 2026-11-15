// Isolated Phaser 4 demo. It loads exported sprites (art/sprites) and places them
// exactly as the game would: grid → world with the game's 64 × 32 projection,
// image origin from the exported anchor, depth from the anchor's screen y.
// Night uses a light map: a RenderTexture filled with the ambient colour, light
// gradients stamped with BlendModes.ADD, shown over the world with MULTIPLY.
// Nothing here is imported by the game.
import Phaser from 'phaser';
import '../styles.css';
import './demo.css';
import style from '../../../art/style-guide.json';
import approvals from '../../../art/approvals.json';
import { TIMES, timePreset, lightStrength, hexToRgb } from '../lib/lighting.js';
import { TILE_WIDTH, TILE_HEIGHT } from '../lib/projection.js';

const pngs = import.meta.glob(['../../../art/sprites/**/*.png', '!../../../art/sprites/{oak-tree,pine-tree}/*-season-*.x2.png'], { eager: true, query: '?url', import: 'default' });
const metas = import.meta.glob('../../../art/sprites/**/*.json', { eager: true, import: 'default' });
const params = new URLSearchParams(location.search);
const rendererChoice = params.get('renderer') === 'webgl' ? 'webgl' : 'canvas';
let time = TIMES.includes(params.get('time')) ? params.get('time') : 'night';

// Pick per asset: the committed preferred variant if approved, otherwise the first export.
function chooseSprites() {
  const byAsset = new Map();
  for (const [path, meta] of Object.entries(metas)) {
    const png = pngs[path.replace(/\.json$/, '.png')];
    if (!png) continue;
    const entry = { meta, url: png, key: `${meta.variantId}@v${meta.version}` };
    (byAsset.get(meta.assetId) ?? byAsset.set(meta.assetId, []).get(meta.assetId)).push(entry);
  }
  const chosen = new Map();
  for (const [assetId, entries] of byAsset) {
    const repo = approvals.assets?.[assetId];
    const approved = entries.find(e => e.meta.variantId === repo?.preferred && repo.variants?.[e.meta.variantId]?.status === 'approved');
    chosen.set(assetId, { ...(approved ?? entries.sort((a, b) => a.meta.variantId.localeCompare(b.meta.variantId))[0]), approved: !!approved, all: entries });
  }
  return chosen;
}

// Unsupported composite operations are ignored by the 2D context, so reading the
// value back is a synchronous feature test.
export function enableCanvasMultiply(renderer) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.globalCompositeOperation = 'multiply';
  const supported = ctx.globalCompositeOperation === 'multiply';
  if (supported && renderer.blendModes) renderer.blendModes[Phaser.BlendModes.MULTIPLY] = 'multiply';
  return supported;
}

const MAP = 10, ORIGIN = { x: MAP * TILE_WIDTH / 2 + 40, y: 150 };
const gridToWorld = (x, y) => ({ x: ORIGIN.x + (x - y) * TILE_WIDTH / 2, y: ORIGIN.y + (x + y) * TILE_HEIGHT / 2 });

class DemoScene extends Phaser.Scene {
  constructor() { super('demo'); }
  init() { this.sprites = chooseSprites(); this.lights = []; }
  preload() { for (const entry of this.sprites.values()) for (const e of entry.all) this.load.image(e.key, e.url); }
  create() {
    const ground = this.add.graphics().setDepth(-1);
    for (let gx = 0; gx < MAP; gx++) for (let gy = 0; gy < MAP; gy++) {
      const c = gridToWorld(gx + 0.5, gy + 0.5), path = gy === 6;
      ground.fillStyle(Phaser.Display.Color.HexStringToColor(path ? style.palette.dirt : [style.palette.grass, style.palette.grass_dark][(gx + gy) % 2]).color, 1);
      ground.fillPoints([{ x: c.x, y: c.y - 16 }, { x: c.x + 32, y: c.y }, { x: c.x, y: c.y + 16 }, { x: c.x - 32, y: c.y }], true);
    }
    const tower = this.sprites.get('watchtower'), torch = this.sprites.get('torch-post');
    if (tower) {
      const others = tower.all.filter(e => e.key !== tower.key);
      this.place(tower, 4, 2);
      others.slice(0, 2).forEach((entry, i) => this.place({ ...entry }, i ? 7 : 1, 2));
    }
    if (torch) for (const [gx, gy] of [[3, 5], [6, 5], [1, 7], [8, 7]]) this.place(torch, gx, gy);

    // Coloured light textures; the canvas renderer cannot tint, so colour is baked in.
    for (const colour of new Set(this.lights.map(l => l.color))) {
      const key = `light-${colour}`;
      if (this.textures.exists(key)) continue;
      const texture = this.textures.createCanvas(key, 256, 256), ctx = texture.getContext(), { r, g, b } = hexToRgb(colour);
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, `rgba(${r},${g},${b},1)`); gradient.addColorStop(0.45, `rgba(${r},${g},${b},0.45)`); gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256); texture.refresh();
    }
    const { width, height } = this.scale;
    this.webgl = this.game.renderer.type === Phaser.WEBGL;
    if (this.webgl) {
      // WebGL: GPU light map. Fill + ADD stamps + render(), shown with MULTIPLY.
      this.lightmap = this.add.renderTexture(0, 0, width, height).setOrigin(0, 0).setScrollFactor(0).setDepth(100000).setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.scale.on('resize', size => this.lightmap.setSize(size.width, size.height));
    } else {
      // Canvas: Phaser 4.2.1 detects 'multiply' support asynchronously (two data-URL
      // images) but builds its blend-mode table at boot, so MULTIPLY silently becomes
      // 'source-over'. Test support synchronously and repair the table.
      enableCanvasMultiply(this.game.renderer);
      // The light map is a CanvasTexture drawn with the 2D API, shown with MULTIPLY.
      this.lightCanvas = this.textures.createCanvas('lightmap', width, height);
      this.lightmap = this.add.image(0, 0, 'lightmap').setOrigin(0, 0).setScrollFactor(0).setDepth(100000).setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.scale.on('resize', size => { this.lightCanvas.setSize(size.width, size.height); this.lightmap.setSize(size.width, size.height); });
    }
    this.flames = this.add.graphics().setDepth(100001);
    this.cameras.main.centerOn(ORIGIN.x, ORIGIN.y + MAP * TILE_HEIGHT / 2 - 40);
    window.__demo = { ready: true, renderer: this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas', placed: this.placed, lights: this.lights.length };
  }
  place(entry, gx, gy) {
    const { meta } = entry, centre = gridToWorld(gx + meta.footprint.width / 2, gy + meta.footprint.height / 2);
    // The exported origin is anchor / size, so the footprint centre lands on the grid point.
    this.add.image(centre.x, centre.y, entry.key).setOrigin(meta.origin.x, meta.origin.y).setDepth(centre.y);
    for (const light of meta.lights) this.lights.push({ ...light, x: centre.x + light.x - meta.anchor.x, y: centre.y + light.y - meta.anchor.y, seed: this.lights.length + 1 });
    (this.placed ??= []).push({ id: meta.variantId, gx, gy });
  }
  update(now) {
    const seconds = now / 1000, preset = timePreset(style, time), camera = this.cameras.main, ambient = preset.ambientRgb;
    if (this.webgl) {
      this.lightmap.clear();
      this.lightmap.fill(Phaser.Display.Color.GetColor(ambient.r, ambient.g, ambient.b), 1);
      for (const light of this.lights) {
        const strength = Math.min(1, lightStrength(light, preset, seconds, light.seed));
        this.lightmap.stamp(`light-${light.color}`, null, light.x - camera.scrollX, light.y - camera.scrollY, { blendMode: Phaser.BlendModes.ADD, alpha: strength, scale: light.radius * 2 / 256 });
      }
      this.lightmap.render();
    } else {
      const ctx = this.lightCanvas.getContext(), { width, height } = this.lightCanvas;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = preset.ambient; ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (const light of this.lights) {
        ctx.globalAlpha = Math.min(1, lightStrength(light, preset, seconds, light.seed));
        const source = this.textures.get(`light-${light.color}`).getSourceImage(), x = light.x - camera.scrollX, y = light.y - camera.scrollY;
        ctx.drawImage(source, x - light.radius, y - light.radius, light.radius * 2, light.radius * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      this.lightCanvas.refresh();
    }
    this.flames.clear();
    for (const light of this.lights) {
      const f = 1 + Math.sin(seconds * 9 + light.seed) * 0.12, size = 9 * light.flameSize;
      this.flames.fillStyle(0xffa040, 0.35 * Math.min(1, preset.lightScale + 0.3)); this.flames.fillCircle(light.x, light.y - size * 0.4, size * 1.3);
      this.flames.fillStyle(Phaser.Display.Color.HexStringToColor(style.palette.fire).color, 1); this.flames.fillEllipse(light.x, light.y - size * 0.35 * f, size * 0.9, size * 1.6 * f);
      this.flames.fillStyle(Phaser.Display.Color.HexStringToColor(style.palette.fire_core).color, 1); this.flames.fillEllipse(light.x, light.y - size * 0.2, size * 0.45, size * 0.8);
    }
  }
}

function segmented(container, options, value, onChoose) {
  container.replaceChildren(...options.map(([id, label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.dataset.value = id; button.setAttribute('aria-pressed', String(id === value));
    button.addEventListener('click', () => onChoose(id));
    return button;
  }));
}
function renderControls() {
  segmented(document.querySelector('#demo-time'), TIMES.map(t => [t, style.timeOfDay[t].label]), time, id => { time = id; renderControls(); });
  segmented(document.querySelector('#demo-renderer'), [['canvas', 'Canvas'], ['webgl', 'WebGL']], rendererChoice, id => {
    const next = new URLSearchParams(location.search); next.set('renderer', id); next.set('time', time); location.search = next.toString();
  });
}

const chosen = chooseSprites(), notes = document.querySelector('#demo-notes'), status = document.querySelector('#demo-status');
const note = text => { const li = document.createElement('li'); li.textContent = text; notes.append(li); };
if (!chosen.size) {
  status.textContent = 'No exported sprites in art/sprites yet. Export a variant in Asset Studio and commit it first.';
} else {
  for (const [assetId, entry] of chosen) note(`${assetId}: ${entry.meta.variantId} v${entry.meta.version} (${entry.approved ? 'approved and preferred in art/approvals.json' : 'not approved yet; first exported variant shown'}), ${entry.meta.width} × ${entry.meta.height} px, origin ${entry.meta.origin.x}, ${entry.meta.origin.y}.`);
  note('Placement: image at the footprint centre from the game projection, setOrigin(meta.origin), depth = screen y.');
  note('Lighting: RenderTexture filled with the ambient colour, light textures stamped with ADD, shown with MULTIPLY. Flames are drawn on top.');
  note('Renderer: Canvas is the game default; switch to WebGL to compare. No game file is changed by this demo.');
  renderControls();
  new Phaser.Game({
    type: rendererChoice === 'webgl' ? Phaser.WEBGL : Phaser.CANVAS,
    parent: 'demo-game', backgroundColor: '#20251f',
    scale: { mode: Phaser.Scale.RESIZE, width: 900, height: 520 },
    scene: [DemoScene],
  });
}
