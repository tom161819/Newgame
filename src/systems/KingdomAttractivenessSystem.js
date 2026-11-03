export class KingdomAttractivenessSystem {
  constructor(scene){this.scene=scene;this.base=100;this.modifiers=new Map();}
  get value(){const food=this.scene.foodSystem?.shortage?-40:0;return Math.max(0,Math.min(100,this.base+food+[...this.modifiers.values()].reduce((n,v)=>n+v,0)));}
  get settlementChance(){return this.value/100;}
  shouldSettle(random=Math.random){return random()<this.settlementChance;}
}
