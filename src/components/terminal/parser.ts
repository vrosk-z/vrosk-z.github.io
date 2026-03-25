import type { CommandNode, ParsedFlag, PipelineNode, Token } from './ast';

function syntaxError(token: string) {
  return new SyntaxError(`bash: syntax error near unexpected token '${token}'`);
}

function newlineSyntaxError() {
  return new SyntaxError("bash: syntax error near unexpected token 'newline'");
}

function splitLongFlag(value: string): ParsedFlag {
  const eqIndex = value.indexOf('=');

  if (eqIndex === -1) {
    return { short: false, key: value };
  }

  return {
    short: false,
    key: value.slice(0, eqIndex),
    value: value.slice(eqIndex + 1),
  };
}

export function parse(tokens: Token[]): PipelineNode {
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0]?.kind === 'EOF')) {
    return { type: 'pipeline', commands: [] };
  }

  const lastMeaningfulToken = [...tokens].reverse().find((token) => token.kind !== 'EOF');
  if (lastMeaningfulToken?.kind === 'PIPE') {
    throw syntaxError('|');
  }

  const commands: CommandNode[] = [];
  let current: CommandNode | null = null;
  let lastArgvPos: number | null = null;

  const ensureCommand = () => {
    if (!current) {
      current = {
        type: 'command',
        name: '',
        args: [],
        flags: [],
        rawArgv: [],
      };
      lastArgvPos = null;
    }
    return current;
  };

  const pushRawArgv = (cmd: CommandNode, token: Token) => {
    if (lastArgvPos === token.pos) {
      return;
    }

    cmd.rawArgv.push(
      token.kind === 'FLAG_SHORT' || token.kind === 'FLAG_LONG'
        ? token.raw
        : token.value,
    );
    lastArgvPos = token.pos;
  };

  const finalizeCurrent = () => {
    if (!current || !current.name) {
      throw syntaxError('|');
    }

    commands.push(current);
    current = null;
    lastArgvPos = null;
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token || token.kind === 'EOF') {
      break;
    }

    if (token.kind === 'PIPE') {
      finalizeCurrent();
      i += 1;
      continue;
    }

    const command = ensureCommand();

    if (token.kind === 'WORD' || token.kind === 'STRING') {
      if (!command.name) {
        command.name = token.value;
      } else {
        pushRawArgv(command, token);
        command.args.push(token.value);
      }
      i += 1;
      continue;
    }

    if (!command.name) {
      throw syntaxError(token.raw || token.value || '|');
    }

    if (token.kind === 'FLAG_SHORT') {
      pushRawArgv(command, token);
      command.flags.push({ short: true, key: token.value });
      i += 1;
      continue;
    }

    if (token.kind === 'FLAG_LONG') {
      pushRawArgv(command, token);
      command.flags.push(splitLongFlag(token.value));
      i += 1;
      continue;
    }

    if (
      token.kind === 'REDIRECT_IN'
      || token.kind === 'REDIRECT_OUT'
      || token.kind === 'REDIRECT_APP'
    ) {
      const next = tokens[i + 1];

      if (
        !next
        || next.kind === 'EOF'
        || next.kind === 'PIPE'
        || next.kind === 'REDIRECT_IN'
        || next.kind === 'REDIRECT_OUT'
        || next.kind === 'REDIRECT_APP'
      ) {
        throw newlineSyntaxError();
      }

      if (next.kind !== 'WORD' && next.kind !== 'STRING') {
        throw newlineSyntaxError();
      }

      if (token.kind === 'REDIRECT_IN') {
        command.stdin = next.value;
      } else {
        command.stdout = next.value;
        command.appendStdout = token.kind === 'REDIRECT_APP';
      }

      i += 2;
      continue;
    }
  }

  if (current) {
    commands.push(current as CommandNode);
  }

  return {
    type: 'pipeline',
    commands,
  };
}

export function hasFlag(cmd: CommandNode, ...keys: string[]): boolean {
  return cmd.flags.some((flag) => keys.includes(flag.key));
}

export function flagValue(cmd: CommandNode, key: string): string | undefined {
  return cmd.flags.find((flag) => flag.key === key)?.value;
}

export function flagNumber(cmd: CommandNode, key: string, def: number): number {
  const value = flagValue(cmd, key);
  if (value === undefined) {
    return def;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? def : parsed;
}
