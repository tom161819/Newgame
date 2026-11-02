krok 11	"Upgrade hry – Main Menu a Save/Load System

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o hlavní menu a kompletní systém ukládání a načítání rozehrané hry.

DŮLEŽITÉ: Zachovej všechny existující funkce hry. Nezakládej nový projekt ani nepřepisuj funkční herní systémy.

1. Hlavní menu – Main Menu

Při každém spuštění nebo obnovení stránky se nejprve zobrazí hlavní menu.

Hra se nesmí automaticky spustit.

Vzhled:

Středověký vizuální styl odpovídající izometrické hře.

Název hry v horní části obrazovky (zatím použij pracovní název Medieval Kingdom).

Jednoduché tmavé pozadí s motivem hradu.

Přehledná tlačítka uprostřed obrazovky.

Tlačítka:

New Game

Spustí úplně novou hru.

Vygeneruje novou mapu a počáteční objekty.

Vynuluje inventář, vybavení, čas a HP.

Zachová uložené nastavení hry, například Fog of War.

Nesmí automaticky přepsat existující uloženou hru.

Load Game

Otevře seznam uložených her.

Zobrazí datum uložení, herní den a čas hraní.

Umožní vybrat konkrétní uloženou pozici.

Pokud zatím neexistují žádné uložené hry, zobrazí informaci No saved games.

2. Systém ukládání – Save Game

Přidej možnost kdykoliv uložit aktuální hru.

Do levého zasouvacího panelu Settings přidej:

Save Game

Load Game

Main Menu

Zároveň přidej možnost otevření herního menu klávesou ESC, pokud hráč není právě v režimu stavění nebo jiném dialogu.

Při otevření herního menu hru pozastav.

Ukládání:

Použij IndexedDB jako lokální úložiště v prohlížeči.

Podporuj minimálně 5 samostatných uložených pozic.

Hráč může vytvořit nový save nebo přepsat existující.

Před přepsáním zobraz potvrzovací dialog.

Každý save obsahuje název, datum vytvoření, datum posledního uložení a herní den.

Po úspěšném uložení zobraz oznámení Game saved successfully.

Pokud uložení selže, zobraz chybu a nepřepisuj původní funkční save.

Ukládání musí fungovat bez internetu a bez backendu.

3. Jaká data ukládat

Ulož kompletní herní stav potřebný pro pokračování přesně tam, kde hráč skončil.

Hráč

Aktuální pozice na mapě.

HP a maximální HP.

Základní bojové statistiky.

Stav vybavení (meč, brnění).

Stav nasednutí na koně.

ID aktuálního koně.

Stav pobytu na věži, hradě nebo hradbách.

Případné další trvalé vlastnosti hráče.

Inventář

Gold.

Stone.

Meat.

Veškeré další suroviny.

Získané a vybavené předměty.

Mapa

Stav a typ všech políček mapy 100 × 100.

Pozice překážek.

Pozice všech postavených budov.

Typ a vlastnosti jednotlivých budov.

Postavené hradby a jejich propojení.

Kameny a další suroviny nacházející se na mapě.

Sebratelné dropy a jejich množství.

Otevřené i neotevřené truhly.

Obsah dosud neotevřených truhel.

Zvířata

Typ zvířete.

Unikátní ID instance.

Aktuální pozice.

Aktuální HP.

Stav živé/mrtvé.

Stav koně a případné nasednutí hráče.

Herní čas

Aktuální herní den.

Uplynulý čas současného dne.

Zbývající čas do další spotřeby masa.

Zbývající čas do dalšího generování kamene.

Celkový odehraný herní čas.

Ostatní

Stav kamery a zoomu.

Trvalé nastavení hry.

Další relevantní data existujících herních systémů.

Při načítání se nesmí znovu náhodně generovat původní kameny, zvířata, truhly nebo jiné objekty, které už jsou součástí uloženého stavu.

