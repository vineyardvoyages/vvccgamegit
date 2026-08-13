import { WINE_QUIZ_QUESTIONS } from './questions';
import { loadRecentQuestionIds, saveRecentQuestionIds } from './storageUtils';

export const secureRandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive integer.');
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure randomness is unavailable in this browser.');
  }
  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const value = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % maxExclusive;
};

export const shuffleArray = (array) => {
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

export const questionId = (question) => question?.question?.trim() || '';

export const getTenRandomQuestions = (previousQuestions = []) => {
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

export const generateRoundId = () => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure randomness is unavailable in this browser.');
  }
  const bytes = new Uint32Array(2);
  globalThis.crypto.getRandomValues(bytes);
  return `${Date.now().toString(36)}-${bytes[0].toString(36)}${bytes[1].toString(36)}`;
};

export const generateGameCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => characters[secureRandomInt(characters.length)]).join('');
};

export const cloneData = (value) => JSON.parse(JSON.stringify(value));

export const newRoundState = () => ({
  score: 0,
  answers: {},
  scoredQuestions: {},
  feedbackByQuestion: {}
});

export const normalizePlayersById = (game) => {
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

export const ensurePlayerRound = (playersById, userId, userName, roundId) => {
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

export const getPlayerRound = (game, userId) =>
  normalizePlayersById(game)[userId]?.rounds?.[game?.roundId || 'legacy-round'] || newRoundState();

export const getPlayersForGame = (game) => {
  const roundId = game?.roundId || 'legacy-round';
  return Object.values(normalizePlayersById(game)).map(player => ({
    id: player.id,
    userName: player.userName,
    score: player.rounds?.[roundId]?.score || 0
  }));
};

export const getPlayerAnswer = (game, userId, questionKey) =>
  getPlayerRound(game, userId).answers?.[questionKey]?.answer || null;

export const getPlayerFeedback = (game, userId, questionKey) =>
  getPlayerRound(game, userId).feedbackByQuestion?.[questionKey] || '';

export const flattenServerPendingAnswers = (gameId, pendingAnswers = {}) => {
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

export const removeServerPendingAnswer = (pendingAnswers, answer) => {
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

export const reconcilePendingAnswerData = (game, pendingAnswer) => {
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

export const scoreRevealedQuestionData = (game) => {
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
