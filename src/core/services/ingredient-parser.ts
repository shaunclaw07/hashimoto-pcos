// src/core/services/ingredient-parser.ts
// Pure TypeScript port of scripts/ingredient-parser.mjs — zero framework imports.

// ── German ingredient names ────────────────────────────────────────────────────
const GERMAN = new Set([
  // Zucker & Süßungsmittel
  'zucker','saccharose','glucose','dextrose','fruktose','lactose','maltose',
  'raffinierter zucker','rohrzucker','vollrohrzucker','rohrzuckersirup','zuckersirup','invertzuckersirup',
  'glukosesirup','glukose-fruktose-sirup','fruktosesirup','maisstärkesirup','reissirup',
  'agavendicksaft','agavensirup','honig','bienenhonig','birnenmost','birnendicksaft',
  'apfeldicksaft','apfelsaftkonzentrat','malzextrakt','malzodextrin','malz',
  'stevia','steviolglycoside','erythrit','xylit','birkenzucker','sorbit','mannit',
  'isomalt','maltit','tagatose','süßungsmittel','süßstoff',

  // Mehle & Stärken
  'weizenmehl','weizenvollkornmehl','weizenstärke','weizeneiweiß','weizengluten',
  'roggenmehl','roggenvollkornmehl','roggenstärke','gerstenmehl','gerstenmalz',
  'hafermehl','haferflocken','haferkleie','dinkelmehl','dinkelvollkornmehl','dinkelstärke',
  'buchweizenmehl','buchweizen','hirsemehl','hirse','quinoa','quinoamehl','amaranth',
  'maismehl','maisstärke','maisgrieß','polenta','kartoffelstärke','kartoffelmehl',
  'reismehl','reisstärke','reisgrieß','klebreis','reis','reis gepufft','puffreis','gepuffter mais',
  'tapiokastärke','tapiokamehl',
  'kokosmehl','mandelmehl','haselnussmehl','paranussmehl','sojamehl','sojabohnenmehl',
  'lupinenmehl','lupinenprotein','mehl','stärke','modifizierte stärke','veränderte stärke',

  // Öle & Fette
  'palmöl','palmin','palmfett','palmenfett','kokosöl','kokosfett','kokosnussöl',
  'sonnenblumenöl','sonnenblumenfett','rapsöl','rapsfett','rebornöl',
  'olivenöl','natives olivenöl extra','olivenöl extra vergine','olivenfruchtöl',
  'maiskeimöl','maisöl','weizenkeimöl','sojaöl','sojabohnenöl',
  'erdnussöl','arachisöl','walnussöl','haselnussöl','mandelöl','sesamöl','sesamfett',
  'mohnöl','leinsamenöl','hanföl','distelöl','safloröl','traubenkernöl',
  'avocadoöl','brasilianussöl','macadamiaöl','pistazienöl','pecanöl',
  'tierisches fett','schweinefett','schmalz','gänsefett','entenfett','butterreinfett',
  'ghee','butter','butterfett','milchfett','rahm','sahne','schlagsahne','sauerrahm',
  'creme','crème fraîche','margarine','pflanzenmargarine','streichfett',
  'fett','öl','öle','fette',

  // Milch & Milchprodukte
  'milch','vollmilch','teilentrahmte milch','entrahmte milch','milchpulver',
  'magermilchpulver','vollmilchpulver','kondensmilch',
  'milchkonzentrat','molkepulver','molke','molkenprotein','molkenproteinpulver',
  'casein','natriumcaseinat','calciumcaseinat','caseinat','micellar casein',
  'käse','hartkäse','weichkäse','schnittkäse','schmelzkäse','käsepulver',
  'parmesan','pecorino','grana padano','gouda','emmentaler','bergkäse',
  'brie','camembert','mozzarella','ricotta','quark','körnig','hüttenkäse',
  'schichtkäse','smetana','saure sahne',
  'joghurt','naturjoghurt','griechischer joghurt','joghurtpulver','joghurtkultur',
  'kefir','kefirpilz','buttermilch','buttermilchpulver','ayran',
  'milchprotein','milcheiweiß','milchzucker','laktose','laktoseintoleranz',
  'laktalbumin','laktoglobulin','calciumlactat','calciumlaktat','milchsäure','milchsäurebakterien',

  // Eier
  'ei','eier','eiklar','eiweiß','eidotter','eigelb','vollei','volleier',
  'eiweißpulver','eiweißkonzentrat','trockenei','eiextrakt','eipulver',
  'hühnerei','hühnereier','wachtelei','wachteleier',

  // Fleisch
  'rindfleisch','rind','rindhack','rinderhackfleisch','rindfleischextrakt',
  'schweinefleisch','schwein','schweinehack','schweinehackfleisch','schweinebauch',
  'hähnchen','hähnchenfleisch','huhn','hühnerfleisch','hühnerbrust','hühnerschenkel',
  'pute','putenfleisch','putenbrust','putenschenkel','truthahn',
  'lamm','lammfleisch','lammhack','lammkeule','lammrücken',
  'ziege','ziegenfleisch','ziegenkäse','ziegenmilch',
  'wild','wildbret','hirsch','reh','wildschwein','kaninchen','hasen',
  'fisch','fischfleisch','fleisch','fleischextrakt','fleischbrühe',
  'gelatine','rindergelatine','schweinegelatine','gelatinepulver',

  // Fisch & Meeresfrüchte
  'lachs','lachsfilet','wildlachs','lachskaviar','rogen','kaviar',
  'forelle','regenbogenforelle','saibling','renke','renken',
  'makrele','hering','sardine','sardellen','anchovis','ansjovis',
  'thunfisch','tunfisch','bonito','schwertfisch','seelachs','kabeljau','dorsch',
  'seehecht','hechtdorsch','wolfsbarsch','barsch','zander','hecht',
  'garnele','garnelen','shrimp','shrimps','krabbe','krabben',
  'hummer','lobster','miesmuschel','miesmuscheln','austern','schnecken',
  'calamari','tintenfisch','sepie','octopus','pulpo',
  'fischöl','fischleberöl','cod liver oil','dorschlebertran',
  'algen','algenöl','algenpulver','spirulina','chlorella','wakame','nori',
  'pektin',

  // Gemüse
  'tomate','tomaten','tomatenmark','tomatenkonzentrat','tomatenpulver',
  'trockentomaten','getrocknete tomaten','tomatenextrakt',
  'paprika','paprikapulver','paprikaflocken','chili','chilipulver','chiliflocken',
  'cayenne','peperoni','peperoncini','pimiento',
  'karotte','karotten','möhre','möhren','möhrensaft','karottensaft',
  'zwiebel','zwiebeln','schalotte','schalotten','lauch','porree','lauchzwiebel',
  'knoblauch','knoblauchpulver','knoblauchgranulat',
  'kohl','weißkohl','rotkohl','sauerkraut','blumenkohl','brokkoli',
  'rosenkohl','wirsing','kopfkohl','staudensellerie','sellerie',
  'sellerieblätter','staudenselleriesaft',
  'spargel','chicoree','endivie','radieschen','rettich','mangold',
  'spinat','tiefkühlspinat','spinatpulver',
  'gurke','gurken','cornichons','einlegegurke',
  'avocado',
  'artischocke','aubergine','auberginen','fenchel','fenchelsamen',
  'kürbis','kürbiskernöl','kürbiskerne','kürbiskernmehl',
  'zucchini','courgette','courgetti',
  'erbsen','erbsenprotein','erbsenisolat','erbsenmehl','markerbsen',
  'bohnen','bohnenmehl','gartenbohne','prinzessbohne','fisolen','grüne bohnen',
  'linsen','linsenmehl','rote linsen','grüne linsen','bergbohnen',
  'kichererbsen','kichererbsenmehl','humus','tahini','sesampaste',
  'sojabohnen','edamame','sojakeime','sojasprossen',
  'mungobohnen','adzukibohnen','limabohnen','kidneybohnen',
  'pilze','champignons','pfifferlinge','steinpilze','maronen','trüffel',
  'sprossen','keimlinge','samen','sprossenmix',

  // Obst
  'apfel','äpfel','apfelsaft','apfelmark','apfelkonzentrat',
  'birne','birnen','birnensaft','birnenmark',
  'banane','bananen','bananenpulver','getrocknete bananen',
  'orange','apfelsine','orangensaft','orangensaftkonzentrat',
  'zitrone','zitronensaft','zitronensaftkonzentrat','zitronenabrieb','zitronenöl',
  'limette','limettensaft',
  'traube','trauben','traubensaft','weintrauben','rosinen','korinthen',
  'cranberry','cranberrysaft','preiselbeeren',
  'heidelbeere','heidelbeeren','brombeere','brombeeren',
  'himbeere','himbeeren','erdbeere','erdbeeren','erdbeermark',
  'kirschen','sauerkirschen','morellen',
  'pfirsich','pfirsiche','nektarine','aprikose','aprikosen',
  'pflaume','pflaumen','zwetschge','zwetschgen','mirabelle','mirabellen',
  'mango','mangos','mangopüree','mangokonzentrat',
  'ananas','ananassaft','ananasstücke','ananasmark',
  'papaya','papayapulver','passionsfrucht','maracuja','granatapfel','granatapfelsaft',
  'kokosnuss','kokosraspel','kokosfruchtfleisch','kokosmilch','kokoswasser','kokosmus','kokosflocken','wasser',
  'feige','feigen','dattel','datteln','dattelpaste',
  'frucht','früchte','fruchtmark','fruchtextrakt','fruchtpulver',
  'fruchtkonzentrat','fruchtsaft','fruchtzubereitung','fruchtpaste',

  // Nüsse & Samen
  'mandel','mandeln','mandelmus','mandelöl','mandelmehl','blanchierte mandeln',
  'haselnuss','haselnüsse','haselnussmus','haselnussöl','haselnussmehl',
  'walnuss','walnüsse','walnussöl',
  'paranuss','paranüsse','brasilianernuss',
  'cashew','cashewkerne','cashewmus','cashewöl',
  'pistazie','pistazien','pistazienmus','pistazienöl',
  'pecan','pecannüsse','macadamia','macadamianüsse','macadamiaöl',
  'erdnuss','erdnüsse','erdnussöl','erdnussmus','erdnussmehl','entölte erdnüsse',
  'sonnenblumenkerne','sonnenblumenkernmehl','sonnenblumenöl',
  'kürbiskerne',
  'leinsamen','leinsamenmehl','leinsamenöl','hanfsamen','hanföl','hanfmehl',
  'chia','chia samen','chiaöl','chiasamen',
  'sesam','sesamsamen','sesamöl',
  'mohn','mohnsamen','mohnöl','sultaninen','johannisbrot','johannisbrotkernmehl',
  'flohsamen','flohsamenschalen','psyllium','psyllium husk',

  // Kräuter & Gewürze
  'pfeffer','pfefferkorn','schwarzer pfeffer','weißer pfeffer','grüner pfeffer',
  'kurkuma','kurkumaextrakt','curcuma','curcumin',
  'ingwer','ingwerwurzel','ingwerpulver','ingwerextrakt',
  'muskat','muskatnuss','macis',
  'kardamom','kardamomkapseln',
  'nelke','nelken','gewürznelken',
  'zimt','zimtrinde','ceylon zimt','cassia zimt','cinnamon',
  'anisbio','anis','sternanis',
  'koriander','koriandersamen','korianderpulver','coriander',
  'kümmel','kümmelsamen','caraway',
  'thyme','thymian','rosemary','rosmarin','oregano','basilikum','basil',
  'petersilie','petersil','dill','schnittlauch','lovage','liebstöckel',
  'majoran','salbei','minze','pfefferminze','peppermint',
  'schwarzkümmel',
  'safran','vanille','vanilleschote','vanilleextrakt','vanillin',
  'sumach','sumak',

  // Gewürzmischungen
  'gewürze','gewürzextrakte','gewürzmischung','curry','masala','garam masala',

  // Getränke & Extrakte
  'kaffee','kaffeepulver','kaffeextrakt','kaffeebohnen',
  'löslicher kaffee','instantkaffee','espresso','espressopulver',
  'tee','teeblätter','teepulver','grüner tee','schwarzer tee',
  'früchtetee','kräutertee','rooibos',
  'kakaopulver','kakao','kakaomasse','kakaobutter','cacao',
  'schokolade','zartbitterschokolade','vollmilchschokolade','kuvertüre',
  'gerstenmalz','gerstenextrakt','hopfen','hopfenextrakt',
  'rosmarinnextrakt','rosmarin-extrakt','rosmarinextrakt',

  // Fermentierte Produkte
  'tempeh','miso','misopaste','misoextrakt',
  'sojasauce','sojasoße','shoyu','tamari',
  'fermentierte sojabohnen','fermentierte schwarze bohnen',
  'kefir','kimchi','sauerkraut','fermentiertes',
  'essig','weinessig','apfelessig','balsamessig','balsamico',
  'branntweinessig','reissessig','rotweinessig',

  // Hülsenfrüchte & Soja
  'sojaprodukt','sojadrink','sojamehl','sojaprotein',
  'sojaproteinisolat','sojaproteinkonzentrat','sojaeiweiß','sojagranulat',
  'sojalezithin','sojalecithin','sojabohnenlecithin',
  'tofu','tofuprodukt','seidentofu',
  'bean sprouts',

  // Lebensmittelzusatzstoffe
  'lecithin','sojalecithin','sonnenblumenlecithin','rapslecithin','raps-lecithin',
  'emulgator','emulgatoren',
  'säuerungsmittel','citronensäure','zitronensäure',
  'äpfelsäure','weinsäure','milchsäure','fumarsäure','phosphorsäure',
  'natriumcitrat','kaliumcitrat','calciumcitrat',
  'natriumcarbonat','natriumhydrogencarbonat','soda','natron',
  'kaliumcarbonat','kaliumhydrogencarbonat',
  'calciumcarbonat','kalk',
  'magnesiumcarbonat','magnesiumoxid',
  'salz','speisesalz','meersalz','jodsalz','jodiertes speisesalz',
  'natriumchlorid','calciumchlorid','magnesiumchlorid','kaliumchlorid',
  'phosphat','natriumphosphat','calciumphosphat','dicalciumphosphat',
  'polyphosphat','natriumpolyphosphat','tripolyphosphat',
  'diphosphat','natriumdiphosphat','dinatriumdiphosphat',
  'natriumnitrit','natriumnitrat','kaliumnitrat',
  'sulfit','natriumsulfit','natriummetabisulfit','schwefeldioxid',
  'konservierungsstoff','konservierungsmittel','säureregulator',
  'feuchthaltemittel','festigungsmittel',
  'sorbat','kaliumsorbat','natriumsorbat','sorbinsäure',
  'benzoat','natriumbenzoat','kaliumbenzoat','benzoesäure',
  'natamycin','nisin',
  'antioxidant','ascorbinsäure','vitamin c',
  'natriumascorbat','calciumascorbat',
  'tocopherol','tocopherolkonzentrat','vitamin e',
  'citrat','acetat','tartrat','laktat','malat','fumarat',
  'natriumacetat','calciumacetat','kaliumacetat',
  'natriumtartrat','kaliumtartrat',
  'guarkernmehl','guar','guarmehl','tara',
  'xanthan','xanthan gum','xanthanpulver',
  'carrageen','carrageenan',
  'agar','agar-agar',
  'cellulose','cellulosegummi',
  'natriumcarboxymethylcellulose','modifizierte stärke',
  'sonnenblumenwachs','candelillawachs','carnaubawachs','bienenwachs',
  'siliciumdioxid','silica',
  'calciumsilicat','magnesiumsilicat','talk','talkum',
  'süßungsmittel','süßstoff',
  'neohesperidin','steviolglycoside','steviaextrakt','stevia',
  'saccharin','saccharinnatrium','cyclamat',
  'aspartam','acesulfam','acesulfam k',
  'sucralose','polydextrose',
  'fruchtzubereitung','fruchtgrundstoff',

  // Aromen
  'aroma','aromen','natürliches aroma','natürliche aromen',
  'naturidentisches aroma','künstliches aroma','aromaextrakt',
  'ethylvanillin',
  'lecitin','lecitinhaltig','rapslecitin','sonnenblumenlecitin',
  'antioxidationsmittel','farbstoff','farbstoffe',
  'stabilisator','stabilisatoren','verdickungsmittel',
  'rauch','rauch-aroma','rauchflüssigkeit',
  'trägerstoff','füllstoff','füllmittel','trennmittel',
  'cumarin','kumarin',
  'kakaoaroma','schokoladenaroma','kaffeearoma','malzaroma',
  'fruchtaroma','beerenaroma','zitrusaroma',
  'rauch aroma','rauchkondensat',

  // Farbstoffe
  'farbstoff','farbstoffe','lebensmittelfarbe',
  'annatto','annattoextrakt',
  'karmin','cochineal',
  'paprikaextrakt','paprikafarbstoff','capsanthin',
  'beta-carotin','betacarotin','carotin',
  'lycopin',
  'chlorophyll','chlorophyllin',
  'zuckerkulör','caramel',
  'titandioxid',
  'riboflavin','vitamin b2',

  // Hefe & Getreide
  'hefe','hefeprodukt','hefeextrakt','hefepulver','hefekonzentrat',
  'hefeautolysat','bäckerhefe','hefeflocken',
  'malzkeime',
  'zuckerrüben','zuckerrübenschnitzel',
  'weizenkleie','reiskleie','haferkleie','kleie',
  'cerealien','getreide','getreidemehl','getreidefasern',

  // Sonstiges
  'backpulver','hefebackpulver','natron','natriumbicarbonat',
  'ammoniumcarbonat','ammoniumbicarbonat','hirschhornsalz',
  'speck','bacon','schinken','rohschinken','kochschinken','pastete',
  'hackfleisch','faschiertes',

  // Nahrungsergänzung
  'protein','proteinpulver','proteinisolat','proteinkonzentrat',
  'molkenprotein','molkenproteinisolat',
  'kollagen','kollagenpeptide','kollagenhydrolysat',
  'kreatin','kreatinmonohydrat',
  'vitamin','vitamine','vitaminkonzentrat',
  'vitamin d','cholecalciferol','vitamin d3',
  'vitamin b1','thiamin','vitamin b2',
  'vitamin b3','niacin','niacinamid','vitamin b5','pantothensäure',
  'vitamin b6','pyridoxin','vitamin b7','biotin',
  'vitamin b9','folsäure','folat','vitamin b12','cobalamin','cyanocobalamin',
  'methylcobalamin','inositol',
  'calcium','magnesium','zink','eisen','selen','chrom','jod','kupfer','mangan','molybdän',
  'omega-3','omega-3-fettsäuren',
  'epa','dha','algenöl',
  'carnitin','l-carnitin',
  'coenzym q10',
  'probiotika','probiotische kulturen',
  'ballaststoffe','ballaststoff','inulin',

  // Enzyme
  'enzyme','enzym','lactase','laktase','amylase','protease',
  'lipase','glucoamylase','transglutaminase','papain','bromelain',

  // Alkohol
  'ethanol','alkohol','weingeist',

  // Algen
  'algenmehl','algenextrakt','spirulinapulver',
  'chlorellapulver','wakamemehl','norialgen',
  'dulse','irish moss','kelp','kombu',

  // Begleitstoffe
  'maltodextrin','mannitol','sorbitol',
  'gummi arabicum','akaziengummi',
]);

