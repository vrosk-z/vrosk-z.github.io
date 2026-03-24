import dictEn from '../content/en.json';
import dictRu from '../content/ru.json';

export interface FileItem {
  name: string;
  type: 'file' | 'dir' | 'bin';
  content?: string;
  hidden?: boolean;
}

const ROOT_PATH = '/home/vrosk';
const LEVEL_BARS: Record<string, string> = {
  primary: '[################--]',
  learning: '[########----------]',
  comfortable: '[##############----]',
  daily: '[##################]',
};

type Content = typeof dictEn;
type Language = 'en' | 'ru';

function getLanguage(): Language {
  if (typeof document === 'undefined') {
    return 'en';
  }

  return document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function getContent(): Content {
  return getLanguage() === 'ru' ? dictRu : dictEn;
}

function normalizePath(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function renderSkillsFile(content: Content) {
  return content.skills.items
    .map(
      (skill) =>
        `${skill.name.padEnd(24, ' ')} ${LEVEL_BARS[skill.level] ?? '[##########--------]'} ${skill.label}`,
    )
    .join('\n');
}

function createFiles(content: Content): FileItem[] {
  return [
    {
      name: 'about.txt',
      type: 'file',
      content: content.about.text,
    },
    {
      name: 'skills.txt',
      type: 'file',
      content: renderSkillsFile(content),
    },
    {
      name: 'contact.txt',
      type: 'file',
      content: `${content.contact.text}\n${content.contact.telegram}\n${content.contact.url}`,
    },
    {
      name: 'what-is-this.bin',
      type: 'bin',
      content: content.terminal.files.binary,
    },
    {
      name: '.secret',
      type: 'file',
      hidden: true,
      content: content.terminal.files.secret,
    },
  ];
}

export class VirtualFS {
  private cwd = ROOT_PATH;

  pwd() {
    return this.cwd;
  }

  cd(path: string) {
    const target = path.trim();

    if (target.length === 0) {
      return getContent().terminal.missingCdOperand;
    }

    if (target === '.' || target === ROOT_PATH || target === '/home/vrosk') {
      this.cwd = ROOT_PATH;
      return null;
    }

    if (target === '..') {
      return getContent().terminal.permissionDenied;
    }

    return getContent().terminal.noSuchDirectory.replace('{path}', target);
  }

  ls(path?: string) {
    if (path && !this.isRoot(path)) {
      return [];
    }

    return createFiles(getContent())
      .filter((item) => !item.hidden)
      .map((item) => item.name);
  }

  lsAll(path?: string) {
    if (path && !this.isRoot(path)) {
      return [];
    }

    return createFiles(getContent()).map((item) => item.name);
  }

  cat(path: string) {
    const target = this.resolvePath(path);
    const file = createFiles(getContent()).find((candidate) => `${ROOT_PATH}/${candidate.name}` === target);

    if (!file?.content || file.type === 'dir') {
      return getContent().terminal.noSuchFile.replace('{path}', path);
    }

    return file.content;
  }

  exec(path: string) {
    const target = this.resolvePath(path);
    const file = createFiles(getContent()).find((candidate) => `${ROOT_PATH}/${candidate.name}` === target);

    if (!file || file.type !== 'bin' || !file.content) {
      return getContent().terminal.noSuchBinary.replace('{path}', path);
    }

    return file.content;
  }

  private isRoot(path: string) {
    return ['.', ROOT_PATH, '/home/vrosk'].includes(normalizePath(path));
  }

  private resolvePath(path: string) {
    const trimmed = path.trim();

    if (trimmed.startsWith('/')) {
      return normalizePath(trimmed);
    }

    if (trimmed.startsWith('./')) {
      return normalizePath(`${this.cwd}/${trimmed.slice(2)}`);
    }

    return normalizePath(`${this.cwd}/${trimmed}`);
  }
}

export const fs = new VirtualFS();
