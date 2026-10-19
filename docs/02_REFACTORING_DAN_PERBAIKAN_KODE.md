# 02. Refactoring & Perbaikan Kode

Dokumen ini mencatat rincian perbaikan teknis (*code refactoring*) yang dilakukan pada komponen frontend, backend, dan lapisan basis data.

---

## 1. Pembersihan Hardcode Nama Mentor (*Dynamic Scoping*)

### Masalah Awal:
Pada versi sebelumnya, sistem menentukan daftar siswa binaan dan hak akses mentor menggunakan pencocokan string nama mentor yang di-*hardcode* di dalam kode komponen React:
- Pengecekan nama regex seperti `/dzikri/i.test(currentUser.name)`
- Array nama mentor tetap `['fadil', 'davy', 'ayu', 'vanesha']`

### Dampak Buruk Sebelum Refactor:
1. Jika ada mentor baru yang terdaftar di database, mentor tersebut tidak dapat melihat siswa binaannya di dashboard atau rekap.
2. Jika ada pergantian nama mentor, sistem harus di-*compile* dan di-*deploy* ulang.

### Solusi & Implementasi Refactor:
1. **Frontend Dashboard Mentor (`src/components/Dashboard/MentorDashboard.tsx`)**:
   - Menghapus seluruh array nama mentor hardcode.
   - Menggantinya dengan pembacaan dinamis dari `mentorKejuruanIds` dan `kejuruanList`.
   - Mengambil seluruh program yang memiliki `kejuruan.mentor_id === currentUser.id` atau `currentUser.kejuruanId`.
2. **Rekap Bulanan (`src/components/Recap/MonthlyRecapView.tsx`)**:
   - Menghapus variabel `isDzikri`.
   - Menggantinya dengan deteksi dinamis `isMentorWithMultiple` (mengecek apakah mentor mengampu lebih dari 1 kejuruan).
   - Dropdown filter kejuruan otomatis menyesuaikan hak akses mentor secara dinamis.

---

## 2. Eliminasi Polling Infinite Loop & UI Freeze

### Masalah Awal:
Di dalam hook `useEffect` pada `MentorDashboard.tsx`:
```typescript
// SEBELUM:
useEffect(() => {
  const refresh = () => {
    void refreshAttendanceRecords();
    void refreshUsers();
  };
  refresh();
  const timer = window.setInterval(refresh, 15000);
  return () => window.clearInterval(timer);
}, [currentUser.id, refreshAttendanceRecords, refreshUsers]); // <-- Fungsi dibuat ulang tiap render!
```

Karena `refreshAttendanceRecords` dan `refreshUsers` pada `AppContext` dibuat ulang sebagai *closure* baru pada setiap render, `useEffect` terpicu kembali secara berulang tanpa henti (*infinite refresh loop*). Ini membebani jaringan, browser memori, dan menyebabkan halaman *freeze*.

### Solusi & Implementasi Refactor:
Memperbaiki dependensi array `useEffect` sehingga polling dan refresh berkala hanya di-inisialisasi berdasarkan `currentUser.id`:
```typescript
// SESUDAH:
useEffect(() => {
  const refresh = () => {
    void refreshAttendanceRecords();
    void refreshUsers();
  };
  refresh();
  window.addEventListener('focus', refresh);
  const timer = window.setInterval(refresh, 15000);
  return () => {
    window.removeEventListener('focus', refresh);
    window.clearInterval(timer);
  };
}, [currentUser.id]); // Aman dari re-render loop
```

---

## 3. Peningkatan Integrasi Database & Sinkronisasi API

### Masalah Awal:
1. Saat melakukan verifikasi presensi atau update status presensi, kolom status pada MySQL terkadang menerima nilai `null` jika parameter tidak diteruskan secara lengkap.
2. Fungsi `markAttendanceStatus` pada `AppContext` tidak menerima alasan penolakan (`reason`), sehingga saat mentor menolak presensi atau mengalfakan, alasan penolakan tidak tersimpan ke database.

### Solusi & Implementasi Refactor:
1. **Sanitasi Query SQL di Backend (`server/controllers/attendance.controller.ts`)**:
   - Memastikan kolom `status` selalu terisi nilai valid (`hadir`, `terlambat`, `izin`, `sakit`, atau `alpha`).
   - Menyediakan nilai *fallback* yang aman jika *payload* parsial.
2. **Pembaruan `markAttendanceStatus` (`src/context/AppContext.tsx`)**:
   - Menambahkan parameter `reason?: string` opsional.
   - Menyimpan `rejectionReason: reason || record.rejectionReason` ke state lokal dan langsung memanggil `api.saveAttendanceRecord(updated)`.

---

## 4. Hasil Verifikasi Kode

- **TypeScript Compilation**: Lolos `npm run build` tanpa peringatan *type error*.
- **Bundling Vite**: Seluruh modul terbundel rapi di direktori `dist/`.
- **Backward Compatibility**: Tidak ada *breaking changes* pada data presensi yang sudah tersimpan sebelumnya di MySQL.

