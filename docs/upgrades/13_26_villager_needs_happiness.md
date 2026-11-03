# ETAPA 13/15 – původní krok 26: Villager Needs & Happiness

**Milník:** M4. **Důležitá úprava:** House má 5 obyvatel, ne staré 4. Rozšiř existující Population Sidebar místo vytváření duplicitního panelu.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade 4: Villager Needs, Happiness & Social Simulation

Rozšiř stávající izometrickou 2.5D strategickou hru ve Phaseru o systém individuálních potřeb obyvatel, spokojenosti, pracovní morálky, stávek a emigrace.

Hlavní cíl: Každý poddaný bude skutečnou postavou s vlastními potřebami. Musí mít přístup k jídlu, odpočinku, bydlení a bezpečí. Jeho životní podmínky ovlivňují efektivitu práce a ochotu zůstat v království.

Navazuj na existující systémy:

Population a Migration System

Individuální skilly a profese

Worker AI a Job System

Houses a Housing Capacity

Food System a Granary

Logistics System

Wages a Economy

Game Time a Seasons

Fog of War

Save/Load

Nezakládej nový projekt. Nejdříve ověř skutečnou implementaci těchto systémů a nevytvářej duplicitní mechaniky.

1. Individuální potřeby obyvatel

Každý trvalý poddaný má čtyři potřeby:

Food – nasycení (0–100)

Rest – odpočinek (0–100)

Housing – kvalita bydlení (0–100)

Safety – pocit bezpečí (0–100)

Přidej také:

Happiness – celková spokojenost (0–100)

Current Mood – aktuální stav nálady

Strike State – zda postava stávkuje

Assigned Home – ID přiděleného domu

Consecutive Unhappy Days – počet po sobě jdoucích dnů nespokojenosti

Každá postava musí mít vlastní hodnoty.

Král zatím nebude stávkovat ani opouštět království. Jeho HP a potravinové potřeby zachovej podle dosavadního systému.

Pocestní, kteří nejsou obyvateli království, nepoužívají plnou simulaci potřeb.

2. Potřeba jídla

Poddaní potřebují pravidelně jíst.

Zachovej stávající Food System a spotřebu jedné porce potravin na obyvatele za herní den.

Potraviny:

Meat

Bread

Apple

Wheat a Flour nelze přímo konzumovat.

Při dostupnosti jídla se potřeba Food udržuje na vysoké hodnotě.

Při nedostatku jídla začne postupně klesat.

Po úspěšném přidělení porce se Food zvýší.

Spotřebu řeš přes existující skladový systém a jeho rezervace.

Důležité: Nesmí existovat dva nezávislé systémy spotřeby jídla. Nová mechanika nasycení pouze navazuje na skutečně spotřebované porce.

Prozatím nemusí každý poddaný fyzicky navštěvovat sýpku. Individuální distribuci jídla lze doplnit později.

Pokud Food klesne pod 20:

Postava získá negativní vliv na Happiness.

Zobraz upozornění Hungry.

Nedostatek potravy může vést ke stávce nebo odchodu.

Zatím nepřidávej smrt hladem.

3. Odpočinek a denní režim

Implementuj skutečný denní režim poddaných.

Jeden herní den má standardně 120 sekund, ale respektuj délku dne nastavenou v Game Setup.

Rozděl herní den na:

Pracovní dobu.

Dobu odpočinku.

Výchozí návrh:

Práce a běžné činnosti: prvních 75 % herního dne.

Odpočinek: posledních 25 % dne.

Při práci klesá Rest.

Při odpočinku se Rest obnovuje.

Poddaný s přiděleným domem:

Ukončí pracovní úkol v okamžiku odpočinku.

Dojde ke svému domu.

Vstoupí do domu.

Odpočívá a obnovuje Rest.

Po skončení odpočinku vyjde z domu.

Vrátí se ke svému zaměstnání.

Postavy nesmějí teleportovat mezi domem a pracovištěm.

Pokud je postava velmi unavená, například Rest pod 20 %, může přerušit práci a odpočinout si dříve.

Zajisti správné pokračování pracovních úkolů po odpočinku a zachování rezervací bez duplicit.

V noci může být zobrazena jednoduchá tmavší atmosféra, ale není nutné vytvářet složité osvětlení.

4. Bydlení

Každý poddaný by měl mít přidělené bydlení.

Použij existující House:

Velikost 2×2

Kapacita 5 obyvatel (závazná změna z kroku 34)

Každý dům eviduje konkrétní ubytované obyvatele.

Po přistěhování:

Nový poddaný získá volné místo v dostupném domě.

Přiřazení musí být jednoznačné.

Jeden obyvatel nemůže být registrovaný ve více domech.

Pokud dům zanikne nebo ztratí funkčnost:

Jeho obyvatelé přijdou o bydlení.

Pokusí se získat místo v jiném dostupném domě.

Pokud žádné bydlení není, stanou se bezdomovci.

Housing:

Má přidělené dostupné bydlení: 100.

Nemá dostupné bydlení: 0.

