// Light sources the player can build. Sprites come from approved Asset Studio
// exports; flames are a runtime layer and `lights` already describe the glow for
// the future day/night light map (see docs/art/ASSET_STUDIO.md).
import { TORCHES } from '../torches.js';

export const lightingBuildings = [
  {
    id: 'brazier', name: 'Brazier', category: 'building', buildingCategory: 'infrastructure',
    sprite: '/assets/buildings/brazier/torch-post-brazier.v1.png', artSource: 'art/sprites/torch-post/torch-post-brazier.v1.json',
    width: 1, height: 1, walkable: false, collectible: false, buildable: true, cost: { stone: 3 }, constructionTime: 8000,
    interactions: [], description: 'A stone fire basin. It lights its surroundings at night.',
    renderMode: 'sprite', origin: { x: 0.49254, y: 0.96721 }, visualHeight: 59, depth: { offset: 0 },
    lights: [{ type: 'brazier', x: 0, y: -56.37, color: '#ff9d4a', radius: 134.4, intensity: 1, flicker: { amplitude: 0.16, speed: 5.5 }, flameSize: 1.6 }],
    // Day and night N2: burns 1 Wood a night (store of 2), brought by Haulers.
    fuel: TORCHES.places.brazier,
  },
  {
    // Day and night N2: approved Studio torch post (art/sprites/torch-post/torch-post-iron.v1.json); 1 Torch a night.
    id: 'torch_post', name: 'Torch Post', category: 'building', buildingCategory: 'infrastructure',
    sprite: '/assets/buildings/torch_post/torch-post-iron.v1.png', artSource: 'art/sprites/torch-post/torch-post-iron.v1.json',
    width: 1, height: 1, walkable: false, collectible: false, buildable: true, cost: { wood: 2, stone: 1 }, constructionTime: 6000,
    interactions: [], description: 'An iron post with a torch. Lights 5 tiles around it at night; burns 1 Torch a night.',
    renderMode: 'sprite', origin: { x: 0.49254, y: 0.97778 }, visualHeight: 88, depth: { offset: 0 },
    lights: [{ type: 'torch', x: 0, y: -82.23, color: '#ffb25a', radius: 102.4, intensity: 0.95, flicker: { amplitude: 0.12, speed: 7 }, flameSize: 1 }],
    fuel: TORCHES.places.torch_post,
  },
  {
    // Day and night N3: a campfire anywhere with local wood (a tree or a bush within 6 tiles); nothing from the stores.
    // Burns one night (wolves keep away from it), then ashes for a day. Provisional drawing until the Studio art.
    id: 'campfire', name: 'Campfire', category: 'building', buildingCategory: 'infrastructure', sprite: '/assets/buildings/campfire/campfire.svg',
    width: 1, height: 1, walkable: false, collectible: false, buildable: true, cost: {}, constructionTime: 5000, repeatPlacement: false,
    interactions: [], description: 'A fire of brushwood gathered on the spot. Burns one night; wolves keep away from its light.',
    renderMode: 'procedural', renderer: 'campfire', origin: { x: 0.5, y: 0.8 }, visualHeight: 30, depth: { offset: 0 },
    campfire: { woodRange: 6, radius: 5 },
    lights: [{ type: 'campfire', x: 0, y: -10, color: '#ff9a3c', radius: 160, intensity: 1, flicker: { amplitude: 0.2, speed: 6 }, flameSize: 1.3 }],
  },
  {
    // Day and night N3: what a burnt-down building leaves (approved Studio art burnt-building-timber, 2×2). Not built by
    // the player; it can be demolished like any building.
    id: 'burnt_ruins', name: 'Burnt Ruins', category: 'building', buildingCategory: 'infrastructure', sprite: '/assets/buildings/burnt_ruins/burnt-building-timber.v1.png',
    artSource: 'art/sprites/burnt-building/burnt-building-timber.v1.json', width: 2, height: 2, walkable: false, collectible: false, buildable: false, cost: {}, constructionTime: 8000/* demolition work for a Builder (owner 13 Nov 2026) */,
    interactions: [], description: 'The charred remains of a building that burnt down.', renderMode: 'sprite', origin: { x: 0.48507, y: 0.98058 }, visualHeight: 101, depth: { offset: 0 },
  },
];
