# ETAPA 08/15 – původní krok 31A: Extended Zoom Out

**Milník:** M2. **Důležitá úprava:** Samostatně ověř min zoom a přesnost izometrického klikání, FoW a výkon.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Extended Camera Zoom & Daily Resource Statistics

V této samostatné etapě implementuj pouze větší rozsah Zoom Out. Ekonomické statistiky jsou následující etapa 31B.

Nezakládej nový projekt. Nejprve analyzuj aktuální Camera System, ovládání kolečkem myši, izometrický renderer, Resource Inventory, Logistics System, Warehouse, Granary, Economy System, Game Time, Save/Load a horní UI panel.

Zachovej všechny již fungující mechaniky.

1. Rozšíření Zoom Out

Uprav existující Camera Zoom System tak, aby hráč mohl mapu oddálit výrazně více než nyní.

Požadavky:

Zachovej stávající ovládání kolečkem myši.

Sniž minimální úroveň zoomu.

Jako výchozí návrh použij minimální zoom 0.25×, pokud to aktuální renderer umožňuje.

Zachovej dosavadní maximální přiblížení, pokud není potřeba změna kvůli technickým omezením.

Zachovej dosavadní výchozí úroveň přiblížení.

Zoom musí být plynulý.

Kamera nesmí překračovat povolené hranice mapy.

Zoom musí fungovat správně na izometrické mapě 100×100.

Pokud má projekt vlastní způsob přepočtu souřadnic, ověř jeho správnou funkci při nižším zoomu.

2. Chování při velkém oddálení

Při velkém oddálení musí nadále správně fungovat:

Vykreslování terénu.

Budovy a blueprinty.

Stromy, kameny a ložiska.

Postavy a zvířata.

Fog of War.

Kruhový View Range.

Exploration Mode.

Zvýraznění vybraných objektů.

Klikání na objekty.

Výběr stavebních pozic.

Pohyb kamery.

Zajisti, že kliknutí odpovídá správnému políčku bez ohledu na zoom.

Fog of War se musí oddalovat společně s mapou a nesmí se vizuálně oddělit od terénu.

Pokud se při extrémním oddálení objekty stanou příliš malé, můžeš snížit zobrazení nepodstatných detailů, například drobných ikon nebo dlouhých popisků.

Neodstraňuj samotné herní objekty.

3. Výkon při velkém oddálení

Při velkém Zoom Out je na obrazovce viditelná mnohem větší část mapy.

Optimalizuj vykreslování, aby zbytečně neklesalo FPS.

Použij existující culling a efektivní vykreslování izometrických objektů.

Zabraň:

Zbytečnému vytváření nových grafických objektů.

Opakovanému přepočítávání celé mapy bez důvodu.

Nadměrnému překreslování Fog of War.

Zbytečným aktualizacím vzdálených objektů.

Pokud existuje Performance Monitor, využij jej pro srovnání FPS při současném a novém minimálním zoomu.

ČÁST B – DENNÍ STATISTIKY SUROVIN

## Integrační testy etapy 31A

1. Kamera zvládá minimálně zoom 0.25×, pokud renderer tento rozsah bezpečně podporuje; jinak použij nejnižší prokazatelně bezpečnou hodnotu a vysvětli proč.
2. Klikání a výběr políčka funguje i při extrémním zoomu; hranice mapy, pan a přesun kamery zůstávají korektní.
3. Fog of War, Memory mapy, postavy, přístupnost UI a vrstvy fungují na 0.25×.
4. FPS zůstává přiměřené a Save/Load nemění zvolený zoom podle existujících pravidel.
5. Proveď testy, build, commit a Unreleased; další etapou je 31B.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

