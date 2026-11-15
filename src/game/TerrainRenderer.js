import { pathSurface } from '../render/pathSurface.js';
import { RELIEF_RULES } from './terrainRelief.js';
import { gridToWorld as gridToWorldLifted, tileCenter as tileCenterLifted } from './isometric.js';
import { HEIGHT_UNIT_PX, HEIGHT_MAX } from './terrainHeight.js';
import PATH_SURFACE from '../data/pathSurface.json' with { type: 'json' };
import { drawCobbles } from './cobbles.js';
import { COLUMNS, ROWS, TILE_WIDTH, TILE_HEIGHT } from './config.js';
import { tileCenterFlat as tileCenter, worldToGridFlat as worldToGrid, gridToWorldFlat as gridToWorld, ORIGIN } from './isometric.js'; // flat: painted into the ground picture before it is lifted
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { PATH_WEAR } from '../data/pathWear.js';
import { canStep } from './pathfinding.js';
import { VISIBILITY, FOG_STYLE } from '../systems/FogOfWarSystem.js';
import { memoryTexture } from './memoryTexture.js';
import { MEMORY_DIRECTIONS } from '../systems/MapMemory.js';
import { GROUND, GROUND_TERRAIN_IDS, BUSH_TYPES, GRASS_ZONE } from '../data/worldTerrain.js';
import { PathV2Layer } from './PathV2Layer.js';
import { APPROVED_DEPLOY_ART } from '../data/objects/approvedDeployArt.js';
import { requestTexture } from './deployArt.js';
import { natureReady,showNature,outcropLook,bushLook,thicketLook,rockGroupLook } from './natureArt.js';
import { groupTiles,groupKey,groupFront,pruneNatureGroups } from './natureGroups.js';
import { paintContinuousGround, makeWaterField, plantsFor, waterObjectsFor, drawPlant, seasonOf } from '../render/continuousGround.js';
import { groundSettings } from '../data/groundLook.js';
import { GroundComposite } from './GroundComposite.js';

// Continuous ground (plan m-souvisla-zeme): the approved World Lab look (art/effects/ground.json) paints land and water
// of a whole chunk as one surface – no tile grid, soft zone transitions, natural river banks, plants and stones.
// World Editor: the approved look (groundStyle.json) with the player's ground-look override on top.
import { SEASON_YEAR, SEASON_TRANSITION, blendMask } from './SeasonTransition.js';
const LAND_MATERIAL = { [GROUND.BEACH]: 6, [GROUND.DESERT]: 7, [GROUND.MUD]: 8, [GROUND.SHORE_ROCKS]: 9 };
const WATER_DEPTH = { [GROUND.FORD]: 0.15, [GROUND.SHALLOW]: 0.5, [GROUND.DEEP]: 1 };

const CHUNK_SIZE = 10;
// performance-1: already shown dirty chunks repainted a frame (continuous ground) and at most every REPAINT_EVERY_MS,
// the least time between two repaints of one chunk, and between two path-only ground repaints.
const REPAINT_PER_FRAME = 1, REPAINT_EVERY_MS = 50, REPAINT_GAP_MS = 200, GROUND_PATH_GAP_MS = 750;
// performance-2: Fog of War patches (see applyFogPatches).
const FOG_PATCH_EVERY_MS = 150, FOG_PATCH_BUDGET_MS = 3;
// performance-2: the ground painter's coarse grid (px), and how far a plant sprite reaches from its foot (px).
// Two ground stamps (season|buildings|paths|path style) that differ only in the paths.
const pathOnlyChange=(a,b)=>{if(!a||!b||a===b)return false;const cut=v=>v.split('|').filter((_,i)=>i!==2).join('|');return cut(a)===cut(b);};
const GREY_CHUNKS = 48;
// performance-3 (owner 13 Nov 2026: zooming out lags, big maps): ground first seen while the view is zoomed far out is
// painted as a draft at a half or a quarter of the resolution (the screen shows no more) – 4 to 16 times cheaper than the
// full picture (~33 ms a chunk without GPU; 250 chunks come into view at once on a 200 × 200 map). A draft is painted
// again in full, spread over frames, once the view zooms in past its limit. First-seen chunks share FIRST_PAINT_MS a
// frame, nearest the screen centre first, so even a long row of new ground never freezes the game.
export const DRAFT_VIEW=Object.freeze([{zoom:.3,scale:4,until:.36},{zoom:.5,scale:2,until:.5}]);
export const draftScale=zoom=>DRAFT_VIEW.find(d=>zoom<=d.zoom)?.scale??1;
export const draftStale=(scale,zoom)=>!!scale&&zoom>(DRAFT_VIEW.find(d=>d.scale===scale)?.until??0);
const FIRST_PAINT_MS = 12;
const BACKLOG_CHUNKS = 6, BACKLOG_SLICE_MS = 10, BACKLOG_EVERY_MS = 30;
// owner 15 Nov: a season step is blended ahead SEASON_PREP.sliceMs a frame, at most maxMs before it is shown anyway.
const SEASON_PREP = Object.freeze({ sliceMs: 8, maxMs: 3000, pool: 96 });
const GROUND_BAND = 36; // rows of ground a frame in a paint spread over frames (a multiple of GROUND_STEP)
// m-teren-vyska (part 2): room above a chunk's picture for its highest ground (px).
const LIFT_PAD = Math.ceil(HEIGHT_MAX * HEIGHT_UNIT_PX) + 2;
// Neighbouring pieces of the lifted ground overlap by this many px on every edge (a clip edge is antialiased; without
// the overlap a hairline of the background shows between tiles). `inflate` moves every edge of a convex polygon out.
const LIFT_OVERLAP = 1;
function inflate(points, d) {
  const n = points.length, cx = points.reduce((a, p) => a + p[0], 0) / n, cy = points.reduce((a, p) => a + p[1], 0) / n, lines = [];
  for (let i = 0; i < n; i++) { const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % n]; let nx = y2 - y1, ny = x1 - x2; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len; if (nx * (cx - x1) + ny * (cy - y1) > 0) { nx = -nx; ny = -ny; } lines.push([nx, ny, nx * x1 + ny * y1 + d]); }
  return points.map((p, i) => { const [a1, b1, c1] = lines[(i + n - 1) % n], [a2, b2, c2] = lines[i], det = a1 * b2 - a2 * b1; if (Math.abs(det) < 1e-9) return p; const x = (c1 * b2 - c2 * b1) / det, y = (a1 * c2 - a2 * c1) / det; return Math.hypot(x - p[0], y - p[1]) > d * 6 ? [p[0] + (x - p[0]) * d * 6 / Math.hypot(x - p[0], y - p[1]), p[1] + (y - p[1]) * d * 6 / Math.hypot(x - p[0], y - p[1])] : [x, y]; });
}
const GROUND_STEP = 6, PATH_PLANT_REACH = 48, PATH_PARTIAL_SHARE = 0.4;
const TILE_BLEED = .8;

