import en from './en.js';
import cs from './cs.js';

// One key-based translation system for the whole UI. Adding a language means
// adding one dictionary here; a missing key falls back to English, then to the
// key itself, so the UI never shows "undefined". Plural values are objects keyed
// by Intl.PluralRules categories (one, few, many, other).
export const LANGUAGES=Object.freeze({en:Object.freeze({label:'English',dictionary:en}),cs:Object.freeze({label:'Čeština',dictionary:cs})});
export const DEFAULT_LANGUAGE='en';
const STORAGE_KEY='newgame.language',listeners=new Set(),rules=new Map();
let current=DEFAULT_LANGUAGE;

export function readLanguage(storage,browserLanguage=globalThis.navigator?.language){
  try{const stored=storage?.getItem(STORAGE_KEY);if(Object.hasOwn(LANGUAGES,stored))return stored;}catch{/* Storage may be blocked. */}
  const preferred=String(browserLanguage??'').slice(0,2).toLowerCase();return Object.hasOwn(LANGUAGES,preferred)?preferred:DEFAULT_LANGUAGE;
}
export function language(){return current;}
function plural(lang,count){if(!rules.has(lang))rules.set(lang,new Intl.PluralRules(lang));return rules.get(lang).select(Number(count)||0);}
function lookup(lang,key,params){
  let value=LANGUAGES[lang]?.dictionary[key];
  if(value&&typeof value==='object')value=value[plural(lang,params.count)]??value.other;
  return typeof value==='string'?value:null;
}
export function t(key,params={}){
  const text=lookup(current,key,params)??lookup(DEFAULT_LANGUAGE,key,params)??key;
  return text.replace(/\{(\w+)\}/g,(_,name)=>params[name]===undefined||params[name]===null?'':String(params[name]));
}
export function hasKey(key,lang=DEFAULT_LANGUAGE){return Object.hasOwn(LANGUAGES[lang].dictionary,key);}

// Static markup: data-i18n="key" sets the text; data-i18n-attr="aria-label:key;title:key" sets attributes.
export function applyTranslations(root=globalThis.document){
  if(!root?.querySelectorAll)return;
  for(const node of root.querySelectorAll('[data-i18n]'))node.textContent=t(node.dataset.i18n);
  for(const node of root.querySelectorAll('[data-i18n-attr]'))for(const pair of node.dataset.i18nAttr.split(';')){const [attr,key]=pair.split(':');if(attr&&key)node.setAttribute(attr.trim(),t(key.trim()));}
  if(root.documentElement)root.documentElement.lang=current;
}
export function setLanguage(lang,{storage,persist=true}={}){
  if(!Object.hasOwn(LANGUAGES,lang))return false;
  current=lang;if(persist)try{storage?.setItem(STORAGE_KEY,lang);}catch{/* Keep the choice for this session. */}
  applyTranslations();for(const listener of listeners)listener(lang);return true;
}
export function onLanguageChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function initLanguage(storage){current=readLanguage(storage);applyTranslations();return current;}
