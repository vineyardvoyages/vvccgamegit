import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'; 

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

// Extensive list of wine varietals with their countries of origin (Canada excluded)
// This array is now only only used for quiz questions, not for assigning user names.
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
  { name: "Marquette", country: "USA" },
  { name: "Frontenac", country: "USA" },
  { name: "La Crescent", country: "USA" },
  { name: "Prairie Star", country: "USA" },
  { name: "Chambourcin", country: "USA" },
  { name: "Vignoles", country: "USA" },
  { name: "Norton", country: "USA" },
  { name: "Niagara", country: "USA" },
  { name: "Concord", country: "USA" },
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

// FIXED: Full bank of 100 beginner-level questions with enhanced explanations
// Questions reviewed to ensure no overlapping words between questions and answers
// Explanations enhanced to explain why ALL other options are incorrect
const WINE_QUIZ_QUESTIONS = [
  // General Wine Knowledge (50 questions)
  {
    question: "Which of the following is a red grape varietal?",
    options: ["Chardonnay", "Sauvignon Blanc", "Merlot", "Pinot Grigio"],
    correctAnswer: "Merlot",
    explanation: "Merlot is a popular red grape varietal known for its soft, approachable wines. Chardonnay, Sauvignon Blanc, and Pinot Grigio are all white grape varietals used to make white wines."
  },
  {
    question: "What encompasses the complete natural environment affecting wine character?",
    options: [
      "A type of wine barrel",
      "The complete natural environment in which a wine is produced, including factors such as soil, topography, and climate.",
      "A winemaking technique",
      "A wine tasting term"
    ],
    correctAnswer: "The complete natural environment in which a wine is produced, including factors such as soil, topography, and climate.",
    explanation: "Terroir refers to the unique combination of environmental factors that affect a crop's phenotype, including climate, soil, and topography. It's not a barrel type (which affects flavor through wood contact), not a single technique (it's environmental), and not just a tasting term (it's a measurable concept)."
  },
  {
    question: "Which country consistently produces the highest volume of wine annually?",
    options: ["France", "Italy", "Spain", "United States"],
    correctAnswer: "Italy",
    explanation: "Italy leads global wine production by volume, with diverse regions from north to south. France produces many prestigious wines but lower overall volume, Spain has extensive vineyards but lower yields per hectare, and the United States produces significantly less than these European leaders."
  },
  {
    question: "What grape varieties are traditionally used in premium sparkling wine production?",
    options: ["Riesling only", "Pinot Noir and Chardonnay", "Syrah and Merlot", "Zinfandel and Cabernet"],
    correctAnswer: "Pinot Noir and Chardonnay",
    explanation: "Traditional Champagne uses Pinot Noir, Chardonnay, and Pinot Meunier. Riesling alone doesn't make traditional sparkling wine, Syrah and Merlot are still wine grapes, and Zinfandel and Cabernet are not used in premium sparkling wine production."
  },
  {
    question: "Which wine style typically shows green apple and citrus notes with crisp acidity?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Zinfandel"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc displays distinctive green apple, lime, and herbaceous character with high natural acidity. Cabernet Sauvignon shows dark fruit and tannins, oaked Chardonnay shows tropical fruit and vanilla, and Zinfandel shows jammy red and black fruit."
  },
  {
    question: "What winemaking process involves aging wine in wooden containers?",
    options: ["Fermentation", "Malolactic fermentation", "Oaking", "Racking"],
    correctAnswer: "Oaking",
    explanation: "Oaking specifically refers to aging wine in oak barrels to impart flavors like vanilla and spice. Fermentation converts sugar to alcohol, malolactic fermentation softens acidity, and racking moves wine between containers without necessarily using oak."
  },
  {
    question: "Which regions are renowned for high-quality red wine from a specific grape variety?",
    options: ["Bordeaux, France", "Napa Valley, USA", "Barossa Valley, Australia", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Cabernet Sauvignon is widely planted and all listed regions produce exceptional wines from this variety: Bordeaux (Left Bank), Napa Valley (iconic Cabs), and Barossa Valley (alongside their famous Shiraz). Each region expresses the grape differently through terroir."
  },
  {
    question: "What is the optimal serving temperature for most red wines?",
    options: ["Chilled (40-45°F)", "Room temperature (68-72°F)", "Cool (60-65°F)", "Warm (75-80°F)"],
    correctAnswer: "Cool (60-65°F)",
    explanation: "Cool temperatures enhance red wine's fruit character and structure while moderating alcohol heat. Chilled temperatures mute flavors too much, modern room temperature is too warm and emphasizes alcohol, and warm temperatures make wines taste unbalanced."
  },
  {
    question: "Which country produces the traditional-method sparkling wine called Cava?",
    options: ["Italy", "France", "Spain", "Portugal"],
    correctAnswer: "Spain",
    explanation: "Cava is Spain's traditional-method sparkling wine, primarily from Catalonia. Italy produces Prosecco and other sparkling wines, France produces Champagne and Crémant, and Portugal produces Espumante - Cava is distinctly Spanish."
  },
  {
    question: "What wine component creates a drying, astringent mouthfeel?",
    options: ["Sweetness", "Acidity", "Bitterness and astringency", "Alcohol content"],
    correctAnswer: "Bitterness and astringency",
    explanation: "Tannins create astringency and bitterness by binding with proteins in saliva, creating a drying sensation. Sweetness provides richness, acidity gives tartness and freshness, and alcohol provides warmth - none create the specific drying effect of tannins."
  },
  {
    question: "Which white grape produces dry, aromatic wines in France's Loire Valley?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc creates Sancerre and Pouilly-Fumé's distinctive mineral-driven wines in the Loire Valley. Chardonnay is not significant in the Loire, Pinot Gris is primarily from Alsace, and Riesling is mainly from Germany and Alsace."
  },
  {
    question: "What role does a wine professional called a 'Proctor' fulfill?",
    options: ["A winemaker", "A wine critic", "A trained and knowledgeable wine professional", "A wine seller"],
    correctAnswer: "A trained and knowledgeable wine professional",
    explanation: "A Proctor is a highly trained wine professional with extensive knowledge who can guide tastings and education. They differ from winemakers (who make wine), critics (who review wines), and sellers (who focus on sales rather than education)."
  },
  {
    question: "Which country produces the sweet, fortified wine called Port?",
    options: ["Spain", "Portugal", "Italy", "France"],
    correctAnswer: "Portugal",
    explanation: "Port is produced exclusively in Portugal's Douro Valley. Spain produces Sherry (different style), Italy produces various fortified wines but not Port, and France produces various sweet wines but not Port specifically."
  },
  {
    question: "What biological process transforms grape juice into wine?",
    options: ["Distillation", "Fermentation", "Maceration", "Clarification"],
    correctAnswer: "Fermentation",
    explanation: "Fermentation uses yeast to convert grape sugars into alcohol and CO2. Distillation concentrates alcohol (used for spirits), maceration extracts color and tannins, and clarification removes particles after fermentation is complete."
  },
  {
    question: "Which red grape is known for elegance, red fruit, and high acidity from Burgundy?",
    options: ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir from Burgundy shows red cherry, raspberry, and elegant structure with bright acidity. Cabernet Sauvignon is fuller with black fruit and more tannins, Merlot is softer with plum notes, and Syrah is more powerful with dark fruit and spice."
  },
  {
    question: "What do the 'legs' or 'tears' on a wine glass primarily indicate?",
    options: ["Viscosity only", "Acidity level", "Alcohol content and glycerol", "Tannin level"],
    correctAnswer: "Alcohol content and glycerol",
    explanation: "Wine legs primarily indicate alcohol content and glycerol levels, which affect viscosity. While viscosity plays a role, it's caused by alcohol and glycerol. Acidity and tannins don't create legs on the glass."
  },
  {
    question: "Which wine fault smells like wet cardboard or musty basement?",
    options: ["Brettanomyces", "Cork taint (TCA)", "Oxidation", "Volatile Acidity"],
    correctAnswer: "Cork taint (TCA)",
    explanation: "Cork taint (TCA) creates musty, wet cardboard aromas. Brettanomyces smells barnyard-like or medicinal, oxidation smells like stale fruit or sherry, and volatile acidity smells like vinegar or nail polish remover."
  },
  {
    question: "Which wine style pairs excellently with oysters?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Merlot"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Crisp, high-acid whites like Sauvignon Blanc cut through oysters' brininess perfectly. Cabernet Sauvignon's tannins would clash, oaked Chardonnay would overpower the delicate flavors, and Merlot lacks the necessary acidity for this pairing."
  },
  {
    question: "Which noble rot-affected sweet wine comes from Bordeaux and is made from specific grape varieties?",
    options: ["Tokaji", "Ice Wine", "Sauternes", "Port"],
    correctAnswer: "Sauternes",
    explanation: "Sauternes from Bordeaux is made from Sémillon, Sauvignon Blanc, and Muscadelle affected by noble rot. Tokaji is from Hungary, Ice Wine is made from frozen grapes (not noble rot), and Port is fortified, not affected by noble rot."
  },
  {
    question: "What grape variety is the primary component of wines from Tuscany's most famous region?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Sangiovese is the backbone of Chianti and Brunello from Tuscany. Nebbiolo is Piedmont's grape (Barolo/Barbaresco), Barbera is also from Piedmont for lighter wines, and Montepulciano is primarily from Abruzzo in central Italy."
  },
  {
    question: "Which glass shape is recommended for enjoying red wines?",
    options: ["Flute", "Coupe", "Tulip", "Bordeaux or Burgundy glass"],
    correctAnswer: "Bordeaux or Burgundy glass",
    explanation: "Large, wide-bowled glasses allow red wines to breathe and express aromas fully. Flutes are for sparkling wine to preserve bubbles, coupes are outdated for sparkling wine, and tulip glasses are too narrow for proper red wine aeration."
  },
  {
    question: "What term describes the sediment found in aged red wines?",
    options: ["Tartrates", "Lees", "Fining agents", "Dregs"],
    correctAnswer: "Dregs",
    explanation: "Dregs refer to sediment in aged wines from tannins, pigments, and proteins. Tartrates are crystalline deposits from acids, lees are dead yeast cells during winemaking, and fining agents are added during production to clarify wine."
  },
  {
    question: "This grape produces full-bodied, spicy reds in the Rhône Valley and is called by another name in Australia:",
    options: ["Pinot Noir", "Merlot", "Syrah", "Zinfandel"],
    correctAnswer: "Syrah",
    explanation: "Syrah (called Shiraz in Australia) creates powerful, peppery wines in the Rhône Valley. Pinot Noir is delicate and cool-climate, Merlot is soft and medium-bodied, and Zinfandel is primarily Californian with jammy characteristics."
  },
  {
    question: "What does 'vintage' indicate on a wine label?",
    options: ["The year the wine was bottled", "The year the grapes were harvested", "The age of the winery", "The specific vineyard site"],
    correctAnswer: "The year the grapes were harvested",
    explanation: "Vintage indicates when grapes were harvested, not when bottled (which can be years later). It doesn't refer to winery age or vineyard location - only the harvest year of the grapes used."
  },
  {
    question: "What characteristic defines an 'oaked' style of a popular white wine?",
    options: ["Light and crisp", "Notes of butter, vanilla, and toast", "High acidity and citrus", "Sweet and fruity"],
    correctAnswer: "Notes of butter, vanilla, and toast",
    explanation: "Oak aging imparts butter, vanilla, and toast flavors, especially in Chardonnay. Light and crisp describes unoaked styles, high acidity and citrus describes varieties like Sauvignon Blanc, and sweet and fruity describes off-dry wines or certain varieties."
  },
  {
    question: "What is the purpose of 'decanting' wine?",
    options: ["To chill the wine", "To remove sediment and allow the wine to breathe", "To add flavors to the wine", "To warm the wine"],
    correctAnswer: "To remove sediment and allow the wine to breathe",
    explanation: "Decanting separates sediment and exposes wine to oxygen for development. It doesn't chill wine (that requires refrigeration), doesn't add flavors (those come from grapes and winemaking), and doesn't warm wine (that would harm it)."
  },
  {
    question: "Which Italian wine from Piedmont is made from a specific noble grape variety?",
    options: ["Chianti", "Prosecco", "Barolo", "Soave"],
    correctAnswer: "Barolo",
    explanation: "Barolo from Piedmont is made exclusively from Nebbiolo grapes. Chianti is from Tuscany (Sangiovese), Prosecco is from Veneto (Glera), and Soave is from Veneto (Garganega) - none are from Piedmont."
  },
  {
    question: "What term describes a wine with noticeable residual sugar?",
    options: ["Dry", "Off-dry", "Sweet", "Semi-sweet"],
    correctAnswer: "Sweet",
    explanation: "Sweet wines have noticeable residual sugar creating obvious sweetness. Dry wines have no perceptible sweetness, off-dry has minimal sweetness, and semi-sweet is between off-dry and sweet but less sweet than fully sweet wines."
  },
  {
    question: "Which region produces world-renowned aromatic white wines from a specific German grape?",
    options: ["Bordeaux, France", "Mosel, Germany", "Napa Valley, USA", "Tuscany, Italy"],
    correctAnswer: "Mosel, Germany",
    explanation: "Mosel is world-famous for Riesling with distinctive minerality from slate soils. Bordeaux focuses on blends and reds, Napa Valley is known for Cabernet Sauvignon and Chardonnay, and Tuscany specializes in red wines like Chianti."
  },
  {
    question: "What distinguishes red wine production from white wine production?",
    options: [
      "Red wine uses red grapes, white wine uses white grapes",
      "Red wine ferments with grape skins, white wine typically does not",
      "Red wine is aged in oak, white wine is not",
      "Red wine is always dry, white wine is always sweet"
    ],
    correctAnswer: "Red wine ferments with grape skins, white wine typically does not",
    explanation: "Skin contact during fermentation gives red wine its color and tannins. White wine can be made from red or white grapes but without skin contact. Both can be oaked or unoaked, and both can be dry or sweet."
  },
  {
    question: "Which food pairing works excellently with the elegant red wine from Burgundy?",
    options: ["Grilled steak", "Spicy Asian cuisine", "Salmon or duck", "Heavy cream sauces"],
    correctAnswer: "Salmon or duck",
    explanation: "Pinot Noir's lighter body and red fruit notes complement fatty fish like salmon and poultry like duck perfectly. Grilled steak needs fuller-bodied wines, spicy cuisine overwhelms Pinot Noir, and heavy cream sauces need wines with more structure."
  },
  {
    question: "What term describes natural grape sugars remaining after fermentation?",
    options: ["Glucose", "Fructose", "Residual Sugar", "Sucrose"],
    correctAnswer: "Residual Sugar",
    explanation: "Residual sugar (RS) refers to unconverted grape sugars after fermentation. While glucose and fructose are types of grape sugars, the technical term is residual sugar. Sucrose is table sugar, not naturally found in significant amounts in grapes."
  },
  {
    question: "Which grape produces powerful, spicy red wines in France's northern valley region?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Merlot"],
    correctAnswer: "Syrah",
    explanation: "Syrah dominates Northern Rhône, producing intense, peppery wines. Gamay is from Beaujolais (light and fruity), Pinot Noir is from Burgundy (elegant and delicate), and Merlot is primarily from Bordeaux (soft and plummy)."
  },
  {
    question: "What is the typical alcohol range for dry table wines?",
    options: ["2-5%", "8-10%", "11-15%", "18-20%"],
    correctAnswer: "11-15%",
    explanation: "Most dry table wines range from 11-15% ABV. 2-5% is too low for wine (more like beer), 8-10% is very low for dry wines (more like some sweet wines), and 18-20% is fortified wine territory."
  },
  {
    question: "What defines a 'dry' wine?",
    options: ["Sweet taste", "Absence of perceptible sweetness", "High acidity", "Low alcohol"],
    correctAnswer: "Absence of perceptible sweetness",
    explanation: "Dry wines have no perceptible sweetness because sugars were converted to alcohol. Sweet taste would make it sweet, high acidity is separate from sweetness (can be dry and acidic), and alcohol level doesn't determine dryness."
  },
  {
    question: "Which white wine region in Burgundy is famous for mineral, unoaked expressions?",
    options: ["Pouilly-Fumé", "Sancerre", "Chablis", "Vouvray"],
    correctAnswer: "Chablis",
    explanation: "Chablis produces mineral-driven, typically unoaked Chardonnay from Kimmeridgian soils. Pouilly-Fumé and Sancerre are Loire Valley (Sauvignon Blanc), and Vouvray is Loire Valley (Chenin Blanc) - none are in Burgundy."
  },
  {
    question: "Which grape variety is known for blackcurrant, cedar, and tobacco notes?",
    options: ["Pinot Noir", "Merlot", "Cabernet Sauvignon", "Zinfandel"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon is renowned for blackcurrant (cassis), cedar, and tobacco characteristics. Pinot Noir shows red fruit and earthiness, Merlot shows plum and chocolate notes, and Zinfandel shows jammy berry and spice flavors."
  },
  {
    question: "What term describes wine aging in glass containers after production?",
    options: ["Malolactic fermentation", "Racking", "Bottle aging", "Fining"],
    correctAnswer: "Bottle aging",
    explanation: "Bottle aging develops complexity over time in glass. Malolactic fermentation is a process during production, racking moves wine between containers during production, and fining clarifies wine during production - none involve post-production bottle development."
  },
  {
    question: "Which wine style is typically served as an aperitif before meals?",
    options: ["Sweet dessert wine", "Full-bodied red wine", "Dry sparkling wine", "Oaked Chardonnay"],
    correctAnswer: "Dry sparkling wine",
    explanation: "Dry sparkling wines stimulate the palate without being heavy, perfect before meals. Sweet dessert wines are for after meals, full-bodied reds are too heavy as aperitifs, and oaked Chardonnay lacks the refreshing qualities needed for aperitifs."
  },
  {
    question: "What is a 'blend' in winemaking terminology?",
    options: ["Mixing different vintages of the same wine", "Mixing different grape varietals to create a single wine", "Adding water to wine", "Filtering wine"],
    correctAnswer: "Mixing different grape varietals to create a single wine",
    explanation: "Blending combines different grape varieties for balance and complexity. Mixing vintages is done for consistency but isn't the primary definition, adding water is illegal in most regions, and filtering is a clarification process, not blending."
  },
  {
    question: "What characterizes a 'full-bodied' wine?",
    options: ["Light and watery texture", "Rich, heavy, and mouth-filling sensation", "High acidity", "Sweet taste"],
    correctAnswer: "Rich, heavy, and mouth-filling sensation",
    explanation: "Full-bodied wines feel rich and weighty due to higher alcohol, extract, and glycerol. Light and watery describes light-bodied wines, high acidity is separate from body, and sweetness doesn't determine body weight."
  },
  {
    question: "What is the purpose of wine 'stoppers' or 'preservers'?",
    options: ["To chill the wine", "To remove sediment", "To prevent oxidation and keep wine fresh after opening", "To add bubbles"],
    correctAnswer: "To prevent oxidation and keep wine fresh after opening",
    explanation: "Wine preservation systems prevent oxygen contact to maintain freshness. They don't chill wine (refrigeration does that), don't remove sediment (decanting does that), and don't add bubbles (that requires fermentation)."
  },
  {
    question: "Which grape variety dominates white wine production in France's eastern region?",
    options: ["Chardonnay", "Sauvignon Blanc", "Riesling", "Pinot Grigio"],
    correctAnswer: "Riesling",
    explanation: "Riesling is Alsace's most important noble grape, producing distinctive dry wines. Chardonnay is primarily from Burgundy, Sauvignon Blanc from Loire Valley, and Pinot Grigio is Italian (called Pinot Gris in Alsace but secondary to Riesling)."
  },
  {
    question: "What term describes the science of grape cultivation?",
    options: ["Agriculture", "Horticulture", "Viticulture", "Vinification"],
    correctAnswer: "Viticulture",
    explanation: "Viticulture specifically refers to grape growing for wine. Agriculture is general farming, horticulture covers all fruit/vegetable growing, and vinification is winemaking (what happens after grapes are harvested)."
  },
  {
    question: "Which aroma is commonly found in wines from a specific Loire Valley grape?",
    options: ["Black cherry", "Vanilla", "Grass or gooseberry", "Chocolate"],
    correctAnswer: "Grass or gooseberry",
    explanation: "Sauvignon Blanc (particularly from Loire Valley) shows distinctive grass, gooseberry, and herbaceous notes. Black cherry is typical of red wines, vanilla comes from oak aging, and chocolate notes are found in some reds but not Loire whites."
  },
  {
    question: "What type of dessert wine is made from naturally frozen grapes?",
    options: ["Port", "Sherry", "Ice Wine", "Marsala"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine (Eiswein) requires grapes frozen naturally on the vine, concentrating sugars. Port is fortified wine, Sherry is oxidatively aged or fortified, and Marsala is Italian fortified wine - none require frozen grapes."
  },
  {
    question: "Which grape variety is key in premium Italian 'Super Tuscan' wines?",
    options: ["Nebbiolo", "Sangiovese", "Primitivo", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "While Super Tuscans often blend international varieties, Sangiovese frequently remains the backbone. Nebbiolo is from Piedmont, Primitivo is from southern Italy, and Montepulciano is from central Italy but not typically in Super Tuscans."
  },
  {
    question: "What does 'DOCG' represent in Italian wine classification?",
    options: ["Denomination of Controlled Origin", "Highest level of Italian wine classification", "Table wine", "Sweet wine"],
    correctAnswer: "Highest level of Italian wine classification",
    explanation: "DOCG (Denominazione di Origine Controllata e Garantita) is Italy's highest classification with strict quality controls. DOC is lower, table wine is basic level, and sweetness is a style, not a classification level."
  },
  {
    question: "Which red wine is typically light-bodied?",
    options: ["Cabernet Sauvignon", "Syrah", "Pinot Noir", "Zinfandel"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir typically shows light to medium body with delicate structure. Cabernet Sauvignon is full-bodied with strong tannins, Syrah is full-bodied and powerful, and Zinfandel is typically medium to full-bodied with high alcohol."
  },
  {
    question: "What term describes complex aromas developed through aging?",
    options: ["Its color", "Its taste", "Its aromas developed from aging", "Its sweetness level"],
    correctAnswer: "Its aromas developed from aging",
    explanation: "Bouquet specifically refers to complex aromas from fermentation and aging, distinct from primary fruit aromas. Color is visual, taste is on the palate, and sweetness is a specific flavor component, not the complex aromatic development."
  },
  {
    question: "Which white grape produces full-bodied, often buttery wines when oaked?",
    options: ["Riesling", "Sauvignon Blanc", "Pinot Grigio", "Chardonnay"],
    correctAnswer: "Chardonnay",
    explanation: "Chardonnay develops buttery, vanilla characteristics when oak-aged, especially with malolactic fermentation. Riesling rarely sees oak, Sauvignon Blanc loses its character when oaked, and Pinot Grigio is typically made in a crisp, unoaked style."
  },
  {
    question: "What is the ideal temperature range for long-term wine storage?",
    options: ["30-40°F", "45-65°F", "70-80°F", "Below 30°F"],
    correctAnswer: "45-65°F",
    explanation: "45-65°F allows proper aging without freezing or heat damage. 30-40°F risks freezing, 70-80°F accelerates aging and can cause spoilage, and below 30°F will freeze and expand, potentially breaking bottles."
  },
  {
    question: "Which term describes wines with high acidity?",
    options: ["Flabby", "Crisp", "Soft", "Round"],
    correctAnswer: "Crisp",
    explanation: "High acidity creates a 'crisp' sensation on the palate. Flabby describes low acidity wines, soft describes wines with moderate acidity and tannins, and round describes well-balanced wines without sharp edges."
  },
  {
    question: "What is the primary purpose of sulfur dioxide (SO2) in winemaking?",
    options: ["To add sweetness", "To remove color", "As an antioxidant and antimicrobial agent", "To increase alcohol content"],
    correctAnswer: "As an antioxidant and antimicrobial agent",
    explanation: "SO2 prevents oxidation and inhibits harmful bacteria and wild yeasts. It doesn't add sweetness (that comes from residual sugar), doesn't remove color (other processes do that), and doesn't increase alcohol (fermentation does that)."
  },
  {
    question: "Which grape variety is used to make the Italian sparkling wine from Veneto?",
    options: ["Chardonnay", "Pinot Noir", "Glera", "Riesling"],
    correctAnswer: "Glera",
    explanation: "Prosecco is made primarily from Glera grapes in the Veneto region. Chardonnay and Pinot Noir are used for traditional method sparkling wines, and Riesling is typically used for still wines, not sparkling."
  },
  {
    question: "What wine fault creates strong vinegar-like aromas?",
    options: ["Oxidized", "Corked", "Volatile Acidity", "Brettanomyces"],
    correctAnswer: "Volatile Acidity",
    explanation: "Volatile acidity (VA) produces vinegar or nail polish remover aromas from acetic acid bacteria. Oxidation smells like stale fruit, cork taint smells musty, and Brettanomyces smells barnyard-like or medicinal."
  },
  {
    question: "Which wine style pairs best with chocolate desserts?",
    options: ["Dry red wine", "Dry white wine", "Sweet fortified wine (e.g., Port)", "Sparkling wine"],
    correctAnswer: "Sweet fortified wine (e.g., Port)",
    explanation: "Sweet, rich wines like Port match chocolate's intensity and sweetness. Dry reds would be overwhelmed, dry whites lack the body and sweetness needed, and sparkling wines don't have the richness to complement chocolate."
  },
  {
    question: "What does 'non-vintage' (NV) indicate on sparkling wine labels?",
    options: ["It's a very old wine", "It's a blend of wines from multiple years", "It's a low-quality wine", "It's a wine made without grapes"],
    correctAnswer: "It's a blend of wines from multiple years",
    explanation: "NV sparkling wines blend multiple years to maintain consistent house style. Age doesn't determine quality, NV can be high quality, and all wines are made from grapes - the 'non-vintage' refers only to year blending."
  },
  {
    question: "What sensation do tannic red wines create in the mouth?",
    options: ["Smooth and soft", "Drying sensation in the mouth", "Fruity and sweet", "Light-bodied"],
    correctAnswer: "Drying sensation in the mouth",
    explanation: "Tannins bind with saliva proteins, creating astringency and drying sensations. Smooth and soft describes low-tannin wines, fruity and sweet describes flavor profile not tannin structure, and light-bodied refers to weight, not tannin level."
  },
  {
    question: "What processes clarify wine by removing solids after fermentation?",
    options: ["Racking", "Fining", "Filtration", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All three clarify wine: racking separates clear wine from sediment, fining uses agents to bind and remove particles, and filtration physically removes remaining solids. Each has specific applications in the clarification process."
  },
  {
    question: "Which grape variety has the largest vineyard plantings globally by area?",
    options: ["Merlot", "Airén", "Cabernet Sauvignon", "Chardonnay"],
    correctAnswer: "Airén",
    explanation: "Airén, a white Spanish grape, historically had the most vineyard area though plantings are declining. Chardonnay is now the most planted white wine grape globally, while Merlot and Cabernet Sauvignon are widely planted but have less total area than Airén historically had."
  },
  {
    question: "Which country produces the fortified wine from the Andalusia region?",
    options: ["Portugal", "Italy", "Spain", "France"],
    correctAnswer: "Spain",
    explanation: "Sherry comes from Jerez de la Frontera in Andalusia, Spain. Portugal produces Port and Madeira, Italy produces Marsala, and France produces various fortified wines but not from Andalusia - that's specifically Spanish."
  },
  {
    question: "Which aroma commonly develops in aged wines from Burgundy's red grape?",
    options: ["Green apple", "Citrus", "Forest floor or mushroom", "Tropical fruit"],
    correctAnswer: "Forest floor or mushroom",
    explanation: "Aged Pinot Noir develops complex tertiary aromas of forest floor, mushroom, and earthiness. Green apple and citrus are white wine characteristics, and tropical fruit is found in some whites but not aged Pinot Noir."
  },
  {
    question: "What describes a wine's perceived weight and fullness on the palate?",
    options: ["Its color intensity", "Its perceived weight and fullness in the mouth", "Its sweetness level", "Its alcohol content alone"],
    correctAnswer: "Its perceived weight and fullness in the mouth",
    explanation: "Body refers to the wine's physical presence and weight sensation on the palate, influenced by alcohol, extract, and glycerol. Color intensity is visual, sweetness is taste, and while alcohol contributes to body, it's not the only factor."
  },
  {
    question: "Which dessert wine style is served very chilled due to its concentrated sweetness?",
    options: ["Dry red wine", "Dry white wine", "Ice Wine", "Rosé wine"],
    correctAnswer: "Ice Wine",
    explanation: "Ice wine's intense sweetness is balanced by serving it very cold, which highlights its acidity and prevents cloying. Dry wines don't have the concentrated sweetness requiring such cold service, and rosé is typically served cool but not as cold as ice wine."
  },
  // Virginia-specific questions (50 questions)
  {
    question: "Which grape variety serves as the official state grape of a Mid-Atlantic wine region?",
    options: ["Chardonnay", "Viognier", "Sauvignon Blanc", "Albariño"],
    correctAnswer: "Viognier",
    explanation: "Viognier is Virginia's official state grape, thriving in the state's climate and producing aromatic, full-bodied whites. Chardonnay and Sauvignon Blanc are grown but not distinctive to Virginia, and Albariño is a newer planting without official status."
  },
  {
    question: "Which designated wine region is located near the town known for its equestrian culture?",
    options: ["Monticello AVA", "Virginia Peninsula AVA", "Middleburg AVA", "Shenandoah Valley AVA"],
    correctAnswer: "Middleburg AVA",
    explanation: "The Middleburg AVA surrounds the historic town of Middleburg in Loudoun County, known for horse country and hunt culture. Monticello AVA is near Charlottesville, Virginia Peninsula AVA is in coastal Virginia, and Shenandoah Valley AVA is in western Virginia."
  },
  {
    question: "Which red grape variety has found particular success in the Mid-Atlantic climate?",
    options: ["Merlot", "Cabernet Franc", "Petit Verdot", "Norton"],
    correctAnswer: "Cabernet Franc",
    explanation: "Cabernet Franc thrives in Virginia's climate, producing wines with distinctive red fruit and herbal notes. Merlot is grown but less distinctive, Petit Verdot can be challenging in humid climates, and Norton is a native American variety with different characteristics."
  },
  {
    question: "What climate challenge do Mid-Atlantic grape growers commonly face?",
    options: ["Too much sun", "Lack of rainfall", "Humidity and late spring frosts", "Too cold in winter"],
    correctAnswer: "Humidity and late spring frosts",
    explanation: "High humidity promotes fungal diseases while unpredictable spring frosts can damage budding vines. Too much sun isn't typically a problem in Virginia's climate, lack of rainfall is rarely an issue, and winters are generally suitable for grape growing."
  },
  {
    question: "Which historic town serves as a hub for a Mid-Atlantic wine region?",
    options: ["Leesburg", "Front Royal", "Warrenton", "Middleburg"],
    correctAnswer: "Middleburg",
    explanation: "Middleburg is considered the heart of Virginia wine country, surrounded by numerous wineries in Loudoun County. Leesburg, Front Royal, and Warrenton have wineries nearby but aren't considered the central hub like Middleburg."
  },
  {
    question: "What marketing designation is used for a county with over 40 wineries?",
    options: ["Virginia's Wine Coast", "Virginia's Wine Gateway", "DC's Wine Country®", "Virginia's Wine Capital"],
    correctAnswer: "DC's Wine Country®",
    explanation: "Loudoun County markets itself as 'DC's Wine Country®' due to its proximity to Washington, DC and high concentration of wineries. The other designations aren't officially used for Loudoun County specifically."
  },
  {
    question: "Which red grape variety produces deeply colored, structured wines in the Mid-Atlantic?",
    options: ["Pinot Noir", "Petit Verdot", "Gamay", "Zinfandel"],
    correctAnswer: "Petit Verdot",
    explanation: "Petit Verdot produces bold, structured wines with deep color in Virginia's climate. Pinot Noir is typically lighter, Gamay produces light, fruity wines, and Zinfandel is not commonly grown in Virginia's climate."
  },
  {
    question: "Which historical figure attempted early European grape cultivation in the Mid-Atlantic?",
    options: ["George Washington", "Thomas Jefferson", "James Madison", "Patrick Henry"],
    correctAnswer: "Thomas Jefferson",
    explanation: "Thomas Jefferson made extensive efforts to grow European wine grapes at Monticello, though his attempts largely failed due to climate challenges and plant diseases. The other presidents didn't focus as extensively on viticulture."
  },
  {
    question: "What type of climate characterizes the Mid-Atlantic wine region?",
    options: ["Mediterranean", "Desert", "Humid Continental", "Tropical"],
    correctAnswer: "Humid Continental",
    explanation: "Virginia has a humid continental climate with warm, humid summers and cold winters. Mediterranean climates are drier, desert climates have extreme temperature variations with little humidity, and tropical climates are consistently warm and humid year-round."
  },
  {
    question: "What experience do most Mid-Atlantic wineries emphasize in their tasting rooms?",
    options: ["Blind tasting only", "Self-service wine dispensing", "Guided tastings with knowledgeable staff", "Only full bottle sales"],
    correctAnswer: "Guided tastings with knowledgeable staff",
    explanation: "Virginia wineries pride themselves on educational, personalized experiences led by knowledgeable staff. Blind tastings are specialized events, self-service is less common, and most offer tastings alongside bottle sales."
  },
  {
    question: "What type of events do Mid-Atlantic wineries host during harvest season?",
    options: ["Spring Blossom Festival", "Summer Jazz Concerts", "Harvest Festivals and Grape Stomps", "Winter Sledding Competitions"],
    correctAnswer: "Harvest Festivals and Grape Stomps",
    explanation: "Fall harvest season brings festivals celebrating the grape harvest with stomping, food, and family activities. Spring festivals aren't during harvest, summer concerts aren't harvest-specific, and winter sledding isn't wine-related."
  },
  {
    question: "What soil type contributes mineral notes to some Mid-Atlantic wines?",
    options: ["Sandy soil", "Clay soil", "Loamy soil", "Slate or rocky soil"],
    correctAnswer: "Slate or rocky soil",
    explanation: "Rocky and slate soils in Virginia's foothills can impart minerality to wines. Sandy soils drain well but don't add minerality, clay soils retain water, and loamy soils are fertile but don't typically contribute mineral characteristics."
  },
  {
    question: "Which hybrid grape variety offers disease resistance in humid climates?",
    options: ["Cabernet Sauvignon", "Chardonnay", "Chambourcin", "Merlot"],
    correctAnswer: "Chambourcin",
    explanation: "Chambourcin is a French-American hybrid bred for disease resistance, making it suitable for Virginia's humid climate. Cabernet Sauvignon, Chardonnay, and Merlot are European varieties (vinifera) that can be more susceptible to diseases in humid conditions."
  },
  {
    question: "Is the Mid-Atlantic one of the oldest wine-producing regions in America?",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Virginia has wine history dating to the early colonial period, making it one of America's oldest wine regions. Early attempts at viticulture began in the 1600s, though successful commercial winemaking developed much later."
  },
  {
    question: "What is a major annual wine celebration in the Mid-Atlantic region?",
    options: ["Virginia Grape Fest", "Taste of Virginia Wine", "Virginia Wine Festival", "Commonwealth Crush"],
    correctAnswer: "Virginia Wine Festival",
    explanation: "The Virginia Wine Festival is one of the state's largest and longest-running wine festivals, showcasing numerous Virginia wineries. The other names aren't established major Virginia wine festivals."
  },
  {
    question: "Which wine style is gaining recognition in the Mid-Atlantic beyond still wines?",
    options: ["Fortified wines", "Dessert wines", "Sparkling wines", "Organic wines"],
    correctAnswer: "Sparkling wines",
    explanation: "Virginia's sparkling wine production is gaining recognition, often made using traditional methods. While fortified, dessert, and organic wines are made, sparkling wine represents the most significant emerging category gaining acclaim."
  },
  {
    question: "What benefit do family-owned Mid-Atlantic wineries typically offer?",
    options: ["Mass production", "Lower prices", "Personalized service and unique character", "Limited wine selection"],
    correctAnswer: "Personalized service and unique character",
    explanation: "Family ownership often enables personal attention, unique wines, and individual character. Mass production is contrary to family scale, prices vary regardless of ownership, and family wineries often offer diverse selections to showcase their terroir."
  },
  {
    question: "What agricultural challenge do Mid-Atlantic grape growers face from wildlife?",
    options: ["Birds eating grapes", "Birds nesting in barrels", "Birds spreading disease", "Birds damaging trellises"],
    correctAnswer: "Birds eating grapes",
    explanation: "Birds can significantly damage ripening grape crops, requiring netting or other deterrents. Birds don't typically nest in barrels (which are usually sealed), don't primarily spread vine diseases, and rarely damage trellis systems."
  },
  {
    question: "What wine style pairs well with the region's famous cured meat?",
    options: ["Light white wine", "Sweet dessert wine", "Dry Rosé or light-bodied red like Cabernet Franc", "Sparkling wine"],
    correctAnswer: "Dry Rosé or light-bodied red like Cabernet Franc",
    explanation: "Virginia ham's saltiness and richness pair excellently with dry rosé or Cabernet Franc's fruit and acidity. Light whites lack body, sweet wines would clash with saltiness, and sparkling wine alone wouldn't complement the richness."
  },
  {
    question: "Do Mid-Atlantic wineries grow only native American grape varieties?",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Virginia grows primarily European (vinifera) varieties like Viognier, Cabernet Franc, and Chardonnay alongside some hybrids. Native American varieties are grown but don't form the backbone of Virginia's quality wine industry."
  },
  {
    question: "What does 'AVA' mean in Mid-Atlantic wine regions?",
    options: ["American Vineyard Association", "Appellation of Virginia Award", "American Viticultural Area", "Agricultural Vintner Alliance"],
    correctAnswer: "American Viticultural Area",
    explanation: "AVA designates grape-growing regions with distinct geographic features. It's not an association, award, or alliance - it's the official US system for defining wine regions based on climate, soil, and geography."
  },
  {
    question: "What climate characteristic significantly influences Mid-Atlantic wine character?",
    options: ["Very dry summers", "High humidity", "Consistently cold temperatures", "Volcanic soil"],
    correctAnswer: "High humidity",
    explanation: "High humidity creates challenges like fungal diseases but also influences the unique character of Virginia wines. Summers aren't particularly dry, temperatures vary seasonally, and Virginia doesn't have significant volcanic soils."
  },
  {
    question: "What landscape characterizes Mid-Atlantic wine country?",
    options: ["Coastal beaches", "Flat plains", "Rolling hills and mountains", "Dense urban cityscape"],
    correctAnswer: "Rolling hills and mountains",
    explanation: "Virginia wine country features picturesque rolling hills with the Blue Ridge Mountains as backdrop. It's not coastal (though some wineries exist near water), not flat plains, and definitely not urban - the rural, hilly landscape is part of its charm."
  },
  {
    question: "What viticultural practice helps manage humidity in Mid-Atlantic vineyards?",
    options: ["Dense planting", "Leaf pulling (canopy management)", "Deep irrigation", "Using plastic covers"],
    correctAnswer: "Leaf pulling (canopy management)",
    explanation: "Canopy management, including leaf pulling, improves air circulation and sunlight penetration, reducing humidity-related disease risks. Dense planting increases humidity problems, deep irrigation can worsen humidity issues, and plastic covers would trap moisture."
  },
  {
    question: "Which Spanish white grape variety shows promise in the Mid-Atlantic climate?",
    options: ["Pinot Grigio", "Riesling", "Albariño", "Gewürztraminer"],
    correctAnswer: "Albariño",
    explanation: "Albariño from Spain's Atlantic coast adapts well to Virginia's climate, producing vibrant, crisp wines. Pinot Grigio is Italian, Riesling is German (and challenging in Virginia's humidity), and Gewürztraminer is Alsatian with different climate needs."
  },
  {
    question: "What group experiences do many Mid-Atlantic wineries specialize in?",
    options: ["Cooking classes", "Corporate team building and private celebrations", "Extreme sports adventures", "Art workshops"],
    correctAnswer: "Corporate team building and private celebrations",
    explanation: "Virginia's proximity to Washington DC makes it ideal for corporate events and celebrations. While some wineries offer cooking classes or art workshops, corporate and private events are the primary group focus due to location and facilities."
  },
  {
    question: "What ranking does the Mid-Atlantic hold among East Coast wine-producing states?",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Virginia is the second-largest wine-producing state on the East Coast after New York, with over 300 wineries and significant production volume."
  },
  {
    question: "What weather challenge affects Mid-Atlantic vineyards during late summer?",
    options: ["Too much sun", "Excessive rainfall and wind damage", "Drought", "Early frost"],
    correctAnswer: "Excessive rainfall and wind damage",
    explanation: "Hurricane season can bring heavy rains and strong winds, causing rot and physical damage. Too much sun isn't typically a problem, drought is less common than excess moisture, and early frost is a spring issue, not late summer."
  },
  {
    question: "Which grape variety complements the dominant red variety in Mid-Atlantic blends?",
    options: ["Pinot Noir", "Merlot", "Riesling", "Viognier"],
    correctAnswer: "Merlot",
    explanation: "Merlot blends well with Cabernet Franc (Virginia's successful red variety) in Bordeaux-style blends. Pinot Noir doesn't typically blend with Bordeaux varieties, and Riesling and Viognier are white grapes not used in red blends."
  },
  {
    question: "What tourism experience do Mid-Atlantic wineries emphasize?",
    options: ["Budget-friendly travel", "Luxury and personalized attention", "Self-guided tours with no interaction", "Large group parties only"],
    correctAnswer: "Luxury and personalized attention",
    explanation: "Virginia wine tourism focuses on premium experiences with personal attention and comfortable amenities. This differentiates from budget tourism, impersonal self-guided experiences, or exclusively large group focus."
  },
  {
    question: "Which significant wine region lies south of the Mid-Atlantic area?",
    options: ["Finger Lakes", "Willamette Valley", "Monticello AVA", "Sonoma County"],
    correctAnswer: "Monticello AVA",
    explanation: "Monticello AVA around Charlottesville is Virginia's other major wine region south of Northern Virginia. Finger Lakes is in New York, Willamette Valley is in Oregon, and Sonoma County is in California - none are in Virginia."
  },
  {
    question: "What protective measure do Mid-Atlantic vineyards commonly use?",
    options: ["To support the vines", "To protect grapes from birds and animals", "To provide shade", "To collect rainwater"],
    correctAnswer: "To protect grapes from birds and animals",
    explanation: "Netting protects ripening grapes from birds and deer that can cause significant crop damage. While nets might incidentally provide minimal support or shade, and could collect rainwater, their primary purpose is wildlife protection."
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
  const [selectedAnswer, setSelectedAnswer] = useState(null); // FIXED: Changed from null
  const [questions, setQuestions] = useState([]);

  const [llmLoading, setLlmLoading] = useState(false);
  const [varietalElaboration, setVarietalElaboration] = useState('');
  const [showVarietalModal, setShowVarietalModal] = useState(false);
  const [newQuestionTopic, setNewQuestionTopic] = useState('');
  const [showGenerateQuestionModal, setShowGenerateQuestionModal] = useState(false);

  // Enhanced connectivity and offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [revealAnswers, setRevealAnswers] = useState(false);

  // Enhanced connectivity detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process any pending answers when back online
      if (pendingAnswers.length > 0) {
        processPendingAnswers();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingAnswers]);

  // Process pending answers when back online
  const processPendingAnswers = async () => {
    for (const pendingAnswer of pendingAnswers) {
      try {
        await submitAnswerToFirestore(pendingAnswer.answer, pendingAnswer.questionIndex);
        // Remove from pending list after successful submission
        setPendingAnswers(prev => prev.filter(p => p !== pendingAnswer));
      } catch (e) {
        console.warn("Failed to process pending answer:", e);
      }
    }
  };

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
          setRevealAnswers(data.revealAnswers || false);
          // Ensure questions are updated for all players
          setQuestions(data.questions || []);
          // Find current player's score using userId
          const currentPlayerScore = data.players?.find(p => p.id === userId)?.score || 0;
          setScore(currentPlayerScore);
          
          // FIXED: Enhanced answer state management
          const currentPlayer = data.players?.find(p => p.id === userId);
          if (currentPlayer && !data.revealAnswers) {
            // Allow answer changes until revealed
            if (currentPlayer.selectedAnswerForQuestion) {
              setSelectedAnswer(currentPlayer.selectedAnswerForQuestion);
              setAnswerSelected(true);
            }
          } else if (data.revealAnswers) {
            // Reset for next question when answers are revealed
            setAnswerSelected(false);
            setSelectedAnswer(null);
          }
          
          setFeedback('');
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
        revealAnswers: false, // FIXED: Added revealAnswers field
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
          players.push({ 
            id: userId, 
            score: 0, 
            userName: userName,
            selectedAnswerForQuestion: null,
            feedbackForQuestion: null
          }); // Use userName
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

  // Enhanced answer submission with retry mechanism
  const submitAnswerToFirestore = async (selectedOption, questionIndex = null) => {
    const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId);
    const updatedPlayers = gameData.players.map(p => {
      if (p.id === userId) {
        return {
          ...p,
          selectedAnswerForQuestion: selectedOption
        };
      }
      return p;
    });

    await updateDoc(gameDocRef, { players: updatedPlayers });
  };

  // FIXED: Enhanced multiplayer answer handling - allows answer changes until revealed
  const handleMultiplayerAnswerClick = async (selectedOption) => {
    console.log('Multiplayer: Clicked option:', selectedOption);
    console.log('Multiplayer: Current Question:', gameData.questions[gameData.currentQuestionIndex]);
    console.log('Multiplayer: Correct answer:', gameData.questions[gameData.currentQuestionIndex].correctAnswer);
    console.log('Multiplayer: Is correct (direct comparison):', selectedOption === gameData.questions[gameData.currentQuestionIndex].correctAnswer);
    console.log('Multiplayer: answerSelected state before update:', answerSelected);

    // FIXED: Don't allow changes ONLY if quiz ended or answers have been revealed
    if (gameData.quizEnded || gameData.revealAnswers) {
      return;
    }

    // FIXED: Always allow answer changes until revealed
    setAnswerSelected(true); // Disable local buttons immediately
    setSelectedAnswer(selectedOption); // Store selected answer locally for immediate visual feedback

    try {
      await submitAnswerToFirestore(selectedOption);
    } catch (e) {
      console.error("Error updating answer:", e);
      
      // FIXED: Enhanced offline handling - save pending answer
      if (!isOnline) {
        setPendingAnswers(prev => [...prev, { 
          answer: selectedOption, 
          questionIndex: gameData.currentQuestionIndex 
        }]);
        setError("You're offline. Your answer will be submitted when connection is restored.");
      } else {
        setError("Failed to submit your answer. Please try again.");
        
        // Retry mechanism
        setTimeout(async () => {
          try {
            await submitAnswerToFirestore(selectedOption);
            setError(''); // Clear error on success
          } catch (retryError) {
            console.error("Retry failed:", retryError);
            setError("Your answer is saved locally and will be submitted when connection is restored.");
            setPendingAnswers(prev => [...prev, { 
              answer: selectedOption, 
              questionIndex: gameData.currentQuestionIndex 
            }]);
          }
        }, 2000);
      }
    }
  };

  // FIXED: New function to reveal answers to all players
  const revealAnswersToAll = async () => {
    if (!gameData || !activeGameId) return;
    
    try {
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
    } catch (e) {
      console.error("Error revealing answers:", e);
      setError("Failed to reveal answers. Please try again.");
    }
  };

  const handleMultiplayerNextQuestion = async () => {
    if (!gameData || gameData.hostId !== userId) { // Only Proctor can advance questions
      setError("Only the Proctor (host) can advance questions.");
      return;
    }

    // FIXED: Check if answers have been revealed before allowing next question
    if (!gameData.revealAnswers) {
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
          revealAnswers: false // FIXED: Reset revealAnswers for next question
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
    const resetPlayers = gameData.players.map(p => ({ 
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
        revealAnswers: false, // FIXED: Reset revealAnswers
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
    setShowGenerateQuestionModal(false);
    setError('');

    const prompt = `Generate a multiple-choice quiz question about "${newQuestionTopic}" at a beginner level. Provide 4 distinct options, the correct answer, and a concise explanation that explains why the correct answer is right and why the other options are incorrect. Do NOT include any image URLs. Return in the following JSON format:
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
      setQuestions(prevQuestions => [...prevQuestions, generatedQuestion]);
      
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

  // Main render function with enhanced UI
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
    const sortedPlayers = [...safeGameData.players].sort((a, b) => b.score - a.score);
    const answeredCount = safeGameData.players.filter(p => p.selectedAnswerForQuestion != null).length;
    const totalPlayers = safeGameData.players.length;

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
              if (!isOnline) {
                setError("You're offline. Please check your internet connection.");
                return;
              }
              if (mode === 'multiplayer') {
                setMode('initial');
                setActiveGameId(null);
                setGameData(null);
              }
            }}
            className="mt-4 bg-[#6b2a58] text-white py-2 px-4 rounded-lg hover:bg-[#496E3E] transition-colors"
          >
            {isOnline ? 'Go Back' : 'Retry Connection'}
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
      const currentQuestion = questions[currentQuestionIndex] || { options: [], correctAnswer: '', question: '', explanation: '' };
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
      const currentQuestion = safeGameData.questions[safeGameData.currentQuestionIndex] || 
        { options: [], correctAnswer: '', question: '', explanation: '' };
      const isVarietalAnswer = currentQuestion.correctAnswer.includes('(') && 
                               WINE_VARIETAL_NAMES_SET.has(currentQuestion.correctAnswer.split('(')[0].trim());
      const currentPlayerGameData = safeGameData.players.find(p => p.id === userId);
      const playerSelectedAnswer = currentPlayerGameData?.selectedAnswerForQuestion || null;
      const playerFeedback = currentPlayerGameData?.feedbackForQuestion || '';

      const getWinners = () => {
        if (sortedPlayers.length === 0) return [];
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

          {/* Connection status indicator */}
          {!isOnline && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
              ⚠️ You're offline. Answers will be submitted when connection is restored.
            </div>
          )}

          {pendingAnswers.length > 0 && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
              📤 {pendingAnswers.length} answer(s) pending submission...
            </div>
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
                      disabled={safeGameData.quizEnded || safeGameData.revealAnswers}
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
                            ? 'bg-blue-200 text-blue-800 ring-2 ring-blue-500'
                            : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40'
                        }
                        ${!safeGameData.revealAnswers && !safeGameData.quizEnded && 'hover:scale-[1.02]'}
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
                    {safeGameData.currentQuestionIndex < safeGameData.questions.length - 1 ? 'Next Question' : 'End Game'}
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
              There {safeGameData.players.length === 1 ? 'is' : 'are'} {safeGameData.players.length} player{safeGameData.players.length === 1 ? '' : 's'} in this game.
            </p>
            <ul className="space-y-2">
              {safeGameData.players.map(player => (
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
              <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Final Scores:</h3>
                <ul className="space-y-2">
                  {sortedPlayers.map((player, index) => (
                    <li key={player.id} className="flex justify-between items-center text-xl">
                      <span className="font-semibold">
                        {index + 1}. {player.userName}
                      </span>
                      <span className="font-bold text-[#6b2a58]">{player.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {isHost && (
                <button
                  onClick={restartMultiplayerQuiz}
                  className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
                >
                  Start New Game
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#6b2a58] to-[#9CAC3E] p-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🍷 Vineyard Voyages Wine Quiz</h1>
          <p className="text-white/90 text-lg">Test your wine knowledge!</p>
          {!isOnline && (
            <div className="mt-2 bg-red-500 text-white p-2 rounded">
              ⚠️ You're offline. Some features may be limited.
            </div>
          )}
        </div>
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      {/* Varietal Elaboration Modal */}
      {showVarietalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Varietal Information</h3>
            <div className="mb-4">
              {llmLoading ? (
                <p className="text-gray-600">Loading...</p>
              ) : (
                <p className="text-gray-700">{varietalElaboration}</p>
              )}
            </div>
            <button
              onClick={() => setShowVarietalModal(false)}
              className="w-full bg-[#6b2a58] text-white py-2 rounded-lg hover:bg-[#496E3E] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Generate Question Modal */}
      {showGenerateQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Generate New Question</h3>
            <input
              type="text"
              placeholder="Enter a wine topic..."
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-[#6b2a58] mb-4"
              value={newQuestionTopic}
              onChange={(e) => setNewQuestionTopic(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerateQuestion}
                disabled={!newQuestionTopic.trim() || llmLoading}
                className="flex-1 bg-[#6b2a58] text-white py-2 rounded-lg hover:bg-[#496E3E] transition-colors disabled:opacity-50"
              >
                {llmLoading ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => setShowGenerateQuestionModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
