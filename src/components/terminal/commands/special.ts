import { getContent, getLanguage } from '../../../lib/lang';
import { emptyResult, registerCommand, stderrResult, textResult } from '../executor';
import { canTraverse, isExecutableNode } from './utils';

function buildNeofetch() {
  const content = getContent();
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

  const width = 14;
  return Array.from({ length: Math.max(art.length, info.length) }, (_, index) => {
    const artLine = (art[index] ?? '').padEnd(width, ' ');
    return `${artLine}${info[index] ?? ''}`;
  }).join('\n');
}

function shortcut(path: string) {
  return (_cmd: unknown, ctx: { vfs: { cat: (path: string) => string | { code: string } } }) => {
    const file = ctx.vfs.cat(path);
    return typeof file === 'string'
      ? textResult(file)
      : stderrResult(`cat: cannot access '${path}': No such file or directory`);
  };
}

for (const command of ['neofetch', 'fastfetch', 'screenfetch', 'fetch']) {
  registerCommand(command, () => textResult(buildNeofetch()));
}

registerCommand('about', shortcut('about.txt'));
registerCommand('skills', shortcut('skills.txt'));
registerCommand('contact', shortcut('contact.txt'));
registerCommand('projects', () => textResult(getContent().terminal.messages.projectsEmpty));

registerCommand('matrix', (cmd) => {
  if (cmd.args[0] === 'on') {
    return textResult(getContent().terminal.messages.matrixOn, 'matrix-on');
  }

  if (cmd.args[0] === 'off') {
    return textResult(getContent().terminal.messages.matrixOff, 'matrix-off');
  }

  return textResult(getContent().terminal.invalidMatrix);
});

registerCommand('lang', (cmd) => {
  if (cmd.args[0] === 'en') {
    return textResult(getContent().terminal.messages.langEn, 'lang-en');
  }

  if (cmd.args[0] === 'ru') {
    return textResult(getContent().terminal.messages.langRu, 'lang-ru');
  }

  return textResult(getContent().terminal.invalidLang);
});

registerCommand('hack', () => textResult(getContent().terminal.messages.hack));
registerCommand('exit', () => textResult(getContent().terminal.messages.exit));
registerCommand('quit', () => textResult(getContent().terminal.messages.exit));
registerCommand('logout', () => textResult(getContent().terminal.messages.exit));

registerCommand('sudo', (cmd) => {
  const raw = cmd.rawArgv.join(' ');

  if (raw.length === 0) {
    return textResult(getContent().terminal.system.sudoUsage);
  }

  if (/^rm\s+-rf\s+(\/|\.\/|\.)$/.test(raw)) {
    return emptyResult('destroy');
  }

  const subcommand = cmd.args[0] ?? raw;
  const sys = getContent().terminal.system;
  return textResult(
    `[sudo] password for vrosk:\n${sys.sudoers.replace('{cmd}', subcommand)}`,
  );
});

registerCommand('./', (cmd, ctx) => {
  const target = ctx.vfs.resolve(cmd.name);

  if ('code' in target) {
    return stderrResult(`bash: ${cmd.name}: No such file or directory`);
  }

  if (target.kind === 'dir') {
    return stderrResult(`bash: ${cmd.name}: Is a directory`);
  }

  if (!isExecutableNode(target) || !canTraverse(target)) {
    return stderrResult(`bash: ${cmd.name}: Permission denied`);
  }

  const content = ctx.vfs.cat(cmd.name);
  return typeof content === 'string'
    ? textResult(content)
    : stderrResult(`bash: ${cmd.name}: No such file or directory`);
});
