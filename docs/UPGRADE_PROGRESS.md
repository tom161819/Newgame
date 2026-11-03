# Upgrade progress

## Aktuální práce

Krok24 je dokončen a publikován: `e721a68`, Pages `41694834348` **Success** (58 s), původní adresa hry zachována. A `fb5aaf2`, B `f4e621b`, C `a454fe9`, D `9e93982`;271/271 testů, build, skutečné UI/IndexedDB, starší savy5/6, fyzický potravinový řetězec, ruční přeprava, zimní20NPC kolem57 FPS a62 neměnných archivů ověřeny. Podrobnosti: [step24 verification](verification/step-24.md).

Master etapa01/29A je dokončena: zdroj `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`,282/282 testů, čisté npm ci, build, skutečný browser/IndexedDB včetně starého savu2→7,65 neměnných archivů (3 nové,0 vynechaných). [Report etapy01](verification/master-01.md). Etapa02/36 je DONE: `5074450fe57321ac71b7ded1cedcaf2281d2f216`,294/294 testů, build, plný fyzický browser/Save/Load a65 neměnných archivů;[report](verification/master-02.md). Etapa03/33 je DONE: `1d9dd4610a5690db8348b2743ec376b668266fcf`,307/307 testů, build, plný browser/IndexedDB a skutečné savy2/7→8;[report](verification/master-03.md). Právě probíhá dodatečný audit/optimalizace archivu před04; předchozí funkce i veřejné Pages zůstávají funkční. Pracovní etapy se zálohují do `backup/master-progress`; MINOR/tagy následují pouze po M1–M5 gate. Package0.1.0 a nové Save8 zůstávají oddělené.

## Master: 15 etap, 5 milníků

Etapy01–03 jsou DONE; nyní dodatečný audit archivu dle nového zadání, etapa04 a další jsou PENDING. U dokončené etapy doplnit konkrétní chování, testy (passed/failed/skipped), commit, stav milníku a další etapu. DONE lze zapsat pouze po implementaci a skutečné kontrole.

| Etapa | Krok | Milník | Stav | Commit / ověření |
|---|---|---|---|---|
| 01 | 29A: Version Archive, Changelog & Release Foundation | M1 | DONE | `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`;282/282, npm ci/build/browser/Save2→7,65 SHA-256 archivů;[report](verification/master-01.md) |
| 02 | 36: Building Categories & Unlock Requirements | M1 | DONE | `5074450fe57321ac71b7ded1cedcaf2281d2f216`;294/294, build, plný browser fyzické výstavby/rušení, Save/Load;[report](verification/master-02.md) |
| 03 | 33: Seasons ON/OFF | M1 | DONE | `1d9dd4610a5690db8348b2743ec376b668266fcf`;307/307, build, plný browser/IndexedDB, skutečné2/7→8;[report](verification/master-03.md) |
| 04 | 28: Circular Fog of War & Map Memory | M1 | PENDING | Nezahájeno |
| 05 | 30: Population Sidebar & Skill Sorting | M1 | PENDING | Nezahájeno |
| 06 | 32: Missing Workers Indicator | M1 | PENDING | Nezahájeno |
| 07 | 25: Forestry & Natural Resources | M2 | PENDING | Nezahájeno |
| 08 | 31A: Extended Zoom Out | M2 | PENDING | Nezahájeno |
| 09 | 31B: Daily Resource Statistics & Ledger | M2 | PENDING | Nezahájeno |
| 10 | 35: Quarry Placement & Iron Smelter | M2 | PENDING | Nezahájeno |
| 11 | 37: Stone Pavement & Courtyards | M3 | PENDING | Nezahájeno |
| 12 | 34: Wheelwright, Wagons, Stables & Housing | M3 | PENDING | Nezahájeno |
| 13 | 26: Villager Needs & Happiness | M4 | PENDING | Nezahájeno |
| 14 | 27: Merchants, Caravans & Trade | M4 | PENDING | Nezahájeno |
| 15 | 29B: Background Simulation & Catch-up | M5 | PENDING | Nezahájeno |

## Dodatečný audit archivu — PARTIAL

Nové [zadání](requests/archive-optimization.md) po03, před04. Zjištěno65 lokálních/62 veřejných snapshotů,104297152 sledovaných bajtů/2008 souborů,113 MiB diskových bloků. Historické hry se nepřekládají při každé změně, ale Vite je kopíruje a CI plně hashuje. Implementace a měření dokončeny:317/317 testů a plný browser prošly; běžný build106,15→1,95 MB a3263→1206 ms;68 skutečných archivů,68 kanonických URL/2161 HTTP souborů se shodnými SHA/MIME. Původních65 snapshotů beze změny; nově skutečné5074450/1d9dd46/8b79627 (0 vynechaných). Lazy katalog a dev řádky, skutečné názvy/čísla/Changelog, cílený export bez vnořených archivů, oddělené Pages skládání, source-only hledání/test discovery a relevantní CI smoke. Zbývá zdrojový commit, jeho skutečný archiv a ověřená publikace. Žádné původní URL, historie ani namespace savů nezměněny. Po dokončení se automaticky pokračuje04–15 a pak Visual.

## Release gates

M1 (01–06), M2 (07–10), M3 (11–12), M4 (13–14), M5 (15): PENDING. Žádné nové číslo ani tag zatím nevydáno. Současná hra má `0.1.0`; budoucí číslo určit z aktuálního package.json a existujících tagů až při úspěšném gate.

## Následující vizuální upgrade

Visual Polish & Art Pass, fáze A–E: PENDING až po celém masteru. Úplné zadání je v `docs/requests/visual-polish-art-pass.md`.
