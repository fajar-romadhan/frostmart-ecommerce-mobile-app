<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\Pembayaran;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;

class StockServiceTest extends TestCase
{
    use RefreshDatabase;

    private $admin;
    private $customer;
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

    public function test_confirm_order_deducts_stock_and_updates_status(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 90000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Menunggu Pembayaran',
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

        $result = StockService::confirmOrder($order, $this->admin->id);

        $this->assertTrue($result);
        $this->assertEquals(8, $this->product->fresh()->stok); // 10 - 2
        $this->assertEquals('Diproses', $order->fresh()->status_pesanan);
        $this->assertEquals('lunas', $order->fresh()->status_pembayaran);

        $this->assertDatabaseHas('stok_keluar', [
            'produk_id' => $this->product->id,
            'pesanan_id' => $order->id,
            'jumlah' => 2,
            'jenis' => 'penjualan',
        ]);
    }

    public function test_cannot_confirm_order_twice(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 90000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Diproses', // Already confirmed!
            'status_pembayaran' => 'lunas',
        ]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage("Pesanan dengan status 'Diproses' tidak dapat dikonfirmasi.");

        StockService::confirmOrder($order, $this->admin->id);
    }

    public function test_cancel_order_restores_stock_if_it_was_processed(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 90000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Diproses', // Processed
            'status_pembayaran' => 'lunas',
        ]);

        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product->id,
            'nama_produk' => $this->product->nama,
            'harga' => $this->product->harga,
            'jumlah' => 3,
            'subtotal' => 135000.00,
        ]);

        Pembayaran::create([
            'pesanan_id' => $order->id,
            'metode_pembayaran' => 'transfer',
            'status_pembayaran' => 'approved',
        ]);

        // Stock starts at 10. (As if already decremented by 3 to reach 10).
        $result = StockService::cancelOrder($order);

        $this->assertTrue($result);
        $this->assertEquals(13, $this->product->fresh()->stok); // 10 + 3 restored
        $this->assertEquals('Dibatalkan', $order->fresh()->status_pesanan);

        $this->assertDatabaseHas('stok_keluar', [
            'produk_id' => $this->product->id,
            'pesanan_id' => $order->id,
            'jumlah' => 3,
            'jenis' => 'pembatalan',
        ]);
    }

    public function test_cancel_order_does_not_restore_stock_if_it_was_pending(): void
    {
        $order = Pesanan::create([
            'pengguna_id' => $this->customer->id,
            'kode_pesanan' => 'ORD-001',
            'tanggal_pesanan' => now()->toDateString(),
            'total_harga' => 90000.00,
            'metode_pembayaran' => 'transfer',
            'metode_pengiriman' => 'ambil_toko',
            'status_pesanan' => 'Menunggu Pembayaran', // Pending
            'status_pembayaran' => 'belum_bayar',
        ]);

        DetailPesanan::create([
            'pesanan_id' => $order->id,
            'produk_id' => $this->product->id,
            'nama_produk' => $this->product->nama,
            'harga' => $this->product->harga,
            'jumlah' => 3,
            'subtotal' => 135000.00,
        ]);

        $result = StockService::cancelOrder($order);

        $this->assertTrue($result);
        $this->assertEquals(10, $this->product->fresh()->stok); // Stock remains 10 (not restored because not decremented)
        $this->assertEquals('Dibatalkan', $order->fresh()->status_pesanan);

        $this->assertDatabaseMissing('stok_keluar', [
            'pesanan_id' => $order->id,
            'jenis' => 'pembatalan',
        ]);
    }
}