// Season tints as RGBA, for blending between seasons during a transition.
const SEASON_TINT={Spring:[150,215,100,.16],Summer:[196,188,80,.13],Autumn:[205,128,48,.28],Winter:[232,237,220,.83]};
function mixTint(from,to,t){const a=SEASON_TINT[from],b=SEASON_TINT[to];if(!a||!b)return null;const c=a.map((v,i)=>v+(b[i]-v)*t);return`rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;}

const WINTER_VEIL=[0,2.2,1.9,1.3,1]; // light tracks fade most under snow
function mixColour(a,b,t){const p=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),x=p(a),y=p(b);return`rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`;}
// #100 Ground blending: along an edge to a ground that ranks higher (grass over desert over beach over shallow over
// deep water), the neighbour's texture fades into this tile, so shores and the desert rim are soft, not diamond steps.
// World v2: ford sits between shallow water and sand; mud and pebbles blend into grass like sand.
const GROUND_RANK=[4,2,3,1,0,1.5,2.2,2.4];
// Edge order N (x-1), E (y-1), S (x+1), W (y+1): the shared edge's midpoint in the 64 × 32 tile and the unit normal
// pointing into the tile, perpendicular to the edge on screen so the fade runs parallel to it.
const EDGES=[{dx:-1,dy:0,start:[16,8],normal:[1,2]},{dx:0,dy:-1,start:[48,8],normal:[-1,2]},{dx:1,dy:0,start:[48,24],normal:[-1,-2]},{dx:0,dy:1,start:[16,24],normal:[1,-2]}];
const FEATHER=12; // px into the tile (the centre is about 14 px from an edge)
// Diagonal neighbours touch only a corner: N-E top, E-S right, S-W bottom, W-N left vertex.
const CORNERS=[{dx:-1,dy:-1,at:[32,0],edges:[0,1]},{dx:1,dy:-1,at:[64,16],edges:[1,2]},{dx:1,dy:1,at:[32,32],edges:[2,3]},{dx:-1,dy:1,at:[0,16],edges:[3,0]}];
// Winter: snow dusts the beach and lightly frosts water; the desert has no snow.
const GROUND_WINTER=[null,'rgba(232,237,220,.55)',null,'rgba(226,236,244,.28)','rgba(226,236,244,.18)','rgba(226,236,244,.3)','rgba(232,237,220,.5)','rgba(232,237,220,.45)'];
// World v2 grass zones: provisional colour washes over the approved grass until the zone textures (g-svet-textury)
// are approved. Each tile averages its 3×3 neighbourhood, so zones fade into each other instead of ending on a diamond.
const ZONE_TINT=[[0,0,0,0],[38,104,36,.2],[196,168,82,.26],[84,62,32,.2],[0,0,0,0],[128,128,118,.2]];
// Small decorations per zone: [kind, chance per tile, count range].
const ZONE_DECALS=[[['tuft',.3,[1,2]]],[['tuft',.5,[1,3]]],[['dryTuft',.3,[1,2]]],[['leaf',.55,[2,4]],['tuft',.15,[1,1]]],[['flower',.75,[2,5]],['tuft',.3,[1,2]]],[['pebble',.6,[1,3]],['tuft',.15,[1,1]]]];
// World v2 step 3 (rounded shores): the four corners of a tile take the share of land among the four tiles that meet
// there; a pixel's land share is the bilinear mix of its tile's corners and the shore is the 0.5 contour (marching
// squares with interpolation), so river and lake edges run in curves instead of diamond steps. Fords count as water.
const WATERY=new Set([GROUND.SHALLOW,GROUND.DEEP,GROUND.FORD]);
const CORNER_TILES=[[[0,0],[-1,0],[0,-1],[-1,-1]],[[0,0],[0,-1],[1,0],[1,-1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[0,1],[-1,0],[-1,1]]]; // top, right, bottom, left
// m-nasadit-schvalenou-grafiku: the approved World v2 grass zones (four tiles per zone and season, one 256 × 32 strip
// each) replace the provisional zone washes, and the marching-squares transition tiles (16 per pair, bit 0 top, 1 right,
// 2 bottom, 3 left corner = the inner ground) draw summer shores. Ground refs of strip tiles are "key#frame".
const ZONE_ART=['meadow','lush','dry','forest','flowers','stony'];
const SEASON_ART={Spring:'spring',Summer:'summer',Autumn:'autumn',Winter:'winter'};
const zoneStripKey=(zone,season)=>`ground-zone:${zone}:${season}`,transitionKey=pair=>`ground-transition:${pair}`;
const SHORE_PAIRS={[GROUND.GRASS]:'water-grass',[GROUND.BEACH]:'water-sand',[GROUND.DESERT]:'water-sand',[GROUND.MUD]:'water-mud',[GROUND.SHORE_ROCKS]:'water-rocks'};
export function transitionIndex(corners){return corners.reduce((n,v,i)=>n|(v>=.5?1<<i:0),0);}
function terrainHash(x, y) { return ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263)) >>> 0); }

export class TerrainRenderer {
  constructor(scene, map, registry=objectRegistry, assets=null) {
    this.scene = scene; this.map = map;
    this.registry=registry;this.assets=assets;
    this.tiles = new Map(); this.wallPool = [];
    this.chunks = new Map(); this.chunkPool = [];
    this.lastView = '';
    this.dirtyChunks=new Set();this.dirtyTiles=new Map();this.paintStats={tiles:0,chunks:0};this.debugEnabled=false;this.debugGraphics=scene.add.graphics().setDepth(-99);
    // performance-1: with the Canvas renderer the shown chunks are drawn through one composed image (GroundComposite).
    this.composite=GroundComposite.supported(scene)?new GroundComposite(scene,this):null;
    for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);
    this.createTextures();
    this.outcrop=registry.require('rock_outcrop');
    this.wallTexture=assets?.textureFor(this.outcrop.id,'terrain-wall')??'terrain-wall';
    // Seasonal grass textures (wear level 0); summer uses the ordinary grass variants.
    const grass=registry.get?.(PATH_WEAR.terrainIds[0]);
    this.seasonGrass=Object.fromEntries(Object.entries(grass?.seasonVariants??{}).map(([season,list])=>[season,list.map((_,i)=>`season-${season}-${i}`).filter(layer=>assets?.hasTexture(grass.id,layer)).map(layer=>assets.key(grass.id,layer))]).filter(([,keys])=>keys.length));
    this.groundKinds=GROUND_TERRAIN_IDS.map((id,code)=>code===GROUND.GRASS?null:(registry.get?.(id)?.spriteVariants??[]).map((_,i)=>`variant-${i}`).filter(layer=>assets?.hasTexture(id,layer)).map(layer=>assets.key(id,layer)));
    this.bushSprites=new Map();this.bushPool=[];
    // velke-prirodni-objekty: one sprite per thicket or rock group (groupKey → image); tile key → group drawn now.
    this.groupSprites=new Map();this.groupPool=[];this.groupCover=new Map();
    // #116: paths are drawn by the V2 renderer (the owner's pesinav2 style); N12 stays as a developer fallback.
    this.pathStyle='v2';this.shoreStyle='round';this.groundStyle='continuous';this.v2=new PathV2Layer(this);this.requestGroundArt();
    this.wearTextures=PATH_WEAR.terrainIds.map(id=>({key:assets?.hasTexture(id)?assets.textureKey(id):this.groundTextures[0].key,variants:(registry.get?.(id)?.spriteVariants??[]).map((_,i)=>`variant-${i}`).filter(layer=>assets?.hasTexture(id,layer)).map(layer=>assets.key(id,layer))}));
  }

  // Approved zone and transition strips load once; when they are in, every chunk is repainted with them.
  requestGroundArt(){
    const want=[];for(const zone of ZONE_ART)for(const [season,art] of Object.entries(APPROVED_DEPLOY_ART.zones?.[zone]??{}))want.push([zoneStripKey(zone,season),art.strip]);
    for(const [pair,art] of Object.entries(APPROVED_DEPLOY_ART.transitions??{}))want.push([transitionKey(pair),art.strip]);
    const pending=want.filter(([key,src])=>!requestTexture(this.scene,key,src,{frameWidth:64,frameHeight:32}));
    if(pending.length&&this.scene.load?.once)this.scene.load.once('complete',()=>{if(!this.scene.sys?.isActive?.()&&this.scene.sys)return;this.repaintEverything();});
  }
  repaintEverything(){this.edgeCache?.clear();this.groundCache?.clear();this.shoreCache?.clear();this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';}
  // The grass tile ref of a zone in a season ("key#frame"), or null when that strip is not loaded.
  zoneRef(x,y,season){
    const zone=ZONE_ART[this.scene.grassZones?.[y]?.[x]],s=SEASON_ART[season],art=zone&&APPROVED_DEPLOY_ART.zones?.[zone]?.[s];if(!art)return null;
    const key=zoneStripKey(zone,s);return this.scene.textures.exists?.(key)?`${key}#${terrainHash(x,y)%art.frames}`:null;
  }
  // A Phaser frame for a texture key or a "key#frame" ref.
  frameOf(ref){if(!ref)return null;const i=ref.indexOf('#'),key=i<0?ref:ref.slice(0,i);if(!this.scene.textures.exists?.(key))return null;return this.scene.textures.get(key).get(i<0?undefined:Number(ref.slice(i+1)));}
  // The approved transition tile for a pair and corner shares, with the game's own textures on both sides: each tile is
  // the pair's outer ground (as in tile 0), its inner ground (as in tile 15) and the band between (foam, wet rim, dry
  // grass). The pure outer and inner pixels are replaced by the textures this map draws there (zones, seasons), so the
  // tiles never show a seam; only the band comes from the tile. Spring and summer only; null without the strip.
  transitionTile(pair,corners,season,innerRef,outerRef){
    if(typeof document==='undefined'||!['Spring','Summer'].includes(season)||!pair||!APPROVED_DEPLOY_ART.transitions?.[pair])return null;
    const key=transitionKey(pair);if(!this.scene.textures.exists?.(key))return null;const index=transitionIndex(corners);
    const inner=this.frameOf(innerRef),outer=this.frameOf(outerRef);if(!inner||!outer)return null;
    const id=`${pair}|${index}|${innerRef}|${outerRef}`;this.shoreCache??=new Map();if(this.shoreCache.has(id))return this.shoreCache.get(id);
    if(this.shoreCache.size>2400)this.shoreCache.clear();const masks=this.transitionMasks(pair,index);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d');
    const layer=(frame,mask)=>{const l=document.createElement('canvas');l.width=64;l.height=32;const g=l.getContext('2d');g.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,64,32);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);return l;};
    this.drawFrame(c,masks.tile,0,0);c.drawImage(layer(inner,masks.inner),0,0);c.drawImage(layer(outer,masks.outer),0,0);
    this.shoreCache.set(id,canvas);return canvas;
  }
  // Masks of the pixels of a transition tile that are pure outer (equal to tile 0) or pure inner (equal to tile 15).
  transitionMasks(pair,index){
    this.transitionMaskCache??=new Map();const id=`${pair}|${index}`;if(this.transitionMaskCache.has(id))return this.transitionMaskCache.get(id);
    const texture=this.scene.textures.get(transitionKey(pair)),read=i=>{const f=texture.get(i),cv=document.createElement('canvas');cv.width=64;cv.height=32;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,64,32);return g.getImageData(0,0,64,32).data;};
    const tile=read(index),zero=read(0),full=read(15),same=(a,b,i)=>Math.abs(a[i]-b[i])<=2&&Math.abs(a[i+1]-b[i+1])<=2&&Math.abs(a[i+2]-b[i+2])<=2;
    const mask=test=>{const cv=document.createElement('canvas');cv.width=64;cv.height=32;const g=cv.getContext('2d'),img=g.createImageData(64,32);for(let i=0;i<img.data.length;i+=4)img.data[i+3]=tile[i+3]&&test(i)?255:0;g.putImageData(img,0,0);return cv;};
    const out={tile:texture.get(index),inner:mask(i=>index===0?false:same(tile,full,i)),outer:mask(i=>index===15?false:same(tile,zero,i)&&!(index!==0&&same(tile,full,i)))};
    this.transitionMaskCache.set(id,out);return out;
  }
  drawFrame(context,frame,left,top){context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,left,top,64,32);}
  // Zone edges: every other zone among the four tiles at each corner of this tile is drawn over it through a bilinear
  // mask of its corner shares (shared by the neighbours), so zones fade over about a tile instead of ending on a diamond.
  blendZones(context,x,y,left,top,season){
    const zones=this.scene.grassZones,own=zones?.[y]?.[x];if(own==null)return;
    const zoneAt=(nx,ny)=>nx<0||ny<0||nx>=COLUMNS||ny>=ROWS||this.groundAt(nx,ny)!==GROUND.GRASS?own:zones[ny]?.[nx]??own;
    const others=new Set();for(const list of CORNER_TILES)for(const [dx,dy] of list){const z=zoneAt(x+dx,y+dy);if(z!==own)others.add(z);}
    for(const zone of others){
      const corners=CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>n+(zoneAt(x+dx,y+dy)===zone?.25:0),0));
      const s=SEASON_ART[season],art=APPROVED_DEPLOY_ART.zones?.[ZONE_ART[zone]]?.[s],key=zoneStripKey(ZONE_ART[zone],s);if(!art||!this.scene.textures.exists?.(key))continue;
      const overlay=this.maskedOverlay(`${key}#${terrainHash(x,y)%art.frames}`,corners);if(overlay)context.drawImage(overlay,left,top);
    }
  }
  blendMask(corners){
    const id=corners.join(',');this.blendMasks??=new Map();if(this.blendMasks.has(id))return this.blendMasks.get(id);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d'),image=c.createImageData(64,32),[tp,rt,bt,lf]=corners;
    for(let py=0;py<32;py++)for(let px=0;px<64;px++){
      const u=Math.max(0,Math.min(1,((py+.5)/16+(px+.5-32)/32)/2)),v=Math.max(0,Math.min(1,((py+.5)/16-(px+.5-32)/32)/2));
      image.data[(py*64+px)*4+3]=Math.round((tp*(1-u)*(1-v)+rt*u*(1-v)+bt*u*v+lf*(1-u)*v)*255);
    }
    c.putImageData(image,0,0);this.blendMasks.set(id,canvas);return canvas;
  }
  maskedOverlay(ref,corners){
    const frame=typeof document==='undefined'?null:this.frameOf(ref);if(!frame)return null;
    const id=`${ref}|${corners.join(',')}|blend`;this.shoreCache??=new Map();if(this.shoreCache.has(id))return this.shoreCache.get(id);
    if(this.shoreCache.size>2400)this.shoreCache.clear();
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d');
    c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,64,32);c.globalCompositeOperation='destination-in';c.drawImage(this.blendMask(corners),0,0);
    this.shoreCache.set(id,canvas);return canvas;
  }
  // A wear change can turn neighbours into (or out of) a trodden area, which reaches their own neighbours: repaint 5×5.
  setPathWear(system){this.wear=system;this.unsubscribeWear=system.subscribe(tile=>this.invalidateArea([tile],true,2));}
  // Developer switch (console mkDev.setPathRenderer('n12'|'v2')): repaint every chunk with the other path renderer.
  setPathStyle(style){if(!['v2','n12'].includes(style)||style===this.pathStyle)return false;this.pathStyle=style;this.v2?.invalidate();this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';return true;}
  // Developer switch (console mkDev.setShoreStyle('round'|'edges')): rounded shores (World v2 step 3) or the older edge feathering.
  setShoreStyle(style){if(!['round','edges'].includes(style)||style===this.shoreStyle)return false;this.shoreStyle=style;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';return true;}
  // Developer switch (console mkDev.setGroundStyle('tiles'|'continuous')).
  setGroundStyle(style){if(!['tiles','continuous'].includes(style)||style===this.groundStyle)return false;this.groundStyle=style;this.repaintEverything();return true;}
  // Remembered ground brightness: one value for all remembered land (the player's Memory brightness). The light
  // brightening at the sight edge (fog.brightness) moved with every step, so a tile's picture depended on when it was
  // painted; the soft edge itself is FogEdgeLayer's gradient. Owner 9 Nov: fog patches stay equal to a full repaint.
  memoryFactor(){return this.fog?.memoryBrightness??FOG_STYLE.brightness;}
  // Owner 9 Nov ("přechod mezi seen range a unseen range je stále ostrý, udělej ho plynulý"): the remembered look
  // (grey, Memory brightness) no longer switches per tile. Each known tile counts 0 in sight and 1 out of sight; that grid
  // is blurred (3 × 3, weights 1-2-1, over known tiles only) and sampled bilinearly per pixel, so
  // the ground fades from colour to the remembered grey over about two tiles, like the soft edge of unknown land.
  // Returns {x0,y0,size,values,any} for the chunk's tiles with a 2-tile margin.
  memoryField(cx,cy){
    const C=CHUNK_SIZE,M=2,size=C+2*M,x0=cx*C-M,y0=cy*C-M,fog=this.fog,raw=new Float32Array((size+2)*(size+2)),values=new Float32Array(size*size);
    const unknown=new Uint8Array((size+2)*(size+2));
    for(let y=-1;y<=size;y++)for(let x=-1;x<=size;x++){const tx=x0+x,ty=y0+y,i=(y+1)*(size+2)+x+1;
      const state=tx<0||ty<0||tx>=COLUMNS||ty>=ROWS||!fog?VISIBILITY.UNEXPLORED:fog.displayState({x:tx,y:ty});
      raw[i]=state===VISIBILITY.VISIBLE?0:1;unknown[i]=state===VISIBILITY.UNEXPLORED?1:0;}
    let any=false;
    // Unknown land does not take part (its own black fade is FogEdgeLayer's): the blur averages only known tiles, so
    // ground in sight beside unknown land stays in full colour and remembered ground beside it stays grey.
    const K=[[0,0,4],[-1,0,2],[1,0,2],[0,-1,2],[0,1,2],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const W=size+2,i=(y+1)*W+x+1;let sum=0,weight=0;
      for(const [dx,dy,k] of K){const j=i+dy*W+dx;if(unknown[j])continue;sum+=k*raw[j];weight+=k;}
      const v=weight?sum/weight:0;values[y*size+x]=v;if(v>0)any=true;}
    return {x0,y0,size,values,any,unknown};
  }
  // Shades ground pixels toward the remembered look by the memory field. In place (full chunk paint), or from `src` (the
  // cached ground, for fog patches) over `region`, then only for pixels of the tiles in `only` (tile index set) whose
  // tile is known; the black of unknown land is never touched.
  // Since performance-2 the game paints with applyMemory below; this pixel loop stays as the reference it is checked against.
  shadeMemory(context,cx,cy,left,top,{region=null,src=null,only=null,field=this.memoryField(cx,cy)}={}){
    if(!field.any&&!src)return;
    const W=context.canvas.width,H=context.canvas.height,rx=region?.x??0,ry=region?.y??0,rw=region?.w??W,rh=region?.h??H;
    const image=context.getImageData(rx,ry,rw,rh),d=image.data,hw=TILE_WIDTH/2,hh=TILE_HEIGHT/2,sat=FOG_STYLE.saturation,f=this.memoryFactor();
    const {x0,y0,size,values,unknown}=field,fog=this.fog,mapWidth=fog?.width??COLUMNS;
    let mask=null;if(only){mask=new Uint8Array(size*size);for(const index of only){const tx=index%mapWidth-x0,ty=Math.floor(index/mapWidth)-y0;if(tx>=0&&ty>=0&&tx<size&&ty<size)mask[ty*size+tx]=1;}}
    // Per pixel: tile coordinates u, v step by ±1/TILE_WIDTH along a row (no division in the loop).
    const step=1/TILE_WIDTH,lim=size-1.001;
    for(let y=0;y<rh;y++){const vert=(y+ry+top-ORIGIN.y)/hh,hor0=(rx+left-ORIGIN.x)/hw;let u=(vert+hor0)/2,v=(vert-hor0)/2;
      for(let x=0,o=y*rw*4;x<rw;x++,o+=4,u+=step,v-=step){
      const a=src?src[o+3]:d[o+3];if(!a)continue;
      if(mask){const tx=Math.floor(u)-x0,ty=Math.floor(v)-y0;if(tx<0||ty<0||tx>=size||ty>=size||!mask[ty*size+tx])continue;}
      let fu=u-.5-x0,fv=v-.5-y0;if(fu<0)fu=0;else if(fu>lim)fu=lim;if(fv<0)fv=0;else if(fv>lim)fv=lim;
      const i=fu|0,j=fv|0,gu=fu-i,gv=fv-j,k=j*size+i,v00=values[k],v10=values[k+1],v01=values[k+size],v11=values[k+size+1];
      if(src)d[o+3]=a;
      if(v00+v10+v01+v11===0){if(src){d[o]=src[o];d[o+1]=src[o+1];d[o+2]=src[o+2];}continue;}
      const w=v00+v10+v01+v11===4?1:(v00+(v10-v00)*gu)*(1-gv)+(v01+(v11-v01)*gu)*gv;
      const r=src?src[o]:d[o],g=src?src[o+1]:d[o+1],b=src?src[o+2]:d[o+2];
      const l=.3*r+.59*g+.11*b,gr=(l+(r-l)*sat)*f,gg=(l+(g-l)*sat)*f,gb=(l+(b-l)*sat)*f;
      if(w===1){d[o]=gr;d[o+1]=gg;d[o+2]=gb;}else{d[o]=r+(gr-r)*w;d[o+1]=g+(gg-g)*w;d[o+2]=b+(gb-b)*w;}
    }}
    context.putImageData(image,rx,ry);
  }
  // performance-2: the same shading without a pixel loop per repaint. The remembered look of a chunk's whole ground
  // (greyGround: the formula above at weight 1) is kept beside the ground picture; a repaint draws it over the ground
  // through the memory field as an alpha mask (one small image, stretched over the tiles with bilinear smoothing – the
  // same interpolation shadeMemory does by hand). 'source-atop' keeps the ground's own alpha. Called right after the
  // ground is drawn, before the black of unknown land, so that black stays black.
  greyGround(ck,cached){
    const f=this.memoryFactor(),key=`${cached.rev??0}|${f}`,store=this.greyCache??=new Map();let entry=store.get(ck);
    if(entry?.key===key&&entry.source===cached.canvas){store.delete(ck);store.set(ck,entry);return entry.canvas;}
    const W=cached.canvas.width,H=cached.canvas.height,canvas=entry?.canvas??document.createElement('canvas');canvas.width=W;canvas.height=H;
    const image=cached.canvas.getContext('2d').getImageData(0,0,W,H),d=image.data,sat=FOG_STYLE.saturation;
    for(let o=0;o<d.length;o+=4){if(!d[o+3])continue;const r=d[o],g=d[o+1],b=d[o+2],l=.3*r+.59*g+.11*b;d[o]=(l+(r-l)*sat)*f;d[o+1]=(l+(g-l)*sat)*f;d[o+2]=(l+(b-l)*sat)*f;}
    canvas.getContext('2d').putImageData(image,0,0);store.delete(ck);store.set(ck,{key,source:cached.canvas,canvas});this.paintStats.greyPaints=(this.paintStats.greyPaints??0)+1;
    // Memory: ~0.8 MB each; chunks in view keep theirs, of the others only the most recently used.
    if(store.size>GREY_CHUNKS){const view=this.neededChunks instanceof Set?this.neededChunks:new Set(this.neededChunks??[]);for(const k of [...store.keys()]){if(store.size<=GREY_CHUNKS)break;if(k!==ck&&!view.has(k))store.delete(k);}}
    return canvas;
  }
  applyMemory(context,cx,cy,left,top,cached,{region=null,field=this.memoryField(cx,cy)}={}){
    if(!field.any)return;
    const W=context.canvas.width,H=context.canvas.height,rx=region?.x??0,ry=region?.y??0,rw=region?.w??W,rh=region?.h??H,hw=TILE_WIDTH/2,hh=TILE_HEIGHT/2;
    const grey=this.greyGround(`${cx},${cy}`,cached),{x0,y0,size,values}=field;
    const mask=this.memoryMask??=document.createElement('canvas');if(mask.width!==size||mask.height!==size){mask.width=size;mask.height=size;}
    const m=mask.getContext('2d'),image=this.memoryMaskImage?.width===size?this.memoryMaskImage:this.memoryMaskImage=m.createImageData(size,size),a=image.data;
    for(let i=0;i<values.length;i++)a[i*4+3]=Math.round(values[i]*255);m.putImageData(image,0,0);
    const scratch=this.memoryScratch??=document.createElement('canvas');if(scratch.width!==W||scratch.height!==H){scratch.width=W;scratch.height=H;}
    const c=scratch.getContext('2d');c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(rx,ry,rw,rh);c.clip();c.globalCompositeOperation='copy';
    // Mask pixel (mx, my) is tile (x0 + mx, y0 + my); tile space to chunk pixels is the isometric projection.
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='low';c.setTransform(hw,hh,-hw,hh,ORIGIN.x-left+(x0-y0)*hw,ORIGIN.y-top+(x0+y0)*hh);c.drawImage(mask,0,0);
    c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-in';c.drawImage(grey,rx,ry,rw,rh,rx,ry,rw,rh);c.restore();
    context.save();context.globalCompositeOperation='source-atop';context.drawImage(scratch,rx,ry,rw,rh,rx,ry,rw,rh);context.restore();
  }
  // One chunk of continuous ground (land, water, plants, water plants) in chunk-canvas pixels.
  // m-plynule-prechody: the continuous ground's season look for a chunk – {key} while it shows one season, else the step
  // key of the gradual change with its mask (SeasonTransition.groundLook). The key is part of the chunk's ground stamp.
  groundLook(cx,cy){return this.seasonGroundLook?.(cx,cy,this.season,CHUNK_SIZE)??{key:this.season};}
  // Season of a bush or rock on a tile during the gradual change (the same mask as trees).
  tileSeason(x,y){return x==null?this.season:this.seasonAt?.({x,y},this.season)??this.season;}
  // m-plynule-prechody: the ground picture of a chunk for its stamp. A plain season is painted (or taken over from the
  // layer a finished change left). Mid-change the chunk keeps two plain layers – the old and the new season, each
  // painted once per change – and every step only blends them again through the noise mask (SeasonTransition
  // blendMask: a few ms instead of a full repaint), so the change comes in patches without repainting the ground.
  // performance-2: returns null while a whole-chunk paint is still under way (see `plain`): the chunk keeps its previous
  // picture and comes back next frame.
  groundPicture(ck,cx,cy,left,top,texture,occupied,stamp,cached){const result=this.groundPictureStep(ck,cx,cy,left,top,texture,occupied,stamp,cached);if(result)this.pathChanges?.delete(ck);return result;}
  // The ground stamp of a chunk for a season look key: look, buildings on it, path state.
  groundStampFor(cx,cy,lookKey){
    let occ='';for(const b of this.scene.buildings??[])for(const t of b.tiles??[])if(Math.floor(t.x/CHUNK_SIZE)===cx&&Math.floor(t.y/CHUNK_SIZE)===cy)occ+=`${t.x},${t.y};`;
    return`${lookKey}|${occ}|${this.pathRevAll??0}.${this.pathRev?.get(`${cx},${cy}`)??0}|${this.v2?.geo&&this.pathStyle==='v2'?1:0}`;
  }
  // owner 15 Nov ("někde je stále ostrá hrana"): the next step of a gradual season change is blended ahead for every
  // chunk in view, a time slice a frame, while the screen keeps the previous step; then SeasonTransition commits it and
  // all chunks take it in one frame (a few tenths of a ms each). Chunks whose season layers are not ready are skipped
  // and repaint the old way after the commit. `job` = {look(cx,cy,season,size), commit()} or null.
  prepareSeasonStep(job){
    if(!job){this.seasonPrep=null;return;}
    this.seasonPrep={...job,since:this.seasonPrep?.since??performance.now()};
  }
  recycleGround(ck,canvas){
    if(!canvas)return;const own=this.seasonLayers?.get(ck);if(own&&Object.values(own).some(layer=>layer.canvas===canvas))return;
    for(const job of this.groundJobs?.values()??[])if(job.canvas===canvas)return;
    const pool=this.groundPool??=[];if(pool.length<SEASON_PREP.pool&&!pool.includes(canvas))pool.push(canvas);
  }
  prepareSeasonWork(){
    const job=this.seasonPrep;if(!job)return;
    const t0=performance.now(),prepared=this.preparedGround??=new Map();let done=true;
    for(const ck of this.neededChunks??[]){
      if(!this.chunks.has(ck))continue;const [cx,cy]=ck.split(',').map(Number),look=job.look(cx,cy,this.season,CHUNK_SIZE),stamp=this.groundStampFor(cx,cy,look.key),cached=this.groundCache?.get(ck);
      if(cached?.stamp===stamp)continue;const have=prepared.get(ck);if(have?.stamp===stamp)continue;
      if(performance.now()-t0>SEASON_PREP.sliceMs){done=false;break;}
      const result=this.prepareGround(ck,cx,cy,look,stamp);prepared.set(ck,{stamp,result});
    }
    if(done||performance.now()-job.since>SEASON_PREP.maxMs){this.seasonPrep=null;job.commit();}
  }
  // The ground picture of one chunk for a look, into a canvas of its own, only from season layers already painted
  // (cheap). Null when a layer would need a full paint.
  prepareGround(ck,cx,cy,look,stamp){
    const own=this.seasonLayers?.get(ck),rest=stamp.slice(stamp.indexOf('|')),ready=season=>{const layer=own?.[season];return!!layer&&layer.stamp===`${season}${rest}`&&!draftStale(layer.canvas?.draft,this.viewZoom??1);};
    if(!(look.blend?ready(look.from)&&ready(look.to):ready(look.key)))return null;
    if(!look.blend)return{canvas:own[look.key].canvas,stamp,sig:own[look.key].sig};
    const origin=gridToWorld(cx*CHUNK_SIZE,cy*CHUNK_SIZE),left=origin.x-CHUNK_SIZE*32,size={width:CHUNK_SIZE*64,height:CHUNK_SIZE*32};
    const out=this.groundPool?.pop()??document.createElement('canvas');
    return this.groundPictureStep(ck,cx,cy,left,origin.y,size,this.buildingTiles(),stamp,null,{look,out});
  }
  groundJobActive(ck){if(this.groundJobs?.size)for(const key of this.groundJobs.keys())if(key.startsWith(`${ck}|`))return true;return false;}
  groundPictureStep(ck,cx,cy,left,top,texture,occupied,stamp,cached,options={}){
    const look=options.look??this.groundLook(cx,cy),rest=stamp.slice(stamp.indexOf('|')),layers=this.seasonLayers??=new Map(),own=layers.get(ck)??{};
    const fresh=()=>{const c=document.createElement('canvas');c.width=texture.width;c.height=texture.height;return c;};
    const change=this.pathChange(ck,cx,cy,left,top,stamp,cached),sig=change.sig,progressive=!!cached&&this.groundPaintsLeft!==Infinity;
    const count=()=>{this.paintStats.groundPaints=(this.paintStats.groundPaints??0)+1;};
    // A whole paint of a chunk that already shows a picture is spread over frames: GROUND_BAND rows of ground a frame
    // (about 12 ms without GPU instead of 110 ms at once), the plants last. A chunk without a picture is painted at once.
    const fine=canvas=>!draftStale(canvas?.draft,this.viewZoom??1);
    const plain=(season,canvas,draft=1)=>{
      if(!progressive&&draft>1){canvas.width=texture.width;canvas.height=texture.height;this.paintDraftChunk(canvas,cx,cy,left,top,season,occupied,draft);canvas.draft=draft;count();return canvas;}
      if(!progressive){canvas.width=texture.width;canvas.height=texture.height;canvas.draft=0;const c2=canvas.getContext('2d');c2.clearRect(0,0,canvas.width,canvas.height);this.paintContinuousChunk(c2,cx,cy,left,top,season,occupied);count();return canvas;}
      const jobs=this.groundJobs??=new Map(),jk=`${ck}|${season}`,want=`${season}${rest}`;let job=jobs.get(jk);
      if(!job||job.want!==want){const work=job?.canvas??fresh();work.width=texture.width;work.height=texture.height;job={want,canvas:work,y:0,painter:this.groundPainter(cx,cy,left,top,season,occupied)};jobs.set(jk,job);
        // Jobs of chunks that left the view are dropped (their chunk paints afresh when it comes back).
        if(jobs.size>8)for(const key of [...jobs.keys()]){if(jobs.size<=8)break;if(key!==jk)jobs.delete(key);}}
      const c2=job.canvas.getContext('2d'),H=texture.height;
      if(job.y<H){const h=Math.min(GROUND_BAND,H-job.y);job.painter.ground(c2,{x:0,y:job.y,w:texture.width,h});job.y+=h;this.paintStats.groundBands=(this.paintStats.groundBands??0)+1;return null;}
      job.painter.plants(c2);jobs.delete(jk);count();return job.canvas;};
    if(!look.blend){
      // A finished change: the new season's layer is the picture; the old layer is dropped.
      const done=own[look.key];layers.delete(ck);
      if(done?.stamp===stamp&&fine(done.canvas))return{canvas:done.canvas,stamp,sig};
      // performance-2: only the paths changed and part of the picture differs: that part alone is painted again.
      const rect=change.rect;
      if(rect&&cached?.canvas&&cached.pathOnlyFor===stamp&&rect.w*rect.h<=texture.width*texture.height*PATH_PARTIAL_SHARE){
        this.paintContinuousChunk(cached.canvas.getContext('2d'),cx,cy,left,top,look.key,occupied,rect);this.paintStats.groundPartial=(this.paintStats.groundPartial??0)+1;return{canvas:cached.canvas,stamp,sig};}
      const canvas=plain(look.key,cached?.canvas??fresh(),draftScale(this.viewZoom??1));return canvas?{canvas,stamp,sig}:null;
    }
    const layer=season=>{const want=`${season}${rest}`,have=own[season];if(have?.stamp===want&&fine(have.canvas))return have.canvas;
      if(cached?.stamp===want&&fine(cached.canvas)){own[season]={stamp:want,sig:cached.sig,canvas:cached.canvas};cached=null;return own[season].canvas;}
      // performance-2: only the paths changed since this layer was painted: the part that differs is painted again.
      if(have?.sig&&sig&&pathOnlyChange(have.stamp,want)){const rect=this.pathDiffRect(have.sig,sig);
        if(!rect||rect.w*rect.h<=texture.width*texture.height*PATH_PARTIAL_SHARE){
          if(rect){this.paintContinuousChunk(have.canvas.getContext('2d'),cx,cy,left,top,season,occupied,rect);this.paintStats.groundPartial=(this.paintStats.groundPartial??0)+1;}
          have.stamp=want;have.sig=sig;return have.canvas;}}
      const painted=plain(season,have?.canvas??fresh());if(!painted)return null;own[season]={stamp:want,sig,canvas:painted};return painted;};
    const a=layer(look.from),b=a&&layer(look.to);layers.delete(ck);layers.set(ck,own);if(!a||!b)return null;
    // Memory: two layers (~0.8 MB each) per chunk; chunks in view always keep theirs, of the others only the most
    // recently blended ones up to SEASON_TRANSITION.layerChunks in all.
    if(layers.size>SEASON_TRANSITION.layerChunks){const view=this.neededChunks instanceof Set?this.neededChunks:new Set(this.neededChunks??[]);for(const key of [...layers.keys()]){if(layers.size<=SEASON_TRANSITION.layerChunks)break;if(!view.has(key)&&key!==ck)layers.delete(key);}}
    const canvas=options.out??(cached?.canvas&&cached.canvas!==a&&cached.canvas!==b?cached.canvas:fresh()),c=canvas.getContext('2d'),W=texture.width,H=texture.height;
    // The new season through the mask (alpha = blend weight on a coarse grid, smoothed up), over the old one.
    const step=8,gw=Math.ceil(W/step)+1,gh=Math.ceil(H/step)+1,mask=this.maskCanvas??=document.createElement('canvas');mask.width=gw;mask.height=gh;
    const m=mask.getContext('2d'),image=m.createImageData(gw,gh);blendMask(image.data,gw,gh,(px,py)=>{const g=worldToGrid(px*step+left,py*step+top);return[g.x,g.y];},look.blend.weight);m.putImageData(image,0,0);
    const top_=this.blendCanvas??=document.createElement('canvas');top_.width=W;top_.height=H;const t2=top_.getContext('2d');t2.clearRect(0,0,W,H);t2.drawImage(b,0,0);
    t2.globalCompositeOperation='destination-in';t2.imageSmoothingEnabled=true;t2.drawImage(mask,0,0,gw,gh,0,0,gw*step,gh*step);t2.globalCompositeOperation='source-over';
    canvas.width=W;canvas.height=H;c.clearRect(0,0,W,H);c.drawImage(a,0,0);c.drawImage(top_,0,0);canvas.draft=0;this.paintStats.groundBlends=(this.paintStats.groundBlends??0)+1;
    return{canvas,stamp,sig};
  }
  paintContinuousChunk(context,cx,cy,left,top,season,occupied,rect=null){const painter=this.groundPainter(cx,cy,left,top,season,occupied);painter.ground(context,rect);painter.plants(context,rect);}
  // performance-3: the same picture at 1/scale of the size, stretched over `canvas` (see DRAFT_VIEW).
  paintDraftChunk(canvas,cx,cy,left,top,season,occupied,scale){
    const small=this.draftCanvas??=document.createElement('canvas'),W=canvas.width,H=canvas.height;small.width=Math.ceil(W/scale);small.height=Math.ceil(H/scale);
    const c=small.getContext('2d'),painter=this.groundPainter(cx,cy,left,top,season,occupied,scale);painter.ground(c);painter.plants(c);
    const out=canvas.getContext('2d');out.clearRect(0,0,W,H);out.imageSmoothingEnabled=true;out.drawImage(small,0,0,small.width,small.height,0,0,small.width*scale,small.height*scale);
    this.paintStats.groundDrafts=(this.paintStats.groundDrafts??0)+1;
  }
  // performance-2: the two halves of a ground paint – `ground` (land, water, paths: the pixel loop) and `plants` – each
  // for the whole picture or for `rect` {x,y,w,h} only (a changed path; a band of a paint spread over several frames).
  groundPainter(cx,cy,left,top,season,occupied,scale=1){
    const x0=cx*CHUNK_SIZE,y0=cy*CHUNK_SIZE,cell=(x,y)=>this.groundAt(Math.max(0,Math.min(COLUMNS-1,x)),Math.max(0,Math.min(ROWS-1,y)));
    const isLand=(x,y)=>{const g=cell(x,y);return g===GROUND.GRASS||LAND_MATERIAL[g]!==undefined;},zoneAt=(x,y)=>{const g=cell(x,y);return g===GROUND.GRASS?(this.scene.grassZones?.[Math.max(0,Math.min(ROWS-1,y))]?.[Math.max(0,Math.min(COLUMNS-1,x))]??0):LAND_MATERIAL[g]??0;};
    const depthAt=(x,y)=>WATER_DEPTH[cell(x,y)]??-1,settings={...groundSettings(),year:SEASON_YEAR[season]??0.5};
    const toWorld=(px,py)=>{const g=worldToGrid(px*scale+left,py*scale+top);return [g.x,g.y];},ownTile=(x,y)=>x>=x0&&y>=y0&&x<x0+CHUNK_SIZE&&y<y0+CHUNK_SIZE,seen=(x,y)=>(this.fog?.displayState({x,y})??VISIBILITY.VISIBLE)!==VISIBILITY.UNEXPLORED,

      // Only this chunk's own tiles: painting into neighbour chunks drew light seams over their remembered (fogged) ground.
      inWorld=(x,y)=>ownTile(x,y),own=(fx,fy)=>ownTile(Math.floor(fx),Math.floor(fy));
    const field=makeWaterField({x0,y0,span:CHUNK_SIZE,depthAt,settings});
    // A hair of bleed past the chunk's own tiles: chunk textures are filtered when zoomed, so a hard edge would show a dark line.
    const e=0.05,inside=(fx,fy)=>fx>=x0-e&&fy>=y0-e&&fx<x0+CHUNK_SIZE+e&&fy<y0+CHUNK_SIZE+e&&fx>=0&&fy>=0&&fx<COLUMNS&&fy<ROWS;
    const surface=this.pathStyle==='v2'&&this.v2?.geo?pathSurface(this.v2.geo,this.v2.index,PATH_SURFACE):null;
    const ground=(context,rect=null)=>{if(rect)context.clearRect(rect.x,rect.y,rect.w,rect.h);
      paintContinuousGround(context,{width:context.canvas.width,height:context.canvas.height,toWorld,isGrass:isLand,zoneAt,depthAt,inWorld,inside,field,settings,step:GROUND_STEP,surface,rect});
      this.paintRelief(context,cx,cy,left,top,rect,scale);};
    const screen=(fx,fy)=>{const p=gridToWorld(fx,fy);return [p.x-left,p.y-top];},name=seasonOf(settings.year),free=(fx,fy)=>own(fx,fy)&&!occupied.has(`${Math.floor(fx)},${Math.floor(fy)}`)&&this.map[Math.floor(fy)]?.[Math.floor(fx)]!==1;
    const plants=(context,rect=null)=>{if(scale!==1){context.save();context.scale(1/scale,1/scale);}if(rect){context.save();context.beginPath();context.rect(rect.x,rect.y,rect.w,rect.h);context.clip();}
    for(const p of waterObjectsFor({x0:x0-1,y0:y0-1,span:CHUNK_SIZE+2,field,depthAt,settings}))if(free(p.fx,p.fy)){const [sx,sy]=screen(p.fx,p.fy);drawPlant(context,p,sx,sy,name);}
    const list=plantsFor({x0:x0-1,y0:y0-1,span:CHUNK_SIZE+2,isGrass:isLand,zoneAt,depthAt,field,settings,seed:this.scene.worldSeed??0}).filter(p=>free(p.fx,p.fy)&&(!surface||surface.plantKeep(p.fx,p.fy))).sort((a,b)=>a.fx+a.fy-b.fx-b.fy);
    for(const p of list){const [sx,sy]=screen(p.fx,p.fy);drawPlant(context,p,sx,sy,name);}
    if(rect)context.restore();if(scale!==1)context.restore();};
    return {ground,plants};
  }
  // m-teren-vyska (part 2): the chunk as it is shown – its flat picture (ground, paths, fog, memory) lifted by the
  // height, as in the Studio's World Lab: each tile is two triangles of the flat picture, each moved up by an affine map
  // (x stays, y rises by the height at that point), drawn back to front; a triangle turned away from the viewer is
  // skipped (it lies behind its own hill). The lifted picture is LIFT_PAD px taller and is shown that much higher.
  // Returns the lifted texture's key, or null for a level chunk (shown as it is).
  liftChunk(key,rects=null){
    const relief=this.scene.relief;if(!relief||this.scene.reliefLift===false||typeof document==='undefined')return null;
    const [cx,cy]=key.split(',').map(Number),flatKey=`terrain-chunk-${cx}-${cy}`,name=`terrain-lift-${cx}-${cy}`,textures=this.scene.textures;if(!textures.exists(flatKey))return null;
    const x0=cx*CHUNK_SIZE,y0=cy*CHUNK_SIZE,CW=relief.width+1,U=HEIGHT_UNIT_PX,corner=(x,y)=>relief.map.corners[Math.max(0,Math.min(relief.height,y))*CW+Math.max(0,Math.min(relief.width,x))]*U;
    // What the chunk's relief asks for, worked out once: its highest and lowest corner, and whether any tile stands so
    // far above the tile in front of it that it could cover it (then a part cannot be redrawn alone).
    let shape=(this.liftShapes??=new Map()).get(key);
    if(!shape){let top=0,low=Infinity,cover=false;for(let y=y0;y<=y0+CHUNK_SIZE;y++)for(let x=x0;x<=x0+CHUNK_SIZE;x++){const c=corner(x,y);top=Math.max(top,c);low=Math.min(low,c);if(corner(x+1,y+1)-c>TILE_HEIGHT/2-3||corner(x+1,y)-c>TILE_HEIGHT/2-3||corner(x,y+1)-c>TILE_HEIGHT/2-3)cover=true;}
      shape={top,low,cover};this.liftShapes.set(key,shape);}
    if(shape.top<.5){if(textures.exists(name))textures.remove(name);return null;}
    const flat=textures.get(flatKey).getSourceImage(),W=flat.width,H=flat.height,fresh=!textures.exists(name),texture=fresh?textures.createCanvas(name,W,H+LIFT_PAD):textures.get(name),out=texture.getContext();
    const origin=gridToWorld(x0,y0),left=origin.x-CHUNK_SIZE*32,topY=origin.y,hw=TILE_WIDTH/2,hh=TILE_HEIGHT/2;
    out.setTransform(1,0,0,1,0,0);
    // A nearly level chunk (a plain, a lake): one copy moved up.
    if(shape.top-shape.low<.6){out.clearRect(0,0,W,H+LIFT_PAD);out.drawImage(flat,0,Math.round(LIFT_PAD-(shape.top+shape.low)/2));texture.refresh();this.paintStats.lifts=(this.paintStats.lifts??0)+1;return name;}
    // `rects` (flat chunk px, fog patches): only the tiles they touch are drawn again, over what is there (ground is
    // opaque) – unless a tile of this chunk may cover the one in front of it.
    const partial=!!rects&&!fresh&&!shape.cover;if(!partial)out.clearRect(0,0,W,H+LIFT_PAD);
    const piece=(p,l)=>{
      // The affine map of the plane through the first three points: x stays, y rises by a·x + b·y + c.
      const [[ax,ay],[bx,by],[qx,qy]]=p,det=(bx-ax)*(qy-ay)-(qx-ax)*(by-ay);if(!det)return;
      const a=((l[1]-l[0])*(qy-ay)-(l[2]-l[0])*(by-ay))/det,b=((bx-ax)*(l[2]-l[0])-(qx-ax)*(l[1]-l[0]))/det,c=l[0]-a*ax-b*ay;
      if(1-b<.05)return;
      const d=p.map(([x,y])=>[x,y-(a*x+b*y+c)+LIFT_PAD]);
      out.save();out.beginPath();inflate(d,LIFT_OVERLAP).forEach(([x,y],i)=>{if(i)out.lineTo(x,y);else out.moveTo(x,y);});out.closePath();out.clip();
      out.setTransform(1,-a,0,1-b,0,-c+LIFT_PAD);
      let sx=Infinity,sy=Infinity,ex=-Infinity,ey=-Infinity;for(const [x,y] of p){sx=Math.min(sx,x);sy=Math.min(sy,y);ex=Math.max(ex,x);ey=Math.max(ey,y);}
      sx=Math.max(0,Math.floor(sx)-2);sy=Math.max(0,Math.floor(sy)-2);const sw=Math.min(W-sx,Math.ceil(ex)+2-sx),sh=Math.min(H-sy,Math.ceil(ey)+2-sy);
      if(sw>0&&sh>0)out.drawImage(flat,sx,sy,sw,sh,sx,sy,sw,sh);out.restore();
    };
    let drawn=0;
    for(let sum=0;sum<=2*(CHUNK_SIZE-1);sum++)for(let dx=0;dx<CHUNK_SIZE;dx++){const dy=sum-dx;if(dy<0||dy>=CHUNK_SIZE)continue;
      const x=x0+dx,y=y0+dy,px=ORIGIN.x-left+(x-y)*hw,py=ORIGIN.y-topY+(x+y)*hh;
      if(partial&&!rects.some(r=>px+hw+2>r.bx0&&px-hw-2<r.bx0+r.bw&&py+2*hh+2>r.by0&&py-2<r.by0+r.bh))continue;
      const N=[px,py],E=[px+hw,py+hh],S=[px,py+2*hh],Wp=[px-hw,py+hh],c=[corner(x,y),corner(x+1,y),corner(x+1,y+1),corner(x,y+1)];drawn++;
      // A tile whose four corners lie in one plane (within half a pixel) is one piece, otherwise two triangles.
      if(Math.abs(c[0]+c[2]-c[1]-c[3])<.5)piece([N,E,S,Wp],[c[0],c[1],c[2],c[3]]); // corners in order round the tile (a crossed outline would clip a bow-tie)
      else{piece([N,E,Wp],[c[0],c[1],c[3]]);piece([Wp,E,S],[c[3],c[1],c[2]]);}}
    texture.refresh();this.paintStats.lifts=(this.paintStats.lifts??0)+1;this.paintStats.liftTiles=(this.paintStats.liftTiles??0)+drawn;return name;
  }
  // m-teren-vyska: slope shading over a chunk's ground (whole picture or `rect`): light slopes facing the upper left of
  // the screen, dark ones facing away, nothing on level ground and on water. One small image, a pixel per tile corner,
  // stretched over the tiles with bilinear smoothing (like the memory mask) and kept inside the painted ground.
  paintRelief(context,cx,cy,left,top,rect=null,scale=1){
    const relief=this.scene.relief;if(!relief||typeof document==='undefined')return;
    const M=1,x0=cx*CHUNK_SIZE-M,y0=cy*CHUNK_SIZE-M,size=CHUNK_SIZE+1+M*2,CW=relief.width+1,hw=TILE_WIDTH/2,hh=TILE_HEIGHT/2,{shadeStrength,shadeMax}=RELIEF_RULES;
    const canvas=this.reliefMask??=document.createElement('canvas');if(canvas.width!==size){canvas.width=size;canvas.height=size;}
    const c=canvas.getContext('2d'),image=this.reliefImage??=c.createImageData(size,size),d=image.data;let any=false;
    for(let j=0;j<size;j++)for(let i=0;i<size;i++){const x=Math.max(0,Math.min(relief.width,x0+i)),y=Math.max(0,Math.min(relief.height,y0+j)),k=y*CW+x,o=(j*size+i)*4;
      const s=relief.map.corners[k]>0?relief.shade[k]:0,a=Math.min(shadeMax,Math.abs(s)*shadeStrength);
      if(s>0){d[o]=255;d[o+1]=246;d[o+2]=222;d[o+3]=Math.round(a*.7*255);}else{d[o]=18;d[o+1]=22;d[o+2]=30;d[o+3]=Math.round(a*255);}
      if(d[o+3])any=true;}
    if(!any)return;c.putImageData(image,0,0);
    context.save();if(rect){context.beginPath();context.rect(rect.x,rect.y,rect.w,rect.h);context.clip();}
    // Mask pixel centre (i + .5) is corner x0 + i, a point of tile space; tile space to chunk pixels is the projection.
    context.globalCompositeOperation='source-atop';context.imageSmoothingEnabled=true;context.imageSmoothingQuality='low';
    context.setTransform(hw/scale,hh/scale,-hw/scale,hh/scale,(ORIGIN.x-left+(x0-y0)*hw)/scale,(ORIGIN.y-top+(x0+y0-1)*hh)/scale);context.drawImage(canvas,0,0);context.restore();
  }
  // performance-2: what the paths give a chunk's ground – distance and level on the painter's coarse grid (the only way a
  // path reaches the picture; plants are cleared by the same samples). Null without V2 paths.
  pathSignature(cx,cy,left,top,W=CHUNK_SIZE*64,H=CHUNK_SIZE*32){
    const surface=this.pathStyle==='v2'&&this.v2?.geo?pathSurface(this.v2.geo,this.v2.index,PATH_SURFACE):null;if(!surface)return null;
    const gw=Math.ceil(W/GROUND_STEP)+1,gh=Math.ceil(H/GROUND_STEP)+1,sig=new Float32Array(gw*gh*2);
    for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const g=worldToGrid(gx*GROUND_STEP+.5+left,gy*GROUND_STEP+.5+top),[d,l]=surface.sample(g.x,g.y),i=(gy*gw+gx)*2;sig[i]=d;sig[i+1]=l;}
    return sig;
  }
  // The canvas rectangle where two signatures differ (with the reach of the grid interpolation and of a plant sprite), or
  // null when they are the same.
  pathDiffRect(a,b,W=CHUNK_SIZE*64,H=CHUNK_SIZE*32){
    const gw=Math.ceil(W/GROUND_STEP)+1,gh=Math.ceil(H/GROUND_STEP)+1;let x0=gw,y0=gh,x1=-1,y1=-1;
    for(let gy=0,i=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++,i+=2)if(a[i]!==b[i]||a[i+1]!==b[i+1]){if(gx<x0)x0=gx;if(gx>x1)x1=gx;if(gy<y0)y0=gy;if(gy>y1)y1=gy;}
    if(x1<0)return null;
    const M=PATH_PLANT_REACH,x=Math.max(0,(x0-1)*GROUND_STEP-M),y=Math.max(0,(y0-1)*GROUND_STEP-M),r=Math.min(W,(x1+2)*GROUND_STEP+M),bottom=Math.min(H,(y1+2)*GROUND_STEP+M);
    return {x,y,w:r-x,h:bottom-y};
  }
  // The path change waiting for a chunk's ground: {stamp,sig,rect}, worked out once per ground stamp.
  pathChange(ck,cx,cy,left,top,stamp,cached){
    const store=this.pathChanges??=new Map();let entry=store.get(ck);if(entry?.stamp===stamp)return entry;
    const sig=this.pathSignature(cx,cy,left,top);entry={stamp,sig,rect:sig&&cached?.sig?this.pathDiffRect(cached.sig,sig):undefined};store.set(ck,entry);return entry;
  }

  // PathV2Layer tells which tiles' paths changed: their chunks get a new ground stamp (repainted one per frame).
  pathChanged(tiles,margin=2){if(!tiles){this.pathRevAll=(this.pathRevAll??0)+1;return;}this.pathRev??=new Map();const keys=new Set();for(const t of tiles)for(const [dx,dy] of [[-margin,-margin],[margin,-margin],[-margin,margin],[margin,margin],[0,0]])keys.add(`${Math.floor((t.x+dx)/CHUNK_SIZE)},${Math.floor((t.y+dy)/CHUNK_SIZE)}`);for(const k of keys)this.pathRev.set(k,(this.pathRev.get(k)??0)+1);}
  setDebug(value){this.debugEnabled=!!value;this.lastView='';if(!value)this.debugGraphics.clear();}
  setSeason(season){if(season===this.season)return;this.season=season;this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';}
  // Whole chunks, repainted in one pass, give the same pixels as a fresh draw (season transition).
  invalidateChunksOf(tiles,{immediate=false}={}){for(const tile of tiles){const key=`${Math.floor(tile.x/CHUNK_SIZE)},${Math.floor(tile.y/CHUNK_SIZE)}`;this.dirtyTiles.delete(key);this.dirtyChunks.add(key);}if(tiles.length){this.lastView='';if(immediate)this.repaintAll=true;}}
  invalidateArea(tiles,neighbors=true,reach=1){
    if(!tiles.length)return;
    const range=neighbors?reach:0;
    for(const tile of tiles)for(let dy=-range;dy<=range;dy++)for(let dx=-range;dx<=range;dx++){
      const x=tile.x+dx,y=tile.y+dy;if(x<0||x>=COLUMNS||y<0||y>=ROWS)continue;
      const key=`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`;
      if(this.dirtyChunks.has(key)&&!this.dirtyTiles.has(key))continue;
      if(!this.dirtyTiles.has(key))this.dirtyTiles.set(key,new Set());
      this.dirtyTiles.get(key).add(y*COLUMNS+x);this.dirtyChunks.add(key);
    }
    this.lastView='';
  }
  // Worn grass keeps the tile's own seasonal grass; the approved Earth track is drawn over it as a narrow
  // strip (soft halo, edge, soil texture from the approved tiles). Every tile draws the strips of all worn
  // tiles around it, clipped to its own diamond, so a single repainted tile matches a full repaint and the
  // track runs on across edges, corners and diagonals. Fog mode reads only remembered levels and links.
  pathLevel(tile){
    if(tile.x<0||tile.y<0||tile.x>=COLUMNS||tile.y>=ROWS)return 0;
    return this.fog?.enabled&&this.memory?this.memory.terrain.get(tile.y*this.fog.width+tile.x)?.[1]??0:this.wear?.level(tile)??0;
  }
  // Organic Earth track: a corridor is one gentle curve per pair of linked worn tiles, through slightly offset tile
  // nodes and shared by both tiles, so it runs on across tile edges without a kink. A diagonal joins only where no
  // corner tile is worn, so there are no stars or cross-hatching. Tiles inside any 2×2 block of worn tiles form one
  // trodden area of overlapping soft blobs with no internal links. Under Fog of War only remembered data is read.
  pathVisual(level){return this.registry.require(PATH_WEAR.terrainIds[level]).visual;}
  pathNode(tile){const center=tileCenter(tile),h=terrainHash(tile.x,tile.y);return {x:center.x+((h%7)-3)*1.1,y:(center.y+(((h>>>3)%5)-2)*.7)*2};}
  pathLinked(tile,neighbor,bit){
    if(this.fog?.enabled&&this.memory)return !!((this.memory.terrain.get(tile.y*this.fog.width+tile.x)?.[3]??0)&(1<<bit));
    return canStep(this.scene.map,tile,neighbor);
  }
  pathArea(tile){
    if(!this.pathLevel(tile))return false;
    return [[0,0],[-1,0],[0,-1],[-1,-1]].some(([ox,oy])=>[[0,0],[1,0],[0,1],[1,1]].every(([dx,dy])=>this.pathLevel({x:tile.x+ox+dx,y:tile.y+oy+dy})>0));
  }
  // Everything that can reach the diamond of tile (x, y): drawn from the worn tiles around it.
  pathElements(x,y){
    const nodes=[],areas=[],links=new Map();
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      const tile={x:x+ox,y:y+oy},level=this.pathLevel(tile);if(!level)continue;
      const visual=this.pathVisual(level),h=terrainHash(tile.x,tile.y),area=this.pathArea(tile);
      if(area)areas.push({level,visual,center:this.pathNode(tile),radius:42+(h%5)*1.5});
      else nodes.push({level,visual,tile,width:visual.pathWidth,start:this.pathNode(tile)});
      for(const [bit,[dx,dy]]of MEMORY_DIRECTIONS.entries()){
        const neighbor={x:tile.x+dx,y:tile.y+dy},other=this.pathLevel(neighbor);if(!other)continue;
        if(dx&&dy&&(this.pathLevel({x:tile.x+dx,y:tile.y})||this.pathLevel({x:tile.x,y:tile.y+dy})))continue;
        if(area&&this.pathArea(neighbor))continue;
        const first=tile.y*COLUMNS+tile.x<neighbor.y*COLUMNS+neighbor.x,a=first?tile:neighbor,b=first?neighbor:tile,key=`${a.x},${a.y}|${b.x},${b.y}`;
        if(links.has(key)||!this.pathLinked(tile,neighbor,bit))continue;
        const low=Math.min(level,other),start=this.pathNode(a),end=this.pathNode(b),length=Math.hypot(end.x-start.x,end.y-start.y)||1,bend=((terrainHash(a.x*3+b.x,a.y*3+b.y)%7)-3)*1.4;
        links.set(key,{level:low,visual:this.pathVisual(low),width:Math.min(visual.pathWidth,this.pathVisual(other).pathWidth),start,end,
          control:{x:(start.x+end.x)/2-(end.y-start.y)/length*bend,y:(start.y+end.y)/2+(end.x-start.x)/length*bend}});
      }
    }
    const linked=new Set([...links.keys()].flatMap(key=>key.split('|')));
    for(const node of nodes)if(!linked.has(`${node.tile.x},${node.tile.y}`))node.width=Math.round(node.width*(1.05+(terrainHash(node.tile.x,node.tile.y)%5)*.06));
    return {nodes,areas,links:[...links.values()]};
  }
  // The soil core: the path colour with the centre of the approved Earth track tile laid over it, composed into one
  // opaque pattern repeated in world space. Being opaque, it is drawn with the tile overlap and never shows a seam.
  pathPattern(context,level,colour,alpha){
    this.pathPatterns??=new Map();const key=`${level}|${colour}|${alpha.toFixed(2)}`;if(this.pathPatterns.has(key))return this.pathPatterns.get(key);
    const texture=this.wearTextures?.[level]?.key;let style=colour;
    if(texture&&texture!==this.groundTextures?.[0]?.key&&this.scene.textures.exists?.(texture)&&typeof document!=='undefined'){
      const image=this.scene.textures.get(texture).getSourceImage(),scale=image.width/64,crop=document.createElement('canvas');crop.width=24;crop.height=10;
      const c=crop.getContext('2d');c.fillStyle=colour;c.fillRect(0,0,24,10);c.globalAlpha=alpha;c.drawImage(image,20*scale,11*scale,24*scale,10*scale,0,0,24,10);
      const pattern=context.createPattern(crop,'repeat');if(pattern){pattern.setTransform?.(new DOMMatrix().scale(1,2));style=pattern;}
    }
    this.pathPatterns.set(key,style);return style;
  }
  drawPaths(context,x,y,left,top,veil=0,clip=null){
    const {nodes,areas,links}=this.pathElements(x,y);if(!nodes.length&&!areas.length&&!links.length)return;
    const levels=[...new Set([...nodes,...areas,...links].map(e=>e.level))].sort((a,b)=>a-b);
    // One stroke or fill per group, so overlapping shapes never double their transparency; areas fill as one union.
    const lines=(list,style,alpha,extra)=>{const groups=new Map();for(const s of list){const w=s.width+extra;if(!groups.has(w))groups.set(w,[]);groups.get(w).push(s);}
      for(const [width,group]of groups){context.beginPath();for(const s of group){context.moveTo(s.start.x,s.start.y);if(s.end)context.quadraticCurveTo(s.control.x,s.control.y,s.end.x,s.end.y);else context.lineTo(s.start.x+.01,s.start.y);}context.strokeStyle=style;context.globalAlpha=alpha;context.lineWidth=width;context.stroke();}};
    const blobs=(list,style,alpha,extra)=>{if(!list.length)return;context.beginPath();for(const a of list){context.moveTo(a.center.x+a.radius+extra,a.center.y);context.arc(a.center.x,a.center.y,a.radius+extra,0,Math.PI*2);}context.fillStyle=style;context.globalAlpha=alpha;context.fill();};
    const at=(list,level)=>list.filter(e=>e.level===level);
    // Snow settles on the track: its colours fade towards snow (light tracks most), so it stays a trodden line.
    const snow=level=>Math.min(.85,veil*WINTER_VEIL[level]),tone=(colour,level)=>veil>0?mixColour(colour,'#e8eddc',snow(level)):colour;
    const begin=()=>{context.save();context.translate(-left,-top);context.scale(1,.5);context.lineCap='round';context.lineJoin='round';};
    // Translucent halo and edge: clipped to the exact diamond, as the 1 px overlap used for opaque ground would double them into seams.
    context.save();clip?.();begin();
    for(const level of levels){const visual=this.pathVisual(level),edge=tone(visual.pathEdge,level),strips=[...at(links,level),...at(nodes,level)],plots=at(areas,level);
      for(let i=visual.pathSoftness??0;i>0;i--){lines(strips,edge,.16,3+i*3);blobs(plots,edge,.16,2+i*3);}lines(strips,edge,.6,3);blobs(plots,edge,.6,2);}
    context.restore();context.restore();
    // Opaque soil core with the approved texture: drawn with the overlap, so tile edges never show a seam.
    begin();
    for(const level of levels){const core=tone(this.pathVisual(level).pathColor,level),grain=Math.round(.85*(1-(veil>0?snow(level):0))*20)/20;
      lines([...at(links,level),...at(nodes,level)],this.pathPattern(context,level,core,grain),1,0);blobs(at(areas,level),this.pathPattern(context,level,core,grain/2),1,0);}
    context.restore();
  }


  groundAt(x,y){return this.scene.groundGrid?.[y]?.[x]??GROUND.GRASS;}
  // Texture of a neighbour's ground as it would be drawn there (seasonal grass included).
  groundKey(x,y,ground,season){
    if(ground!==GROUND.GRASS){const keys=this.groundKinds[ground];return keys?.length?keys[terrainHash(x,y)%keys.length]:null;}
    const zone=this.zoneRef(x,y,season);if(zone)return zone;
    const seasonal=this.seasonGrass[season],wear=this.wearTextures[0];
    if(season!=='Summer'&&seasonal?.length)return seasonal[terrainHash(x,y)%seasonal.length];
    return wear?.variants.length?wear.variants[terrainHash(x,y)%wear.variants.length]:null;
  }
  // The neighbour's texture faded towards this tile's centre: a 64 × 32 canvas per (texture, edge), cached.
  featheredEdge(key,edge){
    const frame=typeof document==='undefined'?null:this.frameOf(key);if(!frame)return null;
    this.edgeCache??=new Map();const id=`${key}|${edge}`;if(this.edgeCache.has(id))return this.edgeCache.get(id);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d');
    c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,64,32);
    let gradient;
    if(edge>=4){const [cx,cy]=CORNERS[edge-4].at;c.translate(cx,cy);c.scale(2,1);gradient=c.createRadialGradient(0,0,0,0,0,FEATHER*.75);}
    else{const {start:[sx,sy],normal:[nx,ny]}=EDGES[edge],length=Math.hypot(nx,ny);gradient=c.createLinearGradient(sx,sy,sx+nx/length*FEATHER,sy+ny/length*FEATHER);}
    gradient.addColorStop(0,'rgba(0,0,0,.92)');gradient.addColorStop(.5,'rgba(0,0,0,.45)');gradient.addColorStop(1,'rgba(0,0,0,0)');
    c.globalCompositeOperation='destination-in';c.fillStyle=gradient;c.fillRect(-64,-32,128,64);
    this.edgeCache.set(id,canvas);return canvas;
  }
  blendEdges(context,x,y,ground,left,top,season){
    const shore=other=>this.shoreStyle==='round'&&(WATERY.has(other)!==WATERY.has(ground)||!WATERY.has(other)&&!WATERY.has(ground)&&(other===GROUND.GRASS)!==(ground===GROUND.GRASS)||[other,ground].includes(GROUND.DEEP)&&[other,ground].includes(GROUND.SHALLOW));
    for(const [index,edge]of EDGES.entries()){
      const nx=x+edge.dx,ny=y+edge.dy;if(nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;
      const other=this.groundAt(nx,ny);if(GROUND_RANK[other]<=GROUND_RANK[ground]||shore(other))continue;
      const overlay=this.featheredEdge(this.groundKey(nx,ny,other,season),index);if(overlay)context.drawImage(overlay,left,top);
    }
    // A higher ground that touches only this corner rounds it off (neither side neighbour already blends it in).
    for(const [index,corner]of CORNERS.entries()){
      const nx=x+corner.dx,ny=y+corner.dy;if(nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;
      const other=this.groundAt(nx,ny);if(GROUND_RANK[other]<=GROUND_RANK[ground]||shore(other))continue;
      if(corner.edges.some(e=>{const g=this.groundAt(x+EDGES[e].dx,y+EDGES[e].dy);return GROUND_RANK[g]>=GROUND_RANK[other];}))continue;
      const overlay=this.featheredEdge(this.groundKey(nx,ny,other,season),4+index);if(overlay)context.drawImage(overlay,left,top);
    }
  }
  // A bush shows on open ground only: not under a building, resource, paving or a well-trodden path.
  bushVisible(x,y,occupied){
    const key=`${x},${y}`;return this.scene.map?.[y]?.[x]===0&&!this.scene.resourceOccupancy?.has(key)&&!occupied.has(key)&&!this.wear?.isPaved?.({x,y})&&(this.wear?.level({x,y})??0)<2;
  }
  buildingTiles(){const tiles=new Set();for(const b of this.scene.buildings??[])for(const t of b.tiles??[])tiles.add(`${t.x},${t.y}`);return tiles;}
  paintBush(sprite,type,state,fog,x,y){
    const look=x==null?null:bushLook(BUSH_TYPES[type],x,y,this.tileSeason(x,y));
    if(look&&this.natureArtReady()&&showNature(this.scene,sprite,look,{remembered:state===VISIBILITY.EXPLORED,brightness:fog?.memoryBrightness}))return 'nature';
    const id=BUSH_TYPES[type];let key=this.assets?.hasTexture(id)?this.assets.key(id):null;if(!key)return false;
    if(state===VISIBILITY.EXPLORED){const texture=this.scene.textures.get(key);key=memoryTexture(this.scene,texture,texture.get(),fog.memoryBrightness)??key;}
    if(sprite.texture?.key!==key)sprite.setTexture(key);return true;
  }

  // Rounded shores: corner land shares, the shore mask for them and the other side's texture drawn through it.
  landCorners(x,y){
    const own=this.groundAt(x,y);return CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>{const nx=x+dx,ny=y+dy,g=nx<0||ny<0||nx>=COLUMNS||ny>=ROWS?own:this.groundAt(nx,ny);return n+(WATERY.has(g)?0:.25);},0));
  }
  shoreMask(corners,land){
    const id=`${corners.join(',')}|${land?1:0}`;this.shoreMasks??=new Map();if(this.shoreMasks.has(id))return this.shoreMasks.get(id);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d'),image=c.createImageData(64,32),[tp,rt,bt,lf]=corners;
    for(let py=0;py<32;py++)for(let px=0;px<64;px++){
      const s=Math.max(0,Math.min(1,((py+.5)/16+(px+.5-32)/32)/2)),t=Math.max(0,Math.min(1,((py+.5)/16-(px+.5-32)/32)/2));
      const v=tp*(1-s)*(1-t)+rt*s*(1-t)+bt*s*t+lf*(1-s)*t,k=Math.max(0,Math.min(1,(v-.4)/.2)),a=k*k*(3-2*k);
      image.data[(py*64+px)*4+3]=Math.round((land?a:1-a)*255);
    }
    c.putImageData(image,0,0);this.shoreMasks.set(id,canvas);return canvas;
  }
  // The texture of the other side (land over a water tile, water over a land tile), clipped by the shore mask.
  shoreOverlay(key,corners,land){
    const frame=typeof document==='undefined'?null:this.frameOf(key);if(!frame)return null;
    const id=`${key}|${corners.join(',')}|${land?1:0}`;this.shoreCache??=new Map();if(this.shoreCache.has(id))return this.shoreCache.get(id);
    if(this.shoreCache.size>2400)this.shoreCache.clear();
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d');
    c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,64,32);c.globalCompositeOperation='destination-in';c.drawImage(this.shoreMask(corners,land),0,0);
    this.shoreCache.set(id,canvas);return canvas;
  }
  // The same contour between grass and bare ground (sand, mud, pebbles, desert): rounded banks and desert rims.
  grassCorners(x,y){
    const own=this.groundAt(x,y);return CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>{const nx=x+dx,ny=y+dy,g=nx<0||ny<0||nx>=COLUMNS||ny>=ROWS?own:this.groundAt(nx,ny);return n+(g===GROUND.GRASS?.25:0);},0));
  }
  roundBank(context,x,y,ground,left,top,season){
    if(this.shoreStyle!=='round'||WATERY.has(ground))return false;
    const corners=this.grassCorners(x,y),grass=ground===GROUND.GRASS;
    if(grass?corners.every(v=>v===1):corners.every(v=>v===0))return false;
    let best=null;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((!dx&&!dy)||nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;const g=this.groundAt(nx,ny);if(WATERY.has(g)||(g===GROUND.GRASS)===grass)continue;
      const score=grass?(g===ground?0:5-GROUND_RANK[g]):1;if(!best||score>best.score)best={x:nx,y:ny,g,score};}
    if(!best)return false;
    const bare=grass?best.g:ground,grassRef=grass?this.groundKey(x,y,GROUND.GRASS,season):this.groundKey(best.x,best.y,best.g,season),sandRef=grass?this.groundKey(best.x,best.y,best.g,season):this.groundKey(x,y,ground,season);
    const tile=[GROUND.BEACH,GROUND.DESERT].includes(bare)?this.transitionTile('sand-grass',corners,season,grassRef,sandRef):null;
    if(tile){context.drawImage(tile,left,top);return true;}
    const overlay=this.shoreOverlay(this.groundKey(best.x,best.y,best.g,season),corners,!grass);if(overlay)context.drawImage(overlay,left,top);
    return true;
  }
  // Inside the water: the deep channel's edge against the shallows follows the same rounded contour.
  roundDeep(context,x,y,ground,left,top,season){
    if(this.shoreStyle!=='round'||(ground!==GROUND.DEEP&&ground!==GROUND.SHALLOW))return false;
    const corners=CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>{const g=this.groundAt(x+dx,y+dy);return n+(g===GROUND.DEEP||!WATERY.has(g)&&ground===GROUND.DEEP?.25:0);},0)),deep=ground===GROUND.DEEP;
    if(deep?corners.every(v=>v===1):corners.every(v=>v===0))return false;
    let best=null;for(let dy=-1;dy<=1&&!best;dy++)for(let dx=-1;dx<=1&&!best;dx++){const g=this.groundAt(x+dx,y+dy);if((dx||dy)&&g===(deep?GROUND.SHALLOW:GROUND.DEEP))best={x:x+dx,y:y+dy,g};}
    if(!best)return false;
    const overlay=this.shoreOverlay(this.groundKey(best.x,best.y,best.g,season),corners,!deep);if(overlay)context.drawImage(overlay,left,top);
    return true;
  }
  roundShore(context,x,y,ground,left,top,season){
    if(this.shoreStyle!=='round')return false;
    const corners=this.landCorners(x,y),watery=WATERY.has(ground);
    if(watery?corners.every(v=>v===0):corners.every(v=>v===1))return false;
    // The neighbour that supplies the other side: land of the highest rank for water tiles, the shallowest water for land.
    let best=null;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((!dx&&!dy)||nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;const g=this.groundAt(nx,ny);if(WATERY.has(g)===watery)continue;
      const score=watery?GROUND_RANK[g]:g===GROUND.SHALLOW?3:g===GROUND.FORD?2:1;if(!best||score>best.score)best={x:nx,y:ny,g,score};}
    if(!best)return false;
    const landRef=watery?this.groundKey(best.x,best.y,best.g,season):this.groundKey(x,y,ground,season),waterRef=watery?this.groundKey(x,y,ground,season):this.groundKey(best.x,best.y,best.g,season);
    const tile=this.transitionTile(SHORE_PAIRS[watery?best.g:ground],corners,season,landRef,waterRef);if(tile){context.drawImage(tile,left,top);return true;}
    const overlay=this.shoreOverlay(this.groundKey(best.x,best.y,best.g,season),corners,watery);if(overlay)context.drawImage(overlay,left,top);
    return true;
  }
  // World v2: grass zone wash (3×3 average), decals, reeds and ford stones. Deterministic per tile (hash).
  zoneTint(x,y){
    const zones=this.scene.grassZones;if(!zones)return null;let r=0,g=0,b=0,a=0,n=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const z=zones[y+dy]?.[x+dx];const own=zones[y][x];const t=ZONE_TINT[(this.groundAt(x+dx,y+dy)===GROUND.GRASS?z:own)??own]??ZONE_TINT[0];r+=t[0]*t[3];g+=t[1]*t[3];b+=t[2]*t[3];a+=t[3];n++;}
    return a>.001?`rgba(${Math.round(r/a)},${Math.round(g/a)},${Math.round(b/a)},${(a/n).toFixed(3)})`:null;
  }
  decalPoint(h,i,cx,cy){const u=((h>>>(i*5))&31)/31-.5,v=((h>>>(i*5+3))&31)/31-.5;return {x:cx+(u-v)*36,y:cy+(u+v)*18};}
  paintDecals(context,x,y,cx,cy,season,occupied){
    const zone=this.scene.grassZones?.[y]?.[x];if(zone==null||occupied?.has(`${x},${y}`)||this.wear?.isPaved?.({x,y})||(this.wear?.level({x,y})??0)>=2||this.scene.resourceOccupancy?.has(`${x},${y}`))return;
    let h=terrainHash(x*7+3,y*13+5);
    const list=season==='Autumn'?[...ZONE_DECALS[zone],['leaf',.35,[1,3]]]:ZONE_DECALS[zone];
    for(const [kind,chance,[lo,hi]]of list){
      h=Math.imul(h^0x9e3779b9,2654435761)>>>0;if((h%1000)/1000>=chance)continue;if(season==='Winter'&&kind!=='pebble')continue;
      const count=lo+h%(hi-lo+1);
      for(let i=0;i<count;i++){const p=this.decalPoint(Math.imul(h,i+7)>>>0,i%3,cx,cy),k=(h>>>(i*3))&7;context.beginPath();
        if(kind==='tuft'||kind==='dryTuft'){context.strokeStyle=kind==='tuft'?(season==='Autumn'?'rgba(110,98,40,.7)':'rgba(48,92,34,.65)'):'rgba(150,128,62,.7)';context.lineWidth=1;for(const d of [-2,0,2]){context.moveTo(p.x+d*.6,p.y);context.lineTo(p.x+d,p.y-3-(k&1));}context.stroke();}
        else if(kind==='flower'){context.fillStyle=['#f1ecd8','#f2d45c','#b88ad6','#e7a0b8'][k&3];context.arc(p.x,p.y-1,1.2,0,Math.PI*2);context.fill();}
        else if(kind==='pebble'){context.fillStyle=k&1?'rgba(150,148,138,.9)':'rgba(118,116,108,.9)';context.ellipse(p.x,p.y,1.8+(k&1),1.1,0,0,Math.PI*2);context.fill();}
        else if(kind==='leaf'){context.fillStyle=['rgba(168,98,38,.75)','rgba(190,140,52,.75)','rgba(120,78,40,.75)'][k%3];context.ellipse(p.x,p.y,1.6,.9,k,0,Math.PI*2);context.fill();}}
    }
  }
  paintReeds(context,x,y,cx,cy,season){
    if(!this.scene.reeds?.has(`${x},${y}`))return;const h=terrainHash(x*11+1,y*5+7),colour=season==='Winter'||season==='Autumn'?'rgba(176,150,88,.95)':'rgba(70,118,52,.95)';
    context.strokeStyle=colour;context.lineWidth=1.2;context.beginPath();
    for(let i=0;i<7;i++){const p=this.decalPoint(Math.imul(h,i+3)>>>0,i%3,cx,cy),height=6+((h>>>i)&7);context.moveTo(p.x,p.y);context.quadraticCurveTo(p.x+1,p.y-height/2,p.x+((h>>>(i+2))&1?2:-2),p.y-height);}
    context.stroke();
  }
  paintFordStones(context,x,y,cx,cy){
    const h=terrainHash(x*5+9,y*7+2);for(let i=0;i<3;i++){const p=this.decalPoint(Math.imul(h,i+5)>>>0,i,cx,cy),r=2.4+((h>>>(i*4))&3)*.7;
      context.fillStyle='rgba(92,92,86,.95)';context.beginPath();context.ellipse(p.x,p.y+.8,r+.6,r*.62+.4,0,0,Math.PI*2);context.fill();
      context.fillStyle='rgba(156,154,144,.95)';context.beginPath();context.ellipse(p.x,p.y,r,r*.6,0,0,Math.PI*2);context.fill();}
  }
  tileData(tile){return this.memory?.terrainAt(tile,this.map,this.wear,this.season)??[this.map[tile.y]?.[tile.x]??0,this.wear?.level(tile)??0,this.season,0,this.wear?.isPaved?.(tile)?1:0];}

  chunkTexture(cx, cy) {
    const key = `terrain-chunk-${cx}-${cy}`;
    const origin = gridToWorld(cx * CHUNK_SIZE, cy * CHUNK_SIZE);
    const left = origin.x - CHUNK_SIZE * 32;
    if (!this.scene.textures.exists(key)||this.dirtyChunks.has(`${cx},${cy}`)) {
      // Sto statických diamantů se jednou složí do jedné textury. Při posouvání
      // kamery se pak kreslí desítky bloků, ne tisíce samostatných obrázků.
      const texture = this.scene.textures.exists(key)?this.scene.textures.get(key):this.scene.textures.createCanvas(key, CHUNK_SIZE * 64, CHUNK_SIZE * 32);
      const context = texture.getContext();
      let dirty=this.dirtyTiles.get(`${cx},${cy}`);
      // V2 paths are one continuous image per chunk: a partial repaint near a path would leave antialiased tile edges
      // between old and new pixels, so a chunk with a dirty tile near a path is repainted whole (cached overlays, cheap).
      if(dirty&&this.pathStyle==='v2'&&this.v2?.geo&&[...dirty].some(i=>this.v2.near(i%COLUMNS,Math.floor(i/COLUMNS))))dirty=null;
      const continuous=this.groundStyle==='continuous';
      if(continuous)dirty=null;
      let groundStamp=null,staleGround=false;
      if(continuous){
        // A season change or a new building repaints the ground of one chunk per frame (about 50 ms each); the others
        // keep their old picture (and stay dirty) until their turn, so the change rolls over the view without a freeze.
        groundStamp=this.groundStampFor(cx,cy,this.groundLook(cx,cy).key);let cached=this.groundCache?.get(`${cx},${cy}`);
        // A season step prepared ahead (prepareSeasonStep) is taken over without painting.
        const prepared=this.preparedGround?.get(`${cx},${cy}`);
        if(prepared?.result&&prepared.stamp===groundStamp&&cached&&cached.stamp!==groundStamp){this.preparedGround.delete(`${cx},${cy}`);this.recycleGround(`${cx},${cy}`,cached.canvas);
          cached={...prepared.result};cached.rev=this.groundRev=(this.groundRev??0)+1;this.groundCache.set(`${cx},${cy}`,cached);this.paintStats.groundPrepared=(this.paintStats.groundPrepared??0)+1;}
        // performance-1: a change of the trodden paths alone (25 walking residents) repaints one chunk's ground (~40 ms
        // without GPU) at most every GROUND_PATH_GAP_MS; seasons and buildings keep the one-a-frame rule.
        let pathOnly=!!cached&&pathOnlyChange(cached.stamp,groundStamp);
        // performance-2: a path change elsewhere on a chain bumps this chunk's stamp too. When the paths give this chunk
        // the same picture as before (pathSignature), the ground is kept and only the stamp moves on: no repaint, no wait.
        if(pathOnly){const ck=`${cx},${cy}`,change=this.pathChange(ck,cx,cy,left,origin.y,groundStamp,cached);
          if(change.rect===null){
            // The season layers of a gradual change carry the same path state: their stamps move on with the chunk's.
            const cut=v=>v.slice(v.indexOf('|')),oldRest=cut(cached.stamp),newRest=cut(groundStamp),own=this.seasonLayers?.get(ck);
            if(own)for(const season of Object.keys(own))if(own[season].stamp===`${season}${oldRest}`){own[season].stamp=`${season}${newRest}`;own[season].sig=change.sig;}
            cached.stamp=groundStamp;cached.sig=change.sig;this.pathChanges.delete(`${cx},${cy}`);this.paintStats.groundSkips=(this.paintStats.groundSkips??0)+1;pathOnly=false;}
          else cached.pathOnlyFor=groundStamp;}
        const coarse=draftStale(cached?.canvas?.draft,this.viewZoom??1);
        const throttled=cached&&(cached.stamp!==groundStamp||coarse)&&(this.fogOnlyPass||!(this.groundPaintsLeft>0)||pathOnly&&performance.now()<(this.nextPathPaint??0)&&!this.groundJobActive(`${cx},${cy}`))&&this.chunks.has(`${cx},${cy}`);
        // Fog fix (owner, report 0.83): a chunk where ground is seen for the first time must show it at once. When its
        // ground is due for a repaint that has to wait (one a frame, path wear every GROUND_PATH_GAP_MS), the fog is
        // still redrawn now over the previous ground picture; the chunk stays dirty and its ground follows in its turn.
        // Before, the whole repaint waited, so newly seen land stayed black (and remembered land flat grey) for seconds.
        // Owner 9 Nov ("když odcházím dělá viditelné čtverce za dosahem"): land that left sight must turn remembered
        // promptly too, not wait for the ground's turn. Any chunk whose fog changed redraws its fog over the previous
        // ground; a chunk with nothing new for the fog keeps its picture until its ground repaint.
        const fogChanged=this.fogDirty?.has(`${cx},${cy}`);
        if(throttled&&!this.paintingUrgent&&!fogChanged)return { key, x: left, y: origin.y, painted:false };
        staleGround=!!throttled;
        if(pathOnly&&!staleGround)this.nextPathPaint=performance.now()+GROUND_PATH_GAP_MS;
      }
      // Continuous ground clears below, once its ground picture is ready (a paint spread over frames may leave here first).
      if(!dirty&&!continuous)context.clearRect(0,0,texture.width,texture.height);
      // Ground first for every tile, tracks second: a neighbour's ground overlap can then never cover a track's edge.
      const paths=[],occupied=this.buildingTiles();
      if(continuous){
        // The painted ground (land, water, plants) does not depend on the fog: it is cached per chunk and only redrawn
        // when the season or the buildings on the chunk change. Fog changes then cost one drawImage plus the overlays.
        const ck=`${cx},${cy}`,stamp=groundStamp;let cached=(this.groundCache??=new Map()).get(ck);
        if(!staleGround&&(!cached||cached.stamp!==stamp||draftStale(cached.canvas?.draft,this.viewZoom??1))){this.groundPaintsLeft--;const t0=performance.now();const next=this.groundPicture(ck,cx,cy,left,origin.y,texture,occupied,stamp,cached);this.paintStats.groundMs=(this.paintStats.groundMs??0)+performance.now()-t0;
          if(next){cached=next;cached.rev=this.groundRev=(this.groundRev??0)+1;this.groundCache.set(ck,cached);}
          // The paint goes on next frame: a shown chunk with nothing new for the fog keeps its picture untouched.
          else if(this.chunks.has(ck)&&!this.fogDirty?.has(ck)&&!this.paintingUrgent)return { key, x: left, y: origin.y, painted:false };
          else staleGround=true;}
        context.clearRect(0,0,texture.width,texture.height);context.drawImage(cached.canvas,0,0);
        // Remembered ground (explored, not in sight): greyed and darkened, fading in smoothly (applyMemory).
        this.applyMemory(context,cx,cy,left,origin.y,cached);
        // Plants near the chunk edge reach into neighbour tiles: black them out where that neighbour is unexplored.
        context.fillStyle='#000';
        for(let ty=cy*CHUNK_SIZE-1;ty<=(cy+1)*CHUNK_SIZE;ty++)for(let tx=cx*CHUNK_SIZE-1;tx<=(cx+1)*CHUNK_SIZE;tx++){
          if(tx>=cx*CHUNK_SIZE&&ty>=cy*CHUNK_SIZE&&tx<(cx+1)*CHUNK_SIZE&&ty<(cy+1)*CHUNK_SIZE)continue;
          const inside=tx>=0&&ty>=0&&tx<COLUMNS&&ty<ROWS;if(inside&&(this.fog?.displayState({x:tx,y:ty})??VISIBILITY.VISIBLE)!==VISIBILITY.UNEXPLORED)continue;
          const p=tileCenter({x:tx,y:ty}),px=p.x-left,py=p.y-origin.y;context.beginPath();context.moveTo(px-33,py);context.lineTo(px,py-16.5);context.lineTo(px+33,py);context.lineTo(px,py+16.5);context.closePath();context.fill();
        }
      }
      const remembered={};
      for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE; y++) {
        for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE; x++) {
          if(dirty&&!dirty.has(y*COLUMNS+x))continue;
          this.paintStats.tiles++;
          const point = tileCenter({ x, y });
          const tile={x,y},state=this.fog?.displayState(tile)??VISIBILITY.VISIBLE,[,level,season]=this.tileData(tile);
          const polygon=(e=0)=>{context.beginPath();context.moveTo(point.x-left-32-e,point.y-origin.y);context.lineTo(point.x-left,point.y-origin.y-16-e/2);context.lineTo(point.x-left+32+e,point.y-origin.y);context.lineTo(point.x-left,point.y-origin.y+16+e/2);context.closePath();};
          // The clip reaches a little past the diamond so antialiased edges of neighbours overlap
          // instead of leaving a light seam; ground tiles carry a pixel of bleed for this.
          // Clear only the tile's own diamond, then draw with the reach, so a repainted tile never erases its neighbour's edge.
          // A whole-chunk paint starts from a cleared canvas; clearing each diamond again would leave its antialiased rim
          // half transparent where the previous neighbour had already painted, which shows as a light grid.
          if(dirty){context.save();polygon();context.clip();context.clearRect(point.x-left-33,point.y-origin.y-17,66,34);context.restore();}
          context.save();polygon(TILE_BLEED);context.clip();
          if(state===VISIBILITY.UNEXPLORED){context.fillStyle='#000';polygon(TILE_BLEED);context.fill();context.restore();continue;}
          if(continuous){
            // Remembered (explored, not visible) ground: the same desaturation and darkening as the tiles get by filter.
            if(state===VISIBILITY.EXPLORED){const v=Math.round(255*(this.fog?.brightness(tile)??FOG_STYLE.brightness));(remembered[v]??=[]).push(1);context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;}
            if(this.wear)paths.push({x,y,polygon,filter:context.filter,veil:season==='Winter'?.45:0});
            context.restore();continue;
          }
          const ground=this.groundAt(x,y),groundKeys=ground?this.groundKinds[ground]:null;
          if(groundKeys?.length){
            if(state===VISIBILITY.EXPLORED)context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;
            const key=groundKeys[terrainHash(x,y)%groundKeys.length],frame=this.scene.textures.get(key).get();
            context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);
            this.blendEdges(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            this.roundDeep(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            // The shore first: an approved transition tile is opaque, the bank's grass then rounds off over it.
            this.roundShore(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            this.roundBank(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            const winter=GROUND_WINTER[ground],mix=state===VISIBILITY.VISIBLE?this.seasonMix?.(x,y,season):null,amount=season==='Winter'?(mix?mix.amount:1):mix?.from==='Winter'?1-mix.amount:0;
            if(winter&&amount>0){context.globalCompositeOperation='source-atop';context.globalAlpha=amount;context.fillStyle=winter;polygon(TILE_BLEED);context.fill();context.globalAlpha=1;}
            context.globalCompositeOperation='source-over';
            if(ground===GROUND.FORD)this.paintFordStones(context,x,y,point.x-left,point.y-origin.y);
            else if(ground===GROUND.SHALLOW)this.paintReeds(context,x,y,point.x-left,point.y-origin.y,season);
            if(this.wear)paths.push({x,y,polygon,filter:context.filter,veil:season==='Winter'?.45:0});
            context.restore();continue;
          }
          const wear=this.wear?this.wearTextures[0]:null,entry=wear?(wear.variants.length?{key:wear.variants[terrainHash(x,y)%wear.variants.length]}:wear):this.groundTextures[terrainHash(x,y)%this.groundTextures.length];
          if(state===VISIBILITY.EXPLORED)context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;
          const draw=key=>{const frame=this.scene.textures.get(key).get(key===entry.key?entry.frame:undefined);context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);};
          const mix=state===VISIBILITY.VISIBLE?this.seasonMix?.(x,y,season):null;
          // Untouched grass shows the season's own tiles; during a transition the new season fades in over the old one.
          const zoned=!!this.zoneRef(x,y,season),seasonal=season=>zoned?this.zoneRef(x,y,season):season==='Summer'?entry.key:this.seasonGrass[season]?.[terrainHash(x,y)%this.seasonGrass[season].length],grassSeason=(zoned||wear)&&seasonal(season)&&(!mix||seasonal(mix.from));
          const drawRef=ref=>{const frame=ref?.includes('#')?this.frameOf(ref):null;if(frame)this.drawFrame(context,frame,point.x-left-32,point.y-origin.y-16);else draw(ref);};
          if(grassSeason&&mix){drawRef(seasonal(mix.from));context.globalAlpha=mix.amount;drawRef(seasonal(season));context.globalAlpha=1;}
          else drawRef(grassSeason?seasonal(season):entry.key);
          if(zoned)this.blendZones(context,x,y,point.x-left-32,point.y-origin.y-16,season);
          if(this.wear)paths.push({x,y,polygon,filter:context.filter,veil:mix?(mix.from==='Winter'?1-mix.amount:0)*.45+(season==='Winter'?mix.amount:0)*.45:season==='Winter'?.45:0});
          const tint=(mix&&mixTint(mix.from,season,mix.amount))??{Spring:'rgba(150,215,100,.16)',Summer:'rgba(196,188,80,.13)',Autumn:'rgba(205,128,48,.28)',Winter:'rgba(232,237,220,.83)'}[season];
          if(tint&&!grassSeason){context.globalCompositeOperation='source-atop';context.fillStyle=tint;polygon(TILE_BLEED);context.fill();}
          const zoneTint=season==='Winter'||zoned?null:this.zoneTint(x,y);if(zoneTint){context.globalCompositeOperation='source-atop';context.fillStyle=zoneTint;polygon(TILE_BLEED);context.fill();}
          context.globalCompositeOperation='source-over';
          const shore=this.roundShore(context,x,y,GROUND.GRASS,point.x-left-32,point.y-origin.y-16,season),bank=this.roundBank(context,x,y,GROUND.GRASS,point.x-left-32,point.y-origin.y-16,season);
          if(!bank&&!shore)this.paintDecals(context,x,y,point.x-left,point.y-origin.y,season,occupied);
          context.restore();
        }
      }
      // Continuous ground: paths are part of the cached ground (pathSurface), no tile overlays.
      // Owner 9 Nov ("proč tam jsou zase kolečka jako z prvních verzí?"): on continuous ground the paths are painted in
      // the ground itself (pathSurface). Since 0.77 this chain fell through to the old N12 tile overlay (a circle per
      // worn tile, straight links, flat fills), drawn on top of the V3 paths: that was the circles and lines.
      if(continuous){/* paths are part of the cached ground; `paths` is still used for pavement below */}
      else if(this.pathStyle==='v2'&&this.v2)this.v2.drawChunk(context,cx,cy,left,origin.y,paths);
      else for(const p of paths){context.save();p.polygon(TILE_BLEED);context.clip();context.filter=p.filter;this.drawPaths(context,p.x,p.y,left,origin.y,p.veil,()=>{p.polygon();context.clip();});context.restore();}
      // S11 Stone Pavement on top of ground and tracks; under Fog of War only the remembered surface is drawn.
      for(const p of paths){const paved=tile=>this.tileData(tile)[4]===1;if(!paved(p))continue;const c=tileCenter(p);context.save();context.filter=p.filter;
        drawCobbles(context,c.x-left,c.y-origin.y,{tileX:p.x,tileY:p.y,winter:p.veil>.3,edges:{N:!paved({x:p.x-1,y:p.y}),E:!paved({x:p.x,y:p.y-1}),S:!paved({x:p.x+1,y:p.y}),W:!paved({x:p.x,y:p.y+1})}});context.restore();}
      texture.refresh();
      this.paintStats.chunks++;
      this.fogDirty?.delete(`${cx},${cy}`);
      // A fog-only repaint over a stale ground picture keeps the chunk dirty: its ground repaints in its turn.
      if(!staleGround){this.dirtyChunks.delete(`${cx},${cy}`);this.dirtyTiles.delete(`${cx},${cy}`);}
      return { key, x: left, y: origin.y, painted:true };
    }
    return { key, x: left, y: origin.y, painted:false };
  }

  createTextures() {
    this.groundTextures=[];
    const palette=[];
    for(const id of ['grass','dirt']){
      const definition=this.registry.require(id);
      if(this.assets?.usesSprite(definition))this.groundTextures.push({key:this.assets.textureKey(id),frame:definition.spritesheet?definition.visual?.previewFrame??0:undefined});
      else for(const color of definition.visual?.colors??[0xaaa375]){
        const key=`terrain-${palette.length}`;palette.push(color);this.groundTextures.push({key});
      }
    }
    for (let i = 0; i < palette.length; i++) {
      if (this.scene.textures.exists(`terrain-${i}`)) continue;
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(palette[i]);
      g.fillPoints([{ x: 32, y: 0 }, { x: 64, y: 16 }, { x: 32, y: 32 }, { x: 0, y: 16 }], true);
      g.lineStyle(1, 0x5c583b, 0.15);
      g.strokePoints([{ x: 32, y: 0 }, { x: 64, y: 16 }, { x: 32, y: 32 }, { x: 0, y: 16 }], true);
      for (let j = 0; j < 9; j++) {
        const x = 16 + (i * 13 + j * 7) % 32, y = 10 + (i * 7 + j * 3) % 12;
        g.lineStyle(1, j % 2 ? 0xd1bd86 : 0x747843, 0.45);
        g.lineBetween(x, y, x + 2, y - 2);
      }
      g.generateTexture(`terrain-${i}`, 64, 32); g.destroy();
    }
    if (!this.scene.textures.exists('terrain-wall')) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      const poly = (color, points) => { g.fillStyle(color); g.fillPoints(points.map(([x,y])=>({x,y})),true); };
      g.fillStyle(0x302d20, 0.3); g.fillEllipse(33, 47, 52, 17);
      poly(0x8a8878, [[7,39],[18,18],[34,15],[34,50],[19,51]]);
      poly(0x666a60, [[34,15],[48,20],[58,40],[45,50],[34,50]]);
      poly(0xb2ae98, [[7,39],[18,18],[34,15],[48,20],[58,40],[34,35]]);
      g.lineStyle(1,0x606454,0.7); g.lineBetween(22,22,25,37);g.lineBetween(42,22,38,34);
      g.generateTexture('terrain-wall',64,64);g.destroy();
    }
  }

  // Remembered rocks use the same muted memory copy as other remembered objects; visible rocks the original art.
  paintWall(wall,state,fog){
    // Plan g-nasadit-prirodu: the approved rock obstacle looks per tile and season; the old outcrop art until the
    // atlas is in.
    const look=wall.tileX==null?null:outcropLook(wall.tileX,wall.tileY,this.tileSeason(wall.tileX,wall.tileY));
    if(look&&this.natureArtReady()&&showNature(this.scene,wall,look,{remembered:state===VISIBILITY.EXPLORED,brightness:fog?.memoryBrightness})){wall.natureArt=true;return;}
    if(wall.natureArt){wall.natureArt=false;wall.setOrigin(this.outcrop.origin?.x??0.5,this.outcrop.origin?.y??1);}
    let key=this.wallTexture;
    if(state===VISIBILITY.EXPLORED){const texture=this.scene.textures.get(this.wallTexture);key=memoryTexture(this.scene,texture,texture.get(),fog.memoryBrightness)??key;}
    if(wall.texture.key!==key)wall.setTexture(key);
  }
  natureArtReady(){return natureReady(this.scene,()=>{this.lastView='';});}
  // velke-prirodni-objekty: thickets and rock groups in view, each drawn as one approved sprite placed on its footprint
  // centre (the Studio anchor) and sorted by its front tile. A group is drawn only while every tile is known and its
  // parts show (a bush under a building or a worn path does not), else its parts are drawn one by one as before.
  // Returns tile key → group for the tiles it covers.
  paintNatureGroups(minX,maxX,minY,maxY,fog){
    const covered=new Map(),shown=new Set(),groups=this.scene.natureGroups;
    if(groups?.length&&this.natureArtReady()){
      pruneNatureGroups(this.scene);let occupied=null;
      for(const g of groups){
        if(g.x+g.w-1<minX||g.x>maxX||g.y+g.h-1<minY||g.y>maxY)continue;
        const tiles=groupTiles(g);let ok=true;
        for(const t of tiles){
          const state=fog?.displayState(t)??VISIBILITY.VISIBLE;
          if(state===VISIBILITY.UNEXPLORED||fog?.enabled&&!fog.isInSightTile(t)&&!fog.explored[t.y*fog.width+t.x]){ok=false;break;}
          if(g.kind==='rocks'?!this.tileData(t)[0]:!this.bushVisible(t.x,t.y,occupied??=this.buildingTiles())){ok=false;break;}
        }
        if(!ok)continue;
        const key=groupKey(g),sprite=this.groupSprites.get(key)??this.groupPool.pop()??this.scene.add.image(0,0,'__WHITE');
        if(!this.paintGroup(sprite,g,fog)){sprite.setVisible(false);this.groupPool.push(sprite);this.groupSprites.delete(key);continue;}
        const centre=gridToWorldLifted(g.x+g.w/2,g.y+g.h/2),front=tileCenterLifted(groupFront(g));
        const offset=g.kind==='rocks'?this.outcrop.depth?.offset??0:this.registry.get?.('bush_meadow')?.depth?.offset??0;
        sprite.setPosition(centre.x,centre.y).setDepth(front.y+offset).setVisible(true);sprite.natureGroup=g;
        this.groupSprites.set(key,sprite);shown.add(key);for(const t of tiles)covered.set(`${t.x},${t.y}`,g);
      }
    }
    for(const [key,sprite]of this.groupSprites)if(!shown.has(key)){sprite.setVisible(false);this.groupPool.push(sprite);this.groupSprites.delete(key);}
    this.groupCover=covered;return covered;
  }
  // The look for the season; the remembered (darker) look while no tile of the group is in sight.
  paintGroup(sprite,g,fog){
    const tiles=groupTiles(g),visible=!fog||tiles.some(t=>fog.displayState(t)===VISIBILITY.VISIBLE);
    const gs=this.tileSeason(Math.floor(g.x+g.w/2),Math.floor(g.y+g.h/2)),look=g.kind==='rocks'?rockGroupLook(g,gs):thicketLook(g,tiles.map(t=>BUSH_TYPES[this.scene.bushes?.get(`${t.x},${t.y}`)]),gs);
    return !!look&&showNature(this.scene,sprite,look,{remembered:!visible,brightness:fog?.memoryBrightness});
  }
  updateFog(camera,fog) {
    const mode=`${fog?.enabled}:${fog?.explorationEnabled}`;
    if(mode!==this.fogMode){
      this.originalBackground??=camera.backgroundColor?.rgba??'#3a3c2b';
      // Diamond edges are antialiased. Their transparent seams must reveal
      // black, never the normal olive scene background in undiscovered areas.
      camera.setBackgroundColor?.(fog?.enabled?'#000':this.originalBackground);
      this.fogMode=mode;this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';
    }else if(fog&&this.fogBrightness!==undefined&&this.fogBrightness!==fog.memoryBrightness){
      // The slider lives in Settings, which pause the game loop: repaint the shown chunks now, the rest when they scroll in.
      this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';
    }
    this.fogBrightness=fog?.memoryBrightness;
    if(fog&&this.fogRevision!==fog.revision){
      const previous=this.paintedVisibility??new Set(),current=fog.visibleIndices;
      // Consumers may skip revisions (Save, several source updates, a paused
      // frame). Compare against what this renderer actually painted, rather
      // than the last producer delta, which may already have been overwritten.
      const changed=[...previous].filter(index=>!current.has(index)),firstSeen=[];
      // performance-1: a chunk where ground is seen for the first time is repainted at once (never a black hole in
      // sight); other fog changes take their turn in repaintDirty.
      const known=this.knownTiles?.length===fog.explored?.length?this.knownTiles:this.knownTiles=Uint8Array.from(fog.explored??[]);
      for(const index of current)if(!previous.has(index)){changed.push(index);if(!known[index]){known[index]=1;firstSeen.push(index);const urgent=this.urgentChunks??=new Set(),x=index%fog.width,y=Math.floor(index/fog.width);
        // The tile's chunk and the chunks whose edge ring (plants reaching over the edge) covers it.
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<fog.width&&ny<fog.height)urgent.add(`${Math.floor(nx/CHUNK_SIZE)},${Math.floor(ny/CHUNK_SIZE)}`);}}}
      this.paintedVisibility=new Set(current);this.fogRevision=fog.revision;
      if(fog.enabled){
        const tileAt=index=>({x:index%fog.width,y:Math.floor(index/fog.width)});
        // Owner 9 Nov ("když odcházím dělá viditelné čtverce za dosahem"): continuous ground. Land entering or leaving
        // sight that was seen before only changes between full colour and the remembered grey of its own tiles, so
        // those tiles are patched in the chunk picture this frame from the cached ground (fogPatch, a fraction of a
        // millisecond), instead of the chunk waiting its turn for a full repaint (seconds with many residents moving).
        // Land seen for the first time, and tiles beside unknown land or pavement, still repaint the chunk.
        let repaint=changed;
        if(this.groundStyle==='continuous'){
          const first=new Set(firstSeen),patch=this.fogPatch??=new Map();repaint=[];
          // The smooth memory shading (shadeMemory) reaches 2 tiles: a changed tile repaints its 5 × 5 neighbourhood.
          // Tiles beside unknown land or pavement cannot be patched: a changed one repaints its chunk, a neighbour one only
          // reached by the shading keeps its picture until its chunk's next repaint (the black edge's own fade covers it).
          const reach=new Set(),changedSet=new Set(changed);
          for(const index of changed){if(first.has(index)){repaint.push(index);continue;}const t=tileAt(index);
            for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=t.x+dx,y=t.y+dy;if(x>=0&&y>=0&&x<fog.width&&y<fog.height)reach.add(y*fog.width+x);}}
          for(const index of reach){
            const t=tileAt(index);if(!fog.explored[index])continue;
            if(!this.patchableTile(t,fog)){if(changedSet.has(index)&&!first.has(index))repaint.push(index);continue;}
            // Its own chunk and the neighbour chunks whose canvas edge (bleed) covers it.
            const lx=t.x%CHUNK_SIZE,ly=t.y%CHUNK_SIZE,xs=lx===0?[-1,0]:lx===CHUNK_SIZE-1?[0,1]:[0],ys=ly===0?[-1,0]:ly===CHUNK_SIZE-1?[0,1]:[0];
            for(const dy of ys)for(const dx of xs){const key=`${Math.floor((t.x+dx)/CHUNK_SIZE)},${Math.floor((t.y+dy)/CHUNK_SIZE)}`;if(!patch.has(key))patch.set(key,new Set());patch.get(key).add(index);}
          }
        }
        if(repaint.length)this.invalidateArea(repaint.map(tileAt),this.groundStyle==='continuous');
        // Chunks whose fog picture changed (own tiles or their edge ring), for the fog-over-stale-ground repaint.
        const fogDirty=this.fogDirty??=new Set();
        for(const index of repaint){const x=index%fog.width,y=Math.floor(index/fog.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<fog.width&&ny<fog.height)fogDirty.add(`${Math.floor(nx/CHUNK_SIZE)},${Math.floor(ny/CHUNK_SIZE)}`);}}
      }
    }
  }

  // A tile whose fog change can be patched: no pavement around (cobbles are drawn over the cached ground). The black of
  // unknown land is kept by the patch itself (shadeMemory leaves pure black pixels).
  patchableTile(t,fog){
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=t.x+dx,y=t.y+dy;if(x<0||y<0||x>=fog.width||y>=fog.height)continue;
      if(this.tileData({x,y})?.[4]===1)return false;}
    return true;
  }
  // Applies the queued fog patches: the patched tiles' pixels are shaded again from the cached ground with the current
  // memory field (shadeMemory, the same rule as a full chunk paint). A chunk that also needs a full repaint is left to it.
  applyFogPatches(){
    const patches=this.fogPatch;if(!patches?.size)return;const fog=this.fog;
    // performance-2 (30 residents: the patches took 6–30 ms a frame): patches are collected and applied every
    // FOG_PATCH_EVERY_MS, at most FOG_PATCH_BUDGET_MS a frame (the rest follows next frame, oldest first). Chunks outside
    // the view keep their patch waiting until they scroll in. A chunk's tiles are patched per quarter (5 × 5 tiles), so two
    // residents at opposite corners no longer shade the whole chunk.
    // At game speed 2 and 3 sight moves that much faster: the patches then come every 300 ms.
    const now=performance.now();if(now<(this.nextFogPatch??0))return;this.nextFogPatch=now+FOG_PATCH_EVERY_MS*Math.max(1,Math.min(2,this.scene.gameTime?.speed??1));
    const needed=this.neededChunks,deadline=now+FOG_PATCH_BUDGET_MS,half=Math.ceil(CHUNK_SIZE/2);
    for(const [key,indices] of patches){
      if(needed instanceof Set&&!needed.has(key))continue;
      if(performance.now()>deadline){this.nextFogPatch=0;break;}
      patches.delete(key);
      const [cx,cy]=key.split(',').map(Number),cached=this.groundCache?.get(key),tex=`terrain-chunk-${cx}-${cy}`;
      if(cx<0||cy<0||cx*CHUNK_SIZE>=COLUMNS||cy*CHUNK_SIZE>=ROWS||this.fogDirty?.has(key))continue;
      if(!cached||!this.scene.textures.exists(tex)||!fog){this.dirtyChunks.add(key);continue;}
      const texture=this.scene.textures.get(tex),context=texture.getContext(),W=context.canvas.width,H=context.canvas.height;
      const origin=gridToWorld(cx*CHUNK_SIZE,cy*CHUNK_SIZE),left=origin.x-CHUNK_SIZE*32,top=origin.y;
      const x0=cx*CHUNK_SIZE,y0=cy*CHUNK_SIZE,groups=new Map();
      for(const index of indices){const tx=index%fog.width,ty=Math.floor(index/fog.width),q=(Math.max(0,Math.min(CHUNK_SIZE-1,ty-y0))>=half?2:0)+(Math.max(0,Math.min(CHUNK_SIZE-1,tx-x0))>=half?1:0);
        let g=groups.get(q);if(!g)groups.set(q,g=[]);g.push({x:tx,y:ty});}
      const field=this.memoryField(cx,cy);let paved=false;const rects=[];
      for(const tiles of groups.values()){
      // The canvas rectangle around the patched tiles. Every pixel in it is shaded again from the cached ground, then the
      // black of unknown tiles in it is drawn again exactly as a full paint does (shading is linear, so the order does not
      // change the result). Pavement (cobbles drawn over the ground) in the rectangle: the chunk repaints instead.
      let bx0=W,by0=H,bx1=0,by1=0;
      for(const t of tiles){const p=tileCenter(t),px=p.x-left,py=p.y-top;
        bx0=Math.min(bx0,px-33);bx1=Math.max(bx1,px+33);by0=Math.min(by0,py-17);by1=Math.max(by1,py+17);}
      bx0=Math.max(0,Math.floor(bx0));by0=Math.max(0,Math.floor(by0));bx1=Math.min(W,Math.ceil(bx1));by1=Math.min(H,Math.ceil(by1));const bw=bx1-bx0,bh=by1-by0;if(bw<=0||bh<=0)continue;
      const inRect=t=>{const p=tileCenter(t),px=p.x-left,py=p.y-top;return px+34>bx0&&px-34<bx1&&py+18>by0&&py-18<by1;};
      const unknownTiles=[];
      for(let ty=y0-1;ty<=y0+CHUNK_SIZE&&!paved;ty++)for(let tx=x0-1;tx<=x0+CHUNK_SIZE;tx++){const t={x:tx,y:ty};if(!inRect(t))continue;
        const inside=tx>=0&&ty>=0&&tx<COLUMNS&&ty<ROWS,own=tx>=x0&&ty>=y0&&tx<x0+CHUNK_SIZE&&ty<y0+CHUNK_SIZE;
        if(own&&this.tileData(t)?.[4]===1){paved=true;break;}
        if(!inside||fog.displayState(t)===VISIBILITY.UNEXPLORED)unknownTiles.push({t,own});}
      if(paved)break;
      rects.push({bx0,by0,bw,bh,unknownTiles});}
      if(paved){(this.fogDirty??=new Set()).add(key);this.dirtyChunks.add(key);continue;}
      for(const {bx0,by0,bw,bh,unknownTiles} of rects){
      context.save();context.beginPath();context.rect(bx0,by0,bw,bh);context.clip();context.globalCompositeOperation='copy';context.drawImage(cached.canvas,bx0,by0,bw,bh,bx0,by0,bw,bh);context.restore();
      this.applyMemory(context,cx,cy,left,top,cached,{region:{x:bx0,y:by0,w:bw,h:bh},field});
      if(unknownTiles.length){context.save();context.beginPath();context.rect(bx0,by0,bw,bh);context.clip();context.fillStyle='#000';
        for(const {t,own} of unknownTiles){const p=tileCenter(t),px=p.x-left,py=p.y-top;context.beginPath();
          if(own){const diamond=()=>{context.beginPath();context.moveTo(px-32-TILE_BLEED,py);context.lineTo(px,py-16-TILE_BLEED/2);context.lineTo(px+32+TILE_BLEED,py);context.lineTo(px,py+16+TILE_BLEED/2);context.closePath();};
            context.save();diamond();context.clip();diamond();context.fill();context.restore();continue;}
          context.moveTo(px-33,py);context.lineTo(px,py-16.5);context.lineTo(px+33,py);context.lineTo(px,py+16.5);context.closePath();context.fill();}
        context.restore();}}
      texture.refresh();const liftedPatch=this.liftChunk(key,rects);
      // Lifted, a patched rectangle lies up to the chunk's highest ground higher (and reaches a tile further each way).
      const shape=liftedPatch?this.liftShapes.get(key):null;
      this.composite?.touch(key,rects.map(r=>shape?{x:left+r.bx0-34,y:top+r.by0-Math.ceil(shape.top)-18,width:r.bw+68,height:r.bh+Math.ceil(shape.top-shape.low)+36}:{x:left+r.bx0,y:top+r.by0,width:r.bw,height:r.bh}));this.paintStats.patches=(this.paintStats.patches??0)+indices.size;
    }
  }
  // Performance: a newly visible chunk is painted at once (never a hole); already shown chunks that became dirty
  // (fog, path wear, pavement, season) repaint at most two per frame, so a wave of changes never freezes a frame.
  repaintDirty(){
    if(!this.repaintAll)this.prepareSeasonWork();
    this.groundPaintsLeft=this.repaintAll&&!this.chunks.size?Infinity:1;let budget=this.repaintAll?Infinity:2;const all=this.repaintAll,urgent=this.urgentChunks;this.repaintAll=false;
    // performance-1: shown dirty chunks (mostly Fog of War edges moving with 25 residents) take turns, least recently
    // painted first: REPAINT_PER_FRAME (continuous ground) or two a frame. Before, the first eight in view order took
    // every frame (a chunk with its fog costs ~5–12 ms in a browser without GPU). First-seen ground goes at once.
    const waiting=[],paint=(key,urgentPaint=false)=>{
      const [cx,cy] = key.split(',').map(Number);this.paintingUrgent=urgentPaint;let texture;try{texture=this.chunkTexture(cx,cy);}finally{this.paintingUrgent=false;}
      const image = this.chunks.get(key)??this.chunkPool.pop() ?? this.scene.add.image(0,0,texture.key).setOrigin(0,0).setDepth(-100);
      // The picture shown is the lifted one (liftChunk); a level chunk shows its flat picture.
      const liftName=`terrain-lift-${cx}-${cy}`,lifted=texture.painted!==false||!this.scene.textures.exists(liftName)?this.liftChunk(key):liftName;
      image.setTexture(lifted??texture.key).setPosition(texture.x,texture.y-(lifted?LIFT_PAD:0)).setVisible(true);
      const shape=lifted?this.liftShapes?.get(key):null;image.tight=shape?{x:texture.x,y:Math.floor(texture.y-shape.top)-2,width:image.frame.cutWidth,height:Math.ceil(image.frame.cutHeight-LIFT_PAD+shape.top-shape.low)+4}:null;
      this.chunks.set(key,image);const done=!this.dirtyChunks.has(key);if(done||texture.painted)this.composite?.touch(key);return done||!!texture.painted;
    };
    const first=[];
    for (const key of this.neededChunks??[]) {
      const shown=this.chunks.has(key);if(shown&&!this.dirtyChunks.has(key))continue;if(!shown){first.push(key);continue;}if(urgent?.has(key)){paint(key,true);continue;}waiting.push(key);
    }
    // performance-3: ground seen for the first time shares FIRST_PAINT_MS a frame (always at least one chunk), nearest the
    // screen centre first; the rest follows in the next frames. The very first frame of a game paints everything.
    if(first.length){const view=(this.camera??this.scene.cameras?.main)?.worldView,mx=view?view.x+view.width/2:0,my=view?view.y+view.height/2:0;
      const far=key=>{const [cx,cy]=key.split(',').map(Number),o=gridToWorld(cx*CHUNK_SIZE+CHUNK_SIZE/2,cy*CHUNK_SIZE+CHUNK_SIZE/2);return (o.x-mx)**2+((o.y-my)*2)**2;};
      if(!all&&first.length>1){const d=new Map(first.map(k=>[k,far(k)]));first.sort((a,b)=>d.get(a)-d.get(b));}
      const deadline=typeof performance!=='undefined'&&!all&&this.firstPaintBudget!==false?performance.now()+FIRST_PAINT_MS:Infinity;
      for(let i=0;i<first.length;i++){if(i&&performance.now()>deadline){this.paintStats.firstWaits=(this.paintStats.firstWaits??0)+first.length-i;break;}paint(first[i],true);}}
    urgent?.clear();
    this.applyFogPatches();
    // Land beside unknown ground or pavement (not patchable) redraws its fog over the previous ground picture, two
    // chunks a frame ahead of the ground queue (0.2–4 ms each).
    if(!all&&this.groundStyle==='continuous'&&this.fogDirty?.size){let fogPaints=2;
      for(let i=0;i<waiting.length&&fogPaints>0;i++){const key=waiting[i];if(!this.fogDirty.has(key)||!this.groundCache?.has(key))continue;
        this.fogOnlyPass=true;try{paint(key,true);}finally{this.fogOnlyPass=false;}fogPaints--;if(!this.dirtyChunks.has(key)){waiting.splice(i,1);i--;}}}
    if(!all&&this.groundStyle==='continuous')budget=performance.now()<(this.nextFogPaint??0)?0:REPAINT_PER_FRAME;
    // A chunk repainted in the last REPAINT_GAP_MS waits (its fog edge catches up a moment later), so the cost stays
    // bounded per second however high the frame rate or however many residents walk at the edge of sight.
    const order=this.paintOrder??=new Map(),painted=this.paintedAt??=new Map(),started=all?0:performance.now();// Point 47: a chunk whose ground is half painted goes first. Taking turns over a full screen started a new band job on every chunk, and with only eight jobs kept the older ones were thrown away before they finished.
    if(!all){const active=this.groundJobs?.size?new Set([...this.groundJobs.keys()].map(k=>k.slice(0,k.indexOf('|')))):null;waiting.sort((a,b)=>(active?(active.has(b)?1:0)-(active.has(a)?1:0):0)||(order.get(a)??0)-(order.get(b)??0));}
    // m-obdobi-svy-zeme (point 47, owner 14 Nov 2026): one ground band every 50 ms let a season step take 40 s over a
    // full screen, so neighbouring chunks stood in different steps for long (hard squares), and at fast speed the next
    // step came before the last one finished. With many chunks waiting the pass now works for BACKLOG_SLICE_MS and
    // comes back sooner; with a few (Fog of War edges, paths) nothing changes.
    const backlog=!all&&waiting.length>BACKLOG_CHUNKS;
    for(let i=0;i<waiting.length;i++){const key=waiting[i];if(budget<=0)break;if(!all&&!backlog&&!this.groundJobActive(key)&&started-(painted.get(key)??-Infinity)<REPAINT_GAP_MS)continue;
      // A band of a half painted chunk shows nothing yet: with a backlog the same chunk gets further bands in this slice.
      if(!paint(key)){if(backlog&&this.groundJobActive(key)&&performance.now()-started<BACKLOG_SLICE_MS){this.groundPaintsLeft=1;i--;}continue;}budget--;order.set(key,this.paintTick=(this.paintTick??0)+1);if(all)painted.delete(key);else{painted.set(key,started);this.nextFogPaint=started+(backlog?BACKLOG_EVERY_MS:REPAINT_EVERY_MS);
      if(backlog&&performance.now()-started<BACKLOG_SLICE_MS){budget=1;this.groundPaintsLeft=1;}}}
    this.composite?.sync(this.camera??this.scene.cameras?.main);
  }
  update(camera,fog=null,memory=this.memory) {
    this.fog=fog;this.memory=memory;this.camera=camera;
    // performance-3: the zoom the view is at or heading to (the smaller one): drafts for far views, full ground when near.
    {const zoom=Math.min(camera.zoom??1,this.scene.worldCamera?.zoomTarget??camera.zoom??1);if(zoom!==this.viewZoom){this.viewZoom=zoom;if(this.groundCache)for(const [key,cached] of this.groundCache)if(draftStale(cached.canvas?.draft,zoom))this.dirtyChunks.add(key);}}
    this.updateFog(camera,fog);
    if(this.wear&&this.pathStyle==='v2'){this.v2?.frame();this.v2?.refresh();}
    const view = camera.worldView;
    const cacheKey = [Math.floor(view.x / 16), Math.floor(view.y / 16), Math.ceil(view.width), Math.ceil(view.height),fog?`${fog.enabled}:${fog.explorationEnabled}`:'',this.debugEnabled?this.wear?.levelRevision??0:0,this.debugEnabled?this.wear?.revision:0,this.debugEnabled,this.scene.bushes?.size?`${this.scene.buildings?.length}:${this.scene.naturalResources?.topologyRevision}:${this.scene.resourceOccupancy?.size}:${this.wear?.levelRevision}`:''].join(',');
    // Performance: path wear repaints only its own tiles (invalidateArea), so it no longer re-walks every visible tile.
    // Sight moving by a step only re-tints the rock outcrops whose visibility changed; the full walk over every visible
    // tile runs when the camera moves, the Fog mode changes, or a newly seen rock has no sprite yet.
    if (cacheKey === this.lastView && fog && this.outcropFogRevision!==fog.revision) {
      const fresh=this.outcropFogRevision===fog.revision-1;this.outcropFogRevision=fog.revision;
      if(fresh)for(const index of [...fog.added,...fog.removed]){const x=index%fog.width,y=Math.floor(index/fog.width),key=`${x},${y}`;
        // Owner 9 Nov: a bush that left sight takes its remembered look at once too (only rocks were re-tinted, so with
        // the camera still a bush stayed in full colour beyond the sight).
        const bushSprite=this.bushSprites.get(key);if(bushSprite?.visible){const bush=this.scene.bushes?.get(key);if(bush!==undefined){const state=fog.displayState({x,y}),painted=this.paintBush(bushSprite,bush,state,fog,x,y);if(painted&&painted!=='nature'){const d=this.registry.get?.(BUSH_TYPES[bush]);bushSprite.setOrigin(d?.origin?.x??.5,d?.origin?.y??.6);}}}
        if(!this.tileData({x,y})[0]){const group=this.groupCover?.get(key);if(group){const sprite=this.groupSprites.get(groupKey(group));if(sprite)this.paintGroup(sprite,group,fog);}continue;}
        const group=this.groupCover.get(key);if(group){const sprite=this.groupSprites.get(groupKey(group));if(sprite)this.paintGroup(sprite,group,fog);continue;}
        const tile=this.tiles.get(key);if(!tile){if(fog.added.includes(index)){this.lastView='';break;}continue;}this.paintWall(tile,fog.displayState({x,y}),fog);}
      else this.lastView='';
    }
    if (cacheKey === this.lastView) {this.repaintDirty();return;}
    this.outcropFogRevision=fog?.revision;
    this.lastView = cacheKey;
    this.debugGraphics.clear();
    const padding = 100;
    const corners = [[view.x-padding,view.y-padding],[view.right+padding,view.y-padding],
      [view.x-padding,view.bottom+padding+LIFT_PAD],[view.right+padding,view.bottom+padding+LIFT_PAD]].map(([x,y])=>worldToGrid(x,y));
    const minX=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-1);
    const maxX=Math.min(COLUMNS-1,Math.ceil(Math.max(...corners.map(p=>p.x)))+1);
    const minY=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-1);
    const maxY=Math.min(ROWS-1,Math.ceil(Math.max(...corners.map(p=>p.y)))+1);
    const visible = new Set(), neededChunks = new Set(), chunkIds = new Set(), shownBushes=new Set();let occupied=null;
    const grouped=this.paintNatureGroups(minX,maxX,minY,maxY,fog);
    let visibleCount = 0;
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const p=tileCenter({x,y});
      if(p.x<view.x-padding||p.x>view.right+padding||p.y<view.y-padding||p.y>view.bottom+padding+LIFT_PAD)continue;
      const pl=tileCenterLifted({x,y}); // where things standing on this tile are drawn
      visibleCount++;
      if(this.debugEnabled&&this.wear?.isGrass({x,y})&&(!fog||fog.isVisibleTile({x,y}))){
        const colors=[0x87a18a,0x7fbf6a,0xc6cf75,0xdfac67,0xe38b57],level=this.wear.level({x,y});
        this.debugGraphics.fillStyle(colors[level],level ? .36 : .08);this.debugGraphics.fillPoints([{x:p.x-31,y:p.y},{x:p.x,y:p.y-15},{x:p.x+31,y:p.y},{x:p.x,y:p.y+15}],true);
      }
      const chunk=Math.floor(y/CHUNK_SIZE)*64+Math.floor(x/CHUNK_SIZE);if(!chunkIds.has(chunk)){chunkIds.add(chunk);neededChunks.add(`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`);}
      if(grouped.has(`${x},${y}`))continue;
      const bush=this.scene.bushes?.get(`${x},${y}`);
      if(bush!==undefined){
        occupied??=this.buildingTiles();const state=fog?.displayState({x,y})??VISIBILITY.VISIBLE;
        if(state!==VISIBILITY.UNEXPLORED&&(!fog?.enabled||fog.isInSightTile({x,y})||fog.explored[y*fog.width+x])&&this.bushVisible(x,y,occupied)){
          const key=`${x},${y}`,id=BUSH_TYPES[bush],definition=this.registry.get?.(id),sprite=this.bushSprites.get(key)??this.bushPool.pop()??this.scene.add.image(0,0,this.assets?.textureKey(id)??'__DEFAULT');
          const painted=this.paintBush(sprite,bush,state,fog,x,y);if(painted){if(painted!=='nature')sprite.setOrigin(definition?.origin?.x??.5,definition?.origin?.y??.6);sprite.setPosition(pl.x,pl.y).setDepth(pl.y+(definition?.depth?.offset??0)).setVisible(true);this.bushSprites.set(key,sprite);shownBushes.add(key);}
          else{sprite.setVisible(false);this.bushPool.push(sprite);this.bushSprites.delete(key);}
        }
      }
      // Only rock outcrops need sprites: ordinary ground stops here without any fog or memory lookups.
      if(!this.map[y]?.[x])continue;
      const state=fog?.displayState({x,y})??VISIBILITY.VISIBLE;
      if(!this.tileData({x,y})[0]||state===VISIBILITY.UNEXPLORED)continue;
      if(fog?.enabled&&!fog.isInSightTile({x,y})&&!fog.explored[y*fog.width+x])continue;
      const key=`${x},${y}`; visible.add(key);
      if(this.tiles.has(key)){this.paintWall(this.tiles.get(key),state,fog);continue;}
      const wall=this.wallPool.pop()??this.scene.add.image(0,0,this.wallTexture).setOrigin(this.outcrop.origin?.x??0.5,this.outcrop.origin?.y??1);
      wall.tileX=x;wall.tileY=y;wall.setPosition(pl.x,pl.y).setDepth(pl.y+(this.outcrop.depth?.offset??0)).setVisible(true);this.paintWall(wall,state,fog);
      this.tiles.set(key,wall);
    }
    for(const [key,tile] of this.tiles) if(!visible.has(key)) {
      tile.setVisible(false);this.wallPool.push(tile);
      this.tiles.delete(key);
    }
    for(const [key,sprite]of this.bushSprites)if(!shownBushes.has(key)){sprite.setVisible(false);this.bushPool.push(sprite);this.bushSprites.delete(key);}
    for (const [key, chunk] of this.chunks) if (!neededChunks.has(key)) {
      chunk.setVisible(false); chunk.tight=null; this.chunkPool.push(chunk); this.chunks.delete(key);
      // The lifted picture of a chunk that left the view is freed (about 1 MB each); it is made again on return.
      {const [lx,ly]=key.split(',');const flatKey=`terrain-chunk-${lx}-${ly}`,liftName=`terrain-lift-${lx}-${ly}`;if(this.scene.textures.exists(liftName)){if(this.scene.textures.exists(flatKey))chunk.setTexture(flatKey);this.scene.textures.remove(liftName);}}
    }
    this.neededChunks=neededChunks;this.repaintDirty();
    this.visibleCount=visibleCount;
  }
  destroy(){this.unsubscribeWear?.();this.debugGraphics.destroy();this.composite?.destroy();}
}
