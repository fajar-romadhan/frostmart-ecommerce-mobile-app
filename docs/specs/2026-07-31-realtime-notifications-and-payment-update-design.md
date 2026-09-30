# Design Spec: System Notifikasi Realtime Pesanan Admin & Pembaruan Pembayaran QRIS/Bank

**Tanggal:** 31 Juli 2026  
**Proyek:** Della Frozen Mart E-Commerce (Mobile App & Backend)

---

## 1. Pembaruan Data Pembayaran Resmi Toko

### Data Rekening & QRIS:
- **Bank Resmi:** Bank Mandiri
- **Nomor Rekening:** `1130002605941`
- **Atas Nama:** `della adelita`
- **File QRIS:** `E:\JOB\AFNY-APLIKASI ANDRO\della-frozenmart-mobile-ecommerce\data\QRIS.png`
  - Disalin ke `mobile_app/assets/images/qris.png`
  - Disalin ke `backend_api/storage/app/public/qris.png` (dapat diakses via `/media/qris.png`)

### Layar yang Diperbarui:
1. `UploadPaymentScreen.js`: Tampilan nomor rekening Mandiri, tombol Salin Rekening, dan gambar barcode QRIS interaktif (bisa di-tap/diperbesar).
2. `OrderDetailScreen.js`: Tampilan petunjuk transfer Mandiri & QRIS resmi.
3. `CheckoutScreen.js`: Rincian pembayaran metode Transfer & QRIS.

---

## 2. Sistem Notifikasi Realtime Hybrid (Opsi A + Opsi B)

### Fitur Notifikasi In-App (Saat Aplikasi Terbuka / Active):
1. **Auto-Polling Background 4 Detik**:
   - Aplikasi Admin secara otomatis memeriksa pesanan baru setiap 4 detik.
2. **Ikon Lonceng Header (`🔔`) & Badge Merah (`🔴`)**:
   - Menambahkan ikon lonceng pada header `AdminDashboardScreen.js` dengan counter merah jika ada pesanan baru belum diproses.
   - Menampilkan modal/drawer riwayat notifikasi saat lonceng di-tap.
3. **Banner Toast Melayang (Top In-App Alert)**:
   - Banner melayang muncul di atas layar: `🛍️ PESANAN BARU MASUK! Kode: ORD-... | Rp ...` dengan tombol **[PROSES PESANAN]**.
4. **Audio Chime Sound (Suara Dering)**:
   - Membunyikan suara dering notifikasi (*Ting!*) menggunakan `expo-av` saat pesanan baru terdeteksi.
5. **Auto-Update Counter Dashboard**:
   - Card statistik "Pesanan Pending" otomatis bertambah (misal dari `0` ke `1`) tanpa perlu *pull refresh*.

### Fitur System Status Bar Notification (Saat App Minimised / Layar Terkunci):
1. **Expo Local & Push Notification Integration (`expo-notifications`)**:
   - Memicu notifikasi resmi di baris atas (Status Bar) HP Android/iOS Admin lengkap dengan judul, isi pesan, getaran (*vibration*), dan suara notifikasi bawaan HP.
2. **Deep-Link Navigation**:
   - Mengetap notifikasi di Status Bar HP otomatis membuka aplikasi ke halaman rincian pesanan tersebut.

---

## 3. Rencana Pengujian
- Test Unit & Feature Test Backend (`php artisan test`)
- Simulation Test Pesanan Baru dari Akun Pelanggan -> Verifikasi Notifikasi Lonceng, Suara, Toast Banner, dan System Status Bar Notif di HP Admin.
