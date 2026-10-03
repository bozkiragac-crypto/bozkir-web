# Bozkır Ağaç Ürünleri — Production Kurulum Rehberi (Docker + nginx + TLS)

Bu rehber, projeyi **sıfırdan** bir VPS'e kurmak için adım adım prosedürdür.
Docker nginx + Let's Encrypt (TLS) yolu kullanılır. Her adımda bir doğrulama
komutu ve ne beklenmesi gerektiği yazılıdır.

> **Ne zaman takılırsanız:** adım numarasını ve hata çıktısını not edin; geri
> dönmek için §15 (Geri alma) bölümüne bakın.

---

## 0. Ön koşullar (satın alınacaklar)

| İhtiyaç | Öneri | Not |
|---|---|---|
| VPS | Ubuntu 24.04 LTS, 2 vCPU, 4 GB RAM, 80 GB SSD | Daha düşük (1 vCPU/2 GB) da çalışır ama build yavaşlar |
| Domain | `bozkiragac.com` + `www` | Registrar'dan alınır, DNS yönetimi gerekir |
| E-posta | Transactional SMTP sağlayıcı (Resend / Postmark / SMTP2GO / Amazon SES) | Teklif bildirimleri ve admin uyarıları için; SPF/DKIM kurulmalı |
| Turnstile | Cloudflare Turnstile (ücretsiz) | Bot koruması; site anahtarı + gizli anahtar |
| Off-site yedek | İkinci bir VPS veya S3 uyumlu depolama | Sunucu çökerse işe yaramayacak yedeğin önüne geçer |

**Kapsam notu:** Uygulama içeriği (kategoriler, ürünler, kampanyalar, teklifler)
admin panelinden yönetilir; bu rehber sunucu tarafını kapsar.

---

## 1. Domain ve DNS

1. Registrar panelinden domaini alın.
2. DNS kayıtları:

   | Tip | Ad | Değer |
   |---|---|---|
   | A | `@` | VPS IP adresi |
   | A | `www` | VPS IP adresi (ya da CNAME → `@`) |
   | MX / TXT | `@` | SMTP sağlayıcınızın verdiği kayıtlar (SPF, DKIM, DMARC) |

3. DNS'in yayılmasını bekleyin ve doğrulayın:

   ```bash
   dig +short bozkiragac.com      # VPS IP'nizi vermeli
   dig +short www.bozkiragac.com  # aynı IP
   ```

> DNS yayılmadan Let's Encrypt sertifikası **alınamaz**. `dig` doğru IP'yi
> göstermeden sonraki adımlara geçmeyin.

---

## 2. VPS hazırlığı

```bash
ssh root@VPS_IP
apt-get update && apt-get full-upgrade -y
apt-get install -y git curl ca-certificates gnupg openssl ufw
```

**Yeni kullanıcı ve SSH anahtarı (root ile çalışmayın):**

```bash
adduser bozkir                     # kendi parolanızı belirleyin
usermod -aG sudo,docker bozkir
# Kendi makinenizden: ssh-keygen -t ed25519 -C "bozkir-prod"
#   → ~/.ssh/id_ed25519.pub içeriğini sunucuya yapıştırın:
mkdir -p /home/bozkir/.ssh && nano /home/bozkir/.ssh/authorized_keys
chown -R bozkir:bozkir /home/bozkir/.ssh
chmod 700 /home/bozkir/.ssh && chmod 600 /home/bozkir/.ssh/authorized_keys
```

Yeni kullanıcıyla test edin (`ssh bozkir@VPS_IP`) ve **ardından** root erişimini kapatın:

```bash
sudo sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl reload ssh
```

**Güvenlik duvarı:**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp  comment 'HTTP (sertifika + yonlendirme)'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
sudo ufw status verbose
```

> Postgres (5432) ve SeaweedFS (8333) portları `docker-compose.yml`'de
> `127.0.0.1`e bağlıdır; dışarıya açılmaz. UFW'de açmanıza gerek yoktur.

**Swap (2 GB) — build ve ani yüklerde OLM kill olmasın:**

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Otomatik güvenlik güncellemeleri:**

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades   # "security+updates" seçin
```

