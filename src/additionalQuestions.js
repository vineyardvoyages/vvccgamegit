// 300 additional quiz questions generated from 150 reviewed, stable wine facts.
// Keeping the source facts compact makes the bank easier to audit and maintain.

const REGION_FACTS = [
  [
    "Chablis, France",
    "Chardonnay grown for lean, mineral white wine",
    "Chablis is a Burgundy appellation whose still white wines are made from Chardonnay."
  ],
  [
    "Sancerre, France",
    "Sauvignon Blanc for the region's principal white wine",
    "Sancerre is especially known for Sauvignon Blanc, although the appellation also permits Pinot Noir for red and rosé."
  ],
  [
    "Vouvray, France",
    "Chenin Blanc in styles from dry to sweet and sparkling",
    "Vouvray in the Loire Valley is based on Chenin Blanc and can produce still or sparkling wines across sweetness levels."
  ],
  [
    "Muscadet Sèvre et Maine, France",
    "Melon de Bourgogne, often aged on its lees",
    "Muscadet Sèvre et Maine is made from Melon de Bourgogne and is often labeled sur lie."
  ],
  [
    "Beaujolais, France",
    "Gamay-based red wine",
    "Beaujolais is best known for red wines made from Gamay."
  ],
  [
    "Côte-Rôtie, France",
    "Syrah, with limited Viognier co-fermentation permitted",
    "Côte-Rôtie is a Northern Rhône appellation centered on Syrah; a small proportion of Viognier may be co-fermented."
  ],
  [
    "Condrieu, France",
    "Still white wine made from Viognier",
    "Condrieu is a Northern Rhône appellation devoted to Viognier."
  ],
  [
    "Bandol, France",
    "Mourvèdre-led red wine",
    "Bandol in Provence is especially associated with structured red wines led by Mourvèdre."
  ],
  [
    "Cahors, France",
    "Malbec-led red wine",
    "Cahors in southwest France is historically associated with Malbec, locally called Côt or Auxerrois."
  ],
  [
    "Madiran, France",
    "Tannat-led red wine",
    "Madiran in southwest France is known for deeply colored, tannic wines based on Tannat."
  ],
  [
    "Champagne, France",
    "Traditional-method sparkling wine",
    "Champagne is the protected French appellation for sparkling wines made under its rules, chiefly by the traditional method."
  ],
  [
    "Sauternes, France",
    "Botrytized sweet white wine",
    "Sauternes in Bordeaux is famous for sweet wines concentrated by noble rot."
  ],
  [
    "Provence, France",
    "Dry rosé as a signature regional style",
    "Provence is internationally identified with pale, dry rosé, though it also makes red and white wine."
  ],
  [
    "Vin Jaune in the Jura, France",
    "Savagnin aged under a veil of yeast",
    "Vin Jaune is a Jura specialty made from Savagnin and matured oxidatively under a yeast veil."
  ],
  [
    "Alsace, France",
    "Aromatic varietal whites such as Riesling and Gewürztraminer",
    "Alsace is known for labeling many wines by grape and for aromatic white varieties."
  ],
  [
    "Barolo, Italy",
    "Nebbiolo-based red wine",
    "Barolo in Piedmont must be made from Nebbiolo."
  ],
  [
    "Brunello di Montalcino, Italy",
    "Sangiovese-based red wine",
    "Brunello di Montalcino in Tuscany is made from Sangiovese, locally known as Brunello."
  ],
  [
    "Chianti Classico, Italy",
    "Sangiovese-led Tuscan red wine",
    "Chianti Classico is a Tuscan appellation whose blends are led by Sangiovese."
  ],
  [
    "Soave, Italy",
    "Garganega-led white wine",
    "Soave in Veneto is based primarily on Garganega."
  ],
  [
    "Verdicchio dei Castelli di Jesi, Italy",
    "White wine based on Verdicchio",
    "This Marche appellation is centered on the Verdicchio grape."
  ],
  [
    "Etna Rosso, Italy",
    "Nerello Mascalese-led volcanic red wine",
    "Etna Rosso from Sicily is led by Nerello Mascalese, often with Nerello Cappuccio."
  ],
  [
    "Taurasi, Italy",
    "Aglianico-based red wine",
    "Taurasi in Campania is made principally from Aglianico."
  ],
  [
    "Gavi, Italy",
    "Cortese-based white wine",
    "Gavi in Piedmont is made from the Cortese grape."
  ],
  [
    "Valpolicella, Italy",
    "Corvina-led red blends",
    "Valpolicella wines from Veneto are commonly led by Corvina with other local grapes."
  ],
  [
    "Franciacorta, Italy",
    "Traditional-method sparkling wine from Lombardy",
    "Franciacorta is an Italian appellation for bottle-fermented sparkling wine."
  ],
  [
    "Rioja, Spain",
    "Tempranillo-led red wine with important blending partners",
    "Rioja is especially known for Tempranillo-led reds, often blended with grapes such as Garnacha, Graciano, or Mazuelo."
  ],
  [
    "Rías Baixas, Spain",
    "Albariño-based Atlantic white wine",
    "Rías Baixas in Galicia is strongly associated with Albariño."
  ],
  [
    "Rueda, Spain",
    "Verdejo-based white wine",
    "Rueda is a Spanish appellation best known for Verdejo."
  ],
  [
    "Ribera del Duero, Spain",
    "Tempranillo-based red wine known locally as Tinto Fino",
    "Ribera del Duero is centered on Tempranillo, commonly called Tinto Fino or Tinta del País there."
  ],
  [
    "Priorat, Spain",
    "Powerful reds often blending Garnacha and Cariñena",
    "Priorat in Catalonia is known for concentrated reds based largely on Garnacha and Cariñena."
  ],
  [
    "Jerez, Spain",
    "Sherry fortified wine",
    "The Jerez area of Andalusia is the home of Sherry."
  ],
  [
    "Douro Valley, Portugal",
    "Port and increasingly important dry table wines",
    "Portugal's Douro Valley produces Port as well as still dry wines."
  ],
  [
    "Vinho Verde, Portugal",
    "Fresh, high-acid wines from northwestern Portugal",
    "Vinho Verde is known especially for light, fresh white wines with bright acidity."
  ],
  [
    "Madeira, Portugal",
    "Fortified wine deliberately exposed to heat and oxygen",
    "Madeira's distinctive fortified wines undergo controlled heating and oxidative aging."
  ],
  [
    "Dão, Portugal",
    "Structured reds often featuring Touriga Nacional",
    "The Dão region makes distinctive reds from Portuguese varieties including Touriga Nacional."
  ],
  [
    "Mosel, Germany",
    "Riesling from steep slate slopes",
    "Germany's Mosel is renowned for Riesling grown on steep river-valley vineyards."
  ],
  [
    "Rheingau, Germany",
    "Riesling from vineyards along the Rhine",
    "The Rheingau is a classic German Riesling region."
  ],
  [
    "Wachau, Austria",
    "Grüner Veltliner and Riesling from Danube terraces",
    "The Wachau is known for dry Grüner Veltliner and Riesling."
  ],
  [
    "Burgenland, Austria",
    "Blaufränkisch reds and notable sweet wines",
    "Burgenland is important for Blaufränkisch and for sweet wines around Lake Neusiedl."
  ],
  [
    "Tokaj, Hungary",
    "Furmint-led wines including botrytized Tokaji Aszú",
    "Tokaj is famed for Furmint-based wines and the historic sweet style Tokaji Aszú."
  ],
  [
    "Santorini, Greece",
    "High-acid Assyrtiko from volcanic soils",
    "Santorini is closely associated with Assyrtiko trained in low basket-shaped vines."
  ],
  [
    "Nemea, Greece",
    "Agiorgitiko-based red wine",
    "Nemea in the Peloponnese is the leading appellation for Agiorgitiko."
  ],
  [
    "Naoussa, Greece",
    "Xinomavro-based red wine",
    "Naoussa in northern Greece is centered on Xinomavro."
  ],
  [
    "Napa Valley, California",
    "Cabernet Sauvignon as a flagship red grape",
    "Napa Valley is globally recognized for Cabernet Sauvignon, alongside many other styles."
  ],
  [
    "Sonoma Coast, California",
    "Cool-climate Pinot Noir and Chardonnay",
    "The Sonoma Coast appellation is particularly associated with cool-climate Pinot Noir and Chardonnay."
  ],
  [
    "Willamette Valley, Oregon",
    "Pinot Noir as the signature red grape",
    "Oregon's Willamette Valley is best known for Pinot Noir."
  ],
  [
    "Walla Walla Valley, Washington and Oregon",
    "Cabernet Sauvignon and Syrah among its leading reds",
    "Walla Walla Valley spans Washington and Oregon and is known for several red grapes, including Cabernet Sauvignon and Syrah."
  ],
  [
    "Finger Lakes, New York",
    "Cool-climate Riesling",
    "New York's Finger Lakes region is especially noted for Riesling."
  ],
  [
    "Mendoza, Argentina",
    "Malbec as the signature red grape",
    "Mendoza is Argentina's largest wine region and is internationally associated with Malbec."
  ],
  [
    "Salta, Argentina",
    "High-altitude Torrontés and red wines",
    "Salta, especially the Calchaquí Valleys, is known for high vineyards and aromatic Torrontés."
  ],
  [
    "Casablanca Valley, Chile",
    "Cool-climate Sauvignon Blanc and Chardonnay",
    "Chile's coastal Casablanca Valley is known for cool-climate white varieties."
  ],
  [
    "Maipo Valley, Chile",
    "Cabernet Sauvignon as a classic red",
    "Maipo Valley has a long reputation for Chilean Cabernet Sauvignon."
  ],
  [
    "Colchagua Valley, Chile",
    "Carménère and other warm-climate reds",
    "Colchagua is especially associated with Chilean red varieties including Carménère."
  ],
  [
    "Niagara Peninsula, Canada",
    "Icewine and cool-climate table wines",
    "Ontario's Niagara Peninsula is renowned for icewine and also produces diverse still and sparkling wines."
  ],
  [
    "Okanagan Valley, Canada",
    "Dry, sunny vineyards supporting many cool-climate varieties",
    "British Columbia's Okanagan Valley combines northern latitude with a dry interior climate."
  ],
  [
    "Barossa Valley, Australia",
    "Rich Shiraz as a signature style",
    "South Australia's Barossa Valley is famous for Shiraz, including wines from old vines."
  ],
  [
    "Clare Valley, Australia",
    "Dry Riesling with high acidity",
    "Clare Valley is one of Australia's classic regions for dry Riesling."
  ],
  [
    "Hunter Valley, Australia",
    "Ageworthy dry Semillon",
    "Hunter Valley Semillon is noted for developing complexity with bottle age despite modest alcohol."
  ],
  [
    "Margaret River, Australia",
    "Cabernet Sauvignon and Chardonnay",
    "Western Australia's Margaret River is highly regarded for Cabernet Sauvignon and Chardonnay."
  ],
  [
    "Coonawarra, Australia",
    "Cabernet Sauvignon on terra rossa soils",
    "Coonawarra is known for Cabernet Sauvignon and its strip of terra rossa soil over limestone."
  ],
  [
    "Tasmania, Australia",
    "Cool-climate sparkling wine, Pinot Noir, and Chardonnay",
    "Tasmania's cool climate suits sparkling wine and varieties such as Pinot Noir and Chardonnay."
  ],
  [
    "Marlborough, New Zealand",
    "Sauvignon Blanc as the signature export style",
    "Marlborough established New Zealand's global reputation for pungent Sauvignon Blanc."
  ],
  [
    "Central Otago, New Zealand",
    "Pinot Noir from a cool, inland region",
    "Central Otago is the world's southernmost major wine region and is best known for Pinot Noir."
  ],
  [
    "Hawke's Bay, New Zealand",
    "Syrah and Bordeaux-style red blends",
    "Hawke's Bay is one of New Zealand's warmest major regions and is known for Syrah and Bordeaux varieties."
  ],
  [
    "Stellenbosch, South Africa",
    "Cabernet Sauvignon and Chenin Blanc among leading grapes",
    "Stellenbosch is a leading South African region for structured reds and diverse whites."
  ],
  [
    "Swartland, South Africa",
    "Chenin Blanc and Rhône varieties from dry-farmed sites",
    "Swartland is known for old-vine Chenin Blanc and Mediterranean varieties."
  ],
  [
    "Constantia, South Africa",
    "Historic sweet wine made from Muscat",
    "Constantia's historic sweet wines are associated with Muscat, particularly Muscat de Frontignan."
  ],
  [
    "Kakheti, Georgia",
    "Traditional qvevri winemaking",
    "Kakheti is Georgia's largest wine region and a center of traditional qvevri wine production."
  ],
  [
    "Yamanashi, Japan",
    "Koshu as a signature white grape",
    "Yamanashi is Japan's leading wine prefecture and is closely associated with Koshu."
  ],
  [
    "Ningxia, China",
    "High-altitude vineyards near the Helan Mountains",
    "Ningxia has emerged as a major Chinese fine-wine region along the Helan Mountain foothills."
  ],
  [
    "Bekaa Valley, Lebanon",
    "Lebanon's principal wine-growing valley",
    "The Bekaa Valley is the historic center of Lebanese wine production."
  ],
  [
    "Uco Valley, Argentina",
    "High-altitude vineyards at the foot of the Andes",
    "The Uco Valley is a high-elevation subregion of Mendoza known for Malbec and other varieties."
  ],
  [
    "Savoie, France",
    "Alpine whites from grapes such as Jacquère",
    "Savoie in the French Alps is known for fresh white wines from local grapes including Jacquère."
  ],
  [
    "Ahr, Germany",
    "Pinot Noir, locally called Spätburgunder",
    "The small, northerly Ahr region is unusually focused on Spätburgunder."
  ],
  [
    "Canary Islands, Spain",
    "Volcanic island wines from ungrafted vines",
    "The Canary Islands are known for volcanic soils, distinctive local grapes, and many own-rooted vines."
  ]
];

