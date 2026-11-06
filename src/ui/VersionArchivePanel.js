import { element } from './objectLabels.js';
import { t } from '../i18n/index.js';
import { displayBuildVersion,displayVersion } from '../data/semver.js';
export { displayBuildVersion } from '../data/semver.js';
export class VersionArchivePanel {
  constructor({catalog=null,catalogURL,onChanges}){
    this.catalog=catalog;this.catalogURL=catalogURL;this.onChanges=onChanges;this.dialog=document.querySelector('#version-archive-dialog');this.button=document.querySelector('#main-archive');this.requested=false;
    this.snapshots=document.querySelector('#archive-snapshot-count').closest('details');
    this.button.addEventListener('click',()=>this.open());document.querySelector('#archive-back').addEventListener('click',()=>this.close());
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});
    this.snapshots.addEventListener('toggle',()=>{if(this.snapshots.open&&this.catalog)document.querySelector('#archive-snapshot-list').replaceChildren(...this.catalog.builds.map(entry=>this.entry(entry,true)));});
  }
  entry(entry,snapshot=false){
    const row=element('article','archive-version'),heading=element('h3','',snapshot?t('archive.buildHeading',{number:entry.buildNumber,title:entry.title}):`v${displayBuildVersion(entry.version)} — ${entry.title}`);heading.title=entry.version;row.dataset.catalogVersion=entry.version;if(snapshot)row.dataset.buildNumber=entry.buildNumber;
    const label=entry.current?t('archive.current'):snapshot?t('archive.snapshotLabel',{version:displayVersion(entry.gameVersion)}):entry.reconstructed?t('archive.reconstructed'):t('archive.archived');
    row.append(heading,element('p','archive-version-label',label));if(entry.description&&!(snapshot&&entry.description===entry.title))row.append(element('p','',entry.description));
    const date=element('time','',entry.date?.slice(0,10)??t('archive.noDate'));if(entry.date)date.dateTime=entry.date;
    const metadata=element('p','archive-version-meta');metadata.append(date);if(entry.commit){const commit=element('code','',` · ${entry.commit.slice(0,7)}`);commit.title=entry.commit;metadata.append(commit);}row.append(metadata);
    const actions=element('div','archive-version-actions');
    if(entry.available&&entry.archiveURL){const play=element('a','archive-play',entry.current?t('archive.playCurrent'):t('archive.play'));play.href=entry.archiveURL;play.target='_blank';play.rel='noopener noreferrer';play.dataset.playVersion=entry.version;actions.append(play);}else actions.append(element('span','',t('archive.unavailable')));
    if(snapshot){const changes=element('a','',t('archive.viewActual'));changes.href=`https://github.com/tom161819/Newgame/commit/${entry.commit}`;changes.target='_blank';changes.rel='noopener noreferrer';actions.append(changes);}
    else{const changes=element('button','',t('archive.viewChanges'));changes.type='button';changes.dataset.viewChanges=entry.version;changes.addEventListener('click',()=>{this.close(false);this.onChanges(this.catalog.versions.some(v=>v.version===entry.version)?entry.version:null);});actions.append(changes);}
    row.append(actions);return row;
  }
  relabel(){if(this.dialog.open&&this.catalog)this.render();}
  render(){
    const catalog=this.catalog,entries=catalog.versions.some(v=>v.version===catalog.currentBuild.version)?catalog.versions:[catalog.currentBuild,...catalog.versions];
    document.querySelector('#archive-version-list').replaceChildren(...entries.map(entry=>this.entry(entry)));
    document.querySelector('#archive-snapshot-list').replaceChildren();this.snapshots.open=false;
    document.querySelector('#archive-snapshot-count').textContent=t('archive.snapshotCount',{count:catalog.builds.length});
  }
  async open(){
    this.requested=true;this.button.disabled=true;this.button.setAttribute('aria-busy','true');
    const message=document.querySelector('#archive-load-message');message.hidden=true;
    try{
      if(!this.catalog){this.pending??=fetch(this.catalogURL).then(async response=>{if(!response.ok)throw new Error(t('archive.catalogUnavailable'));const catalog=await response.json();if(catalog.schema!==1||!Array.isArray(catalog.versions)||!Array.isArray(catalog.builds))throw new Error(t('archive.catalogInvalid'));return catalog;});this.catalog=await this.pending;}
      if(!this.requested)return;this.render();if(!this.dialog.open)this.dialog.showModal();this.dialog.scrollTop=0;document.querySelector('#archive-back').focus();
    }catch(error){this.pending=null;if(this.requested){message.textContent=error.message;message.hidden=false;if(!this.dialog.open)this.dialog.showModal();}}
    finally{this.button.disabled=false;this.button.removeAttribute('aria-busy');}
  }
  close(focus=true){
    this.requested=false;this.snapshots.open=false;document.querySelector('#archive-version-list').replaceChildren();document.querySelector('#archive-snapshot-list').replaceChildren();
    if(!this.dialog.open)return;this.dialog.close();if(focus)this.button.focus();
  }
}
