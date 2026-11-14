import { ruinsPenalty } from '../game/enclosure.js';
import { FOOD_OUTLOOK,foodDays } from '../data/foodOutlook.js';
export class KingdomAttractivenessSystem {
  constructor(scene){this.scene=scene;this.base=100;this.modifiers=new Map();}
  // m-uzavreny-hrad (point 35): every Burnt Ruins inside closed walls takes 5 points, at most 25.
  get ruins(){return this.scene.map?-ruinsPenalty(this.scene):0;}
  get value(){const food=this.scene.foodSystem?.shortage?-40:0;return Math.max(0,Math.min(100,this.base+food+this.ruins+[...this.modifiers.values()].reduce((n,v)=>n+v,0)));}
  get settlementChance(){return this.value/100;}
  // Why nobody settles today, or null (plan m-e1-jidlo-vydrz): too little food or too many without work.
  blockReason(){
    const s=this.scene;if(foodDays(s.foodSystem)<FOOD_OUTLOOK.settleMinDays)return 'food';
    const idle=s.workerSystem?.liveSubjects?.().filter(w=>w.profession==='idle').length??0;return idle>FOOD_OUTLOOK.settleMaxUnemployed?'jobs':null;
  }
  shouldSettle(random=Math.random){return !this.blockReason()&&random()<this.settlementChance;}
}
