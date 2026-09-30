<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Pesanan;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\DetailPesanan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminAssignKurirTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_kurir_to_order()
    {
        $admin = User::factory()->create([
            'email' => 'admin_test@dellafrozenmart.com',
            'peran' => 'admin',
        ]);

        $customer = User::factory()->create([
            'email' => 'customer_test@gmail.com',
            'peran' => 'pelanggan',
        ]);

        $kurir = User::factory()->create([
            'email' => 'kurir_test@dellafrozenmart.com',
            'nama' => 'Budi Kurir',
            'peran' => 'kurir',
            'jenis_kendaraan' => 'Honda Vario',
            'plat_kendaraan' => 'BG 1234 XX',
        ]);

        $category = Kategori::create([
            'nama' => 'Frozen Food',
            'deskripsi' => 'Kategori Frozen',
        ]);

        $product = Produk::create([
            'kategori_id' => $category->id,
            'kode_produk' => 'PRD-9999',
            'nama' => 'Nugget Test',
            'harga' => 25000,
            'stok' => 50,
            'stok_minimum' => 5,
            'satuan' => 'Pack',
            'status' => 'active',
        ]);

        $order = Pesanan::create([
            'pengguna_id' => $customer->id,
            'kode_pesanan' => 'ORD-TEST-KURIR',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 25000,
            'ongkos_kirim' => 10000,
            'status_pesanan' => 'Diproses',
            'status_pembayaran' => 'lunas',
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'antar_alamat',
            'alamat_pengiriman' => 'Jl. Test No. 123',
        ]);

        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $product->id,
            'nama_produk' => $product->nama,
            'harga' => 25000,
            'jumlah' => 1,
            'subtotal' => 25000,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/orders/{$order->id}/assign-kurir", [
            'kurir_id' => $kurir->id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('pesanan', [
            'id' => $order->id,
            'kurir_id' => $kurir->id,
            'status_pesanan' => 'Dikirim',
        ]);
    }
}
