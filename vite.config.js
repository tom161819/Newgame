import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readRelease } from './scripts/changelog-lib.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const moduleId = 'virtual:game-release', resolvedId = `\0${moduleId}`;
const watched = ['package.json', 'package-lock.json', 'CHANGELOG.md'].map(file => path.join(root, file));

export default defineConfig({
  plugins: [{
    name: 'game-release-data',
    resolveId(id) { if (id === moduleId) return resolvedId; },
    async buildStart() { for (const file of watched) this.addWatchFile(file); await readRelease(root); },
    async load(id) {
      if (id !== resolvedId) return;
      const { data } = await readRelease(root);
      return `export const gameVersion = ${JSON.stringify(data.version)};\nexport const releases = ${JSON.stringify(data.releases)};`;
    },
    configureServer(server) {
      server.watcher.add(watched);
      server.watcher.on('change', file => {
        if (!watched.includes(file)) return;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      });
    },
  }],
});
