<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::count();
        $totalCategories = Category::count();
        $totalPendingOrders = Order::whereIn('status_pesanan', ['Menunggu Pembayaran', 'Menunggu Konfirmasi'])->count();
        $totalCompletedSales = Order::where('status_pesanan', 'Selesai')->sum('total_harga');
        
        $lowStockCount = Product::whereColumn('stok', '<=', 'stok_minimum')->count();
        $recentOrders = Order::with('user')->orderBy('id', 'desc')->take(5)->get();

        return view('admin.dashboard', compact(
            'totalProducts',
            'totalCategories',
            'totalPendingOrders',
            'totalCompletedSales',
            'lowStockCount',
            'recentOrders'
        ));
    }
}