**Docker Engine + Compose plugin (resmi repo):**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker        # veya SSH'den çıkıp tekrar girin
docker --version && docker compose version
```

**Docker log limitleri** compose içinde tanımlıdır (10 MB × 3 dosya); ayrıca
sistem logları için:

```bash
sudo journalctl --vacuum-size=200M
printf '[Journald]\nSystemMaxUse=200M\n' | sudo tee /etc/systemd/journald.conf.d/size.conf
sudo systemctl restart systemd-journald
```

---

## 3. Kodu çekme

```bash
sudo mkdir -p /opt/bozkir-web && sudo chown $USER:$USER /opt/bozkir-web
cd /opt/bozkir-web
git clone <REPO_URL> .
cd bozkir-next
```

Beklenen: `deploy/`, `docker/`, `scripts/`, `src/` klasörleri görünmeli.

Sürümlü dağıtım (rollback için etiketli çalıştırma):

```bash
git log --oneline -1     # yayınlanan commiti not edin
```

---

## 4. Ortam değişkenleri ve sırlar

İki dosya vardır:
- **`.env`** → Compose değişkenleri (DB parolası, site URL'si, build argümanları)
- **`.env.local`** → Uygulama değişkenleri (`AUTH_SECRET`, S3 anahtarları, Turnstile)

`git` ikisini de görmemelidir; doğrulayın:

```bash
git check-ignore -v .env .env.local
```

### 4.1 Rastgele sırlar üretin

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"   # 48 karakter, URL/özel karakter sorunu yok
echo "AUTH_SECRET=$(openssl rand -hex 32)"         # 64 karakter
```

### 4.2 `.env` (Compose)

```bash
cat > .env <<EOF
# --- Veritabanı ---
POSTGRES_USER=bozkir
POSTGRES_PASSWORD=<4.1'de ürettiğiniz 48 karakterlik değer>
POSTGRES_DB=bozkir

# --- Site kimliği (kanonik URL, sitemap, OG görseli) ---
SITE_URL=https://bozkiragac.com

# --- Depolama (SeaweedFS) ---
S3_BUCKET=bozkir-media
S3_PUBLIC_BASE_URL=/media

# --- Uygulama bayrakları ---
APP_TIME_ZONE=Europe/Istanbul
TRUSTED_PROXY=1
MAINTENANCE_MODE=0
EOF
chmod 600 .env
```

### 4.3 `.env.local` (uygulama)

```bash
cat > .env.local <<EOF
# Oturum çerez imzası — sızdırılırsa tüm oturumlar ele geçirilebilir
AUTH_SECRET=<4.1'de ürettiğiniz AUTH_SECRET>

# SeaweedFS S3 erişimi (ağ yalnızca localhost; anahtarlar yine de gizli tutulur)
S3_ACCESS_KEY=<S3 anahtarı>
S3_SECRET_KEY=<S3 gizli anahtarı>

# Bot koruması (Cloudflare Turnstile) — §6'da alacaksınız, sonra ekleyin:
# TURNSTILE_SITE_KEY=
# TURNSTILE_SECRET_KEY=
EOF
chmod 600 .env.local
```

> **Turnstile anahtarlarını `.env.local`'e ekleyip uygulamayı yeniden başlatmadan
> önce** §6'yı tamamlayın.

---

## 5. nginx TLS konfigürasyonunu kendi domaininize göre ayarlayın

`deploy/nginx.docker.tls.conf` içinde alan adı iki yerde geçer: `server_name`
ve sertifika yolu. Kendi domaininizle değiştirin:

```bash
DOMAIN=bozkiragac.com
sed -i "s/bozkiragac\.com/${DOMAIN}/g" deploy/nginx.docker.tls.conf
grep -n "server_name\|ssl_certificate" deploy/nginx.docker.tls.conf
```

Beklenen:
```
server_name bozkiragac.com www.bozkiragac.com;
ssl_certificate     /etc/letsencrypt/live/bozkiragac.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/bozkiragac.com/privkey.pem;
```

---

## 6. Turnstile anahtarlarını alın (Cloudflare)

