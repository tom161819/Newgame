export const characters = [
  {
    id: 'king', name: 'Král', category: 'character', sprite: '/assets/characters/king/king.png',
    width: 1, height: 1, walkable: false, collectible: false, buildable: false, cost: {}, interactions: ['move', 'collect', 'enter', 'exit'],
    description: 'Korunovaný vládce s červeným pláštěm. Chodí v osmi směrech, sbírá suroviny a vstupuje do věží.',
    renderMode: 'procedural', renderer: 'king', origin: { x: 0.5, y: 0.875 }, visualHeight: 55,
    shadow: { baked: true, x: 0, y: 1, width: 27, height: 12, color: 0x30291c, alpha: 0.32 }, depth: { offset: 0.1 },
    gameplay: { movementSpeed: 3.5, baseSight: 20 },
    experience:{initialLevel:1,maxLevel:50,enabled:true,gainMultiplier:1},
    stats: { maxHP: 100, attackDPS: 15, armor: 0, attackRange: 1, hpRegenPerSecond: 0.2 },
    animations: { mode: 'procedural', states: ['idle', 'walk'], directions: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] },
  },
];
