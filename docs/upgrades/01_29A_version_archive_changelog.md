# ETAPA 01/15 – původní krok 29A: Version Archive, Changelog & Release Foundation

**Milník:** M1. **Důležitá úprava:** Připrav současně proveditelný release proces pro M1–M5. Nezvyšuj číslo jen kvůli této etapě.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Version Archive, Historical Changelog & Background Simulation

Rozšiř projekt o udržitelné Semantic Versioning, skutečný archiv funkčních historických sestavení a changelog. Volitelný běh simulace na pozadí zde ještě NEIMPLEMENTUJ; je to samostatná poslední etapa 29B.

Nezakládej nový projekt. Nejdříve analyzuj aktuální Git historii, existující archiv verzí, hlavní menu, Changelog, Game Time, Phaser lifecycle, Save/Load a aktuální způsob nasazení na GitHub Pages.

Zachovej stávající funkce hry a aktuální systém verzování.

ČÁST A – ARCHIV VERZÍ

1. Číslování archivovaných verzí

Vytvoř konzistentní číslování všech existujících archivovaných verzí hry.

Použij Semantic Versioning:

MAJOR.MINOR.PATCH

Příklad:

v0.1.0 – první archivovaná funkční alpha

v0.2.0 – další významný vývojový milník

v0.2.1 – opravná aktualizace

v0.3.0 – další významné rozšíření

To jsou pouze příklady, nikoliv skutečná historie projektu.

Základní pravidla:

Zachovej již existující oficiálně přidělené verze.

Starším archivovaným sestavením, které číslo nemají, přiděl zpětně jednoznačné archivní označení podle skutečné chronologie a rozsahu změn.

Rozlišuj zpětně přiřazené archivní označení od původního oficiálního vydání.

Nevymýšlej neexistující sestavení ani datum vydání.

Nepovažuj automaticky každý Git commit za samostatnou verzi.

Nejnovější aktuální verze musí mít jednoznačné označení a nesmí kolidovat s archivem.

Neupravuj historické commity ani Git historii pouze kvůli číslování.

Pokud už existuje archiv sestavení na samostatných URL, zachovej jeho funkčnost.

2. Centrální katalog verzí

Vytvoř jeden autoritativní katalog archivovaných verzí.

Každá položka obsahuje:

Version

Title

Date

Git Commit Hash

Archive URL

Short Description

Release Type

Historical/Reconstructed label, pokud bylo číslo přiděleno zpětně

Katalog může být JSON nebo jiná vhodná struktura.

Zajisti, aby archiv, hlavní menu a Changelog používaly konzistentní údaje.

Nedovol duplicitní čísla verzí ani odkazy na neexistující archivy.

Pokud starý build nemá dostupný spustitelný archiv, označ ho jako nedostupný a neuváděj nefunkční tlačítko Play.

3. Přehled archivu v hlavním menu

Pokud v hlavním menu již existuje položka Version Archive, uprav ji.

Jinak vytvoř položku:

Version Archive

Po otevření zobraz všechny dostupné historické verze.

Příklad:

VERSION ARCHIVE

v0.4.0 – Current Version
v0.3.0 – Previous Update
v0.2.1 – Bug Fixes
v0.2.0 – Feature Update
v0.1.0 – Initial Alpha

Záznamy jsou pouze ukázka.

Každý záznam má:

Číslo verze.

Datum sestavení nebo vydání, pokud je ověřené.

Krátký popis.

Tlačítko Play, pokud existuje hratelný archiv.

Tlačítko Changelog nebo View Changes.

Při spuštění archivované verze se musí spustit skutečný historický build, nikoliv aktuální hra s jiným číslem verze.

Zachovej původní funkční URL archivů. Pokud je potřeba zavést nové stabilní URL, zajisti kompatibilitu se starými odkazy.

Starší verze nesmějí přepisovat uložené pozice aktuální hry nekompatibilními daty. Použij oddělení uložených dat podle verzí nebo kompatibilního save schématu.

ČÁST B – HISTORICKÝ CHANGELOG

4. Rekonstrukce historie změn

