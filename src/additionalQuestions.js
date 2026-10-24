// Curated wine questions generated from unique, reviewed concepts.
// Each concept produces exactly one question. Distractors are selected only
// from a comparable subgroup, and every answer teaches why it is right or wrong.

const REGION_FACTS = [
  {
    "conceptId": "region:vouvray, france",
    "region": "Vouvray, France",
    "association": "Chenin Blanc in styles from dry to sweet and sparkling",
    "explanation": "Vouvray in the Loire Valley is based on Chenin Blanc and can produce still or sparkling wines across sweetness levels.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:muscadet sèvre et maine, france",
    "region": "Muscadet Sèvre et Maine, France",
    "association": "Melon de Bourgogne, often aged on its lees",
    "explanation": "Muscadet Sèvre et Maine is made from Melon de Bourgogne and is often labeled sur lie.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:beaujolais, france",
    "region": "Beaujolais, France",
    "association": "Gamay-based red wine",
    "explanation": "Beaujolais is best known for red wines made from Gamay.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:côte-rôtie, france",
    "region": "Côte-Rôtie, France",
    "association": "Syrah, with limited Viognier co-fermentation permitted",
    "explanation": "Côte-Rôtie is a Northern Rhône appellation centered on Syrah; a small proportion of Viognier may be co-fermented.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:condrieu, france",
    "region": "Condrieu, France",
    "association": "Still white wine made from Viognier",
    "explanation": "Condrieu is a Northern Rhône appellation devoted to Viognier.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:bandol, france",
    "region": "Bandol, France",
    "association": "Mourvèdre-led red wine",
    "explanation": "Bandol in Provence is especially associated with structured red wines led by Mourvèdre.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:provence, france",
    "region": "Provence, France",
    "association": "Dry rosé as a signature regional style",
    "explanation": "Provence is internationally identified with pale, dry rosé, though it also makes red and white wine.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:vin jaune in the jura, france",
    "region": "Vin Jaune in the Jura, France",
    "association": "Savagnin aged under a veil of yeast",
    "explanation": "Vin Jaune is a Jura specialty made from Savagnin and matured oxidatively under a yeast veil.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:brunello di montalcino, italy",
    "region": "Brunello di Montalcino, Italy",
    "association": "Sangiovese-based red wine",
    "explanation": "Brunello di Montalcino in Tuscany is made from Sangiovese, locally known as Brunello.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:soave, italy",
    "region": "Soave, Italy",
    "association": "Garganega-led white wine",
    "explanation": "Soave in Veneto is based primarily on Garganega.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:verdicchio dei castelli di jesi, italy",
    "region": "Verdicchio dei Castelli di Jesi, Italy",
    "association": "White wine based on Verdicchio",
    "explanation": "This Marche appellation is centered on the Verdicchio grape.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:etna rosso, italy",
    "region": "Etna Rosso, Italy",
    "association": "Nerello Mascalese-led volcanic red wine",
    "explanation": "Etna Rosso from Sicily is led by Nerello Mascalese, often with Nerello Cappuccio.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:taurasi, italy",
    "region": "Taurasi, Italy",
    "association": "Aglianico-based red wine",
    "explanation": "Taurasi in Campania is made principally from Aglianico.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:gavi, italy",
    "region": "Gavi, Italy",
    "association": "Cortese-based white wine",
    "explanation": "Gavi in Piedmont is made from the Cortese grape.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:valpolicella, italy",
    "region": "Valpolicella, Italy",
    "association": "Corvina-led red blends",
    "explanation": "Valpolicella wines from Veneto are commonly led by Corvina with other local grapes.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:franciacorta, italy",
    "region": "Franciacorta, Italy",
    "association": "Bottle-fermented Italian sparkling wine made from Chardonnay, Pinot Nero, and Pinot Bianco",
    "explanation": "Franciacorta is an Italian appellation for bottle-fermented sparkling wine.",
    "subGroup": "italy"
  },
  {
    "conceptId": "region:rías baixas, spain",
    "region": "Rías Baixas, Spain",
    "association": "Albariño-based Atlantic white wine",
    "explanation": "Rías Baixas in Galicia is strongly associated with Albariño.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:rueda, spain",
    "region": "Rueda, Spain",
    "association": "Verdejo-based white wine",
    "explanation": "Rueda is a Spanish appellation best known for Verdejo.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:ribera del duero, spain",
    "region": "Ribera del Duero, Spain",
    "association": "Tempranillo-based red wine known locally as Tinto Fino",
    "explanation": "Ribera del Duero is centered on Tempranillo, commonly called Tinto Fino or Tinta del País there.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:priorat, spain",
    "region": "Priorat, Spain",
    "association": "Powerful reds often blending Garnacha and Cariñena",
    "explanation": "Priorat in Catalonia is known for concentrated reds based largely on Garnacha and Cariñena.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:vinho verde, portugal",
    "region": "Vinho Verde, Portugal",
    "association": "Light, zesty, high-acid white wines—often with a slight spritz—made from grapes like Alvarinho and Loureiro",
    "explanation": "Vinho Verde is known especially for light, fresh white wines with bright acidity.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:madeira, portugal",
    "region": "Madeira, Portugal",
    "association": "Fortified wine deliberately exposed to heat and oxygen",
    "explanation": "Madeira's distinctive fortified wines undergo controlled heating and oxidative aging.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:dão, portugal",
    "region": "Dão, Portugal",
    "association": "Structured reds often featuring Touriga Nacional",
    "explanation": "The Dão region makes distinctive reds from Portuguese varieties including Touriga Nacional.",
    "subGroup": "iberia"
  },
  {
    "conceptId": "region:rheingau, germany",
    "region": "Rheingau, Germany",
    "association": "Structured, ageworthy Riesling ranging from dry to sweet",
    "explanation": "The Rheingau is a classic German Riesling region.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:wachau, austria",
    "region": "Wachau, Austria",
    "association": "Dry Grüner Veltliner and Riesling labeled with terms such as Steinfeder, Federspiel, and Smaragd",
    "explanation": "The Wachau is known for dry Grüner Veltliner and Riesling.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:burgenland, austria",
    "region": "Burgenland, Austria",
    "association": "Blaufränkisch reds and notable sweet wines",
    "explanation": "Burgenland is important for Blaufränkisch and for sweet wines around Lake Neusiedl.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:tokaj, hungary",
    "region": "Tokaj, Hungary",
    "association": "Furmint-led wines including botrytized Tokaji Aszú",
    "explanation": "Tokaj is famed for Furmint-based wines and the historic sweet style Tokaji Aszú.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:santorini, greece",
    "region": "Santorini, Greece",
    "association": "High-acid Assyrtiko from volcanic soils",
    "explanation": "Santorini is closely associated with Assyrtiko trained in low basket-shaped vines.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:nemea, greece",
    "region": "Nemea, Greece",
    "association": "Agiorgitiko-based red wine",
    "explanation": "Nemea in the Peloponnese is the leading appellation for Agiorgitiko.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:naoussa, greece",
    "region": "Naoussa, Greece",
    "association": "Xinomavro-based red wine",
    "explanation": "Naoussa in northern Greece is centered on Xinomavro.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:napa valley, california",
    "region": "Napa Valley, California",
    "association": "Cabernet Sauvignon as a flagship red grape",
    "explanation": "Napa Valley is globally recognized for Cabernet Sauvignon, alongside many other styles.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:sonoma coast, california",
    "region": "Sonoma Coast, California",
    "association": "Cool-climate Pinot Noir and Chardonnay",
    "explanation": "The Sonoma Coast appellation is particularly associated with cool-climate Pinot Noir and Chardonnay.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:willamette valley, oregon",
    "region": "Willamette Valley, Oregon",
    "association": "Pinot Noir as the signature red grape",
    "explanation": "Oregon's Willamette Valley is best known for Pinot Noir.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:walla walla valley, washington and oregon",
    "region": "Walla Walla Valley, Washington and Oregon",
    "association": "Cabernet Sauvignon and Syrah among its leading reds",
    "explanation": "Walla Walla Valley spans Washington and Oregon and is known for several red grapes, including Cabernet Sauvignon and Syrah.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:finger lakes, new york",
    "region": "Finger Lakes, New York",
    "association": "Cool-climate Riesling",
    "explanation": "New York's Finger Lakes region is especially noted for Riesling.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:salta, argentina",
    "region": "Salta, Argentina",
    "association": "High-altitude Torrontés and red wines",
    "explanation": "Salta, especially the Calchaquí Valleys, is known for high vineyards and aromatic Torrontés.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:colchagua valley, chile",
    "region": "Colchagua Valley, Chile",
    "association": "Carménère and other warm-climate reds",
    "explanation": "Colchagua is especially associated with Chilean red varieties including Carménère.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:niagara peninsula, canada",
    "region": "Niagara Peninsula, Canada",
    "association": "Icewine and cool-climate table wines",
    "explanation": "Ontario's Niagara Peninsula is renowned for icewine and also produces diverse still and sparkling wines.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:okanagan valley, canada",
    "region": "Okanagan Valley, Canada",
    "association": "Dry, sunny vineyards supporting many cool-climate varieties",
    "explanation": "British Columbia's Okanagan Valley combines northern latitude with a dry interior climate.",
    "subGroup": "north-america"
  },
  {
    "conceptId": "region:barossa valley, australia",
    "region": "Barossa Valley, Australia",
    "association": "Rich Shiraz as a signature style",
    "explanation": "South Australia's Barossa Valley is famous for Shiraz, including wines from old vines.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:clare valley, australia",
    "region": "Clare Valley, Australia",
    "association": "Dry Riesling with high acidity",
    "explanation": "Clare Valley is one of Australia's classic regions for dry Riesling.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:hunter valley, australia",
    "region": "Hunter Valley, Australia",
    "association": "Ageworthy dry Semillon",
    "explanation": "Hunter Valley Semillon is noted for developing complexity with bottle age despite modest alcohol.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:margaret river, australia",
    "region": "Margaret River, Australia",
    "association": "Cabernet Sauvignon and Chardonnay",
    "explanation": "Western Australia's Margaret River is highly regarded for Cabernet Sauvignon and Chardonnay.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:coonawarra, australia",
    "region": "Coonawarra, Australia",
    "association": "Cabernet Sauvignon on terra rossa soils",
    "explanation": "Coonawarra is known for Cabernet Sauvignon and its strip of terra rossa soil over limestone.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:tasmania, australia",
    "region": "Tasmania, Australia",
    "association": "Cool-climate sparkling wine, Pinot Noir, and Chardonnay",
    "explanation": "Tasmania's cool climate suits sparkling wine and varieties such as Pinot Noir and Chardonnay.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:marlborough, new zealand",
    "region": "Marlborough, New Zealand",
    "association": "Sauvignon Blanc as the signature export style",
    "explanation": "Marlborough established New Zealand's global reputation for pungent Sauvignon Blanc.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:central otago, new zealand",
    "region": "Central Otago, New Zealand",
    "association": "Pinot Noir from a cool, inland region",
    "explanation": "Central Otago is the world's southernmost major wine region and is best known for Pinot Noir.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:hawke's bay, new zealand",
    "region": "Hawke's Bay, New Zealand",
    "association": "Syrah and Bordeaux-style red blends",
    "explanation": "Hawke's Bay is one of New Zealand's warmest major regions and is known for Syrah and Bordeaux varieties.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:stellenbosch, south africa",
    "region": "Stellenbosch, South Africa",
    "association": "Cabernet Sauvignon and Chenin Blanc among leading grapes",
    "explanation": "Stellenbosch is a leading South African region for structured reds and diverse whites.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:swartland, south africa",
    "region": "Swartland, South Africa",
    "association": "Chenin Blanc and Rhône varieties from dry-farmed sites",
    "explanation": "Swartland is known for old-vine Chenin Blanc and Mediterranean varieties.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:constantia, south africa",
    "region": "Constantia, South Africa",
    "association": "Historic sweet wine made from Muscat",
    "explanation": "Constantia's historic sweet wines are associated with Muscat, particularly Muscat de Frontignan.",
    "subGroup": "southern-hemisphere"
  },
  {
    "conceptId": "region:kakheti, georgia",
    "region": "Kakheti, Georgia",
    "association": "Traditional qvevri winemaking",
    "explanation": "Kakheti is Georgia's largest wine region and a center of traditional qvevri wine production.",
    "subGroup": "ancient-and-emerging"
  },
  {
    "conceptId": "region:yamanashi, japan",
    "region": "Yamanashi, Japan",
    "association": "Koshu as a signature white grape",
    "explanation": "Yamanashi is Japan's leading wine prefecture and is closely associated with Koshu.",
    "subGroup": "ancient-and-emerging"
  },
  {
    "conceptId": "region:ningxia, china",
    "region": "Ningxia, China",
    "association": "High-altitude vineyards near the Helan Mountains",
    "explanation": "Ningxia has emerged as a major Chinese fine-wine region along the Helan Mountain foothills.",
    "subGroup": "ancient-and-emerging"
  },
  {
    "conceptId": "region:bekaa valley, lebanon",
    "region": "Bekaa Valley, Lebanon",
    "association": "Historic red blends and white wines from a high-elevation Mediterranean valley",
    "explanation": "The Bekaa Valley is the historic center of Lebanese wine production.",
    "subGroup": "ancient-and-emerging"
  },
  {
    "conceptId": "region:savoie, france",
    "region": "Savoie, France",
    "association": "Light, high-acid whites made from Jacquère, Altesse, and other local grapes",
    "explanation": "Savoie in the French Alps is known for fresh white wines from local grapes including Jacquère.",
    "subGroup": "france"
  },
  {
    "conceptId": "region:ahr, germany",
    "region": "Ahr, Germany",
    "association": "Pinot Noir, locally called Spätburgunder",
    "explanation": "The small, northerly Ahr region is unusually focused on Spätburgunder.",
    "subGroup": "central-europe"
  },
  {
    "conceptId": "region:canary islands, spain",
    "region": "Canary Islands, Spain",
    "association": "Volcanic island wines from ungrafted vines",
    "explanation": "The Canary Islands are known for volcanic soils, distinctive local grapes, and many own-rooted vines.",
    "subGroup": "iberia"
  }
];