1. <https://dash.cloudflare.com> → hesap oluşturun → **Turnstile** bölümü.
2. Site ekleyin: `bozkiragac.com` (ve `www.bozkiragac.com`).
3. Widget türü: **Managed** (gizli), domainler: kendi domaininiz.
4. Alınan **Site Key** ve **Secret Key** değerlerini `.env.local`'e yazın:

   ```bash
   cat >> .env.local <<'EOF'
   TURNSTILE_SITE_KEY=0x4AAAAAAA...
   TURNSTILE_SECRET_KEY=0x4AAAAAAA...
   EOF
   chmod 600 .env.local
   ```

> Anahtarlar **yalnızca production** ortamında tanımlanır. E2E testleri Turnstile
> anahtarı olmadan çalışacak şekilde yazıldı; test ortamına anahtar eklerseniz
> token üretilemediği için teklif testi kırılır.

---

## 7. İlk kurulum (HTTP) — sertifika alabilmek için

Sertifika, 80 portundaki ACME doğrulamasıyla alınır. Önce HTTP yapılandırmasıyla
yığını ayağa kaldırın:

```bash
docker compose up -d --build
docker compose ps
curl -fsS http://localhost/api/health?deep=1
```

Beklenen:
```json
{"ok":true,...,"db":"ok","storage":"ok","image":"ok"}
```

---

## 8. Let's Encrypt sertifikası

```bash
sudo apt-get install -y certbot
sudo certbot certonly --webroot \
  -w /opt/bozkir-web/bozkir-next/deploy/certbot-webroot \
  -d bozkiragac.com -d www.bozkiragac.com
```

Beklenen: `Successfully received certificate` ve `/etc/letsencrypt/live/bozkiragac.com/` altında sertifika.

**Otomatik yenileme + nginx reload kancası:**

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null <<'EOF'
#!/bin/sh
docker exec bozkir-next-nginx-1 nginx -s reload
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run     # yenileme mekanizmasını test eder
```

Beklenen: `Congratulations, all simulated renewals succeeded`.

---

## 9. TLS'li production başlatma

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Artık 80 → 443 yönlendirmesi, HSTS ve `Secure` oturum çerezi devrededir.

**Doğrulama:**

```bash
curl -I http://bozkiragac.com/                      # 301 → https
curl -I https://bozkiragac.com/                     # 200, Strict-Transport-Security
curl -fsS https://bozkiragac.com/api/health?deep=1  # db/storage/image ok
```

Tarayıcıda kontrol edin:
- `https://bozkiragac.com` — kilit simgesi, HSTS
- `/urunler`, `/teklif`, `/admin/login` — 200
- Ürün görselleri (`/media/...`) — 200
- Admin'e **HTTP** ile girmek istemiyorsanız çerez `Secure` olmalı; adres çubuğunda
  site bilgisi → çerezlerde `bozkir_session` "Güvenli" işaretli olmalı.

---

## 10. İlk kurulum sonrası uygulama ayarları

`https://bozkiragac.com/admin/login` → varsayılan bilgilerle giriş:

| Alan | Değer |
|---|---|
| Kullanıcı | `bozkir` |
| Parola | `Bozkir.1905` |

### 10.1 ZORUNLU — Admin parolasını değiştirin

`/admin/hesap` → **Parolayı değiştir**. Varsayılan parola internette bilinen bir
değerdir; değiştirilmeden siteyi yayına almayın.

> Not: E2E testleri bu varsayılan parolayla giriş yapar. Parolayı değiştirdiyseniz
> testlerde `E2E_ADMIN_PASS=<yeni parola>` verin.

### 10.2 Site ayarları (`/admin/ayarlar`)

- **SMTP**: sağlayıcınızdan gelen host/port/user/pass/SSL bilgilerini girin.
  Gönderen adresinizin SPF/DKIM kaydı DNS'te tanımlı olmalı.
- **Bildirim e-postası** (`notifyEmail`): teklif bildirimleri ve global limit
  uyarılarının gideceği **kendi** adresiniz.
