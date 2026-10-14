#!/usr/bin/env bash
#
# Bozkır Ağaç — VPS bootstrap (Ubuntu 24.04 LTS, tek seferlik).
#
# Ne yapar: apt güncellemesi, güvenlik paketleri, UFW (22/80/443), 2 GB swap,
#           otomatik güvenlik güncellemeleri, journald log limiti, resmi Docker
#           repo + compose plugin, `bozkir` kullanıcısı (sudo + docker grubu).
#
# Kullanım (root olarak):
#   sudo bash deploy/vps-bootstrap.sh
#
# Idempotent: tekrar çalıştırılabilir; var olan kurulumu bozmaz.
set -euo pipefail

USER_NAME="${BOZKIR_USER:-bozkir}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m!!\033[0m %s\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Bu script root olarak çalıştırılmalı: sudo bash deploy/vps-bootstrap.sh" >&2
  exit 1
fi

if ! grep -qi 'ubuntu' /etc/os-release; then
  warn "Ubuntu dışı bir sistem algılandı; adımlar Ubuntu varsayımıyla ilerliyor."
fi

log "1/8 Paket listesi güncelleniyor ve sistem yükseltiliyor..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get full-upgrade -y
apt-get install -y git curl ca-certificates gnupg openssl ufw restic unattended-upgrades

log "2/8 '$USER_NAME' kullanıcısı hazırlanıyor..."
if id "$USER_NAME" >/dev/null 2>&1; then
  echo "  $USER_NAME zaten var."
else
  adduser --disabled-password --gecos "" "$USER_NAME"
  echo "  $USER_NAME oluşturuldu (parolasız; SSH anahtarı ekleyin)."
fi
usermod -aG sudo "$USER_NAME" || true
mkdir -p "/home/$USER_NAME/.ssh"
chmod 700 "/home/$USER_NAME/.ssh"
touch "/home/$USER_NAME/.ssh/authorized_keys"
chmod 600 "/home/$USER_NAME/.ssh/authorized_keys"
chown -R "$USER_NAME:$USER_NAME" "/home/$USER_NAME/.ssh"
warn "SSH public anahtarınızı ekleyin: /home/$USER_NAME/.ssh/authorized_keys"
warn "Test ettikten SONRA root girişini kapatın (aşağıdaki komut dosya sonunda)."

log "3/8 Güvenlik duvarı (UFW) yapılandırılıyor..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  comment 'SSH'
ufw allow 80/tcp  comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

log "4/8 Swap ($SWAP_SIZE) hazırlanıyor..."
if swapon --show | grep -q '/swapfile'; then
  echo "  swapfile zaten aktif."
else
  fallocate -l "$SWAP_SIZE" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "  swapfile etkinleştirildi."
fi

log "5/8 Otomatik güvenlik güncellemeleri..."
dpkg-reconfigure -plow unattended-upgrades || true
systemctl enable --now unattended-upgrades || true

log "6/8 journald log limiti (200M)..."
mkdir -p /etc/systemd/journald.conf.d
printf '[Journald]\nSystemMaxUse=200M\n' > /etc/systemd/journald.conf.d/size.conf
systemctl restart systemd-journald || true

log "7/8 Docker Engine + Compose plugin (resmi repo)..."
if command -v docker >/dev/null 2>&1; then
  echo "  docker zaten kurulu: $(docker --version)"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
usermod -aG docker "$USER_NAME"
systemctl enable --now docker

log "8/8 Docker log rotasyonu (daemon.json)..."
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
  systemctl restart docker
  echo "  daemon.json yazıldı ve docker yeniden başlatıldı."
else
  echo "  /etc/docker/daemon.json zaten var; dokunulmadı."
fi

log "Bitti. Sonraki adımlar:"
cat <<EOF

  1) SSH anahtarını ekleyip test edin:
       ssh $USER_NAME@<VPS_IP>
  2) Root girişini kapatın:
       sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
       systemctl reload ssh
  3) Kodu çekin ve yayına alın:
       sudo mkdir -p /opt/bozkir-web && sudo chown \$USER:\$USER /opt/bozkir-web
       git clone <REPO_URL> /opt/bozkir-web
       cd /opt/bozkir-web/bozkir-next
       bash deploy/go-live.sh bozkiragac.com

  NOT: DNS (A kayıtları: @ ve www -> VPS IP) hazır olmadan TLS adımı çalışmaz.
EOF
