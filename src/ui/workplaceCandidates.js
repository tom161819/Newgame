// Assign Worker groups, in this fixed order: people of this profession without a workplace, other people without a
// workplace (another profession or Unemployed), and last those who already work in a building.
// Every group is sorted by the skill the building needs: level, then XP in that skill, then a natural talent for it,
// then overall level, then the stable worker id.
export const CANDIDATE_GROUPS=Object.freeze(['profession','free','employed']);

const workerNumber=id=>Number(String(id).match(/(\d+)$/)?.[1]??Number.MAX_SAFE_INTEGER);
export function compareCandidates(skill){
  return (a,b)=>(b.skills?.[skill]?.level??1)-(a.skills?.[skill]?.level??1)
    ||(b.skills?.[skill]?.totalXP??0)-(a.skills?.[skill]?.totalXP??0)
    ||Number(b.naturalTalent===skill)-Number(a.naturalTalent===skill)
    ||(b.experience?.level??1)-(a.experience?.level??1)
    ||workerNumber(a.id)-workerNumber(b.id)||String(a.id).localeCompare(String(b.id));
}
export function candidateGroups(workers,{profession,skill}){
  const groups={profession:[],free:[],employed:[]};
  for(const worker of workers)groups[worker.assignedWorkplaceId!=null?'employed':worker.profession===profession?'profession':'free'].push(worker);
  for(const list of Object.values(groups))list.sort(compareCandidates(skill));
  return groups;
}
