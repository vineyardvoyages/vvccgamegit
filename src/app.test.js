import { shuffleArray } from './app';

describe('shuffleArray', () => {
  it('should return an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray([...input]);
    expect(result.length).toBe(input.length);
  });

  it('should contain all the original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray([...input]);
    expect(result).toEqual(expect.arrayContaining(input));
    expect(input).toEqual(expect.arrayContaining(result));
  });

  it('should return the same array reference', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toBe(input);
  });

  it('should handle empty arrays', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('should handle single element arrays', () => {
    expect(shuffleArray([1])).toEqual([1]);
  });

  it('should shuffle elements predictably with mocked Math.random', () => {
    const input = [1, 2, 3, 4];

    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.1);

    const result = shuffleArray([...input]);
    expect(result).toEqual([2, 1, 4, 3]);

    randomSpy.mockRestore();
  });
});
