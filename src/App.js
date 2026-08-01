import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';

// Firebase web configuration. The API key is supplied by the build environment.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "vineyardvoyagesquiz-33fde.firebaseapp.com",
  projectId: "vineyardvoyagesquiz-33fde",
  storageBucket: "vineyardvoyagesquiz-33fde.firebasestorage.app",
  messagingSenderId: "539449046402",
  appId: "1:539449046402:web:a88b15a7bb81bdc7d1cb9b"
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

// --- Local durability helpers for active games, pending answers, and recent draws ---
const ACTIVE_GAME_STORAGE_KEY = 'vv-active-game';
const PENDING_ANSWERS_STORAGE_KEY = 'vv-pending-answers';
const RECENT_QUESTIONS_STORAGE_KEY = 'vv-recent-question-ids';

const readJsonStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (storageError) {
    console.warn(`Failed to read ${key}:`, storageError);
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (storageError) {
    console.warn(`Failed to save ${key}:`, storageError);
  }
};

const saveActiveGame = (gameId, userName) => {
  writeJsonStorage(ACTIVE_GAME_STORAGE_KEY, { gameId, userName });
};

const loadActiveGame = () => readJsonStorage(ACTIVE_GAME_STORAGE_KEY, null);

const removeLocalState = () => {
  try {
    localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  } catch (storageError) {
    console.warn('Failed to clear the active game:', storageError);
  }
};

const readPendingAnswers = () => readJsonStorage(PENDING_ANSWERS_STORAGE_KEY, {});

const pendingAnswerStorageKey = (gameId, roundId, questionKey, userId) =>
  [gameId, roundId, questionKey, userId].join('|');

const savePendingAnswer = (answer) => {
  const pending = readPendingAnswers();
  pending[pendingAnswerStorageKey(
    answer.gameId,
    answer.roundId,
    answer.questionKey,
    answer.userId
  )] = answer;
  writeJsonStorage(PENDING_ANSWERS_STORAGE_KEY, pending);
};

const removePendingAnswer = (answer) => {
  const pending = readPendingAnswers();
  delete pending[pendingAnswerStorageKey(
    answer.gameId,
    answer.roundId,
    answer.questionKey,
    answer.userId
  )];
  writeJsonStorage(PENDING_ANSWERS_STORAGE_KEY, pending);
};

const getPendingAnswersForUser = (gameId, userId) =>
  Object.values(readPendingAnswers()).filter(
    answer => answer.gameId === gameId && answer.userId === userId
  );

const getPendingAnswer = (gameId, roundId, questionKey, userId) =>
  readPendingAnswers()[pendingAnswerStorageKey(gameId, roundId, questionKey, userId)] || null;

const loadRecentQuestionIds = () => readJsonStorage(RECENT_QUESTIONS_STORAGE_KEY, []);

