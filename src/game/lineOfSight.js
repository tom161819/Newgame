// Ranged line of sight: every tile strictly between two tiles must be open ground (trees, walls, buildings and rock
// block a shot). Supercover walk, so a shot cannot slip diagonally between two blocking tiles.
export function hasLineOfSight(map,from,to){
  let x=from.x,y=from.y;const dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),sx=Math.sign(to.x-x),sy=Math.sign(to.y-y);
  for(let ix=0,iy=0;ix<dx||iy<dy;){
    const step=(0.5+ix)/dx-(0.5+iy)/dy;
    if(dy===0||dx!==0&&step<0){x+=sx;ix++;}else if(dx===0||step>0){y+=sy;iy++;}else{if(map[y]?.[x+sx]!==0&&map[y+sy]?.[x]!==0)return false;x+=sx;y+=sy;ix++;iy++;}
    if((x!==to.x||y!==to.y)&&map[y]?.[x]!==0)return false;
  }
  return true;
}
