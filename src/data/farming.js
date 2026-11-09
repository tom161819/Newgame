export const FARMING_RULES = Object.freeze({
  workRadius: 15,
  tending: Object.freeze({harvestCheck:250,poseDuration:2500,travelTimeout:15000,maxPlots:12}),
  refreshInterval: 1000,
  // m-jidlo-balanc (playtest 0.76.0 #3): fields and orchards +20 % – crops grow 1.2× faster (more harvests a season; the
  // amount per harvest stays, so a harvest saved in progress keeps its reservation).
  growthRate: 1.2,
  crops: Object.freeze({
    wheat_field: Object.freeze({ resource: 'wheat', growthDays: 2, yield: 10, workDuration: 4000, xp: 8,
      stages: ['Prepared soil', 'Young wheat', 'Growing wheat', 'Ripe wheat'] }),
    orchard: Object.freeze({ resource: 'apple', growthDays: 3, yield: 8, workDuration: 5000, xp: 10,
      stages: ['Resting trees', 'Blossoming trees', 'Small fruit', 'Ripe apples'] }),
  }),
});
// Owner decision 8 Nov 2026 (farmhouse-store): every Farmhouse keeps a store for grain – Wheat and Flour only, 200 units
// together. Farmers bring the harvest here, Haulers supply the Mill and the Bakery from it and take the Mill's Flour
// back. The Granary no longer takes Wheat or Flour; the Starter Stockpile still does (fallback while no Farmhouse has room).
export const FARMHOUSE_STORE = Object.freeze({ capacity: 200, resources: Object.freeze(['wheat', 'flour']) });
export const cropStage = (growth, required) => growth>=required-1e-8?3:Math.min(2,Math.floor(Math.max(0,growth)/required*3+1e-9));
