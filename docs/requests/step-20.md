krok 20	"Medieval Kingdom – Versioning System & In-Game Changelog

Rozšiř stávající projekt Medieval Kingdom o centrální verzovací systém, historii aktualizací a nový Changelog v hlavním menu.

Cílem je mít profesionální systém podobný běžným indie hrám, ve kterém bude každá vydaná verze evidovaná a hráči si budou moci jednoduše prohlédnout, co se změnilo.

Nezakládej nový projekt. Nejdříve analyzuj aktuální strukturu projektu, hlavní menu, build proces, package.json, Git historii a způsob nasazení na GitHub Pages.

Zachovej současné mechaniky hry, grafický styl i Save/Load.

1. Centrální verzování

Používej Semantic Versioning:

MAJOR.MINOR.PATCH

Příklad: 0.4.2

Význam:

MAJOR: velké změny nebo zásadní přechod na novou generaci hry.

MINOR: nové herní mechaniky, budovy, systémy nebo významné funkce.

PATCH: opravy chyb, optimalizace a drobná vylepšení.

Během alpha vývoje používej řadu 0.x.x.

První stabilní veřejná verze bude 1.0.0, až bude hra dostatečně dokončená a otestovaná.

Nezvyšuj verzi automaticky při každém commitu.

Pokud projekt již má existující verzi, zachovej ji a navazuj na ni.

Pokud zatím žádný verzovací systém nemá, inicializuj verzi 0.1.0.

2. Jeden zdroj pravdy

Verze hry musí být definovaná pouze na jednom místě.

Pokud projekt používá package.json, použij jeho pole:

""version"": ""0.1.0""

Všechny části aplikace musí používat stejnou hodnotu.

Nevkládej kopie čísla verze natvrdo do:

Main Menu

Settings

Changelog

HTML stránky

Dalších UI komponent

Pokud současný build systém neumožňuje jednoduché předávání verze, vytvoř kompatibilní build-time řešení.

Číslo verze se nesmí při build procesu svévolně měnit.

3. Zobrazení verze v hlavním menu

V hlavním menu musí být vždy uveden název a aktuální verze hry.

Příklad:

MEDIEVAL KINGDOM
v0.4.0

Verzi zobraz přímo pod názvem hry menším písmem, vizuálně však musí tvořit součást nadpisu.

Zachovej stávající styl menu.

Při každém novém vydání se číslo verze automaticky aktualizuje bez ruční úpravy hlavního menu.

Verzi zobraz také ve spodní části Settings nebo About, pokud taková obrazovka existuje.

4. Nová položka Changelog

Do hlavního menu přidej tlačítko:

Changelog

Doporučené pořadí:

New Game

Load Game

Changelog

Settings

Po kliknutí otevři samostatnou obrazovku nebo modal s historií vydaných verzí.

Changelog musí být vizuálně sladěný se středověkým grafickým stylem hry.

Požadavky:

Nejnovější verze nahoře.

Starší verze pod ní.

U každé verze zobraz datum vydání.

Přehledné rozdělení změn do kategorií.

Scrollování při větším množství aktualizací.

Tlačítko Back pro návrat do hlavního menu.

Podpora Escape.

Rozumné zobrazení na menších displejích.

Changelog nesmí bránit spuštění nové hry ani načtení uložené pozice.

5. Struktura changelogu

Zaveď standardní soubor:

CHANGELOG.md

Používej principy Keep a Changelog.

Každá vydaná verze obsahuje:

Číslo verze.

Datum vydání ve formátu YYYY-MM-DD.

Přehled změn podle kategorií.

Kategorie:

Added
Nové funkce, mechaniky a budovy.

Changed
Úpravy existujících herních systémů.

Improved
Zlepšení grafiky, ovládání, AI nebo výkonu.

Fixed
Opravené chyby.

Balance
Úpravy herních hodnot, cen a obtížnosti.

Removed
Odstraněné funkce, pokud nějaké existují.

