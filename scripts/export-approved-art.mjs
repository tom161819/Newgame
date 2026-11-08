// Plan m-nasadit-schvalenou-grafiku (owner, 8 Nov 2026: "with the next update deploy everything approved in the Studio").
// Copies the approved Studio exports (art/approvals.json, status `approved`) for wildlife, vehicles, caravans, children,
// the fishing loop, night icons and the World v2 ground into public/assets byte for byte and writes
// src/data/objects/approvedDeployArt.js with each file's path, its art source and the origin from the metadata.
// Only variants listed in the approvals with status `approved` are used; a variant without an export is skipped.
// Re-run after a Studio revision: node scripts/export-approved-art.mjs
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const approvals=JSON.parse(await readFile(path.join(root,'art/approvals.json'),'utf8')).assets;
const exists=file=>access(path.join(root,file)).then(()=>true,()=>false);
const round=o=>o&&{x:Math.round(o.x*1e5)/1e5,y:Math.round(o.y*1e5)/1e5};
const skipped=[],copied=[];
// The approved version of a variant, or null (with the reason recorded).
function approved(asset,variant){
  const v=approvals[asset]?.variants?.[variant];
  if(!v){skipped.push(`${asset}/${variant}: not in the approvals`);return null;}
  if(v.status!=='approved'){skipped.push(`${asset}/${variant}: status ${v.status}`);return null;}
  return v.version;
}
async function meta(asset,variant,version){return JSON.parse(await readFile(path.join(root,`art/sprites/${asset}/${variant}.v${version}.json`),'utf8'));}
async function copy(asset,file,folder){
  const from=`art/sprites/${asset}/${file}`;if(!await exists(from)){skipped.push(`${asset}/${file}: no export`);return null;}
  await mkdir(path.join(root,'public/assets',folder),{recursive:true});await copyFile(path.join(root,from),path.join(root,'public/assets',folder,file));
  copied.push(`${from} -> public/assets/${folder}/${file}`);return `/assets/${folder}/${file}`;
}
// A single image with the origin of its metadata (the studio anchor: the ground point under the figure or vehicle).
async function still(asset,variant,folder){
  const version=approved(asset,variant);if(!version)return null;const m=await meta(asset,variant,version);
  const src=await copy(asset,`${variant}.v${version}.png`,folder);if(!src)return null;
  return {src,artSource:`art/sprites/${asset}/${variant}.v${version}.json`,origin:round(m.origin)};
}

// ---- Wild animals: single images facing the viewer's right (no walk sheets). Each game species maps to one Studio
// asset; looks are picked per animal like the walk-sheet animals, poses belong to their look ("<look>-<pose>").
// Young looks (deer calf, roe fawn, piglet) have no game counterpart (the game has no young wild animals).
const WILD={
  horse:{asset:'horse',looks:['bay','grey','chestnut','black','palomino','dun','piebald','dapple','draught','pony'].map(c=>[`horse-${c}`,`horse-${c}-sculpt`]),
    poses:[['horse-bay','saddled','horse-bay-saddled-sculpt'],['horse-grey','harness','horse-grey-harness-sculpt'],['horse-chestnut','run','horse-chestnut-run-sculpt']]},
  deer:{asset:'deer',looks:[['deer-stag','deer-stag'],['deer-pricket','deer-pricket'],['deer-hind','deer-hind']],poses:[['deer-stag','run','deer-stag-run'],['deer-hind','run','deer-hind-run']]},
  wild_boar:{asset:'boar',looks:[['boar-boar','boar-boar'],['boar-sow','boar-sow']],poses:[['boar-boar','attack','boar-boar-attack']]},
  rabbit:{asset:'hare',looks:[['hare-brown','hare-brown'],['hare-grey','hare-grey'],['hare-white','hare-white']],poses:[['hare-brown','sit','hare-brown-sit'],['hare-brown','run','hare-brown-run']]},
};
const wild={};
for(const [species,spec] of Object.entries(WILD)){
  const looks={};
  for(const [look,variant] of spec.looks){const art=await still(spec.asset,variant,'characters/wildlife');if(art)looks[look]={...art,poses:{}};}
  for(const [look,pose,variant] of spec.poses){if(!looks[look])continue;const art=await still(spec.asset,variant,'characters/wildlife');if(art)looks[look].poses[pose]=art;}
  wild[species]={looks};
}

