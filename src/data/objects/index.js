import { terrain } from './terrain.js';
import { resources } from './resources.js';
import { buildings } from './buildings.js';
import { characters } from './characters.js';
import { decorations } from './decorations.js';
import { animals } from './animals.js';
import { equipment } from './equipment.js';
import { treasures } from './treasures.js';
import { farmingBuildings,farmingResources } from './farming.js';

export const objectDefinitions = [...terrain, ...resources, ...farmingResources, ...buildings, ...farmingBuildings, ...characters, ...decorations, ...animals, ...equipment, ...treasures];
