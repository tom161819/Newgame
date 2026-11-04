import { terrain } from './terrain.js';
import { resources } from './resources.js';
import { buildings } from './buildings.js';
import { characters } from './characters.js';
import { decorations } from './decorations.js';
import { animals } from './animals.js';
import { equipment } from './equipment.js';
import { treasures } from './treasures.js';
import { farmingBuildings,farmingResources } from './farming.js';
import { foodBuildings,processedFoodResources } from './foodProduction.js';
import { logisticsBuildings,materialDefinitions } from './logistics.js';
import { naturalDefinitions,forestryBuildings } from './naturalResources.js';
import { mineralDefinitions,mineralBuildings } from './minerals.js';
import { lightingBuildings } from './lighting.js';
import { smeltingDefinitions } from './smelting.js';
import { withApprovedArt } from './approvedArt.js';

export const objectDefinitions = [...terrain, ...resources,...naturalDefinitions, ...farmingResources,...processedFoodResources,...materialDefinitions,...mineralDefinitions, ...buildings, ...farmingBuildings,...foodBuildings,...logisticsBuildings,...forestryBuildings,...mineralBuildings,...lightingBuildings,...smeltingDefinitions, ...characters, ...decorations, ...animals, ...equipment, ...treasures].map(withApprovedArt);