Neukládej do save souborů Phaser GameObjects, textury, funkce nebo jiné neserializovatelné objekty. Ukládej pouze čistá data, ze kterých se herní scéna zrekonstruuje.

4. Load Game – načtení hry

Při načtení:

Ověř existenci a platnost uložených dat.

Načti mapu a obnov její stav.

Obnov všechny postavené budovy, objekty, suroviny a zvířata.

Obnov krále, jeho pozici, HP a vybavení.

Obnov stav koně a případnou jízdu.

Obnov inventář a herní čas.

Obnov časovače podle uloženého zbývajícího času.

Obnov kameru a její přiblížení.

Aktualizuj Fog of War podle aktuální pozice krále.

Teprve po dokončení obnovy spusť běžnou herní logiku.

Herní čas se nesmí během načítání posouvat.

Pokud hráč uloží hru například v Day 4 s 35 sekundami do dalšího dne, musí po načtení pokračovat přesně od tohoto okamžiku.

Nevytvářej duplicitní časovače, zvířata, objekty nebo budovy.

5. Správa uložených her

Vytvoř samostatnou obrazovku Save/Load.

Každá uložená pozice zobrazí:

Název uložené hry.

Datum a čas uložení.

Aktuální herní den.

Celkovou dobu hraní.

Tlačítko Load.

Tlačítko Delete.

Při ukládání nabídni také možnost přepsat existující pozici.

Před odstraněním nebo přepsáním uložené hry vždy vyžádej potvrzení.

Po odstranění save aktualizuj seznam uložených her.

6. Pozastavení hry – Pause System

Vytvoř centrální systém pozastavení hry.

Při otevření herního menu:

Zastav pohyb krále.

Zastav pohyb zvířat.

Zastav souboje a regeneraci HP.

Pozastav generování kamenů.

Pozastav herní čas.

Pozastav spotřebu masa.

Pozastav produkci surovin.

Po zavření menu musí všechny systémy pokračovat bez časového skoku.

Nesmí dojít k několikanásobnému spuštění časovačů po opětovném spuštění hry.

7. Architektura

Vytvoř nebo rozšiř:

MainMenu – hlavní nabídka hry.

SaveLoadMenu – správa uložených pozic.

SaveGameManager – ukládání a načítání přes IndexedDB.

GameStateSerializer – převod aktuálního stavu hry na ukládaná data.

GameStateLoader – rekonstrukce herního stavu.

PauseManager – centrální pozastavení hry.

Přizpůsob názvy existující architektuře projektu.

Každému uloženému stavu přidej saveVersion, aby bylo možné v budoucnu upravit strukturu ukládání a provádět migrace starších verzí.

Zajisti, aby všechny důležité herní systémy měly jasně definované metody pro export a import svého stavu.

8. Testování

Před většími úpravami vytvoř Git commit.

Ověř:

Při spuštění hry se vždy zobrazí Main Menu.

New Game vytvoří novou hru.

Load Game načte existující save.

Lze vytvořit alespoň 5 různých uložených pozic.

Ukládání zachovává inventář, HP a vybavení.

Všechny postavené budovy zůstávají po načtení na stejných pozicích.

Zvířata se obnoví se správnými HP.

Sebrané suroviny se znovu neobjeví.

Otevřená truhla zůstane otevřená a prázdná.

Jízda na koni funguje i po načtení.

Herní čas a časovače pokračují od uloženého stavu.

Fog of War se správně obnoví.

Herní menu správně pozastavuje hru.

Uložené hry zůstanou dostupné po zavření a opětovném otevření prohlížeče.

Nová hra nepřepíše existující save bez potvrzení.

Poškozený save nezpůsobí pád celé hry.

Opakované načítání nevytváří duplicitní objekty ani časovače.

Prioritou je spolehlivost ukládání a načítání. Nepřidávej další herní mechaniky.

Při implementaci připrav automatizované testy serializace a obnovy herního stavu. Pokud je to možné, ověř i skutečné uložení a načtení pomocí testu v prohlížeči."