const saveRecentQuestionIds = (questionIds) => {
  writeJsonStorage(RECENT_QUESTIONS_STORAGE_KEY, questionIds.slice(-40));
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
    question: "What is the purpose of sulfur dioxide (SO²) in winemaking?",
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
  {
    question: "The Douro Valley in Portugal is most famous for being the birthplace of which fortified wine?",
    options: ["Sherry", "Port", "Madeira", "Marsala"],
    correctAnswer: "Port",
    explanation: "Port is produced exclusively in the Douro Valley, where steep terraced vineyards have been designated a UNESCO World Heritage site.",
    wrongAnswerExplanations: {
      "Sherry": "Sherry is produced in the 'Sherry Triangle' of Spain.",
      "Madeira": "Madeira comes from the Portuguese island of the same name, not the Douro Valley.",
      "Marsala": "Marsala is a fortified wine from Sicily, Italy."
    }
  },
  {
    question: "Which grape is widely considered the 'flagship' red varietal of Portugal, used in both Port and dry reds?",
    options: ["Tempranillo", "Touriga Nacional", "Sangiovese", "Malbec"],
    correctAnswer: "Touriga Nacional",
    explanation: "Touriga Nacional is prized for its small berries, deep color, and intense tannins, providing the backbone for Portugal's finest wines.",
    wrongAnswerExplanations: {
      "Tempranillo": "Known as Tinta Roriz in Portugal, it is important but Touriga Nacional is the true flagship.",
      "Sangiovese": "This is the signature grape of Italy's Tuscany region.",
      "Malbec": "Malbec is the signature grape of Argentina."
    }
  },
  {
    question: "The Alentejo region of Portugal is responsible for producing over 50% of the world's supply of what winemaking material?",
    options: ["Glass bottles", "Oak barrels", "Cork", "Synthetic closures"],
    correctAnswer: "Cork",
    explanation: "The Alentejo is home to massive forests of Quercus suber (Cork Oak), making Portugal the global leader in natural cork production.",
    wrongAnswerExplanations: {
      "Glass bottles": "Bottle manufacturing is spread globally; Alentejo is specific to agriculture.",
      "Oak barrels": "Most premium barrels come from French or American oak forests.",
      "Synthetic closures": "These are manufactured in factories, not harvested from Alentejo forests."
    }
  },
  {
    question: "What is the unique soil type of the Douro Valley that allows vines to thrive in high heat by retaining moisture?",
    options: ["Schist", "Chalk", "Volcanic Ash", "Clay"],
    correctAnswer: "Schist",
    explanation: "Schist is a laminated rock that breaks vertically, allowing vine roots to grow deep into the earth to find water during dry summers.",
    wrongAnswerExplanations: {
      "Chalk": "Famous in Champagne, France, for its drainage and acidity retention.",
      "Volcanic Ash": "Common in Canary Islands or Mt. Etna, but not the Douro.",
      "Clay": "While present in some regions, it is the rock-hard Schist that defines Douro terroir."
    }
  },
  {
    question: "In the Alentejo region, what traditional vessels are often used for fermenting and aging 'Vinho de Talha'?",
    options: ["Stainless steel tanks", "Small oak barriques", "Large clay amphorae", "Concrete eggs"],
    correctAnswer: "Large clay amphorae",
    explanation: "Vinho de Talha refers to the 2,000-year-old tradition of making wine in large clay pots, a practice preserved superlatively in Alentejo.",
    wrongAnswerExplanations: {
      "Stainless steel tanks": "These are used for modern, temperature-controlled winemaking.",
      "Small oak barriques": "A French tradition used for imparting vanilla and spice flavors.",
      "Concrete eggs": "A modern biodynamic trend, not the ancient 'Talha' tradition."
    }
  },

  // --- URUGUAY ---
  {
    question: "Which bold red grape variety has become the undisputed signature grape of Uruguay?",
    options: ["Merlot", "Tannat", "Syrah", "Carmenere"],
    correctAnswer: "Tannat",
    explanation: "Uruguayan Tannat is known for being more approachable and softer than its French ancestors, while maintaining its superlative structure.",
    wrongAnswerExplanations: {
      "Merlot": "Grows well in Uruguay but is not the national signature.",
      "Syrah": "Common in the 'New World' but Tannat is Uruguay's claim to fame.",
      "Carmenere": "This is the signature grape of Uruguay's neighbor, Chile."
    }
  },
  {
    question: "Uruguay’s wine regions are heavily influenced by their proximity to which body of water?",
    options: ["Pacific Ocean", "Mediterranean Sea", "Atlantic Ocean", "Gulf of Mexico"],
    correctAnswer: "Atlantic Ocean",
    explanation: "The Atlantic and the Rio de la Plata provide cooling breezes that create a maritime climate similar to Bordeaux.",
    wrongAnswerExplanations: {
      "Pacific Ocean": "This influences Chile and California, but not Uruguay on the east coast.",
      "Mediterranean Sea": "This is located between Europe and Africa.",
      "Gulf of Mexico": "This is located in North America."
    }
  },
  {
    question: "Who is credited with bringing the first Tannat vines to Uruguay in the 1870s?",
    options: ["Thomas Jefferson", "Pascual Harriague", "James Busby", "Agoston Haraszthy"],
    correctAnswer: "Pascual Harriague",
    explanation: "Harriague, a Basque settler, successfully cultivated the grape in the Salto region, which is why Tannat is sometimes called 'Harriague' locally.",
    wrongAnswerExplanations: {
      "Thomas Jefferson": "Jefferson tried to bring European vines to Virginia, not Uruguay.",
      "James Busby": "Known as the father of the Australian wine industry.",
      "Agoston Haraszthy": "Founder of Buena Vista Winery and father of California viticulture."
    }
  },
  {
    question: "Which region in Uruguay is considered a 'superlative' emerging area, known for coastal influence and Bodega Garzón?",
    options: ["Mendoza", "Maldonado", "Canelones", "Colchagua"],
    correctAnswer: "Maldonado",
    explanation: "Maldonado, specifically the Garzón area, features thin soils and ocean breezes that produce high-quality, mineral-driven wines.",
    wrongAnswerExplanations: {
      "Mendoza": "This is the primary wine region of Argentina.",
      "Canelones": "This is Uruguay's largest wine region, but more inland and traditional than Maldonado.",
      "Colchagua": "A famous valley located in Chile."
    }
  },
  {
    question: "Compared to French Tannat, Uruguayan Tannat is generally described as being...",
    options: ["More acidic and harsher", "Lower in alcohol", "Fruitier with softer tannins", "Exclusively sweet"],
    correctAnswer: "Fruitier with softer tannins",
    explanation: "Uruguay's climate allows the grape to ripen fully, resulting in a more velvet-like texture compared to the rustic versions from Madiran, France.",
    wrongAnswerExplanations: {
      "More acidic and harsher": "This describes Tannat grown in cooler, more traditional French climates.",
      "Lower in alcohol": "Warmer New World climates often lead to slightly higher alcohol.",
      "Exclusively sweet": "While some late-harvest versions exist, the vast majority is dry red wine."
    }
  },

  // --- CHILE ---
  {
    question: "For decades, many Chilean vineyards thought they were growing Merlot, only to discover it was actually which 'lost' Bordeaux variety?",
    options: ["Malbec", "Petit Verdot", "Carmenere", "Cabernet Franc"],
    correctAnswer: "Carmenere",
    explanation: "DNA testing in 1994 revealed that much of Chile's Merlot was actually Carmenere, which had been nearly extinct in Europe.",
    wrongAnswerExplanations: {
      "Malbec": "Malbec was never confused with Merlot in Chile on a large scale.",
      "Petit Verdot": "Used primarily as a blending grape, its leaf and berry shape are distinct.",
      "Cabernet Franc": "Though a parent of Merlot, it was not the subject of the famous Chilean mix-up."
    }
  },
  {
    question: "Chile is one of the few wine-producing countries in the world that has never been affected by which vineyard-destroying pest?",
    options: ["Glassy-winged Sharpshooter", "Phylloxera", "Spider Mites", "Mealybugs"],
    correctAnswer: "Phylloxera",
    explanation: "Thanks to the Andes mountains and the Pacific Ocean acting as natural barriers, Chile remains phylloxera-free, allowing many vines to grow on their own roots.",
    wrongAnswerExplanations: {
      "Glassy-winged Sharpshooter": "Spreads Pierce's disease, primarily a concern in California.",
      "Spider Mites": "A common vineyard pest found in Chile and elsewhere.",
      "Mealybugs": "Commonly found in many global vineyards, including Chile."
    }
  },
  {
    question: "The Casablanca Valley in Chile is superlatively known for producing high-quality wines from which two cool-climate grapes?",
    options: ["Cabernet and Merlot", "Sauvignon Blanc and Chardonnay", "Syrah and Malbec", "Zinfandel and Petite Sirah"],
    correctAnswer: "Sauvignon Blanc and Chardonnay",
    explanation: "The Casablanca Valley's proximity to the Pacific Ocean provides the morning fog and cool breezes necessary for vibrant white wines.",
    wrongAnswerExplanations: {
      "Cabernet and Merlot": "These prefer the warmer Maipo or Colchagua Valleys.",
      "Syrah and Malbec": "These generally require more heat than the Casablanca Valley offers.",
      "Zinfandel and Petite Sirah": "These are California specialties, rarely found in Casablanca."
    }
  },
  {
    question: "Which Chilean wine region is often called the 'Bordeaux of South America' due to its superlative Cabernet Sauvignon?",
    options: ["Maipo Valley", "Limarí Valley", "Bio-Bio Valley", "Atacama Desert"],
    correctAnswer: "Maipo Valley",
    explanation: "Maipo is the historic heart of Chilean wine, where the country's most iconic and expensive Cabernet Sauvignons are produced.",
    wrongAnswerExplanations: {
      "Limarí Valley": "Known for mineral-driven Chardonnays from limestone-rich soils.",
      "Bio-Bio Valley": "A very cool, southern region known for Pinot Noir and Riesling.",
      "Atacama Desert": "One of the driest places on earth; only very experimental viticulture happens here."
    }
  },
  {
    question: "What is the primary cooling influence that allows Chilean grapes to maintain acidity despite the sunny climate?",
    options: ["The Gulf Stream", "The Humboldt Current", "The Jet Stream", "The Monsoon"],
    correctAnswer: "The Humboldt Current",
    explanation: "This cold ocean current brings icy water from Antarctica up the coast of Chile, creating cooling breezes that reach the inland valleys.",
    wrongAnswerExplanations: {
      "The Gulf Stream": "This warm current influences the climate of Europe and the US East Coast.",
      "The Jet Stream": "A high-altitude air current that affects global weather patterns, not specific coastal cooling.",
      "The Monsoon": "A seasonal wind pattern associated with heavy rain in Asia."
    }
  },

  // --- ARGENTINA ---
  {
    question: "While Malbec is the king of red grapes in Argentina, which unique white grape is considered its aromatic white 'queen'?",
    options: ["Torrontés", "Viognier", "Riesling", "Gewürztraminer"],
    correctAnswer: "Torrontés",
    explanation: "Torrontés is an indigenous Argentine grape known for its intense floral aromas of jasmine and geranium.",
    wrongAnswerExplanations: {
      "Viognier": "Grows well in Argentina, but Torrontés is the unique national specialty.",
      "Riesling": "Mostly associated with Germany and cooler climates like Virginia or the Finger Lakes.",
      "Gewürztraminer": "Known for lychee notes, it is much less common in Argentina than Torrontés."
    }
  },
  {
    question: "In Argentina, 'High Altitude' viticulture is essential. In which province would you find the superlative Uco Valley?",
    options: ["Salta", "San Juan", "Mendoza", "Patagonia"],
    correctAnswer: "Mendoza",
    explanation: "The Uco Valley in Mendoza features some of the highest vineyards in the world, producing Malbecs with incredible color and acidity.",
    wrongAnswerExplanations: {
      "Salta": "Located further north, Salta is famous for even higher altitude vineyards (like Cafayate).",
      "San Juan": "Argentina's second-largest wine region, known for Syrah and everyday wines.",
      "Patagonia": "The southernmost region, much cooler and lower in elevation than the Uco Valley."
    }
  },
  {
    question: "What is the primary source of water for irrigation in the desert-like wine regions of Mendoza?",
    options: ["Desalinated ocean water", "Snowmelt from the Andes Mountains", "Local rainfall", "Deep underground salt aquifers"],
    correctAnswer: "Snowmelt from the Andes Mountains",
    explanation: "Argentina's wine regions are rain shadows; they rely on a network of canals carrying pure snowmelt from the Andes peaks.",
    wrongAnswerExplanations: {
      "Desalinated ocean water": "Mendoza is far inland and high elevation; ocean water is not accessible.",
      "Local rainfall": "Mendoza is extremely dry, receiving only about 8-10 inches of rain per year.",
      "Deep underground salt aquifers": "Salty water would damage the vines; fresh snowmelt is the preferred source."
    }
  },
  {
    question: "Which of these Argentine wineries is internationally recognized for its research into soil micro-terroirs and high-altitude Malbec?",
    options: ["Catena Zapata", "Yellow Tail", "Gallo Family", "Penfolds"],
    correctAnswer: "Catena Zapata",
    explanation: "Nicolás Catena Zapata is credited with revolutionizing Argentine wine by exploring the superlative potential of high-altitude mountain fruit.",
    wrongAnswerExplanations: {
      "Yellow Tail": "A mass-market brand from Australia.",
      "Gallo Family": "A major corporate wine producer based in California.",
      "Penfolds": "An iconic superlative winery from Australia, famous for Grange."
    }
  },
  {
    question: "The Zonda is a significant climatic factor in Argentina. What exactly is it?",
    options: ["A type of irrigation canal", "A fierce, hot, dry wind from the Andes", "A specific type of granite soil", "A traditional harvest festival"],
    correctAnswer: "A fierce, hot, dry wind from the Andes",
    explanation: "The Zonda can reach high speeds and high temperatures, sometimes damaging flowering vines but also helping prevent grape diseases.",
    wrongAnswerExplanations: {
      "A type of irrigation canal": "These are called 'Acequias' in Mendoza.",
      "A specific type of granite soil": "Terras are varied, but Zonda refers to the air.",
      "A traditional harvest festival": "The famous harvest festival in Mendoza is called 'Fiesta Nacional de la Vendimia'."
    }
  },
  {
    question: "Which white grape, a specialty of Southwest France, has become a 'superlative' success in Loudoun due to its thick skins and high acidity?",
    options: ["Chardonnay", "Petit Manseng", "Chenin Blanc", "Viura"],
    correctAnswer: "Petit Manseng",
    explanation: "Native to Jurançon in SW France, Petit Manseng is perfectly adapted to Loudoun’s humidity because its loose clusters and thick skins resist rot.",
    wrongAnswerExplanations: {
      "Chardonnay": "A Burgundy native that is popular but more prone to rot in Virginia's humidity.",
      "Chenin Blanc": "The star of the Loire Valley, not typically associated with SW France or Loudoun's primary white specialties.",
      "Viura": "A Spanish white grape, common in Rioja but rare in Loudoun."
    }
  },
  {
    question: "The Cahors region in Southwest France is the original home of which famous red grape, now a staple at partner wineries like Casanel?",
    options: ["Merlot", "Malbec", "Sangiovese", "Zinfandel"],
    correctAnswer: "Malbec",
    explanation: "While Argentina made it famous, Malbec (locally called 'Auxerrois') originated in Cahors, where it produces superlative 'black wines'.",
    wrongAnswerExplanations: {
      "Merlot": "Originates from Bordeaux, specifically the Libournais area.",
      "Sangiovese": "The signature red grape of Tuscany, Italy.",
      "Zinfandel": "Originally from Croatia, it is considered a California heritage grape."
    }
  },
  {
    question: "Which Bordeaux red variety is widely considered Loudoun's 'superlative' red grape, often outperforming Cabernet Sauvignon in Virginia’s climate?",
    options: ["Cabernet Franc", "Malbec", "Carmenere", "Syrah"],
    correctAnswer: "Cabernet Franc",
    explanation: "Like in Bordeaux's 'Right Bank' (Saint-Émilion), Cabernet Franc thrives in Loudoun, offering aromatic complexity and reliable ripening.",
    wrongAnswerExplanations: {
      "Malbec": "Successful in Loudoun but generally secondary to Cabernet Franc in total acreage.",
      "Carmenere": "The 'lost' grape of Bordeaux that is now the signature of Chile.",
      "Syrah": "Common in the Rhône Valley, it can struggle with Loudoun's winter freezes."
    }
  },
  {
    question: "Toulouse is the capital of the Occitanie region. Which nearby wine area is famous for the Negrette grape, which produces unique violet-scented reds?",
    options: ["Fronton", "Madiran", "Gaillac", "Bordeaux"],
    correctAnswer: "Fronton",
    explanation: "Fronton is a superlative AOC located just north of Toulouse, where Negrette must make up at least 40% of the blend.",
    wrongAnswerExplanations: {
      "Madiran": "Famous for the Tannat grape, further west toward the Pyrenees.",
      "Gaillac": "Known for indigenous varietals like Braucol and Loin de l'Oeil.",
      "Bordeaux": "While nearby, it relies on Cabernet, Merlot, and Petit Verdot, not Negrette."
    }
  },
  {
    question: "In 1787, which future US President visited Bordeaux and Southwest France, meticulously cataloging 'superlative' vineyards that influenced Virginia wine history?",
    // Context: He's the patron of Virginia wine.
    options: ["George Washington", "Thomas Jefferson", "Alexander Hamilton", "John Adams"],
    correctAnswer: "Thomas Jefferson",
    explanation: "As Minister to France, Jefferson’s tours of Bordeaux and Occitanie convinced him that Virginia could produce world-class wine from the same varietals.",
    wrongAnswerExplanations: {
      "George Washington": "While he grew grapes, he was more focused on whiskey and general farming.",
      "Alexander Hamilton": "More focused on urban finance than rural viticulture.",
      "John Adams": "Preferred cider over wine, according to most historical accounts."
    }
  },
  {
    question: "Which red grape from Madiran (SW France) is known for being 'superlatively' tannic and is now finding a home in Loudoun at wineries like 868 Estate?",
    options: ["Tannat", "Grenache", "Pinot Noir", "Barbera"],
    correctAnswer: "Tannat",
    explanation: "Tannat is the star of Madiran; its high tannin levels and bold structure make it an exciting emerging red for Loudoun County's terroir.",
    wrongAnswerExplanations: {
      "Grenache": "A thin-skinned grape that loves the heat of the Southern Rhône and Spain.",
      "Pinot Noir": "A delicate, low-tannin grape that struggles with the heat and humidity of Northern Virginia.",
      "Barbera": "An Italian grape from Piedmont known for high acidity rather than heavy tannins."
    }
  },
  {
    question: "The 'Right Bank' of Bordeaux is superlative for which grape, which is also a key component in blends at partner wineries like Williams Gap?",
    options: ["Cabernet Sauvignon", "Merlot", "Riesling", "Albariño"],
    correctAnswer: "Merlot",
    explanation: "The clay-rich soils of the Right Bank (Pomerol and Saint-Émilion) are ideal for Merlot, much like the heavy soils found in parts of Loudoun.",
    wrongAnswerExplanations: {
      "Cabernet Sauvignon": "Dominates the 'Left Bank' gravel soils of Bordeaux.",
      "Riesling": "A cool-climate white grape from Germany or Alsace.",
      "Albariño": "A Spanish/Portuguese white grape, though very popular in Loudoun now."
    }
  },
  {
    question: "Which Bordeaux varietal is often used in very small percentages to add superlative color and spice, a practice mirrored in Loudoun 'Meritage' blends?",
    options: ["Chardonnay", "Petit Verdot", "Pinot Grigio", "Tempranillo"],
    correctAnswer: "Petit Verdot",
    explanation: "Petit Verdot ripens late and provides deep color and firm structure. It is becoming a standalone superlative varietal in Virginia.",
    wrongAnswerExplanations: {
      "Chardonnay": "A white grape, never used for color in red Bordeaux blends.",
      "Pinot Grigio": "A white grape used for light, crisp wines.",
      "Tempranillo": "The main grape of Rioja, Spain, not used in traditional Bordeaux blends."
    }
  },
  {
    question: "Occitanie is home to the superlative sparkling wine 'Blanquette de Limoux'. How does its history compare to Champagne?",
    options: ["It was invented 100 years after Champagne", "It is the world's first recorded sparkling wine (1531)", "It is made without grapes", "It can only be served at weddings"],
    correctAnswer: "It is the world's first recorded sparkling wine (1531)",
    explanation: "Monks in Limoux were making sparkling wine over a century before Dom Pérignon, using the 'méthode ancestrale'.",
    wrongAnswerExplanations: {
      "It was invented 100 years after Champagne": "Limoux actually predates Champagne's sparkling tradition.",
      "It is made without grapes": "All Limoux sparkling wine is made from Mauzac, Chardonnay, or Chenin Blanc grapes.",
      "It can only be served at weddings": "While festive, it is enjoyed year-round as a refreshing aperitif."
    }
  },
  {
    question: "What major geographic feature do both Bordeaux and Loudoun County share that helps moderate vineyard temperatures?",
    options: ["Being in the middle of a desert", "Proximity to a major body of water and mountain influences", "Having no rainfall whatsoever", "Being located on a tropical island"],
    correctAnswer: "Proximity to a major body of water and mountain influences",
    explanation: "Bordeaux is influenced by the Atlantic and its rivers; Loudoun is moderated by the Potomac River and the Blue Ridge Mountains.",
    wrongAnswerExplanations: {
      "Being in the middle of a desert": "Both regions are humid and receive significant rainfall.",
      "Having no rainfall whatsoever": "Both regions are known for their humidity and the challenges of managing rain.",
      "Being located on a tropical island": "Both are inland continental or maritime temperate regions."
    }
  },,

  {
    question: "Which Virginia red grape commonly shows spicy, peppery notes with aromas of plum, blackberry, violets, and tobacco?",
    options: ["Cabernet Franc", "Pinot Noir", "Chambourcin", "Norton"],
    correctAnswer: "Cabernet Franc",
    explanation: "Cabernet Franc has earned a strong reputation in Virginia and is known for its fruit, spice, floral, and tobacco characteristics.",
    wrongAnswerExplanations: {
      "Pinot Noir": "Pinot Noir is generally associated with lighter-bodied wines and red-fruit aromas rather than Cabernet Franc's peppery Virginia profile.",
      "Chambourcin": "Chambourcin is a French-American hybrid known for berry flavors, herbal aromas, and crisp acidity.",
      "Norton": "Norton is Virginia's historic native grape, known for deep color, bright acidity, and dark-fruit flavors."
    }
  },
  {
    question: "Which grape, traditionally used in Bordeaux blends, has become a successful stand-alone varietal in Virginia?",
    options: ["Petit Verdot", "Riesling", "Pinot Grigio", "Gamay"],
    correctAnswer: "Petit Verdot",
    explanation: "Virginia Petit Verdot produces dark, full-bodied wines with dense fruit, bold tannins, and excellent aging potential.",
    wrongAnswerExplanations: {
      "Riesling": "Riesling is an aromatic white grape associated especially with Germany and is not a Bordeaux red blending grape.",
      "Pinot Grigio": "Pinot Grigio is a white grape and is not part of traditional Bordeaux red blends.",
      "Gamay": "Gamay is the red grape associated with Beaujolais, not Bordeaux blending."
    }
  },
  {
    question: "Despite its aromas of stone fruit, pineapple, and orange blossom, how is Virginia Viognier usually made?",
    options: ["Dry", "Fortified", "Sparkling", "Very sweet"],
    correctAnswer: "Dry",
    explanation: "Viognier's intense fruit and floral aromas can suggest sweetness, but Virginia examples are usually produced in a dry style.",
    wrongAnswerExplanations: {
      "Fortified": "Fortification involves adding a distilled spirit and is not the usual style for Virginia Viognier.",
      "Sparkling": "Virginia Viognier is generally produced as a still wine rather than a sparkling wine.",
      "Very sweet": "Its ripe aromas can suggest sweetness, but most Virginia Viognier is made dry."
    }
  },
  {
    question: "Which native American wine grape was first cultivated in Richmond, Virginia, during the 1820s?",
    options: ["Norton", "Cabernet Franc", "Chambourcin", "Petit Verdot"],
    correctAnswer: "Norton",
    explanation: "Richmond physician and horticulturist Dr. Daniel Norborne Norton created the Norton grape through crossbreeding in the 1820s. It is recognized as America's oldest cultivated native wine grape.",
    wrongAnswerExplanations: {
      "Cabernet Franc": "Cabernet Franc originated in France and is a Vitis vinifera grape, not a native Virginia creation.",
      "Chambourcin": "Chambourcin is a French-American hybrid developed in France, not the Richmond grape created by Dr. Norton.",
      "Petit Verdot": "Petit Verdot is a French Bordeaux grape that later found success in Virginia."
    }
  },
  {
    question: "Which Virginia white grape has loose clusters that allow it to remain on the vine for off-dry and dessert-wine production?",
    options: ["Petit Manseng", "Chardonnay", "Sauvignon Blanc", "Pinot Grigio"],
    correctAnswer: "Petit Manseng",
    explanation: "Petit Manseng's loosely packed clusters help it remain healthy late into the growing season, supporting dry, off-dry, and dessert-wine styles.",
    wrongAnswerExplanations: {
      "Chardonnay": "Chardonnay produces many styles in Virginia, but it is not especially identified by the loose-cluster trait described here.",
      "Sauvignon Blanc": "Sauvignon Blanc is known for acidity and aromatic freshness rather than late-harvest suitability from loose clusters.",
      "Pinot Grigio": "Pinot Grigio is generally made in a fresh, dry style and is not the Virginia grape described here."
    }
  },
  {
    question: "Which hardy, thick-skinned hybrid grape can produce dry, late-harvest, and ice-wine styles in Virginia?",
    options: ["Vidal Blanc", "Merlot", "Viognier", "Cabernet Sauvignon"],
    correctAnswer: "Vidal Blanc",
    explanation: "Vidal Blanc handles varied growing conditions and produces wines ranging from crisp and dry to sweet late-harvest and ice-wine styles.",
    wrongAnswerExplanations: {
      "Merlot": "Merlot is a red Vitis vinifera grape and is not the hardy white hybrid described here.",
      "Viognier": "Viognier is an aromatic Vitis vinifera white grape, not a thick-skinned hybrid.",
      "Cabernet Sauvignon": "Cabernet Sauvignon is a red Vitis vinifera grape and is not used for the range of white-wine styles described."
    }
  },
  {
    question: "What is the term for a person who makes wine?",
    options: ["Sommelier", "Cooper", "Vintner", "Viticulturist"],
    correctAnswer: "Vintner",
    explanation: "A vintner or winemaker is responsible for producing wine, from processing the grapes through fermentation, aging, and blending.",
    wrongAnswerExplanations: {
      "Sommelier": "A sommelier specializes in wine service, selection, education, and food pairing rather than wine production.",
      "Cooper": "A cooper is a craftsperson who makes and repairs wooden barrels.",
      "Viticulturist": "A viticulturist specializes in growing and managing grapevines in the vineyard."
    }
  },
  {
    question: "What is the primary purpose of swirling wine in a glass?",
    options: ["To mix the alcohol", "To lower its temperature", "To aerate the wine and release its aromas", "To remove sediment"],
    correctAnswer: "To aerate the wine and release its aromas",
    explanation: "Swirling increases the wine's contact with air and helps volatile aromatic compounds rise from the glass, making the wine easier to smell.",
    wrongAnswerExplanations: {
      "To mix the alcohol": "Alcohol is already evenly incorporated in the wine and does not need to be mixed by swirling.",
      "To lower its temperature": "Swirling does not meaningfully chill wine and may warm it slightly through contact with the surrounding air.",
      "To remove sediment": "Sediment is separated by careful pouring or decanting, not by swirling the glass."
    }
  },
  {
    question: "What does 'body' refer to in wine tasting?",
    options: ["The wine's acidity", "The weight and fullness of the wine in the mouth", "The wine's sweetness", "The wine's age"],
    correctAnswer: "The weight and fullness of the wine in the mouth",
    explanation: "Body describes how light, medium, or full a wine feels on the palate, often compared with the differing weights of skim milk, whole milk, and cream.",
    wrongAnswerExplanations: {
      "The wine's acidity": "Acidity creates tartness and freshness, but it is only one component of a wine's overall mouthfeel.",
      "The wine's sweetness": "Sweetness comes from residual sugar and is distinct from the wine's weight or body.",
      "The wine's age": "A wine's age can affect its flavor and texture, but body does not mean how old the wine is."
    }
  },
  {
    question: "What does 'palate' refer to in wine tasting?",
    options: ["The wine's color", "The wine's aroma", "The taste and texture perceived in the mouth", "Only the lingering aftertaste"],
    correctAnswer: "The taste and texture perceived in the mouth",
    explanation: "The palate encompasses the flavors, acidity, tannins, sweetness, alcohol, body, and texture perceived while tasting wine.",
    wrongAnswerExplanations: {
      "The wine's color": "Color is evaluated visually before tasting and is not what tasters mean by the palate.",
      "The wine's aroma": "The wine's aroma is commonly called its nose, while the palate refers to sensations in the mouth.",
      "Only the lingering aftertaste": "The lingering aftertaste is the finish, which is one part of the overall palate experience."
    }
  },
  {
    question: "What is the 'finish' of a wine?",
    options: ["The last drop in the bottle", "The lingering taste after the wine is swallowed", "The end of fermentation", "The wine's clarity"],
    correctAnswer: "The lingering taste after the wine is swallowed",
    explanation: "The finish is the collection of flavors and sensations that remains after swallowing or spitting the wine; its length and character help describe wine quality.",
    wrongAnswerExplanations: {
      "The last drop in the bottle": "Finish is a tasting term, not a reference to the final amount left in a bottle.",
      "The end of fermentation": "Fermentation completion is a production stage, while finish describes the aftertaste of a wine.",
      "The wine's clarity": "Clarity describes a wine's visual appearance, not its lingering flavors."
    }
  },
  {
    question: "What is 'must' in winemaking?",
    options: ["Wine that has spoiled", "Freshly crushed grape juice containing grape solids", "Sediment left after aging", "A type of oak barrel"],
    correctAnswer: "Freshly crushed grape juice containing grape solids",
    explanation: "Must is the unfermented mixture produced after grapes are crushed, generally including juice along with skins, seeds, and sometimes stems.",
    wrongAnswerExplanations: {
      "Wine that has spoiled": "Spoiled wine is described by the specific fault present; it is not called must.",
      "Sediment left after aging": "Sediment may be called lees or deposits, depending on when and how it forms.",
      "A type of oak barrel": "Must is grape material awaiting fermentation, not a barrel or aging vessel."
    }
  },
  {
    question: "What does 'punching down' mean in red winemaking?",
    options: ["Lowering the price of the wine", "Pushing the floating cap of grape skins back into the juice", "Crushing grapes with feet", "Removing alcohol from the wine"],
    correctAnswer: "Pushing the floating cap of grape skins back into the juice",
    explanation: "During red-wine fermentation, grape skins rise and form a cap. Punching it down keeps the skins wet and continues the extraction of color, flavor, and tannin.",
    wrongAnswerExplanations: {
      "Lowering the price of the wine": "Punching down is a cellar technique and has nothing to do with wine pricing.",
      "Crushing grapes with feet": "Foot treading is a crushing or extraction technique, but it is not the specific process called punching down.",
      "Removing alcohol from the wine": "Alcohol reduction requires other processes and is unrelated to cap management."
    }
  },
  {
    question: "What is 'riddling' in sparkling wine production?",
    options: ["Guessing the grape variety", "Slowly rotating and tilting bottles to collect yeast sediment in the neck", "Adding the wine label", "Removing the cork"],
    correctAnswer: "Slowly rotating and tilting bottles to collect yeast sediment in the neck",
    explanation: "In traditional-method sparkling-wine production, riddling gradually moves the spent yeast sediment into the bottle's neck so it can be removed.",
    wrongAnswerExplanations: {
      "Guessing the grape variety": "Riddling is a production technique, not a blind-tasting exercise.",
      "Adding the wine label": "Labeling occurs after production and is unrelated to moving sediment inside the bottle.",
      "Removing the cork": "The temporary closure is removed later during disgorgement, after riddling has collected the sediment."
    }
  },
  {
    question: "What is 'disgorgement' in sparkling wine production?",
    options: ["Adding carbonation", "Expelling the collected yeast sediment from the bottle", "Blending red and white wine", "Measuring grape sugar"],
    correctAnswer: "Expelling the collected yeast sediment from the bottle",
    explanation: "After riddling, disgorgement removes the plug of yeast sediment from the bottle, leaving the sparkling wine clear before final corking.",
    wrongAnswerExplanations: {
      "Adding carbonation": "Traditional-method bubbles come from a secondary fermentation in the bottle, not from disgorgement.",
      "Blending red and white wine": "Blending may occur earlier in production and is separate from sediment removal.",
      "Measuring grape sugar": "Grape sugar is commonly measured using Brix or a similar scale, not through disgorgement."
    }
  },
  {
    question: "What is the Brix scale used to measure?",
    options: ["The acidity of finished wine", "The sugar content of grapes or juice", "The pressure in a sparkling-wine bottle", "The age of a grapevine"],
    correctAnswer: "The sugar content of grapes or juice",
    explanation: "Degrees Brix measure dissolved sugar in grape juice and help growers and winemakers assess grape ripeness and potential alcohol.",
    wrongAnswerExplanations: {
      "The acidity of finished wine": "Wine acidity is measured using pH and titratable-acidity testing rather than Brix.",
      "The pressure in a sparkling-wine bottle": "Bottle pressure is measured in units such as bars, not degrees Brix.",
      "The age of a grapevine": "Vine age is counted in years and is unrelated to the Brix scale."
    }
  },
  {
    question: "What is the period when grapes begin to change color and ripen called?",
    options: ["Bud break", "Flowering", "Veraison", "Dormancy"],
    correctAnswer: "Veraison",
    explanation: "Veraison marks the onset of ripening, when red grapes begin changing color and both red and white grapes soften and accumulate sugar.",
    wrongAnswerExplanations: {
      "Bud break": "Bud break occurs earlier, when new shoots first emerge from dormant buds.",
      "Flowering": "Flowering is when grapevine flowers bloom and are pollinated, well before ripening begins.",
      "Dormancy": "Dormancy is the vine's winter resting period after the growing season."
    }
  },
  {
    question: "How was the phylloxera crisis addressed in European vineyards?",
    options: ["By harvesting grapes earlier", "By grafting European vines onto resistant American rootstocks", "By replacing grapes with apples", "By irrigating vineyards with seawater"],
    correctAnswer: "By grafting European vines onto resistant American rootstocks",
    explanation: "European wine-grape varieties were grafted onto American rootstocks that could tolerate phylloxera, allowing the desired European fruit to grow on resistant roots.",
    wrongAnswerExplanations: {
      "By harvesting grapes earlier": "Changing harvest dates does not protect vine roots from phylloxera.",
      "By replacing grapes with apples": "The solution preserved European grape varieties rather than replacing vineyards with another crop.",
      "By irrigating vineyards with seawater": "Seawater would damage vines and was not the solution to phylloxera."
    }
  },

  // --- Additional Wine Education and Northern Virginia Geography (20 questions) ---
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
    }
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
    }
  },
  {
    "question": "What are lees in winemaking?",
    "options": [
      "Spent yeast cells and other sediment that settle after fermentation",
      "The grape skins floating during red-wine fermentation",
      "Sugar added before bottling",
      "The empty space at the top of a barrel"
    ],
    "correctAnswer": "Spent yeast cells and other sediment that settle after fermentation",
    "explanation": "Lees are deposits of spent yeast and other fine particles that settle after fermentation. Carefully aging wine on fine lees can add texture and complexity.",
    "wrongAnswerExplanations": {
      "The grape skins floating during red-wine fermentation": "Floating grape skins and solids form the cap, not the lees.",
      "Sugar added before bottling": "Sugar may be used for specific winemaking purposes, but it is not called lees.",
      "The empty space at the top of a barrel": "The empty space above wine in a barrel or bottle is called ullage."
    }
  },
  {
    "question": "What does the winemaking term 'sur lie' mean?",
    "options": [
      "Aged outdoors in direct sunlight",
      "Heated before fermentation",
      "Aged in contact with the lees",
      "Fortified with a distilled spirit"
    ],
    "correctAnswer": "Aged in contact with the lees",
    "explanation": "Sur lie means 'on the lees.' The wine remains in contact with fine yeast sediment during aging, which can add body, texture, and bread-like complexity.",
    "wrongAnswerExplanations": {
      "Aged outdoors in direct sunlight": "Sur lie describes contact with yeast sediment, not outdoor aging.",
      "Heated before fermentation": "Heating before fermentation is unrelated to sur-lie aging.",
      "Fortified with a distilled spirit": "Adding a distilled spirit creates a fortified wine; it is not sur-lie aging."
    }
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
    }
  },
  {
    "question": "What is maceration in winemaking?",
    "options": [
      "Keeping grape juice or must in contact with skins and other solids to extract color, flavor, and tannin",
      "Passing finished wine through a filter",
      "Removing a cork from a bottle",
      "Freezing grapes to concentrate their sugar"
    ],
    "correctAnswer": "Keeping grape juice or must in contact with skins and other solids to extract color, flavor, and tannin",
    "explanation": "Maceration is the period when juice or fermenting must remains in contact with grape skins and other solids, allowing color, flavor, and tannin to be extracted.",
    "wrongAnswerExplanations": {
      "Passing finished wine through a filter": "Passing wine through a filter is filtration, not maceration.",
      "Removing a cork from a bottle": "Opening a bottle has no connection to maceration.",
      "Freezing grapes to concentrate their sugar": "Frozen-grape concentration is associated with ice-wine production, not maceration."
    }
  },
  {
    "question": "What is the 'cap' during red-wine fermentation?",
    "options": [
      "The protective foil over a finished bottle",
      "A layer of tartrate crystals at the bottom of a tank",
      "The foam created when sparkling wine is poured",
      "The floating mass of grape skins and other solids pushed upward by carbon dioxide"
    ],
    "correctAnswer": "The floating mass of grape skins and other solids pushed upward by carbon dioxide",
    "explanation": "Carbon dioxide produced during fermentation pushes grape skins and other solids to the surface, where they form a cap that winemakers manage to support extraction.",
    "wrongAnswerExplanations": {
      "The protective foil over a finished bottle": "Bottle foil or capsule is packaging, not the fermentation cap.",
      "A layer of tartrate crystals at the bottom of a tank": "Tartrate crystals are harmless mineral deposits and do not form the cap.",
      "The foam created when sparkling wine is poured": "Sparkling-wine foam is called mousse; it is unrelated to the red-wine fermentation cap."
    }
  },
  {
    "question": "What does a pump-over do during red-wine fermentation?",
    "options": [
      "Presses the grapes for a second time",
      "Pumps fermenting wine from below the tank over the floating cap",
      "Forces cleaning water through an empty barrel",
      "Raises the pressure inside a sparkling-wine bottle"
    ],
    "correctAnswer": "Pumps fermenting wine from below the tank over the floating cap",
    "explanation": "During a pump-over, fermenting wine is drawn from the bottom of the vessel and distributed over the cap to keep it wet and promote color, flavor, and tannin extraction.",
    "wrongAnswerExplanations": {
      "Presses the grapes for a second time": "Pressing separates liquid from grape solids; it is different from circulating fermenting wine over the cap.",
      "Forces cleaning water through an empty barrel": "Barrel cleaning is a sanitation process, not a pump-over.",
      "Raises the pressure inside a sparkling-wine bottle": "Pump-overs manage a red-wine ferment and do not create sparkling-wine pressure."
    }
  },
  {
    "question": "What is the purpose of fining a wine?",
    "options": [
      "To increase the alcohol level",
      "To add bubbles",
      "To make the wine sweeter",
      "To add a substance that binds unwanted particles so they can be removed"
    ],
    "correctAnswer": "To add a substance that binds unwanted particles so they can be removed",
    "explanation": "Fining agents bind with selected particles or compounds so they settle or can be removed, helping clarify the wine or adjust traits such as excessive tannin.",
    "wrongAnswerExplanations": {
      "To increase the alcohol level": "Alcohol is increased through fermentation or fortification, not fining.",
      "To add bubbles": "Sparkling-wine bubbles come from fermentation or carbonation rather than fining.",
      "To make the wine sweeter": "Sweetness is adjusted through residual sugar or other approved methods, not fining."
    }
  },
  {
    "question": "What is filtration in winemaking?",
    "options": [
      "Adding sugar before fermentation",
      "Exposing the wine to air in an open tank",
      "Passing wine through a filtering medium to remove particles or microorganisms",
      "Blending wines from several vintages"
    ],
    "correctAnswer": "Passing wine through a filtering medium to remove particles or microorganisms",
    "explanation": "Filtration passes wine through a medium that can remove suspended particles and, with sufficiently fine filtration, microorganisms before bottling.",
    "wrongAnswerExplanations": {
      "Adding sugar before fermentation": "Adding sugar is a separate production decision and is not filtration.",
      "Exposing the wine to air in an open tank": "Air exposure is an oxygen-management issue, not filtration.",
      "Blending wines from several vintages": "Combining wines is blending, whereas filtration physically removes material."
    }
  },
  {
    "question": "What makes carbonic maceration different from conventional fermentation?",
    "options": [
      "The wine is aged only in new oak",
      "Whole, uncrushed grapes begin fermenting in a carbon-dioxide-rich vessel",
      "The grapes are dried before crushing",
      "The juice is frozen after fermentation"
    ],
    "correctAnswer": "Whole, uncrushed grapes begin fermenting in a carbon-dioxide-rich vessel",
    "explanation": "Carbonic maceration begins with intact grape berries in a carbon-dioxide-rich environment, encouraging fermentation inside the berries and often producing fresh, fruity wines.",
    "wrongAnswerExplanations": {
      "The wine is aged only in new oak": "Oak aging is independent of carbonic maceration.",
      "The grapes are dried before crushing": "Drying grapes concentrates them but is not carbonic maceration.",
      "The juice is frozen after fermentation": "Freezing finished juice or wine does not define carbonic maceration."
    }
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
    }
  },
  {
    "question": "What is the 'angel's share' during barrel aging?",
    "options": [
      "The first wine poured at a tasting",
      "Wine reserved for the winemaker",
      "The portion of wine lost through evaporation",
      "The sediment removed before bottling"
    ],
    "correctAnswer": "The portion of wine lost through evaporation",
    "explanation": "The angel's share is the small amount of wine that evaporates through a barrel during aging, gradually lowering the liquid level.",
    "wrongAnswerExplanations": {
      "The first wine poured at a tasting": "The phrase refers to evaporation during barrel aging, not tasting service.",
      "Wine reserved for the winemaker": "It is not a reserved allocation of wine.",
      "The sediment removed before bottling": "Sediment removal is clarification, racking, filtration, or disgorgement depending on the context."
    }
  },
  {
    "question": "What is dosage in traditional-method sparkling-wine production?",
    "options": [
      "The yeast sediment collected in the bottle neck",
      "A mixture added after disgorgement that helps set the final sweetness",
      "The pressure measurement inside the bottle",
      "The first pressing of the grapes"
    ],
    "correctAnswer": "A mixture added after disgorgement that helps set the final sweetness",
    "explanation": "After disgorgement, a small dosage—typically wine with a measured amount of sugar—is added before final corking and helps determine the sparkling wine's sweetness level.",
    "wrongAnswerExplanations": {
      "The yeast sediment collected in the bottle neck": "The sediment collected by riddling is removed during disgorgement; it is not dosage.",
      "The pressure measurement inside the bottle": "Bottle pressure is measured separately and is not called dosage.",
      "The first pressing of the grapes": "The first pressing concerns juice extraction and occurs much earlier in production."
    }
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
    }
  },
  {
    "question": "Which flavor profile is most typical of Albariño?",
    "options": [
      "Bright acidity with citrus, stone-fruit, and sometimes saline notes",
      "Low acidity with chocolate and tobacco flavors",
      "Heavy tannins with black-pepper aromas",
      "Very sweet flavors dominated by caramel"
    ],
    "correctAnswer": "Bright acidity with citrus, stone-fruit, and sometimes saline notes",
    "explanation": "Albariño is an aromatic white grape best known for lively acidity and flavors such as lemon, grapefruit, peach, and apricot, sometimes accompanied by a saline impression.",
    "wrongAnswerExplanations": {
      "Low acidity with chocolate and tobacco flavors": "Albariño is typically high in acidity and fruit-driven rather than low-acid and chocolate-like.",
      "Heavy tannins with black-pepper aromas": "Those traits are more typical of structured red wines; Albariño is a white grape with minimal tannin.",
      "Very sweet flavors dominated by caramel": "Albariño is commonly made as a dry, fresh white wine rather than a caramel-rich sweet wine."
    }
  },
  {
    "question": "Why can Northern Virginia's rolling hills be beneficial vineyard sites?",
    "options": [
      "They prevent vines from receiving direct sunlight",
      "They promote good air movement and water drainage",
      "They eliminate the need for disease management",
      "They keep vineyard soils permanently saturated"
    ],
    "correctAnswer": "They promote good air movement and water drainage",
    "explanation": "Northern Virginia's rolling terrain can provide good air and water drainage, helping move excess moisture and cool air away from vineyard sites.",
    "wrongAnswerExplanations": {
      "They prevent vines from receiving direct sunlight": "Slope direction changes sun exposure, but rolling hills do not inherently block all direct sunlight.",
      "They eliminate the need for disease management": "Virginia's humid conditions still require careful vineyard disease management.",
      "They keep vineyard soils permanently saturated": "Good sloping sites encourage drainage rather than permanent saturation."
    }
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
    }
  },
  {
    "question": "Which wine styles can Seyval Blanc produce?",
    "options": [
      "Crisp still white wines and sparkling wines",
      "Only heavy, tannic red wines",
      "Only fortified dessert wines",
      "Only skin-fermented orange wines"
    ],
    "correctAnswer": "Crisp still white wines and sparkling wines",
    "explanation": "Seyval Blanc is a white hybrid grape valued for its acidity. It can make fresh still wines and can also provide a useful base for sparkling wine.",
    "wrongAnswerExplanations": {
      "Only heavy, tannic red wines": "Seyval Blanc is a white grape and does not produce heavy red wines.",
      "Only fortified dessert wines": "It may be used in different styles, but it is not limited to fortified dessert wine.",
      "Only skin-fermented orange wines": "Seyval Blanc can be made in conventional white and sparkling styles and is not limited to orange wine."
    }
  },
  {
    "question": "Which combination does Loudoun County's crop-suitability tool use when assessing land for grapes?",
    "options": [
      "Distance from Washington, road width, and zoning district",
      "Vineyard size, bottle price, and visitor traffic",
      "Soil type, slope orientation, and slope percentage",
      "Annual rainfall and elevation only"
    ],
    "correctAnswer": "Soil type, slope orientation, and slope percentage",
    "explanation": "Loudoun County's mapping tool combines soil type, aspect—the direction a slope faces—and the percentage of slope when evaluating land for grape-growing suitability.",
    "wrongAnswerExplanations": {
      "Distance from Washington, road width, and zoning district": "Those may affect business or land-use decisions, but they are not the three physical factors used by the crop-suitability model.",
      "Vineyard size, bottle price, and visitor traffic": "These are business considerations, not geographic inputs in the suitability model.",
      "Annual rainfall and elevation only": "Weather and elevation can matter in viticulture, but the Loudoun tool specifically combines soil type, aspect, and slope percentage."
    }
  },

];
const secureRandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % maxExclusive);
    const value = new Uint32Array(1);
    do {
      globalThis.crypto.getRandomValues(value);
    } while (value[0] >= limit);
    return value[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = secureRandomInt(currentIndex + 1);
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex]
    ];
  }
  return shuffled;
};

