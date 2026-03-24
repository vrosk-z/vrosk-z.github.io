import dictEn from '../content/en.json';
import dictRu from '../content/ru.json';
import { fs } from './VirtualFS';

export type TerminalAction =
  | 'clear'
  | 'destroy'
  | 'history'
  | 'matrix-on'
  | 'matrix-off'
  | 'lang-en'
  | 'lang-ru';

export interface CommandResult {
  output: string;
  action?: TerminalAction;
}

type Language = 'en' | 'ru';
type Content = typeof dictEn;

const PAGE_LOAD_TIME = Date.now();

function getLanguage(): Language {
  if (typeof document === 'undefined') {
    return 'en';
  }

  return document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function getContent(): Content {
  return getLanguage() === 'ru' ? dictRu : dictEn;
}

function formatUptime(): string {
  const ms = Date.now() - PAGE_LOAD_TIME;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `up ${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }

  if (minutes > 0) {
    return `up ${minutes}m ${seconds % 60}s`;
  }

  return `up ${seconds}s`;
}

function buildNeofetch(content: Content) {
  const art = [
    '██      ██',
    ' ██    ██ ',
    '  ██  ██  ',
    '   ████   ',
    '    ██    ',
  ];

  const info = [
    `${content.terminal.neofetch.aliasLabel}: ${content.hero.name}`,
    `${content.terminal.neofetch.ageLabel}: ${content.terminal.neofetch.ageValue}`,
    `${content.terminal.neofetch.focusLabel}: ${content.terminal.neofetch.focusValue}`,
    `${content.terminal.neofetch.stackLabel}: ${content.terminal.neofetch.stackValue}`,
    `${content.terminal.neofetch.contactLabel}: ${content.contact.telegram}`,
    `${content.terminal.neofetch.langLabel}: ${getLanguage().toUpperCase()}`,
  ];

  const artWidth = 14;
  const maxLines = Math.max(art.length, info.length);
  const lines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const artLine = (art[i] ?? '').padEnd(artWidth);
    const infoLine = info[i] ?? '';
    lines.push(`${artLine}${infoLine}`);
  }

  return lines.join('\n');
}

// Aliases: map alias → canonical command
const ALIASES: Record<string, string> = {
  cls: 'clear',
  dir: 'ls',
  type: 'cat',
  ll: 'ls -a',
};

export function executeCommand(input: string): CommandResult {
  const content = getContent();
  let normalized = input.trim().replace(/\s+/g, ' ');

  if (normalized.length === 0) {
    return { output: '' };
  }

  // Resolve aliases
  const aliasKey = normalized.split(' ')[0];
  if (aliasKey && ALIASES[aliasKey]) {
    normalized = normalized.replace(aliasKey, ALIASES[aliasKey]);
  }

  if (/^sudo rm -rf \/$/.test(normalized)) {
    return { output: '', action: 'destroy' };
  }

  // sudo anything else
  if (normalized.startsWith('sudo ')) {
    return { output: 'vrosk is not in the sudoers file. This incident will be reported.' };
  }

  const [command, ...args] = normalized.split(' ');

  switch (command) {
    case 'help':
      return {
        output: [content.terminal.helpTitle, ...content.terminal.helpLines].join('\n'),
      };
    case 'whoami':
      return { output: content.hero.name };
    case 'pwd':
      return { output: fs.pwd() };
    case 'ls': {
      const lsArg = args[0] ?? '';
      const showAll =
        lsArg === '-a' || lsArg === '-la' || lsArg === '-al' || lsArg === '-l' || lsArg === '-ll';

      if (showAll) {
        return { output: fs.lsAll().join('\n') };
      }

      return { output: fs.ls().join('\n') };
    }
    case 'cat':
      if (!args[0]) {
        return { output: content.terminal.missingCatOperand };
      }

      return { output: fs.cat(args[0]) };
    case 'cd':
      if (!args[0]) {
        return { output: content.terminal.missingCdOperand };
      }

      return { output: fs.cd(args[0]) ?? fs.pwd() };
    case 'neofetch':
    case 'fastfetch':
    case 'screenfetch':
    case 'fetch':
      return { output: buildNeofetch(content) };
    case 'about':
      return { output: fs.cat('about.txt') };
    case 'skills':
      return { output: fs.cat('skills.txt') };
    case 'projects':
      return { output: content.terminal.messages.projectsEmpty };
    case 'contact':
      return { output: fs.cat('contact.txt') };
    case 'matrix':
      if (args[0] === 'on') {
        return { output: content.terminal.messages.matrixOn, action: 'matrix-on' };
      }

      if (args[0] === 'off') {
        return { output: content.terminal.messages.matrixOff, action: 'matrix-off' };
      }

      return { output: content.terminal.invalidMatrix };
    case 'lang':
      if (args[0] === 'en') {
        return { output: content.terminal.messages.langEn, action: 'lang-en' };
      }

      if (args[0] === 'ru') {
        return { output: content.terminal.messages.langRu, action: 'lang-ru' };
      }

      return { output: content.terminal.invalidLang };
    case 'clear':
      return { output: '', action: 'clear' };
    case 'history':
      return { output: '', action: 'history' };

    // --- new commands ---
    case 'echo':
      return { output: args.join(' ') };
    case 'date':
      return { output: new Date().toString() };
    case 'uptime':
      return { output: formatUptime() };
    case 'uname':
      if (args[0] === '-a') {
        return { output: 'vroskOS 1.0.0 x86_64 GNU/Linux' };
      }

      return { output: 'vroskOS' };
    case 'hostname':
      return { output: 'vrosk.github.io' };
    case 'id':
      return { output: 'uid=16(vrosk) gid=1000(dev) groups=1000(dev),27(sudo)' };
    case 'rm':
      return { output: 'rm: cannot remove: read-only file system' };
    case 'touch':
      return { output: 'touch: cannot touch: read-only file system' };
    case 'mkdir':
      return { output: 'mkdir: cannot create directory: read-only file system' };
    case 'chmod':
    case 'chown':
      return { output: `${command}: operation not permitted` };
    case 'curl':
    case 'wget':
      return { output: 'network disabled in sandbox.' };
    case 'ping':
      return { output: 'ping: network disabled in sandbox.' };
    case 'ssh':
      return { output: 'ssh: connect to host vrosk.github.io port 22: Connection refused' };
    case 'man':
      if (!args[0]) {
        return { output: 'What manual page do you want?\nFor example, try \'man help\'.' };
      }

      return { output: `No manual entry for ${args[0]}. Try 'help'.` };
    case 'vim':
    case 'vi':
    case 'nano':
    case 'emacs':
      return { output: `${command}: not installed. try Zed.` };
    case 'code':
      return { output: 'code: not installed. try Zed.' };

    case 'npm':
    case 'yarn':
    case 'pnpm':
    case 'bun':
      return { output: `${command}: not available in this environment.` };
    case 'git': {
      const gitSub = args[0] ?? '';

      if (gitSub === 'status') {
        return { output: 'nothing to commit, working tree clean' };
      }

      if (gitSub === 'log') {
        return { output: 'commit abc1234 (HEAD -> main)\nAuthor: vrosk\nDate: today\n\n    initial commit' };
      }

      if (gitSub === 'push') {
        return { output: 'Everything up-to-date' };
      }

      if (gitSub === 'pull') {
        return { output: 'Already up to date.' };
      }

      if (gitSub === 'blame') {
        return { output: 'blame yourself.' };
      }

      return { output: 'nothing to commit, working tree clean' };
    }
    case 'python':
    case 'python3':
    case 'node':
      return { output: `${command}: interactive mode not available in sandbox.` };
    case 'top':
    case 'htop':
    case 'btop':
      return { output: 'PID  USER   CPU%  MEM%  COMMAND\n1    vrosk  4.2   12.0  portfolio\n2    vrosk  0.1   0.4   matrix-rain' };
    case 'kill':
    case 'killall':
      return { output: 'kill: no process found' };
    case 'shutdown':
    case 'reboot':
    case 'poweroff':
      return { output: 'System halted.\n\n...just kidding.' };
    case 'passwd':
      return { output: 'passwd: authentication token manipulation error' };
    case 'su':
      return { output: 'su: authentication failure' };
    case 'apt':
    case 'apt-get':
    case 'pacman':
    case 'dnf':
    case 'yum':
    case 'brew':
      return { output: `${command}: package manager not available in sandbox.` };
    case 'whoamireally':
      return { output: 'just a bunch of pixels on a screen.' };

    // --- easter eggs ---
    case 'hack':
      return { output: content.terminal.messages.hack };
    case 'exit':
    case 'quit':
    case 'logout':
      return { output: content.terminal.messages.exit };

    default:
      if (command.startsWith('./')) {
        return { output: fs.exec(command) };
      }

      return {
        output: content.terminal.commandNotFound.replace('{cmd}', command),
      };
  }
}
