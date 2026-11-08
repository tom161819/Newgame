import { APPROVED_DEPLOY_ART } from './approvedDeployArt.js';
// Approved Asset Studio art (art/approvals.json): grass-ground-lush for untouched
// grass (four interchangeable tiles picked per tile) and worn-path-earth (Earth track) for the
// trampled stages, with its connection-strip colours (metadata gameWear). The game draws the
// track as a narrow strip over the tile's own seasonal grass (TerrainRenderer.drawPaths).
const GRASS_TILES=[0,1,2,3].map(i=>`/assets/terrain/grass/lush/grass-ground-lush.v1.tile-${i}.png`);
// Approved season-ground tiles replace the seasonal tint on untouched grass (summer = the lush set).
const seasonTiles=name=>[0,1,2,3].map(i=>`/assets/terrain/grass/seasons/season-ground-${name}.v1.tile-${i}.png`);
const GRASS_SEASONS={Spring:seasonTiles('spring'),Autumn:seasonTiles('autumn'),Winter:seasonTiles('snow')};
const wearSurfaces=[
  {id:'grass_normal',name:'Grass — Normal',description:'Původní vysoká tráva.',color:'#74854b',edge:'#86975c',width:0,sprite:GRASS_TILES[0],variants:GRASS_TILES,artSource:'art/sprites/grass-ground/grass-ground-lush.v1.json'},
  {id:'grass_trodden',name:'Grass — Trodden',description:'Ušlapaná tráva: tmavě zelená stopa po prvních průchodech, ještě bez hlíny.',color:'#33561c',edge:'#466b28',width:6,sprite:GRASS_TILES[0],artSource:'art/sprites/grass-ground/grass-ground-lush.v1.json'},
  {id:'grass_trampled_1',name:'Grass — Trampled 1',description:'Lehce sešlapaná tráva od pěti průchodů. Rychlost +5 %.',color:'#5b6f3a',edge:'#5f7840',width:6},
  {id:'grass_trampled_2',name:'Grass — Trampled 2',description:'Travnatohlinitá pěšina od patnácti průchodů. Rychlost +10 %.',color:'#62553b',edge:'#5c6a3c',width:10},
  {id:'grass_trampled_3',name:'Grass — Trampled 3',description:'Výrazná hlinitá cesta od třiceti průchodů. Rychlost +15 %.',color:'#4e4232',edge:'#55543a',width:14},
].map((d,level)=>({id:d.id,name:d.name,description:d.description,category:'terrain',sprite:d.sprite??`/assets/terrain/path_wear/earth/worn-path-earth.v1.tile-${level-1}.png`,
  ...(d.variants?{spriteVariants:d.variants,seasonVariants:GRASS_SEASONS}:{}),artSource:d.artSource??'art/sprites/worn-path/worn-path-earth.v1.json',
  width:1,height:1,walkable:true,collectible:false,buildable:false,cost:{},interactions:[],
  renderMode:'sprite',origin:{x:.5,y:.5},visualHeight:0,depth:{offset:-100},
  visual:{wearLevel:level,pathColor:d.color,pathEdge:d.edge,pathWidth:d.width,...(level?{pathSoftness:2}:{})},
}));
// #100 Ground types approved in the Studio (art/sprites/wild-ground, 7 Nov): four interchangeable tiles each,
// picked per tile like grass. Water and sand keep their look in every season (snow only dusts the beach).
const groundTiles=(folder,name)=>[0,1,2,3].map(i=>`/assets/terrain/${folder}/wild-ground-${name}.v1.tile-${i}.png`);
const wildGround=[
  {id:'beach_sand',name:'Plážový písek',description:'Písek u řek a jezer. Dá se po něm chodit i stavět, nic na něm neroste.',folder:'sand',art:'beach'},
  {id:'desert_sand',name:'Pouštní písek',description:'Suchá poušť. Dá se po ní chodit i stavět, nerostou na ní stromy ani pole.',folder:'sand',art:'desert'},
  {id:'shallow_water',name:'Mělká voda',description:'Okraj řeky nebo jezera. Neprůchozí a nezastavitelná, přes vodu se dá střílet.',folder:'water',art:'shallow',walkable:false},
  {id:'deep_water',name:'Hluboká voda',description:'Proud řeky a střed jezera. Neprůchozí a nezastavitelná, přes vodu se dá střílet.',folder:'water',art:'deep',walkable:false},
].map(d=>({id:d.id,name:d.name,description:d.description,category:'terrain',sprite:groundTiles(d.folder,d.art)[0],spriteVariants:groundTiles(d.folder,d.art),
  artSource:`art/sprites/wild-ground/wild-ground-${d.art}.v1.json`,width:1,height:1,walkable:d.walkable??true,collectible:false,buildable:false,cost:{},interactions:[],
  renderMode:'sprite',origin:{x:.5,y:.5},visualHeight:0,depth:{offset:-100}}));
// World v2 (generator 2): ford, mud and pebbly banks with the approved Studio shore-ground tiles (plan
// m-nasadit-schvalenou-grafiku, art/sprites/shore-ground: ford, mud, rocks; four interchangeable tiles each).
const worldV2Ground=[
  {id:'ford_shallows',name:'Brod',description:'Mělčina s kameny přes řeku. Dá se přebrodit (pomaleji), nedá se na ní stavět ani dláždit.'},
  {id:'mud_bank',name:'Bahnitý břeh',description:'Hlinitý břeh u vody. Dá se po něm chodit i stavět, nic na něm neroste.'},
  {id:'shore_rocks',name:'Kamenitý břeh',description:'Oblázky u vody. Dá se po nich chodit i stavět, nic na nich neroste.'},
].map(d=>{const art=APPROVED_DEPLOY_ART.shore[d.id];return {id:d.id,name:d.name,description:d.description,category:'terrain',sprite:art.tiles[0],spriteVariants:art.tiles,artSource:art.artSource,
  width:1,height:1,walkable:true,collectible:false,buildable:false,cost:{},interactions:[],renderMode:'sprite',origin:{x:.5,y:.5},visualHeight:0,depth:{offset:-100}};});
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
  ...wearSurfaces,
  ...wildGround,
  ...worldV2Ground,
];
