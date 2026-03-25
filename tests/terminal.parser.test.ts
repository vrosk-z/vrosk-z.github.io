import { describe, expect, it } from 'vitest';
import { tokenize } from '../src/components/terminal/lexer';
import { flagValue, hasFlag, parse } from '../src/components/terminal/parser';

describe('parse', () => {
  it('parses a single command', () => {
    const pipeline = parse(tokenize('pwd'));

    expect(pipeline.commands).toHaveLength(1);
    expect(pipeline.commands[0]).toMatchObject({
      name: 'pwd',
      args: [],
      flags: [],
      rawArgv: [],
    });
  });

  it('parses flags and args', () => {
    const pipeline = parse(tokenize('ls -la /tmp'));
    const command = pipeline.commands[0];

    expect(command).toMatchObject({
      name: 'ls',
      args: ['/tmp'],
      rawArgv: ['-la', '/tmp'],
    });
    expect(command.flags).toEqual([
      { short: true, key: 'l' },
      { short: true, key: 'a' },
    ]);
  });

  it('parses a two-stage pipe', () => {
    const pipeline = parse(tokenize('echo hello | wc -w'));

    expect(pipeline.commands).toHaveLength(2);
    expect(pipeline.commands[0]?.name).toBe('echo');
    expect(pipeline.commands[1]?.name).toBe('wc');
  });

  it('throws on leading pipe', () => {
    expect(() => parse(tokenize('| wc -l'))).toThrowError(
      "bash: syntax error near unexpected token '|'",
    );
  });

  it('supports flag helpers', () => {
    const pipeline = parse(tokenize('cat --number=5'));
    const command = pipeline.commands[0]!;

    expect(hasFlag(command, 'number')).toBe(true);
    expect(flagValue(command, 'number')).toBe('5');
  });
});
