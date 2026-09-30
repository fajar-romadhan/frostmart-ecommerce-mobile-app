<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\Keranjang;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartValidationTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'nama' => 'Test User',
            'email' => 'test@example.com',
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

    public function test_cannot_add_item_to_cart_if_quantity_exceeds_stock(): void
    {
        Sanctum::actingAs($this->user);

        // Product has stock = 10. Attempt to add 11.
        $response = $this->postJson('/api/cart', [
            'product_id' => $this->product->id,
            'quantity' => 11,
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
            'message' => 'Stok produk tidak mencukupi. (Tersedia: 10, Anda meminta: 11)'
        ]);
    }

    public function test_cannot_update_cart_quantity_if_it_exceeds_stock(): void
    {
        Sanctum::actingAs($this->user);

        // Add 5 items to cart
        $cartItem = Keranjang::create([
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product->id,
            'jumlah' => 5,
        ]);

        // Attempt to update quantity to 12 (exceeds stock = 10)
        $response = $this->putJson("/api/cart/{$cartItem->id}", [
            'quantity' => 12,
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
            'message' => 'Stok produk tidak mencukupi. (Tersedia: 10, Anda meminta: 12)'
        ]);
    }

    public function test_cannot_add_to_cart_if_existing_quantity_plus_new_quantity_exceeds_stock(): void
    {
        Sanctum::actingAs($this->user);

        // Add 6 items to cart first
        Keranjang::create([
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product->id,
            'jumlah' => 6,
        ]);

        // Attempt to add 5 more items (total 11, exceeds stock = 10)
        $response = $this->postJson('/api/cart', [
            'product_id' => $this->product->id,
            'quantity' => 5,
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
            'message' => 'Stok produk tidak mencukupi. (Stok tersedia: 10, Sudah ada di keranjang: 6, Ditambah lagi: 5 = Total: 11)'
        ]);
    }

    public function test_can_add_item_to_cart_if_quantity_is_within_stock(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/cart', [
            'product_id' => $this->product->id,
            'quantity' => 5,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke keranjang.'
        ]);

        $this->assertDatabaseHas('keranjang', [
            'pengguna_id' => $this->user->id,
            'produk_id' => $this->product->id,
            'jumlah' => 5,
        ]);
    }
}
