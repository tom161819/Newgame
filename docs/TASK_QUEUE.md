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

## Následuje

1. **Právě probíhá:** [Krok 17 — blueprinty a skutečná výstavba](requests/step-17.md).
2. [Krok 18a — archiv skutečných historických verzí](requests/step-18a.md).
3. [Krok 18b — New Game Setup, obtížnost a parametry mapy](requests/step-18b.md).
4. [Krok 19 — Advanced New Game Setup & World Configuration](requests/step-19.md).

Číslo 18 bylo použité u dvou různých zadání; obě se zachovávají v pořadí doručení jako 18a a 18b. Neaplikovat budoucí mechaniky před jejich krokem: krok 6 má okamžitý lov bez HP, krok 7 přidává koně/FoW, krok 8 Castle/Wall, skutečné souboje až krok 9.
