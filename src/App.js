import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase Configuration (will read from Netlify Environment Variable)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY, // This will be read from Netlify Environment Variable
  authDomain: "vineyardvoyagesquiz.firebaseapp.com",
  projectId: "vineyardvoyagesquiz",
  storageBucket: "vineyardvoyagesquiz.appspot.com",
  messagingSenderId: "429604849897",
  appId: "1:429604849897:web:481e9ade4e745ae86f8878",
  measurementId: "G-KBLZD8FSEM"
};

// Use projectId for Firestore paths to avoid issues with special characters in appId
const firestoreAppId = firebaseConfig.projectId;
const appId = firebaseConfig.appId; // Retained for consistency, but firestoreAppId is used for database paths
const initialAuthToken = null; // Keep this as null unless you have a specific custom auth token

// Initialize Firebase globally to avoid re-initialization
let app;
let db;
let auth;

// Extensive list of wine varietals with their countries of origin (Canada excluded)
// This array is now only used for quiz questions, not for assigning user names.
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
  { name: "Marechal Foch", country": "USA" },
  { name: "Leon Millot", country: "USA" },
];

// Full bank of 100 beginner-level questions (no direct Vineyard Voyages mentions)
// Approximately 50 general, 50 Northern Virginia specific
const WINE_QUIZ_QUESTIONS = [
  // General Wine Knowledge (50 questions)
  {
    question: "Which of the following is a red grape varietal?",
    options: ["Chardonnay", "Sauvignon Blanc", "Merlot", "Pinot Grigio"],
    correctAnswer: "Merlot",
    explanation: "Merlot is a popular red grape varietal known for its soft, approachable wines."
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
    question: "Which white grape is typically used to make dry, aromatic wines in the Loire Valley, France?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc is the key grape in regions like Sancerre and Pouilly-Fumé in the Loire Valley, producing crisp, mineral-driven wines."
  },
  {
    question: "What is a 'Proctor'?",
    options: ["A winemaker", "A wine critic", "A trained and knowledgeable wine professional", "A wine seller"],
    correctAnswer: "A trained and knowledgeable wine professional",
    explanation: "A Proctor is a highly trained and knowledgeable wine professional, typically working in fine dining restaurants, now serving as the moderator."
  },
  {
    question: "Which of these is a sweet, fortified wine from Portugal?",
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
    question: "What is the term for the 'legs' or 'tears' that form on the inside of a wine glass?",
    options: ["Viscosity", "Acidity", "Alcohol content", "Tannin level"],
    correctAnswer: "Alcohol content",
    explanation: "Wine legs are an indicator of a wine's alcohol content and, to some extent, its glycerol content, which contributes to viscosity."
  },
  {
    question: "Which of these is a common fault in wine, often described as smelling like wet cardboard or moldy basement?",
    options: ["Brettanomyces", "Cork taint (TCA)", "Oxidation", "Volatile Acidity"],
    correctAnswer: "Cork taint (TCA)",
    explanation: "Cork taint, caused by TCA, is a common wine fault that imparts unpleasant musty or moldy aromas."
  },
  {
    question: "Which type of wine is typically served with oysters?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Merlot"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Crisp, high-acid white wines like Sauvignon Blanc are excellent pairings for oysters, as they cut through the brininess."
  },
  {
    question: "Which noble rot-affected sweet wine, often described as liquid gold, comes from a specific region in Bordeaux and is typically made from Sémillon, Sauvignon Blanc, and Muscadelle grapes?",
    options: ["Tokaji", "Ice Wine", "Sauternes", "Port"],
    correctAnswer: "Sauternes",
    explanation: "Sauternes is a highly prized sweet wine from the Bordeaux region of France, made from grapes affected by Botrytis cinerea (noble rot)."
  },
  {
    question: "What is the primary grape used in the production of Chianti wine?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Sangiovese is the signature red grape of Tuscany, Italy, and the primary component of Chianti wine."
  },
  {
    question: "Which wine glass shape is generally recommended for enjoying red wines?",
    options: ["Flute", "Coupe", "Tulip", "Bordeaux or Burgundy glass"],
    correctAnswer: "Bordeaux or Burgundy glass",
    explanation: "Larger, wider-bowled glasses (like Bordeaux or Burgundy) allow red wines to breathe and express their aromas fully."
  },
  {
    question: "What is the term for the sediment found in aged red wines?",
    options: ["Tartrates", "Lees", "Fining agents", "Dregs"],
    correctAnswer: "Dregs",
    explanation: "Dregs refer to the sediment, typically consisting of dead yeast cells, grape solids, and tartrates, found at the bottom of bottles of aged wine."
  },
  {
    question: "This dark-skinned grape is famously called Shiraz in Australia and is known for producing full-bodied, spicy red wines in the Rhône Valley of France. What is its name?",
    options: ["Pinot Noir", "Merlot", "Syrah", "Zinfandel"],
    correctAnswer: "Syrah",
    explanation: "Syrah (or Shiraz) is a versatile dark-skinned grape known for producing powerful, peppery, and dark-fruited wines in both the Old and New World."
  },
  {
    question: "What is 'vintage' on a wine label?",
    options: ["The year the wine was bottled", "The year the grapes were harvested", "The age of the winery", "The specific vineyard site"],
    correctAnswer: "The year the grapes were harvested",
    explanation: "The vintage year on a wine label indicates when the grapes used to make that wine were picked."
  },
  {
    question: "Which of these is a common characteristic of an 'oaked' Chardonnay?",
    options: ["Light and crisp", "Notes of butter, vanilla, and toast", "High acidity and citrus", "Sweet and fruity"],
    correctAnswer: "Notes of butter, vanilla, and toast",
    explanation: "Aging Chardonnay in oak barrels imparts flavors and aromas of butter, vanilla, and toast."
  },
  {
    question: "What is the purpose of 'decanting' wine?",
    options: ["To chill the wine", "To remove sediment and allow the wine to breathe", "To add flavors to the wine", "To warm the wine"],
    correctAnswer: "To remove sediment and allow the wine to breathe",
    explanation: "Decanting separates sediment from the wine and exposes the wine to oxygen, helping it open up and develop aromas."
  },
  {
    question: "Which Italian wine is famous for being produced in the Piedmont region and made from Nebbiolo grapes?",
    options: ["Chianti", "Prosecco", "Barolo", "Soave"],
    correctAnswer: "Barolo",
    explanation: "Barolo is a highly esteemed red wine from Piedmont, Italy, known for its powerful tannins and aging potential, made from Nebbiolo grapes."
  },
  {
    question: "What is the term for a wine that tastes sweet?",
    options: ["Dry", "Off-dry", "Sweet", "Semi-sweet"],
    correctAnswer: "Sweet",
    explanation: "A sweet wine has a noticeable amount of residual sugar, making it taste sweet."
  },
  {
    question: "Which region is known for producing high-quality Riesling wines?",
    options: ["Bordeaux, France", "Mosel, Germany", "Napa Valley, USA", "Tuscany, Italy"],
    correctAnswer: "Mosel, Germany",
    explanation: "The Mosel region in Germany is world-renowned for its crisp, aromatic, and often off-dry Riesling wines."
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
    explanation: "The key difference is that red wines get their color, tannins, and much of their flavor from fermenting with the grape skins, while white wines are usually pressed before fermentation."
  },
  {
    question: "Which of these is a common food pairing for Pinot Noir?",
    options: ["Grilled steak", "Spicy Asian cuisine", "Salmon or duck", "Heavy cream sauces"],
    correctAnswer: "Salmon or duck",
    explanation: "Pinot Noir's lighter body and red fruit notes make it an excellent match for fattier fish like salmon and poultry like duck."
  },
  {
    question: "What is the term for the natural sugars remaining in wine after fermentation?",
    options: ["Glucose", "Fructose", "Residual Sugar", "Sucrose"],
    correctAnswer: "Residual Sugar",
    explanation: "Residual sugar (RS) refers to the grape sugars that are not converted into alcohol during fermentation, contributing to a wine's sweetness."
  },
  {
    question: "Which grape is known for producing full-bodied, often spicy red wines in the Rhône Valley, France?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Merlot"],
    correctAnswer: "Syrah",
    explanation: "Syrah (or Shiraz) is the dominant red grape in the Northern Rhône, producing powerful, peppery, and dark-fruited wines."
  },
  {
    question: "What is the typical alcohol content of a dry table wine?",
    options: ["2-5%", "8-10%", "11-15%", "18-20%"],
    correctAnswer: "11-15%",
    explanation: "Most dry table wines fall within the 11-15% ABV (Alcohol by Volume) range."
  },
  {
    question: "Which of these is a common characteristic of a 'dry' wine?",
    options: ["Sweet taste", "Absence of sweetness", "High acidity", "Low alcohol"],
    correctAnswer: "Absence of sweetness",
    explanation: "A dry wine is one in which all or most of the grape sugars have been converted to alcohol during fermentation, resulting in no perceptible sweetness."
  },
  {
    question: "What is the name of the white wine region in Burgundy, France, famous for unoaked Chardonnay?",
    options: ["Pouilly-Fumé", "Sancerre", "Chablis", "Vouvray"],
    correctAnswer: "Chablis",
    explanation: "Chablis is a sub-region of Burgundy known for producing crisp, mineral-driven Chardonnay wines that are typically unoaked."
  },
  {
    question: "Which grape varietal is often described as having notes of blackcurrant, cedar, and tobacco?",
    options: ["Pinot Noir", "Merlot", "Cabernet Sauvignon", "Zinfandel"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon is renowned for its classic aromas and flavors of blackcurrant (cassis), alongside herbal, cedar, and tobacco notes."
  },
  {
    question: "What is the term for the process of allowing wine to age in the bottle before release?",
    options: ["Malolactic fermentation", "Racking", "Bottle aging", "Fining"],
    correctAnswer: "Bottle aging",
    explanation: "Bottle aging allows wine to develop more complex flavors and aromas over time."
  },
  {
    question: "Which type of wine is typically served as an aperitif (before a meal)?",
    options: ["Sweet dessert wine", "Full-bodied red wine", "Dry sparkling wine", "Oaked Chardonnay"],
    correctAnswer: "Dry sparkling wine",
    explanation: "Dry sparkling wines like Brut Champagne or Cava are excellent aperitifs, stimulating the palate without being too heavy."
  },
  {
    question: "What is a 'blend' in winemaking?",
    options: ["Mixing different vintages of the same wine", "Mixing different grape varietals to create a single wine", "Adding water to wine", "Filtering wine"],
    correctAnswer: "Mixing different grape varietals to create a single wine",
    explanation: "A wine blend combines two or more different grape varietals to achieve a desired balance of flavors, aromas, and structure."
  },
  {
    question: "Which of these is a common characteristic of a 'full-bodied' wine?",
    options: ["Light and watery texture", "Rich, heavy, and mouth-filling sensation", "High acidity", "Sweet taste"],
    correctAnswer: "Rich, heavy, and mouth-filling sensation",
    explanation: "Full-bodied wines have a rich, weighty, and sometimes viscous feel in the mouth, often due to higher alcohol content and extract."
  },
  {
    question: "What is the purpose of a wine 'stopper' or 'preserver'?",
    options: ["To chill the wine", "To remove sediment", "To prevent oxidation and keep wine fresh after opening", "To add bubbles"],
    correctAnswer: "To prevent oxidation and keep wine fresh after opening",
    explanation: "Wine stoppers and preservers are designed to create an airtight seal or remove oxygen from an opened bottle, extending the wine's freshness."
  },
  {
    question: "Which grape varietal is the primary component of most white wines from Alsace, France?",
    options: ["Chardonnay", "Sauvignon Blanc", "Riesling", "Pinot Grigio"],
    correctAnswer: "Riesling",
    explanation: "Alsace is unique in France for producing varietally labeled wines, with Riesling being one of its noble grapes."
  },
  {
    question: "What is the term for the practice of cultivating grapes for winemaking?",
    options: ["Agriculture", "Horticulture", "Viticulture", "Vinification"],
    correctAnswer: "Viticulture",
    explanation: "Viticulture is the science, production, and study of grapes, which primarily deals with grape cultivation for wine."
  },
  {
    question: "Which of these is a common aroma found in Sauvignon Blanc?",
    options: ["Black cherry", "Vanilla", "Grass or gooseberry", "Chocolate"],
    correctAnswer: "Grass or gooseberry",
    explanation: "Sauvignon Blanc is often characterized by its herbaceous notes, including grass, bell pepper, and gooseberry."
  },
  {
    question: "What is the name of the sweet wine made from grapes frozen on the vine?",
    options: ["Port", "Sherry", "Ice Wine", "Marsala"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine (or Eiswein) is a type of dessert wine produced from grapes that have been frozen while still on the vine."
  },
  {
    question: "Which red grape is a key component of 'Super Tuscan' wines?",
    options: ["Nebbiolo", "Sangiovese", "Primitivo", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "While Super Tuscans often include international varietals like Cabernet Sauvignon, Sangiovese remains the backbone of many, if not all, of them."
  },
  {
    question: "What does 'DOCG' signify on an Italian wine label?",
    options: ["Denomination of Controlled Origin", "Highest level of Italian wine classification", "Table wine", "Sweet wine"],
    correctAnswer: "Highest level of Italian wine classification",
    explanation: "DOCG (Denominazione di Origine Controllata e Garantita) is the highest classification for Italian wines, indicating strict quality control."
  },
  {
    question: "Which of these is typically a light-bodied red wine?",
    options: ["Cabernet Sauvignon", "Syrah", "Pinot Noir", "Zinfandel"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir is known for its delicate structure and lighter body compared to other red varietals."
  },
  {
    question: "What is the term for the 'bouquet' of a wine?",
    options: ["Its color", "Its taste", "Its aromas developed from aging", "Its sweetness level"],
    correctAnswer: "Its aromas developed from aging",
    explanation: "The bouquet refers to the complex aromas that develop in a wine as a result of fermentation and aging, particularly in the bottle."
  },
  {
    question: "Which white grape is known for producing full-bodied, often buttery wines, especially when oaked?",
    options: ["Riesling", "Sauvignon Blanc", "Pinot Grigio", "Chardonnay"],
    correctAnswer: "Chardonnay",
    explanation: "Chardonnay is a versatile grape that can produce a wide range of styles, but it's particularly known for its full-bodied, buttery, and often oak-influenced expressions."
  },
  {
    question: "What is the ideal temperature range for storing most wines long-term?",
    options: ["30-40°F", "45-65°F", "70-80°F", "Below 30°F"],
    correctAnswer: "45-65°F",
    explanation: "Most wines are best stored at a consistent temperature between 45-65°F (7-18°C) to ensure proper aging and prevent spoilage."
  },
  {
    question: "Which of these terms describes a wine with high acidity?",
    options: ["Flabby", "Crisp", "Soft", "Round"],
    correctAnswer: "Crisp",
    explanation: "A wine with high acidity is often described as 'crisp' or 'tart,' providing a refreshing sensation on the palate."
  },
  {
    question: "What is the purpose of 'sulfur dioxide' (SO2) in winemaking?",
    options: ["To add sweetness", "To remove color", "As an antioxidant and antimicrobial agent", "To increase alcohol content"],
    correctAnswer: "As an antioxidant and antimicrobial agent",
    explanation: "SO2 is commonly used in winemaking to protect the wine from oxidation and inhibit unwanted microbial growth."
  },
  {
    question: "Which grape is used to make the famous sparkling wine Prosecco?",
    options: ["Chardonnay", "Pinot Noir", "Glera", "Riesling"],
    correctAnswer: "Glera",
    explanation: "Prosecco is an Italian sparkling wine made primarily from the Glera grape."
  },
  {
    question: "What is the term for a wine that has a strong, unpleasant smell of vinegar?",
    options: ["Oxidized", "Corked", "Volatile Acidity", "Brettanomyces"],
    correctAnswer: "Volatile Acidity",
    explanation: "Volatile acidity (VA) is a wine fault characterized by aromas of vinegar or nail polish remover, caused by acetic acid bacteria."
  },
  {
    question: "Which type of wine is typically served with chocolate desserts?",
    options: ["Dry red wine", "Dry white wine", "Sweet fortified wine (e.g., Port)", "Sparkling wine"],
    correctAnswer: "Sweet fortified wine (e.g., Port)",
    explanation: "Sweet, rich wines like Port or Banyuls pair well with chocolate, as their sweetness and intensity can stand up to the dessert."
  },
  {
    question: "What does 'non-vintage' (NV) mean on a sparkling wine label?",
    options: ["It's a very old wine", "It's a blend of wines from different harvest years", "It's a low-quality wine", "It's a wine made without grapes"],
    correctAnswer: "It's a blend of wines from different harvest years",
    explanation: "Non-vintage sparkling wines are blends of wines from multiple years, created to maintain a consistent house style."
  },
  {
    question: "Which of these is a common characteristic of a 'tannic' red wine?",
    options: ["Smooth and soft", "Drying sensation in the mouth", "Fruity and sweet", "Light-bodied"],
    correctAnswer: "Drying sensation in the mouth",
    explanation: "Tannins create a drying, sometimes bitter, sensation in the mouth, especially noticeable on the gums and tongue."
  },
  {
    question: "What is the term for the process of removing dead yeast cells and other solids from wine after fermentation?",
    options: ["Racking", "Fining", "Filtration", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Racking, fining, and filtration are all methods used to clarify wine by removing suspended solids and impurities."
  },
  {
    question: "Which grape varietal is the most widely planted in the world?",
    options: ["Merlot", "Airén", "Cabernet Sauvignon", "Chardonnay"],
    correctAnswer: "Airén",
    explanation: "While Cabernet Sauvignon and Merlot are very popular, Airén, a white grape primarily grown in Spain, historically holds the title for most widely planted by area, though its plantings have been declining and Chardonnay is now the most widely planted white wine grape."
  },
  {
    question: "What is the name of the sweet, fortified wine from Jerez, Spain?",
    options: ["Port", "Madeira", "Sherry", "Marsala"],
    correctAnswer: "Sherry",
    explanation: "Sherry is a fortified wine made from white grapes that are grown near the city of Jerez de la Frontera in Andalusia, Spain."
  },
  {
    question: "Which of these is a common aroma found in aged Pinot Noir?",
    options: ["Green apple", "Citrus", "Forest floor or mushroom", "Tropical fruit"],
    correctAnswer: "Forest floor or mushroom",
    explanation: "As Pinot Noir ages, it often develops complex tertiary aromas of forest floor, mushroom, and savory notes."
  },
  {
    question: "What is the term for the 'body' of a wine?",
    options: ["Its color intensity", "Its perceived weight or fullness in the mouth", "Its sweetness level", "Its alcohol content"],
    correctAnswer: "Its perceived weight or fullness in the mouth",
    explanation: "The body of a wine refers to its perceived weight and fullness on the palate, often influenced by alcohol, residual sugar, and extract."
  },
  {
    question: "Which type of wine is typically served very chilled, often as a dessert wine?",
    options: ["Dry red wine", "Dry white wine", "Ice Wine", "Rosé wine"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine (or Eiswein) is a sweet dessert wine that is best served very chilled to enhance its sweetness and acidity."
  },
  {
    question: "Which grape varietal is considered Virginia's signature white grape?",
    options: ["Chardonnay", "Viognier", "Sauvignon Blanc", "Albariño"],
    correctAnswer: "Viognier",
    explanation: "Viognier is Virginia's official state grape, known for its aromatic and full-bodied white wines that thrives in the state's climate."
  },
  {
    question: "Which Virginia AVA is known for its high-quality Chardonnay and Cabernet Franc, located near the town of Middleburg?",
    options: ["Monticello AVA", "Virginia Peninsula AVA", "Middleburg AVA", "Shenandoah Valley AVA"],
    correctAnswer: "Middleburg AVA",
    explanation: "The Middleburg AVA (American Viticultural Area) is a prominent wine region in Northern Virginia, known for its rolling hills and diverse soils."
  },
  {
    question: "Which red grape varietal is often referred to as 'Virginia's answer to Cabernet Franc' due to its success in the state?",
    options: ["Merlot", "Cabernet Franc", "Petit Verdot", "Norton"],
    correctAnswer: "Cabernet Franc",
    explanation: "Cabernet Franc thrives in Virginia's climate, producing wines with red fruit, herbal notes, and often a distinctive peppery character."
  },
  {
    question: "What is a common challenge for grape growing in Northern Virginia's climate?",
    options: ["Too much sun", "Lack of rainfall", "Humidity and late spring frosts", "Too cold in winter"],
    correctAnswer: "Humidity and late spring frosts",
    explanation: "Virginia's humid summers and unpredictable spring frosts can pose significant challenges for grape growers, requiring careful vineyard management."
  },
  {
    question: "Which famous Northern Virginia town is often considered a hub for the region's wine country?",
    options: ["Leesburg", "Front Royal", "Warrenton", "Middleburg"],
    correctAnswer: "Middleburg",
    explanation: "Middleburg is a charming town in Loudoun County, often referred to as the 'Nation's Horse and Hunt Capital,' and a central point for many wineries."
  },
  {
    question: "Many Virginia wineries are located in Loudoun County. What is Loudoun County often called in relation to wine?",
    options: ["Virginia's Wine Coast", "Virginia's Wine Gateway", "DC's Wine Country®", "Virginia's Wine Capital"],
    correctAnswer: "DC's Wine Country®",
    explanation: "Loudoun County is home to over 40 wineries and is widely recognized as DC's Wine Country®."
  },
  {
    question: "What is a common red grape varietal grown in Northern Virginia, known for its deep color and firm tannins?",
    options: ["Pinot Noir", "Petit Verdot", "Gamay", "Zinfandel"],
    correctAnswer: "Petit Verdot",
    explanation: "Petit Verdot, traditionally a blending grape in Bordeaux, has found success in Virginia as a standalone varietal, producing bold, structured wines."
  },
  {
    question: "Which historical figure is credited with early attempts to grow European grapes in Virginia?",
    options: ["George Washington", "Thomas Jefferson", "James Madison", "Patrick Henry"],
    correctAnswer: "Thomas Jefferson",
    explanation: "Thomas Jefferson was a passionate advocate for viticulture and made significant efforts to establish European grapevines at Monticello."
  },
  {
    question: "Which type of climate does Northern Virginia have, generally suitable for grape growing?",
    options: ["Mediterranean", "Desert", "Humid Continental", "Tropical"],
    correctAnswer: "Humid Continental",
    explanation: "Northern Virginia experiences a humid continental climate, characterized by warm, humid summers and cold winters, which presents both opportunities and challenges for viticulture."
  },
  {
    question: "Many Virginia wineries offer tasting room experiences. What is a common practice in these rooms?",
    options: ["Blind tasting only", "Self-service wine dispensing", "Guided tastings with knowledgeable staff", "Only full bottle sales"],
    correctAnswer: "Guided tastings with knowledgeable staff",
    explanation: "Virginia wineries pride themselves on offering personalized, educational tasting experiences, often led by winemakers or passionate staff."
  },
  {
    question: "What is a popular event often hosted by Northern Virginia wineries in the fall?",
    options: ["Spring Blossom Festival", "Summer Jazz Concerts", "Harvest Festivals and Grape Stomps", "Winter Sledding Competitions"],
    correctAnswer: "Harvest Festivals and Grape Stomps",
    explanation: "Fall is harvest season, and many wineries celebrate with festivals, grape stomps, and other family-friendly events."
  },
  {
    question: "Which type of soil is common in some Northern Virginia vineyards, contributing to mineral notes in wines?",
    options: ["Sandy soil", "Clay soil", "Loamy soil", "Slate or rocky soil"],
    correctAnswer: "Slate or rocky soil",
    explanation: "Some areas of Northern Virginia, particularly in the foothills, have rocky or slate-rich soils that can impart distinct minerality to the wines."
  },
  {
    question: "Which of these is a hybrid grape varietal sometimes grown in Virginia, known for its disease resistance?",
    options: ["Cabernet Sauvignon", "Chardonnay", "Chambourcin", "Merlot"],
    correctAnswer: "Chambourcin",
    explanation: "Chambourcin is a French-American hybrid grape that offers good disease resistance, making it suitable for Virginia's humid climate."
  },
  {
    question: "True or False: Virginia is one of the oldest wine-producing states in the United States.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Virginia has a long history of winemaking, dating back to the early colonial period, making it one of the oldest wine states."
  },
  {
    question: "What is the name of the largest wine festival in Virginia, often held annually?",
    options: ["Virginia Grape Fest", "Taste of Virginia Wine", "Virginia Wine Festival", "Commonwealth Crush"],
    correctAnswer: "Virginia Wine Festival",
    explanation: "The Virginia Wine Festival is one of the largest and longest-running wine festivals in the state, showcasing numerous Virginia wineries."
  },
  {
    question: "Which type of wine is Virginia increasingly gaining recognition for, besides its still wines?",
    options: ["Fortified wines", "Dessert wines", "Sparkling wines", "Organic wines"],
    correctAnswer: "Sparkling wines",
    explanation: "Virginia's terroir and winemaking expertise are increasingly producing high-quality sparkling wines, often made using the traditional method."
  },
  {
    question: "Many Northern Virginia wineries are family-owned and operated. What benefit does this often bring?",
    options: ["Mass production", "Lower prices", "Personalized service and unique character", "Limited wine selection"],
    correctAnswer: "Personalized service and unique character",
    explanation: "Family-owned wineries often offer a more personal touch, unique wines, and a strong connection to the land and their craft."
  },
  {
    question: "What is a common challenge for Virginia winemakers related to bird damage?",
    options: ["Birds eating grapes", "Birds nesting in barrels", "Birds spreading disease", "Birds damaging trellises"],
    correctAnswer: "Birds eating grapes",
    explanation: "Birds can cause significant damage to ripening grape crops, leading to the use of netting or other deterrents in vineyards."
  },
  {
    question: "What is a common food pairing for Virginia ham?",
    options: ["Light white wine", "Sweet dessert wine", "Dry Rosé or light-bodied red like Cabernet Franc", "Sparkling wine"],
    correctAnswer: "Dry Rosé or light-bodied red like Cabernet Franc",
    explanation: "The saltiness and richness of Virginia ham pair well with a crisp dry rosé or a fruit-forward, slightly herbal Cabernet Franc."
  },
  {
    question: "True or False: All grapes grown in Northern Virginia are native American varietals.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "While some native and hybrid varietals are grown, European (Vitis vinifera) grapes like Viognier, Cabernet Franc, and Chardonnay are widely cultivated and form the backbone of Virginia's fine wine industry."
  },
  {
    question: "What is an 'AVA' in the context of Virginia wine?",
    options: ["American Vineyard Association", "Appellation of Virginia Award", "American Viticultural Area", "Agricultural Vintner Alliance"],
    correctAnswer: "American Viticultural Area",
    explanation: "An AVA (American Viticultural Area) is a designated wine grape-growing region in the United States distinguishable by geographic features."
  },
  {
    question: "Which of these is a common characteristic of Virginia's climate that influences its wines?",
    options: ["Very dry summers", "High humidity", "Consistently cold temperatures", "Volcanic soil"],
    correctAnswer: "High humidity",
    explanation: "Virginia's humid summers can lead to challenges like fungal diseases but also contribute to the unique character of its wines."
  },
  {
    question: "Many Northern Virginia wineries offer scenic views. What kind of landscape is typical?",
    options: ["Coastal beaches", "Flat plains", "Rolling hills and mountains", "Dense urban cityscape"],
    correctAnswer: "Rolling hills and mountains",
    explanation: "Northern Virginia's wine country is characterized by picturesque rolling hills and proximity to the Blue Ridge Mountains."
  },
  {
    question: "What is a common practice in Virginia vineyards to manage humidity and promote air circulation?",
    options: ["Dense planting", "Leaf pulling (canopy management)", "Deep irrigation", "Using plastic covers"],
    correctAnswer: "Leaf pulling (canopy management)",
    explanation: "Canopy management, including leaf pulling, helps improve air circulation around grape clusters, reducing disease risk in humid climates."
  },
  {
    question: "Which white grape varietal, known for its crispness, is gaining popularity in Virginia?",
    options: ["Pinot Grigio", "Riesling", "Albariño", "Gewürztraminer"],
    correctAnswer: "Albariño",
    explanation: "Albariño, a Spanish white grape, is showing promise in Virginia, producing vibrant, aromatic wines with good acidity."
  },
  {
    question: "What kind of events do many Northern Virginia wineries often facilitate for groups?",
    options: ["Cooking classes", "Corporate team building and private celebrations", "Extreme sports adventures", "Art workshops"],
    correctAnswer: "Corporate team building and private celebrations",
    explanation: "Many Northern Virginia wineries offer tailored events for various group needs, including corporate outings and special celebrations."
  },
  {
    question: "True or False: Virginia is the second-largest wine-producing state on the East Coast.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Virginia is indeed the second-largest wine-producing state on the East Coast, after New York."
  },
  {
    question: "What is a common challenge for Virginia vineyards during hurricane season?",
    options: ["Too much sun", "Excessive rainfall and wind damage", "Drought", "Early frost"],
    correctAnswer: "Excessive rainfall and wind damage",
    explanation: "Hurricane season can bring heavy rains and strong winds, posing risks of rot and physical damage to vines and crops."
  },
  {
    question: "Which grape varietal is often blended with Cabernet Franc in Virginia to create Bordeaux-style red blends?",
    options: ["Pinot Noir", "Merlot", "Riesling", "Viognier"],
    correctAnswer: "Merlot",
    explanation: "Merlot is a common blending partner with Cabernet Franc (and sometimes Cabernet Sauvignon and Petit Verdot) in Virginia's Bordeaux-style red wines."
  },
  {
    question: "What is a common wine tourism experience emphasized in Northern Virginia?",
    options: ["Budget-friendly travel", "Luxury and personalized attention", "Self-guided tours with no interaction", "Large group parties only"],
    correctAnswer: "Luxury and personalized attention",
    explanation: "Northern Virginia's wine tourism often emphasizes a premium experience with comfortable amenities and tailored itineraries."
  },
  {
    question: "Which of these is a well-known wine region in Virginia, south of Northern Virginia?",
    options: ["Finger Lakes", "Willamette Valley", "Monticello AVA", "Sonoma County"],
    correctAnswer: "Monticello AVA",
    explanation: "The Monticello AVA, centered around Charlottesville, is another significant and historic wine region in Virginia."
  },
  {
    question: "What is the purpose of 'netting' in Virginia vineyards?",
    options: ["To support the vines", "To protect grapes from birds and animals", "To provide shade", "To collect rainwater"],
    correctAnswer: "To protect grapes from birds and animals",
    explanation: "Netting is a common solution used by vineyards to prevent birds and other wildlife from consuming ripening grapes."
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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
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
    console.log('Multiplayer: Clicked option:', selectedOption);
    console.log('Multiplayer: Current Question:', gameData.questions[gameData.currentQuestionIndex]);
    console.log('Multiplayer: Correct answer:', gameData.questions[gameData.currentQuestionIndex].correctAnswer);
    console.log('Multiplayer: Is correct (direct comparison):', selectedOption === gameData.questions[gameData.currentQuestionIndex].correctAnswer);
    console.log('Multiplayer: answerSelected state before update:', answerSelected);

    // Prevent multiple answers or answers after quiz ended
    if (gameData.players.find(p => p.id === userId)?.selectedAnswerForQuestion || gameData.quizEnded) {
        return;
    }

    setAnswerSelected(true); // Disable local buttons immediately
    setSelectedAnswer(selectedOption); // Store selected answer locally for immediate visual feedback

    const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
    let newFeedback = '';
    let newScore = score;

    if (selectedOption === currentQuestion.correctAnswer) {
      newScore = score + 1;
      newFeedback = 'Correct!';
    } else {
      newFeedback = 'Incorrect.';
    }
    setFeedback(newFeedback); // Set feedback immediately

    // Update player's score and feedback in Firestore
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const updatedPlayers = gameData.players.map(p => {
        if (p.id === userId) {
            return {
                ...p,
                score: newScore,
                // Store selected answer and feedback on player object in Firestore
                selectedAnswerForQuestion: selectedOption,
                feedbackForQuestion: newFeedback
            };
        }
        return p;
    });

    try {
      await updateDoc(gameDocRef, { players: updatedPlayers });
    } catch (e) {
      console.error("Error updating score:", e);
      setError("Failed to update your score.");
    }
  };

  const handleMultiplayerNextQuestion = async () => {
    if (!gameData || gameData.hostId !== userId) { // Only Proctor can advance questions
      setError("Only the Proctor (host) can advance questions.");
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
        await updateDoc(gameDocRef, { currentQuestionIndex: nextIndex, players: resetPlayers });
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
        players: resetPlayers,
        questions: newRandomQuestions,
      });
    } catch (e) {
      console.error("Error restarting multiplayer quiz:", e);
      setError("Failed to restart multiplayer quiz.");
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
    // These need to be read from gameData for multiplayer
    const currentPlayerGameData = gameData?.players?.find(p => p.id === userId);
    const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
    const playerFeedback = currentPlayerGameData?.feedbackForQuestion || '';


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
      const currentQuestion = questions[currentQuestionIndex];
      // Determine if the correct answer is a varietal from our list for elaboration
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
    } else if (mode === 'multiplayer' && activeGameId && gameData) {
      const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
      const isHost = gameData.hostId === userId;
      const isVarietalAnswer = currentQuestion.correctAnswer.includes('(') &&
                               WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());

      // Calculate player rank and winner
      const sortedPlayers = [...(gameData.players || [])].sort((a, b) => b.score - a.score);
      const currentPlayerRank = sortedPlayers.findIndex(p => p.id === userId) + 1;

      const getWinners = () => {
        if (sortedPlayers.length === 0) return [];
        const topScore = sortedPlayers[0].score;
        return sortedPlayers.filter(player => player.score === topScore);
      };
      const winners = getWinners();

      // Find the current player's answers/feedback for highlighting
      const currentPlayerGameData = gameData.players?.find(p => p.id === userId);
      const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
      const playerFeedback = currentPlayerGameData?.feedbackForQuestion || '';


      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Multiplayer Game</h2>
          <p className="text-gray-700 text-lg text-center">Game ID: <span className="font-mono text-[#6b2a58] break-all">{activeGameId}</span></p>
          <p className="text-gray-700 text-lg text-center">
            Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>
            {isHost ? <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-sm font-semibold rounded-full">Proctor</span> : <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-sm font-semibold rounded-full">Player</span>}
          </p>

          {/* Display Proctor's Name */}
          {!isHost && gameData.hostName && (
            <p className="text-gray-700 text-lg text-center">
              Proctor: <span className="font-mono text-[#6b2a58] break-all">{gameData.hostName}</span>
            </p>
          )}

          {/* New: Display running score and rank */}
          {!gameData.quizEnded && !isHost && ( // Added !isHost here to hide for Proctor
            <div className="bg-[#9CAC3E]/10 p-3 rounded-lg shadow-inner text-center">
              <p className="text-lg font-semibold text-gray-800">
                Your Score: <span className="font-extrabold text-[#6b2a58]">{score}</span>
              </p>
              {gameData.players.length > 1 && (
                <p className="text-md text-gray-700">
                  You are in <span className="font-bold text-[#6b2a58]">{currentPlayerRank}</span> place!
                </p>
              )}
            </div>
          )}


          <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Question {gameData.currentQuestionIndex + 1} of {gameData.questions.length}
            </p>
            <p className="text-xl text-gray-800 font-medium">
              {currentQuestion.question}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isHost ? ( // Proctor does not answer questions, but sees all info
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
            ) : ( // Player view: clickable buttons with feedback
              currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMultiplayerAnswerClick(option)}
                  disabled={playerSelectedAnswer !== null || gameData.quizEnded} // Disable if player already answered or quiz ended
                  className={`
                    w-full p-4 rounded-lg text-left text-lg font-medium
                    transition-all duration-200 ease-in-out
                    ${playerSelectedAnswer !== null // If an answer has been selected by *this player*
                      ? option === currentQuestion.correctAnswer
                        ? 'bg-green-100 text-green-800 ring-2 ring-green-500' // Correct answer is green
                        : option === playerSelectedAnswer
                          ? 'bg-red-100 text-red-800 ring-2 ring-red-500' // Player's wrong answer is red
                          : 'bg-gray-100 text-gray-600 cursor-not-allowed' // Other non-selected options are greyed out
                      : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40' // Before any answer, normal styling
                    }
                    ${playerSelectedAnswer === null && 'hover:scale-[1.02]'}
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

          {isHost && !gameData.quizEnded && ( // Proctor's Next/Finish button (always visible for host)
            <button
              onClick={handleMultiplayerNextQuestion}
              className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold mt-6
                                 hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl
                                 focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
            >
              {gameData.currentQuestionIndex < gameData.questions.length - 1 ? 'Next Question' : 'End Game'}
            </button>
          )}

          {isHost && ( // Proctor-only button for generating new questions
            <button
              onClick={() => setShowGenerateQuestionModal(true)}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg text-xl font-bold mt-6
                                 hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl
                                 focus:outline-none focus:ring-4 focus:ring-indigo-300 active:bg-[#486D3E]"
              disabled={llmLoading}
            >
              {llmLoading ? 'Generating...' : '✨ Generate New Question'}
            </button>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Player Scores:</h3>
            <ul className="space-y-2">
              {sortedPlayers.map(player => ( // Use sortedPlayers here
                <li key={player.id} className="flex justify-between items-center text-lg text-gray-700">
                  <span className="font-semibold">
                    {player.userName}
                    {player.id === gameData.hostId ? (
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

          {gameData.quizEnded && (
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
              setActiveGameId(null); // Clear active game ID when leaving
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
        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/e/e0/Vineyard_at_sunset.jpg')`, // Example wine-themed image
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

// Ensure Tailwind CSS is loaded
const tailwindScript = document.createElement('script');
tailwindScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(tailwindScript);

// Add Inter font
const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
document.head.appendChild(fontLink);

// Apply font to body
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  body {
    font-family: 'Inter', sans-serif;
  }
`;
document.head.appendChild(styleTag);

export default App;