const TERM_FACTS = [
  {
    "conceptId": "term:pomace",
    "term": "pomace",
    "definition": "the skins, seeds, and other solids left after grapes are pressed",
    "explanation": "Pomace can be composted, distilled into spirits such as grappa, or reused in other products instead of being discarded.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:bâtonnage",
    "term": "bâtonnage",
    "definition": "stirring the lees during wine aging",
    "explanation": "Stirring fine lees can release compounds that build creaminess and body, especially in some barrel-aged white wines.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:cold soak",
    "term": "cold soak",
    "definition": "a cool pre-fermentation maceration used to extract color and aroma with little alcohol present",
    "explanation": "Because little alcohol is present before fermentation, a cold soak emphasizes water-soluble color and aroma extraction.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:tirage",
    "term": "tirage",
    "definition": "the addition of yeast and sugar that starts the second fermentation for traditional-method sparkling wine",
    "explanation": "The tirage addition creates the carbon dioxide that becomes trapped as bubbles during bottle fermentation.",
    "subGroup": "sparkling-production"
  },
  {
    "conceptId": "term:autolysis",
    "term": "autolysis",
    "definition": "the breakdown of yeast cells that can add bread or biscuit notes during lees aging",
    "explanation": "As yeast cells break down during lees aging, they can contribute brioche, biscuit, and pastry-like complexity.",
    "subGroup": "sparkling-production"
  },
  {
    "conceptId": "term:traditional method",
    "term": "traditional method",
    "definition": "a sparkling-wine process in which the second fermentation occurs in the bottle sold",
    "explanation": "Bottle fermentation and lees aging make this method especially suited to fine, complex sparkling wine.",
    "subGroup": "sparkling-production"
  },
  {
    "conceptId": "term:pétillant naturel",
    "term": "pétillant naturel",
    "definition": "sparkling wine bottled before its first fermentation has finished",
    "explanation": "Often shortened to pét-nat, this ancestral-method style captures bubbles by bottling before the first fermentation ends.",
    "subGroup": "sparkling-production"
  },
  {
    "conceptId": "term:solera",
    "term": "solera",
    "definition": "a fractional blending system that mixes younger wine with progressively older wine",
    "explanation": "Repeatedly blending younger wine into older tiers helps maintain a consistent mature house style over time.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:flor",
    "term": "flor",
    "definition": "a film of yeast that protects some Sherries from oxygen while shaping their flavor",
    "explanation": "Flor consumes oxygen and alcohol-related compounds, helping create the saline, nutty character of biologically aged Sherry.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:late harvest",
    "term": "late harvest",
    "definition": "wine made from grapes left on the vine longer to accumulate sugar and flavor",
    "explanation": "Extra hang time can raise sugar and flavor concentration, although the finished wine may be dry or sweet depending on fermentation.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:chaptalization",
    "term": "chaptalization",
    "definition": "adding sugar before or during fermentation to raise potential alcohol rather than sweetness",
    "explanation": "Where permitted, the goal is adequate alcohol after fermentation—not making the finished wine taste sweet.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:acidification",
    "term": "acidification",
    "definition": "adding acid to must or wine to increase freshness and lower pH",
    "explanation": "Winemakers may acidify warm-climate fruit to improve freshness, microbial stability, and balance.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:deacidification",
    "term": "deacidification",
    "definition": "reducing excessive acidity in must or wine",
    "explanation": "Reducing excessive acidity can make a sharply tart wine more balanced without adding sweetness.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:whole-cluster fermentation",
    "term": "whole-cluster fermentation",
    "definition": "fermenting grapes with some or all stems and bunches intact",
    "explanation": "Including stems and intact bunches can change tannin, aroma, and fermentation behavior, so winemakers use it selectively.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:destemming",
    "term": "destemming",
    "definition": "removing grapes from their stems before fermentation",
    "explanation": "Removing stems helps a winemaker control herbal flavors and stem-derived tannin before fermentation.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:crushing",
    "term": "crushing",
    "definition": "breaking grape skins to release juice before fermentation",
    "explanation": "Crushing breaks skins and releases juice, while destemming is the separate act of removing berries from stems.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:press wine",
    "term": "press wine",
    "definition": "wine obtained by applying pressure to fermented grape solids",
    "explanation": "Press wine is usually more tannic and structured than free-run wine, so it may be blended back in carefully.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:free-run juice",
    "term": "free-run juice",
    "definition": "juice or wine that flows without heavy pressing",
    "explanation": "Free-run liquid generally has softer tannin than press wine because it drains with little mechanical pressure.",
    "subGroup": "cellar-production"
  },
  {
    "conceptId": "term:acidity",
    "term": "acidity",
    "definition": "the component that gives wine freshness, tartness, and structural lift",
    "explanation": "Acidity makes wine refreshing, supports balance with sweetness, and contributes to aging potential.",
    "subGroup": "tasting-sensory"
  },
  {
    "conceptId": "term:aroma",
    "term": "aroma",
    "definition": "a smell perceived from wine, often including primary fruit or floral notes",
    "explanation": "Primary aromas often come from grapes, while fermentation and aging can add secondary and tertiary notes.",
    "subGroup": "tasting-sensory"
  },
  {
    "conceptId": "term:blind tasting",
    "term": "blind tasting",
    "definition": "evaluating wine without knowing its identity",
    "explanation": "Removing label cues helps tasters focus on evidence in the glass rather than reputation or price.",
    "subGroup": "tasting-format"
  },
  {
    "conceptId": "term:horizontal tasting",
    "term": "horizontal tasting",
    "definition": "comparing different wines from the same vintage or closely matched context",
    "explanation": "A horizontal lineup highlights differences among producers or sites while holding the vintage broadly constant.",
    "subGroup": "tasting-format"
  },
  {
    "conceptId": "term:vertical tasting",
    "term": "vertical tasting",
    "definition": "comparing multiple vintages of the same wine or producer",
    "explanation": "A vertical shows how one wine changes across growing seasons and bottle age.",
    "subGroup": "tasting-format"
  },
  {
    "conceptId": "term:cuvée",
    "term": "cuvée",
    "definition": "a selected blend or batch of wine",
    "explanation": "The word can identify a particular blend or bottling, but its precise significance depends on the producer and region.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:reserve",
    "term": "reserve",
    "definition": "a term suggesting special selection or aging whose legal meaning varies by place",
    "explanation": "Because reserve is not regulated everywhere, guests should look beyond the word to the producer's actual aging and selection practices.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:appellation",
    "term": "appellation",
    "definition": "a legally defined geographic wine origin with associated rules",
    "explanation": "Appellations connect wine to place and may regulate grapes, yields, production methods, or aging.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:protected designation of origin",
    "term": "Protected Designation of Origin",
    "definition": "an EU category linking a product to a defined place and production rules",
    "explanation": "PDO is the EU's broad legal framework for products whose identity and production are tied to a defined place.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:monopole",
    "term": "monopole",
    "definition": "a vineyard appellation or named site controlled by a single owner",
    "explanation": "Monopoles are especially notable in Burgundy, where most named vineyards are divided among many owners.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:négociant",
    "term": "négociant",
    "definition": "a merchant who buys grapes, must, or wine and sells wine under its own name",
    "explanation": "A négociant may make, blend, age, and market wine without owning every vineyard that supplied it.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:estate bottled",
    "term": "estate bottled",
    "definition": "wine produced and bottled by the estate from grapes it controls, subject to local legal definitions",
    "explanation": "Estate wording usually signals tighter control of growing and production, but the exact legal requirements depend on jurisdiction.",
    "subGroup": "labels-trade-and-format"
  },
  {
    "conceptId": "term:reduction",
    "term": "reduction",
    "definition": "aromas caused by limited oxygen exposure, sometimes resembling struck match or rotten egg",
    "explanation": "A little reduction may dissipate with air, while severe sulfur aromas can signal a cellar problem.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:aeration",
    "term": "aeration",
    "definition": "deliberately exposing wine to air",
    "explanation": "Controlled air exposure can open aromas, but excessive oxygen eventually risks oxidation.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:phenolics",
    "term": "phenolics",
    "definition": "a broad group of compounds including tannins, pigments, and many flavor-related substances",
    "explanation": "Phenolics influence color, bitterness, astringency, and aging behavior, especially in red wine.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:anthocyanins",
    "term": "anthocyanins",
    "definition": "the pigments responsible for much of a red grape skin's color",
    "explanation": "These red-blue pigments are extracted from skins and interact with tannins as red wine ages.",
    "subGroup": "cellar-chemistry"
  },
  {
    "conceptId": "term:brut",
    "term": "Brut",
    "definition": "a widely used dry sparkling-wine category with more sugar allowed than Extra Brut but less than Extra Dry",
    "explanation": "Brut is dry, but it generally allows more sugar than Extra Brut and less than Extra Dry.",
    "subGroup": "sparkling-sweetness"
  },
  {
    "conceptId": "term:extra brut",
    "term": "Extra Brut",
    "definition": "a very dry sparkling-wine category with less sugar than Brut but generally more than Brut Nature",
    "explanation": "Extra Brut signals a very low dosage range and a particularly dry sparkling-wine style.",
    "subGroup": "sparkling-sweetness"
  },
  {
    "conceptId": "term:demi-sec",
    "term": "Demi-Sec",
    "definition": "a sweet sparkling-wine category, sweeter than Extra Dry but less sweet than Doux",
    "explanation": "Demi-Sec contains noticeably more sugar than Brut and is often paired with fruit or lightly sweet desserts.",
    "subGroup": "sparkling-sweetness"
  },
  {
    "conceptId": "term:magnum",
    "term": "magnum",
    "definition": "a wine bottle holding 1.5 liters, equal to two standard bottles",
    "explanation": "A 1.5-liter magnum equals two standard bottles and can age wine slowly because it has less oxygen relative to its volume.",
    "subGroup": "bottle-format"
  }
];

