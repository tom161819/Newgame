// m-kral-odmeny-xp (owner request 39): the King's skill points from Royal tasks. A point buys one level of one of the
// King's ordinary skills (SkillSystem, combat included, up to its max level) or of a royal skill below.
// leadership: residents within the King's current sight work faster; stewardship: more tax Gold, Happiness untouched.
export const KING_SKILLS=Object.freeze({
  leadership:Object.freeze({maxLevel:5,workBonusPerLevel:.03}),
  stewardship:Object.freeze({maxLevel:5,taxBonusPerLevel:.04}),
});
export const KING_SKILL_IDS=Object.freeze(Object.keys(KING_SKILLS));
// One point is one level; a level of an ordinary skill keeps the XP already gathered towards the next one.
export const KING_POINT_COST=1;
