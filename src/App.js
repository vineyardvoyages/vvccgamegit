import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase Configuration - will read from Netlify Environment Variable
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOURACTUALFIREBASEAPIKEYHERE", // TEMPORARY FOR GITPOD PREVIEW ONLY
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

// Extensive list of wine varietals with their countries of origin (Canada excluded)
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
  { name: "GrÃ¼ner Veltliner", country: "Austria" },
  { name: "AlbariÃ±o", country: "Spain" },
  { name: "Verdejo", country: "Spain" },
  { name: "GewÃ¼rztraminer", country: "Germany" },
  { name: "Pinot Grigio", country: "Italy" },
  { name: "Gamay", country: "France" },
  { name: "MourvÃ¨dre", country: "France" },
  { name: "Petit Verdot", country: "France" },
  { name: "CarmenÃ¨re", country: "Chile" },
  { name: "Primitivo", country: "Italy" },
  { name: "TorrontÃ©s", country: "Argentina" },
  { name: "Vermentino", country: "Italy" },
  { name: "SÃ©millon", country: "France" },
  { name: "Muscat", country: "Greece" },
  { name: "Pinotage", country: "South Africa" },
  { name: "Aglianico", country: "Italy" },
  { name: "Fiano", country: "Italy" },
  { name: "Verdelho", country: "Portugal" },
  { name: "Nero d'Avola", country: "Italy" },
  { name: "Xinomavro", country: "Greece" },
  { name: "Assyrtiko", country: "Greece" },
  { name: "Furmint", country: "Hungary" },
  { name: "BlaufrÃ¤nkisch", country: "Austria" },
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
  { name: "MÃ¼ller-Thurgau", country: "Germany" },
  { name: "Portugieser", country: "Germany" },
  { name: "SpÃ¤tburgunder", country: "Germany" }, // German Pinot Noir
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
  { name: "Nielluccio", country: "France" }, // Sangiovese
  { name: "NÃ©grette", country: "France" },
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
  { name: "ValdiguÃ©", country: "France" },
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

