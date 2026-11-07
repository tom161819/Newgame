# Wiki in the game, "i" on messages, rats advice (m-wiki-napoveda)

## What and why
Owner requests 7 Nov 2026 (points 33, 46).

## Files and systems
- `src/data/wiki.js`: categories (Buildings, Resources, Professions, Animals, Needs & Happiness, Policy, Trade,
  Seasons, Events), 8 hand-written topics (Rats & Cats, Hunting dogs, Fire, Needs & Happiness, Taxes & Rations,
  Trade & Caravans, Winter & Fishing, Builders' Workshop; texts `wiki.topic.*` in EN and CS), links from generated
  pages to topics, and the mapping of event feed keys / Notices reasons to topics.
- `src/systems/Wiki.js`: pages generated from the registry and JOBS – buildings (price, size, workers, uses / makes,
  storage, residents, description), resources (group, made in, used in) and professions (where they work) – so the
  Wiki never goes out of date; search and categories.
- `src/ui/WikiPanel.js`: "Wiki" button next to "?", window with search, categories, page, "See also" links and
  Back; `wikiInfoButton` – the small "i" on event feed lines (`EventFeed.push`) and Notices rows with a topic.
- Rats advice (33): a one-time tip when rats first appear and no cat lives anywhere ("Rats are eating your food. Get a
  cat…"); its "More" opens the Wiki on Rats & Cats (`src/data/tips.js` `wiki`).
- Fixed stale texts: Granary (1000 + 1000) and Starter Stockpile (300) descriptions.

## Implementation decisions
- The rats advice uses the existing one-time tips instead of a new Getting started step (it is remembered in the
  browser like other tips).

## Save/Load impact
None.

## Testing
`tests/wiki.test.js` (every building, resource and profession has a page, links resolve, topics in both languages,
mappings, rats tip); browser smoke `--wiki`.

## Notes for the next agent
- New hand-written pages: add to `WIKI_TOPICS` with texts in en/cs; new message types can map to a topic in
  `WIKI_FEED_TOPICS` / `WIKI_NOTICE_TOPICS`.
