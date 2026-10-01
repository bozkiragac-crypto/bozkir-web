#!/usr/bin/env bash
# Bozkır Ağaç — PITR tabanı: pg_basebackup (fiziksel base backup) + WAL arşiv anlık görüntüsü.
# Kullanım: ./scripts/pitr-base-backup.sh [hedef_klasör]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y-%m-%d_%H%M)"
OUT="${1:-$ROOT/backups/pitr/$STAMP}"

DB_CONTAINER="${DB_CONTAINER:-bozkir-next-db-1}"
WAL_VOLUME="${WAL_VOLUME:-bozkir-next_wal-archive}"
POSTGRES_USER="${POSTGRES_USER:-bozkir}"
POSTGRES_DB="${POSTGRES_DB:-bozkir}"

mkdir -p "$OUT"

echo "📦 Fiziksel base backup alınıyor (pg_basebackup)..."
docker exec "$DB_CONTAINER" sh -c "rm -rf /tmp/basebackup && mkdir -p /tmp/basebackup"
docker exec "$DB_CONTAINER" pg_basebackup \
  -U "$POSTGRES_USER" -D /tmp/basebackup -Ft -z -X stream -c fast

# Tar çıktısını yedek klasörüne taşı (base.tar.gz + pg_wal.tar.gz).
# Git Bash/Windows'ta docker cp için Windows yolu gerekir; Linux'ta dokunulmaz.
DOCKER_OUT="$OUT"
if command -v cygpath >/dev/null 2>&1; then DOCKER_OUT="$(cygpath -w "$OUT")"; fi
docker cp "$DB_CONTAINER:/tmp/basebackup/." "$DOCKER_OUT/"
docker exec "$DB_CONTAINER" rm -rf /tmp/basebackup

[[ -s "$OUT/base.tar.gz" ]] || { echo "HATA: base.tar.gz üretilemedi" >&2; exit 1; }

# Base backup'ın kapsadığı son WAL segmentinin arşive yazıldığından emin ol.
echo "🔁 WAL segmenti arşive zorlanıyor..."
docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select pg_switch_wal()" >/dev/null
sleep 3

echo "🗄️  WAL arşivi kopyalanıyor..."
docker run --rm \
  -v "${WAL_VOLUME}:/wal:ro" \
  -v "$OUT:/backup" \
  alpine tar czf /backup/wal-archive.tar.gz -C /wal .

cat > "$OUT/manifest.txt" <<EOF
type=pitr-base
stamp=$STAMP
created_at=$(date -Iseconds)
db_container=$DB_CONTAINER
wal_volume=$WAL_VOLUME
EOF

echo "✅ PITR tabanı hazır: $OUT"
ls -lh "$OUT"
