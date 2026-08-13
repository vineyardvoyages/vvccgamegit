import { readJsonStorage, writeJsonStorage } from './storageUtils';

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
