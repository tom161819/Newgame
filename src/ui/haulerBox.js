import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';

// m-nosici-auto / m-nosici-panel (point 40): the wanted number of Haulers with the recommended number marked, and the
// Builders for information. Drawn in the Population panel above the soldiers.
export const haulerBoxKey=scene=>{const e=scene.employment;return [e.haulers,e.haulerTarget(),e.recommendedHaulers(),e.count('hauler'),e.residentCount(),e.count('builder'),e.builderTarget(),e.builderPlaces()].join();};
export function renderHaulerBox(scene,box){
  const e=scene.employment,button=(text,step,label)=>{const b=element('button','',text);b.type='button';b.dataset.haulers=step;if(label)b.setAttribute('aria-label',label);return b;},recommended=e.recommendedHaulers(),target=e.haulerTarget(),auto=e.haulers===null;
  const row=element('div','employment-row'),controls=element('span','employment-stepper'),value=element('strong','employment-hauler-count'+(target===recommended?' is-recommended':''),String(target));
  controls.append(button('−','-1',t('employment.haulers.less')),value,button('+','1',t('employment.haulers.more')));row.append(element('span','',t('employment.haulers.wanted')),controls);
  const note=element('p','employment-help',t(auto?'employment.haulers.auto':'employment.haulers.manual',{recommended,now:e.count('hauler'),residents:e.residentCount()}));
  const reset=button(t('employment.haulers.useRecommended',{recommended}),'auto');reset.className='employment-recommended';reset.disabled=auto;
  const builders=element('p','employment-help',t(e.builderPlaces()?'employment.builders.auto':'employment.builders.none',{now:e.count('builder'),target:e.builderTarget(),places:e.builderPlaces()}));
  box.replaceChildren(row,note,reset,builders);
}
