import {
  ensurePlayerRound,
  getPlayerRound,
  getPlayersForGame,
  flattenServerPendingAnswers,
  getAnswerSubmissionStatus,
  getGameCodeCandidates,
  getReconciledAnswerUpdate,
  getRevealedQuestionUpdate,
  getTenRandomQuestions,
  isPlayableQuestion,
  normalizePlayersById,
  questionId,
  reconcilePendingAnswerData,
  removeServerPendingAnswer,
  scoreRevealedQuestionData,
  secureRandomInt,
  shuffleArray
} from './gameLogic';
import { WINE_QUIZ_QUESTIONS } from './questions';

const originalCrypto = globalThis.crypto;
let randomSeed = 1;

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: values => {
        for (let index = 0; index < values.length; index += 1) {
          randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
          values[index] = randomSeed;
        }
        return values;
      }
    }
  });
});

afterAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: originalCrypto
  });
});

beforeEach(() => {
  window.localStorage.clear();
});

describe('random question selection', () => {
  test('returns ten distinct questions and avoids immediate repeats', () => {
    const first = getTenRandomQuestions();
    const second = getTenRandomQuestions(first);

    expect(first).toHaveLength(10);
    expect(new Set(first.map(item => item.question)).size).toBe(10);
    expect(second).toHaveLength(10);
    expect(second.every(item => !first.some(previous => previous.question === item.question)))
      .toBe(true);
  });

  test('loads 248 unique, fully explained questions after the QA cleanup', () => {
    expect(WINE_QUIZ_QUESTIONS).toHaveLength(248);
    expect(WINE_QUIZ_QUESTIONS.every(isPlayableQuestion)).toBe(true);
    expect(new Set(WINE_QUIZ_QUESTIONS.map(questionId)).size).toBe(248);
    expect(WINE_QUIZ_QUESTIONS.every(question => question.category !== 'uncategorized')).toBe(true);
    expect(WINE_QUIZ_QUESTIONS.every(question => (
      question.options.length === 4 && new Set(question.options).size === 4
    ))).toBe(true);
    expect(WINE_QUIZ_QUESTIONS.every(question => (
      question.options
        .filter(option => option !== question.correctAnswer)
        .every(option => Boolean(question.wrongAnswerExplanations?.[option]))
    ))).toBe(true);

    const conceptIds = WINE_QUIZ_QUESTIONS
      .map(question => question.conceptId)
      .filter(Boolean);
    expect(new Set(conceptIds).size).toBe(conceptIds.length);

    const serializedBank = JSON.stringify(WINE_QUIZ_QUESTIONS);
    expect(serializedBank).not.toMatch(/Casanel|868 Estate|Williams Gap|partner wineries?/i);
    expect(serializedBank).not.toMatch(/superlativ/i);
  });

  test('keeps audited concepts, categories, and generated distractors distinct', () => {
    const byPrompt = prompt => WINE_QUIZ_QUESTIONS.find(
      question => question.question === prompt
    );
    const questionsWithAnswer = answer => WINE_QUIZ_QUESTIONS.filter(
      question => question.correctAnswer === answer
    );

    expect(questionsWithAnswer('Thomas Jefferson')).toHaveLength(2);
    expect(questionsWithAnswer('Petit Verdot')).toHaveLength(2);
    expect(byPrompt("Which fortified wine is produced in northern Portugal's Douro Valley?"))
      .toBeDefined();
    expect(byPrompt('The Douro Valley in Portugal is most famous for being the birthplace of which fortified wine?'))
      .toBeUndefined();

    [
      'Which of the following is one of the three principal grapes used in Champagne?',
      'Which of these is a sparkling wine from Spain?',
      'Which white grape is typically used to make dry, aromatic wines in the Loire Valley, France?',
      'Which region is known for producing high-quality Riesling wines?',
      'Uruguay’s wine regions are heavily influenced by their proximity to which body of water?',
      "While Malbec is the king of red grapes in Argentina, which unique white grape is considered its aromatic white 'queen'?",
      'Blanquette de Limoux is traditionally cited as an early recorded sparkling wine. What year appears in that historic claim?'
    ].forEach(prompt => {
      expect(byPrompt(prompt)?.category).toBe('world-wine-regions');
    });

    [
      'What is the term for the process of allowing wine to age in the bottle before release?',
      "What is a 'blend' in winemaking?",
      "What does the winemaking term 'sur lie' mean?",
      'What is a cooper?'
    ].forEach(prompt => {
      expect(byPrompt(prompt)?.category).toBe('wine-language-and-production');
    });

    [
      'What is the ideal temperature range for storing most wines long-term?',
      'Which type of wine is typically served very chilled, often as a dessert wine?'
    ].forEach(prompt => {
      expect(byPrompt(prompt)?.category).toBe('tasting-and-service');
    });

    const generated = WINE_QUIZ_QUESTIONS.slice(152);
    const generatedText = JSON.stringify(generated);
    expect(generatedText).not.toMatch(/looking for (chenin blanc|melon de bourgogne|tokaji aszú|rhône|helan mountains)/);
    expect(generatedText).not.toMatch(/is managing (adding|reducing|deliberately)/);
    expect(generatedText).not.toMatch(/Mount Lebanon|Anti-Lebanon/);

    const sparklingProduction = new Set([
      'tirage', 'autolysis', 'traditional method', 'pétillant naturel',
      'riddling', 'disgorgement', 'dosage', 'tank method (Charmat)'
    ]);
    const sparklingSweetness = new Set([
      'Brut Nature (Zero Dosage)', 'Extra Brut', 'Brut', 'Extra Dry',
      'Demi-Sec', 'Doux'
    ]);
    const tastingFormats = new Set([
      'blind tasting', 'horizontal tasting', 'vertical tasting',
      'double-blind tasting'
    ]);

    generated.forEach(question => {
      if (sparklingProduction.has(question.correctAnswer)) {
        expect(question.options.every(option => sparklingProduction.has(option)))
          .toBe(true);
      }
      if (sparklingSweetness.has(question.correctAnswer)) {
        expect(question.options.every(option => sparklingSweetness.has(option)))
          .toBe(true);
      }
      if (tastingFormats.has(question.correctAnswer)) {
        expect(question.options.every(option => tastingFormats.has(option)))
          .toBe(true);
      }
    });

    expect(questionsWithAnswer('magnum')[0].options).toEqual([
      'demi (half-bottle)',
      'jeroboam (double magnum)',
      'magnum',
      'split (piccolo)'
    ]);
  });

  test('keeps 11 consecutive games free of question repeats', () => {
    const questions = Array.from({ length: 11 }, () => getTenRandomQuestions()).flat();
    expect(questions).toHaveLength(110);
    expect(new Set(questions.map(questionId)).size).toBe(110);
  });

  test('shuffles correct answers across every option position', () => {
    const positions = [0, 0, 0, 0];

    for (let round = 0; round < 30; round += 1) {
      getTenRandomQuestions().forEach(question => {
        positions[question.options.indexOf(question.correctAnswer)] += 1;
      });
    }

    expect(positions.every(count => count > 0)).toBe(true);
  });

  test('shuffle handles edge cases without mutating its input', () => {
    const original = [1, 2, 3, 4];
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray([1])).toEqual([1]);
    expect(shuffleArray(original)).toEqual(expect.arrayContaining(original));
    expect(original).toEqual([1, 2, 3, 4]);
  });

  test('provides every letter-number game code exactly once in random order', () => {
    const codes = getGameCodeCandidates();
    expect(codes).toHaveLength(260);
    expect(new Set(codes).size).toBe(260);
    expect(codes.every(code => /^[A-Z][0-9]$/.test(code))).toBe(true);
  });

  test('secureRandomInt validates its range and stays within bounds', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
    expect(secureRandomInt(1)).toBe(0);
    for (let index = 0; index < 100; index += 1) {
      expect(secureRandomInt(7)).toBeGreaterThanOrEqual(0);
      expect(secureRandomInt(7)).toBeLessThan(7);
    }
  });
});

