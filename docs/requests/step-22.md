# Krok 22 — Medieval Kingdom – Upgrade 2: Food Production & Storage

Rozšiř fungující zemědělství o zpracování obilí, chleba a skladování potravin. Zachovej Farmhouse, Wheat Field, Orchard, Farming Skill, pracovní AI, ekonomiku a Save/Load.

## 1. Budovy
Do Buildings i Asset Library, vždy původní blueprinty/stavitelé/dokončení:
- Mill (mill): 2 × 2, 12 Stone, kapacita 2 pracovníci Miller.
- Bakery (bakery): 2 × 2, 10 Stone, kapacita 2 pracovníci Baker.
- Granary (granary): 3 × 3, 10 Stone, kapacita 200 potravin a zemědělských surovin.

## 2. Mouka
Mlýn: 4 Wheat → 3 Flour, 30 sekund aktivní práce. Alespoň jeden Miller musí fyzicky dojít do mlýna. Bez obilí čeká. Rezervace vstupů při začátku a odečet právě jednou, výstup při dokončení. Save/Load bez duplikace.

## 3. Chléb
Pekárna: 2 Flour → 4 Bread, 30 sekund aktivní práce, vyžaduje Baker, při nedostatku mouky čeká. Bread je jedlá potravina.

## 4. Profese a skilly
Přidej Miller/Baker a Milling/Baking do původních Job/XP systémů. Jedna profese na postavu, skilly 1–50 stejná XP křivka a vzorec efektivity. Vyšší skill zrychluje příslušnou výrobu. Zahrň profese do mezd, žádný nový nezávislý systém.

## 5. Skladování a fyzická doprava
Skutečná sýpka pro Wheat, Flour, Bread, Apple, Meat. Jedna kapacita 200, více sýpek sčítá společnou kapacitu. Rozšiř jediný autoritativní inventář o skladový model, žádné duplicitní stavy. Bezpečně migruj stávající zásoby. Rozlišuj suroviny na zemi, nesené, uložené a rezervované pro výrobu; přechody nikdy nekopírují materiál.
Farmář odnese úrodu do dostupné sýpky. Mlynář vyzvedne obilí a dopraví do mlýna, mouku odnese do sýpky. Pekař odnese mouku do pekárny a chléb do sýpky. Každý pracovník unese max. 20 jednotek, případně více cest. Bez dostupné sýpky omezené výchozí skladování 30 jednotek umožní rozehrání. Při plném skladu zastav nové cykly bez kapacity pro výstup; již vzniklé přebytky zachovej jako předměty na zemi. Bez profese nosiče.

## 6. Auto Production
Výchozí automatická výroba: dokončená budova + dostupný pracovník + vstupy + kapacita pro výstupy → další cyklus. Panel Mill/Bakery má ON/OFF. Jeden pracovník nesmí vykonávat dvě práce současně.

## 7. UI
Horní lišta nebo Resources: Wheat, Flour, Bread, Apple. Sýpka: využití kapacity, obsah, dostupná kapacita, rezervované suroviny. Výrobní budovy: recept, pracovníci, stav výroby, průběh cyklu, chybějící vstupy.

## 8. Save/Load
Nové suroviny, pracovníci, sklady, rezervace, nesené náklady a průběh cyklů; přesné pokračování bez duplicit a nového odečtu. Bezpečně ošetři změnu profese a zničení/zrušení budovy během výroby.

## 9. Testování
Celý řetězec Wheat Field → Wheat → Granary → Mill → Flour → Granary → Bakery → Bread → Granary. Fyzická doprava, kapacity, rezervace, skilly, Save/Load. Před úpravami Git commit, po dokončení všechny relevantní testy.

Bez počasí, ročních období a kažení potravin.
