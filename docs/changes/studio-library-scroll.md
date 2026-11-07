# Studio: the library list scrolls on its own

## What and why

Plan `g-studio-menu-rolovani` (priority 1). The owner asked for it on 7 November 2026. The whole Asset Studio page
scrolled together with the left list of designs. When the owner picked a design near the bottom of the list, its preview
at the top of the page was out of view.

## Files and systems

- **`studio/src/styles.css`, wide windows (821 px and wider):**
  - The library panel is sticky under the top bar and fills the rest of the window.
  - Search and filters keep their size. The list takes the remaining height, scrolls on its own and does not pass its
    scrolling on to the page (`overscroll-behavior: contain`).
  - Narrow windows behave as before.
- **`studio/src/lib/topbarHeight.js`:** keeps `--topbar-h` equal to the height of the top bar, which wraps on narrower
  windows. Used by the Studio, the UI Lab and the World Lab.
- **`studio/src/main.js`:**
  - re-rendering the library keeps the list's scroll position, for example after a decision or when switching variants;
  - choosing a design scrolls the list just enough to show it (`revealSelected`);
  - if the page was scrolled down, choosing a design brings the top of the preview back under the top bar
    (`revealWorkspace`, wide windows only);
  - a design opened by a link (`#hash`) is scrolled into view in the list.
- **UI Lab and World Lab:** their settings panels were sticky at `top: 0` and slid under the top bar. They now sit under
  it (`--topbar-h`) and do not pass their scrolling on to the page. Buildings in game has no side list.
- **`scripts/studio-smoke.mjs`:** new test.

## Implementation decisions

- The list scrolls inside the sticky panel; the page itself still scrolls for the long variant views on the right. That
  keeps the variant cards, scene and spec tabs as they are.
- On a phone the list stays above the preview with its own 240 px scroll box, as before. The owner allowed that.

## Save/Load impact

None.

## Testing

- **Studio smoke, at 1440 × 1000:**
  - the list is longer than the window;
  - the mouse wheel scrolls the list and the page stays put;
  - choosing the last item keeps the list's position and shows the preview heading in view;
  - a link to that design opens with it visible in the list;
  - the filters keep their size.
- All other smoke sections pass; the phone check passes.
- Screenshot checked: the page is scrolled down, the list is scrolled, the Mill is chosen, and its preview shows at the
  top.

## Notes for the next agent

- A new Studio page with a sticky side panel should use `top: var(--topbar-h, 60px)` and call `trackTopbarHeight()`.
