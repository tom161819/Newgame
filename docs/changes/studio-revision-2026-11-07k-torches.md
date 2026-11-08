# Studio revision: torches in the Fire Lab, boar head, building fire taken over

## What and why
- **Owner's review: approved**
  - children's games;
  - fishing key frames;
  - plain night icons;
  - all wheelbarrows: hand carts, the plank barrow with every load, tub barrows and the sack barrow.
- **Boar, revision 4.** Owner: "body OK; a boar's head – smaller, almost no neck, tusks curving up".
  - The head is smaller and carried at shoulder level, with almost no neck.
  - The tusks grow out of the lower jaw and curve up and back.
- **Building fire.** The owner's Fire Lab proposal "v1" is taken over into art/effects/fire.json. The game builds its fire effect from it, with the particle model in studio/src/fire-lab/fire.js.
- **Fire Lab: torches and small fires.** Owner: "could torches and their fire be added to the Fire Lab?"
  - A "What burns" switch chooses between burning buildings and torches & small fires.
  - The torch list holds every exported sprite whose game lights include a torch or a brazier: torch posts, brackets, braziers, campfires, figures with torches and the caravan lantern (44 objects). Flames sit on the sprite's light points.
  - Presets: pitch torch, iron cage torch, brazier, campfire, windy night, dying ember.
  - Each kind keeps its own parameters.
  - Each kind has its own proposal: `fireProposal/proposal` for buildings and `fireProposal/torch` for torches.

## Files and systems
- studio/src/fire-lab/{fire.js, main.js}
- studio/fire-lab.html
- studio/src/generators/animal.js
- art/assets/units/boar and its sprites
- art/effects/fire.json (new)
- art/approvals.json

## Implementation decisions
- Torches use the same particle model as building fire, with spreading and charring switched off.

## Save/Load impact
None.

## Testing
- npm test passes.
- The torch mode was checked in a browser on the iron cage torch and the brazier.

## Notes for the next agent
- Mechaniky can build the game's building fire from art/effects/fire.json.
- The torch flame values will arrive as `fireProposal/torch` after the owner tunes them.
