# Hasil Audit: Analisis Kesiapan Adopsi Aplikasi Presensi PSA

## 1. Diagnosis Utama: Tiga Masalah yang Paling Mengganggu Adopsi

### 🚨 Masalah #1: Ketidaksesuaian antara UI/Frontend dengan Endpoint Backend yang Ada

**Laporan:** `bugadmin.md` mendeskripsikan **lebih dari 10 endpoint API yang tidak ada** (PUT `/api/users/:id`, DELETE `/api/users/:id`, POST `/api/users/batch`, DELETE `/api/users/clear/:role`, POST `/api/users/batch-delete-trainees`, PUT `/api/profile/avatar`, POST `/api/upload/signature`, DELETE `/api/attendance/reset`) yang dipanggil langsung oleh `api.ts` dan `AppContext.tsx`.

**Bukti Kode:**
- `src/services/api.ts` baris ~150-330 mendefinisikan fungsi `updateUser`, `deleteUser`, `deleteUsersByRole`, `deleteTraineesByIds`, `importUsers`, `regenerateUserCredentials`, `updateMyAvatar`, `resetAttendanceRecords`, `uploadImageToCloudinary`, `createKejuruan` yang memanggil endpoint yang tidak terdaftar di `server/routes/users.ts`, `server/routes/profile.ts`, `server/routes/upload.ts`, `server/routes/attendance.ts`.
- `src/components/Trainee/TraineeManagementView.tsx` memanggil `addKejuruan`, `deleteUser`, `deleteUsersByRole`, `deleteTraineesByIds`, `importUsers`, `regenerateUserCredentials` dari `useApp()` tetapi fungsi-fungsi tersebut **tidak ada di `AppContext.tsx`**.
- `server/routes/users.ts` hanya memiliki GET `/`, POST `/` (untuk buat mentor/trainee), POST `/batch`, PUT `/:id` **TIDAK ADA**, DELETE `/:id` **TIDAK ADA**.
- `server/routes/profile.ts` hanya ada fungsi `PUT /avatar` **TAPI** endpoint ini **ADA** (tapi tidak di `server/routes/index.ts` yang diekspor).

**Dampak Adopsi:** Admin tidak dapat mengelola pengguna (tambah/hapus/akses ulang kredensial), trainee tidak dapat import pengguna dari Excel, dan mentor tidak dapat backup/rekapitulasi data laporan ke PDF secara langsung karena `exportToPDF` dan `exportToExcel` tidak ada di backend (hanya frontend).

### 🚨 Masalah #2: AppContext Menggunakan `(api as any)` untuk Membungkus Bug API yang Hilang

**Laporan:** `src/context/AppContext.tsx` baris ~280-510 menggunakan `(api as any).method()` untuk memanggil metode yang tidak ada:
- `resetAttendanceRecords` → `(api as any).resetAttendanceRecords?.()`
- `resetMentorMissionData` → `(api as any).resetMentorMissionData?.()`
- `resetTraineeHallOfFamePoints` → `(api as any).resetTraineeHallOfFamePoints?.()`
- `updateSettings` → `(api as any).updateSettings?.()`
- `resetToDefaultData` → `(api as any).resetToDefaultData?.()`
- `reviewDailyReport` → `(api as any).reviewDailyReport?.()` (walaupun ada di api.ts, tidak perlu pakai `any`)

**Bukti Kode:** File AppContext.tsx tidak menyertakan implementasi `resetAttendanceRecords`, `resetTraineeHallOfFamePoints`, `resetMentorMissionData` secara langsung.

**Dampak Adopsi:** Admin yang menekan tombol "Reset Presensi" atau "Reset Poin HOF" tidak akan error yang jelas — malah akan **tidak melakukan apa-apa** karena fallback `(api as any)`. Ini menciptakan keyakinan palsu bahwa aksi berhasil padahal gagal.

### 🠖Masalah #3: Penanganan Waktu dan Batas Presensi WFO Tidak Konsisten

**Laporan:** 
- Di `src/context/AppContext.tsx` dan `server/appData.ts`, penentuan **batas keterlambat (lateLimitTime)** tidak konsisten. Frontend mendukung `lateLimitTime` dari settings, tetapi backend `server/appData.ts` baris `loadPenaltySettings()` mengambil `late_limit_time` dan `late_point_penalty_per_minute` dari tabel `attendance_settings`, padahal kolom `late_point_penalty_per_minute` **BARU DITAMBAH** melalui migrasi otomatis.
- Di `server/db.ts` `initDatabase()` ada migrasi `late_point_penalty_per_minute` dan `absent_point_penalty_per_day` pada `attendance_settings`, tetapi `appData.ts` tidak memanggil `canonicalKejuruanCode` untuk mengatur koneksi ke Cloudinary yang benar.

