import { beforeEach, describe, expect, it } from 'vitest';
import '../src/components/terminal/commands';
import { executePipeline, richOutputToText } from '../src/components/terminal/executor';
import { tokenize } from '../src/components/terminal/lexer';
import { parse } from '../src/components/terminal/parser';
import { VirtualFS } from '../src/components/terminal/vfs';

function run(input: string, vfs = new VirtualFS()) {
  try {
    const pipeline = parse(tokenize(input));
    return executePipeline(pipeline, vfs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: message.split('\n').map((line) => [{ text: line, cls: 'error' as const }]),
      stdout: '',
      stderr: message,
      exitCode: 1,
    };
  }
}

describe('executePipeline', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
  });

  it('runs echo', () => {
    const result = run('echo hello');

    expect(richOutputToText(result.output)).toContain('hello');
  });

  it('supports pipes', () => {
    const result = run('echo hello | wc -w');

    expect(richOutputToText(result.output)).toContain('1');
  });

  it('counts grep matches through a pipe', () => {
    const result = run('cat about.txt | grep -c Python');

    expect(richOutputToText(result.output)).toMatch(/^\d+$/);
  });

  it('reads only the first line with head', () => {
    const result = run('cat about.txt | head -n 1');

    expect(richOutputToText(result.output)).toContain('Backend');
    expect(richOutputToText(result.output)).not.toContain('Humans will architect');
  });

  it('filters ls output with grep', () => {
    const result = run('ls -la | grep vrosk');

    expect(richOutputToText(result.output)).toContain('vrosk');
  });

  it('highlights grep matches', () => {
    const result = run('grep Python about.txt');

    expect(result.output.some((line) => line.some((span) => span.cls === 'highlight'))).toBe(true);
  });

  it('reports unknown commands', () => {
    const result = run('unknown');

    expect(result.exitCode).toBe(127);
    expect(richOutputToText(result.output)).toContain('command not found');
  });

  it('surfaces syntax errors', () => {
    const result = run('echo hello |');

    expect(richOutputToText(result.output)).toContain('syntax error');
  });

  it('persists cwd changes across commands', () => {
    const vfs = new VirtualFS();

    run('cd /tmp', vfs);
    const result = run('pwd', vfs);

    expect(richOutputToText(result.output)).toBe('/tmp');
  });
});
