import { emptyResult, fsErrorResult, registerCommand, stderrResult } from '../executor';
import { hasFlag } from '../parser';

registerCommand('rm', (cmd, ctx) => {
  const target = cmd.args[0];
  if (!target) {
    return stderrResult('rm: missing operand');
  }

  const error = ctx.vfs.rm(target, hasFlag(cmd, 'r'), hasFlag(cmd, 'f'));
  return error ? fsErrorResult('rm', error) : emptyResult();
});