const TERM_FACTS = [
  [
    "veraison",
    "the stage when grapes begin to soften and change color as they ripen"
  ],
  [
    "must",
    "freshly crushed grape juice that may also contain skins, seeds, and stems"
  ],
  [
    "pomace",
    "the skins, seeds, and other solids left after grapes are pressed"
  ],
  [
    "lees",
    "spent yeast cells and other sediment that settle after fermentation"
  ],
  [
    "sur lie",
    "aging wine in contact with its lees"
  ],
  [
    "bâtonnage",
    "stirring the lees during wine aging"
  ],
  [
    "malolactic fermentation",
    "the conversion of sharper malic acid into softer lactic acid by bacteria"
  ],
  [
    "maceration",
    "keeping juice or wine in contact with grape solids to extract compounds"
  ],
  [
    "carbonic maceration",
    "fermenting intact grape clusters in a carbon-dioxide-rich environment"
  ],
  [
    "cold soak",
    "a cool pre-fermentation maceration used to extract color and aroma with little alcohol present"
  ],
  [
    "punch-down",
    "pushing the floating cap of skins back into fermenting red wine"
  ],
  [
    "pump-over",
    "pumping fermenting juice from below over the cap of skins"
  ],
  [
    "racking",
    "moving clear wine off settled sediment into another vessel"
  ],
  [
    "fining",
    "adding a binding agent so suspended particles can be removed"
  ],
  [
    "filtration",
    "passing wine through a medium to remove particles or microorganisms"
  ],
  [
    "disgorgement",
    "removing the sediment collected in the neck of a traditional-method sparkling-wine bottle"
  ],
  [
    "dosage",
    "the small addition made after disgorgement that helps set a sparkling wine's final sweetness"
  ],
  [
    "riddling",
    "gradually turning and tilting sparkling-wine bottles to move sediment into the neck"
  ],
  [
    "tirage",
    "the addition of yeast and sugar that starts the second fermentation for traditional-method sparkling wine"
  ],
  [
    "autolysis",
    "the breakdown of yeast cells that can add bread or biscuit notes during lees aging"
  ],
  [
    "traditional method",
    "a sparkling-wine process in which the second fermentation occurs in the bottle sold"
  ],
  [
    "pétillant naturel",
    "sparkling wine bottled before its first fermentation has finished"
  ],
  [
    "fortification",
    "adding distilled grape spirit to wine or fermenting must"
  ],
  [
    "solera",
    "a fractional blending system that mixes younger wine with progressively older wine"
  ],
  [
    "flor",
    "a film of yeast that protects some Sherries from oxygen while shaping their flavor"
  ],
  [
    "noble rot",
    "beneficial Botrytis infection that concentrates grapes for certain sweet wines"
  ],
  [
    "icewine",
    "sweet wine made from grapes frozen naturally on the vine before pressing"
  ],
  [
    "late harvest",
    "wine made from grapes left on the vine longer to accumulate sugar and flavor"
  ],
  [
    "chaptalization",
    "adding sugar before or during fermentation to raise potential alcohol rather than sweetness"
  ],
  [
    "acidification",
    "adding acid to must or wine to increase freshness and lower pH"
  ],
  [
    "deacidification",
    "reducing excessive acidity in must or wine"
  ],
  [
    "whole-cluster fermentation",
    "fermenting grapes with some or all stems and bunches intact"
  ],
  [
    "destemming",
    "removing grapes from their stems before fermentation"
  ],
  [
    "crushing",
    "breaking grape skins to release juice before fermentation"
  ],
  [
    "press wine",
    "wine obtained by applying pressure to fermented grape solids"
  ],
  [
    "free-run juice",
    "juice or wine that flows without heavy pressing"
  ],
  [
    "cap",
    "the layer of skins and solids that rises during red-wine fermentation"
  ],
  [
    "tannin",
    "a phenolic compound that creates a drying, astringent sensation"
  ],
  [
    "acidity",
    "the component that gives wine freshness, tartness, and structural lift"
  ],
  [
    "body",
    "the perceived weight and fullness of wine in the mouth"
  ],
  [
    "finish",
    "the flavors and sensations that remain after swallowing or spitting wine"
  ],
  [
    "bouquet",
    "complex aromas that develop through fermentation and aging"
  ],
  [
    "aroma",
    "a smell perceived from wine, often including primary fruit or floral notes"
  ],
  [
    "palate",
    "the mouth's perception of a wine's flavor, texture, and structure"
  ],
  [
    "blind tasting",
    "evaluating wine without knowing its identity"
  ],
  [
    "horizontal tasting",
    "comparing different wines from the same vintage or closely matched context"
  ],
  [
    "vertical tasting",
    "comparing multiple vintages of the same wine or producer"
  ],
  [
    "vintage",
    "the year in which the grapes for a wine were harvested"
  ],
  [
    "non-vintage",
    "a wine blended from more than one harvest year"
  ],
  [
    "cuvée",
    "a selected blend or batch of wine"
  ],
  [
    "reserve",
    "a term suggesting special selection or aging whose legal meaning varies by place"
  ],
  [
    "appellation",
    "a legally defined geographic wine origin with associated rules"
  ],
  [
    "American Viticultural Area",
    "a federally recognized U.S. wine-grape-growing region"
  ],
  [
    "Protected Designation of Origin",
    "an EU category linking a product to a defined place and production rules"
  ],
  [
    "monopole",
    "a vineyard appellation or named site controlled by a single owner"
  ],
  [
    "négociant",
    "a merchant who buys grapes, must, or wine and sells wine under its own name"
  ],
  [
    "estate bottled",
    "wine produced and bottled by the estate from grapes it controls, subject to local legal definitions"
  ],
  [
    "cork taint",
    "a musty fault most often associated with TCA contamination"
  ],
  [
    "volatile acidity",
    "volatile acids that can smell like vinegar or nail-polish remover at high levels"
  ],
  [
    "reduction",
    "aromas caused by limited oxygen exposure, sometimes resembling struck match or rotten egg"
  ],
  [
    "oxidation",
    "chemical change from oxygen exposure that can brown wine and alter its aromas"
  ],
  [
    "Brettanomyces",
    "a spoilage yeast that can create barnyard, medicinal, or smoky aromas"
  ],
  [
    "tartrate crystals",
    "harmless crystals formed when tartaric acid salts precipitate from wine"
  ],
  [
    "ullage",
    "the empty space between wine and the closure in a container"
  ],
  [
    "decanting",
    "transferring wine to another vessel to separate sediment or increase air contact"
  ],
  [
    "aeration",
    "deliberately exposing wine to air"
  ],
  [
    "phenolics",
    "a broad group of compounds including tannins, pigments, and many flavor-related substances"
  ],
  [
    "anthocyanins",
    "the pigments responsible for much of a red grape skin's color"
  ],
  [
    "Brix",
    "a scale used to estimate dissolved sugar in grape juice"
  ],
  [
    "residual sugar",
    "sugar remaining in wine after fermentation stops"
  ],
  [
    "dry wine",
    "wine with little perceptible sweetness"
  ],
  [
    "Brut",
    "a common sparkling-wine sweetness category that is drier than Extra Dry"
  ],
  [
    "Extra Brut",
    "a sparkling-wine category with less dosage and sugar than Brut"
  ],
  [
    "Demi-Sec",
    "a noticeably sweet sparkling-wine category"
  ],
  [
    "magnum",
    "a wine bottle holding 1.5 liters, equal to two standard bottles"
  ]
];

