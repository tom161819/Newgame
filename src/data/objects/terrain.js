export const terrain = [
  {
    id: 'grass', name: 'Tráva', category: 'terrain', sprite: '/assets/terrain/grass/grass.png',
    width: 1, height: 1, walkable: true, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Suchá tráva na průchozím izometrickém políčku.',
    renderMode: 'procedural', renderer: 'terrain', origin: { x: 0.5, y: 0.5 }, visualHeight: 0,
    visual: { colors: [0xaaa375, 0xa6a06e, 0x9fa06c] }, depth: { offset: -100 },
  },
  {
    id: 'dirt', name: 'Hlína', category: 'terrain', sprite: '/assets/terrain/dirt/dirt.webp',
    width: 1, height: 1, walkable: true, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Udusaná zem a písčité odstíny krajiny.',
    renderMode: 'procedural', renderer: 'terrain', origin: { x: 0.5, y: 0.5 }, visualHeight: 0,
    visual: { colors: [0xb4a578, 0xb2aa7c, 0xa4a271] }, depth: { offset: -100 },
  },
];
