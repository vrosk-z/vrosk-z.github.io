import { emptyResult, fsErrorResult, registerCommand, stderrResult } from '../executor';

registerCommand('touch', (cmd, ctx) => {
  const target = cmd.args[0];
  if (!target) {
    return stderrResult('touch: missing file operand');
  }

  const error = ctx.vfs.touch(target);
  return error ? fsErrorResult('touch', error) : emptyResult();
});
