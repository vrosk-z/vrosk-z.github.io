import { outputResult, registerCommand, stderrResult, textResult } from '../executor';
import { hasFlag } from '../parser';
import type { RichLine, RichOutput } from '../vfs-types';
import { escapeRegExp } from './utils';

function highlightLine(line: string, matcher: RegExp, lineNumber?: number): RichLine {
  const spans: RichLine = [];
  if (lineNumber !== undefined) {
    spans.push({ text: `${lineNumber}:`, cls: 'muted' });
  }

  let lastIndex = 0;
  matcher.lastIndex = 0;
  let match = matcher.exec(line);

  while (match) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) {
      spans.push({ text: line.slice(lastIndex, start) });
    }

    spans.push({ text: line.slice(start, end), cls: 'highlight' });
    lastIndex = end;

    if (match[0].length === 0) {
      break;
    }

    match = matcher.exec(line);
  }

  if (lastIndex < line.length) {
    spans.push({ text: line.slice(lastIndex) });
  }

  if (spans.length === 0) {
    spans.push({ text: line });
  }

  return spans;
}

registerCommand('grep', (cmd, ctx) => {
  const pattern = cmd.args[0];
  if (!pattern) {
    return stderrResult('grep: missing pattern', 2);
  }

  const files = cmd.args.slice(1);
  const sources: string[] = [];
  const output: RichOutput = [];
  const insensitive = hasFlag(cmd, 'i');
  const showNumbers = hasFlag(cmd, 'n');
  const invert = hasFlag(cmd, 'v');
  const countOnly = hasFlag(cmd, 'c');
  const ignoreBinary = hasFlag(cmd, 'I');
  const matcher = new RegExp(escapeRegExp(pattern), insensitive ? 'gi' : 'g');

  if (files.length > 0) {
    for (const file of files) {
      if (ignoreBinary && file.endsWith('.bin')) {
        continue;
      }

      const result = ctx.vfs.cat(file);
      if (typeof result !== 'string') {
        return stderrResult(`grep: ${file}: No such file or directory`, 2);
      }
      sources.push(result);
    }
  } else if (ctx.stdin !== '') {
    sources.push(ctx.stdin);
  } else {
    return stderrResult('grep: missing input', 2);
  }

  let matchCount = 0;

  for (const source of sources) {
    const lines = source.split('\n');

    lines.forEach((line, index) => {
      const hits = insensitive
        ? line.toLowerCase().includes(pattern.toLowerCase())
        : line.includes(pattern);
      const matched = invert ? !hits : hits;

      if (!matched) {
        return;
      }

      matchCount += 1;
      if (countOnly) {
        return;
      }

      output.push(
        invert
          ? [{ text: showNumbers ? `${index + 1}:${line}` : line }]
          : highlightLine(line, matcher, showNumbers ? index + 1 : undefined),
      );
    });
  }

  if (countOnly) {
    return {
      ...textResult(String(matchCount)),
      exitCode: matchCount > 0 ? 0 : 1,
    };
  }

  return {
    ...outputResult(output),
    exitCode: matchCount > 0 ? 0 : 1,
  };
});
