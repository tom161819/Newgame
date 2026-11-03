import { canStep } from '../game/pathfinding.js';
export const MEMORY_DIRECTIONS=Object.freeze([[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]);

// Visual knowledge only. Pathfinding, work, resources and collision never read it.
export class MapMemory {
  constructor(fog){this.fog=fog;this.terrain=new Map();this.objects=new Map();this.objectSignatures=new Map();this.revision=0;}
  observeObjects(entries){
    const actual=new Map(entries.map(entry=>[entry.key,entry]));let changed=false;
    for(const [key,known]of this.objects)if(this.fog.isInSightObject(known)){
      const now=actual.get(key);
      if(!now||!this.fog.isInSightObject(now)){this.objects.delete(key);this.objectSignatures.delete(key);changed=true;}
    }
    for(const entry of entries){
      if(!this.fog.isInSightObject(entry))continue;
      const signature=JSON.stringify(entry);
      if(signature===this.objectSignatures.get(entry.key))continue;
      this.objects.set(entry.key,structuredClone(entry));this.objectSignatures.set(entry.key,signature);changed=true;
    }
    if(changed)this.revision++;
    return changed;
  }
  observeTerrain(grid,wear,season,map=grid){
    const changed=[];
    for(const index of this.fog.visibleIndices){
      const tile={x:index%this.fog.width,y:Math.floor(index/this.fog.width)},value=grid[tile.y]?.[tile.x];
      if(value===undefined)continue;
      const previous=this.terrain.get(index);let connections=0;
      if(wear)for(const [bit,[dx,dy]]of MEMORY_DIRECTIONS.entries()){
        const next={x:tile.x+dx,y:tile.y+dy};
        if(this.fog.isInSightTile(next)?wear.level(next)>0&&canStep(map,tile,next):(previous?.[3]??0)&(1<<bit))connections|=1<<bit;
      }
      const data=[value,wear?.level(tile)??0,season,connections];
      if(!previous||data.some((value,i)=>value!==previous[i])){this.terrain.set(index,data);changed.push(tile);}
    }
    if(changed.length)this.revision++;
    return changed;
  }
  terrainAt(tile,grid,wear,season){
    const fog=this.fog;
    if(fog.enabled){
      const remembered=this.terrain.get(tile.y*fog.width+tile.x);if(remembered)return remembered;
    }
    return [grid[tile.y]?.[tile.x]??0,wear?.level(tile)??0,season];
  }
}
