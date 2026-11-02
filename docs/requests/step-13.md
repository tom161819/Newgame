krok 13	"Upgrade hry – Univerzální systém XP a levelů (1–50)

Rozšiř stávající izometrickou 2.5D hru ve Phaseru o univerzální systém zkušeností (Experience Points) a úrovní postav.

Cílem je, aby král, poddaní a budoucí vojáci získávali zkušenosti za skutečně vykonané činnosti a postupně zvyšovali svůj level.

Zachovej všechny existující herní mechaniky, zejména pohyb, lov, souboje, sbírání surovin, budovy, inventář, poddané, Fog of War, vyšlapávání cest a Save/Load.

1. Základní systém zkušeností

Každá lidská postava bude mít vlastní:

level – aktuální úroveň (1–50).

currentXP – zkušenosti získané v aktuálním levelu.

totalXP – celkově získané zkušenosti.

xpToNextLevel – zkušenosti potřebné k další úrovni.

maxLevel – maximální úroveň, zatím 50.

Všechny nové postavy začínají na levelu 1 s 0 XP.

Zkušenosti jsou individuální. Pokud král uloví divočáka, XP získá král, nikoliv ostatní poddaní.

2. XP požadované pro další level

Každý další level musí vyžadovat více zkušeností.

Použij následující vzorec:

XPRequired(level) = 100 + 35 × (level - 1) + 4 × (level - 1)²

Příklady:

Level 1 → 2: 100 XP

Level 2 → 3: 139 XP

Level 10 → 11: 739 XP

Level 25 → 26: 3244 XP

Level 49 → 50: 10996 XP

Po dosažení potřebného množství XP:

Postava získá nový level.

Odečtou se XP potřebné pro dosaženou úroveň.

Zbylé XP se přenesou do dalšího levelu.

Přepočítá se nový požadavek na XP.

Pokud postava získá velké množství XP najednou, musí být schopná získat více levelů během jedné události.

Na levelu 50 se další XP již nezapočítávají do postupu.

3. Získávání XP za činnosti

Implementuj udělování XP pomocí centrálního systému herních událostí.

Počáteční odměny:

Činnost

XP

Sebrání kamene

3

Sebrání balíčku masa

2

Ulovení zajíce

10

Ulovení srny

20

Ulovení divočáka

35

Postavení jednoho segmentu hradby

2

Postavení věže

15

Postavení hradu

30

Postavení domu

10

Pravidla:

XP získává postava, která činnost skutečně vykonala.

XP za lov se přidělují až při smrti zvířete.

XP za sběr se přidělují až po úspěšném sebrání předmětu.

XP za stavění se přidělují až po úspěšném dokončení stavby.

Pokud nynější stavební systém přiřazuje dokončenou stavbu králi, připisuj XP králi.

Pokud činnost provádí konkrétní poddaný, XP získá tento poddaný.

Při stavění řady hradeb přiděl XP podle počtu skutečně nově postavených segmentů.

Zrušené nebo neúspěšné činnosti neposkytují XP.

Za jednu událost nesmí být XP přiděleny dvakrát.

Pouhé klikání, stání na místě, běžná chůze nebo náhodné procházení NPC XP nepřidávají.

Pasivní regenerace HP a automatická produkce Gold XP nepřidávají.

Zabránit jednoduchému opakovanému získávání XP za stejnou zrušenou nebo vrácenou stavební akci.

Odměny musí být centrálně konfigurovatelné.

4. XP pro poddané a budoucí vojáky

Systém musí být univerzální.

Každý trvalý poddaný bude mít vlastní level a XP.

Příklady budoucích činností:

Dřevorubec získává XP za pokácení stromu.

Horník za vytěženou surovinu.

Stavitel za dokončení budovy.

Lovec za ulovená zvířata.

Voják za poražené nepřátele.

Zatím uděluj XP pouze za skutečně implementované činnosti.

Nové profese nebo pracovní mechaniky zatím nevytvářej.

Pokud se poddaný později změní na vojáka, musí si zachovat svůj level a XP.

