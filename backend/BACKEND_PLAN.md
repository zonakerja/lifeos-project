# LifeOS Backend Plan

## Rekomendasi Tech Stack

Backend yang paling selaras untuk project ini:

- Runtime: Node.js 22 LTS
- Framework: NestJS atau Fastify
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT access token + refresh token, password hash memakai Argon2
- Validation: Zod atau class-validator, pilih satu konsisten
- File upload: object storage S3-compatible untuk attachment, database hanya menyimpan metadata
- API style: REST v1 terlebih dahulu, OpenAPI sebagai contract resmi

Pilihan utama saya: NestJS + Prisma + PostgreSQL. Alasannya, domain LifeOS sudah besar dan berlapis: users, planner, notes, PARA, file control, archive references, borrowing/disposition/move logs. NestJS memberi struktur module/service/controller yang rapi sejak awal, sementara Prisma cocok untuk migrasi schema dan relasi data.

Alternatif lebih ringan: Fastify + Prisma + Zod. Ini bagus jika ingin backend kecil dan cepat, tetapi perlu disiplin ekstra untuk menjaga module boundary.

## Domain Boundary

Data frontend saat ini masih tersimpan di localStorage. Backend sebaiknya memigrasikan key berikut menjadi resource server-side:

- `lifeos-users`, `lifeos-user`, `lifeos-app-settings`
- `lifeos-routines`, `lifeos-schedules`, `lifeos-todos`, `lifeos-completions`, `lifeos-types`
- `lifeos-freenotes`, `lifeos-ainotes`, `lifeos-lists`
- `lifeos-para-projects`, `lifeos-para-areas`, `lifeos-para-tasks`, `lifeos-para-activities`, `lifeos-para-resources`, `lifeos-para-archives`
- `lifeos-archive-classifications`, `lifeos-archive-jra`, `lifeos-archive-physical`
- `lifeos-archive-borrowings`, `lifeos-archive-dispositions`, `lifeos-archive-movelogs`

Prinsip desain:

- Semua entity memiliki `id`, `userId`, `createdAt`, `updatedAt`.
- Super admin boleh membaca lintas user; role lain hanya membaca data miliknya.
- Data archive dan file-control perlu audit log karena ada status, perpindahan, peminjaman, dan disposisi.
- Frontend tetap bisa memakai shape data yang sama pada tahap migrasi awal agar user flow tidak berubah.

## Draft API Contract

Base path: `/api/v1`

### Auth

- `POST /auth/login`
  - body: `{ "email": "admin@lifeos.com", "password": "..." }`
  - response: `{ "user": User, "accessToken": "...", "refreshToken": "..." }`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`

### App Settings and Users

- `GET /settings/app`
- `PATCH /settings/app`
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Planner

- `GET /agenda-types`
- `POST /agenda-types`
- `PATCH /agenda-types/:id`
- `DELETE /agenda-types/:id`
- `GET /routines?from=YYYY-MM-DD&to=YYYY-MM-DD&archived=false`
- `POST /routines`
- `PATCH /routines/:id`
- `POST /routines/:id/freeze-periods`
- `DELETE /routines/:id/freeze-periods/:freezeId`
- `GET /schedules?from=YYYY-MM-DD&to=YYYY-MM-DD&type=Meeting`
- `POST /schedules`
- `PATCH /schedules/:id`
- `DELETE /schedules/:id`
- `GET /todos?date=YYYY-MM-DD&completed=false`
- `POST /todos`
- `PATCH /todos/:id`
- `DELETE /todos/:id`
- `PUT /completions/:routineId/:date`

### Notes

- `GET /notes/free`
- `POST /notes/free`
- `PATCH /notes/free/:id`
- `DELETE /notes/free/:id`
- `GET /notes/ai`
- `POST /notes/ai`
- `PATCH /notes/ai/:id`
- `DELETE /notes/ai/:id`
- `GET /lists`
- `POST /lists`
- `PATCH /lists/:id`
- `DELETE /lists/:id`

### PARA Productivity

- `GET /para/projects`
- `POST /para/projects`
- `PATCH /para/projects/:id`
- `DELETE /para/projects/:id`
- `GET /para/areas`
- `POST /para/areas`
- `PATCH /para/areas/:id`
- `DELETE /para/areas/:id`
- `GET /para/tasks?projectId=...&status=...`
- `POST /para/tasks`
- `PATCH /para/tasks/:id`
- `DELETE /para/tasks/:id`
- `GET /para/activities`
- `POST /para/activities`
- `PATCH /para/activities/:id`
- `DELETE /para/activities/:id`
- `GET /para/resources`
- `POST /para/resources`
- `PATCH /para/resources/:id`
- `DELETE /para/resources/:id`
- `GET /para/archives`
- `POST /para/archives`
- `PATCH /para/archives/:id`
- `DELETE /para/archives/:id`

### File Control and Archives

- `GET /archive/classifications`
- `POST /archive/classifications`
- `PATCH /archive/classifications/:id`
- `DELETE /archive/classifications/:id`
- `GET /archive/jra`
- `POST /archive/jra`
- `PATCH /archive/jra/:id`
- `DELETE /archive/jra/:id`
- `GET /archive/physical-references`
- `POST /archive/physical-references`
- `PATCH /archive/physical-references/:id`
- `DELETE /archive/physical-references/:id`
- `GET /archive/borrowings?archiveId=...`
- `POST /archive/borrowings`
- `PATCH /archive/borrowings/:id`
- `GET /archive/dispositions?archiveId=...`
- `POST /archive/dispositions`
- `GET /archive/move-logs?archiveId=...`
- `POST /archive/move-logs`

### AI and Attachments

- `POST /ai/summarize`
- `POST /ai/extract-resource`
- `POST /uploads`
- `GET /uploads/:id`

AI endpoint sebaiknya hanya menerima prompt/data dari user yang sedang login. API key provider AI tidak disimpan di frontend; simpan terenkripsi di backend per user atau pakai environment variable server.

## Migration Plan

1. Buat schema database dari shape localStorage yang ada.
2. Implement auth dan user isolation terlebih dahulu.
3. Tambahkan endpoint read/write untuk domain planner, notes, PARA, lalu file-control.
4. Tambahkan adapter frontend `apiClient` yang bisa fallback ke localStorage selama migrasi.
5. Jalankan migrasi data localStorage ke backend lewat endpoint import satu kali.
6. Baru setelah contract stabil, matikan write ke localStorage.

