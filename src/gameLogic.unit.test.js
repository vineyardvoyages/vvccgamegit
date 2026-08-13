import {
  flattenServerPendingAnswers,
  getTenRandomQuestions,
  normalizePlayersById,
  reconcilePendingAnswerData,
  removeServerPendingAnswer,
  scoreRevealedQuestionData,
  secureRandomInt,
  shuffleArray
} from './gameLogic';

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

  test('shuffle handles edge cases without mutating its input', () => {
    const original = [1, 2, 3, 4];
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray([1])).toEqual([1]);
    expect(shuffleArray(original)).toEqual(expect.arrayContaining(original));
    expect(original).toEqual([1, 2, 3, 4]);
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
});
