# 04. Keamanan & Batasan Peran (Role Access Control)

Dokumen ini menjelaskan arsitektur keamanan, otentikasi, otorisasi (*Role-Based Access Control* / RBAC), serta batasan isolasi data (*scoping boundaries*) dalam aplikasi Absensi PSA.

---

## 1. Matriks Hak Akses Berdasarkan Role

Sistem Absensi PSA membedakan hak akses secara tegas ke dalam tiga tingkatan peran (*roles*):

| Modul / Tindakan | Peserta Magang (`trainee`) | Mentor (`mentor`) | Administrator (`admin`) |
|---|:---:|:---:|:---:|
| Clock-In & Clock-Out Mandiri | ✅ Ya | ✅ Ya | ➖ Opsional |
| Memilih Mode WFH / WFO | ✅ Ya | ✅ Ya | ➖ |
| Verifikasi Presensi Siswa Binaan | ❌ Ditolak (403) | ✅ Ya (Hanya Kelasnya) | ✅ Ya (Semua) |
| Verifikasi Presensi Mentor | ❌ Ditolak (403) | ❌ Ditolak (403) | ✅ Ya |
| Verifikasi Laporan Harian Siswa | ❌ Ditolak (403) | ✅ Ya (Hanya Kelasnya) | ✅ Ya (Semua) |
| Menilai & Memberi Poin Misi Siswa | ❌ Ditolak (403) | ✅ Ya (Hanya Kelasnya) | ✅ Ya (Semua) |
| Menyetujui / Menolak Pengajuan Izin | ❌ Ditolak (403) | ✅ Ya (Hanya Kelasnya) | ✅ Ya (Semua) |
| Mengubah Pengaturan Jam Kerja / Denda | ❌ Ditolak (403) | ❌ Ditolak (403) | ✅ Ya |
| Reset Seluruh Catatan Presensi | ❌ Ditolak (403) | ❌ Ditolak (403) | ✅ Ya (Wajib Token Konfirmasi) |
| Import / Hapus Massal Akun Pengguna | ❌ Ditolak (403) | ❌ Ditolak (403) | ✅ Ya |

---

## 2. Batasan Isolasi Kejuruan (*Kejuruan Scoping Boundary*)

Keamanan tidak hanya didasarkan pada role umum, melainkan juga diperketat dengan **isolasi data kejuruan (*tenant scoping*)**:

1. **Isolasi Antar Mentor**:
   - Mentor A (misal: Kejuruan Web Development) **dilarang keras** memverifikasi presensi, menyetujui izin, atau memberi poin misi untuk peserta magang milik Mentor B (misal: Kejuruan Desain Grafis).
   - Backend memverifikasi `kejuruan_id` peserta dengan daftar kejuruan binaan mentor yang sedang login. Jika terjadi pelanggaran, request langsung ditolak dengan kode status HTTP `403 Forbidden`.
2. **Pencegahan Manipulasi Mandiri oleh Trainee**:
   - Trainee tidak dapat mengubah `verification_status` miliknya sendiri dari `pending` ke `verified`.
   - Trainee tidak dapat menimpa atau mengubah laporan harian yang statusnya sudah disetujui (`approved`) oleh mentor.

---

## 3. Proteksi Endpoint Sensitif & Audit Log

### 1. Reset Presensi (`DELETE /api/attendance/reset`)
- Endpoint reset presensi adalah tindakan berisiko tinggi.
- **Lapisan Proteksi**:
  1. Wajib memiliki token otentikasi role `admin`.
  2. Wajib mengirimkan *token konfirmasi* eksplisit pada body request:
     ```json
     { "confirmToken": "CONFIRM_DELETE_ALL_ATTENDANCE" }
     ```
  3. Server mencatat log audit permanen berisi ID admin, nama, dan timestamp eksekusi:
     ```text
     [AUDIT] Admin user-admin-01 (Abdul Rozzak) is deleting all attendance records at 2026-10-17T00:26:14.330Z
     ```

### 2. Proteksi Upload Cloudinary Signature (`POST /api/upload/signature`)
- Endpoint penandatanganan upload gambar/bukti presensi ke Cloudinary hanya dapat diakses oleh user yang terotentikasi.
- Menggunakan *folder namespace* terisolasi untuk mencegah penimpaan file antar peserta.

### 3. Proteksi Import Akun Massal (`POST /api/users/batch-import`)
- Endpoint ini secara ketat hanya mengizinkan pembuatan akun bertipe `mentor` atau `trainee`.
- Upaya menginjeksi akun `admin` melalui endpoint batch import otomatis diblokir oleh sistem untuk mencegah eskalasi hak istimewa (*privilege escalation*).

