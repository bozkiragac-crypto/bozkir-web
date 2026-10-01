#!/usr/bin/env bash
# Bozkır Ağaç — off-site yedek: ikinci VPS'e restic (SFTP) ile şifreli, artımlı kopya.
#
# Kurulum (bir kez, VPS1'de):
#   apt-get install -y restic
#   ssh-keygen -t ed25519 -N "" -f /root/.ssh/bozkir_backup   # anahtarı VPS2'ye ekleyin
#   /etc/bozkir-backup.env (chmod 600):
#     RESTIC_REPOSITORY=sftp:backup@VPS2_IP:/srv/bozkir-backup
#     RESTIC_PASSWORD=<güçlü-parola>        # parola yöneticisinde de saklayın!
#
# Kullanım: ./scripts/offsite-backup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${RESTIC_REPOSITORY:-}" || -z "${RESTIC_PASSWORD:-}" ]]; then
  echo "HATA: RESTIC_REPOSITORY ve RESTIC_PASSWORD tanımlı olmalı (/etc/bozkir-backup.env)." >&2
  exit 1
fi
command -v restic >/dev/null 2>&1 || { echo "HATA: restic kurulu değil (apt-get install -y restic)" >&2; exit 1; }

# Depo yoksa başlat.
restic snapshots >/dev/null 2>&1 || restic init

echo "⬆️  Off-site yedek gönderiliyor (şifreli)..."
restic backup "$ROOT/backups" \
  --tag bozkir \
  --exclude '*.tmp' \
  --exclude 'pre-pitr-restore-*' \
  --exclude 'logs'

echo "🧹 Saklama politikası uygulanıyor (7 gün + 4 hafta + 12 ay)..."
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune

echo "🔎 Depo bütünlüğü kontrol ediliyor..."
restic check --read-data-subset=5%

echo "✅ Off-site yedek tamamlandı."