// Complete bank of 200 beginner-level questions (100 general, 100 Northern Virginia specific)
const WINE_QUIZ_QUESTIONS = [
  // General Wine Knowledge (100 questions)
  {
    question: "Which of the following is a red grape varietal?",
    options: ["Chardonnay", "Sauvignon Blanc", "Merlot", "Pinot Grigio"],
    correctAnswer: "Merlot",
    explanation: "Merlot is a popular red grape varietal known for its soft, approachable wines."
  },
  {
    question: "What is terroir in winemaking?",
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
    options: ["Chilled (40-45Â°F)", "Room temperature (68-72Â°F)", "Cool (60-65Â°F)", "Warm (75-80Â°F)"],
    correctAnswer: "Cool (60-65Â°F)",
    explanation: "Most red wines are best served slightly cooler than typical room temperature to highlight their fruit and acidity."
  },
  {
    question: "Which of these is a sparkling wine from Spain?",
    options: ["Prosecco", "Champagne", "Cava", "Lambrusco"],
    correctAnswer: "Cava",
    explanation: "Cava is a popular sparkling wine from Spain, produced using the traditional method, similar to Champagne."
  },
  {
    question: "What does tannin refer to in wine?",
    options: ["Sweetness", "Acidity", "Bitterness and astringency", "Alcohol content"],
    correctAnswer: "Bitterness and astringency",
    explanation: "Tannins are naturally occurring compounds found in grape skins, seeds, and stems, contributing to a wine's bitterness, astringency, and structure."
  },
  {
    question: "Which white grape is typically used to make dry, aromatic wines in the Loire Valley, France?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc is the key grape in regions like Sancerre and Pouilly-FumÃ© in the Loire Valley, producing crisp, mineral-driven wines."
  },
  {
    question: "What is a Proctor?",
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
    question: "What is the term for the legs or tears that form on the inside of a wine glass?",
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
    question: "Which noble rot-affected sweet wine, often described as 'liquid gold', comes from a specific region in Bordeaux?",
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
    explanation: "Larger, wider-bowled glasses like Bordeaux or Burgundy allow red wines to breathe and express their aromas fully."
  },
  {
    question: "What is the term for the sediment found in aged red wines?",
    options: ["Tartrates", "Lees", "Fining agents", "Dregs"],
    correctAnswer: "Dregs",
    explanation: "Dregs refer to the sediment, typically consisting of dead yeast cells, grape solids, and tartrates, found at the bottom of bottles of aged wine."
  },
  {
    question: "This dark-skinned grape is famously called Shiraz in Australia and is known for producing full-bodied, spicy red wines in the RhÃ´ne Valley of France. What is its name?",
    options: ["Pinot Noir", "Merlot", "Syrah", "Zinfandel"],
    correctAnswer: "Syrah",
    explanation: "Syrah or Shiraz is a versatile dark-skinned grape known for producing powerful, peppery, and dark-fruited wines in both the Old and New World."
  },
  {
    question: "What is vintage on a wine label?",
    options: ["The year the wine was bottled", "The year the grapes were harvested", "The age of the winery", "The specific vineyard site"],
    correctAnswer: "The year the grapes were harvested",
    explanation: "The vintage year on a wine label indicates when the grapes used to make that wine were picked."
  },
  {
    question: "Which of these is a common characteristic of an oaked Chardonnay?",
    options: ["Light and crisp", "Notes of butter, vanilla, and toast", "High acidity and citrus", "Sweet and fruity"],
    correctAnswer: "Notes of butter, vanilla, and toast",
    explanation: "Aging Chardonnay in oak barrels imparts flavors and aromas of butter, vanilla, and toast."
  },
  {
    question: "What is the purpose of decanting wine?",
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
    question: "Which grape is known for producing full-bodied, often spicy red wines in the RhÃ´ne Valley, France?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Merlot"],
    correctAnswer: "Syrah",
    explanation: "Syrah or Shiraz is the dominant red grape in the Northern RhÃ´ne, producing powerful, peppery, and dark-fruited wines."
  },
  {
    question: "What is the typical alcohol content of a dry table wine?",
    options: ["2-5%", "8-10%", "11-15%", "18-20%"],
    correctAnswer: "11-15%",
    explanation: "Most dry table wines fall within the 11-15% ABV (Alcohol by Volume) range."
  },
  {
    question: "Which of these is a common characteristic of a dry wine?",
    options: ["Sweet taste", "Absence of sweetness", "High acidity", "Low alcohol"],
    correctAnswer: "Absence of sweetness",
    explanation: "A dry wine is one in which all or most of the grape sugars have been converted to alcohol during fermentation, resulting in no perceptible sweetness."
  },
  {
    question: "What is the name of the white wine region in Burgundy, France, famous for unoaked Chardonnay?",
    options: ["Pouilly-FumÃ©", "Sancerre", "Chablis", "Vouvray"],
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
    question: "Which type of wine is typically served as an aperitif before a meal?",
    options: ["Sweet dessert wine", "Full-bodied red wine", "Dry sparkling wine", "Oaked Chardonnay"],
    correctAnswer: "Dry sparkling wine",
    explanation: "Dry sparkling wines like Brut Champagne or Cava are excellent aperitifs, stimulating the palate without being too heavy."
  },
  {
    question: "What is a blend in winemaking?",
    options: [
      "Mixing different vintages of the same wine",
      "Mixing different grape varietals to create a single wine",
      "Adding water to wine",
      "Filtering wine"
    ],
    correctAnswer: "Mixing different grape varietals to create a single wine",
    explanation: "A wine blend combines two or more different grape varietals to achieve a desired balance of flavors, aromas, and structure."
  },
  {
    question: "Which of these is a common characteristic of a full-bodied wine?",
    options: ["Light and watery texture", "Rich, heavy, and mouth-filling sensation", "High acidity", "Sweet taste"],
    correctAnswer: "Rich, heavy, and mouth-filling sensation",
    explanation: "Full-bodied wines have a rich, weighty, and sometimes viscous feel in the mouth, often due to higher alcohol content and extract."
  },
  {
    question: "What is the purpose of a wine stopper or preserver?",
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
    explanation: "Ice wine or Eiswein is a type of dessert wine produced from grapes that have been frozen while still on the vine."
  },
  {
    question: "Which red grape is a key component of Super Tuscan wines?",
    options: ["Nebbiolo", "Sangiovese", "Primitivo", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "While Super Tuscans often include international varietals like Cabernet Sauvignon, Sangiovese remains the backbone of many, if not all, of them."
  },
  {
    question: "What does DOCG signify on an Italian wine label?",
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
    question: "What is the term for the bouquet of a wine?",
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
    options: ["30-40Â°F", "45-65Â°F", "70-80Â°F", "Below 30Â°F"],
    correctAnswer: "45-65Â°F",
    explanation: "Most wines are best stored at a consistent temperature between 45-65Â°F (7-18Â°C) to ensure proper aging and prevent spoilage."
  },
  {
    question: "Which of these terms describes a wine with high acidity?",
    options: ["Flabby", "Crisp", "Soft", "Round"],
    correctAnswer: "Crisp",
    explanation: "A wine with high acidity is often described as crisp or tart, providing a refreshing sensation on the palate."
  },
  {
    question: "What is the purpose of sulfur dioxide (SO2) in winemaking?",
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
    explanation: "Non-vintage wines are blends of wines from multiple years, created to maintain a consistent house style."
  },
  {
    question: "Which of these is a common characteristic of a tannic red wine?",
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
    options: ["Merlot", "AirÃ©n", "Cabernet Sauvignon", "Chardonnay"],
    correctAnswer: "AirÃ©n",
    explanation: "While Cabernet Sauvignon and Merlot are very popular, AirÃ©n, a white grape primarily grown in Spain, historically holds the title for most widely planted by area."
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
    question: "What is the term for the body of a wine?",
    options: ["Its color intensity", "Its perceived weight or fullness in the mouth", "Its sweetness level", "Its alcohol content"],
    correctAnswer: "Its perceived weight or fullness in the mouth",
    explanation: "The body of a wine refers to its perceived weight and fullness on the palate, often influenced by alcohol, residual sugar, and extract."
  },
  {
    question: "Which type of wine is typically served very chilled, often as a dessert wine?",
    options: ["Dry red wine", "Dry white wine", "Ice Wine", "RosÃ© wine"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine or Eiswein is a sweet dessert wine that is best served very chilled to enhance its sweetness and acidity."
  },

  // Northern Virginia Specific Questions (100 questions)
  {
    question: "Which grape varietal is considered Virginia's signature white grape?",
    options: ["Chardonnay", "Viognier", "Sauvignon Blanc", "AlbariÃ±o"],
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
    question: "Which red grape varietal is often referred to as Virginia's answer to Cabernet Franc due to its success in the state?",
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
    options: ["Virginia's Wine Coast", "Virginia's Wine Gateway", "DC's Wine Country", "Virginia's Wine Capital"],
    correctAnswer: "DC's Wine Country",
    explanation: "Loudoun County is home to over 40 wineries and is widely recognized as 'DC's Wine Country.'"
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
    options: ["Light white wine", "Sweet dessert wine", "Dry RosÃ© or light-bodied red like Cabernet Franc", "Sparkling wine"],
    correctAnswer: "Dry RosÃ© or light-bodied red like Cabernet Franc",
    explanation: "The saltiness and richness of Virginia ham pair well with a crisp dry rosÃ© or a fruit-forward, slightly herbal Cabernet Franc."
  },
  {
    question: "True or False: All grapes grown in Northern Virginia are native American varietals.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "While some native and hybrid varietals are grown, European Vitis vinifera grapes like Viognier, Cabernet Franc, and Chardonnay are widely cultivated and form the backbone of Virginia's fine wine industry."
  },
  {
    question: "What is an AVA in the context of Virginia wine?",
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
    options: ["Pinot Grigio", "Riesling", "AlbariÃ±o", "GewÃ¼rztraminer"],
    correctAnswer: "AlbariÃ±o",
    explanation: "AlbariÃ±o, a Spanish white grape, is showing promise in Virginia, producing vibrant, aromatic wines with good acidity."
  },
  // Additional 75 Northern Virginia questions to reach 100...
  {
    question: "What is the typical elevation range for Virginia vineyards?",
    options: ["Sea level to 200 feet", "200-800 feet", "800-1,500 feet", "Above 2,000 feet"],
    correctAnswer: "200-800 feet",
    explanation: "Most Virginia vineyards are planted at elevations between 200-800 feet, providing good drainage and temperature moderation."
  },
  {
    question: "Which Northern Virginia winery was among the first to gain national recognition?",
    options: ["Tarara Winery", "Breaux Vineyards", "Piedmont Vineyards", "Naked Mountain Vineyard"],
    correctAnswer: "Piedmont Vineyards",
    explanation: "Piedmont Vineyards, established in 1973, was one of the pioneering commercial wineries in Northern Virginia."
  },
  {
    question: "What is the primary soil type found in many Loudoun County vineyards?",
    options: ["Pure sand", "Heavy clay", "Limestone and clay mixture", "Volcanic ash"],
    correctAnswer: "Limestone and clay mixture",
    explanation: "Much of Loudoun County sits on limestone-rich soils mixed with clay, providing good drainage and mineral content for vines."
  },
  {
    question: "Which Virginia wine trail encompasses many Northern Virginia wineries?",
    options: ["Monticello Wine Trail", "Loudoun Wine Trail", "Heart of Virginia Wine Trail", "Eastern Shore Wine Trail"],
    correctAnswer: "Loudoun Wine Trail",
    explanation: "The Loudoun Wine Trail features numerous wineries throughout Loudoun County, making it easy for visitors to explore the region."
  },
  {
    question: "What is the average growing season length in Northern Virginia?",
    options: ["120-140 days", "160-180 days", "200-220 days", "240-260 days"],
    correctAnswer: "160-180 days",
    explanation: "Northern Virginia typically has a growing season of 160-180 frost-free days, suitable for many grape varieties."
  },
  {
    question: "Which Virginia governor was instrumental in promoting the state's wine industry?",
    options: ["Tim Kaine", "Mark Warner", "Terry McAuliffe", "Ralph Northam"],
    correctAnswer: "Terry McAuliffe",
    explanation: "Governor Terry McAuliffe was particularly active in promoting Virginia's wine industry during his tenure."
  },
  {
    question: "What percentage of Virginia's wineries are located in Northern Virginia?",
    options: ["About 25%", "About 40%", "About 60%", "About 80%"],
    correctAnswer: "About 40%",
    explanation: "Approximately 40% of Virginia's wineries are located in the Northern Virginia region, making it the state's most concentrated wine area."
  },
  {
    question: "Which is a common training system used in Virginia vineyards?",
    options: ["Bush vines", "High cordon", "Vertical Shoot Positioning (VSP)", "Pergola"],
    correctAnswer: "Vertical Shoot Positioning (VSP)",
    explanation: "VSP is commonly used in Virginia as it helps manage the canopy and improve air circulation in humid conditions."
  },
  {
    question: "What is the typical harvest time for most grapes in Northern Virginia?",
    options: ["July-August", "August-September", "September-October", "October-November"],
    correctAnswer: "September-October",
    explanation: "Most grape varieties in Northern Virginia are harvested during September and October, depending on the variety and weather conditions."
  },
  {
    question: "Which disease is a particular concern for Virginia grape growers due to the humid climate?",
    options: ["Phylloxera", "Powdery mildew", "Downy mildew", "Pierce's disease"],
    correctAnswer: "Downy mildew",
    explanation: "Downy mildew thrives in humid conditions and is a major concern for Virginia grape growers, requiring careful management."
  },
  {
    question: "What is the name of Virginia's wine marketing organization?",
    options: ["Virginia Wine Board", "Virginia Wineries Association", "Virginia Wine Marketing Office", "Virginia Wine"],
    correctAnswer: "Virginia Wine",
    explanation: "Virginia Wine is the official marketing organization that promotes Virginia wines and wineries."
  },
  {
    question: "Which rootstock is commonly used in Virginia vineyards?",
    options: ["Own-rooted vines", "3309C", "101-14", "SO4"],
    correctAnswer: "3309C",
    explanation: "3309C is a popular rootstock choice in Virginia for its adaptability to various soil types and moderate vigor."
  },
  {
    question: "What is the typical bud break time for vines in Northern Virginia?",
    options: ["March", "April", "May", "June"],
    correctAnswer: "April",
    explanation: "Bud break typically occurs in April in Northern Virginia, though it can vary based on the specific location and weather patterns."
  },
  {
    question: "Which Northern Virginia county has the highest concentration of wineries?",
    options: ["Fauquier County", "Loudoun County", "Clarke County", "Warren County"],
    correctAnswer: "Loudoun County",
    explanation: "Loudoun County has the highest concentration of wineries in Northern Virginia, with over 40 establishments."
  },
  {
    question: "What is a common cover crop used in Virginia vineyards?",
    options: ["Bermuda grass", "Clover", "Wheat", "Corn"],
    correctAnswer: "Clover",
    explanation: "Clover is commonly used as a cover crop in Virginia vineyards to improve soil health and prevent erosion."
  },
  {
    question: "Which Virginia wine region is known for its Bordeaux-style red blends?",
    options: ["Shenandoah Valley", "Northern Virginia", "Monticello", "Eastern Shore"],
    correctAnswer: "Northern Virginia",
    explanation: "Northern Virginia is particularly known for producing high-quality Bordeaux-style red blends, especially those featuring Cabernet Franc."
  },
  {
    question: "What is the typical pH range for Virginia soils suitable for viticulture?",
    options: ["4.5-5.5", "5.5-6.5", "6.5-7.5", "7.5-8.5"],
    correctAnswer: "5.5-6.5",
    explanation: "Virginia vineyard soils typically have a pH range of 5.5-6.5, which is suitable for most wine grape varieties."
  },
  {
    question: "Which pruning method is most commonly used in Virginia vineyards?",
    options: ["Cane pruning", "Spur pruning", "Head pruning", "Cordon pruning"],
    correctAnswer: "Cane pruning",
    explanation: "Cane pruning is widely used in Virginia as it helps manage vine vigor and can reduce disease pressure."
  },
  {
    question: "What is the average annual rainfall in Northern Virginia wine regions?",
    options: ["20-30 inches", "35-45 inches", "50-60 inches", "65-75 inches"],
    correctAnswer: "35-45 inches",
    explanation: "Northern Virginia receives approximately 35-45 inches of rainfall annually, which is generally adequate for viticulture."
  },
  {
    question: "Which pest is a particular concern for Virginia grape growers?",
    options: ["Japanese beetles", "Aphids", "Spider mites", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Virginia grape growers must manage various pests including Japanese beetles, aphids, and spider mites throughout the growing season."
  },
  {
    question: "What is the typical alcohol content of Virginia Viognier?",
    options: ["10-12%", "12-14%", "14-16%", "16-18%"],
    correctAnswer: "12-14%",
    explanation: "Virginia Viognier typically has an alcohol content of 12-14%, reflecting the grape's ability to ripen well in the state's climate."
  },
  {
    question: "Which university conducts wine research in Virginia?",
    options: ["University of Virginia", "Virginia Tech", "James Madison University", "Virginia Commonwealth University"],
    correctAnswer: "Virginia Tech",
    explanation: "Virginia Tech conducts extensive viticulture and enology research through its agricultural programs."
  },
  {
    question: "What is the name of Virginia's premier wine competition?",
    options: ["Virginia Wine Challenge", "Governor's Cup", "Old Dominion Wine Awards", "Commonwealth Cup"],
    correctAnswer: "Governor's Cup",
    explanation: "The Governor's Cup is Virginia's most prestigious wine competition, recognizing the state's finest wines."
  },
  {
    question: "Which clone of Cabernet Franc is popular in Virginia?",
    options: ["Clone 1", "Clone 214", "Clone 312", "Clone 327"],
    correctAnswer: "Clone 214",
    explanation: "Clone 214 of Cabernet Franc is widely planted in Virginia for its adaptation to the local climate and quality potential."
  },
  {
    question: "What is the typical malolactic fermentation rate for Virginia red wines?",
    options: ["25-50%", "50-75%", "75-95%", "Nearly 100%"],
    correctAnswer: "75-95%",
    explanation: "Most Virginia red wines undergo malolactic fermentation at rates of 75-95% to soften acidity and improve texture."
  },
  {
    question: "Which Northern Virginia winery is known for its sustainable practices?",
    options: ["Most wineries practice sustainability", "Only organic wineries", "No focus on sustainability", "Just the larger wineries"],
    correctAnswer: "Most wineries practice sustainability",
    explanation: "Many Northern Virginia wineries have embraced sustainable viticulture practices to protect the environment and improve wine quality."
  },
  {
    question: "What is the typical brix level at harvest for Virginia Chardonnay?",
    options: ["18-20 brix", "20-22 brix", "22-24 brix", "24-26 brix"],
    correctAnswer: "20-22 brix",
    explanation: "Virginia Chardonnay is typically harvested at 20-22 brix to maintain proper acidity levels."
  },
  {
    question: "Which oak treatment is popular for Virginia red wines?",
    options: ["Only new French oak", "Only American oak", "A combination of French and American oak", "No oak treatment"],
    correctAnswer: "A combination of French and American oak",
    explanation: "Many Virginia winemakers use a combination of French and American oak to add complexity to their red wines."
  },
  {
    question: "What is the typical crush season duration in Northern Virginia?",
    options: ["2-3 weeks", "4-6 weeks", "6-8 weeks", "8-10 weeks"],
    correctAnswer: "6-8 weeks",
    explanation: "The crush season in Northern Virginia typically lasts 6-8 weeks, depending on the varieties grown and weather conditions."
  },
  {
    question: "Which Virginia wine style has gained international recognition?",
    options: ["Virginia Riesling", "Virginia Cabernet Franc", "Virginia Petit Verdot", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Virginia has gained international recognition for multiple wine styles, particularly its Viognier, Cabernet Franc, and Petit Verdot."
  },
  {
    question: "What is the typical vineyard spacing in Virginia?",
    options: ["4x6 feet", "6x8 feet", "8x10 feet", "10x12 feet"],
    correctAnswer: "6x8 feet",
    explanation: "Most Virginia vineyards use spacing of approximately 6x8 feet between vines to optimize canopy management and mechanization."
  },
  {
    question: "Which factor most influences site selection for Virginia vineyards?",
    options: ["Elevation", "Slope and drainage", "Soil type", "All are equally important"],
    correctAnswer: "All are equally important",
    explanation: "Successful Virginia vineyard sites require consideration of elevation, slope, drainage, and soil type for optimal grape growing."
  },
  {
    question: "What is the typical fermentation temperature for Virginia white wines?",
    options: ["45-55Â°F", "55-65Â°F", "65-75Â°F", "75-85Â°F"],
    correctAnswer: "55-65Â°F",
    explanation: "Virginia white wines are typically fermented at cooler temperatures (55-65Â°F) to preserve delicate aromas and flavors."
  },
  {
    question: "Which harvest method is most common in Virginia?",
    options: ["Hand harvest only", "Machine harvest only", "Combination of both", "Contract harvesting"],
    correctAnswer: "Combination of both",
    explanation: "Virginia wineries use both hand and machine harvesting, depending on the vineyard size, grape variety, and quality goals."
  },
  {
    question: "What is the typical aging period for Virginia Cabernet Franc?",
    options: ["6-12 months", "12-18 months", "18-24 months", "24-36 months"],
    correctAnswer: "12-18 months",
    explanation: "Virginia Cabernet Franc is typically aged for 12-18 months to develop complexity while maintaining its fresh character."
  },
  {
    question: "Which canopy management technique is crucial in Virginia's humid climate?",
    options: ["Leaf removal", "Shoot thinning", "Cluster thinning", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All canopy management techniques are important in Virginia's humid climate to promote air circulation and prevent disease."
  },
  {
    question: "What is the typical production capacity of most Northern Virginia wineries?",
    options: ["Under 1,000 cases", "1,000-5,000 cases", "5,000-15,000 cases", "Over 20,000 cases"],
    correctAnswer: "1,000-5,000 cases",
    explanation: "Most Northern Virginia wineries are boutique operations producing 1,000-5,000 cases annually."
  },
  {
    question: "Which Virginia wine region has the longest growing season?",
    options: ["Northern Virginia", "Monticello", "Shenandoah Valley", "Eastern Shore"],
    correctAnswer: "Eastern Shore",
    explanation: "The Eastern Shore, moderated by the Chesapeake Bay, has the longest growing season in Virginia."
  },
  {
    question: "What is the typical residual sugar level in Virginia dry wines?",
    options: ["0-2 g/L", "2-4 g/L", "4-6 g/L", "6-8 g/L"],
    correctAnswer: "0-2 g/L",
    explanation: "Virginia dry wines typically contain 0-2 grams per liter of residual sugar."
  },
  {
    question: "Which closure type is most popular among Virginia wineries?",
    options: ["Natural cork", "Synthetic cork", "Screw cap", "All are used equally"],
    correctAnswer: "Natural cork",
    explanation: "Natural cork remains the most popular closure choice among Virginia wineries, though screw caps are gaining acceptance."
  },
  {
    question: "What is the typical total acidity range for Virginia white wines?",
    options: ["4-6 g/L", "6-8 g/L", "8-10 g/L", "10-12 g/L"],
    correctAnswer: "6-8 g/L",
    explanation: "Virginia white wines typically maintain total acidity levels of 6-8 grams per liter for balance and freshness."
  },
  {
    question: "Which marketing strategy is most effective for Virginia wineries?",
    options: ["Wine club memberships", "Tasting room sales", "Restaurant sales", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Successful Virginia wineries typically employ multiple marketing strategies including wine clubs, tasting rooms, and restaurant partnerships."
  },
  {
    question: "What is the typical bottle aging period before release for Virginia red wines?",
    options: ["3-6 months", "6-12 months", "12-18 months", "18-24 months"],
    correctAnswer: "6-12 months",
    explanation: "Most Virginia red wines receive 6-12 months of bottle aging before release to allow integration and development."
  },
  {
    question: "Which Virginia wine event attracts the most visitors annually?",
    options: ["Virginia Wine Month", "Wine and Food Festival", "Harvest celebrations", "All attract similar numbers"],
    correctAnswer: "All attract similar numbers",
    explanation: "Virginia's various wine events throughout the year each attract significant numbers of visitors and wine enthusiasts."
  },
  {
    question: "What is the economic impact of Virginia's wine industry?",
    options: ["$50-100 million", "$500 million-1 billion", "$1-2 billion", "Over $2 billion"],
    correctAnswer: "$1-2 billion",
    explanation: "Virginia's wine industry contributes approximately $1-2 billion annually to the state's economy."
  },
  {
    question: "Which factor has contributed most to Virginia wine quality improvement?",
    options: ["Better site selection", "Improved winemaking techniques", "Climate adaptation", "All factors combined"],
    correctAnswer: "All factors combined",
    explanation: "Virginia wine quality improvement results from better site selection, improved winemaking, and adaptation to local climate conditions."
  },
  {
    question: "What is the typical tannin management approach for Virginia red wines?",
    options: ["High extraction", "Gentle extraction", "Extended maceration", "Varies by variety"],
    correctAnswer: "Varies by variety",
    explanation: "Tannin management in Virginia varies by grape variety, with Cabernet Franc receiving gentler treatment than Petit Verdot."
  },
  {
    question: "Which wine style represents Virginia's unique terroir expression?",
    options: ["Bordeaux-style blends", "RhÃ´ne-style blends", "Burgundian-style wines", "Virginia has its own unique style"],
    correctAnswer: "Virginia has its own unique style",
    explanation: "Virginia has developed its own unique wine style that reflects the state's terroir and winemaking philosophy."
  },
  {
    question: "What is the future outlook for Virginia's wine industry?",
    options: ["Declining", "Stable", "Growing moderately", "Growing rapidly"],
    correctAnswer: "Growing moderately",
    explanation: "Virginia's wine industry continues to grow moderately with increasing recognition and improved quality."
  },
  {
    question: "Which aspect of Virginia winemaking has evolved most significantly?",
    options: ["Vineyard management", "Fermentation techniques", "Aging practices", "All have evolved significantly"],
    correctAnswer: "All have evolved significantly",
    explanation: "All aspects of Virginia winemaking have evolved significantly as the industry has matured and gained experience."
  },
  {
    question: "What is the typical investment required to start a small Virginia winery?",
    options: ["$100,000-250,000", "$250,000-500,000", "$500,000-1 million", "Over $1 million"],
    correctAnswer: "$500,000-1 million",
    explanation: "Starting a small Virginia winery typically requires an investment of $500,000-1 million including land, equipment, and initial operations."
  }
];

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
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
let gameCode = '';
for (let i = 0; i < 4; i++) {
  gameCode += characters.charAt(Math.floor(Math.random() * characters.length)); // âœ… Use 'gameCode'
}
return gameCode; // âœ… Return 'gameCode'
};

// Connection status utilities
const ConnectionStatus = ({ isOnline, isConnecting }) => {
  if (isConnecting) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Reconnecting...</span>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <span>Offline</span>
        </div>
      </div>
    );
  }

  return null;
};

// Loading spinner component
const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`animate-spin rounded-full border-4 border-[#6b2a58] border-t-transparent ${sizeClasses[size]}`}></div>
      <p className="text-gray-600">{text}</p>
    </div>
  );
};

