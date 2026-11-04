export const MINERAL_DEPOSITS=Object.freeze({
  stone_deposit:Object.freeze({resource:'stone',count:5,min:80,max:160}),
  iron_deposit:Object.freeze({resource:'iron_ore',count:4,min:60,max:120}),
});
export const MINING_WORK=Object.freeze({
  quarry:Object.freeze({resource:'stone',depositType:'stone_deposit',duration:12000,xp:5,overlap:true}),
  iron_mine:Object.freeze({resource:'iron_ore',depositType:'iron_deposit',duration:20000,xp:8,range:4,overlap:false}),
});
export const resourceBlocks=object=>object.natural?.kind==='tree'?object.natural.stage===3:!object.definition.walkable;
