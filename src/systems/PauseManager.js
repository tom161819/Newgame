// Jedna pauza může mít více důvodů. Zavření dialogu neruší jiné pozastavení.
export class PauseManager {
  constructor(scene){this.scene=scene;this.reasons=new Set();}
  set(reason,paused){if(paused)this.reasons.add(reason);else this.reasons.delete(reason);this.scene.setPaused(this.reasons.size>0);}
  get paused(){return this.reasons.size>0;}
}
