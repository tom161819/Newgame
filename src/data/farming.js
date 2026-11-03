export const FARMING_RULES = Object.freeze({
  workRadius: 15,
  refreshInterval: 1000,
  crops: Object.freeze({
    wheat_field: Object.freeze({ resource: 'wheat', growthDays: 2, yield: 8, workDuration: 4000, xp: 8,
      stages: ['Prepared soil', 'Young wheat', 'Growing wheat', 'Ripe wheat'] }),
    orchard: Object.freeze({ resource: 'apple', growthDays: 3, yield: 6, workDuration: 5000, xp: 10,
      stages: ['Resting trees', 'Blossoming trees', 'Small fruit', 'Ripe apples'] }),
  }),
});
export const cropStage = (growth, required) => growth>=required-1e-8?3:Math.min(2,Math.floor(Math.max(0,growth)/required*3+1e-9));
