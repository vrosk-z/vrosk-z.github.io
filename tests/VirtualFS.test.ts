import { beforeEach, describe, expect, it } from 'vitest';
import { VirtualFS } from '../src/components/VirtualFS';

describe('VirtualFS', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
  });

  it('lists the visible root directory files', () => {
    const virtualFs = new VirtualFS();

    expect(virtualFs.ls('/home/vrosk')).toEqual([
      'about.txt',
      'skills.txt',
      'contact.txt',
      'what-is-this.bin',
    ]);
  });

  it('lists hidden files with lsAll', () => {
    const virtualFs = new VirtualFS();

    expect(virtualFs.lsAll('/home/vrosk')).toContain('.secret');
  });

  it('reads file contents', () => {
    const virtualFs = new VirtualFS();

    expect(virtualFs.cat('/home/vrosk/about.txt')).toContain('Backend dev');
  });

  it('returns an error for missing files', () => {
    const virtualFs = new VirtualFS();

    expect(virtualFs.cat('missing.txt')).toBe('cat: missing.txt: No such file or directory');
  });

  it('denies climbing above the home directory', () => {
    const virtualFs = new VirtualFS();

    expect(virtualFs.cd('..')).toBe('bash: cd: ..: Permission denied');
  });

  it('executes the fake binary', () => {
    const virtualFs = new VirtualFS();

    expect(virtualFs.exec('./what-is-this.bin')).toContain('pattern recognition');
  });
});
