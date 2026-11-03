# ETAPA 15/15 – původní krok 29B: Background Simulation & Catch-up

**Milník:** M5. **Důležitá úprava:** Žádná falešná plynulá simulace v background tab. Visibility API + bezpečný catch-up max 15 min, validovaný against foreground se stejným seedem.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Background Simulation & Catch-up (samostatná závěrečná etapa 29B)

Tato etapa se provádí až po dokončení obchodování, přepravy, potřeb poddaných a všech ekonomických systémů. Použij již vytvořenou Release Foundation (29A), ekonomický Resource Transaction Ledger (31B), Fog of War (28), počasí/sezóny, pracovní AI a všechny systémy z dalších etap.

8. Nový přepínač v levém panelu

Do existujícího levého Settings panelu přidej:

Run in Background: ON / OFF

Výchozí hodnota:

OFF

Pod přepínač přidej krátký tooltip:

Continue game simulation when the browser tab is inactive.

Přepínač musí být funkční i během rozehrané hry.

Jeho změna se projeví okamžitě.

Nastavení ukládej a obnovuj při dalším spuštění nebo načtení hry, konzistentně se stávajícím systémem nastavení.

9. Chování při vypnutém režimu

Pokud je Run in Background = OFF:

Přepnutí na jinou kartu pozastaví herní simulaci.

Herní čas nepostupuje.

NPC nevykonávají práci.

Neprobíhá produkce.

Nespotřebovává se jídlo.

Neprobíhají stavební práce.

Karavany neodjíždějí.

Neběží herní časovače.

Po návratu hra pokračuje tam, kde skončila.

Zachovej explicitní pauzu hráče a chování hlavního menu.

10. Chování při zapnutém režimu

Pokud je Run in Background = ON:

Herní svět má pokračovat podle skutečně uplynulého času také při přepnutí prohlížeče na jinou kartu nebo minimalizaci okna.

DŮLEŽITÉ TECHNICKÉ OMEZENÍ:

Moderní prohlížeče pozastavují requestAnimationFrame a omezují časovače skrytých karet.

Není možné zaručit, že Phaser bude skutečně nepřetržitě vykonávat aktualizační smyčku v neaktivní kartě.

Proto implementuj spolehlivý systém Background Simulation + Catch-up.

Neslibuj nepřetržitý běh tam, kde jej prohlížeč nepovoluje.

Při návratu do hry dopočítej chybějící herní čas bezpečně a konzistentně.

11. Detekce neaktivní karty

Použij standardní Page Visibility API.

Sleduj:

document.visibilityState

visibilitychange

Zohledni také existující Phaser lifecycle události.

Rozlišuj:

Viditelnou, ale nezaměřenou kartu nebo okno.

Skrytou kartu.

Skutečnou pauzu vyvolanou hráčem.

Hlavní menu.

Game Over.

Neaktivní karta nesmí automaticky způsobit restart scény nebo ztrátu herního stavu.

Při přepnutí do skrytého režimu ulož časový checkpoint.

12. Centrální Background Simulation Manager

Vytvoř centrální systém, například:

BackgroundSimulationManager

Jeho úkoly:

Evidovat nastavení ON/OFF.

Zaznamenat okamžik přechodu na neaktivní kartu.

Evidovat již zpracovaný simulační čas.

Při návratu vypočítat skutečně nezpracovaný čas.

Provést bezpečný catch-up.

Aktualizovat herní svět.

Pokračovat v normální simulaci.

Nepřidávej samostatné nezávislé časovače do jednotlivých budov nebo profesí.

Používej existující centrální Game Time System.

Nevytvářej druhý herní čas.

13. Výpočet uplynulého času

Příklad:

Délka herního dne: 120 sekund.

Hráč zapne Run in Background.

Přepne na kartu Codex.

Po 300 sekundách se vrátí.

Hra musí správně zpracovat ekvivalent 2,5 herního dne.

Zohledni:

Produkci surovin.

Růst obilí a stromů.

