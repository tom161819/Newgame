// Práce se dělí v okamžicích příchodu. Nově příchozí nedostane podíl
// za část snímku před příchodem ani za čas po dokončení budovy.
export function advanceConstruction(site,participants,delta){
  const c=site.construction;if(c.state==='complete'||delta<=0)return false;
  const workers=participants.filter(p=>p.available>0&&p.speed>0).map(p=>({...p,start:Math.max(0,delta-p.available)}));
  const boundaries=[...new Set([0,delta,...workers.map(p=>p.start)])].sort((a,b)=>a-b);let remaining=c.requiredWork-c.workDone,changed=false;
  for(let i=0;i<boundaries.length-1&&remaining>1e-8;i++){
    const start=boundaries[i],active=workers.filter(p=>p.start<=start),rate=active.reduce((sum,p)=>sum+p.speed,0);if(!rate)continue;
    const elapsed=Math.min(boundaries[i+1]-start,remaining/rate);if(elapsed<=0)continue;
    for(const p of active)c.contributions[p.id]=(c.contributions[p.id]??0)+elapsed*p.speed;
    const work=elapsed*rate;c.workDone+=work;remaining-=work;changed=true;
  }
  if(changed){if(remaining<1e-7)c.workDone=c.requiredWork;c.progress=Math.min(100,100*c.workDone/c.requiredWork);c.state='building';}
  return c.workDone>=c.requiredWork;
}