const questionId = (question) => question?.question?.trim() || '';

const getTenRandomQuestions = (previousQuestions = []) => {
  const seen = new Set();
  const uniqueQuestions = WINE_QUIZ_QUESTIONS.filter(question => {
    const id = questionId(question);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const recentlyUsed = new Set([
    ...loadRecentQuestionIds(),
    ...previousQuestions.map(questionId)
  ]);
  const freshQuestions = uniqueQuestions.filter(question => !recentlyUsed.has(questionId(question)));
  const selected = shuffleArray(freshQuestions).slice(0, 10);

  if (selected.length < 10) {
    const selectedIds = new Set(selected.map(questionId));
    const fallback = uniqueQuestions.filter(question => !selectedIds.has(questionId(question)));
    selected.push(...shuffleArray(fallback).slice(0, 10 - selected.length));
  }

  saveRecentQuestionIds(selected.map(questionId));
  return selected;
};

const generateRoundId = () => {
  const bytes = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 0x100000000);
    bytes[1] = Math.floor(Math.random() * 0x100000000);
  }
  return `${Date.now().toString(36)}-${bytes[0].toString(36)}${bytes[1].toString(36)}`;
};

const generateGameCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => characters[secureRandomInt(characters.length)]).join('');
};

const cloneData = (value) => JSON.parse(JSON.stringify(value));