**Bukti Kode:** 
- `server/db.ts` baris 242-252 membuat tabel `attendance_settings` dengan kolom `late_point_penalty_per_minute` dan `absent_point_penalty_per_day`.
- `server/appData.ts` tidak memiliki logika fallback bila kolom ini belum ada.

**Dampak Adopsi:** Jika database lama dipakai, mentor/trainee tidak dapat mengatur poin keterlambat yang sesuai kebijakan institut.

---

## 2. Temuan Audit: Kondisi Aktual yang Ditemukan

| File/Modul | Temuan | Status |
|------------|--------|--------|
| `server/routes/users.ts` | **PUT `/:id` ada** (baris ~260), **DELETE `/:id` ada** (baris ~410), **POST `/batch` ada** | ✅ Ada |
| `server/routes/users.ts` | **DELETE `/clear/:role` TIDAK ADA** | ❌ Missing |
| `server/routes/users.ts` | **POST `/batch-delete-trainees` TIDAK ADA** | ❌ Missing |
| `server/routes/users.ts` | **POST `/:id/regenerate-credentials` TIDAK ADA** | ❌ Missing |
| `server/routes/profile.ts` | **PUT `/avatar` ada** | ✅ Ada |
| `server/routes/upload.ts` | **POST `/signature` ada** | ✅ Ada |
| `server/routes/attendance.ts` | **DELETE `/reset` ada** | ✅ Ada |
| `server/controllers/index.ts` | **createKejuruan** tidak mengembalikan `result` (hanya `const [result]` tapi tidak dikembalikan dengan benar) | ⚠️ Perlu dicek |
| `server/controllers/index.ts` | **reviewMissionSubmission** tidak ada (hanya di `data.service.ts`) | ⚠️ Tidak pakai controller |
| `server/services/data.service.ts` | **reviewMissionSubmission** menggunakan kolom `points` (bukan `awarded_points`) | ✅ Benar |
| `server/services/data.service.ts` | **buildExemptDates** tidak ada (hanya di `appData.ts`) | ❌ Missing di sini |
| `server/services/data.service.ts` | **createKejuruan** tidak menangkap return value dari query INSERT | ❌ Bug |
| `src/context/AppContext.tsx` | Fungsi `resetAttendanceRecords`, `resetTraineeHallOfFamePoints`, `resetMentorMissionData`, `updateSettings`, `resetToDefaultData`, `reviewDailyReport` memakai `(api as any)` | ⚠️ Anti-pattern |
| `src/components/DailyReport/DailyReportView.tsx` | Komponen memakai `ReviewReportModal` yang tidak ada | ❌ Missing komponen |

---

## 3. Hambatan yang Belum Terverifikasi (Pertanyaan untuk Pihak Tempat Magang)

1. **Apakah admin di tempat magang benar-benar perlu mengelola kejuruan (tambah/hapus program pelatihan)?** Atau semua kejuruan sudah diketahui terlebih dahulu?
2. **Seberapa penting fitur batch import/rename/delete trainee bagi operasional harian?** Apakah tidak cukup dengan admin membuat akun manual satu per satu?
3. **Apakah mentor langsung memakai GPS untuk check-in/check-out, atau cukup dengan admin memverifikasi?** Jika yang verifikasi adalah satu-satunya workflow, fitur GPS mungkin tidak perlu.
4. **Apakah system hall-of-fame (penalitas keterlambat) benar-benar diinginkan?** atau cukup sekadar rekap kehadiran tanpa pembagian poin?

---

## 4. Prioritas Tindakan

