import { t } from '../i18n/index.js';
import { SAVE_VERSION,IncompatibleSaveError,saveSchemaStatus,validateGameState } from './GameStateSerializer.js';

// Moving a save between devices without a backend: a stored slot becomes one JSON
// file and a chosen file becomes a new slot. Files are read only with JSON.parse
// and checked with the same validateGameState as Load, before anything is stored.
export const SAVE_FILE_FORMAT='medieval-kingdom-save';
export const SAVE_FILE_MAX_BYTES=16*1024*1024;

export class SaveFileError extends Error{constructor(message){super(message);this.name='SaveFileError';}}

export function saveFileName(record){
  const name=String(record?.name??'kingdom').normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase().slice(0,40)||'kingdom';
  return `medieval-kingdom-${name}.json`;
}

// Only a current-schema, fully valid slot is exported; a broken slot is never spread further.
export function exportSaveFile(record,{gameVersion=null,now=new Date()}={}){
  if(!record?.state)throw new SaveFileError(t('transfer.noState'));
  const status=saveSchemaStatus(record.state);if(!status.compatible)throw new IncompatibleSaveError(status.savedVersion);
  const state=validateGameState(record.state);
  return JSON.stringify({format:SAVE_FILE_FORMAT,saveVersion:SAVE_VERSION,gameVersion,exportedAt:now.toISOString(),
    save:{id:record.id??null,name:String(record.name??'Království').slice(0,80),createdAt:record.createdAt??null,updatedAt:record.updatedAt??null,day:state.time.day,playTime:state.time.totalElapsed},state});
}

// Returns {id,name,state} or throws SaveFileError / IncompatibleSaveError; never touches a running game.
export function parseSaveFile(text,{size=null}={}){
  const bytes=size??(typeof text==='string'?new TextEncoder().encode(text).length:Infinity);
  if(typeof text!=='string'||bytes>SAVE_FILE_MAX_BYTES)throw new SaveFileError(t('transfer.notSave',{size:SAVE_FILE_MAX_BYTES/1024/1024}));
  let data;try{data=JSON.parse(text);}catch{throw new SaveFileError(t('transfer.notJson'));}
  if(!data||typeof data!=='object'||Array.isArray(data)||data.format!==SAVE_FILE_FORMAT||!data.state||typeof data.state!=='object')throw new SaveFileError(t('transfer.notExport'));
  const status=saveSchemaStatus(data.state);
  if(!status.compatible||data.saveVersion!==data.state.saveVersion)throw new IncompatibleSaveError(status.savedVersion??(Number.isInteger(data.saveVersion)?data.saveVersion:null));
  let state;try{state=validateGameState(data.state);}catch(error){if(error instanceof IncompatibleSaveError)throw error;throw new SaveFileError(t('transfer.damaged'));}
  const save=data.save&&typeof data.save==='object'?data.save:{};
  const id=typeof save.id==='string'&&/^[\w-]{1,80}$/.test(save.id)?save.id:null;
  return {id,name:(typeof save.name==='string'&&save.name.trim()?save.name.trim():t('transfer.importedName')).slice(0,80),state};
}
