// m-ukladani-chyba: the last save or load that failed its check, kept in memory so the Dev tool can download it for a
// bug report. Only the latest one is kept; it is never written to storage.
let last=null;
export function recordSaveFailure(kind,state,error){last={kind,at:new Date().toISOString(),part:error?.savePart??null,message:String(error?.message??error),state};return last;}
export const lastSaveFailure=()=>last;
export function downloadSaveFailure(doc=globalThis.document){
  if(!last||!doc?.createElement||typeof Blob==='undefined'||!globalThis.URL?.createObjectURL)return false;
  const url=URL.createObjectURL(new Blob([JSON.stringify(last)],{type:'application/json'})),a=doc.createElement('a');
  a.href=url;a.download=`mk-${last.kind}-failed-${last.at.replace(/[:.]/g,'-')}.json`;doc.body?.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;
}