// These comparable concepts improve distractors without adding more questions.
const TERM_DISTRACTOR_FACTS = [
  {
    conceptId: 'distractor:brut-nature',
    term: 'Brut Nature / Zero Dosage',
    definition: 'the driest sparkling-wine category, with little or no added dosage',
    subGroup: 'sparkling-sweetness'
  },
  {
    conceptId: 'distractor:extra-dry',
    term: 'Extra Dry',
    definition: 'a sparkling-wine category that is sweeter than Brut despite its name',
    subGroup: 'sparkling-sweetness'
  },
  {
    conceptId: 'distractor:doux',
    term: 'Doux',
    definition: 'the sweetest standard sparkling-wine category',
    subGroup: 'sparkling-sweetness'
  },
  {
    conceptId: 'distractor:tannin',
    term: 'tannin',
    definition: 'the group of phenolic compounds that creates drying and astringent sensations',
    subGroup: 'tasting-sensory'
  },
  {
    conceptId: 'distractor:body',
    term: 'body',
    definition: 'the perceived weight and fullness of a wine in the mouth',
    subGroup: 'tasting-sensory'
  },
  {
    conceptId: 'distractor:bouquet',
    term: 'bouquet',
    definition: "a wine's developed aromas, especially those associated with fermentation and aging",
    subGroup: 'tasting-sensory'
  },
  {
    conceptId: 'distractor:finish',
    term: 'finish',
    definition: 'the flavors and sensations that linger after wine is swallowed or tasted',
    subGroup: 'tasting-sensory'
  },
  {
    conceptId: 'distractor:double-blind-tasting',
    term: 'double-blind tasting',
    definition: 'evaluating wine with neither its identity nor the possible lineup disclosed',
    subGroup: 'tasting-format'
  },
  {
    conceptId: 'distractor:barrel-tasting',
    term: 'barrel tasting',
    definition: 'sampling unfinished wine directly from barrel before bottling',
    subGroup: 'tasting-format'
  }
];

