import { getContent } from '../../lib/lang';
import { CURRENT_GID, CURRENT_UID, createNode, HOME, STATIC_TREE } from './vfs-tree';
import type { FSError, VFSNode, VFSStat } from './vfs-types';
import { isFSError } from './vfs-types';

const HOME_LEVEL_BARS: Record<string, string> = {
  primary: '[############--]',
  learning: '[######--------]',
  comfortable: '[##########----]',
  daily: '[##############]',
};

function cloneNode(node: VFSNode): VFSNode {
  return {
    kind: node.kind,
    name: node.name,
    stat: {
      ...node.stat,
      mtime: new Date(node.stat.mtime),
    },
    content: node.content,
    readDynamic: node.readDynamic,
    children: node.children
      ? new Map(Array.from(node.children.entries(), ([key, child]) => [key, cloneNode(child)]))
      : undefined,
  };
}

function buildSkillsText() {
  const content = getContent();
  return content.skills.items
    .map((skill) => {
      const bar = HOME_LEVEL_BARS[skill.level] ?? '[##########----]';
      return `${skill.name.padEnd(16, ' ')} ${bar}  ${skill.label}`;
    })
    .join('\n');
}

function createHomeFiles(): VFSNode[] {
  return [
    createNode('file', 'about.txt', 0o644, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      readDynamic: () => getContent().about.text,
    }),
    createNode('file', 'skills.txt', 0o644, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      readDynamic: buildSkillsText,
    }),
    createNode('file', 'contact.txt', 0o644, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      readDynamic: () => {
        const content = getContent();
        return `${content.contact.text}\n${content.contact.telegram}\n${content.contact.url}`;
      },
    }),
    createNode('file', 'what-is-this.bin', 0o755, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      readDynamic: () => getContent().terminal.files.binary,
    }),
    createNode('file', '.secret', 0o600, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      readDynamic: () => getContent().terminal.files.secret,
    }),
  ];
}

function makeError(code: FSError['code'], path: string): FSError {
  return { code, path };
}

function isManagedHomeFile(name: string) {
  return ['about.txt', 'skills.txt', 'contact.txt', 'what-is-this.bin', '.secret'].includes(name);
}

export class VirtualFS {
  private root: VFSNode;

  private cwd = HOME;

  constructor() {
    this.root = cloneNode(STATIC_TREE);
    this.populateHomeFiles();
  }

  pwd() {
    return this.cwd;
  }

  promptPath() {
    return this.cwd.startsWith(HOME)
      ? `~${this.cwd.slice(HOME.length)}`
      : this.cwd;
  }

  resolve(path: string): VFSNode | FSError {
    this.populateHomeFiles();
    const abs = this.toAbsolute(path);

    if (abs === '/') {
      return this.root;
    }

    const parts = abs.split('/').filter(Boolean);
    let current = this.root;
    let currentPath = '/';

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];

      if (current.kind !== 'dir') {
        return makeError('ENOTDIR', currentPath);
      }

      if (index > 0 && !this.canTraverse(current)) {
        return makeError('EACCES', currentPath);
      }

      const next = current.children?.get(part);
      const nextPath = currentPath === '/' ? `/${part}` : `${currentPath}/${part}`;

      if (!next) {
        return makeError('ENOENT', nextPath);
      }

