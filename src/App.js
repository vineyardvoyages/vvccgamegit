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

// Enhanced Local Storage Helpers for Robust Connectivity
const LOCAL_STORAGE_KEY = 'vineyard-voyages-game-state';
const RESUME_GAME_KEY = 'vineyard-voyages-resume';

const saveLocalState = (state) => {
  try {
    const stateToSave = {
      userId: state.userId,
      userName: state.userName,
      activeGameId: state.activeGameId,
      mode: state.mode,
      currentQuestionIndex: state.currentQuestionIndex,
      score: state.score,
      isHost: state.isHost,
      selectedAnswer: state.selectedAnswer,
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
};

const loadLocalState = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const lastActivity = new Date(parsed.lastActivity);
      const now = new Date();
      const hoursDiff = (now - lastActivity) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return parsed;
      }
    }
    return null;
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
    return null;
  }
};

const clearLocalState = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(RESUME_GAME_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
};

const saveResumeInfo = (gameId, userName, isHost) => {
  try {
    const resumeInfo = {
      gameId,
      userName,
      isHost,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(RESUME_GAME_KEY, JSON.stringify(resumeInfo));
  } catch (e) {
    console.warn('Failed to save resume info:', e);
  }
};

const getResumeInfo = () => {
  try {
    const data = localStorage.getItem(RESUME_GAME_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to get resume info:', e);
    return null;
  }
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

// Complete 200 Wine Quiz Questions with Enhanced Diversity
const WINE_QUIZ_QUESTIONS = [
  // Grape Varieties (40 questions)
  {
    question: "Which grape is the primary variety in Chianti Classico DOCG?",
    options: ["Sangiovese", "Nebbiolo", "Barbera", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Chianti Classico DOCG is based primarily on Sangiovese grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is most widely planted in the world?",
    options: ["Cabernet Sauvignon", "Merlot", "Chardonnay", "Syrah"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon is the most widely planted wine grape globally.",
    category: "grapes"
  },
  {
    question: "What is Germany's most famous grape variety?",
    options: ["Riesling", "Müller-Thurgau", "Silvaner", "Pinot Gris"],
    correctAnswer: "Riesling",
    explanation: "Riesling is the signature grape of Germany, known for its aromatic white wines.",
    category: "grapes"
  },
  {
    question: "Which grape is used to make Barolo?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Dolcetto"],
    correctAnswer: "Nebbiolo",
    explanation: "Barolo is made exclusively from Nebbiolo grapes.",
    category: "grapes"
  },
  {
    question: "What grape is Beaujolais made from?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Grenache"],
    correctAnswer: "Gamay",
    explanation: "Beaujolais is made from the Gamay grape.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Rioja red wines?",
    options: ["Tempranillo", "Garnacha", "Mazuelo", "Graciano"],
    correctAnswer: "Tempranillo",
    explanation: "Tempranillo is the dominant grape in Rioja reds.",
    category: "grapes"
  },
  {
    question: "Which grape is used in Sauternes, the sweet French wine?",
    options: ["Sémillon", "Chardonnay", "Sauvignon Blanc", "Viognier"],
    correctAnswer: "Sémillon",
    explanation: "Sémillon is the main grape in Sauternes, often blended with Sauvignon Blanc.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Bordeaux's Left Bank reds?",
    options: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc", "Malbec"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Left Bank Bordeaux reds are dominated by Cabernet Sauvignon.",
    category: "grapes"
  },
  {
    question: "What grape is the primary component of Chablis?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Aligoté"],
    correctAnswer: "Chardonnay",
    explanation: "Chablis is made exclusively from Chardonnay.",
    category: "grapes"
  },
  {
    question: "Which grape is the main variety in Marlborough, New Zealand's white wines?",
    options: ["Sauvignon Blanc", "Chardonnay", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Marlborough is world-famous for its Sauvignon Blanc.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Prosecco?",
    options: ["Glera", "Trebbiano", "Pinot Grigio", "Verdicchio"],
    correctAnswer: "Glera",
    explanation: "Prosecco is made primarily from the Glera grape.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Barossa Valley's signature red?",
    options: ["Shiraz", "Cabernet Sauvignon", "Grenache", "Merlot"],
    correctAnswer: "Shiraz",
    explanation: "Barossa Valley is famous for its Shiraz.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Mendoza, Argentina's reds?",
    options: ["Malbec", "Cabernet Sauvignon", "Bonarda", "Syrah"],
    correctAnswer: "Malbec",
    explanation: "Malbec is the signature grape of Mendoza.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Alsace's aromatic whites?",
    options: ["Riesling", "Gewürztraminer", "Pinot Gris", "Muscat"],
    correctAnswer: "Riesling",
    explanation: "Riesling is the most important grape in Alsace.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Tokaj, Hungary's sweet wines?",
    options: ["Furmint", "Hárslevelű", "Sárgamuskotály", "Kabar"],
    correctAnswer: "Furmint",
    explanation: "Furmint is the primary grape in Tokaji Aszú.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Champagne's blanc de noirs?",
    options: ["Pinot Noir", "Chardonnay", "Pinot Meunier", "Pinot Gris"],
    correctAnswer: "Pinot Noir",
    explanation: "Blanc de noirs Champagne is made from Pinot Noir and/or Pinot Meunier.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Cava?",
    options: ["Macabeo", "Parellada", "Xarel·lo", "Chardonnay"],
    correctAnswer: "Macabeo",
    explanation: "Macabeo is the most widely used grape in Cava.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Amarone della Valpolicella?",
    options: ["Corvina", "Rondinella", "Molinara", "Sangiovese"],
    correctAnswer: "Corvina",
    explanation: "Corvina is the dominant grape in Amarone.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of white Burgundy?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Aligoté"],
    correctAnswer: "Chardonnay",
    explanation: "White Burgundy is made exclusively from Chardonnay.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of red Burgundy?",
    options: ["Pinot Noir", "Cabernet Sauvignon", "Merlot", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Red Burgundy is made exclusively from Pinot Noir.",
    category: "grapes"
  },
  {
    question: "Which grape is used to make Sancerre?",
    options: ["Sauvignon Blanc", "Chardonnay", "Chenin Blanc", "Muscadet"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sancerre is made exclusively from Sauvignon Blanc grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is used to make Vouvray?",
    options: ["Chenin Blanc", "Chardonnay", "Sauvignon Blanc", "Muscadet"],
    correctAnswer: "Chenin Blanc",
    explanation: "Vouvray is made exclusively from Chenin Blanc grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Muscadet?",
    options: ["Melon de Bourgogne", "Muscadet", "Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Melon de Bourgogne",
    explanation: "Muscadet is made from Melon de Bourgogne grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Soave?",
    options: ["Garganega", "Trebbiano", "Pinot Grigio", "Verdicchio"],
    correctAnswer: "Garganega",
    explanation: "Soave is made primarily from Garganega grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Gavi?",
    options: ["Cortese", "Arneis", "Vermentino", "Falanghina"],
    correctAnswer: "Cortese",
    explanation: "Gavi is made exclusively from Cortese grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is genetically identical to Zinfandel?",
    options: ["Primitivo", "Sangiovese", "Tempranillo", "Garnacha"],
    correctAnswer: "Primitivo",
    explanation: "DNA analysis has proven that Zinfandel and Primitivo are the same grape variety.",
    category: "grapes"
  },
  {
    question: "Which grape is used to make Condrieu?",
    options: ["Viognier", "Chardonnay", "Marsanne", "Roussanne"],
    correctAnswer: "Viognier",
    explanation: "Condrieu is made exclusively from Viognier grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of white Hermitage?",
    options: ["Marsanne", "Chardonnay", "Viognier", "Roussanne"],
    correctAnswer: "Marsanne",
    explanation: "White Hermitage is primarily made from Marsanne.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Côte-Rôtie?",
    options: ["Syrah", "Grenache", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Syrah",
    explanation: "Côte-Rôtie is made primarily from Syrah grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Châteauneuf-du-Pape reds?",
    options: ["Grenache", "Syrah", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Grenache",
    explanation: "Grenache is typically the dominant grape in Châteauneuf-du-Pape reds.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Pouilly-Fumé?",
    options: ["Sauvignon Blanc", "Chardonnay", "Chenin Blanc", "Muscadet"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Pouilly-Fumé is made exclusively from Sauvignon Blanc.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Brunello di Montalcino?",
    options: ["Sangiovese", "Nebbiolo", "Barbera", "Dolcetto"],
    correctAnswer: "Sangiovese",
    explanation: "Brunello di Montalcino is made from 100% Sangiovese.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Barbaresco?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Dolcetto"],
    correctAnswer: "Nebbiolo",
    explanation: "Barbaresco is made exclusively from Nebbiolo grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is unique to South Africa?",
    options: ["Pinotage", "Chenin Blanc", "Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Pinotage",
    explanation: "Pinotage is a cross between Pinot Noir and Cinsaut, developed in South Africa.",
    category: "grapes"
  },
  {
    question: "Which grape is the signature variety of Santorini?",
    options: ["Assyrtiko", "Moschofilero", "Savatiano", "Rhoditis"],
    correctAnswer: "Assyrtiko",
    explanation: "Assyrtiko is the signature white grape of Santorini.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Valpolicella?",
    options: ["Corvina", "Sangiovese", "Nebbiolo", "Barbera"],
    correctAnswer: "Corvina",
    explanation: "Corvina is the main grape in Valpolicella wines.",
    category: "grapes"
  },
  {
    question: "Which grape is used to make traditional Balsamic vinegar?",
    options: ["Trebbiano", "Sangiovese", "Lambrusco", "Barbera"],
    correctAnswer: "Trebbiano",
    explanation: "Traditional Balsamic vinegar is made from Trebbiano grapes.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Chinon?",
    options: ["Cabernet Franc", "Pinot Noir", "Gamay", "Merlot"],
    correctAnswer: "Cabernet Franc",
    explanation: "Chinon red wines are made primarily from Cabernet Franc.",
    category: "grapes"
  },
  {
    question: "Which grape varietal is considered Virginia's signature white grape?",
    options: ["Viognier", "Chardonnay", "Sauvignon Blanc", "Albariño"],
    correctAnswer: "Viognier",
    explanation: "Viognier is Virginia's official state grape.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of Eden Valley Riesling?",
    options: ["Sauvignon Blanc", "Chardonnay", "Riesling", "Gewürztraminer"],
    correctAnswer: "Riesling",
    explanation: "Eden Valley in Barossa is famous for its high-quality Riesling wines.",
    category: "grapes"
  },

  // Wine Regions (50 questions)
  {
    question: "Which Spanish region is most famous for Albariño wines?",
    options: ["Rioja", "Ribera del Duero", "Rías Baixas", "Priorat"],
    correctAnswer: "Rías Baixas",
    explanation: "Rías Baixas in northwestern Spain is the premier region for Albariño.",
    category: "regions"
  },
  {
    question: "Which country is the largest producer of wine globally?",
    options: ["France", "Italy", "Spain", "United States"],
    correctAnswer: "Italy",
    explanation: "Italy consistently holds the title of the world's largest wine producer by volume.",
    category: "regions"
  },
  {
    question: "Which French region is famous for Pinot Noir and Chardonnay?",
    options: ["Bordeaux", "Burgundy", "Champagne", "Loire Valley"],
    correctAnswer: "Burgundy",
    explanation: "Burgundy is the home of Pinot Noir and Chardonnay.",
    category: "regions"
  },
  {
    question: "Which Italian region is famous for Barolo and Barbaresco?",
    options: ["Tuscany", "Piedmont", "Veneto", "Sicily"],
    correctAnswer: "Piedmont",
    explanation: "Piedmont in northwest Italy is home to both Barolo and Barbaresco.",
    category: "regions"
  },
  {
    question: "Which German region is famous for Riesling?",
    options: ["Mosel", "Rheingau", "Pfalz", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these German regions are famous for producing excellent Riesling.",
    category: "regions"
  },
  {
    question: "Which US state produces the most wine?",
    options: ["California", "Oregon", "Washington", "New York"],
    correctAnswer: "California",
    explanation: "California produces about 90% of all wine in the United States.",
    category: "regions"
  },
  {
    question: "Which Australian region is famous for Shiraz?",
    options: ["Hunter Valley", "Barossa Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Barossa Valley",
    explanation: "Barossa Valley is renowned worldwide for its full-bodied Shiraz wines.",
    category: "regions"
  },
  {
    question: "Which New Zealand region is famous for Sauvignon Blanc?",
    options: ["Marlborough", "Central Otago", "Hawke's Bay", "Canterbury"],
    correctAnswer: "Marlborough",
    explanation: "Marlborough is New Zealand's most famous wine region, known for Sauvignon Blanc.",
    category: "regions"
  },
  {
    question: "Which Portuguese region is famous for Port?",
    options: ["Vinho Verde", "Douro", "Dão", "Alentejo"],
    correctAnswer: "Douro",
    explanation: "Port is produced in the Douro Valley of northern Portugal.",
    category: "regions"
  },
  {
    question: "Which French region is famous for Cabernet Sauvignon-based blends?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Bordeaux",
    explanation: "Bordeaux is famous for its Cabernet Sauvignon-based red blends.",
    category: "regions"
  },
  {
    question: "Which region produces Amarone?",
    options: ["Tuscany", "Piedmont", "Veneto", "Sicily"],
    correctAnswer: "Veneto",
    explanation: "Amarone della Valpolicella is produced in the Veneto region.",
    category: "regions"
  },
  {
    question: "Which region is known for Tokaji Aszú?",
    options: ["Austria", "Hungary", "Slovakia", "Czech Republic"],
    correctAnswer: "Hungary",
    explanation: "Tokaji Aszú is produced in the Tokaj region of Hungary.",
    category: "regions"
  },
  {
    question: "Which region produces Soave?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Veneto",
    explanation: "Soave is a white wine from the Veneto region in northeastern Italy.",
    category: "regions"
  },
  {
    question: "Which region produces Sancerre?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "Sancerre is produced in the Loire Valley from Sauvignon Blanc grapes.",
    category: "regions"
  },
  {
    question: "Which region produces Côte-Rôtie?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "Côte-Rôtie is produced in the Northern Rhône Valley.",
    category: "regions"
  },
  {
    question: "Which Italian region is famous for Chianti?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Tuscany",
    explanation: "Chianti is produced in the Tuscany region of central Italy.",
    category: "regions"
  },
  {
    question: "Which region produces Muscadet?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "Muscadet is produced in the Loire Valley near the Atlantic coast.",
    category: "regions"
  },
  {
    question: "Which region produces Brunello di Montalcino?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Tuscany",
    explanation: "Brunello di Montalcino is produced in the Tuscany region.",
    category: "regions"
  },
  {
    question: "Which New Zealand region is famous for Pinot Noir?",
    options: ["Marlborough", "Central Otago", "Hawke's Bay", "Canterbury"],
    correctAnswer: "Central Otago",
    explanation: "Central Otago is New Zealand's premier Pinot Noir region.",
    category: "regions"
  },
  {
    question: "Which Oregon region is most famous for Pinot Noir?",
    options: ["Willamette Valley", "Rogue Valley", "Umpqua Valley", "Columbia Valley"],
    correctAnswer: "Willamette Valley",
    explanation: "Willamette Valley is Oregon's premier Pinot Noir region.",
    category: "regions"
  },
  {
    question: "Which region produces Chablis?",
    options: ["Côte d'Or", "Chablis", "Côte Chalonnaise", "Mâconnais"],
    correctAnswer: "Chablis",
    explanation: "Chablis is produced in the Chablis region of northern Burgundy.",
    category: "regions"
  },
  {
    question: "Which region produces Pouilly-Fumé?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "Pouilly-Fumé is produced in the Loire Valley from Sauvignon Blanc.",
    category: "regions"
  },
  {
    question: "Which region is famous for Gewürztraminer?",
    options: ["Burgundy", "Alsace", "Loire Valley", "Bordeaux"],
    correctAnswer: "Alsace",
    explanation: "Alsace is the most famous French region for Gewürztraminer.",
    category: "regions"
  },
  {
    question: "Which region produces Vouvray?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "Vouvray is produced in the Loire Valley from Chenin Blanc grapes.",
    category: "regions"
  },
  {
    question: "Which region produces Bandol?",
    options: ["Bordeaux", "Burgundy", "Provence", "Languedoc"],
    correctAnswer: "Provence",
    explanation: "Bandol is produced in the Provence region of southern France.",
    category: "regions"
  },
  {
    question: "Which region produces Condrieu?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "Condrieu is produced in the Northern Rhône Valley from Viognier.",
    category: "regions"
  },
  {
    question: "Which region produces Hermitage?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "Hermitage is produced in the Northern Rhône Valley.",
    category: "regions"
  },
  {
    question: "Which region produces Châteauneuf-du-Pape?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Southern Rhône",
    explanation: "Châteauneuf-du-Pape is produced in the Southern Rhône Valley.",
    category: "regions"
  },
  {
    question: "Which region produces Gavi?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Piedmont",
    explanation: "Gavi is produced in the Piedmont region from Cortese grapes.",
    category: "regions"
  },
  {
    question: "Which region produces Vinho Verde?",
    options: ["Douro", "Minho", "Dão", "Alentejo"],
    correctAnswer: "Minho",
    explanation: "Vinho Verde is produced in the Minho region of northern Portugal.",
    category: "regions"
  },
  {
    question: "Which region produces Rioja?",
    options: ["Andalusia", "Galicia", "La Rioja", "Catalonia"],
    correctAnswer: "La Rioja",
    explanation: "Rioja wine comes from the La Rioja region in northern Spain.",
    category: "regions"
  },
  {
    question: "Which region produces Ribera del Duero?",
    options: ["Rioja", "Castilla y León", "Catalonia", "Andalusia"],
    correctAnswer: "Castilla y León",
    explanation: "Ribera del Duero is in the Castilla y León region of Spain.",
    category: "regions"
  },
  {
    question: "Which region is known for Coonawarra Cabernet Sauvignon?",
    options: ["Barossa Valley", "Hunter Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Coonawarra",
    explanation: "Coonawarra in South Australia is renowned for its Cabernet Sauvignon.",
    category: "regions"
  },
  {
    question: "Which region is known for Hunter Valley Semillon?",
    options: ["Barossa Valley", "Hunter Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Hunter Valley",
    explanation: "Hunter Valley Semillon is known for its aging potential.",
    category: "regions"
  },
  {
    question: "Which region is known for Mendoza Malbec?",
    options: ["Argentina", "Chile", "Uruguay", "Brazil"],
    correctAnswer: "Argentina",
    explanation: "Mendoza is Argentina's premier wine region, famous for Malbec.",
    category: "regions"
  },
  {
    question: "Which region is known for Mosel Riesling?",
    options: ["Rheingau", "Pfalz", "Mosel", "Baden"],
    correctAnswer: "Mosel",
    explanation: "The Mosel region in Germany is famous for its steep vineyards and Riesling.",
    category: "regions"
  },
  {
    question: "Which region is known for Priorat Garnacha?",
    options: ["Rioja", "Ribera del Duero", "Priorat", "Rías Baixas"],
    correctAnswer: "Priorat",
    explanation: "Priorat in Catalonia is known for its powerful Garnacha-based wines.",
    category: "regions"
  },
  {
    question: "Which region is known for Wachau Grüner Veltliner?",
    options: ["Germany", "Austria", "Switzerland", "Slovenia"],
    correctAnswer: "Austria",
    explanation: "The Wachau region in Austria is famous for Grüner Veltliner.",
    category: "regions"
  },
  {
    question: "Which region is known for Assyrtiko wine?",
    options: ["Santorini", "Crete", "Rhodes", "Paros"],
    correctAnswer: "Santorini",
    explanation: "Santorini is famous for its Assyrtiko wines.",
    category: "regions"
  },
  {
    question: "Which Chilean region is most famous for wine?",
    options: ["Maipo Valley", "Casablanca Valley", "Colchagua Valley", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these Chilean valleys are important wine regions.",
    category: "regions"
  },
  {
    question: "Which South African region is most famous for wine?",
    options: ["Stellenbosch", "Paarl", "Constantia", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these South African regions are important for wine production.",
    category: "regions"
  },
  {
    question: "Which Spanish region is known for Tempranillo?",
    options: ["Rioja", "Ribera del Duero", "Toro", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these Spanish regions are famous for Tempranillo.",
    category: "regions"
  },
  {
    question: "Which Washington State region is most famous for wine?",
    options: ["Columbia Valley", "Yakima Valley", "Walla Walla Valley", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these Washington State regions are important for wine production.",
    category: "regions"
  },
  {
    question: "Which region produces Barossa Valley wines?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "South Australia",
    explanation: "Barossa Valley is located in South Australia.",
    category: "regions"
  },
  {
    question: "Which region produces Marlborough wines?",
    options: ["North Island", "South Island", "Both islands", "Stewart Island"],
    correctAnswer: "South Island",
    explanation: "Marlborough is located on New Zealand's South Island.",
    category: "regions"
  },
  {
    question: "Which region produces Central Otago wines?",
    options: ["North Island", "South Island", "Both islands", "Stewart Island"],
    correctAnswer: "South Island",
    explanation: "Central Otago is located on New Zealand's South Island.",
    category: "regions"
  },
  {
    question: "Which region produces Hunter Valley wines?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "New South Wales",
    explanation: "Hunter Valley is located in New South Wales, Australia.",
    category: "regions"
  },
  {
    question: "Which region produces Coonawarra wines?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "South Australia",
    explanation: "Coonawarra is located in South Australia.",
    category: "regions"
  },
  {
    question: "Which region produces Yarra Valley wines?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "Victoria",
    explanation: "Yarra Valley is located in Victoria, Australia.",
    category: "regions"
  },
  {
    question: "Which region produces Margaret River wines?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "Western Australia",
    explanation: "Margaret River is located in Western Australia.",
    category: "regions"
  },

  // Production & Techniques (40 questions)
  {
    question: "What is 'terroir' in winemaking?",
    options: [
      "A type of wine barrel",
      "The complete natural environment in which a wine is produced",
      "A winemaking technique",
      "A wine tasting term"
    ],
    correctAnswer: "The complete natural environment in which a wine is produced",
    explanation: "Terroir refers to the unique combination of environmental factors including climate, soil, and topography.",
    category: "production"
  },
  {
    question: "What is the process of aging wine in oak barrels called?",
    options: ["Fermentation", "Malolactic fermentation", "Oaking", "Racking"],
    correctAnswer: "Oaking",
    explanation: "Oaking is the process of aging wine in oak barrels to impart flavors.",
    category: "production"
  },
  {
    question: "What is the process of converting grape juice into wine called?",
    options: ["Distillation", "Fermentation", "Maceration", "Clarification"],
    correctAnswer: "Fermentation",
    explanation: "Fermentation is the process by which yeast converts sugars into alcohol.",
    category: "production"
  },
  {
    question: "What does 'malolactic fermentation' accomplish in winemaking?",
    options: ["Increases alcohol", "Converts harsh acids to softer ones", "Adds tannins", "Creates bubbles"],
    correctAnswer: "Converts harsh acids to softer ones",
    explanation: "Malolactic fermentation converts sharp malic acid to softer lactic acid.",
    category: "production"
  },
  {
    question: "What is the traditional method of making sparkling wine called?",
    options: ["Charmat method", "Méthode Champenoise", "Tank method", "Transfer method"],
    correctAnswer: "Méthode Champenoise",
    explanation: "Méthode Champenoise involves secondary fermentation in the bottle.",
    category: "production"
  },
  {
    question: "What does 'Sur lie' aging mean?",
    options: ["Aging on the lees", "Aging in oak", "Aging underground", "Aging in bottles"],
    correctAnswer: "Aging on the lees",
    explanation: "Sur lie means aging wine on dead yeast cells for added complexity.",
    category: "production"
  },
  {
    question: "What is the process of removing grape skins called in white wine production?",
    options: ["Pressing", "Crushing", "Destemming", "Punching down"],
    correctAnswer: "Pressing",
    explanation: "Pressing separates the juice from skins in white wine production.",
    category: "production"
  },
  {
    question: "What is the process of removing sediment from wine called?",
    options: ["Filtering", "Fining", "Racking", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Filtering, fining, and racking are all methods to clarify wine.",
    category: "production"
  },
  {
    question: "What is the process of removing yeast from sparkling wine called?",
    options: ["Riddling", "Disgorgement", "Dosage", "Tirage"],
    correctAnswer: "Disgorgement",
    explanation: "Disgorgement removes the sediment from sparkling wine.",
    category: "production"
  },
  {
    question: "What is the process of adding sugar to a wine called?",
    options: ["Chaptalization", "Enrichment", "Fortification", "Dosage"],
    correctAnswer: "Chaptalization",
    explanation: "Chaptalization is the addition of sugar to increase alcohol levels.",
    category: "production"
  },
  {
    question: "What is the process of exposing wine to oxygen before serving called?",
    options: ["Breathing", "Decanting", "Aerating", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms refer to exposing wine to oxygen before serving.",
    category: "production"
  },
  {
    question: "What is the process of chilling grapes before fermentation called?",
    options: ["Cold soaking", "Pre-fermentation maceration", "Cold stabilization", "Cryoextraction"],
    correctAnswer: "Cold soaking",
    explanation: "Cold soaking extracts color and flavor before fermentation begins.",
    category: "production"
  },
  {
    question: "What is the process of making rosé wine called?",
    options: ["Blending red and white", "Limited skin contact", "Saignée method", "All methods are used"],
    correctAnswer: "All methods are used",
    explanation: "Rosé can be made by limited skin contact, blending, or saignée method.",
    category: "production"
  },
  {
    question: "What is the process of removing grape stems called?",
    options: ["Destemming", "Crushing", "Pressing", "Sorting"],
    correctAnswer: "Destemming",
    explanation: "Destemming removes stems from grape clusters before fermentation.",
    category: "production"
  },
  {
    question: "What is the process of blending different grape varieties called?",
    options: ["Assemblage", "Cuvée", "Blend", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms refer to blending different wines or grape varieties.",
    category: "production"
  },
  {
    question: "What is the process of fortifying wine called?",
    options: ["Adding spirits", "Mutage", "Fortification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Fortification involves adding spirits to wine to increase alcohol content.",
    category: "production"
  },
  {
    question: "What is the process of making ice wine called?",
    options: ["Freezing fermented wine", "Harvesting frozen grapes", "Adding ice to must", "Cryoextraction"],
    correctAnswer: "Harvesting frozen grapes",
    explanation: "Ice wine is made from grapes that freeze naturally on the vine.",
    category: "production"
  },
  {
    question: "What is the process of making orange wine called?",
    options: ["Adding orange flavoring", "Skin contact with white grapes", "Using orange grapes", "Aging in orange wood"],
    correctAnswer: "Skin contact with white grapes",
    explanation: "Orange wine is made by fermenting white grapes with skin contact.",
    category: "production"
  },
  {
    question: "What causes the sweetness in Sauternes?",
    options: ["Added sugar", "Botrytis cinerea", "Late harvest", "Fortification"],
    correctAnswer: "Botrytis cinerea",
    explanation: "Botrytis cinerea (noble rot) concentrates sugars in Sauternes grapes.",
    category: "production"
  },
  {
    question: "What is the traditional method for making Port?",
    options: ["Continuous fermentation", "Fortification during fermentation", "Post-fermentation fortification", "Natural fermentation"],
    correctAnswer: "Fortification during fermentation",
    explanation: "Port is made by adding grape spirit during fermentation.",
    category: "production"
  },
  {
    question: "Which winemaking process creates tannins in red wine?",
    options: ["Fermentation temperature", "Skin contact", "Oak aging", "Malolactic fermentation"],
    correctAnswer: "Skin contact",
    explanation: "Tannins are extracted from grape skins during maceration.",
    category: "production"
  },
  {
    question: "What is the primary purpose of riddling in Champagne production?",
    options: ["Blending", "Clarification", "Pressure adjustment", "Flavor development"],
    correctAnswer: "Clarification",
    explanation: "Riddling moves sediment to the bottle neck for removal.",
    category: "production"
  },
  {
    question: "What does 'Botrytis cinerea' contribute to sweet wines?",
    options: ["Color intensity", "Alcohol content", "Concentrated flavors", "Tannin structure"],
    correctAnswer: "Concentrated flavors",
    explanation: "Botrytis dehydrates grapes, concentrating sugars and creating complex flavors.",
    category: "production"
  },
  {
    question: "What is the main characteristic of wines from high altitude vineyards?",
    options: ["Higher alcohol", "Greater acidity retention", "Darker color", "More tannins"],
    correctAnswer: "Greater acidity retention",
    explanation: "High altitude vineyards have cooler temperatures that preserve acidity.",
    category: "production"
  },
  {
    question: "What is the primary characteristic of Icewine/Eiswein?",
    options: ["Made from frozen grapes", "Served very cold", "Aged in ice caves", "Clear as ice"],
    correctAnswer: "Made from frozen grapes",
    explanation: "Icewine is made from grapes that freeze naturally on the vine.",
    category: "production"
  },
  {
    question: "What does 'Estate Grown' mean on a wine label?",
    options: ["Large production", "Grapes grown on producer's property", "Family owned", "Organic farming"],
    correctAnswer: "Grapes grown on producer's property",
    explanation: "Estate Grown indicates grapes were grown on the winery's own vineyards.",
    category: "production"
  },
  {
    question: "What does 'Old Vine' typically refer to?",
    options: ["Vines over 25 years old", "Vines over 50 years old", "No legal definition", "Vines over 100 years old"],
    correctAnswer: "No legal definition",
    explanation: "Old Vine has no legal definition and meaning varies by producer.",
    category: "production"
  },
  {
    question: "Which factor most influences wine style in cool climate regions?",
    options: ["Soil type", "Grape ripeness levels", "Altitude", "Rainfall"],
    correctAnswer: "Grape ripeness levels",
    explanation: "Cool climates often struggle to fully ripen grapes, affecting wine style.",
    category: "production"
  },
  {
    question: "Which process is essential for making quality sparkling wine?",
    options: ["High fermentation temperature", "Secondary fermentation", "Extended maceration", "Oxidative aging"],
    correctAnswer: "Secondary fermentation",
    explanation: "Quality sparkling wines require secondary fermentation to create bubbles.",
    category: "production"
  },
  {
    question: "What is the primary difference between Fino and Oloroso Sherry?",
    options: ["Grape variety", "Aging under flor", "Alcohol level", "Sweetness"],
    correctAnswer: "Aging under flor",
    explanation: "Fino ages under flor yeast, while Oloroso is fortified to prevent flor.",
    category: "production"
  },
  {
    question: "What does 'Solera' refer to in sherry production?",
    options: ["A type of grape", "An aging system", "A region", "A style of wine"],
    correctAnswer: "An aging system",
    explanation: "Solera is a fractional blending system used in sherry production.",
    category: "production"
  },
  {
    question: "What is the process of making sparkling wine in Champagne called?",
    options: ["Charmat method", "Traditional method", "Tank method", "Transfer method"],
    correctAnswer: "Traditional method",
    explanation: "The traditional method involves secondary fermentation in bottle.",
    category: "production"
  },
  {
    question: "What is the process of allowing wine to age in the bottle called?",
    options: ["Bottle aging", "Cellaring", "Maturation", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms refer to aging wine in bottles over time.",
    category: "production"
  },
  {
    question: "What is the process of fermenting wine in stainless steel called?",
    options: ["Cold fermentation", "Steel fermentation", "Tank fermentation", "All terms are used"],
    correctAnswer: "All terms are used",
    explanation: "Various terms describe fermentation in stainless steel tanks.",
    category: "production"
  },
  {
    question: "What is the process of fermenting wine in amphorae called?",
    options: ["Amphora fermentation", "Clay fermentation", "Ancient method", "All terms are used"],
    correctAnswer: "All terms are used",
    explanation: "Various terms describe fermentation in clay amphorae.",
    category: "production"
  },
  {
    question: "What is the process of making natural wine called?",
    options: ["Minimal intervention", "Natural winemaking", "Low sulfite winemaking", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Natural wine involves minimal intervention and low sulfite use.",
    category: "production"
  },
  {
    question: "What is the process of making biodynamic wine called?",
    options: ["Organic winemaking", "Biodynamic viticulture", "Sustainable winemaking", "Holistic winemaking"],
    correctAnswer: "Biodynamic viticulture",
    explanation: "Biodynamic winemaking follows specific holistic farming principles.",
    category: "production"
  },
  {
    question: "Which sparkling wine is made using the Charmat method?",
    options: ["Champagne", "Cava", "Prosecco", "Crémant"],
    correctAnswer: "Prosecco",
    explanation: "Prosecco is typically made using the Charmat (tank) method.",
    category: "production"
  },
  {
    question: "What does 'Mise en bouteille au domaine' mean?",
    options: ["Estate bottled", "Aged in domain", "Domain produced", "Domain owned"],
    correctAnswer: "Estate bottled",
    explanation: "This means the wine was bottled at the estate where it was produced.",
    category: "production"
  },
  {
    question: "What does 'Vendanges' mean in French wine terminology?",
    options: ["Vineyard", "Vintage", "Harvest", "Village"],
    correctAnswer: "Harvest",
    explanation: "Vendanges refers to the grape harvest period in French winemaking.",
    category: "production"
  },

  // Wine Styles & Characteristics (40 questions)
  {
    question: "Which of these wines is typically dry and crisp, often with notes of green apple and citrus?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Zinfandel"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc is known for its high acidity and aromatic profile.",
    category: "styles"
  },
  {
    question: "What does 'tannin' refer to in wine?",
    options: ["Sweetness", "Acidity", "Bitterness and astringency", "Alcohol content"],
    correctAnswer: "Bitterness and astringency",
    explanation: "Tannins contribute to a wine's bitterness, astringency, and structure.",
    category: "styles"
  },
  {
    question: "What is the ideal serving temperature for most red wines?",
    options: ["Chilled (40-45°F)", "Room temperature (68-72°F)", "Cool (60-65°F)", "Warm (75-80°F)"],
    correctAnswer: "Cool (60-65°F)",
    explanation: "Most red wines are best served slightly cooler than room temperature.",
    category: "styles"
  },
  {
    question: "Which red grape is known for its light body, high acidity, and red fruit flavors?",
    options: ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir is a delicate red grape that thrives in cooler climates.",
    category: "styles"
  },
  {
    question: "What is the ideal serving temperature for white wine?",
    options: ["35-40°F", "45-50°F", "55-60°F", "65-70°F"],
    correctAnswer: "45-50°F",
    explanation: "White wines are best served chilled to highlight their freshness.",
    category: "styles"
  },
  {
    question: "What is the ideal serving temperature for sparkling wine?",
    options: ["35-40°F", "45-50°F", "55-60°F", "65-70°F"],
    correctAnswer: "35-40°F",
    explanation: "Sparkling wines should be served well-chilled to maintain bubbles.",
    category: "styles"
  },
  {
    question: "What is the ideal serving temperature for rosé wine?",
    options: ["35-40°F", "45-50°F", "55-60°F", "65-70°F"],
    correctAnswer: "45-50°F",
    explanation: "Rosé wines are best served chilled like white wines.",
    category: "styles"
  },
  {
    question: "What is the term for the smell of a wine?",
    options: ["Bouquet", "Aroma", "Nose", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms refer to the smell or scent of wine.",
    category: "styles"
  },
  {
    question: "What is the term for the aftertaste of a wine?",
    options: ["Finish", "Length", "Persistence", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms describe how long flavors linger after swallowing.",
    category: "styles"
  },
  {
    question: "What is the term for the color of a wine?",
    options: ["Hue", "Intensity", "Depth", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms are used to describe wine color characteristics.",
    category: "styles"
  },
  {
    question: "What is the term for the body of a wine?",
    options: ["Weight", "Mouthfeel", "Texture", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Body refers to the weight and texture of wine in the mouth.",
    category: "styles"
  },
  {
    question: "What is the term for the acidity of a wine?",
    options: ["Tartness", "Freshness", "Crispness", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms can describe wine acidity characteristics.",
    category: "styles"
  },
  {
    question: "What is the term for the sweetness of a wine?",
    options: ["Residual sugar", "Sweetness level", "Sugar content", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms relate to the sweetness perception in wine.",
    category: "styles"
  },
  {
    question: "What is the term for the alcohol content of a wine?",
    options: ["ABV", "Alcohol by volume", "Strength", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these terms refer to the alcohol percentage in wine.",
    category: "styles"
  },
  {
    question: "What is the term for the legs of a wine?",
    options: ["Tears", "Glycerol trails", "Viscosity", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine legs indicate alcohol and glycerol content.",
    category: "styles"
  },
  {
    question: "What is the term for the bouquet of a wine?",
    options: ["Aroma", "Nose", "Scent", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Bouquet specifically refers to aromas from winemaking and aging.",
    category: "styles"
  },
  {
    question: "What is the term for the mouthfeel of a wine?",
    options: ["Texture", "Body", "Weight", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Mouthfeel encompasses all tactile sensations of wine.",
    category: "styles"
  },
  {
    question: "What is the term for the minerality of a wine?",
    options: ["Mineral character", "Terroir expression", "Soil influence", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Minerality refers to mineral-like characteristics in wine.",
    category: "styles"
  },
  {
    question: "What is the term for the complexity of a wine?",
    options: ["Depth", "Layers", "Sophistication", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Complexity refers to multiple layers of flavors and aromas.",
    category: "styles"
  },
  {
    question: "What is the term for the balance of a wine?",
    options: ["Harmony", "Integration", "Equilibrium", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Balance refers to harmony between wine components.",
    category: "styles"
  },
  {
    question: "What does 'Brut' mean on a bottle of sparkling wine?",
    options: ["Sweet", "Dry", "Semi-dry", "Extra dry"],
    correctAnswer: "Dry",
    explanation: "Brut indicates a dry sparkling wine with minimal residual sugar.",
    category: "styles"
  },
  {
    question: "What does 'Sec' mean on a wine label?",
    options: ["Sweet", "Dry", "Semi-dry", "Off-dry"],
    correctAnswer: "Dry",
    explanation: "Sec means dry in French wine terminology.",
    category: "styles"
  },
  {
    question: "What does 'Demi-Sec' mean on a wine label?",
    options: ["Very dry", "Dry", "Semi-dry", "Sweet"],
    correctAnswer: "Semi-dry",
    explanation: "Demi-Sec indicates a semi-dry wine with some sweetness.",
    category: "styles"
  },
  {
    question: "What does 'Extra Dry' mean on a sparkling wine label?",
    options: ["Driest style", "Slightly sweeter than Brut", "Very sweet", "Medium dry"],
    correctAnswer: "Slightly sweeter than Brut",
    explanation: "Extra Dry is actually slightly sweeter than Brut in sparkling wine.",
    category: "styles"
  },
  {
    question: "What is the ideal storage temperature for wine?",
    options: ["45-50°F", "55-60°F", "65-70°F", "70-75°F"],
    correctAnswer: "55-60°F",
    explanation: "Wine should be stored at a consistent cool temperature around 55°F.",
    category: "styles"
  },
  {
    question: "What does 'Trocken' mean on a German wine label?",
    options: ["Sweet", "Dry", "Sparkling", "Red"],
    correctAnswer: "Dry",
    explanation: "Trocken indicates a dry German wine with minimal residual sugar.",
    category: "styles"
  },
  {
    question: "What is the main difference between Chablis and other Chardonnays?",
    options: ["Different grape variety", "No oak aging typically", "Higher alcohol", "Different country"],
    correctAnswer: "No oak aging typically",
    explanation: "Chablis is typically fermented in stainless steel without oak influence.",
    category: "styles"
  },
  {
    question: "What does 'Vendange Tardive' mean?",
    options: ["Early harvest", "Late harvest", "Hand harvest", "Machine harvest"],
    correctAnswer: "Late harvest",
    explanation: "Vendange Tardive means late harvest, resulting in sweeter wines.",
    category: "styles"
  },
  {
    question: "What is the traditional bottle size for Champagne?",
    options: ["375ml", "750ml", "1L", "1.5L"],
    correctAnswer: "750ml",
    explanation: "The standard Champagne bottle size is 750ml.",
    category: "styles"
  },
  {
    question: "What does 'Blanc de Blancs' mean on a Champagne label?",
    options: ["White from whites", "White from blacks", "Mixed blend", "Sweet style"],
    correctAnswer: "White from whites",
    explanation: "Blanc de Blancs means white wine made from white grapes only.",
    category: "styles"
  },
  {
    question: "What does 'Blanc de Noirs' mean?",
    options: ["White from white grapes", "White from red grapes", "Red from white grapes", "Rosé wine"],
    correctAnswer: "White from red grapes",
    explanation: "Blanc de Noirs means white wine made from red/black grapes.",
    category: "styles"
  },
  {
    question: "What does 'NV' mean on a wine label?",
    options: ["New Vintage", "No Vintage", "Nevada", "Natural Vinification"],
    correctAnswer: "No Vintage",
    explanation: "NV indicates a non-vintage wine blended from multiple years.",
    category: "styles"
  },
  {
    question: "What does 'Vintage' mean on a wine label?",
    options: ["Old wine", "Year of harvest", "Quality level", "Aging method"],
    correctAnswer: "Year of harvest",
    explanation: "Vintage indicates the year the grapes were harvested.",
    category: "styles"
  },
  {
    question: "What does 'Réserve' typically indicate on a wine label?",
    options: ["Legal classification", "Extended aging", "Producer's selection", "Varies by region"],
    correctAnswer: "Varies by region",
    explanation: "The meaning of Réserve varies by country and region.",
    category: "styles"
  },
  {
    question: "What is the largest wine bottle size?",
    options: ["Magnum", "Double Magnum", "Nebuchadnezzar", "Melchizedek"],
    correctAnswer: "Melchizedek",
    explanation: "Melchizedek (30L) is the largest standard Champagne bottle size.",
    category: "styles"
  },
  {
    question: "What is the smallest wine bottle size?",
    options: ["Split", "Half bottle", "Piccolo", "Quarter bottle"],
    correctAnswer: "Piccolo",
    explanation: "Piccolo (187.5ml) is the smallest standard wine bottle size.",
    category: "styles"
  },
  {
    question: "Which of these is a sweet, fortified wine from Portugal?",
    options: ["Sherry", "Port", "Madeira", "Marsala"],
    correctAnswer: "Port",
    explanation: "Port is a sweet, fortified wine from the Douro Valley of Portugal.",
    category: "styles"
  },
  {
    question: "Which grape is the main component of Madeira wine?",
    options: ["Sercial", "Verdelho", "Bual", "Various depending on style"],
    correctAnswer: "Various depending on style",
    explanation: "Madeira uses different grapes including Sercial, Verdelho, Bual, and Malmsey.",
    category: "styles"
  },
  {
    question: "What is the primary grape used in traditional Champagne production?",
    options: ["Chardonnay", "Pinot Noir", "Pinot Meunier", "All three are used"],
    correctAnswer: "All three are used",
    explanation: "Traditional Champagne uses Chardonnay, Pinot Noir, and Pinot Meunier.",
    category: "styles"
  },
  {
    question: "Which of these is a sparkling wine from Spain?",
    options: ["Prosecco", "Champagne", "Cava", "Lambrusco"],
    correctAnswer: "Cava",
    explanation: "Cava is Spain's traditional method sparkling wine.",
    category: "styles"
  },

  // Wine Law & Classification (30 questions)
  {
    question: "What does 'Reserva' mean on a Spanish wine label?",
    options: ["Young wine", "Aged wine with specific requirements", "Reserve wine", "Old vines"],
    correctAnswer: "Aged wine with specific requirements",
    explanation: "Reserva indicates Spanish wine aged for minimum periods in oak and bottle.",
    category: "law"
  },
  {
    question: "What does 'Gran Reserva' mean on a Spanish wine label?",
    options: ["Great reserve", "Longest aging requirements", "Premium quality", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Gran Reserva requires the longest aging and indicates premium quality.",
    category: "law"
  },
  {
    question: "What does 'Riserva' mean on an Italian wine label?",
    options: ["Reserve quality", "Extended aging", "Higher alcohol", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Riserva indicates extended aging and often higher quality standards.",
    category: "law"
  },
  {
    question: "What does 'Superiore' mean on an Italian wine label?",
    options: ["Superior quality", "Higher alcohol", "Longer aging", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Superiore indicates higher alcohol and often stricter production standards.",
    category: "law"
  },
  {
    question: "What does 'Premier Cru' mean in Burgundy?",
    options: ["First vintage", "First quality level", "Second highest classification", "Village level"],
    correctAnswer: "Second highest classification",
    explanation: "Premier Cru is the second highest classification in Burgundy.",
    category: "law"
  },
  {
    question: "What does 'Grand Cru' mean in Burgundy?",
    options: ["Large production", "Highest classification", "Old vines", "Premium price"],
    correctAnswer: "Highest classification",
    explanation: "Grand Cru is the highest classification level in Burgundy.",
    category: "law"
  },
  {
    question: "What does 'DOCG' stand for in Italian wine?",
    options: ["Denominazione di Origine Controllata e Garantita", "Quality classification", "Highest Italian classification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "DOCG is the highest classification level for Italian wines.",
    category: "law"
  },
  {
    question: "What does 'AOC' stand for in French wine?",
    options: ["Appellation d'Origine Contrôlée", "Quality classification", "Geographic designation", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "AOC guarantees geographic origin and regulates production methods.",
    category: "law"
  },
  {
    question: "What does 'AVA' stand for in American wine?",
    options: ["American Viticultural Area", "Geographic designation", "Appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "AVA is the American system for designating wine regions.",
    category: "law"
  },
  {
    question: "What does 'Appellation d'Origine Contrôlée' (AOC) guarantee?",
    options: ["Quality level", "Geographic origin and production methods", "Price range", "Alcohol content"],
    correctAnswer: "Geographic origin and production methods",
    explanation: "AOC guarantees geographic origin and regulates production methods.",
    category: "law"
  },
  {
    question: "What does 'Denominazione di Origine Controllata e Garantita' (DOCG) represent?",
    options: ["Italian quality classification", "Production method", "Grape variety", "Vintage year"],
    correctAnswer: "Italian quality classification",
    explanation: "DOCG is the highest classification level for Italian wines.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a grape variety required for varietal labeling in the US?",
    options: ["51%", "75%", "85%", "100%"],
    correctAnswer: "75%",
    explanation: "US law requires 75% of the named grape variety for varietal labeling.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a grape variety required for varietal labeling in Australia?",
    options: ["75%", "80%", "85%", "90%"],
    correctAnswer: "85%",
    explanation: "Australia requires 85% of the named grape variety for varietal labeling.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a grape variety required for varietal labeling in the EU?",
    options: ["75%", "80%", "85%", "100%"],
    correctAnswer: "85%",
    explanation: "EU law requires 85% of the named grape variety for varietal labeling.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a vintage required for vintage labeling in the US?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "85%",
    explanation: "US law requires 85% of wine from the stated vintage year.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a vintage required for vintage labeling in the EU?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "85%",
    explanation: "EU law requires 85% of wine from the stated vintage year.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a region required for regional labeling in the US?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "75%",
    explanation: "US law requires 75% of grapes from the named region.",
    category: "law"
  },
  {
    question: "What is the legal minimum percentage of a region required for regional labeling in the EU?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "85%",
    explanation: "EU law requires 85% of grapes from the named region.",
    category: "law"
  },
  {
    question: "What does 'Cru' mean in Burgundy classification?",
    options: ["Vineyard site", "Vintage year", "Producer", "Grape variety"],
    correctAnswer: "Vineyard site",
    explanation: "In Burgundy, Cru refers to a specific vineyard site.",
    category: "law"
  },
  {
    question: "What does 'Crianza' mean on a Spanish wine label?",
    options: ["Young wine", "Aged wine with specific requirements", "Reserve wine", "Old vines"],
    correctAnswer: "Aged wine with specific requirements",
    explanation: "Crianza indicates minimum aging requirements in oak and bottle.",
    category: "law"
  },
  {
    question: "What is the primary difference between Champagne and Crémant?",
    options: ["Grape varieties", "Production region", "Method of production", "Sweetness level"],
    correctAnswer: "Production region",
    explanation: "Champagne can only be made in Champagne region, Crémant in other French regions.",
    category: "law"
  },
  {
    question: "What does 'VdP' stand for in French wine classification?",
    options: ["Vin de Pays", "Regional wine", "Country wine", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "VdP (Vin de Pays) indicates regional or country wine classification.",
    category: "law"
  },
  {
    question: "What does 'IGT' stand for in Italian wine classification?",
    options: ["Indicazione Geografica Tipica", "Regional wine", "Geographic indication", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "IGT indicates geographic typicity in Italian wine classification.",
    category: "law"
  },
  {
    question: "What does 'QbA' stand for in German wine classification?",
    options: ["Qualitätswein bestimmter Anbaugebiete", "Quality wine from specific regions", "Regional quality wine", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "QbA indicates quality wine from specific German regions.",
    category: "law"
  },
  {
    question: "What does 'QmP' stand for in German wine classification?",
    options: ["Qualitätswein mit Prädikat", "Quality wine with distinction", "Highest German classification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "QmP is the highest classification for German wines.",
    category: "law"
  },
  {
    question: "What does 'DO' stand for in Spanish wine classification?",
    options: ["Denominación de Origen", "Denomination of Origin", "Quality designation", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "DO indicates controlled denomination of origin in Spanish wines.",
    category: "law"
  },
  {
    question: "What does 'DOCa' stand for in Spanish wine classification?",
    options: ["Denominación de Origen Calificada", "Qualified Denomination of Origin", "Highest Spanish classification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "DOCa is the highest classification level for Spanish wines.",
    category: "law"
  },
  {
    question: "What does 'GI' stand for in Australian wine classification?",
    options: ["Geographic Indication", "Regional designation", "Australian appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "GI is the Australian system for geographic wine designations.",
    category: "law"
  },
  {
    question: "What does 'VQA' stand for in Canadian wine classification?",
    options: ["Vintners Quality Alliance", "Quality designation", "Canadian appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "VQA is Canada's wine quality and appellation system.",
    category: "law"
  },
  {
    question: "What does 'WO' stand for in South African wine classification?",
    options: ["Wine of Origin", "Geographic designation", "South African appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "WO is South Africa's wine of origin designation system.",
    category: "law"
  }
];

// Enhanced diversity function for question selection
const getQuestionCategory = (question) => {
  return question.category || 'general';
};

const getTenRandomQuestions = () => {
  const shuffled = shuffleArray([...WINE_QUIZ_QUESTIONS]);
  const selected = [];
  const usedCategories = [];
  
  // First, try to get diverse questions by category
  for (const question of shuffled) {
    if (selected.length >= 10) break;
    
    const category = getQuestionCategory(question);
    const lastCategory = usedCategories[usedCategories.length - 1];
    
    // Avoid consecutive questions from the same category
    if (category !== lastCategory || selected.length === 0) {
      selected.push(question);
      usedCategories.push(category);
    }
  }
  
  // If we don't have 10 questions due to category restrictions, fill remaining slots
  if (selected.length < 10) {
    for (const question of shuffled) {
      if (selected.length >= 10) break;
      if (!selected.includes(question)) {
        selected.push(question);
      }
    }
  }
  
  return selected.slice(0, 10);
};

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
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
  
  // New state for connectivity and reconnection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeGameInfo, setResumeGameInfo] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  // Enhanced connectivity detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (activeGameId && userId) {
        syncGameState();
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
  }, [activeGameId, userId]);

  // Enhanced Firebase initialization with reconnection logic
  useEffect(() => {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          
          // Check for previous session first
          const savedState = loadLocalState();
          const resumeInfo = getResumeInfo();
          
          if (savedState && savedState.userId === user.uid) {
            setUserName(savedState.userName);
            if (savedState.activeGameId) {
              const gameExists = await checkGameExists(savedState.activeGameId);
              if (gameExists) {
                setResumeGameInfo(savedState);
                setShowResumeModal(true);
              } else {
                clearLocalState();
                setMode('enterName');
              }
            } else {
              setMode('initial');
            }
          } else if (resumeInfo) {
            const gameExists = await checkGameExists(resumeInfo.gameId);
            if (gameExists) {
              setResumeGameInfo(resumeInfo);
              setShowResumeModal(true);
            } else {
              clearLocalState();
              setMode('enterName');
            }
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

  // Enhanced game data subscription with better error handling
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
          
          // Enhanced score synchronization - always sync the current player's score
          const currentPlayer = Array.isArray(data.players) ? 
            data.players.find(p => p.id === userId) : null;
          
          if (currentPlayer) {
            setScore(currentPlayer.score || 0);
            
            // Restore selected answer if not revealed yet
            if (!data.revealAnswers && currentPlayer.selectedAnswerForQuestion) {
              setSelectedAnswer(currentPlayer.selectedAnswerForQuestion);
              setAnswerSelected(true);
            } else if (data.revealAnswers) {
              setAnswerSelected(false);
              setSelectedAnswer(null);
            }
          }
          
          // Save current state for reconnection
          saveLocalState({
            userId,
            userName,
            activeGameId,
            mode,
            currentQuestionIndex: data.currentQuestionIndex || 0,
            score: currentPlayer?.score || 0,
            isHost: data.hostId === userId,
            selectedAnswer: currentPlayer?.selectedAnswerForQuestion || null
          });
          
          // Save resume info
          saveResumeInfo(activeGameId, userName, data.hostId === userId);
          
          setFeedback('');
        } else {
          setError('Game not found or ended.');
          clearLocalState();
          setActiveGameId(null);
          setGameData(null);
          setMode('multiplayer');
        }
      }, (err) => {
        console.error("Error listening to game updates:", err);
        setError("Connection lost. Trying to reconnect...");
        
        setTimeout(() => {
          if (isOnline) {
            setError('');
          }
        }, 3000);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, activeGameId, isAuthReady, userId, userName]);

  // Helper function to check if game exists
  const checkGameExists = async (gameId) => {
    try {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, gameId.toUpperCase());
      const docSnap = await getDoc(gameDocRef);
      return docSnap.exists();
    } catch (e) {
      console.error("Error checking game existence:", e);
      return false;
    }
  };

  // Sync game state when reconnecting
  const syncGameState = async () => {
    if (!activeGameId || !userId) return;
    
    try {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, activeGameId.toUpperCase());
      const docSnap = await getDoc(gameDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameData(data);
        
        const currentPlayer = data.players?.find(p => p.id === userId);
        if (currentPlayer) {
          setScore(currentPlayer.score || 0);
        }
      }
    } catch (e) {
      console.error("Error syncing game state:", e);
    }
  };

  // Resume game functionality
  const resumeGame = async (gameInfo) => {
    try {
      setReconnecting(true);
      setShowResumeModal(false);
      
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, gameInfo.activeGameId || gameInfo.gameId);
      const docSnap = await getDoc(gameDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const existingPlayer = data.players?.find(p => p.id === userId);
        
        if (existingPlayer) {
          setActiveGameId(gameInfo.activeGameId || gameInfo.gameId);
          setUserName(gameInfo.userName);
          setMode('multiplayer');
          setScore(existingPlayer.score || 0);
        } else {
          await rejoinGame(gameInfo.activeGameId || gameInfo.gameId);
        }
      } else {
        setError('Game no longer exists.');
        clearLocalState();
      }
    } catch (e) {
      console.error("Error resuming game:", e);
      setError("Failed to resume game. Please try joining manually.");
    } finally {
      setReconnecting(false);
    }
  };

  // Rejoin game functionality
  const rejoinGame = async (gameId) => {
    try {
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, gameId.toUpperCase());
      const docSnap = await getDoc(gameDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const newPlayer = {
          id: userId,
          score: 0,
          userName: userName,
          selectedAnswerForQuestion: null,
          feedbackForQuestion: null
        };
        
        await updateDoc(gameDocRef, {
          players: arrayUnion(newPlayer)
        });
        
        setActiveGameId(gameId);
        setMode('multiplayer');
        setScore(0);
      }
    } catch (e) {
      console.error("Error rejoining game:", e);
      setError("Failed to rejoin game.");
    }
  };

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
      
      saveLocalState({
        userId,
        userName: nameInput.trim(),
        activeGameId: null,
        mode: 'initial',
        currentQuestionIndex: 0,
        score: 0,
        isHost: false
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
    
    saveLocalState({
      userId,
      userName,
      activeGameId,
      mode,
      currentQuestionIndex,
      score: selectedOption === currentQuestion.correctAnswer ? score + 1 : score,
      isHost: false
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

  // Enhanced multiplayer answer handling - allows answer changes until revealed
  const handleMultiplayerAnswerClick = async (selectedOption) => {
    const safeGameData = gameData || { players: [], questions: [], currentQuestionIndex: 0, quizEnded: false, revealAnswers: false };
    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    
    // Don't allow changes if quiz ended or answers have been revealed
    if (safeGameData.quizEnded || safeGameData.revealAnswers) {
      return;
    }

    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);

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
      
      saveLocalState({
        userId,
        userName,
        activeGameId,
        mode,
        currentQuestionIndex: safeGameData.currentQuestionIndex,
        score,
        isHost: safeGameData.hostId === userId,
        selectedAnswer: selectedOption
      });
    } catch (e) {
      console.error("Error updating answer:", e);
      setError("Failed to submit your answer. It will be retried when connection is restored.");
      
      const pendingAnswer = {
        gameId: activeGameId,
        selectedOption,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pendingAnswer', JSON.stringify(pendingAnswer));
    }
  };

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
    // Show resume modal if needed
    if (showResumeModal && resumeGameInfo) {
      return (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Resume Previous Game?</h2>
          <p className="text-gray-700">
            We found a previous game session. Would you like to resume?
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Game ID: {resumeGameInfo.activeGameId || resumeGameInfo.gameId}</p>
            <p className="text-sm text-gray-600">Your Name: {resumeGameInfo.userName}</p>
            <p className="text-sm text-gray-600">Role: {resumeGameInfo.isHost ? 'Proctor' : 'Player'}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => resumeGame(resumeGameInfo)}
              disabled={reconnecting}
              className="flex-1 bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors"
            >
              {reconnecting ? 'Resuming...' : 'Resume Game'}
            </button>
            <button
              onClick={() => {
                setShowResumeModal(false);
                clearLocalState();
                setMode('initial');
              }}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg text-xl font-bold hover:bg-gray-600 transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      );
    }

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
                  It's a tie! Winners: {winners.map(w => w.
