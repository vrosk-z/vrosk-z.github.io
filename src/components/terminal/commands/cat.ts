import { fsErrorResult, registerCommand, stderrResult, textResult } from '../executor';
import { hasFlag } from '../parser';

function addLineNumbers(text: string) {
  return text
    .split('\n')
    .map((line, index) => `${String(index + 1).padStart(6, ' ')}\t${line}`)
    .join('\n');
}

registerCommand('cat', (cmd, ctx) => {
  const target = cmd.args[0];
  let content: string;

  if (target === '-' || (!target && ctx.stdin !== '')) {
    content = ctx.stdin;
  } else if (!target) {
    return stderrResult('cat: missing file operand', 1);
  } else {
    const file = ctx.vfs.cat(target);
    if (typeof file !== 'string') {
      return fsErrorResult('cat', file);
    }
    content = file;
  }

  return textResult(hasFlag(cmd, 'n') ? addLineNumbers(content) : content);
});
