// Independent group limits. FoodStorageSystem remains the only stock/reservation owner.
export const GRANARY_GROUP_CAPACITY=Object.freeze({raw:200,food:200});

// The Granary registry definition decides what it accepts; resource metadata
// decides whether that accepted good is an edible finished food or a raw input.
export function granaryGroup(resourceId,registry){
  const resource=registry.get(resourceId),allowed=registry.get('granary')?.storage?.resources;
  if(resource?.category!=='resource'||!allowed?.includes(resourceId))return null;
  return resource.edible===true?'food':'raw';
}

// A pure view of existing quantities, with no stock creation, reservation or transfer.
export function granaryUsage(stock,registry){
  const usage={raw:0,food:0};
  for(const [resource,amount]of Object.entries(stock)){
    const group=granaryGroup(resource,registry);
    if(!group||!Number.isSafeInteger(amount)||amount<0)throw new Error('Invalid Granary quantity.');
    usage[group]+=amount;if(!Number.isSafeInteger(usage[group]))throw new Error('Invalid Granary quantity.');
  }
  return usage;
}
