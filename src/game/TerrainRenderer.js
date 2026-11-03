import { COLUMNS, ROWS } from './config.js';
import { tileCenter, worldToGrid, gridToWorld } from './isometric.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { PATH_WEAR } from '../data/pathWear.js';
import { canStep } from './pathfinding.js';
import { VISIBILITY, FOG_STYLE } from '../systems/FogOfWarSystem.js';
import { MEMORY_DIRECTIONS } from '../systems/MapMemory.js';

const CHUNK_SIZE = 10;

function terrainHash(x, y) { return ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263)) >>> 0); }

export class TerrainRenderer {
  constructor(scene, map, registry=objectRegistry, assets=null) {
    this.scene = scene; this.map = map;
    this.registry=registry;this.assets=assets;
    this.tiles = new Map(); this.wallPool = [];
    this.chunks = new Map(); this.chunkPool = [];
    this.lastView = '';
    this.dirtyChunks=new Set();this.debugEnabled=false;this.debugGraphics=scene.add.graphics().setDepth(-99);
    for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);
    this.createTextures();
    this.outcrop=registry.require('rock_outcrop');
    this.wallTexture=assets?.textureFor(this.outcrop.id,'terrain-wall')??'terrain-wall';
    this.wearTextures=PATH_WEAR.terrainIds.map(id=>({key:assets?.hasTexture(id)?assets.textureKey(id):this.groundTextures[0].key}));
  }

  setPathWear(system){this.wear=system;this.unsubscribeWear=system.subscribe(tile=>this.invalidateArea([tile]));}
  setDebug(value){this.debugEnabled=!!value;this.lastView='';if(!value)this.debugGraphics.clear();}
  setSeason(season){if(season===this.season)return;this.season=season;for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';}
  invalidateArea(tiles){
    if(!tiles.length)return;
    for(const tile of tiles)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const x=tile.x+dx,y=tile.y+dy;if(x>=0&&x<COLUMNS&&y>=0&&y<ROWS)this.dirtyChunks.add(`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`);
    }
    this.lastView='';
  }
  drawConnections(context,x,y,left,top){
    const tile={x,y},remembered=this.fog?.enabled&&this.memory,level=remembered?this.tileData(tile)[1]:this.wear?.level(tile)??0;if(!level)return;
    const visual=this.registry.require(PATH_WEAR.terrainIds[level]).visual,center=tileCenter(tile);
    context.save();context.translate(center.x-left,center.y-top);
    context.beginPath();context.moveTo(-32,0);context.lineTo(0,-16);context.lineTo(32,0);context.lineTo(0,16);context.closePath();context.clip();context.scale(1,.5);context.lineCap='round';
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const neighbor={x:x+dx,y:y+dy},other=remembered?(this.memory.terrain.get(neighbor.y*this.fog.width+neighbor.x)?.[1]??0):this.wear.level(neighbor);
      const bit=MEMORY_DIRECTIONS.findIndex(([nx,ny])=>nx===dx&&ny===dy);
      if(!other||(remembered?!((this.tileData(tile)[3]??0)&(1<<bit)):!canStep(this.scene.map,tile,neighbor)))continue;
      const neighborVisual=this.registry.require(PATH_WEAR.terrainIds[other]).visual,width=Math.min(visual.pathWidth,neighborVisual.pathWidth);
      const end={x:(dx-dy)*16,y:(dx+dy)*16},bend=((terrainHash(x+dx,y+dy)%5)-2)*.35;
      const line=()=>{context.beginPath();context.moveTo(0,0);context.quadraticCurveTo(end.x*.5+bend,end.y*.5-bend,end.x,end.y);context.stroke();};
      context.strokeStyle=visual.pathEdge;context.lineWidth=width+3;context.globalAlpha=.6;line();
      context.strokeStyle=visual.pathColor;context.lineWidth=width;context.globalAlpha=1;line();
    }
    context.restore();
  }

  tileData(tile){return this.memory?.terrainAt(tile,this.map,this.wear,this.season)??[this.map[tile.y]?.[tile.x]??0,this.wear?.level(tile)??0,this.season];}

  chunkTexture(cx, cy) {
    const key = `terrain-chunk-${cx}-${cy}`;
    const origin = gridToWorld(cx * CHUNK_SIZE, cy * CHUNK_SIZE);
    const left = origin.x - CHUNK_SIZE * 32;
    if (!this.scene.textures.exists(key)||this.dirtyChunks.has(`${cx},${cy}`)) {
      // Sto statických diamantů se jednou složí do jedné textury. Při posouvání
      // kamery se pak kreslí desítky bloků, ne tisíce samostatných obrázků.
      const texture = this.scene.textures.exists(key)?this.scene.textures.get(key):this.scene.textures.createCanvas(key, CHUNK_SIZE * 64, CHUNK_SIZE * 32);
      const context = texture.getContext();
      context.clearRect(0,0,texture.width,texture.height);
      for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE; y++) {
        for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE; x++) {
          const point = tileCenter({ x, y });
          const tile={x,y},state=this.fog?.displayState(tile)??VISIBILITY.VISIBLE,[,level,season]=this.tileData(tile);
          const polygon=()=>{context.beginPath();context.moveTo(point.x-left-32,point.y-origin.y);context.lineTo(point.x-left,point.y-origin.y-16);context.lineTo(point.x-left+32,point.y-origin.y);context.lineTo(point.x-left,point.y-origin.y+16);context.closePath();};
          if(state===VISIBILITY.UNEXPLORED){context.fillStyle='#000';polygon();context.fill();continue;}
          const entry=this.wear?this.wearTextures[level]:this.groundTextures[terrainHash(x,y)%this.groundTextures.length];
          const frame=this.scene.textures.get(entry.key).get(entry.frame);
          context.save();
          if(state===VISIBILITY.EXPLORED)context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;
          context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);
          if(this.wear)this.drawConnections(context,x,y,left,origin.y);
          const tint={Spring:'rgba(95,145,65,.08)',Summer:'rgba(185,159,70,.09)',Autumn:'rgba(158,105,45,.17)',Winter:'rgba(232,237,220,.83)'}[season];
          if(tint){context.globalCompositeOperation='source-atop';context.fillStyle=tint;polygon();context.fill();}
          context.restore();
        }
      }
      texture.refresh();
      this.dirtyChunks.delete(`${cx},${cy}`);
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

  update(camera,fog=null,memory=this.memory) {
    this.fog=fog;this.memory=memory;
    const mode=`${fog?.enabled}:${fog?.explorationEnabled}`;
    if(mode!==this.fogMode){this.fogMode=mode;for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';}
    if(fog&&this.fogRevision!==fog.revision){this.fogRevision=fog.revision;this.invalidateArea([...fog.added,...fog.removed].map(index=>({x:index%fog.width,y:Math.floor(index/fog.width)})));}
    const view = camera.worldView;
    const cacheKey = [Math.floor(view.x / 16), Math.floor(view.y / 16), Math.ceil(view.width), Math.ceil(view.height),fog?.signature??'',this.wear?.levelRevision??0,this.debugEnabled?this.wear?.revision:0,this.debugEnabled].join(',');
    if (cacheKey === this.lastView) return;
    this.lastView = cacheKey;
    this.debugGraphics.clear();
    const padding = 100;
    const corners = [[view.x-padding,view.y-padding],[view.right+padding,view.y-padding],
      [view.x-padding,view.bottom+padding],[view.right+padding,view.bottom+padding]].map(([x,y])=>worldToGrid(x,y));
    const minX=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-1);
    const maxX=Math.min(COLUMNS-1,Math.ceil(Math.max(...corners.map(p=>p.x)))+1);
    const minY=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-1);
    const maxY=Math.min(ROWS-1,Math.ceil(Math.max(...corners.map(p=>p.y)))+1);
    const visible = new Set(), neededChunks = new Set();
    let visibleCount = 0;
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const p=tileCenter({x,y});
      if(p.x<view.x-padding||p.x>view.right+padding||p.y<view.y-padding||p.y>view.bottom+padding)continue;
      visibleCount++;
      if(this.debugEnabled&&this.wear?.isGrass({x,y})&&(!fog||fog.isVisibleTile({x,y}))){
        const colors=[0x87a18a,0xc6cf75,0xdfac67,0xe38b57],level=this.wear.level({x,y});
        this.debugGraphics.fillStyle(colors[level],level ? .36 : .08);this.debugGraphics.fillPoints([{x:p.x-31,y:p.y},{x:p.x,y:p.y-15},{x:p.x+31,y:p.y},{x:p.x,y:p.y+15}],true);
      }
      neededChunks.add(`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`);
      const state=fog?.displayState({x,y})??VISIBILITY.VISIBLE;
      if(!this.tileData({x,y})[0]||state===VISIBILITY.UNEXPLORED)continue;
      if(fog?.enabled&&!fog.isInSightTile({x,y})&&!fog.explored[y*fog.width+x])continue;
      const key=`${x},${y}`; visible.add(key);
      if(this.tiles.has(key)){this.tiles.get(key).setTint(state===VISIBILITY.EXPLORED?0x4d504d:0xffffff);continue;}
      const wall=this.wallPool.pop()??this.scene.add.image(0,0,this.wallTexture).setOrigin(this.outcrop.origin?.x??0.5,this.outcrop.origin?.y??1);
      wall.setPosition(p.x,p.y).setDepth(p.y+(this.outcrop.depth?.offset??0)).setTint(state===VISIBILITY.EXPLORED?0x4d504d:0xffffff).setVisible(true);
      this.tiles.set(key,wall);
    }
    for(const [key,tile] of this.tiles) if(!visible.has(key)) {
      tile.setVisible(false);this.wallPool.push(tile);
      this.tiles.delete(key);
    }
    for (const [key, chunk] of this.chunks) if (!neededChunks.has(key)) {
      chunk.setVisible(false); this.chunkPool.push(chunk); this.chunks.delete(key);
    }
    for (const key of neededChunks) if (!this.chunks.has(key)||this.dirtyChunks.has(key)) {
      const [cx,cy] = key.split(',').map(Number), texture = this.chunkTexture(cx,cy);
      const image = this.chunks.get(key)??this.chunkPool.pop() ?? this.scene.add.image(0,0,texture.key).setOrigin(0,0).setDepth(-100);
      image.setTexture(texture.key).setPosition(texture.x,texture.y).setVisible(true);
      this.chunks.set(key,image);
    }
    this.visibleCount=visibleCount;
  }
  destroy(){this.unsubscribeWear?.();this.debugGraphics.destroy();}
}
