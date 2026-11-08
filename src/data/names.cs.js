// m-obyvatele-jmena-spanek-pohyb (31): Czech resident names. Index-aligned with names.en.js (same list lengths), so a
// saved identity of indices reads sensibly in both languages. Surnames are male forms; the female form follows
// czechFemale() in names.js, `female` overrides the rule where Czech is irregular. Origins are complete phrases in
// the genitive ("z Pičína", "ze Lhoty").
export default Object.freeze({
  male:Object.freeze(['Jaroslav','Matěj','Jakub','Pavel','Jan','Ondřej','Vojtěch','Václav','Bořivoj','Přemysl','Ctibor','Dobroslav','Bohuslav','Vratislav','Zdeněk','Kryštof','Šimon','Vavřinec','Prokop','Havel',
    'Mikuláš','Jiří','Tomáš','Lukáš','Martin','Jindřich','Oldřich','Radim','Vítek','Bartoloměj','Kašpar','Matouš','Benedikt','Hynek','Jeroným','Štěpán','Petr','Filip','Albrecht','Kuneš']),
  female:Object.freeze(['Anna','Eliška','Marie','Tereza','Klára','Ludmila','Dorota','Markéta','Kateřina','Magdaléna','Johana','Barbora','Žofie','Anežka','Božena','Dobroslava','Kunhuta','Libuše','Zdislava','Alžběta',
    'Apolena','Běta','Dobromila','Hedvika','Jitka','Kristýna','Lucie','Marta','Milada','Ofka','Petronela','Rozálie','Salomena','Svatava','Uršula','Veronika','Vojtěška','Zuzana','Agáta','Bohdana']),
  surnames:Object.freeze([
    'Flaška','Knírek','Drška','Podkova','Hořčice','Štěnice','Zelenáč','Knedlík','Koláček','Buchta','Pecka','Šiška','Kobliha','Kroupa','Vdolek','Škvarek','Ocásek','Bačkora','Čepice','Kožich',
    'Šňůrka','Švestka','Hruška','Řepa','Mrkvička','Cibulka','Kmín','Křen','Fazolka','Okurka','Petržel','Komár','Brouček','Cvrček','Šnek','Ježek','Kohout','Kocour','Kozel','Beran',
    'Holub','Vrabec','Sýkora','Datel','Kačer','Kuřátko','Mravenec','Žabka','Hrnec','Pánvička','Smeták','Vařečka','Hrnek','Džbánek','Korbel','Soudek','Klíček','Zámeček','Kladívko','Hřebíček',
    'Sekyrka','Motyka','Lopatka','Vidlička','Trakař','Kolovrátek','Přeslička','Kotlík','Mlýnek','Kvasnička','Krupička','Pekáč','Rohlík','Preclík','Perník','Medvídek','Šafránek','Kapoun','Bábovka','Kašička',
    'Polívka','Omáčka','Klobása','Tlačenka','Fousek','Kudrna','Čupřina','Copánek','Ťuhýk','Strnad','Konipásek','Pěnkava','Čížek','Křepelka','Bažant','Bobr','Jezevec','Liška','Zajíček','Králík',
    'Veverka','Vydra','Rak','Krtek','Brabec','Píšťalka','Bubeník','Dudák','Šmidrkal','Vocásek','Zahálka','Halabala','Bumbálek','Mazánek','Šlapák','Kulíšek','Paleček','Honzátko','Nebojsa','Veselý',
    'Ospalý','Mlsný','Kulatý','Pomalý','Zvídavý','Šikovný','Hladový','Krejčí','Kalužný','Bosý',
  ]),
  // Irregular female forms (a non-fleeting -ek, a fleeting -el).
  female_surnames:Object.freeze({'Šnek':'Šneková','Kozel':'Kozlová','Datel':'Datlová'}),
  origins:Object.freeze([
    'z Pičína','z Horažďovic','z Prašivky','z Kocourova','z Bezděkova','z Kozlovic','ze Žabovřesk','z Kravska','z Hnojic','z Ločenic',
    'z Mrákova','z Uhlířských Janovic','z Kotěhůlek','z Myší Díry','z Kozí Lhoty','z Horní Dolní','z Kocourkova','z Brambor','z Kašperských Hor','z Trhových Svinů',
    'z Klatov','z Domažlic','z Kouřimi','z Lomnice nad Popelkou','z Telče','z Polné','z Rokycan','z Votic','z Úval','z Netvořic',
    'z Mladé Vožice','ze Sedlčan','z Benešova','z Kardašovy Řečice','z Jindřichova Hradce','z Budislavi','z Nechanic','z Bystřice pod Hostýnem','z Pacova','z Humpolce',
    'z Kozojed','z Volar','z Vimperka','z Dolní Lhoty','z Horní Lhoty','ze Lhoty','z Prčic','z Ďáblic','z Hrušovan','z Jablonce',
    'z Kobylis','z Kuřimi','z Kravař','z Kozlova','z Vrabčí Lhoty','z Husince','ze Žirovnice','ze Žďáru','z Dědic','z Babic',
    'z Klobouk','z Kunratic','z Chocně','z Mnichova Hradiště','z Bochova','z Bzence','ze Smrkovic','z Krhanic','z Kaliště','z Pelhřimova',
    'z Moravských Budějovic','z Hostomic','z Bechyně','z Blatné','z Hrnčíř','z Kačerova','z Holubova','z Vepřové','z Myšence','z Hlupína',
    'ze Šenova','z Chrudimi','z Tupadel','z Pivína','z Telecího','z Vlkova','ze Zajíčkova','z Medlova','z Nové Paky','z Lysé nad Labem',
    'z Kutné Hory','z Poličky','z Litomyšle','z Vysokého Mýta','z Náchoda','z Hořic','z Jičína','z Turnova','z Rakovníka','ze Žatce',
  ]),
  // Children (diminutives); they take the family's surname.
  children:Object.freeze({
    boy:Object.freeze(['Kuba','Vašek','Toník','Pepík','Matýsek','Honzík','Vojta','Ondra','Kubík','Jeník']),
    girl:Object.freeze(['Anička','Bára','Madla','Terezka','Rozárka','Majda','Verunka','Liduška','Kačka','Julka']),
  }),
});
