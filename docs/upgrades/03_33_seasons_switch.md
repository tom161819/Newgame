# ETAPA 03/15 – původní krok 33: Seasons ON/OFF

**Milník:** M1. **Důležitá úprava:** Při OFF efektivně trvalé léto a zachování původní sezóny v paměti, ne zpětné dohnání sezón.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Seasons ON/OFF

Rozšiř stávající systém ročních období o možnost jejich zapnutí a vypnutí při zakládání nové hry i během hraní.

Nezakládej nový projekt. Nejprve analyzuj existující Seasons System, Weather System, Game Time, New Game Setup, levý Settings panel, zemědělství, růst stromů a Save/Load.

Zachovej všechny existující funkce.

1. Nastavení při nové hře

Do New Game Setup, v sekci Advanced Settings, přidej:

Seasons: ON / OFF

Výchozí hodnota: ON.

ON – standardní střídání jara, léta, podzimu a zimy.

OFF – trvalé léto bez střídání ročních období.

Nastavení musí být součástí konfigurace nové hry.

2. Přepínač během hraní

Do existujícího levého Settings panelu přidej zaškrtávací přepínač:

Seasons: ON / OFF

Přepínač musí fungovat okamžitě, bez restartování hry.

Změnu ukládej do aktuální uložené hry.

Nevytvářej druhý nezávislý systém ročních období.

3. Chování při vypnutí

Když hráč vypne Seasons:

Aktuální roční období a postup v něm se uloží do paměti.

Aktivní roční období pro herní mechaniky se nastaví na Summer.

Přestane se počítat přechod mezi ročními obdobími.

Obilí a další plodiny rostou podle letních pravidel.

Ovocné sady mohou produkovat ovoce celoročně.

Stromy rostou podle letních pravidel.

Zimní omezení produkce přestanou platit.

Zimní grafika se změní na letní.

Game Time a střídání jednotlivých dnů pokračuje normálně.

Pokud existují systémy závislé na aktuální sezóně, musí používat efektivní sezónu Summer.

Weather System zůstává funkční, pokud je samostatně implementovaný. Roční období OFF nesmí vypnout samotné počasí.

Při vypnutých sezónách používej letní pravděpodobnosti jednotlivých typů počasí.

4. Opětovné zapnutí

Pokud hráč znovu zapne Seasons:

Obnov poslední skutečné roční období.

Obnov jeho uložený průběh.

Pokračuj ve střídání sezón od místa, kde byly vypnuty.

Aktualizuj grafiku, růst plodin a další sezónní modifikátory.

Příklad:

Hráč vypne Seasons ve třetím dni podzimu.

Následujících deset herních dnů hraje s trvalým létem.

Po opětovném zapnutí se obnoví třetí den podzimu a sezónní cyklus pokračuje dál.

Vypnutí nesmí způsobit přeskočení několika sezón při opětovném zapnutí.

Rozpracovaný biologický růst rostlin a stromů zachovej. Neprováděj opakované sklizně ani okamžité resetování růstových fází.

5. Uživatelské rozhraní

Pokud je Seasons ON, zobraz aktuální roční období standardním způsobem.

Pokud je Seasons OFF, zobraz například:

Summer (Seasons OFF)

Při najetí na přepínač zobraz tooltip:

Disable seasonal changes and keep permanent summer. Game days continue normally.

6. Save / Load

Ukládej:

Seasons Enabled.

Poslední skutečné roční období.

Postup v aktuálním ročním období.

Efektivní sezónu používanou herní simulací.

Po načtení se musí obnovit správný stav.

Starší uložené hry bez tohoto nastavení používej s výchozí hodnotou Seasons ON.

Neprováděj při Load Game nové inicializování sezónního cyklu.

7. Background Simulation

Pokud je implementované Run in Background:

Při Seasons OFF nesmí během simulace na pozadí docházet ke změně ročního období.

Růst plodin a stromů musí používat letní modifikátory.

Při Seasons ON musí sezónní cyklus normálně pokračovat.

Po návratu do hry nesmí dojít k duplicitním přechodům sezón.

8. Testování

Ověř:

V New Game Setup existuje Seasons ON/OFF.

Výchozí hodnota je ON.

Přepínač existuje také v levém Settings panelu.

Seasons OFF nastaví trvalé léto.

Herní dny normálně pokračují.

Obilí a ovocné sady produkují i během trvalého léta.

Stromy rostou podle letních pravidel.

Po opětovném zapnutí se obnoví původní sezónní cyklus.

Přepnutí během zimy správně změní grafiku.

Save/Load zachová nastavení a rozpracovaný cyklus.

Background Simulation respektuje nastavení.

Nedochází k duplicitní produkci nebo sklizni.

9. Implementace

Použij jeden centrální zdroj nastavení Seasons.

Nevytvářej duplicitní přepínače se samostatným stavem.

Před úpravami vytvoř bezpečný Git commit.

Po implementaci spusť testy a ověř funkční build.

Zapiš dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