      current = next;
      currentPath = nextPath;
    }

    return current;
  }

  cd(path: string): FSError | null {
    const abs = this.toAbsolute(path);
    const resolved = this.resolve(abs);

    if (isFSError(resolved)) {
      return resolved;
    }

    if (resolved.kind !== 'dir') {
      return makeError('ENOTDIR', abs);
    }

    if (!this.canTraverse(resolved)) {
      return makeError('EACCES', abs);
    }

    this.cwd = abs;
    return null;
  }

  ls(path: string | undefined, showHidden: boolean): VFSNode[] | FSError {
    const abs = this.toAbsolute(path ?? this.cwd);
    const resolved = this.resolve(abs);

    if (isFSError(resolved)) {
      return resolved;
    }

    if (resolved.kind !== 'dir') {
      return [resolved];
    }

    if (!this.canList(resolved)) {
      return makeError('EACCES', abs);
    }

    return Array.from(resolved.children?.values() ?? [])
      .filter((node) => showHidden || !node.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  cat(path: string): string | FSError {
    const abs = this.toAbsolute(path);
    const resolved = this.resolve(abs);

    if (isFSError(resolved)) {
      return resolved;
    }

    if (resolved.kind === 'dir') {
      return makeError('EISDIR', abs);
    }

    if (!this.canRead(resolved)) {
      return makeError('EACCES', abs);
    }

    if (resolved.readDynamic) {
      return resolved.readDynamic();
    }

    if (resolved.content === undefined) {
      return makeError('EACCES', abs);
    }

    return resolved.content;
  }

  stat(path: string): VFSStat | FSError {
    const abs = this.toAbsolute(path);
    const resolved = this.resolve(abs);

    if (isFSError(resolved)) {
      return resolved;
    }

    return {
      ...resolved.stat,
      size: this.nodeSize(resolved),
      mtime: new Date(resolved.stat.mtime),
    };
  }

  mkdir(path: string, recursive = false): FSError | null {
    const abs = this.toAbsolute(path);

    if (abs === '/') {
      return makeError('EEXIST', abs);
    }

    if (!this.isWritablePath(abs)) {
      return makeError('EROFS', abs);
    }

    if (recursive) {
      return this.mkdirRecursive(abs);
    }

    const existing = this.resolve(abs);
    if (!isFSError(existing)) {
      return makeError('EEXIST', abs);
    }

    const parentAndName = this.getParentAndName(abs);
    if (isFSError(parentAndName)) {
      return parentAndName;
    }

    const { parent, name, parentPath } = parentAndName;
    if (!this.canCreate(parent)) {
      return makeError('EACCES', parentPath);
    }

    parent.children?.set(name, createNode('dir', name, 0o755, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      children: [],
    }));
    parent.stat.mtime = new Date();

    return null;
  }

  touch(path: string): FSError | null {
    const abs = this.toAbsolute(path);

    if (!this.isWritablePath(abs)) {
      return makeError('EROFS', abs);
    }

    const existing = this.resolve(abs);
    if (!isFSError(existing)) {
      if (existing.kind === 'dir') {
        return makeError('EISDIR', abs);
      }

      if (existing.stat.uid !== CURRENT_UID) {
        return makeError('EROFS', abs);
      }

      existing.stat.mtime = new Date();
      return null;
    }

    const parentAndName = this.getParentAndName(abs);
    if (isFSError(parentAndName)) {
      return parentAndName;
    }

    const { parent, name, parentPath } = parentAndName;
    if (!this.canCreate(parent)) {
      return makeError('EACCES', parentPath);
    }

    parent.children?.set(name, createNode('file', name, 0o644, {
      uid: CURRENT_UID,
      gid: CURRENT_GID,
      content: '',
    }));
    parent.stat.mtime = new Date();

    return null;
  }

  write(path: string, content: string, append = false): FSError | null {
    const abs = this.toAbsolute(path);

    if (!this.isWritablePath(abs)) {
      return makeError('EROFS', abs);
    }

    const existing = this.resolve(abs);
    if (isFSError(existing)) {
      const touchError = this.touch(abs);
      if (touchError) {
        return touchError;
      }
    }

    const target = this.resolve(abs);
    if (isFSError(target)) {
      return target;
    }

    if (target.kind === 'dir') {
      return makeError('EISDIR', abs);
    }

    if (target.stat.uid !== CURRENT_UID) {
      return makeError('EROFS', abs);
    }

    if (!this.canWrite(target)) {
      return makeError('EACCES', abs);
    }

    const baseContent = target.readDynamic ? target.readDynamic() : target.content ?? '';
    const nextContent = append ? `${baseContent}${content}` : content;

    target.content = nextContent;
    target.readDynamic = undefined;
    target.stat.size = nextContent.length;
    target.stat.mtime = new Date();

    return null;
  }

  rm(path: string, recursive = false, force = false): FSError | null {
    const abs = this.toAbsolute(path);

    if (abs === '/') {
      return makeError('EROFS', abs);
    }

    const resolved = this.resolve(abs);
    if (isFSError(resolved)) {
      return force && resolved.code === 'ENOENT' ? null : resolved;
    }

    if (!this.isWritablePath(abs) || resolved.stat.uid !== CURRENT_UID) {
      return makeError('EROFS', abs);
    }

    if (resolved.kind === 'dir' && !recursive) {
      return makeError('EISDIR', abs);
    }

    const parentAndName = this.getParentAndName(abs);
    if (isFSError(parentAndName)) {
      return parentAndName;
    }

    const { parent, name, parentPath } = parentAndName;
    if (!this.canCreate(parent)) {
      return makeError('EACCES', parentPath);
    }

    parent.children?.delete(name);
    parent.stat.mtime = new Date();
    return null;
  }

  private mkdirRecursive(abs: string): FSError | null {
    const parts = abs.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of parts) {
      currentPath = `${currentPath}/${part}`;
      const existing = this.resolve(currentPath);

      if (!isFSError(existing)) {
        if (existing.kind !== 'dir') {
          return makeError('ENOTDIR', currentPath);
        }
        continue;
      }

      const parentAndName = this.getParentAndName(currentPath);
      if (isFSError(parentAndName)) {
        return parentAndName;
      }

      const { parent, name, parentPath } = parentAndName;
      if (!this.canCreate(parent)) {
        return makeError('EACCES', parentPath);
      }

      parent.children?.set(name, createNode('dir', name, 0o755, {
        uid: CURRENT_UID,
        gid: CURRENT_GID,
        children: [],
      }));
      parent.stat.mtime = new Date();
    }

    return null;
  }

  private populateHomeFiles() {
    const home = this.resolveHomeDir();
    if (!home) {
      return;
    }

    for (const file of createHomeFiles()) {
      const existing = home.children?.get(file.name);

      if (existing && !isManagedHomeFile(file.name)) {
        continue;
      }

      if (existing && existing.readDynamic) {
        existing.readDynamic = file.readDynamic;
        existing.stat.size = this.nodeSize(existing);
        continue;
      }

      if (!existing) {
        home.children?.set(file.name, file);
      }
    }
  }

  private resolveHomeDir() {
    let current = this.root;

    for (const part of ['home', 'vrosk']) {
      const next = current.children?.get(part);
      if (!next || next.kind !== 'dir') {
        return null;
      }
      current = next;
    }

    return current;
  }

  private nodeSize(node: VFSNode) {
    if (node.kind === 'dir') {
      return 4096;
    }

    if (node.readDynamic) {
      return node.readDynamic().length;
    }

    return node.content?.length ?? node.stat.size;
  }

  private toAbsolute(path: string) {
    const trimmed = path.trim();
    if (trimmed.length === 0) {
      return this.cwd;
    }

    if (trimmed === '~') {
      return HOME;
    }

    if (trimmed.startsWith('~/')) {
      return this.normalizePath(`${HOME}/${trimmed.slice(2)}`);
    }

    if (trimmed.startsWith('/')) {
      return this.normalizePath(trimmed);
    }

    return this.normalizePath(`${this.cwd}/${trimmed}`);
  }

  private normalizePath(path: string) {
    const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/');
    const parts = normalized.split('/');
    const stack: string[] = [];

    for (const part of parts) {
      if (!part || part === '.') {
        continue;
      }

      if (part === '..') {
        stack.pop();
        continue;
      }

      stack.push(part);
    }

    return stack.length === 0 ? '/' : `/${stack.join('/')}`;
  }

  private selectBits(node: VFSNode) {
    if (node.stat.uid === CURRENT_UID) {
      return (node.stat.mode >> 6) & 0o7;
    }

    if (node.stat.gid === CURRENT_GID) {
      return (node.stat.mode >> 3) & 0o7;
    }

    return node.stat.mode & 0o7;
  }

  private canRead(node: VFSNode) {
    return (this.selectBits(node) & 0o4) !== 0;
  }

  private canWrite(node: VFSNode) {
    return (this.selectBits(node) & 0o2) !== 0;
  }

  private canExecute(node: VFSNode) {
    return (this.selectBits(node) & 0o1) !== 0;
  }

  private canTraverse(node: VFSNode) {
    return this.canExecute(node);
  }

  private canList(node: VFSNode) {
    return this.canRead(node);
  }

  private canCreate(node: VFSNode) {
    return this.canWrite(node) && this.canExecute(node);
  }

  private isWritablePath(abs: string) {
    return abs === HOME
      || abs.startsWith(`${HOME}/`)
      || abs === '/tmp'
      || abs.startsWith('/tmp/');
  }

  private getParentAndName(abs: string):
    | { parent: VFSNode; name: string; parentPath: string }
    | FSError {
    const parts = abs.split('/').filter(Boolean);
    const name = parts.pop();

    if (!name) {
      return makeError('ENOENT', abs);
    }

    const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    const parent = this.resolve(parentPath);

    if (isFSError(parent)) {
      return parent;
    }

    if (parent.kind !== 'dir') {
      return makeError('ENOTDIR', parentPath);
    }

    return { parent, name, parentPath };
  }
}
