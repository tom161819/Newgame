// Approved Asset Studio art (art/approvals.json): grass-ground-lush for untouched
// grass (four interchangeable tiles picked per tile) and worn-path-moss for the
// trampled stages, with its connection-strip colours (metadata gameWear).
const GRASS_TILES=[0,1,2,3].map(i=>`/assets/terrain/grass/lush/grass-ground-lush.v1.tile-${i}.png`);
const wearSurfaces=[
  {id:'grass_normal',name:'Grass — Normal',description:'Původní vysoká tráva.',color:'#74854b',edge:'#86975c',width:0,sprite:GRASS_TILES[0],variants:GRASS_TILES,artSource:'art/sprites/grass-ground/grass-ground-lush.v1.json'},
  {id:'grass_trampled_1',name:'Grass — Trampled 1',description:'Lehce sešlapaná tráva od pěti průchodů. Rychlost +5 %.',color:'#56723a',edge:'#5f7d3e',width:5},
  {id:'grass_trampled_2',name:'Grass — Trampled 2',description:'Travnatohlinitá pěšina od patnácti průchodů. Rychlost +10 %.',color:'#4d5e34',edge:'#55683a',width:9},
  {id:'grass_trampled_3',name:'Grass — Trampled 3',description:'Výrazná hlinitá cesta od třiceti průchodů. Rychlost +15 %.',color:'#574a36',edge:'#5a5a3a',width:13},
].map((d,level)=>({id:d.id,name:d.name,description:d.description,category:'terrain',sprite:d.sprite??`/assets/terrain/path_wear/moss/worn-path-moss.v1.tile-${level}.png`,
  ...(d.variants?{spriteVariants:d.variants}:{}),artSource:d.artSource??'art/sprites/worn-path/worn-path-moss.v1.json',
  width:1,height:1,walkable:true,collectible:false,buildable:false,cost:{},interactions:[],
  renderMode:'sprite',origin:{x:.5,y:.5},visualHeight:0,depth:{offset:-100},
  visual:{wearLevel:level,pathColor:d.color,pathEdge:d.edge,pathWidth:d.width,...(level?{pathSoftness:2}:{})},
}));
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
];
