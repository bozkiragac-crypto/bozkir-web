import { existsSync, readdirSync, statSync } from 'node:fs';
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

/**
 * Son yedeği `backups/` klasöründen okur. Yalnızca durum gösterilir;
 * panelden yedek tetikleme (shell çalıştırma) yoktur (güvenlik kararı).
 */
export function getBackupStatus(): BackupStatus {
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

    // YYYY-MM-DD_HHMM -> okunabilir
    const m = latest.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})$/);
    const createdAt = m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : latest;

    return { available: true, stamp: latest, totalBytes, fileCount, createdAt };
  } catch {
    return { available: false };
  }
}
