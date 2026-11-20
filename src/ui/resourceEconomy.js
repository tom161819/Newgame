export function economyAmount(resource,value,{signed=false}={}){
  const clean=Math.abs(value)<1e-8?0:value,text=resource==='gold'?clean.toFixed(2):String(clean);return signed&&clean>0?`+${text}`:text;
}
// Owner 20 Nov 2026 (85): the +/− by a resource leaves out building (costs, refunds, cancelled sites, the Castle upgrade)
// and hand collection, so it shows whether the kingdom's production keeps up with what it uses. The tooltip still lists
// every source and gives the full change too.
export const OUTSIDE_BALANCE=Object.freeze({income:Object.freeze(['Stone Collection','Resource Collection','Construction Refund','Demolition Refund']),expenses:Object.freeze(['Castle Upgrade'])});
export const outsideBalance=(source,income)=>income?OUTSIDE_BALANCE.income.includes(source):OUTSIDE_BALANCE.expenses.includes(source)||/ (Construction|Cancellation Loss)$/.test(source);
export function operatingNet(summary){if(!summary)return 0;let net=summary.net??0;
  for(const [source,amount]of Object.entries(summary.incomeBySource??{}))if(outsideBalance(source,true))net-=amount;
  for(const [source,amount]of Object.entries(summary.expensesBySource??{}))if(outsideBalance(source,false))net+=amount;
  return Math.abs(net)<1e-8?0:net;}
export function dailyResourceLabel(resource,summary){return summary?economyAmount(resource,operatingNet(summary),{signed:true}):'—';}
export function dailyResourceTone(summary){const net=operatingNet(summary);return!summary||Math.abs(net)<1e-8?'neutral':net>0?'positive':'negative';}
