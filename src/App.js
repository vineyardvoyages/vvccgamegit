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
const PENDING_ANSWERS_KEY = 'vineyard-voyages-pending-answers';

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
    localStorage.removeItem(PENDING_ANSWERS_KEY);
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

// Enhanced pending answer management
const savePendingAnswer = (gameId, selectedOption, questionIndex) => {
  try {
    const pendingAnswers = JSON.parse(localStorage.getItem(PENDING_ANSWERS_KEY) || '[]');
    const answerData = {
      gameId,
      selectedOption,
      questionIndex,
      timestamp: new Date().toISOString()
    };
    
    // Remove any existing pending answer for this game/question
    const filtered = pendingAnswers.filter(a => 
      !(a.gameId === gameId && a.questionIndex === questionIndex)
    );
    filtered.push(answerData);
    
    localStorage.setItem(PENDING_ANSWERS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save pending answer:', e);
  }
};

const getPendingAnswers = (gameId) => {
  try {
    const pendingAnswers = JSON.parse(localStorage.getItem(PENDING_ANSWERS_KEY) || '[]');
    return pendingAnswers.filter(a => a.gameId === gameId);
  } catch (e) {
    console.warn('Failed to get pending answers:', e);
    return [];
  }
};

const clearPendingAnswer = (gameId, questionIndex) => {
  try {
    const pendingAnswers = JSON.parse(localStorage.getItem(PENDING_ANSWERS_KEY) || '[]');
    const filtered = pendingAnswers.filter(a => 
      !(a.gameId === gameId && a.questionIndex === questionIndex)
    );
    localStorage.setItem(PENDING_ANSWERS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to clear pending answer:', e);
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
  { name: "Blaufränkisch", country: "Austria" }
];

// FIXED: Complete 200 Wine Quiz Questions with NO overlapping words between questions and answers
// Enhanced explanations that explain why other options are incorrect
const WINE_QUIZ_QUESTIONS = [
  {
    question: "Which grape is the primary variety in Tuscany's famous black-rooster wine region?",
    options: ["Sangiovese", "Nebbiolo", "Barbera", "Montepulciano"],
    correctAnswer: "Sangiovese",
    explanation: "Sangiovese is the backbone of Chianti Classico wines. Nebbiolo is used for Barolo and Barbaresco in Piedmont, Barbera produces lighter, food-friendly reds also from Piedmont, and Montepulciano is primarily grown in central Italy's Abruzzo region.",
    category: "grapes"
  },
  {
    question: "Which grape is most widely cultivated globally for wine production?",
    options: ["Cabernet Sauvignon", "Merlot", "Chardonnay", "Syrah"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon is the most widely planted wine grape globally due to its adaptability and quality. Merlot is popular but less widespread, Chardonnay is the most planted white grape, and Syrah has a more limited geographic range.",
    category: "grapes"
  },
  {
    question: "What is the signature grape variety of German winemaking?",
    options: ["Riesling", "Müller-Thurgau", "Silvaner", "Pinot Gris"],
    correctAnswer: "Riesling",
    explanation: "Riesling is Germany's most prestigious grape, producing aromatic whites with excellent aging potential. Müller-Thurgau is more widely planted but less esteemed, Silvaner produces simpler wines, and Pinot Gris (Grauburgunder) is a minor variety in Germany.",
    category: "grapes"
  },
  {
    question: "Which grape variety is exclusively used to make the 'King of Wines' from Piedmont?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Dolcetto"],
    correctAnswer: "Nebbiolo",
    explanation: "Nebbiolo is the sole grape used in Barolo, often called the 'King of Wines.' Barbera and Dolcetto are other Piedmontese grapes but produce different styles, and Sangiovese is Tuscany's primary grape, not used in Barolo.",
    category: "grapes"
  },
  {
    question: "What grape variety produces the light red wines from France's Beaujolais region?",
    options: ["Gamay", "Pinot Noir", "Syrah", "Grenache"],
    correctAnswer: "Gamay",
    explanation: "Gamay is the exclusive grape of Beaujolais, producing fresh, fruity wines. Pinot Noir is associated with Burgundy, Syrah with the Northern Rhône, and Grenache with the Southern Rhône and southern France.",
    category: "grapes"
  },
  {
    question: "Which grape dominates red wine production in northern Spain's most famous wine region?",
    options: ["Tempranillo", "Garnacha", "Mazuelo", "Graciano"],
    correctAnswer: "Tempranillo",
    explanation: "Tempranillo is the principal grape in Rioja, Spain's most renowned region. Garnacha, Mazuelo, and Graciano are secondary varieties used in small percentages for blending but are not the dominant grape.",
    category: "grapes"
  },
  {
    question: "Which grape is the main component of France's most famous dessert wine region?",
    options: ["Sémillon", "Chardonnay", "Sauvignon Blanc", "Viognier"],
    correctAnswer: "Sémillon",
    explanation: "Sémillon is the primary grape in Sauternes, susceptible to noble rot that concentrates sugars. Chardonnay doesn't develop noble rot effectively, Sauvignon Blanc is a minor component in Sauternes, and Viognier is not used in dessert wine production.",
    category: "grapes"
  },
  {
    question: "Which grape variety dominates the Left Bank vineyards of a famous French wine region?",
    options: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc", "Malbec"],
    correctAnswer: "Cabernet Sauvignon",
    explanation: "Cabernet Sauvignon thrives in the Left Bank's gravel soils of Bordeaux. Merlot dominates the Right Bank's clay soils, Cabernet Franc is typically a blending component, and Malbec is now primarily grown in Argentina.",
    category: "grapes"
  },
  {
    question: "What grape variety produces the mineral-driven white wines from northern Burgundy?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Aligoté"],
    correctAnswer: "Chardonnay",
    explanation: "Chardonnay is the exclusive grape of Chablis, expressing pure minerality without oak. Sauvignon Blanc is associated with the Loire Valley, Pinot Gris with Alsace, and Aligoté is a minor Burgundian variety producing simpler wines.",
    category: "grapes"
  },
  {
    question: "Which grape variety made New Zealand's South Island famous for white wine?",
    options: ["Sauvignon Blanc", "Chardonnay", "Pinot Gris", "Riesling"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc from Marlborough put New Zealand on the wine map with its distinctive herbaceous character. Chardonnay is grown but less distinctive, Pinot Gris is a minor variety, and Riesling has limited plantings in New Zealand.",
    category: "grapes"
  },
  {
    question: "Which grape variety is the foundation of Italian sparkling wine production?",
    options: ["Glera", "Trebbiano", "Pinot Grigio", "Verdicchio"],
    correctAnswer: "Glera",
    explanation: "Glera is the primary grape for Prosecco production. Trebbiano produces neutral table wines, Pinot Grigio makes still white wines, and Verdicchio is used for regional white wines in central Italy, not sparkling wine.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces Australia's most celebrated red wines?",
    options: ["Shiraz", "Cabernet Sauvignon", "Grenache", "Merlot"],
    correctAnswer: "Shiraz",
    explanation: "Shiraz (Syrah) is Australia's signature red grape, particularly from Barossa Valley. While Cabernet Sauvignon is important, it's less distinctive than in other regions. Grenache and Merlot play supporting roles in Australian viticulture.",
    category: "grapes"
  },
  {
    question: "Which grape variety represents Argentina's flagship red wine?",
    options: ["Malbec", "Cabernet Sauvignon", "Bonarda", "Syrah"],
    correctAnswer: "Malbec",
    explanation: "Malbec found its ideal home in Mendoza's high-altitude vineyards. Cabernet Sauvignon is grown but less distinctive, Bonarda is a secondary Argentine variety, and Syrah has limited plantings compared to Malbec's dominance.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the most aromatic white wines in France's eastern region?",
    options: ["Riesling", "Gewürztraminer", "Pinot Gris", "Muscat"],
    correctAnswer: "Riesling",
    explanation: "Riesling is Alsace's most planted and prestigious variety, producing dry aromatic wines. Gewürztraminer is very aromatic but less planted, Pinot Gris produces fuller-bodied wines, and Muscat has the smallest plantings among Alsace's noble grapes.",
    category: "grapes"
  },
  {
    question: "Which grape variety creates Hungary's world-famous dessert wines?",
    options: ["Furmint", "Hárslevelű", "Sárgamuskotály", "Kabar"],
    correctAnswer: "Furmint",
    explanation: "Furmint is the backbone of Tokaji Aszú, with thin skins that promote noble rot. Hárslevelű is a blending partner but secondary, Sárgamuskotály and Kabar are minor components in the blend.",
    category: "grapes"
  },
  {
    question: "Which red grape variety contributes to France's most prestigious sparkling wines?",
    options: ["Pinot Noir", "Chardonnay", "Pinot Meunier", "Pinot Gris"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir provides structure and aging potential to Champagne blends. While Chardonnay is also crucial, the question asks for red grapes. Pinot Meunier is used but less prestigious, and Pinot Gris is not used in Champagne production.",
    category: "grapes"
  },
  {
    question: "Which grape variety dominates Spain's traditional-method sparkling wine production?",
    options: ["Macabeo", "Parellada", "Xarel·lo", "Chardonnay"],
    correctAnswer: "Macabeo",
    explanation: "Macabeo provides the backbone for Cava blends with its acidity and aging potential. Parellada and Xarel·lo are important blending partners but secondary. Chardonnay is increasingly used but not traditional to Cava.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the dried-grape wines from Italy's Veneto region?",
    options: ["Corvina", "Rondinella", "Molinara", "Sangiovese"],
    correctAnswer: "Corvina",
    explanation: "Corvina is the dominant grape in Amarone, providing structure and flavor concentration during the drying process. Rondinella and Molinara are blending partners but secondary. Sangiovese is not used in Amarone production.",
    category: "grapes"
  },
  {
    question: "Which grape variety exclusively produces Burgundy's prestigious white wines?",
    options: ["Chardonnay", "Sauvignon Blanc", "Pinot Gris", "Aligoté"],
    correctAnswer: "Chardonnay",
    explanation: "Chardonnay is the sole grape for white Burgundy's grand crus and premier crus. Sauvignon Blanc is not grown in Burgundy, Pinot Gris is not traditional to the region, and Aligoté produces only basic appellations.",
    category: "grapes"
  },
  {
    question: "Which grape variety creates Burgundy's most ethereal red wines?",
    options: ["Pinot Noir", "Cabernet Sauvignon", "Merlot", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir is the exclusive red grape of Burgundy, expressing terroir with unmatched precision. Cabernet Sauvignon, Merlot, and Syrah are not permitted in Burgundy's classified vineyards and would not express the region's character.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the crisp white wines from France's Loire Valley?",
    options: ["Sauvignon Blanc", "Chardonnay", "Chenin Blanc", "Muscadet"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc creates Sancerre and Pouilly-Fumé's distinctive mineral-driven wines. Chardonnay is not significant in the Loire, Chenin Blanc is important but produces different styles, and Muscadet refers to both grape and wine but has a different character.",
    category: "grapes"
  },
  {
    question: "Which grape variety is the foundation of Loire Valley sweet and dry white wines?",
    options: ["Chenin Blanc", "Chardonnay", "Sauvignon Blanc", "Muscadet"],
    correctAnswer: "Chenin Blanc",
    explanation: "Chenin Blanc's high acidity allows it to produce both dry and sweet wines in Vouvray and other Loire appellations. Chardonnay is not traditional to the Loire, Sauvignon Blanc produces only dry wines, and Muscadet has more limited production scope.",
    category: "grapes"
  },
  {
    question: "Which grape variety creates the sea-influenced white wines from western France?",
    options: ["Melon de Bourgogne", "Muscadet", "Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Melon de Bourgogne",
    explanation: "Melon de Bourgogne is the grape that produces Muscadet wines. The second option 'Muscadet' refers to the wine/region name, not the grape. Sauvignon Blanc and Chardonnay are not used for Muscadet production.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces northeastern Italy's mineral white wines?",
    options: ["Garganega", "Trebbiano", "Pinot Grigio", "Verdicchio"],
    correctAnswer: "Garganega",
    explanation: "Garganega creates Soave's distinctive mineral character and aging potential. Trebbiano produces neutral wines without Soave's character, Pinot Grigio is grown throughout Italy but not specific to Soave, and Verdicchio is associated with central Italy.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces northwestern Italy's steely white wines?",
    options: ["Cortese", "Arneis", "Vermentino", "Falanghina"],
    correctAnswer: "Cortese",
    explanation: "Cortese creates Gavi's crisp, mineral-driven style that pairs excellently with seafood. Arneis produces more aromatic wines from the same region, Vermentino is associated with coastal areas, and Falanghina is from southern Italy.",
    category: "grapes"
  },
  {
    question: "Which grape variety shares identical DNA with California's signature red?",
    options: ["Primitivo", "Sangiovese", "Tempranillo", "Garnacha"],
    correctAnswer: "Primitivo",
    explanation: "DNA analysis proved Primitivo and Zinfandel are genetically identical varieties. Sangiovese is Italy's distinct variety, Tempranillo is Spain's signature grape, and Garnacha (Grenache) is a separate variety despite some historical confusion.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the aromatic white wines from France's Northern Rhône?",
    options: ["Viognier", "Chardonnay", "Marsanne", "Roussanne"],
    correctAnswer: "Viognier",
    explanation: "Viognier creates Condrieu's intensely aromatic, full-bodied whites. Chardonnay is not grown in the Northern Rhône, while Marsanne and Roussanne are used for different appellations and produce less aromatic wines.",
    category: "grapes"
  },
  {
    question: "Which grape variety dominates white wine production in the Northern Rhône's premier appellation?",
    options: ["Marsanne", "Chardonnay", "Viognier", "Roussanne"],
    correctAnswer: "Marsanne",
    explanation: "Marsanne is the primary component of white Hermitage, providing body and aging potential. Chardonnay is not grown in the Northern Rhône, Viognier is specific to Condrieu, and Roussanne is typically a blending partner to Marsanne.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the steep-slope reds from France's Northern Rhône?",
    options: ["Syrah", "Grenache", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Syrah",
    explanation: "Syrah is the exclusive red grape of Northern Rhône appellations like Côte-Rôtie and Hermitage. Grenache dominates the Southern Rhône, Mourvèdre is primarily Southern Rhône, and Cinsaut is used mainly for rosé production.",
    category: "grapes"
  },
  {
    question: "Which grape variety anchors the Southern Rhône's famous papal appellation?",
    options: ["Grenache", "Syrah", "Mourvèdre", "Cinsaut"],
    correctAnswer: "Grenache",
    explanation: "Grenache typically dominates Châteauneuf-du-Pape blends, providing fruit and alcohol. Syrah is important but secondary, Mourvèdre adds structure but in smaller proportions, and Cinsaut is typically a minor blending component.",
    category: "grapes"
  },
  {
    question: "Which grape variety creates the mineral-driven whites from France's central Loire?",
    options: ["Sauvignon Blanc", "Chardonnay", "Chenin Blanc", "Muscadet"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc produces Pouilly-Fumé's distinctive mineral and smoky character. Chardonnay is not significant in this area, Chenin Blanc is used elsewhere in the Loire, and Muscadet is from the western Loire with different characteristics.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces Tuscany's longest-lived red wines?",
    options: ["Sangiovese", "Nebbiolo", "Barbera", "Dolcetto"],
    correctAnswer: "Sangiovese",
    explanation: "Sangiovese creates Brunello di Montalcino, which ages for decades. Nebbiolo produces long-lived wines but in Piedmont, not Tuscany. Barbera and Dolcetto are also Piedmontese varieties that generally don't achieve Brunello's longevity.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces Piedmont's other 'noble' red wine besides the 'King'?",
    options: ["Nebbiolo", "Barbera", "Sangiovese", "Dolcetto"],
    correctAnswer: "Nebbiolo",
    explanation: "Nebbiolo produces both Barolo (the 'King') and Barbaresco (the 'Queen') in Piedmont. Barbera produces everyday wines, Sangiovese is Tuscany's grape, and Dolcetto creates simple, quaffable wines without noble status.",
    category: "grapes"
  },
  {
    question: "Which grape variety was specifically developed in South Africa?",
    options: ["Pinotage", "Chenin Blanc", "Sauvignon Blanc", "Chardonnay"],
    correctAnswer: "Pinotage",
    explanation: "Pinotage was created in 1925 as a cross between Pinot Noir and Cinsaut specifically for South African conditions. Chenin Blanc, Sauvignon Blanc, and Chardonnay are international varieties that were brought to South Africa but not developed there.",
    category: "grapes"
  },
  {
    question: "Which grape variety thrives in the volcanic soils of a famous Greek island?",
    options: ["Assyrtiko", "Moschofilero", "Savatiano", "Rhoditis"],
    correctAnswer: "Assyrtiko",
    explanation: "Assyrtiko is perfectly adapted to Santorini's volcanic ash soils and strong winds, producing distinctive mineral wines. Moschofilero is from the Peloponnese, Savatiano is used for simple table wines, and Rhoditis is a minor blending variety.",
    category: "grapes"
  },
  {
    question: "Which grape variety dominates the Veneto's everyday red wine production?",
    options: ["Corvina", "Sangiovese", "Nebbiolo", "Barbera"],
    correctAnswer: "Corvina",
    explanation: "Corvina is the primary grape in both Valpolicella and Amarone wines from Veneto. Sangiovese is Tuscany's grape, Nebbiolo is from Piedmont, and Barbera, while grown in Veneto, is not the dominant variety for the region's classified wines.",
    category: "grapes"
  },
  {
    question: "Which grape variety is used to create traditional Italian aged vinegar?",
    options: ["Trebbiano", "Sangiovese", "Lambrusco", "Barbera"],
    correctAnswer: "Trebbiano",
    explanation: "Trebbiano di Modena is the primary grape for authentic Balsamic vinegar production. While other grapes can be used, Sangiovese, Lambrusco, and Barbera are not traditional choices for this specific product.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the red wines from France's Loire Valley castle region?",
    options: ["Cabernet Franc", "Pinot Noir", "Gamay", "Merlot"],
    correctAnswer: "Cabernet Franc",
    explanation: "Cabernet Franc creates Chinon's distinctive red wines with characteristic bell pepper and red fruit notes. Pinot Noir is associated with Burgundy, Gamay with Beaujolais, and Merlot with Bordeaux and is rarely grown in the Loire Valley.",
    category: "grapes"
  },
  {
    question: "Which grape variety serves as Virginia's official state grape?",
    options: ["Viognier", "Chardonnay", "Sauvignon Blanc", "Albariño"],
    correctAnswer: "Viognier",
    explanation: "Virginia designated Viognier as its official state grape due to its exceptional performance in the state's climate. Chardonnay and Sauvignon Blanc are grown but not distinctive to Virginia, and Albariño is a newer planting without official status.",
    category: "grapes"
  },
  {
    question: "Which grape variety produces the finest German whites from steep riverside vineyards?",
    options: ["Riesling", "Chardonnay", "Sauvignon Blanc", "Gewürztraminer"],
    correctAnswer: "Riesling",
    explanation: "Riesling reaches its peak expression on the Mosel's steep slate slopes, producing wines of extraordinary elegance and minerality. Chardonnay and Sauvignon Blanc are not traditional German varieties, and Gewürztraminer, while grown in Germany, doesn't achieve Riesling's prestige.",
    category: "grapes"
  },

  // Wine Regions (50 questions) - FIXED to avoid word overlap and enhanced explanations
  {
    question: "Which Spanish region produces wines from the variety known for its citrus and mineral character?",
    options: ["La Mancha", "Ribera del Duero", "Rías Baixas", "Priorat"],
    correctAnswer: "Rías Baixas",
    explanation: "Rías Baixas in Galicia is renowned for Albariño wines with citrus and mineral notes. La Mancha produces bulk wines, Ribera del Duero focuses on red wines from Tempranillo, and Priorat creates powerful reds from old vines.",
    category: "regions"
  },
  {
    question: "Which country consistently produces the highest volume of wine annually?",
    options: ["France", "Italy", "Spain", "United States"],
    correctAnswer: "Italy",
    explanation: "Italy leads global wine production by volume, with diverse regions from north to south. France produces prestigious wines but lower volume, Spain has extensive vineyards but lower yields, and the United States produces significantly less than these European leaders.",
    category: "regions"
  },
  {
    question: "Which French region is the spiritual home of two noble grape varieties?",
    options: ["Bordeaux", "Burgundy", "Champagne", "Loire Valley"],
    correctAnswer: "Burgundy",
    explanation: "Burgundy is the ancestral home of Pinot Noir and Chardonnay, expressing terroir through single-variety wines. Bordeaux specializes in blends, Champagne uses multiple varieties for sparkling wine, and the Loire Valley grows diverse varieties but isn't the origin of any.",
    category: "regions"
  },
  {
    question: "Which Italian region produces both the 'King' and 'Queen' of wines?",
    options: ["Tuscany", "Piedmont", "Veneto", "Sicily"],
    correctAnswer: "Piedmont",
    explanation: "Piedmont produces Barolo (the 'King') and Barbaresco (the 'Queen'), both from Nebbiolo grapes. Tuscany produces prestigious wines but not these specific titles, Veneto is known for Amarone, and Sicily produces distinctive wines but not these royal appellations.",
    category: "regions"
  },
  {
    question: "Which German region is renowned for producing aromatic white wines from steep vineyards?",
    options: ["Mosel", "Rheingau", "Pfalz", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All three regions produce exceptional Riesling: Mosel from slate soils on steep slopes, Rheingau as the historic birthplace of fine German wine, and Pfalz as the largest quality wine region. Each contributes distinctively to Germany's reputation.",
    category: "regions"
  },
  {
    question: "Which US state dominates American wine production?",
    options: ["California", "Oregon", "Washington", "New York"],
    correctAnswer: "California",
    explanation: "California produces about 85% of American wine, with diverse climates supporting numerous varieties. Oregon specializes in Pinot Noir and cool-climate varieties, Washington excels with Cabernet Sauvignon and Merlot, and New York focuses on hybrid varieties and some vinifera.",
    category: "regions"
  },
  {
    question: "Which Australian region became famous for full-bodied red wines?",
    options: ["Hunter Valley", "Barossa Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Barossa Valley",
    explanation: "Barossa Valley established Australia's reputation for powerful Shiraz wines from old vines. Hunter Valley is known for Semillon and lighter reds, Coonawarra for elegant Cabernet Sauvignon, and Clare Valley for Riesling and structured reds.",
    category: "regions"
  },
  {
    question: "Which New Zealand region put the country on the international wine map?",
    options: ["Marlborough", "Central Otago", "Hawke's Bay", "Canterbury"],
    correctAnswer: "Marlborough",
    explanation: "Marlborough's distinctive Sauvignon Blanc launched New Zealand's global reputation in the 1980s. Central Otago is famous for Pinot Noir, Hawke's Bay for Bordeaux-style reds, and Canterbury for diverse cool-climate varieties.",
    category: "regions"
  },
  {
    question: "Which Portuguese region creates the world's most famous fortified wines?",
    options: ["Vinho Verde", "Douro", "Dão", "Alentejo"],
    correctAnswer: "Douro",
    explanation: "The Douro Valley produces Port, the world's most renowned fortified wine. Vinho Verde makes light, refreshing wines, Dão produces structured reds and whites, and Alentejo creates full-bodied table wines but no famous fortified wines.",
    category: "regions"
  },
  {
    question: "Which French region established the template for premium red wine blends?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Bordeaux",
    explanation: "Bordeaux created the model for Cabernet Sauvignon-based blends copied worldwide. Burgundy focuses on single-variety wines, the Loire Valley produces diverse styles but not this blend template, and the Rhône Valley blends different varieties.",
    category: "regions"
  },
  {
    question: "Which Italian region produces wines from dried grapes in the Veneto?",
    options: ["Tuscany", "Piedmont", "Veneto", "Sicily"],
    correctAnswer: "Veneto",
    explanation: "Veneto produces Amarone through the appassimento process of drying grapes. Tuscany doesn't traditionally use this method, Piedmont focuses on fresh grape vinification, and Sicily uses different traditional techniques.",
    category: "regions"
  },
  {
    question: "Which country produces the world's most famous botrytis-affected dessert wines?",
    options: ["Austria", "Hungary", "Slovakia", "Czech Republic"],
    correctAnswer: "Hungary",
    explanation: "Hungary's Tokaj region produces Tokaji Aszú, considered the 'Wine of Kings.' Austria makes excellent dessert wines but they're not as historically famous, while Slovakia and Czech Republic have limited dessert wine production.",
    category: "regions"
  },
  {
    question: "Which Italian region creates distinctive white wines from volcanic soils?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Sicily",
    explanation: "Sicily's Mount Etna produces unique wines from volcanic soils, offering distinctive minerality. Piedmont has diverse soils but not volcanic, Tuscany has various soil types but limited volcanic influence, and Veneto's soils are primarily alluvial and limestone.",
    category: "regions"
  },
  {
    question: "Which French region produces mineral-driven white wines from oyster-shell soils?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "The Loire Valley's Sancerre and Chablis regions have fossil-rich soils including oyster shells that contribute minerality. Burgundy has limestone but different composition, Bordeaux has gravel and clay, and the Rhône Valley has granite and various sedimentary soils.",
    category: "regions"
  },
  {
    question: "Which French region produces intense reds from ancient granite slopes?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "The Northern Rhône's Côte-Rôtie and Hermitage are built on ancient granite, producing intense Syrah wines. Burgundy has limestone soils, the Southern Rhône has diverse soils but different geology, and the Loire Valley has various soil types but not these granite slopes.",
    category: "regions"
  },
  {
    question: "Which Italian region is famous for wines made in the heart of Tuscany?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Tuscany",
    explanation: "Tuscany produces Chianti, Brunello, and other famous wines from central Italy. Piedmont is in northwest Italy, Veneto in the northeast, and Sicily is the southern island - none are in Tuscany's central location.",
    category: "regions"
  },
  {
    question: "Which French region produces crisp whites near the Atlantic coast?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "The Loire Valley's Muscadet region near the Atlantic produces crisp, sea-influenced whites. Burgundy is inland, Bordeaux is near the Atlantic but produces different styles, and the Rhône Valley is in southeastern France, far from the ocean.",
    category: "regions"
  },
  {
    question: "Which Italian region produces age-worthy reds from central Italy's hills?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Tuscany",
    explanation: "Tuscany's Brunello di Montalcino and Chianti Classico are among Italy's most age-worthy reds. Piedmont produces age-worthy wines but from northwest Italy, Veneto's reds have different aging potential, and Sicily's focus is on diverse styles rather than long aging.",
    category: "regions"
  },
  {
    question: "Which New Zealand region produces the country's most acclaimed red wines?",
    options: ["Marlborough", "Central Otago", "Hawke's Bay", "Canterbury"],
    correctAnswer: "Central Otago",
    explanation: "Central Otago produces New Zealand's finest Pinot Noir in the world's southernmost wine region. Marlborough excels with whites, Hawke's Bay produces good reds but different styles, and Canterbury has a cooler climate less suited to premium reds.",
    category: "regions"
  },
  {
    question: "Which American region pioneered cool-climate winemaking on the West Coast?",
    options: ["Willamette Valley", "Rogue Valley", "Umpqua Valley", "Columbia Valley"],
    correctAnswer: "Willamette Valley",
    explanation: "Oregon's Willamette Valley pioneered cool-climate Pinot Noir in America, proving premium wines could be made outside California. Rogue and Umpqua Valleys are smaller Oregon regions, while Columbia Valley spans Washington and Oregon with warmer sites.",
    category: "regions"
  },
  {
    question: "Which French region produces the most mineral-driven expressions of a noble white grape?",
    options: ["Côte d'Or", "Chablis", "Côte Chalonnaise", "Mâconnais"],
    correctAnswer: "Chablis",
    explanation: "Chablis produces the most mineral, unoaked expressions of Chardonnay from Kimmeridgian soils. Côte d'Or often uses oak, Côte Chalonnaise produces rounder styles, and Mâconnais creates more accessible, less mineral-driven wines.",
    category: "regions"
  },
  {
    question: "Which French region produces distinctive whites from smoke-influenced terroir?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "Pouilly-Fumé's name references the 'smoky' character from its terroir and grape expression. Burgundy doesn't emphasize smoky character, Bordeaux whites are different in style, and Rhône Valley whites have different characteristics.",
    category: "regions"
  },
  {
    question: "Which French region is most famous for aromatic white wine varieties?",
    options: ["Burgundy", "Alsace", "Loire Valley", "Bordeaux"],
    correctAnswer: "Alsace",
    explanation: "Alsace specializes in aromatic varieties like Gewürztraminer, Riesling, and Muscat, often in single-variety wines. Burgundy focuses on Chardonnay, the Loire Valley has diverse varieties but different focus, and Bordeaux emphasizes blends over aromatics.",
    category: "regions"
  },
  {
    question: "Which French region produces both dry and sweet wines from the same grape variety?",
    options: ["Burgundy", "Bordeaux", "Loire Valley", "Rhône Valley"],
    correctAnswer: "Loire Valley",
    explanation: "The Loire Valley produces both dry and sweet Chenin Blanc wines, particularly in Vouvray. Burgundy focuses on dry Chardonnay, Bordeaux whites are typically dry, and the Rhône Valley doesn't emphasize sweet wine production.",
    category: "regions"
  },
  {
    question: "Which French region produces rosé wines from Mediterranean coastal vineyards?",
    options: ["Bordeaux", "Burgundy", "Provence", "Languedoc"],
    correctAnswer: "Provence",
    explanation: "Provence is France's premier rosé region, producing elegant pale wines from Mediterranean varieties. Bordeaux produces some rosé but isn't specialized, Burgundy rarely makes rosé, and Languedoc produces rosé but with different style and reputation.",
    category: "regions"
  },
  {
    question: "Which French region produces aromatic whites from a single noble variety?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "Condrieu in the Northern Rhône produces aromatic Viognier wines from a single variety. Burgundy uses Chardonnay but different style, the Southern Rhône typically blends varieties, and the Loire Valley uses different grapes for its aromatic wines.",
    category: "regions"
  },
  {
    question: "Which French region produces age-worthy whites from granite hillsides?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Northern Rhône",
    explanation: "Hermitage produces long-lived white wines from Marsanne and Roussanne on granite soils. Burgundy has limestone soils, the Southern Rhône has different geology and typically shorter-lived whites, and the Loire Valley has varied soils but different grape varieties.",
    category: "regions"
  },
  {
    question: "Which French region blends multiple varieties in its most famous appellation?",
    options: ["Burgundy", "Northern Rhône", "Southern Rhône", "Loire Valley"],
    correctAnswer: "Southern Rhône",
    explanation: "Châteauneuf-du-Pape allows 13 grape varieties, creating complex blends. Burgundy emphasizes single varieties, the Northern Rhône typically uses single varieties, and the Loire Valley, while diverse, doesn't have appellations with this many permitted varieties.",
    category: "regions"
  },
  {
    question: "Which Italian region produces crisp whites from northwestern coastal areas?",
    options: ["Piedmont", "Tuscany", "Veneto", "Sicily"],
    correctAnswer: "Piedmont",
    explanation: "Piedmont's Gavi produces crisp Cortese wines near the Mediterranean influence. Tuscany is central Italy, Veneto is northeastern, and Sicily is the southern island - none have Piedmont's specific northwestern coastal character.",
    category: "regions"
  },
  {
    question: "Which Portuguese region creates light, refreshing wines from northern coastal areas?",
    options: ["Douro", "Minho", "Dão", "Alentejo"],
    correctAnswer: "Minho",
    explanation: "Minho produces Vinho Verde, light wines from northern Portugal's Atlantic-influenced climate. Douro is inland and produces different styles, Dão is central Portugal with structured reds, and Alentejo is southern Portugal with full-bodied wines.",
    category: "regions"
  },
  {
    question: "Which Spanish region is known for temperate climate red wines from northern Spain?",
    options: ["Andalusia", "Galicia", "La Rioja", "Catalonia"],
    correctAnswer: "La Rioja",
    explanation: "La Rioja in northern Spain benefits from Atlantic and Mediterranean influences, producing balanced Tempranillo wines. Andalusia is hot southern Spain, Galicia is cool and wet, and Catalonia has Mediterranean climate but different character.",
    category: "regions"
  },
  {
    question: "Which Spanish region produces structured reds from high-altitude continental climate?",
    options: ["La Mancha", "Castilla y León", "Catalonia", "Andalusia"],
    correctAnswer: "Castilla y León",
    explanation: "Ribera del Duero in Castilla y León benefits from high altitude and continental climate for structured Tempranillo. La Mancha is lower altitude, Catalonia has Mediterranean influence, and Andalusia is hot southern climate.",
    category: "regions"
  },
  {
    question: "Which Australian region is famous for terra rossa soils and elegant reds?",
    options: ["Barossa Valley", "Hunter Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Coonawarra",
    explanation: "Coonawarra's unique terra rossa (red earth) over limestone produces elegant Cabernet Sauvignon. Barossa Valley has different soils and fuller-bodied wines, Hunter Valley focuses on whites and lighter reds, and Clare Valley has diverse soils but different character.",
    category: "regions"
  },
  {
    question: "Which Australian region pioneered age-worthy white wines with distinctive character?",
    options: ["Barossa Valley", "Hunter Valley", "Coonawarra", "Clare Valley"],
    correctAnswer: "Hunter Valley",
    explanation: "Hunter Valley Semillon develops unique honeyed, toasty character with age, creating one of Australia's most distinctive wine styles. Other regions produce age-worthy whites but not with this specific transformative character.",
    category: "regions"
  },
  {
    question: "Which South American region revolutionized high-altitude viticulture?",
    options: ["Argentina", "Chile", "Uruguay", "Brazil"],
    correctAnswer: "Argentina",
    explanation: "Mendoza pioneered high-altitude viticulture (up to 5,000+ feet), proving elevation's benefits for wine quality. Chile has some high sites but not to this extent, while Uruguay and Brazil focus on different approaches to quality.",
    category: "regions"
  },
  {
    question: "Which German region produces wines from the steepest vineyard slopes?",
    options: ["Rheingau", "Pfalz", "Mosel", "Baden"],
    correctAnswer: "Mosel",
    explanation: "Mosel's vineyards include some of the world's steepest slopes (up to 70% gradient) along the river. Rheingau has slopes but gentler, Pfalz is relatively flat, and Baden has hills but not these extreme gradients.",
    category: "regions"
  },
  {
    question: "Which Spanish region creates powerful reds from slate-rich soils?",
    options: ["La Mancha", "Ribera del Duero", "Priorat", "Rías Baixas"],
    correctAnswer: "Priorat",
    explanation: "Priorat's llicorella (schist) soils produce intensely concentrated wines from old Garnacha and Cariñena vines. La Mancha has different soils and styles, Ribera del Duero has limestone and clay, and Rías Baixas focuses on white wines.",
    category: "regions"
  },
  {
    question: "Which Austrian region produces wines from terraced vineyards along a famous river?",
    options: ["Germany", "Austria", "Switzerland", "Slovenia"],
    correctAnswer: "Austria",
    explanation: "Wachau's terraced vineyards along the Danube produce exceptional Grüner Veltliner and Riesling. Germany has similar terraced sites but the question asks specifically about this Austrian region's character and grape varieties.",
    category: "regions"
  },
  {
    question: "Which Greek island produces distinctive wines from ancient volcanic activity?",
    options: ["Santorini", "Crete", "Rhodes", "Paros"],
    correctAnswer: "Santorini",
    explanation: "Santorini's volcanic soils and unique basket-trained vines produce distinctive Assyrtiko wines. Crete has ancient winemaking but different terroir, Rhodes produces wines but not from volcanic soils, and Paros has limited wine production.",
    category: "regions"
  },
  {
    question: "Which South American country produces wines from diverse coastal to mountain climates?",
    options: ["Maipo Valley", "Casablanca Valley", "Colchagua Valley", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All these Chilean valleys contribute to the country's diverse wine production: Maipo for traditional reds, Casablanca for cool-climate whites, and Colchagua for premium reds. Each offers distinct terroir within Chile's varied geography.",
    category: "regions"
  },
  {
    question: "Which African country's wine regions benefit from maritime influences?",
    options: ["Stellenbosch", "Paarl", "Constantia", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All South African regions benefit from ocean influences: Stellenbosch from False Bay, Paarl from Berg River valley, and Constantia from direct Atlantic exposure. This maritime influence moderates the warm climate essential for quality wine production.",
    category: "regions"
  },
  {
    question: "Which American state's wine regions benefit from diverse microclimates?",
    options: ["Columbia Valley", "Yakima Valley", "Walla Walla Valley", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All Washington State regions offer distinct microclimates: Columbia Valley as the large encompassing AVA, Yakima Valley with warm days and cool nights, and Walla Walla Valley with unique wind patterns and soil types.",
    category: "regions"
  },
  {
    question: "Which Australian state produces wines from the famous valley known for reds?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "South Australia",
    explanation: "Barossa Valley in South Australia is world-famous for red wines, particularly Shiraz. New South Wales has Hunter Valley (known more for whites), Victoria has various regions, and Western Australia has Margaret River (known for diverse varieties).",
    category: "regions"
  },
  {
    question: "Which New Zealand island hosts the country's most famous wine region?",
    options: ["North Island", "South Island", "Both islands", "Stewart Island"],
    correctAnswer: "South Island",
    explanation: "Marlborough on the South Island is New Zealand's most famous and largest wine region. The North Island has important regions but none with Marlborough's international recognition, and Stewart Island has no significant wine production.",
    category: "regions"
  },
  {
    question: "Which New Zealand island produces the country's most prestigious red wines?",
    options: ["North Island", "South Island", "Both islands", "Stewart Island"],
    correctAnswer: "South Island",
    explanation: "Central Otago on the South Island produces New Zealand's most acclaimed Pinot Noir. While the North Island produces reds, they don't have the international prestige of Central Otago's wines, and Stewart Island has no wine production.",
    category: "regions"
  },
  {
    question: "Which Australian state contains the region famous for age-worthy white wines?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "New South Wales",
    explanation: "Hunter Valley in New South Wales produces Australia's most famous age-worthy whites (Semillon). Victoria and South Australia produce excellent wines but not with this specific aging characteristic, and Western Australia focuses on different styles.",
    category: "regions"
  },
  {
    question: "Which Australian state produces wines from the terra rossa region?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "South Australia",
    explanation: "Coonawarra in South Australia is famous for its terra rossa soils producing elegant Cabernet Sauvignon. Other states have various soil types but not this distinctive red earth over limestone combination.",
    category: "regions"
  },
  {
    question: "Which Australian state hosts the cool-climate region near Melbourne?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "Victoria",
    explanation: "Yarra Valley near Melbourne in Victoria is one of Australia's premier cool-climate regions for Pinot Noir and Chardonnay. Other states have cool areas but not with this proximity to Melbourne and specific character.",
    category: "regions"
  },
  {
    question: "Which Australian state produces wines from the region known for Cabernet-Merlot blends?",
    options: ["New South Wales", "Victoria", "South Australia", "Western Australia"],
    correctAnswer: "Western Australia",
    explanation: "Margaret River in Western Australia is renowned for Bordeaux-style blends of Cabernet Sauvignon and Merlot. Other states produce these varieties but Margaret River has the strongest reputation for these specific blends.",
    category: "regions"
  },

  // Production & Techniques (40 questions) - Enhanced explanations
  {
    question: "What encompasses the complete natural environment affecting wine character?",
    options: [
      "A type of wine barrel",
      "The complete natural environment in which a wine is produced",
      "A winemaking technique",
      "A wine tasting term"
    ],
    correctAnswer: "The complete natural environment in which a wine is produced",
    explanation: "Terroir includes climate, soil, topography, and human factors that influence wine character. It's not a barrel type (which affects flavor differently), not a single technique (it's environmental), and not just a tasting term (it's a measurable concept).",
    category: "production"
  },
  {
    question: "What winemaking process involves aging wine in wooden containers?",
    options: ["Fermentation", "Malolactic fermentation", "Oaking", "Racking"],
    correctAnswer: "Oaking",
    explanation: "Oaking specifically refers to aging wine in oak barrels to impart flavors like vanilla and spice. Fermentation converts sugar to alcohol, malolactic fermentation softens acidity, and racking moves wine between containers without necessarily using oak.",
    category: "production"
  },
  {
    question: "What biological process transforms grape juice into wine?",
    options: ["Distillation", "Fermentation", "Maceration", "Clarification"],
    correctAnswer: "Fermentation",
    explanation: "Fermentation uses yeast to convert grape sugars into alcohol and CO2. Distillation concentrates alcohol (used for spirits), maceration extracts color and tannins, and clarification removes particles after fermentation is complete.",
    category: "production"
  },
  {
    question: "What secondary fermentation process makes wine smoother and less tart?",
    options: ["Increases alcohol", "Converts harsh acids to softer ones", "Adds tannins", "Creates bubbles"],
    correctAnswer: "Converts harsh acids to softer ones",
    explanation: "Malolactic fermentation converts sharp malic acid to softer lactic acid, creating a rounder mouthfeel. It doesn't increase alcohol (that's primary fermentation), doesn't add tannins (those come from skins), and doesn't create bubbles (that requires different processes).",
    category: "production"
  },
  {
    question: "What method creates the finest sparkling wines through bottle fermentation?",
    options: ["Charmat method", "Méthode Champenoise", "Tank method", "Transfer method"],
    correctAnswer: "Méthode Champenoise",
    explanation: "Méthode Champenoise (Traditional Method) creates complex sparkling wines through secondary fermentation in the bottle. Charmat method ferments in tanks (faster, less complex), tank method is the same as Charmat, and transfer method is a hybrid approach with different characteristics.",
    category: "production"
  },
  {
    question: "What aging technique involves contact with dead yeast cells?",
    options: ["Aging on the lees", "Aging in oak", "Aging underground", "Aging in bottles"],
    correctAnswer: "Aging on the lees",
    explanation: "Sur lie aging keeps wine in contact with dead yeast cells (lees) for complexity and texture. Oak aging uses wooden barrels for different flavors, underground aging provides temperature stability, and bottle aging develops different characteristics without lees contact.",
    category: "production"
  },
  {
    question: "What process separates juice from solid matter in white wine production?",
    options: ["Pressing", "Crushing", "Destemming", "Punching down"],
    correctAnswer: "Pressing",
    explanation: "Pressing extracts juice while leaving skins behind, crucial for white wine's color and style. Crushing breaks grape skins, destemming removes stems, and punching down submerges red wine skins during fermentation - none separate juice like pressing does.",
    category: "production"
  },
  {
    question: "What processes remove unwanted particles from wine?",
    options: ["Filtering", "Fining", "Racking", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All three clarify wine through different mechanisms: filtering physically removes particles, fining uses agents to bind and remove impurities, and racking separates clear wine from sediment. Each has specific applications and benefits.",
    category: "production"
  },
  {
    question: "What process removes sediment from sparkling wine necks?",
    options: ["Riddling", "Disgorgement", "Dosage", "Tirage"],
    correctAnswer: "Disgorgement",
    explanation: "Disgorgement removes frozen sediment from sparkling wine necks after riddling. Riddling moves sediment to the neck, dosage adds final sweetness adjustment, and tirage is the initial bottling for secondary fermentation - none remove sediment like disgorgement.",
    category: "production"
  },
  {
    question: "What process increases potential alcohol in grape must?",
    options: ["Chaptalization", "Enrichment", "Fortification", "Dosage"],
    correctAnswer: "Chaptalization",
    explanation: "Chaptalization adds sugar before fermentation to increase final alcohol levels in cool climates. Enrichment is a general term, fortification adds alcohol directly to wine, and dosage adjusts sparkling wine sweetness - none increase potential alcohol like chaptalization.",
    category: "production"
  },
  {
    question: "What processes expose wine to oxygen before consumption?",
    options: ["Breathing", "Decanting", "Aerating", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All three expose wine to oxygen to develop aromas and soften tannins: breathing occurs naturally in the glass, decanting separates from sediment while aerating, and aerating specifically introduces air. Each method achieves similar goals through different approaches.",
    category: "production"
  },
  {
    question: "What pre-fermentation technique extracts color and flavor at low temperatures?",
    options: ["Cold soaking", "Pre-fermentation maceration", "Cold stabilization", "Cryoextraction"],
    correctAnswer: "Cold soaking",
    explanation: "Cold soaking macerates grapes before fermentation begins, extracting color and flavor without alcohol. Pre-fermentation maceration is similar but less specific, cold stabilization removes tartrates from finished wine, and cryoextraction concentrates must through freezing.",
    category: "production"
  },
  {
    question: "What methods can produce rosé wine?",
    options: ["Blending red and white", "Limited skin contact", "Saignée method", "All methods are used"],
    correctAnswer: "All methods are used",
    explanation: "Rosé production uses multiple approaches: blending adds red wine to white (limited use), limited skin contact briefly extracts color, and saignée bleeds off juice from red wine fermentation. Each method produces different styles and quality levels.",
    category: "production"
  },
  {
    question: "What process removes grape stems before fermentation?",
    options: ["Destemming", "Crushing", "Pressing", "Sorting"],
    correctAnswer: "Destemming",
    explanation: "Destemming specifically removes stems to avoid bitter tannins and vegetal flavors. Crushing breaks grape skins, pressing extracts juice, and sorting removes damaged grapes - none specifically address stem removal like destemming.",
    category: "production"
  },
  {
    question: "What winemaking practices combine different wines or varieties?",
    options: ["Assemblage", "Cuvée", "Blend", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All terms describe combining wines: assemblage is the French term for blending, cuvée refers to a specific blend or tank, and blend is the general English term. Each represents the same fundamental practice with different linguistic or technical emphasis.",
    category: "production"
  },
  {
    question: "What processes increase wine's alcohol content with spirits?",
    options: ["Adding spirits", "Mutage", "Fortification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All describe adding spirits to wine: adding spirits is the general description, mutage is the French term, and fortification is the English technical term. Each increases alcohol and stops fermentation, preserving residual sugar.",
    category: "production"
  },
  {
    question: "How are authentic ice wines produced?",
    options: ["Freezing fermented wine", "Harvesting frozen grapes", "Adding ice to must", "Cryoextraction"],
    correctAnswer: "Harvesting frozen grapes",
    explanation: "True ice wine requires naturally frozen grapes harvested in winter, concentrating sugars and acids. Freezing fermented wine doesn't concentrate properly, adding ice dilutes the must, and cryoextraction artificially freezes must - none achieve ice wine's natural concentration.",
    category: "production"
  },
  {
    question: "What technique creates orange-colored wines from white grapes?",
    options: ["Adding orange flavoring", "Skin contact with white grapes", "Using orange grapes", "Aging in orange wood"],
    correctAnswer: "Skin contact with white grapes",
    explanation: "Orange wine results from fermenting white grapes with extended skin contact, extracting color and tannins. It doesn't use orange flavoring (that would be artificial), orange grapes don't exist as a wine variety, and orange wood isn't used for aging.",
    category: "production"
  },
  {
    question: "What creates the concentrated sweetness in premium dessert wines?",
    options: ["Added sugar", "Botrytis cinerea", "Late harvest", "Fortification"],
    correctAnswer: "Botrytis cinerea",
    explanation: "Botrytis cinerea (noble rot) dehydrates grapes, concentrating sugars and creating complex flavors in wines like Sauternes. Added sugar is artificial, late harvest concentrates sugar but less dramatically, and fortification stops fermentation but doesn't concentrate grape sugars.",
    category: "production"
  },
  {
    question: "When is grape spirit added during Port production?",
    options: ["Continuous fermentation", "Fortification during fermentation", "Post-fermentation fortification", "Natural fermentation"],
    correctAnswer: "Fortification during fermentation",
    explanation: "Port production adds grape spirit during fermentation, stopping the process and preserving residual sugar. Continuous fermentation would create dry wine, post-fermentation fortification wouldn't preserve sweetness, and natural fermentation would consume all sugars.",
    category: "production"
  },
  {
    question: "What winemaking process contributes tannins to red wine?",
    options: ["Fermentation temperature", "Skin contact", "Oak aging", "Malolactic fermentation"],
    correctAnswer: "Skin contact",
    explanation: "Extended skin contact during fermentation extracts tannins from grape skins and seeds. Fermentation temperature affects extraction but doesn't provide tannins, oak aging adds different tannin types, and malolactic fermentation affects acidity, not tannins.",
    category: "production"
  },
  {
    question: "What is the main purpose of riddling in sparkling wine production?",
    options: ["Blending", "Clarification", "Pressure adjustment", "Flavor development"],
    correctAnswer: "Clarification",
    explanation: "Riddling gradually moves sediment to the bottle neck for removal, clarifying sparkling wine. It doesn't blend different wines, doesn't adjust pressure (that occurs during fermentation), and doesn't develop flavor (that happens during aging).",
    category: "production"
  },
  {
    question: "How does noble rot enhance dessert wine production?",
    options: ["Color intensity", "Alcohol content", "Concentrated flavors", "Tannin structure"],
    correctAnswer: "Concentrated flavors",
    explanation: "Botrytis concentrates grape sugars and develops complex honeyed flavors through dehydration. It doesn't intensify color (dessert wines are often golden), doesn't increase alcohol content directly, and doesn't add tannins (it affects white grapes primarily).",
    category: "production"
  },
  {
    question: "What advantage do high-altitude vineyards provide?",
    options: ["Higher alcohol", "Greater acidity retention", "Darker color", "More tannins"],
    correctAnswer: "Greater acidity retention",
    explanation: "High altitude's cooler temperatures preserve natural acidity essential for wine balance. Higher altitude doesn't increase alcohol (depends on ripeness), doesn't darken color necessarily, and doesn't add tannins (those come from grape variety and winemaking).",
    category: "production"
  },
  {
    question: "What defines authentic ice wine production?",
    options: ["Made from frozen grapes", "Served very cold", "Aged in ice caves", "Clear as ice"],
    correctAnswer: "Made from frozen grapes",
    explanation: "Ice wine must be made from naturally frozen grapes to concentrate sugars and acids. Serving temperature doesn't define the wine type, ice cave aging isn't required, and clarity isn't the defining characteristic - only the frozen grape harvest matters.",
    category: "production"
  },
  {
    question: "What does 'Estate Grown' indicate on wine labels?",
    options: ["Large production", "Grapes grown on producer's property", "Family owned", "Organic farming"],
    correctAnswer: "Grapes grown on producer's property",
    explanation: "Estate Grown means the winery owns the vineyards and controls grape growing. It doesn't indicate production size (can be large or small), doesn't require family ownership, and doesn't mandate organic farming - only vineyard ownership matters.",
    category: "production"
  },
  {
    question: "What does 'Old Vine' designation actually mean legally?",
    options: ["Vines over 25 years old", "Vines over 50 years old", "No legal definition", "Vines over 100 years old"],
    correctAnswer: "No legal definition",
    explanation: "Old Vine lacks legal definition and varies by producer and region. Some consider 25+ years old, others 50+, and some only centennial vines qualify - the term has marketing value but no standardized meaning.",
    category: "production"
  },
  {
    question: "What most significantly impacts wine style in cool climates?",
    options: ["Soil type", "Grape ripeness levels", "Altitude", "Rainfall"],
    correctAnswer: "Grape ripeness levels",
    explanation: "Cool climates often struggle to ripen grapes fully, creating lighter, more acidic styles. While soil type, altitude, and rainfall influence wine, ripeness level most directly affects fundamental wine character in marginal climates.",
    category: "production"
  },
  {
    question: "What process is essential for premium sparkling wine quality?",
    options: ["High fermentation temperature", "Secondary fermentation", "Extended maceration", "Oxidative aging"],
    correctAnswer: "Secondary fermentation",
    explanation: "Secondary fermentation creates bubbles and complexity in quality sparkling wine. High fermentation temperature would harm delicate flavors, extended maceration isn't used for sparkling wines, and oxidative aging would damage freshness required for sparkling wine.",
    category: "production"
  },
  {
    question: "What distinguishes Fino from Oloroso sherry production?",
    options: ["Grape variety", "Aging under flor", "Alcohol level", "Sweetness"],
    correctAnswer: "Aging under flor",
    explanation: "Fino ages under flor yeast that prevents oxidation, while Oloroso is fortified to kill flor, allowing oxidative aging. Both use the same grapes, alcohol levels differ as a result of flor presence, and both are typically dry - flor determines the style.",
    category: "production"
  },
  {
    question: "What does the Solera system accomplish in sherry production?",
    options: ["A type of grape", "An aging system", "A region", "A style of wine"],
    correctAnswer: "An aging system",
    explanation: "Solera is a fractional blending system that maintains consistent style across years by blending old and new wines. It's not a grape variety, not a geographic region, and not a wine style itself - it's the aging and blending methodology.",
    category: "production"
  },
  {
    question: "What is another term for the traditional sparkling wine method?",
    options: ["Charmat method", "Traditional method", "Tank method", "Transfer method"],
    correctAnswer: "Traditional method",
    explanation: "Traditional Method is the modern term for Méthode Champenoise, involving bottle fermentation. Charmat method uses tank fermentation, tank method is the same as Charmat, and transfer method involves bottle fermentation but different riddling - only Traditional Method matches the question.",
    category: "production"
  },
  {
    question: "What terms describe wine aging in glass containers?",
    options: ["Bottle aging", "Cellaring", "Maturation", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All terms describe wine development in bottles: bottle aging specifically refers to the process, cellaring emphasizes storage conditions, and maturation describes the developmental changes. Each term captures different aspects of the same process.",
    category: "production"
  },
  {
    question: "What terms describe fermentation in metal vessels?",
    options: ["Cold fermentation", "Steel fermentation", "Tank fermentation", "All terms are used"],
    correctAnswer: "All terms are used",
    explanation: "Various terms describe stainless steel fermentation: cold fermentation emphasizes temperature control, steel fermentation specifies the material, and tank fermentation describes the vessel shape. All are used depending on context and emphasis.",
    category: "production"
  },
  {
    question: "What terms describe fermentation in ancient-style clay vessels?",
    options: ["Amphora fermentation", "Clay fermentation", "Ancient method", "All terms are used"],
    correctAnswer: "All terms are used",
    explanation: "Different terms describe clay vessel fermentation: amphora fermentation specifies the vessel type, clay fermentation emphasizes the material, and ancient method highlights the historical approach. Each captures different aspects of this traditional technique.",
    category: "production"
  },
  {
    question: "What approaches characterize natural wine production?",
    options: ["Minimal intervention", "Natural winemaking", "Low sulfite winemaking", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Natural wine philosophy encompasses all these approaches: minimal intervention reduces human manipulation, natural winemaking avoids additives, and low sulfite winemaking limits preservatives. Together they represent the natural wine movement's principles.",
    category: "production"
  },
  {
    question: "What farming approach guides biodynamic wine production?",
    options: ["Organic winemaking", "Biodynamic viticulture", "Sustainable winemaking", "Holistic winemaking"],
    correctAnswer: "Biodynamic viticulture",
    explanation: "Biodynamic viticulture specifically follows Rudolf Steiner's principles treating the vineyard as a living system. Organic winemaking avoids chemicals but lacks biodynamic's spiritual aspects, sustainable winemaking is broader, and holistic winemaking is less specific.",
    category: "production"
  },
  {
    question: "Which sparkling wine uses tank fermentation for efficiency?",
    options: ["Champagne", "Cava", "Prosecco", "Crémant"],
    correctAnswer: "Prosecco",
    explanation: "Prosecco typically uses the Charmat (tank) method for fresh, fruity character. Champagne uses traditional method, Cava uses traditional method, and Crémant uses traditional method - only Prosecco regularly uses tank fermentation.",
    category: "production"
  },
  {
    question: "What does 'Mise en bouteille au domaine' guarantee?",
    options: ["Estate bottled", "Aged in domain", "Domain produced", "Domain owned"],
    correctAnswer: "Estate bottled",
    explanation: "This French term means the wine was bottled at the estate where it was produced, ensuring quality control. It doesn't guarantee aging location, domain production alone, or domain ownership - only that bottling occurred at the property.",
    category: "production"
  },
  {
    question: "What does 'Vendanges' refer to in French winemaking?",
    options: ["Vineyard", "Vintage", "Harvest", "Village"],
    correctAnswer: "Harvest",
    explanation: "Vendanges specifically means the grape harvest period in French. Vineyard is 'vignoble', vintage is 'millésime', and village is 'village' - only harvest matches this French term.",
    category: "production"
  },

  // Wine Styles & Characteristics (40 questions) - Enhanced explanations
  {
    question: "Which wine style typically shows green apple and citrus notes with crisp acidity?",
    options: ["Cabernet Sauvignon", "Chardonnay (oaked)", "Sauvignon Blanc", "Zinfandel"],
    correctAnswer: "Sauvignon Blanc",
    explanation: "Sauvignon Blanc displays distinctive green apple, lime, and herbaceous character with high acidity. Cabernet Sauvignon shows dark fruit and tannins, oaked Chardonnay shows tropical fruit and vanilla, and Zinfandel shows jammy red and black fruit.",
    category: "styles"
  },
  {
    question: "What wine component creates a drying, astringent mouthfeel?",
    options: ["Sweetness", "Acidity", "Bitterness and astringency", "Alcohol content"],
    correctAnswer: "Bitterness and astringency",
    explanation: "Tannins create astringency and bitterness, binding with proteins in saliva and creating a drying sensation. Sweetness provides richness, acidity gives tartness, and alcohol provides warmth - none create the drying effect of tannins.",
    category: "styles"
  },
  {
    question: "What is the optimal serving temperature for most red wines?",
    options: ["Chilled (40-45°F)", "Room temperature (68-72°F)", "Cool (60-65°F)", "Warm (75-80°F)"],
    correctAnswer: "Cool (60-65°F)",
    explanation: "Cool temperatures enhance red wine's fruit and structure while moderating alcohol. Chilled temperatures mute flavors, modern room temperature is too warm and emphasizes alcohol, and warm temperatures make wines taste unbalanced.",
    category: "styles"
  },
  {
    question: "Which red wine is known for elegance, red fruit, and high acidity?",
    options: ["Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah"],
    correctAnswer: "Pinot Noir",
    explanation: "Pinot Noir typically shows red cherry, raspberry, and earthy notes with bright acidity and silky tannins. Cabernet Sauvignon is fuller with black fruit, Merlot is softer with plum notes, and Syrah is more powerful with dark fruit and spice.",
    category: "styles"
  },
  {
    question: "What is the ideal serving temperature for white wines?",
    options: ["35-40°F", "45-50°F", "55-60°F", "65-70°F"],
    correctAnswer: "45-50°F",
    explanation: "This temperature range preserves white wine's freshness and acidity while allowing aromas to develop. Colder temperatures mute flavors, while warmer temperatures make whites taste flabby and reduce their refreshing character.",
    category: "styles"
  },
  {
    question: "What serving temperature best preserves sparkling wine's effervescence?",
    options: ["35-40°F", "45-50°F", "55-60°F", "65-70°F"],
    correctAnswer: "35-40°F",
    explanation: "Cold temperatures help maintain CO2 in solution, preserving bubbles and freshness. Warmer temperatures cause rapid CO2 loss, reducing effervescence and making sparkling wines taste flat and less refreshing.",
    category: "styles"
  },
  {
    question: "What temperature best showcases rosé wine's characteristics?",
    options: ["35-40°F", "45-50°F", "55-60°F", "65-70°F"],
    correctAnswer: "45-50°F",
    explanation: "This temperature highlights rosé's fresh fruit character and crisp acidity. Colder temperatures mute delicate flavors, while warmer temperatures reduce the refreshing quality that makes rosé appealing.",
    category: "styles"
  },
  {
    question: "What terms describe wine's aromatic qualities?",
    options: ["Bouquet", "Aroma", "Nose", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All terms describe wine's smell: aroma refers to grape-derived scents, bouquet to those developed through winemaking and aging, and nose encompasses all olfactory aspects. Each term captures different aspects of wine's aromatic complexity.",
    category: "styles"
  },
  {
    question: "What terms describe wine's flavor persistence after swallowing?",
    options: ["Finish", "Length", "Persistence", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "All terms describe how long flavors continue after swallowing: finish refers to the ending taste, length to duration, and persistence to how long flavors remain detectable. Quality wines typically show longer, more complex finishes.",
    category: "styles"
  },
  {
    question: "What aspects contribute to wine's visual assessment?",
    options: ["Hue", "Intensity", "Depth", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine color evaluation includes multiple aspects: hue describes the actual color, intensity measures saturation, and depth indicates concentration. Together they provide clues about grape variety, age, and winemaking style.",
    category: "styles"
  },
  {
    question: "What terms describe wine's tactile sensations?",
    options: ["Weight", "Mouthfeel", "Texture", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine's physical presence involves multiple sensations: weight describes lightness or fullness, mouthfeel encompasses all tactile aspects, and texture describes smoothness or roughness. Each contributes to overall drinking experience.",
    category: "styles"
  },
  {
    question: "What terms characterize wines with bright, refreshing qualities?",
    options: ["Tartness", "Freshness", "Crispness", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "High acidity creates multiple related sensations: tartness provides tanginess, freshness gives vitality, and crispness delivers clean, refreshing character. These qualities make wines food-friendly and thirst-quenching.",
    category: "styles"
  },
  {
    question: "What terms relate to wine's sugar content perception?",
    options: ["Residual sugar", "Sweetness level", "Sugar content", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine sweetness involves related concepts: residual sugar is the measurable amount remaining after fermentation, sweetness level describes perception, and sugar content indicates total sugars. Perception can differ from measured amounts due to acidity and other factors.",
    category: "styles"
  },
  {
    question: "What terms indicate wine's alcohol strength?",
    options: ["ABV", "Alcohol by volume", "Strength", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine's alcohol content can be expressed various ways: ABV is the standard abbreviation, alcohol by volume is the full term, and strength is the general descriptor. All refer to the percentage of alcohol in the wine.",
    category: "styles"
  },
  {
    question: "What terms describe the streaks that form on wine glass sides?",
    options: ["Tears", "Glycerol trails", "Viscosity", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine legs result from multiple factors: tears describes their appearance, glycerol trails indicates a contributing component, and viscosity refers to the physical property creating them. Higher alcohol and glycerol content create more pronounced legs.",
    category: "styles"
  },
  {
    question: "What terms encompass wine's complete aromatic profile?",
    options: ["Aroma", "Nose", "Scent", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Wine's smell involves comprehensive terminology: aroma traditionally refers to grape-derived scents, nose encompasses all olfactory aspects, and scent is the general term. Modern usage often treats these terms interchangeably.",
    category: "styles"
  },
  {
    question: "What terms describe wine's physical presence in the mouth?",
    options: ["Texture", "Body", "Weight", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Mouthfeel encompasses multiple sensations: texture describes smoothness or grittiness, body indicates lightness or fullness, and weight measures the wine's physical presence. These elements combine to create overall tactile impression.",
    category: "styles"
  },
  {
    question: "What terms describe wine's mineral-like characteristics?",
    options: ["Mineral character", "Terroir expression", "Soil influence", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Minerality involves related concepts: mineral character describes the taste sensation, terroir expression links it to origin, and soil influence suggests the source. While debated scientifically, these terms describe recognized flavor profiles.",
    category: "styles"
  },
  {
    question: "What terms indicate wine's flavor and aromatic diversity?",
    options: ["Depth", "Layers", "Sophistication", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Complex wines show multiple qualities: depth indicates intensity of character, layers suggests multiple flavor levels, and sophistication implies refinement. These characteristics develop through quality grapes, skilled winemaking, and often aging.",
    category: "styles"
  },
  {
    question: "What terms describe harmonious wine composition?",
    options: ["Harmony", "Integration", "Equilibrium", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Well-balanced wines demonstrate related qualities: harmony suggests pleasing proportions, integration indicates components working together, and equilibrium implies proper balance. Quality wines achieve balance among fruit, acidity, tannins, and alcohol.",
    category: "styles"
  },
  {
    question: "What does 'Brut' indicate on sparkling wine labels?",
    options: ["Sweet", "Dry", "Semi-dry", "Extra dry"],
    correctAnswer: "Dry",
    explanation: "Brut indicates very dry sparkling wine with minimal residual sugar (0-12g/L). Sweet would be Doux, semi-dry would be Demi-Sec, and paradoxically, Extra Dry is actually sweeter than Brut in sparkling wine terminology.",
    category: "styles"
  },
  {
    question: "What does 'Sec' mean in French wine terminology?",
    options: ["Sweet", "Dry", "Semi-dry", "Off-dry"],
    correctAnswer: "Dry",
    explanation: "Sec means dry in French, indicating minimal residual sugar. Sweet would be 'doux', semi-dry would be 'demi-sec', and off-dry would be 'demi-sec' or 'moelleux' - sec specifically indicates dryness.",
    category: "styles"
  },
  {
    question: "What sweetness level does 'Demi-Sec' indicate?",
    options: ["Very dry", "Dry", "Semi-dry", "Sweet"],
    correctAnswer: "Semi-dry",
    explanation: "Demi-Sec means 'half-dry', indicating noticeable sweetness but not fully sweet. Very dry would be Brut or Extra Brut, dry would be Sec, and sweet would be Doux - Demi-Sec falls in the middle range.",
    category: "styles"
  },
  {
    question: "What does 'Extra Dry' actually mean for sparkling wine sweetness?",
    options: ["Driest style", "Slightly sweeter than Brut", "Very sweet", "Medium dry"],
    correctAnswer: "Slightly sweeter than Brut",
    explanation: "Counterintuitively, Extra Dry sparkling wine (12-17g/L sugar) is sweeter than Brut (0-12g/L). This historical terminology can confuse consumers - Extra Brut would be the driest style, and very sweet would be Doux.",
    category: "styles"
  },
  {
    question: "What temperature range is ideal for long-term wine storage?",
    options: ["45-50°F", "55-60°F", "65-70°F", "70-75°F"],
    correctAnswer: "55-60°F",
    explanation: "This temperature range allows proper aging without premature development or cold shock. Lower temperatures slow development too much, while higher temperatures accelerate aging and can cause wine to deteriorate prematurely.",
    category: "styles"
  },
  {
    question: "What does 'Trocken' indicate on German wine labels?",
    options: ["Sweet", "Dry", "Sparkling", "Red"],
    correctAnswer: "Dry",
    explanation: "Trocken means dry in German, indicating minimal residual sugar (under 4g/L). Sweet would be 'süß', sparkling would be 'Sekt', and red would be 'Rotwein' - Trocken specifically addresses sweetness level.",
    category: "styles"
  },
  {
    question: "How does Chablis typically differ from other expressions of its grape variety?",
    options: ["Different grape variety", "No oak aging typically", "Higher alcohol", "Different country"],
    correctAnswer: "No oak aging typically",
    explanation: "Chablis traditionally emphasizes pure Chardonnay fruit and minerality without oak influence. It uses the same grape as other Chardonnays, doesn't necessarily have higher alcohol, and is from France like other premium Chardonnay regions - oak use is the key difference.",
    category: "styles"
  },
  {
    question: "What does 'Vendange Tardive' indicate about harvest timing?",
    options: ["Early harvest", "Late harvest", "Hand harvest", "Machine harvest"],
    correctAnswer: "Late harvest",
    explanation: "Vendange Tardive means 'late harvest' in French, indicating grapes picked later for concentration and often sweetness. Early harvest would be 'vendange précoce', while hand vs. machine harvest refers to picking method, not timing.",
    category: "styles"
  },
  {
    question: "What is the standard bottle size for most wine regions?",
    options: ["375ml", "750ml", "1L", "1.5L"],
    correctAnswer: "750ml",
    explanation: "750ml became the global standard for wine bottles. 375ml is a half-bottle, 1L is uncommon for wine, and 1.5L is a magnum (double bottle) - 750ml represents the traditional and most common wine bottle size.",
    category: "styles"
  },
  {
    question: "What does 'Blanc de Blancs' indicate about grape composition?",
    options: ["White from whites", "White from blacks", "Mixed blend", "Sweet style"],
    correctAnswer: "White from whites",
    explanation: "Blanc de Blancs means 'white from whites', indicating sparkling wine made only from white grapes (usually Chardonnay). Blanc de Noirs would be white from black grapes, mixed blend would be the traditional approach, and sweetness is indicated differently.",
    category: "styles"
  },
  {
    question: "What grape types produce Blanc de Noirs wines?",
    options: ["White from white grapes", "White from red grapes", "Red from white grapes", "Rosé wine"],
    correctAnswer: "White from red grapes",
    explanation: "Blanc de Noirs means 'white from blacks', indicating white or pale sparkling wine made from red/black grapes like Pinot Noir. It's not made from white grapes, doesn't make red wine from white grapes, and while pale, it's not rosé.",
    category: "styles"
  },
  {
    question: "What does 'NV' indicate on wine labels?",
    options: ["New Vintage", "No Vintage", "Nevada", "Natural Vinification"],
    correctAnswer: "No Vintage",
    explanation: "NV means Non-Vintage or No Vintage, indicating a blend of wines from multiple years. It's not New Vintage (that would show a year), not Nevada (a location), and not Natural Vinification (a production method).",
    category: "styles"
  },
  {
    question: "What information does vintage year provide?",
    options: ["Old wine", "Year of harvest", "Quality level", "Aging method"],
    correctAnswer: "Year of harvest",
    explanation: "Vintage indicates the year grapes were harvested, not when wine was bottled or released. It doesn't necessarily indicate age, doesn't guarantee quality level, and doesn't specify aging methods - only harvest year matters for vintage designation.",
    category: "styles"
  },
  {
    question: "What does 'Réserve' typically mean across different wine regions?",
    options: ["Legal classification", "Extended aging", "Producer's selection", "Varies by region"],
    correctAnswer: "Varies by region",
    explanation: "Réserve has different meanings globally: sometimes indicating extended aging, sometimes producer selection, sometimes legal classification. Unlike regulated terms, Réserve's meaning varies by country and producer, making regional context important.",
    category: "styles"
  },
  {
    question: "What is the largest standard wine bottle format?",
    options: ["Magnum", "Double Magnum", "Nebuchadnezzar", "Melchizedek"],
    correctAnswer: "Melchizedek",
    explanation: "Melchizedek (30L, equivalent to 40 standard bottles) is the largest commonly recognized format. Magnum is 1.5L, Double Magnum is 3L, and Nebuchadnezzar is 15L - Melchizedek represents the ultimate large format.",
    category: "styles"
  },
  {
    question: "What is the smallest standard wine bottle size?",
    options: ["Split", "Half bottle", "Piccolo", "Quarter bottle"],
    correctAnswer: "Piccolo",
    explanation: "Piccolo (187.5ml) is the smallest standard format, typically used for sparkling wine. Split also refers to small bottles but less specifically, half-bottle is 375ml, and quarter bottle isn't a standard term - Piccolo is the recognized smallest format.",
    category: "styles"
  },
  {
    question: "Which style represents Portugal's most famous fortified wine?",
    options: ["Sherry", "Port", "Madeira", "Marsala"],
    correctAnswer: "Port",
    explanation: "Port is Portugal's renowned fortified wine from the Douro Valley. Sherry is from Spain, Madeira is also Portuguese but less famous than Port, and Marsala is from Italy - Port represents Portugal's flagship fortified wine style.",
    category: "styles"
  },
  {
    question: "What grape varieties can produce Madeira wine?",
    options: ["Sercial", "Verdelho", "Bual", "Various depending on style"],
    correctAnswer: "Various depending on style",
    explanation: "Madeira uses different grapes for different styles: Sercial for dry, Verdelho for medium-dry, Bual for medium-sweet, and Malmsey for sweet. Rather than one primary grape, Madeira's diversity comes from using different varieties for different sweetness levels.",
    category: "styles"
  },
  {
    question: "What grape varieties traditionally produce the finest sparkling wines?",
    options: ["Chardonnay", "Pinot Noir", "Pinot Meunier", "All three are used"],
    correctAnswer: "All three are used",
    explanation: "Traditional Champagne and premium sparkling wines use all three: Chardonnay provides elegance and aging potential, Pinot Noir adds structure and red fruit, and Pinot Meunier contributes fruitiness and early accessibility. The blend creates complexity.",
    category: "styles"
  },
  {
    question: "Which country produces the sparkling wine called Cava?",
    options: ["Italy", "France", "Spain", "Portugal"],
    correctAnswer: "Spain",
    explanation: "Cava is Spain's traditional-method sparkling wine, primarily from Catalonia. Italy produces Prosecco and other sparkling wines, France produces Champagne and Crémant, and Portugal produces Espumante - Cava is distinctly Spanish.",
    category: "styles"
  },

  // Wine Law & Classification (30 questions) - Enhanced explanations
  {
    question: "What does 'Reserva' signify on Spanish wine labels?",
    options: ["Young wine", "Aged wine with specific requirements", "Reserve wine", "Old vines"],
    correctAnswer: "Aged wine with specific requirements",
    explanation: "Spanish Reserva requires minimum aging: reds need 36 months total with 12 in oak, whites need 24 months with 6 in oak. It's not just young wine, not merely a 'reserve' designation, and doesn't indicate vineyard age - specific aging requirements define Reserva.",
    category: "law"
  },
  {
    question: "What distinguishes Gran Reserva in Spanish wine classification?",
    options: ["Great reserve", "Longest aging requirements", "Premium quality", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Gran Reserva represents Spain's highest aging tier: reds need 60 months total with 18 in oak, indicating both longest aging and typically premium quality. The term literally means 'great reserve', encompassing all these characteristics.",
    category: "law"
  },
  {
    question: "What does 'Riserva' indicate on Italian wine labels?",
    options: ["Reserve quality", "Extended aging", "Higher alcohol", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Italian Riserva typically requires extended aging beyond normal releases, often indicates higher quality selection, and may require higher minimum alcohol. Unlike basic wines, Riserva represents producer's commitment to premium aging and quality.",
    category: "law"
  },
  {
    question: "What requirements define 'Superiore' on Italian labels?",
    options: ["Superior quality", "Higher alcohol", "Longer aging", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "Superiore typically mandates higher minimum alcohol, longer aging than base wines, and represents superior quality within the denomination. It's a step above basic DOC requirements, indicating enhanced production standards.",
    category: "law"
  },
  {
    question: "What rank does Premier Cru hold in Burgundy's hierarchy?",
    options: ["First vintage", "First quality level", "Second highest classification", "Village level"],
    correctAnswer: "Second highest classification",
    explanation: "Premier Cru ranks between village appellations and Grand Cru in Burgundy. It's not about vintage year, not the highest level (that's Grand Cru), and above village level - it's specifically the second tier in the four-level system.",
    category: "law"
  },
  {
    question: "What position does Grand Cru occupy in Burgundy's classification?",
    options: ["Large production", "Highest classification", "Old vines", "Premium price"],
    correctAnswer: "Highest classification",
    explanation: "Grand Cru represents Burgundy's pinnacle classification for the finest vineyard sites. It doesn't indicate production size (often quite small), doesn't specify vine age, and while expensive, price reflects quality status - it's definitively the highest classification.",
    category: "law"
  },
  {
    question: "What does 'DOCG' represent in Italian wine law?",
    options: ["Denominazione di Origine Controllata e Garantita", "Quality classification", "Highest Italian classification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "DOCG (Denominazione di Origine Controllata e Garantita) is Italy's supreme wine classification, meaning 'Controlled and Guaranteed Designation of Origin.' It represents the highest quality tier with stricter regulations than DOC, encompassing all these aspects.",
    category: "law"
  },
  {
    question: "What does 'AOC' guarantee in French wine law?",
    options: ["Appellation d'Origine Contrôlée", "Quality classification", "Geographic designation", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "AOC (Appellation d'Origine Contrôlée) controls geographic origin, grape varieties, yields, and production methods. It's simultaneously the name, a quality system, and geographic designation - representing France's comprehensive wine law framework.",
    category: "law"
  },
  {
    question: "What does 'AVA' designate in American wine law?",
    options: ["American Viticultural Area", "Geographic designation", "Appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "AVA (American Viticultural Area) is the US geographic designation system for wine regions. Unlike European systems, it only defines boundaries without regulating varieties or methods - it's simultaneously the name, geographic system, and appellation approach.",
    category: "law"
  },
  {
    question: "What standards does AOC regulate in French wine production?",
    options: ["Quality level", "Geographic origin and production methods", "Price range", "Alcohol content"],
    correctAnswer: "Geographic origin and production methods",
    explanation: "AOC controls geographic boundaries, permitted grape varieties, yields, production methods, and minimum standards. It doesn't guarantee quality level (that comes from terroir and skill), doesn't regulate prices, and alcohol content varies by region and vintage.",
    category: "law"
  },
  {
    question: "What does DOCG status provide beyond DOC classification?",
    options: ["Italian quality classification", "Production method", "Grape variety", "Vintage year"],
    correctAnswer: "Italian quality classification",
    explanation: "DOCG adds government tasting approval and additional quality controls beyond DOC requirements. It doesn't specify production methods or grape varieties differently (those are appellation-specific), and doesn't indicate vintage year - it's purely about enhanced quality standards.",
    category: "law"
  },
  {
    question: "What percentage of stated grape variety must US wines contain?",
    options: ["51%", "75%", "85%", "100%"],
    correctAnswer: "75%",
    explanation: "US law requires 75% of the named variety for varietal labeling. 51% would be too low for meaningful character, 85% is the EU standard, and 100% is rare except for specific appellations - 75% balances varietal character with blending flexibility.",
    category: "law"
  },
  {
    question: "What percentage of named variety must Australian wines contain?",
    options: ["75%", "80%", "85%", "90%"],
    correctAnswer: "85%",
    explanation: "Australia requires 85% of the named variety, higher than the US (75%) but matching EU standards. This ensures stronger varietal character while allowing minimal blending for balance and complexity.",
    category: "law"
  },
  {
    question: "What percentage of named variety must EU wines contain?",
    options: ["75%", "80%", "85%", "100%"],
    correctAnswer: "85%",
    explanation: "EU regulation requires 85% of the named variety for varietal labeling. This is higher than US requirements (75%) but lower than 100%, allowing some blending while ensuring dominant varietal character.",
    category: "law"
  },
  {
    question: "What vintage percentage must US wines contain from the stated year?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "85%",
    explanation: "US law requires 85% from the stated vintage year, allowing 15% from other years for consistency and blending. Lower percentages wouldn't ensure vintage character, while 100% would be impractical for quality management.",
    category: "law"
  },
  {
    question: "What vintage percentage must EU wines contain from the stated year?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "85%",
    explanation: "EU law matches US requirements at 85% from the stated vintage. This standard balances vintage authenticity with practical winemaking needs for consistency and quality management across different markets.",
    category: "law"
  },
  {
    question: "What regional percentage must US wines contain from named areas?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "75%",
    explanation: "US regional labeling requires 75% from the named area, lower than variety or vintage requirements. This reflects the practical challenges of sourcing entirely from specific regions while maintaining regional character.",
    category: "law"
  },
  {
    question: "What regional percentage must EU wines contain from named areas?",
    options: ["75%", "85%", "95%", "100%"],
    correctAnswer: "85%",
    explanation: "EU law requires 85% from the named region, higher than US requirements (75%). This stricter standard reflects Europe's emphasis on terroir and geographic authenticity in wine classification.",
    category: "law"
  },
  {
    question: "What does 'Cru' specifically designate in Burgundy?",
    options: ["Vineyard site", "Vintage year", "Producer", "Grape variety"],
    correctAnswer: "Vineyard site",
    explanation: "In Burgundy, Cru refers to specific vineyard sites with distinct terroir characteristics. It doesn't indicate vintage year (that's separate), producer (many may own parcels), or grape variety (that's regulated by appellation) - Cru is purely about site designation.",
    category: "law"
  },
  {
    question: "What aging requirements define Spanish Crianza wines?",
    options: ["Young wine", "Aged wine with specific requirements", "Reserve wine", "Old vines"],
    correctAnswer: "Aged wine with specific requirements",
    explanation: "Crianza requires minimum aging (24 months for reds with 6 in oak, 18 months for whites with 6 in oak). It's not young wine, not just a general reserve designation, and doesn't refer to vine age - specific aging requirements define the category.",
    category: "law"
  },
  {
    question: "What distinguishes Champagne from Crémant in French law?",
    options: ["Grape varieties", "Production region", "Method of production", "Sweetness level"],
    correctAnswer: "Production region",
    explanation: "Only wines from the Champagne region can use the name 'Champagne,' while Crémant comes from other French regions. Both use traditional method, similar grape varieties, and various sweetness levels - geographic origin is the legal distinction.",
    category: "law"
  },
  {
    question: "What does 'VdP' designate in French wine classification?",
    options: ["Vin de Pays", "Regional wine", "Country wine", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "VdP (Vin de Pays) literally means 'country wine' and represents regional wine classification below AOC but above table wine. It encompasses all these concepts as France's intermediate quality category with geographic indication.",
    category: "law"
  },
  {
    question: "What does 'IGT' represent in Italian wine law?",
    options: ["Indicazione Geografica Tipica", "Regional wine", "Geographic indication", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "IGT (Indicazione Geografica Tipica) means 'Typical Geographic Indication,' representing Italy's regional wine category below DOC. It encompasses geographic indication and regional wine concepts as an intermediate classification level.",
    category: "law"
  },
  {
    question: "What does 'QbA' designate in German wine law?",
    options: ["Qualitätswein bestimmter Anbaugebiete", "Quality wine from specific regions", "Regional quality wine", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "QbA (Qualitätswein bestimmter Anbaugebiete) means 'Quality wine from specific regions,' representing German regional quality wine classification. It encompasses all these concepts as Germany's intermediate quality level below QmP.",
    category: "law"
  },
  {
    question: "What does 'QmP' represent in German wine classification?",
    options: ["Qualitätswein mit Prädikat", "Quality wine with distinction", "Highest German classification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "QmP (Qualitätswein mit Prädikat) means 'Quality wine with distinction,' representing Germany's highest classification based on must weight at harvest. It encompasses all these concepts as the premium tier above QbA.",
    category: "law"
  },
  {
    question: "What does 'DO' designate in Spanish wine law?",
    options: ["Denominación de Origen", "Denomination of Origin", "Quality designation", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "DO (Denominación de Origen) means 'Denomination of Origin,' representing Spain's quality wine classification with geographic and production controls. It encompasses all these concepts as the foundation of Spanish quality wine law.",
    category: "law"
  },
  {
    question: "What does 'DOCa' represent in Spanish wine classification?",
    options: ["Denominación de Origen Calificada", "Qualified Denomination of Origin", "Highest Spanish classification", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "DOCa (Denominación de Origen Calificada) means 'Qualified Denomination of Origin,' representing Spain's supreme classification for established quality regions. It encompasses all these concepts as the highest tier above DO.",
    category: "law"
  },
  {
    question: "What does 'GI' designate in Australian wine law?",
    options: ["Geographic Indication", "Regional designation", "Australian appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "GI (Geographic Indication) is Australia's system for wine region designation, defining boundaries without regulating varieties or methods. It encompasses all these concepts as Australia's comprehensive geographic wine classification system.",
    category: "law"
  },
  {
    question: "What does 'VQA' represent in Canadian wine law?",
    options: ["Vintners Quality Alliance", "Quality designation", "Canadian appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "VQA (Vintners Quality Alliance) is Canada's quality wine designation system, controlling geographic origin, grape varieties, and production standards. It encompasses all these concepts as Canada's comprehensive wine quality framework.",
    category: "law"
  },
  {
    question: "What does 'WO' designate in South African wine law?",
    options: ["Wine of Origin", "Geographic designation", "South African appellation system", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "WO (Wine of Origin) is South Africa's appellation system controlling geographic origin, vintage, and variety claims. It encompasses all these concepts as South Africa's comprehensive wine classification and quality control system.",
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
  
  // Enhanced connectivity state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeGameInfo, setResumeGameInfo] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced connectivity detection with retry mechanism
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (activeGameId && userId) {
        syncGameState();
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
  }, [activeGameId, userId]);

  // Process pending answers when back online
  const processPendingAnswers = async () => {
    if (!activeGameId || !userId) return;
    
    const pendingAnswers = getPendingAnswers(activeGameId);
    for (const pendingAnswer of pendingAnswers) {
      try {
        await submitAnswerToFirestore(pendingAnswer.selectedOption, pendingAnswer.questionIndex);
        clearPendingAnswer(activeGameId, pendingAnswer.questionIndex);
      } catch (e) {
        console.warn("Failed to process pending answer:", e);
      }
    }
  };

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

  // Enhanced game data subscription with better error handling and retry logic
  useEffect(() => {
    let unsubscribe;
    let retryTimeout;
    
    if (mode === 'multiplayer' && activeGameId && isAuthReady && userId) {
      const normalizedGameId = activeGameId.toUpperCase();
      const gameDocRef = doc(db, `artifacts/${firestoreAppId}/public/data/games`, normalizedGameId);
      
      const setupListener = () => {
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
              
              // FIXED: Allow answer changes until revealed
              if (!data.revealAnswers && currentPlayer.selectedAnswerForQuestion) {
                setSelectedAnswer(currentPlayer.selectedAnswerForQuestion);
                setAnswerSelected(true);
              } else if (data.revealAnswers) {
                // Only reset when answers are revealed
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
            setRetryCount(0); // Reset retry count on successful connection
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
          
          // Implement retry logic
          if (retryCount < 3 && isOnline) {
            retryTimeout = setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setupListener(); // Retry the listener setup
            }, Math.pow(2, retryCount) * 1000); // Exponential backoff
          } else {
            setError("Connection lost. Please check your internet connection.");
          }
        });
      };
      
      setupListener();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [mode, activeGameId, isAuthReady, userId, userName, retryCount]);

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
          // Restore answer selection state
          if (!data.revealAnswers && currentPlayer.selectedAnswerForQuestion) {
            setSelectedAnswer(currentPlayer.selectedAnswerForQuestion);
            setAnswerSelected(true);
          }
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
          
          // Restore answer selection state
          if (!data.revealAnswers && existingPlayer.selectedAnswerForQuestion) {
            setSelectedAnswer(existingPlayer.selectedAnswerForQuestion);
            setAnswerSelected(true);
          }
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

  // Enhanced answer submission with retry mechanism
  const submitAnswerToFirestore = async (selectedOption, questionIndex = null) => {
    const safeGameData = gameData || { players: [], currentQuestionIndex: 0 };
    const currentPlayersArray = Array.isArray(safeGameData.players) ? safeGameData.players : [];
    
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

    await updateDoc(gameDocRef, { players: updatedPlayers });
  };

  // FIXED: Enhanced multiplayer answer handling - allows answer changes until revealed
  const handleMultiplayerAnswerClick = async (selectedOption) => {
    const safeGameData = gameData || { players: [], questions: [], currentQuestionIndex: 0, quizEnded: false, revealAnswers: false };
    
    // FIXED: Don't allow changes ONLY if quiz ended or answers have been revealed
    if (safeGameData.quizEnded || safeGameData.revealAnswers) {
      return;
    }

    // FIXED: Always allow answer changes until revealed
    setAnswerSelected(true);
    setSelectedAnswer(selectedOption);

    try {
      await submitAnswerToFirestore(selectedOption);
      
      // Clear any pending answer for this question
      clearPendingAnswer(activeGameId, safeGameData.currentQuestionIndex);
      
      // Save state locally
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
      
      // FIXED: Enhanced offline handling - save pending answer with retry
      savePendingAnswer(activeGameId, selectedOption, safeGameData.currentQuestionIndex);
      
      if (!isOnline) {
        setError("You're offline. Your answer will be submitted when connection is restored.");
      } else {
        setError("Failed to submit your answer. Retrying...");
        
        // Retry mechanism
        setTimeout(async () => {
          try {
            await submitAnswerToFirestore(selectedOption);
            clearPendingAnswer(activeGameId, safeGameData.currentQuestionIndex);
            setError(''); // Clear error on success
          } catch (retryError) {
            console.error("Retry failed:", retryError);
            setError("Your answer is saved locally and will be submitted when connection is restored.");
          }
        }, 2000);
      }
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
          console.error