describe('player and pending-answer compatibility', () => {
  test('normalizes missing and legacy player data', () => {
    expect(normalizePlayersById(null)).toEqual({});
    expect(normalizePlayersById({
      roundId: 'round-1',
      players: [{ id: 'guest-1', userName: 'Guest', score: 3 }]
    })).toMatchObject({
      'guest-1': {
        id: 'guest-1',
        userName: 'Guest',
        rounds: { 'round-1': { score: 3 } }
      }
    });
  });

  test('flattens and removes nested server pending answers', () => {
    const nested = {
      'round-1': {
        '0': {
          'guest-1': { answer: 'A', answeredAt: 10, userName: 'Guest' }
        }
      }
    };
    const flattened = flattenServerPendingAnswers('ABCD', nested);

    expect(flattened).toEqual([expect.objectContaining({
      gameId: 'ABCD', roundId: 'round-1', questionKey: '0', userId: 'guest-1'
    })]);
    expect(removeServerPendingAnswer(nested, flattened[0])).toEqual({});
  });
});

describe('proctor answer submission status', () => {
  const player = (id, userName, answers = {}) => ({
    id,
    userName,
    rounds: {
      'round-1': {
        score: 0,
        answers,
        scoredQuestions: {},
        feedbackByQuestion: {}
      }
    }
  });

  test('counts both reconciled and server-pending answers for the current question', () => {
    const game = {
      hostId: 'host-1',
      roundId: 'round-1',
      currentQuestionIndex: 0,
      playersById: {
        'host-1': player('host-1', 'Proctor'),
        'guest-1': player('guest-1', 'Alice', { '0': { answer: 'A', answeredAt: 1 } }),
        'guest-2': player('guest-2', 'Bob')
      },
      pendingAnswers: {
        'round-1': {
          '0': {
            'guest-2': { answer: 'B', answeredAt: 2, userName: 'Bob' }
          }
        }
      }
    };

    expect(getAnswerSubmissionStatus(game, '0')).toEqual({
      totalPlayers: 2,
      answeredCount: 2,
      allAnswered: true,
      players: [
        { id: 'guest-1', userName: 'Alice', answered: true },
        { id: 'guest-2', userName: 'Bob', answered: true }
      ]
    });
  });

  test('reports who is still waiting and excludes the proctor from the total', () => {
    const game = {
      hostId: 'host-1',
      roundId: 'round-1',
      currentQuestionIndex: 3,
      playersById: {
        'host-1': player('host-1', 'Proctor'),
        'guest-1': player('guest-1', 'Alice', { '3': { answer: 'A', answeredAt: 1 } }),
        'guest-2': player('guest-2', 'Bob')
      },
      pendingAnswers: {}
    };

    const status = getAnswerSubmissionStatus(game);
    expect(status.totalPlayers).toBe(2);
    expect(status.answeredCount).toBe(1);
    expect(status.allAnswered).toBe(false);
    expect(status.players).toEqual([
      { id: 'guest-1', userName: 'Alice', answered: true },
      { id: 'guest-2', userName: 'Bob', answered: false }
    ]);
  });

  test('does not mark an empty lobby as ready to reveal', () => {
    expect(getAnswerSubmissionStatus({
      hostId: 'host-1',
      roundId: 'round-1',
      currentQuestionIndex: 0,
      playersById: {},
      pendingAnswers: {}
    })).toMatchObject({
      totalPlayers: 0,
      answeredCount: 0,
      allAnswered: false
    });
  });
});