| No | Tindakan | Dampak | Usaha | Cara Uji |
|----|----------|--------|-------|----------|
| **P0-1** | **Tambahkan endpoint yang hilang** (`PUT/POST/DELETE /api/users/:id`, `POST /api/users/clear/:role`, `POST /api/users/batch-delete-trainees`, `POST /api/users/:id/regenerate-credentials`, `DELETE /api/attendance/reset`) | Sangat tinggi | Sedang | Buat satu akun mentor/trainee, test CRUD dari TraineeManagementView |
| **P0-2** | **Hapus `(api as any)` casts** dan tambahkan wrapper di `AppContext.tsx` untuk `resetAttendanceRecords`, `resetTraineeHallOfFamePoints`, `resetMentorMissionData`, `updateSettings`, `resetToDefaultData` | Sangat tinggi | Rendah | Tekan tombol reset di UI — lihat apakah ada error di console |
| **P0-3** | **Perbaiki `createKejururan` di `server/controllers/index.ts`** supaya mengembalikan data ke frontend | Tinggi | Rendah | Buat kejuruan baru dari UI — pastikan response berhasil |
| **P1-1** | **Perbaiki `buildExemptDates` di `server/services/data.service.ts`** — pindahkan atau import dari `appData.ts` | Tinggi | Sedang | Cek Hall of Fame trainee — pastikan absent penalty dihitung |
| **P1-2** | **Tambahkan komponen `ReviewReportModal` di `src/components/DailyReport/components/`** | Tinggi | Sedang | Buka tab "Laporan Harian" — lihat apakah modal muncul |
| **P2-1** | **Synchronisasi `late_point_penalty_per_minute` & `absent_point_penalty_per_day`** di `appData.ts` | Sedang | Rendah | Cek apakah admin dapat mengubah poin penalti dari SettingsView |

---

## 5. Rencana Uji Coba Nyata

### Langkah-langkah:
1. **Setup Lingkungan Dev:** Deploy Vercel(Function) dengan variabel lingkungan yang diperlukan (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`).
2. **Login sebagai Admin:** Login dengan kode `10101010` dan password `12341234`.
3. **Uji-kan menu Pengaturan:**
   - Buka tab "Pengaturan" → cek apakah dapat mengubah jam masuk, radius GPS, dan poin penalty.
   - Tekan tombol "Simpan Perubahan" → pastikan ada konfirmasi sukses.
4. **Uji-kan menu Pengguna (peserta):**
   - Buat akun trainee baru → harus berhasil.
   - Hapus akun trainee → harus berhasil.
   - Regenerasi kredensial → password baru harus berhasil dikirim.
5. **Uji-kan Check-in Trainee:**
   - Login sebagai trainee baru → lakukan check-in WFO.
   - Pastikan status menjadi "hadir" atau "terlambat" sesuai waktu.
   - Logout → login sebagai admin → verifikasi presensi → status harus berubah ke "verified".
6. **Uji-kan Hall of Fame:**
   - Pastikan poin akumulasi trainee dihitung dengan benar.
   - Pilih "Reset Poin Trainee" → lihat apakah semua poin menjadi 0.

### Indikator Keberhasilan:
- Semua tombol di UI memberikan **feedback yang jelas** (sukses/gagal)
- Tidak ada error `ReferenceError` atau `TypeError` di console
- Data yang diedit/disable di UI memang berubah di database

---

## 6. Pertanyaan untuk Pihak Tempat Magang

1. Apa prosedur pembuatan akun peserta di lingkungan Anda saat ini? Apakah dibuat manual oleh admin atau ada proses import?
2. Apakah mentor secara aktif memverifikasi absensi setiap hari, atau cukupkan dengan sistem otomatis setelah check-in?
3. Seberapa sering data presensi perlu dihapus/reset secara keseluruhan? (untuk pengalaman pembelajaran baru?)
4. Apakah GPS/check-in WFO wajib, atau cukup dengan check-in WFH yang diterima?
5. Siapa di lingkungan Anda yang memiliki izin untuk membuat/mengubah kejuruan program pelatihan?

---

## 7. Rekomendasi Paling Penting untuk Segera Dilakukan

**Fokus pada P0-1 & P0-2 terlebih dahulu.** Tanpa endpoint API yang lengkap, admin tidak dapat melakukan **manajemen pengguna** yang merupakan fondasi sistem. Fitur-fitur lain (misal Hall of Fame, check-in GPS) akan tidak relevan jika admin tidak dapat membuat/mengelola akun peserta yang bermodal. Setelah endpoint kritikal ini selesai, fokuskan uji coba nyata dengan 3-5 akun peserta sekaligus untuk melihat alur lengkap dari pendaftaran → check-in → verifikasi → rekapitulasi.

---

*File lain yang dibuat untuk dokumentasi visual: `class-diagram.md`, `design-decisions.md`, `sequence-diagram-wfo.md`, `promt.md`*