Bezdomovci mohou odpočívat jen omezeně a obnovují Rest pomaleji.

Zatím nepřidávej různé úrovně kvality domů.

5. Bezpečnost

Každý poddaný bude mít vlastní pocit bezpečí podle okolí.

Zaveď jednoduchý Safety System.

Bezpečnost ovlivní:

Vzdálenost od dokončeného hradu.

Vzdálenost od dokončené obranné věže.

Přítomnost vlastních vojáků a hlídek.

Nedávné napadení postavy nebo jejího okolí.

Později skutečná přítomnost nepřátel.

Výchozí bezpečnost: 45 bodů.

Orientační bonusy:

V dosahu hradu: +25.

V dosahu obranné věže: +15.

V dosahu kasáren nebo hlídkující jednotky: +10.

Používej rozumné konfigurovatelné dosahy, například 10–15 políček.

Bezpečnost omez na 0–100.

Nedávný útok způsobí dočasné snížení Safety.

Bonusy z budov platí pouze pro dokončené stavby.

Nedokončené blueprinty bezpečnost nezvyšují.

V první verzi neimplementuj složité vyhodnocování uzavřeného opevnění. Hradby samy o sobě nemusí zvyšovat bezpečnost, pokud systém nedokáže ověřit skutečně chráněnou oblast.

6. Celková spokojenost

Vytvoř individuální Happiness.

Použij vážený výpočet:

Happiness =
Food × 0.35 +
Rest × 0.25 +
Housing × 0.25 +
Safety × 0.15

Výsledek zaokrouhli a omez na 0–100.

Stávající nevyplacené mzdy musí navíc snižovat Happiness pomocí samostatné penalizace.

Zamez dvojímu započtení stejné penalizace.

Výsledná spokojenost se automaticky aktualizuje podle skutečného stavu postavy.

7. Vliv spokojenosti na pracovní výkon

Nastav následující stavy:

70–100: Happy, pracovní efektivita ×1.10

40–69: Neutral, efektivita ×1.00

25–39: Unhappy, efektivita ×0.80

0–24: Critical, riziko stávky

Efektivitu kombinuj s existujícími bonusy skillů, talentů a pracovních budov.

Například:

FinalWorkSpeed =
BaseWorkSpeed × SkillEfficiency × HappinessModifier

Neovlivňuj přímo rychlost chůze, pokud to není výslovně určeno jiným systémem.

Spokojenost nesmí neúmyslně měnit bojové statistiky ani kvalitu vybavení.

8. Stávky poddaných

Pokud má poddaný Happiness pod 25 po dobu alespoň dvou celých herních dnů, přejde do stavu Strike.

Stávkující:

Přestane vykonávat svoji práci.

Nevytváří nové suroviny.

Nezískává pracovní XP.

Zachová si profesi a pracovní místo.

Může se pohybovat poblíž domu nebo osady.

Nad postavou se zobrazí jednoduchá ikona nespokojenosti.

Pokud se Happiness obnoví alespoň na 45, postava stávku ukončí a vrátí se do práce.

Pravidla mezd při stávce napoj na existující systém odměňování, aby se pracovní doba nepočítala duplicitně. Již vzniklé mzdové dluhy zachovej.

Zajisti správné uvolnění pracovních úkolů a přepravních rezervací při zahájení stávky.

9. Emigrace

Pokud Happiness zůstane pod 15 po dobu alespoň tří herních dnů, může se poddaný rozhodnout opustit království.

Postup:

Postava ukončí profesní úkol.

Uvolní pracovní místo.

Uvolní místo v domě.

Změní stav na Leaving Kingdom.

Vybere dostupnou trasu k okraji mapy.

Fyzicky opustí království.

Po dosažení okraje mapy se odstraní z aktivní populace.

Před odchodem zpracuj bezpečně všechny nesené suroviny a rezervace.

Pokud cestu nelze najít, NPC nesmí způsobovat nekonečné pathfinding výpočty. Použij bezpečný čekací stav a opakované hledání v omezených intervalech.

Zobraz oznámení:

A villager has left your kingdom due to poor living conditions.

Emigrace nesmí způsobovat duplicitní obyvatele ani zápornou populaci.

10. Spokojenost celého království

Přidej Kingdom Happiness.

Vypočítej ji jako průměr Happiness všech živých trvalých poddaných.

Pokud království zatím nemá žádné poddané, nepřidávej bonus ani penalizaci.

V horním rozhraní zobraz:

Population

Kingdom Happiness

Po kliknutí otevři detailní přehled.

11. Vliv na migraci

Napoj Kingdom Happiness na existující Kingdom Attractiveness System.

Spokojené království bude přitahovat více přistěhovalců.

Nespokojené království bude přitahovat méně lidí.

Výchozí pravidla:

Happiness 80–100: bonus k atraktivitě a vyšší šance usazení pocestných.

Happiness 50–79: neutrální stav.

Happiness 30–49: snížená atraktivita.

Happiness pod 30: výrazně snížená atraktivita.

Bonus nebo penalizace musí být součástí existujícího výpočtu atraktivity, ne druhý paralelní migrační systém.

