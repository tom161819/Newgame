// A building's paid price: what its construction site booked when it was placed (investedMaterials). Buildings without a
// construction record (the starting Castle and Stockpile, legacy buildings) use the definition's price. Since 0.9.4 a
// price can be changed in the Asset Library, so a standing building is never revalued by a later price change.
export const paidCost=(building,definition)=>building?.construction?.investedMaterials??definition.cost;
export const refundOf=cost=>Object.fromEntries(Object.entries(cost).map(([id,n])=>[id,Math.floor(n/2)]).filter(([,n])=>n>0));
export const demolitionRefund=definition=>refundOf(definition.cost);
// Demolition returns half of what the building really cost.
// Owner 15 Nov 2026 (59): a building being moved returns nothing (the move is paid as half a new building).
export const buildingDemolitionRefund=(building,definition)=>building?.relocation?{}:refundOf(paidCost(building,definition));
