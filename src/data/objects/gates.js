// Two menu orientations use the same approved wall kit; no new artwork or saved rotation field.
export const gateDefinitions=['y','x'].map(axis=>({
  id:`gate_${axis}`,name:`Stone Gate (${axis.toUpperCase()} passage)`,category:'building',buildingCategory:'defense',
  sprite:'/assets/buildings/wall/wall.svg',width:axis==='y'?3:1,height:axis==='x'?3:1,
  walkable:false,collectible:false,buildable:true,cost:{stone:6},constructionTime:20000,
  interactions:['enter','exit','walk_top'],navigation:{walkableTop:true,roofAccess:true,gateAxis:axis},
  description:`Two-way ${axis.toUpperCase()} passage between solid pillars. Stairs connect the ground and the adjoining wall walk. Uses the existing wall kit.`,
  visibility:{multiplier:1.75},renderMode:'procedural',renderer:'gate',origin:{x:.5,y:118/130},visualHeight:125,
  platform:{x:axis==='y'?-64:64,y:-132},depth:{offset:0},visual:{wallHeight:68},
}));
