#!/usr/bin/env bash
# Bozkır Ağaç — tam yedek seti:
#   1) Mantıksal döküm (db.sql)            → hızlı geri yükleme
#   2) Medya arşivi (storage.tar.gz)       → SeaweedFS hacmi
#   3) PITR tabanı (base.tar.gz + WAL)     → zaman noktasına geri dönüş
# Kullanım: ./scripts/backup.sh [hedef_klasör]
# Varsayılan hedef: ./backups/YYYY-MM-DD_HHMM
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y-%m-%d_%H%M)"
OUT="${1:-$ROOT/backups/$STAMP}"
mkdir -p "$OUT"

DB_CONTAINER="${DB_CONTAINER:-bozkir-next-db-1}"
STORAGE_VOLUME="${STORAGE_VOLUME:-bozkir-next_storage-data}"
POSTGRES_USER="${POSTGRES_USER:-bozkir}"
POSTGRES_DB="${POSTGRES_DB:-bozkir}"

echo "⏳ Veritabanı dökümü alınıyor..."
docker exec "$DB_CONTAINER" pg_dump --no-owner --no-privileges -U "$POSTGRES_USER" "$POSTGRES_DB" > "$OUT/db.sql"

echo "⏳ Medya arşivleniyor..."
docker run --rm \
  -v "${STORAGE_VOLUME}:/data:ro" \
  -v "$OUT:/backup" \
  alpine tar czf /backup/storage.tar.gz -C /data .

echo "⏳ PITR tabanı alınıyor..."
"$ROOT/scripts/pitr-base-backup.sh" "$OUT"

cat > "$OUT/manifest.txt" <<EOF
stamp=$STAMP
created_at=$(date -Iseconds)
db_container=$DB_CONTAINER
storage_volume=$STORAGE_VOLUME
wal_volume=${WAL_VOLUME:-bozkir-next_wal-archive}
files=db.sql,storage.tar.gz,base.tar.gz,wal-archive.tar.gz
EOF

echo "✅ Yedek hazır: $OUT"
ls -lh "$OUT"
