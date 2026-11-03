import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cp,readdir } from 'node:fs/promises';
import { readRelease } from './scripts/changelog-lib.mjs';
import { readVersionCatalog,catalogHTML } from './scripts/version-catalog.mjs';
import { stageArchivedSnapshots } from './scripts/stage-archive.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const moduleId = 'virtual:game-release', resolvedId = `\0${moduleId}`;
const watched = ['package.json', 'package-lock.json', 'CHANGELOG.md', 'public/versions/versions.json'].map(file => path.join(root, file));
let release,catalog,base='/',outputDirectory;

export default defineConfig(({command})=>({
  publicDir:command==='build'?false:'public',
  build:{copyPublicDir:false},
  server:{watch:{ignored:['**/public/versions/[a-f0-9]*/**']}},
  plugins: [{
    name: 'game-release-data',
    configResolved(config){base=config.base;outputDirectory=path.resolve(root,config.build.outDir);},
    resolveId(id) { if (id === moduleId) return resolvedId; },
    async buildStart() { for (const file of watched) this.addWatchFile(file);release=await readRelease(root);catalog=await readVersionCatalog(root,{base,release}); },
    async load(id) {
      if (id !== resolvedId) return;
      release??=await readRelease(root);catalog??=await readVersionCatalog(root,{base,release});
      const {data}=release;return `export const gameVersion = ${JSON.stringify(data.version)};\nexport const releases = ${JSON.stringify(catalog.versions)};`;
    },
    generateBundle(){this.emitFile({type:'asset',fileName:'versions/catalog.json',source:JSON.stringify(catalog,null,2)+'\n'});this.emitFile({type:'asset',fileName:'versions/index.html',source:catalogHTML(catalog)});},
    async writeBundle(){for(const entry of await readdir(path.join(root,'public/assets')))await cp(path.join(root,'public/assets',entry),path.join(outputDirectory,'assets',entry),{recursive:true,force:false,errorOnExist:true});},
    async configurePreviewServer(){await stageArchivedSnapshots({source:path.join(root,'public/versions'),target:path.join(outputDirectory,'versions')});},
    async configureServer(server) {
      catalog??=await readVersionCatalog(root,{base});
      server.middlewares.use(async(req,res,next)=>{
        const canonical=(catalog?.builds??[]).find(b=>b.archiveURL)?.archiveURL?.replace(/versions\/.*$/,'');
        if(canonical&&canonical!==base&&req.url.startsWith(`${canonical}versions/`))req.url=base+req.url.slice(canonical.length);
        const url=new URL(req.url,'http://localhost'),relative=url.pathname.startsWith(base)?url.pathname.slice(base.length):null;
        if(['versions/','versions/index.html','versions/catalog.json'].includes(relative)){
          try{const data=await readVersionCatalog(root,{base});res.setHeader('Content-Type',relative.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8');res.end(relative.endsWith('.json')?JSON.stringify(data):catalogHTML(data));}catch(error){next(error);}return;
        }next();
      });
      server.watcher.add(watched);
      server.watcher.on('change', file => {
        if (!watched.includes(file)) return;
        release=null;catalog=null;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      });
    },
  }],
}));
