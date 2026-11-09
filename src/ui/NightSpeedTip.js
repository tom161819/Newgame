import { t,onLanguageChange } from '../i18n/index.js';

// m-noc-zrychleni (82): the one-time tip "Nights can pass faster" below the speed buttons, with Turn on and No thanks.
// Built here (no index.html markup); NightSpeedUp decides when it shows.
export class NightSpeedTip {
  constructor(scene,{document:doc=globalThis.document,onEnable=()=>{}}={}){
    this.scene=scene;this.doc=doc;this.onEnable=onEnable;this.controller=new AbortController();const options={signal:this.controller.signal};
    const el=(tag,props={})=>Object.assign(doc.createElement(tag),props);
    this.root=el('div',{id:'night-speed-tip',className:'night-speed-tip',hidden:true});this.root.setAttribute('role','dialog');this.root.setAttribute('aria-live','polite');
    this.text=el('p',{className:'night-speed-tip-text'});this.enableButton=el('button',{type:'button',id:'night-speed-tip-enable'});this.dismissButton=el('button',{type:'button',id:'night-speed-tip-dismiss'});
    this.root.append(this.text,el('div',{className:'night-speed-tip-actions'}));this.root.lastChild.append(this.enableButton,this.dismissButton);
    this.enableButton.addEventListener('click',()=>{this.onEnable();this.hide();},options);this.dismissButton.addEventListener('click',()=>this.hide(),options);
    for(const e of ['pointerdown','mousedown','mouseup','wheel'])this.root.addEventListener(e,ev=>ev.stopPropagation(),options);
    doc.body?.append(this.root);this.unsubscribe=onLanguageChange?.(()=>this.relabel());this.relabel();
  }
  relabel(){this.text.textContent=t('night.tip.text');this.enableButton.textContent=t('night.tip.enable');this.dismissButton.textContent=t('night.tip.dismiss');}
  show(){
    this.relabel();this.root.hidden=false;
    const anchor=this.doc.querySelector?.('#speed-controls')?.getBoundingClientRect?.();
    if(anchor){this.root.style.left=`${Math.round(Math.max(6,anchor.left))}px`;this.root.style.top=`${Math.round(anchor.bottom+8)}px`;}
  }
  hide(){this.root.hidden=true;}
  get visible(){return !this.root.hidden;}
  destroy(){this.controller.abort();this.unsubscribe?.();this.root.remove();}
}
