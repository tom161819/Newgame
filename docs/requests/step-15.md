# Krok 15 — Přirozené talenty poddaných a systém mezd

Rozšiř stávající izometrickou hru o individuální vlohy postav, rozdílné počáteční schopnosti, pracovní mzdy a základní ekonomiku zaměstnanců. Zachovej individuální skilly 1–50, celkové levely, profese, migraci obyvatel, produkci zlata, herní čas a Save/Load.

## 1. Natural Talents
Každý nový poddaný má právě jeden náhodný hlavní talent: Natural Hunter/Hunting, Natural Miner/Mining, Natural Builder/Construction, Natural Woodcutter/Woodcutting, Natural Farmer/Farming, Natural Fighter/Combat.
Talent přidává +20 % získaných XP jen v odpovídajícím skillu. Nemění přímo damage, rychlost práce ani jiné statistiky. Je trvalý a změna profese ho nemění.

## 2. Počáteční skilly
Při vytvoření: hlavní talentovaný skill level 3–8; jeden jiný náhodný skill level 1–4; ostatní level 1. Celkový level je nezávislý podle stávajícího Experience Systemu. Počáteční XP musí odpovídat vygenerovanému levelu a existující XP křivce. Libovolnou profesi lze přiřadit bez ohledu na talent.

## 3. Denní mzdy
Nezaměstnaný 0 Gold. Woodcutter, Miner, Hunter, Builder, Farmer po 1 Gold. Soldier 2 Gold.
Za každých 10 dokončených úrovní příslušného pracovního skillu přidej +1 Gold/den: Mining 1–10 = 1, 11–20 = 2, 21–30 = 3, 31–40 = 4, 41–50 = 5. Použij skutečný skill dané postavy. Změna profese přepočítá sazbu podle nového pracovního skillu.

## 4. Výplata
Stávající Game Time: den = 120 sekund. Při přechodu dne odečti Gold z inventáře království. Náklady počítej poměrně podle doby strávené v jednotlivých profesích během uplynulého dne, aby změna zaměstnání na konci dne neobcházela náklady. Interně eviduj přesně, UI dvě desetinná místa. Za tentýž den se mzdy nesmí odečíst vícekrát.

## 5. Nedostatek zlata
Gold nesmí být záporný. Nezaplacená část je dluh vůči konkrétním poddaným. Zobraz „Insufficient Gold to pay wages.“ Poddaný zůstává; bez automatického odchodu/vzpour. Další výplatní cyklus nejdříve uhradí starší dluhy, pokud Gold je. Architekturu připrav pro budoucí morálku, stávky a emigraci, zatím je nezaváděj.

## 6. Panel poddaného
Kliknutím: jméno, celkový level/XP, profese, aktuální mzda Gold/den, hlavní talent a XP bonus, všechny skilly/levely, pracovní úkol, nezaplacený plat. Zvýrazni talentovaný skill. Zachovej změnu profese.

## 7. Ekonomika
UI: aktuální Gold; příjem Gold/den z hradů; odhad výdajů mzdy/den; odhad denního zisku/ztráty; celkové nezaplacené mzdy. Příklad Castle Income +15 Gold/day, Worker Wages -9 Gold/day, Balance +6 Gold/day. Aktualizace po změně počtu hradů, pracovníků, profesí a skill levelů.

## 8. Save/Load
Ukládej talent každé postavy, počáteční/aktuální skilly, sazbu nebo data pro její výpočet, dluhy, rozpracované denní mzdové náklady, stav posledního výplatního cyklu. Načtení nesmí duplikovat výplatu ani znovu losovat talenty. Starší save musí fungovat s bezpečnými defaulty.

## 9. Testy a omezení
Před změnami Git commit. Ověř náhodné počáteční skilly, právě jeden talent, +20 % XP, zachování talentu/skillů po změně profese, správnou mzdu, nulové náklady nezaměstnaných, výplatu jednou denně, nezáporné Gold, evidenci dluhu, správné ekonomické UI, Save/Load všech statistik i původní mechaniky. Nepřidávej další profese, suroviny ani morálku; zaměř se na individuální rozdíly a mzdy.
