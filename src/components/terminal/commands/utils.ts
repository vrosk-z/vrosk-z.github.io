import { CURRENT_GID, CURRENT_UID } from '../vfs-tree';
import type { RichSpan, VFSNode } from '../vfs-types';

function permissionTriplet(bits: number) {
  return `${(bits & 0o4) !== 0 ? 'r' : '-'}${(bits & 0o2) !== 0 ? 'w' : '-'}${(bits & 0o1) !== 0 ? 'x' : '-'}`;
}

function selectBits(node: VFSNode) {
  if (node.stat.uid === CURRENT_UID) {
    return (node.stat.mode >> 6) & 0o7;
  }

  if (node.stat.gid === CURRENT_GID) {
    return (node.stat.mode >> 3) & 0o7;
  }

  return node.stat.mode & 0o7;
}

export function canTraverse(node: VFSNode) {
  return (selectBits(node) & 0o1) !== 0;
}

export function isExecutableNode(node: VFSNode) {
  return node.kind === 'file'
    && (
      node.name.endsWith('.bin')
      || (node.stat.mode & 0o111) !== 0
    );
}

export function nodeClass(node: VFSNode): RichSpan['cls'] | undefined {
  if (node.name.startsWith('.')) {
    return 'hidden';
  }

  if (node.kind === 'dir') {
    return 'dir';
  }

  if (isExecutableNode(node)) {
    return 'exec';
  }

  return undefined;
}

export function formatMode(node: VFSNode) {
  const prefix = node.kind === 'dir' ? 'd' : '-';
  const user = permissionTriplet((node.stat.mode >> 6) & 0o7);
  const group = permissionTriplet((node.stat.mode >> 3) & 0o7);
  const other = permissionTriplet(node.stat.mode & 0o7);
  return `${prefix}${user}${group}${other}`;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function ownerName(uid: number) {
  return uid === 0 ? 'root' : 'vrosk';
}

export function groupName(gid: number) {
  return gid === 0 ? 'root' : 'dev';
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function globToRegExp(pattern: string) {
  const escaped = pattern
    .split('')
    .map((char) => {
      if (char === '*') {
        return '.*';
      }

      if (char === '?') {
        return '.';
      }

      return escapeRegExp(char);
    })
    .join('');

  return new RegExp(`^${escaped}$`);
}

export function extractCountArg(rawArgv: string[], shortFlag: string, def: number) {
  let value = def;
  const rest: string[] = [];

  for (let index = 0; index < rawArgv.length; index += 1) {
    const token = rawArgv[index] ?? '';

    if (token === `-${shortFlag}`) {
      const next = rawArgv[index + 1];
      if (next && /^\d+$/.test(next)) {
        value = Number.parseInt(next, 10);
        index += 1;
      }
      continue;
    }

    if (token.startsWith(`-${shortFlag}`) && token.length > shortFlag.length + 1) {
      const suffix = token.slice(shortFlag.length + 1);
      if (/^\d+$/.test(suffix)) {
        value = Number.parseInt(suffix, 10);
        continue;
      }
    }

    rest.push(token);
  }

  return { value, rest };
}
