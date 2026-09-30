<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AlamatPengguna;
use App\Models\Produk;
use App\Models\Kategori;
use App\Models\Keranjang;
use App\Models\CabangToko;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthNikValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed Cabang Toko
        CabangToko::create([
            'nama'      => 'Della Frozen Mart (Pusat)',
            'alamat'    => 'Jl. Kiemas RT.04 RW.10 Tanjung Enim',
            'latitude'  => -3.763872,
            'longitude' => 103.8079257,
            'is_utama'  => true,
            'telepon'   => '08123456789',
        ]);
    }

    /** Registrasi tanpa KTP sekarang harus berhasil (KTP tidak lagi diperlukan). */
    public function test_registration_without_ktp_photo_succeeds(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'John Doe',
            'email'                 => 'john@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081234567890',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('pelanggan', $user->role);
        $this->assertNull($user->foto_ktp ?? null);
    }

    /** Registrasi dengan alamat awal harus menyimpan alamat ke tabel alamat_pengguna sebagai alamat utama. */
    public function test_registration_with_initial_address_saves_to_alamat_pengguna(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Siti Rahayu',
            'email'                 => 'siti@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081234567890',
            'initial_address'       => 'Jl. Pandawa, Tanjung Enim, Lawang Kidul, Muara Enim',
            'initial_lat'           => -3.7625,
            'initial_lng'           => 103.8085,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);

        $user = User::where('email', 'siti@example.com')->first();
        $this->assertNotNull($user);

        $address = AlamatPengguna::where('pengguna_id', $user->id)->first();
        $this->assertNotNull($address);
        $this->assertEquals('Jl. Pandawa, Tanjung Enim, Lawang Kidul, Muara Enim', $address->alamat_lengkap);
        $this->assertTrue((bool) $address->is_utama);
        $this->assertEquals('Rumah', $address->label);
        $this->assertEquals(-3.7625, (float) $address->latitude);
        $this->assertEquals(103.8085, (float) $address->longitude);
    }

    /** Registrasi dengan alamat manual tanpa koordinat otomatis mencari koordinat default Tanjung Enim. */
    public function test_registration_with_address_auto_resolves_coordinates(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Budi Santoso',
            'email'                 => 'budi@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081234567891',
            'initial_address'       => 'Jalan Lintas Tengah, Tanjung Enim',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);

        $user = User::where('email', 'budi@example.com')->first();
        $this->assertNotNull($user);

        $address = AlamatPengguna::where('pengguna_id', $user->id)->first();
        $this->assertNotNull($address);
        $this->assertNotNull($address->latitude);
        $this->assertNotNull($address->longitude);
        $this->assertTrue((bool) $address->is_utama);
    }

    /** Alur lengkap: Register dengan alamat -> Ambil alamat utama -> Checkout langsung menggunakan alamat utama tanpa isi ulang. */
    public function test_full_flow_register_address_auto_checkout_primary_address(): void
    {
        // 1. Register dengan alamat
        $regRes = $this->postJson('/api/register', [
            'name'                  => 'Dewi Lestari',
            'email'                 => 'dewi@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081234567892',
            'initial_address'       => 'Jl. Kiemas, RT.04/RW.10, Tanjung Enim',
            'initial_lat'           => -3.7638,
            'initial_lng'           => 103.8078,
        ]);
        $regRes->assertStatus(201);
        $token = $regRes->json('data.token');

        // 2. Fetch alamat pengguna
        $addrRes = $this->withToken($token)->getJson('/api/addresses');
        $addrRes->assertStatus(200);
        $addresses = $addrRes->json('data');
        $this->assertCount(1, $addresses);
        $primary = $addresses[0];
        $this->assertTrue((bool) $primary['is_utama']);
        $this->assertEquals('Jl. Kiemas, RT.04/RW.10, Tanjung Enim', $primary['alamat_lengkap']);

        // 3. Tambah produk ke keranjang
        $category = Kategori::create(['name' => 'Nugget', 'deskripsi' => 'Aneka Nugget']);
        $product = Produk::create([
            'kategori_id' => $category->id,
            'kode_produk' => 'PRD-001',
            'name'        => 'Nugget Ayam Premium',
            'price'       => 35000,
            'stock'       => 50,
            'status'      => 'active',
        ]);

        $this->withToken($token)->postJson('/api/cart', [
            'product_id' => $product->id,
            'quantity'   => 2,
        ])->assertStatus(201);

        // 4. Checkout langsung dengan delivery_method = antar_alamat menggunakan alamat utama yang sudah ada
        $checkoutRes = $this->withToken($token)->postJson('/api/checkout', [
            'delivery_method'  => 'antar_alamat',
            'payment_method'   => 'cod',
            'shipping_address' => $primary['alamat_lengkap'],
            'latitude'         => $primary['latitude'],
            'longitude'        => $primary['longitude'],
        ]);

        $checkoutRes->assertStatus(201);
        $checkoutRes->assertJsonPath('success', true);
        $this->assertNotNull($checkoutRes->json('data.order_id'));

        $order = \App\Models\Pesanan::find($checkoutRes->json('data.order_id'));
        $this->assertNotNull($order);
        $this->assertEquals('antar_alamat', $order->delivery_method);
        $this->assertEquals('Jl. Kiemas, RT.04/RW.10, Tanjung Enim', $order->shipping_address);
    }
}