Zobrazuj pouze kategorie, které obsahují změny.

Changelog musí obsahovat skutečné změny dané verze, nikoliv plány nebo funkce, které ještě nebyly implementované.

6. Zdroj changelogu pro hru

Soubor CHANGELOG.md bude hlavním zdrojem historie změn.

Vytvoř jednoduchý build-time generátor, který z něj vytvoří strukturovaná data pro zobrazení ve hře.

Například:

src/generated/changelog.json

Tento soubor bude automaticky generovaný, nikoliv druhý ručně udržovaný seznam změn.

Generátor musí:

Načíst CHANGELOG.md.

Rozpoznat jednotlivé vydané verze.

Načíst jejich data vydání.

Rozdělit změny do kategorií.

Seřadit vydání od nejnovějšího.

Připravit data pro Changelog UI.

Changelog se musí načítat přímo z distribuovaných souborů hry.

Není potřeba externí API, databáze ani server.

Musí fungovat při běžném nasazení na GitHub Pages.

Pokud stávající architektura vyžaduje jiné řešení, zvol jednodušší kompatibilní variantu, ale zachovej jeden autoritativní zdroj historie.

7. Validace verzí

Přidej automatické kontroly.

Při buildu nebo samostatném validačním příkazu ověř:

Verze má platný formát.

Aktuální vydaná verze existuje v CHANGELOG.md.

Verze v package.json odpovídá aktuálnímu vydání.

Stejné číslo verze se nevyskytuje dvakrát.

Datum vydání má správný formát.

Historie je seřazená sestupně.

Changelog neobsahuje prázdné vydání.

Případné chyby mají být jasně popsány.

Nevytvářej neplatnou nebo prázdnou historii jen proto, aby kontrola prošla.

8. Proces vydání nové verze

Připrav jednoduchý workflow pro budoucí aktualizace hry.

Při běžném vývoji:

Nové změny zapisuj do sekce Unreleased v CHANGELOG.md.

Dokud není vydaná nová verze, hlavní menu stále zobrazuje poslední vydanou verzi.

Sekci Unreleased nezobrazuj běžným hráčům.

Při vydání nové verze:

Urči typ aktualizace – major, minor nebo patch.

Zvyš verzi na správné nové číslo.

Přesuň dokončené změny z Unreleased pod novou verzi.

Přidej skutečné datum vydání.

Aktualizuj package.json a příslušný lockfile, pokud existuje.

Vygeneruj aktuální changelog pro UI.

Spusť automatické kontroly a build.

Připrav Git commit a odpovídající tag, například v0.4.0, podle aktuálního Git workflow.

Pokud je vhodné vytvořit jednoduchý release script, implementuj ho.

Vydání nové verze nesmí vyžadovat ruční změny více nezávislých verzovacích konstant.

Neprováděj automatické veřejné vydání nebo Git push bez výslovného zadání v rámci daného release workflow.

9. Automatická pomoc při zápisu změn

Připrav jednoduchá pravidla pro práci Codexu na tomto projektu.

Když Codex dokončí novou funkci nebo opraví chybu:

Zapíše stručný a srozumitelný popis skutečně dokončené změny do sekce Unreleased.

Nevytváří samostatnou vydanou verzi, pokud o to vývojář nepožádal.

Při opravě chyby uvede, co bylo opraveno.

Při přidání funkce uvede, co nového může hráč dělat.

Nezapisuje neověřené nebo nedokončené funkce jako hotové.

Přidej tato pravidla do existujícího AGENTS.md, pokud jej projekt používá. Pokud neexistuje a dává to pro Codex smysl, vytvoř krátký AGENTS.md s pravidly pro verzování a changelog.

Nezkoušej automaticky odhadovat hráčsky významné změny pouze podle počtu commitů nebo změněných řádků kódu.

10. Přehledný herní Changelog

Příklad vizuální struktury:

CHANGELOG

