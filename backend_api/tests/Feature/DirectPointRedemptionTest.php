<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\RiwayatPoin;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DirectPointRedemptionTest extends TestCase
{
    use RefreshDatabase;

    protected $customer;
    protected $category;
    protected $rewardProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'email' => 'customer_direct@test.com',
            'peran' => 'pelanggan',
            'total_poin' => 15,
            'alamat' => 'Jl. Kebon Jeruk No. 45, Tanjung Enim',
        ]);

        $this->category = Kategori::create([
            'nama' => 'Frozen Food',
            'deskripsi' => 'Kategori Frozen',
        ]);

        $this->rewardProduct = Produk::create([
            'kategori_id' => $this->category->id,
            'kode_produk' => 'PRD-RW-001',
            'nama' => 'Fiesta Chicken Nugget 500g',
            'harga' => 45000,
            'stok' => 20,
            'stok_minimum' => 2,
            'satuan' => 'Pack',
            'status' => 'active',
        ]);
    }

    public function test_direct_redeem_with_sufficient_points_succeeds()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'remaining_points' => 5,
                ]
            ]);

        // Assert 10 points deducted
        $this->assertEquals(5, $this->customer->fresh()->total_poin);

        // Assert product stock decremented
        $this->assertEquals(19, $this->rewardProduct->fresh()->stok);

        // Assert order created with total_harga = 0, status Diproses, Lunas
        $order = Pesanan::where('pengguna_id', $this->customer->id)->first();
        $this->assertNotNull($order);
        $this->assertEquals(0, $order->total_harga);
        $this->assertEquals('Diproses', $order->status_pesanan);
        $this->assertEquals('lunas', $order->status_pembayaran);
        $this->assertEquals(10, $order->poin_digunakan);
        $this->assertEquals($this->rewardProduct->id, $order->produk_hadiah_id);

        // Assert detail_pesanan created with is_reward = true
        $detail = DetailPesanan::where('pesanan_id', $order->id)->first();
        $this->assertNotNull($detail);
        $this->assertTrue((bool) $detail->is_reward);
        $this->assertEquals(0, $detail->subtotal);

        // Assert riwayat_poin created
        $history = RiwayatPoin::where('pengguna_id', $this->customer->id)
            ->where('jenis', 'keluar')
            ->first();
        $this->assertNotNull($history);
        $this->assertEquals(10, $history->jumlah_poin);
        $this->assertEquals(5, $history->saldo_akhir);
    }

    public function test_direct_redeem_with_insufficient_points_fails()
    {
        $this->customer->update(['total_poin' => 4]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);

        // Assert points not changed
        $this->assertEquals(4, $this->customer->fresh()->total_poin);
        // Assert stock not changed
        $this->assertEquals(20, $this->rewardProduct->fresh()->stok);
    }

    public function test_direct_redeem_with_out_of_stock_fails()
    {
        $this->rewardProduct->update(['stok' => 0]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);

        // Assert points not changed
        $this->assertEquals(15, $this->customer->fresh()->total_poin);
    }

    public function test_cancelling_direct_redeem_order_refunds_points_and_restores_stock()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(201);
        $this->assertEquals(5, $this->customer->fresh()->total_poin);
        $this->assertEquals(19, $this->rewardProduct->fresh()->stok);

        $order = Pesanan::where('pengguna_id', $this->customer->id)->first();

        // Cancel order via StockService
        StockService::cancelOrder($order, 'Dibatalkan oleh pengujian');

        // Points refunded (+10)
        $this->assertEquals(15, $this->customer->fresh()->total_poin);

        // Product stock restored (+1)
        $this->assertEquals(20, $this->rewardProduct->fresh()->stok);
    }

    public function test_customer_cannot_mark_point_claim_order_as_received_directly()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(201);
        $order = Pesanan::where('pengguna_id', $this->customer->id)->first();

        // Customer attempts to call /api/orders/{id}/received
        $receivedRes = $this->actingAs($this->customer, 'sanctum')->putJson("/api/orders/{$order->id}/received");

        $receivedRes->assertStatus(403);
        $this->assertStringContainsString('Petugas Kasir', $receivedRes->json('message'));
        $this->assertEquals('Diproses', $order->fresh()->status_pesanan);
    }

    public function test_admin_can_mark_point_claim_order_as_completed()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(201);
        $order = Pesanan::where('pengguna_id', $this->customer->id)->first();

        $admin = User::factory()->create(['peran' => 'admin']);

        // Admin updates status to Selesai
        $adminRes = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/orders/{$order->id}/status", [
            'order_status' => 'Selesai',
        ]);

        $adminRes->assertStatus(200);
        $this->assertEquals('Selesai', $order->fresh()->status_pesanan);
    }

    public function test_point_claim_order_is_not_auto_completed_after_15_minutes()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/points/redeem-direct', [
            'product_id' => $this->rewardProduct->id,
            'delivery_method' => 'ambil_toko',
        ]);

        $response->assertStatus(201);
        $order = Pesanan::where('pengguna_id', $this->customer->id)->first();

        // Set status to Siap Diambil and simulate 20 minutes passed
        $order->update([
            'status_pesanan' => 'Siap Diambil',
            'updated_at' => now()->subMinutes(20),
        ]);

        // Customer accesses order list (which triggers auto-completion for regular orders)
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/orders');

        // Point claim order must remain 'Siap Diambil' (not auto completed)
        $this->assertEquals('Siap Diambil', $order->fresh()->status_pesanan);
    }
}
