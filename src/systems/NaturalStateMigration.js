import { emptyNaturalState } from '../data/naturalResources.js';
import { materialResources,storageResources } from '../data/logistics.js';
import { buildingIsComplete } from '../game/buildingState.js';

export function migrateNaturalState(state,registry){
  state.naturalResources??=emptyNaturalState();state.naturalResources.nextDepositId??=1;
  for(const building of state.buildings??[])if(building.type==='quarry')building.quarryMode??=buildingIsComplete(building)?'legacy':'unbound';
  for(const location of state.foodStorage?.locations??[]){
    if(!['storage','fallback'].includes(location.kind))continue;const b=state.buildings?.find(b=>b.id===location.buildingId),d=b&&registry.get(b.type);
    if(d?.storage?.accepts)location.allowed=storageResources(d,registry);
    else if(location.id==='legacy-materials'&&location.buildingId==null)location.allowed=materialResources(registry);
  }
}
