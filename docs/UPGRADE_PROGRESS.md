# Upgrade progress

## Aktuální práce

Krok24 je dokončen a publikován: `e721a68`, Pages `41694834348` **Success** (58 s), původní adresa hry zachována. A `fb5aaf2`, B `f4e621b`, C `a454fe9`, D `9e93982`;271/271 testů, build, skutečné UI/IndexedDB, starší savy5/6, fyzický potravinový řetězec, ruční přeprava, zimní20NPC kolem57 FPS a62 neměnných archivů ověřeny. Podrobnosti: [step24 verification](verification/step-24.md).

Master etapa01/29A je dokončena: zdroj `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`,282/282 testů, čisté npm ci, build, skutečný browser/IndexedDB včetně starého savu2→7,65 neměnných archivů (3 nové,0 vynechaných). [Report etapy01](verification/master-01.md). Etapa02/36 je DONE: `5074450fe57321ac71b7ded1cedcaf2281d2f216`,294/294 testů, build, plný fyzický browser/Save/Load a65 neměnných archivů;[report](verification/master-02.md). Etapa03/33 je DONE: `1d9dd4610a5690db8348b2743ec376b668266fcf`,307/307 testů, build, plný browser/IndexedDB a skutečné savy2/7→8;[report](verification/master-03.md). Dodatečný audit/optimalizace archivu je DONE a publikován: `0135b6e65df00f2038fdeee9c2c7ebbe0298707d`, Pages `41733540087` **Success**;69 funkčních archivů a31 číslovaných záznamů. Etapa04 je DONE: `0024c16c803a91b151cff08300665076f8b67b35`,335/335 testů, build, plný browser, savy2/7/8→9 a pohyb s20 NPC na60FPS;[report](verification/master-04.md). Etapa05 je DONE:351/351 testů, plný browser, Save2/7/8/9→10 a200 obyvatel; etapa06 je DONE:356/356/build/browser/indikátory a200 budov; M1 je RELEASED jako0.2.0; probíhá07 Forestry, fázeA ověřena a následujeB; předchozí funkce i veřejné Pages zůstávají funkční. Pracovní etapy se zálohují do `backup/master-progress`; MINOR/tagy následují pouze po M1–M5 gate. Package0.2.0 a aktuální pracovní Save11 zůstávají oddělené; veřejný main `27bb4f1` vydal0.2.0 se Save10 (Pages41789853939 Success), tagv0.2.0 a71 archivů.

## Master: 15 etap, 5 milníků

Etapy01–06 i dodatečný audit archivu jsou DONE; M1 RELEASED0.2.0,07 je PARTIAL a08–15 PENDING. U dokončené etapy doplnit konkrétní chování, testy (passed/failed/skipped), commit, stav milníku a další etapu. DONE lze zapsat pouze po implementaci a skutečné kontrole.

