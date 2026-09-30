<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AlamatPengguna;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressCrudTest extends TestCase
{
    use RefreshDatabase;

    protected $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'nama' => 'Customer User',
            'email' => 'customer@test.com',
            'kata_sandi' => bcrypt('password'),
            'peran' => 'pelanggan',
        ]);
    }

    public function test_customer_can_list_addresses(): void
    {
        AlamatPengguna::create([
            'pengguna_id' => $this->customer->id,
            'label' => 'Rumah',
            'nama_penerima' => 'Customer User',
            'telepon_penerima' => '081234567890',
            'alamat_lengkap' => 'Jl. Mawar No. 10',
            'is_utama' => true,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/addresses');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
    }

    public function test_customer_can_create_address(): void
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/addresses', [
                'label' => 'Kantor',
                'nama_penerima' => 'Customer User',
                'telepon_penerima' => '081234567890',
                'alamat_lengkap' => 'Sudirman Tower Lt. 5',
                'is_utama' => true,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('alamat_pengguna', [
            'pengguna_id' => $this->customer->id,
            'label' => 'Kantor',
            'is_utama' => 1
        ]);
    }

    public function test_customer_can_update_address(): void
    {
        $address = AlamatPengguna::create([
            'pengguna_id' => $this->customer->id,
            'label' => 'Rumah',
            'nama_penerima' => 'Customer User',
            'telepon_penerima' => '081234567890',
            'alamat_lengkap' => 'Jl. Mawar No. 10',
            'is_utama' => true,
        ]);

        $response = $this->actingAs($this->customer)
            ->putJson("/api/addresses/{$address->id}", [
                'label' => 'Kos',
                'nama_penerima' => 'Customer User',
                'telepon_penerima' => '081234567890',
                'alamat_lengkap' => 'Gang Melati No. 5',
                'is_utama' => true,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('alamat_pengguna', [
            'id' => $address->id,
            'label' => 'Kos',
            'alamat_lengkap' => 'Gang Melati No. 5',
        ]);
    }

    public function test_customer_can_delete_address(): void
    {
        $address = AlamatPengguna::create([
            'pengguna_id' => $this->customer->id,
            'label' => 'Rumah',
            'nama_penerima' => 'Customer User',
            'telepon_penerima' => '081234567890',
            'alamat_lengkap' => 'Jl. Mawar No. 10',
            'is_utama' => true,
        ]);

        $response = $this->actingAs($this->customer)
            ->deleteJson("/api/addresses/{$address->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('alamat_pengguna', ['id' => $address->id]);
    }

    public function test_customer_can_set_default_address(): void
    {
        $address1 = AlamatPengguna::create([
            'pengguna_id' => $this->customer->id,
            'label' => 'Rumah',
            'nama_penerima' => 'Customer User',
            'telepon_penerima' => '081234567890',
            'alamat_lengkap' => 'Jl. Mawar No. 10',
            'is_utama' => true,
        ]);

        $address2 = AlamatPengguna::create([
            'pengguna_id' => $this->customer->id,
            'label' => 'Kantor',
            'nama_penerima' => 'Customer User',
            'telepon_penerima' => '081234567890',
            'alamat_lengkap' => 'Sudirman Tower Lt. 5',
            'is_utama' => false,
        ]);

        $response = $this->actingAs($this->customer)
            ->putJson("/api/addresses/{$address2->id}/set-default");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        
        $this->assertEquals(0, $address1->fresh()->is_utama);
        $this->assertEquals(1, $address2->fresh()->is_utama);
    }

    public function test_can_list_branches(): void
    {
        \App\Models\CabangToko::create([
            'nama' => 'Cabang Test',
            'alamat' => 'Alamat Cabang Test',
            'latitude' => -3.71220000,
            'longitude' => 103.79970000,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/branches');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
    }

    public function test_can_calculate_shipping(): void
    {
        \App\Models\CabangToko::create([
            'nama' => 'Cabang Test',
            'alamat' => 'Alamat Cabang Test',
            'latitude' => -3.71220000,
            'longitude' => 103.79970000,
        ]);

        // 1. Jarak <= 5km (misal ~0.4km) -> Rp 5.000
        $response1 = $this->actingAs($this->customer)
            ->getJson('/api/addresses/calculate-shipping?lat=-3.7150&lng=103.8020');
        $response1->assertStatus(200);
        $response1->assertJsonPath('success', true);
        $this->assertEquals(5000, $response1->json('shipping_fee'));

        // 2. Jarak 5-10km (misal ~6km) -> Rp 10.000
        $response2 = $this->actingAs($this->customer)
            ->getJson('/api/addresses/calculate-shipping?lat=-3.7350&lng=103.8000');
        $response2->assertStatus(200);
        $response2->assertJsonPath('success', true);
        $this->assertEquals(10000, $response2->json('shipping_fee'));

        // 3. Jarak > 10km -> Error 400
        $response3 = $this->actingAs($this->customer)
            ->getJson('/api/addresses/calculate-shipping?lat=-3.9000&lng=103.8000');
        $response3->assertStatus(400);
        $response3->assertJsonPath('success', false);
    }
}