const newRoundState = () => ({
  score: 0,
  answers: {},
  scoredQuestions: {},
  feedbackByQuestion: {}
});

const normalizePlayersById = (game) => {
  const playersById = cloneData(game?.playersById || {});
  if (Array.isArray(game?.players)) {
    game.players.forEach(player => {
      if (!player?.id || playersById[player.id]) return;
      const legacyRoundId = game.roundId || 'legacy-round';
      playersById[player.id] = {
        id: player.id,
        userName: player.userName || 'Player',
        rounds: {
          [legacyRoundId]: {
            ...newRoundState(),
            score: player.score || 0
          }
        }
      };
    });
  }
  return playersById;
};

const ensurePlayerRound = (playersById, userId, userName, roundId) => {
  const player = playersById[userId] || {
    id: userId,
    userName: userName || 'Player',
    rounds: {}
  };
  player.userName = userName || player.userName || 'Player';
  player.rounds = player.rounds || {};
  player.rounds[roundId] = {
    ...newRoundState(),
    ...(player.rounds[roundId] || {})
  };
  playersById[userId] = player;
  return player.rounds[roundId];
};

const getPlayerRound = (game, userId) =>
  normalizePlayersById(game)[userId]?.rounds?.[game?.roundId || 'legacy-round'] || newRoundState();

