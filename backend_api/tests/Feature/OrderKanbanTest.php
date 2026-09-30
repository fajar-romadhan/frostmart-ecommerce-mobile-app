<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\Pembayaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderKanbanTest extends TestCase
{
    use RefreshDatabase;

    private $admin;
    private $customer;
    private $owner;
    private $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'nama' => 'Admin User',
            'email' => 'admin@example.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'admin',
        ]);

        $this->customer = User::create([
            'nama' => 'Customer User',
            'email' => 'customer@example.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'pelanggan',
        ]);

        $this->owner = User::create([
            'nama' => 'Owner User',
            'email' => 'owner@example.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'owner',
        ]);

        $category = Kategori::create([
            'nama' => 'Sosis',
            'deskripsi' => 'Sosis beku',
        ]);

        $this->product = Produk::create([
            'kategori_id' => $category->id,
            'kode_produk' => 'PRD-0001',
            'nama' => 'Kanzler Sosis 500gr',
            'harga' => 45000.00,
            'stok' => 10,
            'stok_minimum' => 2,
            'satuan' => 'Pcs',
            'status' => 'active',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_kanban_page(): void
    {
        $response = $this->get(route('admin.orders.kanban'));
        $response->assertRedirect(route('login'));
    }

    public function test_customer_cannot_access_kanban_page(): void
    {
        $response = $this->actingAs($this->customer)
                         ->get(route('admin.orders.kanban'));
        
        $response->assertStatus(403);
    }

    public function test_owner_cannot_access_kanban_page(): void
    {
        $response = $this->actingAs($this->owner)
                         ->get(route('admin.orders.kanban'));
        
        $response->assertStatus(403);
    }

    public function test_admin_can_access_kanban_page(): void
    {
        $response = $this->actingAs($this->admin)
                         ->get(route('admin.orders.kanban'));
        
        $response->assertStatus(200);
        $response->assertViewIs('admin.orders.kanban');
    }

    public function test_admin_can_update_status_to_diproses_via_ajax(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-X01',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 90000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Menunggu Konfirmasi',
            'status_pembayaran' => 'belum_bayar',
        ]);

        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product->id,
            'nama_produk' => $this->product->nama,
            'harga' => $this->product->harga,
            'jumlah' => 2,
            'subtotal' => 90000.00,
        ]);

        Pembayaran::create([
            'pesanan_id' => $order->id,
            'metode_pembayaran' => 'transfer',
            'status_pembayaran' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
                         ->postJson(route('admin.orders.updateStatusAjax', $order->id), [
                             'status' => 'Diproses'
                         ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);

        $this->assertEquals('Diproses', $order->fresh()->status_pesanan);
        $this->assertEquals(8, $this->product->fresh()->stok); // Stock reduced from 10 to 8
    }

    public function test_ajax_update_fails_on_insufficient_stock(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-X02',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 540000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Menunggu Konfirmasi',
            'status_pembayaran' => 'belum_bayar',
        ]);

        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product->id,
            'nama_produk' => $this->product->nama,
            'harga' => $this->product->harga,
            'jumlah' => 12, // Exceeds available stock (10)
            'subtotal' => 540000.00,
        ]);

        $response = $this->actingAs($this->admin)
                         ->postJson(route('admin.orders.updateStatusAjax', $order->id), [
                             'status' => 'Diproses'
                         ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false
        ]);

        $this->assertEquals('Menunggu Konfirmasi', $order->fresh()->status_pesanan);
        $this->assertEquals(10, $this->product->fresh()->stok); // Stock remains unchanged
    }

    public function test_admin_can_cancel_order_via_ajax(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-X03',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 90000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Diproses', // already processed
            'status_pembayaran' => 'lunas',
        ]);

        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product->id,
            'nama_produk' => $this->product->nama,
            'harga' => $this->product->harga,
            'jumlah' => 2,
            'subtotal' => 90000.00,
        ]);

        $response = $this->actingAs($this->admin)
                         ->postJson(route('admin.orders.updateStatusAjax', $order->id), [
                             'status' => 'Dibatalkan'
                         ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);

        $this->assertEquals('Dibatalkan', $order->fresh()->status_pesanan);
        $this->assertEquals(12, $this->product->fresh()->stok); // Stock restored from 10 to 12
    }
}
