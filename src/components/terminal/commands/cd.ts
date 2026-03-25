import { registerCommand, emptyResult, stderrResult } from '../executor';

registerCommand('cd', (cmd, ctx) => {
  const target = cmd.args[0] ?? '~';
  const error = ctx.vfs.cd(target);

  if (!error) {
    return emptyResult();
  }

  if (error.code === 'ENOENT') {
    return stderrResult(`bash: cd: ${target}: No such file or directory`);
  }

  if (error.code === 'EACCES') {
    return stderrResult(`bash: cd: ${target}: Permission denied`);
  }

  if (error.code === 'ENOTDIR') {
    return stderrResult(`bash: cd: ${target}: Not a directory`);
  }

  return stderrResult(`bash: cd: ${target}: ${error.code}`);
});
