import { buildingDefinition } from '../game/buildings.js';
import { findPathToAny } from '../game/pathfinding.js';

// One immediate ring, including diagonal corners; not a large exclusion radius.
export const WILDLIFE_BUILDING_MARGIN=1;
export const keepsWildlifeClearance=animal=>animal.definition.gameplay.huntable===true;

// Derived navigation only. Shared terrain, saves, fog and royal/worker routes
// are never changed. Rebuild the small mask only when building footprints change.
export class WildlifeClearance {
  constructor(scene){this.scene=scene;this.signature=null;this.blocked=new Set();this.revision=0;}
  refresh(){
    const buildings=(this.scene.buildings??[]).filter(b=>!b.unverified&&!buildingDefinition(b).walkable);
    const signature=buildings.map(b=>{const d=buildingDefinition(b);return `${b.id}:${b.type}:${b.x}:${b.y}:${d.width}:${d.height}`;}).join('|');
    if(signature===this.signature)return false;this.signature=signature;this.blocked.clear();this.revision++;
    const map=this.scene.map,m=WILDLIFE_BUILDING_MARGIN;
    for(const b of buildings){const d=buildingDefinition(b);for(let y=Math.max(0,b.y-m);y<Math.min(map.length,b.y+d.height+m);y++)for(let x=Math.max(0,b.x-m);x<Math.min(map[0].length,b.x+d.width+m);x++)this.blocked.add(y*map[0].length+x);}
    return true;
  }
  isClear(tile){const map=this.scene.map;return map[tile.y]?.[tile.x]===0&&!this.blocked.has(tile.y*map[0].length+tile.x);}
  navigation(){
    const map=[...this.scene.map],width=map[0].length,rows=new Set();
    for(const index of this.blocked){const y=Math.floor(index/width),x=index%width;if(!rows.has(y)){map[y]=[...map[y]];rows.add(y);}map[y][x]=1;}
    return map;
  }
  route(animal,goal){return this.isClear(goal)?findPathToAny(this.navigation(),animal.nextTile??animal.tile,[goal]):null;}
  escape(animal){
    const map=this.scene.map,start=animal.nextTile??animal.tile,limit=Math.max(map.length,map[0].length);
    // Reuse the authoritative pathfinder to leave a newly placed building's
    // margin. Stop at the first safe tile, even if the route later re-enters it.
    for(let radius=1;radius<limit;radius++){
      const goals=[];for(let y=Math.max(0,start.y-radius);y<=Math.min(map.length-1,start.y+radius);y++)for(let x=Math.max(0,start.x-radius);x<=Math.min(map[0].length-1,start.x+radius);x++)if(Math.max(Math.abs(x-start.x),Math.abs(y-start.y))===radius&&this.isClear({x,y}))goals.push({x,y});
      if(!goals.length)continue;const route=findPathToAny(map,start,goals);if(!route)continue;
      const first=route.path.findIndex(tile=>this.isClear(tile));if(first<0)continue;
      const path=route.path.slice(0,first+1);return {...route,path,destination:path.at(-1)};
    }
    return null;
  }
}
