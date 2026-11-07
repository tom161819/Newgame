# Upgrade progress

## Aktuální stav — 7. 11. 2026 (bez GitHubu)

Hra je ve verzi **0.11.0**. Vydané milníky: M1 0.2.0, M2 0.3.0, M3 0.4.0 (tag `v0.4.0`). Etapy 01–12 jsou DONE (tabulka níže).
Etapa 13 (#58 potřeby a spokojenost) běží po fázích: A 0.5.0 (PR #191, SAVE 33), C část 1 0.6.1 (PR #193), B domovy a denní odpočinek 0.9.0 (`c040390`, SAVE 37); zbývá C2 (po daních a přídělech #103) a D. Etapa 14 (#59 obchod): ruční obchod F1 je hotový (tržiště 0.9.5, karavany 0.10.0, obchodní okno 0.11.0), zbývá F2 živé ceny a F3 automatický obchod; etapa 15 čeká.

Od 6. 11. 2026 je GitHub účet zablokovaný: vývoj běží v chatech projektu MK, kód se předává přes sdílené úložiště a **úkoly vede stránka *MK – plán vývoje*** (pravidla v `AGENTS.md`). Sekce níže jsou historie z doby GitHubu; vydání milníku M4 bude potřebovat úpravu `release-gate` (dnes vyžaduje GitHub Pages a archiv).

## Historické záznamy před aktuálním auditem

Krok24 je dokončen a publikován: `e721a68`, Pages `41694834348` **Success** (58 s), původní adresa hry zachována. A `fb5aaf2`, B `f4e621b`, C `a454fe9`, D `9e93982`;271/271 testů, build, skutečné UI/IndexedDB, starší savy5/6, fyzický potravinový řetězec, ruční přeprava, zimní20NPC kolem57 FPS a62 neměnných archivů ověřeny. Podrobnosti: [step24 verification](verification/step-24.md).

Master etapa01/29A je dokončena: zdroj `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`,282/282 testů, čisté npm ci, build, skutečný browser/IndexedDB včetně starého savu2→7,65 neměnných archivů (3 nové,0 vynechaných). [Report etapy01](verification/master-01.md). Etapa02/36 je DONE: `5074450fe57321ac71b7ded1cedcaf2281d2f216`,294/294 testů, build, plný fyzický browser/Save/Load a65 neměnných archivů;[report](verification/master-02.md). Etapa03/33 je DONE: `1d9dd4610a5690db8348b2743ec376b668266fcf`,307/307 testů, build, plný browser/IndexedDB a skutečné savy2/7→8;[report](verification/master-03.md). Dodatečný audit/optimalizace archivu je DONE a publikován: `0135b6e65df00f2038fdeee9c2c7ebbe0298707d`, Pages `41733540087` **Success**;69 funkčních archivů a31 číslovaných záznamů. Etapa04 je DONE: `0024c16c803a91b151cff08300665076f8b67b35`,335/335 testů, build, plný browser, savy2/7/8→9 a pohyb s20 NPC na60FPS;[report](verification/master-04.md). Etapa05 je DONE:351/351 testů, plný browser, Save2/7/8/9→10 a200 obyvatel; etapa06 je DONE:356/356/build/browser/indikátory a200 budov; M1 je RELEASED jako0.2.0; etapy07 Forestry a08 Extended Zoom Out jsou DONE. Historický release M1 vydal main `27bb4f1` se Save10 (Pages41789853939 Success), tagv0.2.0 a71 archivů.

Etapa09 Ledger je DONE a sloučená přes [PR9](https://github.com/tom161819/Newgame/pull/9) do main97b3381; ověřený zdroj `f3310a105223654a595f5bff205c56f5668c15cc`,419 testů/plný browser/Save13/71 archivů. Zachráněný WIP zůstává na codex/stage-09-ledger-wip feb19d2.

Etapa10 je implementována a ověřena: fázeA `f93474f`, fázeB `069bf90df39e97f92394e167678a7be84505f29c`, integrace Claudovy grafiky `0f76b96bb4a3cf7f4fcb1aec717f0034347694bc` (437 testů/plný browser), finální oprava sousedních lomů `0f4ebce931d912c18ff33a6148697b9514bb9249` (438 testů/build/aktuální native Save14). Hlavní implementace už je merged přes [PR11](https://github.com/tom161819/Newgame/pull/11), main7012635; malý follow-up validace a závěrečné evidence je připraven ve stejné codex větvi. Konečný profil20NPC/Fog/pohyb/zoom0.25:59.34–60FPS. [Report10](verification/master-10.md), [předání](verification/master-10-pr.md), [M2 preflight](verification/master-M2.md).

M2 PR15 i archivní PR18 jsou merged, jejich skutečné Pages41877748443/41883338166 Success. Formální nativní gate odhalil dva nestabilní testovací předpoklady (pořadí nákladu/výroby a kliknutí pod DOM ikonou); opraveny se skutečnými regresemi. V `codex/m2-smelting-smoke` je nyní ověřený finální zdroj `02a3a43ace8adc993aea7a392424d7cdf4e7dec9`,0.3.0/Save14, se zachovaným main630caf1/Claudovou V01 grafikou:459/459 modelů, celý native včetně sezónních přechodů a Studio smoke pass. Nový skutečný zdrojový archiv prošel vlastními459testy/buildem/Chromiem;73snapshotů,1nový/0vynechaných, původních72adresářů/URL/savů beze změny. Finální web73URL/2456HTTPsouborů/121455383B/MIME/SHA a UI/IndexedDB/mobil prošel. Připravený v0.3.0 tag je pouze místní na02a; předchozí nezveřejněný kandidátní odkaz f053 je uchovaný. Veřejné tagy ani historie se nepřepisují. Finální kandidát ještě vyžaduje vlastní PR/main/Pages/gates, M2 proto není RELEASED a11–15 PENDING. Nový pokyn uživatele přesouvá C01–C08 před master11–15, ihned za dokončení vydání M2. [Předání](verification/M2-release-publication.md). Visual Polish zůstává u Claude.

Závěrečné předání: zachován i maina09de58/nové PR quality CI (pouze workflow,
herní zdroj beze změny). Kandidát e574f75 nahrán do PR22; skutečný poslední
`gh pr merge22 --merge --match-head-commit` stále API Forbidden. Nová fronta je
uložená a nahraná; žádné nevykonané sloučení/tag/Pages není označené za úspěšné.

## Změna pořadí — pokyn uživatele2026-11-04

Po dokončení M2 nejprve C01–C08, potom11(dláždění),12(kolář/povozy/stáje/bydlení),
13(potřeby/spokojenost),14(obchod),15(simulace na pozadí). Původní čísla a milníky
zůstávají; všech pět etap stále PENDING. Stáje/rytíř mají explicitní návaznost
v [CODEX_PROGRESS.md](CODEX_PROGRESS.md). Žádný odložený úkol není zrušený.

## Master: 15 etap, 5 milníků

Aktualizace předání: celý kandidát je v [PR22](https://github.com/tom161819/Newgame/pull/22). Zachován main4857ba7 včetně schválené trávy, budov, stromů a lešení; žádná vlastní změna jejich grafiky. Pracovní větev476/476modelů, validace a Pages build pass; celý native přes main14071b1 a následný cílený test stromů/Fog/zoomu/sezón/kácení/aktuálního Save14/historických her exit0; po novém lešení i cílený native Fog/scaffold/blueprint/menu/aktuální IndexedDB/historické hry exit0. Studio/73URL/2456HTTPsouborů ověřeny, všechny archivní bajty beze změny. Zdroj vydání02a a jeho459testový archiv zůstávají zmrazené. Nový verifier prokazuje skutečné nasazené Git bloby i veřejný katalog/manifest; preflight zůstává striktní. Public tag/main/Pages gate pending, skutečný CONNECT403 blokuje API před GitHubem. Nové pořadí uživatele: po M2 C01–C08, potom master11–15. [Předání](verification/M2-release-publication.md).

Etapy01–06 i dodatečný audit archivu jsou DONE; M1 RELEASED0.2.0,07–10 jsou DONE ve větvi, hlavní10 merged PR11 a finální malý follow-up čeká na PR; M2 release pending,11–15 PENDING. U dokončené etapy doplnit konkrétní chování, testy (passed/failed/skipped), commit, stav milníku a další etapu. DONE lze zapsat pouze po implementaci a skutečné kontrole.

| Etapa | Krok | Milník | Stav | Commit / ověření |
|---|---|---|---|---|
| 01 | 29A: Version Archive, Changelog & Release Foundation | M1 | DONE | `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`;282/282, npm ci/build/browser/Save2→7,65 SHA-256 archivů;[report](verification/master-01.md) |
| 02 | 36: Building Categories & Unlock Requirements | M1 | DONE | `5074450fe57321ac71b7ded1cedcaf2281d2f216`;294/294, build, plný browser fyzické výstavby/rušení, Save/Load;[report](verification/master-02.md) |
| 03 | 33: Seasons ON/OFF | M1 | DONE | `1d9dd4610a5690db8348b2743ec376b668266fcf`;307/307, build, plný browser/IndexedDB, skutečné2/7→8;[report](verification/master-03.md) |
| 04 | 28: Circular Fog of War & Map Memory | M1 | DONE | `0024c16c803a91b151cff08300665076f8b67b35`;335/335, build, plný browser/pixely/interakce, IndexedDB a skutečné2/7/8→9;20 NPC s pohybem a mlhou60FPS;[report](verification/master-04.md) |
| 05 | 30: Population Sidebar & Skill Sorting | M1 | DONE | FázeA–D dokončeny;351/351, build, plný browser/mobile/Fog/200 obyvatel, skutečné Save2/7/8/9→10,70 SHA archivů/2263 HTTP souborů. `ead4d006a39685c53e3de79f7ad33e991e34acbe`;[report](verification/master-05.md) |
| 06 | 32: Missing Workers Indicator | M1 | DONE | Dokončené pracovní budovy: červená/oranžová, skutečná místa/události, tooltip/Assign Worker, Fog/zoom/Save10;356/356/build/browser,200 budov~50FPS bez přepočtu míst za snímek. `7a5a6662c7d619c7e86960d6f71cf5c68b035483`;[report](verification/master-06.md) |
| 07 | 25: Forestry & Natural Resources | M2 | DONE | FázeA DONE `0596b517e38919c672c0856f9fd7f3d927cc848b`:200 seskupených Oak/Pine/růst/král/kácení/fyzické dřevo/Save11/Fog;365/365/build/plný browser/2,7,8,9,10→11;20NPC+mlha~60FPS,71 archivů beze změny. FázeB DONE `328c3a63858f3cd92c910f101809c7c20fe13b6c`: chata8 Stone/2×2/3 místa/18 radius, fyzické dřevo, rezervace skladu, Save/Load a známé počty stromů;374/374/build/plný browser, finální nativní chata/cargo. FázeC DONE `e8ea0ce4970c67b1b6b0a89851b44a24f1275eae`: konečná ložiska5 Stone/4 Iron, striktní Quarry, Iron Mine12 Stone+8 Wood, fyzická těžba/transport/Save12/Fog;388/388/build/nativní obě stavby a skutečný Save11→12,20NPC~59–60FPS. FázeD DONE `d195a39f5090643c7785c9c9b56db746e57f9991`:389/389, plný browser a skutečné Save2/7/8/9/10/11→12; celý fyzický řetězec stromy→dřevo→vícesurovinová stavba dolu→ruda→Warehouse přes Save/Load. Následuje08;[report](verification/master-07.md). |
| 08 | 31A: Extended Zoom Out | M2 | DONE | `c106cc4f4b0d1afb73a444500d0d1adabc92fb05`; plynulý zoom0.25–1.8/default1, bezpečné vysoké okno, přesné klikání/blueprint/Fog/Save12;395/395/build/nativní0.25 a vysoké okno,20NPC+mlha58.7–60FPS;[report](verification/master-08.md). |
| 09 | 31B: Daily Resource Statistics & Ledger | M2 | DONE | `f3310a105223654a595f5bff205c56f5668c15cc`; merged [PR9](https://github.com/tom161819/Newgame/pull/9), main97b3381; journal/Save13/lišta/tooltipy,419/419 testů/Pages build/plný browser/71 SHA archivů/2314 HTTP souborů;[report](verification/master-09.md). |
| 10 | 35: Quarry Placement & Iron Smelter | M2 | DONE | `0f4ebce931d912c18ff33a6148697b9514bb9249`; Quarry/Smelter/3Ore+2Wood→1Bar/Smelting/Save14,438 testů/build/current native; plný browser společné verze0f76b96 prošel před poslední drobnou validací. PR11 core merged, finální follow-up připraven;71 archivů/2314 HTTP souborů;[report](verification/master-10.md). |
| 11 | 37: Stone Pavement & Courtyards | M3 | DONE | `3c08916272b6271fa377f06ed52c22ad51b2b899`; merged [PR136](https://github.com/tom161819/Newgame/pull/136) (#56): pavement layer in PathWear, Single/Line/Area/Remove, physical blueprints (1 Stone per 2 tiles), +25 % without stacking on paths, Fog/Map Memory, Save/Load; follow-ups [PR159](https://github.com/tom161819/Newgame/pull/159) pavement under buildings and [PR173](https://github.com/tom161819/Newgame/pull/173) Builder goal fix. Browser `--pavement`/`--pave-under` PASS in the full Pages runs. |
| 12 | 34: Wheelwright, Wagons, Stables & Housing | M3 | DONE | `a9aa16f0ee4bfb58911b55254d60d4e9b3b11b2a` (final part, [PR158](https://github.com/tom161819/Newgame/pull/158) Horse Wagon). The stage is merged in parts: [PR133](https://github.com/tom161819/Newgame/pull/133) House/population capacity, [PR139](https://github.com/tom161819/Newgame/pull/139) carry weights, [PR153](https://github.com/tom161819/Newgame/pull/153) Wheelwright/Wheelbarrow, [PR154](https://github.com/tom161819/Newgame/pull/154) Stables/taming/Knight horse, [PR158](https://github.com/tom161819/Newgame/pull/158) Horse Wagon; fixes [PR160](https://github.com/tom161819/Newgame/pull/160)/[PR170](https://github.com/tom161819/Newgame/pull/170). Browser `--wheelwright --stables --horse-wagon --housing` PASS in the full Pages runs. |
| 13 | 26: Villager Needs & Happiness | M4 | IN PROGRESS | A 0.5.0 (PR #191), C část 1 0.6.1 (PR #193), B 0.9.0 (`c040390`); zbývá C2 a D |
| 14 | 27: Merchants, Caravans & Trade | M4 | IN PROGRESS | F1 hotová: F1.1 tržiště 0.9.5, F1.2 karavana 0.10.0 (SAVE 38), F1.3 obchod 0.11.0 (SAVE 39, `618bb93`); zbývá F2 živé ceny a F3 automatický obchod |
| 15 | 29B: Background Simulation & Catch-up | M5 | PENDING | Nezahájeno |

## Dodatečný audit archivu — DONE

Nové [zadání](requests/archive-optimization.md) po03, před04. Zjištěno65 lokálních/62 veřejných snapshotů,104297152 sledovaných bajtů/2008 souborů,113 MiB diskových bloků. Historické hry se nepřekládají při každé změně, ale Vite je kopíruje a CI plně hashuje. Implementace a měření dokončeny:317/317 testů a plný browser prošly; běžný build106,15→1,95 MB a3263→1206 ms;68 skutečných archivů,68 kanonických URL/2161 HTTP souborů se shodnými SHA/MIME. Původních65 snapshotů beze změny; nově skutečné5074450/1d9dd46/8b79627 (0 vynechaných). Lazy katalog a dev řádky, skutečné názvy/čísla/Changelog, cílený export bez vnořených archivů, oddělené Pages skládání, source-only hledání/test discovery a relevantní CI smoke. Zdroj `a4f51ecd936af7678c0822ead4e15c91c0b3e780` a jeho skutečný archiv ověřeny; nyní69 buildů/31 logických záznamů a69 URL/2212 HTTP souborů. Finální317/317 a menu/IDB/starší savy/metadata/build prošly. Publikováno na main `0135b6e65df00f2038fdeee9c2c7ebbe0298707d`, skutečný [Pages run41733540087](https://github.com/tom161819/Newgame/actions/runs/41733540087) **Success** včetně deploy na původní URL; [report](verification/archive-optimization.md). Žádné původní URL, historie ani namespace savů nezměněny. Po dokončení se automaticky pokračuje04–15 a pak Visual.

## Release gates

M1 (01–06): **RELEASED0.2.0**, source `fa56c96113fdad8097d641ad87c06e74d532efa8`, skutečný vzdálený tag`v0.2.0`, deploy `27bb4f1976c79044a289ac523f4c740611937c82`, [Pages41789853939](https://github.com/tom161819/Newgame/actions/runs/41789853939) **Success**. Gate9 kontrol prošel včetně356 testů/plného browseru/Save2,7,8,9→10; finální web71 archivů/2314 přesných HTTP souborů. `release:verify` potvrdil tag/zdroj/manifest/Pages. M2: místní preflight ověřen, formální Pages gate a release čekají; [ReportM2](verification/master-M2.md). M3–M5 PENDING. [ReportM1](verification/master-M1.md).

M3 (11–12): **RELEASED 0.4.0** (shown `v0.04.00`, first release under #174), release source/tag `v0.4.0` → `375f1aa83b97e6ab8661a14b1a4c7fa1fa365011` ([PR187](https://github.com/tom161819/Newgame/pull/187)). The gate passed on the deployed `d5e99313bea035ab2550af83edff833256f29090` (Pages 42205526143; npm ci, validations, 709 tests, archive verify, build, archive stage/verify-site, full browser smoke 72 PASS; [report](verification/M3-release.md)). Archive `public/versions/375f1aa…/` ([PR189](https://github.com/tom161819/Newgame/pull/189)), deploy `d788e57d1442c3127e2394c6f959293710fd86ed`: [Pages 42214708789](https://github.com/tom161819/Newgame/actions/runs/42214708789) **Success**, [Verify published release 42215177100](https://github.com/tom161819/Newgame/actions/runs/42215177100) **Success** (public tag, frozen notes, archive, live catalog). Next: M4, stage 13 (#58).

## Následující vizuální upgrade

Visual Polish & Art Pass: VYŘAZENO Z FRONTY CODEXU podle uživatele2026-11-04, přebírá Claude. Codex neprovádí souběžný art pass; původní zadání je zachováno v `docs/requests/visual-polish-art-pass.md`.


## Nová pravidla spolupráce (pokyn vývojáře po etapě08)

Do main nepřispívat přímo, žádné push/tag/release na main. Úkoly ve vlastních
codex/* větvích, odevzdání PR, merge a publikace výhradně vývojářem. Tato pravidla
mají přednost před starou frontou, původní automatickou release politikou i pozdějším lokálním pokynem AGENTS k self-merge; platí výslovné nahrané zadání uživatele.
Etapa09 vznikla nad výslovně povoleným PR3 alpha-save-policy cf4c542; PR1–8 jsou nyní merged a aktuální main69e5e57 byl přinesen normálním mergem a plně ověřen ve větvi09.
Nepřidávat migrace; aktuální schéma13 se načítá plně a jiné schéma se odmítne bez
mazání nebo změny uloženého slotu. Původní nenahraný WIP byl zachráněn ve větvi
codex/stage-09-ledger-wip feb19d2. Z této větve se nic neslučuje naslepo.
Další etapa10 až po merge09 nebo na skutečném PR09; M2 release jen připravit ve
větvi a pak čekat na výslovný pokyn vývojáře. Podrobnosti a aktuální síťová
překážka vytvoření PR jsou v reportu09.

### Aktualizace svolení ke sloučení — 2026-11-04

Uživatel nově výslovně povolil sloučit dokončenou etapu09 do main přes PR; původní
HOLD je pro tento úkol zrušen. Nejde o pokyn k nové číslované verzi/tagu ani ke
sloučení rozpracované grafiky. Ověřený produktový kód od f3310a1 je beze změny,
main stále69e5e57. Claudova větev `claude/approved-tower-brazier`2c95aec zůstává
nedotčená; preview odhalilo jen konflikt sousedních řádků evidence, nikoli kódu.
GitHub API znovu vrací Forbidden, takže PR/merge z tohoto prostředí stále blokuje
síť. Připravený PR lze založit a sloučit přes web GitHubu; nic není sloučeno přímo.

### Navázání masteru — 2026-11-04

Etapa09 byla sloučena přes PR9 do main97b3381; předchozí síťová blokace předání již nebrání základu etapy10. Etapa10 začíná v nové codex/stage-10-smelter z tohoto main. Visual Polish & Art Pass převzal Claude a je z fronty Codexu vyřazen. Zachovat všechny jeho grafické větve. Po etapě10 připravit M2 gate ve větvi a zastavit pro výslovný pokyn k vydání podle nahraných pravidel spolupráce.

### Trvalé pravidlo konfliktů — 2026-11-04

Uživatel výslovně zrušil nutnost potvrzovat další běžné konflikty: Codex je řeší samostatně ve vlastní větvi, zachovává záměr obou autorů, ověřuje výsledek a zapisuje řešení. Toto nahrazuje větu o zastavení při konfliktu z dříve nahraného pokynu. Platí i pro Claude přes společný AGENTS.md; jeho vlastní grafické větve se nepřepisují.

## Nové trvalé svolení k vydávání —2026-11-04

Uživatel: „vydej to a nastav že není potřeba čekat na pokyn“. M2 vydání je IN PROGRESS ve větvi codex/m2-release. AGENTS.md zrušil dřívější stop po10 a čekání na další release pokyn. Po úspěšných kontrolách automaticky vydat milník a pokračovat aktuální frontou: C01–C08, potom11–15. Technický přístup k GitHub API/Pages se musí skutečně ověřit; nejde jej nahradit přímým pushem do main nebo tvrzením o neprovedeném vydání.
