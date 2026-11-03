export class SaveGameManager {
  constructor({indexedDB=globalThis.indexedDB,name='newgame-saves'}={}){this.indexedDB=indexedDB;this.name=name;this.database=null;}
  async open(){
    if(this.database)return this.database;
    if(!this.indexedDB)throw new Error('Ukládání v tomto prohlížeči není dostupné.');
    return new Promise((resolve,reject)=>{
      const request=this.indexedDB.open(this.name,1);
      request.onupgradeneeded=()=>request.result.createObjectStore('saves',{keyPath:'id'});
      request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Úložiště používá jiná otevřená verze hry.'));
      request.onsuccess=()=>{this.database=request.result;this.database.onversionchange=()=>{this.database.close();this.database=null;};resolve(this.database);};
    });
  }
  async transaction(mode,operation){
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('saves',mode);let result;
      tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error??new Error('Operace s uloženou hrou selhala.'));
      tx.onerror=()=>{};
      try{const request=operation(tx.objectStore('saves'));request.onsuccess=()=>{result=request.result;};}
      catch(error){tx.abort();reject(error);}
    });
  }
  async list(){return (await this.transaction('readonly',store=>store.getAll())).sort((a,b)=>String(b.updatedAt??'').localeCompare(String(a.updatedAt??'')));}
  get(id){return this.transaction('readonly',store=>store.get(id));}
  delete(id){return this.transaction('readwrite',store=>store.delete(id));}
  async save({id=null,name,state}){
    const now=new Date().toISOString(),previous=id?await this.get(id):null;
    if(id&&!previous)throw new Error('Uložená pozice již neexistuje.');
    const record={id:id??globalThis.crypto.randomUUID(),name:String(name).trim().slice(0,80)||'Království',
      createdAt:previous?.createdAt??now,updatedAt:now,day:state.time.day,playTime:state.time.totalElapsed,saveVersion:state.saveVersion,state};
    // Jediný atomický put. Při selhání transakce zůstane předchozí záznam platný.
    await this.transaction('readwrite',store=>store.put(record));return record;
  }
  close(){this.database?.close();this.database=null;}
}
