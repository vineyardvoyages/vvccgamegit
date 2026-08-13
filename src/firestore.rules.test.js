/** @jest-environment node */

const fs = require('fs');
const { TextDecoder, TextEncoder } = require('util');

global.TextDecoder = global.TextDecoder || TextDecoder;
global.TextEncoder = global.TextEncoder || TextEncoder;

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require('@firebase/rules-unit-testing');
const {
  collection,
  deleteField,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc
} = require('firebase/firestore');

const projectId = 'vineyardvoyagesquiz-33fde';
const gamePath = gameId =>
  `artifacts/${projectId}/public/data/games/${gameId}`;

const newGame = hostId => ({
  hostId,
  hostName: 'Host',
  currentQuestionIndex: 0,
  quizEnded: false,
  revealAnswers: false,
  roundId: 'round-1',
  players: [],
  playersById: {},
  pendingAnswers: {},
  questionResults: {},
  questions: Array.from({ length: 10 }, (_, index) => ({
    question: `Question ${index + 1}`,
    correctAnswer: 'A'
  })),
  createdAt: '2026-08-13T12:00:00.000Z'
});

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const seedGame = async (gameId = 'ABCD') => {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), gamePath(gameId)), newGame('host-1'));
  });
};

describe('game rules', () => {
  test('authenticated hosts can create valid games', async () => {
    const db = testEnv.authenticatedContext('host-1').firestore();
    await assertSucceeds(setDoc(doc(db, gamePath('WINE')), newGame('host-1')));
  });

  test('unauthenticated clients cannot create games', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, gamePath('WINE')), newGame('host-1')));
  });

  test('signed-in clients can get a game but cannot list games', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext('guest-1').firestore();
    await assertSucceeds(getDoc(doc(db, gamePath('ABCD'))));
    await assertFails(getDocs(collection(db, `artifacts/${projectId}/public/data/games`)));
  });

  test('a guest can join by adding only their own player record', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext('guest-1').firestore();
    await assertSucceeds(updateDoc(doc(db, gamePath('ABCD')), {
      'playersById.guest-1': {
        id: 'guest-1',
        userName: 'Guest',
        rounds: { 'round-1': {
          score: 0, answers: {}, scoredQuestions: {}, feedbackByQuestion: {}
        } }
      }
    }));
  });

  test('a guest cannot alter another player or host-owned game state', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext('guest-1').firestore();
    await assertFails(updateDoc(doc(db, gamePath('ABCD')), {
      'playersById.guest-2': { id: 'guest-2', userName: 'Impersonated', rounds: {} }
    }));
    await assertFails(updateDoc(doc(db, gamePath('ABCD')), {
      revealAnswers: true
    }));
  });

  test('a guest can queue an answer and reconcile their own score state', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext('guest-1').firestore();
    await assertSucceeds(updateDoc(doc(db, gamePath('ABCD')), {
      'pendingAnswers.round-1.0.guest-1': {
        answer: 'A', answeredAt: 10, userName: 'Guest'
      }
    }));
    await assertSucceeds(updateDoc(doc(db, gamePath('ABCD')), {
      'playersById.guest-1': {
        id: 'guest-1',
        userName: 'Guest',
        rounds: { 'round-1': {
          score: 0,
          answers: { '0': { answer: 'A', answeredAt: 10 } },
          scoredQuestions: {},
          feedbackByQuestion: {}
        } }
      },
      'pendingAnswers.round-1.0.guest-1': deleteField()
    }));
  });

  test('the host can reveal and score a question', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext('host-1').firestore();
    await assertSucceeds(updateDoc(doc(db, gamePath('ABCD')), {
      revealAnswers: true,
      questionResults: { 'round-1': { '0': { correctAnswer: 'A', revealedAt: 10 } } }
    }));
  });
});
