export const treasures=[{
  id:'treasure_chest',name:'Treasure Chest',category:'treasure',sprite:'/assets/treasures/chest/chest.svg',
  width:1,height:1,walkable:false,collectible:false,buildable:false,cost:{},interactions:['open'],
  description:'Dřevěná truhla s kováním. Obsahuje 50–100 Gold, Sword a Armor. Obsah lze vyzvednout jednou.',
  renderMode:'procedural',renderer:'chest',origin:{x:.5,y:60/72},visualHeight:60,
  visual:{hitArea:{x:-22,y:-36,width:44,height:43}},depth:{offset:.1},
  treasure:{initial:1,goldMin:50,goldMax:100,equipment:['basic_sword','basic_armor']},
}];
