// Day and night N3 (brief zadani-den-noc.md, approved 7 Nov): night threats and the campfire. Each threat can be
// switched off in the New Game setup and in Settings during a game; a switched-off threat does not start (a running
// one finishes).
export const NIGHT_THREATS=Object.freeze({
  ids:Object.freeze(['wolves','thieves','fires']),
  campfire:Object.freeze({
    // Built from local wood: a tree or a bush within 6 tiles. Burns one night, then ashes for a day.
    woodRange:6,radius:5,ashesDays:1,
  }),
});
