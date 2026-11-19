import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export interface BackupStatus {
  available: boolean;
  stamp?: string;
  totalBytes?: number;
  fileCount?: number;
  /** Panelde gösterilecek TR tarih/saat. */
  createdAt?: string;
}

const STAMP_RE = /^\d{4}-\d{2}-\d{2}_\d{4}$/;

function stampToCreatedAt(stamp: string): string {
  const m = stamp.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : stamp;
}

/**
 * `BACKUP_STATUS_FILE` harici bir doğrulama/cron aracının yazdığı JSON özeti.
 * Beklenen alanlar: stamp (zorunlu), createdAt, totalBytes, fileCount, ok.
 * Dosya yoksa klasör taramasına düşülür; bozuksa yanlış "hazır" göstermemek
 * için kullanılamaz döner.
 */
function readStatusFile(file: string): BackupStatus | null {
  if (!existsSync(file)) return null;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (raw.ok === false) return { available: false };
    const stamp = typeof raw.stamp === 'string' ? raw.stamp : '';
    if (!stamp) return { available: false };
    return {
      available: true,
      stamp,
      createdAt:
        typeof raw.createdAt === 'string' && raw.createdAt
          ? raw.createdAt
          : stampToCreatedAt(stamp),
      totalBytes: typeof raw.totalBytes === 'number' ? raw.totalBytes : 0,
      fileCount: typeof raw.fileCount === 'number' ? raw.fileCount : 0,
    };
  } catch {
    return { available: false };
  }
}

/** Son yedeği `backups/` klasöründen okur. */
function readBackupDir(): BackupStatus {
  try {
    const dir = process.env.BACKUP_DIR
      ? path.resolve(process.env.BACKUP_DIR)
      : path.join(process.cwd(), 'backups');
    if (!existsSync(dir)) return { available: false };

    const stamps = readdirSync(dir)
      .filter((name) => STAMP_RE.test(name) && statSync(path.join(dir, name)).isDirectory())
      .sort();
    const latest = stamps.at(-1);
    if (!latest) return { available: false };

    const full = path.join(dir, latest);
    let totalBytes = 0;
    let fileCount = 0;
    for (const file of readdirSync(full)) {
      const st = statSync(path.join(full, file));
      if (st.isFile()) {
        totalBytes += st.size;
        fileCount += 1;
      }
    }

    return {
      available: true,
      stamp: latest,
      totalBytes,
      fileCount,
      createdAt: stampToCreatedAt(latest),
    };
  } catch {
    return { available: false };
  }
}

/**
 * Son yedek durumunu döndürür. `BACKUP_STATUS_FILE` tanımlıysa JSON özet
 * önceliklidir; aksi halde `BACKUP_DIR` klasörü taranır. Yalnızca durum
 * gösterilir; panelden yedek tetikleme (shell çalıştırma) yoktur.
 */
export function getBackupStatus(): BackupStatus {
  const file = process.env.BACKUP_STATUS_FILE?.trim();
  if (file) {
    const fromFile = readStatusFile(path.resolve(file));
    if (fromFile) return fromFile;
  }
  return readBackupDir();
}
