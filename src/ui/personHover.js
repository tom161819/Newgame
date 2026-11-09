import { t } from '../i18n/index.js';
import { JOBS } from '../data/jobs.js';

// Owner 9 Nov 2026 (Grafika chat): hovering a person shows the name and the occupation with its level in that
// occupation ("Builder · lvl 48"), not the overall level. The King shows "King" with his own level; a resident without
// a job "Unemployed" with the overall level. Pure: `unit` is a worker, soldier or the King.
export function personHover(unit,{king=false}={}){
  const name=unit.name??unit.fullName??unit.definition?.name??'';
  if(king)return {name,role:t('hover.role',{role:t('hover.king'),level:unit.experience?.level??1})};
  const job=JOBS[unit.profession],skill=job?.skill?unit.skills?.[job.skill]:null;
  const level=skill?.level??unit.experience?.level??1,role=job?.name??unit.definition?.name??'';
  return {name,role:t('hover.role',{role,level})};
}
