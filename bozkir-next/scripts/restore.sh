#!/usr/bin/env bash
# Bozkır Ağaç — yedeği geri yükle (PostgreSQL + medya).
# Kullanım: ./scripts/restore.sh <yedek_klasörü>
# Örnek:   ./scripts/restore.sh ./backups/2026-09-30_1200
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Kullanım: $0 <yedek_klasörü>" >&2
  exit 1
fi

SRC="$1"
[[ -f "$SRC/db.sql" ]] || { echo "HATA: $SRC/db.sql bulunamadı" >&2; exit 1; }

DB_CONTAINER="${DB_CONTAINER:-bozkir-next-db-1}"
STORAGE_VOLUME="${STORAGE_VOLUME:-bozkir-next_storage-data}"
POSTGRES_USER="${POSTGRES_USER:-bozkir}"
POSTGRES_DB="${POSTGRES_DB:-bozkir}"

echo "UYARI: Bu işlem mevcut veritabanını ve medyayı SILEcek."
read -r -p "Devam etmek için 'yes' yazın: " confirm
[[ "$confirm" == "yes" ]] || { echo "İptal edildi."; exit 1; }

echo "→ Veritabanı geri yükleniyor..."
cat "$SRC/db.sql" | docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"

if [[ -f "$SRC/storage.tar.gz" ]]; then
  echo "→ Medya geri yükleniyor..."
  docker run --rm \
    -v "${STORAGE_VOLUME}:/data" \
    -v "$(cd "$SRC" && pwd):/backup:ro" \
    alpine sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null || true; tar xzf /backup/storage.tar.gz -C /data"
fi

echo "✓ Geri yükleme tamam. Uygulamayı yeniden başlatın: docker compose restart app"