const getPlayersForGame = (game) => {
  const roundId = game?.roundId || 'legacy-round';
  return Object.values(normalizePlayersById(game)).map(player => ({
    id: player.id,
    userName: player.userName,
    score: player.rounds?.[roundId]?.score || 0
  }));
};

const getPlayerAnswer = (game, userId, questionKey) =>
  getPlayerRound(game, userId).answers?.[questionKey]?.answer || null;

const getPlayerFeedback = (game, userId, questionKey) =>
  getPlayerRound(game, userId).feedbackByQuestion?.[questionKey] || '';

const flattenServerPendingAnswers = (gameId, pendingAnswers = {}) => {
  const flattened = [];
  Object.entries(pendingAnswers).forEach(([roundId, byQuestion]) => {
    Object.entries(byQuestion || {}).forEach(([questionKey, byPlayer]) => {
      Object.entries(byPlayer || {}).forEach(([userId, answer]) => {
        if (answer?.answer) {
          flattened.push({ ...answer, gameId, roundId, questionKey, userId });
        }
      });
    });
  });
  return flattened;
};

const removeServerPendingAnswer = (pendingAnswers, answer) => {
  const copy = cloneData(pendingAnswers || {});
  if (copy[answer.roundId]?.[answer.questionKey]) {
    delete copy[answer.roundId][answer.questionKey][answer.userId];
    if (Object.keys(copy[answer.roundId][answer.questionKey]).length === 0) {
      delete copy[answer.roundId][answer.questionKey];
    }
    if (Object.keys(copy[answer.roundId]).length === 0) {
      delete copy[answer.roundId];
    }
  }
  return copy;
};

