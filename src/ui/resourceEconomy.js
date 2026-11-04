export function economyAmount(resource,value,{signed=false}={}){
  const clean=Math.abs(value)<1e-8?0:value,text=resource==='gold'?clean.toFixed(2):String(clean);return signed&&clean>0?`+${text}`:text;
}
export function dailyResourceLabel(resource,summary){return summary?economyAmount(resource,summary.net,{signed:true}):'—';}
export function dailyResourceTone(summary){return!summary||Math.abs(summary.net)<1e-8?'neutral':summary.net>0?'positive':'negative';}
