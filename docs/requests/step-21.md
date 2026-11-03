# Krok 21 — Medieval Kingdom – Upgrade 1: Farming & Orchards

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o zemědělství, růst plodin a ovocné sady. Nezakládej nový projekt. Nejprve analyzuj existující systémy budov, blueprintů, pracovních profesí, individuálních skillů, Game Time, inventáře a Save/Load. Zachovej dosavadní funkce hry.

## 1. Nové budovy
Do Buildings a Asset Library přidej:
- Farmhouse, ID farmhouse, 2 × 2, cena 10 Stone, 3 pracovní místa, profese Farmer, pracovní rádius 15 políček.
- Wheat Field, ID wheat_field, 3 × 3, cena 3 Stone, produkce Wheat, potřebuje obsluhu farmáře.
- Orchard, ID orchard, 3 × 3, cena 6 Stone, produkce Apple, potřebuje obsluhu farmáře.
Všechny objekty používají stávající blueprinty a fyzickou výstavbu. Rozestavěná farma ani pole nesmí produkovat.

## 2. Farmáři
Každá farma zaměstnává nejvýše 3 farmáře. Použij existující profesi Farmer a skill Farming. Farmář má farmu jako pracoviště, vyhledá volné pole nebo sad v rádiusu, rezervuje konkrétní úkol, fyzicky dojde na místo, pracuje, po úspěšném dokončení získá Farming XP a pokračuje dalším úkolem. Každý poddaný má právě jednu aktivní profesi. Více farmářů nesmí neoprávněně dokončit stejnou sklizeň. Použij existující pohybovou AI a vyšlapávání cest.

## 3. Obilí
Čtyři grafické fáze: Stage 0 připravená půda; Stage 1 mladé zelené obilí; Stage 2 vzrostlé obilí; Stage 3 zralé zlaté obilí. Růst trvá 2 herní dny podle Game Time, nikoli FPS. Zralé pole farmář fyzicky sklidí: 8 Wheat. Poté Stage 0 a nový cyklus. Bez farmáře může obilí růst, ale žádná automatická sklizeň ani suroviny. Připrav budoucí modifikátory počasí a sezón.

## 4. Sad
Fáze: stromy bez plodů; kvetoucí stromy; malé plody; zralá jablka. Růst plodů 3 herní dny. Sklizeň 6 Apple vyžaduje fyzickou návštěvu a práci farmáře. Po sklizni stromy zůstávají a začíná nový cyklus, bez nového vysazování. Připrav sezónní produkci.

## 5. Farming Skill
Existující levely 1–50. Vyšší Farming zrychluje aktivní přípravu/sklizeň, nikoli biologický růst. Efficiency = 1 + (SkillLevel - 1) × 0.01. Farming XP pouze za úspěšně dokončené úkony; celkové XP neduplikuj.

## 6. Inventář
Přidej Wheat a Apple do jediného společného inventáře. Wheat zatím není přímo jedlé, Apple je jedlá potravina. Připrav budoucí fyzickou dopravu úrody do sýpky; nevytvářej druhý inventář.

## 7. Grafika
Původní izometrický styl; skutečné obilí a skupiny ovocných stromů v různých fázích, nikoli pouze změna barvy políčka. Jednoduchá animace práce farmáře. Originální provizorní grafika připravená na výměnu za finální assety.

## 8. Save/Load
Ukládej všechny farmy/pole/sady, fáze a postup růstu, přiřazené pracovníky, rezervace, stav sklizně a nové suroviny. Po Load žádná duplicitní produkce ani dvojité dokončení sklizně.

## 9. Ověření
Blueprinty všech budov, přiřazení farmáře, postupný nezávislý růst obilí/jablek, sklizeň pouze fyzickou prací, správné suroviny/XP, Save/Load fází a regrese ostatních systémů. Před úpravou Git commit; po dokončení testy, build a nový commit.

Neimplementuj mlýn, pekárnu, počasí ani nové mechaniky hladu.