Těžbu.

Stavění.

Spotřebu potravin.

Odpočinek obyvatel.

Mzdy.

Příjem zlata z hradu.

Obchodní karavany.

Průběh práce NPC.

Další existující herní systémy založené na čase.

Neprováděj pouze mechanické přičtení 300 sekund ke Game Time, pokud by tím došlo k přeskočení důležitých událostí.

14. Simulace NPC na pozadí

Zachovej konzistentní průběh práce poddaných.

Příklad:

Horník:

Dojde ke kameni.

Vytěží jej.

Odnese náklad do skladu.

Vyloží jej.

Pokračuje dalším úkolem.

Pokud během neaktivní karty uběhne dostatek času, systém musí odpovídající práce zpracovat ve správném pořadí.

Nesmí dojít k:

Teleportaci surovin bez odpovídajícího průběhu práce.

Zdvojení těžených surovin.

Nekonečné produkci.

Ignorování skladových limitů.

Přeskakování spotřeby jídla.

Duplicitním výplatám.

Nesprávným přepravním rezervacím.

Používej autoritativní logiku stejné herní simulace, nikoliv odlišné zjednodušené vzorce, které by dávaly jiné výsledky.

Tam, kde to dává smysl, můžeš zpracovávat čas ve větších intervalech. Činnosti závislé na pořadí událostí, pohybu a kolizích ale musí být zpracovány bezpečně.

15. Výkon při návratu do hry

Catch-up nesmí na dlouhou dobu zablokovat prohlížeč.

Použij:

Oddělený simulační a renderovací cyklus.

Časové kroky nebo event-driven simulaci.

Dávkové zpracování.

Omezení výpočetního času na jeden snímek.

Průběžné aktualizace stavu.

Nevykresluj každý mezikrok.

Pokud je nutné simulovat dlouhé období, zpracuj jej po dávkách a zobraz například:

Updating kingdom...

Po dokončení obnov normální vykreslování.

Pro první verzi nastav bezpečný limit automaticky dopočítávané nepřítomnosti například na 15 minut reálného času.

Pokud je nepřítomnost delší, jasně informuj hráče o tom, kolik času bylo skutečně simulováno a kolik nebylo. Nikdy tiše nepředstírej, že proběhla celá nepřítomnost.

Limit musí být centrálně konfigurovatelný.

16. Synchronizace času

Zajisti, že se nezapočítá stejný čas dvakrát.

Ošetři zejména:

Opakované visibilitychange události.

Velmi rychlé přepínání karet.

Přerušení nebo restart catch-up.

Ruční pauzu během simulace.

Uložení a načtení hry.

Obnovení prohlížeče.

Změnu systémového času.

Probuzení počítače z režimu spánku.

Při normálním načtení uložené pozice nespouštěj offline simulaci za dobu, kdy byla hra zcela zavřená.

Run in Background se má vztahovat k otevřené herní relaci, ne k libovolně dlouhému období mezi spuštěními.

Výjimku můžeš připravit do budoucna jako samostatný Offline Progress System, ale nyní ji neimplementuj.

17. Bezpečnost herního stavu

Při simulaci na pozadí musí fungovat:

Death / Game Over.

Nedostatek potravin.

Stávky a emigrace obyvatel.

Vyčerpání ložisek.

Dokončení budov.

Změny ročních období.

Příjezdy a odjezdy obchodníků.

Pokud král během běhu na pozadí zemře, hra musí správně přejít do Game Over.

Nesmí se pokračovat ve výrobě a ekonomice po skončení hry, pokud to neodpovídá běžným pravidlům.

Po návratu zobraz důležité události, které nastaly během nepřítomnosti.

18. Background Summary

Po návratu na kartu můžeš zobrazit stručný souhrn, pokud uplynul alespoň jeden herní den.

Například:

WHILE YOU WERE AWAY

Time elapsed: 3 game days

+45 Wood
+28 Stone
+60 Bread
-35 Food consumed
+15 Gold

