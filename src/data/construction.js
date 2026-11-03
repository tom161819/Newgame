export const CONSTRUCTION_RULES=Object.freeze({maximumBuilders:3,defaultTime:20000,retryInterval:1500});
export function constructionPhase(site){
  const c=site.construction;if(!c||c.state==='complete')return 'Completed';
  if(c.workDone===0)return 'Blueprint';return c.progress<=33?'Foundations':c.progress<=66?'Structure':'Nearly complete';
}
