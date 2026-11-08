export const MINERAL_DEPOSITS=Object.freeze({
  stone_deposit:Object.freeze({resource:'stone',count:5,min:80,max:160}),
  iron_deposit:Object.freeze({resource:'iron_ore',count:4,min:60,max:120}),
});
// m-kamenolom-u-hradu (playtest 0.76.0 #13): every new world has a Stone Deposit a Quarry can be built on, its centre
// `min`–`max` tiles from the Castle's centre; the Quarry footprint keeps `clearance` tiles (footprint distance) from the
// Castle and the Starter Stockpile. Manual rocks within `rocksWithin` tiles are checked by tests (the start walls).
export const START_QUARRY=Object.freeze({min:8,max:16,clearance:3,rocksWithin:10,keepClearOf:Object.freeze(['castle','starter_stockpile'])});
export const MINING_WORK=Object.freeze({
  quarry:Object.freeze({resource:'stone',depositType:'stone_deposit',duration:12000,xp:5,overlap:true}),
  iron_mine:Object.freeze({resource:'iron_ore',depositType:'iron_deposit',duration:20000,xp:8,range:4,overlap:false}),
});
export const resourceBlocks=object=>object.natural?.kind==='tree'?object.natural.stage===3:!object.definition.walkable;
