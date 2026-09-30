<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User as Pengguna;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderAutoCompletionTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Pengguna::create([
            'name' => 'Admin Toko',
            'email' => 'admintoko@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->customer = Pengguna::create([
            'name' => 'Pelanggan Test',
            'email' => 'pelanggan@example.com',
            'password' => bcrypt('password123'),
            'role' => 'pelanggan',
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
    }

    public function test_admin_cannot_manually_mark_order_as_completed(): void
    {
        Sanctum::actingAs($this->admin);

        $order = Order::create([
            'pengguna_id' => $this->customer->id,
            'cabang_toko_id' => 1,
            'kode_pesanan' => 'ORD-TEST-1001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 50000,
            'ongkos_kirim' => 0,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Dikirim',
            'status_pembayaran' => 'belum_bayar',
        ]);

        $response = $this->putJson("/api/admin/orders/{$order->id}/status", [
            'order_status' => 'Selesai',
        ]);

        $response->assertStatus(403);
        $this->assertStringContainsString('Pelanggan', $response->json('message'));
    }

    public function test_order_delivered_over_15_minutes_is_auto_completed(): void
    {
        Sanctum::actingAs($this->customer);

        $order = Order::create([
            'pengguna_id' => $this->customer->id,
            'cabang_toko_id' => 1,
            'kode_pesanan' => 'ORD-AUTO-15M',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 75000,
            'ongkos_kirim' => 5000,
            'metode_pembayaran' => 'qris',
            'metode_pengiriman' => 'antar_alamat',
            'status_pesanan' => 'Dikirim',
            'status_pembayaran' => 'lunas',
            'waktu_dikirim' => now()->subMinutes(20),
            'updated_at' => now()->subMinutes(20),
        ]);

        $response = $this->getJson('/api/orders');

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('Selesai', $order->order_status);
        $this->assertEquals('lunas', $order->payment_status);
    }
}
