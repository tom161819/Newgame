import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { staffingOutput,validStaffing } from '../data/workplaces.js';
import { WORKPLACE_AUTHORING_KEY } from '../data/workplaceAuthoring.js';
export function workplaceAuthoringEditor(registry,definition,onApply){
  const section=element('details');section.dataset.workplaceEditor=definition.id;
  section.append(element('summary','',t('staffing.editor.title')));
  const capacity=element('input');capacity.type='number';capacity.min='1';capacity.max='50';capacity.value=definition.workplace.capacity;capacity.dataset.staffingCapacity='';
  const curve=element('input');curve.type='text';curve.value=definition.workplace.staffingOutput?.map(n=>n*100).join(', ')??'';curve.dataset.staffingCurve='';
  for(const [label,input]of [[t('staffing.editor.capacity'),capacity],[t('staffing.editor.curve'),curve]]){const row=element('label','setting-row',label);row.append(input);section.append(row);}
  const preview=element('p'),status=element('p');preview.dataset.staffingPreview='';status.setAttribute('role','status');
  const value=()=>({capacity:Number(capacity.value),...(curve.value.trim()?{staffingOutput:curve.value.split(',').map(n=>n.trim()===''?NaN:Number(n.trim())/100)}:{})});
  const refresh=()=>{const spec=value();preview.textContent=validStaffing(spec)?Array.from({length:spec.capacity+1},(_,i)=>spec.capacity-i).map(n=>`${n} → ${Math.round(staffingOutput(spec,n)*100)} %`).join(' / '):t('staffing.editor.invalid');};
  capacity.addEventListener('input',refresh);curve.addEventListener('input',refresh);refresh();
  const report=message=>{const live=document.querySelector(`[data-workplace-editor="${definition.id}"] [role="status"]`)??status;live.textContent=message;live.closest('details').open=true;};
  const apply=input=>{
    try{registry.configureWorkplaces(input);onApply?.();try{localStorage.setItem(WORKPLACE_AUTHORING_KEY,JSON.stringify(input));report(t('staffing.editor.saved'));}catch{report(t('staffing.editor.sessionOnly'));}}
    catch{report(t('staffing.editor.invalid'));}
  };
  const save=element('button','',t('staffing.editor.apply'));save.type='button';save.dataset.staffingApply='';save.addEventListener('click',()=>apply({version:1,workplaces:{...registry.workplaceOverrides,[definition.id]:value()}}));
  const download=element('button','',t('staffing.editor.export'));download.type='button';download.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,workplaces:registry.workplaceOverrides},null,2)],{type:'application/json'})),link=element('a');link.href=url;link.download='workplaces.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  const upload=element('input');upload.type='file';upload.accept='.json,application/json';upload.setAttribute('aria-label',t('staffing.editor.import'));upload.addEventListener('change',async()=>{try{const input=JSON.parse(await upload.files[0].text());apply(input);}catch{report(t('staffing.editor.invalid'));}});
  section.append(preview,element('p','',t('staffing.editor.help')),save,download,upload,status);return section;
}
