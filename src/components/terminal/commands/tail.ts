import { registerCommand, stderrResult, textResult } from '../executor';
import { extractCountArg } from './utils';

registerCommand('tail', (cmd, ctx) => {
  const { value, rest } = extractCountArg(cmd.rawArgv, 'n', 10);
  const fileArg = rest.find((token) => !token.startsWith('-'));
  const source = fileArg
    ? ctx.vfs.cat(fileArg)
    : ctx.stdin !== ''
      ? ctx.stdin
      : null;

  if (source === null) {
    return stderrResult('tail: missing input');
  }

  if (typeof source !== 'string') {
    return stderrResult(`tail: ${fileArg}: No such file or directory`);
  }

  const lines = source.split('\n');
  return textResult(lines.slice(Math.max(0, lines.length - value)).join('\n'));
});
