import { t } from '../i18n/index.js';
import { cornerStack } from './EventFeed.js';
import { STORY } from '../data/story.js';
import { playChime } from './sound.js';

// m-pribeh-vlci-ujezd F2–F5: the story on screen. A letter opens over the game (the game is paused while it is read);
// a letter with choices closes only by a choice. A small card in the corner shows the chapter and year, the side, the
// proofs against Smil and opens the letters already read.
export const letterChoices=(story,id)=>id==='tribute'?[{id:'pay'},{id:'refuse'}]:story.choicesOf(id)??[];
export class StoryPanel {
  constructor(scene,story,{document:doc=globalThis.document}={}){
    this.scene=scene;this.story=story;this.doc=doc;this.signature='';this.next=0;this.shown=null;this.rereading=null;
    const el=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};this.el=el;
    this.card=el('details','royal-goals story-card');this.card.id='story-card';this.summary=el('summary');this.body=el('div','story-card-body');this.card.append(this.summary,this.body);cornerStack(doc)?.prepend(this.card);
    this.dialog=el('div','story-letter');this.dialog.id='story-letter';this.dialog.hidden=true;this.dialog.setAttribute('role','dialog');this.dialog.setAttribute('aria-modal','true');
    this.paper=el('div','story-paper');this.dialog.append(this.paper);(doc.querySelector?.('#game')??doc.body)?.append(this.dialog);
    this.click=event=>{
      const b=event.target?.closest?.('button[data-story]');if(!b||b.disabled)return;event.preventDefault?.();const [kind,arg]=b.dataset.story.split(':');
      if(kind==='accuse'){if(this.story.accuse())playChime('goal');}
      else if(kind==='list')this.showList();
      else if(kind==='open'){this.rereading=arg;this.showLetter(arg,true);return;}
      else if(kind==='back'){this.rereading=null;this.hide();}
      else if(kind==='close'){const id=this.shown;if(id==='tribute'?this.story.closeTribute(arg==='pay'):this.story.close(id,arg||null))this.hide();}
      this.render(true);
    };
    this.card.addEventListener('click',this.click);this.dialog.addEventListener('click',this.click);
    this.off=story.on(()=>this.render(true));this.render(true);
  }
  hide(){this.dialog.hidden=true;this.shown=null;this.scene.pauseManager?.set?.('story',false);}
  showLetter(id,again=false){
    const el=this.el,title=el('h2','',t(`story.${id}.title`)),from=el('p','story-from',t('story.from',{from:t(`story.${id}.from`)})),parts=t(`story.${id}.body`).split('\n').map(text=>el('p','',text));
    const buttons=el('div','story-buttons'),choices=again?[]:letterChoices(this.story,id);
    if(choices.length)for(const c of choices){const cost=id==='tribute'&&c.id==='pay'?STORY.tributeGold*this.story.level:0,b=el('button','story-choice',t(`story.${id}.${c.id}`)+(cost?` (${t('story.tributeCost',{gold:cost})})`:''));b.type='button';b.dataset.story=`close:${c.id}`;
      if(cost&&(this.scene.inventory?.count?.('gold')??0)<cost)b.disabled=true;buttons.append(b);}
    else{const b=el('button','story-choice',t(again?'story.back':'story.close'));b.type='button';b.dataset.story=again?'back':'close:';buttons.append(b);}
    this.paper.replaceChildren(title,from,...parts,buttons);this.dialog.hidden=false;this.shown=id;this.scene.pauseManager?.set?.('story',true);
  }
  showList(){
    const el=this.el,list=el('div','story-list');for(const id of [...this.story.read].reverse()){const b=el('button','story-choice',t(`story.${id}.title`));b.type='button';b.dataset.story=`open:${id}`;list.append(b);}
    const back=el('button','story-choice',t('story.close'));back.type='button';back.dataset.story='back';const buttons=el('div','story-buttons');buttons.append(back);
    this.paper.replaceChildren(el('h2','',t('story.letters',{n:this.story.read.length})),list,buttons);this.dialog.hidden=false;this.shown='list';this.rereading='list';this.scene.pauseManager?.set?.('story',true);
  }
  update(){const now=globalThis.performance?.now?.()??Date.now();if(now<this.next)return;this.next=now+400;this.render();}
  render(force=false){
    const s=this.story,active=s.active;
    // The first unread letter opens by itself (not over a letter being read again, nor during a fight).
    if(active&&!this.rereading&&s.inbox.length&&this.shown!==s.inbox[0]&&!s.raid&&!this.scene.court?.expedition&&!this.scene.gameOver){this.showLetter(s.inbox[0]);playChime('goal');}
    if(!active&&!this.dialog.hidden)this.hide();
    const signature=JSON.stringify([active,s.revision,s.chapter,s.year,s.evidence,s.faction,s.canAccuse(),s.read.length]);if(!force&&signature===this.signature)return;this.signature=signature;
    this.card.hidden=!active;if(!active)return;
    this.summary.textContent=t('story.card',{n:s.chapter,name:t(`story.chapter.${s.chapter}`),year:s.year});const el=this.el,rows=[];
    if(s.faction)rows.push(el('p','',t('story.side',{side:t(`story.side.${s.faction}`)})));
    if(s.evidence||s.chapter>=2)rows.push(el('p','',t('story.evidence',{n:s.evidence,max:STORY.evidenceMax})));
    if(s.canAccuse()){const b=el('button','court-button',t('story.accuse'));b.type='button';b.dataset.story='accuse';rows.push(b);}
    const letters=el('button','court-button',t('story.letters',{n:s.read.length}));letters.type='button';letters.dataset.story='list';letters.disabled=!s.read.length;rows.push(letters);
    this.body.replaceChildren(...rows);
  }
  relabel(){this.render(true);if(this.shown&&this.shown!=='list')this.showLetter(this.shown,!!this.rereading);}
  destroy(){this.off?.();this.hide();this.card.remove();this.dialog.remove();}
}
