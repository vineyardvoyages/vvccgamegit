import {
  loadRecentQuestionIds,
  readJsonStorage,
  saveRecentQuestionIds,
  writeJsonStorage
} from './storageUtils';

describe('storage fallbacks', () => {
  const originalStorage = window.localStorage;
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalStorage
    });
  });

  test('readJsonStorage returns its fallback when storage throws', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: jest.fn(() => { throw new Error('blocked'); }) }
    });
    expect(readJsonStorage('key', { safe: true })).toEqual({ safe: true });
  });

  test('writeJsonStorage reports failure when storage throws', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { setItem: jest.fn(() => { throw new Error('full'); }) }
    });
    expect(writeJsonStorage('key', { value: 1 })).toBe(false);
  });
});

describe('recent-question history', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('keeps the 100 most recent unique question IDs across saves', () => {
    saveRecentQuestionIds(Array.from({ length: 60 }, (_, index) => `q-${index}`));
    saveRecentQuestionIds(Array.from({ length: 60 }, (_, index) => `q-${index + 60}`));
    saveRecentQuestionIds(['q-119', 'q-120']);

    const saved = loadRecentQuestionIds();
    expect(saved).toHaveLength(100);
    expect(saved[0]).toBe('q-21');
    expect(saved.at(-1)).toBe('q-120');
    expect(new Set(saved).size).toBe(100);
  });
});
