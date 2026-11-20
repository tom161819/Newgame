import { gridToWorld,gridToWorldFlat } from './isometric.js';
import { buildingDefinition,buildingDepth,buildingIsComplete } from './buildings.js';
import { isWall } from './walls.js';

// Owner 17 Nov 2026: where a wall joins a Tower there is a door at the wall-walk height, so the way from the wall
// into the Tower shows. Only the two faces turned to the viewer (S = grid y+, E = x+) can show one; a wall on the far
// side leads to a door the Tower itself hides. Drawn in code until the Tower art has its own.
export const TOWER_DOOR=Object.freeze({walkHeight:68,inset:.83,width:15,height:24,arch:5,colors:Object.freeze({frame:0x8a7c62,door:0x3a2a1c,boards:0x4f3a26})});

// The doors to draw for one Tower: {side, column} for every finished wall touching its S or E face.
export function upperDoors(tower,buildings){
  const {width,height}=buildingDefinition(tower),walls=new Set(buildings.filter(b=>isWall(b)&&buildingIsComplete(b)).map(b=>`${b.x},${b.y}`)),out=[];
  for(let i=0;i<width;i++)if(walls.has(`${tower.x+i},${tower.y+height}`))out.push({side:'S',column:i});
  for(let i=0;i<height;i++)if(walls.has(`${tower.x+width},${tower.y+i}`))out.push({side:'E',column:i});
  return out;
}
// The four corners of a door on a face (bottom left, bottom right, top right, top left) and the arch top, in world space.
export function doorShape(tower,door,shape=TOWER_DOOR){
  const {width,height}=buildingDefinition(tower),c=gridToWorld(tower.x+width/2,tower.y+height/2);
  const [a,b]=door.side==='S'?[gridToWorld(tower.x+door.column,tower.y+height),gridToWorld(tower.x+door.column+1,tower.y+height)]:[gridToWorld(tower.x+width,tower.y+door.column),gridToWorld(tower.x+width,tower.y+door.column+1)];
  const inset=p=>({x:c.x+(p.x-c.x)*shape.inset,y:c.y+(p.y-c.y)*shape.inset}),m=inset({x:(a.x+b.x)/2,y:(a.y+b.y)/2}),len=Math.hypot(b.x-a.x,b.y-a.y),d={x:(b.x-a.x)/len,y:(b.y-a.y)/len};
  // Owner 20 Nov 2026: on sloping ground the wall is drawn at the height of its own front corner, so the door follows
  // that corner (not the Tower's face), or it sank into the wall or floated above its walk.
  const wallFront=door.side==='S'?{x:tower.x+door.column+1,y:tower.y+height+1}:{x:tower.x+width+1,y:tower.y+door.column+1},lift=(x,y)=>gridToWorldFlat(x,y).y-gridToWorld(x,y).y;
  const faceLift=door.side==='S'?(lift(tower.x+door.column,tower.y+height)+lift(tower.x+door.column+1,tower.y+height))/2:(lift(tower.x+width,tower.y+door.column)+lift(tower.x+width,tower.y+door.column+1))/2;
  const half=shape.width/2,y0=m.y+faceLift-lift(wallFront.x,wallFront.y)-shape.walkHeight,bl={x:m.x-d.x*half,y:y0-d.y*half},br={x:m.x+d.x*half,y:y0+d.y*half};
  return {bl,br,tr:{x:br.x,y:br.y-shape.height},tl:{x:bl.x,y:bl.y-shape.height},top:{x:m.x,y:y0-shape.height-shape.arch}};
}
export class TowerDoors {
  constructor(scene){this.scene=scene;this.views=new Map();}
  refresh(){
    const s=this.scene,seen=new Set();
    // (Space) flattened buildings: no doors in the air.
    if(s.flatBuildings?.on){for(const g of this.views.values())g.setVisible(false);return;}for(const g of this.views.values())g.setVisible(true);
    for(const tower of s.buildings){if(tower.type!=='tower'||!buildingIsComplete(tower))continue;const doors=upperDoors(tower,s.buildings);if(!doors.length)continue;seen.add(tower.id);
      const g=this.views.get(tower.id)??s.add.graphics();this.views.set(tower.id,g);g.clear().setDepth(buildingDepth(tower)+.05);
      for(const door of doors){const p=doorShape(tower,door),C=TOWER_DOOR.colors,pts=[p.bl,p.br,p.tr,p.top,p.tl];
        g.fillStyle(C.frame,1);g.fillPoints(pts.map(q=>({x:q.x+(q===p.bl||q===p.tl?-2:q===p.br||q===p.tr?2:0),y:q.y+(q===p.top?-2:q===p.tl||q===p.tr?-1:0)})),true);
        g.fillStyle(C.door,1);g.fillPoints(pts,true);
        g.lineStyle(1,C.boards,1);const mid={x:(p.bl.x+p.br.x)/2,y:(p.bl.y+p.br.y)/2};g.lineBetween(mid.x,mid.y,mid.x,mid.y-TOWER_DOOR.height-TOWER_DOOR.arch+1);}
    }
    for(const [id,g] of this.views)if(!seen.has(id)){g.destroy();this.views.delete(id);}
  }
  destroy(){for(const g of this.views.values())g.destroy();this.views.clear();}
}
