import { hasFlag } from '../parser';
import { registerCommand, stderrResult, textResult } from '../executor';

function lineCount(text: string) {
  return (text.match(/\n/g) ?? []).length;
}

function wordCount(text: string) {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

registerCommand('wc', (cmd, ctx) => {
  const fileArg = cmd.args[0];
  const source = fileArg
    ? ctx.vfs.cat(fileArg)
    : ctx.stdin !== ''
      ? ctx.stdin
      : null;

  if (source === null) {
    return stderrResult('wc: missing input');
  }

  if (typeof source !== 'string') {
    return stderrResult(`wc: ${fileArg}: No such file or directory`);
  }

  const useLines = hasFlag(cmd, 'l');
  const useWords = hasFlag(cmd, 'w');
  const useChars = hasFlag(cmd, 'c');
  const defaultAll = !useLines && !useWords && !useChars;

  const counts = {
    l: lineCount(source),
    w: wordCount(source),
    c: source.length,
  };

  const selected: Array<'l' | 'w' | 'c'> = defaultAll
    ? ['l', 'w', 'c']
    : [useLines && 'l', useWords && 'w', useChars && 'c'].filter(
      (key): key is 'l' | 'w' | 'c' => Boolean(key),
    );

  if (selected.length === 1) {
    return textResult(String(counts[selected[0]]));
  }

  const rendered = selected
    .map((key) => String(counts[key]).padStart(7, ' '))
    .join('');

  return textResult(fileArg ? `${rendered} ${fileArg}` : rendered);
});
