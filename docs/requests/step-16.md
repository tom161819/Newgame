krok 16	"Upgrade hry – Pracovní budovy a správa zaměstnanců

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o pracovní budovy a systém pracovních míst.

Cílem je vytvořit skutečně fungující ekonomiku osady, kde poddaní docházejí na konkrétní pracoviště a vykonávají přidělenou práci.

Zachovej všechny dosavadní systémy, zejména individuální skilly, XP, levely 1–50, profese, talenty, mzdy, populaci, migraci, inventář, Fog of War, vyšlapávání cest, herní čas a Save/Load.

Nezakládej nový projekt. Nejdříve prozkoumej existující strukturu a navazuj na již vytvořené systémy.

1. Nové pracovní budovy

Přidej do nabídky Buildings tři nové budovy.

Quarry – Kamenolom

ID: quarry

Velikost: 3 × 3 políčka

Cena: 15 Stone

Kapacita: 3 horníci

Povolená profese: Miner

Požadovaný skill: Mining

Hunting Lodge – Lovecká chata

ID: hunting_lodge

Velikost: 2 × 2 políčka

Cena: 10 Stone

Kapacita: 2 lovci

Povolená profese: Hunter

Požadovaný skill: Hunting

Barracks – Kasárna

ID: barracks

Velikost: 3 × 3 políčka

Cena: 20 Stone

Kapacita: 5 vojáků

Povolená profese: Soldier

Požadovaný skill: Combat

Budovy přidej do Object Registry a Asset Library.

Zachovej stávající pravidla stavění, kontrolu obsazených políček a izometrické vykreslování.

2. Přiřazování pracovníků

Každá pracovní budova má seznam pracovních míst.

Po kliknutí na budovu otevři panel s informacemi.

Příklad:

QUARRY

Workers: 2 / 3

Radovan – Mining Lv. 12

Václav – Mining Lv. 24

Empty Slot

Tlačítka:

Assign Worker

Remove Worker

Po kliknutí na Assign Worker zobraz seznam dostupných poddaných.

U každého zobraz:

Jméno.

Aktuální profesi.

Level příslušného skillu.

Talent.

Předpokládanou mzdu.

Pravidla:

Jeden poddaný může mít maximálně jednu aktivní profesi.

Jeden poddaný může být přiřazen maximálně k jedné pracovní budově.

Nelze překročit kapacitu budovy.

Při změně pracoviště se bezpečně zruší předchozí pracovní úkol.

Při odebrání pracovníka se uvolní jeho pracovní místo a poddaný přejde do stavu Idle.

Přeřazení nesmí mazat zkušenosti ani talenty.

Při přiřazení pracovníka automaticky nastav odpovídající profesi.

3. Skutečná práce horníků

Horníci přiřazení ke kamenolomu budou automaticky vykonávat práci.

Postup:

Horník dojde ke kamenolomu.

Vyhledá dostupný kámen v okolí pracoviště.

Rezervuje si cíl, aby k němu současně nešel jiný horník.

Dojde ke kameni.

Sebere ho pomocí existujícího systému sběru.

Vrátí se ke kamenolomu.

Po návratu přidá kámen do společného inventáře.

Získá odpovídající Mining XP a celkové XP.

Vyhledá další práci.

Kamenolom zatím nesmí generovat kameny z ničeho. Pracovníci sbírají skutečné kameny existující na mapě.

Pokud není dostupný žádný kámen, pracovník čeká a pravidelně kontroluje nové cíle.

Použij existující systém náhodného respawnu kamenů.

4. Skutečná práce lovců

Lovci přiřazení k lovecké chatě budou automaticky lovit.

Postup:

Lovec dojde k lovecké chatě.

Vyhledá dostupné lovitelné zvíře.

Zarezervuje si cíl.

Dojde ke zvířeti.

Použije existující Combat System.

Po zabití zvířete sebere maso.

Vrátí se k lovecké chatě.

Maso vloží do společného inventáře.

Získá Hunting XP a celkové XP.

Zachovej současné množství masa podle druhu zvířete.

Lovci musí používat vlastní HP, DPS, Armor a skill bonusy.

Pokud HP lovce klesne pod 30 %, přeruší lov, vrátí se do bezpečí a počká na regeneraci.

Při smrti lovce se uvolní pracovní místo.

Pokud není dostupné žádné zvíře, lovec čeká.

Nevytvářej zatím nové mechaniky respawnu zvěře.

5. Kasárna a vojáci

Kasárna budou sloužit jako pracoviště pro profesi Soldier.

