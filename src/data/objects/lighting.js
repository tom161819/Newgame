// Light sources the player can build. Sprites come from approved Asset Studio
// exports; flames are a runtime layer and `lights` already describe the glow for
// the future day/night light map (see docs/art/ASSET_STUDIO.md).
export const lightingBuildings = [
  {
    id: 'brazier', name: 'Brazier', category: 'building', buildingCategory: 'infrastructure',
    sprite: '/assets/buildings/brazier/torch-post-brazier.v1.png', artSource: 'art/sprites/torch-post/torch-post-brazier.v1.json',
    width: 1, height: 1, walkable: false, collectible: false, buildable: true, cost: { stone: 3 }, constructionTime: 8000,
    interactions: [], description: 'Kamenná pánev s ohněm. Osvětlí okolí, až hra dostane noc.',
    renderMode: 'sprite', origin: { x: 0.49254, y: 0.96721 }, visualHeight: 59, depth: { offset: 0 },
    lights: [{ type: 'brazier', x: 0, y: -56.37, color: '#ff9d4a', radius: 134.4, intensity: 1, flicker: { amplitude: 0.16, speed: 5.5 }, flameSize: 1.6 }],
  },
];
