import { t } from '../i18n/index.js';
import { element,formatCost } from './objectLabels.js';
import { castleUpgradePlan,upgradeCastle } from '../game/castleUpgrade.js';
import { CASTLE_LEVELS,CASTLE_MAX_LEVEL,castleLevel } from '../data/castle.js';

// m-hrad-urovne: the Castle's level, what it gives and the Upgrade button – drawn in the building detail (the window a
// click on the Castle opens) and in the Castle's Employment card. Returns the key of what is drawn (redrawn on change).
export function renderCastleUpgrade(scene,box,castle,drawnKey=null){
  const level=castleLevel(castle),rules=CASTLE_LEVELS[level],plan=castleUpgradePlan(scene,castle),cost=plan.rules?formatCost(plan.rules.cost,scene.objectRegistry):'';
  const key=JSON.stringify([castle.id,level,castle.level??0,plan.error??'',cost]);if(key===drawnKey)return key;
  const parts=[element('h3','',t('castle.level',{level,max:CASTLE_MAX_LEVEL})),element('p','employment-help',t(castle.level?'castle.gives':'castle.legacy',{hp:rules.hp,residents:rules.residents,safety:rules.safety,income:rules.income}))];
  if(!plan.max){const b=element('button','castle-upgrade-button',t('castle.upgrade',{level:plan.next,cost}));b.type='button';b.dataset.castleUpgrade='1';b.disabled=!!plan.error;const next=plan.rules;
    parts.push(element('p','employment-help',t('castle.next',{size:`${next.size} × ${next.size}`,hp:next.hp,residents:next.residents,safety:next.safety,income:next.income})),b);if(plan.error)parts.push(element('p','castle-upgrade-error',plan.error));}
  else parts.push(element('p','employment-help',t('castle.maxLevel')));
  box.replaceChildren(...parts);return key;
}
export function clickCastleUpgrade(scene){
  const castle=scene.buildings.find(b=>b.type==='castle'),result=upgradeCastle(scene,castle);scene.setStatus?.(result.error??t(result.ordered?'castle.upgradeOrdered':'castle.upgraded',{level:result.next}));return result;
}
