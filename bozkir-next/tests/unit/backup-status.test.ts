import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getBackupStatus } from '@/lib/backup-status';

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'bozkir-backup-'));
  // Gerçek backups/ klasörünün(test ortamındaki cwd) sonuçları etkilememesi için.
  vi.stubEnv('BACKUP_DIR', root);
  vi.stubEnv('BACKUP_STATUS_FILE', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

function stampDir(name: string, files: Record<string, number> = {}) {
  const dir = path.join(root, name);
  mkdirSync(dir);
  for (const [file, bytes] of Object.entries(files)) {
    writeFileSync(path.join(dir, file), Buffer.alloc(bytes));
  }
}

describe('getBackupStatus — klasör taraması', () => {
  it('en yeni geçerli stamp klasörünü okur', () => {
    stampDir('2026-11-17_0300', { 'db.sql': 10 });
    stampDir('2026-11-19_0300', { 'db.sql': 20, 'storage.tar.gz': 30 });

    expect(getBackupStatus()).toEqual({
      available: true,
      stamp: '2026-11-19_0300',
      createdAt: '19.11.2026 03:00',
      totalBytes: 50,
      fileCount: 2,
    });
  });

  it('geçerli stamp klasörü yoksa kullanılamaz döner', () => {
    stampDir('not-a-stamp', { 'db.sql': 10 });
    expect(getBackupStatus()).toEqual({ available: false });
  });
});

describe('getBackupStatus — BACKUP_STATUS_FILE', () => {
  it('JSON durum dosyasındaki değerleri kullanır', () => {
    const file = path.join(root, 'status.json');
    writeFileSync(
      file,
      JSON.stringify({
        ok: true,
        stamp: '2026-11-19_0400',
        totalBytes: 4096,
        fileCount: 4,
      }),
    );
    vi.stubEnv('BACKUP_STATUS_FILE', file);

    expect(getBackupStatus()).toEqual({
      available: true,
      stamp: '2026-11-19_0400',
      createdAt: '19.11.2026 04:00',
      totalBytes: 4096,
      fileCount: 4,
    });
  });

  it('createdAt verilmişse stamp’den türetmez', () => {
    const file = path.join(root, 'status.json');
    writeFileSync(
      file,
      JSON.stringify({ stamp: '2026-11-19_0400', createdAt: '19.11.2026 07:30' }),
    );
    vi.stubEnv('BACKUP_STATUS_FILE', file);

    expect(getBackupStatus()).toEqual({
      available: true,
      stamp: '2026-11-19_0400',
      createdAt: '19.11.2026 07:30',
      totalBytes: 0,
      fileCount: 0,
    });
  });

  it('ok:false ise kullanılamaz döner', () => {
    const file = path.join(root, 'status.json');
    writeFileSync(file, JSON.stringify({ ok: false, stamp: '2026-11-19_0400' }));
    vi.stubEnv('BACKUP_STATUS_FILE', file);

    expect(getBackupStatus()).toEqual({ available: false });
  });

  it('dosya okunamazsa klasör taramasına düşer', () => {
    stampDir('2026-11-18_0300', { 'db.sql': 15 });
    vi.stubEnv('BACKUP_STATUS_FILE', path.join(root, 'yok.json'));

    expect(getBackupStatus()).toEqual({
      available: true,
      stamp: '2026-11-18_0300',
      createdAt: '18.11.2026 03:00',
      totalBytes: 15,
      fileCount: 1,
    });
  });

  it('geçersiz JSON ise kullanılamaz döner', () => {
    const file = path.join(root, 'status.json');
    writeFileSync(file, '{bozuk');
    vi.stubEnv('BACKUP_STATUS_FILE', file);

    expect(getBackupStatus()).toEqual({ available: false });
  });
});
