import { fsErrorResult, registerCommand, stderrResult } from '../executor';
import { hasFlag } from '../parser';

registerCommand('mkdir', (cmd, ctx) => {
  const target = cmd.args[0];
  if (!target) {
    return stderrResult('mkdir: missing operand');
  }

  const error = ctx.vfs.mkdir(target, hasFlag(cmd, 'p'));
  return error ? fsErrorResult('mkdir', error) : { output: [], stdout: '', stderr: '', exitCode: 0 };
});
