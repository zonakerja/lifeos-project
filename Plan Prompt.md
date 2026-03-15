Tugas: Refactoring UI Frontend LifeOS.
Konteks: File src/App.jsx saya saat ini sangat panjang. Saya ingin memecahnya menjadi komponen-komponen yang lebih kecil agar mudah dikelola.
Instruksi:

1. Baca seluruh isi file src/App.jsx.
2. Buat folder baru di src/components.
3. Ekstrak bagian Sidebar dan Header menjadi file terpisah (Sidebar.jsx dan Header.jsx) di dalam folder komponen tersebut.
4. Ganti kode yang panjang di App.jsx dengan memanggil komponen yang baru dibuat tersebut.
5. Pastikan semua state, props, dan import Tailwind/Lucide tetap terhubung dan berfungsi normal tanpa ada error di browser.

Tugas: Memisahkan Halaman (Pages).
Instruksi:

1. Buat folder baru di src/pages.
2. Tolong ekstrak bagian antarmuka "File Control", "Planner", dan "Notes Space" dari App.jsx menjadi file komponen masing-masing di dalam folder pages.
3. Atur navigasi sementaranya agar saat menu di Sidebar diklik, halaman yang sesuai akan dirender di area konten utama.
4. Jalankan pengujian di browser menggunakan fitur Browser Use untuk memastikan pergantian halamannya mulus.

Tugas: Inisialisasi Backend Node.js dan Express.
Instruksi:

1. Buat folder bernama 'backend' di root direktori proyek (sejajar dengan folder frontend).
2. Masuk ke folder backend, lalu inisialisasi npm dengan perintah `npm init -y`.
3. Instal dependency berikut: express, cors, dan dotenv.
4. Instal dependency development: nodemon.
5. Buat file server.js di dalam folder backend.
6. Tuliskan kode dasar Express server yang berjalan di port 5000, aktifkan middleware cors, dan buat satu route GET '/' yang mengembalikan pesan JSON: { message: "LifeOS Backend API berjalan lancar" }.
7. Tambahkan script "dev": "nodemon server.js" di dalam package.json backend.

Tugas: Setup PostgreSQL menggunakan Docker.
Instruksi:

1. Buat file docker-compose.yml di root direktori proyek.
2. Konfigurasikan service untuk database PostgreSQL versi 15.
3. Atur environment variables untuk POSTGRES_USER, POSTGRES_PASSWORD, dan POSTGRES_DB (gunakan nama lifeos_db).
4. Mapping port 5432 ke 5432, dan atur volume agar data tidak hilang saat container mati.
5. use context7: berikan saya perintah terminal yang tepat untuk menjalankan file docker-compose ini di latar belakang.

Tugas: Inisialisasi Prisma ORM.
Instruksi:

1. Masuk ke folder backend.
2. Instal prisma sebagai dev dependency dan @prisma/client.
3. Jalankan perintah inisialisasi Prisma.
4. Perbarui file .env di folder backend dengan DATABASE_URL yang sesuai dengan konfigurasi PostgreSQL di docker-compose.yml kita.
5. use context7: pastikan langkah instalasi dan inisialisasi Prisma ini sesuai dengan dokumentasi resmi terbaru.

Tugas: Membuat Skema Database LifeOS.
Konteks: Saya butuh tabel untuk menyimpan data dokumen di fitur "File Control".
Instruksi:

1. Buka file prisma/schema.prisma di folder backend.
2. Buat sebuah model bernama `Document`.
3. Tambahkan kolom-kolom berikut:
   - id (UUID, primary key)
   - title (String)
   - category (String, misalnya untuk kategori 'Gantung', 'Fisik', 'Digital')
   - createdAt (DateTime, default now)
   - updatedAt (DateTime)
4. use context7: pastikan sintaks penulisan model Prisma ini benar.
5. Setelah selesai menulis skema, berikan saya instruksi terminal (prisma migrate) untuk mendorong skema ini ke dalam database PostgreSQL yang sedang berjalan di Docker.

Tugas: Membuat Endpoint CRUD (Create, Read, Update, Delete) untuk Dokumen.
Instruksi:

1. Buka file backend/server.js.
2. Import Prisma Client dan inisialisasi.
3. Buat route POST '/api/documents' untuk menerima data dari frontend dan menyimpannya ke database menggunakan Prisma.
4. Buat route GET '/api/documents' untuk mengambil semua data dokumen dari database.
5. Buat route DELETE '/api/documents/:id' untuk menghapus dokumen berdasarkan ID.
6. Berikan komentar kode yang jelas pada setiap route (dalam Bahasa Indonesia) agar saya bisa memahaminya saat belajar nanti.

Tugas: Membuat Endpoint CRUD (Create, Read, Update, Delete) untuk Dokumen.
Instruksi:

1. Buka file backend/server.js.
2. Import Prisma Client dan inisialisasi.
3. Buat route POST '/api/documents' untuk menerima data dari frontend dan menyimpannya ke database menggunakan Prisma.
4. Buat route GET '/api/documents' untuk mengambil semua data dokumen dari database.
5. Buat route DELETE '/api/documents/:id' untuk menghapus dokumen berdasarkan ID.
6. Berikan komentar kode yang jelas pada setiap route (dalam Bahasa Indonesia) agar saya bisa memahaminya saat belajar nanti.

