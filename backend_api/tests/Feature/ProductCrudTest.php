<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::create([
            'nama' => 'Admin User',
            'email' => 'admin@test.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'admin',
        ]);

        Storage::fake('public');
    }

    public function test_admin_can_create_product_with_image(): void
    {
        $category = Kategori::create(['nama' => 'Makanan Beku']);
        $image = UploadedFile::fake()->image('nugget.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/products', [
                'category_id' => $category->id,
                'name' => 'Chicken Nugget',
                'description' => 'Nugget ayam enak',
                'price' => 35000,
                'stock' => 100,
                'minimum_stock' => 10,
                'unit' => 'Pack',
                'image' => $image,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        
        $product = Produk::first();
        $this->assertNotNull($product->gambar);
        Storage::disk('public')->assertExists($product->gambar);
    }

    public function test_admin_can_update_product_with_new_image(): void
    {
        $category = Kategori::create(['nama' => 'Makanan Beku']);
        
        // Create initial product
        $initialImage = UploadedFile::fake()->image('initial.jpg');
        $initialPath = $initialImage->store('products', 'public');

        $product = Produk::create([
            'kategori_id' => $category->id,
            'kode_produk' => 'PRD-0001',
            'nama' => 'Initial Nugget',
            'harga' => 30000,
            'stok' => 50,
            'stok_minimum' => 5,
            'satuan' => 'Pack',
            'gambar' => $initialPath,
            'status' => 'active',
        ]);

        Storage::disk('public')->assertExists($initialPath);

        // Update product with new details & new image
        $newImage = UploadedFile::fake()->image('updated.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/products/' . $product->id, [
                'category_id' => $category->id,
                'name' => 'Updated Nugget',
                'description' => 'Nugget ayam baru',
                'price' => 32000,
                'stock' => 45,
                'minimum_stock' => 5,
                'unit' => 'Pack',
                'image' => $newImage,
                'status' => 'active',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        // Verify old image was deleted and new image exists
        Storage::disk('public')->assertMissing($initialPath);
        
        $product->refresh();
        $this->assertEquals('Updated Nugget', $product->nama);
        $this->assertNotEquals($initialPath, $product->gambar);
        Storage::disk('public')->assertExists($product->gambar);
    }
}
