// m-notice-bar-hlasky (owner request 72): the foldable Notices bar. Folded or not is a browser preference (not in the
// save). While folded, a new notice shows its text for a moment next to the fold button and the button keeps an
// unread count until the bar is unfolded. Pure state, no DOM: NoticesPanel draws it.
export const NOTICE_BAR=Object.freeze({storageKey:'newgame.notices.collapsed',flashMs:2000,fadeMs:1000});
export function readCollapsed(storage=globalThis.localStorage){try{return storage?.getItem(NOTICE_BAR.storageKey)==='1';}catch{return false;}}
export function writeCollapsed(value,storage=globalThis.localStorage){try{storage?.setItem(NOTICE_BAR.storageKey,value?'1':'0');return true;}catch{return false;/* still works without storage */}}
// A notice is "new" once per report: its key together with the time it was last reported (a reminder is new again,
// a quiet return of the same row is not).
const stamp=issue=>`${issue.key}@${issue.lastNotified}`;
export class NoticeBarState {
  constructor({collapsed=false}={}){this.collapsed=!!collapsed;this.unread=0;this.seen=new Set();this.started=false;}
  // Returns the newest notice that just arrived while folded (to flash), or null. The first call only learns what is
  // already there, so a page that opens folded does not flash old notices.
  observe(issues){
    const fresh=issues.filter(issue=>!this.seen.has(stamp(issue)));this.seen=new Set(issues.map(stamp));
    if(!this.started){this.started=true;return null;}
    if(!this.collapsed||!fresh.length)return null;
    this.unread+=fresh.length;return fresh.reduce((a,b)=>(b.lastNotified??0)>=(a.lastNotified??0)?b:a);
  }
  setCollapsed(value){this.collapsed=!!value;if(!this.collapsed)this.unread=0;return this.collapsed;}
}
