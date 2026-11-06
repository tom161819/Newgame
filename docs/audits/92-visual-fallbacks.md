# #92 – Visual fallbacks audit (2026-11-06, main 685cc1d)

The exact list of placeholder looks still used in the game. Approved Studio art that is actually used is not listed again.

## Professions (`PROFESSION_LOOKS`, `src/data/objects/approvedArt.js`)
| Profession | Look in the game today | Studio concept (Review) |
|---|---|---|
| smelter_operator | Miner (`miner-male`/`miner-female`) | `smelter-operator`: soot-brown wool, red kerchief, leather apron, tongs |
| soldier (women) | `soldier-male` for both sexes | approved `military-soldier-woman` exists; mapping it needs the owner's OK, since it is a military unit look |
| swordsmith | no profession look (default villager) | `swordsmith-worker`: blue tunic, leather cap and apron, sword |
| armorer | no profession look (default villager) | `armorer-worker`: grey wool, leather hood, apron, hammer |
| bowyer | no profession look (default villager) | `bowyer-worker`: ochre tunic, green hood, linen apron, stave |
| wheelwright | no profession look (default villager) | `wheelwright`: brown tunic, linen kerchief, leather apron, mallet |
| stablehand | no profession look (default villager) | `stablehand`: green wool, felt brimmed hat, bucket |

The figure recipe gained four tools for these: `tongs`, `mallet`, `stave` and `bucket`. `sword` existed but was not listed among the recipe's documented tool values. Existing figures are unchanged.

## Buildings (procedural renderer, no approved sprite)
| Building | Renderer | Note |
|---|---|---|
| barracks | workplace (procedural) | needs a concept; it should follow the approved armory/military style |
| wheelwright_workshop | workplace (procedural) | needs a concept |
| iron_mine | workplace (procedural) | needs a concept, next to the approved quarry |
| castle | fortification (procedural) | uses the approved wall kit pieces; a castle keep concept is open |
| starter_stockpile | food_building (procedural) | temporary building, dismantled after use (#128); low priority |
| wheat_field, orchard | crop (procedural) | growth stages are drawn procedurally; intentional |
| stone_pavement(_joint) | pavement (procedural cobbles) | intentional |
| builder_workshop (Codex #196) | placeholder | concepts in review (#119) |

## Next steps
- After approval, map the chosen profession looks in `PROFESSION_LOOKS` and export the 8 walking directions.
- Building concepts follow in order: barracks, wheelwright workshop, iron mine.
