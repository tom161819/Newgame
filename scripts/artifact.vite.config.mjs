// Build the game for publishing as a page in Claude (the replacement for GitHub Pages): `npm run build:artifact`.
// The page is served under an unknown path, so the game needs relative URLs (base './'). The game-release-data plugin
// in vite.config.js only accepts an absolute base for its version catalog, so it is shown base '/' while the game
// itself is built with './'. Output: dist-artifact/ (the historical version archive is not included).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import repoConfig from '../vite.config.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const outDir = path.join(root, 'dist-artifact');

export function artifactConfig(config) {
  const plugins = (config.plugins ?? []).map(plugin => {
    if (plugin?.name !== 'game-release-data' || typeof plugin.configResolved !== 'function') return plugin;
    const original = plugin.configResolved;
    return { ...plugin, configResolved(resolved) { return original.call(this, { ...resolved, base: '/' }); } };
  });
  return { ...config, root, base: './', plugins, build: { ...config.build, outDir, emptyOutDir: true } };
}

export default async env => artifactConfig(typeof repoConfig === 'function' ? await repoConfig(env) : repoConfig);
