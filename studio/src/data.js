// Everything the studio shows is bundled at build time: no backend and no fetch.
// Specs, the style guide and the committed review manifest come from art/,
// existing game sprites from public/assets and exported sprites from art/sprites.
import style from '../../art/style-guide.json';
import approvals from '../../art/approvals.json';
import { objectDefinitions } from '../../src/data/objects/index.js';
import { GENERATORS } from './generators/index.js';

const specModules = import.meta.glob('../../art/assets/*/*/asset.json', { eager: true, import: 'default' });
const gameSpriteModules = import.meta.glob('../../public/assets/**/*.{png,svg,webp}', { eager: true, query: '?url', import: 'default' });
const exportedPngModules = import.meta.glob(['../../art/sprites/**/*.png', '!../../art/sprites/{oak-tree,pine-tree}/*-season-*.x2.png'], { eager: true, query: '?url', import: 'default' });
const exportedMetaModules = import.meta.glob('../../art/sprites/**/*.json', { eager: true, import: 'default' });

const relative = (modules, prefix) => Object.fromEntries(Object.entries(modules).map(([key, value]) => [key.replace(prefix, ''), value]));

export function loadStudioData() {
  return {
    style,
    approvals,
    generators: GENERATORS,
    specs: Object.entries(specModules).map(([path, spec]) => ({ ...spec, file: path.replace('../../', '') })),
    gameDefinitions: objectDefinitions,
    gameSprites: relative(gameSpriteModules, '../../public/'),
    exportedSprites: relative(exportedPngModules, '../../'),
    exportedMeta: relative(exportedMetaModules, '../../'),
  };
}
