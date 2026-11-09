// m-drevorubci-stromy (playtest 0.83.0 #1: the tutorial's Lumberjack Hut was finished only on day 3.5, wood fell to 4):
// `firstPriority` – the kingdom's first site of each type, while no building of that type is finished, is built and
// supplied first, in this order (the Granary, then the Lumberjack Hut – the tutorial's order).
export const CONSTRUCTION_RULES=Object.freeze({maximumBuilders:3,defaultTime:20000,retryInterval:1500,firstPriority:Object.freeze(['granary','lumberjack_hut'])});
export function constructionPhase(site){
  const c=site.construction;if(!c||c.state==='complete')return 'Completed';
  if(c.workDone===0)return 'Blueprint';return c.progress<=33?'Foundations':c.progress<=66?'Structure':'Nearly complete';
}
