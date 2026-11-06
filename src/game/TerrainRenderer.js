import { drawCobbles } from './cobbles.js';
import { COLUMNS, ROWS } from './config.js';
import { tileCenter, worldToGrid, gridToWorld } from './isometric.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { PATH_WEAR } from '../data/pathWear.js';
import { canStep } from './pathfinding.js';
import { VISIBILITY, FOG_STYLE, memoryTint } from '../systems/FogOfWarSystem.js';
import { MEMORY_DIRECTIONS } from '../systems/MapMemory.js';

const CHUNK_SIZE = 10;
const TILE_BLEED = .8;

// Season tints as RGBA, for blending between seasons during a transition.
const SEASON_TINT={Spring:[95,145,65,.08],Summer:[185,159,70,.09],Autumn:[158,105,45,.17],Winter:[232,237,220,.83]};
function mixTint(from,to,t){const a=SEASON_TINT[from],b=SEASON_TINT[to];if(!a||!b)return null;const c=a.map((v,i)=>v+(b[i]-v)*t);return`rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;}

const WINTER_VEIL=[0,1.9,1.3,1]; // light tracks fade most under snow
function mixColour(a,b,t){const p=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),x=p(a),y=p(b);return`rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`;}
function terrainHash(x, y) { return ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263)) >>> 0); }

export class TerrainRenderer {
  constructor(scene, map, registry=objectRegistry, assets=null) {
    this.scene = scene; this.map = map;
    this.registry=registry;this.assets=assets;
    this.tiles = new Map(); this.wallPool = [];
    this.chunks = new Map(); this.chunkPool = [];
    this.lastView = '';
    this.dirtyChunks=new Set();this.dirtyTiles=new Map();this.paintStats={tiles:0,chunks:0};this.debugEnabled=false;this.debugGraphics=scene.add.graphics().setDepth(-99);
    for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);
    this.createTextures();
    this.outcrop=registry.require('rock_outcrop');
    this.wallTexture=assets?.textureFor(this.outcrop.id,'terrain-wall')??'terrain-wall';
    // Seasonal grass textures (wear level 0); summer uses the ordinary grass variants.
    const grass=registry.get?.(PATH_WEAR.terrainIds[0]);
    this.seasonGrass=Object.fromEntries(Object.entries(grass?.seasonVariants??{}).map(([season,list])=>[season,list.map((_,i)=>`season-${season}-${i}`).filter(layer=>assets?.hasTexture(grass.id,layer)).map(layer=>assets.key(grass.id,layer))]).filter(([,keys])=>keys.length));
    this.wearTextures=PATH_WEAR.terrainIds.map(id=>({key:assets?.hasTexture(id)?assets.textureKey(id):this.groundTextures[0].key,variants:(registry.get?.(id)?.spriteVariants??[]).map((_,i)=>`variant-${i}`).filter(layer=>assets?.hasTexture(id,layer)).map(layer=>assets.key(id,layer))}));
  }

  // A wear change can turn neighbours into (or out of) a trodden area, which reaches their own neighbours: repaint 5×5.
  setPathWear(system){this.wear=system;this.unsubscribeWear=system.subscribe(tile=>this.invalidateArea([tile],true,2));}
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
      const dirty=this.dirtyTiles.get(`${cx},${cy}`);
      if(!dirty)context.clearRect(0,0,texture.width,texture.height);
      // Ground first for every tile, tracks second: a neighbour's ground overlap can then never cover a track's edge.
      const paths=[];
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
          const wear=this.wear?this.wearTextures[0]:null,entry=wear?(wear.variants.length?{key:wear.variants[terrainHash(x,y)%wear.variants.length]}:wear):this.groundTextures[terrainHash(x,y)%this.groundTextures.length];
          if(state===VISIBILITY.EXPLORED)context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;
          const draw=key=>{const frame=this.scene.textures.get(key).get(key===entry.key?entry.frame:undefined);context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);};
          const mix=state===VISIBILITY.VISIBLE?this.seasonMix?.(x,y,season):null;
          // Untouched grass shows the season's own tiles; during a transition the new season fades in over the old one.
          const seasonal=season=>season==='Summer'?entry.key:this.seasonGrass[season]?.[terrainHash(x,y)%this.seasonGrass[season].length],grassSeason=wear&&seasonal(season)&&(!mix||seasonal(mix.from));
          if(grassSeason&&mix){draw(seasonal(mix.from));context.globalAlpha=mix.amount;draw(seasonal(season));context.globalAlpha=1;}
          else draw(grassSeason?seasonal(season):entry.key);
          if(this.wear)paths.push({x,y,polygon,filter:context.filter,veil:mix?(mix.from==='Winter'?1-mix.amount:0)*.45+(season==='Winter'?mix.amount:0)*.45:season==='Winter'?.45:0});
          const tint=(mix&&mixTint(mix.from,season,mix.amount))??{Spring:'rgba(95,145,65,.08)',Summer:'rgba(185,159,70,.09)',Autumn:'rgba(158,105,45,.17)',Winter:'rgba(232,237,220,.83)'}[season];
          if(tint&&!grassSeason){context.globalCompositeOperation='source-atop';context.fillStyle=tint;polygon(TILE_BLEED);context.fill();}
          context.restore();
        }
      }
      for(const p of paths){context.save();p.polygon(TILE_BLEED);context.clip();context.filter=p.filter;this.drawPaths(context,p.x,p.y,left,origin.y,p.veil,()=>{p.polygon();context.clip();});context.restore();}
      // S11 Stone Pavement on top of ground and tracks; under Fog of War only the remembered surface is drawn.
      for(const p of paths){const paved=tile=>this.tileData(tile)[4]===1;if(!paved(p))continue;const c=tileCenter(p);context.save();context.filter=p.filter;
        drawCobbles(context,c.x-left,c.y-origin.y,{tileX:p.x,tileY:p.y,winter:p.veil>.3,edges:{N:!paved({x:p.x-1,y:p.y}),E:!paved({x:p.x,y:p.y-1}),S:!paved({x:p.x+1,y:p.y}),W:!paved({x:p.x,y:p.y+1})}});context.restore();}
      texture.refresh();
      this.paintStats.chunks++;
      this.dirtyChunks.delete(`${cx},${cy}`);
      this.dirtyTiles.delete(`${cx},${cy}`);
    }
    return { key, x: left, y: origin.y };
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
      const changed=[...previous].filter(index=>!current.has(index));
      for(const index of current)if(!previous.has(index))changed.push(index);
      this.paintedVisibility=new Set(current);this.fogRevision=fog.revision;
      if(fog.enabled)this.invalidateArea(changed.map(index=>({x:index%fog.width,y:Math.floor(index/fog.width)})),false);
    }
  }

  // Performance: a newly visible chunk is painted at once (never a hole); already shown chunks that became dirty
  // (fog, path wear, pavement, season) repaint at most two per frame, so a wave of changes never freezes a frame.
  repaintDirty(){
    let budget=this.repaintAll?Infinity:2;this.repaintAll=false;
    for (const key of this.neededChunks??[]) {
      const shown=this.chunks.has(key);if(shown&&!this.dirtyChunks.has(key))continue;if(shown&&budget--<=0)continue;
      const [cx,cy] = key.split(',').map(Number), texture = this.chunkTexture(cx,cy);
      const image = this.chunks.get(key)??this.chunkPool.pop() ?? this.scene.add.image(0,0,texture.key).setOrigin(0,0).setDepth(-100);
      image.setTexture(texture.key).setPosition(texture.x,texture.y).setVisible(true);
      this.chunks.set(key,image);
    }
  }
  update(camera,fog=null,memory=this.memory) {
    this.fog=fog;this.memory=memory;
    this.updateFog(camera,fog);
    const view = camera.worldView;
    const cacheKey = [Math.floor(view.x / 16), Math.floor(view.y / 16), Math.ceil(view.width), Math.ceil(view.height),fog?`${fog.enabled}:${fog.explorationEnabled}`:'',this.debugEnabled?this.wear?.levelRevision??0:0,this.debugEnabled?this.wear?.revision:0,this.debugEnabled].join(',');
    // Performance: path wear repaints only its own tiles (invalidateArea), so it no longer re-walks every visible tile.
    // Sight moving by a step only re-tints the rock outcrops whose visibility changed; the full walk over every visible
    // tile runs when the camera moves, the Fog mode changes, or a newly seen rock has no sprite yet.
    if (cacheKey === this.lastView && fog && this.outcropFogRevision!==fog.revision) {
      const fresh=this.outcropFogRevision===fog.revision-1;this.outcropFogRevision=fog.revision;
      if(fresh)for(const index of [...fog.added,...fog.removed]){const x=index%fog.width,y=Math.floor(index/fog.width),key=`${x},${y}`;if(!this.tileData({x,y})[0])continue;
        const tile=this.tiles.get(key);if(!tile){if(fog.added.includes(index)){this.lastView='';break;}continue;}tile.setTint(fog.displayState({x,y})===VISIBILITY.EXPLORED?memoryTint(fog.memoryBrightness):0xffffff);}
      else this.lastView='';
    }
    if (cacheKey === this.lastView) {this.repaintDirty();return;}
    this.outcropFogRevision=fog?.revision;
    this.lastView = cacheKey;
    this.debugGraphics.clear();
    const padding = 100;
    const corners = [[view.x-padding,view.y-padding],[view.right+padding,view.y-padding],
      [view.x-padding,view.bottom+padding],[view.right+padding,view.bottom+padding]].map(([x,y])=>worldToGrid(x,y));
    const minX=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-1);
    const maxX=Math.min(COLUMNS-1,Math.ceil(Math.max(...corners.map(p=>p.x)))+1);
    const minY=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-1);
    const maxY=Math.min(ROWS-1,Math.ceil(Math.max(...corners.map(p=>p.y)))+1);
    const visible = new Set(), neededChunks = new Set(), chunkIds = new Set();
    let visibleCount = 0;
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const p=tileCenter({x,y});
      if(p.x<view.x-padding||p.x>view.right+padding||p.y<view.y-padding||p.y>view.bottom+padding)continue;
      visibleCount++;
      if(this.debugEnabled&&this.wear?.isGrass({x,y})&&(!fog||fog.isVisibleTile({x,y}))){
        const colors=[0x87a18a,0xc6cf75,0xdfac67,0xe38b57],level=this.wear.level({x,y});
        this.debugGraphics.fillStyle(colors[level],level ? .36 : .08);this.debugGraphics.fillPoints([{x:p.x-31,y:p.y},{x:p.x,y:p.y-15},{x:p.x+31,y:p.y},{x:p.x,y:p.y+15}],true);
      }
      const chunk=Math.floor(y/CHUNK_SIZE)*64+Math.floor(x/CHUNK_SIZE);if(!chunkIds.has(chunk)){chunkIds.add(chunk);neededChunks.add(`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`);}
      // Only rock outcrops need sprites: ordinary ground stops here without any fog or memory lookups.
      if(!this.map[y]?.[x])continue;
      const state=fog?.displayState({x,y})??VISIBILITY.VISIBLE;
      if(!this.tileData({x,y})[0]||state===VISIBILITY.UNEXPLORED)continue;
      if(fog?.enabled&&!fog.isInSightTile({x,y})&&!fog.explored[y*fog.width+x])continue;
      const key=`${x},${y}`; visible.add(key);
      if(this.tiles.has(key)){this.tiles.get(key).setTint(state===VISIBILITY.EXPLORED?memoryTint(fog.memoryBrightness):0xffffff);continue;}
      const wall=this.wallPool.pop()??this.scene.add.image(0,0,this.wallTexture).setOrigin(this.outcrop.origin?.x??0.5,this.outcrop.origin?.y??1);
      wall.setPosition(p.x,p.y).setDepth(p.y+(this.outcrop.depth?.offset??0)).setTint(state===VISIBILITY.EXPLORED?memoryTint(fog.memoryBrightness):0xffffff).setVisible(true);
      this.tiles.set(key,wall);
    }
    for(const [key,tile] of this.tiles) if(!visible.has(key)) {
      tile.setVisible(false);this.wallPool.push(tile);
      this.tiles.delete(key);
    }
    for (const [key, chunk] of this.chunks) if (!neededChunks.has(key)) {
      chunk.setVisible(false); this.chunkPool.push(chunk); this.chunks.delete(key);
    }
    this.neededChunks=neededChunks;this.repaintDirty();
    this.visibleCount=visibleCount;
  }
  destroy(){this.unsubscribeWear?.();this.debugGraphics.destroy();}
}
