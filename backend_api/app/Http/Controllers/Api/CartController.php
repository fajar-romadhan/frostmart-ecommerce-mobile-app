<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $cartItems = Cart::with('product')
            ->where('pengguna_id', $userId)
            ->get();

        $items = [];
        $totalItems = 0;
        $totalPrice = 0;

        foreach ($cartItems as $item) {
            if ($item->product) {
                $subtotal = $item->product->price * $item->quantity;
                $items[] = [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'name' => $item->product->name,
                    'price' => (float) $item->product->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $subtotal,
                    'image_url' => $item->product->image_url,
                    'available_stock' => $item->product->stock,
                ];

                $totalItems += $item->quantity;
                $totalPrice += $subtotal;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'total_items' => $totalItems,
                'total_price' => $totalPrice,
            ]
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:produk,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $userId = $request->user()->id;
        $productId = $request->product_id;
        $quantity = $request->quantity;

        // Check if product exists and has stock
        $product = Product::find($productId);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.'
            ], 404);
        }

        if ($product->stock < 1) {
            return response()->json([
                'success' => false,
                'message' => 'Stok produk habis.'
            ], 400);
        }

        // Check if item already exists in cart
        $cartItem = Cart::where('pengguna_id', $userId)
            ->where('produk_id', $productId)
            ->first();

        if ($cartItem) {
            $newQuantity = $cartItem->quantity + $quantity;
            if ($product->stock < $newQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Stok produk tidak mencukupi. (Stok tersedia: {$product->stock}, Sudah ada di keranjang: {$cartItem->quantity}, Ditambah lagi: {$quantity} = Total: {$newQuantity})"
                ], 400);
            }
            $cartItem->update([
                'quantity' => $newQuantity
            ]);
        } else {
            if ($product->stock < $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Stok produk tidak mencukupi. (Tersedia: {$product->stock}, Anda meminta: {$quantity})"
                ], 400);
            }
            Cart::create([
                'pengguna_id' => $userId,
                'produk_id' => $productId,
                'jumlah' => $quantity
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke keranjang.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $userId = $request->user()->id;
        $cartItem = Cart::where('pengguna_id', $userId)->find($id);

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Item keranjang tidak ditemukan.'
            ], 404);
        }

        $product = Product::find($cartItem->product_id);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.'
            ], 404);
        }

        if ($product->stock < $request->quantity) {
            return response()->json([
                'success' => false,
                'message' => "Stok produk tidak mencukupi. (Tersedia: {$product->stock}, Anda meminta: {$request->quantity})"
            ], 400);
        }

        $cartItem->update([
            'quantity' => $request->quantity
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kuantitas keranjang berhasil diubah.'
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $userId = $request->user()->id;
        $cartItem = Cart::where('pengguna_id', $userId)->find($id);

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Item keranjang tidak ditemukan.'
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari keranjang.'
        ], 200);
    }
}
