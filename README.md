# Bozkır Ağaç Ürünleri — Monorepo

Bu depo, Bozkır Ağaç Ürünleri web projesini barındırır.

| Yol | Açıklama |
| --- | --- |
| **`bozkir-next/`** | **Aktif uygulama.** Next.js 15 (App Router) + React 19 + PostgreSQL + SeaweedFS (S3). Site, yönetim paneli ve JSON/teklif API'si. |
| `docs/` | Dokümantasyon: kurulum, mimari, deploy, runbook. |
| `archive/` | Emekliye ayrılmış legacy içerik (eski PHP sitesi, dönüşüm araçları, ham görseller). Git tarafından **izlenmez**. Silinmez; gerekirse geri dönüş için tutulur. |

## Hızlı Başlangıç

```bash
cd bozkir-next
cp .env.docker.example .env            # compose değişkenleri
cp .env.production.example .env.local  # uygulama değişkenleri (değerleri doldur)
docker compose up -d --build
```

Ayrıntılı kurulum, mimari ve deployment: [`docs/README.md`](docs/README.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Ortamlar

- **Yerel geliştirme:** `bozkir-next/` + Docker (db + storage), `npm run dev`.
- **Üretim (VPS):** GitHub Actions → `main` push → VPS `git pull` + `docker compose up -d --build`.

## Notlar

- `archive/` ve tüm legacy dosyalar git dışıdır; ana depo bu sayede hafif kalır.
- Sırlar (`.env.local`) git'e girmez. VPS ve GitHub Actions için ayrı secret yönetimi kullanılır.
