import { registerCommand, stderrResult, textResult } from '../executor';
import { extractCountArg } from './utils';

registerCommand('head', (cmd, ctx) => {
  const { value, rest } = extractCountArg(cmd.rawArgv, 'n', 10);
  const fileArg = rest.find((token) => !token.startsWith('-'));
  const source = fileArg
    ? ctx.vfs.cat(fileArg)
    : ctx.stdin !== ''
      ? ctx.stdin
      : null;

  if (source === null) {
    return stderrResult('head: missing input');
  }

  if (typeof source !== 'string') {
    return stderrResult(`head: ${fileArg}: No such file or directory`);
  }

  return textResult(source.split('\n').slice(0, value).join('\n'));
});
