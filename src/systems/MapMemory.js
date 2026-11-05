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
  // Performance: visiting every visible tile each frame cost milliseconds. When only sight moved by one step
  // (fog.added/removed) and nothing else changed, only the newly seen tiles and their neighbours (whose path links
  // depend on sight) are refreshed; a change of wear, pavement, season, map or Fog mode refreshes everything in sight.
  observeTerrain(grid,wear,season,map=grid,worldRevision=null){
    const world=worldRevision==null?null:`${this.fog.enabled}|${wear?.levelRevision??0}|${season}|${worldRevision}`,fog=this.fog;
    let indices=fog.visibleIndices;
    if(world!==null&&world===this.terrainWorld){
      if(fog.revision===this.terrainFogRevision)return [];
      if(fog.revision===this.terrainFogRevision+1){
        const set=new Set(),w=fog.width;
        for(const index of [...fog.added,...fog.removed]){const x=index%w,y=Math.floor(index/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const n=(y+dy)*w+x+dx;if(x+dx>=0&&x+dx<w&&fog.visibleIndices.has(n))set.add(n);}}
        indices=set;
      }
    }
    this.terrainWorld=world;this.terrainFogRevision=fog.revision;
    const changed=[];
    for(const index of indices){
      const tile={x:index%this.fog.width,y:Math.floor(index/this.fog.width)},value=grid[tile.y]?.[tile.x];
      if(value===undefined)continue;
      this.fog.explored[index]=1;
      const previous=this.terrain.get(index);let connections=0;
      if(wear)for(const [bit,[dx,dy]]of MEMORY_DIRECTIONS.entries()){
        const next={x:tile.x+dx,y:tile.y+dy};
        const cornersVisible=!dx||!dy||this.fog.isInSightTile({x:tile.x+dx,y:tile.y})&&this.fog.isInSightTile({x:tile.x,y:tile.y+dy});
        if(this.fog.isInSightTile(next)?cornersVisible&&wear.level(next)>0&&canStep(map,tile,next):(previous?.[3]??0)&(1<<bit))connections|=1<<bit;
      }
      const level=wear?.level(tile)??0,paved=wear?.isPaved?.(tile)?1:0;
      if(!previous||previous[0]!==value||previous[1]!==level||previous[2]!==season||previous[3]!==connections||previous[4]!==paved){this.terrain.set(index,[value,level,season,connections,paved]);changed.push(tile);}
    }
    if(changed.length)this.revision++;
    return changed;
  }
  terrainAt(tile,grid,wear,season){
    const fog=this.fog;
    if(fog.enabled){
      const remembered=this.terrain.get(tile.y*fog.width+tile.x);if(remembered)return remembered;
    }
    return [grid[tile.y]?.[tile.x]??0,wear?.level(tile)??0,season,0,wear?.isPaved?.(tile)?1:0];
  }
  exportState(){
    return {version:1,explored:Array.from(this.fog.explored.entries()).filter(([,value])=>value).map(([index])=>index),
      terrain:[...this.terrain].sort(([a],[b])=>a-b).map(([index,value])=>[index,[...value]]),
      objects:[...this.objects.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(entry=>structuredClone(entry))};
  }
  importState(data){
    this.fog.explored.fill(0);this.terrain.clear();this.objects.clear();this.objectSignatures.clear();
    for(const index of data?.explored??[])this.fog.explored[index]=1;
    for(const [index,value]of data?.terrain??[])this.terrain.set(index,[...value]);
    for(const entry of data?.objects??[]){const snapshot=structuredClone(entry);this.objects.set(entry.key,snapshot);this.objectSignatures.set(entry.key,JSON.stringify(snapshot));}
    // Recalculate the actual loaded king before calling this method. Legacy
    // saves discover only this circle, even if their testing Fog switch is OFF.
    for(const index of this.fog.visibleIndices)this.fog.explored[index]=1;
    this.revision++;
  }
}
