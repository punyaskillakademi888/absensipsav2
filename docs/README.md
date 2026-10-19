# 📚 DOKUMENTASI SISTEM & EVOLUSI REFACTORING (SDLC)
## Aplikasi Presensi & Manajemen Magang PSA (Pusat Studi AI / Smart Creative)

Selamat datang di repositori dokumentasi resmi sistem **Absensi PSA**. Dokumen ini merangkum seluruh siklus hidup pengembangan (*Software Development Life Cycle* / SDLC), keputusan arsitektural, restrukturisasi kode (*code refactoring*), peningkatan fitur & adopsi pengguna, serta sistem jaminan kualitas (*Quality Assurance & E2E Testing*).

---

## 🧭 Navigasi Dokumen

Dokumentasi ini disusun secara modular berdasarkan tahapan SDLC:

| No | Dokumen | Deskripsi Inti |
|---|---|---|
| 1 | [**01. SDLC & Arsitektur Sistem**](./01_SDLC_DAN_ARSITEKTUR_SISTEM.md) | Tahapan siklus SDLC, arsitektur *Client-Server*, spesifikasi teknologi (React Vite, Node.js Express, MySQL), dan struktur skema data relasional. |
| 2 | [**02. Refactoring & Perbaikan Kode**](./02_REFACTORING_DAN_PERBAIKAN_KODE.md) | Catatan refactoring menyeluruh: penghapusan hardcode nama mentor, eliminasi polling loop / UI freeze, normalisasi query database, dan perbaikan konsistensi tipe TypeScript. |
| 3 | [**03. Peningkatan Fitur & UX Adopsi**](./03_PENINGKATAN_FITUR_DAN_UX_ADOPSI.md) | Pembaruan alur kerja nyata: pendekatan *Optimistic WFH*, filter cepat *"Perlu Perhatian"*, aksi 1-klik *"Alfakan WFH Liar"*, dan tombol *"Verifikasi Semua Hadir Normal"*. |
| 4 | [**04. Keamanan & Role Boundaries**](./04_KEAMANAN_DAN_ROLE_ACCESS.md) | Spesifikasi hak akses role (Admin, Mentor, Trainee), isolasi kejuruan (*scoping boundaries*), sanitasi input, proteksi reset data, dan audit trail. |
| 5 | [**05. QA & Pengujian Otomatis E2E**](./05_QA_DAN_PENGUJIAN_E2E.md) | Matriks 39 skenario pengujian otomatis *End-to-End* (Clock-In/Out, WFH/WFO, Verifikasi, Misi, Laporan Harian, Presensi Mentor, Batch User). |

---

## 🎯 Mengapa Refactoring Ini Dilakukan? (Konteks SDLC)

Sebelum refactoring, sistem menghadapi dua kelompok masalah besar:

1. **Masalah Teknis (*Technical Debt*)**:
   - Terdapat nama mentor yang di-*hardcode* di komponen frontend (seperti pengecekan string `'fadil'`, `'davy'`, `'ayu'`, `'vanesha'`, `'dzikri'`), membuat penambahan atau pergantian mentor mengharuskan ubah kode program.
   - Efek *infinite refresh loop* pada polling presensi yang menyebabkan antarmuka melambat atau *freeze*.
   - Inkonsistensi kolom database lokal saat pengujian (misal pengecekan `status` null atau kolom hilang).

2. **Masalah Adopsi Pengguna (*User Adoption & Operational Friction*)**:
   - Jika sistem mewajibkan persetujuan WFH sebelum jam masuk (08:00 pagi), proses absensi di lapangan macet karena mentor belum sempat membuka aplikasi, sehingga peserta magang akhirnya terlambat absen.
   - Mentor harus mengklik tombol verifikasi satu per satu untuk puluhan peserta magang setiap hari.
   - Tidak ada filter cepat untuk menemukan peserta bermasalah (terlambat, WFH tanpa konfirmasi, atau belum absen).

Melalui siklus refactoring ini, seluruh masalah di atas telah diselesaikan: sistem kini **dinamis**, **ringan**, **aman secara RBAC**, dan **ramah operasional harian**.

