// Battle test 18 Nov 2026, point 10: a night battle was almost invisible. The selected soldiers and everybody in a
// fight (both sides) get a small pale glow, so the player sees where the battle is; a unit with a torch has its own light.
export const UNIT_GLOW=Object.freeze({scale:.55,on:.2,color:'#cfdcff'}),UNIT_GLOW_MAX=60;
export function battleGlow(scene){
  const out=new Set(),lit=u=>scene.lightFuel?.carries?.(u),add=u=>{if(u?.isAlive&&u.position&&!u.away&&u.sleepingIn==null&&!lit(u)&&out.size<UNIT_GLOW_MAX)out.add(u);};
  for(const id of scene.unitSelection?.ids??[]){const w=scene.workerSystem?.workers.get(id);if(w?.profession==='soldier')add(w);}
  for(const [a,t] of scene.combat?.attacks??[]){add(a);add(t);}
  return [...out];
}
