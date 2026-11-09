// m-notice-bar-zasunuti (owner point 80, replaces the 2 s flash line of 0.68.0): the Notices bar slides away to the
// right edge of the screen and leaves a small tab with an arrow (click = slide out) and an exclamation mark while
// there are unread notices. Slid away or not is a browser preference (not in the save). A new notice while it is away
// slides the bar out to one message for `peekMs` (the most important one, "+N" for the others), then back; the
// pointer over it holds it out. A notice that is only quietly updated (m-hlasky-jednou) does not count as new. Pure
// state with explicit times, no DOM and no timers: NoticesPanel draws it and drives the clock.
export const NOTICE_BAR=Object.freeze({storageKey:'newgame.notices.collapsed',peekMs:4000,hoverGraceMs:1000,slideMs:300,seenLimit:500});
export function readCollapsed(storage=globalThis.localStorage){try{return storage?.getItem(NOTICE_BAR.storageKey)==='1';}catch{return false;}}
export function writeCollapsed(value,storage=globalThis.localStorage){try{storage?.setItem(NOTICE_BAR.storageKey,value?'1':'0');return true;}catch{return false;/* still works without storage */}}
// danger > warning > info; the newer one wins a tie.
const RANK=Object.freeze({danger:3,warning:2,info:1});
export const noticeRank=issue=>RANK[issue?.severity]??RANK.warning;
export const mostImportant=list=>list.reduce((a,b)=>noticeRank(b)>noticeRank(a)||(noticeRank(b)===noticeRank(a)&&(b.lastNotified??0)>=(a.lastNotified??0))?b:a);
export class NoticeBarState {
  constructor({collapsed=false}={}){this.collapsed=!!collapsed;this.unread=0;this.seen=new Map();this.started=false;this.peek=null;this.hovered=false;}
  // A notice is new once per report: its key with the time it was reported. A row that comes back quietly keeps
  // that time, so it is not new (the map keeps keys that left the list for that reason).
  fresh(issues){
    const fresh=issues.filter(issue=>this.seen.get(issue.key)!==issue.lastNotified);for(const issue of issues)this.seen.set(issue.key,issue.lastNotified);
    if(this.seen.size>NOTICE_BAR.seenLimit)for(const key of [...this.seen.keys()].slice(0,this.seen.size-NOTICE_BAR.seenLimit))this.seen.delete(key);
    return fresh;
  }
  // Returns the peek (the one message the bar slides out with) when new notices just arrived while it is away, else
  // null. The first call only learns what is already there, so a page that opens slid away shows no old notice.
  observe(issues,now=0){
    const fresh=this.fresh(issues);if(!this.started){this.started=true;return null;}
    if(!this.collapsed||!fresh.length)return null;
    this.unread+=fresh.length;const count=(this.peek?.count??0)+fresh.length;
    this.peek={issue:mostImportant([...(this.peek?[this.peek.issue]:[]),...fresh]),count,more:count-1,until:now+NOTICE_BAR.peekMs};return this.peek;
  }
  get alert(){return this.collapsed&&this.unread>0;}
  // The pointer over the message holds it out; leaving gives it a moment more.
  hover(on,now=0){this.hovered=!!on;if(!on&&this.peek)this.peek.until=Math.max(this.peek.until,now+NOTICE_BAR.hoverGraceMs);}
  // True when the peek just ended (the bar slides back).
  expire(now=0){if(this.peek&&!this.hovered&&now>=this.peek.until){this.peek=null;return true;}return false;}
  setCollapsed(value){this.collapsed=!!value;if(!this.collapsed){this.unread=0;this.peek=null;}return this.collapsed;}
}
