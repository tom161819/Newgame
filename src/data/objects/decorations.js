export const decorations = [
  {
    id: 'rock_outcrop', name: 'Skalní překážka', category: 'decoration', sprite: '/assets/decorations/rocks/rock-outcrop.webp',
    width: 1, height: 1, walkable: false, collectible: false, buildable: false, cost: {}, interactions: [],
    description: 'Pevná skalní překážka, kterou král musí obejít. Není určena ke sběru.',
    renderMode: 'sprite', renderer: 'outcrop', origin: { x: 0.5, y: 0.72 }, visualHeight: 38, depth: { offset: 0.05 },
    shadow: { baked: true, x: 1, y: 1, width: 52, height: 17, color: 0x302d20, alpha: 0.3 },
  },
];
