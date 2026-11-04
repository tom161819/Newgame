# Fronta rozšíření Newgame

Uživatel zadal dokončovat vždy jeden krok, ověřit jej, commitnout, nahrát na GitHub a ověřit nasazení GitHub Pages; teprve potom začít další. Nové požadavky se přidávají na konec, výslovná změna pořadí má přednost. Kroky 6–8 byly dodané později a vrácené před krok 9 kvůli jejich návaznosti.

Tento soubor a úplná zadání jsou uložené v repozitáři pro navázání práce i po výměně pracovního prostředí. Automatické spuštění po obnovení kreditů není zaručené. Pokyn k navázání: „Pokračuj podle fronty v docs/TASK_QUEUE.md; nejprve ověř stav Git a posledního nasazení.“

## Dokončené kroky

- [Krok 5 — Asset Library](requests/step-05.md): commit `6ae12dc`, Pages úspěšně nasazeno.
- [Krok 6 — lov zvěře, maso a spotřeba potravy](requests/step-06.md): commit `81ab03e`, Pages úspěšně nasazeno.

- [Krok 7 — Fog of War, nastavení a jízda na koni](requests/step-07.md): commit `c361499`, Pages úspěšně nasazeno.
- [Krok 8 — hrad a stavění hradeb](requests/step-08.md): commit `6d189b0`, Pages úspěšně nasazeno.

- [Krok 9 — soubojový systém HP, DPS a Armor](requests/step-09.md): commit `a6c29fa`, Pages úspěšně nasazeno.

- [Krok 10 — herní čas, regenerace, zlato a poklady](requests/step-10.md): commit `cd77265`, Pages run `41548867995` úspěšně nasazeno; 75 automatických testů a skutečný 120sekundový den ověřeny.

- [Krok 11 — Main Menu a Save/Load](requests/step-11.md): commit `574ef6b`, Pages run `41551343872` úspěšně nasazeno. 81 automatických testů a ověření IndexedDB, přesné obnovy i chybových stavů v prohlížeči.

- [Krok 12 — dynamické pěšiny](requests/step-12.md): commit `29a9cec`, Pages run `41553554118` úspěšně nasazeno. 90 testů, skutečné průchody, zarůstání, legacy Save/Load a výkon kolem 60 FPS ověřeny.

- [Krok 13 — individuální XP a levely](requests/step-13.md): commit `c8a87c7`, Pages run `41556504872` úspěšně nasazeno. 98 testů a kontrola skutečných odměn, UI, opakovaných událostí i starších savů.

- [Krok 14 — individuální skilly a profese poddaných](requests/step-14.md): commit `fc979b1`, Pages run `41585540684` úspěšně nasazeno. 109 testů, skutečné pracovní AI, Save/Load včetně starších her, původní mechaniky a výkon 20 poddaných kolem 60 FPS ověřeny.

- [Krok 15 — přirozené talenty a mzdy](requests/step-15.md): commit `1244147`, Pages run `41586655076` úspěšně nasazeno. 119 testů, skutečný 120sekundový den s příjmem a výplatou, poměrné mzdy a dluhy, Save/Load včetně starší hry, produkční a mobilní UI i původní mechaniky ověřeny.

- [Krok 16 — pracovní budovy a zaměstnanci](requests/step-16.md): commit `5636967`, Pages run `41589361849` úspěšně nasazeno. 131 testů, skutečné stavění a přiřazování přes UI, doprava a odměny při návratu včetně zraněného lovce, hlídky a sebeobrana, přesné Save/Load i starší save, produkční/mobilní rozhraní a 20 zaměstnanců kolem 60 FPS ověřeny.

- [Krok 17 — blueprinty a skutečná výstavba](requests/step-17.md): commit `43766dc`, Pages run `41596025285` úspěšně nasazeno. 145 testů, stavba králem i více staviteli, dělení odměn, rušení a materiál, hradby/sestupy, přesné Save/Load, starší hotové budovy, produkční/mobilní UI a 20 stavitelů s 28 blueprinty kolem 60 FPS ověřeny.

- [Krok 18a — archiv historických verzí](requests/step-18a.md): commit `e4f092f`, Pages run `41601566466` úspěšně nasazeno. 36 skutečných commitů sestaveno, otestováno a spuštěno v prohlížeči; 150 testů, SHA-256 neměnnost, vlastní úložiště verzí a mobilní přehled ověřeny.

- [Krok 18b — New Game Setup](requests/step-18b.md): commit `ed58610`, Pages run `41602452485` úspěšně nasazeno. 157 testů; nastavení, obtížnosti, počty objektů, skutečný respawn 100 kamenů, přesné Save/Load a mobilní i produkční rozhraní ověřeny. Archiv rozšířen na 38 skutečných commitů.

