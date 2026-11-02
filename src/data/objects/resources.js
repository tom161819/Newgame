export const resources = [
  {
    id: 'stone', name: 'Kámen', inventoryLabel: 'Kameny', symbol: '🪨', quantityNames: ['kámen', 'kameny', 'kamenů'], category: 'resource', sprite: '/assets/resources/stone/stone.png',
    width: 1, height: 1, walkable: true, collectible: true, buildable: false, cost: {}, interactions: ['collect'],
    description: 'Stavební kámen. Král ho sebere po příchodu na políčko.',
    renderMode: 'procedural', renderer: 'stone', origin: { x: 0.5, y: 0.65 }, visualHeight: 20,
    visual: { offsetY: -4, hitArea: { x: -14, y: -12, width: 28, height: 22 } },
    shadow: { baked: true, x: 0, y: 7, width: 28, height: 11, color: 0x322e20, alpha: 0.35 }, depth: { offset: 0.05 },
    spawn: { initial: 30, interval: 20000, max: 80 },
  },
];