- **Webhook** (alternatif): Slack/Discord uyarı adresi.
- **SEO**: title/description, OG görseli, `siteConfig.url` = `https://bozkiragac.com`.
- **Sosyal**: Instagram/Facebook/WhatsApp bağlantıları.
- **Bakım modu**: `MAINTENANCE_MODE=0` (kapalı) olmalı; açıkken site 503 döner.
- **Popup kampanyası**: gerçek kampanya + görsel ekleyin; kayıt yoksa popup gizlidir.

### 10.3 Teklif ve güvenlik limitleri

Varsayılanlar `.env.local` ile değiştirilebilir (değişiklikten sonra
`docker compose ... up -d app` gerekir):
`QUOTE_RATE_PER_HOUR`, `QUOTE_RATE_GLOBAL_PER_HOUR`, `QUOTE_RATE_GLOBAL_PER_DAY`,
`QUOTE_ATTACH_DAILY_COUNT`.

---

## 11. Yedekleme (veri güvenliği)

Yedek scriptleri bash + docker gerektirir; VPS üzerinde çalışır.

### 11.1 Off-site yedek yapılandırması

```bash
sudo apt-get install -y restic
sudo ssh-keygen -t ed25519 -N "" -f /root/.ssh/bozkir_backup -C bozkir-backup
# İkinci VPS'de: /root/.ssh/authorized_keys'e bu public key'i ekleyin
sudo install -m 600 /dev/null /etc/bozkir-backup.env
sudo tee /etc/bozkir-backup.env > /dev/null <<EOF
RESTIC_REPOSITORY=sftp:backup@VPS2_IP:/srv/bozkir-backup
RESTIC_PASSWORD=<güçlü parola>
ALERT_WEBHOOK_URL=<opsiyonel bildirim webhook'u>
EOF
sudo chmod 600 /etc/bozkir-backup.env
```

### 11.2 Zamanlanmış görevler

```bash
crontab -l > /tmp/cron.bak 2>/dev/null; cat /tmp/cron.bak
crontab -l 2>/dev/null | cat - deploy/crontab.example | crontab -
crontab -l     # üç satır (gece yedeği, aylık restore tatbikatı, günlük health) görünmeli
```

### 11.3 Manuel yedek ve geri yükleme testi

```bash
cd /opt/bozkir-web/bozkir-next
./scripts/backup.sh                      # tam yedek + PITR base backup
./scripts/verify-backup.sh               # geçici DB'ye geri yükleyip satır sayılarını doğrular
```

Beklenen: `verify-backup.sh` ürün/kategori/teklif sayılarını ve "restore başarılı" mesajını verir.

---

## 12. İzleme

```bash
docker compose --profile monitoring up -d
```

- Uptime Kuma: `http://127.0.0.1:3001` (yalnızca localhost — dışarıdan erişmek için
  SSH tüneli kullanın: `ssh -L 3001:127.0.0.1:3001 bozkir@VPS_IP`)
- İzlenecek uç: `http://app:3000/api/health?deep=1` (Kuma container ağından)
- Alarm: e-posta veya webhook; ayrıca cron'daki günlük health kontrolü yedektir.

Disk ve yük takibi:

```bash
df -h / && docker system df
docker compose logs --tail=100 app
```

---

## 13. Cloudflare proxy (opsiyonel ama önerilir)

Cloudflare'ın turuncu bulut (proxy) modu DDoS koruması ve CDN sağlar; **ancak**
doğru yapılandırılmazsa IP tabanlı hız sınırı bozulur (tüm istekler tek IP gibi
görünür) ve `Secure` çerez bozulabilir.

1. DNS'te `A` kayıtlarını turuncu buluta alın.
2. SSL/TLS modu: **Full (strict)**.
3. `deploy/nginx.docker.tls.conf` içindeki **kapalı** `set_real_ip_from` bloklarını
   açın; IP aralıklarını güncel listelerden alın:
   <https://www.cloudflare.com/ips-v4> ve <https://www.cloudflare.com/ips-v6>
   `real_ip_header CF-Connecting-IP;` satırı da açık olmalıdır.
