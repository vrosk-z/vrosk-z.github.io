import { beforeEach, describe, expect, it } from 'vitest';
import { executeCommand } from '../src/components/TerminalCommands';

describe('executeCommand', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
  });

  it('shows help output', () => {
    const result = executeCommand('help');

    expect(result.output).toContain('available commands');
    expect(result.output).toContain('matrix on|off');
  });

  it('lists files including hidden entries for ls -a', () => {
    const result = executeCommand('ls -a');

    expect(result.output).toContain('.secret');
  });

  it('reads files through cat', () => {
    const result = executeCommand('cat about.txt');

    expect(result.output).toContain('Backend dev');
  });

  it('executes the binary command', () => {
    const result = executeCommand('./what-is-this.bin');

    expect(result.output).toContain('pattern recognition');
  });

  it('returns action for matrix off', () => {
    const result = executeCommand('matrix off');

    expect(result.action).toBe('matrix-off');
    expect(result.output).toBe('matrix rain disabled.');
  });

  it('returns action for language switch', () => {
    const result = executeCommand('lang ru');

    expect(result.action).toBe('lang-ru');
  });

  it('clears the terminal', () => {
    const result = executeCommand('clear');

    expect(result.action).toBe('clear');
    expect(result.output).toBe('');
  });

  it('triggers the destroy animation', () => {
    const result = executeCommand('sudo rm -rf /');

    expect(result.action).toBe('destroy');
  });

  it('uses localized content for terminal output', () => {
    document.documentElement.lang = 'ru';

    const result = executeCommand('projects');

    expect(result.output).toBe('No projects published yet.');
  });

  it('reports unknown commands', () => {
    const result = executeCommand('unknown');

    expect(result.output).toBe('bash: unknown: command not found');
  });
});
