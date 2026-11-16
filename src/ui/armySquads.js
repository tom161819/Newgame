// Army squads (owner, 12 Nov): soldiers chosen together in the Army panel can be made a squad; a squad is a number on
// each of its soldiers (`worker.squad`, saved), so it lives and dies with them. A soldier is in one squad at most.
export const SQUAD_MAX=99;
const soldiers=scene=>(scene.workerSystem?.liveSubjects?.()??[]).filter(w=>w.profession==='soldier');
// The squads as [{id, members:[worker…]}] by number; a soldier who left the army loses his number here.
export function squads(scene){
  const map=new Map();for(const w of scene.workerSystem?.liveSubjects?.()??[])if(Number.isInteger(w.squad)){if(w.profession!=='soldier'){delete w.squad;continue;}if(!map.has(w.squad))map.set(w.squad,[]);map.get(w.squad).push(w);}
  return [...map].sort((a,b)=>a[0]-b[0]).map(([id,members])=>({id,members}));
}
// Makes a squad of these soldiers (at least two); they leave their old squads. Returns the new number or null.
export function makeSquad(scene,workers){
  const chosen=[...new Set(workers)].filter(w=>w?.isAlive&&w.profession==='soldier');if(chosen.length<2)return null;
  const used=new Set(soldiers(scene).filter(w=>!chosen.includes(w)).map(w=>w.squad).filter(Number.isInteger));
  let id=1;while(used.has(id)&&id<=SQUAD_MAX)id++;if(id>SQUAD_MAX)return null;
  for(const w of chosen)w.squad=id;
  // A squad left with one soldier is no squad.
  for(const s of squads(scene))if(s.members.length<2)for(const w of s.members)delete w.squad;
  return id;
}
export function dissolveSquad(scene,id){let n=0;for(const w of soldiers(scene))if(w.squad===id){delete w.squad;n++;}return n;}
export const squadMembers=(scene,id)=>soldiers(scene).filter(w=>w.squad===id);
// Combat 16 Nov 2026: group N on the number keys – exactly these soldiers (one is enough); others leave group N.
export function setSquad(scene,workers,id){
  const chosen=[...new Set(workers)].filter(w=>w?.isAlive&&w.profession==='soldier');if(!chosen.length||!Number.isInteger(id)||id<1||id>SQUAD_MAX)return 0;
  for(const w of soldiers(scene))if(w.squad===id&&!chosen.includes(w))delete w.squad;for(const w of chosen)w.squad=id;return chosen.length;
}
