<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\RiwayatPoin;
use App\Models\User;
use App\Services\PointService;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PointServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $category;
    protected $product1;
    protected $productReward;

    protected function setUp(): void
    {
        parent::setUp();

        \App\Models\CabangToko::create([
            'nama' => 'Della Frozen Mart (Pusat)',
            'alamat' => 'Jl. Kiemas, Tanjung Enim',
            'latitude' => -3.763872,
            'longitude' => 103.8079257,
            'telepon' => '08123456789',
        ]);

        $this->category = Category::create([
            'nama' => 'Frozen Food',
            'deskripsi' => 'Kategori Makanan Beku'
        ]);

        $this->product1 = Product::create([
            'kategori_id' => $this->category->id,
            'kode_produk' => 'PRD-TEST-001',
            'nama' => 'Nugget Fiesta 500g',
            'harga' => 50000,
            'stok' => 50,
            'stok_minimum' => 5,
            'satuan' => 'Pack',
            'status' => 'active',
        ]);

        $this->productReward = Product::create([
            'kategori_id' => $this->category->id,
            'kode_produk' => 'PRD-TEST-002',
            'nama' => 'Sosis Bakar Jumbo',
            'harga' => 35000,
            'stok' => 20,
            'stok_minimum' => 3,
            'satuan' => 'Pack',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'nama' => 'Budi Santoso',
            'email' => 'budi@test.com',
            'kata_sandi' => bcrypt('1234'),
            'telepon' => '08123456789',
            'alamat' => 'Tanjung Enim',
            'peran' => 'pelanggan',
            'total_poin' => 0,
        ]);
    }

    public function test_calculate_points()
    {
        $this->assertEquals(0, PointService::calculatePoints(0));
        $this->assertEquals(0, PointService::calculatePoints(49999));
        $this->assertEquals(1, PointService::calculatePoints(50000));
        $this->assertEquals(1, PointService::calculatePoints(99000));
        $this->assertEquals(2, PointService::calculatePoints(100000));
        $this->assertEquals(2, PointService::calculatePoints(135000));
        $this->assertEquals(4, PointService::calculatePoints(200000));
    }

    public function test_award_points_on_order_completed()
    {
        $order = Order::create([
            'pengguna_id' => $this->user->id,
            'cabang_toko_id' => 1,
            'kode_pesanan' => 'ORD-TEST-001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 155000,
            'ongkos_kirim' => 5000,
            'jarak_pengiriman' => 2.5,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'antar_alamat',
            'alamat_pengiriman' => 'Tanjung Enim',
            'status_pesanan' => 'Dikirim',
            'status_pembayaran' => 'lunas',
            'poin_diperoleh' => 0,
        ]);

        // Detail pesanan subtotal 150.000 (3x 50.000)
        OrderDetail::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product1->id,
            'nama_produk' => $this->product1->nama,
            'harga' => 50000,
            'jumlah' => 3,
            'subtotal' => 150000,
            'is_reward' => false,
        ]);

        $this->assertEquals(0, $this->user->fresh()->total_points);

        // Award points
        $awarded = PointService::awardPointsForOrder($order);

        $this->assertEquals(3, $awarded);
        $this->assertEquals(3, $this->user->fresh()->total_points);
        $this->assertEquals(3, $order->fresh()->points_earned);

        // Riwayat poin tercatat
        $this->assertDatabaseHas('riwayat_poin', [
            'pengguna_id' => $this->user->id,
            'pesanan_id' => $order->id,
            'jenis' => 'masuk',
            'jumlah_poin' => 3,
            'saldo_akhir' => 3,
        ]);
    }

    public function test_award_points_does_not_duplicate()
    {
        $order = Order::create([
            'pengguna_id' => $this->user->id,
            'cabang_toko_id' => 1,
            'kode_pesanan' => 'ORD-TEST-002',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 50000,
            'ongkos_kirim' => 0,
            'jarak_pengiriman' => 0,
            'metode_pembayaran' => 'cod',
            'metode_pengiriman' => 'ambil_toko',
            'alamat_pengiriman' => 'Ambil di Toko',
            'status_pesanan' => 'Dikirim',
            'status_pembayaran' => 'belum_bayar',
            'poin_diperoleh' => 0,
        ]);

        OrderDetail::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product1->id,
            'nama_produk' => $this->product1->nama,
            'harga' => 50000,
            'jumlah' => 1,
            'subtotal' => 50000,
            'is_reward' => false,
        ]);

        $firstAward = PointService::awardPointsForOrder($order);
        $this->assertEquals(1, $firstAward);
        $this->assertEquals(1, $this->user->fresh()->total_points);

        // Second attempt
        $secondAward = PointService::awardPointsForOrder($order->fresh());
        $this->assertEquals(0, $secondAward);
        $this->assertEquals(1, $this->user->fresh()->total_points);
    }

    public function test_checkout_with_insufficient_points_fails()
    {
        $this->user->update(['total_poin' => 5]); // Only 5 points, needs 10

        Cart::create([
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product1->id,
            'jumlah' => 1,
        ]);

        $token = $this->user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/checkout', [
                'delivery_method' => 'ambil_toko',
                'payment_method' => 'cod',
                'reward_product_id' => $this->productReward->id,
            ]);

        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
        ]);
        $this->assertStringContainsString('Poin Anda tidak mencukupi', $response->json('message'));
    }

    public function test_checkout_with_sufficient_points_succeeds()
    {
        $this->user->update(['total_poin' => 15]); // 15 points

        Cart::create([
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product1->id,
            'jumlah' => 1,
        ]);

        $token = $this->user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/checkout', [
                'delivery_method' => 'ambil_toko',
                'payment_method' => 'cod',
                'reward_product_id' => $this->productReward->id,
            ]);

        $response->assertStatus(201);
        $response->assertJson(['success' => true]);

        // Poin terpotong 10 (sisa 5)
        $this->assertEquals(5, $this->user->fresh()->total_points);

        // Riwayat poin keluar tercatat
        $this->assertDatabaseHas('riwayat_poin', [
            'pengguna_id' => $this->user->id,
            'jenis' => 'keluar',
            'jumlah_poin' => 10,
            'saldo_akhir' => 5,
        ]);

        $orderId = $response->json('data.order_id');
        $order = Order::with('orderDetails')->find($orderId);

        $this->assertEquals(10, $order->points_used);
        $this->assertEquals($this->productReward->id, $order->reward_product_id);

        // Ada 2 item di detail_pesanan: 1 produk beli, 1 produk reward gratis
        $this->assertCount(2, $order->orderDetails);

        $rewardDetail = $order->orderDetails->where('is_reward', true)->first();
        $this->assertNotNull($rewardDetail);
        $this->assertEquals(0, $rewardDetail->price);
        $this->assertEquals(0, $rewardDetail->subtotal);
        $this->assertEquals($this->productReward->id, $rewardDetail->product_id);
    }

    public function test_points_refunded_on_order_cancelled()
    {
        $this->user->update(['total_poin' => 12]);

        Cart::create([
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product1->id,
            'jumlah' => 1,
        ]);

        $token = $this->user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/checkout', [
                'delivery_method' => 'ambil_toko',
                'payment_method' => 'cod',
                'reward_product_id' => $this->productReward->id,
            ]);

        $this->assertEquals(2, $this->user->fresh()->total_points);
        $orderId = $response->json('data.order_id');
        $order = Order::find($orderId);

        // Cancel the order
        StockService::cancelOrder($order, 'Dibatalkan oleh pelanggan');

        // Poin 10 berhasil dikembalikan (2 + 10 = 12)
        $this->assertEquals(12, $this->user->fresh()->total_points);

        // Ada riwayat refund poin masuk
        $this->assertDatabaseHas('riwayat_poin', [
            'pengguna_id' => $this->user->id,
            'pesanan_id' => $orderId,
            'jenis' => 'masuk',
            'jumlah_poin' => 10,
            'saldo_akhir' => 12,
        ]);
    }

    public function test_get_points_history_api()
    {
        $this->user->update(['total_poin' => 8]);

        RiwayatPoin::create([
            'pengguna_id' => $this->user->id,
            'jenis' => 'masuk',
            'jumlah_poin' => 8,
            'saldo_akhir' => 8,
            'keterangan' => 'Poin tes perolehan',
        ]);

        $token = $this->user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/points/history');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'total_points' => 8,
                'spend_per_point' => 50000,
                'redeem_points_cost' => 10,
            ]
        ]);
        $this->assertCount(1, $response->json('data.history'));
    }

    public function test_get_reward_products_api()
    {
        $token = $this->user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/points/reward-products');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'redeem_points_cost' => 10,
            ]
        ]);
        $this->assertGreaterThanOrEqual(2, count($response->json('data.products')));
    }

    public function test_owner_dashboard_displays_point_loyalty_metrics()
    {
        $owner = User::create([
            'nama' => 'Owner Della',
            'email' => 'owner_point_test@della.test',
            'password' => bcrypt('password123'),
            'peran' => 'owner',
        ]);

        RiwayatPoin::create([
            'pengguna_id' => $this->user->id,
            'jenis' => 'masuk',
            'jumlah_poin' => 20,
            'saldo_akhir' => 20,
            'keterangan' => 'Poin belanja',
        ]);

        RiwayatPoin::create([
            'pengguna_id' => $this->user->id,
            'jenis' => 'keluar',
            'jumlah_poin' => 10,
            'saldo_akhir' => 10,
            'keterangan' => 'Tukar hadiah',
        ]);

        $response = $this->actingAs($owner)->get(route('owner.dashboard'));

        $response->assertStatus(200);
        $response->assertViewHas('totalPointsIssued', 20);
        $response->assertViewHas('totalPointsRedeemed', 10);
        $response->assertSee('Poin Loyalti Diberikan');
        $response->assertSee('Klaim Hadiah Produk');
    }
}