# PANDUAN PENGATURAN & TIPS GOOGLE ANTIGRAVITY (PROJECT LIFEOS)

Dokumen ini berisi kumpulan instruksi untuk memaksimalkan editor Google Antigravity, mengatur agen AI, dan memasang alat bantu agar proses coding lebih mudah bagi non-programmer.

---

## BAGIAN 1: PENGATURAN EDITOR BAWAAN

### 1. Mengaktifkan "Format on Save" (Otomatis Rapi)

Agar kode yang berantakan langsung tersusun rapi saat disimpan:

1. Tekan `Ctrl + ,` (atau `Cmd + ,` di Mac) untuk membuka Settings.
2. Ketik `Format on Save` di kolom pencarian.
3. Beri centang pada opsi **Editor: Format on Save**.

### 2. Mengatur Prettier sebagai Default Formatter

Pastikan ekstensi **Prettier - Code formatter** sudah diinstal.

1. Buka Settings (`Ctrl + ,`).
2. Ketik `Default Formatter`.
3. Pilih **Prettier - Code formatter** dari menu _dropdown_.

### 3. Mengaktifkan "Linked Editing" (Otomatis Ubah Tag Penutup)

Pengganti ekstensi Auto Rename Tag yang lebih ringan:

1. Buka Settings (`Ctrl + ,`).
2. Ketik `Linked Editing`.
3. Beri centang pada opsi **Editor: Linked Editing**.

---

## BAGIAN 2: EKSTENSI (PLUGINS) YANG WAJIB DIINSTAL

Buka tab **Extensions** di bilah kiri (ikon kotak-kotak) dan instal:

- **Tailwind CSS IntelliSense:** Memberikan saran otomatis nama kelas warna dan ukuran Tailwind.
- **Error Lens:** Menampilkan pesan error langsung di baris kode yang salah (tanpa perlu disorot mouse).
- **Prisma:** (Untuk persiapan Backend) Memberikan warna dan saran kode otomatis untuk file database `.prisma`.
- **Docker:** Memudahkan pemantauan _container_ database PostgreSQL yang berjalan di lokal.

---

## BAGIAN 3: MENGATUR "OTAK" AGEN AI

### 1. Membuat Aturan Kerapian (Rules)

Agar agen AI mengikuti gaya kode Anda dan tidak merusak indentasi:

1. Di folder utama proyek (`lifeos-project`), buat folder bernama `.agent`.
2. Di dalam `.agent`, buat folder `rules`.
3. Di dalam `rules`, buat file `code-style-guide.md`.
4. Isi file tersebut dengan teks berikut:
   > - Selalu gunakan indentasi 2 spasi.
   > - Pastikan semua kode JSX dan struktur Tailwind disusun dengan rapi dan mudah dibaca.

### 2. Mencegah AI Mengubah Spasi Sembarangan

1. Buka Settings (`Ctrl + ,`).
2. Masuk ke tab **Agent**, lalu cari bagian **Automation**.
3. Hilangkan centang pada opsi **Agent Auto-Fix Lints**.

---

## BAGIAN 4: TIPS WORKFLOW & JALAN PINTAS (SHORTCUT)

### 1. Shortcut "Inline Command" (`Ctrl + I` / `Cmd + I`)

- **Fungsi:** Memerintah agen untuk mengubah spesifik pada satu blok kode atau menjalankan perintah terminal tanpa membuka panel chat utama.
- **Cara pakai:** Letakkan kursor di baris kode/terminal yang diinginkan, tekan `Ctrl + I`, lalu ketikkan instruksi singkat (misal: "ubah warna tombol ini menjadi merah").

### 2. Gunakan Mode "Planning" (Perencanaan)

- **Kapan digunakan:** Saat memberikan tugas besar (seperti memecah file 12.000 baris atau setup database).
- **Fungsi:** Agen tidak akan langsung menulis kode, melainkan membuat daftar rencana langkah demi langkah dan meminta persetujuan (Approve) dari Anda terlebih dahulu.

### 3. Pantau "Artifacts" (Hasil Visual)

- Jangan hanya membaca baris kode yang dihasilkan AI. Cek _Artifacts_ (tangkapan layar, diagram, atau rekaman _browser_) yang dihasilkan agen untuk memastikan tampilan UI (Frontend) sudah sesuai keinginan sebelum melanjutkan.

### 4. Buka "Agent Manager" (`Ctrl + E` / `Cmd + E`)

- Gunakan shortcut ini untuk berpindah ke layar manajemen agen, di mana Anda bisa melihat beberapa agen AI yang sedang mengerjakan tugas berbeda secara bersamaan di latar belakang.

### 5. Keamanan Terminal (Wajib "Auto")

- Agar agen AI tidak menjalankan perintah berbahaya di komputer Anda secara diam-diam: Buka pengaturan terminal agen, dan pastikan tersetel ke opsi **Auto**. Agen akan meminta izin (_permission_) Anda sebelum mengeksekusi perintah terminal baru.

### 6. Memanggil "Context7" (MCP)

- Jika Anda meminta agen membuat fitur yang membutuhkan dokumentasi terbaru (seperti integrasi API baru atau versi terbaru dari sebuah _library_), selalu akhiri _prompt_ (perintah) Anda dengan kalimat: `use context7`.
- Ini akan memaksa AI menarik referensi resmi dari internet sebelum menulis kodenya.
