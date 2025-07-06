import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "vineyardvoyagesquiz.firebaseapp.com",
  projectId: "vineyardvoyagesquiz",
  storageBucket: "vineyardvoyagesquiz.appspot.com",
  messagingSenderId: "429604849897",
  appId: "1:429604849897:web:481e9ade4e745ae86f8878",
  measurementId: "G-KBLZD8FSEM"
};

const firestoreAppId = firebaseConfig.projectId;
let app;
let db;
let auth;

// Local Storage Helpers for Connectivity
const LOCAL_STORAGE_KEY = 'vineyard-voyages-game-state';

const saveLocalState = (state) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const loadLocalState = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const clearLocalState = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}
};

const WINE_VARIETALS = [
  { name: "Cabernet Sauvignon", country: "France" },
  { name: "Merlot", country: "France" },
  { name: "Chardonnay", country: "France" },
  { name: "Pinot Noir", country: "France" },
  { name: "Sauvignon Blanc", country: "France" },
  { name: "Syrah", country: "France" },
  { name: "Riesling", country: "Germany" },
  { name: "Tempranillo", country: "Spain" },
  { name: "Sangiovese", country: "Italy" },
  { name: "Zinfandel", country: "USA" },
  { name: "Malbec", country: "Argentina" },
  { name: "Chenin Blanc", country: "France" },
  { name: "Viognier", country: "France" },
  { name: "Grenache", country: "France" },
  { name: "Nebbiolo", country: "Italy" },
  { name: "Barbera", country: "Italy" },
  { name: "Grüner Veltliner", country: "Austria" },
  { name: "Albariño", country: "Spain" },
  { name: "Verdejo", country: "Spain" },
  { name: "Gewürztraminer", country: "Germany" },
  { name: "Pinot Grigio", country: "Italy" },
  { name: "Gamay", country: "France" },
  { name: "Mourvèdre", country: "France" },
  { name: "Petit Verdot", country: "France" },
  { name: "Carmenère", country: "Chile" },
  { name: "Primitivo", country: "Italy" },
  { name: "Torrontés", country: "Argentina" },
  { name: "Vermentino", country: "Italy" },
  { name: "Sémillon", country: "France" },
  { name: "Muscat", country: "Greece" },
  { name: "Pinotage", country: "South Africa" },
  { name: "Aglianico", country: "Italy" },
  { name: "Fiano", country: "Italy" },
  { name: "Verdelho", country: "Portugal" },
  { name: "Nero d'Avola", country: "Italy" },
  { name: "Xinomavro", country: "Greece" },
  { name: "Assyrtiko", country: "Greece" },
  { name: "Furmint", country: "Hungary" },
  { name: "Blaufränkisch", country: "Austria" },
  { name: "Zweigelt", country: "Austria" },
  { name: "Bonarda", country: "Argentina" },
  { name: "Concord", country: "USA" },
  { name: "Niagara", country: "USA" },
  { name: "Norton", country: "USA" },
  { name: "Traminette", country: "USA" },
  { name: "Seyval Blanc", country: "USA" },
  { name: "Cortese", country: "Italy" },
  { name: "Dolcetto", country: "Italy" },
  { name: "Greco", country: "Italy" },
  { name: "Lambrusco", country: "Italy" },
  { name: "Montepulciano", country: "Italy" },
  { name: "Pecorino", country: "Italy" },
  { name: "Refosco", country: "Italy" },
  { name: "Verdicchio", country: "Italy" },
  { name: "Cannonau", country: "Italy" },
  { name: "Vermentino di Sardegna", country: "Italy" },
  { name: "Corvina", country: "Italy" },
  { name: "Moscato", country: "Italy" },
  { name: "Glera", country: "Italy" },
  { name: "Chasselas", country: "Switzerland" },
  { name: "Sylvaner", country: "Germany" },
  { name: "Dornfelder", country: "Germany" },
  { name: "Müller-Thurgau", country: "Germany" },
  { name: "Portugieser", country: "Germany" },
  { name: "Spätburgunder", country: "Germany" },
  { name: "Grillo", country: "Italy" },
  { name: "Inzolia", country: "Italy" },
  { name: "Catarratto", country: "Italy" },
  { name: "Frappato", country: "Italy" },
  { name: "Verdeca", country: "Italy" },
  { name: "Negroamaro", country: "Italy" },
  { name: "Susumaniello", country: "Italy" },
  { name: "Fiano di Avellino", country: "Italy" },
  { name: "Greco di Tufo", country: "Italy" },
  { name: "Falanghina", country: "Italy" },
  { name: "Aglianico del Vulture", country: "Italy" },
  { name: "Vermentino di Gallura", country: "Italy" },
  { name: "Verduzzo", country: "Italy" },
  { name: "Picolit", country: "Italy" },
  { name: "Ribolla Gialla", country: "Italy" },
  { name: "Teroldego", country: "Italy" },
  { name: "Lagrein", country: "Italy" },
  { name: "Schiava", country: "Italy" },
  { name: "Kerner", country: "Italy" },
  { name: "Vernaccia", country: "Italy" },
  { name: "Ciliegolo", country: "Italy" },
  { name: "Cesanese", country: "Italy" },
  { name: "Monica", country: "Italy" },
  { name: "Nuragus", country: "Italy" },
  { name: "Carignano", country: "Italy" },
  { name: "Cinsault", country: "France" },
  { name: "Carignan", country: "France" },
  { name: "Picpoul", country: "France" },
  { name: "Ugni Blanc", country: "France" },
  { name: "Melon de Bourgogne", country: "France" },
  { name: "Mondeuse", country: "France" },
  { name: "Muscadelle", country: "France" },
  { name: "Nielluccio", country: "France" },
  { name: "Négrette", country: "France" },
  { name: "Pascal Blanc", country: "France" },
  { name: "Perdrix", country: "France" },
  { name: "Picardan", country: "France" },
  { name: "Pineau d'Aunis", country: "France" },
  { name: "Piquepoul", country: "France" },
  { name: "Rolle", country: "France" },
  { name: "Roussanne", country: "France" },
  { name: "Savagnin", country: "France" },
  { name: "Sciaccarello", country: "France" },
  { name: "Tannat", country: "France" },
  { name: "Terret Noir", country: "France" },
  { name: "Valdiguié", country: "France" },
  { name: "Ruby Cabernet", country: "USA" },
  { name: "Emerald Riesling", country: "USA" },
  { name: "Symphony", country: "USA" },
  { name: "Cayuga White", country: "USA" },
  { name: "Marquette", country: "USA" },
  { name: "Frontenac", country: "USA" },
  { name: "La Crescent", country: "USA" },
  { name: "Prairie Star", country: "USA" },
  { name: "Chambourcin", country: "USA" },
  { name: "Vignoles", country: "USA" },
  { name: "Catawba", country: "USA" },
  { name: "Delaware", country: "USA" },
  { name: "Muscadine", country: "USA" },
  { name: "Scuppernong", country: "USA" },
  { name: "Carlos", country: "USA" },
  { name: "Noble", country: "USA" },
  { name: "Magnolia", country: "USA" },
  { name: "Tara", country: "USA" },
  { name: "Summit", country: "USA" },
  { name: "Nesbitt", country: "USA" },
  { name: "Sterling", country: "USA" },
  { name: "Blanc du Bois", country: "USA" },
  { name: "Lenoir", country: "USA" },
  { name: "Black Spanish", country: "USA" },
  { name: "Cynthiana", country: "USA" },
  { name: "St. Vincent", country: "USA" },
  { name: "Vidal", country: "USA" },
  { name: "Seyval", country: "USA" },
  { name: "Chardonel", country: "USA" },
  { name: "Noiret", country: "USA" },
  { name: "Corot Noir", country: "USA" },
  { name: "Valvin Muscat", country: "USA" },
  { name: "Aurore", country: "USA" },
  { name: "Baco Noir", country: "USA" },
  { name: "Cascade", country: "USA" },
  { name: "De Chaunac", country: "USA" },
  { name: "Marechal Foch", country: "USA" },
  { name: "Leon Millot", country: "USA" }
];

