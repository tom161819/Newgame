// Day and night N3 (brief zadani-den-noc.md, approved 7 Nov): night threats and the campfire. Each threat can be
// switched off in the New Game setup and in Settings during a game; a switched-off threat does not start (a running
// one finishes).
export const NIGHT_THREATS=Object.freeze({
  ids:Object.freeze(['wolves','thieves','fires']),
  // Wolves come only at night from far away (map edge, outside light), in packs of 2–4, more often in winter; at dawn
  // they leave. They hunt wild animals and people outdoors, never step into a burning light's radius (a lone torch in
  // hand does not scare them) and flee from 3 or more soldiers within 4 tiles.
  wolves:Object.freeze({
    chance:Object.freeze({Spring:.35,Summer:.25,Autumn:.4,Winter:.7}),pack:Object.freeze([2,4]),
    spawnDistance:28,edge:4,huntRange:40,nearHouses:12,fleeSoldiers:3,fleeRange:4,repathMs:400,leaveMs:40000,
  }),
  campfire:Object.freeze({
    // Built from local wood: a tree or a bush within 6 tiles. Burns one night, then ashes for a day.
    woodRange:6,radius:5,ashesDays:1,
  }),
});
