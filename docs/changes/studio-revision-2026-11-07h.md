# Studio revision: dogs, wolves, thief and the white cat approved; animal looks are picked at random in the game

## What and why

The owner approved the revised dogs, wolves and thief and the new white cat. The owner also decided that where
several looks of an animal are approved, the game picks a look at random from them.

## Files and systems

- **Decisions in `art/approvals.json`**, taken over with `studio:sync`:
  - dogs v2: all six approved (★ hound);
  - wolves v2: all four approved (★ grey);
  - thief v2: both approved (★ hooded);
  - `cat-white`: approved.
- **Walk sheets and the eight facing images** exported for the newly approved animals and the thief.

## Implementation decisions

- **Random looks (owner rule)**, for Mechaniky (plan item `m-zvirata-nahodny-vzhled`):

  | Animal | Looks to choose from |
  |---|---|
  | Cat | `cat-tabby`, `cat-black`, `cat-ginger`, `cat-white` |
  | Dog | `dog-hound`, `dog-sheepdog`, `dog-mastiff` |
  | Wolf | `wolf-grey`, `wolf-dark` |
  | Rat | `rat-grey`, `rat-brown` |

  - **Not looks:** `cat-kitten` is a young cat. The sit, pounce, run, attack and wounded variants are poses.
  - **Seeding:** the choice is seeded by the animal's id, so it stays the same after a load.
  - **Poses:** a pose variant is used only when it exists for the chosen look. Otherwise the look's walk sheet stands
    still.
- **★ variants stay** as the default for icons and previews.

## Save/Load impact

None in the Studio. In the game the look follows from the id, so saves need no new data.

## Testing

`npm test` passes.

## Notes for the next agent

Mechaniky: see plan item `m-zvirata-nahodny-vzhled`.