Noví obyvatelé musí nadále fyzicky přicházet z okraje mapy.

Bez volného bydlení se nemohou usadit, ani při maximální spokojenosti.

12. Informační panel obyvatele

Rozšiř stávající panel postavy.

Zobraz:

Jméno

Profesi

Celkový level

HP

Food

Rest

Housing

Safety

Happiness

Current Mood

Assigned Home

Current Workplace

Salary / Unpaid Wages

Strike Status

Použij přehledné grafické ukazatele a tooltipy vysvětlující důvody nespokojenosti.

Příklad:

Radovan
Miner – Level 14

Food: 80 %
Rest: 25 %
Housing: 100 %
Safety: 70 %

Happiness: 65 %

Main problem: Low Rest

13. Přehled království

Rozšiř již existující pravý Population Sidebar o souhrn potřeb a spokojenosti; nevytvářej souběžný duplicitní panel Population & Happiness.

Zobraz:

Celkovou populaci.

Průměrnou spokojenost.

Počet hladových obyvatel.

Počet nevyspalých obyvatel.

Počet obyvatel bez bydlení.

Počet stávkujících.

Počet obyvatel ohrožených emigrací.

Umožni rozkliknout konkrétní postavu.

Přidej možnost seřadit obyvatele podle Happiness od nejnižší po nejvyšší.

14. AI a denní režim

Rozšiř existující Worker AI o individuální potřeby.

Priorita chování:

Kritické přežití a bezpečí.

Nutný odpočinek.

Stávka nebo emigrace.

Pracovní úkol.

Volný čas.

Postava nesmí vykonávat více neslučitelných činností současně.

Při přerušení práce musí být zachovaný skutečný stav surovin a rozpracované výroby.

Poddaní se musí fyzicky pohybovat mezi pracovišti, domy a dalšími dostupnými místy.

Běžní pocestní nepoužívají kompletní denní režim poddaných.

15. Save / Load

Rozšiř existující ukládání hry.

U každého obyvatele ukládej:

Potřeby

Happiness

Aktuální náladu

Přidělené bydlení

Stav odpočinku

Stav stávky

Počet dnů nespokojenosti

Stav případné emigrace

Aktuální AI stav

Ukládej také celkový Kingdom Happiness a relevantní migrační modifikátory, případně je bezpečně dopočítej z uložených obyvatel.

Po načtení:

Nezapočítej spotřebu jídla dvakrát.

Neprováděj znovu již dokončené denní události.

Nezdvojuj pracovní úkoly.

Zachovej přiřazení domů a pracovních míst.

Obnov stav stávkujících a odcházejících poddaných.

Zachovej kompatibilitu starších uložených her pomocí bezpečných výchozích hodnot.

16. Optimalizace

Předpokládej budoucí populaci alespoň 100–200 poddaných.

Neprováděj kompletní výpočty potřeb při každém vykresleném snímku.

Používej:

Centrální Game Time.

Intervalové nebo událostní aktualizace.

Efektivní vyhodnocování bezpečnosti.

Existující pathfinding a Worker AI.

Oddělení simulace od grafiky.

Denní režim a potřeby musí fungovat také mimo viditelnou oblast kamery.

Fog of War nesmí zastavovat simulaci NPC.

17. Testování

Před úpravami vytvoř Git commit.

Ověř:

Každý poddaný má individuální potřeby.

Food odpovídá skutečné spotřebě jídla.

Rest klesá při práci a obnovuje se při odpočinku.

Obyvatelé fyzicky docházejí domů.

Každý obyvatel má maximálně jedno přiřazené bydlení.

Bezdomovci mají horší podmínky odpočinku.

Blízkost obranných budov zvyšuje Safety.

Happiness se správně počítá.

Spokojenost ovlivňuje produktivitu práce.

Dlouhodobě nespokojení poddaní mohou stávkovat.

Při zlepšení podmínek se vrátí do práce.

Velmi nespokojení poddaní mohou emigrovat.

Emigrace správně aktualizuje populaci a pracovní místa.

Spokojenost ovlivňuje migraci.

Save/Load obnovuje všechny potřeby a AI stavy.

Nedošlo k duplicitní spotřebě potravin nebo mezd.

Hra zůstává stabilní při 100 aktivních obyvatelích.

18. Implementační fáze

Rozděl implementaci do čtyř fází.

Fáze A – Needs System
Individuální potřeby, Happiness a informační panely.

Fáze B – Daily Life
Bydlení, skutečný odpočinek a denní režim.

Fáze C – Social Behavior
Pracovní efektivita, stávky, emigrace a vliv na migraci.

Fáze D – Integration
Save/Load, ekonomika, optimalizace a automatizované testování.

Po každé dokončené a otestované fázi vytvoř Git commit.

Neimplementuj zatím:

Rodiny a narození dětí.

Stárnutí obyvatel.

Nemoci.

Kriminalitu.

Složité sociální vztahy mezi postavami.

Prioritou je funkční simulace základních potřeb obyvatel bez poškození existující ekonomiky a AI.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

