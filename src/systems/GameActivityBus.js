// Události vznikají až po úspěšné změně světa. ID je součástí uložené hry.
export class GameActivityBus {
  constructor(){this.nextId=1;this.listeners=new Set();}
  on(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  emit(type,data,id=null){const event=Object.freeze({...data,id:id??`activity-${this.nextId++}`,type});for(const listener of this.listeners)listener(event);return event;}
  destroy(){this.listeners.clear();}
}
