# 05. Jaminan Kualitas (QA) & Matriks Pengujian E2E

Dokumen ini merinci arsitektur pengujian otomatis *End-to-End* (E2E), strategi QA, dan matriks 39 pengujian yang memastikan keandalan seluruh fungsi dan lapisan keamanan sistem Absensi PSA.

---

## 1. Arsitektur & Cara Menjalankan Pengujian

Seluruh pengujian otomatis diimplementasikan dalam skrip mandiri:
[`scripts/test-e2e.ts`](../scripts/test-e2e.ts)

### Perintah Menjalankan Test:
Pastikan database MySQL lokal aktif, lalu jalankan:
```bash
npx tsx scripts/test-e2e.ts
```

Skrip pengujian akan otomatis:
1. Memverifikasi koneksi database lokal dan skema tabel.
2. Memeriksa ketersediaan server API (atau menyalakannya secara otomatis jika belum berjalan).
3. Melakukan eksekusi 39 skenario pengujian secara berurutan.
4. Memberikan laporan ringkasan status kelulusan (100% Lulus / 0 Gagal).

---

## 2. Matriks Cakupan 39 Skenario Pengujian

Pengujian dikelompokkan ke dalam 11 grup fungsional dan keamanan:

### GRUP 1: Koneksi, Auth Admin & Konfigurasi
- **Test 1**: *Database Connection & Schema Health Check* — Memverifikasi tabel MySQL utama (`users`, `kejuruan`, `attendance`, `missions`, `mission_submissions`, `daily_reports`, `leave_requests`).
- **Test 2**: *Autentikasi Admin Default (POST /api/auth/login)* — Login admin bawaan, verifikasi token JWT dan payload role `admin`.
- **Test 3**: *Pengaturan Presensi (PUT & GET /api/settings)* — Membaca dan memperbarui toleransi jam masuk (08:00–09:00 WIB), koordinat kantor, dan poin penalti.

### GRUP 2: Data Master (Kejuruan, Mentor, Trainee)
- **Test 4**: *Pembuatan Kejuruan Utama & Kedua (POST /api/kejuruan)* — Membuat program kejuruan dinamis.
- **Test 5**: *Pendaftaran Mentor Utama & Mentor Lain (POST /api/users role=mentor)* — Mendaftarkan akun mentor dengan relasi kejuruan.
- **Test 6**: *Pendaftaran Trainee (POST /api/users role=trainee)* — Pendaftaran akun peserta magang.
- **Test 7**: *Login Seluruh Role* — Verifikasi otentikasi login untuk Trainee, Mentor Utama, dan Mentor Kejuruan Lain.
- **Test 7A**: *Proteksi Batch Import* — Memastikan batch import hanya menerima role `mentor` dan `trainee`, menolak injeksi role `admin`.

### GRUP 3: Kejuruan Scoping & Role Boundaries
- **Test 8**: *Trainee Scope Limit (GET /api/kejuruan)* — Trainee hanya diizinkan melihat informasi kejuruannya sendiri.
- **Test 9**: *Mentor Scope Limit (GET /api/users)* — Mentor hanya diizinkan melihat daftar peserta magang yang ada di kelas binaannya.

### GRUP 4: Alur Izin & Validasi
- **Test 10**: *Pengajuan Izin Trainee & Review Mentor (POST & PATCH /api/leaves)* — Trainee mengajukan surat izin, mentor mereview statusnya (`approved`).

### GRUP 5: Siklus Tugas Misi Master
- **Test 11**: *Pembuatan & Update Misi (POST & PUT /api/missions)* — Mentor membuat dan mengupdate tugas misi kejuruan.

### GRUP 6: Presensi Masuk & Keluar (Clock-In / Clock-Out)
- **Test 12 [CLK-01]**: *Clock-In Tepat Waktu* — Absen pukul 08:15 WIB $\rightarrow$ status `hadir`, penalti 0 menit dan 0 poin.
- **Test 13 [CLK-02]**: *Clock-In Terlambat* — Absen pukul 09:15 WIB (toleransi 09:00) $\rightarrow$ kalkulasi otomatis terlambat 15 menit dan penalti 15 poin.
- **Test 14 [CLK-03]**: *Boundary Clock-In Batas Akhir* — Absen tepat pada 09:00:00 WIB $\rightarrow$ dihitung tepat waktu (`hadir`, 0 poin penalti).
- **Test 15 [CLK-05]**: *Clock-Out Hari yang Sama* — Memperbarui jam pulang peserta magang.