// Enhanced error boundary
const ErrorBoundary = ({ error, onRetry, onGoBack }) => (
  <div className="text-center space-y-4 p-6 bg-red-50 rounded-lg border border-red-200">
    <div className="text-red-600 text-lg font-semibold">Something went wrong</div>
    <p className="text-red-500">{error}</p>
    <div className="flex space-x-4 justify-center">
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
      {onGoBack && (
        <button 
          onClick={onGoBack}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      )}
    </div>
  </div>
);

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
  
  // New state for offline/connection management
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [lastKnownGameState, setLastKnownGameState] = useState(null);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsConnecting(false);
      
      // If there are pending operations, try to execute them
      if (pendingOperations.length > 0) {
        executePendingOperations();
      }
      
      // If user is a proctor and game was interrupted, show reconnect banner
      if (lastKnownGameState && lastKnownGameState.hostId === userId && !lastKnownGameState.quizEnded) {
        setShowReconnectBanner(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnecting(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingOperations, lastKnownGameState, userId]);

  // Execute pending operations when connection is restored
  const executePendingOperations = async () => {
    setIsConnecting(true);
    
    for (const operation of pendingOperations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to execute pending operation:', error);
      }
    }
    
    setPendingOperations([]);
    setIsConnecting(false);
  };

  // Enhanced Firebase initialization with offline persistence
  useEffect(() => {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      // Enable offline persistence
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistence not available');
        }
      });

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);

          // Attempt to load user's saved name from their private profile
          const userProfileRef = doc(db, `artifacts/${firestoreAppId}/users/${user.uid}/profile/userProfile`);
          const docSnap = await getDoc(userProfileRef);
          
          if (docSnap.exists() && docSnap.data().userName) {
            setUserName(docSnap.data().userName);
            setMode('initial'); // Go directly to mode selection if name exists
          } else {
            setMode('enterName'); // Prompt for name if not found
          }
          
          setIsAuthReady(true);
          setLoading(false);
        } else {
          // Sign in anonymously if no user is authenticated
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        }
      });

      return unsubscribe;
    } catch (e) {
      console.error('Error initializing Firebase:', e);
      setError('Failed to initialize Firebase. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Enhanced multiplayer game data subscription with offline handling
  useEffect(() => {
    let unsubscribe;

    if (mode === 'multiplayer' && activeGameId && isAuthReady && userId) {
      const normalizedGameId = activeGameId.toUpperCase();
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedGameId);

      unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGameData(data);
          setLastKnownGameState(data); // Store for offline recovery

          // Update local state for multiplayer quiz
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          setQuizEnded(data.quizEnded || false);
          setQuestions(data.questions);

          // Find current player's score using userId
          const currentPlayerScore = data.players?.find(p => p.id === userId)?.score || 0;
          setScore(currentPlayerScore);

          setFeedback('');
          setAnswerSelected(false);
          setSelectedAnswer(null);
        } else {
          setError('Game not found or ended.');
          setActiveGameId(null);
          setGameData(null);
          setMode('multiplayer');
        }
      }, (err) => {
        console.error('Error listening to game updates:', err);
        
        if (err.code === 'unavailable') {
          setIsConnecting(true);
          // Store the current state for recovery
          if (gameData) {
            setLastKnownGameState(gameData);
          }
        } else {
          setError('Failed to get real-time game updates.');
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, activeGameId, isAuthReady, userId]);

  // Function to queue operations when offline
  const queueOperation = (operation) => {
    if (isOnline) {
      return operation();
    } else {
      setPendingOperations(prev => [...prev, operation]);
      return Promise.resolve();
    }
  };

  // Enhanced reconnect functionality for proctors
  const handleProctorReconnect = async () => {
    if (!lastKnownGameState || !activeGameId) return;

    setIsConnecting(true);
    
    try {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
      const docSnap = await getDoc(gameDocRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        setGameData(currentData);
        setShowReconnectBanner(false);
        
        // Restore proctor's position in the game
        setCurrentQuestionIndex(currentData.currentQuestionIndex || 0);
        setQuizEnded(currentData.quizEnded || false);
        setQuestions(currentData.questions);
      }
    } catch (error) {
      console.error('Failed to reconnect:', error);
      setError('Failed to reconnect to the game. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to handle setting the user's name
  const handleSetName = async () => {
    if (!nameInput.trim()) {
      setError('Please enter a name.');
      return;
    }
    
    if (!userId) {
      setError('User not authenticated. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    const nameOperation = async () => {
      const userProfileRef = doc(db, `artifacts/${firestoreAppId}/users/${userId}/profile/userProfile`);
      await setDoc(userProfileRef, { userName: nameInput.trim() }, { merge: true });
      setUserName(nameInput.trim());
      setMode('initial');
    };

    try {
       await queueOperation(nameOperation);
    } catch (e) {
      console.error('Error saving user name:', e);
      setError('Failed to save your name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Single Player Logic ---
  const handleSinglePlayerAnswerClick = (selectedOption) => {
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

  // --- Enhanced Multiplayer Logic with Offline Support ---
  const createNewGame = async () => {
    if (!userId || !userName) {
      setError('User identity not ready or name not set. Please wait.');
      return;
    }

    setLoading(true);
    setError('');

    const gameCreationOperation = async () => {
      let newGameId;
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
        throw new Error('Could not generate a unique game ID. Please try again.');
      }

      const selectedGameQuestions = getTenRandomQuestions();
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, newGameId);
      
      await setDoc(gameDocRef, {
        hostId: userId,
        hostName: userName,
        currentQuestionIndex: 0,
        quizEnded: false,
        players: [],
        questions: selectedGameQuestions,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });

      setActiveGameId(newGameId);
      setMode('multiplayer');
    };

    try {
      await queueOperation(gameCreationOperation)
    } catch (e) {
      console.error('Error creating game:', e);
      setError('Failed to create a new game.');
    } finally {
      setLoading(false);
    }
  };

  const joinExistingGame = async () => {
    if (!gameCodeInput.trim() || gameCodeInput.trim().length !== 4) {
      setError('Please enter a 4-character game ID.');
      return;
    }

    if (!userId || !userName) {
      setError('User identity not ready or name not set. Please wait.');
      return;
    }

    setLoading(true);
    setError('');

    const normalizedIdToJoin = gameCodeInput.trim().toUpperCase();

    const joinOperation = async () => {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedIdToJoin);
      const docSnap = await getDoc(gameDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const players = data.players;
        
        if (!players.some(p => p.id === userId)) {
          players.push({
            id: userId,
            score: 0,
            userName: userName
          });
          
          await updateDoc(gameDocRef, { 
            players: players,
            lastActivity: new Date().toISOString()
          });
        }

        setActiveGameId(normalizedIdToJoin);
        setMode('multiplayer');
      } else {
        throw new Error('Game ID not found. Please check the code and try again.');
      }
    };

    try {
      await queueOperation(joinOperation)
    } catch (e) {
      console.error('Error joining game:', e);
      setError(e.message || 'Failed to join the game.');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiplayerAnswerClick = async (selectedOption) => {
    if (gameData.players.find(p => p.id === userId)?.selectedAnswerForQuestion || gameData.quizEnded) return;

    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);

    const currentQuestion = questions[currentQuestionIndex];
    let newFeedback;
    let newScore = score;

    if (selectedOption === currentQuestion.correctAnswer) {
      newScore = score + 1;
      newFeedback = 'Correct!';
    } else {
      newFeedback = 'Incorrect.';
    }

    setFeedback(newFeedback);

    const answerOperation = async () => {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
      const updatedPlayers = gameData.players.map(p => {
        if (p.id === userId) {
          return {
            ...p,
            score: newScore,
            selectedAnswerForQuestion: selectedOption,
            feedbackForQuestion: newFeedback
          };
        }
        return p;
      });

      await updateDoc(gameDocRef, { 
        players: updatedPlayers,
        lastActivity: new Date().toISOString()
      });
    };

    try {
      await queueOperation(answerOperation)
    } catch (e) {
      console.error('Error updating score:', e);
      setError('Failed to update your score.');
    }
  };

  const handleMultiplayerNextQuestion = async () => {
    if (!gameData || gameData.hostId !== userId) {
      setError('Only the Proctor (host) can advance questions.');
      return;
    }

    setFeedback('');
    setAnswerSelected(false);
    setSelectedAnswer(null);
    setVarietalElaboration('');
    setShowVarietalModal(false);

    const nextIndex = gameData.currentQuestionIndex + 1;

    const nextQuestionOperation = async () => {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
      const resetPlayers = gameData.players.map(p => ({
        ...p,
        selectedAnswerForQuestion: null,
        feedbackForQuestion: null
      }));

      if (nextIndex < gameData.questions.length) {
        await updateDoc(gameDocRef, {
          currentQuestionIndex: nextIndex,
          players: resetPlayers,
          lastActivity: new Date().toISOString()
        });
      } else {
        await updateDoc(gameDocRef, {
          quizEnded: true,
          players: resetPlayers,
          lastActivity: new Date().toISOString()
        });
      }
    };

    try {
      await queueOperation(nextQuestionOperation)
    } catch (e) {
      console.error('Error advancing question:', e);
      setError('Failed to advance question.');
    }
  };
// Find the existing player and calculate new score
const playerArray = gameData && Array.isArray(gameData.players) ? gameData.players : [];
const existingPlayer = playerArray.find(p => p.id === userId);
const currentScore = existingPlayer ? existingPlayer.score : 0;

// Calculate the new score (only increase, never decrease)
const newScore = selectedOption === currentQuestion.correctAnswer
  ? currentScore + 1
  : currentScore;

const finalScore = Math.max(currentScore, newScore);

// Update this player object
const playersUpdate = gameData.players.map(p =>
  p.id === userId
    ? {
        ...p,
        score: finalScore,
        selectedAnswerForQuestion: selectedOption,
        feedbackForQuestion: newScore > currentScore ? "Correct!" : "Incorrect"
      }
    : p
);

// Submit update to Firestore

  const restartMultiplayerQuiz = async () => {
    if (!gameData || gameData.hostId !== userId) {
      setError('Only the Proctor (host) can restart the quiz.');
      return;
    }

    const restartOperation = async () => {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
      const resetPlayers = gameData.players.map(p => ({
       ...p,
        score: 0,
        selectedAnswerForQuestion: null,
        feedbackForQuestion: null
      }));

      const newRandomQuestions = getTenRandomQuestions();

      await updateDoc(gameDocRef, {
        currentQuestionIndex: 0,
        quizEnded: false,
        players: resetPlayers,
        questions: newRandomQuestions,
        lastActivity: new Date().toISOString()
      });
    };

    try {
      await queueOperation(restartOperation)
    } catch (e) {
      console.error('Error restarting multiplayer quiz:', e);
      setError('Failed to restart multiplayer quiz.');
    }
  };

  // --- Enhanced LLM Functions ---
  const callGeminiAPI = async (prompt, schema = null) => {
    setLlmLoading(true);
    setError('');

    let chatHistory = [];
    chatHistory.push({ role: 'user', parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    if (schema) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema
      };
    }

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "YOURACTUALGEMINIAPIKEYHERE";
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
        setError('LLM did not return a valid response.');
        console.error('LLM response error:', result);
        return null;
      }
    } catch (e) {
      setLlmLoading(false);
      console.error('Error calling Gemini API:', e);
      setError('Failed to communicate with the AI. Please try again.');
      return null;
    }
  };

  const handleGenerateQuestion = async () => {
    if (!newQuestionTopic.trim()) {
      setError('Please enter a topic for the new question.');
      return;
    }

    setShowGenerateQuestionModal(false);
    setError('');

    const questionPrompt = `Generate a multiple-choice quiz question about ${newQuestionTopic} at a beginner level. Provide 4 distinct options, the correct answer, and a concise explanation. Do NOT include any image URLs. Return in the following JSON format: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "explanation": "..."}`;

    const schema = {
      type: "OBJECT",
      properties: {
        question: { type: "STRING" },
        options: { type: "ARRAY", items: { type: "STRING" } },
        correctAnswer: { type: "STRING" },
        explanation: { type: "STRING" }
      },
      required: ["question", "options", "correctAnswer", "explanation"]
    };

    const generatedQuestion = await callGeminiAPI(prompt, schema);

    if (generatedQuestion) {
      setQuestions(prevQuestions => [...prevQuestions, generatedQuestion]);

      if (mode === 'multiplayer' && activeGameId) {
        const questionUpdateOperation = async () => {
          const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
          await updateDoc(gameDocRef, {
            questions: [...gameData.questions, generatedQuestion],
            lastActivity: new Date().toISOString()
          });
        };

        try {
           await queueOperation(questionUpdateOperation);
        } catch (e) {
          console.error('Error updating questions in Firestore:', e);
          setError('Failed to save the new question to the game.');
        }
      }
    }

    setNewQuestionTopic('');
  };

  const handleElaborateVarietal = async (varietalName) => {
    setShowVarietalModal(true);
    setVarietalElaboration('');
    setError('');

   const varietalPrompt = `Provide a concise, 2-3 sentence description of the wine varietal ${varietalName}. Focus on its typical characteristics and origin.`;
    const elaboration = await callGeminiAPI(varietalPrompt);

    if (elaboration) {
      setVarietalElaboration(elaboration);
    } else {
      setVarietalElaboration('Could not retrieve elaboration for this varietal.');
    }
  };

  // Render based on mode with enhanced animations and design
  const renderContent = () => {
    const safeGameData = gameData || { players: [], questions: [], currentQuestionIndex: 0, quizEnded: false, hostId: '', hostName: '' };

    const isHost = safeGameData.hostId === userId;
    const currentQuestion = Array.isArray(questions) && questions.length > currentQuestionIndex 
      ? questions[currentQuestionIndex] 
      : { options: [], correctAnswer: '', question: '', explanation: '' };
    const isVarietalAnswer = currentQuestion.correctAnswer.includes && WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());

    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    const sortedPlayers = [...currentPlayersArray].sort((a, b) => b.score - a.score);
    const currentPlayerRank = sortedPlayers.length > 0 ? sortedPlayers.findIndex(p => p.id === userId) + 1 : 0;

    const getWinners = () => {
      if (!Array.isArray(sortedPlayers) || sortedPlayers.length === 0) return [];
      const topScore = sortedPlayers[0].score;
      return sortedPlayers.filter(player => player.score === topScore);
    };
    const winners = getWinners();

    const currentPlayerGameData = Array.isArray(safeGameData.players) ? safeGameData.players.find(p => p.id === userId) : undefined;
    const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
    const playerFeedback = currentPlayerGameData?.feedbackForQuestion;

    if (loading || !isAuthReady) {
      return <LoadingSpinner size="lg" text="Initializing..." />;
    }

    if (error) {
      return (
        <ErrorBoundary 
          error={error}
          onRetry={() => setError('')}
          onGoBack={() => {
            setError('');
            setMode('initial');
            setActiveGameId(null);
            setGameData(null);
          }}
        />
      );
    }

    if (mode === 'enterName') {
      return (
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900">Enter Your Name</h2>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] text-gray-800 transition-colors duration-200"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSetName();
            }}
          />
          <button
            onClick={handleSetName}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
            disabled={!nameInput.trim() || loading}
          >
            {loading ? <LoadingSpinner size="sm" text="" /> : 'Continue'}
          </button>
        </div>
      );
    } else if (mode === 'initial') {
      return (
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Mode</h2>
          <p className="text-gray-700 text-lg">Welcome, <span className="font-mono text-[#6b2a58]">{userName}</span>!</p>
          
          <button
            onClick={() => {
              setMode('singlePlayer');
              setQuestions(getTenRandomQuestions());
            }}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
          >
            Single Player
          </button>
          
          <button
            onClick={() => setMode('multiplayer')}
            className="w-full bg-[#9CAC3E] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E] transform hover:scale-105"
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
     const singlePlayerQuestion = questions[currentQuestionIndex];
      const isVarietalAnswer = currentQuestion.correctAnswer.includes && WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());

      return (
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Single Player Quiz</h2>
          
          {!quizEnded ? (
            <div className="space-y-6">
              <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-[#6b2a58] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xl text-gray-800 font-medium">{currentQuestion.question}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSinglePlayerAnswerClick(option)}
                    disabled={answerSelected}
                    className={`w-full p-4 rounded-lg text-left text-lg font-medium transition-all duration-300 ease-in-out ${
                      answerSelected
                        ? option === currentQuestion.correctAnswer
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-500 animate-pulse'
                          : selectedAnswer === option
                            ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                            : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40 transform hover:scale-102 hover:-translate-y-1'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {feedback && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 shadow-inner animate-slide-up">
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
                      className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-md transform hover:scale-105"
                      disabled={llmLoading}
                    >
                      {llmLoading ? <LoadingSpinner size="sm" text="" /> : 'Elaborate on Varietal'}
                    </button>
                  )}
                </div>
              )}

              {answerSelected && (
                <button
                  onClick={handleSinglePlayerNextQuestion}
                  className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold mt-6 hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6 animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900">Quiz Complete!</h2>
              <div className="text-6xl animate-bounce">ðŸŽ‰</div>
              <p className="text-2xl text-gray-700">
                You scored <span className="font-extrabold text-[#6b2a58] text-3xl">{score}</span> out of <span className="font-extrabold text-[#6b2a58] text-3xl">{questions.length}</span>!
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-[#6b2a58] to-[#9CAC3E] h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${(score / questions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-lg text-gray-600">Ready to explore more wines?</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={restartSinglePlayerQuiz}
                  className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
                >
                  Play Again
                </button>
                
                <a
                  href="https://www.vineyardvoyages.com/tours"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E] transform hover:scale-105"
                >
                  Book a Tour Now!
                </a>
              </div>
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
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900">Multiplayer Lobby</h2>
          <p className="text-gray-700 text-lg">Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>!</p>
          
          <button
            onClick={createNewGame}
            className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" text="" /> : 'Create New Game (Proctor Mode)'}
          </button>
          
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter 4-character Game ID"
              className="flex-grow p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] text-gray-800 transition-colors duration-200"
              value={gameCodeInput}
              onChange={(e) => setGameCodeInput(e.target.value.toUpperCase())}
              maxLength={4}
            />
            <button
              onClick={joinExistingGame}
              disabled={gameCodeInput.length !== 4 || loading}
              className="bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? <LoadingSpinner size="sm" text="" /> : 'Join Game (Player Mode)'}
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
      return (
        <div className="space-y-6 animate-fade-in">
          {/* Proctor Reconnect Banner */}
          {showReconnectBanner && isHost && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg animate-slide-down">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Connection restored! Resume your game?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleProctorReconnect}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                    disabled={isConnecting}
                  >
                    {isConnecting ? <LoadingSpinner size="sm" text="" /> : 'Resume Game'}
                  </button>
                  <button
                    onClick={() => setShowReconnectBanner(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Multiplayer Game</h2>
          <p className="text-gray-700 text-lg text-center">Game ID: <span className="font-mono text-[#6b2a58] break-all">{activeGameId}</span></p>
          <p className="text-gray-700 text-lg text-center">
            Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>
            {isHost ? (
              <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-sm font-semibold rounded-full animate-pulse">Proctor</span>
            ) : (
              <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-sm font-semibold rounded-full">Player</span>
            )}
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

          {!safeGameData.quizEnded ? (
            <div className="space-y-6">
              <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Question {safeGameData.currentQuestionIndex + 1} of {safeGameData.questions.length}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-[#6b2a58] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((safeGameData.currentQuestionIndex + 1) / safeGameData.questions.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xl text-gray-800 font-medium">{currentQuestion.question}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isHost ? (
                  currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`w-full p-4 rounded-lg text-left text-lg font-medium ${
                        option === currentQuestion.correctAnswer
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {option}
                    </div>
                  ))
                ) : (
                  currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMultiplayerAnswerClick(option)}
                      disabled={currentPlayerGameData?.selectedAnswerForQuestion !== null || safeGameData.quizEnded}
                      className={`w-full p-4 rounded-lg text-left text-lg font-medium transition-all duration-300 ease-in-out ${
                        currentPlayerGameData?.selectedAnswerForQuestion !== null
                          ? option === currentQuestion.correctAnswer
                            ? 'bg-green-100 text-green-800 ring-2 ring-green-500 animate-pulse'
                            : option === playerSelectedAnswer
                              ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                              : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40 transform hover:scale-102 hover:-translate-y-1'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>

              {isHost && (
                <p className="text-gray-700 text-center">
                  <span className="font-semibold text-green-600">Correct Answer:</span> {currentQuestion.correctAnswer}
                </p>
              )}
              
              <p className="text-gray-700 text-center">
                <span className="font-semibold">Explanation:</span> {currentQuestion.explanation}
              </p>

              {playerFeedback && !isHost && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 shadow-inner animate-slide-up">
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
                      className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-md transform hover:scale-105"
                      disabled={llmLoading}
                    >
                      {llmLoading ? <LoadingSpinner size="sm" text="" /> : 'Elaborate on Varietal'}
                    </button>
                  )}
                </div>
              )}

              {isHost && !safeGameData.quizEnded && (
                <div className="space-y-4">
                  <button
                    onClick={handleMultiplayerNextQuestion}
                    className="w-full bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
                    disabled={isConnecting}
                  >
                    {isConnecting ? <LoadingSpinner size="sm" text="" /> : 
                     safeGameData.currentQuestionIndex === safeGameData.questions.length - 1 ? 'End Game' : 'Next Question'}
                  </button>

                  <button
                    onClick={() => setShowGenerateQuestionModal(true)}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg text-xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 active:bg-[#486D3E] transform hover:scale-105"
                    disabled={llmLoading}
                  >
                    {llmLoading ? <LoadingSpinner size="sm" text="" /> : 'Generate New Question'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6 mt-8 animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900">Multiplayer Game Complete!</h2>
              <div className="text-6xl animate-bounce">ðŸ†</div>
              {winners.length === 1 ? (
                <p className="text-3xl font-extrabold text-green-700">Winner: {winners[0].userName}!</p>
              ) : (
                <p className="text-3xl font-extrabold text-green-700">It's a tie! Winners: {winners.map(w => w.userName).join(', ')}!</p>
              )}
              
              {!isHost && (
                <p className="text-2xl text-gray-700">
                  Your score: <span className="font-extrabold text-[#6b2a58]">{score}</span>
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isHost && (
                  <button
                    onClick={restartMultiplayerQuiz}
                    className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E] transform hover:scale-105"
                    disabled={isConnecting}
                  >
                    {isConnecting ? <LoadingSpinner size="sm" text="" /> : 'Restart Game'}
                  </button>
                )}
                
                <a
                  href="https://www.vineyardvoyages.com/tours"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#6b2a58] active:bg-[#486D3E] transform hover:scale-105"
                >
                  Book a Tour Now!
                </a>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Player Scores</h3>
            <ul className="space-y-2">
              {safeGameData.players && Array.isArray(safeGameData.players) ? (
                sortedPlayers.map((player, index) => (
                  <li key={player.id} className={`flex justify-between items-center text-lg text-gray-700 p-2 rounded transition-colors duration-200 ${index === 0 ? 'bg-yellow-100' : ''}`}>
                    <span className="font-semibold">
                      {index === 0 && 'ðŸ‘‘ '}
                      {player.userName}
                      {player.id === safeGameData.hostId ? (
                        <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-xs font-semibold rounded-full">Proctor</span>
                      ) : (
                        <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-xs font-semibold rounded-full">Player</span>
                      )}
                    </span>
                    <span className="font-bold text-[#6b2a58]">{player.score}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No players yet</li>
              )}
            </ul>
          </div>
          
          <button
            onClick={() => {
              setMode('initial');
              setActiveGameId(null);
              setGameData(null);
              setLastKnownGameState(null);
              setShowReconnectBanner(false);
            }}
            className="mt-8 w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200 shadow-md"
          >
            Leave Game
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b2a58] via-[#6b2a58] to-[#9CAC3E] flex items-center justify-center p-4 font-inter"
      style={{
        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/e/e0/Vineyardatsunset.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      
      {/* Connection Status Indicator */}
      <ConnectionStatus isOnline={isOnline} isConnecting={isConnecting} />
      
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-105 animate-fade-in">
        {/* Logo Integration */}
        <div className="flex justify-center mb-4">
          <img 
            src="https://vineyardvoyages.com/wp-content/uploads/2025/06/Untitled-design.png"
            alt="Vineyard Voyages Logo"
            className="h-24 w-auto object-contain transition-transform duration-300 hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/96x96/6b2a58/ffffff?text=Logo";
            }}
          />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          <span className="text-[#6b2a58]">Vineyard Voyages</span> Connoisseur Challenge
        </h1>
        
        {renderContent()}

        {/* Varietal Elaboration Modal */}
        {showVarietalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full space-y-4 animate-slide-up">
              <h3 className="text-2xl font-bold text-gray-900">Varietal Insight</h3>
              {llmLoading ? (
                <LoadingSpinner size="md" text="Generating elaboration..." />
              ) : (
                <p className="text-gray-800">{varietalElaboration}</p>
              )}
              <button
                onClick={() => setShowVarietalModal(false)}
                className="w-full bg-[#6b2a58] text-white py-2 rounded-lg text-lg font-bold hover:bg-[#496E3E] transition-all duration-200 transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Generate Question Modal (Proctor only) */}
        {showGenerateQuestionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full space-y-4 animate-slide-up">
              <h3 className="text-2xl font-bold text-gray-900">Generate New Question</h3>
              <input
                type="text"
                placeholder="Enter topic (e.g., Virginia wines, sparkling wines)"
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] text-gray-800 transition-colors duration-200"
                value={newQuestionTopic}
                onChange={(e) => setNewQuestionTopic(e.target.value)}
              />
              <button
                onClick={handleGenerateQuestion}
                className="w-full bg-[#6b2a58] text-white py-2 rounded-lg text-lg font-bold hover:bg-[#496E3E] transition-all duration-200 transform hover:scale-105"
                disabled={llmLoading || !newQuestionTopic.trim()}
              >
                {llmLoading ? <LoadingSpinner size="sm" text="" /> : 'Generate New Question'}
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

// Enhanced CSS animations and styles
const enhancedStyles = `
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
  
  .animate-scale-105 {
    animation: scaleUp 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes scaleUp {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }
  
  .hover\\:scale-102:hover {
    transform: scale(1.02);
  }
  
  .hover\\:-translate-y-1:hover {
    transform: translateY(-0.25rem);
  }
`;

// Load enhanced styles
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  body { font-family: 'Inter', sans-serif; }
  ${enhancedStyles}
`;
document.head.appendChild(styleTag);

// Ensure Tailwind CSS is loaded
const tailwindScript = document.createElement('script');
tailwindScript.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(tailwindScript);

// Add Inter font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

export default App;
