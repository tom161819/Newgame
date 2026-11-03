import { createHash } from 'node:crypto';
import { readFile,readdir,stat } from 'node:fs/promises';
import path from 'node:path';

export const digest=data=>createHash('sha256').update(data).digest('hex');
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function projectBase(value='/Newgame/'){
  if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(value))throw new Error('Base musí být bezpečná absolutní cesta končící lomítkem.');return value;
}
export async function fileHashes(directory){
  const hashes=Object.create(null);
  async function walk(dir){for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,item.name);if(item.isSymbolicLink())throw new Error(`Nepovolený odkaz v archivu: ${file}`);if(item.isDirectory())await walk(file);else hashes[path.relative(directory,file).split(path.sep).join('/')]=digest(await readFile(file));}}
  await walk(directory);return hashes;
}
export async function verifySnapshot(directory,expectedCommit=null){
  const record=JSON.parse(await readFile(path.join(directory,'snapshot.json'),'utf8'));
  if(record.schema!==1||!/^([a-f0-9]{40})$/.test(record.commit)||expectedCommit&&record.commit!==expectedCommit||!record.verification?.browser)throw new Error(`Neplatný manifest: ${directory}`);
  const hashes=await fileHashes(directory);delete hashes['snapshot.json'];
  if(Object.keys(hashes).length!==Object.keys(record.files??{}).length||Object.entries(hashes).some(([file,hash])=>record.files[file]!==hash))throw new Error(`Obsah archivované verze ${record.commit.slice(0,7)} se změnil. Existující archiv se nepřepisuje.`);
  if(!record.files['index.html']||!record.files['archive-runtime.js'])throw new Error('Archiv nemá vstupní stránku nebo oddělené úložiště.');
  return record;
}
export async function recordsIn(directory){
  let names;try{names=await readdir(directory);}catch(e){if(e.code==='ENOENT')return [];throw e;}
  const records=[];for(const name of names.filter(n=>/^[a-f0-9]{40}$/.test(n)))if((await stat(path.join(directory,name))).isDirectory())records.push(await verifySnapshot(path.join(directory,name),name));return records;
}
export function verifyCatalog(records,catalog,index){
  if(!Array.isArray(catalog)||catalog.length!==records.length||new Set(catalog.map(r=>r.commit)).size!==records.length)throw new Error('Seznam archivu neodpovídá uloženým verzím.');
  for(const record of records){const listed=catalog.find(r=>r.commit===record.commit);if(!listed||listed.tree!==record.tree||listed.basePath!==record.basePath||!index.includes(`href="${record.basePath}"`))throw new Error(`V seznamu chybí platný odkaz na ${record.commit.slice(0,7)}.`);}
}
export function immutableChanges(files,existingCommits){
  const existing=new Set(existingCommits);return files.filter(file=>{const match=file.match(/^public\/versions\/([a-f0-9]{40})\//);return match&&existing.has(match[1]);});
}

const descriptions={
  '7291dc3':'První hratelná mapa s klikáním a hledáním cesty.',
  '1c078de':'Zprovoznění publikování prvního prototypu přes GitHub Pages.',
  'f94d77a':'Sbírání kamenů kliknutím a společný inventář.',
  '162efeb':'Věže 2 × 2, náhled stavby a animovaný vstup i sestup.',
  '6714fc5':'Izometrická mapa 100 × 100, král, kamera a doplňování kamenů.',
  '2e0974c':'Osm směrů pohybu a animace, normalizovaná rychlost a bezpečné rohy.',
  '6ae12dc':'Univerzální knihovna objektů a vlastní grafické podklady.',
  '81ab03e':'Pohybující se zvěř, lov, maso a spotřeba potravy.',
  'c361499':'Fog of War, nastavení a opakované nasedání na koně.',
  '6d189b0':'Hrady, tažení hradeb a chůze po propojených vrcholech.',
  'a6c29fa':'HP, DPS, zbroj, odveta, smrt a restart hry.',
  'cd77265':'Herní čas, regenerace, příjem zlata, poklad a vybavení.',
  '574ef6b':'Hlavní menu a místní Save/Load přes IndexedDB.',
  '29a9cec':'Vyšlapávání, spojování a zarůstání pěšin.',
  'c8a87c7':'Individuální XP a levely, odměny a ochrana před opakováním.',
  'fc979b1':'Poddaní, šest skillů, profese, pracovní AI a migrace.',
  '1244147':'Trvalé talenty, rozdílné počáteční skilly, mzdy a dluhy.',
  '0af9b89':'Kamenolom, lovecká chata, kasárna a fyzické doručování surovin.',
  '5636967':'Zraněný lovec předá nesený náklad před odpočinkem.',
  '43766dc':'Blueprinty, fyzická výstavba, spolupráce a dělení odměn.',
};
export async function releaseMetadata(directory,commit,subject){
  const signatures=[
    ['src/ui/ChangelogPanel.js','Verzování a Changelog'],
    ['src/systems/WorldGenerationConfig.js','Pokročilá konfigurace světa'],['src/ui/NewGameSetup.js','Nastavení nové hry'],
    ['scripts/build-archive.mjs','Archiv herních verzí'],['src/systems/ConstructionSystem.js','Blueprinty a výstavba'],
    ['src/systems/WorkplaceSystem.js','Pracovní budovy'],['src/systems/NaturalTalentSystem.js','Talenty a mzdy'],
    ['src/systems/WorkerSystem.js','Skilly a profese'],['src/systems/ExperienceSystem.js','Zkušenosti a levely'],
    ['src/systems/PathWearSystem.js','Vyšlapané pěšiny'],['src/systems/SaveGameManager.js','Menu a Save/Load'],
    ['src/systems/ProductionSystem.js','Čas, zlato a poklady'],['src/systems/CombatSystem.js','Soubojový systém'],
    ['src/game/FortificationView.js','Hrady a hradby'],['src/systems/FogOfWarSystem.js','Fog of War a koně'],
    ['src/systems/AnimalSystem.js','Lov a potrava'],['src/systems/AssetManager.js','Asset Library'],
    ['src/game/directions.js','Pohyb v osmi směrech'],['src/game/isometric.js','Izometrický svět'],
    ['src/game/buildings.js','Stavění věží'],['src/game/stones.js','Kameny a inventář'],
  ];
  let name='První prototyp pohybu';for(const [file,title]of signatures){try{await stat(path.join(directory,file));name=title;break;}catch(e){if(e.code!=='ENOENT')throw e;}}
  const checkpoint=/^Checkpoint /i.test(subject);
  return {name:checkpoint?`${name} · kontrolní bod`:name,description:descriptions[commit.slice(0,7)]??(checkpoint?'Kontrolní verze připravená před následujícím rozšířením.':subject)};
}

// Pouze nasazovací obal: původní hra se sestavuje beze změny zdrojových souborů.
// Úložiště je oddělené podle commitu, aby starší verze nepřepsala aktuální pozice.
export function archiveRuntime(commit,base){
  return `(()=>{'use strict';const prefix=${JSON.stringify(`newgame-archive-${commit}:`)};window.__NEWGAME_ARCHIVE_ROOT__=${JSON.stringify(`${base}versions/`)};
const idb=window.indexedDB;if(idb){const open=idb.open.bind(idb),remove=idb.deleteDatabase.bind(idb);idb.open=(name,...args)=>open(prefix+name,...args);idb.deleteDatabase=(name,...args)=>remove(prefix+name,...args);}
const proto=Storage.prototype,get=proto.getItem,set=proto.setItem,remove=proto.removeItem,key=proto.key,length=Object.getOwnPropertyDescriptor(proto,'length').get;
const keys=storage=>{const values=[];for(let i=0;i<length.call(storage);i++){const k=key.call(storage,i);if(k&&k.startsWith(prefix))values.push(k);}return values;};
proto.getItem=function(k){return get.call(this,prefix+k);};proto.setItem=function(k,v){return set.call(this,prefix+k,v);};proto.removeItem=function(k){return remove.call(this,prefix+k);};proto.clear=function(){for(const k of keys(this))remove.call(this,k);};proto.key=function(i){return keys(this)[i]?.slice(prefix.length)??null;};Object.defineProperty(proto,'length',{configurable:true,get(){return keys(this).length;}});
})();\n`;
}

export function archiveIndex(records,base){
  const rows=[...records].sort((a,b)=>b.sequence-a.sequence).map(r=>`<article data-version="${r.commit}"><div><h2>${escapeHTML(r.name)}</h2><p>${escapeHTML(r.description)}</p><small><time datetime="${escapeHTML(r.date)}">${escapeHTML(r.date.slice(0,10))}</time> · <a href="https://github.com/tom161819/Newgame/commit/${r.commit}" target="_blank" rel="noopener noreferrer">${r.commit.slice(0,7)}</a></small></div><a class="play" href="${base}versions/${r.commit}/" target="_blank" rel="noopener noreferrer">Spustit hru ↗</a></article>`).join('\n');
  return `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newgame · Archiv verzí</title><style>*{box-sizing:border-box}body{margin:0;background:#23291f;color:#eae1c5;font:16px/1.6 system-ui,sans-serif}main{max-width:1050px;margin:auto;padding:40px 22px}h1,h2{font-family:Georgia,serif;font-weight:500}h1{font-size:36px;margin:8px 0}h2{font-size:21px;margin:0}p{margin:6px 0;color:#c0c1a8}a{color:#e6cd85}header{padding-bottom:24px;border-bottom:1px solid #716d4b}.current,.play{display:inline-block;border:1px solid #a18b57;background:#414a31;border-radius:5px;padding:10px 18px;text-decoration:none;white-space:nowrap}.current{margin-top:18px}article{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 0;border-bottom:1px solid #52583d}small{color:#a9ae92;font-size:12px}.eyebrow{letter-spacing:.18em;color:#d3b56f;font-size:11px}.note{font-size:13px;margin:18px 0}a:focus-visible{outline:2px solid #efcf78;outline-offset:5px}@media(max-width:600px){main{padding:25px 16px}h1{font-size:29px}article{align-items:flex-start;flex-direction:column;gap:12px}.play{font-size:14px}}</style></head><body><main><header><span class="eyebrow">NEWGAME · HISTORIE KRÁLOVSTVÍ</span><h1>Archiv herních verzí</h1><p>Vyber si starší verzi a spusť ji přímo v prohlížeči.</p><a class="current" href="${base}" target="_blank" rel="noopener noreferrer">Spustit aktuální hru ↗</a></header><p class="note">${records.length} ověřených verzí ze skutečných Git commitů. Každá verze má vlastní uložené pozice a nastavení. Hry se otevírají v nové záložce.</p><section aria-label="Dostupné verze">${rows}</section><footer><p class="note">Starší odkazy zůstávají stejné i po dalších aktualizacích hry.</p></footer></main></body></html>\n`;
}
