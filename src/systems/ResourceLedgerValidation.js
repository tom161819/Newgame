import { LEDGER_HISTORY_DAYS,TRANSACTION_TYPES,addTransaction } from '../data/resourceLedger.js';

export function validateResourceLedger(data,registry,time,dayDuration,{check,number,integer,array}){
  const object=(o,keys)=>{check(o&&typeof o==='object'&&!Array.isArray(o));if(keys)check(Object.keys(o).every(k=>keys.includes(k)));};
  object(data,['version','nextId','startedAt','current','history','processedIds']);check(data.version===1);integer(data.nextId,1);number(data.startedAt,0,time.totalElapsed);
  array(data.processedIds,1000000);const processed=new Set(data.processedIds);check(processed.size===data.processedIds.length);
  for(const id of processed){check(typeof id==='string'&&id.length>0&&id.length<=256);const match=id.match(/^ledger-([1-9]\d*)$/);if(match)check(Number(match[1])<data.nextId);}
  array(data.history,LEDGER_HISTORY_DAYS);const firstDay=Math.floor(data.startedAt/dayDuration)+1,expectedHistory=Math.min(LEDGER_HISTORY_DAYS,time.day-firstDay);check(data.history.length===expectedHistory);
  const entries=new Set(),buckets=[...data.history,data.current];
  for(let index=0;index<buckets.length;index++){
    const bucket=buckets[index],day=time.day-data.history.length+index;object(bucket,['day','partial','transactions','totals']);check(bucket.day===day);check(bucket.partial===(day===firstDay&&data.startedAt>(firstDay-1)*dayDuration));array(bucket.transactions,1000000);const expected={};
    for(const tx of bucket.transactions){
      object(tx,['id','time','day','resource','quantity','direction','type','source','entityId']);check(processed.has(tx.id)&&!entries.has(tx.id));entries.add(tx.id);check(tx.day===day);number(tx.time,Math.max(data.startedAt,(day-1)*dayDuration)-1e-7,Math.min(time.totalElapsed,day*dayDuration)+1e-7);
      const d=registry.get(tx.resource);check(d?.category==='resource'&&d.collectible);if(tx.resource==='gold')number(tx.quantity,Number.MIN_VALUE);else integer(tx.quantity,1);
      check(['income','expense'].includes(tx.direction)&&TRANSACTION_TYPES.includes(tx.type));check(typeof tx.source==='string'&&tx.source.length>0&&tx.source.length<=160&&!['__proto__','constructor','prototype'].includes(tx.source));check(typeof tx.entityId==='string'&&tx.entityId.length>0&&tx.entityId.length<=128||Number.isSafeInteger(tx.entityId)&&tx.entityId>0);addTransaction(expected,tx);
    }
    object(bucket.totals);check(Object.keys(bucket.totals).length===Object.keys(expected).length);
    for(const [resource,total]of Object.entries(bucket.totals)){
      const actual=expected[resource];check(actual);object(total,['income','expenses','net','incomeBySource','expensesBySource']);
      for(const key of ['income','expenses','net']){number(total[key],-Number.MAX_SAFE_INTEGER);check(Math.abs(total[key]-actual[key])<=1e-8);}
      for(const key of ['incomeBySource','expensesBySource']){object(total[key]);check(Object.keys(total[key]).length===Object.keys(actual[key]).length);for(const [source,amount]of Object.entries(total[key])){number(amount,Number.MIN_VALUE);check(Object.hasOwn(actual[key],source)&&Math.abs(actual[key][source]-amount)<=1e-8);}}
    }
  }
}
