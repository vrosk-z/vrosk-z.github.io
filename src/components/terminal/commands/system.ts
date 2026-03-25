import { getContent } from '../../../lib/lang';
import { registerCommand, stderrResult, textResult } from '../executor';

const editors = ['vim', 'vi', 'nvim', 'neovim', 'nano', 'emacs', 'code'];
const runtimes = ['python', 'python3', 'node'];
const packageManagers = ['apt', 'apt-get', 'pacman', 'dnf', 'yum', 'brew'];
const bundlers = ['npm', 'yarn', 'pnpm', 'bun'];
const monitors = ['top', 'htop', 'btop'];
const killers = ['kill', 'killall'];
const power = ['shutdown', 'reboot', 'poweroff'];

for (const command of ['curl', 'wget']) {
  registerCommand(command, () => textResult(getContent().terminal.system.networkDisabled));
}

registerCommand('ping', () => textResult(getContent().terminal.system.pingDisabled));
registerCommand('ssh', () => textResult(getContent().terminal.system.sshRefused));
registerCommand('man', (cmd) => cmd.args[0]
  ? textResult(getContent().terminal.system.manNotFound.replace('{cmd}', cmd.args[0]))
  : textResult(getContent().terminal.system.manEmpty));

for (const command of editors) {
  registerCommand(command, () => textResult(getContent().terminal.system.editorNotFound.replace('{cmd}', command)));
}

for (const command of bundlers) {
  registerCommand(command, () => textResult(getContent().terminal.system.cmdNotAvailable.replace('{cmd}', command)));
}

for (const command of runtimes) {
  registerCommand(command, () => textResult(getContent().terminal.system.interactiveMode.replace('{cmd}', command)));
}

registerCommand('git', (cmd) => {
  const sub = cmd.args[0] ?? '';
  const sys = getContent().terminal.system;
  if (sub === 'log') return textResult(sys.gitLog);
  if (sub === 'push') return textResult(sys.gitPush);
  if (sub === 'pull') return textResult(sys.gitPull);
  if (sub === 'blame') return textResult(sys.gitBlame);
  return textResult(sys.gitStatus);
});

for (const command of monitors) {
  registerCommand(command, () => textResult(getContent().terminal.system.top));
}

for (const command of killers) {
  registerCommand(command, () => textResult(getContent().terminal.system.killNotFound));
}

for (const command of power) {
  registerCommand(command, () => textResult(getContent().terminal.system.shutdown));
}

registerCommand('chmod', (cmd) => textResult(getContent().terminal.system.operationNotPermitted.replace('{cmd}', cmd.name)));
registerCommand('chown', (cmd) => textResult(getContent().terminal.system.operationNotPermitted.replace('{cmd}', cmd.name)));
registerCommand('passwd', () => textResult(getContent().terminal.system.passwd));
registerCommand('su', () => textResult(getContent().terminal.system.su));
registerCommand('whoamireally', () => textResult(getContent().terminal.system.whoamiReally));

for (const command of packageManagers) {
  registerCommand(command, () => textResult(getContent().terminal.system.pkgManager.replace('{cmd}', command)));
}

registerCommand('hostnamectl', () => stderrResult('hostnamectl: not available in sandbox'));
