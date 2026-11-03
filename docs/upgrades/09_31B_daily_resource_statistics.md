# ETAPA 09/15 – původní krok 31B: Daily Resource Statistics & Ledger

**Milník:** M2. **Důležitá úprava:** Denní ledger používá autoritativní ekonomické události, ne interní přesuny a ne odečty podle jednoho skladu.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Daily Resource Statistics & Transaction Ledger (samostatná etapa 31B)

4. Změna horní Resource Bar

U každé suroviny zobraz kromě aktuálního množství také její čistou změnu za poslední dokončený herní den.

Příklad:

Stone: 125 (+18)
Wood: 80 (-12)
Gold: 250 (+5)
Bread: 45 (+20)
Meat: 30 (-8)

Pravidla zobrazení:

Kladná změna: zelená hodnota s +.

Záporná změna: červená hodnota s -.

Nulová změna: neutrální šedá hodnota 0.

Použij skutečné barvy a grafický styl aktuálního rozhraní.

Denní změna musí být vizuálně menší než hlavní množství suroviny, aby horní panel zůstal přehledný.

Pokud se všechny suroviny nevejdou na jednu řádku, použij kompaktní rozložení nebo rozbalovací přehled.

5. Co znamená poslední den

Používej existující Game Time System.

Standardně trvá jeden herní den 120 sekund, ale respektuj nastavení New Game Setup.

Denní bilance musí být nezávislá na FPS.

Po skončení herního dne:

Uzavři statistiky dokončeného dne.

Ulož celkový zisk a spotřebu každé suroviny.

Vypočítej čistou změnu.

Připrav záznam pro další den.

V horní liště zobraz bilanci právě dokončeného dne.

Během aktuálně probíhajícího dne se v horní liště nadále zobrazuje poslední dokončený den.

Pokud ještě neuplynul ani jeden herní den, zobraz neutrální informaci, například —, místo vymyšlených údajů.

6. Detail po najetí myší

Po najetí myší na konkrétní surovinu otevři tooltip s přehledem denní ekonomiky.

Příklad pro Stone:

STONE

Current Storage: 125

LAST GAME DAY

Production: +30
Consumption: -12

Net Change: +18

INCOME
+20 Mining
+10 Stone Collection

EXPENSES
-10 Castle Construction
-2 Warehouse Construction

Tooltip musí obsahovat:

Název suroviny.

Aktuální množství.

Zisk za poslední dokončený den.

Spotřebu za poslední dokončený den.

Čistou změnu.

Rozpis jednotlivých zdrojů příjmů.

Rozpis jednotlivých kategorií výdajů.

Tooltip musí fungovat pro všechny skutečně dostupné suroviny včetně Gold.

Pokud je seznam dlouhý, zajisti jeho přehledné zobrazení a případné scrollování.

7. Kategorizace příjmů

Zaznamenávej, odkud suroviny přicházejí.

Příklady:

Stone:

Mining

Stone Collection

Trade Purchase

Construction Refund

Wood:

Woodcutting

Trade Purchase

Construction Refund

Wheat:

Farming

Trade Purchase

Apple:

Orchard Harvest

Trade Purchase

Flour:

Milling Production

Trade Purchase

Bread:

Bakery Production

Trade Purchase

Meat:

Hunting

Trade Purchase

Iron Ore:

Iron Mining

Trade Purchase

Gold:

Castle Income

Trade Sales

Treasure

Other Existing Income

Používej skutečné implementované systémy.

Pokud některá uvedená činnost ve hře neexistuje, nevytvářej ji pouze kvůli statistikám.

8. Kategorizace výdajů

Zaznamenávej, za co se suroviny spotřebovávají.

Příklady:

Building Construction

Production Processing

Food Consumption

Trade Sales

Wages

Trade Purchases

Other Existing Expenses

Při stavění eviduj konkrétní budovu, například:

-10 Stone – Castle Construction

Při výrobě zobraz:

-4 Wheat – Mill

Při spotřebě jídla zobraz:

-12 Bread – Villager Consumption

Při výplatě mezd:

-18 Gold – Worker Wages

Nevytvářej duplicitní statistiky pro stejnou transakci.

9. Správná integrace s fyzickou logistikou

Toto je zásadní.

Použij existující autoritativní Resource System.

Rozlišuj:

Vznik nové suroviny.

Přesun suroviny.

Spotřebu suroviny.

Prodej suroviny.

Nákup suroviny.

Vrácení suroviny.

Příklad:

Horník vytěží 10 Stone.

Kameny seberou nosiči.

Odnesou je do Warehouse.

Denní statistika musí vykázat pouze:

+10 Stone – Mining

Nesmí vykázat další příjem při:

Sebrání nákladu.

Předání nosiči.

Uložení do Warehouse.

Přesunu mezi sklady.

Doručení na staveniště.

Interní logistické přesuny nejsou nové příjmy ani skutečná spotřeba.

Materiál rezervovaný pro stavbu se nemá automaticky počítat jako spotřebovaný.

Za skutečnou spotřebu jej považuj až v okamžiku, který autoritativní stavební systém používá jako nevratné využití materiálu.

U zrušené stavby správně eviduj pouze skutečně ztracenou část materiálu. Materiál pouze vrácený ze staveniště do skladu není nový zisk.

Stejná pravidla platí pro výrobní budovy, sklady a obchodníky.

10. Central Resource Transaction Ledger

