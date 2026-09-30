<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $filter = $request->query('filter', 'daily'); // daily, weekly, monthly, custom
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

        return view('admin.reports.sales', compact('orders', 'filter', 'startDate', 'endDate', 'totalSales', 'totalOrders'));
    }

    public function stocks()
    {
        $products = Product::with('category')->orderBy('stok', 'asc')->get();
        
        // Low stock products warning
        $lowStockProducts = Product::with('category')
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->get();

        // Best selling products count
        $bestSellers = OrderDetail::select('produk_id', 'nama_produk', DB::raw('SUM(jumlah) as total_sold'))
            ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
            ->where('pesanan.status_pesanan', 'Selesai')
            ->groupBy('produk_id', 'nama_produk')
            ->orderBy('total_sold', 'desc')
            ->take(10)
            ->get();

        return view('admin.reports.stocks', compact('products', 'lowStockProducts', 'bestSellers'));
    }
}
