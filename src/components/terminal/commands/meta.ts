import { getContent } from '../../../lib/lang';
import { emptyResult, registerCommand, textResult } from '../executor';
import { hasFlag } from '../parser';

const HELP_LINES = [
  'help               show command list',
  'whoami             print current user',
  'pwd                print working directory',
  'ls [-la] [path]    list files',
  'cat [-n] <file>    print file contents',
  'grep PATTERN FILE  search text',
  'find [path] ...    find files',
  'head/tail          slice text',
  'wc [-lwc] [file]   count text',
  'mkdir/touch/rm     mutate writable sandbox',
  './<binary>         execute virtual binary',
  'neofetch           show system summary',
  'about/skills/contact',
  'matrix on|off      toggle matrix rain',
  'lang en|ru         switch language',
  'clear              wipe terminal history',
  'sudo rm -rf /      trigger site destruction',
];

const PAGE_LOAD_TIME = Date.now();

function formatUptime() {
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

registerCommand('help', () => textResult([getContent().terminal.helpTitle, ...HELP_LINES].join('\n')));
registerCommand('whoami', () => textResult('vrosk'));
registerCommand('pwd', (_, ctx) => textResult(ctx.vfs.pwd()));
registerCommand('clear', () => emptyResult('clear'));
registerCommand('history', () => emptyResult('history'));
registerCommand('date', () => textResult(new Date().toString()));
registerCommand('uptime', () => textResult(formatUptime()));
registerCommand('uname', (cmd) => textResult(hasFlag(cmd, 'a') ? 'vroskOS 1.0.0 x86_64 GNU/Linux' : 'vroskOS'));
registerCommand('hostname', () => textResult('vrosk.github.io'));
registerCommand('id', () => textResult('uid=1000(vrosk) gid=1000(dev) groups=1000(dev),27(sudo)'));
