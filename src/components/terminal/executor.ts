import { getContent } from '../../lib/lang';
import type { CommandNode, PipelineNode } from './ast';
import { fmtError, isFSError, plainText, type RichOutput } from './vfs-types';
import type { VirtualFS } from './vfs';

export type TerminalAction =
  | 'clear'
  | 'history'
  | 'destroy'
  | 'matrix-on'
  | 'matrix-off'
  | 'lang-en'
  | 'lang-ru';

export interface ExecContext {
  vfs: VirtualFS;
  stdin: string;
}

export interface ExecResult {
  output: RichOutput;
  stdout: string;
  stderr: string;
  exitCode: number;
  action?: TerminalAction;
}

export type CommandHandler = (cmd: CommandNode, ctx: ExecContext) => ExecResult;

const COMMAND_REGISTRY = new Map<string, CommandHandler>();

function errorOutput(message: string): RichOutput {
  return message.split('\n').map((line) => [{ text: line, cls: 'error' as const }]);
}

export function richOutputToText(output: RichOutput): string {
  return output.map((line) => line.map((span) => span.text).join('')).join('\n');
}

export function outputResult(output: RichOutput, action?: TerminalAction): ExecResult {
  return {
    output,
    stdout: richOutputToText(output),
    stderr: '',
    exitCode: 0,
    action,
  };
}

export function textResult(text: string, action?: TerminalAction): ExecResult {
  return outputResult(plainText(text), action);
}

export function emptyResult(action?: TerminalAction): ExecResult {
  return {
    output: [],
    stdout: '',
    stderr: '',
    exitCode: 0,
    action,
  };
}

export function stderrResult(message: string, exitCode = 1): ExecResult {
  return {
    output: [],
    stdout: '',
    stderr: message,
    exitCode,
  };
}

export function fsErrorResult(cmd: string, err: unknown, exitCode = 1): ExecResult {
  if (isFSError(err)) {
    return stderrResult(fmtError(cmd, err), exitCode);
  }

  return stderrResult(String(err), exitCode);
}

export function registerCommand(name: string, handler: CommandHandler) {
  COMMAND_REGISTRY.set(name, handler);
}

export function executePipeline(pipeline: PipelineNode, vfs: VirtualFS): ExecResult {
  if (pipeline.commands.length === 0) {
    return emptyResult();
  }

  let piped = '';
  let stderrLines: string[] = [];
  let lastResult: ExecResult = emptyResult();

  for (const cmd of pipeline.commands) {
    let stdin = piped;

    if (cmd.stdin) {
      const redirected = vfs.cat(cmd.stdin);
      if (isFSError(redirected)) {
        const error = fmtError(cmd.name, redirected);
        stderrLines.push(error);
        lastResult = stderrResult(error);
        piped = '';
        continue;
      }

      stdin = redirected;
    }

    lastResult = dispatchCommand(cmd, { vfs, stdin });

    if (lastResult.stderr) {
      stderrLines = stderrLines.concat(lastResult.stderr.split('\n'));
    }

    if (cmd.stdout) {
      const writeError = vfs.write(cmd.stdout, lastResult.stdout, cmd.appendStdout);
      if (writeError) {
        const error = fmtError(cmd.name, writeError);
        stderrLines.push(error);
        lastResult = stderrResult(error);
        piped = '';
        continue;
      }

      lastResult = {
        ...lastResult,
        output: [],
        stdout: '',
      };
      piped = '';
      continue;
    }

    piped = lastResult.stdout;
  }

  const stderrOutput = stderrLines.length > 0
    ? errorOutput(stderrLines.join('\n'))
    : [];

  return {
    ...lastResult,
    output: stderrOutput.concat(lastResult.output),
    stderr: stderrLines.join('\n'),
  };
}

export function dispatchCommand(cmd: CommandNode, ctx: ExecContext): ExecResult {
  const handler = COMMAND_REGISTRY.get(cmd.name)
    ?? (cmd.name.startsWith('./') ? COMMAND_REGISTRY.get('./') : undefined);

  if (!handler) {
    return stderrResult(getContent().terminal.commandNotFound.replace('{cmd}', cmd.name), 127);
  }

  return handler(cmd, ctx);
}