// ── English ingredient names ─────────────────────────────────────────────────
const ENGLISH = new Set([
  'water','salt','sugar','dextrose','glucose','fructose','lactose','maltose',
  'sucrose','milk','cream','butter','cheese','yogurt','egg','eggs',
  'egg white','egg yolk','whey','whey protein','casein','sodium caseinate',
  'flour','wheat flour','rye flour','barley','oat','oats','spelt','buckwheat',
  'quinoa','amaranth','millet','rice','corn','maize','potato','tapioca',
  'soy','soybean','soy protein','soy lecithin','soybean oil','soy flour',
  'tofu','tempeh','miso','soy sauce','shoyu','tamari','edamame',
  'sunflower oil','sunflower seed','sunflower lecithin',
  'palm oil','palm fat','coconut oil','coconut milk','coconut cream',
  'olive oil','rapeseed oil','canola','corn oil','maize oil',
  'sesame','sesame oil','sesame seeds','tahini',
  'flax','flaxseed','linseed','flax oil','flaxseed oil',
  'hemp','hemp oil','hemp seed','hemp protein',
  'walnut','walnut oil','hazelnut','hazelnut oil','almond','almond oil',
  'cashew','pecan','macadamia','pistachio','pine nut',
  'peanut','peanut oil','peanut butter','groundnut',
  'apple','orange','lemon','lime','grape','cherry','strawberry',
  'blueberry','raspberry','blackberry','cranberry','currant',
  'banana','mango','papaya','pineapple','peach','apricot','plum',
  'date','fig','raisin','coconut','coconut water','coconut flesh',
  'carrot','onion','garlic','leek','shallot','pepper','chili',
  'cabbage','broccoli','cauliflower','kale','spinach','celery',
  'tomato','cucumber','lettuce','artichoke','asparagus','eggplant',
  'zucchini','pumpkin','squash','mushroom','mushrooms','champignon',
  'beetroot','beet','radish','turnip','fennel','parsley','coriander',
  'basil','oregano','thyme','rosemary','sage','mint','dill','chive',
  'cumin','turmeric','curcuma',
  'ginger','nutmeg','mace','cardamom','clove','cinnamon','vanilla',
  'cocoa','cacao','chocolate','cocoa butter','cocoa mass','cocoa powder',
  'coffee','espresso','tea','green tea','black tea',
  'honey','maple syrup','agave','molasses','malt','malt extract',
  'yeast','yeast extract','baking powder','bicarbonate','sodium bicarbonate',
  'gelatin','gelatine','collagen','collagen peptides',
  'fish','salmon','tuna','cod','sardine','anchovy','herring','mackerel',
  'shrimp','prawn','crab','lobster','scallop','mussel','clam','oyster',
  'algae','spirulina','chlorella','wakame','nori','kelp','dulse',
  'meat','beef','pork','lamb','mutton','chicken','turkey','duck','goose',
  'bacon','ham','sausage','minced meat','ground meat',
  'vinegar','wine vinegar','apple cider vinegar','balsamic',
  'whey protein isolate','whey protein concentrate',
  'milk protein','milk protein concentrate','milk powder',
  'skimmed milk powder','skim milk powder','whole milk powder',
  'pectin','carrageenan','agar','xanthan gum','guar gum','locust bean gum',
  'gum arabic','acacia gum','cellulose','microcrystalline cellulose',
  'modified starch','tapioca starch','potato starch','corn starch','wheat starch',
  'lecithin','sunflower lecithin','rapeseed lecithin','soy lecithin',
  'emulsifier','emulsifiers','stabilizer','stabilizers',
  'thickener','thickening agent',
  'citric acid','sodium citrate','potassium citrate','calcium citrate',
  'ascorbic acid','sodium ascorbate','calcium ascorbate','vitamin c',
  'tocopherol','tocopherols','vitamin e',
  'beta-carotene','carotene','lutein','zeaxanthin',
  'sorbic acid','potassium sorbate','sodium sorbate',
  'sulfur dioxide','sulphite','sodium sulphite',
  'nitrite','sodium nitrite','nitrate','sodium nitrate',
  'phosphate','sodium phosphate','calcium phosphate','diphosphate',
  'salt','sea salt','rock salt','iodized salt','sodium chloride',
  'monosodium glutamate','msg','glutamate',
  'protein','protein powder','protein isolate','protein concentrate',
  'annatto','carminic acid','cochineal','carmine',
  'paprika extract','capsanthin','turmeric','curcumin',
  'sugar','syrup','glucose syrup','invert sugar',
  'polydextrose','inulin',
  'amylase','protease','lipase','cellulase','glucoamylase',
  'biotin','folic acid','folate','niacin','niacinamide',
  'pantothenic acid','pyridoxine','riboflavin','thiamine','thiamin',
  'cobalamin','cyanocobalamin','methylcobalamin',
  'cholecalciferol','vitamin d','vitamin d3',
  'retinol','vitamin a',
  'omega-3','omega-6','dha','epa','ala',
  'fish oil','cod liver oil','algal oil','algae oil',
  'calcium','magnesium','iron','zinc','selenium','chromium','copper','manganese','iodine','potassium',
  'silicon','silica','silicon dioxide',
  'coenzyme q10','coq10','ubiquinol',
  'l-carnitine','acetyl-l-carnitine','carnitine',
  'creatine','creatine monohydrate',
  'beta-alanine','bcaa','amino acids',
  'tryptophan','5-htp','gaba','melatonin','inositol',
  'probiotic','probiotics','lactobacillus','bifidobacterium',
  'prebiotic','prebiotics',
  'medium chain triglyceride','mct','mct oil',
  'oil','fat','fats','oils',
  'acid','fatty acid',
  'enzyme','enzymes','transglutaminase',
  'culture','cultures','starter culture',
  'spice','spices','herb','herbs',
  'extract','extracts','concentrate','concentrates',
  'powder','powders','dried','dehydrated',
  'natural','organic',
  'bay leaf','cardamom','celery seed','cloves','curry powder',
  'fennel seed','fenugreek','garam masala','garlic powder',
  'horseradish','lavender','lemongrass','marjoram','mustard',
  'mustard seed','nutmeg','orange peel','paprika','black pepper',
  'white pepper','poppy seed','saffron','star anise','tarragon',
  'vanilla bean','vanilla extract',
  'antioxidant','antioxidants','preservative','preservatives',
  'sweetener','sweeteners','thickeners',
  'emulsifier','emulsifiers',
]);

