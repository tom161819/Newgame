export const animals = [
  ['rabbit','Rabbit',5,1.1,0xb5aa92,0.65],
  ['deer','Deer',10,1.4,0x9d6b3e,1],
  ['wild_boar','Wild Boar',15,1.2,0x625443,0.95],
].map(([id,name,meatDrop,movementSpeed,bodyColor,bodyScale])=>({
  id,name,category:'animal',sprite:`/assets/characters/${id}/${id}.svg`,width:1,height:1,
  walkable:false,collectible:false,buildable:false,cost:{},interactions:['hunt'],
  description:`Volně žijící zvěř. Po ulovení zanechá balíček ${meatDrop} masa.`,
  renderMode:'procedural',renderer:'animal',origin:{x:.5,y:.85},visualHeight:60,
  visual:{bodyColor,bodyScale,hitArea:{x:-23,y:-48,width:46,height:52}},depth:{offset:.1},
  gameplay:{movementSpeed,initialCount:3,behavior:'wander',huntable:true,meatDrop,wanderRadius:4},
  animations:{mode:'procedural',states:['idle','walk'],directions:['N','NE','E','SE','S','SW','W','NW']},
}));