describe('reconnect scoring', () => {
  const baseGame = () => ({
    roundId: 'round-1',
    currentQuestionIndex: 0,
    revealAnswers: false,
    players: [],
    playersById: {},
    pendingAnswers: {},
    questionResults: {},
    questions: [{ question: 'Question?', correctAnswer: 'Correct' }]
  });

  const answer = {
    gameId: 'ABCD',
    roundId: 'round-1',
    questionKey: '0',
    userId: 'guest-1',
    userName: 'Guest',
    answer: 'Correct',
    answeredAt: 10
  };

  test('preserves a queued answer through reveal and awards its point once', () => {
    const queued = {
      ...baseGame(),
      pendingAnswers: {
        'round-1': { '0': { 'guest-1': {
          answer: 'Correct', answeredAt: 10, userName: 'Guest'
        } } }
      }
    };

    const revealed = scoreRevealedQuestionData(queued);
    const retried = reconcilePendingAnswerData(revealed, answer);
    const revealedAgain = scoreRevealedQuestionData(retried);

    expect(revealed.playersById['guest-1'].rounds['round-1'].score).toBe(1);
    expect(retried.playersById['guest-1'].rounds['round-1'].score).toBe(1);
    expect(revealedAgain.playersById['guest-1'].rounds['round-1'].score).toBe(1);
    expect(revealedAgain.pendingAnswers).toEqual({});
  });

  test('scores an answer that arrives after reveal exactly once', () => {
    const revealed = scoreRevealedQuestionData(baseGame());
    const reconciled = reconcilePendingAnswerData(revealed, answer);
    const retried = reconcilePendingAnswerData(reconciled, answer);

    expect(reconciled.playersById['guest-1'].rounds['round-1'].score).toBe(1);
    expect(retried.playersById['guest-1'].rounds['round-1'].score).toBe(1);
  });

  test('returns field-only writes that cannot corrupt a short game expiry timestamp', () => {
    const expiresAt = {
      seconds: 1792886400,
      nanoseconds: 0,
      toMillis: () => 1792886400000
    };
    const shortGame = {
      ...baseGame(),
      hostId: 'host-1',
      expiresAt,
      pendingAnswers: {
        'round-1': { '0': { 'guest-1': {
          answer: 'Correct', answeredAt: 10, userName: 'Guest'
        } } }
      }
    };

    const answerUpdate = getReconciledAnswerUpdate(shortGame, [answer]);
    const revealUpdate = getRevealedQuestionUpdate(shortGame);

    expect(Object.keys(answerUpdate).sort()).toEqual([
      'pendingAnswers', 'playersById'
    ]);
    expect(Object.keys(revealUpdate).sort()).toEqual([
      'pendingAnswers', 'playersById', 'questionResults', 'revealAnswers'
    ]);
    expect(answerUpdate).not.toHaveProperty('expiresAt');
    expect(revealUpdate).not.toHaveProperty('expiresAt');
    expect(revealUpdate.revealAnswers).toBe(true);
  });
});


