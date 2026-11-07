import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { buildWikiPages,wikiCategories,searchWiki } from '../systems/Wiki.js';
import { WIKI_CATEGORIES } from '../data/wiki.js';

// m-wiki-napoveda: the Wiki window next to "?" – search, categories with their pages, and the page itself (icon,
// facts, text, "See also" links). Pages are rebuilt from the game data when the language changes.
export class WikiPanel {
  constructor(scene,{document:doc=globalThis.document}={}){
    this.scene=scene;this.doc=doc;this.controller=new AbortController();const options={signal:this.controller.signal};this.history=[];this.restored=true;
    this.button=doc.createElement('button');this.button.id='wiki-toggle';this.button.type='button';this.button.className='hud-toggle wiki-toggle';this.button.setAttribute('aria-haspopup','dialog');
    const help=doc.querySelector('#help-toggle');if(help)help.after(this.button);else doc.body.append(this.button);
    this.dialog=doc.createElement('dialog');this.dialog.id='wiki-dialog';this.dialog.className='game-dialog wiki-dialog';
    this.search=doc.createElement('input');this.search.type='search';this.search.id='wiki-search';
    this.nav=element('nav','wiki-nav');this.page=element('article','wiki-page');this.page.id='wiki-page';
    this.closeButton=element('button','wiki-close','×');this.closeButton.type='button';this.closeButton.id='close-wiki';
    this.heading=element('h2','','');this.heading.id='wiki-title';
    const head=element('div','dialog-heading');head.append(this.heading,this.search,this.closeButton);
    const body=element('div','wiki-body');body.append(this.nav,this.page);this.dialog.append(head,body);doc.body.append(this.dialog);
    this.button.addEventListener('click',()=>this.open(),options);this.closeButton.addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);this.dialog.addEventListener('close',()=>this.restore(),options);
    this.dialog.addEventListener('click',e=>{if(e.target===this.dialog){this.close();return;}const link=e.target.closest('[data-wiki-page]');if(link){e.preventDefault();this.show(link.dataset.wikiPage);}},options);
    this.search.addEventListener('input',()=>this.renderNav(),options);
    this.relabel();
  }
  pages(){if(!this.cache)this.cache=buildWikiPages(this.scene.objectRegistry,t);return this.cache;}
  relabel(){
    this.cache=null;this.button.textContent=t('wiki.button');this.button.title=t('wiki.title');this.button.setAttribute('aria-label',t('wiki.title'));
    this.heading.textContent=t('wiki.title');this.search.placeholder=t('wiki.search');this.search.setAttribute('aria-label',t('wiki.search'));this.closeButton.setAttribute('aria-label',t('common.close'));
    if(this.dialog.open){this.renderNav();if(this.current)this.show(this.current,{push:false});}
  }
  link(id){const p=this.pages().get(id);if(!p)return null;const a=element('a','wiki-link',p.title);a.href='#';a.dataset.wikiPage=id;if(id===this.current)a.setAttribute('aria-current','page');return a;}
  renderNav(){
    const q=this.search.value,list=element('div','wiki-nav-list');
    if(q.trim()){const found=searchWiki(this.pages(),q);if(!found.length)list.append(element('p','wiki-empty',t('wiki.noResults')));const ul=element('ul','');for(const p of found){const li=element('li','');li.append(this.link(p.id));ul.append(li);}list.append(ul);}
    else{const cats=wikiCategories(this.pages());for(const c of WIKI_CATEGORIES){const pages=cats.get(c);if(!pages?.length)continue;const det=element('details','wiki-category');det.dataset.wikiCategory=c;det.open=pages.some(p=>p.id===this.current);
      det.append(element('summary','',`${t(`wiki.cat.${c}`)} (${pages.length})`));const ul=element('ul','');for(const p of pages){const li=element('li','');li.append(this.link(p.id));ul.append(li);}det.append(ul);list.append(det);}}
    this.nav.replaceChildren(list);
  }
  show(id,{push=true}={}){
    const p=this.pages().get(id);if(!p)return false;if(push&&this.current&&this.current!==id)this.history.push(this.current);this.current=id;
    const title=element('h3','wiki-page-title');if(p.definition){const img=element('img','wiki-icon');img.alt='';img.src=this.scene.assets?.previewURL?.(p.definition)??'';title.append(img);}title.append(p.title);
    const parts=[element('small','wiki-page-category',t(`wiki.cat.${p.category}`)),title];
    if(p.facts.length){const dl=element('dl','wiki-facts');for(const [k,v] of p.facts)dl.append(element('dt','',k),element('dd','',v));parts.push(dl);}
    if(p.body)parts.push(element('p','wiki-text',p.body));
    if(p.links.length){const see=element('p','wiki-related');see.append(element('strong','',`${t('wiki.related')}: `));p.links.forEach((l,i)=>{const a=this.link(l);if(a){if(i)see.append(', ');see.append(a);}});parts.push(see);}
    if(this.history.length){const back=element('button','wiki-back',`← ${t('wiki.back')}`);back.type='button';back.addEventListener('click',()=>{const prev=this.history.pop();if(prev)this.show(prev,{push:false});});parts.unshift(back);}
    this.page.replaceChildren(...parts);this.page.dataset.wikiCurrent=id;this.renderNav();return true;
  }
  // id: a page id ('building:granary'), a topic id ('rats') or nothing (the last page, or the first topic).
  open(id=null){
    if(this.scene.gameOver)return;const pageId=id&&!String(id).includes(':')?`topic:${id}`:id;
    if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput?.(false);this.dialog.showModal();}
    this.search.value='';this.show(pageId??this.current??'topic:rats',{push:!!pageId});this.search.focus();
  }
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput?.(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  get isOpen(){return this.dialog.open;}
  destroy(){this.close();this.controller.abort();this.button.remove();this.dialog.remove();}
}
// A small "i" button that opens the Wiki on a topic (event feed lines and Notices).
export function wikiInfoButton(scene,topic,doc=globalThis.document){
  const b=doc.createElement('button');b.type='button';b.className='wiki-info';b.textContent='i';b.dataset.wikiTopic=topic;b.title=t('wiki.info');b.setAttribute('aria-label',t('wiki.info'));
  b.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();scene.wikiPanel?.open(topic);});return b;
}
