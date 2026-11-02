import { terrain } from './terrain.js';
import { resources } from './resources.js';
import { buildings } from './buildings.js';
import { characters } from './characters.js';
import { decorations } from './decorations.js';
import { animals } from './animals.js';

export const objectDefinitions = [...terrain, ...resources, ...buildings, ...characters, ...decorations, ...animals];
