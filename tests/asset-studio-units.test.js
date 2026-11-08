import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { checkModel, modelBounds } from '../studio/src/lib/specs.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const units = readdirSync(path.join(root, 'art/assets/units')).map(id => json(`art/assets/units/${id}/asset.json`)).filter(a => a.generator === 'figure' && !a.id.startsWith('military-') && a.id !== 'merchant' && !['child', 'thief', 'firefighter', 'torchbearer', 'fishing'].includes(a.id)); // children, the thief, the fire-bucket villager and the torchbearer are not professions (#7 Nov batch); fishing holds the fisher's animation key frames // the merchant (obchod F1) visits, he is not a villager profession
const PROFESSIONS = ['villager', 'woodcutter', 'miner', 'hunter', 'builder', 'farmer', 'miller', 'baker', 'hauler', 'soldier', 'smelter-operator', 'swordsmith-worker', 'armorer-worker', 'bowyer-worker', 'wheelwright', 'stablehand', 'fisher', 'pitch-maker']; // #92 concepts, then the fisher and pitch maker (7 Nov batch)

test('every profession has a man and a woman, at human scale inside one tile', () => {
  assert.deepEqual(units.map(u => u.id).sort(), [...PROFESSIONS].sort());
  for (const unit of units) {
    assert.deepEqual(unit.footprint, { width: 1, height: 1 });
    assert.deepEqual(unit.variants.map(v => v.spec.sex).sort(), ['female', 'male'], unit.id);
    for (const variant of unit.variants) {
      const model = GENERATORS.figure.build(variant.spec, { footprint: unit.footprint, style });
      assert.deepEqual(checkModel(model, { footprint: unit.footprint, style }), [], variant.id);
      const head = Math.max(...model.primitives.filter(p => p.material.startsWith('skin')).map(p => p.at[1] + (p.radii?.[1] ?? 0) * 2));
      assert.ok(head > 1.0 && head < 1.3, `${variant.id}: head top ${head.toFixed(2)} near the 1.2-unit human height`);
      assert.ok(modelBounds(model).max[1] <= 1.6, `${variant.id}: tools stay within a readable height`);
    }
  }
});

test('professions differ in headgear, tool and garment, not just colour', () => {
  const look = v => `${v.spec.headgear}|${v.spec.tool}|${v.spec.garment}|${v.spec.apron ?? ''}`;
  for (const sex of ['male', 'female']) {
    const looks = units.map(u => u.variants.find(v => v.spec.sex === sex));
    assert.equal(new Set(looks.map(look)).size, looks.length, `${sex}: every profession has its own look`);
    const working = looks.filter(v => v.spec.tool !== 'none');
    assert.ok(working.length >= PROFESSIONS.length - 1, `${sex}: every job shows a tool or load`);
    assert.ok(new Set(working.map(v => v.spec.tool)).size >= 8, `${sex}: tools are varied`);
  }
  const woman = GENERATORS.figure.build({ sex: 'female', garment: 'cloth_blue' }, { style }), man = GENERATORS.figure.build({ sex: 'male', garment: 'cloth_blue' }, { style });
  assert.ok(woman.primitives.some(p => p.shape === 'cylinder' && p.radiusBottom >= 0.19), 'women wear a long skirt');
  assert.equal(man.primitives.filter(p => p.material === 'cloth_brown' && p.shape === 'box').length, 2, 'men wear hose');
});

test('approved animations (fishing loop, children\'s games) are exported as one sheet: 8 direction rows × poses, clips index the columns', () => {
  const root = new URL('..', import.meta.url).pathname, read = p => JSON.parse(readFileSync(root + p, 'utf8'));
  for (const id of ['fishing', 'child']) {
  const asset = read(`art/assets/units/${id}/asset.json`), approvals = read('art/approvals.json').assets[id].variants;
  for (const variant of asset.variants.filter(v => v.animation && approvals[v.id]?.status === 'approved')) {
    const base = `art/sprites/${id}/${variant.id}.v${variant.version}`, meta = read(`${base}.json`).anim;
    const poses = [...new Set(Object.values(variant.animation.clips).flat())];
    assert.deepEqual(meta.columns, poses); assert.deepEqual(meta.rows, [0, 1, 2, 3, 4, 5, 6, 7]);
    for (const [clip, cols] of Object.entries(meta.clips)) assert.deepEqual(cols.map(i => meta.columns[i]), variant.animation.clips[clip], clip);
    const png = readFileSync(root + `${base}.anim.png`);
    assert.equal(png.readUInt32BE(16), meta.frameWidth * poses.length); assert.equal(png.readUInt32BE(20), meta.frameHeight * 8);
  }
}
});
