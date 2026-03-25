import type { Token } from './ast';

function isWhitespace(char: string) {
  return /\s/.test(char);
}

function isSpecial(char: string) {
  return char === '|' || char === '>' || char === '<' || char === '"' || char === "'";
}

function pushShortFlags(tokens: Token[], raw: string, pos: number, letters: string) {
  for (const letter of letters) {
    tokens.push({
      kind: 'FLAG_SHORT',
      value: letter,
      raw,
      pos,
    });
  }
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i] ?? '';

    if (isWhitespace(char)) {
      i += 1;
      continue;
    }

    if (char === '|') {
      tokens.push({ kind: 'PIPE', value: '|', raw: '|', pos: i });
      i += 1;
      continue;
    }

    if (char === '>') {
      if (input[i + 1] === '>') {
        tokens.push({ kind: 'REDIRECT_APP', value: '>>', raw: '>>', pos: i });
        i += 2;
      } else {
        tokens.push({ kind: 'REDIRECT_OUT', value: '>', raw: '>', pos: i });
        i += 1;
      }
      continue;
    }

    if (char === '<') {
      tokens.push({ kind: 'REDIRECT_IN', value: '<', raw: '<', pos: i });
      i += 1;
      continue;
    }

    if (char === "'") {
      const start = i;
      i += 1;
      let value = '';

      while (i < input.length && input[i] !== "'") {
        value += input[i];
        i += 1;
      }

      if (i >= input.length) {
        throw new SyntaxError("bash: unexpected EOF while looking for matching `''");
      }

      const raw = input.slice(start, i + 1);
      tokens.push({ kind: 'STRING', value, raw, pos: start });
      i += 1;
      continue;
    }

    if (char === '"') {
      const start = i;
      i += 1;
      let value = '';

      while (i < input.length) {
        const current = input[i] ?? '';

        if (current === '"') {
          break;
        }

        if (current === '\\' && input[i + 1] === '"') {
          value += '"';
          i += 2;
          continue;
        }

        value += current;
        i += 1;
      }

      if (i >= input.length) {
        throw new SyntaxError("bash: unexpected EOF while looking for matching `\"'");
      }

      const raw = input.slice(start, i + 1);
      tokens.push({ kind: 'STRING', value, raw, pos: start });
      i += 1;
      continue;
    }

    const start = i;
    while (i < input.length && !isWhitespace(input[i] ?? '') && !isSpecial(input[i] ?? '')) {
      i += 1;
    }

    const raw = input.slice(start, i);
    if (raw.length === 0) {
      continue;
    }

    if (raw.startsWith('--') && raw.length > 2) {
      tokens.push({
        kind: 'FLAG_LONG',
        value: raw.slice(2),
        raw,
        pos: start,
      });
      continue;
    }

    if (raw === '-') {
      tokens.push({ kind: 'WORD', value: raw, raw, pos: start });
      continue;
    }

    if (raw.startsWith('-') && /^[A-Za-z]/.test(raw.slice(1))) {
      const lettersMatch = raw.slice(1).match(/^[A-Za-z]+/);
      const letters = lettersMatch?.[0] ?? '';

      if (letters.length > 0) {
        pushShortFlags(tokens, raw, start, letters);
        const remainder = raw.slice(1 + letters.length);
        if (remainder.length > 0) {
          tokens.push({
            kind: 'WORD',
            value: remainder,
            raw,
            pos: start,
          });
        }
        continue;
      }
    }

    tokens.push({
      kind: 'WORD',
      value: raw,
      raw,
      pos: start,
    });
  }

  tokens.push({
    kind: 'EOF',
    value: '',
    raw: '',
    pos: input.length,
  });

  return tokens;
}
