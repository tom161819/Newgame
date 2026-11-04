export const LEDGER_HISTORY_DAYS=30;
export const TRANSACTION_TYPES=Object.freeze(['production','acquisition','consumption','refund','purchase','sale']);
export function emptyLedgerState(time){return{version:1,nextId:1,startedAt:time.totalElapsed,current:{day:time.day,partial:time.elapsed>0,transactions:[],totals:{}},history:[],processedIds:[]};}
export function addTransaction(totals,tx){
  const r=Object.hasOwn(totals,tx.resource)?totals[tx.resource]:(totals[tx.resource]={income:0,expenses:0,net:0,incomeBySource:{},expensesBySource:{}}),income=tx.direction==='income',field=income?'income':'expenses',breakdown=income?r.incomeBySource:r.expensesBySource;
  r[field]+=tx.quantity;breakdown[tx.source]=(Object.hasOwn(breakdown,tx.source)?breakdown[tx.source]:0)+tx.quantity;r.net=r.income-r.expenses;return r;
}