Zkušenosti musí patřit konkrétní postavě, nikoliv její aktuální profesi.

5. Grafické zobrazení XP

Král

Do horní lišty přidej:

Aktuální level.

Grafický XP progress bar.

Aktuální XP / XP potřebné pro další level.

Příklad:

King | LVL 8 | XP 325 / 571

Po získání XP zobraz krátký plovoucí text nad postavou, například:

+20 XP

Po dosažení dalšího levelu zobraz výraznější oznámení:

LEVEL UP! Level 9

Přidej jednoduchý vizuální efekt kolem postavy.

Poddaní a vojáci

Při kliknutí na lidskou jednotku zobraz její informační panel:

Jméno nebo typ postavy.

Level.

Aktuální XP.

Progress bar.

HP.

DPS.

Armor.

Při najetí myší může tooltip zobrazovat například:

Peasant – Level 4

Při zapnutém Fog of War nesmí být vidět informační prvky skrytých jednotek.

6. Vliv levelů na statistiky

Zatím NEPŘIDÁVEJ automatické bonusy k HP, DPS ani Armor za dosažený level.

Důvodem je zachování současného balancování soubojů.

Systém však připrav tak, aby bylo možné později definovat například:

Zvýšení maximálního HP.

Zvýšení DPS.

Rychlejší práci.

Efektivnější těžbu.

Lepší lov.

Rychlejší pohyb.

Nové schopnosti.

Bonusy musí být později přidatelné bez zásadního přepisování XP systému.

7. Příprava na samostatné dovednosti

Architekturu připrav na budoucí systém samostatných skillů.

Například:

Combat

Hunting

Mining

Construction

Woodcutting

Pro první verzi bude aktivní pouze jeden celkový level postavy.

Nedělej zatím samostatné levelování jednotlivých dovedností.

Připrav ovšem rozšiřitelný datový model, aby se později nemusely měnit všechny existující jednotky.

8. Experience System

Vytvoř centrální ExperienceSystem, případně rozšiř současný systém statistik jednotek.

Musí poskytovat funkce například:

addXP(character, amount, source)

getXPRequired(level)

checkLevelUp(character)

getLevelProgress(character)

onLevelUp(character, newLevel)

Jednotlivé herní systémy nesmí přímo měnit level nebo XP.

Místo toho při dokončení činnosti vyvolají odpovídající událost a XP systém rozhodne o přidělení zkušeností.

Připrav ochranu proti duplicitnímu zpracování jedné herní události.

9. Asset Library

Rozšiř definice lidských postav o nastavení zkušeností.

Každá definice musí umožnit:

Počáteční level.

Maximální level.

Povolení získávání XP.

Případný budoucí násobitel získaných XP.

Zvířata zatím nebudou získávat XP ani levelovat.

10. Save / Load

Rozšiř současný systém ukládání.

U každé lidské postavy ukládej:

Level.

Current XP.

Total XP.

Případné budoucí XP modifikátory.

Po načtení musí mít každá postava přesně stejný level a XP jako při uložení.

Při načtení nesmí dojít k opětovnému přidání zkušeností za již dokončené činnosti.

Zajisti kompatibilitu se staršími uloženými hrami pomocí migrace nebo bezpečných výchozích hodnot.

11. Testování

Před většími úpravami vytvoř Git commit.

Ověř:

Každá lidská postava začíná na levelu 1.

XP se připisují při dokončení správné činnosti.

XP se nepřipisují dvakrát.

Každý další level vyžaduje více XP.

Zbylé XP se správně přenášejí.

Maximální level je 50.

Král a poddaní mají nezávislé XP.

Level Up se správně zobrazuje.

UI zobrazuje aktuální postup.

Level zatím automaticky nemění bojové statistiky.

Save/Load správně obnovuje zkušenosti.

Starší uložené hry nespadnou kvůli chybějícím XP datům.

Stávající herní mechaniky zůstávají funkční.

Prioritou je univerzální, stabilní a rozšiřitelný XP systém, který bude později použitelný pro profese, vojenské jednotky a další typy postav."