Vytvoř centrální systém pro evidenci ekonomických transakcí, například:

ResourceTransactionLedger

Každá skutečná ekonomická událost bude mít:

Unique Transaction ID

Game Time

Resource Type

Quantity

Direction / Transaction Type

Source / Reason

Related Building ID nebo Entity ID

Game Day

Zaznamenávej pouze skutečně dokončené transakce.

Nepoužívej samostatné nezávislé výpočty v každé UI komponentě.

UI musí pouze číst agregované statistiky z tohoto systému.

Pokud již existuje podobná evidence transakcí, rozšiř ji a nevytvářej druhou.

Zajisti, aby opakovaná událost se stejným ID nebyla započítána dvakrát.

11. Výpočty denní bilance

Pro každou surovinu vypočítej:

Daily Income = součet všech skutečných příjmů.

Daily Expenses = součet všech skutečných výdajů.

Daily Net Change = Daily Income - Daily Expenses.

Příklad:

Wood

Income: +35
Expenses: -18
Net: +17

Při klasifikaci rozlišuj externí příjmy, produkci, spotřebu a interní převody.

Denní bilance musí odpovídat skutečné ekonomice hry.

Nepočítej rozdíl pouze podle stavu jednoho Warehouse, protože suroviny mohou být fyzicky na více místech.

Pokud hráč používá více skladů, musí být zahrnutý celý majetek království včetně přepravovaného a doručeného, ale ještě nespotřebovaného materiálu.

12. Historie statistik

Uchovávej ekonomickou historii posledních 30 herních dnů.

Pro každý den a surovinu ukládej:

Income

Expenses

Net Change

Breakdown by Category

Historie musí být připravená pro budoucí grafy ekonomiky.

Prozatím není potřeba vytvářet nový rozsáhlý Economy Dashboard.

Zaměř se hlavně na horní Resource Bar a hover tooltipy.

Starší záznamy nad limit mohou být automaticky odstraněny.

13. Gold Economy

Gold musí používat stejný denní přehled jako ostatní suroviny.

Příjmy:

Castle Income

Trade Sales

Treasure

Other Existing Income

Výdaje:

Wages

Trade Purchases

Other Existing Expenses

Při výplatách pracovníků eviduj skutečně vyplacené zlato.

Nevyplacené mzdy nejsou skutečný výdaj Gold, dokud nedojde k platbě.

Zabraň duplicitním záznamům při denním ekonomickém vyhodnocení.

14. Save / Load

Rozšiř stávající Save/Load.

Ukládej:

Aktuální rozpracovanou denní bilanci.

Poslední dokončenou denní bilanci.

Historii za 30 herních dnů.

Poslední zpracovaná ID transakcí potřebná pro ochranu před duplicitami.

Stav dne, ke kterému statistiky patří.

Po načtení:

Nesmí vzniknout falešné ekonomické transakce při obnově inventáře.

Nesmí být zpětně přičtená již zaznamenaná produkce.

Nesmí dojít k opakované denní uzávěrce.

Statistiky musí pokračovat ze správného stavu.

U starších save souborů bez statistik začni evidenci od okamžiku načtení.

Nevymýšlej historické ekonomické údaje.

15. Background Simulation

Pokud již existuje Run in Background, zahrň do statistik i transakce vzniklé při simulaci neaktivní karty; jinak připrav čisté API pro pozdější integraci v etapě 29B a nepředstírej, že simulace na pozadí už funguje.

Při návratu musí denní bilance odpovídat skutečným změnám.

Například při simulaci tří herních dnů vytvoř tři samostatné denní záznamy.

Nezapočítej vše do jediného dne jen proto, že se události dopočítaly při návratu.

16. Uživatelské rozhraní

Zachovej stávající styl Medieval Kingdom.

Denní změnu zobraz menším písmem za množstvím suroviny.

Příklad:

Stone 125  +18

Wood 80  -12

Bread 45  +20

Pozitivní a negativní hodnoty vizuálně rozlišuj.

Tooltip umisťuj tak, aby nevystupoval mimo obrazovku.

Zajisti, aby šlo bez problémů používat:

Levý Settings panel.

Pravý Population panel.

Spodní Buildings panel.

Hlavní kameru.

Při otevřeném tooltipu nesmí scrollování uvnitř tooltipu měnit zoom kamery.

## Integrační testy etapy 31B

1. Poslední **dokončený** herní den ukazuje přesně příjem, spotřebu a saldo pro každou reálnou surovinu (před prvním dokončeným dnem "—").
2. Tooltip rozpadá příjmy a náklady podle skutečných zdrojů a důvodů; vykazuje skutečně zaplacené mzdy a reálné obchodní transakce pouze pokud jsou tyto systémy implementované.
3. Při těžbě + přenášení + uložení není surovina započtena víckrát; interní přesuny se nepočítají jako příjmy/výdaje.
4. Rezervovaný stavební materiál není spotřebován dříve než při nevratném použití; stornování stavby nevytváří falešný příjem.
5. Výroba 3 Iron Ore + 2 Wood -> 1 Iron Bar musí být po pozdějším kroku 35 správně zachycena a testy doplněny, až bude budova existovat.
6. Denní uzávěrky jsou idempotentní, posledních 30 dní je uložených a Save/Load nepřipisuje transakce zpětně.
7. Vytvoř testy, build, commit a Unreleased; následuje etapa 35.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