// ── French ingredient names ───────────────────────────────────────────────────
const FRENCH = new Set([
  'sucre','sel','eau','farine','beurre','crème','lait','poudre de lait',
  'fromage','yaourt','oeuf','oeufs','blanc d oeuf','jaune d oeuf',
  'huile','huile d olive','huile de tournesol','huile de colza','huile de coco',
  'huile de palme','huile de sésame','huile de lin','huile de mais',
  'vinaigre','vinaigre de vin','vinaigre de cidre','vinaigre balsamique',
  'levure','levure chimique','bicarbonate','bicarbonate de soude',
  'chocolat','cacao','beurre de cacao','masse de cacao','poudre de cacao',
  'café','extrait de café','café soluble','thé','extrait de thé',
  'miel','sirop','sirop de glucose','sirop de fructose','sirop d agave',
  'fructose','glucose','dextrose','saccharose','lactose','maltose',
  'amidon','amidon de maïs','amidon de pomme de terre','amidon modifié',
  'farine de blé','farine de seigle','farine de riz','farine de sarrasin',
  'avoine','flocons d avoine','son d avoine',
  'protéine','protéine de lait','protéine de soja','protéine de pois',
  'graisse','graisse végétale','graisse animale','matière grasse',
  'viande','bœuf','porc','poulet','dinde','agneau',
  'poisson','saumon','thon','cabillaud','morue','sardine','anchois','hareng',
  'crevette','crabe','homard','moule','huître',
  'légume','légumes','tomate','oignon','ail','poireau','carotte','céleri',
  'poivron','piment','brocoli','chou','chou-fleur',
  'épinard','laitue','concombre','courgette','aubergine','artichaut',
  'fruit','fruits','pomme','poire','banane','raisin','cerise','fraise',
  'framboise','myrtille','cranberry','pêche','abricot','prune',
  'mangue','papaye','ananas','datte','figue','raisin sec',
  'noix','amande','noisette','noix de cajou','pistache',
  'graine','graine de lin','graines de chia','graines de sésame',
  'arachide','beurre d arachide','huile d arachide',
  'soja','lécithine de soja','huile de soja',
  'tofu','tempeh','miso','sauce de soja','shoyu','tamari',
  'émulsifiant','émulsificateurs','stabilisant','épaississant',
  'acidifiant','régulateur d acidité','antioxydants','antioxygène',
  'conservateur','conservateurs','édulcorant','édulcorants',
  'lécithine','lécithine de tournesol','lécithine de soja','lécithine de colza',
  'arôme','arômes','arôme naturel','arômes naturels',
  'colorant','colorants',
  'carraghénane','gomme','gomme arabique','gomme xanthane',
  'guar','tara','psyllium',
  'cellulose','méthylcellulose',
  'lactosérum','poudre de lactosérum','babeurre',
  'crème fraîche','fromage fondu',
  'malt','extrait de malt','sirop de malt',
  'fibres','fibres alimentaires','pectine','inuline',
  'culture','cultures','culture lactique','ferments lactiques',
  'enzyme','enzymes','transglutaminase',
  'vitamine','vitamines','minéral','minéraux',
  'oméga-3','dha','epa','ala',
  'huile de poisson','huile d algues','spirulline','chlorelle','wakam','nori','kelp',
  'extrait de romarin',
  'coenzyme q10','ubiquinol',
  'l-carnitine','carnitine','créatine',
  'probiotique','probiotiques','prébiotique','prébiotiques','lactobacillus','bifidobacterium',
  'gélatine','collagène','peptides de collagène',
]);

