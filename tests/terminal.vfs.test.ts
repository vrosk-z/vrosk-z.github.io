import { beforeEach, describe, expect, it } from 'vitest';
import { VirtualFS } from '../src/components/terminal/vfs';

describe('VirtualFS', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
  });

  it('starts in the home directory', () => {
    const vfs = new VirtualFS();

    expect(vfs.pwd()).toBe('/home/vrosk');
  });

  it('changes directory to root', () => {
    const vfs = new VirtualFS();

    expect(vfs.cd('/')).toBeNull();
    expect(vfs.pwd()).toBe('/');
  });

  it('returns EACCES for /boot', () => {
    const vfs = new VirtualFS();
    const result = vfs.cd('/boot');

    expect(result).toEqual({ code: 'EACCES', path: '/boot' });
  });

  it('returns ENOENT for missing directories', () => {
    const vfs = new VirtualFS();
    const result = vfs.cd('/nonexistent');

    expect(result).toEqual({ code: 'ENOENT', path: '/nonexistent' });
  });

  it('reads /etc/hostname', () => {
    const vfs = new VirtualFS();

    expect(vfs.cat('/etc/hostname')).toBe('vrosk.github.io');
  });

  it('returns ENOENT for missing opaque system files', () => {
    const vfs = new VirtualFS();

    expect(vfs.cat('/bin/ls')).toEqual({ code: 'ENOENT', path: '/bin/ls' });
  });

  it('supports mkdir, touch, write, cat and rm in home', () => {
    const vfs = new VirtualFS();

    expect(vfs.mkdir('/home/vrosk/mydir')).toBeNull();
    expect(vfs.touch('/home/vrosk/mydir/test.txt')).toBeNull();
    expect(vfs.cat('/home/vrosk/mydir/test.txt')).toBe('');
    expect(vfs.write('/home/vrosk/mydir/test.txt', 'hello')).toBeNull();
    expect(vfs.cat('/home/vrosk/mydir/test.txt')).toBe('hello');
    expect(vfs.rm('/home/vrosk/mydir/test.txt')).toBeNull();
  });

  it('returns EROFS for system file removal', () => {
    const vfs = new VirtualFS();

    expect(vfs.rm('/etc/hostname')).toEqual({ code: 'EROFS', path: '/etc/hostname' });
  });

  it('lists top-level directories', () => {
    const vfs = new VirtualFS();
    const listed = vfs.ls('/', false);

    expect(Array.isArray(listed)).toBe(true);
    expect(Array.isArray(listed) && listed.map((node) => node.name)).toContain('home');
    expect(Array.isArray(listed) && listed.map((node) => node.name)).toContain('etc');
  });

  it('shows hidden files in home', () => {
    const vfs = new VirtualFS();
    const listed = vfs.ls('/home/vrosk', true);

    expect(Array.isArray(listed) && listed.map((node) => node.name)).toContain('.secret');
  });
});