const fourOptions = (facts, index, valueIndex) => {
  const correct = facts[index][valueIndex];
  const options = [correct];

  for (let offset = 1; options.length < 4 && offset < facts.length; offset += 1) {
    const candidate = facts[(index + offset) % facts.length][valueIndex];
    if (!options.includes(candidate)) options.push(candidate);
  }

  return options;
};

const regionQuestions = REGION_FACTS.flatMap((fact, index) => {
  const [place, association, explanation] = fact;

  return [
    {
      category: 'world-wine-regions',
      question: `Which classic wine association belongs to ${place}?`,
      options: fourOptions(REGION_FACTS, index, 1),
      correctAnswer: association,
      explanation
    },
    {
      category: 'world-wine-regions',
      question: `Which place matches this wine clue: ${association}?`,
      options: fourOptions(REGION_FACTS, index, 0),
      correctAnswer: place,
      explanation
    }
  ];
});

const termQuestions = TERM_FACTS.flatMap((fact, index) => {
  const [term, definition] = fact;
  const explanation = `${term} means ${definition}.`;

  return [
    {
      category: 'wine-language-and-production',
      question: `What does the wine term "${term}" mean?`,
      options: fourOptions(TERM_FACTS, index, 1),
      correctAnswer: definition,
      explanation
    },
    {
      category: 'wine-language-and-production',
      question: `Which wine term matches this definition: ${definition}?`,
      options: fourOptions(TERM_FACTS, index, 0),
      correctAnswer: term,
      explanation
    }
  ];
});

export const ADDITIONAL_WINE_QUESTIONS = [...regionQuestions, ...termQuestions];
