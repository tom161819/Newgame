// Day and night N3 (brief zadani-den-noc.md, approved 7 Nov): night threats and the campfire. Each threat can be
// switched off in the New Game setup and in Settings during a game; a switched-off threat does not start (a running
// one finishes).
export const NIGHT_THREATS=Object.freeze({
  ids:Object.freeze(['wolves','thieves','fires']),
  // Plan m-e1-hrozby-pozdeji (owner 7 Nov 2026): threats start once the kingdom is on its feet – 5 finished Houses or
  // the second year, whichever comes first (days counted when seasons are off). The first fire only warns.
  start:Object.freeze({houses:5,year:2,daysWithoutSeasons:20}),
  // Wolves come only at night from far away (map edge, outside light), in packs of 2–4, more often in winter; at dawn
  // they leave. They hunt wild animals and people outdoors, never step into a burning light's radius (a lone torch in
  // hand does not scare them) and flee from 3 or more soldiers within 4 tiles.
  wolves:Object.freeze({
    chance:Object.freeze({Spring:.35,Summer:.25,Autumn:.4,Winter:.7}),pack:Object.freeze([2,4]),
    spawnDistance:28,edge:4,huntRange:40,nearHouses:12,fleeSoldiers:3,fleeRange:4,repathMs:400,leaveMs:40000,
    // m-vlk-zustava (owner, 12 Nov): a wolf that attacked someone stays 2–4 days in a den 15–25 tiles from the attack,
    // roams about 6 tiles round it by day (back to the den when hurt) and may hunt again at night.
    lurk:Object.freeze({days:Object.freeze([2,4]),den:Object.freeze([15,25]),roam:6,hurt:.5,repathMs:3000}),
  }),
  // Thieves: the chance per night grows with unhappiness (kingdom average below 60) and only a store or the castle
  // without a burning light within 6 tiles is a target. A thief takes 10–30 Gold (castle) or 10–20 goods and runs to
  // the map edge; a soldier who sees him (within his sight, so mostly in light) chases him and gets the loot back.
  thieves:Object.freeze({maxChance:.3,happyAt:60,unhappyAt:25,gold:Object.freeze([10,30]),goods:Object.freeze([10,20]),spawnDistance:24,edge:3,catchRange:1.5,repathMs:500,escapeMs:90000}),
  // Fires: a burning flame (post, holder, brazier, campfire) within 2 tiles of a wooden or thatched building may set it
  // alight at night (2 % a night; Drought ×2, Rainy ×0.3, Winter ×0.5). A fire grows, burns the building down in about
  // a quarter of a day and can jump to a wooden neighbour within 2 tiles. Residents within 15 tiles fight it with
  // buckets from the nearest Well or shore; a Well close by makes the trips short.
  fires:Object.freeze({chance:.02,range:2,weather:Object.freeze({Drought:2,Rainy:.3}),winter:.5,burnDays:.25,regrowPerSecond:2,bucket:15,
    spreadEverySeconds:5,spreadChance:.15,helpers:6,helperRange:15,destroyChance:.1,savedHealth:5,fillMs:1000,throwMs:800,startIntensity:60}),
  campfire:Object.freeze({
    // Built from local wood: a tree or a bush within 6 tiles. Burns one night, then ashes for a day.
    woodRange:6,radius:5,ashesDays:1,
  }),
});
