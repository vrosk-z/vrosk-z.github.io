import { fsErrorResult, outputResult, registerCommand } from '../executor';
import { hasFlag } from '../parser';
import type { RichLine, RichOutput, VFSNode } from '../vfs-types';
import { isFSError, plainLine } from '../vfs-types';
import { formatDate, formatMode, groupName, nodeClass, ownerName } from './utils';

function nodeSize(node: VFSNode) {
  if (node.kind === 'dir') {
    return 4096;
  }

  if (node.readDynamic) {
    return node.readDynamic().length;
  }

  return node.content?.length ?? node.stat.size;
}

function renderCompact(nodes: VFSNode[]): RichOutput {
  if (nodes.length === 0) {
    return [];
  }

  const line: RichLine = [];

  nodes.forEach((node, index) => {
    if (index > 0) {
      line.push({ text: '  ' });
    }

    line.push({
      text: node.name,
      cls: nodeClass(node),
    });
  });

  return [line];
}

function renderLong(nodes: VFSNode[], extras: VFSNode[] = []): RichOutput {
  const allNodes = extras.concat(nodes);
  const output: RichOutput = [plainLine(`total ${allNodes.length * 4}`)[0] ?? [{ text: 'total 0' }]];

  for (const node of allNodes) {
    output.push([
      { text: formatMode(node), cls: node.kind === 'dir' ? 'dir' : nodeClass(node) === 'exec' ? 'exec' : undefined },
      { text: '  1 ' },
      { text: ownerName(node.stat.uid) },
      { text: ' ' },
      { text: groupName(node.stat.gid) },
      { text: ` ${String(nodeSize(node)).padStart(5, ' ')} ` },
      { text: formatDate(node.stat.mtime) },
      { text: ' ' },
      { text: node.name, cls: nodeClass(node) },
    ]);
  }

  return output;
}

registerCommand('ls', (cmd, ctx) => {
  const showHidden = hasFlag(cmd, 'a', 'A');
  const long = hasFlag(cmd, 'l');
  const target = cmd.args[0];
  const listed = ctx.vfs.ls(target, showHidden);

  if (!Array.isArray(listed)) {
    return fsErrorResult('ls', listed);
  }

  if (!long) {
    return outputResult(renderCompact(listed));
  }

  const extras: VFSNode[] = [];
  const targetNode = ctx.vfs.resolve(target ?? '.');

  if (showHidden && !isFSError(targetNode) && targetNode.kind === 'dir') {
    const targetStat = ctx.vfs.stat(target ?? '.');
    const parentStat = ctx.vfs.stat(target ? `${target}/..` : '..');

    if (!isFSError(targetStat)) {
      extras.push({
        kind: 'dir',
        name: '.',
        stat: targetStat,
        children: new Map(),
      });
    }

    if (!isFSError(parentStat)) {
      extras.push({
        kind: 'dir',
        name: '..',
        stat: parentStat,
        children: new Map(),
      });
    }
  }

  return outputResult(renderLong(listed, extras));
});