- [Krok 19 — Advanced New Game Setup & World Configuration](requests/step-19.md): commit `f22ded0`, Pages run `41604307007` úspěšně nasazeno. 166 testů; pokročilé nastavení, hotový hrad zdarma, počáteční zlato a dohled, délky dne včetně mezd, skutečný 30sekundový respawn a 60sekundový den, přesné Save/Load v2 i migrace skutečné verze v1 ověřeny. Archiv obsahuje 41 funkčních verzí ze skutečných commitů včetně tohoto kroku.

- [Krok 20 — Versioning System & In-Game Changelog](requests/step-20.md): commit `e8d41eb`, Pages run `41624768761` úspěšně nasazeno. Zachovaná alpha 0.1.0; 172 testů, generování/validace historie, lokální release workflow, menu/Settings, NEW, Save/Load i skutečný build jiné verze ověřeny. Archiv rozšířen na 45 ověřených commitů.

- [Krok 21 — Farming & Orchards](requests/step-21.md): commit `339904f`, Pages run `41638781414` úspěšně nasazeno. 185 testů; fyzická výstavba, skutečné růstové cykly 120/180 sekund při dni 60 sekund, sklizeň 8 Wheat / 6 Apple, Farming XP a talenty, Save/Load během růstu a sklizně, skutečný starší save a mobilní rozhraní ověřeny. Optimalizovaná scéna s 20 farmáři a 45 pozemky běží kolem 54–60 FPS. Archiv obsahuje 49 verzí.

- [Krok 22 — Food Production & Storage](requests/step-22.md): commit `5e9b134`, Pages run `41645613844` úspěšně nasazeno (41 s). 200 testů; skutečné blueprinty, fyzická přeprava a 30sekundové výrobní cykly mlýna/pekárny, sklady 200/30, náklady do 20, rezervace, skilly/mzdy, přesné Save/Load a migrace skutečné starší hry ověřeny. Mobilní UI bez chyb; 20 pracovníků, 6 výrobních budov a 22 pozemků kolem 60 FPS. Archiv obsahuje 52 verzí.

- [Krok 23 — Seasons, Weather & Food Consumption](requests/step-23.md): commit `74628eb`, Pages run `41669016548` úspěšně nasazeno (48 s). 215 testů; čtyři pětidenní sezóny, denní počasí, zimní růst a grafika, sezónní sady, jednotná osobní spotřeba, hlad/pracovní efektivita/atraktivita, Food Economy, přesné Save/Load a skutečný starší save ověřeny. V prohlížeči skutečný 60sekundový den odečetl přesně 5 porcí pro krále a 3 poddané; regenerace beze změny. Zimní scéna s 20 NPC, 6 výrobními budovami a 22 pozemky běží kolem 57–60 FPS. Archiv obsahuje 55 verzí.

- **Dokončeno a publikováno:** [Krok 24 — Logistics, Warehouses & Physical Resource Transport](requests/step-24.md).
   - Fáze A dokončena: fyzické suroviny, sklady a migrace inventáře; 228/228 testů, produkční build a skutečný browser smoke včetně mobilního UI a obnovení králova nákladu. Commit fáze obsahuje tento záznam.
   - Fáze B dokončena: Hauler, Logistics 1–50, nosnost 20–38, mzdy, prioritní přepravní AI a rezervace. 242/242 testů (14 nových), build, skutečné UI/IndexedDB a migrace skutečného commitu fáze A ověřeny; commit fáze obsahuje tento záznam.
   - Fáze C dokončena: rezervace ceny, fyzické zásobování stavenišť nosiči/králem, více cest, zahájení práce po doručení, bezpečné refundace a přednost nosičů ve výrobě. 259/259 testů (17 nových), build, skutečné UI/IndexedDB a skutečný schema6 save z commitu B ověřeny. Commit fáze obsahuje tento záznam.
   - Fáze D dokončena: rozpis šesti fyzických kategorií, sklady/nosiči/cíle/náklady, ruční vyzvednutí a odložení králem, legacy značky, bezpečná obnova neplatných pokynů a nejrychlejší cesty po pěšinách. 271/271 testů (12 nových), build, produkční browser/IndexedDB/mobilní UI a skutečný publikovaný schema5 save ověřeny. Zimní 100×100 scéna s 20 NPC, 6 nosiči, 3 sýpkami, 2 sklady, 4 staveništi, 4 výrobami a 22 pozemky: průměr 17,61 ms (~57 FPS), p95 33,3 ms, bez JS chyb; snapshot validní. Archiv62 skutečných verzí (7 nových,0 vynechaných) ověřen včetně SHA-256. Publikace `e721a68`, Pages `41694834348` **Success** (58 s), původní URL potvrzena nasazením. Podrobnosti: [ověření](verification/step-24.md).
   - Každou dokončenou a otestovanou fázi uložit samostatným commitem.

