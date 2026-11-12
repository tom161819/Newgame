import { TORCHES } from '../torches.js';
import { WORKPLACES } from '../workplaces.js';
import { MINING_WORK } from '../minerals.js';
export const buildings = [
  {
    // Approved Asset Studio sprite (art/sprites/watchtower/watchtower-square.v1.json); TowerView stays the fallback.
    id: 'tower', name: 'Stone Tower', category: 'building', buildingCategory:'defense', sprite: '/assets/buildings/tower/watchtower-square.v1.png',
    frontSprite: '/assets/buildings/tower/watchtower-square.v1.front.png', artSource: 'art/sprites/watchtower/watchtower-square.v1.json',
    visibility: { multiplier: 2 },
    // m-staveni-zdi-studna (59): the tool stays selected after placing; a Tower may replace Stone Wall segments.
    width: 2, height: 2, walkable: false, collectible: false, buildable: true, repeatPlacement: true, replacesWall: true,
    cost: { stone: 20 }, interactions: ['enter', 'exit'], description: 'Kamenná strážní věž s horní plošinou a cimbuřím.',
    constructionTime:20000,
    renderMode: 'sprite', renderer: 'tower', origin: { x: 0.39634, y: 0.99107 }, frontOrigin: { x: 0.39634, y: 0.99107 }, visualHeight: 222,
    platform: { x: 0, y: -183.28 }, depth: { offset: 0 },
    lights: [{ type: 'torch', x: -15.88, y: -72.15, color: '#ffb25a', radius: 102.4, intensity: 0.95, flicker: { amplitude: 0.12, speed: 7 }, flameSize: 1 }],
    // Day and night N2: two torch holders (2 Torches a night); their sight counts only with someone on the tower.
    fuel: TORCHES.places.tower,
    shadow: { baked: true, x: 8, y: -20, width: 114, height: 43, color: 0x30291c, alpha: 0.3 },
  },
  {
    // Approved Asset Studio castle with a bergfried (art/sprites/castle/castle-keep.v1.json, chosen 7 Nov); the King stands
    // on the keep platform behind the front battlements. FortificationView stays the fallback.
    id:'castle',name:'Castle',category:'building',buildingCategory:'defense',sprite:'/assets/buildings/castle/castle-keep.v1.png',
    frontSprite:'/assets/buildings/castle/castle-keep.v1.front.png',artSource:'art/sprites/castle/castle-keep.v1.json',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{stone:20},maxCount:1,
    constructionTime:45000,
    production:{resource:'gold',amount:5,interval:'day',label:'Castle income'},
    interactions:['enter','exit'],description:'Kamenná pevnost s horní plošinou a cimbuřím. Z plošiny poskytuje o 75 % větší dohled.',
    visibility:{multiplier:1.75},renderMode:'sprite',renderer:'fortification',
    origin:{"x": 0.4899, "y": 0.99206},frontOrigin:{"x": 0.4899, "y": 0.99206},visualHeight:250,platform:{"x": 0, "y": -199},depth:{offset:0},
    lights:[{"type": "window", "x": -23.36, "y": -156.49, "color": "#ffcf7a", "radius": 28.8, "intensity": 0.75, "flicker": {"amplitude": 0.03, "speed": 1.5}, "flameSize": 0}, {"type": "window", "x": 13.44, "y": -151.85, "color": "#ffcf7a", "radius": 28.8, "intensity": 0.75, "flicker": {"amplitude": 0.03, "speed": 1.5}, "flameSize": 0}, {"type": "window", "x": 16.96, "y": -64.47, "color": "#ffcf7a", "radius": 28.8, "intensity": 0.75, "flicker": {"amplitude": 0.03, "speed": 1.5}, "flameSize": 0}, {"type": "torch", "x": -43.52, "y": -69, "color": "#ffb25a", "radius": 102.4, "intensity": 0.95, "flicker": {"amplitude": 0.12, "speed": 7}, "flameSize": 1}, {"type": "torch", "x": -24.32, "y": -59.4, "color": "#ffb25a", "radius": 102.4, "intensity": 0.95, "flicker": {"amplitude": 0.12, "speed": 7}, "flameSize": 1}],
    visual:{wallHeight:120},
    shadow:{baked:true,x:12,y:-25,width:190,height:70,color:0x30291c,alpha:.3},
  },
  {
    id:'wall',name:'Stone Wall',category:'building',buildingCategory:'defense',sprite:'/assets/buildings/wall/wall.svg',
    width:1,height:1,walkable:false,collectible:false,buildable:true,cost:{stone:1},repeatPlacement:true,
    constructionTime:5000,
    interactions:['enter','exit','walk_top'],description:'Spojitelná kamenná hradba. Tažením postavíš rovnou řadu a po vrcholu lze chodit mezi spojenými segmenty.',
    visibility:{multiplier:1.75},navigation:{walkableTop:true},construction:{mode:'line'},
    renderMode:'procedural',renderer:'fortification',origin:{x:.5,y:118/130},visualHeight:125,
    platform:{x:0,y:-84},depth:{offset:0},visual:{wallHeight:68},
    shadow:{baked:true,x:8,y:-8,width:65,height:24,color:0x30291c,alpha:.3},
  },
  // #97: a gate in the wall. People walk through it on the ground; the wall walk continues over it, and together with the
  // Towers it is where the King climbs up to and down from the wall walk. Provisional art: the Studio concept "Gate, open".
  {
    id:'wall_gate',name:'Gate',category:'building',buildingCategory:'defense',sprite:'/assets/buildings/wall_gate/wall-gate-open.v1.png',
    // m-staveni-zdi-studna (59): repeat placement; placed over a Stone Wall segment it replaces it; R turns it (gateAxis).
    width:1,height:1,walkable:true,collectible:false,buildable:true,cost:{stone:5},constructionTime:12000,repeatPlacement:true,replacesWall:true,
    interactions:['enter','exit','walk_top'],description:'A gate in the wall: people pass through it, and from it you climb up to the wall walk.',
    visibility:{multiplier:1.75},navigation:{walkableTop:true,access:true},
    renderMode:'sprite',origin:{x:.38372,y:.84348},visualHeight:113,platform:{x:0,y:-84},depth:{offset:0},
  },
  // #118: Builders who have a place in a finished workshop (4 per workshop) work at full speed, others at half speed;
  // idle Builders wait at their workshop. Approved art: builders-workshop material yard (APPROVED_BUILDING_ART).
  {
    id:'builder_workshop',name:"Builder's Workshop",category:'building',buildingCategory:'industry',
    sprite:'/assets/buildings/builder_workshop/builders-workshop-material-yard.v2.png',
    width:3,height:3,walkable:false,collectible:false,buildable:true,cost:{wood:20},constructionTime:30000,
    interactions:[],builderWorkshop:{capacity:4},
    description:'An open workshop and material yard for Builders. Each workshop serves 4 Builders; Builders without one work 50 % slower.',
    renderMode:'sprite',origin:{x:0.49744,y:0.98319},visualHeight:117,depth:{offset:0},
    shadow:{baked:true,x:12,y:-15,width:3*59,height:3*21,color:0x30291c,alpha:.3},
  },
  ...[
    {id:'quarry',name:'Quarry',buildingCategory:'industry',width:3,height:3,cost:{wood:15},constructionTime:30000,visualHeight:95,description:'Kamenolom se třemi místy pro horníky. Musí překrývat skutečné kamenné ložisko a mít dostupný přístup. Těží pouze svou přiřazenou konečnou zásobu.'},
    {id:'hunting_lodge',name:'Hunting Lodge',buildingCategory:'food',menuOrder:50,recommendsCompletedBuildings:['granary'],width:2,height:2,cost:{wood:8},constructionTime:25000,visualHeight:110,description:'Lovecká chata pro jednoho lovce. Lovec přináší maso ze skutečných úlovků.'},
    {id:'fisherman_hut',name:"Fisherman's Hut",buildingCategory:'food',menuOrder:55,recommendsCompletedBuildings:['granary'],width:2,height:2,cost:{wood:10},constructionTime:25000,visualHeight:110,fishing:{},description:'A hut for one Fisher. It can stand anywhere: the Fisher walks to the nearest reachable shore and carries the catch to a Granary, so a hut close to water catches more.'},
    {id:'barracks',name:'Barracks',buildingCategory:'defense',width:3,height:3,cost:{stone:12,wood:10},constructionTime:40000,visualHeight:125,kit:{capacity:30},description:'Kasárna s dvanácti místy. Každý přijatý je branec, který hlídkuje v okolí; se zbraněmi ze zbrojnice se branec vycvičí na vojáka, lučištníka, šermíře nebo rytíře. Sklad výstroje pojme 30 kusů.'},
  ].map(d=>({...d,category:'building',sprite:`/assets/buildings/${d.id}/${d.id}.svg`,walkable:false,collectible:false,buildable:true,
    interactions:['manage_workers'],renderMode:'procedural',renderer:'workplace',origin:{x:.5,y:.9},depth:{offset:0},
    workplace:WORKPLACES[d.id],...(d.id==='quarry'?{mining:MINING_WORK.quarry}:{}),shadow:{baked:true,x:12,y:-15,width:d.width*59,height:d.height*21,color:0x30291c,alpha:.3}})),
];
