import { t } from '../i18n/index.js';
import { GameTip } from './KingdomOverview.js';
import { sceneKingdomRank,rankName,rankRequirementLine } from '../game/kingdomRankState.js';

// m-uroven-kralovstvi (owner 21 Nov 2026): the HUD's second row shows the kingdom's rank (by the Castle level) and how
// many conditions for the next rank are met ("Kingdom: Settlement · 3/5"); hover or focus lists the conditions.
export function kingdomRankLabel(rank){
  const name=rankName(rank.rank);if(!rank.next)return t('kingdom.labelMax',{rank:name});
  return rank.total?t('kingdom.label',{rank:name,met:rank.met,total:rank.total}):t('kingdom.labelNone',{rank:name});
}
export function kingdomRankTip(rank){
  const lines=[t('kingdom.tipTitle',{rank:rankName(rank.rank),level:rank.level})];
  if(!rank.next)lines.push(t('kingdom.tipMax'));
  else if(!rank.total)lines.push(t('kingdom.tipLater',{rank:rankName(rank.nextRank),level:rank.next}));
  else{lines.push(t('kingdom.tipNext',{rank:rankName(rank.nextRank),level:rank.next,met:rank.met,total:rank.total}),...rank.items.map(rankRequirementLine),t(rank.ready?'kingdom.tipReady':'kingdom.tipHow'));}
  return lines.join('\n');
}
export class KingdomRankDisplay {
  constructor(scene,{document:doc=globalThis.document}={}){
    this.scene=scene;this.el=doc?.querySelector?.('#kingdom-rank');this.next=0;if(!this.el)return;
    this.abort=new AbortController();this.tip=new GameTip(doc,[this.el],{signal:this.abort.signal});this.update(true);
  }
  update(force=false){
    if(!this.el)return;const now=globalThis.performance?.now?.()??Date.now();if(!force&&now<this.next)return;this.next=now+500;
    const rank=sceneKingdomRank(this.scene),label=kingdomRankLabel(rank),tip=kingdomRankTip(rank);
    if(this.el.textContent!==label)this.el.textContent=label;if(this.el.dataset.tip!==tip){this.el.dataset.tip=tip;this.el.setAttribute('aria-label',tip.split('\n')[0]);this.tip?.refresh();}
    this.el.dataset.ready=String(rank.ready);
  }
  relabel(){this.update(true);}
  destroy(){this.abort?.abort();this.tip?.destroy();}
}
