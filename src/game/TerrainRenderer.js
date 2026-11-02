import { COLUMNS, ROWS } from './config.js';
import { tileCenter, worldToGrid, gridToWorld } from './isometric.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';

const CHUNK_SIZE = 10;

function terrainHash(x, y) { return ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263)) >>> 0); }

export class TerrainRenderer {
  constructor(scene, map, registry=objectRegistry, assets=null) {
    this.scene = scene; this.map = map;
    this.registry=registry;this.assets=assets;
    this.tiles = new Map(); this.wallPool = [];
    this.chunks = new Map(); this.chunkPool = [];
    this.lastView = '';
    this.createTextures();
    this.outcrop=registry.require('rock_outcrop');
    this.wallTexture=assets?.textureFor(this.outcrop.id,'terrain-wall')??'terrain-wall';
  }

  chunkTexture(cx, cy) {
    const key = `terrain-chunk-${cx}-${cy}`;
    const origin = gridToWorld(cx * CHUNK_SIZE, cy * CHUNK_SIZE);
    const left = origin.x - CHUNK_SIZE * 32;
    if (!this.scene.textures.exists(key)) {
      // Sto statických diamantů se jednou složí do jedné textury. Při posouvání
      // kamery se pak kreslí desítky bloků, ne tisíce samostatných obrázků.
      const texture = this.scene.textures.createCanvas(key, CHUNK_SIZE * 64, CHUNK_SIZE * 32);
      const context = texture.getContext();
      for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE; y++) {
        for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE; x++) {
          const point = tileCenter({ x, y });
          const entry=this.groundTextures[terrainHash(x,y)%this.groundTextures.length];
          const frame=this.scene.textures.get(entry.key).get(entry.frame);
          context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);
        }
      }
      texture.refresh();
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

  update(camera,fog=null) {
    const view = camera.worldView;
    const cacheKey = [Math.floor(view.x / 16), Math.floor(view.y / 16), Math.ceil(view.width), Math.ceil(view.height),fog?.signature??''].join(',');
    if (cacheKey === this.lastView) return;
    this.lastView = cacheKey;
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
      neededChunks.add(`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`);
      if (!this.map[y][x]) continue;
      if(fog&&!fog.isVisibleTile({x,y}))continue;
      const key=`${x},${y}`; visible.add(key);
      if(this.tiles.has(key))continue;
      const wall=this.wallPool.pop()??this.scene.add.image(0,0,this.wallTexture).setOrigin(this.outcrop.origin?.x??0.5,this.outcrop.origin?.y??1);
      wall.setPosition(p.x,p.y).setDepth(p.y+(this.outcrop.depth?.offset??0)).setVisible(true);
      this.tiles.set(key,wall);
    }
    for(const [key,tile] of this.tiles) if(!visible.has(key)) {
      tile.setVisible(false);this.wallPool.push(tile);
      this.tiles.delete(key);
    }
    for (const [key, chunk] of this.chunks) if (!neededChunks.has(key)) {
      chunk.setVisible(false); this.chunkPool.push(chunk); this.chunks.delete(key);
    }
    for (const key of neededChunks) if (!this.chunks.has(key)) {
      const [cx,cy] = key.split(',').map(Number), texture = this.chunkTexture(cx,cy);
      const image = this.chunkPool.pop() ?? this.scene.add.image(0,0,texture.key).setOrigin(0,0).setDepth(-100);
      image.setTexture(texture.key).setPosition(texture.x,texture.y).setVisible(true);
      this.chunks.set(key,image);
    }
    this.visibleCount=visibleCount;
  }
}
