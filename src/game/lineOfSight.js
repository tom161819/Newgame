// Ranged line of sight: every tile strictly between two tiles must be open ground (trees, walls, buildings and rock
// block a shot; water does not, #100). Supercover walk, so a shot cannot slip diagonally between two blocking tiles.
import { WATER_CELL } from '../data/worldTerrain.js';
const opaque=cell=>cell!==0&&cell!==WATER_CELL;
export function hasLineOfSight(map,from,to){
  let x=from.x,y=from.y;const dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),sx=Math.sign(to.x-x),sy=Math.sign(to.y-y);
  for(let ix=0,iy=0;ix<dx||iy<dy;){
    const step=(0.5+ix)/dx-(0.5+iy)/dy;
    if(dy===0||dx!==0&&step<0){x+=sx;ix++;}else if(dx===0||step>0){y+=sy;iy++;}else{if(opaque(map[y]?.[x+sx])&&opaque(map[y+sy]?.[x]))return false;x+=sx;y+=sy;ix++;iy++;}
    if((x!==to.x||y!==to.y)&&opaque(map[y]?.[x]))return false;
  }
  return true;
}
