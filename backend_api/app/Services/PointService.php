<?php

namespace App\Services;

use App\Models\DetailPesanan;
use App\Models\Notifikasi;
use App\Models\Pesanan;
use App\Models\Produk;
use App\Models\RiwayatPoin;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class PointService
{
    /**
     * Rasio belanja: Rp 50.000 = 1 Poin.
     */
    public const SPEND_PER_POINT = 50000;

    /**
     * Nilai tukar 1 produk gratis = 10 Poin.
     */
    public const REDEEM_POINTS_COST = 10;

    /**
     * Hitung poin dari subtotal produk (dibulatkan ke bawah).
     */
    public static function calculatePoints(float $productSubtotal): int
    {
        if ($productSubtotal < self::SPEND_PER_POINT) {
            return 0;
        }
        return (int) floor($productSubtotal / self::SPEND_PER_POINT);
    }

    /**
     * Berikan poin ke pelanggan saat pesanan berstatus Selesai.
     * Dijamin idempotens (hanya 1x per pesanan).
     */
    public static function awardPointsForOrder($order): int
    {
        return DB::transaction(function () use ($order) {
            $lockedOrder = Pesanan::lockForUpdate()->find($order->id);
            if (!$lockedOrder) {
                return 0;
            }

            // Jika sudah pernah diberi poin untuk pesanan ini, lewati
            if ($lockedOrder->poin_diperoleh > 0) {
                return 0;
            }

            // Hitung subtotal produk non-hadiah
            $productSubtotal = DetailPesanan::where('pesanan_id', $lockedOrder->id)
                ->where('is_reward', false)
                ->sum('subtotal');

            $earnedPoints = self::calculatePoints((float) $productSubtotal);
            if ($earnedPoints <= 0) {
                return 0;
            }

            $user = User::lockForUpdate()->find($lockedOrder->pengguna_id);
            if (!$user) {
                return 0;
            }

            $newBalance = ($user->total_poin ?? 0) + $earnedPoints;
            $user->update(['total_poin' => $newBalance]);

            $lockedOrder->update(['poin_diperoleh' => $earnedPoints]);

            // Catat log riwayat poin
            RiwayatPoin::create([
                'pengguna_id' => $user->id,
                'pesanan_id' => $lockedOrder->id,
                'jenis' => 'masuk',
                'jumlah_poin' => $earnedPoints,
                'saldo_akhir' => $newBalance,
                'keterangan' => "Perolehan {$earnedPoints} poin dari pesanan #{$lockedOrder->kode_pesanan} (Belanja Rp " . number_format($productSubtotal, 0, ',', '.') . ")",
            ]);

            // Buat notifikasi reward untuk pelanggan
            try {
                Notifikasi::create([
                    'pengguna_id' => $user->id,
                    'judul' => '🎉 Poin Loyalti Diterima!',
                    'pesan' => "Selamat! Anda mendapatkan +{$earnedPoints} Poin dari pesanan #{$lockedOrder->kode_pesanan}. Total saldo poin Anda: {$newBalance} Poin.",
                    'jenis' => 'poin_masuk',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi poin: ' . $e->getMessage());
            }

            return $earnedPoints;
        });
    }

    /**
     * Tukar poin pelanggan saat checkout untuk mendapatkan 1 produk gratis.
     */
    public static function redeemPointsForOrder($user, $order, int $rewardProductId): bool
    {
        $lockedUser = User::lockForUpdate()->find($user->id);
        if (!$lockedUser || $lockedUser->total_poin < self::REDEEM_POINTS_COST) {
            throw new Exception("Poin Anda tidak mencukupi untuk klaim reward (Dibutuhkan: " . self::REDEEM_POINTS_COST . " poin, Saldo: " . ($lockedUser ? $lockedUser->total_poin : 0) . " poin).");
        }

        $rewardProduct = Produk::find($rewardProductId);
        if (!$rewardProduct || $rewardProduct->status !== 'active') {
            throw new Exception("Produk hadiah yang dipilih tidak tersedia atau sedang non-aktif.");
        }

        if ($rewardProduct->stok < 1) {
            throw new Exception("Stok untuk produk hadiah '{$rewardProduct->nama}' sedang habis.");
        }

        // Potong saldo poin
        $newBalance = $lockedUser->total_poin - self::REDEEM_POINTS_COST;
        $lockedUser->update(['total_poin' => $newBalance]);

        // Update pesanan
        $order->update([
            'poin_digunakan' => self::REDEEM_POINTS_COST,
            'produk_hadiah_id' => $rewardProduct->id,
        ]);

        // Catat di detail pesanan dengan harga Rp 0
        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $rewardProduct->id,
            'nama_produk' => $rewardProduct->nama . ' (🎁 Hadiah Poin)',
            'harga' => 0,
            'jumlah' => 1,
            'subtotal' => 0,
            'is_reward' => true,
        ]);

        // Catat riwayat poin
        RiwayatPoin::create([
            'pengguna_id' => $lockedUser->id,
            'pesanan_id' => $order->id,
            'jenis' => 'keluar',
            'jumlah_poin' => self::REDEEM_POINTS_COST,
            'saldo_akhir' => $newBalance,
            'keterangan' => "Tukar " . self::REDEEM_POINTS_COST . " poin: 1x {$rewardProduct->nama} gratis (Pesanan #{$order->kode_pesanan})",
        ]);

        return true;
    }

    /**
     * Kembalikan poin pelanggan jika pesanan yang menggunakan poin dibatalkan.
     */
    public static function refundPointsForOrder($order): int
    {
        $lockedOrder = Pesanan::lockForUpdate()->find($order->id);
        if (!$lockedOrder || $lockedOrder->poin_digunakan <= 0) {
            return 0;
        }

        $pointsToRefund = $lockedOrder->poin_digunakan;
        $user = User::lockForUpdate()->find($lockedOrder->pengguna_id);

        if ($user) {
            $newBalance = ($user->total_poin ?? 0) + $pointsToRefund;
            $user->update(['total_poin' => $newBalance]);

            RiwayatPoin::create([
                'pengguna_id' => $user->id,
                'pesanan_id' => $lockedOrder->id,
                'jenis' => 'masuk',
                'jumlah_poin' => $pointsToRefund,
                'saldo_akhir' => $newBalance,
                'keterangan' => "Pengembalian {$pointsToRefund} poin dari pembatalan pesanan #{$lockedOrder->kode_pesanan}",
            ]);

            try {
                Notifikasi::create([
                    'pengguna_id' => $user->id,
                    'judul' => '↩️ Pengembalian Poin Loyalti',
                    'pesan' => "Pesanan #{$lockedOrder->kode_pesanan} dibatalkan. {$pointsToRefund} poin Anda telah dikembalikan. Total saldo poin: {$newBalance} Poin.",
                    'jenis' => 'poin_masuk',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi refund poin: ' . $e->getMessage());
            }
        }

        $lockedOrder->update(['poin_digunakan' => 0]);
        return $pointsToRefund;
    }

    /**
     * Tukar poin langsung (Direct Redeem) dari halaman Profil / Riwayat Poin.
     * Membuat pesanan klaim hadiah gratis instan.
     */
    public static function createDirectRedeemOrder(
        User $user,
        int $rewardProductId,
        string $deliveryMethod = 'ambil_toko',
        ?string $shippingAddress = null,
        ?string $note = null
    ): Pesanan {
        return DB::transaction(function () use ($user, $rewardProductId, $deliveryMethod, $shippingAddress, $note) {
            $lockedUser = User::lockForUpdate()->find($user->id);
            if (!$lockedUser || $lockedUser->total_poin < self::REDEEM_POINTS_COST) {
                throw new Exception("Poin Anda tidak mencukupi untuk klaim reward (Dibutuhkan: " . self::REDEEM_POINTS_COST . " poin, Saldo: " . ($lockedUser ? $lockedUser->total_poin : 0) . " poin).");
            }

            $rewardProduct = Produk::lockForUpdate()->find($rewardProductId);
            if (!$rewardProduct || $rewardProduct->status !== 'active') {
                throw new Exception("Produk hadiah yang dipilih tidak tersedia atau sedang non-aktif.");
            }

            if ($rewardProduct->stok < 1) {
                throw new Exception("Stok untuk produk hadiah '{$rewardProduct->nama}' sedang habis.");
            }

            // Kurangi stok produk 1 pcs
            $rewardProduct->decrement('stok', 1);

            // Potong saldo poin pelanggan
            $newBalance = $lockedUser->total_poin - self::REDEEM_POINTS_COST;
            $lockedUser->update(['total_poin' => $newBalance]);

            // Buat kode pesanan
            $today = now()->format('Ymd');
            $countToday = Pesanan::whereDate('created_at', now()->toDateString())->count() + 1;
            $orderCode = 'ORD-' . $today . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);

            // Alamat pengiriman
            $finalAddress = $deliveryMethod === 'ambil_toko'
                ? 'Ambil di Toko Della Frozen Mart (Tanjung Enim)'
                : ($shippingAddress ?: ($lockedUser->alamat ?: 'Alamat Pelanggan'));

            // Buat record pesanan (Klaim reward gratis: Rp 0, status langsung Diproses & Lunas)
            $order = Pesanan::create([
                'pengguna_id' => $lockedUser->id,
                'kode_pesanan' => $orderCode,
                'tanggal_pesanan' => now()->toDateString(),
                'total_harga' => 0,
                'ongkos_kirim' => 0,
                'status_pesanan' => 'Diproses',
                'status_pembayaran' => 'lunas',
                'metode_pembayaran' => 'poin',
                'metode_pengiriman' => $deliveryMethod,
                'alamat_pengiriman' => $finalAddress,
                'poin_digunakan' => self::REDEEM_POINTS_COST,
                'poin_diperoleh' => 0,
                'produk_hadiah_id' => $rewardProduct->id,
            ]);

            // Catat di detail pesanan dengan harga Rp 0 & is_reward = true
            DetailPesanan::create([
                'pesanan_id' => $order->id,
                'produk_id' => $rewardProduct->id,
                'nama_produk' => $rewardProduct->nama . ' (🎁 Hadiah Poin)',
                'harga' => 0,
                'jumlah' => 1,
                'subtotal' => 0,
                'is_reward' => true,
            ]);

            // Catat riwayat pengurangan poin
            RiwayatPoin::create([
                'pengguna_id' => $lockedUser->id,
                'pesanan_id' => $order->id,
                'jenis' => 'keluar',
                'jumlah_poin' => self::REDEEM_POINTS_COST,
                'saldo_akhir' => $newBalance,
                'keterangan' => "Tukar 10 poin langsung: 1x {$rewardProduct->nama} gratis (Pesanan #{$order->kode_pesanan})",
            ]);

            // Notifikasi Realtime untuk Admin Toko & Owner
            try {
                Notifikasi::create([
                    'pengguna_id' => null,
                    'judul' => '🎁 KLAIM HADIAH POIN BARU!',
                    'pesan' => "Pelanggan {$lockedUser->nama} menukar 10 poin dengan 1x {$rewardProduct->nama} (#{$order->kode_pesanan}).",
                    'jenis' => 'klaim_hadiah',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi admin klaim poin: ' . $e->getMessage());
            }

            // Notifikasi untuk Pelanggan
            try {
                Notifikasi::create([
                    'pengguna_id' => $lockedUser->id,
                    'judul' => '🎉 Klaim Hadiah Poin Berhasil!',
                    'pesan' => "Anda berhasil menukar 10 poin dengan 1x {$rewardProduct->nama}. Pesanan Anda (#{$order->kode_pesanan}) sedang disiapkan toko!",
                    'jenis' => 'poin_keluar',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi pelanggan klaim poin: ' . $e->getMessage());
            }

            return $order;
        });
    }
}

