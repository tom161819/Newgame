# ETAPA 06/15 – původní krok 32: Missing Workers Indicator

**Milník:** M1. **Důležitá úprava:** Indikátory jen dokončených pracovních budov s chybějícími pracovníky, skryté mimo aktuální dohled.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Missing Workers Indicator

Rozšiř stávající izometrickou 2.5D hru Medieval Kingdom o vizuální upozornění na nedostatek zaměstnanců v pracovních budovách.

Nezakládej nový projekt. Nejprve analyzuj současný Building System, Job System, Auto Employment, vykreslování izometrických budov, kameru a UI.

1. Ikonka nad budovou

Pokud dokončená pracovní budova nemá obsazená všechna pracovní místa, zobraz nad ní malou blikající ikonku pracovníků.

Použij dvě barevné varianty:

Červená: budova má 0 zaměstnanců.

Oranžová: budova má alespoň jednoho zaměstnance, ale není plně obsazená.

Bez ikonky: všechna pracovní místa jsou obsazená.

Příklady:

Quarry 0/3 → červená.

Quarry 1/3 → oranžová.

Quarry 3/3 → bez ikonky.

Bakery 0/2 → červená.

Ikonka musí být malá, přehledná a vizuálně odpovídat středověkému stylu hry.

Použij symbol pracovníků nebo jednoduchou siluetu postavy.

2. Umístění a animace

Ikonku vykresli nad střechou příslušné budovy.

Požadavky:

Správná pozice na izometrické mapě.

Pomalé, nenápadné blikání, například změna opacity v cyklu 1,5 sekundy.

Správná funkce při pohybu kamery a zoomování.

Ikonka nesmí překrývat jiné důležité ovládací prvky.

Při velkém Zoom Out zůstane rozpoznatelná, ale nebude nepřiměřeně velká.

Pokud stojí vedle sebe více budov, jejich ikonky se nesmějí zbytečně překrývat.

3. Hover informace

Po najetí myší na ikonku zobraz tooltip:

Missing Workers

Například:

Quarry
Workers: 1 / 3
Missing: 2

Kliknutím na ikonku otevři existující panel budovy s možností Assign Worker.

Ikonka nesmí při kliknutí způsobit pohyb krále ani zadání příkazu na mapě.

4. Automatická aktualizace

Stav ikonky aktualizuj při:

Dokončení budovy.

Přidělení zaměstnance.

Odebrání zaměstnance.

Automatickém zaměstnání přes Auto Employment.

Přeřazení pracovníka.

Úmrtí nebo emigraci zaměstnance.

Zrušení či zničení budovy.

Načtení uložené hry.

Pokud Auto Employment okamžitě obsadí všechna místa, ikonka zmizí.

Rozlišuj obsazené pracovní místo a momentální přítomnost pracovníka. Zaměstnanec, který spí, cestuje nebo právě odpočívá, se stále počítá jako obsazené pracovní místo.

Stávkující pracovník si rovněž zachovává pracovní místo podle existujícího systému.

5. Které budovy zobrazují upozornění

Ikonku zobrazuj pouze u dokončených budov, které mají pracovní místa a potřebují zaměstnance.

Například:

Quarry

Hunting Lodge

Farmhouse

Lumberjack Hut

Iron Mine

Mill

Bakery

Wheelwright's Workshop

Marketplace, pokud má skutečná pracovní místa

Další pracovní budovy podle Building Registry

Nezobrazuj ji u:

House

Castle, pokud nemá pracovní místa

Walls

Towers bez pracovních míst

Fields a Orchards bez vlastního pracovního obsazení

Nedokončených blueprintů

Budov s nulovou kapacitou pracovníků

Nepoužívej pevně zakódovaný seznam budov. Vycházej z existujícího Building/Job Registry.

6. Fog of War

Ikonky musí respektovat Fog of War a Exploration Mode.

V aktuálně viditelné oblasti se zobrazují normálně.

V prozkoumané, ale momentálně neviditelné oblasti se nezobrazují jako živé informace.

V neprozkoumané oblasti jsou skryté.

Nesmí docházet k prozrazování aktuálního stavu budov mimo dohled.

7. Výkon

Nedělej kompletní kontrolu zaměstnanců každým snímkem.

Používej existující události Job Systemu a změny stavu budov.

Animaci blikání implementuj efektivně, ideálně sdílenou animační logikou.

Při stovkách budov musí hra zůstat plynulá.

8. Save / Load

Neukládej duplicitní stav ikonek.

Po načtení hry jej automaticky dopočítej podle skutečného počtu přiřazených zaměstnanců v jednotlivých budovách.

Zachovej kompatibilitu starších uložených her.

9. Testování

Ověř:

Budova bez zaměstnanců má červenou blikající ikonku.

Částečně obsazená budova má oranžovou ikonku.

Plně obsazená budova nemá ikonku.

Ikonka po Auto Employment správně zmizí.

Zaměstnanec na odpočinku není považován za chybějícího.

Hover ukazuje správný počet zaměstnanců.

Kliknutí otevře panel budovy.

Nedokončené budovy ikonku nemají.

Fog of War správně skrývá ikonky.

Zoom a pohyb kamery fungují bez problémů.

Save/Load obnovuje správný vizuální stav.

Před úpravami vytvoř bezpečný Git commit.

Po dokončení ověř funkční build, doplň změnu do sekce Unreleased v CHANGELOG.md a vytvoř nový commit.

Nevydávej automaticky novou verzi hry.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

