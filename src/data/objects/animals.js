export const animals = [
  // m-jidlo-balanc (playtest 0.76.0 #3): ~+30 % meat (5/10/15 → 7/13/20).
  ['rabbit','Rabbit',7,1.1,0xb5aa92,0.65,15,1],
  ['deer','Deer',13,1.4,0x9d6b3e,1,40,4],
  ['wild_boar','Wild Boar',20,1.2,0x625443,0.95,70,12],
].map(([id,name,meatDrop,movementSpeed,bodyColor,bodyScale,maxHP,attackDPS])=>({
  id,name,category:'animal',sprite:`/assets/characters/${id}/${id}.svg`,width:1,height:1,
  walkable:false,collectible:false,buildable:false,cost:{},interactions:['hunt'],
  description:`Volně žijící zvěř. Při napadení se brání. Po smrti zanechá balíček ${meatDrop} masa.`,
  renderMode:'procedural',renderer:'animal',origin:{x:.5,y:.85},visualHeight:60,
  visual:{bodyColor,bodyScale,hitArea:{x:-23,y:-48,width:46,height:52}},depth:{offset:.1},
  gameplay:{movementSpeed,initialCount:3,behavior:'wander',huntable:true,meatDrop,wanderRadius:4},
  stats:{maxHP,attackDPS,armor:0,attackRange:1},
  animations:{mode:'procedural',states:['idle','walk'],directions:['N','NE','E','SE','S','SW','W','NW']},
}));

// Day and night N3: the wolf comes only at night (NightThreatSystem spawns it, never the world or the respawn).
animals.push({
  id:'wolf',name:'Wolf',category:'animal',sprite:'/assets/characters/wolf/wolf.svg',
  width:1,height:1,walkable:false,collectible:false,buildable:false,cost:{},interactions:['hunt'],
  description:'A grey wolf that hunts in packs at night. Keeps away from fire. Leaves 2 meat.',
  renderMode:'procedural',renderer:'animal',origin:{x:.5,y:.85},visualHeight:50,
  visual:{bodyColor:0x6e6e6a,bodyScale:.85,hitArea:{x:-22,y:-44,width:44,height:48}},depth:{offset:.1},
  gameplay:{movementSpeed:1.6,initialCount:0,behavior:'wander',huntable:true,meatDrop:2,wanderRadius:4,nightPredator:true},
  stats:{maxHP:45,attackDPS:8,armor:0,attackRange:1},
  animations:{mode:'procedural',states:['idle','walk'],directions:['N','NE','E','SE','S','SW','W','NW']},
});

animals.push({
  id:'horse',name:'Horse',category:'animal',sprite:'/assets/characters/horse/horse.svg',
  width:1,height:1,walkable:false,collectible:false,buildable:false,cost:{},interactions:['mount'],
  description:'Volně žijící kůň. Po nasednutí zdvojnásobí rychlost a rozšíří dohled. Nelze ho lovit.',
  renderMode:'procedural',renderer:'animal',origin:{x:.5,y:.85},visualHeight:65,
  visual:{bodyColor:0xa7855a,bodyScale:1.2,hitArea:{x:-28,y:-50,width:56,height:55}},depth:{offset:.1},
  gameplay:{movementSpeed:1.2,initialCount:6,behavior:'wander',huntable:false,meatDrop:0,wanderRadius:4,
    mountedSpeedMultiplier:2,visionMultiplier:1.5},
  stats:{maxHP:90,attackDPS:0,armor:0,attackRange:1},
  animations:{mode:'procedural',states:['idle','walk'],directions:['N','NE','E','SE','S','SW','W','NW']},
});