const reconcilePendingAnswerData = (game, pendingAnswer) => {
  if (!game || !pendingAnswer?.roundId || !pendingAnswer?.questionKey) return game;
  const working = cloneData(game);
  const playersById = normalizePlayersById(working);
  const round = ensurePlayerRound(
    playersById,
    pendingAnswer.userId,
    pendingAnswer.userName,
    pendingAnswer.roundId
  );
  const existing = round.answers?.[pendingAnswer.questionKey];
  if (!existing || (pendingAnswer.answeredAt || 0) >= (existing.answeredAt || 0)) {
    round.answers[pendingAnswer.questionKey] = {
      answer: pendingAnswer.answer,
      answeredAt: pendingAnswer.answeredAt || Date.now()
    };
  }

  const result = working.questionResults?.[pendingAnswer.roundId]?.[pendingAnswer.questionKey];
  if (result && !round.scoredQuestions?.[pendingAnswer.questionKey]) {
    const isCorrect = pendingAnswer.answer === result.correctAnswer;
    round.score = (round.score || 0) + (isCorrect ? 1 : 0);
    round.scoredQuestions[pendingAnswer.questionKey] = true;
    round.feedbackByQuestion[pendingAnswer.questionKey] = isCorrect ? 'Correct!' : 'Incorrect.';
  }

  working.playersById = playersById;
  working.pendingAnswers = removeServerPendingAnswer(working.pendingAnswers, pendingAnswer);
  return working;
};