4. nginx'i yeniden yükleyin ve doğrulayın:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t
   docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
   ```

Kontrol: `/admin/teklifler` → bir teklif kaydının "IP" alanında gerçek ziyaretçi IP'si
görünmeli; Cloudflare IP'si (104.x, 172.64.x) görünüyorsa real-IP yapılandırması eksiktir.

---

## 14. Go-live kontrol listesi

Yayına almadan önce hepsini işaretleyin:

- [ ] `dig +short bozkiragac.com` VPS IP'sini veriyor
- [ ] `curl -I https://bozkiragac.com/` → `200` ve `Strict-Transport-Security` var
- [ ] `http://` isteği `301` ile `https://`e gidiyor
- [ ] `/api/health?deep=1` → `db`, `storage`, `image` = ok
- [ ] Admin parolası **değiştirildi** (varsayılan değil)
- [ ] Admin 2FA (TOTP) etkin
- [ ] `.env` / `.env.local` içinde güçlü `POSTGRES_PASSWORD` ve `AUTH_SECRET`
- [ ] `SITE_URL` = `https://bozkiragac.com` (canonical/sitemap/OG doğru)
- [ ] Turnstile anahtarları tanımlı ve teklif formunda **gerçekten** görünüyor
- [ ] SMTP + `notifyEmail` (veya webhook) ayarlı; test e-postası geldi
- [ ] Gerçek kampanya + görsel eklendi, popup doğru çıkıyor
- [ ] Tüm ana sayfalar ve ürün/kategori sayfaları 200 (kırık görsel yok)
- [ ] `crontab -l` yedek satırlarını içeriyor; `verify-backup.sh` başarılı
- [ ] Off-site yedeği yapılandırıldı ve bir kez çalıştı
- [ ] Uptime Kuma alarmı test edildi
- [ ] `npm run media:audit` çalıştırıldı: 0 eksik referans, 0 kullanılmayan dosya
- [ ] Ürün kodu **seri kodu** olarak doğrulandı (tekil olması beklenmez, örn. `PVC KENAR` → `PVC`); tekillik yerine `(kategori + kod + ad)` üçlüsü kontrol ediliyor
- [ ] Aynı `(kategori + kod + ad)` üçlüsünü tekrar eden kazara çift kayıt yok
- [ ] Eski PHP host yedek olarak duruyor (rollback için birkaç gün)

---

## 15. Geri alma (rollback)

**Kod rollback'i (sürümlü imaj):**

```bash
cd /opt/bozkir-web/bozkir-next
git log --oneline -5
APP_TAG=<önceki-commit-sha> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d app
```

**Veritabanı geri alma:**

```bash
ls -lt backups/ | head                 # yedek klasörünü seçin
docker cp bozkir-next-db-1:/tmp/db.dump /tmp/db.dump
cat backups/<TARIH>/db.dump | docker exec -i bozkir-next-db-1 psql -U bozkir -d bozkir -c 'DROP DATABASE bozkir WITH (FORCE);' >/dev/null
# Sıfırdan kurulum gerektiğinde: yeni volume ile postgres'i başlatıp dump'u yükleyin
```

**Tüm yığını geri alma:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml down`
(veri volume'ları silinmez; `down -v` kullanmayın — yedekleri de siler).

---

## 16. Bakım rutini

```bash
# Güncelleme
cd /opt/bozkir-web && git pull && cd bozkir-next
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
curl -fsS https://bozkiragac.com/api/health?deep=1

# Sertifika durumu
sudo certbot certificates

# Disk / yedek
df -h /
ls -lt backups/ | head
docker image prune -f            # eski imajları temizler (rollback imajını silmeyin)
```

**Aylık:** `verify-backup.sh` çıktısını kontrol edin, `docker system df` ile diski
kontrol edin, admin parolasını rotasyona alın.

---

## Hızlı referans

| İşlem | Komut |
|---|---|
| Başlat (TLS) | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` |
| Yeniden derle | `... up -d --build app` |
| Loglar | `docker compose logs -f --tail=200 app` |
| Health | `curl -fsS https://bozkiragac.com/api/health?deep=1` |
| DB yedeği | `./scripts/backup.sh` |
| Yedek testi | `./scripts/verify-backup.sh` |
| Certbot test | `sudo certbot renew --dry-run` |
| nginx config test | `docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t` |
| Bakım modu | `.env`'de `MAINTENANCE_MODE=1` → `up -d app` (geri almak için `0`) |