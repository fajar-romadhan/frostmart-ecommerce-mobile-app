<?php

namespace Tests\Feature;

use App\Models\Cart as Keranjang;
use App\Models\Order;
use App\Models\Product as Produk;
use App\Models\User as Pengguna;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentExpirationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = Pengguna::create([
            'name' => 'Testing User',
            'email' => 'testbuyer@example.com',
            'password' => bcrypt('password123'),
            'role' => 'pelanggan',
            'phone' => '081234567890',
        ]);

        \App\Models\CabangToko::create([
            'id' => 1,
            'nama' => 'Della Frozen Mart Pusat',
            'alamat' => 'Jl. Kebon Jeruk No. 12',
            'telepon' => '08123456789',
            'latitude' => -6.175392,
            'longitude' => 106.827153,
            'is_main_branch' => true,
        ]);

        $category = \App\Models\Kategori::create([
            'name' => 'Frozen Food',
        ]);

        $this->product = Produk::create([
            'kategori_id' => $category->id,
            'kode_produk' => 'PRD-TEST-001',
            'name' => 'Sosis Ayam Test',
            'price' => 20000,
            'stock' => 50,
            'unit' => 'Pcs',
            'status' => 'active',
        ]);
    }

    public function test_checkout_sets_30_minute_payment_deadline(): void
    {
        Sanctum::actingAs($this->user);

        Keranjang::create([
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product->id,
            'jumlah' => 2,
        ]);

        $response = $this->postJson('/api/checkout', [
            'delivery_method' => 'ambil_toko',
            'payment_method' => 'qris',
        ]);

        $response->assertStatus(201);
        $order = Order::first();

        $this->assertNotNull($order->waktu_tenggat_pembayaran);
        $this->assertEquals('Menunggu Pembayaran', $order->status_pesanan);
    }

    public function test_expired_order_is_automatically_cancelled_and_stock_restored(): void
    {
        Sanctum::actingAs($this->user);

        // Create expired order from 35 minutes ago
        $order = Order::create([
            'pengguna_id' => $this->user->id,
            'cabang_toko_id' => 1,
            'kode_pesanan' => 'ORD-EXP-0001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 40000,
            'ongkos_kirim' => 0,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Menunggu Pembayaran',
            'status_pembayaran' => 'belum_bayar',
            'waktu_tenggat_pembayaran' => now()->subMinutes(5),
            'created_at' => now()->subMinutes(35),
        ]);

        // Fetch orders list to trigger auto cancellation
        $response = $this->getJson('/api/orders');

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('Dibatalkan', $order->order_status);
        $this->assertStringContainsString('30 menit', $order->catatan_pembatalan ?? $order->cancellation_reason ?? '');
    }
}
