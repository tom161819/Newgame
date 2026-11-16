# Subtler selection ring (0.143.4)

## What and why
Owner 16 Nov 2026: "the ring of chosen units is too strong".

## Files and systems
- `UnitSelection.update`: unit ring 30×14 at 2 px, alpha 1 → 24×10 at 1.25 px, alpha .55; the King's ring 34×16 → 28×12 at alpha .6; the goal ring 20×10 at .8 → 16×8 at 1 px, alpha .35.

## Implementation decisions
Same colour, so the selection stays recognisable; only thickness, size and opacity changed. Line widths still divide by zoom.

## Save/Load impact
None.

## Testing
npm test; browser look at a chosen group.

## Notes for the next agent
If the owner wants it even softer, lower the alpha before the size.
