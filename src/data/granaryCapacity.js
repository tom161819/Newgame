// Independent group limits. FoodStorageSystem remains the only stock/reservation owner.
// Owner 7 Nov 2026 (m-suroviny-sklady-zlato-zelezo): 1000 raw food goods and 1000 finished food (was 200 / 200).
// farmhouse-store (owner 8 Nov 2026): the raw goods (Wheat, Flour) moved to Farmhouse stores, so only the food group is left.
export const GRANARY_GROUP_CAPACITY=Object.freeze({food:1000});

// The Granary registry definition decides what it accepts; resource metadata
// decides whether that accepted good is an edible finished food or a raw input.
export function granaryGroup(resourceId,registry){
  const resource=registry.get(resourceId),allowed=registry.get('granary')?.storage?.resources;
  if(resource?.category!=='resource'||!allowed?.includes(resourceId))return null;
  const group=resource.edible===true?'food':'raw';return GRANARY_GROUP_CAPACITY[group]!=null?group:null;
}

// A pure view of existing quantities, with no stock creation, reservation or transfer.
export function granaryUsage(stock,registry){
  const usage=Object.fromEntries(Object.keys(GRANARY_GROUP_CAPACITY).map(group=>[group,0]));
  for(const [resource,amount]of Object.entries(stock)){
    const group=granaryGroup(resource,registry);
    if(!group||!Number.isSafeInteger(amount)||amount<0)throw new Error('Invalid Granary quantity.');
    usage[group]+=amount;if(!Number.isSafeInteger(usage[group]))throw new Error('Invalid Granary quantity.');
  }
  return usage;
}