// ── E-number whitelist ────────────────────────────────────────────────────────
function generateENumbers(): Set<string> {
  const s = new Set<string>();
  for (let n = 100; n <= 199; n++) {
    s.add('e' + n);
    s.add('e' + n + 'a');
    s.add('e' + n + 'b');
  }
  for (let n = 200; n <= 299; n++) s.add('e' + n);
  for (let n = 300; n <= 399; n++) s.add('e' + n);
  for (let n = 400; n <= 499; n++) s.add('e' + n);
  for (let n = 500; n <= 599; n++) s.add('e' + n);
  for (let n = 600; n <= 699; n++) s.add('e' + n);
  for (let n = 700; n <= 799; n++) s.add('e' + n);
  for (let n = 800; n <= 899; n++) s.add('e' + n);
  for (let n = 900; n <= 999; n++) s.add('e' + n);
  for (let n = 1100; n <= 1799; n++) s.add('e' + n);
  return s;
}

const KNOWN_INGREDIENTS = new Set<string>([
  ...GERMAN,
  ...ENGLISH,
  ...FRENCH,
  ...generateENumbers(),
]);

function isKnownIngredient(normalized: string): boolean {
  if (!normalized || normalized.length < 2) return false;
  return KNOWN_INGREDIENTS.has(normalized);
}

