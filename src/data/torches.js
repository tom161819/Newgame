// Day and night N2 (brief zadani-den-noc.md, approved 7 Nov): pitch, torches and fuelled light places.
// Light radius: tiles × 32 px (DAY_NIGHT.pxPerTile). A place lights up by itself at dusk when its store holds a night's
// fuel (used up at once), and goes out in the morning; an empty place stays dark.
export const TORCHES=Object.freeze({
  // Pitch Kiln: keep this many Torches in the stores, otherwise make Pitch.
  torchTarget:20,
  // Fuelled places: resource, store size, fuel per night, light radius in tiles.
  places:Object.freeze({
    torch_post:Object.freeze({resource:'torch',capacity:2,perNight:1,radius:5}),
    brazier:Object.freeze({resource:'wood',capacity:2,perNight:1,radius:6}),
    // Every tower has two holders: 2 torches a night, room for two nights. Its sight counts only with someone on it.
    tower:Object.freeze({resource:'torch',capacity:4,perNight:2,radius:5,watched:3}),
  }),
  // Haulers refill below construction (10–20) and above ordinary hauling (30+).
  refillPriority:25,
  // A Pitch Maker refills when no Hauler did by midday.
  pitchMakerFrom:.5,
  // Soldiers on watch take one torch at dusk; it lights 3 tiles around them for the night.
  handTorch:Object.freeze({radius:3}),
  // A soldier with "Tend torches" refills places within 8 tiles of his post.
  tendRange:8,
  // A house without an active light within 6 tiles is dark at night: −30 Safety.
  darkHouse:Object.freeze({range:6,penalty:30}),
});
