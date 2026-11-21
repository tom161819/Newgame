// Everything the studio shows is bundled at build time: no backend and no fetch.
// Specs, the style guide and the committed review manifest come from art/,
// existing game sprites from public/assets and exported sprites from art/sprites.
import style from '../../art/style-guide.json';
import approvals from '../../art/approvals.json';
import { objectDefinitions } from '../../src/data/objects/index.js';
import { GENERATORS } from './generators/index.js';

// Owner 21 Nov 2026: the Studio is built in two parts (scripts/studio-parts.mjs); '@studio-part' is the part's file list.
import { specModules, gameSpriteModules, exportedPngModules, exportedMetaModules } from '@studio-part';

const relative = (modules, prefix) => Object.fromEntries(Object.entries(modules).map(([key, value]) => [key.replace(prefix, ''), value]));

export function loadStudioData() {
  return {
    style,
    approvals,
    generators: GENERATORS,
    specs: Object.entries(specModules).map(([path, spec]) => ({ ...spec, file: path })),
    gameDefinitions: objectDefinitions,
    gameSprites: relative(gameSpriteModules, 'public/'),
    exportedSprites: exportedPngModules,
    exportedMeta: exportedMetaModules,
  };
}