const scoreRevealedQuestionData = (game) => {
  const working = cloneData(game);
  const roundId = working.roundId || 'legacy-round';
  const questionKey = String(working.currentQuestionIndex || 0);
  const currentQuestion = working.questions?.[working.currentQuestionIndex || 0];
  if (!currentQuestion) return working;

  const playersById = normalizePlayersById(working);
  flattenServerPendingAnswers('', working.pendingAnswers).forEach(answer => {
    if (answer.roundId === roundId && answer.questionKey === questionKey) {
      const round = ensurePlayerRound(playersById, answer.userId, answer.userName, roundId);
      const existing = round.answers?.[questionKey];
      if (!existing || (answer.answeredAt || 0) >= (existing.answeredAt || 0)) {
        round.answers[questionKey] = {
          answer: answer.answer,
          answeredAt: answer.answeredAt || Date.now()
        };
      }
      working.pendingAnswers = removeServerPendingAnswer(working.pendingAnswers, answer);
    }
  });

  Object.values(playersById).forEach(player => {
    const round = ensurePlayerRound(playersById, player.id, player.userName, roundId);
    if (round.scoredQuestions?.[questionKey]) return;
    const answer = round.answers?.[questionKey]?.answer;
    if (!answer) return;
    const isCorrect = answer === currentQuestion.correctAnswer;
    round.score = (round.score || 0) + (isCorrect ? 1 : 0);
    round.scoredQuestions[questionKey] = true;
    round.feedbackByQuestion[questionKey] = isCorrect ? 'Correct!' : 'Incorrect.';
  });

  working.playersById = playersById;
  working.questionResults = working.questionResults || {};
  working.questionResults[roundId] = working.questionResults[roundId] || {};
  working.questionResults[roundId][questionKey] = {
    correctAnswer: currentQuestion.correctAnswer,
    revealedAt: Date.now()
  };
  working.revealAnswers = true;
  return working;
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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answerSyncStatus, setAnswerSyncStatus] = useState('');
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine
  );

  const syncPendingAnswer = useCallback(async (pendingAnswer) => {
    if (!db || !pendingAnswer?.gameId) return false;
    const gameDocRef = doc(
      db,
      `artifacts/${firestoreAppId}/public/data/games`,
      pendingAnswer.gameId
    );
    try {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(gameDocRef);
        if (!snapshot.exists()) return;
        const reconciled = reconcilePendingAnswerData(snapshot.data(), pendingAnswer);
        transaction.set(gameDocRef, reconciled);
      });
      removePendingAnswer(pendingAnswer);
      return true;
    } catch (syncError) {
      console.warn('Answer reconciliation will retry after reconnect:', syncError);
      return false;
    }
  }, []);

  const queuePendingAnswerWrite = useCallback(async (pendingAnswer) => {
    if (!db) return;
    const gameDocRef = doc(
      db,
      `artifacts/${firestoreAppId}/public/data/games`,
      pendingAnswer.gameId
    );
    const fieldPath = [
      'pendingAnswers',
      pendingAnswer.roundId,
      pendingAnswer.questionKey,
      pendingAnswer.userId
    ].join('.');
    await updateDoc(gameDocRef, {
      [fieldPath]: {
        answer: pendingAnswer.answer,
        answeredAt: pendingAnswer.answeredAt,
        userName: pendingAnswer.userName
      }
    });
  }, []);

  const flushPendingAnswers = useCallback(async (gameId, uid) => {
    const pending = getPendingAnswersForUser(gameId, uid);
    if (pending.length === 0) return;
    setAnswerSyncStatus('Syncing saved answer…');
    const results = await Promise.all(pending.map(syncPendingAnswer));
    setAnswerSyncStatus(
      results.every(Boolean) ? 'Answer synced.' : 'Answer saved—waiting to reconnect.'
    );
  }, [syncPendingAnswer]);

  useEffect(() => {
    let unsubscribeAuth = () => {};
    let cancelled = false;

    const initialize = async () => {
      try {
      if (!firebaseConfig.apiKey) {
        throw new Error('Firebase configuration is missing.');
      }
      app = initializeApp(firebaseConfig);
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      } catch (cacheError) {
        console.warn('Persistent Firestore cache unavailable; using standard cache:', cacheError);
        db = getFirestore(app);
      }
      auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;
        if (user) {
          setUserId(user.uid);
          const savedGame = loadActiveGame();
          let resolvedName = savedGame?.userName || '';
          try {
            const userProfileRef = doc(
              db,
              'artifacts',
              firestoreAppId,
              'users',
              user.uid,
              'profile',
              'userProfile'
            );
            const profileSnapshot = await getDoc(userProfileRef);
            resolvedName = profileSnapshot.data()?.userName || resolvedName;
          } catch (profileError) {
            console.warn('Using locally saved identity while offline:', profileError);
          }

          setUserName(resolvedName);
          setNameInput(resolvedName);
          if (savedGame?.gameId && resolvedName) {
            setActiveGameId(savedGame.gameId);
            setMode('multiplayer');
          } else {
            setMode(resolvedName ? 'initial' : 'enterName');
          }
          setIsAuthReady(true);
          setLoading(false);
        } else {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        }
      });
      } catch (e) {
        console.error("Error initializing Firebase:", e);
        setError("Failed to initialize Firebase. Please try again later.");
        setLoading(false);
      }
    };

    initialize();
    return () => {
      cancelled = true;
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && activeGameId && userId) {
      flushPendingAnswers(activeGameId, userId);
    }
  }, [isOnline, activeGameId, userId, flushPendingAnswers]);

  useEffect(() => {
    let unsubscribe;
    if (mode === 'multiplayer' && activeGameId && isAuthReady && userId) {
      const normalizedGameId = activeGameId.toUpperCase();
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedGameId);
      unsubscribe = onSnapshot(gameDocRef, { includeMetadataChanges: true }, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGameData(data);
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          setQuizEnded(data.quizEnded || false);
          setQuestions(data.questions || []);
          setScore(getPlayerRound(data, userId).score || 0);
          const questionKey = String(data.currentQuestionIndex || 0);
          const localPending = getPendingAnswer(
            normalizedGameId,
            data.roundId,
            questionKey,
            userId
          );
          const answer = localPending?.answer || getPlayerAnswer(data, userId, questionKey);
          setSelectedAnswer(answer);
          setAnswerSelected(Boolean(answer));
          setFeedback(getPlayerFeedback(data, userId, questionKey));
          if (docSnap.metadata.hasPendingWrites) {
            setAnswerSyncStatus('Answer saved on this device—syncing…');
          } else if (answer) {
            setAnswerSyncStatus('Answer synced.');
          }
          saveActiveGame(normalizedGameId, userName);
          flushPendingAnswers(normalizedGameId, userId);
        } else {
          setError('Game not found or ended.');
          setActiveGameId(null);
          setGameData(null);
          setMode('multiplayer');
          removeLocalState();
        }
      }, (err) => {
        console.error("Error listening to game updates:", err);
        setAnswerSyncStatus('Offline—saved answers will sync automatically.');
      });
    }
    return () => unsubscribe?.();
  }, [mode, activeGameId, isAuthReady, userId, userName, flushPendingAnswers]);

  useEffect(() => {
    if (
      mode !== 'multiplayer' ||
      !activeGameId ||
      !gameData ||
      gameData.hostId !== userId
    ) return;

    const pending = flattenServerPendingAnswers(activeGameId, gameData.pendingAnswers);
    pending.forEach(syncPendingAnswer);
  }, [mode, activeGameId, gameData, userId, syncPendingAnswer]);

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
    setQuestions(getTenRandomQuestions(questions)); // Avoid immediate repeats
  };

  // --- Multiplayer Logic ---
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
      const roundId = generateRoundId();

      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, newGameId);
      await setDoc(gameDocRef, {
        hostId: userId,
        hostName: userName,
        currentQuestionIndex: 0,
        quizEnded: false,
        revealAnswers: false,
        roundId,
        players: [], // Retain the original field expected by existing Firestore rules.
        playersById: {},
        pendingAnswers: {},
        questionResults: {},
        questions: selectedGameQuestions,
        createdAt: new Date().toISOString(),
      });
      saveActiveGame(newGameId, userName);
      setActiveGameId(newGameId);
      setMode('multiplayer');
      setLoading(false);
    } catch (e) {
      console.error("Error creating game:", e);
      const errorCode = e?.code ? ` (${e.code})` : '';
      setError(`Failed to create a new game.${errorCode}`);
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
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(gameDocRef);
        if (!snapshot.exists()) {
          throw new Error('GAME_NOT_FOUND');
        }
        const data = snapshot.data();
        const roundId = data.roundId || 'legacy-round';
        const playersById = normalizePlayersById(data);
        ensurePlayerRound(playersById, userId, userName, roundId);
        transaction.update(gameDocRef, {
          playersById,
          roundId
        });
      });
      saveActiveGame(normalizedIdToJoin, userName);
      setActiveGameId(normalizedIdToJoin);
      setMode('multiplayer');
      setLoading(false);
    } catch (e) {
      console.error("Error joining game:", e);
      setError(
        e.message === 'GAME_NOT_FOUND'
          ? 'Game ID not found. Please check the code and try again.'
          : 'Failed to join the game.'
      );
      setLoading(false);
    }
  };

  const handleMultiplayerAnswerClick = (selectedOption) => {
    if (!gameData || gameData.revealAnswers || gameData.quizEnded) {
      setError("Answers have been revealed or quiz is over. Cannot change answer.");
      return;
    }

    const roundId = gameData.roundId || 'legacy-round';
    const questionKey = String(gameData.currentQuestionIndex || 0);
    const pendingAnswer = {
      gameId: activeGameId,
      roundId,
      questionKey,
      userId,
      userName,
      answer: selectedOption,
      answeredAt: Date.now()
    };

    savePendingAnswer(pendingAnswer);
    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);
    setFeedback('');
    setAnswerSyncStatus(
      isOnline ? 'Answer saved—syncing…' : 'Offline—answer saved on this device.'
    );

    queuePendingAnswerWrite(pendingAnswer)
      .then(() => {
        if (navigator.onLine) {
          syncPendingAnswer(pendingAnswer).then(synced => {
            setAnswerSyncStatus(
              synced ? 'Answer synced.' : 'Answer saved—waiting to reconnect.'
            );
          });
        }
      })
      .catch(queueError => {
        console.warn('Answer retained locally until Firestore is available:', queueError);
        setAnswerSyncStatus('Answer saved—waiting to reconnect.');
      });
  };

  const handleMultiplayerNextQuestion = async () => {
    if (!gameData || gameData.hostId !== userId) {
      setError("Only the Proctor (host) can advance questions.");
      return;
    }
    if (!gameData.revealAnswers) {
      setError("Please reveal answers before proceeding to the next question.");
      return;
    }

    setFeedback('');
    setAnswerSelected(false);
    setSelectedAnswer(null);
    setAnswerSyncStatus('');
    const nextIndex = gameData.currentQuestionIndex + 1;
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);

    if (nextIndex < gameData.questions.length) {
      try {
        await updateDoc(gameDocRef, { 
          currentQuestionIndex: nextIndex, 
          revealAnswers: false
        });
      } catch (e) {
        console.error("Error advancing question:", e);
        setError("Failed to advance question.");
      }
    } else {
      try {
        await updateDoc(gameDocRef, { quizEnded: true });
      } catch (e) {
        console.error("Error ending quiz:", e);
        setError("Failed to end quiz.");
      }
    }
  };

  const restartMultiplayerQuiz = async () => {
    if (!gameData || gameData.hostId !== userId) {
      setError("Only the Proctor (host) can restart the quiz.");
      return;
    }

    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const newRandomQuestions = getTenRandomQuestions(gameData.questions || []);
    const newRoundId = generateRoundId();

    try {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(gameDocRef);
        if (!snapshot.exists()) throw new Error('Game no longer exists.');
        const latest = snapshot.data();
        const playersById = normalizePlayersById(latest);
        Object.values(playersById).forEach(player => {
          ensurePlayerRound(playersById, player.id, player.userName, newRoundId);
        });
        transaction.update(gameDocRef, {
          currentQuestionIndex: 0,
          quizEnded: false,
          revealAnswers: false,
          roundId: newRoundId,
          playersById,
          questions: newRandomQuestions
        });
      });
    } catch (e) {
      console.error("Error restarting multiplayer quiz:", e);
      setError("Failed to restart multiplayer quiz.");
    }
  };

  const revealAnswersToAll = async () => {
    if (!gameData || gameData.hostId !== userId) {
      setError("Only the Proctor (host) can reveal answers.");
      return;
    }

    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    try {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(gameDocRef);
        if (!snapshot.exists()) throw new Error('Game no longer exists.');
        const scoredGame = scoreRevealedQuestionData(snapshot.data());
        transaction.set(gameDocRef, scoredGame);
      });
    } catch (e) {
      console.error("Error revealing answers:", e);
      setError("Failed to reveal answers.");
    }
  };

  // Render based on mode
