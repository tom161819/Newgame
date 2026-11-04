import { objectDefinitions } from '../data/objects/index.js';
import { JOBS,SKILL_IDS } from '../data/jobs.js';
import { BUILDING_CATEGORIES } from '../data/buildingCategories.js';

export const OBJECT_CATEGORIES = Object.freeze(['terrain', 'resource', 'building', 'character', 'decoration', 'animal', 'equipment', 'treasure']);
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
  if(d.buildingCategory!==undefined&&(d.category!=='building'||!Object.hasOwn(BUILDING_CATEGORIES,d.buildingCategory)))fail(id,'neplatná stavební kategorie.');
  if(d.requiresCompletedBuildings!==undefined&&(d.category!=='building'||!Array.isArray(d.requiresCompletedBuildings)||new Set(d.requiresCompletedBuildings).size!==d.requiresCompletedBuildings.length||d.requiresCompletedBuildings.some(value=>typeof value!=='string'||!value)))fail(id,'neplatné stavební podmínky.');
  if(d.unlockDescription!==undefined&&(d.category!=='building'||typeof d.unlockDescription!=='string'||!d.unlockDescription.trim()))fail(id,'neplatný popis odemčení.');
  if(d.constructionTime!==undefined&&(!finite(d.constructionTime)||d.constructionTime<=0||d.category!=='building'))fail(id,'neplatná doba výstavby.');
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
  if (d.visibility !== undefined && (!plainObject(d.visibility) || !finite(d.visibility.multiplier) || d.visibility.multiplier<=0)) fail(id, 'neplatný bonus dohledu.');
  if (d.navigation !== undefined && (!plainObject(d.navigation) || typeof d.navigation.walkableTop!=='boolean'
    || (d.navigation.walkableTop&&(d.category!=='building'||d.width!==1||d.height!==1||!d.interactions.includes('walk_top'))))) fail(id, 'neplatná navigace po vrcholu.');
  if (d.construction !== undefined && (!plainObject(d.construction) || !['single','line'].includes(d.construction.mode)
    || (d.construction.mode==='line'&&(d.category!=='building'||d.width!==1||d.height!==1)))) fail(id, 'neplatný režim stavění.');
  if (d.renderer==='fortification'&&(!finite(d.visual?.wallHeight)||d.visual.wallHeight<=0)) fail(id, 'opevnění vyžaduje kladnou výšku stěn.');
  if(d.workplace!==undefined&&(!plainObject(d.workplace)||d.category!=='building'||!Number.isSafeInteger(d.workplace.capacity)||d.workplace.capacity<1
    ||!Object.hasOwn(JOBS,d.workplace.profession)||!SKILL_IDS.includes(d.workplace.skill)||JOBS[d.workplace.profession].skill!==d.workplace.skill))fail(id,'neplatné pracoviště.');
  if(d.crop!==undefined&&(!plainObject(d.crop)||d.category!=='building'||!d.walkable||typeof d.crop.resource!=='string'||!finite(d.crop.growthDays)||d.crop.growthDays<=0
    ||!Number.isSafeInteger(d.crop.yield)||d.crop.yield<=0||!finite(d.crop.workDuration)||d.crop.workDuration<=0||!Array.isArray(d.crop.stages)||d.crop.stages.length!==4))fail(id,'neplatné pěstování plodin.');
  if(d.workRadius!==undefined&&(!finite(d.workRadius)||d.workRadius<=0))fail(id,'neplatný pracovní rádius.');
  if(d.storage!==undefined&&(!plainObject(d.storage)||d.category!=='building'||!Number.isSafeInteger(d.storage.capacity)||d.storage.capacity<=0||!Array.isArray(d.storage.resources)||!d.storage.resources.length||new Set(d.storage.resources).size!==d.storage.resources.length))fail(id,'neplatný sklad.');
  if(d.recipe!==undefined){
    const r=d.recipe,quantities=value=>plainObject(value)&&Object.keys(value).length>0&&Object.values(value).every(n=>Number.isSafeInteger(n)&&n>0);
    if(d.category!=='building'||!plainObject(r)||!quantities(r.input)||!quantities(r.output)||!finite(r.duration)||r.duration<=0||!SKILL_IDS.includes(r.skill)||!d.workplace||!Number.isSafeInteger(d.bufferCapacity)||d.bufferCapacity<Math.max(...Object.values(r.input),...Object.values(r.output)))fail(id,'neplatný výrobní recept.');
  }
  if(d.edible!==undefined&&(d.category!=='resource'||typeof d.edible!=='boolean'))fail(id,'neplatné označení potraviny.');
  if(d.tree!==undefined&&(!plainObject(d.tree)||d.category!=='resource'||d.collectible||!Number.isSafeInteger(d.tree.wood)||d.tree.wood<1||!finite(d.tree.xp)||d.tree.xp<=0||!finite(d.tree.chopDuration)||d.tree.chopDuration<=0||!Array.isArray(d.tree.stages)||d.tree.stages.length!==4))fail(id,'neplatný obnovitelný strom.');
  if(['character','animal'].includes(d.category)&&d.stats===undefined)fail(id,'živá jednotka vyžaduje bojové statistiky.');
  if (d.stats !== undefined && (!plainObject(d.stats) || !['maxHP','attackDPS','armor','attackRange'].every(key=>finite(d.stats[key]))
    || d.stats.maxHP<=0 || d.stats.attackDPS<0 || d.stats.armor<0 || d.stats.armor>90 || d.stats.attackRange<0)) fail(id, 'neplatné bojové statistiky.');
  if(d.stats?.hpRegenPerSecond!==undefined&&(!finite(d.stats.hpRegenPerSecond)||d.stats.hpRegenPerSecond<0))fail(id,'neplatná regenerace.');
  if(d.experience!==undefined&&(!plainObject(d.experience)||d.category!=='character'||typeof d.experience.enabled!=='boolean'
    ||!Number.isSafeInteger(d.experience.initialLevel)||!Number.isSafeInteger(d.experience.maxLevel)||d.experience.initialLevel<1
    ||d.experience.maxLevel>50||d.experience.initialLevel>d.experience.maxLevel||!finite(d.experience.gainMultiplier)||d.experience.gainMultiplier<0))fail(id,'neplatné nastavení zkušeností.');
  if(d.inventoryOrder!==undefined&&(!Number.isSafeInteger(d.inventoryOrder)||d.inventoryOrder<0))fail(id,'neplatné pořadí inventáře.');
  if(d.production!==undefined&&(!plainObject(d.production)||d.category!=='building'||typeof d.production.resource!=='string'
    ||!Number.isSafeInteger(d.production.amount)||d.production.amount<=0||d.production.interval!=='day'))fail(id,'neplatná produkce.');
  if(d.category==='equipment'&&(!plainObject(d.equipment)||!['weapon','armor'].includes(d.equipment.slot)||!plainObject(d.equipment.modifiers)
    ||Object.entries(d.equipment.modifiers).some(([key,value])=>!['maxHP','attackBonus','armor','hpRegenPerSecond'].includes(key)||!finite(value))))fail(id,'neplatné vybavení.');
  if(d.category==='treasure'&&(!plainObject(d.treasure)||d.width!==1||d.height!==1||!Number.isSafeInteger(d.treasure.initial)||d.treasure.initial<0
    ||!Number.isSafeInteger(d.treasure.goldMin)||!Number.isSafeInteger(d.treasure.goldMax)||d.treasure.goldMin<0||d.treasure.goldMax<d.treasure.goldMin
    ||!Array.isArray(d.treasure.equipment)||d.treasure.equipment.some(id=>typeof id!=='string')||new Set(d.treasure.equipment).size!==d.treasure.equipment.length))fail(id,'neplatný obsah pokladu.');
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
        if (!plainObject(clip) || typeof clip.name !== 'string' || !clip.name.trim() || names.has(clip.name) || !['idle','walk','attack'].includes(clip.state) || !DIRECTIONS.includes(clip.direction)
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
    const known=new Map([...this.definitions,...pending]);
    for(const definition of pending.values()){
      for(const id of [...Object.keys(definition.cost),...(definition.production?[definition.production.resource]:[]),...(definition.crop?[definition.crop.resource]:[]),...(definition.storage?.resources??[]),...Object.keys(definition.recipe?.input??{}),...Object.keys(definition.recipe?.output??{})])
        if(known.get(id)?.category!=='resource')fail(definition.id,`neznámá surovina ${id}.`);
      for(const id of definition.treasure?.equipment??[])if(known.get(id)?.category!=='equipment')fail(definition.id,`neznámé vybavení ${id}.`);
      for(const id of definition.requiresCompletedBuildings??[])if(id===definition.id||known.get(id)?.category!=='building')fail(definition.id,`neplatná požadovaná budova ${id}.`);
    }
    const visited=new Set(),visiting=new Set();
    const visit=id=>{if(visiting.has(id))fail(id,'cyklické stavební podmínky.');if(visited.has(id))return;visiting.add(id);for(const requirement of known.get(id)?.requiresCompletedBuildings??[])visit(requirement);visiting.delete(id);visited.add(id);};
    for(const id of pending.keys())visit(id);
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
