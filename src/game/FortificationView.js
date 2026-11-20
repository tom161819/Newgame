import Phaser from 'phaser';
import { gridToWorld,tilePolygon } from './isometric.js';
import { towerBase,buildingDepth,buildingDefinition } from './buildings.js';
import { isWall,wallIndex,connectionsFor,bandSides } from './walls.js';
import { APPROVED_WALL_ART,DIAGONAL_WALL_ART } from '../data/objects/approvedArt.js';
import { tileCenter } from './isometric.js';
// Every wall picture: the kit (block and parapets, on the tile's front corner) and the diagonal pieces (tile centre).
const WALL_ART=Object.freeze({...APPROVED_WALL_ART,...DIAGONAL_WALL_ART});
import { splitPixels } from './wallShadows.js';
import { assetURL } from '../systems/AssetManager.js';
import { damageStage,damagedTexture,rubble } from './buildingDamage.js';

// The approved wall kit loads on first use; open walls repaint when it arrives.
const wallKey=piece=>`wall-art:${piece}`,liveWalls=new Set();
// Ground layer for wall shadows: above the terrain and footprints (-90), below every wall, unit and building.
export const WALL_SHADOW_DEPTH=-80;
const bodyKey=piece=>`${wallKey(piece)}:body`,shadowKey=piece=>`${wallKey(piece)}:shadow`;
// #147: every kit piece bakes its shadow in (near-black, semi-transparent pixels). Split once into a body and a
// shadow texture; shadows go to one ground layer under all walls, so a wall never darkens its neighbour.
function splitWallArt(scene){
  for(const piece of Object.keys(WALL_ART)){
    if(scene.textures.exists(bodyKey(piece))||!scene.textures.exists(wallKey(piece)))continue;
    const source=scene.textures.get(wallKey(piece)).getSourceImage(),w=source.width,h=source.height,body=scene.textures.createCanvas(bodyKey(piece),w,h),shadow=scene.textures.createCanvas(shadowKey(piece),w,h);
    const context=body.getContext();context.drawImage(source,0,0);
    const data=context.getImageData(0,0,w,h),shade=shadow.getContext().createImageData(w,h);
    shade.data.set(splitPixels(data.data));context.putImageData(data,0,0);shadow.getContext().putImageData(shade,0,0);body.refresh();shadow.refresh();
  }
}
const wallArtReady=scene=>{const pieces=Object.keys(WALL_ART);if(!pieces.every(piece=>scene.textures?.exists(wallKey(piece))))return false;splitWallArt(scene);return pieces.every(piece=>scene.textures.exists(bodyKey(piece)));};
function ensureWallArt(scene){
  if(scene.__wallArtRequested||!scene.load)return;scene.__wallArtRequested=true;let queued=0;
  for(const [piece,art]of Object.entries(WALL_ART))if(!scene.textures.exists(wallKey(piece))){scene.load.image(wallKey(piece),assetURL(art.sprite,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));queued++;}
  if(!queued)return;
  scene.load.once('complete',()=>{for(const view of liveWalls)if(view.scene===scene&&view.building)view.paint(view.building,view.tint);});
  if(!scene.load.isLoading())scene.load.start();
}

