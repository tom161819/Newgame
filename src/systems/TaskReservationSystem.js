export class TaskReservationSystem {
  constructor(){this.owners=new Map();}
  reserve(key,actorId){const owner=this.owners.get(key);if(owner&&owner!==actorId)return false;this.owners.set(key,actorId);return true;}
  available(key,actorId){return !this.owners.has(key)||this.owners.get(key)===actorId;}
  release(key,actorId){if(this.owners.get(key)===actorId)this.owners.delete(key);}
  releaseActor(actorId){for(const [key,owner]of this.owners)if(owner===actorId)this.owners.delete(key);}
  clear(){this.owners.clear();}
}
