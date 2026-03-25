import { hasFlag } from '../parser';
import { plainText } from '../vfs-types';
import { registerCommand, richOutputToText } from '../executor';

registerCommand('echo', (cmd) => {
  const text = cmd.args.join(' ');
  const output = plainText(text);
  const stdout = hasFlag(cmd, 'n') ? richOutputToText(output) : `${richOutputToText(output)}\n`;

  return {
    output,
    stdout,
    stderr: '',
    exitCode: 0,
  };
});
