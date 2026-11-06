import { buildingIsComplete } from '../game/buildingState.js';
import { buildingTiles,roofAccessNeighbors } from '../game/buildings.js';
import { roofIndex,isRoofAccess,isWall,findRoofPath } from '../game/walls.js';
import { tileKey } from '../game/stones.js';

export function validateRoofState(state,registry,check){
  const p=state.player,buildings=state.buildings.map(b=>({...b,definition:registry.require(b.type),tiles:buildingTiles(b,registry.require(b.type))})),byId=new Map(buildings.map(b=>[b.id,b]));
  check(Object.hasOwn(p,'roofOrder'));
  if(p.roofOrder){
    const goal=byId.get(p.roofOrder.buildingId);
    check(p.roofOrder.kind==='enter'&&goal&&buildingIsComplete(goal)&&(isWall(goal)||isRoofAccess(goal))&&['ground','enteringTower'].includes(p.state));
    const entry=byId.get(p.state==='enteringTower'?p.currentTowerId:p.order?.buildingId);check(entry&&buildingIsComplete(entry)&&isRoofAccess(entry)&&findRoofPath(buildings,entry,goal)!==null);
    if(p.state==='ground')check(p.order?.kind==='enter');
  }
  const access=byId.get(p.currentTowerId);
  if(['enteringTower','onTower','exitingTower'].includes(p.state))check(access&&isRoofAccess(access));
  if(p.state==='exitingTower')check(roofAccessNeighbors(access).some(t=>tileKey(t)===tileKey(p.exitTile)));
  if(p.state!=='onWall'){check(!p.roofContinuation);return;}
  const roof=roofIndex(buildings),node=roof.get(tileKey(p.tile));check(node?.id===p.currentTowerId);
  let previous=p.tile;
  for(const tile of [p.nextTile,...p.path].filter(Boolean)){
    check(roof.has(tileKey(tile))&&Math.abs(tile.x-previous.x)+Math.abs(tile.y-previous.y)===1);previous=tile;
  }
  if(p.roofContinuation){
    const exitAccess=byId.get(p.roofContinuation.accessId);
    check(exitAccess&&isRoofAccess(exitAccess)&&tileKey(previous)===tileKey(exitAccess));
    check(roofAccessNeighbors(exitAccess).some(t=>t.x===p.roofContinuation.exit?.x&&t.y===p.roofContinuation.exit?.y));
  }
}
