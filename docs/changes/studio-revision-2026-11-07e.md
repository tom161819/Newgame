# Studio revision: castle and policy icons chosen

## What and why

The owner reviewed the castle designs and the policy icons in the shared Studio and wrote „spustit revizi“.

## Files and systems

- `art/approvals.json`, taken over from the Studio database with `studio:sync`. ★ marks the design the game should use.

  | Asset | Decision |
  |---|---|
  | Castle | all three designs approved; **★ `castle-keep`** (Castle with a bergfried) |
  | Tax icons | both looks approved; **★ `tax-icons-stacks`** (Purse and coin stacks) |
  | Ration icons | **★ `ration-icons-bowls`** (Bowls and a full plate) approved; `ration-icons-basket` rejected |

## Implementation decisions

- The exported files are already current in `art/sprites/...`, so nothing is exported again.
- Taking the art into the game is a task for Mechaniky:
  - **Castle:** a new plan item.
  - **Policy icons:** a note on `m-politika-soupatka`.

## Save/Load impact

None.

## Testing

`npm test` passes.

## Notes for the next agent

- **Castle in the game:**
  - use the sprite `art/sprites/castle/castle-keep.v1.png`, with `origin`, `platform` and `lights` from its `.json`;
  - draw the front layer `.front.png` over the king on the platform;
  - use `renderMode: 'sprite'`.
- **Icons:** each level of a set is in `art/sprites/<set>/<variant>.v1.<level>.svg`, with a `.png` (1×) and an
  `@2x.png` (2×).
