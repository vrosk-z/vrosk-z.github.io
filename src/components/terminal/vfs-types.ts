export type VFSNodeKind = 'file' | 'dir' | 'symlink';

export interface VFSStat {
  mode: number;
  uid: number;
  gid: number;
  size: number;
  mtime: Date;
}

export interface VFSNode {
  kind: VFSNodeKind;
  name: string;
  stat: VFSStat;
  content?: string;
  children?: Map<string, VFSNode>;
  readDynamic?: () => string;
}

export type FSErrorCode =
  | 'ENOENT'
  | 'EACCES'
  | 'ENOTDIR'
  | 'EISDIR'
  | 'EEXIST'
  | 'EROFS'
  | 'ENOTEMPTY';

export interface FSError {
  code: FSErrorCode;
  path: string;
}

export function isFSError(x: unknown): x is FSError {
  return typeof x === 'object' && x !== null && 'code' in x && 'path' in x;
}

export function fmtError(cmd: string, err: FSError): string {
  const msgs: Record<FSErrorCode, string> = {
    ENOENT: `${cmd}: cannot access '${err.path}': No such file or directory`,
    EACCES: `${cmd}: cannot open '${err.path}': Permission denied`,
    ENOTDIR: `${cmd}: '${err.path}': Not a directory`,
    EISDIR: `${cmd}: '${err.path}': Is a directory`,
    EEXIST: `${cmd}: cannot create '${err.path}': File exists`,
    EROFS: `${cmd}: cannot remove '${err.path}': Read-only file system`,
    ENOTEMPTY: `${cmd}: failed to remove '${err.path}': Directory not empty`,
  };

  return msgs[err.code];
}

export interface RichSpan {
  text: string;
  cls?: 'dir' | 'exec' | 'hidden' | 'error' | 'highlight' | 'muted';
}

export type RichLine = RichSpan[];
export type RichOutput = RichLine[];

export function plainLine(text: string): RichOutput {
  return [[{ text }]];
}

export function plainText(text: string): RichOutput {
  return text.split('\n').map((line) => [{ text: line }]);
}
