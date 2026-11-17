// p71 (owner 17 Nov 2026): Clothing ("ošacení") is a Happiness factor. Residents wear their clothes out; Cloth from the
// stores (Weaver) renews them. The kingdom keeps one Clothing level (0–1): it falls by 1/`wearDays` every dawn, and
// each Cloth taken from the stores renews one resident's clothes (level + 1/residents), up to full.
export const CLOTHING=Object.freeze({
  resource:'cloth',
  // A full set of clothes lasts this many days (a new game and an older save start fully clothed).
  wearDays:20,
  // Happiness for every resident: +bonus at a full level, −penalty at none, in between linear (0 at a half).
  bonus:4,penalty:4,
  // The event feed warns once when the level falls below this.
  warnBelow:.3,
});
export const clothingHappiness=level=>Math.round(-CLOTHING.penalty+(CLOTHING.bonus+CLOTHING.penalty)*Math.max(0,Math.min(1,level)))||0;
