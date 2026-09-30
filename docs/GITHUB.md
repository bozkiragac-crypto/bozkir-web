# GitHub Kurulumu (private repo + CI/CD)

Repo: `git@github.com:bozkiragac-crypto/bozkir-web.git` (private).

## 1. İlk push

Sırlar repoya girmez (`.env.local` ignore). SSH ile:

```bash
cd bozkir-web
git remote -v            # origin doğru mu?
git push -u origin main
```

> İlk push, SSH anahtarınızın GitHub hesabına ekli olmasını gerektirir
> (GitHub → Settings → SSH and GPG keys → New SSH key).

## 2. CI (otomatik)

`.github/workflows/ci.yml` → her `main` push ve PR'da:
lint → typecheck → unit (Vitest) → build → E2E (Playwright + Postgres servis).

CI, `services.postgres` ile geçici bir veritabanı kullanır; test verisi izoledir.

## 3. CD — VPS'e otomatik dağıtım

`.github/workflows/deploy.yml` → `main` push'ta VPS'e SSH ile bağlanır,
`git reset --hard origin/main` + `docker compose up -d --build` + healthcheck.

### Gerekli GitHub Actions Secrets
`Repository → Settings → Secrets and variables → Actions → New repository secret`

| Secret | Açıklama | Örnek |
| --- | --- | --- |
| `VPS_HOST` | VPS IP / alan adı | `203.0.113.10` |
| `VPS_USER` | SSH kullanıcısı | `deploy` |
| `VPS_SSH_KEY` | Özel anahtar (PEM, çok satırlı) | `-----BEGIN OPENSSH...` |
| `VPS_PORT` | SSH portu (opsiyonel) | `22` |
| `VPS_PATH` | Repo'nun VPS'teki yolu | `/opt/bozkir-web` |

### VPS'te ön koşullar
1. Docker + Compose kurulu.
2. Repo bir kez klonlu: `git clone git@github.com:bozkiragac-crypto/bozkir-web.git /opt/bozkir-web`
3. `bozkir-next/.env` ve `bozkir-next/.env.local` doldurulmuş (git dışı).
4. İlk kurulum: `docker compose up -d --build` + `npm run db:migrate` + `npm run storage:init` + `npm run admin:reset -- <kullanıcı> <şifre>`.

### Deploy kullanıcısı için SSH anahtarı
GitHub Actions'ın kullandığı anahtarın VPS'te yetkili olması gerekir:

```bash
# VPS'te deploy kullanıcısı için
mkdir -p ~/.ssh && chmod 700 ~/.ssh
# GitHub Actions private key'in public eşini authorized_keys'e ekle
echo "<public-key>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 4. Branch protection (önerilen)

`Settings → Branches → Add rule` → `main`:
- Require a pull request before merging
- Require status checks: **CI / Lint · Typecheck · Unit**, **CI / Build**
- Require branches to be up to date

## 5. Notlar

- `deploy.yml`'de `needs` ile CI'ya bağlamak için job adlarını kullanın; ilk sürümde
  bağımsız çalışır (hız için). İsterseniz `needs: [quality, build]` ekleyin.
- Rollback: VPS'te `git reset --hard <eski-sha> && docker compose up -d --build`.
- Sırlar yalnızca GitHub Secrets ve VPS `.env` dosyalarında tutulur.