Prozkoumej Git historii a skutečně dostupné archivované buildy.

Pro každou identifikovanou verzi zjisti:

Jaké funkce přibyly.

Jaké mechaniky se změnily.

Jaké chyby byly opraveny.

Jak se změnilo ovládání nebo grafika.

Jaké optimalizace byly provedeny.

Porovnávej odpovídající commity nebo archivovaná sestavení.

Nespoléhej pouze na názvy commitů, pokud nejsou dostatečně konkrétní.

Nedoplňuj mechaniky, které jsou pouze plánované, ale v dané verzi skutečně nebyly implementované.

Pokud nelze přesně zjistit nějakou změnu, neodhaduj ji.

5. Doplnění CHANGELOG.md

Aktualizuj existující CHANGELOG.md.

Každá vydaná nebo zpětně katalogizovaná verze musí mít vlastní stručný záznam.

Použij kategorie:

Added

Changed

Improved

Fixed

Balance

Removed

Zobrazuj pouze použité kategorie.

Každý záznam má být stručný a orientovaný na hráče.

Příklad formátu:

v0.X.0 – YYYY-MM-DD

Added

New building system.

Collectible natural resources.

Improved character movement.

Changed

Updated world generation.

Fixed

Fixed incorrect collision detection.

Tento příklad nepovažuj za skutečný záznam.

U zpětně označených archivů eviduj skutečné datum původního commitu/sestavení, nikoliv dnešní datum, pokud je dohledatelné.

Historické změny piš anglicky.

Udržuj existující sekci Unreleased.

6. Changelog ve hře

Uprav obrazovku Changelog v hlavním menu.

Každá verze musí mít:

Číslo verze.

Datum.

Stručný seznam změn.

Možnost rozbalení a sbalení.

Odkaz na odpovídající archiv, pokud existuje.

Nejnovější verze bude nahoře.

Historické záznamy se zobrazují ze stejného autoritativního zdroje jako CHANGELOG.md nebo z dat automaticky generovaných při buildu.

Nevytvářej dva nezávisle ručně udržované seznamy.

7. Propojení archivu a Changelogu

Z obrazovky Version Archive musí být možné otevřít změny příslušné verze.

Z Changelogu musí být možné přejít ke spustitelnému archivu příslušné verze.

Aktuální verze zobrazí informaci:

Current Version

U starší verze:

Archived Version

V každém archivovaném buildu ponech označení jeho skutečné historické verze, nikoliv aktuální číslo hlavní hry.

## Rozšíření etapy 29A – Automatické ověřování a proces vydání

- Zjisti skutečné aktuální číslo verze a aktuální release workflow. Pokud neexistují, navrhni jednotný zdroj čísla a aktualizaci UI bez přepisování historických commitů.
- Přidej `docs/UPGRADE_PROGRESS.md` a `docs/RELEASE_CHECKLIST.md` včetně stavu 15 etap. Umožni automaticky přecházet na další etapy při splněném release/test gate a bezpečně navázat po technickém přerušení bez opakování hotových kroků.
- Zachovej oddělené `GameVersion` a `SaveSchemaVersion`; každá migrace save může zvýšit SaveSchemaVersion bez veřejného release.
- Pro reprodukovatelný build ověř dostupné `package.json` scripts, `npm ci`/odpovídající instalaci, testy, build. Doplň rozumné regression/smoke scénáře z herního projektu (bez falešných green checks).
- Každá menší etapa: commit + Unreleased, nikoliv nové číslo. Vydání jen po úspěšném kompletním milníku M1–M5 s MINOR incrementem v řadě 0.x, případně PATCH pro samostatnou hotfix opravu.
- Release gate kontroluje konzistenci čísla v package/metadatech/UI, validní changelog, kompatibilitu Save/Load, funkční hratelný archiv odpovídající přesnému commit SHA, Git tag, skutečný nasazený build. Bez potřebných oprávnění pouze připrav release a explicitně nahlas, že jej nelze publikovat.
- Existující historická čísla, buildy a odkazy neměň; nevytvářej fiktivní historiografii ze stavu plánovaných funkcí.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

