<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\AlamatPengguna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users (idempotent – aman dijalankan berulang)
        $admin = User::firstOrCreate(
            ['email' => 'admin@della.test'],
            [
                'nama'       => 'Administrator',
                'kata_sandi' => Hash::make('1234'),
                'peran'      => 'admin',
                'telepon'    => '082182826108',
                'alamat'     => 'Tanjung Enim',
            ]
        );

        User::firstOrCreate(
            ['email' => 'owner@della.test'],
            [
                'nama'       => 'Owner Toko',
                'kata_sandi' => Hash::make('1234'),
                'peran'      => 'owner',
                'telepon'    => '082182826108',
                'alamat'     => 'Tanjung Enim',
            ]
        );

        // Akun pemilik toko (sebagai pelanggan di aplikasi)
        User::firstOrCreate(
            ['email' => 'afnyistiqomah18@gmail.com'],
            [
                'nama'       => 'Afny Istiqomah',
                'kata_sandi' => Hash::make('1234'),
                'peran'      => 'pelanggan',
                'telepon'    => '',
                'alamat'     => 'Tanjung Enim',
            ]
        );

        $budi = User::firstOrCreate(
            ['email' => 'pelanggan@della.test'],
            [
                'nama'       => 'Pelanggan Budi',
                'kata_sandi' => Hash::make('1234'),
                'peran'      => 'pelanggan',
                'telepon'    => '081234567890',
                'alamat'     => 'Jl. Pandawa, Tanjung Enim',
            ]
        );

        // Alamat pelanggan (hanya jika baru dibuat)
        if ($budi->wasRecentlyCreated) {
            AlamatPengguna::create([
                'pengguna_id'      => $budi->id,
                'label'            => 'Rumah',
                'nama_penerima'    => 'Pelanggan Budi',
                'telepon_penerima' => '081234567890',
                'alamat_lengkap'   => 'Jl. Pandawa, Tanjung Enim',
                'is_utama'         => true,
            ]);
        }

        // 2. Seed Toko Utama Della Frozen Mart (Tanjung Enim)
        \App\Models\CabangToko::where('nama', '!=', 'Della Frozen Mart (Pusat)')->delete();
        \App\Models\CabangToko::updateOrCreate(
            ['id' => 1],
            [
                'nama'      => 'Della Frozen Mart (Pusat)',
                'alamat'    => 'Jl. Kiemas, RT.04/RW.10, Tj. Enim, Kec. Lawang Kidul, Kabupaten Muara Enim, Sumatera Selatan 31711',
                'latitude'  => -3.763872,
                'longitude' => 103.8079257,
                'telepon'   => '082182826108',
            ]
        );

        // 3. Seed Kurir Toko (Budi & Doni)
        User::updateOrCreate(
            ['email' => 'kurir.budi@dellafrozenmart.com'],
            [
                'nama' => 'Budi Santoso (Kurir Toko)',
                'kata_sandi' => bcrypt('password123'),
                'telepon' => '081536342741',
                'peran' => 'kurir',
                'plat_kendaraan' => 'BG 4821 EY',
                'jenis_kendaraan' => 'Honda Vario 125 Red',
                'latitude' => -3.765000,
                'longitude' => 103.806000,
            ]
        );

        User::updateOrCreate(
            ['email' => 'kurir.doni@dellafrozenmart.com'],
            [
                'nama' => 'Doni Pratama (Kurir Toko)',
                'kata_sandi' => bcrypt('password123'),
                'telepon' => '085277889900',
                'peran' => 'kurir',
                'plat_kendaraan' => 'BG 3192 KZ',
                'jenis_kendaraan' => 'Yamaha NMAX Black',
                'latitude' => -3.764500,
                'longitude' => 103.805500,
            ]
        );

        // 4. Seed Kategori, 63 Produk Lengkap & Data Penjualan Jan–Apr 2026
        $this->call(ProdukDanPenjualanSeeder::class);
        $this->call(Import150ProdukSeeder::class);
    }
}