const renderContent = () => {
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
            setQuestions(getTenRandomQuestions());
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
    // MOVED: Single player specific calculations here
    if (!Array.isArray(questions) || questions.length === 0) {
      return <p className="text-center text-gray-700">Loading questions...</p>;
    }

    const currentQuestion = questions[currentQuestionIndex];
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
            
               <a href="https://www.vineyardvoyages.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold
                               hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl"
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
  } else if (mode === 'multiplayer' && activeGameId) {
    // MOVED: Multiplayer calculations ONLY inside this block
    const safeGameData = gameData || { 
      playersById: {},
      questions: [], 
      currentQuestionIndex: 0, 
      quizEnded: false, 
      hostId: '', 
      hostName: '', 
      revealAnswers: false 
    };

    // Wait for game data to be populated
    if (!Array.isArray(safeGameData.questions) || safeGameData.questions.length === 0) {
      return (
        <div className="text-center space-y-4">
          <p className="text-gray-700">Waiting for game data from Firestore...</p>
          <p className="text-sm text-gray-500">Game ID: {activeGameId}</p>
        </div>
      );
    }

    const isHost = safeGameData.hostId === userId;
    const currentQuestion = safeGameData.questions[safeGameData.currentQuestionIndex] || {
      options: [],
      correctAnswer: '',
      question: '',
      explanation: ''
    };

    const currentPlayersArray = getPlayersForGame(safeGameData);
    const sortedPlayers = [...currentPlayersArray].sort((a, b) => (b.score || 0) - (a.score || 0));
    const currentPlayerRank = sortedPlayers.length > 0 ? sortedPlayers.findIndex(p => p.id === userId) + 1 : 0;

    const getWinners = () => {
      if (!Array.isArray(sortedPlayers) || sortedPlayers.length === 0) return [];
      const topScore = sortedPlayers[0].score || 0;
      return sortedPlayers.filter(player => (player.score || 0) === topScore);
    };
    const winners = getWinners();

    const questionKey = String(safeGameData.currentQuestionIndex || 0);
    const localPendingAnswer = getPendingAnswer(
      activeGameId,
      safeGameData.roundId,
      questionKey,
      userId
    );
    const playerSelectedAnswer =
      localPendingAnswer?.answer || getPlayerAnswer(safeGameData, userId, questionKey);
    const playerFeedback = getPlayerFeedback(safeGameData, userId, questionKey);

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
                  ${safeGameData.revealAnswers && option === currentQuestion.correctAnswer ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-gray-100 text-gray-800'}`}>
                  {option}
                </div>
              ))}
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
                  ${playerSelectedAnswer === option ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40'}
                  ${safeGameData.revealAnswers
                    ? option === currentQuestion.correctAnswer
                      ? '!bg-green-500 text-white ring-2 ring-green-700'
                      : option === playerSelectedAnswer
                        ? '!bg-red-500 text-white ring-2 ring-red-700'
                        : 'cursor-not-allowed opacity-50'
                    : ''
                  }
                  ${!safeGameData.revealAnswers && 'hover:scale-[1.02]'}
                `}
              >
                {option}
              </button>
            ))
          )}
        </div>

        {!isHost && answerSyncStatus && (
          <p className={`text-center text-sm font-semibold ${
            answerSyncStatus === 'Answer synced.' ? 'text-green-700' : 'text-amber-700'
          }`}>
            {answerSyncStatus}
          </p>
        )}

        {!isHost && !isOnline && (
          <p className="text-center text-sm text-amber-700">
            You are offline. Keep this page open; your answer will post automatically when you reconnect.
          </p>
        )}

        {!isHost && safeGameData.revealAnswers && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 shadow-inner">
            {playerFeedback && (
              <p className={`text-lg font-bold ${
                playerFeedback === 'Correct!' ? 'text-green-600' : 'text-red-600'
              }`}>
                {playerFeedback}
              </p>
            )}
            {!playerFeedback && playerSelectedAnswer && (
              <p className="text-amber-700 font-semibold">Your saved answer is still syncing.</p>
            )}
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Correct Answer:</span> {currentQuestion.correctAnswer}
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Explanation:</span> {currentQuestion.explanation}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {isHost && (
            <>
              <p className="text-gray-700 text-center">
                <span className="font-semibold text-green-600">Correct Answer:</span> {currentQuestion.correctAnswer}
              </p>
              <p className="text-gray-700 text-center">
                <span className="font-semibold">Explanation:</span> {currentQuestion.explanation}
              </p>
            </>
          )}

          {isHost && !safeGameData.quizEnded && (
            <div className="flex gap-4">
              {!safeGameData.revealAnswers ? (
                <button
                  onClick={revealAnswersToAll}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg text-xl font-bold
                                       hover:bg-orange-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Reveal Answers (Score)
                </button>
              ) : (
                <button
                  onClick={handleMultiplayerNextQuestion}
                  disabled={!safeGameData.revealAnswers}
                  className="flex-1 bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold
                                       hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {safeGameData.currentQuestionIndex < safeGameData.questions.length - 1 ? 'Next Question' : 'End Game'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Player Scores:</h3>
          <ul className="space-y-2">
            {sortedPlayers.map(player => (
              <li key={player.id} className="flex justify-between items-center text-lg text-gray-700">
                <span className="font-semibold">
                  {player.userName}
                  {player.id === safeGameData.hostId ? (
                    <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-xs font-semibold rounded-full">Proctor</span>
                  ) : (
                    <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-xs font-semibold rounded-full">Player</span>
                  )}
                </span>
                <span className="font-bold text-[#6b2a58]">{player.score || 0}</span>
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
                className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold mr-4
                                   hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Restart Game
</button>
            )}
            
             <a href="https://www.vineyardvoyages.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold
                               hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl"
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
            setAnswerSyncStatus('');
            removeLocalState();
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
        <div className="min-h-screen bg-gradient-to-br from-[#6b2a58] via-[#6b2a58] to-[#9CAC3E]"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1656873592841-8ae63d15be24?auto=format&fit=crop&w=1920&q=85")',
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

          </div>
        </div>
      );
};

export default App;
