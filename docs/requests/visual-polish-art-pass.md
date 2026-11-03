# Medieval Kingdom – Visual Polish & Art Pass

Rozšiř a uprav stávající projekt Medieval Kingdom o větší grafický polish, lepší čitelnost UI a kvalitnější vizuální prezentaci světa, postav a budov.

Tento upgrade je **vizuální / prezentační vrstva**, nikoliv nová herní mechanika.  
Nezakládej nový projekt. Nejprve analyzuj aktuální stav UI, layoutu, renderingu, asset pipeline, building sprites, character sprites, terrain rendering, path rendering, construction visuals a particle/effect systému.

Zachovej existující herní mechaniky a logiku. Pokud je potřeba upravit datové struktury kvůli lepší grafické prezentaci, dělej to tak, aby nedošlo k rozbití Save/Load, UI nebo gameplay systémů.

---

## Hlavní cíle

1. Zvětšit hlavní herní viewport a zefektivnit využití prostoru na obrazovce.
2. Zjednodušit a ztenčit horní UI panely.
3. Vylepšit vzhled trávy, vyšlapaných cest a zarůstání.
4. Dát postavám originální vzhled podle profese a rozlišit muže a ženy.
5. Přidat vizuální efekty stavby – lešení a prach.
6. Přepracovat budovy tak, aby každá měla výrazně odlišný a tematický vzhled.

---

# 1. Layout a UI – větší herní okno

## 1.1 Hlavní herní plocha
Zvětši prostor, který na obrazovce zabírá samotná hra.

Cíl:
- co největší plocha pro mapu,
- méně zbytečně vysokých horních panelů,
- efektivnější využití vertikálního prostoru.

Neporuš ovládání:
- levého panelu,
- pravého panelu Population,
- spodního Buildings menu,
- tooltipů,
- resource baru,
- main menu,
- changelogu,
- settings.

---

## 1.2 Horní panel s názvem hry a verzí
Uprav horní panel s názvem hry a verzí tak, aby byl **výrazně tenčí**.

Požadavky:
- zachovej název hry,
- zachovej verzi,
- výšku panelu výrazně zmenši,
- nepůsobí masivně a neubírá místo herní ploše.

Design:
- kompaktní,
- čistý,
- stále stylizovaný do středověké estetiky,
- méně prázdného místa,
- jemnější okraje.

---

## 1.3 Panel se surovinami
Ztenči panel se surovinami, případně jej převeď na **overlay přímo nad herní okno**.

Cílové chování:
- standardně se zobrazují jen **ikony surovin + aktuální počet**,
- panel je kompaktní,
- zabírá minimum místa,
- při rozšíření nebo hoveru zobrazí detailnější informace.

### Varianta zobrazení
Navrhni a implementuj kompaktní systém:

**Výchozí režim**
- pouze ikony + počet suroviny.

**Rozšířený režim**
- ukáže i denní změnu,
- případně další detaily podle existujícího systému statistik.

Může být:
- rozbalovací,
- přepínatelný,
- nebo reagovat na hover / click.

Důležité:
- nenarušit čitelnost,
- nezakrývat mapu nevhodně,
- zachovat kompatibilitu s denními statistikami surovin.

Pokud už hra má detailní resource tooltipy, zachovej je.

---

# 2. Tráva, pěšiny a povrch mapy

## 2.1 Výchozí tráva
Travnaté plochy mají defaultně působit jako **vysoká tráva**, ne jako sterilní hladký povrch.

Požadavky:
- vizuálně bohatší travní terén,
- více přírodního charakteru,
- lehce divočejší vzhled světa.

---

## 2.2 Více grafických variant trávy
Přidej více grafických druhů trávy, aby mapa nepůsobila monotónně.

Cíle:
- několik vizuálních variant travního povrchu,
- jemné střídání textur,
- přirozené barevné odchylky,
- nepravidelné rozmístění,
- bez rušivého opakování.

Můžeš použít:
- různé odstíny zelené,
- lehce různou hustotu trávy,
- jemné drobné detaily.

Dbej na to, aby:
- výsledek nepůsobil chaoticky,
- stále šlo dobře číst budovy, postavy a cesty.

---

## 2.3 Vyšlapané pěšiny – jemnější přechody
Uprav vyšlapané pěšiny tak, aby přechod mezi normální trávou a vyšlapanou pěšinou nebyl tak ostrý.

Současný stav, který je nežádoucí:
- příliš tvrdý kontrast,
- barva jde do oranžova a pak do červena.

Nové požadavky:
- přechod má být plynulejší,
- barevná cesta má jít:
  - od zelené,
  - přes tmavě zelenou,
  - do tmavě hnědé,
- ne do oranžové ani červené.

Pěšina má působit jako:
- sešlapaná tráva,
- vyšisovaný a utlačený porost,
- jemně obnažená hlína.

