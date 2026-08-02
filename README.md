# Inovamedika Technical Test Frontend

Nama: Izzan Alfadhil

Demo Aplikasi : [Link Video](https://drive.google.com/file/d/1ttAtMu3tkL0-QgwVQjgawfjuUHbtn-yF/view?usp=sharing)

---

## 📋 Daftar Isi
1. [Persyaratan Sistem](#1-persyaratan-sistem)
2. [Cara Instalasi Aplikasi](#2-cara-instalasi-aplikasi)
3. [Konfigurasi File .env](#3-konfigurasi-file-env)
4. [Cara Menjalankan Aplikasi](#4-cara-menjalankan-aplikasi)
5. [Akun Default untuk Testing](#5-akun-default-untuk-testing)
6. [Struktur Proyek](#6-struktur-proyek)
7. [Daftar Halaman & Hak Akses (Role)](#7-daftar-halaman--hak-akses-role)

---

## 1. Persyaratan Sistem
Sebelum memulai, pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi 18.x atau lebih baru
- **NPM**: Versi 9.x atau lebih baru
- **Backend API Inovamedika**: Sudah berjalan di `http://localhost:5000` (atau via container)
- **Docker & Docker Compose** *(Opsional, jika ingin menjalankan via container Nginx)*

---

## 2. Cara Instalasi Aplikasi

1. Buka terminal dan arahkan ke direktori frontend:
   ```bash
   cd inovamedika-frontend
   ```

2. Pasang seluruh dependensi yang diperlukan:
   ```bash
   npm install
   ```

---

## 3. Konfigurasi File `.env`

Buat file baru bernama `.env` di dalam root direktori `inovamedika-frontend` (atau salin dari `.env.example`):

```bash
cp .env.example .env
```

### Penjelasan Variabel Environment

| Variabel | Default (Lokal) | Default (Docker/Prod) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000/api` | `/api` | Base URL endpoint REST API backend Express |

### Contoh Isi File `.env` (Local Development):
```env
VITE_API_URL=http://localhost:5000/api
```

> **Catatan:** Jika dijalankan menggunakan Docker Compose, Nginx secara otomatis mem-proxy request `/api` ke backend service, sehingga `VITE_API_URL` akan diset menjadi `/api` saat build time.

---

## 4. Cara Menjalankan Aplikasi

### A. Menjalankan Secara Lokal (Development Server)

1. Pastikan server backend telah berjalan di port `5000`.
2. Jalankan development server frontend dengan hot-reload:
   ```bash
   npm run dev
   ```
3. Buka browser di: **`http://localhost:5173`**

---

### B. Build untuk Produksi & Preview

1. Melakukan kompilasi aset statis (HTML, CSS, JS):
   ```bash
   npm run build
   ```
2. Menguji hasil build secara lokal:
   ```bash
   npm run preview
   ```

---

### C. Menjalankan Menggunakan Docker & Docker Compose

Jika ingin menjalankan frontend dalam container Nginx secara mandiri:

```bash
# Di dalam direktori inovamedika-frontend:
docker compose up --build -d
```

Frontend akan berjalan dan dapat diakses di: **`http://localhost` (Port 80)**. Nginx akan otomatis mem-proxy panggilan API ke backend di host machine.

Untuk menghentikan container:
```bash
docker compose down
```

---

## 5. Akun Default untuk Testing

Setelah database diisi data awal (`seed`), akun-akun berikut dapat langsung digunakan untuk login:

| Role | Username | Password | Keterangan Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `password123` | Akses penuh: Manajemen Pengguna/Dokter, Dashboard Statistik |
| **Doctor** | `budi` | `password123` | Dr. Budi Santoso, Sp.PD (Pemeriksaan Pasien Hari Ini, Rekam Medis) |
| **Doctor** | `siti` | `password123` | Dr. Siti Nurhaliza, Sp.A |
| **Doctor** | `hendra` | `password123` | Dr. Hendra Wijaya, Sp.JP |
| **Registrator** | `registrator1` | `password123` | Petugas Pendaftaran (Pasien, Janji Temu, Antrean & Display Antrean) |
| **Registrator** | `registrator2` | `password123` | Petugas Pendaftaran |

---

## 6. Struktur Proyek

Aplikasi frontend mengadopsi struktur modular berbasis komponen dan routing yang rapi:

```
inovamedika-frontend/
├── public/                     # Aset statis publik
├── src/
│   ├── assets/                 # Gambar, ikon, dan styling pendukung
│   ├── components/             # Komponen UI Reusable
│   │   ├── Layout.jsx          # Shell aplikasi: Sidebar, Header, dan Kontainer Konten
│   │   ├── Pagination.jsx      # Kontrol pagination interaktif
│   │   └── ProtectedRoute.jsx  # Route guard berbasis autentikasi JWT dan Role
│   ├── config/
│   │   └── api.js              # Sentralisasi konfigurasi API_BASE endpoint
│   ├── contexts/
│   │   └── AuthContext.jsx     # State autentikasi global (user, token, login, logout)
│   ├── pages/                  # Halaman-halaman aplikasi
│   │   ├── LoginPage.jsx               # Halaman Login
│   │   ├── DashboardPage.jsx           # Dashboard Statistik & Manajemen User (Admin)
│   │   ├── PatientsPage.jsx            # Kelola Pasien (Registrator, Doctor, Admin)
│   │   ├── PatientDetailsPage.jsx      # Detail Profil Pasien & Riwayat Kunjungan
│   │   ├── AppointmentsPage.jsx        # Kelola Janji Temu & Pendaftaran
│   │   ├── QueueManagementPage.jsx     # Panggilan Antrean & Nomor Antrean Pasien
│   │   ├── QueueDashboardPage.jsx      # Layar Display Antrean Real-time
│   │   ├── AssessmentPage.jsx          # Ruang Pemeriksaan Dokter & Input Rekam Medis
│   │   ├── MedicalRecordsPage.jsx      # Daftar Riwayat Rekam Medis
│   │   └── MedicalRecordDetailPage.jsx # Detail Lengkap Rekam Medis & Resep Obat
│   ├── App.jsx                 # Definisi Routing utama (React Router)
│   ├── App.css                 # Custom styling aplikasi
│   ├── index.css               # Tailwind CSS entry & konfigurasi font
│   └── main.jsx                # Entrypoint React DOM
├── index.html                  # HTML entry template
├── nginx.conf                  # Konfigurasi Nginx untuk SPA routing & reverse proxy API
├── Dockerfile                  # Multi-stage build (Vite + Nginx Alpine)
├── docker-compose.yml          # Orchestrasi Docker untuk Frontend
├── .env.example                # Template variabel environment
├── vite.config.js              # Konfigurasi Vite & Tailwind plugin
└── package.json                # Dependensi dan skrip proyek
```

---

## 7. Daftar Halaman & Hak Akses (Role)

| Halaman | URL Route | Hak Akses (Role) | Deskripsi Fitur |
| :--- | :--- | :--- | :--- |
| **Login** | `/login` | Publik | Autentikasi pengguna & penyimpanan token JWT |
| **Dashboard Admin** | `/dashboard` | Admin | Statistik sistem, CRUD akun pengguna, dan switch status akun aktif/nonaktif |
| **Pasien** | `/patients` | Admin, Registrator, Doctor | Pencarian server-side, tambah, edit, hapus pasien, dan pagination |
| **Detail Pasien** | `/patients/:id` | Admin, Registrator, Doctor | Informasi lengkap pasien & rekam medis terkait |
| **Janji Temu** | `/appointments` | Admin, Registrator, Doctor | Pembuatan jadwal kunjungan, filter tanggal, dan pencarian |
| **Kelola Antrean** | `/queue-management` | Admin, Registrator | Generate nomor antrean otomatis, panggil pasien, dan update status antrean |
| **Display Antrean** | `/queue-dashboard` | Semua (Publik/Klinik) | Layar display nomor antrean yang sedang dipanggil dan statistik harian |
| **Pemeriksaan Dokter** | `/assessment` | Doctor | Daftar pasien hari ini, riwayat pasien, form rekam medis, dan resep obat |
| **Rekam Medis** | `/medical-records` | Admin, Doctor | Daftar seluruh rekam medis dengan pencarian multi-halaman & filter dokter |
| **Detail Rekam Medis** | `/medical-records/:id` | Admin, Doctor | Tampilan detail rekam medis, keluhan, diagnosa, tindakan, & daftar resep obat |
