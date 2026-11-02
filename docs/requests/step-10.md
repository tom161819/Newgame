krok 10	"Upgrade hry – Herní čas, regenerace HP, zlato a poklady

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o herní čas, automatickou regeneraci životů, ekonomiku zlata a systém pokladů a vybavení.

Nezakládej nový projekt. Zachovej všechny dosavadní mechaniky, zejména pohyb krále, souboje, Fog of War, stavění hradů a hradeb, jízdu na koni, lov zvířat, inventář a Asset Library.

1. Herní čas – Game Time System

Implementuj centrální systém herního času.

Jeden herní den trvá 120 sekund skutečného aktivního herního času.

Hra začíná dnem 1.

Po uplynutí 120 sekund začne další den.

Čas musí být nezávislý na FPS.

Herní čas se zastaví při Game Over a při pozastavení hry.

Zatím není potřeba ukládání času mezi spuštěními hry.

Do horní lišty přidej ukazatel:

Day 1 | 01:15 / 02:00

Zobraz aktuální den a čas zbývající do dalšího dne.

Při změně dne vyvolej centrální událost onNewDay, kterou budou využívat další systémy, například produkce zlata.

Zajisti, aby se událost každého nového dne spustila právě jednou, i při poklesu FPS.

2. Automatická regenerace HP

Král bude automaticky obnovovat ztracené životy.

Regenerace: +1 HP každých 5 sekund.

Funguje při chůzi, jízdě na koni, pobytu v budovách i během souboje.

HP nikdy nesmí překročit maxHP.

Pokud má král plné životy, regenerace nemá žádný efekt.

Pokud je král mrtvý, regenerace nefunguje.

Regenerace nesmí oživovat mrtvé jednotky.

Regeneraci implementuj jako univerzální vlastnost jednotek hpRegenPerSecond.

Pro krále nastav hpRegenPerSecond = 0.2.

Zvířata budou mít zatím regeneraci 0.

Do budoucna připrav možnost regeneraci upravovat pomocí vybavení, jídla nebo dalších bonusů.

Zachovej stávající soubojový systém založený na DPS.

3. Nová surovina – Gold

Do inventáře přidej novou surovinu gold.

Gold musí být vždy na první pozici horní lišty.

Pořadí inventáře:

Gold

Stone

Meat

Případné další suroviny

Gold zobraz se zlatou ikonou mince.

Počáteční množství: 0 Gold.

Gold bude standardní surovina spravovaná existujícím inventářovým systémem.

Zatím nepřidávej možnost nakupování ani utrácení zlata.

4. Produkce zlata z hradů

Každý postavený Castle bude generovat 5 Gold za jeden herní den.

Pravidla:

Produkce se spouští při přechodu na další herní den.

Jeden hrad = 5 Gold za den.

Dva hrady = 10 Gold za den.

Tři hrady = 15 Gold za den.

Počet hradů není omezen.

Nově postavený hrad začne produkovat zlato při nejbližším následujícím přechodu dne.

Již dokončené dny se zpětně nedoplácejí.

Zlato se automaticky přičítá do inventáře.

Produkce funguje nezávisle na poloze krále nebo Fog of War.

Při připsání zlata zobraz krátké oznámení, například:

Day 3 – Castle income: +15 Gold

Produkce musí být definována přímo v Object Registry u budovy Castle, například:

production: { resource: ""gold"", amount: 5, interval: ""day"" }

Nezadávej produkci natvrdo pouze do konkrétního herního systému.

Připrav univerzální strukturu pro budoucí produkci jiných surovin dalšími budovami.

5. Nový objekt – Treasure Chest

Do Asset Library přidej objekt:

ID: treasure_chest

Název: Treasure Chest

Kategorie: Treasure

Velikost: 1 × 1 políčko

Sebratelný: Ne

Interakce: Open

Průchozí: Ne

Použij jednoduchou izometrickou grafiku dřevěné truhly s kováním.

Při každém novém spuštění hry se na mapě objeví přesně jedna truhla.

Umístění:

Náhodné volné políčko na mapě 100 × 100.

Truhla nesmí vzniknout na budovách, překážkách, surovinách ani jiných objektech.

Musí být dostupná pro krále.

Nesmí vzniknout přímo na startovní pozici krále.

Pro každou novou hru vytvoř novou náhodnou pozici.