const FUNCTIONAL_LABELS = new Set([
  'emulgator','emulgatoren',
  'antioxidationsmittel','antioxidant',
  'säureregulator',
  'säuerungsmittel',
  'verdickungsmittel',
  'feuchthaltemittel',
  'festigungsmittel',
  'konservierungsstoff','konservierungsmittel',
]);

const PLACEHOLDER_NAMES = new Set(['xxx', 'unknown', 'none', 'n/a', 'to be completed', '-']);

export interface ParsedIngredient {
  raw: string;
  canonical: string;
}

/**
 * Returns true if the product name is non-empty and not a known placeholder.
 */
export function isValidProductName(name: unknown): boolean {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length < 2) return false;
  return !PLACEHOLDER_NAMES.has(t.toLowerCase());
}

/**
 * Walks the raw ingredient string and returns a flat list of token strings.
 * depth 0/1 → emit; depth > 1 → discard (percentage info inside nested parens).
 */
function flattenIngredients(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') {
      if (depth === 0 && current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      depth++;
    } else if (ch === ')') {
      if (depth === 1 && current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      if (depth > 0) depth--;
    } else if (ch === ',') {
      if (depth <= 1) {
        let token = current.trim();
        const rest = text.slice(i + 1);
        const pctMatch = rest.match(/^\d+[,.]?\d*\s*%/);
        if (pctMatch) {
          token = token.replace(/\d+$/, '').trim();
        }
        if (token) tokens.push(token);
        current = '';
      }
    } else if (ch === ';') {
      if (depth <= 1) {
        if (current.trim()) tokens.push(current.trim());
        current = '';
      }
    } else {
      if (depth <= 1) current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

/**
 * Parses a raw ingredients text string into an array of normalized ingredient objects.
 */
export function parseIngredients(text: unknown): ParsedIngredient[] {
  if (!text || typeof text !== 'string') return [];

  const flatTokens = flattenIngredients(text);

  const segments: string[] = [];
  for (const token of flatTokens) {
    if (token.includes(':')) {
      const parts = token.split(':');
      if (parts.length === 2) {
        const label = parts[0].trim();
        const specific = parts[1].trim();
        const labelLower = label.toLowerCase();
        const specificLower = specific.toLowerCase();

        if (isKnownIngredient(specificLower)) {
          if (FUNCTIONAL_LABELS.has(labelLower)) {
            segments.push(specific);
          } else {
            segments.push(label, specific);
          }
        } else {
          segments.push(label, specific);
        }
      } else {
        const filtered = token.split(':').filter(p => !FUNCTIONAL_LABELS.has(p.trim().toLowerCase()));
        segments.push(...filtered);
      }
    } else {
      segments.push(token);
    }
  }

  const seen = new Set<string>();
  const result: ParsedIngredient[] = [];

  for (const rawSegment of segments) {
    let seg = rawSegment.trim();
    if (!seg) continue;

    // Step 1: Strip remaining parenthetical content
    let prev: string;
    do {
      prev = seg;
      seg = seg.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    } while (seg !== prev && seg.includes('('));

    // Step 2: Remove trailing percentages
    seg = seg.replace(/\d+[,.]?\d*\s*%\s*/g, '').trim();

    // Step 3: Normalize internal hyphens
    seg = seg.replace(/([a-zäöüß])\s*-\s+([a-zäöüß])/gi, '$1$2').trim();
    seg = seg.replace(/([a-zäöüß])\s+-\s+([A-ZÄÖÜ])/g, '$1$2').trim();

    // Step 4: Remove encoding artifacts
    seg = seg.replace(/([a-zäöüß])\s*-\s+(?=[a-zäöüß])/gi, '$1').trim();

    // Step 5: Collapse multiple spaces/dashes/underscores
    seg = seg.replace(/\s{2,}/g, ' ').replace(/[_—–-]{2,}/g, ' ').trim();

    // Step 6: Clean Unicode artifacts
    seg = seg.replace(/[×•°©®™¹²³⁴⁵⁶⁷⁸⁹@#$%^&®]+/g, ' ').trim();

    // Step 7: Normalize E-number format
    seg = seg.replace(/^e\s*(\d+[a-z]?)\s*$/i, 'e$1').trim();

    // Step 8: Remove digit-starting tokens
    seg = seg.replace(/^[\d,.]+\s*/g, '').trim();
    if (!seg || /^\d+$/.test(seg)) continue;

    // Step 9: Remove short/non-alphabetic garbage
    if (seg.length < 2) continue;
    if (/^[^a-zäöüß]+$/i.test(seg)) continue;

    // Step 10: Lowercase for canonical form
    const canonical = seg.toLowerCase();

    // Step 11: Deduplicate
    if (seen.has(canonical)) continue;
    seen.add(canonical);

    // Step 12: Whitelist check
    if (!isKnownIngredient(canonical)) continue;

    // Step 12b: Skip standalone functional labels
    if (FUNCTIONAL_LABELS.has(canonical)) continue;

    result.push({ raw: rawSegment.trim(), canonical });
  }

  return result;
}
