import { WORKPLACES } from '../workplaces.js';
import { MINING_WORK } from '../minerals.js';
export const buildings = [
  {
    // Approved Asset Studio sprite (art/sprites/watchtower/watchtower-square.v1.json); TowerView stays the fallback.
    id: 'tower', name: 'Stone Tower', category: 'building', buildingCategory:'defense', sprite: '/assets/buildings/tower/watchtower-square.v1.png',
    frontSprite: '/assets/buildings/tower/watchtower-square.v1.front.png', artSource: 'art/sprites/watchtower/watchtower-square.v1.json',
    visibility: { multiplier: 2 },
    width: 2, height: 2, walkable: false, collectible: false, buildable: true,
    cost: { stone: 10 }, interactions: ['enter', 'exit'], description: 'Kamenná strážní věž s horní plošinou a cimbuřím.',
    constructionTime:20000,
    renderMode: 'sprite', renderer: 'tower', origin: { x: 0.39634, y: 0.99107 }, frontOrigin: { x: 0.39634, y: 0.99107 }, visualHeight: 222,
    platform: { x: 0, y: -183.28 }, depth: { offset: 0 },
    lights: [{ type: 'torch', x: -15.88, y: -72.15, color: '#ffb25a', radius: 102.4, intensity: 0.95, flicker: { amplitude: 0.12, speed: 7 }, flameSize: 1 }],
    shadow: { baked: true, x: 8, y: -20, width: 114, height: 43, color: 0x30291c, alpha: 0.3 },
  },
  {
    id:'castle',name:'Castle',category:'building',buildingCategory:'defense',sprite:'/assets/buildings/castle/castle.svg',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:10},maxCount:1,
    constructionTime:45000,
    production:{resource:'gold',amount:5,interval:'day',label:'Castle income'},
    interactions:['enter','exit'],description:'Kamenná pevnost s horní plošinou a cimbuřím. Z plošiny poskytuje o 75 % větší dohled.',
    visibility:{multiplier:1.75},renderMode:'procedural',renderer:'fortification',
    origin:{x:.5,y:238/250},visualHeight:235,platform:{x:0,y:-168},depth:{offset:0},
    visual:{wallHeight:120},
    shadow:{baked:true,x:12,y:-25,width:190,height:70,color:0x30291c,alpha:.3},
  },
  {
    id:'wall',name:'Stone Wall',category:'building',buildingCategory:'defense',sprite:'/assets/buildings/wall/wall.svg',
    width:1,height:1,walkable:false,collectible:false,buildable:true,cost:{stone:1},
    constructionTime:5000,
    interactions:['enter','exit','walk_top'],description:'Spojitelná kamenná hradba. Tažením postavíš rovnou řadu a po vrcholu lze chodit mezi spojenými segmenty.',
    visibility:{multiplier:1.75},navigation:{walkableTop:true},construction:{mode:'line'},
    renderMode:'procedural',renderer:'fortification',origin:{x:.5,y:118/130},visualHeight:125,
    platform:{x:0,y:-84},depth:{offset:0},visual:{wallHeight:68},
    shadow:{baked:true,x:8,y:-8,width:65,height:24,color:0x30291c,alpha:.3},
  },
  ...[
    {id:'quarry',name:'Quarry',buildingCategory:'industry',width:3,height:3,cost:{stone:15},constructionTime:30000,visualHeight:95,description:'Kamenolom se třemi místy pro horníky. Musí překrývat skutečné kamenné ložisko a mít dostupný přístup. Těží pouze svou přiřazenou konečnou zásobu.'},
    {id:'hunting_lodge',name:'Hunting Lodge',buildingCategory:'food',menuOrder:50,requiresCompletedBuildings:['granary'],unlockDescription:'Requires a completed Granary before placing new Hunting Lodges.',width:2,height:2,cost:{stone:10},constructionTime:25000,visualHeight:110,description:'Lovecká chata pro dva lovce. Lovci přinášejí maso ze skutečných úlovků.'},
    {id:'barracks',name:'Barracks',buildingCategory:'defense',width:3,height:3,cost:{stone:20},constructionTime:40000,visualHeight:125,kit:{capacity:10},description:'Kasárna s pěti místy pro stávající poddané. Vojáci hlídkují v okolí.'},
  ].map(d=>({...d,category:'building',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,buildable:true,
    interactions:['manage_workers'],renderMode:'procedural',renderer:'workplace',origin:{x:.5,y:.9},depth:{offset:0},
    workplace:WORKPLACES[d.id],...(d.id==='quarry'?{mining:MINING_WORK.quarry}:{}),shadow:{baked:true,x:12,y:-15,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}})),
];
