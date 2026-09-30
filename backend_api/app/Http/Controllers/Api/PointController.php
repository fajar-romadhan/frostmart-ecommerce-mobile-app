<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RiwayatPoin;
use App\Services\PointService;
use Illuminate\Http\Request;

class PointController extends Controller
{
    /**
     * Dapatkan informasi saldo poin dan daftar riwayat perolehan/penukaran poin.
     */
    public function history(Request $request)
    {
        $user = $request->user();

        $history = RiwayatPoin::with('order')
            ->where('pengguna_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        $totalEarned = RiwayatPoin::where('pengguna_id', $user->id)
            ->where('jenis', 'masuk')
            ->sum('jumlah_poin');

        $totalSpent = RiwayatPoin::where('pengguna_id', $user->id)
            ->where('jenis', 'keluar')
            ->sum('jumlah_poin');

        return response()->json([
            'success' => true,
            'data' => [
                'total_points' => (int) ($user->total_poin ?? 0),
                'spend_per_point' => PointService::SPEND_PER_POINT,
                'redeem_points_cost' => PointService::REDEEM_POINTS_COST,
                'total_earned' => (int) $totalEarned,
                'total_spent' => (int) $totalSpent,
                'history' => $history,
            ]
        ], 200);
    }

    /**
     * Dapatkan daftar produk aktif yang tersedia untuk ditukarkan dengan poin hadiah.
     */
    public function rewardProducts(Request $request)
    {
        $products = Product::with('category')
            ->where('status', 'active')
            ->where('stok', '>=', 1)
            ->orderBy('nama', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'redeem_points_cost' => PointService::REDEEM_POINTS_COST,
                'products' => $products,
            ]
        ], 200);
    }

    /**
     * Tukar poin langsung (Direct Redeem) untuk mendapatkan 1 produk gratis tanpa lewat keranjang.
     */
    public function redeemDirect(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'product_id' => 'required|exists:produk,id',
            'delivery_method' => 'nullable|in:ambil_toko,antar_alamat',
            'shipping_address' => 'nullable|string',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi penukaran poin gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            $order = PointService::createDirectRedeemOrder(
                $user,
                (int) $request->product_id,
                $request->delivery_method ?: 'ambil_toko',
                $request->shipping_address,
                $request->note
            );

            return response()->json([
                'success' => true,
                'message' => '🎉 Selamat! Penukaran 10 poin berhasil. Pesanan hadiah gratis Anda sedang diproses oleh toko!',
                'data' => [
                    'order' => $order,
                    'remaining_points' => (int) $user->fresh()->total_poin,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
