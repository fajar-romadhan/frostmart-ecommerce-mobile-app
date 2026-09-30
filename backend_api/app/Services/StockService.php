<?php

namespace App\Services;

use App\Models\Pesanan;
use App\Models\Produk;
use App\Models\StokKeluar;
use App\Models\Notifikasi;
use Illuminate\Support\Facades\DB;
use Exception;

class StockService
{
    /**
     * Confirm order and deduct stock.
     */
    public static function confirmOrder($order, $adminId)
    {
        return DB::transaction(function () use ($order, $adminId) {
            // Lock the order row for update
            $lockedOrder = Pesanan::lockForUpdate()->find($order->id);
            if (!$lockedOrder) {
                throw new Exception("Pesanan tidak ditemukan.");
            }

            // Validate order status transition (only allow from pending statuses)
            $currentStatus = strtolower($lockedOrder->status_pesanan);
            $allowedPendingStatuses = ['menunggu pembayaran', 'menunggu konfirmasi', 'menunggu_pembayaran', 'menunggu_konfirmasi'];
            if (!in_array($currentStatus, $allowedPendingStatuses)) {
                throw new Exception("Pesanan dengan status '{$lockedOrder->status_pesanan}' tidak dapat dikonfirmasi.");
            }

            // Load order details if not loaded
            $lockedOrder->load('orderDetails.product');

            foreach ($lockedOrder->orderDetails as $detail) {
                if (!$detail->produk_id) {
                    throw new Exception("ID Produk tidak valid untuk detail pesanan.");
                }

                // Lock the product row for update to prevent race conditions
                $product = Produk::lockForUpdate()->find($detail->produk_id);
                if (!$product) {
                    throw new Exception("Produk '{$detail->nama_produk}' tidak ditemukan di sistem.");
                }

                if ($product->stok < $detail->jumlah) {
                    throw new Exception("Stok untuk produk '{$product->nama}' tidak mencukupi. (Stok tersedia: {$product->stok}, Dipesan: {$detail->jumlah})");
                }

                // Decrement stock
                $product->decrement('stok', $detail->jumlah);

                // Record stock out
                StokKeluar::create([
                    'produk_id' => $product->id,
                    'pesanan_id' => $lockedOrder->id,
                    'jumlah' => $detail->jumlah,
                    'jenis' => 'penjualan',
                    'catatan' => "Pengurangan stok otomatis untuk pesanan #{$lockedOrder->kode_pesanan}",
                ]);

                // Check minimum stock and create notification
                if ($product->fresh()->stok <= $product->stok_minimum) {
                    Notifikasi::create([
                        'pengguna_id' => null, // Broadcast to all admins
                        'judul' => 'Stok Produk Menipis',
                        'pesan' => "Stok produk '{$product->nama}' saat ini tinggal {$product->stok} {$product->satuan}. Silakan lakukan pemesanan kembali.",
                        'jenis' => 'stok_menipis',
                    ]);
                }
            }

            // Update order and payment status
            $lockedOrder->update([
                'status_pesanan' => 'Diproses',
                'status_pembayaran' => 'lunas'
            ]);

            if ($lockedOrder->payment) {
                $lockedOrder->payment->update([
                    'status_pembayaran' => 'approved',
                    'dikonfirmasi_oleh' => $adminId,
                    'dikonfirmasi_pada' => now(),
                ]);
            }

            // Send notification to customer
            Notifikasi::create([
                'pengguna_id' => $lockedOrder->pengguna_id,
                'judul' => 'Pesanan Dikonfirmasi',
                'pesan' => "Pesanan Anda #{$lockedOrder->kode_pesanan} telah dikonfirmasi oleh admin dan sedang diproses.",
                'jenis' => 'status_pesanan',
            ]);

            // Sync original object state
            $order->fill($lockedOrder->toArray());

            return true;
        });
    }

    /**
     * Cancel order and restore stock if it was already confirmed.
     */
    public static function cancelOrder($order, $reason = null)
    {
        return DB::transaction(function () use ($order, $reason) {
            // Lock the order row for update
            $lockedOrder = Pesanan::lockForUpdate()->find($order->id);
            if (!$lockedOrder) {
                throw new Exception("Pesanan tidak ditemukan.");
            }

            $currentStatus = strtolower($lockedOrder->status_pesanan);
            if ($currentStatus === 'dibatalkan') {
                throw new Exception("Pesanan sudah dibatalkan sebelumnya.");
            }

            $lockedOrder->load(['orderDetails', 'stockOuts']);

            // If the order was already confirmed and stock was deducted
            if (in_array($currentStatus, ['diproses', 'siap diambil', 'dikirim', 'siap_diambil'])) {
                foreach ($lockedOrder->orderDetails as $detail) {
                    if ($detail->produk_id) {
                        $product = Produk::lockForUpdate()->find($detail->produk_id);
                        if ($product) {
                            $product->increment('stok', $detail->jumlah);

                            // Record stock recovery in stock_outs
                            StokKeluar::create([
                                'produk_id' => $product->id,
                                'pesanan_id' => $lockedOrder->id,
                                'jumlah' => $detail->jumlah,
                                'jenis' => 'pembatalan',
                                'catatan' => "Pengembalian stok otomatis karena pembatalan pesanan #{$lockedOrder->kode_pesanan}",
                            ]);
                        }
                    }
                }
            }

            // Update order status
            $updateData = [
                'status_pesanan' => 'Dibatalkan',
                'status_pembayaran' => 'dibatalkan',
            ];
            if ($reason) {
                $updateData['catatan_pembatalan'] = $reason;
            }

            $lockedOrder->update($updateData);

            if ($lockedOrder->payment) {
                $lockedOrder->payment->update([
                    'status_pembayaran' => 'rejected',
                ]);
            }

            // Kembalikan Poin Loyalti jika pesanan menggunakan poin hadiah
            \App\Services\PointService::refundPointsForOrder($lockedOrder);

            // Send notification to customer
            Notifikasi::create([
                'pengguna_id' => $lockedOrder->pengguna_id,
                'judul' => 'Pesanan Dibatalkan',
                'pesan' => $reason ?: "Pesanan Anda #{$lockedOrder->kode_pesanan} telah dibatalkan.",
                'jenis' => 'status_pesanan',
            ]);

            // Sync original object state
            $order->fill($lockedOrder->toArray());

            return true;
        });
    }
}
