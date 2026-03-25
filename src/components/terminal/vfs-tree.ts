import type { VFSNode } from './vfs-types';

export const HOME = '/home/vrosk';
export const CURRENT_UID = 1000;
export const CURRENT_GID = 1000;

function getPerformanceNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

const PAGE_LOAD_TIME = getPerformanceNow();

function getSize(opts?: { content?: string; children?: VFSNode[]; readDynamic?: () => string }) {
  if (opts?.children) {
    return 4096;
  }

  if (opts?.content !== undefined) {
    return opts.content.length;
  }

  if (opts?.readDynamic) {
    return opts.readDynamic().length;
  }

  return 0;
}

function toChildrenMap(children?: VFSNode[]) {
  if (!children) {
    return undefined;
  }

  return new Map(children.map((child) => [child.name, child]));
}

function n(
  kind: 'file' | 'dir',
  name: string,
  mode: number,
  opts?: {
    uid?: number;
    gid?: number;
    content?: string;
    readDynamic?: () => string;
    children?: VFSNode[];
  },
): VFSNode {
  return {
    kind,
    name,
    stat: {
      mode,
      uid: opts?.uid ?? 0,
      gid: opts?.gid ?? 0,
      size: getSize(opts),
      mtime: new Date(),
    },
    content: opts?.content,
    readDynamic: opts?.readDynamic,
    children: toChildrenMap(opts?.children),
  };
}

function opaque(name: string, mode = 0o755): VFSNode {
  return n('dir', name, mode, { uid: 0, gid: 0, children: [] });
}

export const STATIC_TREE: VFSNode = n('dir', '', 0o755, {
  children: [
    opaque('bin'),
    opaque('boot', 0o750),
    n('dir', 'dev', 0o755, {
      children: [
        n('file', 'null', 0o666, { content: '' }),
        n('file', 'random', 0o444, {
          readDynamic: () => Math.random().toString(36).slice(2),
        }),
      ],
    }),
    n('dir', 'etc', 0o755, {
      children: [
        n('file', 'hostname', 0o644, { content: 'vrosk-z.github.io' }),
        n('file', 'issue', 0o644, { content: 'vroskOS 1.0.0 \\n \\l' }),
        n('file', 'passwd', 0o644, {
          content: 'root:x:0:0:root:/root:/bin/bash\nvrosk:x:1000:1000:vrosk:/home/vrosk:/bin/bash',
        }),
        n('file', 'os-release', 0o644, {
          content: 'NAME="vroskOS"\nVERSION="1.0.0"\nID=vros\nPRETTY_NAME="vroskOS 1.0.0"',
        }),
      ],
    }),
    n('dir', 'home', 0o755, {
      children: [
        n('dir', 'vrosk', 0o755, {
          uid: CURRENT_UID,
          gid: CURRENT_GID,
          children: [],
        }),
      ],
    }),
    n('dir', 'proc', 0o555, {
      children: [
        n('file', 'version', 0o444, {
          readDynamic: () => 'Linux version vroskOS 1.0.0 (vrosk@web)',
        }),
        n('file', 'uptime', 0o444, {
          readDynamic: () => {
            const seconds = Math.floor((getPerformanceNow() - PAGE_LOAD_TIME) / 1000);
            return `${seconds}.00 ${Math.floor(seconds * 0.9)}.00`;
          },
        }),
        n('file', 'meminfo', 0o444, {
          readDynamic: () => 'MemTotal:  8192000 kB\nMemFree:   4096000 kB\nMemAvailable: 4096000 kB',
        }),
        n('dir', 'self', 0o555, {
          children: [
            n('file', 'status', 0o444, {
              readDynamic: () => 'Name:\tportfolio\nPid:\t1\nUid:\t1000 1000 1000 1000',
            }),
          ],
        }),
      ],
    }),
    n('dir', 'tmp', 0o1777, { children: [] }),
    opaque('usr'),
    opaque('var'),
    opaque('lib'),
    opaque('sbin'),
    opaque('sys', 0o555),
    opaque('run'),
  ],
});

export function createNode(
  kind: 'file' | 'dir',
  name: string,
  mode: number,
  opts?: {
    uid?: number;
    gid?: number;
    content?: string;
    readDynamic?: () => string;
    children?: VFSNode[];
  },
) {
  return n(kind, name, mode, opts);
}
