# Desain Sistem Poin Loyalti Pelanggan (Della Frozen Mart)

## 1. Ringkasan & Tujuan
Menambahkan fitur sistem reward poin loyalti belanja pada aplikasi Della Frozen Mart untuk meningkatkan retensi dan minat pelanggan mengunduh serta berbelanja secara berkala (referensi sistem loyalti Kopi Kenangan & MySuperindo yang disederhanakan).

## 2. Aturan Bisnis & Mekanisme Poin

### A. Perolehan Poin (Earn Points)
- **Rasio**: Setiap belanja produk sebesar **Rp 50.000** mendapatkan **1 Poin** (kelipatan Rp 100.000 dapat 2 poin, Rp 150.000 dapat 3 poin, dst. menggunakan pembulatan ke bawah `floor(subtotal / 50000)`).
- **Subtotal Produk Murni**: Ongkos kirim tidak dihitung ke dalam perolehan poin.
- **Waktu Masuk Poin**: Poin secara otomatis ditambahkan ke saldo pelanggan **hanya setelah pesanan berstatus `Selesai`** (baik dikonfirmasi manual oleh pelanggan via tombol "Pesanan Diterima" atau otomatis selesai 15 menit).
- **Masa Berlaku**: Poin bersifat permanen (tidak ada masa kadaluarsa).

### B. Penukaran Poin (Redeem Points)
- **Nilai Tukar**: **10 Poin = 1 Produk Gratis Bebas Pilih** dari katalog produk aktif.
- **Titik Penukaran**: Langsung pada layar **Checkout** (`CheckoutScreen`).
- **Validasi Poin Tidak Cukup**: Jika saldo poin < 10 dan pelanggan mencoba memilih hadiah poin, sistem menampilkan pesan/modal informatif:
  > *"😔 Poin Kamu Belum Cukup! Kamu butuh 10 poin untuk klaim 1 produk gratis. Saldo kamu saat ini: X poin. Belanja Rp Y lagi untuk kumpulkan sisa poin kamu!"*
- **Validasi Poin Cukup**: Jika saldo >= 10 poin, pelanggan dapat membuka modal katalog produk, memilih 1 produk gratis, dan item tersebut otomatis ditambahkan ke rincian pesanan dengan harga **Rp 0** (`🎁 HADIAH POIN`).
- **Pengurangan Saldo**: 10 poin langsung dipotong dari saldo pelanggan saat pesanan dibuat.
- **Garansi Pengembalian Poin (Refund)**: Jika pesanan yang menggunakan poin dibatalkan oleh pelanggan atau kadaluarsa 30 menit, 10 poin otomatis dikembalikan 100% ke saldo pengguna.

## 3. Skema Basis Data

### A. Perubahan Tabel `pengguna`
- Tambah kolom `total_poin` (`INT UNSIGNED DEFAULT 0`)

### B. Perubahan Tabel `pesanan`
- Tambah kolom `poin_digunakan` (`INT UNSIGNED DEFAULT 0`)
- Tambah kolom `poin_diperoleh` (`INT UNSIGNED DEFAULT 0`)
- Tambah kolom `produk_hadiah_id` (`BIGINT UNSIGNED NULLABLE`, foreign key ke `produk.id`)

### C. Tabel Baru `riwayat_poin`
- `id`: Primary key BIGINT
- `pengguna_id`: Foreign key ke `pengguna.id` (on delete cascade)
- `pesanan_id`: Foreign key ke `pesanan.id` (nullable, on delete set null)
- `jenis`: ENUM (`'masuk'`, `'keluar'`)
- `jumlah_poin`: INT UNSIGNED
- `saldo_akhir`: INT UNSIGNED
- `keterangan`: VARCHAR(255)
- `created_at`, `updated_at`: Timestamps

## 4. API Endpoints Baru & Dimodifikasi

1. `GET /api/profile` & `GET /api/user`: Mengembalikan field `total_points` (alias `total_poin`).
2. `GET /api/points/history`: Mengembalikan daftar riwayat perolehan & penukaran poin pelanggan.
3. `POST /api/checkout`: Menerima parameter opsional `reward_product_id`. Memvalidasi poin >= 10, stok produk hadiah >= 1, dan memasukkan produk hadiah Rp 0.
4. `PUT /api/orders/{id}/received` & Otomasi Selesai 15 Menit: Menghitung subtotal produk dan menambahkan poin ke saldo user serta mengirim notifikasi `"🎉 +X Poin Loyalti Diterima!"`.
5. `StockService::cancelOrder` & `OrderController::cancel`: Mengembalikan poin jika pesanan dibatalkan.

## 5. Antarmuka Mobile App (UI/UX)

1. **Header HomeScreen (`HomeScreen.js`)**:
   - Menambahkan Chip/Badge Saldo Poin Emas interaktif (`⭐ X Poin`) di header dekat sapaan pengguna yang jika di-tap langsung membuka info poin / profil.
2. **Layar Profil (`ProfileScreen.js`)**:
   - Menambahkan **Card Loyalti Member Della Frozen Mart** eksklusif dengan gradient emas/navy, menampilkan Saldo Poin Aktif, progress bar menuju hadiah berikutnya (X/10 poin), dan tombol **`📜 Riwayat Poin`** (membuka modal daftar transaksi poin).
3. **Layar Checkout (`CheckoutScreen.js`)**:
   - Menambahkan Card Loyalti **`🎁 Tukar Hadiah Poin (10 Poin)`**.
   - Menampilkan status saldo poin pelanggan.
   - Jika poin < 10: tombol menampilkan status terkunci dan jika di-tap memunculkan pop-up modal edukatif bersahabat dengan emotikon `😔`.
   - Jika poin >= 10: tombol membuka modal katalog pemilihan 1 produk gratis, menampilkan item hadiah terpilih, dan opsi batalkan penukaran jika ingin disimpan.
4. **Layar Detail Pesanan (`OrderDetailScreen.js`)**:
   - Menampilkan badge khusus `🎁 Hadiah Poin (Rp 0)` pada item produk hadiah.

## 6. Rencana Pengujian Otomatis (Testing)
- `PointServiceTest.php`:
  1. Uji perhitungan poin: subtotal < 50k = 0 poin, 50k = 1 poin, 135k = 2 poin, 200k = 4 poin.
  2. Uji pemberian poin saat pesanan selesai (tidak menduplikasi poin jika dipanggil 2x).
  3. Uji penolakan checkout hadiah jika poin < 10.
  4. Uji kelulusan checkout hadiah jika poin >= 10 (saldo berkurang 10, item Rp 0 tercatat).
  5. Uji pengembalian 10 poin saat pesanan dengan hadiah dibatalkan.