## Aktuální navázání po sloučení PR22

PR22 skutečně sloučen do maincfe51fa. Uživatel poté výslovně požádal začít další
úkoly: C01 implementace začíná nad integrovanou hrou. Finální M2 tag/ověření
veřejného katalogu zůstává skutečně síťově blokované (CONNECT403), samostatně
PENDING; nic se neoznačuje za vydané. Nové funkce používají vlastní větve/PR.

## Následuje — nové pořadí podle uživatele2026-11-04

1. **Dokončit rozpracované vydání M2 v0.3.0.** Master01–10 jsou implementované; zbývá skutečné sloučení kandidáta v PR22, Pages/gates/tag. M1v0.2.0 je RELEASED. [Stav a ověření](verification/M2-release-publication.md). Bez nové žádosti o svolení, zastavit jen při reálné technické blokaci.
2. **Potom C01 → C02 → C03 → C04 → C05 → C06 → C07 → C08:** Fog/neznámá území a blueprinty; výběr pracovníků/sýpka; zaměstnávání a priority hradu; výrobní upozornění; Move/Hold; audit stájí a kontrakt výbavy; výroba zbraní/zbrojnice; vojenské jednotky. [Původní zadání](requests/CODEX_MASTER.md), [aktuální návaznosti a stav](CODEX_PROGRESS.md). Uživatel tyto úkoly nově přesunul před zbylých pět etap původního masteru.
3. **Až za C08 původní master11 → 12 → 13 → 14 → 15:** kamenné dláždění a nádvoří; kolář/povozy/stáje/bydlení; potřeby a spokojenost poddaných; obchodníci/karavany/obchod; simulace na pozadí a dopočítání času. [Specifikace a milníky](UPGRADE_ROADMAP_25_37.md), [stav](UPGRADE_PROGRESS.md). Původní čísla i M3(po12), M4(po14), M5(po15) zůstávají zachována. Stáje se kvůli pořadí neoznačují za hotové: C06 ověří skutečný stav; odemčení rytíře závislé na hotových stájích a integrační ověření naváže na12, bez duplicitní implementace.
4. **VYŘAZENO Z FRONTY CODEXU:** [Visual Polish & Art Pass](requests/visual-polish-art-pass.md) převzal Claude. Zachovat jeho grafiku a schvalování assetů; Codex neprovádí souběžný art pass.
5. **DONE — dodatečný audit/optimalizace archivu po03, před04:** publikace0135b6e, [Pages41733540087](https://github.com/tom161819/Newgame/actions/runs/41733540087) Success;317testů,69původních URL/2212HTTPsouborů a neměnnost archivů ověřeny. [Zadání](requests/archive-optimization.md), [report](verification/archive-optimization.md).

Každý úkol: vlastní commit/PR, relevantní testy a ověřené nasazení před dalším.
M1–M5 mají automatický MINOR/tag/neměnný archiv až po svém gate; nové pořadí
nepřidává samovolné číslované vydání ke každému C úkolu. Tato změna pořadí má
přednost před staršími pokyny „nejprve všech15, potom C01–C08“. Originály zadání
ani dokončené etapy se nepřepisují a žádný stav PENDING se nemění na DONE.

Předchozí fronta do kroku 19 včetně archivu 41 verzí byla dokončená a publikovaná (`e0c4f54`, Pages `41620923762`). Nové požadavky se dokončují v uvedeném pořadí, každý po ověření a nasazení před zahájením následujícího.

Číslo 18 bylo použité u dvou různých zadání; obě se zachovávají v pořadí doručení jako 18a a 18b. Neaplikovat budoucí mechaniky před jejich krokem: krok 6 má okamžitý lov bez HP, krok 7 přidává koně/FoW, krok 8 Castle/Wall, skutečné souboje až krok 9.

## Trvalé vydávání — nový pokyn uživatele2026-11-04

M2 vydat nyní; po dalších úspěšných milníkových kontrolách vydávat M1–M5 bez čekání na nový pokyn a pokračovat aktuální frontou: C01–C08 a potom master11–15. Dřívější stop po10/žádost o další svolení se ruší. Zachovat PR workflow, skutečné testy, tag, archiv a ověření Pages; nepřeskakovat reálnou technickou blokaci. Visual Polish zůstává mimo Codex, u Claude.
