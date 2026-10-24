import { ADDITIONAL_WINE_QUESTIONS } from './additionalQuestions';

const BASE_WINE_QUESTIONS = [
  {
    "question": "Which of the following is a red grape varietal?",
    "options": [
      "Chardonnay",
      "Sauvignon Blanc",
      "Merlot",
      "Pinot Grigio"
    ],
    "correctAnswer": "Merlot",
    "explanation": "Merlot is a popular red grape varietal known for its soft, approachable wines.",
    "wrongAnswerExplanations": {
      "Chardonnay": "Chardonnay is a white grape varietal, not red.",
      "Sauvignon Blanc": "Sauvignon Blanc is a white grape varietal known for its crisp, acidic character.",
      "Pinot Grigio": "Pinot Grigio (also called Pinot Gris) is a white grape varietal."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "What is 'terroir' in winemaking?",
    "options": [
      "The yeast strain naturally present on grape skins",
      "The natural environment—soil, topography, and climate—where grapes grow",
      "The legal aging rules set by a regional wine board",
      "The winter-pruning method used to control crop yield"
    ],
    "correctAnswer": "The natural environment—soil, topography, and climate—where grapes grow",
    "explanation": "Terroir is the combined influence of a site's climate, soil, topography, and other growing conditions on grapes and the wine they produce.",
    "wrongAnswerExplanations": {
      "The yeast strain naturally present on grape skins": "Native yeast can affect fermentation, but it is only one biological factor and does not define terroir.",
      "The legal aging rules set by a regional wine board": "Production rules belong to an appellation system rather than the natural environment.",
      "The winter-pruning method used to control crop yield": "Pruning is a vineyard practice, not the complete environmental setting described by terroir."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which two countries routinely trade places as the world's largest wine producer by annual volume?",
    "options": [
      "Italy and France",
      "Spain and Portugal",
      "United States and Argentina",
      "Germany and Austria"
    ],
    "correctAnswer": "Italy and France",
    "explanation": "Italy and France regularly occupy the top two positions, and weather can change which country leads in a particular harvest. France led in 2023, while Italy led in 2024.",
    "wrongAnswerExplanations": {
      "Spain and Portugal": "Spain is a major producer and has vast vineyard area, but this pair does not routinely hold both top production positions.",
      "United States and Argentina": "Both are important New World producers, but their annual volumes are below Italy and France.",
      "Germany and Austria": "These countries are renowned for quality wine but produce far less total volume than Italy and France."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which of the following is one of the three principal grapes used in Champagne?",
    "options": [
      "Pinot Noir",
      "Riesling",
      "Syrah",
      "Zinfandel"
    ],
    "correctAnswer": "Pinot Noir",
    "explanation": "Pinot Noir, Chardonnay, and Meunier are Champagne's three principal grape varieties. Pinot Noir contributes body and structure.",
    "wrongAnswerExplanations": {
      "Riesling": "Riesling is closely associated with Germany and Alsace and is not one of Champagne's three principal grapes.",
      "Syrah": "Syrah is central to many Rhône wines but is not one of Champagne's three principal grapes.",
      "Zinfandel": "Zinfandel is strongly associated with California and is not a principal Champagne grape."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which of these wines is typically dry and crisp, often with notes of green apple and citrus?",
    "options": [
      "Cabernet Sauvignon",
      "Chardonnay (oaked)",
      "Sauvignon Blanc",
      "Zinfandel"
    ],
    "correctAnswer": "Sauvignon Blanc",
    "explanation": "Sauvignon Blanc is known for its high acidity and aromatic profile, often featuring notes of green apple, lime, and herbaceousness.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "Cabernet Sauvignon is a full-bodied red wine with darker fruit flavors and tannins.",
      "Chardonnay (oaked)": "Oaked Chardonnay is typically full-bodied with buttery, vanilla notes rather than crisp citrus.",
      "Zinfandel": "Zinfandel is typically a bold red wine with berry and spice flavors, not citrusy."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the process of aging wine in oak barrels called?",
    "options": [
      "Fermentation",
      "Malolactic fermentation",
      "Oaking",
      "Racking"
    ],
    "correctAnswer": "Oaking",
    "explanation": "Oaking is the term for aging wine in oak barrels, which can impart flavors like vanilla, spice, and toast.",
    "wrongAnswerExplanations": {
      "Fermentation": "Fermentation is the conversion of sugar to alcohol, not the aging process.",
      "Malolactic fermentation": "This is a secondary fermentation that converts malic acid to lactic acid.",
      "Racking": "Racking is the process of transferring wine from one container to another to separate it from sediment."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which classic region is especially associated with Cabernet Sauvignon-led blends from gravelly Left Bank vineyards?",
    "options": [
      "Bordeaux, France",
      "Napa Valley, California",
      "Barossa Valley, Australia",
      "Coonawarra, Australia"
    ],
    "correctAnswer": "Bordeaux, France",
    "explanation": "Cabernet Sauvignon is central to many Left Bank Bordeaux blends, where gravelly soils and maritime influence help define the style.",
    "wrongAnswerExplanations": {
      "Napa Valley, California": "Napa is famous for Cabernet Sauvignon, often as a varietal wine, but it does not have Bordeaux's Left Bank.",
      "Barossa Valley, Australia": "Barossa is best known for rich Shiraz, although Cabernet is also grown.",
      "Coonawarra, Australia": "Coonawarra is known for Cabernet on terra rossa soils, not Bordeaux's gravelly Left Bank."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "What is the ideal serving temperature for most red wines?",
    "options": [
      "Chilled (40-45°F)",
      "Room temperature (68-72°F)",
      "Cool (60-65°F)",
      "Warm (75-80°F)"
    ],
    "correctAnswer": "Cool (60-65°F)",
    "explanation": "Most red wines are best served slightly cooler than typical room temperature to highlight their fruit and acidity.",
    "wrongAnswerExplanations": {
      "Chilled (40-45°F)": "This temperature is too cold and would mute the wine's aromas and flavors.",
      "Room temperature (68-72°F)": "Modern room temperature is often too warm, making the wine taste flat and overly alcoholic.",
      "Warm (75-80°F)": "This temperature is too warm and would make the wine taste unbalanced with harsh alcohol."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which of these is a sparkling wine from Spain?",
    "options": [
      "Prosecco",
      "Champagne",
      "Cava",
      "Lambrusco"
    ],
    "correctAnswer": "Cava",
    "explanation": "Cava is a popular sparkling wine from Spain, produced using the traditional method, similar to Champagne.",
    "wrongAnswerExplanations": {
      "Prosecco": "Prosecco is a sparkling wine from Italy, not Spain.",
      "Champagne": "Champagne is a sparkling wine exclusively from the Champagne region of France.",
      "Lambrusco": "Lambrusco is a sparkling red wine from Italy, not Spain."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What does 'tannin' refer to in wine?",
    "options": [
      "Sweetness",
      "Acidity",
      "Bitterness and astringency",
      "Alcohol content"
    ],
    "correctAnswer": "Bitterness and astringency",
    "explanation": "Tannins are naturally occurring compounds found in grape skins, seeds, and stems, contributing to a wine's bitterness, astringency, and structure.",
    "wrongAnswerExplanations": {
      "Sweetness": "Sweetness in wine comes from residual sugar, not tannins.",
      "Acidity": "Acidity provides tartness and freshness, which is different from the dry, bitter sensation of tannins.",
      "Alcohol content": "Alcohol provides warmth and body, but tannins create the dry, mouth-puckering sensation."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which white grape is typically used to make dry, aromatic wines in the Loire Valley, France?",
    "options": [
      "Chardonnay",
      "Sauvignon Blanc",
      "Pinot Gris",
      "Riesling"
    ],
    "correctAnswer": "Sauvignon Blanc",
    "explanation": "Sauvignon Blanc is the key grape in regions like Sancerre and Pouilly-Fumé in the Loire Valley, producing crisp, mineral-driven wines.",
    "wrongAnswerExplanations": {
      "Chardonnay": "While Chardonnay grows in Loire Valley, it's not the primary grape for dry, aromatic wines there.",
      "Pinot Gris": "Pinot Gris is more associated with Alsace than the Loire Valley's aromatic wines.",
      "Riesling": "Riesling is primarily grown in Germany and Alsace, not the Loire Valley."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which fortified wine is produced in northern Portugal's Douro Valley?",
    "options": [
      "Sherry",
      "Port",
      "Madeira",
      "Marsala"
    ],
    "correctAnswer": "Port",
    "explanation": "Port is produced in Portugal's Douro Valley. Madeira is also Portuguese and fortified, but it comes from the Atlantic island of Madeira.",
    "wrongAnswerExplanations": {
      "Sherry": "Sherry comes from the Jerez area of Spain.",
      "Madeira": "Madeira is Portuguese fortified wine from Madeira Island rather than the Douro Valley.",
      "Marsala": "Marsala is a fortified wine from Sicily, Italy."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the process of converting grape juice into wine called?",
    "options": [
      "Distillation",
      "Fermentation",
      "Maceration",
      "Clarification"
    ],
    "correctAnswer": "Fermentation",
    "explanation": "Fermentation is the chemical process by which yeast converts the sugars in grape juice into alcohol and carbon dioxide.",
    "wrongAnswerExplanations": {
      "Distillation": "Distillation is used to make spirits, not wine, by heating and cooling to concentrate alcohol.",
      "Maceration": "Maceration is the contact between grape skins and juice to extract color and flavor.",
      "Clarification": "Clarification removes sediment and particles from wine after fermentation is complete."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which red grape is known for its light body, high acidity, and red fruit flavors, often associated with Burgundy?",
    "options": [
      "Cabernet Sauvignon",
      "Merlot",
      "Pinot Noir",
      "Syrah"
    ],
    "correctAnswer": "Pinot Noir",
    "explanation": "Pinot Noir is a delicate red grape varietal that thrives in cooler climates and is the primary grape of Burgundy, France.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "Cabernet Sauvignon is full-bodied with dark fruit flavors, not light-bodied like Pinot Noir.",
      "Merlot": "Merlot is medium to full-bodied with plush textures, different from Pinot Noir's delicate style.",
      "Syrah": "Syrah produces full-bodied, powerful wines with dark fruit and spice, opposite of Pinot Noir's elegance."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "The 'legs' or 'tears' on the inside of a swirled wine glass are influenced most directly by what?",
    "options": [
      "Alcohol and surface-tension effects",
      "The wine's acidity level",
      "The amount of tannin present",
      "The wine's geographic origin"
    ],
    "correctAnswer": "Alcohol and surface-tension effects",
    "explanation": "Wine legs form mainly through evaporation and surface-tension differences related to alcohol. They are not a dependable measure of wine quality.",
    "wrongAnswerExplanations": {
      "The wine's acidity level": "Acidity shapes freshness and tartness but is not the main cause of legs.",
      "The amount of tannin present": "Tannin creates a drying sensation; it does not drive the tears on the glass.",
      "The wine's geographic origin": "Origin can influence style, but it does not directly create legs."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which of these is a common fault in wine, often described as smelling like wet cardboard or moldy basement?",
    "options": [
      "Brettanomyces",
      "Cork taint (TCA)",
      "Oxidation",
      "Volatile Acidity"
    ],
    "correctAnswer": "Cork taint (TCA)",
    "explanation": "Cork taint, caused by TCA, is a common wine fault that imparts unpleasant musty or moldy aromas.",
    "wrongAnswerExplanations": {
      "Brettanomyces": "Brettanomyces creates barnyard, medicinal, or Band-Aid aromas, not wet cardboard smells.",
      "Oxidation": "Oxidation causes wines to smell like sherry, nuts, or bruised apples, not musty basement odors.",
      "Volatile Acidity": "Volatile acidity smells like vinegar or nail polish remover, not wet cardboard."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which type of wine is typically served with oysters?",
    "options": [
      "Cabernet Sauvignon",
      "Chardonnay (oaked)",
      "Sauvignon Blanc",
      "Merlot"
    ],
    "correctAnswer": "Sauvignon Blanc",
    "explanation": "Crisp, high-acid white wines like Sauvignon Blanc are excellent pairings for oysters, as they cut through the brininess.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "This full-bodied red would overpower the delicate flavor of oysters.",
      "Chardonnay (oaked)": "Oaked Chardonnay's buttery richness would clash with oysters' briny, mineral character.",
      "Merlot": "This soft red wine would be too heavy and wouldn't complement oysters' oceanic flavors."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which noble rot-affected sweet wine, often described as 'liquid gold', comes from a specific region in Bordeaux?",
    "options": [
      "Tokaji",
      "Ice Wine",
      "Sauternes",
      "Port"
    ],
    "correctAnswer": "Sauternes",
    "explanation": "Sauternes is a highly prized sweet wine from the Bordeaux region of France, made from grapes affected by Botrytis cinerea (noble rot).",
    "wrongAnswerExplanations": {
      "Tokaji": "Tokaji is a noble rot wine from Hungary, not Bordeaux.",
      "Ice Wine": "Ice wine is made from frozen grapes, not noble rot, and comes from cool climates like Canada and Germany.",
      "Port": "Port is a fortified wine from Portugal, not a noble rot wine from Bordeaux."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the primary grape used in the production of Chianti wine?",
    "options": [
      "Nebbiolo",
      "Barbera",
      "Sangiovese",
      "Montepulciano"
    ],
    "correctAnswer": "Sangiovese",
    "explanation": "Sangiovese is the signature red grape of Tuscany, Italy, and the primary component of Chianti wine.",
    "wrongAnswerExplanations": {
      "Nebbiolo": "Nebbiolo is the grape used in Barolo and Barbaresco from Piedmont, not Chianti.",
      "Barbera": "Barbera is another Piedmontese grape variety, not the main grape in Chianti.",
      "Montepulciano": "Montepulciano is used in wines from Abruzzo and other central Italian regions, not Chianti."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which wine glass shape is generally recommended for enjoying red wines?",
    "options": [
      "Tall, narrow Champagne flute",
      "Shallow, broad-rimmed coupe",
      "Small, narrow-mouthed Sherry copita",
      "Large, wide-bowled Bordeaux or Burgundy glass"
    ],
    "correctAnswer": "Large, wide-bowled Bordeaux or Burgundy glass",
    "explanation": "Larger, wider-bowled glasses like Bordeaux or Burgundy allow red wines to breathe and express their aromas fully.",
    "wrongAnswerExplanations": {
      "Tall, narrow Champagne flute": "A flute is designed to emphasize and preserve sparkling-wine bubbles.",
      "Shallow, broad-rimmed coupe": "A coupe is traditionally associated with sparkling wine or cocktails, not still red wine.",
      "Small, narrow-mouthed Sherry copita": "A copita concentrates aromas in fortified wines but is too small for most red wines."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What are the harmless, glass-like mineral crystals sometimes called 'wine diamonds'?",
    "options": [
      "Tartrate crystals",
      "Fine lees",
      "Fining agents",
      "Cork fragments"
    ],
    "correctAnswer": "Tartrate crystals",
    "explanation": "Tartrate crystals can form when potassium and tartaric acid precipitate, especially after chilling. They are harmless and do not indicate spoiled wine.",
    "wrongAnswerExplanations": {
      "Fine lees": "Lees are mainly spent yeast and other fine sediment rather than glass-like mineral crystals.",
      "Fining agents": "Fining agents are deliberately added to bind selected particles and are normally removed before bottling.",
      "Cork fragments": "Cork pieces are packaging debris, not naturally formed mineral crystals."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "This dark-skinned grape is famously called Shiraz in Australia and is known for producing full-bodied, spicy red wines in the Rhône Valley of France. What is its name?",
    "options": [
      "Pinot Noir",
      "Merlot",
      "Syrah",
      "Zinfandel"
    ],
    "correctAnswer": "Syrah",
    "explanation": "Syrah or Shiraz is a versatile dark-skinned grape known for producing powerful, peppery, and dark-fruited wines in both the Old and New World.",
    "wrongAnswerExplanations": {
      "Pinot Noir": "Pinot Noir produces light-bodied, elegant wines, not full-bodied spicy ones.",
      "Merlot": "Merlot creates softer, more approachable wines, not the bold, spicy character described.",
      "Zinfandel": "Zinfandel is primarily associated with California, not the Rhône Valley or Australia."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is vintage on a wine label?",
    "options": [
      "The year the wine was bottled",
      "The year the grapes were harvested",
      "The age of the winery",
      "The specific vineyard site"
    ],
    "correctAnswer": "The year the grapes were harvested",
    "explanation": "The vintage year on a wine label indicates when the grapes used to make that wine were picked.",
    "wrongAnswerExplanations": {
      "The year the wine was bottled": "Bottling year is different from vintage; wines can be bottled months or years after harvest.",
      "The age of the winery": "Vintage refers to the grape harvest year, not when the winery was established.",
      "The specific vineyard site": "Vineyard site information is separate from vintage dating."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which of these is a common characteristic of an oaked Chardonnay?",
    "options": [
      "Light and crisp",
      "Notes of butter, vanilla, and toast",
      "High acidity and citrus",
      "Sweet and fruity"
    ],
    "correctAnswer": "Notes of butter, vanilla, and toast",
    "explanation": "Aging Chardonnay in oak barrels imparts flavors and aromas of butter, vanilla, and toast.",
    "wrongAnswerExplanations": {
      "Light and crisp": "Oak aging typically makes Chardonnay fuller-bodied and richer, not light and crisp.",
      "High acidity and citrus": "While Chardonnay can have good acidity, oaking tends to soften it and add richer flavors.",
      "Sweet and fruity": "Oaked Chardonnay is usually dry with complex flavors rather than simply sweet and fruity."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the purpose of decanting wine?",
    "options": [
      "To preserve an opened bottle for several weeks",
      "To separate sediment and expose the wine to air",
      "To trigger secondary malolactic fermentation",
      "To reduce the wine's alcohol by volume"
    ],
    "correctAnswer": "To separate sediment and expose the wine to air",
    "explanation": "Decanting separates sediment from the wine and exposes the wine to oxygen, helping it open up and develop aromas.",
    "wrongAnswerExplanations": {
      "To preserve an opened bottle for several weeks": "A decanter increases air contact and is not intended for long-term preservation.",
      "To trigger secondary malolactic fermentation": "Malolactic fermentation is a cellar process and is not started by table-side decanting.",
      "To reduce the wine's alcohol by volume": "Normal decanting does not meaningfully lower alcohol."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which Italian wine is famous for being produced in the Piedmont region and made from Nebbiolo grapes?",
    "options": [
      "Chianti",
      "Prosecco",
      "Barolo",
      "Soave"
    ],
    "correctAnswer": "Barolo",
    "explanation": "Barolo is a highly esteemed red wine from Piedmont, Italy, known for its powerful tannins and aging potential, made from Nebbiolo grapes.",
    "wrongAnswerExplanations": {
      "Chianti": "Chianti is from Tuscany and made primarily from Sangiovese, not Nebbiolo.",
      "Prosecco": "Prosecco is a sparkling wine made from Glera grapes, not Nebbiolo.",
      "Soave": "Soave is a white wine from Veneto made from Garganega grapes, not Nebbiolo."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What tasting term describes a wine with a subtle, barely noticeable hint of sweetness?",
    "options": [
      "Bone-dry",
      "Off-dry",
      "Fortified",
      "Oxidized"
    ],
    "correctAnswer": "Off-dry",
    "explanation": "An off-dry wine has a small amount of perceptible residual sugar—more than a dry wine, but far less than a dessert wine.",
    "wrongAnswerExplanations": {
      "Bone-dry": "Bone-dry indicates essentially no perceptible sweetness.",
      "Fortified": "Fortified means spirit was added; fortified wines can be dry or sweet.",
      "Oxidized": "Oxidized describes oxygen-related changes, not a sweetness level."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which region is known for producing high-quality Riesling wines?",
    "options": [
      "Bordeaux, France",
      "Mosel, Germany",
      "Napa Valley, USA",
      "Tuscany, Italy"
    ],
    "correctAnswer": "Mosel, Germany",
    "explanation": "The Mosel region in Germany is world-renowned for its crisp, aromatic, and often off-dry Riesling wines.",
    "wrongAnswerExplanations": {
      "Bordeaux, France": "Bordeaux is famous for red blends and sweet wines, not Riesling.",
      "Napa Valley, USA": "Napa Valley is known for Cabernet Sauvignon and Chardonnay, not primarily Riesling.",
      "Tuscany, Italy": "Tuscany is famous for Sangiovese-based wines like Chianti, not Riesling."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the difference between red and white wine production?",
    "options": [
      "Red wine uses red grapes, white wine uses white grapes",
      "Red wine ferments with grape skins, white wine typically does not",
      "Red wine is aged in oak, white wine is not",
      "Red wine is always dry, white wine is always sweet"
    ],
    "correctAnswer": "Red wine ferments with grape skins, white wine typically does not",
    "explanation": "The key difference is that red wines get their color, tannins, and much of their flavor from fermenting with the grape skins, while white wines are usually pressed before fermentation.",
    "wrongAnswerExplanations": {
      "Red wine uses red grapes, white wine uses white grapes": "White wine can be made from red grapes if the skins are removed quickly.",
      "Red wine is aged in oak, white wine is not": "Both red and white wines can be aged in oak or not, depending on the style desired.",
      "Red wine is always dry, white wine is always sweet": "Both red and white wines can be dry or sweet depending on the winemaking process."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which of these is a common food pairing for Pinot Noir?",
    "options": [
      "Grilled steak",
      "Spicy Asian cuisine",
      "Salmon or duck",
      "Heavy cream sauces"
    ],
    "correctAnswer": "Salmon or duck",
    "explanation": "Pinot Noir's lighter body and red fruit notes make it an excellent match for fattier fish like salmon and poultry like duck.",
    "wrongAnswerExplanations": {
      "Grilled steak": "Grilled steak pairs better with fuller-bodied reds like Cabernet Sauvignon or Syrah.",
      "Spicy Asian cuisine": "Spicy foods typically pair better with off-dry whites or lighter, fruit-forward reds.",
      "Heavy cream sauces": "Heavy cream sauces usually pair better with fuller-bodied whites like oaked Chardonnay."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the term for the natural sugars remaining in wine after fermentation?",
    "options": [
      "Glucose",
      "Fructose",
      "Residual Sugar",
      "Sucrose"
    ],
    "correctAnswer": "Residual Sugar",
    "explanation": "Residual sugar (RS) refers to the grape sugars that are not converted into alcohol during fermentation, contributing to a wine's sweetness.",
    "wrongAnswerExplanations": {
      "Glucose": "While glucose is one type of sugar in grapes, 'residual sugar' is the general term used in winemaking.",
      "Fructose": "While fructose is another grape sugar, 'residual sugar' encompasses all remaining sugars.",
      "Sucrose": "Sucrose is table sugar, not the natural grape sugars found in wine."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which grape is known for producing full-bodied, often spicy red wines in the Rhône Valley, France?",
    "options": [
      "Gamay",
      "Pinot Noir",
      "Syrah",
      "Merlot"
    ],
    "correctAnswer": "Syrah",
    "explanation": "Syrah or Shiraz is the dominant red grape in the Northern Rhône, producing powerful, peppery, and dark-fruited wines.",
    "wrongAnswerExplanations": {
      "Gamay": "Gamay produces light, fruity wines in Beaujolais, not the full-bodied spicy wines of the Rhône.",
      "Pinot Noir": "Pinot Noir creates elegant, light-bodied wines in Burgundy, not the powerful Rhône reds.",
      "Merlot": "Merlot is associated with Bordeaux and produces softer wines, not the spicy Rhône style."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the typical alcohol content of a dry table wine?",
    "options": [
      "2-5%",
      "8-10%",
      "11-15%",
      "18-20%"
    ],
    "correctAnswer": "11-15%",
    "explanation": "Most dry table wines fall within the 11-15% ABV (Alcohol by Volume) range.",
    "wrongAnswerExplanations": {
      "2-5%": "This is the alcohol range for beer, not wine.",
      "8-10%": "This is too low for most table wines, though some very light wines might reach 10%.",
      "18-20%": "This is the alcohol range for fortified wines like Port or Sherry, not table wines."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which of these is a common characteristic of a dry wine?",
    "options": [
      "High levels of mouth-drying tannin",
      "Little or no perceptible sweetness",
      "A high alcohol level from fortification",
      "Extended aging in new oak barrels"
    ],
    "correctAnswer": "Little or no perceptible sweetness",
    "explanation": "A dry wine is one in which all or most of the grape sugars have been converted to alcohol during fermentation, resulting in no perceptible sweetness.",
    "wrongAnswerExplanations": {
      "High levels of mouth-drying tannin": "Tannin can make wine feel dry in everyday speech, but wine-label dryness refers to sweetness.",
      "A high alcohol level from fortification": "Alcohol level does not determine whether a wine tastes dry or sweet.",
      "Extended aging in new oak barrels": "Oak can add flavor and texture but does not define sweetness."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the name of the white wine region in Burgundy, France, famous for unoaked Chardonnay?",
    "options": [
      "Pouilly-Fumé",
      "Sancerre",
      "Chablis",
      "Vouvray"
    ],
    "correctAnswer": "Chablis",
    "explanation": "Chablis is a sub-region of Burgundy known for producing crisp, mineral-driven Chardonnay wines that are typically unoaked.",
    "wrongAnswerExplanations": {
      "Pouilly-Fumé": "Pouilly-Fumé is in the Loire Valley and known for Sauvignon Blanc, not Chardonnay.",
      "Sancerre": "Sancerre is also in the Loire Valley and famous for Sauvignon Blanc, not Chardonnay.",
      "Vouvray": "Vouvray is in the Loire Valley and known for Chenin Blanc, not Chardonnay."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which grape varietal is often described as having notes of blackcurrant, cedar, and tobacco?",
    "options": [
      "Pinot Noir",
      "Merlot",
      "Cabernet Sauvignon",
      "Zinfandel"
    ],
    "correctAnswer": "Cabernet Sauvignon",
    "explanation": "Cabernet Sauvignon is renowned for its classic aromas and flavors of blackcurrant (cassis), alongside herbal, cedar, and tobacco notes.",
    "wrongAnswerExplanations": {
      "Pinot Noir": "Pinot Noir typically shows red fruit flavors like cherry and strawberry, not blackcurrant and cedar.",
      "Merlot": "Merlot usually displays plum and chocolate notes, softer than Cabernet's structure.",
      "Zinfandel": "Zinfandel is known for jammy berry flavors and spice, not the structured cassis and cedar notes."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the term for the process of allowing wine to age in the bottle before release?",
    "options": [
      "Malolactic fermentation",
      "Racking",
      "Bottle aging",
      "Fining"
    ],
    "correctAnswer": "Bottle aging",
    "explanation": "Bottle aging allows wine to develop more complex flavors and aromas over time.",
    "wrongAnswerExplanations": {
      "Malolactic fermentation": "This is a secondary fermentation process that converts malic acid to lactic acid.",
      "Racking": "Racking is transferring wine from one container to another to separate it from sediment.",
      "Fining": "Fining is adding agents to clarify wine by removing particles and impurities."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which type of wine is typically served as an aperitif (before a meal)?",
    "options": [
      "Sweet dessert wine",
      "Full-bodied red wine",
      "Dry sparkling wine",
      "Oaked Chardonnay"
    ],
    "correctAnswer": "Dry sparkling wine",
    "explanation": "Dry sparkling wines like Brut Champagne or Cava are excellent aperitifs, stimulating the palate without being too heavy.",
    "wrongAnswerExplanations": {
      "Sweet dessert wine": "Sweet wines are typically served with or after dessert, not as an aperitif.",
      "Full-bodied red wine": "Heavy reds would be too overwhelming before a meal and might dull the palate.",
      "Oaked Chardonnay": "While possible, the richness of oaked Chardonnay is less ideal than crisp sparkling wine."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is a 'blend' in winemaking?",
    "options": [
      "Combining wines to create a desired style",
      "Adding water to lower alcohol after bottling",
      "Co-fermenting must with neutral grape spirit",
      "Aging one grape in two kinds of oak without combining lots"
    ],
    "correctAnswer": "Combining wines to create a desired style",
    "explanation": "A wine blend combines two or more different grape varietals to achieve a desired balance of flavors, aromas, and structure.",
    "wrongAnswerExplanations": {
      "Adding water to lower alcohol after bottling": "That is not the normal meaning of blending in winemaking.",
      "Co-fermenting must with neutral grape spirit": "Adding grape spirit is fortification, not blending.",
      "Aging one grape in two kinds of oak without combining lots": "Using different barrels becomes a blend only when the resulting lots are combined."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which combination commonly makes a wine feel fuller-bodied?",
    "options": [
      "Higher alcohol and greater extract",
      "Lower alcohol and very light extract",
      "Sharper acidity with no change in texture",
      "Paler color and an earlier harvest date"
    ],
    "correctAnswer": "Higher alcohol and greater extract",
    "explanation": "Alcohol, glycerol, dissolved compounds, and—in sweet wines—residual sugar can all contribute to a fuller, weightier mouthfeel.",
    "wrongAnswerExplanations": {
      "Lower alcohol and very light extract": "Those traits generally make a wine feel lighter rather than fuller.",
      "Sharper acidity with no change in texture": "Acidity adds freshness but does not by itself define full body.",
      "Paler color and an earlier harvest date": "Color alone does not determine body, and earlier harvest often produces lighter potential alcohol."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "How does an inert-gas wine preserver help protect an opened bottle?",
    "options": [
      "It forms a protective blanket that limits oxygen contact",
      "It filters tartrate crystals from the bottle",
      "It restarts fermentation to consume oxygen",
      "It permanently lowers the wine's serving temperature"
    ],
    "correctAnswer": "It forms a protective blanket that limits oxygen contact",
    "explanation": "An inert gas such as argon can displace air above the wine and slow oxidation without adding flavor.",
    "wrongAnswerExplanations": {
      "It filters tartrate crystals from the bottle": "Gas preservation does not remove sediment or crystals.",
      "It restarts fermentation to consume oxygen": "Preservation systems do not rely on restarting fermentation.",
      "It permanently lowers the wine's serving temperature": "Gas can protect against oxygen but does not control long-term temperature."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which of these is one of Alsace's four noble grapes and is especially prized for long-lived, dry white wines?",
    "options": [
      "Riesling",
      "Chenin Blanc",
      "Albariño",
      "Garganega"
    ],
    "correctAnswer": "Riesling",
    "explanation": "Riesling is one of the four grapes generally permitted for Alsace Grand Cru and can produce precise, ageworthy dry wines.",
    "wrongAnswerExplanations": {
      "Chenin Blanc": "Chenin Blanc is especially associated with France's Loire Valley.",
      "Albariño": "Albariño is most closely associated with Rías Baixas in Spain.",
      "Garganega": "Garganega is the principal white grape of Soave in Italy."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the term for the practice of cultivating grapes for winemaking?",
    "options": [
      "Agriculture",
      "Horticulture",
      "Viticulture",
      "Vinification"
    ],
    "correctAnswer": "Viticulture",
    "explanation": "Viticulture is the science, production, and study of grapes, which primarily deals with grape cultivation for wine.",
    "wrongAnswerExplanations": {
      "Agriculture": "Agriculture is the broad practice of farming, not specific to grape growing.",
      "Horticulture": "Horticulture is the general cultivation of garden crops, not specific to wine grapes.",
      "Vinification": "Vinification is the process of making wine from grapes, not growing them."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which of these is a common aroma found in Sauvignon Blanc?",
    "options": [
      "Black cherry",
      "Vanilla",
      "Grass or gooseberry",
      "Chocolate"
    ],
    "correctAnswer": "Grass or gooseberry",
    "explanation": "Sauvignon Blanc is often characterized by its herbaceous notes, including grass, bell pepper, and gooseberry.",
    "wrongAnswerExplanations": {
      "Black cherry": "Black cherry is typically associated with red wines like Cabernet Sauvignon or Merlot.",
      "Vanilla": "Vanilla comes from oak aging and isn't characteristic of typical Sauvignon Blanc.",
      "Chocolate": "Chocolate notes are found in red wines, particularly those with oak aging or certain varietals."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the name of the sweet wine made from grapes frozen on the vine?",
    "options": [
      "Port",
      "Sherry",
      "Ice Wine",
      "Marsala"
    ],
    "correctAnswer": "Ice Wine",
    "explanation": "Ice wine or Eiswein is a type of dessert wine produced from grapes that have been frozen while still on the vine.",
    "wrongAnswerExplanations": {
      "Port": "Port is a fortified wine from Portugal, not made from frozen grapes.",
      "Sherry": "Sherry is a fortified wine from Spain, not made from frozen grapes.",
      "Marsala": "Marsala is a fortified wine from Sicily, not made from frozen grapes."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which red grape is a key component of 'Super Tuscan' wines?",
    "options": [
      "Nebbiolo",
      "Sangiovese",
      "Primitivo",
      "Montepulciano"
    ],
    "correctAnswer": "Sangiovese",
    "explanation": "While Super Tuscans often include international varietals like Cabernet Sauvignon, Sangiovese remains the backbone of many, if not all, of them.",
    "wrongAnswerExplanations": {
      "Nebbiolo": "Nebbiolo is from Piedmont and used in Barolo, not Super Tuscan wines.",
      "Primitivo": "Primitivo is primarily grown in southern Italy, not Tuscany.",
      "Montepulciano": "Montepulciano is used in central Italian wines but not typically in Super Tuscans."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "What does DOCG indicate on an Italian wine label?",
    "options": [
      "A protected designation with guaranteed controls",
      "A generic table wine without geographic rules",
      "A sparkling-wine sweetness level below Brut",
      "A vineyard site owned by a single producer"
    ],
    "correctAnswer": "A protected designation with guaranteed controls",
    "explanation": "DOCG means Denominazione di Origine Controllata e Garantita, an Italian designation with defined origin and production rules plus additional controls.",
    "wrongAnswerExplanations": {
      "A generic table wine without geographic rules": "Generic table-wine categories do not carry DOCG's protected origin and controls.",
      "A sparkling-wine sweetness level below Brut": "DOCG is an origin classification, not a sweetness term.",
      "A vineyard site owned by a single producer": "A single-owner site may be called a monopole; that is unrelated to DOCG."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which of these is typically a light-bodied red wine?",
    "options": [
      "Cabernet Sauvignon",
      "Syrah",
      "Pinot Noir",
      "Zinfandel"
    ],
    "correctAnswer": "Pinot Noir",
    "explanation": "Pinot Noir is known for its delicate structure and lighter body compared to other red varietals.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "Cabernet Sauvignon is typically full-bodied with high tannins and intense flavors.",
      "Syrah": "Syrah produces full-bodied, powerful wines with dark fruit and spice.",
      "Zinfandel": "Zinfandel can range from medium to full-bodied, usually with higher alcohol content."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the term for the 'bouquet' of a wine?",
    "options": [
      "Aromas developed through fermentation and aging",
      "Fresh grape-derived fruit and floral aromas",
      "Sweetness perceived from residual grape sugar",
      "Tactile weight and fullness felt in the mouth"
    ],
    "correctAnswer": "Aromas developed through fermentation and aging",
    "explanation": "The bouquet refers to the complex aromas that develop in a wine as a result of fermentation and aging, particularly in the bottle.",
    "wrongAnswerExplanations": {
      "Fresh grape-derived fruit and floral aromas": "Those are commonly described as primary aromas rather than bouquet.",
      "Sweetness perceived from residual grape sugar": "Sweetness is a taste sensation, not bouquet.",
      "Tactile weight and fullness felt in the mouth": "That describes body, not bouquet."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which white grape is known for producing full-bodied, often buttery wines, especially when oaked?",
    "options": [
      "Riesling",
      "Sauvignon Blanc",
      "Pinot Grigio",
      "Chardonnay"
    ],
    "correctAnswer": "Chardonnay",
    "explanation": "Chardonnay is a versatile grape that can produce a wide range of styles, but it's particularly known for its full-bodied, buttery, and often oak-influenced expressions.",
    "wrongAnswerExplanations": {
      "Riesling": "Riesling typically produces lighter, more aromatic wines with floral and citrus notes.",
      "Sauvignon Blanc": "Sauvignon Blanc is known for crisp, herbaceous wines, not buttery, full-bodied ones.",
      "Pinot Grigio": "Pinot Grigio typically produces light, crisp wines, not full-bodied, buttery ones."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the ideal temperature range for storing most wines long-term?",
    "options": [
      "30-40°F",
      "45-65°F",
      "70-80°F",
      "Below 30°F"
    ],
    "correctAnswer": "45-65°F",
    "explanation": "Most wines are best stored at a consistent temperature between 45-65°F (7-18°C) to ensure proper aging and prevent spoilage.",
    "wrongAnswerExplanations": {
      "30-40°F": "This is too cold and could cause wine to freeze, potentially pushing out corks or damaging the wine.",
      "70-80°F": "This is too warm and would accelerate aging, potentially causing wines to deteriorate quickly.",
      "Below 30°F": "Freezing temperatures would damage the wine and could cause bottles to break."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which of these terms describes a wine with high acidity?",
    "options": [
      "Flabby",
      "Crisp",
      "Soft",
      "Round"
    ],
    "correctAnswer": "Crisp",
    "explanation": "A wine with high acidity is often described as crisp or tart, providing a refreshing sensation on the palate.",
    "wrongAnswerExplanations": {
      "Flabby": "Flabby describes wines with low acidity that lack structure and freshness.",
      "Soft": "Soft typically refers to wines with low tannins or acidity, the opposite of crisp.",
      "Round": "Round describes wines that are well-balanced and smooth, not necessarily high in acidity."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the purpose of sulfur dioxide (SO₂) in winemaking?",
    "options": [
      "To add sweetness",
      "To remove color",
      "As an antioxidant and antimicrobial agent",
      "To increase alcohol content"
    ],
    "correctAnswer": "As an antioxidant and antimicrobial agent",
    "explanation": "SO₂ is used in carefully controlled amounts to protect wine from oxidation and inhibit unwanted microbial growth.",
    "wrongAnswerExplanations": {
      "To add sweetness": "SO2 doesn't add sweetness; residual sugar provides sweetness in wine.",
      "To remove color": "SO2 doesn't remove color; it helps preserve the wine's existing characteristics.",
      "To increase alcohol content": "Alcohol comes from fermentation of sugars; SO2 doesn't affect alcohol levels."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which grape is used to make the famous sparkling wine Prosecco?",
    "options": [
      "Chardonnay",
      "Pinot Noir",
      "Glera",
      "Riesling"
    ],
    "correctAnswer": "Glera",
    "explanation": "Prosecco is an Italian sparkling wine made primarily from the Glera grape.",
    "wrongAnswerExplanations": {
      "Chardonnay": "Chardonnay is used in Champagne and other sparkling wines, but not Prosecco.",
      "Pinot Noir": "Pinot Noir is used in Champagne production but not in Prosecco.",
      "Riesling": "Riesling is used for still wines and some sparkling wines in Germany, not Prosecco."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the term for a wine that has a strong, unpleasant smell of vinegar?",
    "options": [
      "Oxidized",
      "Corked",
      "Volatile Acidity",
      "Brettanomyces"
    ],
    "correctAnswer": "Volatile Acidity",
    "explanation": "Volatile acidity (VA) is a wine fault characterized by aromas of vinegar or nail polish remover, caused by acetic acid bacteria.",
    "wrongAnswerExplanations": {
      "Oxidized": "Oxidized wines smell like sherry, nuts, or bruised apples, not vinegar.",
      "Corked": "Corked wines smell musty or like wet cardboard, not vinegary.",
      "Brettanomyces": "Brettanomyces creates barnyard or medicinal aromas, not vinegar smells."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which type of wine is typically served with chocolate desserts?",
    "options": [
      "Dry Cabernet with firm tannin",
      "Dry Sauvignon Blanc with herbs",
      "Sweet Port or Banyuls with richness",
      "Brut sparkling wine with citrus"
    ],
    "correctAnswer": "Sweet Port or Banyuls with richness",
    "explanation": "Sweet, rich wines like Port or Banyuls pair well with chocolate, as their sweetness and intensity can stand up to the dessert.",
    "wrongAnswerExplanations": {
      "Dry Cabernet with firm tannin": "A dry, tannic red can seem bitter beside a sweet chocolate dessert.",
      "Dry Sauvignon Blanc with herbs": "Herbal acidity is usually overwhelmed by rich chocolate.",
      "Brut sparkling wine with citrus": "Dry sparkling wine can taste severe beside a sweet, intense dessert."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What does 'non-vintage' (NV) mean on a sparkling wine label?",
    "options": [
      "It was aged for an unusually long time",
      "It blends wines from more than one harvest year",
      "It skipped secondary fermentation before bottling",
      "Its grapes came from outside a recognized appellation"
    ],
    "correctAnswer": "It blends wines from more than one harvest year",
    "explanation": "Non-vintage wines are blends of wines from multiple years, created to maintain a consistent house style.",
    "wrongAnswerExplanations": {
      "It was aged for an unusually long time": "Non-vintage describes the harvest years in the blend, not the wine's age.",
      "It skipped secondary fermentation before bottling": "Sparkling wines can be vintage or non-vintage regardless of the exact production method.",
      "Its grapes came from outside a recognized appellation": "Geographic origin and vintage status are separate label concepts."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which of these is a common characteristic of a tannic red wine?",
    "options": [
      "Smooth and soft",
      "Drying sensation in the mouth",
      "Fruity and sweet",
      "Light-bodied"
    ],
    "correctAnswer": "Drying sensation in the mouth",
    "explanation": "Tannins create a drying, sometimes bitter, sensation in the mouth, especially noticeable on the gums and tongue.",
    "wrongAnswerExplanations": {
      "Smooth and soft": "High tannins create texture and grip, opposite of smooth and soft.",
      "Fruity and sweet": "Tannins affect mouthfeel and structure, not fruitiness or sweetness.",
      "Light-bodied": "Tannic wines are usually medium to full-bodied; tannins add weight and structure."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "Which cellar technique moves clear wine into another vessel while leaving settled sediment behind?",
    "options": [
      "Racking",
      "Fining",
      "Filtration",
      "Disgorgement"
    ],
    "correctAnswer": "Racking",
    "explanation": "Racking gently transfers clear wine off its lees or other sediment. Fining and filtration clarify by different mechanisms.",
    "wrongAnswerExplanations": {
      "Fining": "Fining adds a binding agent that helps selected particles settle or become removable.",
      "Filtration": "Filtration passes wine through a medium that captures selected particles or microorganisms.",
      "Disgorgement": "Disgorgement ejects collected yeast sediment from a traditional-method sparkling-wine bottle."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which variety is ranked as the world's most widely planted wine grape in modern global vineyard-area studies?",
    "options": [
      "Merlot",
      "Airén",
      "Cabernet Sauvignon",
      "Chardonnay"
    ],
    "correctAnswer": "Cabernet Sauvignon",
    "explanation": "Cabernet Sauvignon overtook Airén in modern global wine-grape bearing-area rankings. Airén led around the start of this century, while Kyoho ranks above Cabernet Sauvignon only when table grapes and other non-wine uses are included.",
    "wrongAnswerExplanations": {
      "Merlot": "Merlot is among the world's most planted wine grapes, but it ranks behind Cabernet Sauvignon.",
      "Airén": "Airén was the leading wine grape around the start of this century, but it no longer holds the top position.",
      "Chardonnay": "Chardonnay is planted worldwide, but its total bearing area is smaller than Cabernet Sauvignon's."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "What is the famous fortified wine produced around Jerez, Spain?",
    "options": [
      "Port",
      "Madeira",
      "Sherry",
      "Marsala"
    ],
    "correctAnswer": "Sherry",
    "explanation": "Sherry is the fortified wine of the Jerez area. Major traditional styles such as Fino, Manzanilla, Amontillado, and Oloroso are dry, while other styles are sweet.",
    "wrongAnswerExplanations": {
      "Port": "Port is a fortified wine from Portugal, not Spain.",
      "Madeira": "Madeira is a fortified wine from the Portuguese island of Madeira.",
      "Marsala": "Marsala is a fortified wine from Sicily, Italy, not Spain."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which of these is a common aroma found in aged Pinot Noir?",
    "options": [
      "Green apple",
      "Citrus",
      "Forest floor or mushroom",
      "Tropical fruit"
    ],
    "correctAnswer": "Forest floor or mushroom",
    "explanation": "As Pinot Noir ages, it often develops complex tertiary aromas of forest floor, mushroom, and savory notes.",
    "wrongAnswerExplanations": {
      "Green apple": "Green apple is more characteristic of white wines like Sauvignon Blanc or young Chardonnay.",
      "Citrus": "Citrus notes are typical of white wines, not aged Pinot Noir.",
      "Tropical fruit": "Tropical fruit aromas are found in wines from warm climates or certain white varieties, not aged Pinot Noir."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What does 'balance' mean when describing a wine?",
    "options": [
      "Its sweetness, acidity, alcohol, fruit, and tannin feel harmonious",
      "Its bottle stands upright without leaning on the table",
      "Its color stays identical from rim to center",
      "Its label lists equal amounts of every grape variety"
    ],
    "correctAnswer": "Its sweetness, acidity, alcohol, fruit, and tannin feel harmonious",
    "explanation": "A balanced wine has no major structural element—such as acidity, sweetness, alcohol, fruit, or tannin—overwhelming the others.",
    "wrongAnswerExplanations": {
      "Its bottle stands upright without leaning on the table": "Physical bottle stability is unrelated to sensory balance.",
      "Its color stays identical from rim to center": "Color variation can offer clues about age, but it does not define balance.",
      "Its label lists equal amounts of every grape variety": "A blend can be balanced without equal proportions."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which type of wine is typically served very chilled, often as a dessert wine?",
    "options": [
      "Dry red wine",
      "Dry white wine",
      "Ice Wine",
      "Rosé wine"
    ],
    "correctAnswer": "Ice Wine",
    "explanation": "Ice wine or Eiswein is a sweet dessert wine that is best served very chilled to enhance its sweetness and acidity.",
    "wrongAnswerExplanations": {
      "Dry red wine": "Red wines are typically served at cellar temperature, not very chilled.",
      "Dry white wine": "White wines are served chilled but not as cold as dessert wines.",
      "Rosé wine": "Rosé is served chilled but not as cold as sweet dessert wines like Ice Wine."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which grape varietal is considered Virginia's signature white grape?",
    "options": [
      "Chardonnay",
      "Viognier",
      "Sauvignon Blanc",
      "Albariño"
    ],
    "correctAnswer": "Viognier",
    "explanation": "Viognier is Virginia's official state grape, known for its aromatic and full-bodied white wines that thrive in the state's climate.",
    "wrongAnswerExplanations": {
      "Chardonnay": "While grown in Virginia, Chardonnay is not the official state grape.",
      "Sauvignon Blanc": "Sauvignon Blanc is grown in Virginia but isn't the signature grape variety.",
      "Albariño": "Albariño is a newer variety showing promise in Virginia but isn't the signature grape."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which vineyard practice helps reduce fungal pressure in humid Northern Virginia?",
    "options": [
      "Opening the canopy to improve airflow",
      "Keeping leaves densely packed around clusters",
      "Flooding the vineyard before harvest",
      "Allowing weeds to cover every fruiting zone"
    ],
    "correctAnswer": "Opening the canopy to improve airflow",
    "explanation": "Careful canopy management improves airflow and light around grape clusters, helping them dry faster after rain in Virginia's humid growing season.",
    "wrongAnswerExplanations": {
      "Keeping leaves densely packed around clusters": "Dense foliage traps humidity and can increase disease pressure.",
      "Flooding the vineyard before harvest": "Extra water near harvest can increase disease and dilution risks.",
      "Allowing weeds to cover every fruiting zone": "Unmanaged growth can restrict airflow and compete with vines rather than protect fruit."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "In vineyard site selection, what does a slope's aspect describe?",
    "options": [
      "The direction the slope faces",
      "The percentage of clay in the subsoil",
      "The age of the vines on the slope",
      "The legal yield limit for the vineyard"
    ],
    "correctAnswer": "The direction the slope faces",
    "explanation": "Aspect is the compass direction a slope faces. It affects sunlight, warmth, wind exposure, and how quickly a vineyard dries after rain.",
    "wrongAnswerExplanations": {
      "The percentage of clay in the subsoil": "Soil composition matters, but it is not what vineyard workers mean by aspect.",
      "The age of the vines on the slope": "Vine age and slope aspect are separate vineyard characteristics.",
      "The legal yield limit for the vineyard": "Yield rules may come from an appellation or producer decision, not the slope's aspect."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which Virginia AVA surrounds Charlottesville and includes Thomas Jefferson's Monticello?",
    "options": [
      "Monticello AVA",
      "Middleburg Virginia AVA",
      "Shenandoah Valley AVA",
      "Virginia's Eastern Shore AVA"
    ],
    "correctAnswer": "Monticello AVA",
    "explanation": "The Monticello AVA is centered around Charlottesville in Virginia's Piedmont and takes its name from Thomas Jefferson's nearby home.",
    "wrongAnswerExplanations": {
      "Middleburg Virginia AVA": "The Middleburg Virginia AVA lies in Northern Virginia around Middleburg, not Charlottesville.",
      "Shenandoah Valley AVA": "The Shenandoah Valley AVA follows the valley west of the Blue Ridge rather than surrounding Charlottesville.",
      "Virginia's Eastern Shore AVA": "Virginia's Eastern Shore AVA is on the coastal peninsula between the Chesapeake Bay and Atlantic Ocean."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which growing-season condition commonly challenges Northern Virginia vineyards?",
    "options": [
      "Warm humidity and frequent rainfall",
      "A completely rainless summer",
      "Year-round tropical heat",
      "Permanent winter frost"
    ],
    "correctAnswer": "Warm humidity and frequent rainfall",
    "explanation": "Northern Virginia's warm, humid growing season can increase fungal pressure, so airflow, canopy management, drainage, and timely vineyard work are important.",
    "wrongAnswerExplanations": {
      "A completely rainless summer": "Northern Virginia normally receives summer rainfall and is not a desert climate.",
      "Year-round tropical heat": "The region has four distinct seasons rather than tropical temperatures all year.",
      "Permanent winter frost": "Winter cold occurs, but frost is not permanent through the growing season."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which site characteristic can help a Northern Virginia vineyard recover after heavy rain?",
    "options": [
      "Well-drained, sloping soil",
      "A low pocket where water collects",
      "Compacted soil with no pore space",
      "A permanently saturated root zone"
    ],
    "correctAnswer": "Well-drained, sloping soil",
    "explanation": "A well-drained slope can move excess water and cold air away from vines, reducing waterlogging and some disease and frost risks.",
    "wrongAnswerExplanations": {
      "A low pocket where water collects": "Low pockets can retain water and cold air, increasing vineyard risk.",
      "Compacted soil with no pore space": "Compaction restricts drainage and root growth.",
      "A permanently saturated root zone": "Grapevine roots need oxygen; persistent saturation can damage roots and encourage disease."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which of these is a hybrid grape varietal sometimes grown in Virginia, known for its disease resistance?",
    "options": [
      "Cabernet Sauvignon",
      "Chardonnay",
      "Chambourcin",
      "Merlot"
    ],
    "correctAnswer": "Chambourcin",
    "explanation": "Chambourcin is a French-American hybrid grape that offers good disease resistance, making it suitable for Virginia's humid climate.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "Cabernet Sauvignon is a European vinifera grape, not a hybrid.",
      "Chardonnay": "Chardonnay is a European vinifera grape, not a hybrid.",
      "Merlot": "Merlot is a European vinifera grape, not a hybrid."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which historical figure experimented extensively with European wine grapes at Monticello?",
    "options": [
      "Thomas Jefferson",
      "Benjamin Franklin",
      "James Madison",
      "George Mason"
    ],
    "correctAnswer": "Thomas Jefferson",
    "explanation": "Thomas Jefferson pursued viticulture at Monticello and promoted the idea that Virginia could produce fine wine, even though his own experiments struggled.",
    "wrongAnswerExplanations": {
      "Benjamin Franklin": "Franklin appreciated wine but is not the figure most associated with Monticello's vineyard experiments.",
      "James Madison": "Madison lived at Montpelier, not Monticello.",
      "George Mason": "Mason's home was Gunston Hall; Monticello belonged to Jefferson."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which type of wine is Virginia increasingly gaining recognition for, besides its still wines?",
    "options": [
      "Fortified wines",
      "Dessert wines",
      "Sparkling wines",
      "Organic wines"
    ],
    "correctAnswer": "Sparkling wines",
    "explanation": "Virginia's terroir and winemaking expertise are increasingly producing high-quality sparkling wines, often made using the traditional method.",
    "wrongAnswerExplanations": {
      "Fortified wines": "Virginia is not particularly known for fortified wine production.",
      "Dessert wines": "While some dessert wines are made, sparkling wines are gaining more widespread recognition.",
      "Organic wines": "While some organic wines are made, sparkling wines are a specific category gaining recognition."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which natural feature helps define the western side of Loudoun County's wine landscape?",
    "options": [
      "The Blue Ridge Mountains",
      "The Appalachian Plateau",
      "The Atlantic barrier islands",
      "The Great Dismal Swamp"
    ],
    "correctAnswer": "The Blue Ridge Mountains",
    "explanation": "The Blue Ridge Mountains form a dramatic western edge to Loudoun County and influence elevation, slope exposure, air movement, and local vineyard conditions.",
    "wrongAnswerExplanations": {
      "The Appalachian Plateau": "The Appalachian Plateau lies much farther west and does not define Loudoun's landscape.",
      "The Atlantic barrier islands": "Virginia's barrier islands are far east of Loudoun County.",
      "The Great Dismal Swamp": "The Great Dismal Swamp is in southeastern Virginia, not Loudoun."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "What is a common food pairing for Virginia ham?",
    "options": [
      "Bone-dry, heavily oaked Cabernet Sauvignon",
      "Rich, syrupy late-harvest Petit Manseng",
      "Crisp dry rosé or bright Cabernet Franc",
      "Sweet, fortified ruby Port"
    ],
    "correctAnswer": "Crisp dry rosé or bright Cabernet Franc",
    "explanation": "The saltiness and richness of Virginia ham pair well with a crisp dry rosé or a fruit-forward, slightly herbal Cabernet Franc.",
    "wrongAnswerExplanations": {
      "Bone-dry, heavily oaked Cabernet Sauvignon": "Heavy oak and firm tannin can dominate the ham's savory character.",
      "Rich, syrupy late-harvest Petit Manseng": "A concentrated dessert style is usually sweeter and heavier than this pairing needs.",
      "Sweet, fortified ruby Port": "Ruby Port is far sweeter and more alcoholic than a typical pairing for salty ham."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which statement best describes the grapes grown in Northern Virginia?",
    "options": [
      "Growers use European vinifera grapes, hybrids, and some native varieties",
      "Every vineyard grows only native American grape species",
      "European wine grapes cannot survive anywhere in the region",
      "All local wine must be made from a single hybrid grape"
    ],
    "correctAnswer": "Growers use European vinifera grapes, hybrids, and some native varieties",
    "explanation": "Northern Virginia vineyards grow many Vitis vinifera varieties—including Cabernet Franc, Petit Verdot, Chardonnay, and Viognier—alongside selected hybrids and native grapes.",
    "wrongAnswerExplanations": {
      "Every vineyard grows only native American grape species": "European vinifera varieties are widely planted in Northern Virginia.",
      "European wine grapes cannot survive anywhere in the region": "Many vinifera grapes are successfully cultivated with careful site and disease management.",
      "All local wine must be made from a single hybrid grape": "Virginia wineries work with many grapes and styles; no such single-grape requirement exists."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which of these is a common characteristic of Virginia's climate that influences its wines?",
    "options": [
      "Very dry summers",
      "High humidity",
      "Consistently cold temperatures",
      "Volcanic soil"
    ],
    "correctAnswer": "High humidity",
    "explanation": "Virginia's humid summers can lead to challenges like fungal diseases but also contribute to the unique character of its wines.",
    "wrongAnswerExplanations": {
      "Very dry summers": "Virginia summers are humid, not dry.",
      "Consistently cold temperatures": "Virginia has warm summers and variable temperatures, not consistently cold ones.",
      "Volcanic soil": "Virginia doesn't have significant volcanic soils; this is more characteristic of regions like Oregon."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "What does hedging accomplish in a vigorous vineyard canopy?",
    "options": [
      "It trims shoot tips to keep growth manageable",
      "It removes every leaf from the fruiting zone",
      "It adds sugar to grapes before harvest",
      "It seals the vineyard floor against rainfall"
    ],
    "correctAnswer": "It trims shoot tips to keep growth manageable",
    "explanation": "Hedging trims long shoot tips so rows remain workable and the canopy does not become excessively tangled or shaded.",
    "wrongAnswerExplanations": {
      "It removes every leaf from the fruiting zone": "Complete defoliation is not the goal of hedging; hedging trims shoot growth.",
      "It adds sugar to grapes before harvest": "Adding sugar is a cellar decision called chaptalization, not a vineyard hedging practice.",
      "It seals the vineyard floor against rainfall": "Hedging concerns vine shoots, not waterproofing the soil."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which white grape varietal, known for its crispness, is gaining popularity in Virginia?",
    "options": [
      "Pinot Grigio",
      "Riesling",
      "Albariño",
      "Gewürztraminer"
    ],
    "correctAnswer": "Albariño",
    "explanation": "Albariño, a Spanish white grape, is showing promise in Virginia, producing vibrant, aromatic wines with good acidity.",
    "wrongAnswerExplanations": {
      "Pinot Grigio": "While grown, Pinot Grigio is not specifically noted as gaining popularity for its crispness.",
      "Riesling": "Riesling is grown but Albariño is the specific variety gaining recognition for its vibrant, crisp style.",
      "Gewürztraminer": "Gewürztraminer is not commonly associated with Virginia's emerging crisp white wines."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "In what year was the Middleburg Virginia American Viticultural Area established?",
    "options": [
      "1982",
      "1996",
      "2012",
      "2021"
    ],
    "correctAnswer": "2012",
    "explanation": "The federal Middleburg Virginia AVA was established on September 13, 2012, recognizing the area's distinct grape-growing geography.",
    "wrongAnswerExplanations": {
      "1982": "The Middleburg Virginia AVA had not yet been established in 1982.",
      "1996": "The federal establishment date came later, in 2012.",
      "2021": "The designation was already in place for nearly a decade by 2021."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "What is a common challenge for Virginia vineyards during hurricane season?",
    "options": [
      "Rapid sugar spikes caused by intense sunshine",
      "Heavy rain, rot pressure, and wind damage",
      "Tartrate crystals forming inside unpicked berries",
      "Premature winter dormancy in vine roots"
    ],
    "correctAnswer": "Heavy rain, rot pressure, and wind damage",
    "explanation": "Hurricane season can bring heavy rains and strong winds, posing risks of rot and physical damage to vines and crops.",
    "wrongAnswerExplanations": {
      "Rapid sugar spikes caused by intense sunshine": "Hurricane systems are defined by clouds, rain, and wind rather than prolonged intense sunshine.",
      "Tartrate crystals forming inside unpicked berries": "Tartrate precipitation is a wine-stability issue, not a hurricane-season vineyard hazard.",
      "Premature winter dormancy in vine roots": "Hurricanes do not normally trigger winter dormancy."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which grape varietal is often blended with Cabernet Franc in Virginia to create Bordeaux-style red blends?",
    "options": [
      "Pinot Noir",
      "Merlot",
      "Riesling",
      "Viognier"
    ],
    "correctAnswer": "Merlot",
    "explanation": "Merlot is a common blending partner with Cabernet Franc (and sometimes Cabernet Sauvignon and Petit Verdot) in Virginia's Bordeaux-style red wines.",
    "wrongAnswerExplanations": {
      "Pinot Noir": "Pinot Noir is not typically used in Bordeaux-style blends.",
      "Riesling": "Riesling is a white grape, not used in red blends.",
      "Viognier": "Viognier is a white grape, not used in red blends."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "What is the purpose of 'netting' in Virginia vineyards?",
    "options": [
      "To hold trunks upright in place of trellising",
      "To protect ripening grapes from birds and wildlife",
      "To prevent pollination between red and white varieties",
      "To collect rainwater for irrigation"
    ],
    "correctAnswer": "To protect ripening grapes from birds and wildlife",
    "explanation": "Netting is a common solution used by vineyards to prevent birds and other wildlife from consuming ripening grapes.",
    "wrongAnswerExplanations": {
      "To hold trunks upright in place of trellising": "Posts and trellis wires support vines; netting protects fruit.",
      "To prevent pollination between red and white varieties": "Wine grapes usually self-pollinate, and netting is not used to control grape color crosses.",
      "To collect rainwater for irrigation": "Vineyard nets are not rainwater-harvesting systems."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which grape is the primary variety in the wines from the 'Rioja' region?",
    "options": [
      "Tempranillo",
      "Grenache",
      "Cabernet Sauvignon",
      "Syrah"
    ],
    "correctAnswer": "Tempranillo",
    "explanation": "The Tempranillo grape is the backbone of most red wines from the Rioja region of Spain.",
    "wrongAnswerExplanations": {
      "Grenache": "Grenache is used in Rioja, but Tempranillo is the primary grape.",
      "Cabernet Sauvignon": "Cabernet Sauvignon is not traditionally used in Rioja wines.",
      "Syrah": "Syrah is not traditionally used in Rioja wines."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What type of traditional boat historically carried barrels of Port down the Douro River?",
    "options": [
      "Barco rabelo",
      "Gondola",
      "Bateau-mouche",
      "Punt"
    ],
    "correctAnswer": "Barco rabelo",
    "explanation": "Flat-bottomed barcos rabelos historically transported Port barrels from the Douro Valley toward the lodges near Porto and Vila Nova de Gaia.",
    "wrongAnswerExplanations": {
      "Gondola": "A gondola is associated with Venice rather than the Douro wine trade.",
      "Bateau-mouche": "A bateau-mouche is a sightseeing boat associated with Paris, not a traditional Port carrier.",
      "Punt": "A punt is a flat-bottomed recreational boat propelled with a pole, not the named Douro cargo boat."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which grape is widely considered the 'flagship' red varietal of Portugal, used in both Port and dry reds?",
    "options": [
      "Tempranillo",
      "Touriga Nacional",
      "Sangiovese",
      "Malbec"
    ],
    "correctAnswer": "Touriga Nacional",
    "explanation": "Touriga Nacional is prized for its small berries, deep color, and intense tannins, providing the backbone for Portugal's finest wines.",
    "wrongAnswerExplanations": {
      "Tempranillo": "Known as Tinta Roriz in Portugal, it is important but Touriga Nacional is the true flagship.",
      "Sangiovese": "This is the signature grape of Italy's Tuscany region.",
      "Malbec": "Malbec is the signature grape of Argentina."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "The Alentejo region of Portugal is responsible for producing over 50% of the world's supply of what winemaking material?",
    "options": [
      "Glass bottles",
      "Oak barrels",
      "Cork",
      "Synthetic closures"
    ],
    "correctAnswer": "Cork",
    "explanation": "The Alentejo is home to massive forests of Quercus suber (Cork Oak), making Portugal the global leader in natural cork production.",
    "wrongAnswerExplanations": {
      "Glass bottles": "Bottle manufacturing is spread globally; Alentejo is specific to agriculture.",
      "Oak barrels": "Most premium barrels come from French or American oak forests.",
      "Synthetic closures": "These are manufactured in factories, not harvested from Alentejo forests."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the unique soil type of the Douro Valley that allows vines to thrive in high heat by retaining moisture?",
    "options": [
      "Schist",
      "Chalk",
      "Volcanic Ash",
      "Clay"
    ],
    "correctAnswer": "Schist",
    "explanation": "Schist is a laminated rock that breaks vertically, allowing vine roots to grow deep into the earth to find water during dry summers.",
    "wrongAnswerExplanations": {
      "Chalk": "Famous in Champagne, France, for its drainage and acidity retention.",
      "Volcanic Ash": "Common in Canary Islands or Mt. Etna, but not the Douro.",
      "Clay": "While present in some regions, it is the rock-hard Schist that defines Douro terroir."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "In the Alentejo region, what traditional vessels are often used for fermenting and aging 'Vinho de Talha'?",
    "options": [
      "Stainless steel tanks",
      "Small oak barriques",
      "Large clay amphorae",
      "Concrete eggs"
    ],
    "correctAnswer": "Large clay amphorae",
    "explanation": "Vinho de Talha refers to the 2,000-year-old tradition of making wine in large clay pots, a practice still preserved in Alentejo.",
    "wrongAnswerExplanations": {
      "Stainless steel tanks": "These are used for modern, temperature-controlled winemaking.",
      "Small oak barriques": "A French tradition used for imparting vanilla and spice flavors.",
      "Concrete eggs": "A modern biodynamic trend, not the ancient 'Talha' tradition."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which bold red grape variety has become the undisputed signature grape of Uruguay?",
    "options": [
      "Merlot",
      "Tannat",
      "Syrah",
      "Carmenere"
    ],
    "correctAnswer": "Tannat",
    "explanation": "Uruguayan Tannat is known for being more approachable and softer than its French ancestors, while maintaining its firm structure.",
    "wrongAnswerExplanations": {
      "Merlot": "Grows well in Uruguay but is not the national signature.",
      "Syrah": "Common in the 'New World' but Tannat is Uruguay's claim to fame.",
      "Carmenere": "This is the signature grape of Uruguay's neighbor, Chile."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Uruguay’s wine regions are heavily influenced by their proximity to which body of water?",
    "options": [
      "Pacific Ocean",
      "Mediterranean Sea",
      "Atlantic Ocean",
      "Gulf of Mexico"
    ],
    "correctAnswer": "Atlantic Ocean",
    "explanation": "The Atlantic and the Rio de la Plata provide cooling breezes that create a maritime climate similar to Bordeaux.",
    "wrongAnswerExplanations": {
      "Pacific Ocean": "This influences Chile and California, but not Uruguay on the east coast.",
      "Mediterranean Sea": "This is located between Europe and Africa.",
      "Gulf of Mexico": "This is located in North America."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Who is credited with bringing the first Tannat vines to Uruguay in the 1870s?",
    "options": [
      "Thomas Jefferson",
      "Pascual Harriague",
      "James Busby",
      "Agoston Haraszthy"
    ],
    "correctAnswer": "Pascual Harriague",
    "explanation": "Harriague, a Basque settler, successfully cultivated the grape in the Salto region, which is why Tannat is sometimes called 'Harriague' locally.",
    "wrongAnswerExplanations": {
      "Thomas Jefferson": "Jefferson tried to bring European vines to Virginia, not Uruguay.",
      "James Busby": "Known as the father of the Australian wine industry.",
      "Agoston Haraszthy": "Founder of Buena Vista Winery and father of California viticulture."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which region in Uruguay is considered a promising emerging area, known for coastal influence and Bodega Garzón?",
    "options": [
      "Mendoza",
      "Maldonado",
      "Canelones",
      "Colchagua"
    ],
    "correctAnswer": "Maldonado",
    "explanation": "Maldonado, specifically the Garzón area, features thin soils and ocean breezes that produce high-quality, mineral-driven wines.",
    "wrongAnswerExplanations": {
      "Mendoza": "This is the primary wine region of Argentina.",
      "Canelones": "This is Uruguay's largest wine region, but more inland and traditional than Maldonado.",
      "Colchagua": "A famous valley located in Chile."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Compared to French Tannat, Uruguayan Tannat is generally described as being...",
    "options": [
      "More acidic and harsher",
      "Lower in alcohol",
      "Fruitier with softer tannins",
      "Exclusively sweet"
    ],
    "correctAnswer": "Fruitier with softer tannins",
    "explanation": "Uruguay's climate allows the grape to ripen fully, resulting in a more velvet-like texture compared to the rustic versions from Madiran, France.",
    "wrongAnswerExplanations": {
      "More acidic and harsher": "This describes Tannat grown in cooler, more traditional French climates.",
      "Lower in alcohol": "Warmer New World climates often lead to slightly higher alcohol.",
      "Exclusively sweet": "While some late-harvest versions exist, the vast majority is dry red wine."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "For decades, many Chilean vineyards thought they were growing Merlot, only to discover it was actually which 'lost' Bordeaux variety?",
    "options": [
      "Malbec",
      "Petit Verdot",
      "Carmenere",
      "Cabernet Franc"
    ],
    "correctAnswer": "Carmenere",
    "explanation": "DNA testing in 1994 revealed that much of Chile's Merlot was actually Carmenere, which had been nearly extinct in Europe.",
    "wrongAnswerExplanations": {
      "Malbec": "Malbec was never confused with Merlot in Chile on a large scale.",
      "Petit Verdot": "Used primarily as a blending grape, its leaf and berry shape are distinct.",
      "Cabernet Franc": "Though a parent of Merlot, it was not the subject of the famous Chilean mix-up."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Chile is one of the few wine-producing countries in the world that has never been affected by which vineyard-destroying pest?",
    "options": [
      "Glassy-winged Sharpshooter",
      "Phylloxera",
      "Spider Mites",
      "Mealybugs"
    ],
    "correctAnswer": "Phylloxera",
    "explanation": "Thanks to the Andes mountains and the Pacific Ocean acting as natural barriers, Chile remains phylloxera-free, allowing many vines to grow on their own roots.",
    "wrongAnswerExplanations": {
      "Glassy-winged Sharpshooter": "Spreads Pierce's disease, primarily a concern in California.",
      "Spider Mites": "A common vineyard pest found in Chile and elsewhere.",
      "Mealybugs": "Commonly found in many global vineyards, including Chile."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "The Casablanca Valley in Chile is especially known for producing high-quality wines from which two cool-climate grapes?",
    "options": [
      "Cabernet and Merlot",
      "Sauvignon Blanc and Chardonnay",
      "Syrah and Malbec",
      "Zinfandel and Petite Sirah"
    ],
    "correctAnswer": "Sauvignon Blanc and Chardonnay",
    "explanation": "The Casablanca Valley's proximity to the Pacific Ocean provides the morning fog and cool breezes necessary for vibrant white wines.",
    "wrongAnswerExplanations": {
      "Cabernet and Merlot": "These prefer the warmer Maipo or Colchagua Valleys.",
      "Syrah and Malbec": "These generally require more heat than the Casablanca Valley offers.",
      "Zinfandel and Petite Sirah": "These are California specialties, rarely found in Casablanca."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which Chilean wine region is often called the 'Bordeaux of South America' due to its Cabernet Sauvignon?",
    "options": [
      "Maipo Valley",
      "Limarí Valley",
      "Bio-Bio Valley",
      "Atacama Desert"
    ],
    "correctAnswer": "Maipo Valley",
    "explanation": "Maipo is the historic heart of Chilean wine, where the country's most iconic and expensive Cabernet Sauvignons are produced.",
    "wrongAnswerExplanations": {
      "Limarí Valley": "Known for mineral-driven Chardonnays from limestone-rich soils.",
      "Bio-Bio Valley": "A very cool, southern region known for Pinot Noir and Riesling.",
      "Atacama Desert": "One of the driest places on earth; only very experimental viticulture happens here."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the primary cooling influence that allows Chilean grapes to maintain acidity despite the sunny climate?",
    "options": [
      "The Gulf Stream",
      "The Humboldt Current",
      "The Jet Stream",
      "The Monsoon"
    ],
    "correctAnswer": "The Humboldt Current",
    "explanation": "This cold ocean current brings icy water from Antarctica up the coast of Chile, creating cooling breezes that reach the inland valleys.",
    "wrongAnswerExplanations": {
      "The Gulf Stream": "This warm current influences the climate of Europe and the US East Coast.",
      "The Jet Stream": "A high-altitude air current that affects global weather patterns, not specific coastal cooling.",
      "The Monsoon": "A seasonal wind pattern associated with heavy rain in Asia."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "While Malbec is the king of red grapes in Argentina, which unique white grape is considered its aromatic white 'queen'?",
    "options": [
      "Torrontés",
      "Viognier",
      "Riesling",
      "Gewürztraminer"
    ],
    "correctAnswer": "Torrontés",
    "explanation": "Torrontés is an indigenous Argentine grape known for its intense floral aromas of jasmine and geranium.",
    "wrongAnswerExplanations": {
      "Viognier": "Grows well in Argentina, but Torrontés is the unique national specialty.",
      "Riesling": "Mostly associated with Germany and cooler climates like Virginia or the Finger Lakes.",
      "Gewürztraminer": "Known for lychee notes, it is much less common in Argentina than Torrontés."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "In Argentina, 'High Altitude' viticulture is essential. In which province would you find the celebrated Uco Valley?",
    "options": [
      "Salta",
      "San Juan",
      "Mendoza",
      "Patagonia"
    ],
    "correctAnswer": "Mendoza",
    "explanation": "The Uco Valley in Mendoza features some of the highest vineyards in the world, producing Malbecs with incredible color and acidity.",
    "wrongAnswerExplanations": {
      "Salta": "Located further north, Salta is famous for even higher altitude vineyards (like Cafayate).",
      "San Juan": "Argentina's second-largest wine region, known for Syrah and everyday wines.",
      "Patagonia": "The southernmost region, much cooler and lower in elevation than the Uco Valley."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What is the primary source of water for irrigation in the desert-like wine regions of Mendoza?",
    "options": [
      "Desalinated ocean water",
      "Snowmelt from the Andes Mountains",
      "Local rainfall",
      "Deep underground salt aquifers"
    ],
    "correctAnswer": "Snowmelt from the Andes Mountains",
    "explanation": "Argentina's wine regions are rain shadows; they rely on a network of canals carrying pure snowmelt from the Andes peaks.",
    "wrongAnswerExplanations": {
      "Desalinated ocean water": "Mendoza is far inland and high elevation; ocean water is not accessible.",
      "Local rainfall": "Mendoza is extremely dry, receiving only about 8-10 inches of rain per year.",
      "Deep underground salt aquifers": "Salty water would damage the vines; fresh snowmelt is the preferred source."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Why can high-elevation vineyards help Malbec retain freshness in sunny Mendoza?",
    "options": [
      "Cooler nights slow acid loss in the grapes",
      "Thin air prevents grapes from developing color",
      "Mountain soils eliminate the need for irrigation",
      "Higher sites always receive more annual rainfall"
    ],
    "correctAnswer": "Cooler nights slow acid loss in the grapes",
    "explanation": "Mendoza's high vineyards can combine strong daytime sunlight with cool nights, helping grapes develop color and flavor while retaining acidity.",
    "wrongAnswerExplanations": {
      "Thin air prevents grapes from developing color": "Strong ultraviolet light at elevation can contribute to color development rather than prevent it.",
      "Mountain soils eliminate the need for irrigation": "Most Mendoza vineyards still depend on irrigation supplied largely by Andean snowmelt.",
      "Higher sites always receive more annual rainfall": "Elevation affects temperature, but Mendoza remains broadly dry and rain-shadowed."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "The Zonda is a significant climatic factor in Argentina. What exactly is it?",
    "options": [
      "A type of irrigation canal",
      "A fierce, hot, dry wind from the Andes",
      "A specific type of granite soil",
      "A traditional harvest festival"
    ],
    "correctAnswer": "A fierce, hot, dry wind from the Andes",
    "explanation": "The Zonda can reach high speeds and high temperatures, sometimes damaging flowering vines but also helping prevent grape diseases.",
    "wrongAnswerExplanations": {
      "A type of irrigation canal": "These are called 'Acequias' in Mendoza.",
      "A specific type of granite soil": "Terras are varied, but Zonda refers to the air.",
      "A traditional harvest festival": "The famous harvest festival in Mendoza is called 'Fiesta Nacional de la Vendimia'."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which white grape, a specialty of Southwest France, has become a notable success in Loudoun due to its thick skins and high acidity?",
    "options": [
      "Chardonnay",
      "Petit Manseng",
      "Chenin Blanc",
      "Viura"
    ],
    "correctAnswer": "Petit Manseng",
    "explanation": "Native to Jurançon in SW France, Petit Manseng is perfectly adapted to Loudoun’s humidity because its loose clusters and thick skins resist rot.",
    "wrongAnswerExplanations": {
      "Chardonnay": "A Burgundy native that is popular but more prone to rot in Virginia's humidity.",
      "Chenin Blanc": "The star of the Loire Valley, not typically associated with SW France or Loudoun's primary white specialties.",
      "Viura": "A Spanish white grape, common in Rioja but rare in Loudoun."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "The Cahors region of southwest France is the historic home of which famous red grape?",
    "options": [
      "Merlot",
      "Malbec",
      "Sangiovese",
      "Zinfandel"
    ],
    "correctAnswer": "Malbec",
    "explanation": "Malbec has deep roots in Cahors, where it traditionally produces dark, structured red wines and is sometimes locally called Côt or Auxerrois.",
    "wrongAnswerExplanations": {
      "Merlot": "Originates from Bordeaux, specifically the Libournais area.",
      "Sangiovese": "The signature red grape of Tuscany, Italy.",
      "Zinfandel": "Originally from Croatia, it is considered a California heritage grape."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which Bordeaux red grape is especially well suited to Virginia and often ripens more reliably than Cabernet Sauvignon?",
    "options": [
      "Cabernet Franc",
      "Malbec",
      "Carmenere",
      "Syrah"
    ],
    "correctAnswer": "Cabernet Franc",
    "explanation": "Cabernet Franc can ripen successfully in Virginia while retaining aromatic red-fruit and herbal complexity, making it an important grape across the state.",
    "wrongAnswerExplanations": {
      "Malbec": "Successful in Loudoun but generally secondary to Cabernet Franc in total acreage.",
      "Carmenere": "The 'lost' grape of Bordeaux that is now the signature of Chile.",
      "Syrah": "Common in the Rhône Valley, it can struggle with Loudoun's winter freezes."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Toulouse is the capital of the Occitanie region. Which nearby wine area is famous for the Negrette grape, which produces unique violet-scented reds?",
    "options": [
      "Fronton",
      "Madiran",
      "Gaillac",
      "Bordeaux"
    ],
    "correctAnswer": "Fronton",
    "explanation": "Fronton is a distinctive AOC located just north of Toulouse, where Negrette must make up at least 40% of the blend.",
    "wrongAnswerExplanations": {
      "Madiran": "Famous for the Tannat grape, further west toward the Pyrenees.",
      "Gaillac": "Known for indigenous varietals like Braucol and Loin de l'Oeil.",
      "Bordeaux": "While nearby, it relies on Cabernet, Merlot, and Petit Verdot, not Negrette."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which southwest French appellation is especially associated with white wines made from Petit Manseng and Gros Manseng?",
    "options": [
      "Jurançon",
      "Madiran",
      "Cahors",
      "Fronton"
    ],
    "correctAnswer": "Jurançon",
    "explanation": "Jurançon in southwest France produces dry and sweet white wines, principally from Petit Manseng and Gros Manseng.",
    "wrongAnswerExplanations": {
      "Madiran": "Madiran is best known for powerful red wines led by Tannat.",
      "Cahors": "Cahors is the historic home of Malbec-led red wine.",
      "Fronton": "Fronton is known for red and rosé wines centered on Négrette."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which red grape gives the wines of Madiran their famously powerful tannic structure?",
    "options": [
      "Tannat",
      "Grenache",
      "Pinot Noir",
      "Barbera"
    ],
    "correctAnswer": "Tannat",
    "explanation": "Tannat is the defining red grape of Madiran in southwest France. Its name reflects the grape's naturally high tannin levels.",
    "wrongAnswerExplanations": {
      "Grenache": "A thin-skinned grape that loves the heat of the Southern Rhône and Spain.",
      "Pinot Noir": "A delicate, low-tannin grape that struggles with the heat and humidity of Northern Virginia.",
      "Barbera": "An Italian grape from Piedmont known for high acidity rather than heavy tannins."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "Which red grape is especially associated with the clay-rich Right Bank of Bordeaux?",
    "options": [
      "Cabernet Sauvignon",
      "Merlot",
      "Riesling",
      "Albariño"
    ],
    "correctAnswer": "Merlot",
    "explanation": "Merlot is central to Right Bank appellations such as Pomerol and Saint-Émilion, where clay-rich soils suit the variety.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "Dominates the 'Left Bank' gravel soils of Bordeaux.",
      "Riesling": "A cool-climate white grape from Germany or Alsace.",
      "Albariño": "A Spanish/Portuguese white grape, though very popular in Loudoun now."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What does the vineyard term 'coulure' describe?",
    "options": [
      "Poor fruit set after flowering",
      "Sunburn on ripening berries",
      "Splitting berries after heavy rain",
      "Uneven color change within a cluster"
    ],
    "correctAnswer": "Poor fruit set after flowering",
    "explanation": "Coulure occurs when flowers fail to develop into berries, often after cool, wet, or otherwise unfavorable conditions around flowering.",
    "wrongAnswerExplanations": {
      "Sunburn on ripening berries": "Sunburn is heat or light damage to exposed berries, not coulure.",
      "Splitting berries after heavy rain": "Berry splitting can follow rapid water uptake but is not the flowering-stage problem called coulure.",
      "Uneven color change within a cluster": "Uneven ripening or color change is described separately; coulure is failed fruit set."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Blanquette de Limoux is traditionally cited as an early recorded sparkling wine. What year appears in that historic claim?",
    "options": [
      "1531",
      "1668",
      "1729",
      "1815"
    ],
    "correctAnswer": "1531",
    "explanation": "Records from the Abbey of Saint-Hilaire near Limoux are traditionally cited for sparkling wine in 1531, well before Champagne became globally famous.",
    "wrongAnswerExplanations": {
      "1668": "This date is often connected in popular legend with Dom Pérignon, not the Limoux record.",
      "1729": "That is associated with the founding era of early Champagne houses, later than the Limoux record.",
      "1815": "This is centuries after the traditional 1531 Limoux reference."
    },
    "category": "world-wine-regions"
  },
  {
    "question": "What broad geographic influence do Bordeaux and Loudoun County both experience?",
    "options": [
      "High alpine vineyards above 4,500 feet",
      "Waterways and nearby uplands that shape local climate",
      "Volcanic ash soils formed by ancient calderas",
      "A rain-shadow desert dependent on snowmelt irrigation"
    ],
    "correctAnswer": "Waterways and nearby uplands that shape local climate",
    "explanation": "Bordeaux is shaped by the Atlantic and major rivers, while Loudoun is influenced by the Potomac River and the Blue Ridge foothills. Water and terrain help create local temperature and airflow patterns.",
    "wrongAnswerExplanations": {
      "High alpine vineyards above 4,500 feet": "Neither region is defined by extremely high alpine vineyards.",
      "Volcanic ash soils formed by ancient calderas": "Volcanic calderas are not the defining geology of either region.",
      "A rain-shadow desert dependent on snowmelt irrigation": "Both regions receive meaningful rainfall and are not desert wine regions."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which Virginia red grape commonly shows spicy, peppery notes with aromas of plum, blackberry, violets, and tobacco?",
    "options": [
      "Cabernet Franc",
      "Pinot Noir",
      "Chambourcin",
      "Norton"
    ],
    "correctAnswer": "Cabernet Franc",
    "explanation": "Cabernet Franc has earned a strong reputation in Virginia and is known for its fruit, spice, floral, and tobacco characteristics.",
    "wrongAnswerExplanations": {
      "Pinot Noir": "Pinot Noir is generally associated with lighter-bodied wines and red-fruit aromas rather than Cabernet Franc's peppery Virginia profile.",
      "Chambourcin": "Chambourcin is a French-American hybrid known for berry flavors, herbal aromas, and crisp acidity.",
      "Norton": "Norton is Virginia's historic native grape, known for deep color, bright acidity, and dark-fruit flavors."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which grape, traditionally used in Bordeaux blends, has become a successful stand-alone varietal in Virginia?",
    "options": [
      "Petit Verdot",
      "Riesling",
      "Pinot Grigio",
      "Gamay"
    ],
    "correctAnswer": "Petit Verdot",
    "explanation": "Virginia Petit Verdot produces dark, full-bodied wines with dense fruit, bold tannins, and excellent aging potential.",
    "wrongAnswerExplanations": {
      "Riesling": "Riesling is an aromatic white grape associated especially with Germany and is not a Bordeaux red blending grape.",
      "Pinot Grigio": "Pinot Grigio is a white grape and is not part of traditional Bordeaux red blends.",
      "Gamay": "Gamay is the red grape associated with Beaujolais, not Bordeaux blending."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Despite its aromas of stone fruit, pineapple, and orange blossom, how is Virginia Viognier usually made?",
    "options": [
      "Dry",
      "Fortified",
      "Sparkling",
      "Very sweet"
    ],
    "correctAnswer": "Dry",
    "explanation": "Viognier's intense fruit and floral aromas can suggest sweetness, but Virginia examples are usually produced in a dry style.",
    "wrongAnswerExplanations": {
      "Fortified": "Fortification involves adding a distilled spirit and is not the usual style for Virginia Viognier.",
      "Sparkling": "Virginia Viognier is generally produced as a still wine rather than a sparkling wine.",
      "Very sweet": "Its ripe aromas can suggest sweetness, but most Virginia Viognier is made dry."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which native American wine grape was first cultivated in Richmond, Virginia, during the 1820s?",
    "options": [
      "Norton",
      "Cabernet Franc",
      "Chambourcin",
      "Petit Verdot"
    ],
    "correctAnswer": "Norton",
    "explanation": "Richmond physician and horticulturist Dr. Daniel Norborne Norton created the Norton grape through crossbreeding in the 1820s. It is recognized as America's oldest cultivated native wine grape.",
    "wrongAnswerExplanations": {
      "Cabernet Franc": "Cabernet Franc originated in France and is a Vitis vinifera grape, not a native Virginia creation.",
      "Chambourcin": "Chambourcin is a French-American hybrid developed in France, not the Richmond grape created by Dr. Norton.",
      "Petit Verdot": "Petit Verdot is a French Bordeaux grape that later found success in Virginia."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which Virginia white grape has loose clusters that allow it to remain on the vine for off-dry and dessert-wine production?",
    "options": [
      "Petit Manseng",
      "Chardonnay",
      "Sauvignon Blanc",
      "Pinot Grigio"
    ],
    "correctAnswer": "Petit Manseng",
    "explanation": "Petit Manseng's loosely packed clusters help it remain healthy late into the growing season, supporting dry, off-dry, and dessert-wine styles.",
    "wrongAnswerExplanations": {
      "Chardonnay": "Chardonnay produces many styles in Virginia, but it is not especially identified by the loose-cluster trait described here.",
      "Sauvignon Blanc": "Sauvignon Blanc is known for acidity and aromatic freshness rather than late-harvest suitability from loose clusters.",
      "Pinot Grigio": "Pinot Grigio is generally made in a fresh, dry style and is not the Virginia grape described here."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which hardy, thick-skinned hybrid grape can produce dry, late-harvest, and ice-wine styles in Virginia?",
    "options": [
      "Vidal Blanc",
      "Merlot",
      "Viognier",
      "Cabernet Sauvignon"
    ],
    "correctAnswer": "Vidal Blanc",
    "explanation": "Vidal Blanc handles varied growing conditions and produces wines ranging from crisp and dry to sweet late-harvest and ice-wine styles.",
    "wrongAnswerExplanations": {
      "Merlot": "Merlot is a red Vitis vinifera grape and is not the hardy white hybrid described here.",
      "Viognier": "Viognier is an aromatic Vitis vinifera white grape, not a thick-skinned hybrid.",
      "Cabernet Sauvignon": "Cabernet Sauvignon is a red Vitis vinifera grape and is not used for the range of white-wine styles described."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "What is the term for a person who makes wine?",
    "options": [
      "Sommelier",
      "Cooper",
      "Vintner",
      "Viticulturist"
    ],
    "correctAnswer": "Vintner",
    "explanation": "A vintner or winemaker is responsible for producing wine, from processing the grapes through fermentation, aging, and blending.",
    "wrongAnswerExplanations": {
      "Sommelier": "A sommelier specializes in wine service, selection, education, and food pairing rather than wine production.",
      "Cooper": "A cooper is a craftsperson who makes and repairs wooden barrels.",
      "Viticulturist": "A viticulturist specializes in growing and managing grapevines in the vineyard."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the primary purpose of swirling wine in a glass?",
    "options": [
      "To dissolve tartrate crystals into the wine",
      "To warm the bowl and soften tannins",
      "To aerate the wine and release aromas",
      "To separate residual sugar from alcohol"
    ],
    "correctAnswer": "To aerate the wine and release aromas",
    "explanation": "Swirling increases the wine's contact with air and helps volatile aromatic compounds rise from the glass, making the wine easier to smell.",
    "wrongAnswerExplanations": {
      "To dissolve tartrate crystals into the wine": "Swirling at the table does not reliably dissolve tartrate crystals.",
      "To warm the bowl and soften tannins": "Swirling may slightly change temperature, but aroma release is its main tasting purpose.",
      "To separate residual sugar from alcohol": "Sugar and alcohol are already dissolved and do not separate through swirling."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which tasting term covers tactile sensations such as silky, creamy, grippy, or coarse?",
    "options": [
      "Mouthfeel",
      "Vintage",
      "Acidity",
      "Bouquet"
    ],
    "correctAnswer": "Mouthfeel",
    "explanation": "Mouthfeel describes the tactile impression of wine, including texture, viscosity, carbonation, warmth, and tannic grip.",
    "wrongAnswerExplanations": {
      "Vintage": "Vintage identifies the grape harvest year.",
      "Acidity": "Acidity contributes freshness and is one part of mouthfeel, but it does not cover every tactile sensation.",
      "Bouquet": "Bouquet describes developed aromas rather than texture."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What does 'palate' refer to in wine tasting?",
    "options": [
      "The wine's visual color and clarity",
      "The wine's aromas above the glass",
      "The flavors and textures perceived in the mouth",
      "The sensations that linger only after swallowing"
    ],
    "correctAnswer": "The flavors and textures perceived in the mouth",
    "explanation": "The palate encompasses the flavors, acidity, tannins, sweetness, alcohol, body, and texture perceived while tasting wine.",
    "wrongAnswerExplanations": {
      "The wine's visual color and clarity": "Those are appearance observations, not the palate.",
      "The wine's aromas above the glass": "Those belong to the nose or aroma assessment.",
      "The sensations that linger only after swallowing": "That narrower idea is the finish; palate covers the experience in the mouth."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is the 'finish' of a wine?",
    "options": [
      "The dosage added before a sparkling wine is corked",
      "The flavors and sensations lingering after tasting",
      "The point when alcoholic fermentation stops",
      "The visual brightness and clarity in the glass"
    ],
    "correctAnswer": "The flavors and sensations lingering after tasting",
    "explanation": "The finish is the collection of flavors and sensations that remains after swallowing or spitting the wine; its length and character help describe wine quality.",
    "wrongAnswerExplanations": {
      "The dosage added before a sparkling wine is corked": "That final addition is dosage, not finish.",
      "The point when alcoholic fermentation stops": "Finish is a sensory term rather than a production milestone.",
      "The visual brightness and clarity in the glass": "Clarity describes appearance; finish describes what lingers on the palate."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "What is 'must' in winemaking?",
    "options": [
      "Freshly crushed juice with grape solids",
      "Finished wine spoiled by unwanted microbes",
      "Fine sediment left after fermentation and aging",
      "Toasted oak vessel used for wine maturation"
    ],
    "correctAnswer": "Freshly crushed juice with grape solids",
    "explanation": "Must is the unfermented mixture produced after grapes are crushed, generally including juice along with skins, seeds, and sometimes stems.",
    "wrongAnswerExplanations": {
      "Finished wine spoiled by unwanted microbes": "A spoiled wine is described by its specific fault, not as must.",
      "Fine sediment left after fermentation and aging": "That sediment is generally called lees.",
      "Toasted oak vessel used for wine maturation": "That is a barrel; must is grape material before or during early fermentation."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What does 'punching down' mean in red winemaking?",
    "options": [
      "Pressing fermented skins again for heavy press wine",
      "Pushing the floating cap back into fermenting juice",
      "Removing wine from sediment into a clean vessel",
      "Pumping wine from below and spraying it over the cap"
    ],
    "correctAnswer": "Pushing the floating cap back into fermenting juice",
    "explanation": "During red-wine fermentation, grape skins rise and form a cap. Punching it down keeps the skins wet and continues the extraction of color, flavor, and tannin.",
    "wrongAnswerExplanations": {
      "Pressing fermented skins again for heavy press wine": "That is pressing, which occurs after or near the end of fermentation.",
      "Removing wine from sediment into a clean vessel": "That is racking.",
      "Pumping wine from below and spraying it over the cap": "That is a pump-over, another cap-management technique."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is 'riddling' in sparkling wine production?",
    "options": [
      "Adding yeast and sugar for bottle fermentation",
      "Rotating bottles to collect yeast in their necks",
      "Freezing the neck and ejecting the yeast plug",
      "Adding wine and sugar after sediment removal"
    ],
    "correctAnswer": "Rotating bottles to collect yeast in their necks",
    "explanation": "In traditional-method sparkling-wine production, riddling gradually moves the spent yeast sediment into the bottle's neck so it can be removed.",
    "wrongAnswerExplanations": {
      "Adding yeast and sugar for bottle fermentation": "That addition is tirage.",
      "Freezing the neck and ejecting the yeast plug": "That removal step is disgorgement.",
      "Adding wine and sugar after sediment removal": "That final adjustment is dosage."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is 'disgorgement' in sparkling wine production?",
    "options": [
      "Rotating bottles to collect sediment in the neck",
      "Expelling the collected yeast sediment from the bottle",
      "Adding wine and sugar to balance the final style",
      "Aging on spent yeast to develop brioche aromas"
    ],
    "correctAnswer": "Expelling the collected yeast sediment from the bottle",
    "explanation": "After riddling, disgorgement removes the plug of yeast sediment from the bottle, leaving the sparkling wine clear before final corking.",
    "wrongAnswerExplanations": {
      "Rotating bottles to collect sediment in the neck": "That preparatory step is riddling.",
      "Adding wine and sugar to balance the final style": "That post-disgorgement addition is dosage.",
      "Aging on spent yeast to develop brioche aromas": "That flavor development is associated with lees aging and autolysis."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the Brix scale used to measure?",
    "options": [
      "The acidity of finished wine",
      "The sugar content of grapes or juice",
      "The pressure in a sparkling-wine bottle",
      "The age of a grapevine"
    ],
    "correctAnswer": "The sugar content of grapes or juice",
    "explanation": "Degrees Brix measure dissolved sugar in grape juice and help growers and winemakers assess grape ripeness and potential alcohol.",
    "wrongAnswerExplanations": {
      "The acidity of finished wine": "Wine acidity is measured using pH and titratable-acidity testing rather than Brix.",
      "The pressure in a sparkling-wine bottle": "Bottle pressure is measured in units such as bars, not degrees Brix.",
      "The age of a grapevine": "Vine age is counted in years and is unrelated to the Brix scale."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the period when grapes begin to change color and ripen called?",
    "options": [
      "Bud break",
      "Flowering",
      "Veraison",
      "Dormancy"
    ],
    "correctAnswer": "Veraison",
    "explanation": "Veraison marks the onset of ripening, when red grapes begin changing color and both red and white grapes soften and accumulate sugar.",
    "wrongAnswerExplanations": {
      "Bud break": "Bud break occurs earlier, when new shoots first emerge from dormant buds.",
      "Flowering": "Flowering is when grapevine flowers bloom and are pollinated, well before ripening begins.",
      "Dormancy": "Dormancy is the vine's winter resting period after the growing season."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "How was the phylloxera crisis addressed in European vineyards?",
    "options": [
      "Crossing French vines with thick-skinned Riesling",
      "Grafting European vines onto resistant American rootstocks",
      "Replanting only in water-retaining clay soils",
      "Heat-pasteurizing grape must before fermentation"
    ],
    "correctAnswer": "Grafting European vines onto resistant American rootstocks",
    "explanation": "European wine-grape varieties were grafted onto American rootstocks that could tolerate phylloxera, allowing the desired European fruit to grow on resistant roots.",
    "wrongAnswerExplanations": {
      "Crossing French vines with thick-skinned Riesling": "The widely adopted solution was grafting, not replacing European varieties with Riesling crosses.",
      "Replanting only in water-retaining clay soils": "Soil choice alone did not solve phylloxera across Europe.",
      "Heat-pasteurizing grape must before fermentation": "Phylloxera attacks vine roots in the vineyard, not grape must in the cellar."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which acid is generally the most important naturally occurring acid in wine grapes?",
    "options": [
      "Lactic acid",
      "Tartaric acid",
      "Acetic acid",
      "Carbonic acid"
    ],
    "correctAnswer": "Tartaric acid",
    "explanation": "Tartaric acid is the principal acid in wine grapes. It contributes freshness, helps stabilize a wine's pH, and remains important throughout winemaking.",
    "wrongAnswerExplanations": {
      "Lactic acid": "Lactic acid is produced mainly when malic acid is converted during malolactic fermentation.",
      "Acetic acid": "Acetic acid is a volatile acid; excessive amounts can make wine smell or taste vinegary.",
      "Carbonic acid": "Carbonic acid forms when carbon dioxide dissolves in liquid, but it is not the principal natural acid in grapes."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "What happens during malolactic fermentation?",
    "options": [
      "Grape sugar is converted directly into alcohol",
      "Tannins are converted into sugar",
      "Carbon dioxide is injected into still wine",
      "Sharper malic acid is converted into softer lactic acid"
    ],
    "correctAnswer": "Sharper malic acid is converted into softer lactic acid",
    "explanation": "During malolactic fermentation, bacteria convert sharper malic acid into softer lactic acid, often giving the wine a rounder, creamier texture.",
    "wrongAnswerExplanations": {
      "Grape sugar is converted directly into alcohol": "Yeast performs alcoholic fermentation, which converts grape sugar into alcohol.",
      "Tannins are converted into sugar": "Tannins are structural compounds and are not converted into sugar during malolactic fermentation.",
      "Carbon dioxide is injected into still wine": "Malolactic fermentation is an acid conversion, not a carbonation technique."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What are lees in winemaking?",
    "options": [
      "Spent yeast and fine sediment after fermentation",
      "Whole clusters and stems added before fermentation",
      "Sugar and wine added after sparkling-wine disgorgement",
      "The air space above wine in a barrel"
    ],
    "correctAnswer": "Spent yeast and fine sediment after fermentation",
    "explanation": "Lees are deposits of spent yeast and other fine particles that settle after fermentation. Carefully aging wine on fine lees can add texture and complexity.",
    "wrongAnswerExplanations": {
      "Whole clusters and stems added before fermentation": "Whole clusters are fermentation material, not lees.",
      "Sugar and wine added after sparkling-wine disgorgement": "That addition is dosage.",
      "The air space above wine in a barrel": "That space is ullage."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What does the winemaking term 'sur lie' mean?",
    "options": [
      "Aged in new, heavily toasted oak barrels",
      "Fermented with whole clusters and stems",
      "Aged in contact with fine yeast sediment",
      "Fortified with a distilled grape spirit"
    ],
    "correctAnswer": "Aged in contact with fine yeast sediment",
    "explanation": "Sur lie means 'on the lees.' The wine remains in contact with fine yeast sediment during aging, which can add body, texture, and bread-like complexity.",
    "wrongAnswerExplanations": {
      "Aged in new, heavily toasted oak barrels": "Oak aging and sur-lie aging are separate choices, although both can occur in one wine.",
      "Fermented with whole clusters and stems": "That describes whole-cluster fermentation.",
      "Fortified with a distilled grape spirit": "That describes fortification."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is a cooper?",
    "options": [
      "A professional wine buyer",
      "A vineyard irrigation specialist",
      "A craftsperson who makes and repairs wooden barrels",
      "A laboratory that tests grape sugar"
    ],
    "correctAnswer": "A craftsperson who makes and repairs wooden barrels",
    "explanation": "A cooper is a skilled craftsperson who constructs and repairs wooden barrels, including the oak barrels commonly used to ferment or age wine.",
    "wrongAnswerExplanations": {
      "A professional wine buyer": "A professional wine buyer selects and purchases wine but does not make barrels.",
      "A vineyard irrigation specialist": "Irrigation specialists manage water systems rather than barrel construction.",
      "A laboratory that tests grape sugar": "A cooper is a person and craft, not a wine laboratory."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is maceration in winemaking?",
    "options": [
      "Keeping juice in contact with skins to extract compounds",
      "Passing finished wine through a fine filtering medium",
      "Moving clear wine away from settled fermentation sediment",
      "Adding a binding agent to remove suspended particles"
    ],
    "correctAnswer": "Keeping juice in contact with skins to extract compounds",
    "explanation": "Maceration is the period when juice or fermenting must remains in contact with grape skins and other solids, allowing color, flavor, and tannin to be extracted.",
    "wrongAnswerExplanations": {
      "Passing finished wine through a fine filtering medium": "That is filtration.",
      "Moving clear wine away from settled fermentation sediment": "That is racking.",
      "Adding a binding agent to remove suspended particles": "That is fining."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the 'cap' during red-wine fermentation?",
    "options": [
      "Protective foil covering the top of a bottle",
      "Mineral crystals collected at the tank bottom",
      "Yeast sediment gathered in a sparkling bottle neck",
      "Floating grape solids lifted by fermentation gas"
    ],
    "correctAnswer": "Floating grape solids lifted by fermentation gas",
    "explanation": "Carbon dioxide produced during fermentation pushes grape skins and other solids to the surface, where they form a cap that winemakers manage to support extraction.",
    "wrongAnswerExplanations": {
      "Protective foil covering the top of a bottle": "That is packaging, often called a capsule.",
      "Mineral crystals collected at the tank bottom": "Those may be tartrates, not a fermentation cap.",
      "Yeast sediment gathered in a sparkling bottle neck": "That deposit is collected through riddling."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What does a pump-over do during red-wine fermentation?",
    "options": [
      "Pressing fermented grape solids for a second wine",
      "Circulating fermenting wine over the floating cap",
      "Rinsing an empty barrel with pressurized water",
      "Increasing pressure during sparkling-wine fermentation"
    ],
    "correctAnswer": "Circulating fermenting wine over the floating cap",
    "explanation": "During a pump-over, fermenting wine is drawn from the bottom of the vessel and distributed over the cap to keep it wet and promote color, flavor, and tannin extraction.",
    "wrongAnswerExplanations": {
      "Pressing fermented grape solids for a second wine": "Pressing separates liquid from solids rather than circulating liquid over the cap.",
      "Rinsing an empty barrel with pressurized water": "That is sanitation, not a pump-over.",
      "Increasing pressure during sparkling-wine fermentation": "Pump-over is a red-wine extraction technique."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the purpose of fining a wine?",
    "options": [
      "Adding nutrients to restart a stuck fermentation",
      "Adding sugar to raise potential alcohol before fermentation",
      "Adding a binding agent that carries particles out",
      "Adding spirit to stop fermentation and retain sweetness"
    ],
    "correctAnswer": "Adding a binding agent that carries particles out",
    "explanation": "Fining agents bind with selected particles or compounds so they settle or can be removed, helping clarify the wine or adjust traits such as excessive tannin.",
    "wrongAnswerExplanations": {
      "Adding nutrients to restart a stuck fermentation": "That is fermentation management, not fining.",
      "Adding sugar to raise potential alcohol before fermentation": "That is chaptalization where permitted.",
      "Adding spirit to stop fermentation and retain sweetness": "That is fortification."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is filtration in winemaking?",
    "options": [
      "Adding sugar before alcoholic fermentation begins",
      "Exposing finished wine to oxygen in an open tank",
      "Passing wine through media that remove selected material",
      "Combining finished wines from several harvest years"
    ],
    "correctAnswer": "Passing wine through media that remove selected material",
    "explanation": "Filtration passes wine through a medium that can remove suspended particles and, with sufficiently fine filtration, microorganisms before bottling.",
    "wrongAnswerExplanations": {
      "Adding sugar before alcoholic fermentation begins": "That is chaptalization where permitted.",
      "Exposing finished wine to oxygen in an open tank": "That is oxygen management, not filtration.",
      "Combining finished wines from several harvest years": "That is blending across vintages."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What makes carbonic maceration different from conventional fermentation?",
    "options": [
      "Aging wine exclusively in new oak barrels",
      "Starting fermentation inside intact berries under carbon dioxide",
      "Drying harvested grapes before crushing and fermentation",
      "Freezing finished wine to concentrate alcohol"
    ],
    "correctAnswer": "Starting fermentation inside intact berries under carbon dioxide",
    "explanation": "Carbonic maceration begins with intact grape berries in a carbon-dioxide-rich environment, encouraging fermentation inside the berries and often producing fresh, fruity wines.",
    "wrongAnswerExplanations": {
      "Aging wine exclusively in new oak barrels": "Oak aging is unrelated to carbonic maceration.",
      "Drying harvested grapes before crushing and fermentation": "Drying concentrates grapes but is a different technique.",
      "Freezing finished wine to concentrate alcohol": "That does not define carbonic maceration."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What does 'ullage' mean in a wine bottle or barrel?",
    "options": [
      "The empty space between the wine and the top of its container",
      "The sediment left after fermentation",
      "The sweetness level of the wine",
      "The legal name of a vineyard"
    ],
    "correctAnswer": "The empty space between the wine and the top of its container",
    "explanation": "Ullage is the unfilled space between the wine and the closure or top of a bottle, barrel, or tank. Excessive ullage can increase exposure to oxygen.",
    "wrongAnswerExplanations": {
      "The sediment left after fermentation": "Fermentation sediment is generally called lees.",
      "The sweetness level of the wine": "Wine sweetness is determined mainly by residual sugar, not ullage.",
      "The legal name of a vineyard": "Ullage describes headspace in a container and is not a vineyard designation."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is the 'angel's share' during barrel aging?",
    "options": [
      "Free-run juice draining before mechanical pressing",
      "A barrel sample taken for laboratory analysis",
      "Wine lost through evaporation during barrel aging",
      "Sediment removed during clarification before bottling"
    ],
    "correctAnswer": "Wine lost through evaporation during barrel aging",
    "explanation": "The angel's share is the small amount of wine that evaporates through a barrel during aging, gradually lowering the liquid level.",
    "wrongAnswerExplanations": {
      "Free-run juice draining before mechanical pressing": "That liquid is called free-run juice.",
      "A barrel sample taken for laboratory analysis": "A wine thief can draw a sample, but it is not the angel's share.",
      "Sediment removed during clarification before bottling": "Sediment removal is not evaporation."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What is dosage in traditional-method sparkling-wine production?",
    "options": [
      "Yeast sediment gathered in the bottle neck",
      "Wine-and-sugar mixture added after disgorgement",
      "Pressure reading measured before final corking",
      "First juice released during gentle grape pressing"
    ],
    "correctAnswer": "Wine-and-sugar mixture added after disgorgement",
    "explanation": "After disgorgement, a small dosage—typically wine with a measured amount of sugar—is added before final corking and helps determine the sparkling wine's sweetness level.",
    "wrongAnswerExplanations": {
      "Yeast sediment gathered in the bottle neck": "That deposit is removed during disgorgement.",
      "Pressure reading measured before final corking": "Pressure is measured separately and is not dosage.",
      "First juice released during gentle grape pressing": "That is a pressing fraction, not dosage."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "What defines a fortified wine?",
    "options": [
      "It is aged for at least ten years",
      "It contains no residual sugar",
      "It is fermented only in stainless steel",
      "A distilled spirit is added during production"
    ],
    "correctAnswer": "A distilled spirit is added during production",
    "explanation": "Fortified wine is made by adding a distilled spirit, usually grape spirit. The timing of the addition influences the wine's alcohol level and whether natural grape sugar remains.",
    "wrongAnswerExplanations": {
      "It is aged for at least ten years": "Some fortified wines are aged for long periods, but age does not define fortification.",
      "It contains no residual sugar": "Fortified wines range from dry to very sweet.",
      "It is fermented only in stainless steel": "The fermentation vessel does not determine whether a wine is fortified."
    },
    "category": "wine-language-and-production"
  },
  {
    "question": "Which flavor profile is most typical of Albariño?",
    "options": [
      "Bright acidity with citrus, peach, and saline notes",
      "Soft acidity with cocoa, cedar, and tobacco notes",
      "Firm tannin with blackberry and black-pepper notes",
      "Luscious sweetness with caramel and raisin notes"
    ],
    "correctAnswer": "Bright acidity with citrus, peach, and saline notes",
    "explanation": "Albariño is an aromatic white grape best known for lively acidity and flavors such as lemon, grapefruit, peach, and apricot, sometimes accompanied by a saline impression.",
    "wrongAnswerExplanations": {
      "Soft acidity with cocoa, cedar, and tobacco notes": "Those traits suggest an aged red rather than Albariño.",
      "Firm tannin with blackberry and black-pepper notes": "Albariño is a white grape and is not defined by heavy tannin.",
      "Luscious sweetness with caramel and raisin notes": "Albariño is most often made as a fresh, dry white."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Why can Northern Virginia's rolling hills be beneficial vineyard sites?",
    "options": [
      "They trap warm, humid air around fruit clusters",
      "They improve airflow and help excess water drain",
      "They block cooling breezes and preserve afternoon heat",
      "They collect rainwater in low pockets around vine roots"
    ],
    "correctAnswer": "They improve airflow and help excess water drain",
    "explanation": "Northern Virginia's rolling terrain can provide good air and water drainage, helping move excess moisture and cool air away from vineyard sites.",
    "wrongAnswerExplanations": {
      "They trap warm, humid air around fruit clusters": "Trapped humidity increases disease pressure rather than benefiting vines.",
      "They block cooling breezes and preserve afternoon heat": "Exposed slopes can receive useful air movement instead of blocking every breeze.",
      "They collect rainwater in low pockets around vine roots": "Well-chosen slopes encourage drainage rather than waterlogging."
    },
    "category": "virginia-and-local-terroir"
  },
  {
    "question": "Which aromatic grape is one of Traminette's parents?",
    "options": [
      "Cabernet Sauvignon",
      "Chardonnay",
      "Norton",
      "Gewürztraminer"
    ],
    "correctAnswer": "Gewürztraminer",
    "explanation": "Traminette was bred from Gewürztraminer and the hybrid Joannes Seyve 23.416, giving it pronounced floral and spicy aromas.",
    "wrongAnswerExplanations": {
      "Cabernet Sauvignon": "Cabernet Sauvignon is not a parent of Traminette.",
      "Chardonnay": "Chardonnay is not part of Traminette's documented parentage.",
      "Norton": "Norton is a historic American grape but is not a parent of Traminette."
    },
    "category": "tasting-and-service"
  },
  {
    "question": "Which wine styles can Seyval Blanc produce?",
    "options": [
      "Crisp still whites and sparkling wines",
      "Full-bodied, high-tannin reds for long aging",
      "Sweet fortified wines aged oxidatively in barrel",
      "Deeply colored spicy red blends with dark fruit"
    ],
    "correctAnswer": "Crisp still whites and sparkling wines",
    "explanation": "Seyval Blanc is a white hybrid grape valued for its acidity. It can make fresh still wines and can also provide a useful base for sparkling wine.",
    "wrongAnswerExplanations": {
      "Full-bodied, high-tannin reds for long aging": "Seyval Blanc is a white hybrid with naturally useful acidity.",
      "Sweet fortified wines aged oxidatively in barrel": "Fortified oxidative wine is not Seyval Blanc's defining style.",
      "Deeply colored spicy red blends with dark fruit": "Seyval Blanc does not produce red wine."
    },
    "category": "grapes-and-wine-styles"
  },
  {
    "question": "How can the Potomac River and Blue Ridge foothills influence Loudoun vineyard sites?",
    "options": [
      "They create local differences in temperature, airflow, and frost risk",
      "They make every vineyard site share the same climate",
      "They prevent all summer humidity from reaching grapevines",
      "They guarantee that vines never need drainage planning"
    ],
    "correctAnswer": "They create local differences in temperature, airflow, and frost risk",
    "explanation": "Water, elevation, slope, and cold-air movement create small but meaningful site differences across Loudoun County, so vineyard conditions can vary over short distances.",
    "wrongAnswerExplanations": {
      "They make every vineyard site share the same climate": "Terrain and exposure create variation rather than uniform conditions.",
      "They prevent all summer humidity from reaching grapevines": "Loudoun still has a humid growing season that requires disease management.",
      "They guarantee that vines never need drainage planning": "Site selection and drainage remain essential in Virginia's rainfall pattern."
    },
    "category": "virginia-and-local-terroir"
  }
];

export const WINE_QUIZ_QUESTIONS = [
  ...BASE_WINE_QUESTIONS,
  ...ADDITIONAL_WINE_QUESTIONS
];

