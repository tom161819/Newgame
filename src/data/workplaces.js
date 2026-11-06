export const WORKPLACE_RULES=Object.freeze({collectMeatDuration:700,patrolRadius:5,patrolWaitMin:2000,patrolWaitMax:4500});
export const WORKPLACES=Object.freeze({
  iron_mine:Object.freeze({capacity:3,profession:'miner',skill:'mining'}),
  lumberjack_hut:Object.freeze({capacity:3,profession:'woodcutter',skill:'woodcutting'}),
  quarry:Object.freeze({capacity:3,profession:'miner',skill:'mining',staffingOutput:Object.freeze([0,.2,.5,1])}),
  hunting_lodge:Object.freeze({capacity:2,profession:'hunter',skill:'hunting'}),
  barracks:Object.freeze({capacity:5,profession:'soldier',skill:'combat'}),
  farmhouse:Object.freeze({capacity:3,profession:'farmer',skill:'farming'}),
  smelter:Object.freeze({capacity:2,profession:'smelter_operator',skill:'smelting'}),
  mill:Object.freeze({capacity:2,profession:'miller',skill:'milling'}),
  bakery:Object.freeze({capacity:2,profession:'baker',skill:'baking'}),
  bowyer:Object.freeze({capacity:2,profession:'bowyer',skill:'crafting'}),
  stables:Object.freeze({capacity:2,profession:'stablehand',skill:'hunting'}),
  wheelwright_workshop:Object.freeze({capacity:2,profession:'wheelwright',skill:'crafting'}),
  swordsmith:Object.freeze({capacity:2,profession:'swordsmith',skill:'crafting'}),
  armorer:Object.freeze({capacity:2,profession:'armorer',skill:'crafting'}),
});

// Curves describe total output relative to a full workplace of equal-skill workers.
export function validStaffing(spec){
  return Number.isSafeInteger(spec?.capacity)&&spec.capacity>=1&&spec.capacity<=50&&(spec.staffingOutput===undefined||Array.isArray(spec.staffingOutput)&&spec.staffingOutput.length===spec.capacity+1&&spec.staffingOutput[0]===0&&spec.staffingOutput.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
}
export function staffingOutput(spec,present){
  const count=Math.max(0,Math.min(spec.capacity,Math.floor(present)));
  return spec.staffingOutput?.[count]??count/spec.capacity;
}
export function staffingWorkFactor(spec,present){
  return present>0?spec.capacity*staffingOutput(spec,present)/present:0;
}
