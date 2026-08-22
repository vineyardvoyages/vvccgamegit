import React, { useState, useEffect, useCallback } from 'react';
import {
  saveActiveGame,
  loadActiveGame,
  removeLocalState,
  savePendingAnswer,
  removePendingAnswer,
  getPendingAnswersForUser,
  getPendingAnswer
} from './storageUtils';
import {
  getTenRandomQuestions,
  generateRoundId,
  generateGameCode,
  reconcilePendingAnswerData,
  getPlayerRound,
  getPlayerAnswer,
  getPlayerFeedback,
  flattenServerPendingAnswers,
  normalizePlayersById,
  ensurePlayerRound,
  scoreRevealedQuestionData,
  getPlayersForGame,
  getAnswerSubmissionStatus
} from './gameLogic';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
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

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "vineyardvoyagesquiz-33fde.firebaseapp.com",
  projectId: "vineyardvoyagesquiz-33fde",
  storageBucket: "vineyardvoyagesquiz-33fde.firebasestorage.app",
  messagingSenderId: "539449046402",
  appId: "1:539449046402:web:a88b15a7bb81bdc7d1cb9b"
};

const firestoreAppId = firebaseConfig.projectId;

let app;
let db;
let auth;

const WinnerConfetti = () => {
  const colors = ['#6b2a58', '#9CAC3E', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899'];
  const pieces = Array.from({ length: 48 }, (_, index) => ({
    id: index,
    left: (index * 37) % 100,
    delay: (index % 8) * 0.08,
    duration: 2.2 + (index % 5) * 0.18,
    drift: ((index % 7) - 3) * 22,
    color: colors[index % colors.length],
    width: index % 3 === 0 ? 10 : 8,
    height: index % 2 === 0 ? 14 : 9,
    round: index % 4 === 0
  }));

  return (
    <div className="vv-winner-confetti" aria-hidden="true">
      {pieces.map(piece => (
        <span
          key={piece.id}
          className="vv-winner-confetti__piece"
          style={{
            left: `${piece.left}%`,
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            backgroundColor: piece.color,
            borderRadius: piece.round ? '999px' : '2px',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            '--vv-confetti-drift': `${piece.drift}px`
          }}
        />
      ))}
    </div>
  );
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
  const [answerSyncStatus, setAnswerSyncStatus] = useState('');
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine
  );

  const syncPendingAnswers = useCallback(async (pendingAnswers) => {
    const answers = (pendingAnswers || []).filter(Boolean);
    const gameId = answers[0]?.gameId;
    if (
      !db ||
      !gameId ||
      answers.some(answer => answer.gameId !== gameId)
    ) return false;
    const gameDocRef = doc(
      db,
      `artifacts/${firestoreAppId}/public/data/games`,
      gameId
    );
    try {
      const gameFound = await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(gameDocRef);
        if (!snapshot.exists()) return false;
        const reconciled = answers.reduce(
          (currentGame, answer) => reconcilePendingAnswerData(currentGame, answer),
          snapshot.data()
        );
        transaction.set(gameDocRef, reconciled);
        return true;
      });
      if (!gameFound) return false;
      answers.forEach(removePendingAnswer);
      return true;
    } catch (syncError) {
      console.warn('Answer reconciliation will retry after reconnect:', syncError);
      return false;
    }
  }, []);

  const syncPendingAnswer = useCallback(
    pendingAnswer => syncPendingAnswers([pendingAnswer]),
    [syncPendingAnswers]
  );

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
    const synced = await syncPendingAnswers(pending);
    setAnswerSyncStatus(
      synced ? 'Answer synced.' : 'Answer saved—waiting to reconnect.'
    );
  }, [syncPendingAnswers]);

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
            await signInAnonymously(auth);
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
    if (pending.length > 0) {
      void syncPendingAnswers(pending);
    }
  }, [mode, activeGameId, gameData, userId, syncPendingAnswers]);

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
    setQuestions(getTenRandomQuestions(questions));
  };

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
        players: [],
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
                    className={`w-full p-4 rounded-lg text-left text-lg font-medium transition-all duration-200 ease-in-out ${answerSelected ? option === currentQuestion.correctAnswer ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : option === selectedAnswer ? 'bg-red-100 text-red-800 ring-2 ring-red-500' : 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40'} ${!answerSelected && 'hover:scale-[1.02]'}`}
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
              <p className="text-lg text-gray-600">Ready to explore more wines?</p>
              <button
                onClick={restartSinglePlayerQuiz}
                className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold mr-4 hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#9CAC3E] active:bg-[#486D3E]"
              >
                Play Again
              </button>
              <a
                href="https://www.vineyardvoyages.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl"
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
          <p className="text-gray-700 text-lg">Your Name: <span className="font-mono text-[#6b2a58] break-all">{userName}</span>!</p>
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
      const safeGameData = gameData || {
        playersById: {},
        questions: [],
        currentQuestionIndex: 0,
        quizEnded: false,
        hostId: '',
        hostName: '',
        revealAnswers: false
      };

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
      const rankedPlayers = sortedPlayers.filter(player => player.id !== safeGameData.hostId);

      const getWinners = () => {
        if (rankedPlayers.length === 0) return [];
        const topScore = rankedPlayers[0].score || 0;
        return rankedPlayers.filter(player => (player.score || 0) === topScore);
      };
      const winners = getWinners();
      const isCurrentPlayerWinner = !isHost && winners.some(winner => winner.id === userId);
      const isCurrentPlayerTiedWinner = isCurrentPlayerWinner && winners.length > 1;
      const winnerNames = winners.map(winner => winner.userName).join(', ');

      if (safeGameData.quizEnded) {
        return (
          <div className="space-y-6">
            {!isHost && isCurrentPlayerWinner && (
              <WinnerConfetti key={`winner-confetti-${safeGameData.roundId || 'round'}-${userId}`} />
            )}

            <div className="text-center space-y-5">
              {!isHost && isCurrentPlayerWinner ? (
                <p className="text-4xl font-extrabold text-green-700" role="status">
                  {isCurrentPlayerTiedWinner ? '🏆 You Tied for First!' : '🏆 You Won!'}
                </p>
              ) : winners.length === 1 ? (
                <p className="text-3xl font-extrabold text-green-700" role="status">
                  🏆 Winner: {winnerNames}!
                </p>
              ) : winners.length > 1 ? (
                <p className="text-3xl font-extrabold text-green-700" role="status">
                  🏆 It's a tie! Winners: {winnerNames}!
                </p>
              ) : (
                <p className="text-3xl font-bold text-gray-900" role="status">
                  Multiplayer Game Complete!
                </p>
              )}

              {!isHost && (
                <p className="text-2xl text-gray-700">
                  Your score: <span className="font-extrabold text-[#6b2a58]">{score}</span>
                </p>
              )}

              <p className="text-sm text-gray-500">
                Game ID: <span className="font-mono">{activeGameId}</span>
              </p>
            </div>

            {isHost && (
              <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Final Player Scores:</h3>
                <ul className="space-y-2">
                  {rankedPlayers.map(player => (
                    <li key={player.id} className="flex justify-between items-center text-lg text-gray-700">
                      <span className="font-semibold">{player.userName}</span>
                      <span className="font-bold text-[#6b2a58]">{player.score || 0}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isHost && (
                <button
                  onClick={restartMultiplayerQuiz}
                  className="bg-[#6b2a58] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Restart Game
                </button>
              )}
              <a
                href="https://www.vineyardvoyages.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#9CAC3E] text-white py-3 px-6 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl text-center"
              >
                Book a Tour Now!
              </a>
            </div>

            <button
              onClick={() => {
                setMode('initial');
                setActiveGameId(null);
                setGameData(null);
                setAnswerSyncStatus('');
                removeLocalState();
              }}
              className="w-full bg-gray-500 text-white py-2 rounded-lg text-lg font-bold hover:bg-gray-600 transition-colors duration-200 shadow-md"
            >
              Leave Game
            </button>
          </div>
        );
      }

      const questionKey = String(safeGameData.currentQuestionIndex || 0);
      const answerSubmissionStatus = getAnswerSubmissionStatus(safeGameData, questionKey);
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
            </div>
          )}

          <div className="bg-[#6b2a58]/10 p-4 rounded-lg shadow-inner">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Question {safeGameData.currentQuestionIndex + 1} of {safeGameData.questions.length}
            </p>
            <p className="text-xl text-gray-800 font-medium">{currentQuestion.question}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isHost ? (
              <>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className={`w-full p-4 rounded-lg text-left text-lg font-medium ${safeGameData.revealAnswers && option === currentQuestion.correctAnswer ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-gray-100 text-gray-800'}`}>
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
                  className={`w-full p-4 rounded-lg text-left text-lg font-medium transition-all duration-200 ease-in-out ${playerSelectedAnswer === option ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-[#6b2a58]/20 text-[#6b2a58] hover:bg-[#6b2a58]/30 hover:shadow-md active:bg-[#6b2a58]/40'} ${safeGameData.revealAnswers ? option === currentQuestion.correctAnswer ? '!bg-green-500 text-white ring-2 ring-green-700' : option === playerSelectedAnswer ? '!bg-red-500 text-white ring-2 ring-red-700' : 'cursor-not-allowed opacity-50' : ''} ${!safeGameData.revealAnswers && 'hover:scale-[1.02]'}`}
                >
                  {option}
                </button>
              ))
            )}
          </div>

          {!isHost && answerSyncStatus && (
            <p className={`text-center text-sm font-semibold ${answerSyncStatus === 'Answer synced.' ? 'text-green-700' : 'text-amber-700'}`}>
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
                <p className={`text-lg font-bold ${playerFeedback === 'Correct!' ? 'text-green-600' : 'text-red-600'}`}>
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

            {isHost && !safeGameData.quizEnded && !safeGameData.revealAnswers && (
              <div className={`p-4 rounded-lg shadow-inner ${answerSubmissionStatus.allAnswered ? 'bg-green-50 ring-2 ring-green-300' : 'bg-amber-50 ring-1 ring-amber-200'}`}>
                <p className={`text-center text-lg font-bold ${answerSubmissionStatus.allAnswered ? 'text-green-800' : 'text-amber-800'}`}>
                  {answerSubmissionStatus.totalPlayers === 0
                    ? 'Waiting for players to join.'
                    : answerSubmissionStatus.allAnswered
                      ? `Everyone has answered (${answerSubmissionStatus.answeredCount}/${answerSubmissionStatus.totalPlayers}).`
                      : `${answerSubmissionStatus.answeredCount} of ${answerSubmissionStatus.totalPlayers} players have answered.`}
                </p>
                {answerSubmissionStatus.totalPlayers > 0 && (
                  <ul className="mt-3 space-y-2">
                    {answerSubmissionStatus.players.map(player => (
                      <li key={player.id} className="flex justify-between items-center text-sm text-gray-700 bg-white/70 rounded-md px-3 py-2">
                        <span className="font-semibold">{player.userName}</span>
                        <span className={player.answered ? 'font-bold text-green-700' : 'font-bold text-amber-700'}>
                          {player.answered ? 'Answered' : 'Waiting'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {!answerSubmissionStatus.allAnswered && answerSubmissionStatus.totalPlayers > 0 && (
                  <p className="mt-3 text-center text-sm text-gray-600">
                    You can still reveal answers if you need to move on before everyone responds.
                  </p>
                )}
              </div>
            )}

            {isHost && !safeGameData.quizEnded && (
              <div className="flex gap-4">
                {!safeGameData.revealAnswers ? (
                  <button
                    onClick={revealAnswersToAll}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg text-xl font-bold hover:bg-orange-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    Reveal Answers (Score)
                  </button>
                ) : (
                  <button
                    onClick={handleMultiplayerNextQuestion}
                    disabled={!safeGameData.revealAnswers}
                    className="flex-1 bg-[#6b2a58] text-white py-3 rounded-lg text-xl font-bold hover:bg-[#496E3E] transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {safeGameData.currentQuestionIndex < safeGameData.questions.length - 1 ? 'Next Question' : 'End Game'}
                  </button>
                )}
              </div>
            )}
          </div>

          {isHost && (
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
          )}

          <button
            onClick={() => {
              setMode('initial');
              setActiveGameId(null);
              setGameData(null);
              setAnswerSyncStatus('');
              removeLocalState();
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
    <div
      className="min-h-screen bg-gradient-to-br from-[#6b2a58] via-[#6b2a58] to-[#9CAC3E]"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1656873592841-8ae63d15be24?auto=format&fit=crop&w=1920&q=85")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
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
      </div>
    </div>
  );
};

export default App;