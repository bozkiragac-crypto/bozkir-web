#!/usr/bin/env bash
# Bozkır Ağaç — PITR (zaman noktasına geri dönüş) fiziksel geri yükleme.
# Kullanım:
#   ./scripts/pitr-restore.sh <yedek_klasörü> ["2026-10-01 12:30:00+03"]
# Zaman verilmezse mevcut en son WAL noktasına kadar oynatılır.
#
# UYARI: Mevcut veritabanını SİLER. Önce mevcut veri otomatik olarak
# backups/pre-pitr-restore-<tarih>/ altına kopyalanır.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "Kullanım: $0 <yedek_klasörü> [\"YYYY-MM-DD HH:MM:SS+TZ\"]" >&2
  exit 1
fi

SRC="$1"
TARGET_TIME="${2:-}"
[[ -f "$SRC/base.tar.gz" ]] || { echo "HATA: $SRC/base.tar.gz bulunamadı" >&2; exit 1; }
[[ -f "$SRC/wal-archive.tar.gz" ]] || { echo "HATA: $SRC/wal-archive.tar.gz bulunamadı" >&2; exit 1; }

DB_VOLUME="${DB_VOLUME:-bozkir-next_db-data}"
POSTGRES_USER="${POSTGRES_USER:-bozkir}"
POSTGRES_DB="${POSTGRES_DB:-bozkir}"
DB_CONTAINER="${DB_CONTAINER:-bozkir-next-db-1}"

echo "UYARI: Mevcut veritabanı SİLİNECEK ve '$SRC' yedeği geri yüklenecek."
if [[ -n "$TARGET_TIME" ]]; then
  echo "Hedef zaman: $TARGET_TIME"
else
  echo "Hedef zaman: en son WAL noktası"
fi
read -r -p "Devam etmek için 'yes' yazın: " confirm
[[ "$confirm" == "yes" ]] || { echo "İptal edildi."; exit 1; }

SAFETY="$ROOT/backups/pre-pitr-restore-$(date +%Y%m%d_%H%M)"
mkdir -p "$SAFETY"
echo "🛟 Mevcut veri güvenlik kopyası alınıyor: $SAFETY"
docker run --rm -v "${DB_VOLUME}:/data:ro" -v "$SAFETY:/backup" alpine tar czf /backup/db-data-before.tar.gz -C /data .

echo "⏹️  Uygulama ve veritabanı durduruluyor..."
docker compose stop app >/dev/null
docker compose stop db >/dev/null

echo "🧹 Veri hacmi temizleniyor ve base backup açılıyor..."
docker run --rm \
  -v "${DB_VOLUME}:/data" \
  -v "$(cd "$SRC" && pwd):/backup:ro" \
  alpine sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null || true; tar xzf /backup/base.tar.gz -C /data"

if [[ -f "$SRC/pg_wal.tar.gz" ]]; then
  echo "🗄️  Base backup WAL dosyaları açılıyor..."
  docker run --rm \
    -v "${DB_VOLUME}:/data" \
    -v "$(cd "$SRC" && pwd):/backup:ro" \
    alpine sh -c "mkdir -p /data/pg_wal && tar xzf /backup/pg_wal.tar.gz -C /data/pg_wal"
fi

echo "🗄️  WAL arşivi yerleştiriliyor..."
docker run --rm \
  -v "${DB_VOLUME}:/data" \
  -v "$(cd "$SRC" && pwd):/backup:ro" \
  alpine sh -c "mkdir -p /data/pg_wal/archive && tar xzf /backup/wal-archive.tar.gz -C /data/pg_wal/archive"

# Canlı WAL arşiv hacmi (varsa) yedek anlık görüntüsüyle birleştirilir; böylece
# base backup sonrası arşivlenen segmentler de oynatılabilir (hedef zamana kadar).
if docker volume inspect "${WAL_VOLUME:-bozkir-next_wal-archive}" >/dev/null 2>&1; then
  echo "🗄️  Canlı WAL arşivi ekleniyor..."
  docker run --rm \
    -v "${WAL_VOLUME:-bozkir-next_wal-archive}:/wal:ro" \
    -v "${DB_VOLUME}:/data" \
    alpine sh -c "cp -n /wal/* /data/pg_wal/archive/ 2>/dev/null || true"
fi

echo "⚙️  Kurtarma ayarları yazılıyor..."
docker run --rm -v "${DB_VOLUME}:/data" alpine sh -c "cat >> /data/postgresql.auto.conf <<'EOF'

# PITR kurtarma (pitr-restore.sh)
restore_command = 'cp /var/lib/postgresql/data/pg_wal/archive/%f %p'
recovery_target_action = 'promote'
EOF
touch /data/recovery.signal
chown -R 70:70 /data"

if [[ -n "$TARGET_TIME" ]]; then
  docker run --rm -v "${DB_VOLUME}:/data" alpine sh -c \
    "printf \"recovery_target_time = '%s'\n\" '$TARGET_TIME' >> /data/postgresql.auto.conf"
fi

echo "▶️  Veritabanı kurtarma modunda başlatılıyor..."
docker compose up -d db >/dev/null

echo "⏳ Kurtarmanın tamamlanması bekleniyor..."
for i in $(seq 1 60); do
  if docker exec "$DB_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

IN_RECOVERY="$(docker exec "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc 'select pg_is_in_recovery();' 2>/dev/null || echo 't')"
if [[ "$IN_RECOVERY" == "f" ]]; then
  echo "✅ Kurtarma tamamlandı ve veritabanı yazılabilir (promote edildi)."
else
  echo "⚠️  Veritabanı hâlâ kurtarma modunda. Logları kontrol edin:" >&2
  docker compose logs --tail=60 db >&2
  exit 1
fi

echo "▶️  Uygulama başlatılıyor..."
docker compose up -d app >/dev/null
echo "✅ PITR geri yükleme bitti. Doğrulama: curl -s http://localhost/api/health?deep=1"
