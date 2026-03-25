import { describe, expect, it } from 'vitest';
import { tokenize } from '../src/components/terminal/lexer';

describe('tokenize', () => {
  it('returns EOF for empty input', () => {
    expect(tokenize('')).toEqual([
      { kind: 'EOF', value: '', raw: '', pos: 0 },
    ]);
  });

  it('expands combined short flags', () => {
    const tokens = tokenize('ls -la');

    expect(tokens.map((token) => [token.kind, token.value])).toEqual([
      ['WORD', 'ls'],
      ['FLAG_SHORT', 'l'],
      ['FLAG_SHORT', 'a'],
      ['EOF', ''],
    ]);
  });

  it('keeps quoted strings together', () => {
    const tokens = tokenize("cat 'my file.txt'");

    expect(tokens.map((token) => [token.kind, token.value])).toEqual([
      ['WORD', 'cat'],
      ['STRING', 'my file.txt'],
      ['EOF', ''],
    ]);
  });

  it('tokenizes pipes correctly', () => {
    const tokens = tokenize('echo hello | wc -l');

    expect(tokens.map((token) => [token.kind, token.value])).toEqual([
      ['WORD', 'echo'],
      ['WORD', 'hello'],
      ['PIPE', '|'],
      ['WORD', 'wc'],
      ['FLAG_SHORT', 'l'],
      ['EOF', ''],
    ]);
  });

  it('parses long flags', () => {
    const tokens = tokenize('cat --number=5');

    expect(tokens.map((token) => [token.kind, token.value])).toEqual([
      ['WORD', 'cat'],
      ['FLAG_LONG', 'number=5'],
      ['EOF', ''],
    ]);
  });

  it('throws on unclosed single quotes', () => {
    expect(() => tokenize("cat 'my file")).toThrowError(
      "bash: unexpected EOF while looking for matching `''",
    );
  });
});
