# Desain Fitur Penukaran Poin Langsung dari Halaman Profil & Modal Riwayat (Cara ke-2 Tukar Poin)

## 1. Ringkasan & Tujuan
Menyediakan metode ke-2 untuk penukaran poin loyalti pelanggan: **Klaim Hadiah Langsung dari Halaman Profil / Modal Riwayat Poin** tanpa harus melewati alur belanja keranjang biasa. Dengan fitur ini, pelanggan memiliki 2 cara fleksibel untuk menikmati reward mereka:
1. **Cara 1**: Saat Checkout pesanan belanja biasa (`CheckoutScreen.js`).
2. **Cara 2**: Langsung dari Layar Profil (`ProfileScreen.js`) atau Modal Riwayat Poin (`PointHistoryModal.js`) dengan membuat pesanan klaim hadiah instan (Rp 0).

## 2. Alur Pengguna (User Flow)

```mermaid
flowchart TD
    A[Pelanggan Buka Layar Profil / Modal Riwayat Poin] --> B{Saldo Poin >= 10?}
    B -- Tidak (< 10 Poin) --> C[Tombol 'Tukar 10 Poin' Membuka Modal Edukatif 😔]
    C --> D[Info: Kurang Poin & Ajakan Belanja]
    B -- Ya (>= 10 Poin) --> E[Klik Tombol '🎁 TUKAR 10 POIN SEKARANG']
    E --> F[Buka Modal Katalog Produk Hadiah dengan Live Search]
    F --> G[Pelanggan Memilih 1 Produk Hadiah]
    G --> H[Muncul Pop-up Konfirmasi Klaim Hadiah Instan]
    H --> I[Pilih Pengambilan: 🏬 Ambil di Toko Rp 0 / 🛵 Antar ke Alamat]
    I --> J[Klik Tombol '🎉 KLAIM SEKARANG (-10 POIN)']
    J --> K[API POST /api/points/redeem-direct]
    K --> L[Pesanan Baru Dibuat Status: 'Diproses' & Lunas Rp 0]
    L --> M[Poin Terpotong 10, Notifikasi & Alert Sukses Muncul]
    M --> N[Otomatis Refresh Profil & Riwayat Poin]
```

## 3. Komponen Antarmuka & Tampilan (UI/UX)

### A. Layar Profil (`ProfileScreen.js`)
- Pada Member Card **Della Rewards Club**:
  - Terdapat tombol aksi dinamis:
    - Jika saldo < 10: Tombol outline amber/gold **`[ 🎁 Tukar 10 Poin ]`** (jika di-tap membuka modal edukatif *"Poin Kamu Belum Cukup!"*).
    - Jika saldo >= 10: Tombol highlight gradient emas/hijau terang **`[ 🎁 TUKAR 10 POIN (PRODUK GRATIS) ]`** dengan animasi pulse/glow yang menarik perhatian pelanggan.

### B. Modal Riwayat Poin (`PointHistoryModal.js`)
- Pada bagian atas summary card:
  - Tombol **`[ 🎁 Tukar Poin ]`** di samping label saldo poin aktif.

### C. Modal Pemilih Produk Hadiah (`DirectRewardModal` atau Terintegrasi)
- Menampilkan katalog produk aktif yang berstok dengan pencarian live search.
- Thumbnail produk, nama produk, kategori, dan tombol **`[ PILIH HADIAH ➔ ]`**.

### D. Pop-up Konfirmasi Klaim Hadiah Instan
- Kartu preview produk hadiah yang dipilih.
- Biaya Total: **GRATIS (Rp 0)**.
- Pilihan Metode Pengambilan:
  - 🏬 **Ambil di Toko (Gratis Rp 0)**
  - 🛵 **Antar ke Alamat** (Alamat pengiriman user).
- Tombol Utama: **`[ 🎉 KLAIM SEKARANG (-10 POIN) ]`**.

## 4. Backend API & Arsitektur Layanan

### A. Endpoint Baru
- `POST /api/points/redeem-direct`
  - **Header**: `Authorization: Bearer <token>`
  - **Body Request**:
    - `product_id`: `int` (wajib)
    - `delivery_method`: `'ambil_toko'` | `'antar_alamat'` (default: `'ambil_toko'`)
    - `shipping_address`: `string` (opsional jika ambil toko, default dari profil jika antar alamat)
    - `note`: `string` (opsional)
  - **Respons Sukses (HTTP 201)**:
    ```json
    {
      "success": true,
      "message": "🎉 Selamat! Penukaran 10 poin berhasil. Pesanan hadiah gratis Anda sedang diproses oleh toko!",
      "data": {
        "order": {
          "id": 123,
          "order_code": "ORD-20260814-0005",
          "order_status": "Diproses",
          "payment_status": "lunas",
          "total_amount": 0,
          "points_spent": 10,
          "delivery_method": "ambil_toko"
        },
        "remaining_points": 3
      }
    }
    ```

### B. PointService (`createDirectRedeemOrder`)
- Menjalankan transaksi database `DB::transaction`:
  1. Validasi saldo pelanggan (`$user->total_poin >= 10`).
  2. Validasi ketersediaan dan stok produk hadiah (`$product->stok >= 1`).
  3. Mengurangi stok produk hadiah sebanyak 1.
  4. Memotong 10 poin dari `$user->total_poin`.
  5. Membuat record `Pesanan` baru dengan `total_harga = 0`, `status_pesanan = 'Diproses'`, `status_pembayaran = 'lunas'`, `metode_pembayaran = 'poin'`, `poin_digunakan = 10`.
  6. Membuat record `DetailPesanan` dengan `harga = 0`, `subtotal = 0`, `is_reward = true`.
  7. Membuat record `RiwayatPoin` tipe `'keluar'` (-10 poin).
  8. Mengirim notifikasi in-app untuk Admin & Pelanggan.

## 5. Rencana Pengujian Otomatis
1. **Feature Test**: Tambahkan test case di `PointServiceTest.php` untuk menguji:
   - Sukses direct redeem dengan 10 poin (pesanan terbentuk, poin terpotong 10, stok produk berkurang 1).
   - Penolakan direct redeem jika poin < 10.
   - Penolakan jika stok produk reward habis (0).
   - Pengembalian 10 poin jika pesanan klaim langsung ini dibatalkan.
2. **Frontend Test**:
   - Pengecekan sintaks AST React Native pada `ProfileScreen.js` dan `PointHistoryModal.js`.
