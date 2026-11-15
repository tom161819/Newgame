# Save download inside the Claude page

## What and why
Owner, 15 Nov 2026: "file downloads aren't allowed for this artifact", then after the page got the `downloads` capability the game said "downloaded" but no file appeared. A link download is blocked in the page's frame; the capability has its own call.

## Files and systems
- `src/ui/saveFileDownload.js` (new): `downloadFile(filename,data)` – `claude.use('downloads').save(...)` when present, else the link download.
- `src/ui/SaveLoadMenu.js` uses it; i18n `saves.downloadDeclined`.
- The game artifact declares `downloads` (runtime contract 0.2.96).

## Implementation decisions
- The viewer confirms the save in a prompt of the Claude page; a refusal is reported as cancelled.
- The Dev tool's "data for a bug report" download and the staffing editor export still use the link.

## Save/Load impact
None.

## Testing
- Full suite. The prompt itself cannot be tried outside the Claude page.

## Notes for the next agent
- Publish the game with the capability kept (publish_files carries it forward).
