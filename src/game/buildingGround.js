import { buildingIsComplete } from './buildingState.js';

// A gate reserves its whole footprint, but only its two pillars block ground traffic.
// The middle cell connects opposite sides; ordinary corner rules prevent side entry.
export function buildingGroundOpen(building,definition,tile){
  if(!buildingIsComplete(building))return false;
  if(definition.walkable)return true;
  const axis=definition.navigation?.gateAxis;
  return axis==='y'?tile.x===building.x+1:axis==='x'?tile.y===building.y+1:false;
}


// Gate stairs rise beside its first pillar; the open middle tile is a valid approach.
export function gateStairNeighbors(building,definition){
  if(!definition.navigation?.gateAxis)return null;
  const {x,y}=building;
  return [{x:x-1,y},{x,y:y-1},{x:x+1,y},{x,y:y+1}];
}
