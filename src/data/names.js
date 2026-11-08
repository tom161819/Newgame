import CS from './names.cs.js';
import EN from './names.en.js';

// m-obyvatele-jmena-spanek-pohyb (31): resident names "first surname origin". A resident stores a language-neutral
// identity {sex,first,surname,origin} of list indices; the text is built in the current game language, so a
// language switch renames everybody sensibly. Lists of both languages are index-aligned (tests check the lengths).
export const NAME_LISTS=Object.freeze({cs:CS,en:EN});
export const NAME_SIZES=Object.freeze({male:EN.male.length,female:EN.female.length,surnames:EN.surnames.length,origins:EN.origins.length,boy:EN.children.boy.length,girl:EN.children.girl.length});
const lists=lang=>NAME_LISTS[lang]??NAME_LISTS.en;

// Czech female surname: -ý → -á, -í/-ů unchanged, -ec → -cová, -ek → -ková (fleeting e), -a/-e/-o/-ě → -ová,
// a consonant → +ová; irregular ones come from the list.
export function czechFemale(surname){
  const s=String(surname),o=CS.female_surnames[s];if(o)return o;
  if(s.endsWith('ý'))return `${s.slice(0,-1)}á`;
  if(/[íů]$/.test(s))return s;
  if(s.endsWith('ec'))return `${s.slice(0,-2)}cová`;
  if(s.endsWith('ek'))return `${s.slice(0,-2)}ková`;
  if(/[aeoě]$/.test(s))return `${s.slice(0,-1)}ová`;
  return `${s}ová`;
}
export const surnameText=(index,sex,lang)=>{const s=lists(lang).surnames[index]??'';return lang==='cs'&&sex==='f'?czechFemale(s):s;};
export const firstNameText=(identity,lang)=>lists(lang)[identity.sex==='f'?'female':'male'][identity.first]??'';
export const originText=(index,lang)=>lists(lang).origins[index]??'';
export const shortName=(identity,lang)=>`${firstNameText(identity,lang)} ${surnameText(identity.surname,identity.sex,lang)}`;
export const fullName=(identity,lang)=>`${shortName(identity,lang)} ${originText(identity.origin,lang)}`;
// Children: a diminutive first name and the family's surname (female form for a girl) and origin.
export const childShortName=(sex,nameIndex,family,lang)=>{const list=lists(lang).children[sex==='girl'?'girl':'boy'],first=list[nameIndex%list.length];return family?`${first} ${surnameText(family.surname,sex==='girl'?'f':'m',lang)}`:first;};
export const childFullName=(sex,nameIndex,family,lang)=>family?`${childShortName(sex,nameIndex,family,lang)} ${originText(family.origin,lang)}`:childShortName(sex,nameIndex,null,lang);

// Uniqueness is kept on sex + first + surname, so the short form is unique in every language.
export const identityKey=i=>`${i.sex}:${i.first}:${i.surname}`;
const index=(v,size)=>Number.isInteger(v)&&v>=0&&v<size;
export function validIdentity(i){
  return !!i&&typeof i==='object'&&!Array.isArray(i)&&Object.keys(i).sort().join()==='first,origin,sex,surname'&&['m','f'].includes(i.sex)
    &&index(i.first,i.sex==='f'?NAME_SIZES.female:NAME_SIZES.male)&&index(i.surname,NAME_SIZES.surnames)&&index(i.origin,NAME_SIZES.origins);
}
// A new identity from a seeded random; `taken` holds identityKey()s already used in this game. sex/surname/origin
// may be fixed (a family). Random draws first, then a full scan, so a free name is always found while one exists.
export function pickIdentity(random,taken=new Set(),{sex=null,surname=null,origin=null}={}){
  sex??=random()<.5?'m':'f';const firsts=sex==='f'?NAME_SIZES.female:NAME_SIZES.male,pick=n=>Math.min(n-1,Math.floor(random()*n));
  const o=origin??pick(NAME_SIZES.origins),fixed=surname!=null;
  for(let i=0;i<64;i++){const c={sex,first:pick(firsts),surname:fixed?surname:pick(NAME_SIZES.surnames),origin:o};if(!taken.has(identityKey(c)))return c;}
  const s0=fixed?surname:pick(NAME_SIZES.surnames),f0=pick(firsts);
  for(let ds=0;ds<(fixed?1:NAME_SIZES.surnames);ds++)for(let df=0;df<firsts;df++){const c={sex,first:(f0+df)%firsts,surname:(s0+ds)%NAME_SIZES.surnames,origin:o};if(!taken.has(identityKey(c)))return c;}
  return {sex,first:f0,surname:s0,origin:o};
}
