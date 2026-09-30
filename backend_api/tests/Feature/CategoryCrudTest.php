<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Kategori;
use App\Models\Produk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $customer;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::create([
            'nama' => 'Admin User',
            'email' => 'admin@test.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'admin',
        ]);

        $this->customer = User::create([
            'nama' => 'Customer User',
            'email' => 'customer@test.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'pelanggan',
        ]);
    }

    public function test_anyone_can_list_categories(): void
    {
        Kategori::create(['nama' => 'Daging Beku', 'deskripsi' => 'Aneka daging']);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
    }

    public function test_admin_can_create_category(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/categories', [
                'name' => 'Sayuran Beku',
                'description' => 'Aneka sayur',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('kategori', ['nama' => 'Sayuran Beku']);
    }

    public function test_customer_cannot_create_category(): void
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/admin/categories', [
                'name' => 'Sayuran Beku',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_category(): void
    {
        $category = Kategori::create(['nama' => 'Sayur', 'deskripsi' => 'Sayuran']);

        $response = $this->actingAs($this->admin)
            ->putJson('/api/admin/categories/' . $category->id, [
                'name' => 'Sayur Beku',
                'description' => 'Sayuran beku',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('kategori', [
            'id' => $category->id,
            'nama' => 'Sayur Beku',
            'deskripsi' => 'Sayuran beku',
        ]);
    }

    public function test_admin_can_delete_empty_category(): void
    {
        $category = Kategori::create(['nama' => 'Camilan', 'deskripsi' => 'Camilan beku']);

        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/admin/categories/' . $category->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('kategori', ['id' => $category->id]);
    }

    public function test_admin_cannot_delete_category_with_products(): void
    {
        $category = Kategori::create(['nama' => 'Bakso', 'deskripsi' => 'Aneka bakso']);
        Produk::create([
            'kategori_id' => $category->id,
            'kode_produk' => 'PRD-BAKSO-01',
            'nama' => 'Bakso Sapi Premium',
            'deskripsi' => 'Bakso sapi',
            'harga' => 35000,
            'stok' => 50,
            'stok_minimum' => 5,
            'satuan' => 'Pcs',
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/admin/categories/' . $category->id);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
        $this->assertDatabaseHas('kategori', ['id' => $category->id]);
    }
}
