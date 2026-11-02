export const buildings = [
  {
    id: 'tower', name: 'Stone Tower', category: 'building', sprite: '/assets/buildings/tower/tower.png',
    visibility: { multiplier: 2 },
    width: 2, height: 2, walkable: false, collectible: false, buildable: true,
    cost: { stone: 10 }, interactions: ['enter', 'exit'], description: 'Kamenná strážní věž s horní plošinou a cimbuřím.',
    renderMode: 'procedural', renderer: 'tower', origin: { x: 0.5, y: 0.91 }, visualHeight: 166,
    platform: { x: 0, y: -118 }, depth: { offset: 0 },
    shadow: { baked: true, x: 8, y: -20, width: 114, height: 43, color: 0x30291c, alpha: 0.3 },
  },
];
