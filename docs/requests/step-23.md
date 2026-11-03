# Krok 23 — Medieval Kingdom – Upgrade 3: Seasons, Weather & Food Consumption

Rozšiř zemědělství, výrobu a sklady o sezóny, počasí a spotřebu obyvatel. Zachovej pracovní AI, Game Time, Food System, XP, mzdy, Fog of War a Save/Load.

## 1. Roční období
Spring, Summer, Autumn, Winter; každé 5 herních dnů, rok 20. Délka dne z Game Setup (default120 sekund). Začátek první den jara, po zimě nové jaro. Horní lišta ukazuje sezónu a den.

## 2. Vliv sezón
Růst: Spring1.20, Summer1.30, Autumn1.00, Winter0.00. V zimě obilí stojí, postup zachován a na jaře pokračuje. Sad plodí pouze léto/podzim, na jaře růst/kvetení, v zimě klid. Zima neodebírá sklizené zásoby. Grafika: jarní zelená krajina, letní zlatavé obilí, podzimní stromy, zimní zasněžený terén a bezlisté stromy. Stačí efektivní lehké změny textur/barev, bez složitých částic.

## 3. Počasí
Sunny, Rainy, Drought, Frost. Losování na začátku každého dne s různými pravděpodobnostmi podle sezóny. Růstové vlivy Sunny+10%, Rainy+15%, Drought−35%, Frost−70%. Kombinuj sezonní a meteorologický násobitel, nikdy záporný růst; nulová sezóna nemůže být počasím oživená. Centrální systémy připravené pro další odběratele.

## 4. Spotřeba
Jediný centrální Food System; starý časovač masa nesmí běžet zároveň. Král2 porce/den, každý živý poddaný1/den, nezískaní pocestní ne. Porce=1 Meat nebo1 Bread nebo1 Apple. Wheat/Flour nejedlé. Priorita Apple → Bread → Meat. Pouze skutečně dostupné skladované jídlo. Průběžné vyhodnocování během dne, ne celá dávka při Load.

## 5. Nedostatek
Food shortage, počet nenasycených obyvatel, postih atraktivity, −20% pracovní efektivity nenasycených. Při doplnění jídla postih odstraní. Bez smrti hladem/nemocí/automatických odchodů. Regenerace krále beze změny.

## 6. Migrace
Napoj na existující Kingdom Attractiveness System; nedostatek snižuje atraktivitu a pravděpodobnost usazení pocestných. Nevytvářej samostatnou migraci.

## 7. Food Economy
Panel: Food Storage v porcích, Daily Consumption, průměrná denní produkce nedávných sklizní, odhad dní zásob (jen současné sklady, ne nejistá budoucí úroda), sezóna a počasí. Příklad120porcí/15den=8dní.

## 8. Save/Load
Sezóna, den v roce, počasí/stav, růst, zásoby, spotřeba/průběh cyklu, nedostatek a ekonomická statistika. Load nesmí znovu spotřebovat/sklidit/přejít sezónu. Zpětná kompatibilita.

## 9. Výkon
Růst všech polí nepřepočítávej každý snímek. Centrální čas, rozumné intervaly. Efektivní změny terénu a plynulá mapa100×100.

## 10. Testování
Střídání 4sezón po5dnech, zimní zastavení obilí a sezónní sady, násobitele počasí, spotřeba dostupných potravin bez duplicit starého systému, vliv nedostatku na atraktivitu a efektivitu, správný panel, Save/Load všech stavů a regrese. Před úpravami Git commit, automatické testy a funkční build.

Bez chorob, stárnutí obyvatel, kažení jídla a složitého klimatu.
