#!/usr/bin/env bash
#
# Bozkır Ağaç — canlı yayına alma (VPS, tek komut).
#
# Kullanım:
#   cd /opt/bozkir-web/bozkir-next
#   bash deploy/go-live.sh [DOMAIN] [EMAIL]
#
# Örnek:
#   bash deploy/go-live.sh bozkiragac.com admin@bozkiragac.com
#
# Ne yapar:
#   1) .env / .env.local yoksa güvenli rastgele değerlerle oluşturur (chmod 600)
#   2) nginx TLS conf domainini ayarlar
#   3) HTTP yığını başlatır + health doğrular
#   4) Let's Encrypt sertifikası alır + otomatik yenileme kancası
#   5) TLS (443) varyantıyla yeniden başlatır + doğrular
#
# Ön koşullar: DNS A kayıtları (@ ve www) VPS IP'sine bakıyor olmalı; Docker kurulu.
# Idempotent: tekrar çalıştırılabilir.
set -euo pipefail

DOMAIN="${1:-bozkiragac.com}"
EMAIL="${2:-${CERTBOT_EMAIL:-}}"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m!!\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mHATA:\033[0m %s\n' "$*" >&2; exit 1; }

[ -f docker-compose.yml ] || die "docker-compose.yml bulunamadı. Bu scripti bozkir-next klasöründe çalıştırın."
command -v docker >/dev/null 2>&1 || die "docker bulunamadı. Önce 'bash deploy/vps-bootstrap.sh' çalıştırın."
docker compose version >/dev/null 2>&1 || die "docker compose plugin bulunamadı."

COMPOSE_PROD=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

# ---------------------------------------------------------------- 1) .env / .env.local
rand_hex() { openssl rand -hex "$1"; }

if [ ! -f .env ]; then
  log "1/5 .env oluşturuluyor (compose değişkenleri)..."
  cat > .env <<EOF
POSTGRES_USER=bozkir
POSTGRES_PASSWORD=$(rand_hex 24)
POSTGRES_DB=bozkir
SITE_URL=https://${DOMAIN}
S3_ACCESS_KEY=any
S3_SECRET_KEY=any
S3_BUCKET=bozkir-media
S3_PUBLIC_BASE_URL=/media
APP_TIME_ZONE=Europe/Istanbul
TRUSTED_PROXY=1
MAINTENANCE_MODE=0
# Bakım sayfası (nginx 502/504) iletişim bilgileri — konteyner başlarken enjekte edilir.
MAINT_PHONE=+90 535 527 16 12
MAINT_TEL=+905355271612
MAINT_WHATSAPP=https://wa.me/905355271612
MAINT_EMAIL=info@bozkiragac.com
MAINT_HOURS_TR=Pazartesi – Cuma: 08:00 – 18:00 · Cumartesi: 08:00 – 14:00
MAINT_HOURS_EN=Monday – Friday: 08:00 – 18:00 · Saturday: 08:00 – 14:00
MAINT_HOURS_AR=الاثنين – الجمعة: 08:00 – 18:00 · السبت: 08:00 – 14:00
EOF
  chmod 600 .env
  echo "  .env yazıldı (POSTGRES_PASSWORD rastgele üretildi)."
else
  log "1/5 .env zaten var; dokunulmadı."
fi

if [ ! -f .env.local ]; then
  log "1/5 .env.local oluşturuluyor (uygulama değişkenleri)..."
  SEED_PASS="${ADMIN_SEED_PASSWORD:-}"
  if [ -z "$SEED_PASS" ] && [ -t 0 ]; then
    printf '  İlk admin parolası (en az 8 karakter): '
    read -r SEED_PASS
  fi
  if [ -z "$SEED_PASS" ]; then
    SEED_PASS=$(rand_hex 12)
    warn "ADMIN_SEED_PASSWORD verilmedi; rastgele parola üretildi: $SEED_PASS"
    warn "İlk girişten sonra panelden değiştirin."
  fi
  cat > .env.local <<EOF
AUTH_SECRET=$(rand_hex 32)
S3_ACCESS_KEY=any
S3_SECRET_KEY=any
S3_BUCKET=bozkir-media
S3_PUBLIC_BASE_URL=/media
ADMIN_SEED_USERNAME=bozkir
ADMIN_SEED_PASSWORD=${SEED_PASS}
# Turnstile/SMTP sonradan eklenebilir (bkz. .env.production.example)
EOF
  chmod 600 .env.local
  echo "  .env.local yazıldı (AUTH_SECRET rastgele üretildi)."
else
  log "1/5 .env.local zaten var; dokunulmadı."
fi

git check-ignore -q .env .env.local 2>/dev/null \
  && echo "  ✓ .env ve .env.local git tarafından yok sayılıyor." \
  || warn ".gitignore .env/.env.local'ı yok saymıyor olabilir; kontrol edin."

# ---------------------------------------------------------------- 2) nginx domain
log "2/5 nginx TLS domaini ayarlanıyor (${DOMAIN})..."
if [ -f deploy/nginx.docker.tls.conf ]; then
  sed -i "s/bozkiragac\.com/${DOMAIN}/g" deploy/nginx.docker.tls.conf
  grep -q "server_name ${DOMAIN}" deploy/nginx.docker.tls.conf \
    && echo "  ✓ server_name = ${DOMAIN}" \
    || warn "server_name güncellenemedi; deploy/nginx.docker.tls.conf'i elle kontrol edin."
else
  die "deploy/nginx.docker.tls.conf bulunamadı."
fi

# ---------------------------------------------------------------- 3) HTTP + health
log "3/5 HTTP yığını başlatılıyor (build)..."
docker compose up -d --build

echo "  health bekleniyor (en fazla ~120 sn)..."
ok=""
for _ in $(seq 1 40); do
  if curl -fsS "http://localhost/api/health?deep=1" >/tmp/bozkir-health.json 2>/dev/null; then
    ok="1"; break
  fi
  sleep 3
done
[ -n "$ok" ] || { docker compose logs --tail=60 app || true; die "Health check başarısız. Logları inceleyin."; }
cat /tmp/bozkir-health.json; echo
grep -q '"db":"ok"' /tmp/bozkir-health.json || warn "db durumu ok değil; logları kontrol edin."

# ---------------------------------------------------------------- 4) Let's Encrypt
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  log "4/5 Sertifika zaten mevcut; atlanıyor."
else
  log "4/5 Let's Encrypt sertifikası alınıyor (${DOMAIN})..."
  command -v certbot >/dev/null 2>&1 || die "certbot yok. 'sudo apt-get install -y certbot' çalıştırın."
  [ -n "$EMAIL" ] || die "E-posta gerekli: bash deploy/go-live.sh ${DOMAIN} sizin@mailiniz"
  sudo certbot certonly --webroot \
    -w "$PWD/deploy/certbot-webroot" \
    -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos -m "${EMAIL}"
fi

sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<'HOOK'
#!/bin/sh
docker exec bozkir-next-nginx-1 nginx -s reload || true
HOOK
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo systemctl enable --now certbot.timer 2>/dev/null || true

# ---------------------------------------------------------------- 5) TLS + doğrulama
log "5/5 TLS (443) aktif ediliyor..."
"${COMPOSE_PROD[@]}" up -d

echo "  HTTPS doğrulanıyor..."
sleep 4
echo "-- http -> https (301 bekleniyor)"
curl -sI "http://${DOMAIN}/" | head -n 1 || warn "http yönlendirmesi doğrulanamadı (DNS henüz yayılmamış olabilir)."
echo "-- https (200 + HSTS bekleniyor)"
curl -sI "https://${DOMAIN}/" | grep -iE '^(HTTP/|strict-transport-security)' || warn "https başlıkları alınamadı."
echo "-- health?"
curl -fsS "https://${DOMAIN}/api/health?deep=1" || warn "https health alınamadı."

log "Tamamlandı."
cat <<EOF

  Admin:  https://${DOMAIN}/admin/login
          (kullanıcı: bozkir — parola .env.local içindeki ADMIN_SEED_PASSWORD)
  Sonraki: panelden parolayı değiştirin + 2FA; /admin/ayarlar'dan SEO/sosyal/SMTP.
  Yedek  : crontab -l 2>/dev/null | cat - deploy/crontab.example | crontab -
           ./scripts/backup.sh && ./scripts/verify-backup.sh
EOF
