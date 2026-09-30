<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Payment;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Exception;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'delivery_method' => 'required|in:ambil_toko,antar_alamat',
            'payment_method' => 'required|in:transfer,qris,cod',
            'shipping_address' => 'required_if:delivery_method,antar_alamat|nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'branch_id' => 'nullable|exists:cabang_toko,id',
            'payment_proof' => 'nullable|file|max:10240',
            'reward_product_id' => 'nullable|exists:produk,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $cartItems = Cart::with('product')->where('pengguna_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Keranjang belanja Anda kosong.'
            ], 400);
        }

        try {
            $order = DB::transaction(function () use ($user, $cartItems, $request) {
                $productSubtotal = 0;

                // 1. Validate stocks first
                foreach ($cartItems as $item) {
                    if (!$item->product || $item->product->status !== 'active') {
                        throw new Exception("Produk '{$item->product->name}' tidak aktif atau tidak ditemukan.");
                    }

                    if ($item->product->stock < $item->quantity) {
                        throw new Exception("Stok untuk produk '{$item->product->name}' tidak mencukupi. (Tersedia: {$item->product->stock}, Anda meminta: {$item->quantity})");
                    }

                    $productSubtotal += $item->product->price * $item->quantity;
                }

                // Calculate shipping and select closest branch
                $shippingFee = 0;
                $distance = 0;
                $branchId = null;

                if ($request->delivery_method === 'antar_alamat') {
                    $lat = $request->input('latitude');
                    $lng = $request->input('longitude');

                    if (!$lat || !$lng) {
                        // Fallback: cari dari alamat utama pengguna
                        $primaryAddress = \App\Models\AlamatPengguna::where('pengguna_id', $user->id)
                            ->where('is_utama', true)
                            ->first();

                        if ($primaryAddress && $primaryAddress->latitude && $primaryAddress->longitude) {
                            $lat = $primaryAddress->latitude;
                            $lng = $primaryAddress->longitude;
                        }
                    }

                    if ($lat && $lng) {
                        // Find closest branch
                        $branches = \App\Models\CabangToko::all();
                        $minDistance = 999999;
                        $closestBranch = null;

                        foreach ($branches as $branch) {
                            $dist = $this->getDrivingDistance($lat, $lng, $branch->latitude, $branch->longitude);
                            if ($dist < $minDistance) {
                                $minDistance = $dist;
                                $closestBranch = $branch;
                            }
                        }

                        if ($closestBranch) {
                            $branchId = $closestBranch->id;
                            $distance = $minDistance;

                            if ($distance > 10) {
                                throw new Exception("Alamat Anda berada di luar jangkauan pengiriman Della Frozen Mart (Maksimal 10 km).");
                            }

                            // Perhitungan Ongkir Berjenjang:
                            // <= 5 km: Rp 5.000
                            // 5 - 10 km: Rp 10.000
                            if ($distance <= 5) {
                                $shippingFee = 5000;
                            } else {
                                $shippingFee = 10000;
                            }
                        }
                    }
                } else {
                    // Ambil di Toko: use selected branch_id or default to Toko Utama (id: 1)
                    $branchId = $request->input('branch_id') ?: 1;
                }

                $totalAmount = $productSubtotal + $shippingFee;

                // 2. Generate unique order code
                $date = now()->format('Ymd');
                $count = Order::whereDate('created_at', now()->toDateString())->count() + 1;
                $orderCode = 'ORD-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                $paymentProofPath = null;
                if (in_array($request->payment_method, ['transfer', 'qris']) && $request->hasFile('payment_proof')) {
                    $paymentProofPath = $request->file('payment_proof')->store('payments', 'public');
                }

                $orderStatus = ($request->payment_method === 'cod' || $paymentProofPath) ? 'Menunggu Konfirmasi' : 'Menunggu Pembayaran';
                $waktuTenggat = $request->payment_method === 'cod' ? null : now()->addMinutes(30);

                // 3. Create Order
                $order = Order::create([
                    'pengguna_id' => $user->id,
                    'cabang_toko_id' => $branchId,
                    'order_code' => $orderCode,
                    'order_date' => now()->toDateString(),
                    'total_amount' => $totalAmount,
                    'ongkos_kirim' => $shippingFee,
                    'jarak_pengiriman' => $distance,
                    'payment_method' => $request->payment_method,
                    'delivery_method' => $request->delivery_method,
                    'shipping_address' => $request->delivery_method === 'antar_alamat' ? $request->shipping_address : 'Ambil di Toko',
                    'order_status' => $orderStatus,
                    'payment_status' => 'belum_bayar',
                    'waktu_tenggat_pembayaran' => $waktuTenggat,
                ]);

                // 4. Create Order Details
                foreach ($cartItems as $item) {
                    $subtotal = $item->product->price * $item->quantity;
                    OrderDetail::create([
                        'order_id' => $order->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name,
                        'price' => $item->product->price,
                        'quantity' => $item->quantity,
                        'subtotal' => $subtotal,
                    ]);
                }

                // 5. Create Payment record
                Payment::create([
                    'order_id' => $order->id,
                    'payment_method' => $request->payment_method,
                    'payment_proof' => $paymentProofPath,
                    'payment_status' => 'pending',
                ]);

                // 5b. Handle Point Redemption for Free Reward Product
                if ($request->filled('reward_product_id')) {
                    \App\Services\PointService::redeemPointsForOrder($user, $order, (int) $request->reward_product_id);
                }

                // 6. Send Notification to Admin
                try {
                    if ($request->payment_method === 'cod') {
                        \App\Models\Notifikasi::create([
                            'pengguna_id' => null,
                            'judul' => 'Pesanan COD Baru Masuk 🛵',
                            'pesan' => "Pesanan COD #{$order->order_code} dari {$user->name} sebesar Rp " . number_format($order->total_amount, 0, ',', '.'),
                            'jenis' => 'pesanan_baru',
                        ]);
                    } else if ($paymentProofPath) {
                        \App\Models\Notifikasi::create([
                            'pengguna_id' => null,
                            'judul' => 'Bukti Pembayaran Diunggah 💳',
                            'pesan' => "Pelanggan {$user->name} telah mengunggah bukti pembayaran untuk pesanan #{$order->order_code}.",
                            'jenis' => 'bukti_pembayaran',
                        ]);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi admin checkout: ' . $e->getMessage());
                }

                // 7. Clear Cart
                Cart::where('pengguna_id', $user->id)->delete();

                return $order;
            });

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data' => [
                    'order_id' => $order->id,
                    'order_code' => $order->order_code,
                    'total_amount' => (float) $order->total_amount,
                    'order_status' => $order->order_status,
                ]
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    private function cancelExpiredOrders()
    {
        try {
            $expiredOrders = Order::where(function ($query) {
                    $query->where('status_pesanan', 'Menunggu Pembayaran')
                          ->orWhere('status_pesanan', 'menunggu_pembayaran');
                })
                ->where('metode_pembayaran', '!=', 'cod')
                ->get()
                ->filter(function ($order) {
                    if ($order->waktu_tenggat_pembayaran) {
                        return \Carbon\Carbon::parse($order->waktu_tenggat_pembayaran)->isPast();
                    }
                    if ($order->created_at) {
                        return \Carbon\Carbon::parse($order->created_at)->addMinutes(30)->isPast();
                    }
                    return false;
                });

            foreach ($expiredOrders as $order) {
                StockService::cancelOrder($order, 'Dibatalkan otomatis oleh sistem (Batas waktu pembayaran 30 menit telah habis)');
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in cancelExpiredOrders: ' . $e->getMessage());
        }
    }

    private function autoCompleteOrders()
    {
        try {
            $cutoff = now()->subMinutes(15);
            $ordersToComplete = Order::whereIn('status_pesanan', ['Dikirim', 'dikirim', 'Siap Diambil', 'siap diambil', 'siap_diambil'])
                ->get()
                ->filter(function ($order) use ($cutoff) {
                    // isPurePointOrder: HANYA pesanan murni tukar poin (metode = 'poin' & total = 0)
                    // Mixed order (produk reguler + hadiah poin) mengikuti alur otomatis normal
                    $isPointOrder = strtolower($order->metode_pembayaran ?? '') === 'poin' ||
                        ($order->total_harga == 0 && $order->metode_pengiriman === 'ambil_toko');
                    if ($isPointOrder) {
                        return false; // Pesanan klaim poin murni hanya diselesaikan manual oleh Admin di toko
                    }
                    $refTime = $order->waktu_dikirim ? \Carbon\Carbon::parse($order->waktu_dikirim) : ($order->updated_at ? \Carbon\Carbon::parse($order->updated_at) : null);
                    return $refTime && $refTime->lessThanOrEqualTo($cutoff);
                });

            foreach ($ordersToComplete as $order) {
                $order->update([
                    'status_pesanan' => 'Selesai',
                    'status_pembayaran' => 'lunas',
                    'waktu_selesai' => now(),
                ]);
                if ($order->payment) {
                    $order->payment->update(['payment_status' => 'approved']);
                }

                // Berikan Poin Loyalti ke Pelanggan
                \App\Services\PointService::awardPointsForOrder($order);

                \App\Models\Notifikasi::create([
                    'pengguna_id' => $order->pengguna_id,
                    'judul' => 'Pesanan Selesai Otomatis 🎉',
                    'pesan' => "Pesanan #{$order->kode_pesanan} telah otomatis ditandai Selesai setelah 15 menit.",
                    'jenis' => 'status_pesanan',
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in autoCompleteOrders: ' . $e->getMessage());
        }
    }

    public function index(Request $request)
    {
        $this->cancelExpiredOrders();
        $this->autoCompleteOrders();

        $orders = Order::with(['chats.pengirim'])
            ->where('pengguna_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ], 200);
    }

    public function show(Request $request, $id)
    {
        $this->cancelExpiredOrders();
        $this->autoCompleteOrders();

        $order = Order::with(['orderDetails.product', 'payment', 'user', 'chats.pengirim'])
            ->where('pengguna_id', $request->user()->id)
            ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order
        ], 200);
    }

    public function tracking(Request $request, $id)
    {
        $order = Order::with(['kurir', 'payment', 'branch', 'user'])
            ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        // Get Store Location (Della Frozen Mart Pusat)
        $branch = \App\Models\CabangToko::find(1);

        $kurir = $order->kurir;
        if (!$kurir) {
            $kurir = \App\Models\User::where('peran', 'kurir')->first();
        }

        // Calculate distance & ETA between courier position and order address destination
        $destLat = $order->latitude ?: -3.798370;
        $destLng = $order->longitude ?: 103.799277;
        
        $kurirLat = $kurir ? ($kurir->latitude ?: -3.765000) : -3.763872;
        $kurirLng = $kurir ? ($kurir->longitude ?: 103.806000) : 103.8079257;

        $distanceKm = $this->getDrivingDistance($kurirLat, $kurirLng, $destLat, $destLng);
        $etaMinutes = max(5, round($distanceKm * 3)); // ~3 mins per km in city traffic

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $order->id,
                'order_code' => $order->kode_pesanan,
                'order_status' => $order->status_pesanan,
                'customer_name' => $order->user ? $order->user->nama : $request->user()->nama,
                'shipping_address' => $order->alamat_pengiriman,
                'destination' => [
                    'latitude' => (float) $destLat,
                    'longitude' => (float) $destLng,
                ],
                'store' => [
                    'name' => $branch ? $branch->nama : 'Della Frozen Mart (Pusat)',
                    'address' => $branch ? $branch->alamat : 'Jl. Kiemas, Tanjung Enim',
                    'latitude' => (float) ($branch ? $branch->latitude : -3.763872),
                    'longitude' => (float) ($branch ? $branch->longitude : 103.8079257),
                ],
                'kurir' => $kurir ? [
                    'id' => $kurir->id,
                    'name' => $kurir->nama,
                    'phone' => $kurir->telepon,
                    'plat_kendaraan' => $kurir->plat_kendaraan ?: 'BG 4821 EY',
                    'jenis_kendaraan' => $kurir->jenis_kendaraan ?: 'Honda Vario 125',
                    'latitude' => (float) $kurirLat,
                    'longitude' => (float) $kurirLng,
                ] : null,
                'distance_km' => round($distanceKm, 2),
                'eta_minutes' => (int) $etaMinutes,
            ]
        ], 200);
    }

    public function uploadPayment(Request $request, $id)
    {
        $order = Order::where('pengguna_id', $request->user()->id)->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        if ($order->payment_method === 'cod') {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran COD tidak memerlukan upload bukti transfer.'
            ], 400);
        }

        \Illuminate\Support\Facades\Log::info('Upload payment request details:', [
            'has_payment_proof' => $request->hasFile('payment_proof'),
            'file_error_code' => $request->hasFile('payment_proof') ? $request->file('payment_proof')->getError() : 'no file',
            'all_files' => array_keys($request->allFiles()),
            'content_type' => $request->header('Content-Type'),
            'content_length' => $request->header('Content-Length'),
        ]);

        $validator = Validator::make($request->all(), [
            'payment_proof' => 'required|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'File bukti pembayaran wajib diunggah dan maksimal 10MB.',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('payment_proof');
        $originalName = $file->getClientOriginalName();
        $ext = strtolower($file->getClientOriginalExtension());
        $mime = $file->getClientMimeType();

        \Illuminate\Support\Facades\Log::info('Uploaded file metadata:', [
            'original_name' => $originalName,
            'extension' => $ext,
            'mime_type' => $mime,
        ]);

        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'pdf', 'heic', 'heif'])) {
            return response()->json([
                'success' => false,
                'message' => 'Format file bukti pembayaran harus berupa JPG, JPEG, PNG, HEIC, atau PDF.'
            ], 422);
        }

        try {
            // Use real database columns: pesanan_id, bukti_pembayaran, status_pembayaran
            $payment = Payment::where('pesanan_id', $order->id)->first();

            if (!$payment) {
                $payment = Payment::create([
                    'pesanan_id' => $order->id,
                    'metode_pembayaran' => $order->metode_pembayaran,
                    'status_pembayaran' => 'pending',
                ]);
            }

            // Delete old file if exists
            if ($payment->bukti_pembayaran) {
                Storage::disk('public')->delete($payment->bukti_pembayaran);
            }

            // Store new file in storage/app/public/payments/
            $path = $request->file('payment_proof')->store('payments', 'public');

            $payment->update([
                'bukti_pembayaran' => $path,
                'status_pembayaran' => 'pending',
            ]);

            // Update order status to Menunggu Konfirmasi
            $order->update([
                'order_status' => 'Menunggu Konfirmasi'
            ]);

            // Send Notification to Admin
            try {
                \App\Models\Notifikasi::create([
                    'pengguna_id' => null,
                    'judul' => 'Bukti Pembayaran Diunggah 💳',
                    'pesan' => "Pelanggan {$order->user->name} telah mengunggah bukti pembayaran untuk pesanan #{$order->order_code}.",
                    'jenis' => 'bukti_pembayaran',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi admin upload: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.'
            ], 200);

        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exception during uploadPayment:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah bukti pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::where('pengguna_id', $request->user()->id)->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        $currentStatus = strtolower($order->order_status);

        // Pelanggan can only cancel if not confirmed yet
        if (!in_array($currentStatus, ['menunggu pembayaran', 'menunggu konfirmasi', 'menunggu_pembayaran', 'menunggu_konfirmasi'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan yang sudah diproses atau selesai tidak dapat dibatalkan.'
            ], 400);
        }

        try {
            // Since it's not confirmed yet, stock has not been deducted.
            // We can just set status to Dibatalkan.
            StockService::cancelOrder($order);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function received(Request $request, $id)
    {
        $order = Order::where('pengguna_id', $request->user()->id)->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        // isPurePointOrder: HANYA pesanan murni tukar poin (metode = 'poin' & total = 0)
        // Mixed order (produk reguler + hadiah poin) bisa diselesaikan oleh Pelanggan sendiri
        $isPointOrder = strtolower($order->metode_pembayaran ?? '') === 'poin' ||
            ($order->total_harga == 0 && $order->metode_pengiriman === 'ambil_toko');
        if ($isPointOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan klaim hadiah poin hanya dapat diselesaikan oleh Petugas Kasir / Admin Toko saat Anda mengambil produk di toko.'
            ], 403);
        }

        try {
            $order->update([
                'status_pesanan' => 'Selesai',
                'status_pembayaran' => 'lunas',
                'waktu_selesai' => now(),
            ]);

            if ($order->payment) {
                $order->payment->update(['status_pembayaran' => 'approved']);
            }

            // Berikan Poin Loyalti ke Pelanggan
            \App\Services\PointService::awardPointsForOrder($order);

            // Buat Notifikasi Penyelesaian untuk Pelanggan
            \App\Models\Notifikasi::create([
                'pengguna_id' => $order->pengguna_id,
                'judul' => '🎉 Pesanan Selesai!',
                'pesan' => "Terima kasih! Pesanan #{$order->kode_pesanan} telah Anda konfirmasi diterima.",
                'jenis' => 'status_pesanan',
            ]);

            // Buat Notifikasi untuk Admin (Notifikasi Real-time Admin)
            try {
                \App\Models\Notifikasi::create([
                    'pengguna_id' => null,
                    'judul' => '🎉 PESANAN DITERIMA & SELESAI!',
                    'pesan' => "Pelanggan {$order->user->name} telah mengonfirmasi penerimaan pesanan #{$order->kode_pesanan}.",
                    'jenis' => 'pesanan_selesai',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi admin pesanan selesai: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dikonfirmasi diterima.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengonfirmasi penerimaan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper to get driving distance from OSRM with Haversine fallback.
     */
    private function getDrivingDistance($lat1, $lon1, $lat2, $lon2)
    {
        try {
            $url = "http://router.project-osrm.org/route/v1/driving/{$lon1},{$lat1};{$lon2},{$lat2}";
            $response = Http::timeout(3)->get($url, ['overview' => 'false']);
            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['routes'][0]['distance'])) {
                    return $data['routes'][0]['distance'] / 1000;
                }
            }
        } catch (Exception $e) {
            // fallback
        }

        // Haversine formula fallback
        $theta = $lon1 - $lon2;
        $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
        
        // Prevent acos NAN error if values slightly out of range
        if ($dist > 1.0) $dist = 1.0;
        if ($dist < -1.0) $dist = -1.0;

        $dist = acos($dist);
        $dist = rad2deg($dist);
        $miles = $dist * 60 * 1.1515;
        $km = $miles * 1.609344;
        
        return $km * 1.25; // 1.25 winding factor
    }
}
