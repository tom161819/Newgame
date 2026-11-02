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
  {
    id:'meat',name:'Meat',inventoryLabel:'Meat',symbol:'🥩',quantityNames:['maso','masa','masa'],
    category:'resource',sprite:'/assets/resources/meat/meat.svg',width:1,height:1,
    walkable:true,collectible:true,buildable:false,cost:{},interactions:['collect'],
    description:'Maso z ulovené zvěře. Množství je uložené v každém balíčku a připíše se až po sebrání.',
    renderMode:'sprite',origin:{x:.5,y:.75},visualHeight:24,
    visual:{displayWidth:28,displayHeight:28},depth:{offset:.08},
    shadow:{baked:false,x:0,y:3,width:28,height:11,color:0x30291c,alpha:.3},
    consumption:{amount:1,interval:60000},
  },
];
