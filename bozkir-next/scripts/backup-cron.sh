#!/usr/bin/env bash
# Bozkır Ağaç — gece yedeği sarmalayıcısı: tam yedek + off-site + bildirim + budama.
# Cron için: deploy/crontab.example
# Sırlar: /etc/bozkir-backup.env (chmod 600) — RESTIC_* ve ALERT_WEBHOOK_URL.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${BACKUP_ENV:-/etc/bozkir-backup.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

LOG_DIR="$ROOT/backups/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/backup-$(date +%Y%m%d).log"

notify() {
  if [[ -n "${ALERT_WEBHOOK_URL:-}" ]]; then
    curl -fsS -m 10 -H 'Content-Type: application/json' \
      -d "{\"text\":\"$1\"}" "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 || true
  fi
}

{
  echo "=== $(date -Iseconds) yedek başladı ==="
  "$ROOT/scripts/backup.sh"
  if [[ -n "${RESTIC_REPOSITORY:-}" ]]; then
    "$ROOT/scripts/offsite-backup.sh"
  else
    echo "UYARI: RESTIC_REPOSITORY tanımlı değil; off-site adımı atlandı."
  fi
} >> "$LOG" 2>&1
STATUS=$?

if [[ $STATUS -eq 0 ]]; then
  echo "=== $(date -Iseconds) yedek başarılı ===" >> "$LOG"
  notify "✅ Bozkır Ağaç yedeği başarılı ($(date +%F))"
else
  echo "=== $(date -Iseconds) YEDEK BAŞARISIZ ===" >> "$LOG"
  notify "❌ Bozkır Ağaç YEDEĞİ BAŞARISIZ ($(date +%F)) — VPS1: $LOG"
fi

# Yerel yedekleri buda: son 14 gün; logları son 30 gün.
find "$ROOT/backups" -maxdepth 1 -type d -name '20*' -mtime +14 -exec rm -rf {} + 2>/dev/null || true
find "$LOG_DIR" -type f -name '*.log' -mtime +30 -delete 2>/dev/null || true

exit $STATUS
