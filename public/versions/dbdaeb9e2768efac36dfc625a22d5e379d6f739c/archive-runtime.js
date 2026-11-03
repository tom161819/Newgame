(()=>{'use strict';const prefix="newgame-archive-dbdaeb9e2768efac36dfc625a22d5e379d6f739c:";window.__NEWGAME_ARCHIVE_ROOT__="/Newgame/versions/";
const idb=window.indexedDB;if(idb){const open=idb.open.bind(idb),remove=idb.deleteDatabase.bind(idb);idb.open=(name,...args)=>open(prefix+name,...args);idb.deleteDatabase=(name,...args)=>remove(prefix+name,...args);}
const proto=Storage.prototype,get=proto.getItem,set=proto.setItem,remove=proto.removeItem,key=proto.key,length=Object.getOwnPropertyDescriptor(proto,'length').get;
const keys=storage=>{const values=[];for(let i=0;i<length.call(storage);i++){const k=key.call(storage,i);if(k&&k.startsWith(prefix))values.push(k);}return values;};
proto.getItem=function(k){return get.call(this,prefix+k);};proto.setItem=function(k,v){return set.call(this,prefix+k,v);};proto.removeItem=function(k){return remove.call(this,prefix+k);};proto.clear=function(){for(const k of keys(this))remove.call(this,k);};proto.key=function(i){return keys(this)[i]?.slice(prefix.length)??null;};Object.defineProperty(proto,'length',{configurable:true,get(){return keys(this).length;}});
})();
