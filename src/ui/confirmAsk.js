// Owner 19 Nov 2026 (73): a small in-game question with Yes / No (no browser dialog, which would stop the game's input).
// Resolves true for Yes; No, Escape or a click outside resolve false.
export function confirmAsk(message,{yes,no,doc=globalThis.document}={}){
  if(!doc?.createElement)return Promise.resolve(false);
  return new Promise(resolve=>{
    const dialog=doc.createElement('dialog');dialog.className='confirm-ask';dialog.id='confirm-ask';
    const text=doc.createElement('p');text.textContent=message;const row=doc.createElement('div');row.className='confirm-ask-actions';
    const done=answer=>{dialog.close?.();dialog.remove();resolve(answer);};
    for(const [label,answer] of [[yes,true],[no,false]]){const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.confirmAnswer=String(answer);b.addEventListener('click',e=>{e.stopPropagation();done(answer);});row.append(b);}
    dialog.addEventListener('cancel',e=>{e.preventDefault();done(false);});
    dialog.append(text,row);(doc.querySelector('#game')??doc.body).append(dialog);dialog.showModal?.();row.lastChild?.focus?.();
  });
}
