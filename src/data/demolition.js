export const demolitionRefund=definition=>Object.fromEntries(Object.entries(definition.cost).map(([id,n])=>[id,Math.floor(n/2)]).filter(([,n])=>n>0));