| Etapa | Krok | Milník | Stav | Commit / ověření |
|---|---|---|---|---|
| 01 | 29A: Version Archive, Changelog & Release Foundation | M1 | DONE | `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`;282/282, npm ci/build/browser/Save2→7,65 SHA-256 archivů;[report](verification/master-01.md) |
| 02 | 36: Building Categories & Unlock Requirements | M1 | DONE | `5074450fe57321ac71b7ded1cedcaf2281d2f216`;294/294, build, plný browser fyzické výstavby/rušení, Save/Load;[report](verification/master-02.md) |
| 03 | 33: Seasons ON/OFF | M1 | DONE | `1d9dd4610a5690db8348b2743ec376b668266fcf`;307/307, build, plný browser/IndexedDB, skutečné2/7→8;[report](verification/master-03.md) |
| 04 | 28: Circular Fog of War & Map Memory | M1 | DONE | `0024c16c803a91b151cff08300665076f8b67b35`;335/335, build, plný browser/pixely/interakce, IndexedDB a skutečné2/7/8→9;20 NPC s pohybem a mlhou60FPS;[report](verification/master-04.md) |
| 05 | 30: Population Sidebar & Skill Sorting | M1 | DONE | FázeA–D dokončeny;351/351, build, plný browser/mobile/Fog/200 obyvatel, skutečné Save2/7/8/9→10,70 SHA archivů/2263 HTTP souborů. `ead4d006a39685c53e3de79f7ad33e991e34acbe`;[report](verification/master-05.md) |
| 06 | 32: Missing Workers Indicator | M1 | DONE | Dokončené pracovní budovy: červená/oranžová, skutečná místa/události, tooltip/Assign Worker, Fog/zoom/Save10;356/356/build/browser,200 budov~50FPS bez přepočtu míst za snímek. `7a5a6662c7d619c7e86960d6f71cf5c68b035483`;[report](verification/master-06.md) |
| 07 | 25: Forestry & Natural Resources | M2 | PARTIAL | FázeA DONE:200 seskupených Oak/Pine/růst/král/kácení/fyzické dřevo/Save11/Fog;365/365/build/plný browser/2,7,8,9,10→11;20NPC+mlha~60FPS,71 archivů beze změny. NásledujeB chata/AI a doprava, potéC ložiska,D integrace;[report](verification/master-07.md). |
| 08 | 31A: Extended Zoom Out | M2 | PENDING | Nezahájeno |
| 09 | 31B: Daily Resource Statistics & Ledger | M2 | PENDING | Nezahájeno |
| 10 | 35: Quarry Placement & Iron Smelter | M2 | PENDING | Nezahájeno |
| 11 | 37: Stone Pavement & Courtyards | M3 | PENDING | Nezahájeno |
| 12 | 34: Wheelwright, Wagons, Stables & Housing | M3 | PENDING | Nezahájeno |
| 13 | 26: Villager Needs & Happiness | M4 | PENDING | Nezahájeno |
| 14 | 27: Merchants, Caravans & Trade | M4 | PENDING | Nezahájeno |
| 15 | 29B: Background Simulation & Catch-up | M5 | PENDING | Nezahájeno |

## Dodatečný audit archivu — DONE

Nové [zadání](requests/archive-optimization.md) po03, před04. Zjištěno65 lokálních/62 veřejných snapshotů,104297152 sledovaných bajtů/2008 souborů,113 MiB diskových bloků. Historické hry se nepřekládají při každé změně, ale Vite je kopíruje a CI plně hashuje. Implementace a měření dokončeny:317/317 testů a plný browser prošly; běžný build106,15→1,95 MB a3263→1206 ms;68 skutečných archivů,68 kanonických URL/2161 HTTP souborů se shodnými SHA/MIME. Původních65 snapshotů beze změny; nově skutečné5074450/1d9dd46/8b79627 (0 vynechaných). Lazy katalog a dev řádky, skutečné názvy/čísla/Changelog, cílený export bez vnořených archivů, oddělené Pages skládání, source-only hledání/test discovery a relevantní CI smoke. Zdroj `a4f51ecd936af7678c0822ead4e15c91c0b3e780` a jeho skutečný archiv ověřeny; nyní69 buildů/31 logických záznamů a69 URL/2212 HTTP souborů. Finální317/317 a menu/IDB/starší savy/metadata/build prošly. Publikováno na main `0135b6e65df00f2038fdeee9c2c7ebbe0298707d`, skutečný [Pages run41733540087](https://github.com/tom161819/Newgame/actions/runs/41733540087) **Success** včetně deploy na původní URL; [report](verification/archive-optimization.md). Žádné původní URL, historie ani namespace savů nezměněny. Po dokončení se automaticky pokračuje04–15 a pak Visual.

## Release gates

M1 (01–06): **RELEASED0.2.0**, source `fa56c96113fdad8097d641ad87c06e74d532efa8`, skutečný vzdálený tag`v0.2.0`, deploy `27bb4f1976c79044a289ac523f4c740611937c82`, [Pages41789853939](https://github.com/tom161819/Newgame/actions/runs/41789853939) **Success**. Gate9 kontrol prošel včetně356 testů/plného browseru/Save2,7,8,9→10; finální web71 archivů/2314 přesných HTTP souborů. `release:verify` potvrdil tag/zdroj/manifest/Pages. M2–M5 PENDING. [ReportM1](verification/master-M1.md).

## Následující vizuální upgrade

Visual Polish & Art Pass, fáze A–E: PENDING až po celém masteru. Úplné zadání je v `docs/requests/visual-polish-art-pass.md`.