v0.4.0 – YYYY-MM-DD

ADDED

New trading marketplace.

Merchant caravans can visit your kingdom.

Resources can be bought and sold.

IMPROVED

Improved NPC pathfinding.

Improved warehouse resource handling.

FIXED

Fixed resource duplication when loading a save.

v0.3.1 – YYYY-MM-DD

FIXED

Fixed villagers getting stuck near buildings.

Tento text je pouze ukázka formátu. Nepovažuj uvedené funkce za skutečně dokončené a nepřidávej je automaticky do historie.

Zápisy piš primárně anglicky, stručně a srozumitelně pro hráče.

Strukturu připrav tak, aby později umožňovala českou lokalizaci.

11. Nová verze – indikátor

Pokud hráč spustí novější verzi hry, kterou ještě neviděl, zobraz u položky Changelog malé označení:

NEW

Poslední zobrazenou verzi eviduj lokálně například v localStorage.

Po otevření Changelogu označení NEW zmizí.

Při prvním spuštění hry bez historie prohlížení nemusí být NEW automaticky aktivní.

Tato funkcionalita nesmí ovlivňovat Save/Load ani ukládání rozehrané hry.

12. Oddělení verze hry a verze uložených pozic

Velmi důležité:

Verze hry a verze struktury uložených dat jsou dvě odlišné věci.

Například:

Game Version: 0.4.0

Save Schema Version: 3

Zachovej nebo zaveď samostatný Save Schema Version.

Nezvyšuj automaticky verzi save schématu při každé aktualizaci hry.

Save Schema Version se změní pouze tehdy, pokud se skutečně změní struktura uložených dat a je potřeba migrace.

Nové verzování nesmí poškodit existující uložené hry.

13. Nasazení na GitHub Pages

Zachovej aktuální způsob sestavení a nasazení.

Ověř, že:

Verze se správně zobrazuje v produkčním buildu.

Changelog funguje na GitHub Pages.

Otevření Changelogu nevyžaduje backend.

Správně fungují relativní cesty k assetům.

Po nasazení nové verze není vidět starý changelog kvůli nesprávné cache.

Verze v menu vždy odpovídá nasazenému buildu.

Nepřidávej zbytečné externí závislosti.

14. Inicializace dosavadní historie

Nejprve zkontroluj Git historii projektu.

Pokud lze spolehlivě určit dřívější vydané verze a jejich změny, použij je.

Pokud žádná historie verzí neexistuje:

Vytvoř první aktuální alpha verzi.

Přidej jediný pravdivý výchozí záznam.

Uveď hlavní funkce, které ve hře skutečně fungují.

Nevymýšlej zpětně neexistující verze.

Nevydávej navržené, ale neimplementované funkce za hotové.

Datum vydání musí odpovídat skutečnému dni vydání.

15. Testování

Ověř následující scénáře:

Aktuální verze se zobrazuje pod názvem Medieval Kingdom.

Číslo verze pochází z jediného zdroje.

V hlavním menu existuje Changelog.

Po kliknutí se otevře historie změn.

Nejnovější verze je nahoře.

Každá verze má správné datum a změny.

Changelog lze scrollovat.

Tlačítko Back vrací do hlavního menu.

Escape funguje.

Po otevření Changelogu zmizí indikátor NEW.

Aktualizace verze správně aktualizuje název hry.

Release script, pokud existuje, správně pracuje s MAJOR.MINOR.PATCH.

Validace odhalí neshodu verzí.

Staré save soubory fungují.

Produkční build funguje na GitHub Pages.

Po dokončení vytvoř Git commit a stručně popiš:

Jaká je aktuální verze hry.

Kde se spravují změny.

Jak se vydá nová verze.

Jak Codex zapisuje změny do Unreleased.

Jak probíhá automatická validace.

Prioritou je jednoduchý, dlouhodobě udržitelný systém, který nebude vyžadovat ruční aktualizaci verzí na více místech."