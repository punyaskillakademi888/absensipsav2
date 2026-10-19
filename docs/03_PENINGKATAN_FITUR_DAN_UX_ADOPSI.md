# 03. Peningkatan Fitur & UX Adopsi Pengguna

Dokumen ini menjelaskan transformasi fitur dan pengalaman pengguna (UX) yang dirancang khusus untuk memecahkan friksi adopsi di lingkungan tempat magang.

---

## 1. Pendekatan Baru: *Optimistic WFH Submission*

### Masalah Operasional Lama:
Di banyak sistem absensi konvensional, WFH (*Work From Home*) mengharuskan pengajuan izin dan persetujuan dari mentor atau atasan **sebelum** peserta magang dapat melakukan clock-in.
- **Dampak Nyata**: Pada jam 07:30 - 08:00 pagi, mentor mungkin masih di perjalanan atau belum membuka laptop. Akibatnya persetujuan tertunda, jam masuk terlewat, dan peserta magang dicatat terlambat meskipun sudah siap bekerja dari rumah. Hal ini menimbulkan protes dan ketidakpercayaan terhadap sistem absensi.

### Solusi Baru yang Diimplementasikan:
1. **Clock-In WFH Langsung**: Peserta magang diperbolehkan langsung memilih mode **WFH** saat clock-in, asalkan mengisi catatan agenda rencana kerja hari itu.
2. **Audit Cepat Mentor (*Post-Audit Workflow*)**:
   - Status presensi WFH otomatis berstatus `pending` (menunggu verifikasi mentor).
   - Di dashboard mentor, pengajuan WFH ditandai dengan badge khusus `🏠 WFH`.
   - Jika WFH tersebut **sah** (sudah disepakati sebelumnya), mentor mengklik tombol **"Setujui"**.
   - Jika WFH tersebut **tidak sah / mangkir**, mentor cukup mengklik tombol **"Alfakan"** (1-klik).

---

## 2. Fitur Baru: Aksi Cepat 1-Klik "Alfakan WFH Tidak Sah"

Pada komponen [`MentorTraineeTable.tsx`](../src/components/Dashboard/components/MentorTraineeTable.tsx), setiap baris yang berstatus WFH kini dilengkapi tombol aksi cepat:

- **Tombol "Alfakan" (Merah)**:
  - Sekali klik langsung mengubah status absensi siswa menjadi **`alpha`**.
  - Mengubah status verifikasi menjadi **`rejected`**.
  - Menyimpan catatan penolakan: *"WFH Tidak Sah / Ditolak Mentor"*.
  - Menghilangkan kebutuhan bagi mentor untuk membuka halaman edit atau mengisi formulir manual yang panjang.

---

## 3. Fitur Baru: Verifikasi Massal Efisien (*Bulk Verification*)

Untuk mengurangi kelelahan administrasi harian (*administrative fatigue*) mentor, ditambahkan dua tombol verifikasi massal di *header* dashboard mentor:

1. **"Verifikasi Semua Hadir Normal (WFO)"**:
   - Memverifikasi sekaligus semua peserta magang yang hadir tepat waktu di kantor (WFO).
   - Mentor yang memiliki 20–30 peserta magang cukup menekan 1 tombol ini untuk menyelesaikan 90% pekerjaan validasi hariannya dalam hitungan **3 detik**.
2. **"Verifikasi Semua Pending"**:
   - Opsi untuk menyetujui seluruh presensi yang tersisa setelah mentor selesai memeriksa kasus-kasus khusus.

---

## 4. Fitur Baru: Filter Tab "Perlu Perhatian" & Pencarian Cepat

Untuk mempermudah pemantauan, mentor tidak perlu lagi menggulir daftar puluhan siswa satu per satu. Disediakan filter bar interaktif:

| Tab Filter | Indikator | Fungsi |
|---|---|---|
| **Semua** | Jumlah total siswa | Menampilkan seluruh siswa di kelas binaan. |
| **⚠️ Perlu Perhatian** | Angka peringatan (Amber) | **Fitur Utama**: Hanya menampilkan peserta yang **WFH**, **Terlambat**, **Pending**, atau **Belum Absen**. |
| **🏠 WFH** | Angka WFH (Indigo) | Menampilkan peserta yang mengajukan presensi WFH hari ini. |
| **⏰ Terlambat** | Angka Telat (Orange) | Menampilkan peserta yang clock-in setelah jam batas toleransi (09:00). |
| **⏳ Belum Hadir** | Angka Belum Absen (Slate) | Menampilkan peserta yang belum melakukan clock-in sama sekali. |

Dilengkapi juga dengan **Search Box** instan untuk mencari nama siswa, NIM, atau teks agenda kerja.

---

## 5. Perbandingan Efisiensi Waktu Operasional Mentor

| Tugas Operasional | Sebelum Refactor | Setelah Refactor | Peningkatan Efisiensi |
|---|---|---|---|
| Verifikasi 25 Siswa WFO | Klik 25x tombol manual (~2 menit) | 1-klik tombol "Verifikasi Semua Hadir Normal" | **97% lebih cepat** (3 detik) |
| Menangani Siswa WFH Liar | Buka menu edit, ganti status ke alpha, isi catatan manual (~1 menit) | 1-klik tombol "Alfakan" pada baris WFH | **90% lebih cepat** (5 detik) |
| Mencari Siswa yang Telat/Belum Absen | Memeriksa seluruh tabel satu per satu | Klik tab "Perlu Perhatian" | **Instan** |

