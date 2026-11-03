const wearSurfaces=[
  {id:'grass_normal',name:'Grass — Normal',description:'Původní vysoká tráva.',color:'#74854b',edge:'#86975c',width:0},
  {id:'grass_trampled_1',name:'Grass — Trampled 1',description:'Lehce sešlapaná tráva od pěti průchodů. Rychlost +5 %.',color:'#a2a06c',edge:'#9b9f66',width:5},
  {id:'grass_trampled_2',name:'Grass — Trampled 2',description:'Travnatohlinitá pěšina od patnácti průchodů. Rychlost +10 %.',color:'#a78d5c',edge:'#96935f',width:10},
  {id:'grass_trampled_3',name:'Grass — Trampled 3',description:'Výrazná hlinitá cesta od třiceti průchodů. Rychlost +15 %.',color:'#a58353',edge:'#8d8957',width:15},
].map((d,level)=>({id:d.id,name:d.name,description:d.description,category:'terrain',sprite:`/assets/terrain/path_wear/${d.id}.svg`,
  width:1,height:1,walkable:true,collectible:false,buildable:false,cost:{},interactions:[],
  renderMode:'sprite',origin:{x:.5,y:.5},visualHeight:0,depth:{offset:-100},
  visual:{wearLevel:level,pathColor:d.color,pathEdge:d.edge,pathWidth:d.width},
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
