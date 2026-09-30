<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')
            ->where('status', 'active')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    }

    public function show($id)
    {
        $product = Product::with('category')->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ], 200);
    }

    public function search(Request $request)
    {
        $keyword = $request->query('keyword');

        if (!$keyword) {
            return response()->json([
                'success' => false,
                'message' => 'Kata kunci pencarian tidak boleh kosong.'
            ], 400);
        }

        $products = Product::with('category')
            ->where('status', 'active')
            ->where(function($query) use ($keyword) {
                $query->where('nama', 'like', "%{$keyword}%")
                      ->orWhere('deskripsi', 'like', "%{$keyword}%")
                      ->orWhere('kode_produk', 'like', "%{$keyword}%");
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    }

    public function category($categoryId)
    {
        $products = Product::with('category')
            ->where('status', 'active')
            ->where('kategori_id', $categoryId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    }
}
