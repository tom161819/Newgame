import { buildingDefinition,buildingIsComplete } from './buildings.js';

// Owner 20 Nov 2026 (point 2 of the defence list): finished Stakes and Moat tiles slow whoever crosses them – riders
// and wheels (carts, the Catapult, later the ram) far more than men on foot. Pathfinding uses the same factor, so
// people walk round a short row and an attacker who must cross is slowed under the archers.
export function defenseTiles(scene){
  const key=`${scene.buildings.length}:${scene.constructionSystem?.revision??0}`;if(scene.defenseTileKey===key)return scene.defenseTileMap;
  const map=new Map();for(const b of scene.buildings){const d=buildingDefinition(b);if(d?.defense&&buildingIsComplete(b))map.set(`${b.x},${b.y}`,d.defense);}
  scene.defenseTileKey=key;scene.defenseTileMap=map;return map;
}
export const isMounted=(scene,actor)=>!!(actor?.mountedHorse||actor?.definition?.gameplay?.mounted||scene.military?.mounted?.(actor));
export const onWheels=(scene,actor)=>!!(actor?.vehicle||actor?.definition?.gameplay?.wheels||scene.military?.spec?.(actor)?.vehicle);
export function defenseSpeed(scene,actor,tile){
  const d=defenseTiles(scene).get(`${tile.x},${tile.y}`);if(!d||actor?.onWall)return 1;
  return onWheels(scene,actor)?d.wheels:isMounted(scene,actor)?d.mounted:d.speed;
}
