# Start guide in every new game (0.138.7)

## What and why
Owner 15 Nov ("když začnu novou hru tak tam žádná šipka na wiki není – ať je tam zatím při každé nové hře"): the start guide ran once per browser and not at all when the old tutorial had been switched off (`newgame.tutorial=off`), so the owner never saw it.

## Files and systems
`src/ui/TutorialGuide.js`: `start()` always runs the guide for a new game (clears this session's wiki/tasks marks); `update()` no longer stops on the old tutorial switch; × ends the guide for this game only and marks the intro done (sequence tips may follow).

## Implementation decisions
A loaded game still does not show the guide (`resume` keeps its checks). The Settings switch still stops a running guide.

## Save/Load impact
None.

## Testing
Full suite; browser: with `newgame.tutorial=off` and `newgame.guide.intro=done` in storage a new game shows the Wiki arrow, then the Getting started arrow.

## Notes for the next agent
"Zatím" – the owner may want it once per player later; then restore the `introDone()` check in `start()`.
