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
  {
    id:'castle',name:'Castle',category:'building',sprite:'/assets/buildings/castle/castle.svg',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:10},
    interactions:['enter','exit'],description:'Kamenná pevnost s horní plošinou a cimbuřím. Z plošiny poskytuje o 75 % větší dohled.',
    visibility:{multiplier:1.75},renderMode:'procedural',renderer:'fortification',
    origin:{x:.5,y:238/250},visualHeight:235,platform:{x:0,y:-168},depth:{offset:0},
    visual:{wallHeight:120},
    shadow:{baked:true,x:12,y:-25,width:190,height:70,color:0x30291c,alpha:.3},
  },
  {
    id:'wall',name:'Stone Wall',category:'building',sprite:'/assets/buildings/wall/wall.svg',
    width:1,height:1,walkable:false,collectible:false,buildable:true,cost:{stone:1},
    interactions:['enter','exit','walk_top'],description:'Spojitelná kamenná hradba. Tažením postavíš rovnou řadu a po vrcholu lze chodit mezi spojenými segmenty.',
    visibility:{multiplier:1.75},navigation:{walkableTop:true},construction:{mode:'line'},
    renderMode:'procedural',renderer:'fortification',origin:{x:.5,y:118/130},visualHeight:125,
    platform:{x:0,y:-84},depth:{offset:0},visual:{wallHeight:68},
    shadow:{baked:true,x:8,y:-8,width:65,height:24,color:0x30291c,alpha:.3},
  },
];
