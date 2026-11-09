import { t } from '../i18n/index.js';
import { cornerStack } from './EventFeed.js';
import { playChime } from './sound.js';

// m-kral-odmeny-xp: the King's skill points (goal.skillPoints) are listed with the resources.
export const rewardText=(reward,points=0)=>[...Object.entries(reward??{}).map(([id,n])=>t(`goals.res.${id}`,{n,count:n})),...(points>0?[t('goals.res.points',{count:points})]:[])].join(', ');
// m-ui-prekryvy-076 (report 0.76.0 point 5): while the Build menu is open the card never lies over it. `card` and `menu`
// are screen boxes; `shift` – how far up the card moves to clear the menu's top edge, `fold` – it would have to go above
// `top` (under the HUD), so it folds to its title first. Pure.
export function goalsCardPlacement(card,menu,{gap=8,top=0}={}){
  if(!card||!menu||card.right<=menu.left||card.left>=menu.right||card.bottom<=menu.top-gap)return {shift:0,fold:false};
  const shift=card.bottom-(menu.top-gap);return {shift,fold:card.top-shift<top};
}
// E4: a small folding card above the event feed with the three active Royal tasks, their progress and reward.
// Hidden while the tutorial shows its bubble so the first minutes stay calm. A finished task flashes, plays a short
// chime (Settings → Sound) and leaves a line in the event feed.
export class RoyalGoalsPanel {
  constructor(scene,goals,{document:doc=globalThis.document}={}){
    this.scene=scene;this.goals=goals;this.doc=doc;this.signature='';
    this.root=doc.createElement('details');this.root.id='royal-goals';this.root.className='royal-goals';this.root.open=true;
    this.summary=doc.createElement('summary');this.list=doc.createElement('ol');this.list.className='royal-goals-list';
    this.root.append(this.summary,this.list);
    const stack=cornerStack(doc);if(stack)stack.prepend(this.root);
    this.off=goals.on((type,goal)=>{if(type==='completed')this.completed(goal);this.render(true);});
    this.render(true);
  }
  completed(goal){
    const reward=rewardText(goal.reward,goal.skillPoints),text=t('goals.doneLine',{name:t(`goals.${goal.id}`),reward});
    this.scene.eventFeed?.push(`royal-goal:${goal.id}`,text,{important:true});this.scene.setStatus?.(text);playChime('goal');
    this.root.classList.remove('goal-flash');void this.root.offsetWidth;this.root.classList.add('goal-flash');
  }
  update(){this.render();this.clearBuildMenu();}
  clearBuildMenu(now=globalThis.performance?.now?.()??0){
    const menu=this.doc.querySelector?.('#buildings-panel'),open=!!menu&&!menu.hidden&&!this.root.hidden;
    if(!open){if(this.shifted||this.autoFolded){this.root.style.transform='';this.shifted=false;if(this.autoFolded)this.root.open=true;this.autoFolded=false;}return;}
    if(now-(this.lastClear??-Infinity)<150)return;this.lastClear=now;
    this.root.style.transform='';const box=menu.getBoundingClientRect(),hud=this.doc.querySelector?.('.inventory')?.getBoundingClientRect?.();
    // m-prehled-kralovstvi-pozice: the full-width strip lifts the corner stack; the card folds rather than cover the top bar.
    const top=Math.max((this.doc.querySelector?.('#game')?.getBoundingClientRect?.().top??0)+8,hud&&hud.height&&hud.bottom<box.top?hud.bottom+8:0);
    let place=goalsCardPlacement(this.root.getBoundingClientRect(),box,{top});
    if(!place.fold&&this.root.open&&this.root.getBoundingClientRect().top<top)place={...place,fold:true};
    if(place.fold&&this.root.open){this.root.open=false;this.autoFolded=true;place=goalsCardPlacement(this.root.getBoundingClientRect(),box,{top});}
    this.shifted=place.shift>0;this.root.style.transform=this.shifted?`translateY(${-Math.ceil(place.shift)}px)`:'';
  }
  render(force=false){
    const hidden=!!this.scene.tutorial?.active;
    const progress=this.goals.progress(),signature=JSON.stringify([hidden,this.goals.revision,progress.map(p=>[p.goal.id,p.value])]);
    if(!force&&signature===this.signature)return;this.signature=signature;
    this.root.hidden=hidden;
    const done=this.goals.done.size,total=this.goals.goals.length;
    this.summary.textContent=`${t('goals.title')} · ${done} / ${total}`;
    if(!progress.length){const li=this.doc.createElement('li');li.className='royal-goal all-done';li.textContent=t('goals.allDone');this.list.replaceChildren(li);return;}
    this.list.replaceChildren(...progress.map(({goal,value})=>{
      const li=this.doc.createElement('li');li.className='royal-goal';li.dataset.goal=goal.id;
      const name=this.doc.createElement('strong');name.textContent=t(`goals.${goal.id}`);
      const count=this.doc.createElement('span');count.className='royal-goal-count';count.textContent=`${value} / ${goal.target}`;
      const bar=this.doc.createElement('progress');bar.max=goal.target;bar.value=value;
      const reward=this.doc.createElement('small');reward.textContent=t('goals.reward',{reward:rewardText(goal.reward,goal.skillPoints)});
      li.append(name,count,bar,reward);return li;
    }));
  }
  relabel(){this.render(true);}
  destroy(){this.off?.();this.root.remove();}
}