// ---- Horse Wagon (one horse, as in the game): the look follows the cargo. The two-horse teams (pair-*) are not used.
const WAGON=['horse-wagon-farm-empty','horse-wagon-farm-sacks','horse-wagon-farm-wood','horse-wagon-covered','horse-wagon-hay','horse-wagon-tumbril-stone','horse-wagon-ore','horse-wagon-timber'];
const wagon={};for(const v of WAGON){const art=await still('horse-wagon',v,'vehicles/horse_wagon');if(art)wagon[v.slice('horse-wagon-'.length)]=art;}
// ---- Wheelbarrow: the plank barrow with each load. The other barrow models (tub, handcart, sack barrow) only come
// with one or two loads and no empty look, so a barrow would change its shape with the load; they are not used.
const BARROW=['empty','stone','wood','ore','ironbars','fish','meat','bread','mixed'];
const barrow={};for(const v of BARROW){const art=await still('wheelbarrow',`wheelbarrow-plank-${v}`,'vehicles/wheelbarrow');if(art)barrow[v]=art;}
// ---- Merchant caravan styles: each caravan picks one by its id; a style without a state's look uses its full wagon.
const CARAVAN={plain:{full:'merchant-caravan-full',empty:'merchant-caravan-empty'},striped:{full:'merchant-caravan-striped-full',unloading:'merchant-caravan-striped-unloading',empty:'merchant-caravan-striped-empty'},
  house:{full:'merchant-caravan-house-full',unloading:'merchant-caravan-house-unloading'},pair:{full:'merchant-caravan-pair-full'}};
const caravan={};
for(const [style,states] of Object.entries(CARAVAN)){const out={};for(const [state,v] of Object.entries(states)){const art=await still('merchant-caravan',v,'vehicles/caravan');if(art)out[state]=art;}if(out.full)caravan[style]=out;}

// ---- Children: six looks with walk sheets (boys 0–2, girls 0–2 as ChildrenSystem's `look % 3`) and play key frames.
const CHILD_LOOKS={boy:['child-boy-tunic','child-boy-cap','child-boy-ball'],girl:['child-girl-braid','child-girl-kerchief','child-girl-basket']};
const CHILD_POSES=[['child-boy-tunic','run'],['child-boy-tunic','throw'],['child-boy-cap','hoop'],['child-boy-cap','hay'],['child-boy-ball','kick'],['child-girl-braid','tag'],['child-girl-braid','snow'],['child-girl-kerchief','swing']];
const children={looks:{},sexes:CHILD_LOOKS};
for(const id of Object.values(CHILD_LOOKS).flat()){
  const version=approved('child',id);if(!version)continue;const m=await meta('child',id,version);if(!m.walk){skipped.push(`child/${id}: no walk sheet`);continue;}
  const sheet=await copy('child',`${id}.v${version}.walk.png`,'characters/children');if(!sheet)continue;
  children.looks[id]={sheet,artSource:`art/sprites/child/${id}.v${version}.json`,walk:{frameWidth:m.walk.frameWidth,frameHeight:m.walk.frameHeight,origin:round(m.walk.origin),fps:m.walk.fps??6},poses:{}};
}
for(const [look,pose] of CHILD_POSES){if(!children.looks[look])continue;const art=await still('child',`${look}-${pose}`,'characters/children');if(art)children.looks[look].poses[pose]=art;}

// ---- Fishing loop (m-animace-rybar): one sheet per sex, rows = facing 0–7, columns = the clip frames in meta.anim.
const fishing={};
for(const sex of ['male','female']){
  const id=`fishing-${sex}-loop`,version=approved('fishing',id);if(!version)continue;const m=await meta('fishing',id,version);
  const sheet=await copy('fishing',`${id}.v${version}.anim.png`,'characters/fishing');if(!sheet)continue;
  const a=m.anim;fishing[sex]={sheet,artSource:`art/sprites/fishing/${id}.v${version}.json`,frameWidth:a.frameWidth,frameHeight:a.frameHeight,origin:round(a.origin),fps:a.fps,columns:a.columns.length,clips:a.clips,loop:a.loop};
}