Zachovej existující víceúrovňový systém vyšlapání cest, ale uprav jeho vizuální škálu.

---

## 2.4 Zarůstání pěšin zpět
Pokud se cesta delší dobu nepoužívá, má postupně znovu zarůstat.

Požadavky:
- vyšlapané cesty nesmí být trvalé,
- při dlouhé nečinnosti se jejich vizuální úroveň postupně snižuje,
- tráva se vrací zpět,
- návrat musí být pozvolný.

Použij existující nebo upravený Path Wear System.

Dbej na to, aby:
- zarůstání bylo vizuálně jemné,
- nezpůsobovalo problikávání,
- správně fungovalo se Stone Pavement / dlážděnými cestami.

Dlážděné cesty:
- nezarůstají,
- zůstávají trvalé.

---

# 3. Postavy – vzhled podle profese

## 3.1 Originální vzhled podle povolání
Po změně profese má postava získat odpovídající vizuální podobu.

Každá profese má mít vlastní charakteristický vzhled.

Například:
- farmer,
- miner,
- woodcutter,
- builder,
- hunter,
- hauler,
- miller,
- baker,
- soldier,
- wheelwright,
- smelter operator,
- další skutečně existující profese.

Není nutné vytvářet extrémně detailní portréty na úrovni realistické RPG postavy, ale jednotky musí být na první pohled rozlišitelné.

Například pomocí:
- jiného oblečení,
- barvy tuniky,
- zástěry,
- nástroje,
- pokrývky hlavy,
- pracovních doplňků.

---

## 3.2 Rozlišení muž / žena
Přidej odlišné sprite / vzhledové varianty pro:
- muže,
- ženy.

To platí i pro profese.

Příklad:
- muž farmář a žena farmářka nemají být totožná kopie,
- stále však musí být jasně rozpoznatelné, že patří do stejné profese.

Rozlišení musí být:
- jemné,
- čitelné,
- stylově jednotné.

Nepřeháněj karikaturnost.

---

## 3.3 Konzistence s UI
Zachovej propojení mezi:
- sprite ve světě,
- portrétem v population panelu,
- barevným pozadím profese.

UI a herní sprite mají působit jako součást stejného vizuálního jazyka.

---

# 4. Vizuály stavby – lešení a prach

## 4.1 Lešení při stavbě
Když začne stavba budovy, má se kolem ní objevit **lešení**.

Důležité pravidlo:
- lešení se neobjeví okamžitě po položení blueprintu,
- objeví se až ve chvíli, kdy skutečně přijde pracovník a začne pracovat.

To znamená:
- blueprint bez aktivní stavby = bez lešení,
- aktivně stavěná budova = lešení.

Lešení má odpovídat typu budovy a fázi rozestavěnosti.

Nemusí být unikátní pro každou budovu, ale má působit přirozeně:
- dřevěná konstrukce,
- podpěry,
- pracovní plošiny.

---

## 4.2 Prach při práci
Když pracovník aktivně staví, přidej jemný vizuální efekt prachu.

Požadavky:
- lehké rozplývající se obláčky prachu,
- decentní, ne přehnané,
- vizuálně příjemné,
- nesmí překrývat budovu ani pracovníka.

Efekt se má zobrazovat pouze při aktivní stavební práci.

Když se na stavbě aktuálně nepracuje:
- prach se nezobrazuje.

Prach musí správně fungovat s:
- zoomem,
- kamerou,
- Fog of War,
- Performance limity.

---

# 5. Budovy – výrazně odlišný tematický design

## 5.1 Každá budova musí mít vlastní charakter
Přepracuj vizuální podobu budov tak, aby každá působila jako samostatný, propracovaný a tematicky jasný objekt.

Cíl:
- budovy nesmí působit příliš genericky,
- hráč má už na první pohled poznat jejich účel,
- vzhled má být inspirovaný historií a středověkem.

---

## 5.2 Tematické dekorace podle oboru
Každá budova má být vyzdobená předměty, které k ní tematicky patří.

Příklady:

### Farmhouse
- seno,
- sudy,
- pytle,
- nářadí,
- jednoduché zemědělské prvky.

### Granary
- pytle s obilím,
- skladištní nádoby,
- dřevěné konstrukce,
- sušené plodiny.

### Mill
- části mlýna,
- pytle s obilím / moukou,
- dopravní žlaby,
- technické prvky.

### Bakery
- pec,
- dřevo,
- pečivo,
- pracovní stoly.

### Quarry
- skála,
- těžební konstrukce,
- bedny,
- nářadí,
- vytěžený kámen.

### Smelter
- pec,
- komín,
- žhavé prvky,
- ruda,
- kovové nádoby.

### Wheelwright’s Workshop
- kola,
- rozpracované povozy,
- trámy,
- nářadí.

### Stables
- ohrada,
- seno,
- koryta,
- stáje,
- koňské vybavení.

