import { CONSTRUCTION_RULES } from '../data/construction.js';
import { buildingDefinition } from '../game/buildings.js';

export function initializeConstructionSite(building){
  const d=buildingDefinition(building);building.construction={state:'planned',requiredWork:d.constructionTime??CONSTRUCTION_RULES.defaultTime,
    workDone:0,progress:0,investedMaterials:structuredClone(d.cost),contributions:{},assignedBuilders:[],rewardsGranted:false};return building;
}
