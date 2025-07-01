import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

// Firebase Configuration
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

// Wine varietals with corrected UTF-8 encoding
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

// Question bank (removed "Proctor" question)
const WINE_QUIZ_QUESTIONS = [
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
    question: "Which Italian wine is made primarily from Nebbiolo grapes?",
    options: ["Chianti", "Barolo", "Valpolicella", "Soave"],
    correctAnswer: "Barolo",
    explanation: "Barolo is a prestigious red wine from Piedmont, Italy, known for its powerful structure and aging potential."
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
  const [selectedAnswer, setSelectedAnswer] = useState(null); // FIXED: was "= null" instead of useState(null)
  const [questions, setQuestions] = useState([]);

  const [llmLoading, setLlmLoading] = useState(false);
  const [varietalElaboration, setVarietalElaboration] = useState('');
  const [showVarietalModal, setShowVarietalModal] = useState(false);
  const [newQuestionTopic, setNewQuestionTopic] = useState('');
  const [showGenerateQuestionModal, setShowGenerateQuestionModal] = useState(false);

  // Firebase initialization
  useEffect(() => {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          const userProfileRef = doc(db, 'artifacts', firestoreAppId, 'users', user.uid, 'profile', 'userProfile');
          const docSnap = await getDoc(userProfileRef);

          if (docSnap.exists() && docSnap.data().userName) {
            setUserName(docSnap.data().userName);
            setMode('initial');
          } else {
            setMode('enterName');
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
          // Only update score when answers are revealed
          if (data.revealAnswers) {
            const currentPlayerScore = Array.isArray(data.players) ? 
              (data.players.find(p => p.id === userId)?.score || 0) : 0;
            setScore(currentPlayerScore);
          }
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
        console.error("Error listening to game updates:", err);
        setError("Failed to get real-time game updates.");
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mode, activeGameId, isAuthReady, userId]);

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

  // FIXED: Only store selected answer, don't update score yet
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

  // NEW: Reveal answers and update all scores
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

    // Check if answers have been revealed
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

    // NEW: Calculate answered count for proctor
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
          <p className="text-gray-700 text-lg">Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span></p>
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

          {/* NEW: Show answered count for proctor */}
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
                      className="mt-3 bg-[#9CAC3E] text-white py-2 px-4 rounded-lg text-sm font-bold
                                 hover:bg-[#496E3E] transition-colors duration-200 shadow-md"
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
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg text-xl font-bold
                                     hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl
                                     focus:outline-none focus:ring-4 focus:ring-indigo-300"
                  disabled={llmLoading}
                >
                  {llmLoading ? 'Generating...' : '✨ Generate New Question'}
                </button>
              )}
            </>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Players:</h3>
            <ul className="space-y-2">
              {currentPlayersArray.map(player => (
                <li key={player.id} className="flex justify-between items-center text-lg text-gray-700">
                  <span className="font-semibold">
                    {player.userName}
                    {player.id === safeGameData.hostId ? (
                      <span className="ml-2 px-2 py-1 bg-[#6b2a58] text-white text-xs font-semibold rounded-full">Proctor</span>
                    ) : (
                      <span className="ml-2 px-2 py-1 bg-[#9CAC3E] text-white text-xs font-semibold rounded-full">Player</span>
                    )}
                  </span>
                  <span className="font-bold text-[#6b2a58]">
                    {/* Anonymous scoring: only show scores if quiz has ended or answers are revealed */}
                    {(safeGameData.quizEnded || (safeGameData.revealAnswers && isHost)) ? player.score : "?"}
                  </span>
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
