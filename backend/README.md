# LifeOS Backend

Backend API untuk LifeOS menggunakan NestJS, Prisma, PostgreSQL, JWT auth, Argon2 password hashing, Redis queue, dan S3-compatible object storage untuk aset dokumen.

## Setup

1. Copy environment:

```bash
copy .env.example .env
```

2. Jalankan service Docker:

```bash
docker compose up -d
```

Service development:

- PostgreSQL: `localhost:55432`
- Redis: `localhost:6380`
- MinIO API: `http://localhost:9002`
- MinIO Console: `http://localhost:9003` (`lifeos` / `lifeos-secret`)

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Jalankan migration dan seed:

```bash
npm run prisma:migrate -- --name init
npm exec prisma db seed
```

5. Jalankan backend:

```bash
npm run dev
```

API berjalan di `http://localhost:4000/api/v1`.

Database Docker berjalan di `localhost:55432` agar tidak bentrok dengan PostgreSQL lokal pada port `5432`.
Docker Compose project memakai nama `lifeos`, dengan container `lifeos-postgres`, `lifeos-redis`, `lifeos-minio`, network `lifeos-network`, serta volume `lifeos-postgres-data`, `lifeos-redis-data`, dan `lifeos-minio-data`.

Frontend memakai API base URL default `http://localhost:4000/api/v1`. Jika perlu override, set `VITE_API_BASE_URL` di environment frontend.

## Default User

- Super Admin: `admin@lifeos.com` / `123`
- Viewer: `viewer@lifeos.com` / `123`

## Endpoint Awal

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/settings/app`
- `PATCH /api/v1/settings/app`
- `GET /api/v1/records/:type`
- `POST /api/v1/records/:type`
- `PATCH /api/v1/records/:id`
- `DELETE /api/v1/records/:id`
- `POST /api/v1/records/:type/bulk`
- `POST /api/v1/uploads`
- `GET /api/v1/uploads`
- `GET /api/v1/uploads/:id`
- `GET /api/v1/uploads/:id/metadata`
- `DELETE /api/v1/uploads/:id`

`records/:type` menerima enum dari Prisma, misalnya `routine`, `schedule`, `free_note`, `para_project`, `para_resource`, `archive_classification`, dan seterusnya.

## Penyimpanan Aset

Upload frontend tetap memakai `POST /api/v1/uploads`, tetapi file disimpan sebagai object di MinIO/S3-compatible storage. Metadata dokumen disimpan di tabel `Asset`, sedangkan hasil extraction disimpan di `AssetExtraction`.

Saat file masuk, backend membuat job `asset-extraction` di Redis/BullMQ. Untuk saat ini extraction sudah aktif untuk file teks (`text/*`, JSON, XML, YAML). Dokumen biner seperti PDF/DOCX sudah masuk repositori aset dan metadata, tetapi extractor kontennya bisa ditambahkan berikutnya tanpa mengubah flow upload frontend.
