// --- Local durability helpers for active games, pending answers, and recent draws ---
export const ACTIVE_GAME_STORAGE_KEY = 'vv-active-game';
export const PENDING_ANSWERS_STORAGE_KEY = 'vv-pending-answers';
export const RECENT_QUESTIONS_STORAGE_KEY = 'vv-recent-question-ids';

export const readJsonStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (storageError) {
    console.warn(`Failed to read ${key}:`, storageError);
    return fallback;
  }
};

export const writeJsonStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (storageError) {
    console.warn(`Failed to save ${key}:`, storageError);
    return false;
  }
};

export const saveActiveGame = (gameId, userName) => {
  writeJsonStorage(ACTIVE_GAME_STORAGE_KEY, { gameId, userName });
};

export const loadActiveGame = () => readJsonStorage(ACTIVE_GAME_STORAGE_KEY, null);

export const removeLocalState = () => {
  try {
    localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  } catch (storageError) {
    console.warn('Failed to clear the active game:', storageError);
  }
};

export const readPendingAnswers = () => readJsonStorage(PENDING_ANSWERS_STORAGE_KEY, {});

export const pendingAnswerStorageKey = (gameId, roundId, questionKey, userId) =>
  [gameId, roundId, questionKey, userId].join('|');

export const savePendingAnswer = (answer) => {
  const pending = readPendingAnswers();
  pending[pendingAnswerStorageKey(
    answer.gameId,
    answer.roundId,
    answer.questionKey,
    answer.userId
  )] = answer;
  writeJsonStorage(PENDING_ANSWERS_STORAGE_KEY, pending);
};

export const removePendingAnswer = (answer) => {
  const pending = readPendingAnswers();
  delete pending[pendingAnswerStorageKey(
    answer.gameId,
    answer.roundId,
    answer.questionKey,
    answer.userId
  )];
  writeJsonStorage(PENDING_ANSWERS_STORAGE_KEY, pending);
};

export const getPendingAnswersForUser = (gameId, userId) =>
  Object.values(readPendingAnswers()).filter(
    answer => answer.gameId === gameId && answer.userId === userId
  );

export const getPendingAnswer = (gameId, roundId, questionKey, userId) =>
  readPendingAnswers()[pendingAnswerStorageKey(gameId, roundId, questionKey, userId)] || null;

export const loadRecentQuestionIds = () => readJsonStorage(RECENT_QUESTIONS_STORAGE_KEY, []);

export const saveRecentQuestionIds = (questionIds) => {
  writeJsonStorage(RECENT_QUESTIONS_STORAGE_KEY, questionIds.slice(-40));
};