2 Buildings completed
1 New villager arrived

Continue

Údaje musejí pocházet ze skutečných změn v herním stavu.

Nesestavuj je odhadem.

Pokud už hra obsahuje systém notifikací, integruj souhrn do něj.

Souhrn musí být možné zavřít a pokračovat ve hře.

19. Interakce s Fog of War

Simulace na pozadí nesmí automaticky odhalit celou mapu.

Zachovej:

Circular View Range.

Exploration Mode.

Explored Map Memory.

Poslední známý stav statických objektů.

Pokud jednotka během simulace skutečně prochází oblastí a je oprávněným zdrojem vidění, může ji standardně prozkoumat.

Pokud zdroj vidění oblast neviděl, nesmí být odhalena.

Při návratu aktualizuj Fog of War podle skutečného stavu.

20. Ukládání nastavení

Nastavení Run in Background musí být zachováno.

Použij současný Settings Manager a Save/Load.

Nevytvářej nový nezávislý systém nastavení.

Pokud existují globální a per-save nastavení, dodrž jejich dosavadní pravidla.

Zajisti, že u starších uložených her bude výchozí hodnota OFF.

21. Testování Background Simulation

Přidej automatické testy alespoň pro:

OFF – po přepnutí karty se simulační čas nezmění.

ON – po 60 sekundách v neaktivní kartě proběhne odpovídající postup simulace.

ON – po 300 sekundách se správně dopočítá herní čas.

Produkce se nezapočítá duplicitně.

Spotřeba jídla se provede správně.

Pracovníci respektují pracovní úkoly a přepravu.

Skladové kapacity zůstávají platné.

Stavba nemůže být dokončena bez materiálu.

Migrace obyvatel funguje.

Úmrtí krále správně ukončí hru.

Fog of War neodhalí neprozkoumané oblasti.

Save/Load nezapočítává čas dvakrát.

Opakované přepínání karet nezpůsobí chybu.

Dlouhý catch-up nezablokuje uživatelské rozhraní.

Po návratu se korektně obnoví normální běh Phaseru.

Dále vytvoř srovnávací test:

Spusť dvě identické hry se stejným seedem a stejnými počátečními podmínkami.

Jednu simuluj 5 minut v popředí a druhou pomocí Background Catch-up.

Výsledné ekonomické zásoby, herní čas, pracovní úkoly a jiné deterministické stavy musí být shodné nebo musí být odchylky konkrétně vysvětlené a odstraněné.

## Postup a kontrola

Proveď v samostatných malých commitech: (1) Page Visibility + pause/catchup čas, (2) propojení s jedním autoritativním simulačním cyklem, (3) NPC a logistika, (4) obchod, příroda, denní účetnictví, FoW a Save/Load, (5) integrační testy stejného seedu foreground versus catch-up. Doplň Unreleased, zkontroluj release gate M5 a pokud všechny testy projdou, proveď skutečný MINOR release. Důsledně zachovej limit 15 minut a nepředstírej nepřetržitý běh skryté karty.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# POSLEDNÍ POKYN

Nyní při prvním zadání tohoto textu připrav roadmapu, progress a soubory `docs/upgrades/` s kompletními specifikacemi, ověř skutečný kód a zahaj etapu 01 / 29A. **Potom AUTOMATICKY pokračuj etapami 02–15 v definovaném pořadí, vždy až po ověření funkčnosti a commitu předchozí etapy.** Po dokončení milníků M1–M5 prováděj integrační testy, release gate a skutečné verzování pouze při úspěšné kontrole. **NEČEKEJ na příkaz „pokračuj“ a neptej se na potvrzení mezi etapami.** Pokud okolnosti znemožní další postup, zaznamenej přesný checkpoint, důvod blokace a konkrétní kroky k obnovení. Nezačínej všech 15 etap současně, nesnižuj rozsah požadavků jen proto, abys prohlásil plán za hotový, a nikdy nevydávej netestovanou verzi.
