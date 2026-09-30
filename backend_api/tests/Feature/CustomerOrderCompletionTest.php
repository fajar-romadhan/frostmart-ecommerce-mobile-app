<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\Produk;
use App\Models\Notifikasi;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CustomerOrderCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_mark_order_as_received()
    {
        $customer = User::factory()->create(['peran' => 'pelanggan']);
        $category = \App\Models\Kategori::create(['nama' => 'Frozen Food']);
        $product = Produk::create([
            'kode_produk' => 'PRD-TEST-001',
            'kategori_id' => $category->id,
            'nama' => 'Bakso Sapi Premium',
            'harga' => 25000,
            'stok' => 50,
            'satuan' => 'Pack',
            'deskripsi' => 'Bakso sapi lezat',
        ]);

        $order = Pesanan::create([
            'pengguna_id' => $customer->id,
            'kode_pesanan' => 'ORD-TEST-001',
            'tanggal_pesanan' => now(),
            'total_harga' => 25000,
            'metode_pembayaran' => 'qris',
            'metode_pengiriman' => 'antar_alamat',
            'status_pesanan' => 'Dikirim',
            'status_pembayaran' => 'lunas',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->putJson("/api/orders/{$order->id}/received");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('pesanan', [
            'id' => $order->id,
            'status_pesanan' => 'Selesai',
        ]);

        $this->assertDatabaseHas('notifikasi', [
            'pengguna_id' => $customer->id,
            'jenis' => 'status_pesanan',
        ]);
    }
}
