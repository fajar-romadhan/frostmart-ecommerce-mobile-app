<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Exception;

class AdminController extends Controller
{
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

    public function dashboard()
    {
        $this->autoCompleteOrders();

        $totalProducts = Product::count();
        $totalOrdersPending = Order::whereIn('status_pesanan', ['Menunggu Pembayaran', 'Menunggu Konfirmasi'])->count();
        $totalOrdersProcessed = Order::whereIn('status_pesanan', ['Diproses', 'Siap Diambil', 'Dikirim'])->count();
        $totalOrdersCompleted = Order::where('status_pesanan', 'Selesai')->count();
        $totalSalesAmount = Order::where('status_pesanan', 'Selesai')->sum('total_harga');

        $latestOrder = Order::orderBy('id', 'desc')->first();
        $latestNotification = \App\Models\Notifikasi::whereNull('pengguna_id')->orderBy('id', 'desc')->first();
        $unreadNotificationsCount = \App\Models\Notifikasi::whereNull('pengguna_id')->where('apakah_dibaca', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_products' => $totalProducts,
                'total_orders_pending' => $totalOrdersPending,
                'total_orders_processed' => $totalOrdersProcessed,
                'total_orders_completed' => $totalOrdersCompleted,
                'total_sales_amount' => (float) $totalSalesAmount,
                'latest_order_id' => $latestOrder ? $latestOrder->id : null,
                'latest_order_code' => $latestOrder ? $latestOrder->order_code : null,
                'latest_notification_id' => $latestNotification ? $latestNotification->id : null,
                'unread_notifications_count' => $unreadNotificationsCount,
            ]
        ], 200);
    }

    public function orders()
    {
        $this->autoCompleteOrders();

        $orders = Order::with(['user', 'kurir', 'payment', 'orderDetails'])->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ], 200);
    }

    public function kurirs()
    {
        $couriers = \App\Models\User::where('peran', 'kurir')->get();

        return response()->json([
            'success' => true,
            'data' => $couriers
        ], 200);
    }

    public function assignKurir(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'kurir_id' => 'required|exists:pengguna,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Kurir wajib dipilih.',
                'errors' => $validator->errors()
            ], 422);
        }

        $kurir = \App\Models\User::find($request->kurir_id);

        $order->update([
            'kurir_id' => $kurir->id,
            'status_pesanan' => 'Dikirim',
            'waktu_dikirim' => now(),
        ]);

        // Buat notifikasi untuk pelanggan
        \App\Models\Notifikasi::create([
            'pengguna_id' => $order->pengguna_id,
            'judul' => '🚚 Pesanan Sedang Dikirim',
            'pesan' => "Pesanan #{$order->kode_pesanan} sedang diantar oleh kurir {$kurir->name} ({$kurir->jenis_kendaraan}).",
            'jenis' => 'status_pesanan',
        ]);

        \App\Models\ActivityLog::record(
            $request->user(),
            'Penugasan Kurir',
            "Admin {$request->user()->name} menugaskan kurir {$kurir->name} untuk pesanan #{$order->kode_pesanan}"
        );

        return response()->json([
            'success' => true,
            'message' => "Kurir {$kurir->nama} berhasil ditugaskan. Pesanan sedang diantar!",
            'data' => $order->fresh(['user', 'kurir', 'payment', 'orderDetails'])
        ], 200);
    }

    public function confirm(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        try {
            $adminId = $request->user()->id;
            StockService::confirmOrder($order, $adminId);

            \App\Models\ActivityLog::record(
                $request->user(),
                'Konfirmasi Pesanan',
                "Admin {$request->user()->name} mengonfirmasi pesanan #{$order->kode_pesanan} dan memotong stok"
            );

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dikonfirmasi. Stok produk telah dikurangi.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function status(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'order_status' => 'required|in:Diproses,Siap Diambil,Dikirim,Selesai,Dibatalkan',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $newStatus = $request->order_status;
        // isPurePointOrder: HANYA pesanan murni tukar poin (metode = 'poin' & total = 0)
        // Mixed order (produk reguler + hadiah poin) diselesaikan oleh Pelanggan (bukan Admin)
        $isPointOrder = strtolower($order->metode_pembayaran ?? '') === 'poin' ||
            ($order->total_harga == 0 && $order->metode_pengiriman === 'ambil_toko');

        if ($newStatus === 'Selesai' && !$isPointOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Status "Selesai" untuk pesanan reguler hanya dapat dikonfirmasi langsung oleh Pelanggan (atau otomatis diselesaikan oleh sistem setelah 15 menit).'
            ], 403);
        }

        try {
            if ($newStatus === 'Dibatalkan') {
                StockService::cancelOrder($order);
            } else {
                $order->update([
                    'status_pesanan' => $newStatus
                ]);

                // If marked completed, make sure payment is marked completed too
                if ($newStatus === 'Selesai') {
                    $order->update([
                        'payment_status' => 'lunas',
                        'waktu_selesai' => now(),
                    ]);
                    if ($order->payment) {
                        $order->payment->update(['payment_status' => 'approved']);
                    }
                }
            }

            // Buat Notifikasi Real-time untuk Pelanggan
            $notifMsg = match($newStatus) {
                'Diproses' => "Pesanan #{$order->kode_pesanan} sedang dikemas oleh toko.",
                'Siap Diambil' => "🏬 Pesanan #{$order->kode_pesanan} siap diambil di toko Della Frozen Mart!",
                'Dikirim' => "🚚 Pesanan #{$order->kode_pesanan} sedang dalam perjalanan pengiriman.",
                'Selesai' => "🎉 Pesanan #{$order->kode_pesanan} telah selesai. Terima kasih telah berbelanja di Della Frozen Mart!",
                'Dibatalkan' => "❌ Pesanan #{$order->kode_pesanan} telah dibatalkan.",
                default => "Status pesanan #{$order->kode_pesanan} diperbarui menjadi {$newStatus}."
            };

            \App\Models\Notifikasi::create([
                'pengguna_id' => $order->pengguna_id,
                'judul' => "Status Pesanan: {$newStatus}",
                'pesan' => $notifMsg,
                'jenis' => 'status_pesanan',
            ]);

            \App\Models\ActivityLog::record(
                $request->user(),
                'Update Status Pesanan',
                "Admin {$request->user()->name} mengubah status pesanan #{$order->kode_pesanan} menjadi '{$newStatus}'"
            );

            return response()->json([
                'success' => true,
                'message' => "Status pesanan berhasil diperbarui menjadi {$newStatus}."
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function products()
    {
        $products = Product::with('category')->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    }

    public function storeProduct(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:kategori,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0.01',
            'stock' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:20',
            'expired_date' => 'nullable|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate product code
            $count = Product::count() + 1;
            $productCode = 'PRD-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('products', 'public');
            }

            $product = Product::create([
                'category_id' => $request->category_id,
                'product_code' => $productCode,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'stock' => $request->stock,
                'minimum_stock' => $request->minimum_stock,
                'unit' => $request->unit,
                'expired_date' => $request->expired_date,
                'image' => $imagePath,
                'status' => 'active',
            ]);

            \App\Models\ActivityLog::record(
                $request->user(),
                'Tambah Produk',
                "Admin {$request->user()->name} menambahkan produk baru: '{$product->name}' (Kode: {$productCode}, Harga: Rp " . number_format($product->harga, 0, ',', '.') . ", Stok Awal: {$product->stok} {$product->satuan})"
            );

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan.',
                'data' => $product
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan produk: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:kategori,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0.01',
            'stock' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:20',
            'expired_date' => 'nullable|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $imagePath = $product->image;
            if ($request->hasFile('image')) {
                // Delete old image
                if ($product->image) {
                    Storage::disk('public')->delete($product->image);
                }
                $imagePath = $request->file('image')->store('products', 'public');
            }

            $product->update([
                'category_id' => $request->category_id,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'stock' => $request->stock,
                'minimum_stock' => $request->minimum_stock,
                'unit' => $request->unit,
                'expired_date' => $request->expired_date,
                'image' => $imagePath,
                'status' => $request->status,
            ]);

            \App\Models\ActivityLog::record(
                $request->user(),
                'Edit Produk',
                "Admin {$request->user()->name} memperbarui produk '{$product->name}' — Harga: Rp " . number_format($product->harga, 0, ',', '.') . ", Stok: {$product->stok} {$product->satuan}, Status: {$product->status}"
            );

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil diperbarui.',
                'data' => $product
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui produk: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyProduct(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.'
            ], 404);
        }

        try {
            $productName = $product->name;
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->delete();

            \App\Models\ActivityLog::record(
                $request->user(),
                'Hapus Produk',
                "Admin {$request->user()->name} menghapus produk: '{$productName}' (ID: {$id})"
            );

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dihapus.'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus produk: ' . $e->getMessage()
            ], 500);
        }
    }

    public function stockIns()
    {
        $stockIns = \App\Models\StokMasuk::with('product')->orderBy('id', 'desc')->take(10)->get();

        return response()->json([
            'success' => true,
            'data' => $stockIns
        ], 200);
    }

    public function stockIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:produk,id',
            'quantity' => 'required|integer|min:1',
            'supplier_name' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $supplierName = $request->supplier_name ?: 'Supplier Toko Della Frozen Mart';
            $purchaseDate = $request->purchase_date ?: now()->toDateString();

            $stockIn = DB::transaction(function () use ($request, $supplierName, $purchaseDate) {
                $product = Product::lockForUpdate()->find($request->product_id);

                // Increment product stock
                $product->increment('stok', $request->quantity);

                // Record stock in
                return StockIn::create([
                    'produk_id' => $request->product_id,
                    'jumlah' => $request->quantity,
                    'nama_pemasok' => $supplierName,
                    'tanggal_pembelian' => $purchaseDate,
                    'catatan' => $request->note,
                ]);
            });

            \App\Models\ActivityLog::record(
                $request->user(),
                'Barang Masuk (Stok)',
                "Admin {$request->user()->name} mencatat barang masuk: +{$request->quantity} unit untuk produk ID {$request->product_id}, Supplier: {$supplierName}, Tanggal: {$purchaseDate}"
            );

            return response()->json([
                'success' => true,
                'message' => 'Data barang masuk berhasil dicatat. Stok produk bertambah.',
                'data' => $stockIn
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mencatat barang masuk: ' . $e->getMessage()
            ], 500);
        }
    }

    public function salesReport(Request $request)
    {
        $filter = $request->query('filter', 'daily'); // daily, yesterday, weekly, monthly, last_month, custom

        $query = Order::where('status_pesanan', 'Selesai');

        if ($filter === 'weekly') {
            $query->where('tanggal_pesanan', '>=', now()->startOfWeek()->toDateString());
        } elseif ($filter === 'monthly') {
            $query->where('tanggal_pesanan', '>=', now()->startOfMonth()->toDateString());
        } elseif ($filter === 'yesterday') {
            $query->where('tanggal_pesanan', '=', now()->subDay()->toDateString());
        } elseif ($filter === 'last_month') {
            $query->whereYear('tanggal_pesanan', now()->subMonth()->year)
                  ->whereMonth('tanggal_pesanan', now()->subMonth()->month);
        } elseif ($filter === 'custom') {
            $startDate = $request->query('start_date');
            $endDate   = $request->query('end_date');
            if ($startDate) {
                $query->where('tanggal_pesanan', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('tanggal_pesanan', '<=', $endDate);
            }
        } else { // daily
            $query->where('tanggal_pesanan', '=', now()->toDateString());
        }

        $orders = $query->with('orderDetails.product')->orderBy('id', 'desc')->get();
        $totalSales  = $orders->sum('total_amount');
        $totalOrders = $orders->count();

        // Top 1 produk terlaris — 30 hari terakhir (untuk preview card di dashboard)
        $topProducts = DB::table('detail_pesanan')
            ->select(
                'nama_produk',
                'nama_produk as product_name',
                DB::raw('CAST(SUM(jumlah) AS UNSIGNED) as total_terjual'),
                DB::raw('CAST(SUM(subtotal) AS DECIMAL(14,2)) as total_omzet')
            )
            ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
            ->where('pesanan.status_pesanan', 'Selesai')
            ->where('pesanan.tanggal_pesanan', '>=', now()->subDays(30)->toDateString())
            ->groupBy('nama_produk')
            ->orderBy('total_terjual', 'desc')
            ->take(1)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'filter'       => $filter,
                'orders'       => $orders,
                'total_sales'  => (float) $totalSales,
                'total_orders' => $totalOrders,
                'top_products' => $topProducts,
            ]
        ], 200);
    }

    /**
     * Ranking semua produk terlaris dengan filter tanggal opsional.
     * Default: 30 hari terakhir.
     * Params: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
     */
    public function topProducts(Request $request)
    {
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate   = $request->query('end_date',   now()->toDateString());

        $products = DB::table('detail_pesanan')
            ->select(
                'nama_produk',
                'nama_produk as product_name',
                DB::raw('CAST(SUM(jumlah) AS UNSIGNED) as total_terjual'),
                DB::raw('CAST(SUM(subtotal) AS DECIMAL(14,2)) as total_omzet')
            )
            ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
            ->where('pesanan.status_pesanan', 'Selesai')
            ->where('pesanan.tanggal_pesanan', '>=', $startDate)
            ->where('pesanan.tanggal_pesanan', '<=', $endDate)
            ->groupBy('nama_produk')
            ->orderBy('total_terjual', 'desc')
            ->get();

        return response()->json([
            'success'    => true,
            'start_date' => $startDate,
            'end_date'   => $endDate,
            'data'       => $products,
        ], 200);
    }

    public function stockReport()
    {
        $allProducts = Product::with('category')->get();

        // Stock warning (stock <= minimum_stock)
        $warningProducts = Product::with('category')
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->get();

        // Best sellers (sum quantity in order details of Completed orders)
        $bestSellers = DB::table('detail_pesanan')
            ->select(
                'produk_id',
                'nama_produk',
                'nama_produk as product_name',
                DB::raw('CAST(SUM(jumlah) AS UNSIGNED) as total_sold')
            )
            ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
            ->where('pesanan.status_pesanan', 'Selesai')
            ->groupBy('produk_id', 'nama_produk')
            ->orderBy('total_sold', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'all_products' => $allProducts,
                'warning_products' => $warningProducts,
                'best_sellers' => $bestSellers
            ]
        ], 200);
    }

    public function showOrder($id)
    {
        $order = Order::with(['user', 'orderDetails.product', 'payment'])->find($id);

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

    public function notifications()
    {
        $notifications = \App\Models\Notifikasi::whereNull('pengguna_id')
            ->orderBy('id', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications
        ], 200);
    }

    public function markNotificationsRead()
    {
        \App\Models\Notifikasi::whereNull('pengguna_id')
            ->where('apakah_dibaca', false)
            ->update(['apakah_dibaca' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi admin telah ditandai dibaca.'
        ], 200);
    }

    public function activityLogs(Request $request)
    {
        $query = \App\Models\ActivityLog::query();

        // Filter by Role (admin / owner)
        if ($role = $request->query('role')) {
            if ($role !== 'all') {
                $query->where('user_role', $role);
            }
        }

        // Filter by Action Category
        if ($category = $request->query('category')) {
            if ($category === 'orders') {
                $query->where(function($q) {
                    $q->where('action', 'like', '%Pesanan%')
                      ->orWhere('action', 'like', '%Kurir%')
                      ->orWhere('action', 'like', '%Status%');
                });
            } elseif ($category === 'stocks') {
                $query->where(function($q) {
                    $q->where('action', 'like', '%Stok%')
                      ->orWhere('action', 'like', '%Barang Masuk%')
                      ->orWhere('action', 'like', '%Produk%');
                });
            } elseif ($category === 'reports') {
                $query->where(function($q) {
                    $q->where('action', 'like', '%Laporan%')
                      ->orWhere('action', 'like', '%PDF%')
                      ->orWhere('action', 'like', '%Cetak%');
                });
            } elseif ($category === 'points') {
                $query->where(function($q) {
                    $q->where('action', 'like', '%Poin%')
                      ->orWhere('action', 'like', '%Hadiah%')
                      ->orWhere('action', 'like', '%Reward%');
                });
            } elseif ($category !== 'all') {
                $query->where('action', $category);
            }
        }

        // Filter by Search Keyword (Audit keyword / invoice code / admin name)
        if ($search = $request->query('search')) {
            $query->where(function($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by Date Range
        if ($startDate = $request->query('start_date')) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate = $request->query('end_date')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $logs = $query->orderBy('id', 'desc')->take(100)->get();

        $formatted = $logs->map(function ($log) {
            $created = \Carbon\Carbon::parse($log->created_at);
            return [
                'id'             => $log->id,
                'user_id'        => $log->user_id,
                'user_name'      => $log->user_name,
                'user_role'      => $log->user_role,
                'action'         => $log->action,
                'description'    => $log->description,
                'formatted_time' => $created->locale('id')->isoFormat('D MMMM YYYY • HH:mm') . ' WIB',
                'created_at'     => $log->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'total'   => $formatted->count(),
            'data'    => $formatted
        ], 200);
    }

    /**
     * Log aktivitas yang dipicu dari frontend (contoh: cetak PDF, cetak Excel).
     */
    public function logActivity(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action'      => 'required|string|max:100',
            'description' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        \App\Models\ActivityLog::record(
            $request->user(),
            $request->action,
            $request->description,
            $request->ip()
        );

        return response()->json(['success' => true, 'message' => 'Aktivitas berhasil dicatat.'], 201);
    }
}
