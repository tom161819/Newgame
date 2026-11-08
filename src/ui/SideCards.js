import { PolicyPanel } from './PolicyPanel.js';
import { t } from '../i18n/index.js';

// Owner request (7 Nov, points 5 and 6): beside the Population tab there are two more pop-out cards – Kingdom Policy
// above it and Employments below it. They behave like Population: a tab opens and closes the card, and only one card is
// open at a time. The Policy card shows the Castle panel's Kingdom policy section, rendered by the same PolicyPanel code
// on a copy of that section; the Employments card is the Castle's Employment panel itself (the Castle still opens it).
// Which card is open lives in the page only, never in a save.
export class SideCards {
  constructor(scene){
    this.scene=scene;this.controller=new AbortController();const options={signal:this.controller.signal};
    this.policyTab=document.querySelector('#policy-tab');this.employmentTab=document.querySelector('#employment-tab');this.populationTab=document.querySelector('#population-tab');
    this.policyCard=document.querySelector('#policy-card');this.employment=scene.employmentPanel;this.population=scene.populationSidebar;
    if(!this.policyTab||!this.employmentTab||!this.policyCard)return;
    const source=document.querySelector('section.kingdom-policy');
    if(source&&scene.policy){
      const copy=source.cloneNode(true);for(const el of [copy,...copy.querySelectorAll('[id]')])el.removeAttribute('id');for(const el of copy.querySelectorAll('[for]'))el.removeAttribute('for');
      copy.removeAttribute('aria-labelledby');copy.setAttribute('aria-label',source.querySelector('h3')?.textContent??'Kingdom policy');copy.querySelector('h3')?.remove();copy.classList.add('policy-card-section');
      document.querySelector('#policy-card-body').replaceChildren(copy);this.policyPanel=new PolicyPanel(scene,{root:copy,ids:false});
    }
    // m-ui-prekryvy-076 (report 0.76.0 point 6): opened from its tab, Employments is a side card of its own – the Castle's
    // Kingdom policy section in it is hidden (Policy has its card) and a link opens the Policy card instead, so the two
    // never show over or inside each other. Opened from the Castle it stays the whole Castle window, as before.
    this.castlePolicy=source;const panel=document.querySelector('#employment-panel');
    if(panel&&source){this.policyLink=document.createElement('button');this.policyLink.type='button';this.policyLink.className='side-card-link';this.policyLink.hidden=true;
      const label=document.createElement('span');label.dataset.i18n='policy.card';label.textContent=t('policy.card');this.policyLink.append(label,' ›');source.before(this.policyLink);
      this.policyLink.addEventListener('click',()=>this.openCard('policy'),options);}
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.policyCard.addEventListener(event,e=>e.stopPropagation(),options);
    this.policyTab.addEventListener('click',()=>this.toggle('policy'),options);this.employmentTab.addEventListener('click',()=>this.toggle('employment'),options);
    document.querySelector('#close-policy-card').addEventListener('click',()=>this.close('policy'),options);
    // Opening any of the three closes the other two (the Castle opening Employments included).
    const setOpen=this.population?.setOpen?.bind(this.population);if(setOpen){this.population.setOpen=value=>{if(value)this.closeOthers('population');setOpen(value);this.sync();};}
    const open=this.employment?.open?.bind(this.employment),close=this.employment?.close?.bind(this.employment);
    if(open){this.employment.open=({card=false}={})=>{this.closeOthers('employment');this.cardMode(card);open();this.sync();};this.employment.close=()=>{close();this.cardMode(false);this.sync();};}
    // The King's / a resident's docked panel shares the right edge with Policy and Employments: one of them at a time.
    const unit=scene.unitPanel,openUnit=unit?.open?.bind(unit);if(openUnit){unit.open=(...args)=>{for(const other of ['policy','employment'])if(this.isOpen(other))this.close(other);return openUnit(...args);};}
    this.layout=()=>this.place();window.addEventListener('resize',this.layout,options);
    this.observer=new MutationObserver(()=>this.place());this.observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-ui-population','data-ui-settings','data-ui-density','style']});
    this.resize=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.place()):null;this.resize?.observe(this.populationTab);
    this.sync();this.place();
  }
  isOpen(name){return name==='policy'?!this.policyCard.hidden:name==='employment'?!document.querySelector('#employment-panel')?.hidden:!!this.population?.open;}
  toggle(name){if(this.isOpen(name))this.close(name);else this.openCard(name);}
  openCard(name){
    this.closeOthers(name);
    if(name!=='population'&&this.scene.unitPanel?.dialog?.open)this.scene.unitPanel.close();
    if(name==='policy'){this.policyCard.hidden=false;this.policyPanel?.render();}else if(name==='employment')this.employment?.open({card:true});else this.population?.setOpen(true);
    this.sync();
  }
  close(name){if(name==='policy')this.policyCard.hidden=true;else if(name==='employment')this.employment?.close();else this.population?.setOpen(false);this.sync();}
  cardMode(on){if(this.castlePolicy)this.castlePolicy.hidden=!!on;if(this.policyLink)this.policyLink.hidden=!on;}
  closeOthers(name){for(const other of ['policy','population','employment'])if(other!==name&&this.isOpen(other))this.close(other);}
  sync(){if(!this.policyTab)return;this.policyTab.setAttribute('aria-expanded',String(this.isOpen('policy')));this.employmentTab.setAttribute('aria-expanded',String(this.isOpen('employment')));}
  // Policy sits just above the Population tab and Employments just below it, on whichever edge the style docks them.
  place(){
    const pop=this.populationTab?.getBoundingClientRect();if(!pop||!pop.height||!this.policyTab)return;const gap=8;
    this.policyTab.style.top=`${Math.max(4,pop.top-this.policyTab.offsetHeight-gap)}px`;this.employmentTab.style.top=`${pop.bottom+gap}px`;
  }
  destroy(){this.controller.abort();this.observer?.disconnect();this.resize?.disconnect();this.policyPanel?.destroy();}
}
