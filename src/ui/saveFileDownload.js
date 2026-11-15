// Owner 15 Nov 2026: inside the Claude page a link download is blocked ("file downloads aren't allowed"); the page's
// `downloads` capability asks the viewer and saves the file. Outside it (GitHub Pages, local) the usual link works.
// Returns 'saved', 'declined' or 'link' (the browser was handed a link download; its result cannot be seen).
export async function downloadFile(filename,data,type='application/json'){
  const blob=data instanceof Blob?data:new Blob([data],{type});let api=null;
  try{api=await Promise.race([globalThis.claude?.use?.('downloads')??null,new Promise(r=>setTimeout(()=>r(null),3000))]);}catch{api=null;}
  if(api?.save){try{await api.save({filename,data:blob});return 'saved';}catch(error){if(error?.code==='declined')return 'declined';if(!['unavailable','not_granted','capability_disabled','capability_removed'].includes(error?.code))throw new Error(error?.message??String(error?.code??error));}}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);return 'link';
}