Truhla respektuje Fog of War a je viditelná pouze v aktuálním zorném poli krále, pokud je FoW zapnutý.

6. Otevření pokladu

Po kliknutí na truhlu:

Král dostane příkaz dojít k truhle.

Automaticky najde cestu.

Po dosažení sousedního políčka truhlu otevře.

Spustí se jednoduchá animace otevření.

Zobrazí se okno s obsahem truhly.

Hráč klikne na tlačítko Take All.

Předměty se přidají do inventáře.

Truhla zůstane na mapě jako otevřená a prázdná.

Obsah truhly:

Náhodně 50 až 100 Gold (celé číslo).

1× Sword.

1× Armor.

Každý poklad lze vybrat pouze jednou.

Obsah vygeneruj při vytvoření truhly a neměň ho při opakovaném otevření.

7. Nový předmět – Sword

Přidej nový vybavitelný předmět:

ID: basic_sword

Název: Sword

Kategorie: Equipment / Weapon

Bonus: +100 % attack DPS

Po získání meče se automaticky vybaví.

Výpočet:

FinalDPS = BaseDPS × (1 + attackBonus / 100)

Král má základní DPS = 15.

S mečem získá 30 DPS.

Bonus aplikuj přes univerzální systém vybavení, nikoliv trvalou změnou základních statistik krále.

Pokud hráč meč později odloží, DPS se musí vrátit na původní hodnotu.

Stejný meč se nesmí vybavit dvakrát a opakovaně násobit DPS.

8. Nový předmět – Armor

Přidej druhý vybavitelný předmět:

ID: basic_armor

Název: Armor

Kategorie: Equipment / Armor

Bonus: +30 procentních bodů Armor

Po získání se automaticky vybaví.

Král má základní Armor = 0 %.

S tímto brněním má Armor = 30 %.

Výpočet příchozího poškození:

EffectiveDamage = IncomingDamage × (1 - Armor / 100)

Příklad:

Divočák má 12 DPS.

Král má 30 % Armor.

Král dostává 8.4 DPS.

Zachovej maximální limit Armor 90 %.

Bonus z brnění musí fungovat se stávajícím Combat Systemem a nesmí měnit základní statistiky jednotky.

9. Inventář vybavení

Rozšiř inventář o kategorii Equipment.

Zatím stačí dva sloty:

Weapon

Armor

U každého vybaveného předmětu zobraz jeho ikonu a statistický bonus.

Přidej jednoduché detailní okno, které zobrazí:

Base DPS

Final DPS

Base Armor

Final Armor

HP

HP Regeneration

Vybavení získané z pokladu se automaticky vloží do odpovídajícího slotu.

Připrav možnost budoucí výměny vybavení, ale zatím neimplementuj obchodování ani složitý inventář.

10. Architektura systému

Vytvoř nebo rozšiř:

GameTimeSystem – správa herního času.

RegenerationSystem – regenerace HP.

ProductionSystem – produkce surovin budovami.

TreasureSystem – generování a otevírání pokladů.

EquipmentSystem – vybavení a statistické bonusy.

Přizpůsob se současné struktuře projektu, nevytvářej zbytečné duplicity.

Všechny nové objekty a předměty zaregistruj v Asset Library.

Statistiky a bonusy definuj centrálně, ne na více místech v kódu.

11. Testování

Před většími úpravami vytvoř Git commit.

Ověř:

Jeden herní den trvá přesně 120 sekund aktivní hry.

Čas se správně zobrazuje a přechází do dalšího dne.

Král regeneruje 1 HP každých 5 sekund.

HP nikdy nepřesáhne maximum.

Každý postavený hrad generuje 5 Gold za den.

Příjem správně funguje i při více hradech.

Gold je na první pozici inventáře.

Na mapě vznikne přesně jedna dostupná truhla.

Obsahuje 50–100 Gold, Sword a Armor.

Poklad lze vybrat pouze jednou.

Sword zvýší DPS krále z 15 na 30.

Armor sníží příchozí damage o 30 %.

Bonusy vybavení se neuplatňují opakovaně.

Vybavení se správně zobrazuje v inventáři.

Fog of War správně skrývá neobjevenou truhlu.

Všechny původní funkce hry zůstávají funkční.

Nepřidávej další nové budovy, zvířata ani jiné předměty. Zaměř se na stabilitu nových systémů a jejich budoucí rozšiřitelnost."