# Studio: "Choose for the game"

## What and why

The owner approved one of three variants. The other two still showed as "2 of 3 to review", and it was not clear which
variant goes into the game. The owner did not want to reject the others one by one.

## Files and systems

- **`studio/src/main.js`:** each variant card has a **Choose for the game** button. One click does three things:
  - approves the variant;
  - gives it the ★ (the ★ variant is the one the game uses);
  - sets the asset's other variants aside if they still wait for the owner.

  "Still waiting" means draft, review, or an approval made outdated by a changed spec. Those variants become `rejected`
  with the fixed note `Not chosen: another variant was chosen for the game.` (`NOT_CHOSEN`).
- **Variants sent for rework** keep their request, and approved variants stay approved.
- **Card states:**
  - the chosen variant shows a **✓ Chosen for the game** pill;
  - if others still wait, for example after an earlier Approve, it offers **Set aside the other N** instead;
  - a variant that was set aside says so and can be approved later.
- `studio/src/styles.css` styles the choose row.

## Implementation decisions

- Setting aside is an explicit action, not an automatic filter rule. Assets that show several variants on purpose
  (ruins, wall pieces) and newly proposed variants keep waiting for review as before.
- No new status: `rejected` with a fixed note keeps `art/approvals.json`, its validation and the revision hand-over
  unchanged. Rejected variants are never deleted.

## Save/Load impact

None.

## Testing

- **Studio smoke:**
  - Choose for the game on the wheelwright approves and stars the variant and sets the other aside.
  - The design leaves "Waiting for my review".
  - After Back to review, **Set aside the other 1** does the same.
- Screenshot of the wheelwright cards checked.

## Notes for the next agent

- Each set-aside variant arrives in the revision hand-over as `rejected` with the note above. Take it over like any other
  decision.
