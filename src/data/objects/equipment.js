export const equipment=[
  {id:'basic_sword',name:'Sword',sprite:'/assets/equipment/weapons/basic_sword.svg',
    equipment:{slot:'weapon',modifiers:{attackBonus:100}},description:'Meč zvyšující základní attack DPS krále.'},
  {id:'basic_armor',name:'Armor',sprite:'/assets/equipment/armor/basic_armor.svg',
    equipment:{slot:'armor',modifiers:{armor:30}},description:'Brnění omezující příchozí poškození.'},
].map(d=>({...d,category:'equipment',width:1,height:1,walkable:true,collectible:false,buildable:false,cost:{},
  interactions:['equip','unequip'],renderMode:'sprite',origin:{x:.5,y:.5},visualHeight:48}));
