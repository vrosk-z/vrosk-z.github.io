import { outputResult, registerCommand } from '../executor';
import type { RichOutput, VFSNode } from '../vfs-types';
import { globToRegExp, canTraverse } from './utils';

type Predicate =
  | { type: 'name'; pattern: string }
  | { type: 'kind'; value: 'f' | 'd' };

function matchesPredicates(node: VFSNode, predicates: Predicate[]) {
  return predicates.every((predicate) => {
    if (predicate.type === 'name') {
      return globToRegExp(predicate.pattern).test(node.name);
    }

    return predicate.value === 'd' ? node.kind === 'dir' : node.kind === 'file';
  });
}

function joinPath(base: string, part: string) {
  return base === '/' ? `/${part}` : `${base}/${part}`;
}

function formatFoundPath(displayRoot: string, absRoot: string, absPath: string) {
  if (absPath === absRoot) {
    return displayRoot;
  }

  const suffix = absPath.slice(absRoot.length).replace(/^\//, '');
  if (!suffix) {
    return displayRoot;
  }

  if (displayRoot === '.') {
    return `./${suffix}`;
  }

  return displayRoot.endsWith('/')
    ? `${displayRoot}${suffix}`
    : `${displayRoot}/${suffix}`;
}

registerCommand('find', (cmd, ctx) => {
  const argv = [...cmd.rawArgv];
  let pathArg = '.';

  if (argv[0] && !argv[0].startsWith('-')) {
    pathArg = argv.shift() ?? '.';
  }

  const predicates: Predicate[] = [];

  while (argv.length > 0) {
    const key = argv.shift();
    if (key === '-name') {
      const value = argv.shift();
      if (value) {
        predicates.push({ type: 'name', pattern: value });
      }
      continue;
    }

    if (key === '-type') {
      const value = argv.shift();
      if (value === 'f' || value === 'd') {
        predicates.push({ type: 'kind', value });
      }
    }
  }

  const root = ctx.vfs.resolve(pathArg);
  if ('code' in root) {
    return { output: [], stdout: '', stderr: '', exitCode: 1 };
  }

  const absRoot = pathArg.startsWith('/') ? pathArg : ctx.vfs.pwd() === '/'
    ? `/${pathArg.replace(/^\.\//, '')}`.replace(/\/+/g, '/')
    : `${ctx.vfs.pwd()}/${pathArg}`.replace(/\/+/g, '/').replace(/\/\.\//g, '/');
  const displayRoot = pathArg;
  const output: RichOutput = [];

  const walk = (node: VFSNode, currentAbs: string) => {
    if (currentAbs !== absRoot && matchesPredicates(node, predicates)) {
      output.push([{ text: formatFoundPath(displayRoot, absRoot, currentAbs) }]);
    }

    if (node.kind !== 'dir' || !canTraverse(node)) {
      return;
    }

    const children = Array.from(node.children?.values() ?? [])
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const child of children) {
      if (child.kind === 'dir' && !canTraverse(child)) {
        continue;
      }
      walk(child, joinPath(currentAbs, child.name));
    }
  };

  walk(root, absRoot);

  return outputResult(output);
});
