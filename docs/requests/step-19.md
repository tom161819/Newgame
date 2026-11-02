krok 19	"UPGRADE – Advanced New Game Setup & World Configuration

Rozšiř stávající izometrickou 2.5D strategickou hru ve Phaseru o kompletní parametrizaci nové hry.

Hlavní cíl: Hráč si před spuštěním nové hry nastaví obtížnost, množství objektů, ekonomiku, Fog of War a herní čas. Všechna nastavení budou platit pro konkrétní rozehraný svět a zachovají se při Save/Load.

Nezakládej nový projekt. Nejprve prozkoumej současnou architekturu a implementované funkce. Zachovej stávající herní mechaniky.

1. Úvodní menu a Game Setup

Po spuštění hry zobraz hlavní menu:

New Game

Load Game

Kliknutí na New Game otevře samostatnou obrazovku New Game Setup.

Rozděl nastavení do dvou sekcí:

Basic Settings

Difficulty

Wildlife Population

Treasure Chests

Initial Stones

Advanced Settings

Fog of War

Starting Castle

Day Length

Wildlife Respawn

Starting Gold

Advanced Settings budou standardně sbalené a půjdou rozbalit.

Ve spodní části zobraz:

Start Game

Back

Reset to Defaults

Zachovej středověký vizuální styl a přehledné ovládání.

Při nastavování parametrů se hra ještě nesmí spustit a herní čas musí stát.

2. Výchozí konfigurace

Použij následující výchozí hodnoty:

const DEFAULT_GAME_SETTINGS = {
  difficulty: ""normal"",
  wildlifePopulation: ""normal"",
  treasureCount: 1,
  initialStoneCount: 30,
  fogOfWar: true,
  startingCastle: false,
  dayLengthSeconds: 120,
  wildlifeRespawn: ""normal"",
  startingGold: 0
};

Všechny hodnoty spravuj centrálně.

Nepoužívej duplicitní konfigurace v různých herních systémech.

3. Difficulty – obtížnost

Přidej tři režimy:

Statistika

Easy

Normal

Hard

King HP

150 %

100 %

80 %

King DPS

125 %

100 %

85 %

Animal HP

75 %

100 %

130 %

Animal DPS

75 %

100 %

130 %

Obtížnost upravuje základní bojové statistiky krále a lovitelných zvířat.

Pravidla:

Modifikátory aplikuj pouze jednou při vytvoření jednotky.

Vybavení, levely, skilly a další bonusy se aplikují až následně.

Armor není obtížností ovlivněn.

Kůň má zatím nezměněné statistiky.

Při načtení hry nesmí docházet k opakovanému násobení statistik.

Základní hodnoty načítej z Object Registry.

4. Wildlife Population

Zachovej třípolohové nastavení:

Rare / Ojediněle

1 Rabbit

1 Deer

1 Wild Boar

Celkem 3 zvířata

Normal

3 Rabbit

3 Deer

3 Wild Boar

Celkem 9 zvířat

Abundant / Hojně

8 Rabbit

8 Deer

8 Wild Boar

Celkem 24 zvířat

Zvířata náhodně rozmísti pouze na vhodných průchozích políčkách.

Koně nezapočítávej do populace lovitelné zvěře.

Tato hodnota slouží také jako cílový počet zvěře pro systém Wildlife Respawn.

5. Treasure Chests

Přidej slider:

Minimum: 0

Maximum: 10

Krok: 1

Default: 1

Při vytvoření nové hry vygeneruj přesně zvolený počet truhel.

Každá truhla:

Má unikátní ID.

Má vlastní náhodně vygenerovaný obsah.

Obsahuje 50–100 Gold, Sword a Armor podle dosavadního systému.

Lze ji vybrat jen jednou.

Respektuje Fog of War.

Zajisti, aby se truhly nepřekrývaly s překážkami, budovami, jinými objekty ani hráčem.

Při načtení uložené hry nevytvářej truhly znovu.

6. Initial Stones

Přidej slider:

Minimum: 0

Maximum: 100

Krok: 5

Default: 30

Hodnota určuje počet kamenů při vytvoření nové mapy.

Pravidla:

Maximálně jeden kámen na políčko.

Pouze průchozí volná políčka.

Kameny nesmí vznikat pod budovami nebo jednotkami.

Zachovej existující systém sbírání kamenů.

Zachovej automatický spawn nového kamene každých 20 sekund.

Maximální počet současně existujících kamenů musí být kompatibilní s počáteční hodnotou až 100.

Počet kamenů při založení nové hry není počet kamenů v inventáři krále.

7. Fog of War

Přidej přepínač ON/OFF.

Default: ON.

Při ON:

Terén zůstává viditelný.

Objekty mimo dohled krále jsou skryté.

Skryté objekty nejsou interaktivní.

Zorné pole se aktualizuje při pohybu krále.

Zachovej stávající bonusy dohledu.

Aktuální dohled:

Král pěšky: 20 × 20.

Král na koni: 30 × 30.

Král na věži: 40 × 40.

Král na hradě: 35 × 35.

Král na hradbách: 35 × 35.

Při OFF jsou všechny objekty viditelné.

Nastavení při startu hry předávej existujícímu FogOfWarSystem.

Zachovej možnost Fog of War zapínat a vypínat v levém panelu Settings během hry.

Změna Fog of War během hry nesmí změnit ostatní parametry světa.

Pokud existuje dřívější preference Fog of War uložená v localStorage, pro novou hru má přednost hodnota z Game Setup. Pro starší uložené hry zachovej jejich skutečný uložený stav.

8. Starting Castle

Přidej přepínač ON/OFF.

Default: OFF.

Pokud je ON:

Při vytvoření nové hry automaticky umísti jeden hotový Castle.

Rozměr hradu: 3 × 3 políčka.

Umísti jej na dostupnou plochu poblíž počáteční pozice krále.

Král musí mít přístup ke vstupu.

Hrad nesmí překrývat překážky ani jiné objekty.

Hrad je již dokončený, nikoliv blueprint.

Neodečítej žádné kameny.

Hrad ihned poskytuje všechny své existující funkce.

Produkuje standardně +5 Gold za herní den.

Poskytuje standardní bonus dohledu při výstupu krále na hrad.

Pokud je OFF:

Hra začne bez postaveného hradu.

Hráč ho může později postavit běžným stavebním systémem.

Starting Castle vytvoř pouze při New Game, nikdy opakovaně při Load Game.

9. Day Length

Přidej výběr délky herního dne:

Fast: 60 sekund

Normal: 120 sekund

Slow: 240 sekund

Default: 120 sekund.

Použij existující GameTimeSystem.

Všechny systémy založené na herních dnech musí respektovat nastavenou délku:

Produkce Gold z hradů.

Mzdy poddaných.

Zarůstání vyšlapaných cest.

Případné další denní ekonomické události.

Herní den musí být nezávislý na FPS.

Při změně dne vyvolej existující událost onNewDay právě jednou.

Zachovej ostatní časovače, například spotřebu masa a spawn kamenů, podle jejich dosavadní definice. Pokud běží v sekundách herního času, nepřepočítávej je automaticky na celé dny.

10. Wildlife Respawn

Přidej čtyři režimy:

Režim

Interval pokusu o spawn

Off

Bez respawnu

Slow

120 sekund

Normal

60 sekund

Fast

30 sekund

Default: Normal.

Intervaly představují sekundy aktivního herního času, ne počet herních dnů.

Pravidla:

Při každém intervalu se pokus vytvořit jedno nové lovitelné zvíře.

Nová zvířata se vytvářejí pouze tehdy, pokud je celková populace pod cílovým limitem.

Cílový limit určuje Wildlife Population.

Nové zvíře vyber tak, aby se přednostně doplňovaly druhy, kterých chybí nejvíce oproti cílovému počtu.

Nevytvářej zvířata přímo v zorném poli krále, pokud existuje vhodné bezpečné místo mimo dohled.

Spawny musí respektovat průchodnost mapy a existující objekty.

Zvířata nesmí vznikat uvnitř budov, na hráči ani na jiných jednotkách.

Po vytvoření mají standardní AI a aktuální statistiky podle zvolené obtížnosti.

