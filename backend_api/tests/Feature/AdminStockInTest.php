<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Produk;
use App\Models\Kategori;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminStockInTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_record_stock_in_with_minimal_fields()
    {
        $admin = User::factory()->create(['peran' => 'admin']);
        $category = Kategori::create(['nama' => 'Frozen Food']);
        $product = Produk::create([
            'kode_produk' => 'PRD-RESTOK-001',
            'kategori_id' => $category->id,
            'nama' => 'Nugget Ayam',
            'harga' => 30000,
            'stok' => 10,
            'stok_minimum' => 5,
            'satuan' => 'Pack',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/stock-in', [
                'product_id' => $product->id,
                'quantity' => 25,
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('produk', [
            'id' => $product->id,
            'stok' => 35,
        ]);
    }

    public function test_admin_can_list_stock_in_history()
    {
        $admin = User::factory()->create(['peran' => 'admin']);
        $category = Kategori::create(['nama' => 'Frozen Food']);
        $product = Produk::create([
            'kode_produk' => 'PRD-RESTOK-002',
            'kategori_id' => $category->id,
            'nama' => 'Sosis Sapi',
            'harga' => 25000,
            'stok' => 20,
            'stok_minimum' => 5,
            'satuan' => 'Pack',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/stock-in', [
                'product_id' => $product->id,
                'quantity' => 15,
            ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/stock-ins');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
