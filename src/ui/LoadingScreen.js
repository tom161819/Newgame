import { t } from '../i18n/index.js';

// Owner 19 Nov 2026 (74): starting a game (new, loaded, a zone or the Test map) shows a loading screen until the
// pictures in view have loaded, instead of the map filling in bit by bit. It waits until the loader (pictures are
// fetched as the views ask for them) has been idle for `quietMs`, at least `minMs` and at most
// `maxMs` (so a slow or failed download never keeps the game hidden).
export const LOADING=Object.freeze({quietMs:500,minMs:400,maxMs:15000,pollMs:100});
export function sceneSettled(scene){
  if(!scene?.sys?.isActive?.())return false;const load=scene.load;
  return !(load?.isLoading?.()||(load?.list?.size??0)>0||(load?.inflight?.size??0)>0);
}
export class LoadingScreen {
  constructor(doc=globalThis.document,now=()=>globalThis.performance?.now?.()??Date.now()){
    this.doc=doc;this.now=now;this.timer=null;
    this.root=doc.createElement('div');this.root.id='loading-screen';this.root.className='loading-screen';this.root.hidden=true;this.root.setAttribute('role','status');this.root.setAttribute('aria-live','polite');
    this.title=doc.createElement('h2');this.title.textContent='Medieval Kingdom';this.text=doc.createElement('p');
    this.bar=doc.createElement('div');this.bar.className='loading-bar';this.fill=doc.createElement('span');this.bar.append(this.fill);
    this.root.append(this.title,this.text,this.bar);doc.body.append(this.root);
  }
  show(){this.text.textContent=t('loading.text');this.fill.style.width='5%';this.root.hidden=false;this.root.classList.remove('done');this.started=this.now();this.quietSince=null;this.best=5;this.scene=null;this.stopTimer();this.timer=setInterval(()=>this.poll(),LOADING.pollMs);}
  watch(scene){this.scene=scene;}
  progress(){const load=this.scene?.load;const total=load?.totalToLoad??0,done=load?.totalComplete??0;return total>0?Math.min(1,done/total):this.scene?.sys?.isActive?.()?.9:.1;}
  poll(){
    const now=this.now(),elapsed=now-this.started;if(this.root.hidden){this.stopTimer();return;}
    this.best=Math.max(this.best??0,Math.round(Math.max(5,Math.min(100,this.progress()*100))));this.fill.style.width=`${this.best}%`;
    if(this.scene&&sceneSettled(this.scene)){this.quietSince??=now;}else this.quietSince=null;
    if(elapsed>=LOADING.maxMs||elapsed>=LOADING.minMs&&this.quietSince!=null&&now-this.quietSince>=LOADING.quietMs)this.hide();
  }
  hide(){this.stopTimer();this.fill.style.width='100%';this.root.classList.add('done');this.root.hidden=true;}
  stopTimer(){if(this.timer){clearInterval(this.timer);this.timer=null;}}
  destroy(){this.stopTimer();this.root.remove();}
}
