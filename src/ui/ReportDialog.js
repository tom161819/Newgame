import { TELEMETRY,telemetryHost } from '../data/telemetry.js';
import { t } from '../i18n/index.js';

// Owner 15 Nov: "Report a problem" from the main menu and the pause menu. The message goes to the owner by e-mail
// (Web3Forms) with the version, day and population. At most `perHour` messages an hour from one browser.
export function recentReports(storage,now=Date.now(),key=TELEMETRY.report.storageKey){
  let list=[];try{list=JSON.parse(storage?.getItem(key)??'[]');}catch{}return(Array.isArray(list)?list:[]).filter(at=>Number.isFinite(at)&&now-at<3600000);
}
export function reportPayload({kind,text,contact,version,context,accessKey=TELEMETRY.report.accessKey}){
  const message=String(text??'').trim().slice(0,TELEMETRY.report.maxLength),about=TELEMETRY.report.kinds.includes(kind)?kind:'other';
  return{access_key:accessKey,subject:`Medieval Kingdom ${version}: ${about}`,from_name:'Medieval Kingdom',message,kind:about,contact:String(contact??'').trim().slice(0,200)||'—',version,...context};
}
export class ReportDialog {
  constructor({storage,version,context,hostname=globalThis.location?.hostname,telemetry=null}){
    this.storage=storage;this.version=version;this.context=context;this.telemetry=telemetry;
    this.available=!!TELEMETRY.report.accessKey&&telemetryHost(hostname);
    this.dialog=document.querySelector('#report-dialog');if(!this.dialog)return;
    this.form=this.dialog.querySelector('form');this.text=this.dialog.querySelector('#report-text');this.kind=this.dialog.querySelector('#report-kind');this.contact=this.dialog.querySelector('#report-contact');this.status=this.dialog.querySelector('#report-status');this.sendButton=this.dialog.querySelector('#report-send');this.stats=this.dialog.querySelector('#report-stats');
    for(const button of document.querySelectorAll('[data-report-open]')){button.hidden=!this.available;button.addEventListener('click',()=>this.open());}
    this.dialog.querySelector('#report-cancel')?.addEventListener('click',()=>this.dialog.close());
    this.form?.addEventListener('submit',event=>{event.preventDefault();this.send();});
    this.stats?.addEventListener('change',()=>this.telemetry?.setOptOut(!this.stats.checked));
  }
  open(){if(!this.dialog)return;this.status.textContent='';this.sendButton.disabled=false;if(this.stats){this.stats.checked=!!this.telemetry?.enabled;this.stats.closest('label').hidden=!this.telemetry?.available;}this.dialog.showModal();this.text.focus();}
  async send(){
    const text=this.text.value.trim();if(!text){this.status.textContent=t('report.empty');return;}
    const recent=recentReports(this.storage);if(recent.length>=TELEMETRY.report.perHour){this.status.textContent=t('report.tooMany');return;}
    this.sendButton.disabled=true;this.status.textContent=t('report.sending');
    try{
      const r=await fetch(TELEMETRY.report.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(reportPayload({kind:this.kind.value,text,contact:this.contact.value,version:this.version,context:this.context?.()??{}}))});
      const body=await r.json().catch(()=>({}));if(!r.ok||body.success===false)throw new Error(body.message||r.status);
      try{this.storage?.setItem(TELEMETRY.report.storageKey,JSON.stringify([...recent,Date.now()]));}catch{}
      this.text.value='';this.status.textContent=t('report.sent');setTimeout(()=>this.dialog.open&&this.dialog.close(),1600);
    }catch{this.status.textContent=t('report.failed');this.sendButton.disabled=false;}
  }
}
