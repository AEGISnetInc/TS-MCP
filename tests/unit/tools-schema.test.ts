import { GetTestResultsInputSchema } from '../../src/server/tools.js';

describe('GetTestResultsInputSchema', () => {
  test('accepts executionId without verbose (defaults to false)', () => {
    const result = GetTestResultsInputSchema.parse({ executionId: '123' });
    expect(result.executionId).toBe('123');
    expect(result.verbose).toBe(false);
  });

  test('accepts verbose: true', () => {
    const result = GetTestResultsInputSchema.parse({ executionId: '123', verbose: true });
    expect(result.verbose).toBe(true);
  });

  test('accepts verbose: false explicitly', () => {
    const result = GetTestResultsInputSchema.parse({ executionId: '123', verbose: false });
    expect(result.verbose).toBe(false);
  });
});
