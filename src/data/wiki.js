// m-wiki-napoveda (owner 7 Nov 2026): the in-game Wiki. Pages for buildings, resources and professions are generated
// from the game's own data (src/systems/Wiki.js), so they never go out of date. The topic pages below are written by
// hand (texts `wiki.topic.<id>.title` / `.body` in i18n, EN and CS) and link to related pages.
// m-wiki-v2: hand-written parts of a page (i18n key wiki.text.<kind>.<id>.<part>) and the ends of a chain.
export const WIKI_TEXT_PARTS=Object.freeze(['why','how','tips']);
export const wikiTextKey=(pageId,part)=>`wiki.text.${String(pageId).replace(':','.')}.${part}`;
export const WIKI_SINKS=Object.freeze(['people','construction','haulers']);
export const WIKI_CATEGORIES=Object.freeze(['chains','buildings','resources','professions','animals','needs','policy','trade','seasons','events']);
export const WIKI_TOPICS=Object.freeze([
  Object.freeze({id:'rats',category:'animals',links:Object.freeze(['building:granary','building:farmhouse','topic:dogs','resource:bread'])}),
  Object.freeze({id:'dogs',category:'animals',links:Object.freeze(['building:hunting_lodge','profession:hunter','topic:rats'])}),
  Object.freeze({id:'fire',category:'events',links:Object.freeze(['building:well','building:house','topic:needs'])}),
  Object.freeze({id:'needs',category:'needs',links:Object.freeze(['building:house','topic:taxes','topic:rats'])}),
  Object.freeze({id:'taxes',category:'policy',links:Object.freeze(['topic:needs','resource:gold'])}),
  Object.freeze({id:'trade',category:'trade',links:Object.freeze(['building:marketplace','building:warehouse','resource:gold'])}),
  Object.freeze({id:'winter',category:'seasons',links:Object.freeze(['building:fisherman_hut','building:granary','topic:needs'])}),
  Object.freeze({id:'builders',category:'professions',links:Object.freeze(['building:builder_workshop','profession:builder','profession:hauler'])}),
]);
// Generated pages that also link to a topic.
export const WIKI_PAGE_LINKS=Object.freeze({
  'building:granary':['topic:rats','topic:winter'],'building:warehouse':['topic:trade'],'building:starter_stockpile':['topic:rats'],'building:farmhouse':['topic:rats'],
  'building:hunting_lodge':['topic:dogs'],'building:well':['topic:fire'],'building:house':['topic:needs','topic:fire','topic:rats'],
  'building:marketplace':['topic:trade'],'building:builder_workshop':['topic:builders'],'building:fisherman_hut':['topic:winter'],
  'profession:builder':['topic:builders'],'profession:hunter':['topic:dogs'],'resource:gold':['topic:taxes','topic:trade'],
});
// Event feed keys (by prefix) and Notices reasons with a Wiki topic: they show a small "i" that opens it.
export const WIKI_FEED_TOPICS=Object.freeze({rats:'rats',cat:'rats',dog:'dogs',caravan:'trade',trade:'trade',strike:'needs',leaving:'needs',emigration:'needs',fire:'fire',season:'winter'});
export const WIKI_NOTICE_TOPICS=Object.freeze({foodLow:'needs',food:'needs',noBuilder:'builders',waitingMaterial:'builders',noHauler:'builders',noWater:'fire',gold:'taxes'});
export const wikiTopicForFeed=key=>WIKI_FEED_TOPICS[String(key).split(':')[0]]??null;
