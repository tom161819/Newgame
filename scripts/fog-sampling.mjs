import { gridToWorld } from '../src/game/isometric.js';

// A screen-space seam assertion must sample genuinely unknown ground. Subject
// sight is part of the union, so a fixed offset from the king is not sufficient.
export function unknownFogSeam(fog,camera,king){
  const offsets=[[9,-8],[8,9],[-9,8],[-8,-9],[9,8],[-9,-8],[8,-9],[-8,9]];
  for(const [dx,dy]of offsets){
    const tile={x:king.x+dx,y:king.y+dy},neighbors=[{x:tile.x-1,y:tile.y-1},{x:tile.x,y:tile.y-1},{x:tile.x-1,y:tile.y},tile];
    if(neighbors.some(t=>t.x<0||t.y<0||t.x>=fog.width||t.y>=fog.height||fog.state(t)!==0))continue;
    const point=gridToWorld(tile.x,tile.y),screen={x:Math.round((point.x-(camera.scrollX+camera.width/2))*camera.zoom+camera.width/2),y:Math.round((point.y-(camera.scrollY+camera.height/2))*camera.zoom+camera.height/2)};
    if(screen.x<2||screen.y<2||screen.x>=camera.width-2||screen.y>=camera.height-2)continue;
    return {tile,neighbors,screen};
  }
  throw Error('Fog smoke needs an on-screen corner with four genuinely unexplored neighbours.');
}
