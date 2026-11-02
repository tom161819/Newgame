import { objectDefinitions } from '../data/objects/index.js';

export const OBJECT_CATEGORIES = Object.freeze(['terrain', 'resource', 'building', 'character', 'decoration', 'animal']);
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

function fail(id, message) { throw new TypeError(`Objekt ${id ?? '(bez ID)'}: ${message}`); }
function freezeDeep(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeDeep); Object.freeze(value); }
  return value;
}

export function validateDefinition(definition) {
  const d = definition, id = d?.id;
  if (!plainObject(d)) fail(id, 'definice musí být objekt.');
  if (typeof id !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(id)) fail(id, 'neplatné ID.');
  for (const key of ['name', 'description', 'sprite']) if (typeof d[key] !== 'string' || !d[key].trim()) fail(id, `chybí ${key}.`);
  if (!/^\/assets\/(?!.*\.\.)[^?#]+\.(png|webp|svg)$/i.test(d.sprite)) fail(id, 'sprite musí být místní PNG, WebP nebo SVG v /assets/.');
  if (!OBJECT_CATEGORIES.includes(d.category)) fail(id, 'neplatná kategorie.');
  for (const key of ['width', 'height']) if (!Number.isSafeInteger(d[key]) || d[key] <= 0) fail(id, `${key} musí být kladný počet políček.`);
  for (const key of ['walkable', 'collectible', 'buildable']) if (typeof d[key] !== 'boolean') fail(id, `${key} musí být boolean.`);
  if (!plainObject(d.cost) || Object.values(d.cost).some(value => !Number.isSafeInteger(value) || value < 0)) fail(id, 'neplatná cena.');
  if (!Array.isArray(d.interactions) || d.interactions.some(value => typeof value !== 'string' || !value.trim())
    || new Set(d.interactions).size !== d.interactions.length) fail(id, 'neplatné interakce.');
  if (d.buildable && d.category !== 'building') fail(id, 'postavitelný objekt musí být budova.');
  if (d.collectible && d.category !== 'resource') fail(id, 'sběratelný objekt musí být surovina.');
  if (d.renderMode !== undefined && !['sprite', 'procedural'].includes(d.renderMode)) fail(id, 'neplatný renderMode.');
  for (const origin of [d.origin,d.frontOrigin]) if (origin !== undefined && (!plainObject(origin) || ![origin.x,origin.y].every(v => finite(v) && v >= 0 && v <= 1))) fail(id, 'origin musí ležet mezi 0 a 1.');
  if (d.visualHeight !== undefined && (!finite(d.visualHeight) || d.visualHeight < 0)) fail(id, 'neplatná vizuální výška.');
  if (d.depth !== undefined && (!plainObject(d.depth) || !finite(d.depth.offset))) fail(id, 'neplatná hloubka.');
  if (d.shadow !== undefined && (!plainObject(d.shadow) || ![d.shadow.x,d.shadow.y,d.shadow.width,d.shadow.height,d.shadow.alpha].every(finite)
    || d.shadow.width <= 0 || d.shadow.height <= 0 || d.shadow.alpha < 0 || d.shadow.alpha > 1)) fail(id, 'neplatný stín.');
  if (d.interactions.includes('enter') && d.category === 'building' && (!d.platform || ![d.platform.x,d.platform.y].every(finite))) fail(id, 'vstup do budovy vyžaduje platform {x,y}.');
  if (d.spawn !== undefined && (!plainObject(d.spawn) || d.category !== 'resource' || !Number.isSafeInteger(d.spawn.initial) || !Number.isSafeInteger(d.spawn.max)
    || d.spawn.initial < 0 || d.spawn.max < d.spawn.initial || !finite(d.spawn.interval) || d.spawn.interval <= 0)) fail(id, 'neplatné generování suroviny.');
  if (d.spritesheet !== undefined && (!plainObject(d.spritesheet) || ![d.spritesheet.frameWidth,d.spritesheet.frameHeight].every(v => Number.isSafeInteger(v) && v > 0))) fail(id, 'neplatné rozměry spritesheetu.');
  if (d.frontSprite && !/^\/assets\/(?!.*\.\.)[^?#]+\.(png|webp|svg)$/i.test(d.frontSprite)) fail(id, 'neplatná přední vrstva.');
  if (d.visual !== undefined && !plainObject(d.visual)) fail(id, 'neplatné vizuální parametry.');
  if (d.consumption !== undefined && (!plainObject(d.consumption) || !Number.isSafeInteger(d.consumption.amount)
    || d.consumption.amount<=0 || !finite(d.consumption.interval) || d.consumption.interval<=0)) fail(id, 'neplatná spotřeba suroviny.');
  if (d.category==='animal' && (!plainObject(d.gameplay) || !finite(d.gameplay.movementSpeed) || d.gameplay.movementSpeed<=0
    || !Number.isSafeInteger(d.gameplay.initialCount) || d.gameplay.initialCount<0 || d.gameplay.behavior!=='wander'
    || typeof d.gameplay.huntable!=='boolean' || !Number.isSafeInteger(d.gameplay.meatDrop) || d.gameplay.meatDrop<0
    || !Number.isSafeInteger(d.gameplay.wanderRadius) || d.gameplay.wanderRadius<=0)) fail(id, 'neplatné chování zvířete.');
  if (d.visual?.previewFrame !== undefined && (!Number.isSafeInteger(d.visual.previewFrame) || d.visual.previewFrame < 0)) fail(id, 'neplatný snímek náhledu.');
  for (const key of ['displayWidth','displayHeight']) if (d.visual?.[key] !== undefined && (!finite(d.visual[key]) || d.visual[key] <= 0)) fail(id, 'neplatná velikost obrázku.');
  if (d.animations !== undefined) {
    if (!plainObject(d.animations) || !['procedural','spritesheet'].includes(d.animations.mode)) fail(id, 'neplatný režim animací.');
    if (d.animations.mode === 'spritesheet') {
      if (!d.spritesheet || !Array.isArray(d.animations.clips) || !d.animations.clips.length) fail(id, 'animace vyžadují spritesheet a clips.');
      const names = new Set();
      for (const clip of d.animations.clips) {
        if (!plainObject(clip) || typeof clip.name !== 'string' || !clip.name.trim() || names.has(clip.name) || !['idle','walk'].includes(clip.state) || !DIRECTIONS.includes(clip.direction)
          || !Array.isArray(clip.frames) || !clip.frames.length || clip.frames.some(n => !Number.isInteger(n) || n < 0)
          || !finite(clip.frameRate) || clip.frameRate <= 0 || (clip.repeat !== undefined && (!Number.isInteger(clip.repeat) || clip.repeat < -1))) fail(id, 'neplatný animační klip.');
        names.add(clip.name);
      }
    }
  }
  return d;
}

export class ObjectRegistry {
  constructor(definitions = []) { this.definitions = new Map(); this.listeners = new Set(); this.registerAll(definitions); }

  registerAll(definitions) {
    const pending = new Map();
    for (const definition of definitions) {
      validateDefinition(definition);
      if (this.definitions.has(definition.id) || pending.has(definition.id)) throw new Error(`Duplicitní ID objektu: ${definition.id}`);
      pending.set(definition.id, freezeDeep(structuredClone(definition)));
    }
    for (const [id, definition] of pending) this.definitions.set(id, definition);
    if (pending.size) for (const listener of this.listeners) listener();
    return this;
  }

  register(definition) { this.registerAll([definition]); return this.require(definition.id); }
  get(id) { return this.definitions.get(id) ?? null; }
  require(id) { const d = this.get(id); if (!d) throw new Error(`Neznámý objekt: ${id}`); return d; }
  all() { return [...this.definitions.values()]; }
  byCategory(category) { return this.all().filter(d => d.category === category); }
  buildables() { return this.byCategory('building').filter(d => d.buildable); }
  forGallery(category = 'all') { return category === 'all' ? this.all() : this.byCategory(category); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

export const objectRegistry = new ObjectRegistry(objectDefinitions);
