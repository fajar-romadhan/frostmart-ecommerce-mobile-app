<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockInController extends Controller
{
    public function index()
    {
        $stockIns = StockIn::with('product')->orderBy('id', 'desc')->paginate(10);
        return view('admin.stock-ins.index', compact('stockIns'));
    }

    public function create()
    {
        $products = Product::where('status', 'active')->get();
        return view('admin.stock-ins.create', compact('products'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:produk,id',
            'quantity' => 'required|integer|min:1',
            'supplier_name' => 'required|string|max:255',
            'purchase_date' => 'required|date',
            'note' => 'nullable|string',
        ], [
            'quantity.min' => 'Jumlah barang masuk minimal 1.',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $product = Product::lockForUpdate()->findOrFail($request->product_id);

                // Update product stock
                $product->increment('stock', $request->quantity);

                // Create stock in record
                StockIn::create([
                    'product_id' => $request->product_id,
                    'quantity' => $request->quantity,
                    'supplier_name' => $request->supplier_name,
                    'purchase_date' => $request->purchase_date,
                    'note' => $request->note,
                ]);
            });

            return redirect()->route('admin.stock-ins.index')->with('success', 'Barang masuk berhasil dicatat dan stok produk bertambah.');

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mencatat barang masuk: ' . $e->getMessage())->withInput();
        }
    }
}
