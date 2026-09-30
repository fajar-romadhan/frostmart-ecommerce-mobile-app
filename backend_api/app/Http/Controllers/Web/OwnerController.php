<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerController extends Controller
{
    public function dashboard()
    {
        $totalProducts = Product::count();
        $totalOrdersCount = Order::count();
        $totalCompletedSales = Order::where('status_pesanan', 'Selesai')->sum('total_harga');
        $lowStockCount = Product::whereColumn('stok', '<=', 'stok_minimum')->count();
        
        // Sales chart data (latest 6 months)
        $dateFormatSql = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', tanggal_pesanan)"
            : "DATE_FORMAT(tanggal_pesanan, '%Y-%m')";

        $monthlySales = Order::where('status_pesanan', 'Selesai')
            ->select(
                DB::raw('sum(total_harga) as total'),
                DB::raw("{$dateFormatSql} as month")
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->take(6)
            ->get();

        $recentOrders = Order::with('user')->orderBy('id', 'desc')->take(5)->get();
        $activityLogs = \App\Models\ActivityLog::orderBy('id', 'desc')->take(30)->get();
        $totalPointsIssued = \App\Models\RiwayatPoin::where('jenis', 'masuk')->sum('jumlah_poin');
        $totalPointsRedeemed = \App\Models\RiwayatPoin::where('jenis', 'keluar')->sum('jumlah_poin');
        $totalRewardClaimsCount = Order::where(function($q) {
            $q->where('metode_pembayaran', 'poin')
              ->orWhere('poin_digunakan', '>', 0);
        })->count();

        return view('owner.dashboard', compact(
            'totalProducts',
            'totalOrdersCount',
            'totalCompletedSales',
            'lowStockCount',
            'monthlySales',
            'recentOrders',
            'activityLogs',
            'totalPointsIssued',
            'totalPointsRedeemed',
            'totalRewardClaimsCount'
        ));
    }

    public function orders(Request $request)
    {
        $status = $request->query('status');
        
        $query = Order::with('user')->orderBy('id', 'desc');

        if ($status) {
            $query->where('status_pesanan', $status);
        }

        $orders = $query->paginate(15);

        return view('owner.orders.index', compact('orders', 'status'));
    }

    public function orderShow($id)
    {
        $order = Order::with(['user', 'orderDetails.product', 'payment'])->findOrFail($id);
        return view('owner.orders.show', compact('order'));
    }

    public function salesReport(Request $request)
    {
        $filter = $request->query('filter', 'daily');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = Order::where('status_pesanan', 'Selesai');

        if ($filter === 'weekly') {
            $query->where('tanggal_pesanan', '>=', now()->startOfWeek()->toDateString());
        } elseif ($filter === 'monthly') {
            $query->where('tanggal_pesanan', '>=', now()->startOfMonth()->toDateString());
        } elseif ($filter === 'custom' && $startDate && $endDate) {
            $query->whereBetween('tanggal_pesanan', [$startDate, $endDate]);
        } else { // default daily
            $query->where('tanggal_pesanan', '=', now()->toDateString());
        }

        $orders = $query->with('user')->orderBy('id', 'desc')->get();
        $totalSales = $orders->sum('total_amount');
        $totalOrders = $orders->count();

        return view('owner.reports.sales', compact('orders', 'filter', 'startDate', 'endDate', 'totalSales', 'totalOrders'));
    }

    public function stockReport()
    {
        $products = Product::with('category')->orderBy('stok', 'asc')->get();
        
        $lowStockProducts = Product::with('category')
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->get();

        $bestSellers = OrderDetail::select('produk_id', 'nama_produk', DB::raw('SUM(jumlah) as total_sold'))
            ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
            ->where('pesanan.status_pesanan', 'Selesai')
            ->groupBy('produk_id', 'nama_produk')
            ->orderBy('total_sold', 'desc')
            ->take(10)
            ->get();

        return view('owner.reports.stocks', compact('products', 'lowStockProducts', 'bestSellers'));
    }
}