function polygon(g,color,points){g.fillStyle(color);g.fillPoints(points,true);}
function lerp(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
function masonry(g,a,b,height,color){
  polygon(g,color,[a,b,{x:b.x,y:b.y-height},{x:a.x,y:a.y-height}]);
  g.lineStyle(1,0x5b5d4d,.45);
  for(let h=12,row=0;h<height;h+=12,row++){
    g.lineBetween(a.x,a.y-h,b.x,b.y-h);
    for(let t=(row%2?0.15:0.3);t<1;t+=.3){const p=lerp(a,b,t);g.lineBetween(p.x,p.y-h,p.x,p.y-Math.min(height,h+12));}
  }
}
function parapet(g,a,b,height,color){
  const p={x:a.x,y:a.y-height},q={x:b.x,y:b.y-height};
  polygon(g,color,[p,q,{x:q.x,y:q.y-5},{x:p.x,y:p.y-5}]);
  const count=Math.max(2,Math.round(Math.hypot(b.x-a.x,b.y-a.y)/18));
  for(let i=0;i<=count;i++){
    const point=lerp(p,q,i/count);
    g.fillStyle(color);g.fillRect(point.x-3,point.y-12,6,8);
    polygon(g,0xe0d7b9,[{x:point.x-3,y:point.y-12},{x:point.x,y:point.y-14},{x:point.x+3,y:point.y-12},{x:point.x,y:point.y-10}]);
  }
}

// Stejné rozhraní jako TowerView, rozměry a výška pocházejí z definice.
export class FortificationView {
  constructor(scene,building,preview=false){
    this.scene=scene;this.preview=preview;this.back=scene.add.graphics();this.front=scene.add.graphics();this.footprint=scene.add.graphics();this.art={};this.shadows={};this.artShown={};
    if(isWall(building)){liveWalls.add(this);ensureWallArt(scene);}
    this.paint(building);if(preview)this.setAlpha(1);
  }
  paint(building,tint=null){
    this.definition=buildingDefinition(building);this.base=towerBase(building);this.building=building;this.tint=tint;
    const d=this.definition,h=d.visual.wallHeight,{x,y}=building;
    const points=[[x,y],[x+d.width,y],[x+d.width,y+d.height],[x,y+d.height]].map(([gx,gy])=>{const p=gridToWorld(gx,gy);return {x:p.x-this.base.x,y:p.y-this.base.y};});
    const [a,b,c,e]=points,depth=buildingDepth(building),g=this.back.clear().setPosition(this.base.x,this.base.y).setDepth(this.preview?10001:depth);
    const front=this.front.clear().setPosition(this.base.x,this.base.y).setDepth(this.preview?10002:depth+.3);
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);
    floor.fillStyle(tint??0x777450,this.preview?0.3:0.2);floor.lineStyle(1,tint??0xb3a477,.75);
    for(const tile of building.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}
    const links=isWall(building)?building.connections??connectionsFor(wallIndex(this.scene.buildings),building):{};
    this.hitArea=new Phaser.Geom.Polygon([{x:a.x,y:a.y-h-14},{x:b.x,y:b.y-h-14},b,c,e,{x:e.x,y:e.y-h-14}]);
    // Owner 18 Nov 2026: a damaged wall shows it – stage 1 loses merlons and cracks, 2 and 3 break off from the top; fallen
    // stones lie at its foot (buildingDamage.js).
    const stage=this.damage=damageStage(building);
    if(this.paintArt(building,links,depth,tint,stage)){this.paintRubble(front,points,stage,building,tint);return;}
    const shadow=d.shadow;if(shadow){g.fillStyle(shadow.color,shadow.alpha);g.fillEllipse(shadow.x,shadow.y,shadow.width,shadow.height);}
    // Sousední tělesa tyto stěny překryjí. Ponechání obou ploch zamezí
    // otevřenému řezu, když se soused skryje za hranicí Fog of War.
    masonry(g,e,c,h,tint??0xada691);
    masonry(g,c,b,h,tint??0x818373);
    polygon(g,tint??0xbeb69b,points.map(p=>({x:p.x,y:p.y-h})));
    if(!links.N)parapet(g,a,b,h,tint??0x929481);
    if(!links.W)parapet(g,a,e,h,tint??0xb7b19b);
    if(!links.S)parapet(front,e,c,h,tint??0xb7b19b);
    if(!links.E)parapet(front,c,b,h,tint??0x969984);
    if(!isWall(building)){
      const p=lerp(e,c,.55),q=lerp(e,c,.77);
      polygon(g,0x3f3c2a,[p,q,{x:q.x,y:q.y-38},{x:p.x,y:p.y-38}]);
      g.lineStyle(2,0x8c7953);g.lineBetween((p.x+q.x)/2,(p.y+q.y)/2,(p.x+q.x)/2,(p.y+q.y)/2-38);
    }
  }
  // Approved kit: the block plus the parapets of open sides; S and E stand in
  // front of units on the wall walk, exactly like the procedural layers.
  paintArt(building,links,depth,tint,stage=0){
    const use=isWall(building)&&wallArtReady(this.scene);
    for(const [piece,art]of Object.entries(WALL_ART)){
      // m-hradby-diagonala: a tile of a diagonal run shows its one diagonal piece and nothing else.
      // From stage 2 the top of the block is broken off, so the parapets on it are gone.
      const run=building.diagonal,elbow=building.elbow&&`elbow-${building.elbow}` in DIAGONAL_WALL_ART?building.elbow:null/* an elbow without approved art stays a plain block */,diagonal=piece in DIAGONAL_WALL_ART;
      // Owner 20 Nov 2026: an elbow without approved art (NW-00/01/10, SE-00) stays a plain block, but without the parapets
      // of the two sides beside the linked corner – the diagonal band runs in there, and those merlons stuck out of the joint.
      const toBand=!elbow&&!run?bandSides(building.elbow):[];
      const show=use&&(run?piece===run:elbow?piece===`elbow-${elbow}`:!diagonal&&(piece==='block'||!links[piece]&&stage<2&&!toBand.includes(piece))),at=diagonal?tileCenter(building):this.base;
      // Remember which pieces belong to the wall: culling hides and shows the whole view later.
      this.artShown[piece]=show;
      if(!show){this.art[piece]?.setVisible(false);this.shadows[piece]?.setVisible(false);continue;}
      const front=piece==='S'||piece==='E',image=this.art[piece]??=this.scene.add.image(0,0,bodyKey(piece)),shadow=this.shadows[piece]??=this.scene.add.image(0,0,shadowKey(piece));
      const key=damagedTexture(this.scene,bodyKey(piece),stage,building.id??0);if(image.texture?.key!==key)image.setTexture(key);
      image.setOrigin(art.origin.x,art.origin.y).setPosition(at.x,at.y).setDepth(this.preview?(front?10002:10001):front?depth+.3:depth).setVisible(this.back.visible).setAlpha(this.back.alpha);
      shadow.setOrigin(art.origin.x,art.origin.y).setPosition(at.x,at.y).setDepth(this.preview?10000:WALL_SHADOW_DEPTH).setVisible(this.back.visible).setAlpha(this.back.alpha);
      if(tint==null)image.clearTint();else image.setTint(tint);
    }
    this.afterPaint?.();
    return use;
  }
  paintRubble(g,points,stage,building,tint){
    if(!stage||this.preview)return;const shades=[0x8f8368,0xa39678,0x6f6652];
    for(const stone of rubble(points,stage,building.id??0)){g.fillStyle(tint??shades[Math.floor(stone.shade*shades.length)%shades.length],1);g.fillEllipse(stone.x,stone.y,stone.w*2,stone.h*2);g.fillStyle(0x3d382c,.35);g.fillEllipse(stone.x+1,stone.y+stone.h*.7,stone.w*1.6,stone.h);}
  }
  // Called when the building's hit points changed: repaints only when the stage changed.
  syncDamage(building){if(damageStage(building)!==(this.damage??0))this.paint(building,this.tint);}
  get artImages(){return [...Object.values(this.art),...Object.values(this.shadows)];}
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x-this.base.x,y-this.base.y);}
  setAlpha(value){const v=this.preview?value*.5:value;this.footprint.setAlpha(value);this.back.setAlpha(v);this.front.setAlpha(v);for(const image of this.artImages)image.setAlpha(v);return this;}
  setVisible(value){this.back.setVisible(value);this.front.setVisible(value);this.footprint.setVisible(value);for(const layer of [this.art,this.shadows])for(const [piece,image]of Object.entries(layer))image.setVisible(value&&this.artShown[piece]===true);return this;}
  inView(view){const width=(this.definition.width+this.definition.height)*32;return this.base.x+width>=view.x&&this.base.x-width<=view.right&&this.base.y+10>=view.y&&this.base.y-this.definition.visualHeight<=view.bottom;}
  destroy(){liveWalls.delete(this);this.back.destroy();this.front.destroy();this.footprint.destroy();for(const image of this.artImages)image.destroy();}
}
