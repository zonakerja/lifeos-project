# Dokumentasi Setup Lengkap - LifeOS (Local to VPS)

Dokumen ini berisi panduan langkah demi langkah untuk membangun lingkungan lokal (_local environment_) aplikasi LifeOS hingga siap untuk di-_deploy_ ke VPS menggunakan Docker.

**Stack Teknologi:**

- **Frontend:** React (Vite), Tailwind CSS v4, Lucide React
- **Backend:** Express.js, Node.js _(Akan datang)_
- **Database & ORM:** PostgreSQL, Prisma _(Akan datang)_
- **Deployment:** Docker _(Akan datang)_

---

## BAGIAN 1: SETUP FRONTEND (REACT + TAILWIND V4)

Bagian ini bertujuan untuk menjalankan antarmuka pengguna (UI) LifeOS di komputer lokal. Pastikan **Node.js** sudah terinstal di komputer Anda.

### Langkah 1.1: Membuat Proyek Vite

Buka terminal/Command Prompt dan arahkan ke folder utama proyek Anda.

1. Buat kerangka proyek React bernama `frontend`:
   `npm create vite@latest frontend -- --template react`
2. Masuk ke dalam folder yang baru dibuat:
   `cd frontend`
3. Instal semua dependensi bawaan:
   `npm install`

### Langkah 1.2: Menginstal Tailwind CSS & Ikon Lucide

Pastikan posisi terminal Anda saat ini berada di dalam folder `frontend`.

1. Instal Tailwind CSS versi terbaru beserta plugin Vite:
   `npm install tailwindcss @tailwindcss/vite`
2. Instal pustaka ikon Lucide:
   `npm install lucide-react`

### Langkah 1.3: Konfigurasi Tailwind di Vite

1. Buka folder `frontend` menggunakan _code editor_ (seperti VS Code).
2. Buka file **`vite.config.js`** (di luar folder `src`).
3. Ganti seluruh isi file tersebut dengan kode berikut:

   ```javascript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import tailwindcss from "@tailwindcss/vite";

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```

### Langkah 1.4: Mengaktifkan Tailwind di CSS

1. Buka file **`src/index.css`**.
2. Hapus seluruh isi bawaan di dalam file tersebut.
3. Tambahkan baris kode berikut dan simpan (Save):

   ```css
   @import "tailwindcss";
   ```

### Langkah 1.5: Memasukkan Kode Aplikasi

1. Buka file **`src/App.jsx`**.
2. Hapus seluruh isi bawaan di dalam file tersebut.
3. _Paste_ (tempel) seluruh kode JSX yang sudah Anda buat ke dalam file ini.
4. Simpan file (`Ctrl + S`).

### Langkah 1.6: Menjalankan Frontend

1. Di terminal (pastikan masih di dalam folder `frontend`), ketik:
   `npm run dev`
2. Buka browser dan kunjungi tautan yang muncul (biasanya `http://localhost:5173/`).

---

## TIPS TAMBAHAN: MENGHAPUS ATAU MEMBERSIHKAN PROJECT

### 1) Hapus folder project (Paling umum)

Misalnya project kamu ada di `D:\App\life-planner`:

- **Via PowerShell:**
  ```bash
  cd D:\App
  Remove-Item -Recurse -Force .\life-planner
  ```
- **Via File Explorer:**
  Buka `D:\App` → klik kanan folder `life-planner` → Delete.

### 2) "Bersihkan" tanpa hapus source code

Kadang kamu cuma mau hapus hasil install (dependency) dan build cache:

- **Via PowerShell:**
  ```bash
  cd D:\App\life-planner
  Remove-Item -Recurse -Force .\node_modules
  Remove-Item -Recurse -Force .\dist
  Remove-Item -Force .\package-lock.json
  ```
- Lalu kalau mau install ulang:
  ```bash
  npm install
  ```

### 3) Putuskan project dari Git (Jika sudah git init)

Di dalam folder project:

- **Via PowerShell:**
  ```bash
  Remove-Item -Recurse -Force .\.git
  ```