const hashText = (value) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const chooseComparableDistractors = (items, item, answerKey) =>
  items
    .filter((candidate) =>
      candidate.conceptId !== item.conceptId
      && candidate.subGroup === item.subGroup
    )
    .map((candidate) => ({
      candidate,
      rank: hashText(`${item.conceptId}|${candidate.conceptId}`)
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map(({ candidate }) => candidate);

const placeAnswer = (correctAnswer, wrongAnswers, conceptId) => {
  const options = [...wrongAnswers];
  options.splice(hashText(conceptId) % 4, 0, correctAnswer);
  return options;
};

const capitalizeFirst = (value) =>
  value ? `${value[0].toLocaleUpperCase()}${value.slice(1)}` : value;

const COMMON_ASSOCIATION_STARTS = new Set([
  'Ageworthy',
  'Alpine',
  'Bottle-fermented',
  'Cool-climate',
  'Dry',
  'Fortified',
  'Fresh',
  'High-acid',
  'High-altitude',
  'Historic',
  'Icewine',
  'Light',
  'Powerful',
  'Rich',
  'Still',
  'Structured',
  'Traditional-method',
  'Traditional',
  'Volcanic',
  'White'
]);

const formatInlineAssociation = (association) => {
  const firstWord = association.match(/^[\p{L}-]+/u)?.[0];
  return COMMON_ASSOCIATION_STARTS.has(firstWord)
    ? `${association[0].toLocaleLowerCase()}${association.slice(1)}`
    : association;
};

const REGION_PROMPTS = {
  'Franciacorta, Italy':
    'Which region is known for bottle-fermented Italian sparkling wine made from Chardonnay, Pinot Nero, and Pinot Bianco?',
  'Rías Baixas, Spain':
    'Which region is renowned for intensely aromatic, high-acid white wines centered on Albariño, often showing citrus, stone fruit, and saline notes?',
  'Vinho Verde, Portugal':
    'Which region is known for light, zesty, high-acid white wines—often with a slight spritz—made from grapes like Alvarinho and Loureiro?',
  'Rheingau, Germany':
    'Which region is renowned for structured, ageworthy Riesling ranging from dry to sweet?',
  'Wachau, Austria':
    'Which region is known for dry Grüner Veltliner and Riesling labeled with terms such as Steinfeder, Federspiel, and Smaragd?',
  'Verdicchio dei Castelli di Jesi, Italy':
    'Which Italian appellation is known for crisp Adriatic white wines with citrus, fennel, and a subtle almond note?',
  'Bekaa Valley, Lebanon':
    'Which historic Middle Eastern valley, home to Roman temple ruins at Baalbek and high-elevation vineyards, anchors its country\'s wine industry?',
  'Savoie, France':
    'Which region is known for light, high-acid whites made from Jacquère, Altesse, and other local grapes?'
};

const SPECIAL_REGION_WRONG_ANSWERS = {
  'Verdicchio dei Castelli di Jesi, Italy': [
    'Brunello di Montalcino, Italy',
    'Franciacorta, Italy',
    'Etna Rosso, Italy'
  ]
};

const regionQuestions = REGION_FACTS.map((item) => {
  const specialRegions = SPECIAL_REGION_WRONG_ANSWERS[item.region];
  const distractors = specialRegions
    ? specialRegions.map((region) =>
      REGION_FACTS.find((candidate) => candidate.region === region)
    )
    : chooseComparableDistractors(REGION_FACTS, item, 'region');
  const wrongAnswerExplanations = Object.fromEntries(
    distractors.map((candidate) => [
      candidate.region,
      `${candidate.region} is instead associated with ${formatInlineAssociation(candidate.association)}.`
    ])
  );

  return {
    conceptId: item.conceptId,
    category: 'world-wine-regions',
    question: REGION_PROMPTS[item.region]
      || `A wine traveler is looking for ${formatInlineAssociation(item.association)}. Which region should be on the itinerary?`,
    options: placeAnswer(
      item.region,
      distractors.map((candidate) => candidate.region),
      item.conceptId
    ),
    correctAnswer: item.region,
    explanation: item.explanation,
    wrongAnswerExplanations
  };
});

const termPromptLead = {
  'cellar-production': 'A cellar note describes',
  'sparkling-production': 'During sparkling-wine production, a winemaker describes',
  'sparkling-sweetness': 'On a sparkling-wine label, a guest encounters',
  'cellar-chemistry': 'In the cellar, a winemaker describes',
  'tasting-sensory': 'At a guided tasting, the host describes',
  'tasting-format': 'At a guided tasting, the host describes',
  'labels-trade-and-format': 'On a label or trade sheet, a guest encounters',
  'bottle-format': 'In a discussion of bottle formats, a guest encounters'
};

const SPECIAL_TERM_CHOICES = {
  'whole-cluster fermentation': {
    wrongAnswers: [
      'destemmed-berry fermentation',
      'pre-fermentation cold soak',
      'intracellular carbonic maceration'
    ],
    explanations: {
      'destemmed-berry fermentation':
        'Destemmed-berry fermentation removes stems rather than keeping bunches intact.',
      'pre-fermentation cold soak':
        'A cold soak holds crushed fruit at low temperature before alcoholic fermentation.',
      'intracellular carbonic maceration':
        'Carbonic maceration begins inside intact berries in a carbon-dioxide-rich environment.'
    }
  },
  'Protected Designation of Origin': {
    wrongAnswers: [
      'Protected Geographical Indication',
      'Traditional Speciality Guaranteed',
      'Geographical indication without production rules'
    ],
    explanations: {
      'Protected Geographical Indication':
        'PGI also links a product to place, but generally requires a less complete connection than PDO.',
      'Traditional Speciality Guaranteed':
        'TSG protects a traditional recipe or production method rather than a defined geographic origin.',
      'Geographical indication without production rules':
        'A PDO includes defined origin and production requirements rather than place-name use alone.'
    }
  },
  magnum: {
    wrongAnswers: [
      'split / piccolo (187.5 mL)',
      'demi / half-bottle (375 mL)',
      'double magnum / Champagne jeroboam (3.0 L)'
    ],
    explanations: {
      'split / piccolo (187.5 mL)':
        'A split or piccolo holds 187.5 mL, one quarter of a standard 750 mL bottle.',
      'demi / half-bottle (375 mL)':
        'A demi or half-bottle holds 375 mL, half of a standard bottle.',
      'double magnum / Champagne jeroboam (3.0 L)':
        'A double magnum holds 3.0 liters, twice the volume of a magnum.'
    }
  }
};

const termQuestions = TERM_FACTS.map((item) => {
  const special = SPECIAL_TERM_CHOICES[item.term];
  const distractors = special
    ? []
    : chooseComparableDistractors(
      [...TERM_FACTS, ...TERM_DISTRACTOR_FACTS],
      item,
      'term'
    );
  const wrongAnswers = special
    ? special.wrongAnswers
    : distractors.map((candidate) => candidate.term);
  const wrongAnswerExplanations = special
    ? special.explanations
    : Object.fromEntries(
      distractors.map((candidate) => [
        candidate.term,
        `${capitalizeFirst(candidate.term)} means ${candidate.definition}.`
      ])
    );

  return {
    conceptId: item.conceptId,
    category: 'wine-language-and-production',
    question: `${termPromptLead[item.subGroup]} ${item.definition}. Which term fits?`,
    options: placeAnswer(item.term, wrongAnswers, item.conceptId),
    correctAnswer: item.term,
    explanation: `${capitalizeFirst(item.term)} means ${item.definition}. ${item.explanation}`,
    wrongAnswerExplanations
  };
});

export const ADDITIONAL_WINE_QUESTIONS = [...regionQuestions, ...termQuestions];

