// #99: the Mill's sails turn while a Miller is actually grinding (a "produce" task at that Mill) and slow to a stop
// otherwise. Purely visual: driven by the game time that advanced this frame, so it stops while paused, follows the
// game speed and never jumps or accelerates without bound; nothing is saved. Only the sails layer turns.
export const SAILS = Object.freeze({ turnsPerSecond: 0.16, spinUpSeconds: 2.5 });

export function millGrinding(scene, building) {
  const record = scene.foodProduction?.records?.get(building.id);
  if (!record?.cycle) return false;
  for (const worker of scene.workerSystem?.liveWorkers?.() ?? []) if (worker.workTask?.kind === 'produce' && scene.workplaceSystem?.building?.(worker) === building) return true;
  return false;
}

// One step: speed (0–1) eases towards the target; the angle advances by speed × turns per second.
export function stepSails(state, grinding, seconds) {
  const target = grinding ? 1 : 0, change = Math.min(1, seconds / SAILS.spinUpSeconds);
  state.speed += (target - state.speed) * change; if (state.speed < 0.002 && !grinding) state.speed = 0;
  state.angle = (state.angle + state.speed * SAILS.turnsPerSecond * Math.PI * 2 * seconds) % (Math.PI * 2);
  return state;
}

export class MillSails {
  constructor(scene) { this.scene = scene; this.states = new Map(); }
  update(activeDelta) {
    const seconds = Math.max(0, activeDelta || 0) / 1000; if (!seconds) return;
    for (const building of this.scene.buildings ?? []) {
      const view = this.scene.towerViews?.get(building.id); if (!view?.rotor) continue;
      const state = this.states.get(building.id) ?? { angle: 0, speed: 0 }; this.states.set(building.id, state);
      stepSails(state, millGrinding(this.scene, building), seconds); view.rotor.setRotation(state.angle);
    }
    for (const id of this.states.keys()) if (!this.scene.towerViews?.get(id)?.rotor) this.states.delete(id);
  }
  destroy() { this.states.clear(); }
}
