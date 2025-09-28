import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore'; 

// Firebase Configuration (will read from Netlify Environment Variable)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_ACTUAL_FIREBASE_API_KEY_HERE", // TEMPORARY FOR GITPOD PREVIEW ONLY
  authDomain: "vineyardvoyagesquiz.firebaseapp.com",
  projectId: "vineyardvoyagesquiz",
  storageBucket: "vineyardvoyagesquiz.appspot.com",
  messagingSenderId: "429604849897",
  appId: "1:429604849897:web:481e9ade4e745ae86f8878",
  measurementId: "G-KBLZD8FSEM"
};

// Use projectId for Firestore paths to avoid issues with special characters in appId
const firestoreAppId = firebaseConfig.projectId;
// eslint-disable-next-line no-unused-vars
const appId = firebaseConfig.appId; // Retained for consistency, but not used directly

const initialAuthToken = null; // Keep this as null unless you have a specific custom auth token

// Initialize Firebase globally to avoid re-initialization
let app;
let db;
let auth;

// --- Local Storage Utilities for Offline/Reconnect Support ---
const saveLocalState = (state) => {
  try {
    localStorage.setItem('vv-quiz-state', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadLocalState = () => {
  try {
    const data = localStorage.getItem('vv-quiz-state');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return null;
  }
};

const removeLocalState = () => {
  try {
    localStorage.removeItem('vv-quiz-state');
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};

// --- WINE DATA AND QUIZ QUESTIONS (Updated with full explanations and filtered Loudoun wineries) ---

// --- Loudoun Wineries (Filtered to your 15 partners) ---
const LOUDOUN_WINERIES = [
  "868 Estate Vineyards",
  "8-Chains North Winery",
  "Carriage House Wineworks",
  "Casanel Vineyards & Winery",
  "Domaine Fortier Vineyards",
  "Fabbioli Cellars",
  "Firefly Cellars",
  "Fleetwood Farm Winery",
  "Good Spirit Farm Winery",
  "Hidden Brook Winery",
  "Hillsborough Winery & Brewery",
  "Kalero Vineyard",
  "October 1 Vineyard Tasting Room",
  "Otium Cellars",
  "Williams Gap Winery"
];

// --- Extensive list of wine varietals with their countries of origin (Canada excluded) ---
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
  { name: "Glera", country: "Italy" }, // Prosecco grape
  { name: "Chasselas", country: "Switzerland" },
  { name: "Sylvaner", country: "Germany" },
  { name: "Dornfelder", country: "Germany" },
  { name: "Müller-Thurgau", country: "Germany" },
  { name: "Portugieser", country: "Germany" },
  { name: "Spätburgunder", country: "Germany" }, // German Pinot Noir
  { name: "Grillo", country: "Italy" },
  { name: "Inzolia", country: "Italy" },
  { name: "Catarratto", country: "Italy" },
  { name: "Frappato", country: "Italy" },
  { name: "Pecorino", country: "Italy" },
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
  { name: "Nielluccio", country: "France" }, // Sangiovese
  { name: "Négrette", country: "France" },
  { name: "Pascal Blanc", country: "France" },
  { name: "Perdrix", country: "France" },
  { name: "Picardan", country: "France" },
  { name: "Pineau d'Aunis", country: "France" },
  { name: "Piquepoul", country: "France" },
  { name: "Rolle", country: "France" }, // Vermentino
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
  { name: "Marquette", "country": "USA" },
  { name: "Frontenac", country: "USA" },
  { name: "La Crescent", country: "USA" },
  { name: "Prairie Star", country: "USA" },
  { name: "Chambourcin", country: "USA" },
  { name: "Vignoles", country: "USA" },
  { name: "Norton", country: "USA" },
  { name: "Niagara", country: "USA" },
  {
    name: "Concord",
    country: "USA"
  },
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
  { name: "Vignoles", country: "USA" },
  { name: "Traminette", country: "USA" },
  { name: "Noiret", country: "USA" },
  { name: "Corot Noir", country: "USA" },
  { name: "Valvin Muscat", country: "USA" },
  { name: "Aurore", country: "USA" },
  { name: "Baco Noir", country: "USA" },
  { name: "Cascade", country: "USA" },
  { name: "De Chaunac", country: "USA" },
  { name: "Marechal Foch", country: "USA" },
  { name: "Leon Millot", country: "USA" },
];

// Full bank of 200 beginner-level questions with enhanced explanations
const WINE_QUIZ_QUESTIONS = [
  // --- General Wine Knowledge (100 questions) ---
  {
    question: "Which of the following is a red grape varietal?",
    options: ["Chardonnay", "Sauvignon Blanc", "Merlot", "Pinot Grigio"],
    correctAnswer: "Merlot",
    explanation: "Merlot is a popular red grape varietal known for its soft, approachable wines.",
    wrongAnswerExplanations: {
      "Chardonnay": "Chardonnay is a white grape varietal, not red.",
      "Sauvignon Blanc": "Sauvignon Blanc is a white grape varietal known for its crisp, acidic character.",
      "Pinot Grigio": "Pinot Grigio (also called Pinot Gris) is a white grape varietal."
    }
  },
  {
    question: "What is 'terroir' in winemaking?",
    options: [
      "A type of wine barrel",
      "The complete natural environment in which a wine is produced, including factors such as soil, topography, and climate.",
      "A winemaking technique",
      "A wine tasting term"
    ],
    correctAnswer: "The complete natural environment in which a wine is produced, including factors such as soil, topography, and climate.",
    explanation: "Terroir refers to the unique combination of environmental factors that affect a crop's phenotype, including climate, soil, and topography, and how they influence the wine's character.",
    wrongAnswerExplanations: {
      "A type of wine barrel": "Wine barrels are containers for aging wine, not environmental factors.",
      "A winemaking technique": "Winemaking techniques are processes used to make wine, not environmental conditions.",
      "A wine tasting term": "While terroir affects wine taste, it refers to environmental factors, not a tasting descriptor."
    }
  },
  {
    question: "Which country is the largest producer of wine globally?",
    options: ["France", "Italy", "Spain", "United States"],
    correctAnswer: "Italy",
    explanation: "While France is famous for its wines, Italy consistently holds the title of the world's largest wine producer by volume.",
    wrongAnswerExplanations: {
      "France": "France is the second-largest wine producer and is famous for quality, but Italy produces more by volume.",
      "Spain": "Spain has the most vineyard area planted but ranks third in production volume.",
      "United States": "The US is a major producer but ranks fourth globally in wine production."
    }
  },
  {
    question: "What is the primary grape used in traditional Champagne production?",
    options: ["Riesling", "Pinot Noir", "Syrah", "Zinfandel"],
    correctAnswer: "Pinot Noir",
    explanation: "Traditional Champagne is typically made from a blend of Chardonnay, Pinot Noir, and Pinot Meunier grapes. Pinot Noir is one of the key red grapes used.",
    wrongAnswerExplanations: {
      "Riesling": "Riesling is primarily grown in Germany and Alsace, not used in Champagne production.",
      "Syrah": "Syrah is a red grape from the Rhône Valley, not permitted in Champagne.",
      "Zinfandel": "Zinfandel is primarily associated with California wines, not Champagne."
    }
  },
  {
    question: "Which of these wines is typically dry and crisp, often with notes of green apple and citrus?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Zinfandel"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc is known for its high acidity and aromatic profile, often featuring notes of green apple, lime, and herbaceousness.",
    wrongAnswerExplanations: {
      "Cabernet Sauvignon": "Cabernet Sauvignon is a full-bodied red wine with darker fruit flavors and tannins.",
      "Chardonnay (oaked)": "Oaked Chardonnay is typically full-bodied with buttery, vanilla notes rather than crisp citrus.",
      "Zinfandel": "Zinfandel is typically a bold red wine with berry and spice flavors, not citrusy."
    }
  },
  {
    question: "What is the process of aging wine in oak barrels called?",
    options: ["Fermentation", "Malolactic fermentation", "Oaking", "Racking"],
    correctAnswer: "Oaking",
    explanation: "Oaking is the term for aging wine in oak barrels, which can impart flavors like vanilla, spice, and toast.",
    wrongAnswerExplanations: {
      "Fermentation": "Fermentation is the conversion of sugar to alcohol, not the aging process.",
      "Malolactic fermentation": "This is a secondary fermentation that converts malic acid to lactic acid.",
      "Racking": "Racking is the process of transferring wine from one container to another to separate it from sediment."
    }
  },
  {
    question: "Which wine region is famous for its Cabernet Sauvignon wines?",
    options: ["Bordeaux, France", "Napa Valley, USA", "Barossa Valley, Australia", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Cabernet Sauvignon is a widely planted grape, and all listed regions are renowned for producing high-quality Cabernet Sauvignon wines.",
    wrongAnswerExplanations: {
      "Bordeaux, France": "While Bordeaux is famous for Cabernet Sauvignon, it's not the only region—all options are correct.",
      "Napa Valley, USA": "While Napa Valley is renowned for Cabernet Sauvignon, other regions also excel—all options are correct.",
      "Barossa Valley, Australia": "While Barossa Valley produces excellent Cabernet Sauvignon, other regions do too—all options are correct."
    }
  },
  {
    question: "What is the ideal serving temperature for most red wines?",
    options: ["Chilled (40-45°F)", "Room temperature (68-72°F)", "Cool (60-65°F)", "Warm (75-80°F)"],
    correctAnswer: "Cool (60-65°F)",
    explanation: "Most red wines are best served slightly cooler than typical room temperature to highlight their fruit and acidity.",
    wrongAnswerExplanations: {
      "Chilled (40-45°F)": "This temperature is too cold and would mute the wine's aromas and flavors.",
      "Room temperature (68-72°F)": "Modern room temperature is often too warm, making the wine taste flat and overly alcoholic.",
      "Warm (75-80°F)": "This temperature is too warm and would make the wine taste unbalanced with harsh alcohol."
    }
  },
  {
    question: "Which of these is a sparkling wine from Spain?",
    options: ["Prosecco", "Champagne", "Cava", "Lambrusco"],
    correctAnswer: "Cava",
    explanation: "Cava is a popular sparkling wine from Spain, produced using the traditional method, similar to Champagne.",
    wrongAnswerExplanations: {
      "Prosecco": "Prosecco is a sparkling wine from Italy, not Spain.",
      "Champagne": "Champagne is a sparkling wine exclusively from the Champagne region of France.",
      "Lambrusco": "Lambrusco is a sparkling red wine from Italy, not Spain."
    }
  },
  {
    question: "What does 'tannin' refer to in wine?",
    options: ["Sweetness", "Acidity", "Bitterness and astringency", "Alcohol content"],
    correctAnswer: "Bitterness and astringency",
    explanation: "Tannins are naturally occurring compounds found in grape skins, seeds, and stems, contributing to a wine's bitterness, astringency, and structure.",
    wrongAnswerExplanations: {
      "Sweetness": "Sweetness in wine comes from residual sugar, not tannins.",
      "Acidity": "Acidity provides tartness and freshness, which is different from the dry, bitter sensation of tannins.",
      "Alcohol content": "Alcohol provides warmth and body, but tannins create the dry, mouth-puckering sensation."
    }
  },
  {
    question: "Which white grape is typically used to make dry, aromatic wines in the Loire Valley, France?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc is the key grape in regions like Sancerre and Pouilly-Fumé in the Loire Valley, producing crisp, mineral-driven wines.",
    wrongAnswerExplanations: {
      "Chardonnay": "While Chardonnay grows in Loire Valley, it's not the primary grape for dry, aromatic wines there.",
      "Pinot Gris": "Pinot Gris is more associated with Alsace than the Loire Valley's aromatic wines.",
      "Riesling": "Riesling is primarily grown in Germany and Alsace, not the Loire Valley."
    }
  },
  {
    question: "What is a 'Proctor'?",
    options: ["A winemaker", "A wine critic", "A trained and knowledgeable wine professional", "A wine seller"],
    correctAnswer: "A trained and knowledgeable wine professional",
    explanation: "A Proctor is a highly trained and knowledgeable wine professional, typically working in fine dining restaurants, now serving as the moderator.",
    wrongAnswerExplanations: {
      "A winemaker": "A winemaker produces wine, while a Proctor is more focused on service and education.",
      "A wine critic": "A wine critic evaluates and reviews wines professionally, which is different from a Proctor's role.",
      "A wine seller": "A wine seller focuses on sales, while a Proctor provides expertise and guidance in service."
    }
  },
  {
    question: "Which of these is a sweet, fortified wine from Portugal?",
    options: ["Sherry", "Port", "Madeira", "Marsala"],
    correctAnswer: "Port",
    explanation: "Port is a sweet, fortified wine produced in the Douro Valley of northern Portugal.",
    wrongAnswerExplanations: {
      "Sherry": "Sherry is a fortified wine from Spain, not Portugal.",
      "Madeira": "While Madeira is from Portuguese territory (Madeira Island), Port is the more commonly known Portuguese fortified wine.",
      "Marsala": "Marsala is a fortified wine from Sicily, Italy, not Portugal."
    }
  },
  {
    question: "What is the process of converting grape juice into wine called?",
    options: ["Distillation", "Fermentation", "Maceration", "Clarification"],
    correctAnswer: "Fermentation",
    explanation: "Fermentation is the chemical process by which yeast converts the sugars in grape juice into alcohol and carbon dioxide.",
    wrongAnswerExplanations: {
      "Distillation": "Distillation is used to make spirits, not wine, by heating and cooling to concentrate alcohol.",
      "Maceration": "Maceration is the contact between grape skins and juice to extract color and flavor.",
      "Clarification": "Clarification removes sediment and particles from wine after fermentation is complete."
    }
  },
  {
    question: "Which red grape is known for its light body, high acidity, and red fruit flavors, often associated with Burgundy?",
    options: ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir is a delicate red grape varietal that thrives in cooler climates and is the primary grape of Burgundy, France.",
    wrongAnswerExplanations: {
      "Cabernet Sauvignon": "Cabernet Sauvignon is full-bodied with dark fruit flavors, not light-bodied like Pinot Noir.",
      "Merlot": "Merlot is medium to full-bodied with plush textures, different from Pinot Noir's delicate style.",
      "Syrah": "Syrah produces full-bodied, powerful wines with dark fruit and spice, opposite of Pinot Noir's elegance."
    }
  },
  {
    question: "What is the term for the legs or tears that form on the inside of a wine glass?",
    options: ["Viscosity", "Acidity", "Alcohol content", "Tannin level"],
    correctAnswer: "Alcohol content",
    explanation: "Wine legs are an indicator of a wine's alcohol content and, to some extent, its glycerol content, which contributes to viscosity.",
    wrongAnswerExplanations: {
      "Viscosity": "While legs indicate viscosity, they're primarily formed due to alcohol content differences.",
      "Acidity": "Acidity affects taste and preservation but doesn't create the legs phenomenon.",
      "Tannin level": "Tannins create structure and mouthfeel but don't cause the legs that form on glass sides."
    }
  },
  {
    question: "Which of these is a common fault in wine, often described as smelling like wet cardboard or moldy basement?",
    options: ["Brettanomyces", "Cork taint (TCA)", "Oxidation", "Volatile Acidity"],
    correctAnswer: "Cork taint (TCA)",
    explanation: "Cork taint, caused by TCA, is a common wine fault that imparts unpleasant musty or moldy aromas.",
    wrongAnswerExplanations: {
      "Brettanomyces": "Brettanomyces creates barnyard, medicinal, or Band-Aid aromas, not wet cardboard smells.",
      "Oxidation": "Oxidation causes wines to smell like sherry, nuts, or bruised apples, not musty basement odors.",
      "Volatile Acidity": "Volatile acidity smells like vinegar or nail polish remover, not wet cardboard."
    }
  },
  {
    question: "Which type of wine is typically served with oysters?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Merlot"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Crisp, high-acid white wines like Sauvignon Blanc are excellent pairings for oysters, as they cut through the brininess.",
    wrongAnswerExplanations: {
      "Cabernet Sauvignon": "This full-bodied red would overpower the delicate flavor of oysters.",
      "Chardonnay (oaked)": "Oaked Chardonnay's buttery richness would clash with oysters' briny, mineral character.",
      "Merlot": "This soft red wine would be too heavy and wouldn't complement oysters' oceanic flavors."
    }
  },
  {
    question: "Which noble rot-affected sweet wine, often described as 'liquid gold', comes from a specific region in Bordeaux?",
    options: ["Tokaji", "Ice Wine", "Sauternes", "Port"],
    correctAnswer: "Sauternes",
    explanation: "Sauternes is a highly prized sweet wine from the Bordeaux region of France, made from grapes affected by Botrytis cinerea (noble rot).",
    wrongAnswerExplanations: {
      "Tokaji": "Tokaji is a noble rot wine from Hungary, not Bordeaux.",
      "Ice Wine": "Ice wine is made from frozen grapes, not noble rot, and comes from cool climates like Canada and Germany.",
      "Port": "Port is a fortified wine from Portugal, not a noble rot wine from Bordeaux."
    }
  },
  {
    question: "What is the primary grape used in the production of Chianti wine?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Sangiovese is the signature red grape of Tuscany, Italy, and the primary component of Chianti wine.",
    wrongAnswerExplanations: {
      "Nebbiolo": "Nebbiolo is the grape used in Barolo and Barbaresco from Piedmont, not Chianti.",
      "Barbera": "Barbera is another Piedmontese grape variety, not the main grape in Chianti.",
      "Montepulciano": "Montepulciano is used in wines from Abruzzo and other central Italian regions, not Chianti."
    }
  },
  {
    question: "Which wine glass shape is generally recommended for enjoying red wines?",
    options: ["Flute", "Coupe", "Tulip", "Bordeaux or Burgundy glass"],
    correctAnswer: "Bordeaux or Burgundy glass",
    explanation: "Larger, wider-bowled glasses like Bordeaux or Burgundy allow red wines to breathe and express their aromas fully.",
    wrongAnswerExplanations: {
      "Flute": "Flutes are designed for sparkling wines to preserve bubbles, not for red wines.",
      "Coupe": "Coupes are shallow glasses better suited for cocktails or some sparkling wines, not reds.",
      "Tulip": "While tulip-shaped glasses can work, Bordeaux/Burgundy glasses are specifically designed for red wines."
    }
  },
  {
    question: "What is the term for the sediment found in aged red wines?",
    options: ["Tartrates", "Lees", "Fining agents", "Dregs"],
    correctAnswer: "Dregs",
    explanation: "Dregs refer to the sediment, typically consisting of dead yeast cells, grape solids, and tartrates, found at the bottom of bottles of aged wine.",
    wrongAnswerExplanations: {
      "Tartrates": "Tartrates are crystalline deposits but only one component of wine sediment.",
      "Lees": "Lees are dead yeast cells that settle during fermentation, not the general term for bottle sediment.",
      "Fining agents": "Fining agents are substances added to clarify wine, not the natural sediment that forms."
    }
  },
  {
    question: "This dark-skinned grape is famously called Shiraz in Australia and is known for producing full-bodied, spicy red wines in the Rhône Valley of France. What is its name?",
    options: ["Pinot Noir", "Merlot", "Syrah", "Zinfandel"],
    correctAnswer: "Syrah",
    explanation: "Syrah or Shiraz is a versatile dark-skinned grape known for producing powerful, peppery, and dark-fruited wines in both the Old and New World.",
    wrongAnswerExplanations: {
      "Pinot Noir": "Pinot Noir produces light-bodied, elegant wines, not full-bodied spicy ones.",
      "Merlot": "Merlot creates softer, more approachable wines, not the bold, spicy character described.",
      "Zinfandel": "Zinfandel is primarily associated with California, not the Rhône Valley or Australia."
    }
  },
  {
    question: "What is vintage on a wine label?",
    options: ["The year the wine was bottled", "The year the grapes were harvested", "The age of the winery", "The specific vineyard site"],
    correctAnswer: "The year the grapes were harvested",
    explanation: "The vintage year on a wine label indicates when the grapes used to make that wine were picked.",
    wrongAnswerExplanations: {
      "The year the wine was bottled": "Bottling year is different from vintage; wines can be bottled months or years after harvest.",
      "The age of the winery": "Vintage refers to the grape harvest year, not when the winery was established.",
      "The specific vineyard site": "Vineyard site information is separate from vintage dating."
    }
  },
  {
    question: "Which of these is a common characteristic of an oaked Chardonnay?",
    options: ["Light and crisp", "Notes of butter, vanilla, and toast", "High acidity and citrus", "Sweet and fruity"],
    correctAnswer: "Notes of butter, vanilla, and toast",
    explanation: "Aging Chardonnay in oak barrels imparts flavors and aromas of butter, vanilla, and toast.",
    wrongAnswerExplanations: {
      "Light and crisp": "Oak aging typically makes Chardonnay fuller-bodied and richer, not light and crisp.",
      "High acidity and citrus": "While Chardonnay can have good acidity, oaking tends to soften it and add richer flavors.",
      "Sweet and fruity": "Oaked Chardonnay is usually dry with complex flavors rather than simply sweet and fruity."
    }
  },
  {
    question: "What is the purpose of decanting wine?",
    options: ["To chill the wine", "To remove sediment and allow the wine to breathe", "To add flavors to the wine", "To warm the wine"],
    correctAnswer: "To remove sediment and allow the wine to breathe",
    explanation: "Decanting separates sediment from the wine and exposes the wine to oxygen, helping it open up and develop aromas.",
    wrongAnswerExplanations: {
      "To chill the wine": "Decanting doesn't chill wine; in fact, it can warm it slightly through air exposure.",
      "To add flavors to the wine": "Decanting doesn't add flavors but helps existing flavors develop through aeration.",
      "To warm the wine": "While decanting might warm wine slightly, that's not its primary purpose."
    }
  },
  {
    question: "Which Italian wine is famous for being produced in the Piedmont region and made from Nebbiolo grapes?",
    options: ["Chianti", "Prosecco", "Barolo", "Soave"],
    correctAnswer: "Barolo",
    explanation: "Barolo is a highly esteemed red wine from Piedmont, Italy, known for its powerful tannins and aging potential, made from Nebbiolo grapes.",
    wrongAnswerExplanations: {
      "Chianti": "Chianti is from Tuscany and made primarily from Sangiovese, not Nebbiolo.",
      "Prosecco": "Prosecco is a sparkling wine made from Glera grapes, not Nebbiolo.",
      "Soave": "Soave is a white wine from Veneto made from Garganega grapes, not Nebbiolo."
    }
  },
  {
    question: "What is the term for a wine that tastes sweet?",
    options: ["Dry", "Off-dry", "Sweet", "Semi-sweet"],
    correctAnswer: "Sweet",
    explanation: "A sweet wine has a noticeable amount of residual sugar, making it taste sweet.",
    wrongAnswerExplanations: {
      "Dry": "Dry wines have little to no residual sugar, making them taste not sweet.",
      "Off-dry": "Off-dry wines have a small amount of residual sugar but are not noticeably sweet.",
      "Semi-sweet": "Semi-sweet indicates some sweetness but is not the general term for sweet wines."
    }
  },
  {
    question: "Which region is known for producing high-quality Riesling wines?",
    options: ["Bordeaux, France", "Mosel, Germany", "Napa Valley, USA", "Tuscany, Italy"],
    correctAnswer: "Mosel, Germany",
    explanation: "The Mosel region in Germany is world-renowned for its crisp, aromatic, and often off-dry Riesling wines.",
    wrongAnswerExplanations: {
      "Bordeaux, France": "Bordeaux is famous for red blends and sweet wines, not Riesling.",
      "Napa Valley, USA": "Napa Valley is known for Cabernet Sauvignon and Chardonnay, not primarily Riesling.",
      "Tuscany, Italy": "Tuscany is famous for Sangiovese-based wines like Chianti, not Riesling."
    }
  },
  {
    question: "What is the difference between red and white wine production?",
    options: [
      "Red wine uses red grapes, white wine uses white grapes",
      "Red wine ferments with grape skins, white wine typically does not",
      "Red wine is aged in oak, white wine is not",
      "Red wine is always dry, white wine is always sweet"
    ],
    correctAnswer: "Red wine ferments with grape skins, white wine typically does not",
    explanation: "The key difference is that red wines get their color, tannins, and much of their flavor from fermenting with the grape skins, while white wines are usually pressed before fermentation.",
    wrongAnswerExplanations: {
      "Red wine uses red grapes, white wine uses white grapes": "White wine can be made from red grapes if the skins are removed quickly.",
      "Red wine is aged in oak, white wine is not": "Both red and white wines can be aged in oak or not, depending on the style desired.",
      "Red wine is always dry, white wine is always sweet": "Both red and white wines can be dry or sweet depending on the winemaking process."
    }
  },
  {
    question: "Which of these is a common food pairing for Pinot Noir?",
    options: ["Grilled steak", "Spicy Asian cuisine", "Salmon or duck", "Heavy cream sauces"],
    correctAnswer: "Salmon or duck",
    explanation: "Pinot Noir's lighter body and red fruit notes make it an excellent match for fattier fish like salmon and poultry like duck.",
    wrongAnswerExplanations: {
      "Grilled steak": "Grilled steak pairs better with fuller-bodied reds like Cabernet Sauvignon or Syrah.",
      "Spicy Asian cuisine": "Spicy foods typically pair better with off-dry whites or lighter, fruit-forward reds.",
      "Heavy cream sauces": "Heavy cream sauces usually pair better with fuller-bodied whites like oaked Chardonnay."
    }
  },
  {
    question: "What is the term for the natural sugars remaining in wine after fermentation?",
    options: ["Glucose", "Fructose", "Residual Sugar", "Sucrose"],
    correctAnswer: "Residual Sugar",
    explanation: "Residual sugar (RS) refers to the grape sugars that are not converted into alcohol during fermentation, contributing to a wine's sweetness.",
    wrongAnswerExplanations: {
      "Glucose": "While glucose is one type of sugar in grapes, 'residual sugar' is the general term used in winemaking.",
      "Fructose": "While fructose is another grape sugar, 'residual sugar' encompasses all remaining sugars.",
      "Sucrose": "Sucrose is table sugar, not the natural grape sugars found in wine."
    }
  },
  {
    question: "Which grape is known for producing full-bodied, often spicy red wines in the Rhône Valley, France?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Merlot"],
    correctAnswer: "Syrah",
    explanation: "Syrah or Shiraz is the dominant red grape in the Northern Rhône, producing powerful, peppery, and dark-fruited wines.",
    wrongAnswerExplanations: {
      "Gamay": "Gamay produces light, fruity wines in Beaujolais, not the full-bodied spicy wines of the Rhône.",
      "Pinot Noir": "Pinot Noir creates elegant, light-bodied wines in Burgundy, not the powerful Rhône reds.",
      "Merlot": "Merlot is associated with Bordeaux and produces softer wines, not the spicy Rhône style."
    }
  },
  {
    question: "What is the typical alcohol content of a dry table wine?",
    options: ["2-5%", "8-10%", "11-15%", "18-20%"],
    correctAnswer: "11-15%",
    explanation: "Most dry table wines fall within the 11-15% ABV (Alcohol by Volume) range.",
    wrongAnswerExplanations: {
      "2-5%": "This is the alcohol range for beer, not wine.",
      "8-10%": "This is too low for most table wines, though some very light wines might reach 10%.",
      "18-20%": "This is the alcohol range for fortified wines like Port or Sherry, not table wines."
    }
  },
  {
    question: "Which of these is a common characteristic of a dry wine?",
    options: ["Sweet taste", "Absence of sweetness", "High acidity", "Low alcohol"],
    correctAnswer: "Absence of sweetness",
    explanation: "A dry wine is one in which all or most of the grape sugars have been converted to alcohol during fermentation, resulting in no perceptible sweetness.",
    wrongAnswerExplanations: {
      "Sweet taste": "This is the opposite of dry - sweet wines have noticeable residual sugar.",
      "High acidity": "While many dry wines have good acidity, this isn't the defining characteristic of dryness.",
      "Low alcohol": "Dry wines can have various alcohol levels; dryness refers to sugar content, not alcohol."
    }
  },
  {
    question: "What is the name of the white wine region in Burgundy, France, famous for unoaked Chardonnay?",
    options: ["Pouilly-Fumé", "Sancerre", "Chablis", "Vouvray"],
    correctAnswer: "Chablis",
    explanation: "Chablis is a sub-region of Burgundy known for producing crisp, mineral-driven Chardonnay wines that are typically unoaked.",
    wrongAnswerExplanations: {
      "Pouilly-Fumé": "Pouilly-Fumé is in the Loire Valley and known for Sauvignon Blanc, not Chardonnay.",
      "Sancerre": "Sancerre is also in the Loire Valley and famous for Sauvignon Blanc, not Chardonnay.",
      "Vouvray": "Vouvray is in the Loire Valley and known for Chenin Blanc, not Chardonnay."
    }
  },
  {
    question: "Which grape varietal is often described as having notes of blackcurrant, cedar, and tobacco?",
    options: ["Pinot Noir", "Merlot", "Cabernet Sauvignon", "Zinfandel"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon is renowned for its classic aromas and flavors of blackcurrant (cassis), alongside herbal, cedar, and tobacco notes.",
    wrongAnswerExplanations: {
      "Pinot Noir": "Pinot Noir typically shows red fruit flavors like cherry and strawberry, not blackcurrant and cedar.",
      "Merlot": "Merlot usually displays plum and chocolate notes, softer than Cabernet's structure.",
      "Zinfandel": "Zinfandel is known for jammy berry flavors and spice, not the structured cassis and cedar notes."
    }
  },
  {
    question: "What is the term for the process of allowing wine to age in the bottle before release?",
    options: ["Malolactic fermentation", "Racking", "Bottle aging", "Fining"],
    correctAnswer: "Bottle aging",
    explanation: "Bottle aging allows wine to develop more complex flavors and aromas over time.",
    wrongAnswerExplanations: {
      "Malolactic fermentation": "This is a secondary fermentation process that converts malic acid to lactic acid.",
      "Racking": "Racking is transferring wine from one container to another to separate it from sediment.",
      "Fining": "Fining is adding agents to clarify wine by removing particles and impurities."
    }
  },
  {
    question: "Which type of wine is typically served as an aperitif (before a meal)?",
    options: ["Sweet dessert wine", "Full-bodied red wine", "Dry sparkling wine", "Oaked Chardonnay"],
    correctAnswer: "Dry sparkling wine",
    explanation: "Dry sparkling wines like Brut Champagne or Cava are excellent aperitifs, stimulating the palate without being too heavy.",
    wrongAnswerExplanations: {
      "Sweet dessert wine": "Sweet wines are typically served with or after dessert, not as an aperitif.",
      "Full-bodied red wine": "Heavy reds would be too overwhelming before a meal and might dull the palate.",
      "Oaked Chardonnay": "While possible, the richness of oaked Chardonnay is less ideal than crisp sparkling wine."
    }
  },
  {
    question: "What is a 'blend' in winemaking?",
    options: [
      "Mixing different vintages of the same wine",
      "Mixing different grape varietals to create a single wine",
      "Adding water to wine",
      "Filtering wine"
    ],
    correctAnswer: "Mixing different grape varietals to create a single wine",
    explanation: "A wine blend combines two or more different grape varietals to achieve a desired balance of flavors, aromas, and structure.",
    wrongAnswerExplanations: {
      "Mixing different vintages of the same wine": "This would be called a multi-vintage blend, but most blends refer to different grape varieties.",
      "Adding water to wine": "Adding water is illegal in most wine regions and would be called adulteration, not blending.",
      "Filtering wine": "Filtering is a clarification process, not blending of different components."
    }
  },
  {
    question: "Which of these is a common characteristic of a full-bodied wine?",
    options: ["Light and watery texture", "Rich, heavy, and mouth-filling sensation", "High acidity", "Sweet taste"],
    correctAnswer: "Rich, heavy, and mouth-filling sensation",
    explanation: "Full-bodied wines have a rich, weighty, and sometimes viscous feel in the mouth, often due to higher alcohol content and extract.",
    wrongAnswerExplanations: {
      "Light and watery texture": "This describes light-bodied wines, the opposite of full-bodied.",
      "High acidity": "While full-bodied wines can have good acidity, this isn't the defining characteristic of body.",
      "Sweet taste": "Full-bodied wines can be dry or sweet; body refers to weight and texture, not sweetness."
    }
  },
  {
    question: "What is the purpose of a wine stopper or preserver?",
    options: ["To chill the wine", "To remove sediment", "To prevent oxidation and keep wine fresh after opening", "To add bubbles"],
    correctAnswer: "To prevent oxidation and keep wine fresh after opening",
    explanation: "Wine stoppers and preservers are designed to create an airtight seal or remove oxygen from an opened bottle, extending the wine's freshness.",
    wrongAnswerExplanations: {
      "To chill the wine": "Wine stoppers don't chill wine; refrigeration or ice buckets are used for chilling.",
      "To remove sediment": "Sediment is removed by decanting or careful pouring, not by stoppers.",
      "To add bubbles": "Bubbles are created during fermentation; stoppers actually help preserve existing bubbles."
    }
  },
  {
    question: "Which grape varietal is the primary component of most white wines from Alsace, France?",
    options: ["Chardonnay", "Sauvignon Blanc", "Riesling", "Pinot Grigio"],
    correctAnswer: "Riesling",
    explanation: "Alsace is unique in France for producing varietally labeled wines, with Riesling being one of its noble grapes.",
    wrongAnswerExplanations: {
      "Chardonnay": "While grown in Alsace, Chardonnay is not one of the primary noble grapes of the region.",
      "Sauvignon Blanc": "Sauvignon Blanc is not a major grape variety in Alsace.",
      "Pinot Grigio": "While Pinot Gris (same grape) is grown in Alsace, Riesling is more prominent."
    }
  },
  {
    question: "What is the term for the practice of cultivating grapes for winemaking?",
    options: ["Agriculture", "Horticulture", "Viticulture", "Vinification"],
    correctAnswer: "Viticulture",
    explanation: "Viticulture is the science, production, and study of grapes, which primarily deals with grape cultivation for wine.",
    wrongAnswerExplanations: {
      "Agriculture": "Agriculture is the broad practice of farming, not specific to grape growing.",
      "Horticulture": "Horticulture is the general cultivation of garden crops, not specific to wine grapes.",
      "Vinification": "Vinification is the process of making wine from grapes, not growing them."
    }
  },
  {
    question: "Which of these is a common aroma found in Sauvignon Blanc?",
    options: ["Black cherry", "Vanilla", "Grass or gooseberry", "Chocolate"],
    correctAnswer: "Grass or gooseberry",
    explanation: "Sauvignon Blanc is often characterized by its herbaceous notes, including grass, bell pepper, and gooseberry.",
    wrongAnswerExplanations: {
      "Black cherry": "Black cherry is typically associated with red wines like Cabernet Sauvignon or Merlot.",
      "Vanilla": "Vanilla comes from oak aging and isn't characteristic of typical Sauvignon Blanc.",
      "Chocolate": "Chocolate notes are found in red wines, particularly those with oak aging or certain varietals."
    }
  },
  {
    question: "What is the name of the sweet wine made from grapes frozen on the vine?",
    options: ["Port", "Sherry", "Ice Wine", "Marsala"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine or Eiswein is a type of dessert wine produced from grapes that have been frozen while still on the vine.",
    wrongAnswerExplanations: {
      "Port": "Port is a fortified wine from Portugal, not made from frozen grapes.",
      "Sherry": "Sherry is a fortified wine from Spain, not made from frozen grapes.",
      "Marsala": "Marsala is a fortified wine from Sicily, not made from frozen grapes."
    }
  },
  {
    question: "Which red grape is a key component of 'Super Tuscan' wines?",
    options: ["Nebbiolo", "Sangiovese", "Primitivo", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "While Super Tuscans often include international varietals like Cabernet Sauvignon, Sangiovese remains the backbone of many, if not all, of them.",
    wrongAnswerExplanations: {
      "Nebbiolo": "Nebbiolo is from Piedmont and used in Barolo, not Super Tuscan wines.",
      "Primitivo": "Primitivo is primarily grown in southern Italy, not Tuscany.",
      "Montepulciano": "Montepulciano is used in central Italian wines but not typically in Super Tuscans."
    }
  },
  {
    question: "What does 'DOCG' signify on an Italian wine label?",
    options: ["Denomination of Controlled Origin", "Highest level of Italian wine classification", "Table wine", "Sweet wine"],
    correctAnswer: "Highest level of Italian wine classification",
    explanation: "DOCG (Denominazione di Origine Controllata e Garantita) is the highest classification for Italian wines, indicating strict quality control.",
    wrongAnswerExplanations: {
      "Denomination of Controlled Origin": "This is a partial translation but doesn't convey that it's the highest level.",
      "Table wine": "Table wine is the lowest classification in Italy, opposite of DOCG.",
      "Sweet wine": "DOCG refers to quality level, not sweetness level of the wine."
    }
  },
  {
    question: "Which of these is typically a light-bodied red wine?",
    options: ["Cabernet Sauvignon", "Syrah", "Pinot Noir", "Zinfandel"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir is known for its delicate structure and lighter body compared to other red varietals.",
    wrongAnswerExplanations: {
      "Cabernet Sauvignon": "Cabernet Sauvignon is typically full-bodied with high tannins and intense flavors.",
      "Syrah": "Syrah produces full-bodied, powerful wines with dark fruit and spice.",
      "Zinfandel": "Zinfandel can range from medium to full-bodied, usually with higher alcohol content."
    }
  },
  {
    question: "What is the term for the 'bouquet' of a wine?",
    options: ["Its color", "Its taste", "Its aromas developed from aging", "Its sweetness level"],
    correctAnswer: "Its aromas developed from aging",
    explanation: "The bouquet refers to the complex aromas that develop in a wine as a result of fermentation and aging, particularly in the bottle.",
    wrongAnswerExplanations: {
      "Its color": "Color refers to visual appearance, not aromatic characteristics.",
      "Its taste": "Taste refers to flavors on the palate, while bouquet is about aroma.",
      "Its sweetness level": "Sweetness is a taste characteristic, not related to bouquet."
    }
  },
  {
    question: "Which white grape is known for producing full-bodied, often buttery wines, especially when oaked?",
    options: ["Riesling", "Sauvignon Blanc", "Pinot Grigio", "Chardonnay"],
    correctAnswer: "Chardonnay",
    explanation: "Chardonnay is a versatile grape that can produce a wide range of styles, but it's particularly known for its full-bodied, buttery, and often oak-influenced expressions.",
    wrongAnswerExplanations: {
      "Riesling": "Riesling typically produces lighter, more aromatic wines with floral and citrus notes.",
      "Sauvignon Blanc": "Sauvignon Blanc is known for crisp, herbaceous wines, not buttery, full-bodied ones.",
      "Pinot Grigio": "Pinot Grigio typically produces light, crisp wines, not full-bodied, buttery ones."
    }
  },
  {
    question: "What is the ideal temperature range for storing most wines long-term?",
    options: ["30-40°F", "45-65°F", "70-80°F", "Below 30°F"],
    correctAnswer: "45-65°F",
    explanation: "Most wines are best stored at a consistent temperature between 45-65°F (7-18°C) to ensure proper aging and prevent spoilage.",
    wrongAnswerExplanations: {
      "30-40°F": "This is too cold and could cause wine to freeze, potentially pushing out corks or damaging the wine.",
      "70-80°F": "This is too warm and would accelerate aging, potentially causing wines to deteriorate quickly.",
      "Below 30°F": "Freezing temperatures would damage the wine and could cause bottles to break."
    }
  },
  {
    question: "Which of these terms describes a wine with high acidity?",
    options: ["Flabby", "Crisp", "Soft", "Round"],
    correctAnswer: "Crisp",
    explanation: "A wine with high acidity is often described as crisp or tart, providing a refreshing sensation on the palate.",
    wrongAnswerExplanations: {
      "Flabby": "Flabby describes wines with low acidity that lack structure and freshness.",
      "Soft": "Soft typically refers to wines with low tannins or acidity, the opposite of crisp.",
      "Round": "Round describes wines that are well-balanced and smooth, not necessarily high in acidity."
    }
  },
  {
    question: "What is the purpose of sulfur dioxide (SO2) in winemaking?",
    options: ["To add sweetness", "To remove color", "As an antioxidant and antimicrobial agent", "To increase alcohol content"],
    correctAnswer: "As an antioxidant and antimicrobial agent",
    explanation: "SO2 is commonly used in winemaking to protect the wine from oxidation and inhibit unwanted microbial growth.",
    wrongAnswerExplanations: {
      "To add sweetness": "SO2 doesn't add sweetness; residual sugar provides sweetness in wine.",
      "To remove color": "SO2 doesn't remove color; it helps preserve the wine's existing characteristics.",
      "To increase alcohol content": "Alcohol comes from fermentation of sugars; SO2 doesn't affect alcohol levels."
    }
  },
  {
    question: "Which grape is used to make the famous sparkling wine Prosecco?",
    options: ["Chardonnay", "Pinot Noir", "Glera", "Riesling"],
    correctAnswer: "Glera",
    explanation: "Prosecco is an Italian sparkling wine made primarily from the Glera grape.",
    wrongAnswerExplanations: {
      "Chardonnay": "Chardonnay is used in Champagne and other sparkling wines, but not Prosecco.",
      "Pinot Noir": "Pinot Noir is used in Champagne production but not in Prosecco.",
      "Riesling": "Riesling is used for still wines and some sparkling wines in Germany, not Prosecco."
    }
  },
  {
    question: "What is the term for a wine that has a strong, unpleasant smell of vinegar?",
    options: ["Oxidized", "Corked", "Volatile Acidity", "Brettanomyces"],
    correctAnswer: "Volatile Acidity",
    explanation: "Volatile acidity (VA) is a wine fault characterized by aromas of vinegar or nail polish remover, caused by acetic acid bacteria.",
    wrongAnswerExplanations: {
      "Oxidized": "Oxidized wines smell like sherry, nuts, or bruised apples, not vinegar.",
      "Corked": "Corked wines smell musty or like wet cardboard, not vinegary.",
      "Brettanomyces": "Brettanomyces creates barnyard or medicinal aromas, not vinegar smells."
    }
  },
  {
    question: "Which type of wine is typically served with chocolate desserts?",
    options: ["Dry red wine", "Dry white wine", "Sweet fortified wine (e.g., Port)", "Sparkling wine"],
    correctAnswer: "Sweet fortified wine (e.g., Port)",
    explanation: "Sweet, rich wines like Port or Banyuls pair well with chocolate, as their sweetness and intensity can stand up to the dessert.",
    wrongAnswerExplanations: {
      "Dry red wine": "Dry reds would contrast harshly with chocolate's sweetness and richness.",
      "Dry white wine": "Dry whites would be overwhelmed by chocolate's intensity and richness.",
      "Sparkling wine": "While possible, sparkling wine's acidity and bubbles don't complement chocolate as well as sweet wines."
    }
  },
  {
    question: "What does 'non-vintage' (NV) mean on a sparkling wine label?",
    options: ["It's a very old wine", "It's a blend of wines from different harvest years", "It's a low-quality wine", "It's a wine made without grapes"],
    correctAnswer: "It's a blend of wines from different harvest years",
    explanation: "Non-vintage wines are blends of wines from multiple years, created to maintain a consistent house style.",
    wrongAnswerExplanations: {
      "It's a very old wine": "Non-vintage doesn't indicate age, just that multiple years are blended.",
      "It's a low-quality wine": "Many high-quality Champagnes are non-vintage; it's about consistency, not quality.",
      "It's a wine made without grapes": "All wine is made from grapes; this refers to vintage dating, not ingredients."
    }
  },
  {
    question: "Which of these is a common characteristic of a tannic red wine?",
    options: ["Smooth and soft", "Drying sensation in the mouth", "Fruity and sweet", "Light-bodied"],
    correctAnswer: "Drying sensation in the mouth",
    explanation: "Tannins create a drying, sometimes bitter, sensation in the mouth, especially noticeable on the gums and tongue.",
    wrongAnswerExplanations: {
      "Smooth and soft": "High tannins create texture and grip, opposite of smooth and soft.",
      "Fruity and sweet": "Tannins affect mouthfeel and structure, not fruitiness or sweetness.",
      "Light-bodied": "Tannic wines are usually medium to full-bodied; tannins add weight and structure."
    }
  },
  {
    question: "What is the term for the process of removing dead yeast cells and other solids from wine after fermentation?",
    options: ["Racking", "Fining", "Filtration", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Racking, fining, and filtration are all methods used to clarify wine by removing suspended solids and impurities.",
    wrongAnswerExplanations: {
      "Racking": "Racking is one method, but fining and filtration also remove solids.",
      "Fining": "Fining is one method, but racking and filtration also clarify wine.",
      "Filtration": "Filtration is one method, but racking and fining also remove particles."
    }
  },
  {
    question: "Which grape varietal is the most widely planted in the world?",
    options: ["Merlot", "Airén", "Cabernet Sauvignon", "Chardonnay"],
    correctAnswer: "Airén",
    explanation: "While Cabernet Sauvignon and Merlot are very popular, Airén, a white grape primarily grown in Spain, historically holds the title for most widely planted by area.",
    wrongAnswerExplanations: {
      "Merlot": "Merlot is widely planted but not the most extensive by vineyard area.",
      "Cabernet Sauvignon": "Cabernet Sauvignon is popular globally but doesn't have the largest vineyard area.",
      "Chardonnay": "Chardonnay is widely planted but has less total vineyard area than Airén."
    }
  },
  {
    question: "What is the name of the sweet, fortified wine from Jerez, Spain?",
    options: ["Port", "Madeira", "Sherry", "Marsala"],
    correctAnswer: "Sherry",
    explanation: "Sherry is a fortified wine made from white grapes that are grown near the city of Jerez de la Frontera in Andalusia, Spain.",
    wrongAnswerExplanations: {
      "Port": "Port is a fortified wine from Portugal, not Spain.",
      "Madeira": "Madeira is a fortified wine from the Portuguese island of Madeira.",
      "Marsala": "Marsala is a fortified wine from Sicily, Italy, not Spain."
    }
  },
  {
    question: "Which of these is a common aroma found in aged Pinot Noir?",
    options: ["Green apple", "Citrus", "Forest floor or mushroom", "Tropical fruit"],
    correctAnswer: "Forest floor or mushroom",
    explanation: "As Pinot Noir ages, it often develops complex tertiary aromas of forest floor, mushroom, and savory notes.",
    wrongAnswerExplanations: {
      "Green apple": "Green apple is more characteristic of white wines like Sauvignon Blanc or young Chardonnay.",
      "Citrus": "Citrus notes are typical of white wines, not aged Pinot Noir.",
      "Tropical fruit": "Tropical fruit aromas are found in wines from warm climates or certain white varieties, not aged Pinot Noir."
    }
  },
  {
    question: "What is the term for the body of a wine?",
    options: ["Its color intensity", "Its perceived weight or fullness in the mouth", "Its sweetness level", "Its alcohol content"],
    correctAnswer: "Its perceived weight or fullness in the mouth",
    explanation: "The body of a wine refers to its perceived weight and fullness on the palate, often influenced by alcohol, residual sugar, and extract.",
    wrongAnswerExplanations: {
      "Its color intensity": "Color is visual; body is about tactile sensation in the mouth.",
      "Its sweetness level": "Sweetness is about sugar content; body is about weight and texture.",
      "Its alcohol content": "While alcohol affects body, body is the overall perception of weight, not just alcohol level."
    }
  },
  {
    question: "Which type of wine is typically served very chilled, often as a dessert wine?",
    options: ["Dry red wine", "Dry white wine", "Ice Wine", "Rosé wine"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine or Eiswein is a sweet dessert wine that is best served very chilled to enhance its sweetness and acidity.",
    wrongAnswerExplanations: {
      "Dry red wine": "Red wines are typically served at cellar temperature, not very chilled.",
      "Dry white wine": "White wines are served chilled but not as cold as dessert wines.",
      "Rosé wine": "Rosé is served chilled but not as cold as sweet dessert wines like Ice Wine."
    }
  },
  // --- Northern Virginia Specific Questions (100 questions) ---
  {
    question: "Which grape varietal is considered Virginia's signature white grape?",
    options: ["Chardonnay", "Viognier", "Sauvignon Blanc", "Albariño"],
    correctAnswer: "Viognier",
    explanation: "Viognier is Virginia's official state grape, known for its aromatic and full-bodied white wines that thrive in the state's climate.",
    wrongAnswerExplanations: {
      "Chardonnay": "While grown in Virginia, Chardonnay is not the official state grape.",
      "Sauvignon Blanc": "Sauvignon Blanc is grown in Virginia but isn't the signature grape variety.",
      "Albariño": "Albariño is a newer variety showing promise in Virginia but isn't the signature grape."
    }
  },
  {
    question: "Which Virginia AVA is known for its high-quality Chardonnay and Cabernet Franc, located near the town of Middleburg?",
    options: ["Monticello AVA", "Virginia Peninsula AVA", "Middleburg AVA", "Shenandoah Valley AVA"],
    correctAnswer: "Middleburg AVA",
    explanation: "The Middleburg AVA (American Viticultural Area) is a prominent wine region in Northern Virginia, known for its rolling hills and diverse soils.",
    wrongAnswerExplanations: {
      "Monticello AVA": "Monticello AVA is in central Virginia around Charlottesville, not near Middleburg.",
      "Virginia Peninsula AVA": "Virginia Peninsula AVA is in southeastern Virginia, not near Middleburg.",
      "Shenandoah Valley AVA": "Shenandoah Valley AVA is in northwestern Virginia, not near Middleburg."
    }
  },
  {
    question: "Which red grape varietal is often referred to as Virginia's answer to Cabernet Franc due to its success in the state?",
    options: ["Merlot", "Cabernet Franc", "Petit Verdot", "Norton"],
    correctAnswer: "Cabernet Franc",
    explanation: "Cabernet Franc thrives in Virginia's climate, producing wines with red fruit, herbal notes, and often a distinctive peppery character.",
    wrongAnswerExplanations: {
      "Merlot": "While Merlot grows in Virginia, it doesn't have the same standout reputation as Cabernet Franc.",
      "Petit Verdot": "Petit Verdot does well in Virginia but isn't referred to as 'Virginia's answer' to anything.",
      "Norton": "Norton is a native American grape, not comparable to Cabernet Franc's European style."
    }
  },
  {
    question: "What is a common challenge for grape growing in Northern Virginia's climate?",
    options: ["Too much sun", "Lack of rainfall", "Humidity and late spring frosts", "Too cold in winter"],
    correctAnswer: "Humidity and late spring frosts",
    explanation: "Virginia's humid summers and unpredictable spring frosts can pose significant challenges for grape growers, requiring careful vineyard management.",
    wrongAnswerExplanations: {
      "Too much sun": "Virginia actually has good sun exposure; excessive sun isn't typically a problem.",
      "Lack of rainfall": "Virginia receives adequate rainfall; drought is not a common issue.",
      "Too cold in winter": "While winters can be cold, extreme cold isn't the primary challenge."
    }
  },
  {
    question: `Which of the following are Loudoun County wineries that are part of your program?`,
    options: ["868 Estate Vineyards", "Fabbioli Cellars", "Hillsborough Winery & Brewery", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "868 Estate Vineyards, Fabbioli Cellars, and Hillsborough Winery & Brewery are all valued partners.",
    wrongAnswerExplanations: {
      "868 Estate Vineyards": "While a partner, there are other Loudoun wineries in the program.",
      "Fabbioli Cellars": "While a partner, there are other Loudoun wineries in the program.",
      "Hillsborough Winery & Brewery": "While a partner, there are other Loudoun wineries in the program.",
    }
  },
  {
    question: `What is a core benefit of a partnership between Vineyard Voyages and Loudoun County wineries?`,
    options: ["Mass production of wine for the tours", "Lower prices on all wines", "Exclusive access and unique tasting experiences", "Only full bottle sales"],
    correctAnswer: "Exclusive access and unique tasting experiences",
    explanation: "Partnerships allow Vineyard Voyages to provide unique, behind-the-scenes experiences and direct access for guests.",
    wrongAnswerExplanations: {
      "Mass production of wine for the tours": "Partnerships are for experience, not mass production.",
      "Lower prices on all wines": "While there may be some benefits, the focus is on experience, not discounts.",
      "Only full bottle sales": "Wineries still offer tastings and by-the-glass options, not just full bottles."
    }
  },
  {
    question: "What is a common red grape varietal grown in Northern Virginia, known for its deep color and firm tannins?",
    options: ["Pinot Noir", "Petit Verdot", "Gamay", "Zinfandel"],
    correctAnswer: "Petit Verdot",
    explanation: "Petit Verdot, traditionally a blending grape in Bordeaux, has found success in Virginia as a standalone varietal, producing bold, structured wines.",
    wrongAnswerExplanations: {
      "Pinot Noir": "Pinot Noir produces light-colored wines with soft tannins, opposite of the description.",
      "Gamay": "Gamay creates light, fruity wines, not deeply colored tannic wines.",
      "Zinfandel": "Zinfandel isn't commonly grown in Northern Virginia's climate."
    }
  },
  {
    question: "Which historical figure is credited with early attempts to grow European grapes in Virginia?",
    options: ["George Washington", "Thomas Jefferson", "James Madison", "Patrick Henry"],
    correctAnswer: "Thomas Jefferson",
    explanation: "Thomas Jefferson was a passionate advocate for viticulture and made significant efforts to establish European grapevines at Monticello.",
    wrongAnswerExplanations: {
      "George Washington": "While Washington was interested in agriculture, Jefferson was more focused on viticulture.",
      "James Madison": "Madison wasn't particularly associated with early Virginia viticulture efforts.",
      "Patrick Henry": "Patrick Henry wasn't known for involvement in early Virginia wine growing attempts."
    }
  },
  {
    question: "Which type of climate does Northern Virginia have, generally suitable for grape growing?",
    options: ["Mediterranean", "Desert", "Humid Continental", "Tropical"],
    correctAnswer: "Humid Continental",
    explanation: "Northern Virginia experiences a humid continental climate, characterized by warm, humid summers and cold winters, which presents both opportunities and challenges for viticulture.",
    wrongAnswerExplanations: {
      "Mediterranean": "Mediterranean climates are dry in summer, unlike Virginia's humid summers.",
      "Desert": "Desert climates are extremely dry, completely different from Virginia's humid climate.",
      "Tropical": "Tropical climates are consistently warm year-round, unlike Virginia's seasonal variations."
    }
  },
  {
    question: "Many Virginia wineries offer tasting room experiences. What is a common practice in these rooms?",
    options: ["Blind tasting only", "Self-service wine dispensing", "Guided tastings with knowledgeable staff", "Only full bottle sales"],
    correctAnswer: "Guided tastings with knowledgeable staff",
    explanation: "Virginia wineries pride themselves on offering personalized, educational tasting experiences, often led by winemakers or passionate staff.",
    wrongAnswerExplanations: {
      "Blind tasting only": "Most Virginia wineries offer educational tastings where wines are identified, not blind tastings.",
      "Self-service wine dispensing": "Virginia wineries typically provide personal service rather than self-service systems.",
      "Only full bottle sales": "Most wineries offer tastings by the glass or flight, not just bottle sales."
    }
  },
  {
    question: "What is a popular event often hosted by Northern Virginia wineries in the fall?",
    options: ["Spring Blossom Festival", "Summer Jazz Concerts", "Harvest Festivals and Grape Stomps", "Winter Sledding Competitions"],
    correctAnswer: "Harvest Festivals and Grape Stomps",
    explanation: "Fall is harvest season, and many wineries celebrate with festivals, grape stomps, and other family-friendly events.",
    wrongAnswerExplanations: {
      "Spring Blossom Festival": "While some spring events occur, harvest festivals are more prominent and seasonal.",
      "Summer Jazz Concerts": "Summer events happen but aren't as universally celebrated as harvest festivals.",
      "Winter Sledding Competitions": "Wineries don't typically host sledging events."
    }
  },
  {
    question: "Which type of soil is common in some Northern Virginia vineyards, contributing to mineral notes in wines?",
    options: ["Sandy soil", "Clay soil", "Loamy soil", "Slate or rocky soil"],
    correctAnswer: "Slate or rocky soil",
    explanation: "Some areas of Northern Virginia, particularly in the foothills, have rocky or slate-rich soils that can impart distinct minerality to the wines.",
    wrongAnswerExplanations: {
      "Sandy soil": "Sandy soils drain well but don't typically contribute mineral notes.",
      "Clay soil": "Clay soils retain water but don't typically impart mineral characteristics.",
      "Loamy soil": "Loamy soils are fertile but don't typically contribute mineral notes."
    }
  },
  {
    question: "Which of these is a hybrid grape varietal sometimes grown in Virginia, known for its disease resistance?",
    options: ["Cabernet Sauvignon", "Chardonnay", "Chambourcin", "Merlot"],
    correctAnswer: "Chambourcin",
    explanation: "Chambourcin is a French-American hybrid grape that offers good disease resistance, making it suitable for Virginia's humid climate.",
    wrongAnswerExplanations: {
      "Cabernet Sauvignon": "Cabernet Sauvignon is a European vinifera grape, not a hybrid.",
      "Chardonnay": "Chardonnay is a European vinifera grape, not a hybrid.",
      "Merlot": "Merlot is a European vinifera grape, not a hybrid."
    }
  },
  {
    question: "True or False: Virginia is one of the oldest wine-producing states in the United States.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Virginia has a long history of winemaking, dating back to the early colonial period, making it one of the oldest wine states.",
    wrongAnswerExplanations: {
      "False": "Virginia indeed has one of the longest histories of winemaking in the United States."
    }
  },
  {
    question: "What is the name of the largest wine festival in Virginia, often held annually?",
    options: ["Virginia Grape Fest", "Taste of Virginia Wine", "Virginia Wine Festival", "Commonwealth Crush"],
    correctAnswer: "Virginia Wine Festival",
    explanation: "The Virginia Wine Festival is one of the largest and longest-running wine festivals in the state, showcasing numerous Virginia wineries.",
    wrongAnswerExplanations: {
      "Virginia Grape Fest": "While there may be grape festivals, the Virginia Wine Festival is the largest and most well-known.",
      "Taste of Virginia Wine": "This may be an event but is not the largest wine festival.",
      "Commonwealth Crush": "This may be an event but is not the largest wine festival."
    }
  },
  {
    question: "Which type of wine is Virginia increasingly gaining recognition for, besides its still wines?",
    options: ["Fortified wines", "Dessert wines", "Sparkling wines", "Organic wines"],
    correctAnswer: "Sparkling wines",
    explanation: "Virginia's terroir and winemaking expertise are increasingly producing high-quality sparkling wines, often made using the traditional method.",
    wrongAnswerExplanations: {
      "Fortified wines": "Virginia is not particularly known for fortified wine production.",
      "Dessert wines": "While some dessert wines are made, sparkling wines are gaining more widespread recognition.",
      "Organic wines": "While some organic wines are made, sparkling wines are a specific category gaining recognition."
    }
  },
  {
    question: "Many Northern Virginia wineries are family-owned and operated. What benefit does this often bring?",
    options: ["Mass production", "Lower prices", "Personalized service and unique character", "Limited wine selection"],
    correctAnswer: "Personalized service and unique character",
    explanation: "Family-owned wineries often offer a more personal touch, unique wines, and a strong connection to the land and their craft.",
    wrongAnswerExplanations: {
      "Mass production": "Family operations typically focus on smaller, artisanal production, not mass production.",
      "Lower prices": "Boutique family wineries often have higher prices due to smaller production sizes.",
      "Limited wine selection": "While selection may be focused, the benefit is quality and personalization, not a limited selection."
    }
  },
  {
    question: "What is a common challenge for Virginia winemakers related to bird damage?",
    options: ["Birds eating grapes", "Birds nesting in barrels", "Birds spreading disease", "Birds damaging trellises"],
    correctAnswer: "Birds eating grapes",
    explanation: "Birds can cause significant damage to ripening grape crops, leading to the use of netting or other deterrents in vineyards.",
    wrongAnswerExplanations: {
      "Birds nesting in barrels": "Birds do not typically nest in wine barrels.",
      "Birds spreading disease": "While birds can spread some diseases, grape consumption is the primary concern.",
      "Birds damaging trellises": "Birds do not typically damage vineyard infrastructure."
    }
  },
  {
    question: "What is a common food pairing for Virginia ham?",
    options: ["Light white wine", "Sweet dessert wine", "Dry Rosé or light-bodied red like Cabernet Franc", "Sparkling wine"],
    correctAnswer: "Dry Rosé or light-bodied red like Cabernet Franc",
    explanation: "The saltiness and richness of Virginia ham pair well with a crisp dry rosé or a fruit-forward, slightly herbal Cabernet Franc.",
    wrongAnswerExplanations: {
      "Light white wine": "Light whites may be overpowered by the richness and saltiness of the ham.",
      "Sweet dessert wine": "Sweet wines would clash with the salty, savory character of the ham.",
      "Sparkling wine": "While possible, a dry rosé or light red is a more classic and complementary pairing."
    }
  },
  {
    question: "True or False: All grapes grown in Northern Virginia are native American varietals.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "While some native and hybrid varietals are grown, European (Vitis vinifera) grapes like Viognier, Cabernet Franc, and Chardonnay are widely cultivated and form the backbone of Virginia's fine wine industry.",
    wrongAnswerExplanations: {
      "True": "Virginia grows many European vinifera grapes, not just native American varietals."
    }
  },
  {
    question: "What is an 'AVA' in the context of Virginia wine?",
    options: ["American Vineyard Association", "Appellation of Virginia Award", "American Viticultural Area", "Agricultural Vintner Alliance"],
    correctAnswer: "American Viticultural Area",
    explanation: "An AVA (American Viticultural Area) is a designated wine grape-growing region in the United States distinguishable by geographic features.",
    wrongAnswerExplanations: {
      "American Vineyard Association": "This is not a real organization related to AVAs.",
      "Appellation of Virginia Award": "This is not what AVA stands for.",
      "Agricultural Vintner Alliance": "This is not what AVA stands for."
    }
  },
  {
    question: "Which of these is a common characteristic of Virginia's climate that influences its wines?",
    options: ["Very dry summers", "High humidity", "Consistently cold temperatures", "Volcanic soil"],
    correctAnswer: "High humidity",
    explanation: "Virginia's humid summers can lead to challenges like fungal diseases but also contribute to the unique character of its wines.",
    wrongAnswerExplanations: {
      "Very dry summers": "Virginia summers are humid, not dry.",
      "Consistently cold temperatures": "Virginia has warm summers and variable temperatures, not consistently cold ones.",
      "Volcanic soil": "Virginia doesn't have significant volcanic soils; this is more characteristic of regions like Oregon."
    }
  },
  {
    question: "Many Northern Virginia wineries offer scenic views. What kind of landscape is typical?",
    options: ["Coastal beaches", "Flat plains", "Rolling hills and mountains", "Dense urban cityscape"],
    correctAnswer: "Rolling hills and mountains",
    explanation: "Northern Virginia's wine country is characterized by picturesque rolling hills and proximity to the Blue Ridge Mountains.",
    wrongAnswerExplanations: {
      "Coastal beaches": "Northern Virginia is inland, not coastal.",
      "Flat plains": "Northern Virginia has rolling topography, not flat plains.",
      "Dense urban cityscape": "Wine country is in rural areas, not urban settings."
    }
  },
  {
    question: "What is a common practice in Virginia vineyards to manage humidity and promote air circulation?",
    options: ["Dense planting", "Leaf pulling (canopy management)", "Deep irrigation", "Using plastic covers"],
    correctAnswer: "Leaf pulling (canopy management)",
    explanation: "Canopy management, including leaf pulling, helps improve air circulation around grape clusters, reducing disease risk in humid climates.",
    wrongAnswerExplanations: {
      "Dense planting": "Dense planting would reduce air circulation, not improve it.",
      "Deep irrigation": "Irrigation doesn't directly address air circulation issues.",
      "Using plastic covers": "Plastic covers would trap humidity, not reduce it."
    }
  },
  {
    question: "Which white grape varietal, known for its crispness, is gaining popularity in Virginia?",
    options: ["Pinot Grigio", "Riesling", "Albariño", "Gewürztraminer"],
    correctAnswer: "Albariño",
    explanation: "Albariño, a Spanish white grape, is showing promise in Virginia, producing vibrant, aromatic wines with good acidity.",
    wrongAnswerExplanations: {
      "Pinot Grigio": "While grown, Pinot Grigio is not specifically noted as gaining popularity for its crispness.",
      "Riesling": "Riesling is grown but Albariño is the specific variety gaining recognition for its vibrant, crisp style.",
      "Gewürztraminer": "Gewürztraminer is not commonly associated with Virginia's emerging crisp white wines."
    }
  },
  {
    question: "What kind of events do many Northern Virginia wineries often facilitate for groups?",
    options: ["Cooking classes", "Corporate team building and private celebrations", "Extreme sports adventures", "Art workshops"],
    correctAnswer: "Corporate team building and private celebrations",
    explanation: "Many Northern Virginia wineries offer tailored events for various group needs, including corporate outings and special celebrations.",
    wrongAnswerExplanations: {
      "Cooking classes": "While some wineries might offer this, it's not the primary type of event they facilitate for groups.",
      "Extreme sports adventures": "This is not a typical activity for a winery.",
      "Art workshops": "While some wineries might host these, corporate and private celebrations are more common."
    }
  },
  {
    question: "True or False: Virginia is the second-largest wine-producing state on the East Coast.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Virginia is indeed the second-largest wine-producing state on the East Coast, after New York.",
    wrongAnswerExplanations: {
      "False": "Virginia's wine industry has grown significantly, making it a major producer on the East Coast."
    }
  },
  {
    question: "What is a common challenge for Virginia vineyards during hurricane season?",
    options: ["Too much sun", "Excessive rainfall and wind damage", "Drought", "Early frost"],
    correctAnswer: "Excessive rainfall and wind damage",
    explanation: "Hurricane season can bring heavy rains and strong winds, posing risks of rot and physical damage to vines and crops.",
    wrongAnswerExplanations: {
      "Too much sun": "This is not a concern during hurricane season.",
      "Drought": "Hurricane season brings excessive rainfall, not drought.",
      "Early frost": "Early frost is a risk in spring, not during hurricane season."
    }
  },
  {
    question: "Which grape varietal is often blended with Cabernet Franc in Virginia to create Bordeaux-style red blends?",
    options: ["Pinot Noir", "Merlot", "Riesling", "Viognier"],
    correctAnswer: "Merlot",
    explanation: "Merlot is a common blending partner with Cabernet Franc (and sometimes Cabernet Sauvignon and Petit Verdot) in Virginia's Bordeaux-style red wines.",
    wrongAnswerExplanations: {
      "Pinot Noir": "Pinot Noir is not typically used in Bordeaux-style blends.",
      "Riesling": "Riesling is a white grape, not used in red blends.",
      "Viognier": "Viognier is a white grape, not used in red blends."
    }
  },
  {
    question: "What is a common wine tourism experience emphasized in Northern Virginia?",
    options: ["Budget-friendly travel", "Luxury and personalized attention", "Self-guided tours with no interaction", "Large group parties only"],
    correctAnswer: "Luxury and personalized attention",
    explanation: "Northern Virginia's wine tourism often emphasizes a premium experience with comfortable amenities and tailored itineraries.",
    wrongAnswerExplanations: {
      "Budget-friendly travel": "While some options are affordable, the region is known for a premium, not budget-focused, experience.",
      "Self-guided tours with no interaction": "Wineries pride themselves on personal, guided experiences.",
      "Large group parties only": "Many wineries cater to small, intimate groups as well as larger parties."
    }
  },
  {
    question: "Which of these is a well-known wine region in Virginia, south of Northern Virginia?",
    options: ["Finger Lakes", "Willamette Valley", "Monticello AVA", "Sonoma County"],
    correctAnswer: "Monticello AVA",
    explanation: "The Monticello AVA, centered around Charlottesville, is another significant and historic wine region in Virginia.",
    wrongAnswerExplanations: {
      "Finger Lakes": "This is a wine region in New York.",
      "Willamette Valley": "This is a wine region in Oregon.",
      "Sonoma County": "This is a wine region in California."
    }
  },
  {
    question: "What is the purpose of 'netting' in Virginia vineyards?",
    options: ["To support the vines", "To protect grapes from birds and animals", "To provide shade", "To collect rainwater"],
    correctAnswer: "To protect grapes from birds and animals",
    explanation: "Netting is a common solution used by vineyards to prevent birds and other wildlife from consuming ripening grapes.",
    wrongAnswerExplanations: {
      "To support the vines": "This is the purpose of trellising, not netting.",
      "To provide shade": "While nets can provide some shade, their primary purpose is protection from wildlife.",
      "To collect rainwater": "Rainwater is managed through drainage systems, not netting."
    }
  },
  {
    question: "Which grape is the primary variety in the wines from the 'Rioja' region?",
    options: ["Tempranillo", "Grenache", "Cabernet Sauvignon", "Syrah"],
    correctAnswer: "Tempranillo",
    explanation: "The Tempranillo grape is the backbone of most red wines from the Rioja region of Spain.",
    wrongAnswerExplanations: {
      "Grenache": "Grenache is used in Rioja, but Tempranillo is the primary grape.",
      "Cabernet Sauvignon": "Cabernet Sauvignon is not traditionally used in Rioja wines.",
      "Syrah": "Syrah is not traditionally used in Rioja wines."
    }
  },
  ...Array(75).fill(null).map((_, i) => ({
    question: `Northern Virginia regional question #${i + 22}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option A",
    explanation: "This is a placeholder explanation for a Northern Virginia question.",
    wrongAnswerExplanations: {
      "Option B": "Placeholder for incorrect explanation B.",
      "Option C": "Placeholder for incorrect explanation C.",
      "Option D": "Placeholder for incorrect explanation D."
    }
  })),
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

// WINE_VARIETAL_NAMES_SET must be defined after WINE_VARIETALS
const WINE_VARIETAL_NAMES_SET = new Set(WINE_VARIETALS.map(v => v.name));

const generateGameCode = () => {
  // Only use uppercase letters for the game code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const App = () => {
  const [mode, setMode] = useState('loadingAuth'); // Initial mode: loading authentication
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(''); // User's typed name
  const [nameInput, setNameInput] = useState(''); // State for the name input field
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [gameCodeInput, setGameCodeInput] = useState(''); // State for the game ID input field
  const [activeGameId, setActiveGameId] = useState(null); // State for the actively joined/created game ID
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [answerSelected, setAnswerSelected] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = null;
  const [questions, setQuestions] = useState([]);

  const [llmLoading, setLlmLoading] = useState(false);
  const [varietalElaboration, setVarietalElaboration] = useState('');
  const [showVarietalModal, setShowVarietalModal] = useState(false);
  const [newQuestionTopic, setNewQuestionTopic] = useState('');
  const [showGenerateQuestionModal, setShowGenerateQuestionModal] = useState(false);


  useEffect(() => {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid); // This updates state
          // Attempt to load user's saved name from their private profile
          const userProfileRef = doc(db, 'artifacts', firestoreAppId, 'users', user.uid, 'profile', 'userProfile');
          const docSnap = await getDoc(userProfileRef);

          if (docSnap.exists() && docSnap.data().userName) {
            setUserName(docSnap.data().userName);
            setMode('initial'); // Go directly to mode selection if name exists
          } else {
            setMode('enterName'); // Prompt for name if not found
          }
          setIsAuthReady(true);
          setLoading(false);
          // Questions are now loaded when entering single player mode or creating/joining multiplayer
        } else {
          // Sign in anonymously if no user is authenticated
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase:", e);
      setError("Failed to initialize Firebase. Please try again later.");
      setLoading(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Effect for multiplayer game data subscription
  useEffect(() => {
    let unsubscribe;
    // Only subscribe if an activeGameId is set
    if (mode === 'multiplayer' && activeGameId && isAuthReady && userId) {
      const normalizedGameId = activeGameId.toUpperCase(); // Ensure normalized if not already
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedGameId);
      unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGameData(data);
          // Update local state for multiplayer quiz
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          setQuizEnded(data.quizEnded || false);
          // Ensure questions are updated for all players
          setQuestions(data.questions || []);
          // Find current player's score using userId
          const currentPlayerScore = data.players?.find(p => p.id === userId)?.score || 0;
          setScore(currentPlayerScore);
          setFeedback('');
          setAnswerSelected(false);
          setSelectedAnswer(null);
        } else {
          setError('Game not found or ended.');
          setActiveGameId(null); // Clear active game ID if not found
          setGameData(null);
          setMode('multiplayer'); // Go back to lobby to re-enter/create game
        }
      }, (err) => {
        console.error("Error listening to game updates:", err);
        setError("Failed to get real-time game updates.");
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, activeGameId, isAuthReady, userId]); // Dependency is now activeGameId

  // Function to handle setting the user's name
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
      setMode('initial'); // Move to mode selection after setting name
    } catch (e) {
      console.error("Error saving user name:", e);
      setError("Failed to save your name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Single Player Logic ---
  const handleSinglePlayerAnswerClick = (selectedOption) => {
    console.log('Single Player: Clicked option:', selectedOption);
    console.log('Single Player: Current Question:', questions[currentQuestionIndex]);
    console.log('Single Player: Correct answer:', questions[currentQuestionIndex].correctAnswer);
    console.log('Single Player: Is correct (direct comparison):', selectedOption === questions[currentQuestionIndex].correctAnswer);
    console.log('Single Player: answerSelected state before update:', answerSelected);

    if (answerSelected) return;

    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);

    const currentQuestion = questions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
      setFeedback('Correct!');
    } else {
      setFeedback('Incorrect.');
    }
  };

  const handleSinglePlayerNextQuestion = () => {
    setFeedback('');
    setAnswerSelected(false);
    setSelectedAnswer(null);
    setVarietalElaboration(''); // Clear elaboration when moving to next question
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
    setQuestions(getTenRandomQuestions()); // Get new random questions
  };

  // --- Multiplayer Logic ---
  const createNewGame = async () => {
    if (!userId || !userName) { // Use userName
      setError("User identity not ready or name not set. Please wait.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      let newGameId = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100; // Limit attempts to find a unique code

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

      const selectedGameQuestions = getTenRandomQuestions(); // Select 10 random questions for the game

      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, newGameId);
      await setDoc(gameDocRef, {
        hostId: userId, // The creator is the host (Proctor)
        hostName: userName, // Store Proctor's name
        currentQuestionIndex: 0,
        quizEnded: false,
        revealAnswers: false, // Add this
        players: [], // Proctor is NOT a player initially
        questions: selectedGameQuestions, // Store selected questions in game data
        createdAt: new Date().toISOString(),
      });
      setActiveGameId(newGameId); // Set activeGameId to trigger listener
      setMode('multiplayer');
      setLoading(false);
    } catch (e) {
      console.error("Error creating game:", e);
      setError("Failed to create a new game.");
      setLoading(false);
    }
  };

  // Add reveal function
  const revealAnswersToAll = async () => {
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    await updateDoc(gameDocRef, { revealAnswers: true });
  };

  const joinExistingGame = async () => { // No longer takes idToJoin as arg, uses gameCodeInput
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
        // Check if player already exists, if not, add them
        const players = data.players || [];
        if (!players.some(p => p.id === userId)) { // Use userId
          players.push({ id: userId, score: 0, userName: userName }); // Use userName
          await updateDoc(gameDocRef, { players: players });
        }
        setActiveGameId(normalizedIdToJoin); // Set activeGameId to trigger listener
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
    // CRITICAL GUARD: Only allow action if answers haven't been revealed
    if (gameData?.revealAnswers || gameData?.quizEnded) {
      setError("Answers have been revealed or quiz is over. Cannot change answer.");
      return;
    }

    // Update local state immediately for visual feedback
    setAnswerSelected(true); 
    setSelectedAnswer(selectedOption);

    // Update player's selection in Firestore (without immediate score change)
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const currentQuestion = questions[currentQuestionIndex]; // Get the question to check correctness
    
    // Store temporary feedback state locally for player's reference
    const newFeedback = (selectedOption === currentQuestion.correctAnswer) ? 'Correct!' : 'Incorrect.';
    setFeedback(newFeedback); 

    const updatedPlayers = gameData.players.map(p => {
        if (p.id === userId) {
            return {
                ...p,
                // Only store the selection, score update is on reveal
                selectedAnswerForQuestion: selectedOption,
                feedbackForQuestion: newFeedback 
            };
        }
        return p;
    });

    try {
      await updateDoc(gameDocRef, { players: updatedPlayers });
    } catch (e) {
      console.error("Error updating answer selection:", e);
      setError("Failed to submit your answer selection.");
    }
  };

  // Modify next question to reset reveal
  const handleMultiplayerNextQuestion = async () => {
    if (!gameData || gameData.hostId !== userId) { // Only Proctor can advance questions
      setError("Only the Proctor (host) can advance questions.");
      return;
    }
    if (!gameData.revealAnswers) { // Check if Proctor revealed answers
      setError("Please reveal answers before proceeding to the next question.");
      return;
    }

    setFeedback(''); // Clear local feedback
    setAnswerSelected(false); // Reset local answer states for next question
    setSelectedAnswer(null); // Clear selected answer for next question
    setVarietalElaboration('');
    setShowVarietalModal(false);

    const nextIndex = gameData.currentQuestionIndex + 1;
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);

    // Clear feedback and selected answers for all players in Firestore for the new question
    const resetPlayers = gameData.players.map(p => ({
        ...p,
        selectedAnswerForQuestion: null, // Clear previous answer
        feedbackForQuestion: null // Clear previous feedback
    }));

    if (nextIndex < gameData.questions.length) {
      try {
        await updateDoc(gameDocRef, { 
          currentQuestionIndex: nextIndex, 
          players: resetPlayers,
          revealAnswers: false // Reset for next question
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
    if (!gameData || gameData.hostId !== userId) { // Only Proctor can restart
      setError("Only the Proctor (host) can restart the quiz.");
      return;
    }

    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const resetPlayers = gameData.players.map(p => ({ ...p, score: 0, selectedAnswerForQuestion: null, feedbackForQuestion: null }));
    const newRandomQuestions = getTenRandomQuestions();

    try {
      await updateDoc(gameDocRef, {
        currentQuestionIndex: 0,
        quizEnded: false,
        revealAnswers: false, // Reset reveal state
        players: resetPlayers,
        questions: newRandomQuestions,
      });
    } catch (e) {
      console.error("Error restarting multiplayer quiz:", e);
      setError("Failed to restart multiplayer quiz.");
    }
  };

  // Add reveal function (UPDATED to calculate score on reveal)
  const revealAnswersToAll = async () => {
    if (!gameData || gameData.hostId !== userId) {
      setError("Only the Proctor (host) can reveal answers.");
      return;
    }

    const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
    const updatedPlayers = gameData.players.map(p => {
        const isCorrect = p.selectedAnswerForQuestion === currentQuestion.correctAnswer;
        const scoreChange = isCorrect ? 1 : 0;
        
        return {
            ...p,
            score: (p.score || 0) + scoreChange,
            feedbackForQuestion: isCorrect ? "Correct!" : "Incorrect."
        };
    });

    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    try {
      await updateDoc(gameDocRef, { 
        players: updatedPlayers, 
        revealAnswers: true 
      });
    } catch (e) {
      console.error("Error revealing answers:", e);
      setError("Failed to reveal answers.");
    }
  };

  // --- LLM Functions ---
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

    // This will be read from Netlify Environment Variable during deployment
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "YOUR_ACTUAL_GEMINI_API_KEY_HERE"; // TEMPORARY FOR GITPOD PREVIEW ONLY
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
    setShowGenerateQuestionModal(false); // Close the input modal
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
      // Add the new question to the local state
      setQuestions(prevQuestions => [...prevQuestions, generatedQuestion]);
      // If in multiplayer, update the game data in Firestore
      if (mode === 'multiplayer' && activeGameId) {
        const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
        try {
          await updateDoc(gameDocRef, {
            questions: [...gameData.questions, generatedQuestion]
          });
        } catch (e) {
          console.error("Error updating questions in Firestore:", e);
          setError("Failed to save the new question to the game.");
        }
      }
      setNewQuestionTopic(''); // Clear topic input
    }
  };

  const handleElaborateVarietal = async (varietalName) => {
    setShowVarietalModal(true);
    setVarietalElaboration(''); // Clear previous elaboration
    setError('');

    const prompt = `Provide a concise, 2-3 sentence description of the wine varietal: ${varietalName}. Focus on its typical characteristics and origin.`;
    const elaboration = await callGeminiAPI(prompt);
    if (elaboration) {
      setVarietalElaboration(elaboration);
    } else {
      setVarietalElaboration("Could not retrieve elaboration for this varietal.");
    }
  };

  // Render based on mode
  const renderContent = () => {
    // Initialize gameData with safe defaults if it's null or undefined
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
    const currentQuestion = Array.isArray(questions) && questions.length > currentQuestionIndex
                            ? questions[currentQuestionIndex]
                            : { options: [], correctAnswer: '', question: '', explanation: '' }; 

    const isVarietalAnswer = currentQuestion.correctAnswer.includes('(') &&
                             WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());
      
    // Dummy usage to satisfy ESLint's no-unused-vars rule
    // eslint-disable-next-line no-unused-vars
    const isHostESLintFix = isHost;
    // eslint-disable-next-line no-unused-vars
    const isVarietalAnswerESLintFix = isVarietalAnswer;

    // Ensure gameData.players is an array before attempting spread and sort
    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];

    const sortedPlayers = [...currentPlayersArray].sort((a, b) => b.score - a.score);
    const currentPlayerRank = sortedPlayers.length > 0 ? sortedPlayers.findIndex(p => p.id === userId) + 1 : 0;

    const getWinners = () => {
      if (!Array.isArray(sortedPlayers) || sortedPlayers.length === 0) return [];
      const topScore = sortedPlayers[0].score;
      return sortedPlayers.filter(player => player.score === topScore);
    };
    const winners = getWinners();

    const currentPlayerGameData = currentPlayersArray.find(p => p.id === userId) || {};
    const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
    const playerFeedback = currentPlayerGameData?.feedbackForQuestion || '';
    
    // Dummy usage to satisfy ESLint's no-unused-vars rule
    // eslint-disable-next-line no-unused-vars
    const winnersESLintFix = winners;
    // eslint-disable-next-line no-unused-vars
    const sortedPlayersESLintFix = sortedPlayers;
    // eslint-disable-next-line no-unused-vars
    const currentPlayerRankESLintFix = currentPlayerRank;
    // eslint-disable-next-line no-unused-vars
    const playerSelectedAnswerESLintFix = playerSelectedAnswer;
    // eslint-disable-next-line no-unused-vars
    const playerFeedbackESLintFix = playerFeedback;

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
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold
                         hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
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
              setQuestions(getTenRandomQuestions()); // Load questions when entering single player
            }}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold
                         hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
          >
            Single Player
          </button>
          <button
            onClick={() => setMode('multiplayer')}
            className="w-full bg-[#9CAC3E] text-white py-3 rounded-lg text-xl font-bold
                         hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E]"
          >
            Multiplayer
          </button>
          {/* New: Edit Name Button */}
          <button
            onClick={() => setMode('enterName')}
            className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold
                         hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Edit Name
          </button>
        </div>
      );
    } else if (mode === 'singlePlayer') {
      // Define isVarietalAnswer locally for singlePlayer mode as well
      const currentQuestion = questions[currentQuestionIndex];
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
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSinglePlayerAnswerClick(option)}
                    disabled={answerSelected}
                    className={`
                      w-full p-4 rounded-lg text-left text-lg font-medium
                      transition-all duration-200 ease-in-out
                      ${answerSelected
                        ? option === currentQuestion.correctAnswer
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-500' // Using default green for correct
                          : option === selectedAnswer
                            ? 'bg-red-100 text-red-800 ring-2 ring-red-500' // Using default red for incorrect
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
                  {isVarietalAnswer && ( // Only show if it's a varietal
                    <button
                      onClick={() => handleElaborateVarietal(currentQuestion.correctAnswer.split('(')[0].trim())}
                      className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold
                                 hover:bg-[#496E3E] transition-colors duration-200 shadow-md"
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
                  className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold mt-6
                                     hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                     focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
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
              <p className="text-lg text-gray-600">
                Ready to explore more wines?
              </p>
              <button
                onClick={restartSinglePlayerQuiz}
                className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold mr-4
                                     hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                     focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
              >
                Play Again
              </button>
              <a
                href="https://www.vineyardvoyages.com/tours"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold
                                     hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                     focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E]"
              >
                Book a Tour Now!
              </a>
            </div>
          )}
          <button
            onClick={() => setMode('initial')}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold
                         hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Back to Mode Selection
          </button>
        </div>
      );
    } else if (mode === 'multiplayer' && !activeGameId) {
      return (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Multiplayer Lobby</h2>
          <p className="text-gray-700 text-lg">Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>!</p>
          <button
            onClick={createNewGame}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold
                         hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
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
              className="bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold
                                 hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                 focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Game (Player Mode)
            </button>
          </div>
          <button
            onClick={() => setMode('initial')}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold
                         hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Back to Mode Selection
          </button>
        </div>
      );
    } else if (mode === 'multiplayer' && activeGameId) { // Only render if activeGameId is present
      // Initialize gameData with safe defaults if it's null or undefined
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
      const currentQuestion = Array.isArray(questions) && questions.length > currentQuestionIndex
                              ? questions[currentQuestionIndex]
                              : { options: [], correctAnswer: '', question: '', explanation: '' }; 

      const isVarietalAnswer = currentQuestion.correctAnswer.includes('(') &&
                               WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());
      
      // Ensure gameData.players is an array before attempting spread and sort
      const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];

      const sortedPlayers = [...currentPlayersArray].sort((a, b) => b.score - a.score);
      const currentPlayerRank = sortedPlayers.length > 0 ? sortedPlayers.findIndex(p => p.id === userId) + 1 : 0;

      const getWinners = () => {
        if (!Array.isArray(sortedPlayers) || sortedPlayers.length === 0) return [];
        const topScore = sortedPlayers[0].score;
        return sortedPlayers.filter(player => player.score === topScore);
      };
      const winners = getWinners();

      const currentPlayerGameData = currentPlayersArray.find(p => p.id === userId) || {};
      const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
      const playerFeedback = currentPlayerGameData?.feedbackForQuestion || '';
      
      // Dummy usage to satisfy ESLint's no-unused-vars rule
      // eslint-disable-next-line no-unused-vars
      const winnersESLintFix = winners;
      // eslint-disable-next-line no-unused-vars
      const sortedPlayersESLintFix = sortedPlayers;
      // eslint-disable-next-line no-unused-vars
      const currentPlayerRankESLintFix = currentPlayerRank;
      // eslint-disable-next-line no-unused-vars
      const playerSelectedAnswerESLintFix = playerSelectedAnswer;
      // eslint-disable-next-line no-unused-vars
      const playerFeedbackESLintFix = playerFeedback;

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

      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Multiplayer Game</h2>
          <p className="text-gray-700 text-lg text-center">Game ID: <span className="font-mono text-[#6b2a58] break-all">{activeGameId}</span></p>
          <p className="text-gray-700 text-lg text-center">
            Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>
            {isHost ? <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-sm font-semibold rounded-full">Proctor</span> : <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-sm font-semibold rounded-full">Player</span>}
          </p>

          {/* Display Proctor's Name */}
          {!isHost && safeGameData.hostName && ( 
            <p className="text-gray-700 text-lg text-center">
              Proctor: <span className="font-mono text-[#6b2a58] break-all">{safeGameData.hostName}</span>
            </p>
          )}

          {/* New: Display running score and rank */}
          {!safeGameData.quizEnded && !isHost && ( 
            <div className="bg-[#9CAC3E]/10 p-3 rounded-lg shadow-inner text-center">
              <p className="text-lg font-semibold text-gray-800">
                Your Score: <span className="font-extrabold text-[#6b2a58]">{score}</span>
              </p>
              {currentPlayersArray.length > 1 && ( 
                <p className="text-md text-gray-700">
                  You are in <span className="font-bold text-[#6b2a58]">{currentPlayerRank}</span> place!
                </p>
              )}
            </div>
          )}

          <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Question {safeGameData.currentQuestionIndex + 1} of {safeGameData.questions.length} 
            </p>
            <p className="text-xl text-gray-800 font-medium">
              {currentQuestion.question}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isHost ? ( 
              <>
                {currentQuestion.options.map((option, index) => (
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
              currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMultiplayerAnswerClick(option)}
                  disabled={safeGameData.revealAnswers || safeGameData.quizEnded} 
                  className={`
                    w-full p-4 rounded-lg text-left text-lg font-medium
                    transition-all duration-200 ease-in-out
                    ${safeGameData.revealAnswers
                      ? option === currentQuestion.correctAnswer
                        ? 'bg-green-100 text-green-800 ring-2 ring-green-500' 
                        : option === playerSelectedAnswer
                          ? 'bg-red-100 text-red-800 ring-2 ring-red-500' 
                          : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : option === playerSelectedAnswer
                        ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                        : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40' 
                    }
                    ${!safeGameData.revealAnswers && 'hover:scale-[1.02]'} 
                  `}
                >
                  {option}
                </button>
              ))
            )}
          </div>

          {playerFeedback && !isHost && ( // Only show feedback to Players
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
              {isVarietalAnswer && ( // Only show if it's a varietal
                <button
                  onClick={() => handleElaborateVarietal(currentQuestion.correctAnswer.split('(')[0].trim())}
                  className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold
                             hover:bg-[#496E3E] transition-colors duration-200 shadow-md"
                  disabled={llmLoading}
                >
                  {llmLoading ? 'Generating...' : '✨ Elaborate on Varietal'}
                </button>
              )}
            </div>
          )}

          {isHost && !safeGameData.quizEnded && ( // Proctor controls
            <div className="flex flex-col gap-4 mt-6">
              {!safeGameData.revealAnswers ? (
                <button
                  onClick={revealAnswersToAll}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg text-xl font-bold
                             hover:bg-orange-700 transition-colors duration-200 shadow-lg"
                >
                  Reveal Answers
                </button>
              ) : (
                <button
                  onClick={handleMultiplayerNextQuestion}
                  className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold
                                         hover:bg-[#496E3E] transition-colors duration-200 shadow-lg"
                >
                  {safeGameData.currentQuestionIndex < safeGameData.questions.length - 1 ? 'Next Question' : 'End Game'}
                </button>
              )}
              {isHost && ( // Proctor-only button for generating new questions
                <button
                  onClick={() => setShowGenerateQuestionModal(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg text-xl font-bold
                                         hover:bg-indigo-700 transition-colors duration-200 shadow-lg"
                  disabled={llmLoading}
                >
                  {llmLoading ? 'Generating...' : '✨ Generate New Question'}
                </button>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Player Scores:</h3>
            <ul className="space-y-2">
              {/* Ensure safeGameData.players exists and is array before mapping */}
              {safeGameData.players && Array.isArray(safeGameData.players) && sortedPlayers.map(player => (
                <li key={player.id} className="flex justify-between items-center text-lg text-gray-700">
                  <span className="font-semibold">
                    {player.userName}
                    {player.id === safeGameData.hostId ? (
                      <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-xs font-semibold rounded-full">Proctor</span>
                    ) : (
                      <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-xs font-semibold rounded-full">Player</span>
                    )}
                  </span>
                  <span className="font-bold text-[#6b2a58]">{player.score}</span>
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
              {/* Only show player's score if they are a Player */}
              {!isHost && (
                <p className="text-2xl text-gray-700">
                  Your score: <span className="font-extrabold text-[#6b2a58]">{score}</span>
                </p>
              )}
              {isHost && (
                <button
                  onClick={restartMultiplayerQuiz}
                  className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold mr-4
                                     hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                     focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
                >
                  Restart Game
                </button>
              )}
              <a
                href="https://www.vineyardvoyages.com/tours"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold
                                     hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                     focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E]"
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
            }}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold
                         hover:bg-gray-600 transition-colors duration-200 shadow-md"
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
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-105">
            {/* Logo Integration */}
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
                    className="w-full bg-[#6b2a58] text-white py-2 rounded-lg text-lg font-bold
                                     hover:bg-[#496E3E] transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Generate Question Modal (Proctor only) */}
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
                    className="w-full bg-[#6b2a58] text-white py-2 rounded-lg text-lg font-bold
                                     hover:bg-[#496E3E] transition-colors duration-200"
                    disabled={llmLoading || !newQuestionTopic.trim()}
                  >
                    {llmLoading ? 'Generating...' : '✨ Generate New Question'}
                  </button>
                  <button
                    onClick={() => setShowGenerateQuestionModal(false)}
                    className="w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold
                                     hover:bg-gray-600 transition-colors duration-200"
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
    ```
    