### GRUP 7: Status Mode WFH dan WFO
- **Test 16 [WFX-01]**: *Presensi WFO Valid* — Absen dengan koordinat lokasi kantor valid.
- **Test 17 [WFX-02]**: *Presensi WFH Valid* — Absen mode WFH dengan catatan agenda kegiatan kerja dari rumah.
- **Test 18 [WFX-03]**: *Sanitasi workMode Ilegal* — Nilai workMode di luar ENUM `WFO`/`WFH` otomatis disanitasi menjadi nilai aman.

### GRUP 8: Verifikasi Presensi & Laporan Harian
- **Test 19 [VER-01]**: *Mentor Menyetujui Presensi Trainee* — Status verifikasi berubah dari `pending` menjadi `verified`.
- **Test 20 [VER-02]**: *Mentor Menolak Presensi Trainee* — Status verifikasi menjadi `rejected` beserta alasan penolakan.
- **Test 21 [VER-03]**: *Sekuriti: Trainee Ditolak Verifikasi Mandiri* — Peserta dilarang mengubah status verifikasinya sendiri (403 Forbidden).
- **Test 22 [VER-04]**: *Sekuriti: Mentor Ditolak Memverifikasi Trainee Beda Kejuruan* — Percobaan verifikasi lintas kejuruan ditolak (403 Forbidden).
- **Test 23 [VER-05]**: *Laporan Harian Ditolak Mentor* — Trainee submit laporan harian dan mentor meminta perbaikan (`rejected`).
- **Test 24 [VER-06]**: *Re-submit Laporan yang Ditolak* — Trainee dapat merevisi laporan harian yang ditolak.
- **Test 25 [VER-07]**: *Sekuriti: Laporan Disetujui Dilarang Ditimpa* — Trainee dilarang mengubah laporan yang sudah berstatus `approved`.

### GRUP 9: Penilaian Misi oleh Mentor
- **Test 26 [MSN-01]**: *Penilaian Misi Sah* — Trainee mengumpulkan tugas misi dan mentor memberi nilai/poin reward yang sah.
- **Test 27 [MSN-03]**: *Boundary: Nilai Melebihi Batas Maksimal Ditolak* — Percobaan memberi poin melebihi `maxPoints` misi ditolak oleh sistem.
- **Test 28 [MSN-04]**: *Boundary: Nilai Poin Negatif Ditolak* — Percobaan memberi poin negatif ditolak.
- **Test 29 [MSN-05]**: *Sekuriti: Penilaian Lintas Kejuruan Ditolak* — Mentor dilarang menilai submission dari kejuruan yang bukan binaannya.

### GRUP 10: Presensi Mentor & Verifikasi Admin
- **Test 30 [ADM-01]**: *Presensi Mandiri Mentor* — Presensi kehadiran mentor berhasil dicatat dengan role `mentor`.
- **Test 31 [ADM-02]**: *Admin Memverifikasi Presensi Mentor* — Presensi mentor diverifikasi oleh Admin.
- **Test 32 [ADM-03]**: *Pengecualian Penalti Mentor* — Mentor yang clock-in telat tidak dikenakan denda poin seperti peserta magang.
- **Test 33 [ADM-04]**: *Sekuriti: Sesama Mentor Ditolak Verifikasi* — Mentor A dilarang memverifikasi presensi Mentor B (403 Forbidden).
- **Test 34 [ADM-05]**: *Sekuriti: Trainee Ditolak Mengubah Presensi Mentor* — Trainee dilarang mengakses atau mengubah presensi mentor.

### GRUP 11: Endpoint Administrasi & Proteksi Batch
- **Test 35**: *Hall of Fame Leaderboard* — Perhitungan akumulasi poin peringkat peserta magang berjalan akurat.
- **Test 36**: *Proteksi Reset Presensi* — Reset presensi wajib menyertakan token rahasia konfirmasi dan mencatat audit log.
- **Test 37**: *Proteksi Upload Signature* — Verifikasi keamanan tanda tangan upload file ke Cloudinary.
- **Test 38**: *Import & Hapus Batch User Trainee* — Administrator dapat menambah dan menghapus batch user peserta magang secara massal tanpa error.

---

## 3. Standar Kualitas Rilis

Setiap kali dilakukan perubahan kode di masa mendatang, skrip pengujian E2E wajib dijalankan untuk menjamin **Zero Regression**:

$$\text{Tingkat Kelulusan Test} = \frac{39 \text{ Lulus}}{39 \text{ Total Pengujian}} = 100\%$$

