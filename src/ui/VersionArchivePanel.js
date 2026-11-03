import { element } from './objectLabels.js';

export const displayBuildVersion=version=>version.replace(/(\+(?:git|dev)\.)([a-f0-9]{40})$/,(_match,prefix,commit)=>prefix+commit.slice(0,7));
export class VersionArchivePanel {
  constructor({catalog,onChanges}){
    this.catalog=catalog;this.onChanges=onChanges;this.dialog=document.querySelector('#version-archive-dialog');this.button=document.querySelector('#main-archive');
    this.button.addEventListener('click',()=>this.open());document.querySelector('#archive-back').addEventListener('click',()=>this.close());
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});this.render();
  }
  entry(entry,snapshot=false){
    const row=element('article','archive-version'),heading=element('h3','',`v${displayBuildVersion(entry.version)} — ${entry.title}`);heading.title=entry.version;row.dataset.catalogVersion=entry.version;
    const label=entry.current?'Current Version':snapshot?`Development snapshot · original v${entry.gameVersion}`:entry.reconstructed?'Archived Version · Reconstructed archive label':'Archived Version';
    row.append(heading,element('p','archive-version-label',label),element('p','',entry.description));
    const date=element('time','',entry.date?.slice(0,10)??'Date unavailable');if(entry.date)date.dateTime=entry.date;
    const metadata=element('p','archive-version-meta');metadata.append(date);if(entry.commit){const commit=element('code','',` · ${entry.commit.slice(0,7)}`);commit.title=entry.commit;metadata.append(commit);}row.append(metadata);
    const actions=element('div','archive-version-actions');
    if(entry.available&&entry.archiveURL){const play=element('a','archive-play',entry.current?'Play current game ↗':'Play ↗');play.href=entry.archiveURL;play.target='_blank';play.rel='noopener noreferrer';play.dataset.playVersion=entry.version;actions.append(play);}else actions.append(element('span','','Archive unavailable'));
    if(snapshot){const changes=element('a','','View actual changes ↗');changes.href=`https://github.com/tom161819/Newgame/commit/${entry.commit}`;changes.target='_blank';changes.rel='noopener noreferrer';actions.append(changes);}
    else{const changes=element('button','','View Changes');changes.type='button';changes.dataset.viewChanges=entry.version;changes.addEventListener('click',()=>{this.close(false);this.onChanges(this.catalog.versions.some(v=>v.version===entry.version)?entry.version:null);});actions.append(changes);}
    row.append(actions);return row;
  }
  render(){
    const catalog=this.catalog,entries=catalog.versions.some(v=>v.version===catalog.currentBuild.version)?catalog.versions:[catalog.currentBuild,...catalog.versions];
    document.querySelector('#archive-version-list').replaceChildren(...entries.map(entry=>this.entry(entry)));
    document.querySelector('#archive-snapshot-list').replaceChildren(...catalog.builds.map(entry=>this.entry(entry,true)));
    document.querySelector('#archive-snapshot-count').textContent=`All verified development snapshots (${catalog.builds.length})`;
  }
  open(){if(!this.dialog.open)this.dialog.showModal();this.dialog.scrollTop=0;document.querySelector('#archive-back').focus();}
  close(focus=true){if(!this.dialog.open)return;this.dialog.close();if(focus)this.button.focus();}
}
