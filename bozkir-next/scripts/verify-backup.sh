#!/usr/bin/env bash
# Bozkır Ağaç — yedek doğrulama tatbikatı.
# En son (veya verilen) yedeği geçici bir PostgreSQL konteynerine geri yükler,
# dosya bütünlüğünü ve tablo sayımlarını kontrol eder. Ayda bir çalıştırın.
# Kullanım: ./scripts/verify-backup.sh [yedek_klasörü]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $# -ge 1 ]]; then
  SRC="$1"
else
  SRC="$(ls -1dt "$ROOT"/backups/*/ 2>/dev/null | grep -v pre-pitr-restore | head -1 || true)"
fi
[[ -n "${SRC:-}" && -d "$SRC" ]] || { echo "HATA: yedek klasörü bulunamadı" >&2; exit 1; }

echo "🔎 Yedek doğrulanıyor: $SRC"
for f in db.sql storage.tar.gz base.tar.gz wal-archive.tar.gz; do
  [[ -s "$SRC/$f" ]] || { echo "HATA: $f eksik/boş" >&2; exit 1; }
done

echo "📦 Arşiv bütünlüğü kontrol ediliyor..."
docker run --rm -v "$(cd "$SRC" && pwd):/backup:ro" alpine sh -c "
  tar tzf /backup/storage.tar.gz >/dev/null &&
  tar tzf /backup/wal-archive.tar.gz >/dev/null &&
  tar tzf /backup/base.tar.gz >/dev/null &&
  tar tzf /backup/base.tar.gz | grep -q 'PG_VERSION' &&
  { [ ! -f /backup/pg_wal.tar.gz ] || tar tzf /backup/pg_wal.tar.gz >/dev/null; }"

echo "🐘 Geçici veritabanına geri yükleniyor..."
CID="bozkir-verify-$$"
docker run -d --name "$CID" \
  -e POSTGRES_PASSWORD=verify -e POSTGRES_USER=verify -e POSTGRES_DB=verify \
  postgres:16-alpine >/dev/null
cleanup() { docker rm -f "$CID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

for i in $(seq 1 30); do
  if docker exec "$CID" pg_isready -U verify -d verify >/dev/null 2>&1; then break; fi
  sleep 1
done

docker exec -i "$CID" psql -v ON_ERROR_STOP=1 -U verify -d verify >/dev/null < "$SRC/db.sql"

PRODUCTS="$(docker exec "$CID" psql -U verify -d verify -tAc 'select count(*) from products')"
CATEGORIES="$(docker exec "$CID" psql -U verify -d verify -tAc 'select count(*) from categories')"
QUOTES="$(docker exec "$CID" psql -U verify -d verify -tAc 'select count(*) from quote_requests')"

if [[ "${PRODUCTS:-0}" -lt 1 ]]; then
  echo "HATA: geri yükleme sonrası products tablosu boş" >&2
  exit 1
fi

echo "✅ Doğrulama başarılı — products=$PRODUCTS categories=$CATEGORIES quotes=$QUOTES"