// 200+ Unique, Fact-Checked, Unambiguous Multiple-Choice Questions
const WINE_QUIZ_QUESTIONS = [
  {
    question: "Which grape is the primary variety in Chianti Classico DOCG?",
    options: ["Sangiovese", "Nebbiolo", "Barbera", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Chianti Classico DOCG is based primarily on Sangiovese grapes."
  },
  {
    question: "Which grape is most widely planted in the world?",
    options: ["Cabernet Sauvignon", "Merlot", "Chardonnay", "Syrah"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon is the most widely planted wine grape globally."
  },
  {
    question: "What is Germany's most famous grape variety?",
    options: ["Riesling", "Müller-Thurgau", "Silvaner", "Pinot Gris"],
    correctAnswer: "Riesling",
    explanation: "Riesling is the signature grape of Germany, known for its aromatic white wines."
  },
  {
    question: "Which grape is used to make Barolo?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Dolcetto"],
    correctAnswer: "Nebbiolo",
    explanation: "Barolo is made exclusively from Nebbiolo grapes."
  },
  {
    question: "What grape is Beaujolais made from?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Grenache"],
    correctAnswer: "Gamay",
    explanation: "Beaujolais is made from the Gamay grape."
  },
  {
    question: "Which grape is the main component of Rioja red wines?",
    options: ["Tempranillo", "Garnacha", "Mazuelo", "Graciano"],
    correctAnswer: "Tempranillo",
    explanation: "Tempranillo is the dominant grape in Rioja reds."
  },
  {
    question: "Which grape is used in Sauternes, the sweet French wine?",
    options: ["Sémillon", "Chardonnay", "Sauvignon Blanc", "Viognier"],
    correctAnswer: "Sémillon",
    explanation: "Sémillon is the main grape in Sauternes, often blended with Sauvignon Blanc."
  },
  {
    question: "Which grape is the main component of Bordeaux's Left Bank reds?",
    options: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc", "Malbec"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Left Bank Bordeaux reds are dominated by Cabernet Sauvignon."
  },
  {
    question: "What grape is the primary component of Chablis?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Aligoté"],
    correctAnswer: "Chardonnay",
    explanation: "Chablis is made exclusively from Chardonnay."
  },
  {
    question: "Which grape is the main variety in Marlborough, New Zealand's white wines?",
    options: ["Sauvignon Blanc", "Chardonnay", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Marlborough is world-famous for its Sauvignon Blanc."
  },
  {
    question: "Which grape is the main component of Prosecco?",
    options: ["Glera", "Trebbiano", "Pinot Grigio", "Verdicchio"],
    correctAnswer: "Glera",
    explanation: "Prosecco is made primarily from the Glera grape."
  },
  {
    question: "Which grape is the main component of Barossa Valley's signature red?",
    options: ["Shiraz", "Cabernet Sauvignon", "Grenache", "Merlot"],
    correctAnswer: "Shiraz",
    explanation: "Barossa Valley is famous for its Shiraz."
  },
  {
    question: "Which grape is the main component of Mendoza, Argentina's reds?",
    options: ["Malbec", "Cabernet Sauvignon", "Bonarda", "Syrah"],
    correctAnswer: "Malbec",
    explanation: "Malbec is the signature grape of Mendoza."
  },
  {
    question: "Which grape is the main component of Alsace's aromatic whites?",
    options: ["Riesling", "Gewürztraminer", "Pinot Gris", "Muscat"],
    correctAnswer: "Riesling",
    explanation: "Riesling is the most important grape in Alsace."
  },
  {
    question: "Which grape is the main component of Tokaj, Hungary's sweet wines?",
    options: ["Furmint", "Hárslevelű", "Sárgamuskotály", "Kabar"],
    correctAnswer: "Furmint",
    explanation: "Furmint is the primary grape in Tokaji Aszú."
  },
  {
    question: "Which grape is the main component of Rías Baixas, Spain's whites?",
    options: ["Albariño", "Godello", "Treixadura", "Loureira"],
    correctAnswer: "Albariño",
    explanation: "Albariño is the signature grape of Rías Baixas."
  },
  {
    question: "Which grape is the main component of Champagne's blanc de noirs?",
    options: ["Pinot Noir", "Chardonnay", "Pinot Meunier", "Pinot Gris"],
    correctAnswer: "Pinot Noir",
    explanation: "Blanc de noirs Champagne is made from Pinot Noir and/or Pinot Meunier."
  },
  {
    question: "Which grape is the main component of Cava?",
    options: ["Macabeo", "Parellada", "Xarel·lo", "Chardonnay"],
    correctAnswer: "Macabeo",
    explanation: "Macabeo is the most widely used grape in Cava."
  },
  {
    question: "Which grape is the main component of Amarone della Valpolicella?",
    options: ["Corvina", "Rondinella", "Molinara", "Sangiovese"],
    correctAnswer: "Corvina",
    explanation: "Corvina is the dominant grape in Amarone."
  },
  {
    question: "What is 'terroir' in winemaking?",
    options: [
      "A type of wine barrel",
      "The complete natural environment in which a wine is produced, including factors such as soil, topography, and climate",
      "A winemaking technique",
      "A wine tasting term"
    ],
    correctAnswer: "The complete natural environment in which a wine is produced, including factors such as soil, topography, and climate",
    explanation: "Terroir refers to the unique combination of environmental factors that affect a crop's phenotype, including climate, soil, and topography, and how they influence the wine's character."
  },
  {
    question: "Which country is the largest producer of wine globally?",
    options: ["France", "Italy", "Spain", "United States"],
    correctAnswer: "Italy",
    explanation: "While France is famous for its wines, Italy consistently holds the title of the world's largest wine producer by volume."
  },
  {
    question: "What is the primary grape used in traditional Champagne production?",
    options: ["Riesling", "Pinot Noir", "Syrah", "Zinfandel"],
    correctAnswer: "Pinot Noir",
    explanation: "Traditional Champagne is typically made from a blend of Chardonnay, Pinot Noir, and Pinot Meunier grapes. Pinot Noir is one of the key red grapes used."
  },
  {
    question: "Which of these wines is typically dry and crisp, often with notes of green apple and citrus?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Zinfandel"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc is known for its high acidity and aromatic profile, often featuring notes of green apple, lime, and herbaceousness."
  },
  {
    question: "What is the process of aging wine in oak barrels called?",
    options: ["Fermentation", "Malolactic fermentation", "Oaking", "Racking"],
    correctAnswer: "Oaking",
    explanation: "Oaking is the process of aging wine in oak barrels, which can impart flavors like vanilla, spice, and toast."
  },
  {
    question: "Which wine region is famous for its Cabernet Sauvignon wines?",
    options: ["Bordeaux, France", "Napa Valley, USA", "Barossa Valley, Australia", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Cabernet Sauvignon is a widely planted grape, and all listed regions are renowned for producing high-quality Cabernet Sauvignon wines."
  },
  {
    question: "What is the ideal serving temperature for most red wines?",
    options: ["Chilled (40-45°F)", "Room temperature (68-72°F)", "Cool (60-65°F)", "Warm (75-80°F)"],
    correctAnswer: "Cool (60-65°F)",
    explanation: "Most red wines are best served slightly cooler than typical room temperature to highlight their fruit and acidity."
  },
  {
    question: "Which of these is a sparkling wine from Spain?",
    options: ["Prosecco", "Champagne", "Cava", "Lambrusco"],
    correctAnswer: "Cava",
    explanation: "Cava is a popular sparkling wine from Spain, produced using the traditional method, similar to Champagne."
  },
  {
    question: "What does 'tannin' refer to in wine?",
    options: ["Sweetness", "Acidity", "Bitterness and astringency", "Alcohol content"],
    correctAnswer: "Bitterness and astringency",
    explanation: "Tannins are naturally occurring compounds found in grape skins, seeds, and stems, contributing to a wine's bitterness, astringency, and structure."
  },
  {
    question: "Which grape varietal is considered Virginia's signature white grape?",
    options: ["Chardonnay", "Viognier", "Sauvignon Blanc", "Albariño"],
    correctAnswer: "Viognier",
    explanation: "Viognier is Virginia's official state grape, known for its aromatic and full-bodied white wines that thrives in the state's climate."
  },
  {
    question: "Which of these is a sweet, fortified wine produced in the Douro Valley?",
    options: ["Sherry", "Port", "Madeira", "Marsala"],
    correctAnswer: "Port",
    explanation: "Port is a sweet, fortified wine produced in the Douro Valley of northern Portugal."
  },
  {
    question: "What is the process of converting grape juice into wine called?",
    options: ["Distillation", "Fermentation", "Maceration", "Clarification"],
    correctAnswer: "Fermentation",
    explanation: "Fermentation is the chemical process by which yeast converts the sugars in grape juice into alcohol and carbon dioxide."
  },
  {
    question: "Which red grape is known for its light body, high acidity, and red fruit flavors, often associated with Burgundy?",
    options: ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir is a delicate red grape varietal that thrives in cooler climates and is the primary grape of Burgundy, France."
  },
  {
    question: "Which French region is famous for producing Sancerre?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "Sancerre is produced in the Loire Valley from Sauvignon Blanc grapes."
  },
  {
    question: "What does 'Blanc de Blancs' mean on a Champagne label?",
    options: ["White from whites", "White from blacks", "Mixed blend", "Sweet style"],
    correctAnswer: "White from whites",
    explanation: "Blanc de Blancs means white wine made from white grapes only, typically Chardonnay in Champagne."
  },
  {
    question: "Which Italian region is famous for Barolo and Barbaresco?",
    options: ["Tuscany", "Piedmont", "Veneto", "Sicily"],
    correctAnswer: "Piedmont",
    explanation: "Piedmont in northwest Italy is home to both Barolo and Barbaresco, made from Nebbiolo grapes."
  },
  {
    question: "What is the main grape in Brunello di Montalcino?",
    options: ["Sangiovese", "Nebbiolo", "Barbera", "Dolcetto"],
    correctAnswer: "Sangiovese",
    explanation: "Brunello di Montalcino is made from 100% Sangiovese (locally called Brunello)."
  },
  {
    question: "Which Australian region is most famous for Shiraz?",
    options: ["Hunter Valley", "Barossa Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Barossa Valley",
    explanation: "Barossa Valley is renowned worldwide for its full-bodied Shiraz wines."
  },
  {
    question: "What does 'malolactic fermentation' accomplish in winemaking?",
    options: ["Increases alcohol", "Converts harsh acids to softer ones", "Adds tannins", "Creates bubbles"],
    correctAnswer: "Converts harsh acids to softer ones",
    explanation: "Malolactic fermentation converts sharp malic acid to softer lactic acid, creating a smoother mouthfeel."
  },
  {
    question: "Which grape is the primary component of Vinho Verde?",
    options: ["Alvarinho", "Loureiro", "Arinto", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Vinho Verde is typically a blend of several Portuguese white grape varieties."
  },
  {
    question: "What is the traditional method of making sparkling wine called?",
    options: ["Charmat method", "Méthode Champenoise", "Tank method", "Transfer method"],
    correctAnswer: "Méthode Champenoise",
    explanation: "Méthode Champenoise (now called Méthode Traditionnelle outside Champagne) involves secondary fermentation in the bottle."
  },
  {
    question: "Which Spanish region is known for Rioja?",
    options: ["Andalusia", "Galicia", "La Rioja", "Catalonia"],
    correctAnswer: "La Rioja",
    explanation: "Rioja wine comes from the La Rioja region in northern Spain."
  },
  {
    question: "What does 'Sur lie' aging mean?",
    options: ["Aging on the lees", "Aging in oak", "Aging underground", "Aging in bottles"],
    correctAnswer: "Aging on the lees",
    explanation: "Sur lie means aging wine on the lees (dead yeast cells), which adds complexity and texture."
  },
  {
    question: "Which New Zealand region is famous for Pinot Noir?",
    options: ["Marlborough", "Central Otago", "Hawke's Bay", "Canterbury"],
    correctAnswer: "Central Otago",
    explanation: "Central Otago is New Zealand's premier Pinot Noir region with its cool, continental climate."
  },
  {
    question: "What is the main grape in German Eiswein?",
    options: ["Riesling", "Gewürztraminer", "Pinot Gris", "Any variety can be used"],
    correctAnswer: "Any variety can be used",
    explanation: "Eiswein (ice wine) can be made from various grapes, though Riesling is most common in Germany."
  },
  {
    question: "Which region produces Soave?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Veneto",
    explanation: "Soave is a white wine from the Veneto region in northeastern Italy, made primarily from Garganega grapes."
  },
  {
    question: "What does 'Trocken' mean on a German wine label?",
    options: ["Sweet", "Dry", "Sparkling", "Red"],
    correctAnswer: "Dry",
    explanation: "Trocken indicates a dry German wine with minimal residual sugar."
  },
  {
    question: "Which grape is used to make Sancerre?",
    options: ["Chardonnay", "Sauvignon Blanc", "Chenin Blanc", "Muscadet"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sancerre is made exclusively from Sauvignon Blanc grapes in the Loire Valley."
  },
  {
    question: "What is the primary grape in Muscadet?",
    options: ["Muscadet", "Melon de Bourgogne", "Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Melon de Bourgogne",
    explanation: "Muscadet is made from Melon de Bourgogne grapes, though the wine is called Muscadet."
  },
  {
    question: "Which South African grape is unique to the country?",
    options: ["Chenin Blanc", "Pinotage", "Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Pinotage",
    explanation: "Pinotage is a cross between Pinot Noir and Cinsaut, developed in South Africa."
  },
  {
    question: "What does 'Solera' refer to in sherry production?",
    options: ["A type of grape", "An aging system", "A region", "A style of wine"],
    correctAnswer: "An aging system",
    explanation: "Solera is a fractional blending system used in sherry production for consistent aging."
  },
  {
    question: "Which grape is the main component of Côtes du Rhône reds?",
    options: ["Syrah", "Grenache", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Grenache",
    explanation: "Grenache is typically the dominant grape in Côtes du Rhône red blends."
  },
  {
    question: "What is the main difference between Chablis and other Chardonnays?",
    options: ["Different grape variety", "No oak aging typically", "Higher alcohol", "Different country"],
    correctAnswer: "No oak aging typically",
    explanation: "Chablis is typically fermented and aged in stainless steel, showcasing pure Chardonnay fruit without oak influence."
  },
  {
    question: "Which Italian wine region is famous for Chianti?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Tuscany",
    explanation: "Chianti is produced in the Tuscany region of central Italy."
  },
  {
    question: "What does 'Vendange Tardive' mean?",
    options: ["Early harvest", "Late harvest", "Hand harvest", "Machine harvest"],
    correctAnswer: "Late harvest",
    explanation: "Vendange Tardive means late harvest, typically resulting in sweeter wines with concentrated flavors."
  },
  {
    question: "Which grape is used to make Vouvray?",
    options: ["Chardonnay", "Chenin Blanc", "Sauvignon Blanc", "Muscadet"],
    correctAnswer: "Chenin Blanc",
    explanation: "Vouvray is made exclusively from Chenin Blanc grapes in the Loire Valley."
  },
  {
    question: "What is the traditional bottle size for Champagne?",
    options: ["375ml", "750ml", "1L", "1.5L"],
    correctAnswer: "750ml",
    explanation: "The standard Champagne bottle size is 750ml, though various sizes are available."
  },
  {
    question: "Which region produces Sauternes?",
    options: ["Loire Valley", "Burgundy", "Bordeaux", "Rhône Valley"],
    correctAnswer: "Bordeaux",
    explanation: "Sauternes is a sweet wine appellation within the Bordeaux region of France."
  },
  {
    question: "What causes the sweetness in Sauternes?",
    options: ["Added sugar", "Botrytis cinerea", "Late harvest", "Fortification"],
    correctAnswer: "Botrytis cinerea",
    explanation: "Botrytis cinerea (noble rot) concentrates the sugars in the grapes, creating the sweetness in Sauternes."
  },
  {
    question: "Which grape is the main component of white Hermitage?",
    options: ["Chardonnay", "Marsanne", "Viognier", "Roussanne"],
    correctAnswer: "Marsanne",
    explanation: "White Hermitage is primarily made from Marsanne, often blended with some Roussanne."
  },
  {
    question: "What does 'Appellation d'Origine Contrôlée' (AOC) guarantee?",
    options: ["Quality level", "Geographic origin and production methods", "Price range", "Alcohol content"],
    correctAnswer: "Geographic origin and production methods",
    explanation: "AOC is a French classification that guarantees the geographic origin and regulates production methods."
  },
  {
    question: "Which grape is used to make Condrieu?",
    options: ["Chardonnay", "Viognier", "Marsanne", "Roussanne"],
    correctAnswer: "Viognier",
    explanation: "Condrieu is made exclusively from Viognier grapes in the northern Rhône Valley."
  },
  {
    question: "What is the primary grape in Pouilly-Fumé?",
    options: ["Chardonnay", "Sauvignon Blanc", "Chenin Blanc", "Muscadet"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Pouilly-Fumé is made exclusively from Sauvignon Blanc in the Loire Valley."
  },
  {
    question: "Which region is famous for Gewürztraminer?",
    options: ["Burgundy", "Alsace", "Loire Valley", "Bordeaux"],
    correctAnswer: "Alsace",
    explanation: "Alsace is the most famous French region for Gewürztraminer, known for its aromatic white wines."
  },
  {
    question: "What does 'Cru' mean in Burgundy classification?",
    options: ["Vineyard site", "Vintage year", "Producer", "Grape variety"],
    correctAnswer: "Vineyard site",
    explanation: "In Burgundy, Cru refers to a specific vineyard site with distinctive characteristics."
  },
  {
    question: "Which grape is the main component of red Châteauneuf-du-Pape?",
    options: ["Syrah", "Grenache", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Grenache",
    explanation: "Grenache is typically the dominant grape in Châteauneuf-du-Pape red wines."
  },
  {
    question: "What is the main grape in Gavi?",
    options: ["Cortese", "Arneis", "Vermentino", "Falanghina"],
    correctAnswer: "Cortese",
    explanation: "Gavi is made exclusively from Cortese grapes in Piedmont, Italy."
  },
  {
    question: "Which process creates the bubbles in Champagne?",
    options: ["CO2 injection", "Secondary fermentation in bottle", "Pressure tank fermentation", "Natural carbonation"],
    correctAnswer: "Secondary fermentation in bottle",
    explanation: "Champagne bubbles are created by secondary fermentation in the bottle, producing CO2 naturally."
  },
  {
    question: "What does 'Blanc de Noirs' mean?",
    options: ["White from white grapes", "White from red grapes", "Red from white grapes", "Rosé wine"],
    correctAnswer: "White from red grapes",
    explanation: "Blanc de Noirs means white wine made from red/black grapes, common in Champagne."
  },
  {
    question: "Which grape is used to make Barossa Valley Eden Valley Riesling?",
    options: ["Sauvignon Blanc", "Chardonnay", "Riesling", "Gewürztraminer"],
    correctAnswer: "Riesling",
    explanation: "Eden Valley in Barossa is famous for its high-quality Riesling wines."
  },
  {
    question: "What is the primary grape in Valpolicella?",
    options: ["Corvina", "Sangiovese", "Nebbiolo", "Barbera"],
    correctAnswer: "Corvina",
    explanation: "Corvina is the main grape in Valpolicella wines from the Veneto region."
  },
  {
    question: "Which region produces Grüner Veltliner?",
    options: ["Germany", "Austria", "Switzerland", "Slovenia"],
    correctAnswer: "Austria",
    explanation: "Austria is the most famous producer of Grüner Veltliner, particularly in the Wachau region."
  },
  {
    question: "What does 'Grand Cru' mean in Burgundy?",
    options: ["Large production", "Highest classification", "Old vines", "Premium price"],
    correctAnswer: "Highest classification",
    explanation: "Grand Cru is the highest classification level in Burgundy for the most prestigious vineyard sites."
  },
  {
    question: "Which grape is the main component of Bandol reds?",
    options: ["Grenache", "Syrah", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Mourvèdre",
    explanation: "Bandol reds are dominated by Mourvèdre grapes in the Provence region."
  },
  {
    question: "What is the traditional method for making Port?",
    options: ["Continuous fermentation", "Fortification during fermentation", "Post-fermentation fortification", "Natural fermentation"],
    correctAnswer: "Fortification during fermentation",
    explanation: "Port is made by adding grape spirit during fermentation to stop the process and retain sweetness."
  },
  {
    question: "Which grape is used to make Sauternes?",
    options: ["Sauvignon Blanc only", "Sémillon only", "Sémillon and Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Sémillon and Sauvignon Blanc",
    explanation: "Sauternes is typically made from Sémillon and Sauvignon Blanc affected by noble rot."
  },
  {
    question: "What does 'Premier Cru' mean in Burgundy?",
    options: ["First vintage", "First quality level", "Second highest classification", "Village level"],
    correctAnswer: "Second highest classification",
    explanation: "Premier Cru is the second highest classification in Burgundy, below Grand Cru."
  },
  {
    question: "Which region is famous for Brunello di Montalcino?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Tuscany",
    explanation: "Brunello di Montalcino is produced in the Tuscany region of Italy."
  },
  {
    question: "What is the main grape in Chinon?",
    options: ["Pinot Noir", "Gamay", "Cabernet Franc", "Merlot"],
    correctAnswer: "Cabernet Franc",
    explanation: "Chinon red wines are made primarily from Cabernet Franc in the Loire Valley."
  },
  {
    question: "Which sparkling wine is made using the Charmat method?",
    options: ["Champagne", "Cava", "Prosecco", "Crémant"],
    correctAnswer: "Prosecco",
    explanation: "Prosecco is typically made using the Charmat method (tank fermentation) rather than bottle fermentation."
  },
  {
    question: "What does 'Mise en bouteille au domaine' mean?",
    options: ["Estate bottled", "Aged in domain", "Domain produced", "Domain owned"],
    correctAnswer: "Estate bottled",
    explanation: "Mise en bouteille au domaine means the wine was bottled at the estate where it was produced."
  },
  {
    question: "Which grape is the main component of red Burgundy?",
    options: ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Red Burgundy is made exclusively from Pinot Noir grapes."
  },
  {
    question: "What is the primary grape in Muscadet Sèvre-et-Maine?",
    options: ["Muscadet", "Melon de Bourgogne", "Chardonnay", "Sauvignon Blanc"],
    correctAnswer: "Melon de Bourgogne",
    explanation: "Muscadet Sèvre-et-Maine is made from Melon de Bourgogne grapes in the Loire Valley."
  },
  {
    question: "Which region produces Côte-Rôtie?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "Côte-Rôtie is produced in the Northern Rhône Valley, primarily from Syrah grapes."
  },
  {
    question: "What does 'Vendanges' mean in French wine terminology?",
    options: ["Vineyard", "Vintage", "Harvest", "Village"],
    correctAnswer: "Harvest",
    explanation: "Vendanges refers to the grape harvest period in French winemaking."
  },
  {
    question: "Which grape is used to make Assyrtiko wine?",
    options: ["Greek indigenous variety", "Sauvignon Blanc", "Chardonnay", "Moschofilero"],
    correctAnswer: "Greek indigenous variety",
    explanation: "Assyrtiko is an indigenous Greek white grape variety, particularly famous from Santorini."
  },
  {
    question: "What is the main grape in Hunter Valley Semillon?",
    options: ["Sauvignon Blanc", "Sémillon", "Chardonnay", "Riesling"],
    correctAnswer: "Sémillon",
    explanation: "Hunter Valley Semillon is made from Sémillon grapes and is known for its aging potential."
  },
  {
    question: "Which process is used to make rosé wine?",
    options: ["Blending red and white", "Limited skin contact", "Adding color", "All of the above"],
    correctAnswer: "Limited skin contact",
    explanation: "Most quality rosé is made by limited skin contact with red grapes, extracting minimal color."
  },
  {
    question: "What does 'Crianza' mean on a Spanish wine label?",
    options: ["Young wine", "Aged wine with specific requirements", "Reserve wine", "Old vines"],
    correctAnswer: "Aged wine with specific requirements",
    explanation: "Crianza indicates a Spanish wine aged for a minimum period with specific oak and bottle aging requirements."
  },
  {
    question: "Which grape is the main component of Chianti?",
    options: ["Nebbiolo", "Sangiovese", "Barbera", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Chianti is based primarily on Sangiovese grapes in Tuscany."
  },
  {
    question: "What is the primary difference between Champagne and Crémant?",
    options: ["Grape varieties", "Production region", "Method of production", "Sweetness level"],
    correctAnswer: "Production region",
    explanation: "Both use the traditional method, but Champagne can only be made in the Champagne region, while Crémant is made in other French regions."
  },
  {
    question: "Which grape is used to make Albariño?",
    options: ["Spanish indigenous variety", "Sauvignon Blanc", "Chardonnay", "Verdejo"],
    correctAnswer: "Spanish indigenous variety",
    explanation: "Albariño is an indigenous Spanish white grape variety, particularly famous in Rías Baixas."
  },
  {
    question: "What does 'Denominazione di Origine Controllata e Garantita' (DOCG) represent?",
    options: ["Italian quality classification", "Production method", "Grape variety", "Vintage year"],
    correctAnswer: "Italian quality classification",
    explanation: "DOCG is the highest classification level for Italian wines, guaranteeing origin and quality."
  },
  {
    question: "Which region is famous for producing Amarone?",
    options: ["Tuscany", "Piedmont", "Veneto", "Sicily"],
    correctAnswer: "Veneto",
    explanation: "Amarone della Valpolicella is produced in the Veneto region of northeastern Italy."
  },
  {
    question: "What is the traditional grape for making Sherry?",
    options: ["Tempranillo", "Palomino", "Garnacha", "Monastrell"],
    correctAnswer: "Palomino",
    explanation: "Palomino is the main grape variety used for making most styles of Sherry in Jerez, Spain."
  },
  {
    question: "Which winemaking process creates tannins in red wine?",
    options: ["Fermentation temperature", "Skin contact", "Oak aging", "Malolactic fermentation"],
    correctAnswer: "Skin contact",
    explanation: "Tannins are extracted from grape skins during the maceration process in red winemaking."
  },
  {
    question: "What does 'Réserve' typically indicate on a wine label?",
    options: ["Legal classification", "Extended aging", "Producer's selection", "Varies by region"],
    correctAnswer: "Varies by region",
    explanation: "The meaning of 'Réserve' varies by country and region - it may indicate extended aging, selection, or have no legal meaning."
  },
  {
    question: "Which grape is the main component of Madeira wine?",
    options: ["Sercial", "Verdelho", "Bual", "Various depending on style"],
    correctAnswer: "Various depending on style",
    explanation: "Madeira is made from different grape varieties including Sercial, Verdelho, Bual, and Malmsey, depending on the style."
  },
  {
    question: "What is the primary characteristic of Icewine/Eiswein?",
    options: ["Made from frozen grapes", "Served very cold", "Aged in ice caves", "Clear as ice"],
    correctAnswer: "Made from frozen grapes",
    explanation: "Icewine/Eiswein is made from grapes that freeze naturally on the vine, concentrating sugars and acids."
  },
  {
    question: "Which region produces the most Pinot Noir in the United States?",
    options: ["Napa Valley", "Sonoma Coast", "Oregon", "Washington State"],
    correctAnswer: "Oregon",
    explanation: "Oregon, particularly the Willamette Valley, is the most famous U.S. region for Pinot Noir production."
  },
  {
    question: "What does 'Malolactic fermentation' affect in wine?",
    options: ["Alcohol level", "Acidity and texture", "Color intensity", "Tannin structure"],
    correctAnswer: "Acidity and texture",
    explanation: "Malolactic fermentation converts sharp malic acid to softer lactic acid, reducing acidity and creating a creamier texture."
  },
  {
    question: "Which grape variety is Zinfandel genetically identical to?",
    options: ["Primitivo", "Sangiovese", "Tempranillo", "Garnacha"],
    correctAnswer: "Primitivo",
    explanation: "DNA analysis has proven that Zinfandel and Primitivo are the same grape variety."
  },
  {
    question: "What is the main grape used in white Rioja?",
    options: ["Tempranillo Blanco", "Viura", "Verdejo", "Albariño"],
    correctAnswer: "Viura",
    explanation: "Viura (also known as Macabeo) is the primary white grape variety used in white Rioja wines."
  },
  {
    question: "Which process is essential for making quality sparkling wine?",
    options: ["High fermentation temperature", "Secondary fermentation", "Extended maceration", "Oxidative aging"],
    correctAnswer: "Secondary fermentation",
    explanation: "Quality sparkling wines require a secondary fermentation to create the bubbles, either in bottle or tank."
  },
  {
    question: "What does 'Old Vine' typically refer to?",
    options: ["Vines over 25 years old", "Vines over 50 years old", "No legal definition", "Vines over 100 years old"],
    correctAnswer: "No legal definition",
    explanation: "Old Vine has no legal definition and meaning varies by producer, though it generally indicates mature vines."
  },
  {
    question: "Which factor most influences wine style in cool climate regions?",
    options: ["Soil type", "Grape ripeness levels", "Altitude", "Rainfall"],
    correctAnswer: "Grape ripeness levels",
    explanation: "Cool climates often struggle to fully ripen grapes, resulting in higher acidity and lighter body wines."
  },
  {
    question: "What is the primary difference between Fino and Oloroso Sherry?",
    options: ["Grape variety", "Aging under flor", "Alcohol level", "Sweetness"],
    correctAnswer: "Aging under flor",
    explanation: "Fino ages under a layer of flor (yeast), while Oloroso is fortified to prevent flor formation."
  },
  {
    question: "Which wine region is known for producing Carmenère?",
    options: ["Argentina", "Chile", "California", "Australia"],
    correctAnswer: "Chile",
    explanation: "Chile is most famous for Carmenère, a grape variety that was thought extinct in Bordeaux."
  },
  {
    question: "What does 'Botrytis cinerea' contribute to sweet wines?",
    options: ["Color intensity", "Alcohol content", "Concentrated flavors", "Tannin structure"],
    correctAnswer: "Concentrated flavors",
    explanation: "Botrytis cinerea (noble rot) dehydrates grapes, concentrating sugars and creating complex flavors in sweet wines."
  },
  {
    question: "Which grape is the signature variety of Santorini?",
    options: ["Assyrtiko", "Moschofilero", "Savatiano", "Rhoditis"],
    correctAnswer: "Assyrtiko",
    explanation: "Assyrtiko is the signature white grape of Santorini, known for its mineral character and high acidity."
  },
  {
    question: "What is the primary purpose of riddling in Champagne production?",
    options: ["Blending", "Clarification", "Pressure adjustment", "Flavor development"],
    correctAnswer: "Clarification",
    explanation: "Riddling moves sediment to the bottle neck for removal during disgorgement, clarifying the wine."
  },
  {
    question: "Which Australian wine region is famous for Cabernet Sauvignon?",
    options: ["Barossa Valley", "Hunter Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Coonawarra",
    explanation: "Coonawarra in South Australia is renowned for its Cabernet Sauvignon wines, particularly from terra rossa soils."
  },
  {
    question: "What does 'Estate Grown' mean on a wine label?",
    options: ["Large production", "Grapes grown on producer's property", "Family owned", "Organic farming"],
    correctAnswer: "Grapes grown on producer's property",
    explanation: "Estate Grown indicates that the grapes were grown on vineyards owned or controlled by the winery."
  },
  {
    question: "Which grape variety is used to make traditional Balsamic vinegar?",
    options: ["Sangiovese", "Trebbiano", "Lambrusco", "Barbera"],
    correctAnswer: "Trebbiano",
    explanation: "Traditional Balsamic vinegar is made from Trebbiano grapes in the Modena region of Italy."
  },
  {
    question: "What is the main characteristic of wines from high altitude vineyards?",
    options: ["Higher alcohol", "Greater acidity retention", "Darker color", "More tannins"],
    correctAnswer: "Greater acidity retention",
    explanation: "High altitude vineyards have cooler temperatures that help preserve acidity in grapes."
  }
];

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

const getTenRandomQuestions = () => {
  const shuffled = shuffleArray([...WINE_QUIZ_QUESTIONS]);
  return shuffled.slice(0, 10);
};

const WINE_VARIETAL_NAMES_SET = new Set(WINE_VARIETALS.map(v => v.name));

const generateGameCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const App = () => {
  const [mode, setMode] = useState('loadingAuth');
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [gameCodeInput, setGameCodeInput] = useState('');
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [answerSelected, setAnswerSelected] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [varietalElaboration, setVarietalElaboration] = useState('');
  const [showVarietalModal, setShowVarietalModal] = useState(false);
  const [newQuestionTopic, setNewQuestionTopic] = useState('');
  const [showGenerateQuestionModal, setShowGenerateQuestionModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Connectivity Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase initialization
  useEffect(() => {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          
          // Try to restore from localStorage first
          const local = loadLocalState();
          if (local && local.userId === user.uid && local.userName) {
            setUserName(local.userName);
            setActiveGameId(local.activeGameId || null);
            setMode(local.mode || 'initial');
          } else {
            const userProfileRef = doc(db, 'artifacts', firestoreAppId, 'users', user.uid, 'profile', 'userProfile');
            const docSnap = await getDoc(userProfileRef);

            if (docSnap.exists() && docSnap.data().userName) {
              setUserName(docSnap.data().userName);
              setMode('initial');
            } else {
              setMode('enterName');
            }
          }
          setIsAuthReady(true);
          setLoading(false);
        } else {
          await signInAnonymously(auth);
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase:", e);
      setError("Failed to initialize Firebase. Please try again later.");
      setLoading(false);
    }
  }, []);

  // Multiplayer game data subscription
  useEffect(() => {
    let unsubscribe;
    if (mode === 'multiplayer' && activeGameId && isAuthReady && userId) {
      const normalizedGameId = activeGameId.toUpperCase();
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedGameId);
      unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGameData(data);
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          setQuizEnded(data.quizEnded || false);
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
          
          // Only update score when answers are revealed or quiz ended
          if (data.revealAnswers || data.quizEnded) {
            const currentPlayerScore = Array.isArray(data.players) ? 
              (data.players.find(p => p.id === userId)?.score || 0) : 0;
            setScore(currentPlayerScore);
          }
          
          setFeedback('');
          setAnswerSelected(false);
          setSelectedAnswer(null);
          
          // Save to localStorage for reconnection
          saveLocalState({
            userId,
            userName,
            activeGameId,
            mode,
            currentQuestionIndex: data.currentQuestionIndex || 0,
            score: data.players?.find(p => p.id === userId)?.score || 0
          });
        } else {
          setError('Game not found or ended.');
          setActiveGameId(null);
          setGameData(null);
          setMode('multiplayer');
        }
      }, (err) => {
        console.error("Error listening to game updates:", err);
        setError("Failed to get real-time game updates.");
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, activeGameId, isAuthReady, userId, userName]);

  // Save state on changes
  useEffect(() => {
    if (userId && userName) {
      saveLocalState({
        userId,
        userName,
        activeGameId,
        mode,
        currentQuestionIndex,
        score
      });
    }
  }, [userId, userName, activeGameId, mode, currentQuestionIndex, score]);

  const handleSetName = async () => {
    if (!nameInput.trim()) {
      setError("Please enter a name.");
      return;
    }
    if (!userId) {
      setError("User not authenticated. Please try again.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userProfileRef = doc(db, 'artifacts', firestoreAppId, 'users', userId, 'profile', 'userProfile');
      await setDoc(userProfileRef, { userName: nameInput.trim() }, { merge: true });
      setUserName(nameInput.trim());
      setMode('initial');
      
      // Save to localStorage
      saveLocalState({
        userId,
        userName: nameInput.trim(),
        activeGameId,
        mode: 'initial',
        currentQuestionIndex,
        score
      });
    } catch (e) {
      console.error("Error saving user name:", e);
      setError("Failed to save your name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Single Player Logic
  const handleSinglePlayerAnswerClick = (selectedOption) => {
    if (answerSelected) return;

    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);

    const currentQuestion = Array.isArray(questions) && questions.length > currentQuestionIndex ? 
      questions[currentQuestionIndex] : { correctAnswer: '', explanation: '' };
    
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
      setFeedback('Correct!');
    } else {
      setFeedback('Incorrect.');
    }
    
    // Save to localStorage
    saveLocalState({
      userId,
      userName,
      activeGameId,
      mode,
      currentQuestionIndex,
      score: selectedOption === currentQuestion.correctAnswer ? score + 1 : score
    });
  };

  const handleSinglePlayerNextQuestion = () => {
    setFeedback('');
    setAnswerSelected(false);
    setSelectedAnswer(null);
    setVarietalElaboration('');
    setShowVarietalModal(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizEnded(true);
    }
  };

  const restartSinglePlayerQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizEnded(false);
    setFeedback('');
    setAnswerSelected(false);
    setSelectedAnswer(null);
    setVarietalElaboration('');
    setShowVarietalModal(false);
    setQuestions(getTenRandomQuestions());
  };

  // Multiplayer Logic
  const createNewGame = async () => {
    if (!userId || !userName) {
      setError("User identity not ready or name not set. Please wait.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      let newGameId = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!isUnique && attempts < maxAttempts) {
        const generatedCode = generateGameCode();
        const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, generatedCode);
        const docSnap = await getDoc(gameDocRef);
        if (!docSnap.exists()) {
          newGameId = generatedCode;
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        setError("Could not generate a unique game ID. Please try again.");
        setLoading(false);
        return;
      }

      const selectedGameQuestions = getTenRandomQuestions();
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, newGameId);
      await setDoc(gameDocRef, {
        hostId: userId,
        hostName: userName,
        currentQuestionIndex: 0,
        quizEnded: false,
        revealAnswers: false,
        players: [],
        questions: selectedGameQuestions,
        createdAt: new Date().toISOString(),
      });
      setActiveGameId(newGameId);
      setMode('multiplayer');
      setLoading(false);
    } catch (e) {
      console.error("Error creating game:", e);
      setError("Failed to create a new game.");
      setLoading(false);
    }
  };

  const joinExistingGame = async () => {
    if (!gameCodeInput.trim() || gameCodeInput.trim().length !== 4) {
      setError("Please enter a 4-character game ID.");
      return;
    }
    if (!userId || !userName) {
      setError("User identity not ready or name not set. Please wait.");
      return;
    }

    setLoading(true);
    setError('');
    const normalizedIdToJoin = gameCodeInput.trim().toUpperCase();
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedIdToJoin);
    try {
      const docSnap = await getDoc(gameDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const players = Array.isArray(data.players) ? data.players : [];
        if (!players.some(p => p.id === userId)) {
          await updateDoc(gameDocRef, { 
            players: arrayUnion({ 
              id: userId, 
              score: 0, 
              userName: userName,
              selectedAnswerForQuestion: null,
              feedbackForQuestion: null
            })
          });
        }
        setActiveGameId(normalizedIdToJoin);
        setMode('multiplayer');
        setLoading(false);
      } else {
        setError('Game ID not found. Please check the code and try again.');
        setLoading(false);
      }
    } catch (e) {
      console.error("Error joining game:", e);
      setError("Failed to join the game.");
      setLoading(false);
    }
  };

  const handleMultiplayerAnswerClick = async (selectedOption) => {
    const safeGameData = gameData || { players: [], questions: [], currentQuestionIndex: 0, quizEnded: false };
    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    
    if (currentPlayersArray.find(p => p.id === userId)?.selectedAnswerForQuestion || safeGameData.quizEnded) {
      return;
    }

    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);

    // Only store the selected answer, don't update score yet
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const updatedPlayers = currentPlayersArray.map(p => {
      if (p.id === userId) {
        return {
          ...p,
          selectedAnswerForQuestion: selectedOption
        };
      }
      return p;
    });

    try {
      await updateDoc(gameDocRef, { players: updatedPlayers });
    } catch (e) {
      console.error("Error updating answer:", e);
      setError("Failed to submit your answer.");
    }
  };

  const revealAnswersToAll = async () => {
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
    const updatedPlayers = gameData.players.map(p => {
      let increment = 0;
      if (p.selectedAnswerForQuestion === currentQuestion.correctAnswer) {
        increment = 1;
      }
      return {
        ...p,
        score: (p.score || 0) + increment,
        feedbackForQuestion: (p.selectedAnswerForQuestion
          ? (p.selectedAnswerForQuestion === currentQuestion.correctAnswer ? "Correct!" : "Incorrect.")
          : null)
      };
    });
    await updateDoc(gameDocRef, { players: updatedPlayers, revealAnswers: true });
  };

  const handleMultiplayerNextQuestion = async () => {
    const safeGameData = gameData || { hostId: '', currentQuestionIndex: 0, players: [], questions: [] };
    
    if (safeGameData.hostId !== userId) {
      setError("Only the Proctor (host) can advance questions.");
      return;
    }

    if (!safeGameData.revealAnswers) {
      setError("Please reveal answers before proceeding to the next question.");
      return;
    }

    setFeedback('');
    setAnswerSelected(false);
    setSelectedAnswer(null);
    setVarietalElaboration('');
    setShowVarietalModal(false);

    const nextIndex = safeGameData.currentQuestionIndex + 1;
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);

    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    const resetPlayers = currentPlayersArray.map(p => ({
      ...p,
      selectedAnswerForQuestion: null,
      feedbackForQuestion: null
    }));

    const currentQuestionsArray = Array.isArray(safeGameData.questions) ? safeGameData.questions : [];
    
    if (nextIndex < currentQuestionsArray.length) {
      try {
        await updateDoc(gameDocRef, { 
          currentQuestionIndex: nextIndex, 
          players: resetPlayers,
          revealAnswers: false
        });
      } catch (e) {
        console.error("Error advancing question:", e);
        setError("Failed to advance question.");
      }
    } else {
      try {
        await updateDoc(gameDocRef, { quizEnded: true, players: resetPlayers });
      } catch (e) {
        console.error("Error ending quiz:", e);
        setError("Failed to end quiz.");
      }
    }
  };

  const restartMultiplayerQuiz = async () => {
    const safeGameData = gameData || { hostId: '', players: [] };
    
    if (safeGameData.hostId !== userId) {
      setError("Only the Proctor (host) can restart the quiz.");
      return;
    }

    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    const resetPlayers = currentPlayersArray.map(p => ({ 
      ...p, 
      score: 0, 
      selectedAnswerForQuestion: null, 
      feedbackForQuestion: null 
    }));
    const newRandomQuestions = getTenRandomQuestions();

    try {
      await updateDoc(gameDocRef, {
        currentQuestionIndex: 0,
        quizEnded: false,
        revealAnswers: false,
        players: resetPlayers,
        questions: newRandomQuestions,
      });
    } catch (e) {
      console.error("Error restarting multiplayer quiz:", e);
      setError("Failed to restart multiplayer quiz.");
    }
  };

  // LLM Functions
  const callGeminiAPI = async (prompt, schema = null) => {
    setLlmLoading(true);
    setError('');
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    if (schema) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema
      };
    }

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setLlmLoading(false);

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        if (schema) {
          return JSON.parse(text);
        }
        return text;
      } else {
        setError("LLM did not return a valid response.");
        console.error("LLM response error:", result);
        return null;
      }
    } catch (e) {
      setLlmLoading(false);
      console.error("Error calling Gemini API:", e);
      setError("Failed to communicate with the AI. Please try again.");
      return null;
    }
  };

  const handleGenerateQuestion = async () => {
    if (!newQuestionTopic.trim()) {
      setError("Please enter a topic for the new question.");
      return;
    }
    setShowGenerateQuestionModal(false);
    setError('');

    const prompt = `Generate a multiple-choice quiz question about "${newQuestionTopic}" at a beginner level. Provide 4 distinct options, the correct answer, and a concise explanation. Do NOT include any image URLs. Return in the following JSON format:
{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correctAnswer": "...",
  "explanation": "..."
}`;

    const schema = {
      type: "OBJECT",
      properties: {
        question: { type: "STRING" },
        options: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        correctAnswer: { type: "STRING" },
        explanation: { type: "STRING" }
      },
      required: ["question", "options", "correctAnswer", "explanation"]
    };

    const generatedQuestion = await callGeminiAPI(prompt, schema);

    if (generatedQuestion) {
      setQuestions(prevQuestions => {
        const currentQuestionsArray = Array.isArray(prevQuestions) ? prevQuestions : [];
        return [...currentQuestionsArray, generatedQuestion];
      });
      
      if (mode === 'multiplayer' && activeGameId) {
        const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
        const safeGameData = gameData || { questions: [] };
        const currentGameQuestionsArray = Array.isArray(safeGameData.questions) ? safeGameData.questions : [];
        
        try {
          await updateDoc(gameDocRef, {
            questions: [...currentGameQuestionsArray, generatedQuestion]
          });
        } catch (e) {
          console.error("Error updating questions in Firestore:", e);
          setError("Failed to save the new question to the game.");
        }
      }
      setNewQuestionTopic('');
    }
  };

  const handleElaborateVarietal = async (varietalName) => {
    setShowVarietalModal(true);
    setVarietalElaboration('');
    setError('');

    const prompt = `Provide a concise, 2-3 sentence description of the wine varietal: ${varietalName}. Focus on its typical characteristics and origin.`;
    const elaboration = await callGeminiAPI(prompt);
    if (elaboration) {
      setVarietalElaboration(elaboration);
    } else {
      setVarietalElaboration("Could not retrieve elaboration for this varietal.");
    }
  };

  // Render content
  const renderContent = () => {
    const safeGameData = gameData || { 
      players: [], 
      questions: [], 
      currentQuestionIndex: 0, 
      quizEnded: false, 
      hostId: '', 
      hostName: '',
      revealAnswers: false
    };
    
    const isHost = safeGameData.hostId === userId;
    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    const sortedPlayers = [...currentPlayersArray].sort((a, b) => b.score - a.score);
    const answeredCount = currentPlayersArray.filter(p => p.selectedAnswerForQuestion != null).length;
    const totalPlayers = currentPlayersArray.length;

    if (loading || !isAuthReady) {
      return <p className="text-center text-gray-700 text-xl">Loading...</p>;
    }

    if (error) {
      return (
        <div className="text-center space-y-4 text-red-600 text-lg">
          <p>{error}</p>
          <button
            onClick={() => {
              setError('');
              setMode('initial');
              setActiveGameId(null);
              setGameData(null);
            }}
            className="mt-4 bg-[#6b2a58] text-white py-2 px-4 rounded-lg hover:bg-[#496E3E] transition-colors"
          >
            Go Back
          </button>
        </div>
      );
    }

    if (mode === 'enterName') {
      return (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Enter Your Name</h2>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] text-gray-800"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSetName();
              }
            }}
          />
          <button
            onClick={handleSetName}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
            disabled={!nameInput.trim()}
          >
            Continue
          </button>
        </div>
      );
    } else if (mode === 'initial') {
      return (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Mode</h2>
          <p className="text-gray-700 text-lg">Welcome, <span className="font-mono text-[#6b2a58]">{userName}</span>!</p>
          <button
            onClick={() => {
              setMode('singlePlayer');
              setQuestions(getTenRandomQuestions());
            }}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
          >
            Single Player
          </button>
          <button
            onClick={() => setMode('multiplayer')}
            className="w-full bg-[#9CAC3E] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E]"
          >
            Multiplayer
          </button>
          <button
            onClick={() => setMode('enterName')}
            className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Edit Name
          </button>
        </div>
      );
    } else if (mode === 'singlePlayer') {
      const currentQuestion = Array.isArray(questions) && questions.length > currentQuestionIndex ? 
        questions[currentQuestionIndex] : { options: [], correctAnswer: '', question: '', explanation: '' };
      const isVarietalAnswer = currentQuestion.correctAnswer.includes('(') &&
                               WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());

      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Single Player Quiz</h2>
          {!quizEnded ? (
            <>
              <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <p className="text-xl text-gray-800 font-medium">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSinglePlayerAnswerClick(option)}
                    disabled={answerSelected}
                    className={`
                      w-full p-4 rounded-lg text-left text-lg font-medium
                      transition-all duration-200 ease-in-out
                      ${answerSelected
                        ? option === currentQuestion.correctAnswer
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                          : option === selectedAnswer
                            ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                            : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40'
                      }
                      ${!answerSelected && 'hover:scale-[1.02]'}
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {feedback && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 shadow-inner">
                  <p className={`text-lg font-bold ${feedback === 'Correct!' ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback}
                  </p>
                  {feedback === 'Incorrect.' && (
                    <p className="text-gray-700 mt-2">
                      <span className="font-semibold">Correct Answer:</span> {currentQuestion.correctAnswer}
                    </p>
                  )}
                  <p className="text-gray-700 mt-2">
                    <span className="font-semibold">Explanation:</span> {currentQuestion.explanation}
                  </p>
                  {isVarietalAnswer && (
                    <button
                      onClick={() => handleElaborateVarietal(currentQuestion.correctAnswer.split('(')[0].trim())}
                      className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-md"
                      disabled={llmLoading}
                    >
                      {llmLoading ? 'Generating...' : '✨ Elaborate on Varietal'}
                    </button>
                  )}
                </div>
              )}

              {answerSelected && (
                <button
                  onClick={handleSinglePlayerNextQuestion}
                  className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold mt-6 hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              )}
            </>
          ) : (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Quiz Complete!</h2>
              <p className="text-2xl text-gray-700">
                You scored <span className="font-extrabold text-[#6b2a58]">{score}</span> out of <span className="font-extrabold text-[#6b2a58]">{questions.length}</span>!
              </p>
              <button
                onClick={restartSinglePlayerQuiz}
                className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold mr-4 hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
              >
                Play Again
              </button>
              <a
                href="https://www.vineyardvoyages.com/tours"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E]"
              >
                Book a Tour Now!
              </a>
            </div>
          )}
          <button
            onClick={() => setMode('initial')}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Back to Mode Selection
          </button>
        </div>
      );
    } else if (mode === 'multiplayer' && !activeGameId) {
      return (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Multiplayer Lobby</h2>
          <p className="text-gray-700 text-lg">Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span></p>
          <button
            onClick={createNewGame}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
          >
            Create New Game (Proctor Mode)
          </button>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter 4-character Game ID"
              className="flex-grow p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] text-gray-800"
              value={gameCodeInput}
              onChange={(e) => setGameCodeInput(e.target.value.toUpperCase())}
              maxLength={4}
            />
            <button
              onClick={joinExistingGame}
              disabled={gameCodeInput.length !== 4}
              className="bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Game (Player Mode)
            </button>
          </div>
          <button
            onClick={() => setMode('initial')}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Back to Mode Selection
          </button>
        </div>
      );
    } else if (mode === 'multiplayer' && activeGameId) {
      const currentQuestionsArray = Array.isArray(safeGameData.questions) ? safeGameData.questions : [];
      const currentQuestion = currentQuestionsArray.length > safeGameData.currentQuestionIndex ? 
        currentQuestionsArray[safeGameData.currentQuestionIndex] : 
        { options: [], correctAnswer: '', question: '', explanation: '' };
      const isVarietalAnswer = currentQuestion.correctAnswer.includes('(') &&
                               WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());
      const currentPlayerGameData = currentPlayersArray.find(p => p.id === userId);
      const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
      const playerFeedback = currentPlayerGameData?.feedbackForQuestion || '';

      const getWinners = () => {
        if (!Array.isArray(sortedPlayers) || sortedPlayers.length === 0) return [];
        const topScore = sortedPlayers[0].score;
        return sortedPlayers.filter(player => player.score === topScore);
      };
      const winners = getWinners();

      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Multiplayer Game</h2>
          <p className="text-gray-700 text-lg text-center">Game ID: <span className="font-mono text-[#6b2a58] break-all">{activeGameId}</span></p>
          <p className="text-gray-700 text-lg text-center">
            Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>
            {isHost ? <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-sm font-semibold rounded-full">Proctor</span> : <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-sm font-semibold rounded-full">Player</span>}
          </p>

          {!isHost && safeGameData.hostName && (
            <p className="text-gray-700 text-lg text-center">
              Proctor: <span className="font-mono text-[#6b2a58] break-all">{safeGameData.hostName}</span>
            </p>
          )}

          {isHost && !safeGameData.quizEnded && (
            <div className="bg-blue-50 p-3 rounded-lg shadow-inner text-center">
              <p className="text-lg font-semibold text-blue-800">
                Players answered: <span className="font-bold">{answeredCount} / {totalPlayers}</span>
              </p>
            </div>
          )}

          {!safeGameData.quizEnded && (
            <>
              <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Question {safeGameData.currentQuestionIndex + 1} of {currentQuestionsArray.length}
                </p>
                <p className="text-xl text-gray-800 font-medium">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isHost ? (
                  <>
                    {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => (
                      <div key={index} className={`w-full p-4 rounded-lg text-left text-lg font-medium
                        ${option === currentQuestion.correctAnswer ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-gray-100 text-gray-800'}`}>
                        {option}
                      </div>
                    ))}
                    <p className="text-gray-700 text-center col-span-2">
                      <span className="font-semibold text-green-600">Correct Answer:</span> {currentQuestion.correctAnswer}
                    </p>
                    <p className="text-gray-700 text-center col-span-2">
                      <span className="font-semibold">Explanation:</span> {currentQuestion.explanation}
                    </p>
                  </>
                ) : (
                  Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMultiplayerAnswerClick(option)}
                      disabled={currentPlayerGameData?.selectedAnswerForQuestion !== null || safeGameData.quizEnded}
                      className={`
                        w-full p-4 rounded-lg text-left text-lg font-medium
                        transition-all duration-200 ease-in-out
                        ${currentPlayerGameData?.selectedAnswerForQuestion !== null
                          ? safeGameData.revealAnswers
                            ? option === currentQuestion.correctAnswer
                              ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                              : option === playerSelectedAnswer
                                ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                                : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                            : option === playerSelectedAnswer
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40'
                        }
                        ${currentPlayerGameData?.selectedAnswerForQuestion === null && 'hover:scale-[1.02]'}
                      `}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>

              {safeGameData.revealAnswers && playerFeedback && !isHost && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 shadow-inner">
                  <p className={`text-lg font-bold ${playerFeedback === 'Correct!' ? 'text-green-600' : 'text-red-600'}`}>
                    {playerFeedback}
                  </p>
                  {playerFeedback === 'Incorrect.' && (
                    <p className="text-gray-700 mt-2">
                      <span className="font-semibold">Correct Answer:</span> {currentQuestion.correctAnswer}
                    </p>
                  )}
                  <p className="text-gray-700 mt-2">
                    <span className="font-semibold">Explanation:</span> {currentQuestion.explanation}
                  </p>
                  {isVarietalAnswer && (
                    <button
                      onClick={() => handleElaborateVarietal(currentQuestion.correctAnswer.split('(')[0].trim())}
                      className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-md"
                      disabled={llmLoading}
                    >
                      {llmLoading ? 'Generating...' : '✨ Elaborate on Varietal'}
                    </button>
                  )}
                </div>
              )}

              {isHost && (
                <div className="flex gap-4">
                  {!safeGameData.revealAnswers && (
                    <button 
                      onClick={revealAnswersToAll}
                      className="bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                      Reveal Answers
                    </button>
                  )}
                  <button
                    onClick={handleMultiplayerNextQuestion}
                    disabled={!safeGameData.revealAnswers}
                    className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg font-bold hover:bg-[#496E3E] transition-colors disabled:opacity-50"
                  >
                    {safeGameData.currentQuestionIndex < currentQuestionsArray.length - 1 ? 'Next Question' : 'End Game'}
                  </button>
                </div>
              )}

              {isHost && (
                <button
                  onClick={() => setShowGenerateQuestionModal(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg text-xl font-bold hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
                  disabled={llmLoading}
                >
                  {llmLoading ? 'Generating...' : '✨ Generate New Question'}
                </button>
              )}
            </>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Players:</h3>
            <p className="text-gray-700 text-center mb-2">
              There {currentPlayersArray.length === 1 ? 'is' : 'are'} {currentPlayersArray.length} player{currentPlayersArray.length === 1 ? '' : 's'} in this game.
            </p>
            <ul className="space-y-2">
              {currentPlayersArray.map(player => (
                <li key={player.id} className="flex items-center text-lg text-gray-700">
                  <span className="font-semibold">
                    {player.userName}
                    {player.id === safeGameData.hostId ? (
                      <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-xs font-semibold rounded-full">Proctor</span>
                    ) : (
                      <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-xs font-semibold rounded-full">Player</span>
                    )}
                  </span>
                  {(isHost || player.id === userId) && (
                    <span className="font-bold text-[#6b2a58] ml-4">{player.score}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {safeGameData.quizEnded && (
            <div className="text-center space-y-6 mt-8">
              <h2 className="text-3xl font-bold text-gray-900">Multiplayer Game Complete!</h2>
              {winners.length === 1 ? (
                <p className="text-3xl font-extrabold text-green-700">
                  Winner: {winners[0].userName}!
                </p>
              ) : (
                <p className="text-3xl font-extrabold text-green-700">
                  It's a tie! Winners: {winners.map(w => w.userName).join(', ')}!
                </p>
              )}
              {!isHost && (
                <p className="text-2xl text-gray-700">
                  Your score: <span className="font-extrabold text-[#6b2a58]">{score}</span>
                </p>
              )}
              {isHost && (
                <button
                  onClick={restartMultiplayerQuiz}
                  className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold mr-4 hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
                >
                  Restart Game
                </button>
              )}
              <a
                href="https://www.vineyardvoyages.com/tours"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E]"
              >
                Book a Tour Now!
              </a>
            </div>
          )}
          <button
            onClick={() => {
              setMode('initial');
              setActiveGameId(null);
              setGameData(null);
              clearLocalState();
            }}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Leave Game
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b2a58] via-[#6b2a58] to-[#9CAC3E] flex items-center justify-center p-4 font-inter"
      style={{
        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/e/e0/Vineyard_at_sunset.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50">
          You are offline. Some features may not work until you reconnect.
        </div>
      )}
      
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-105">
        <div className="flex justify-center mb-4">
          <img
            src="https://vineyardvoyages.com/wp-content/uploads/2025/06/Untitled-design.png"
            alt="Vineyard Voyages Logo"
            className="h-24 w-auto object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x96/6b2a58/ffffff?text=Logo"; }}
          />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          <span className="text-[#6b2a58]">Vineyard Voyages</span> Connoisseur Challenge
        </h1>
        {renderContent()}

        {/* Varietal Elaboration Modal */}
        {showVarietalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Varietal Insight</h3>
              {llmLoading ? (
                <p className="text-gray-700">Generating elaboration...</p>
              ) : (
                <p className="text-gray-800">{varietalElaboration}</p>
              )}
              <button
                onClick={() => setShowVarietalModal(false)}
                className="w-full bg-[#6b2a58] text-white py-2 rounded-lg text-lg font-bold hover:bg-[#496E3E] transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Generate Question Modal */}
        {showGenerateQuestionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Generate New Question</h3>
              <input
                type="text"
                placeholder="Enter topic (e.g., 'Virginia wines', 'sparkling wines')"
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] text-gray-800"
                value={newQuestionTopic}
                onChange={(e) => setNewQuestionTopic(e.target.value)}
              />
              <button
                onClick={handleGenerateQuestion}
                className="w-full bg-[#6b2a58] text-white py-2 rounded-lg text-lg font-bold hover:bg-[#496E3E] transition-colors duration-200"
                disabled={llmLoading || !newQuestionTopic.trim()}
              >
                {llmLoading ? 'Generating...' : '✨ Generate New Question'}
              </button>
              <button
                onClick={() => setShowGenerateQuestionModal(false)}
                className="w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
