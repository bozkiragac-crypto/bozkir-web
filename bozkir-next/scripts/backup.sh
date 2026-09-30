#!/usr/bin/env bash
# Bozkır Ağaç — tam yedek (PostgreSQL dökümü + SeaweedFS medya arşivi).
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

echo "→ Veritabanı dökümü alınıyor..."
docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$OUT/db.sql"

echo "→ Medya arşivleniyor..."
docker run --rm \
  -v "${STORAGE_VOLUME}:/data:ro" \
  -v "$OUT:/backup" \
  alpine tar czf /backup/storage.tar.gz -C /data .

echo "→ Manifest yazılıyor..."
cat > "$OUT/manifest.txt" <<EOF
stamp=$STAMP
db_container=$DB_CONTAINER
storage_volume=$STORAGE_VOLUME
created_at=$(date -Iseconds)
EOF

echo "✓ Yedek hazır: $OUT"
ls -lh "$OUT"
