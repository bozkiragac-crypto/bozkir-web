#!/bin/sh
# Uygulama başlangıç girişi:
#   1) idempotent şema migrasyonu
#   2) nesne depolama bucket'ı
#   3) (env verilmişse) admin kullanıcısı
#   4) Next üretim sunucusu
# Hatalar durdurucu değildir; servis yine de başlar.
set -u

echo "[entrypoint] şema migrasyonu çalıştırılıyor..."
node scripts/db-migrate.mjs || echo "[entrypoint] UYARI: migrate başarısız (devam ediliyor)"

echo "[entrypoint] depolama bucket'ı hazırlanıyor..."
node scripts/init-storage.mjs || echo "[entrypoint] UYARI: storage init başarısız (devam ediliyor)"

if [ -n "${ADMIN_SEED_PASSWORD:-}" ]; then
  echo "[entrypoint] admin kullanıcısı kontrol ediliyor (varsa korunur)..."
  node scripts/seed-admin.mjs || echo "[entrypoint] UYARI: admin seed başarısız (devam ediliyor)"
fi

echo "[entrypoint] Next sunucusu başlatılıyor..."
exec node_modules/next/dist/bin/next start -p "${PORT:-3000}"