describe('complete group rounds', () => {
  test('15 players finish ten questions, retry safely, and start a fresh round', () => {
    let game = {
      hostId: 'host', roundId: 'first', currentQuestionIndex: 0,
      revealAnswers: false, quizEnded: false, playersById: {},
      pendingAnswers: {}, questionResults: {}, questions: getTenRandomQuestions()
    };
    const ids = Array.from({ length: 15 }, (_, i) => `player-${i}`);
    ids.forEach(id => ensurePlayerRound(game.playersById, id, id, game.roundId));
    for (let q = 0; q < 10; q += 1) {
      game = { ...game, currentQuestionIndex: q, revealAnswers: false };
      expect(getAnswerSubmissionStatus(game, String(q)).answeredCount).toBe(0);
      const question = game.questions[q];
      ids.forEach((id, i) => {
        const answer = {
          gameId: 'A7', roundId: game.roundId, questionKey: String(q),
          userId: id, userName: id, answeredAt: 100 + q,
          answer: i % 2 === 0 ? question.correctAnswer : question.options.find(o => o !== question.correctAnswer)
        };
        game = { ...game, ...getReconciledAnswerUpdate(game, [answer, answer]) };
      });
      expect(getAnswerSubmissionStatus(game, String(q)).allAnswered).toBe(true);
      game = { ...game, ...getRevealedQuestionUpdate(game) };
      game = { ...game, ...getRevealedQuestionUpdate(game) };
      ids.forEach((id, i) => expect(getPlayerRound(game, id).score).toBe(i % 2 === 0 ? q + 1 : 0));
    }
    game.quizEnded = true;
    expect(getPlayersForGame(game)).toHaveLength(15);
    const previousQuestions = game.questions;
    game = { ...game, roundId: 'second', questions: getTenRandomQuestions(previousQuestions), currentQuestionIndex: 0, quizEnded: false, revealAnswers: false };
    ids.forEach(id => ensurePlayerRound(game.playersById, id, id, game.roundId));
    expect(game.questions.every(q => !previousQuestions.some(p => questionId(p) === questionId(q)))).toBe(true);
    ids.forEach(id => {
      expect(getPlayerRound(game, id).score).toBe(0);
      expect(getPlayerRound(game, id).answers).toEqual({});
    });
    expect(getAnswerSubmissionStatus(game, '0').answeredCount).toBe(0);
  });
});