Přiřazením existujícího poddaného do kasáren se změní jeho profese na Soldier.

Poddaný si ponechá identitu, skilly, level, HP a historii.

Nevytvářej novou jednotku z ničeho.

Voják používá stávající Combat System.

Vojáci budou zatím hlídkovat v okolí kasáren.

Při napadení mohou bránit sami sebe.

Zatím neimplementuj automatické útoky na neutrální zvířata, války ani skupinové velení.

Combat XP získávají pouze za skutečné bojové akce.

Kasárna neprodukují nové obyvatele.

6. Pracovní efektivita

Použij existující systém skillů.

Pracovní efektivita:

Efficiency = 1 + (SkillLevel - 1) × 0.01

Vyšší skill zvyšuje rychlost samotného vykonávání práce, nikoliv rychlost chůze.

U sběru a lovu vytvoř krátkou pracovní dobu podle typu činnosti, kterou skill ovlivňuje.

Příklad:

Mining Lv. 1: základní doba sběru.

Mining Lv. 25: přibližně o 19 % kratší doba sběru.

Mining Lv. 50: přibližně o 33 % kratší doba sběru.

Nezdvojuj bonusy již aplikované stávajícím SkillSystemem.

Zkušenosti přiděluj až po úspěšném dokončení práce.

7. Ekonomika a mzdy

Zachovej současný systém mezd.

Každý zaměstnaný poddaný dostává plat podle profese a pracovního skillu.

Do panelu budovy přidej:

Počet zaměstnanců.

Celkovou denní mzdu zaměstnanců.

Aktuální pracovní stav.

Množství dosud přinesených surovin.

Průměrný skill pracovníků.

Mzdy se nadále vyplácejí jednou za herní den podle existujícího systému.

Zamez duplicitnímu odečítání zlata.

8. Pracovní AI a pohyb

Každý pracovník musí být skutečnou fyzickou postavou na mapě.

Přidej pracovní stavy:

Going to Workplace

Searching for Target

Traveling to Target

Working

Returning to Workplace

Waiting

Recovering

Pracovníci používají existující osmisměrný pathfinding.

Musí respektovat budovy, hradby, překážky a další jednotky.

Pracovník nesmí pokračovat k cíli, který už neexistuje.

Dva pracovníci nesmí současně sebrat stejný kámen nebo stejný drop masa.

Změna profese okamžitě a bezpečně ukončí aktuální pracovní úkol.

Pracovníci budou přispívat k vyšlapávání cest podle existujícího Path Wear Systemu.

9. Save / Load

Rozšiř systém ukládání o:

Pracovní budovy a jejich ID.

Kapacitu jednotlivých pracovišť.

Seznam přiřazených pracovníků.

Pracovní stav jednotlivých poddaných.

Statistiky produkce budov.

Stav rozpracovaných úkolů.

Po načtení obnov pracovní úkoly bezpečně.

Zabraň duplicitnímu přidávání surovin, XP nebo vytváření NPC.

Pokud bude starší save obsahovat pracovníka bez přiřazené budovy, převeď ho do stavu Idle.

10. Uživatelské rozhraní

Vytvoř přehledný informační panel pracovní budovy.

Zobraz:

Název budovy.

Její obrázek.

Počet pracovních míst.

Seznam zaměstnanců.

Jejich skilly a pracovní stavy.

Celkové mzdové náklady.

Produkci surovin.

Tlačítka Assign a Remove.

U pracovních míst umožni rychle vybrat konkrétního poddaného.

Při otevřeném panelu budovy se klikání na UI nesmí přenášet do herní mapy.

11. Testování

Před úpravami vytvoř Git commit.

Ověř:

Všechny tři budovy lze postavit.

Quarry má maximálně 3 horníky.

Hunting Lodge má maximálně 2 lovce.

Barracks má maximálně 5 vojáků.

Jeden poddaný nemůže pracovat na dvou místech.

Horníci skutečně sbírají kameny.

Lovci skutečně loví a přinášejí maso.

Vojáci hlídkují v okolí kasáren.

Pracovníci získávají XP a zvyšují odpovídající skilly.

Mzdy se správně počítají.

Pracovníci vytvářejí vyšlapané cesty.

Při nedostatku zdrojů pracovníci čekají.

Save/Load obnovuje pracovní budovy a zaměstnance.

Hra funguje bez výrazného zpomalení i s více pracovníky.

Původní herní funkce zůstávají zachovány.

Neimplementuj zatím další profese ani nové suroviny. Prioritou je spolehlivé propojení pracovních budov, AI poddaných, skillů a ekonomiky."