### House
- lavička,
- dříví,
- drobné vybavení domácnosti.

### Castle / Tower / Barracks
- obranné prvky,
- praporce,
- zbraně,
- výzbroj,
- vojenské doplňky.

Použij skutečně dostupné typy budov. Pokud některé ještě nejsou implementované, připrav systém tak, aby pro ně šel vzhled snadno doplnit později.

---

## 5.3 Historická inspirace
Inspiruj se minulostí a středověkou estetikou.

Budovy mají působit:
- věrohodně,
- řemeslně,
- útulně nebo účelově podle typu,
- vizuálně bohatěji než dosud.

Není cílem hyperrealismus.  
Cílem je kvalitní stylizovaná historická strategie.

---

## 5.4 Čitelnost při zoomu
I přes větší detailnost musí být budovy dobře čitelné i při oddálení kamery.

Požadavky:
- silueta budovy musí zůstat jasná,
- tematické prvky nesmí vytvořit vizuální chaos,
- budova musí být dobře rozeznatelná i při větším zoom out.

---

# 6. Technické požadavky

## 6.1 Asset pipeline
Pokud projekt používá centralizovanou asset pipeline, zapoj nové varianty korektně do:
- asset registry,
- building registry,
- character visuals,
- terrain visuals,
- UI styling.

Nevytvářej neudržitelný chaos jednotlivých ručně napojených sprite.

---

## 6.2 Výkon
Dbej na výkon.

Nové grafické úpravy nesmí výrazně zhoršit:
- FPS,
- načítání,
- scrolling,
- zoom,
- Fog of War,
- Pathfinding aktualizace.

Zejména:
- efekty prachu musí být lehké,
- tráva a povrchy mají být efektivně renderované,
- nové stavební dekorace nemají zbytečně nafukovat počet draw callů.

---

## 6.3 Save/Load
Tyto grafické úpravy nesmí rozbít Save/Load.

Zajisti kompatibilitu:
- existujících budov,
- profesí,
- rozestavěných staveb,
- terrain/path systému.

Pokud je potřeba malá migrace pro vzhled nebo nové vizuální stavy, udělej ji bezpečně.

---

# 7. Testování

Ověř minimálně:

1. Hlavní herní viewport je větší než dříve.
2. Horní panel s názvem hry a verzí je výrazně tenčí.
3. Resource panel je kompaktnější a stále čitelný.
4. Resource panel funguje i s denními statistikami.
5. Tráva má více variant a nepůsobí monotónně.
6. Vyšlapané cesty mají jemnější přechody.
7. Cesty nepřecházejí do oranžové / červené.
8. Nepoužívané pěšiny znovu zarůstají.
9. Dlážděné cesty nezarůstají.
10. Postavy po změně profese mění vzhled.
11. Mužské a ženské varianty jsou rozlišitelné.
12. Portréty a sprite odpovídají profesi.
13. Lešení se objeví až při skutečném zahájení stavby.
14. Lešení se nezobrazí jen při prázdném blueprintu.
15. Při práci na stavbě se zobrazuje jemný prach.
16. Prach mizí, když se aktuálně nestaví.
17. Budovy mají výrazně odlišný design.
18. Budovy obsahují tematické dekorace.
19. Budovy jsou stále dobře čitelné při větším zoom out.
20. Výkon hry zůstává stabilní.
21. Save/Load funguje správně.
22. Fog of War a Map Memory fungují i s novými vizuály.
23. UI vrstvy se nepřekrývají nechtěným způsobem.

---

# 8. Postup implementace

Rozděl práci do pěti fází:

## Phase A – UI Layout Polish
- zvětšení herního viewportu,
- ztenčení horního panelu,
- ztenčení / přesunutí resource panelu,
- kompaktní resource overlay.

## Phase B – Terrain & Grass Polish
- vysoká tráva,
- více variant trávy,
- jemnější přechody vyšlapaných cest,
- zarůstání nepoužívaných pěšin.

## Phase C – Character Visual Pass
- vzhled postav podle profese,
- mužské a ženské varianty,
- návaznost na portréty a UI.

## Phase D – Construction Effects
- lešení při aktivní stavbě,
- jemný prach při práci.

## Phase E – Building Art Pass
- odlišný design budov,
- tematické dekorace,
- historická inspirace,
- čitelnost při zoomu.

Po každé fázi:
- proveď testy,
- oprav nalezené chyby,
- vytvoř Git commit,
- aktualizuj changelog.

Po dokončení celého tohoto vizuálního upgradu:
- proveď integrační testy,
- ověř build,
- připrav nový commit nebo release podle stávajícího verzovacího systému projektu.

Nevydávej automaticky novou veřejnou verzi hry, pokud projektová pravidla vyžadují vydání až po větším milníku.

Prioritou je výrazné vizuální zlepšení hry bez rozbití stávající logiky a bez zhoršení použitelnosti UI.