Respawn se zastaví při Pause a Game Over.

Po Load Game pokračuje podle uloženého zbývajícího času.

Pokud je Respawn vypnutý, po ulovení zvířat populace přirozeně klesá.

Nevytvářej duplicitní spawn systémy.

11. Starting Gold

Přidej slider:

Minimum: 0 Gold

Maximum: 500 Gold

Krok: 25

Default: 0 Gold

Při New Game nastav počáteční množství zlata v inventáři.

Gold zůstává na první pozici horní lišty.

Počáteční zlato nepřičítej opakovaně při Load Game.

Zachovej existující příjmy z hradů, mzdy a ekonomické systémy.

12. Reset to Defaults

Přidej tlačítko Reset to Defaults.

Po kliknutí obnov všechny parametry podle DEFAULT_GAME_SETTINGS.

Tlačítko nesmí:

Zahájit novou hru.

Smazat uložené hry.

Změnit aktuálně rozehraný svět.

Před spuštěním zobraz stručný přehled zvoleného nastavení.

13. Save / Load

Rozšiř existující SaveGameManager a GameStateSerializer.

Každý save musí obsahovat:

gameSettings: {
  difficulty: ""normal"",
  wildlifePopulation: ""normal"",
  treasureCount: 1,
  initialStoneCount: 30,
  fogOfWar: true,
  startingCastle: false,
  dayLengthSeconds: 120,
  wildlifeRespawn: ""normal"",
  startingGold: 0
}

Při Save Game ukládej také:

Skutečný stav mapy.

Existující zvířata a jejich HP.

Aktuální stavy a zbývající intervaly respawn časovačů.

Kameny a poklady.

Stav Fog of War.

Inventář a ekonomiku.

Postavené budovy.

Herní den a čas.

Všechny ostatní stávající herní systémy.

Při Load Game:

Nepřecházej znovu do New Game Setup.

Nevytvářej novou mapu ani počáteční objekty.

Nenásob opakovaně HP a DPS.

Nepřidávej znovu počáteční Gold.

Nevytvářej znovu Starting Castle.

Obnov časovače a skutečný herní stav.

Pokud starší save neobsahuje nové parametry, doplň bezpečné výchozí hodnoty. Zachovej ale skutečný počet objektů, již uložené statistiky, inventář a existující stav hry.

Zajisti kompatibilitu starších save verzí a aktualizuj saveVersion podle existujícího verzovacího systému.

14. Architektura

Vytvoř nebo rozšiř:

GameSettingsManager

NewGameSetupUI

WorldGenerationConfig

DifficultyModifiers

WildlifeRespawnSystem

Použij existující architekturu, pokud už podobné systémy existují.

Odděl:

Konfiguraci nové hry.

Generování světa.

Aktuální herní stav.

Uživatelské nastavení během hry.

Serializaci Save/Load.

Všechna nastavení validuj, aby neplatné hodnoty nemohly způsobit pád hry.

15. Testování

Před úpravami vytvoř Git commit aktuální funkční verze.

Ověř:

New Game otevírá Game Setup.

Basic a Advanced Settings fungují.

Reset to Defaults obnoví správné hodnoty.

Obtížnost správně upravuje bojové statistiky.

Wildlife Population generuje správné množství zvířat.

Treasure Count podporuje 0–10 truhel.

Initial Stones podporuje 0–100 kamenů.

Fog of War je při výchozím nastavení zapnutý.

Starting Castle funguje a neúčtuje stavební materiál.

Day Length správně ovlivňuje denní produkci a mzdy.

Wildlife Respawn respektuje intervaly a populační limity.

Starting Gold nastavuje správné množství zlata.

Save/Load zachovává konfiguraci a skutečný stav světa.

Starší uložené hry zůstávají načitatelné.

Nová hra nikdy automaticky nepřepisuje existující save.

Stávající herní mechaniky zůstávají funkční.

Pokud je to možné, doplň automatizované testy konfigurace a Save/Load.

Na závěr vytvoř Git commit a ověř funkční build.

Prioritou je spolehlivá parametrizace nové hry, nikoliv předělávání stávajících herních mechanik."