// ---- Night icons: the preferred set (round badges), 1× and 2× PNG per sign.
const nightIcons={};{
  const asset='night-icons',set=approvals[asset]?.preferred,version=set&&approved(asset,set);
  if(version){const m=await meta(asset,set,version);for(const icon of m.icons){
    const png=await copy(asset,path.basename(icon.png),'ui/night-icons'),png2x=await copy(asset,path.basename(icon.png2x),'ui/night-icons');
    if(png&&png2x)nightIcons[icon.level]={png,png2x,size:icon.size,artSource:`art/sprites/${asset}/${set}.v${version}.json`};}}
}

// ---- World v2 ground. Grass zones: four tiles per zone and season, as one 256 × 32 strip (frames 0–3).
const ZONES=[['meadow','grass-zone-meadow'],['lush','grass-zone-lush'],['dry','grass-zone-dry'],['forest','grass-zone-forest'],['flowers','grass-zone-flowers'],['stony','grass-zone-stony']];
const zones={};
for(const [zone,asset] of ZONES){const seasons={};for(const season of ['spring','summer','autumn','winter']){
  const id=`${asset}-${season}`,version=approved(asset,id);if(!version)continue;const m=await meta(asset,id,version);
  const strip=await copy(asset,`${id}.v${version}.tiles.png`,'terrain/grass/zones');if(strip)seasons[season]={strip,frames:m.surface.frames,artSource:`art/sprites/${asset}/${id}.v${version}.json`};}
  zones[zone]=seasons;}
// Shore grounds replacing the provisional ford, mud and pebble tiles (four tiles each). The water edge with foam has no
// ground of its own in the game (the rounded shore is drawn by the transition tiles) and is not used.
const shore={};
for(const [ground,id] of [['ford_shallows','shore-ground-ford'],['mud_bank','shore-ground-mud'],['shore_rocks','shore-ground-rocks']]){
  const version=approved('shore-ground',id);if(!version)continue;const tiles=[];
  for(let i=0;i<4;i++){const t=await copy('shore-ground',`${id}.v${version}.tile-${i}.png`,'terrain/shore');if(t)tiles.push(t);}
  if(tiles.length===4)shore[ground]={tiles,artSource:`art/sprites/shore-ground/${id}.v${version}.json`};
}
// Marching-squares transitions: 16 tiles per pair as a 1024 × 32 strip; bit 0 top, 1 right, 2 bottom, 3 left corner,
// a set bit = the inner ground (grass for water/grass, sand/mud/rocks for the others, grass for sand/grass).
const transitions={};
for(const pair of ['water-grass','water-sand','water-mud','water-rocks','sand-grass']){
  const id=`shore-transitions-${pair}`,version=approved('shore-transitions',id);if(!version)continue;const m=await meta('shore-transitions',id,version);
  const strip=await copy('shore-transitions',`${id}.v${version}.tiles.png`,'terrain/transitions');if(strip)transitions[pair]={strip,frames:m.surface.frames,artSource:`art/sprites/shore-transitions/${id}.v${version}.json`};
}

// ---- Building fire from the Fire Lab (art/effects/fire.json). Torch flame values are not approved yet.
const fireFile=JSON.parse(await readFile(path.join(root,'art/effects/fire.json'),'utf8'));
const fire={id:fireFile.id,approvedAt:fireFile.approvedAt,params:fireFile.params};

const data={wild,wagon,barrow,caravan,children,fishing,nightIcons,zones,shore,transitions,fire};
const text=`// Generated by scripts/export-approved-art.mjs from art/approvals.json (plan m-nasadit-schvalenou-grafiku). Do not
// edit: re-run the script after a Studio revision. Every file is a byte-for-byte copy of an approved export; origins
// come from its metadata. tests/approved-art-deploy.test.js checks both.
export const APPROVED_DEPLOY_ART=Object.freeze(${JSON.stringify(data)});
`;
await writeFile(path.join(root,'src/data/objects/approvedDeployArt.js'),text);
console.log(`copied ${copied.length} files`);
for(const line of skipped)console.log(`skipped ${line}`);
